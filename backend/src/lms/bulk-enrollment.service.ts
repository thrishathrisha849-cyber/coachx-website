import { AppError } from '../utils/app-error';
import { parseCsv } from '../utils/csv.util';
import { recordAuditEvent } from '../database/audit-event.repository';
import { findCourseById } from './course.repository';
import { findUserByEmail } from '../auth/auth.repository';
import { findOpenEnrollment } from './enrollment.repository';
import { adminGrantEnrollment } from './enrollment.service';

/**
 * 004 Bulk CSV Import batch (FR-032). Accepts CSV content as plain text in
 * the request body — no file-upload/storage pipeline exists in this
 * codebase (the same convention every other "attach a file" surface here
 * already follows — submissions/resources are link-based too), so the
 * admin's browser reads the local file (`FileReader.readAsText()`) and
 * posts its text content directly.
 *
 * FR-032 names "user/group selection" — this batch supports individual
 * users by email, one per row; GROUP selection is honestly out of scope,
 * since no Group/Cohort entity exists in this codebase (see T004/T085).
 * "Course assignment" is the single target course the whole CSV is
 * imported against (one course per import — a real, common bulk-import
 * shape, not every course at once). "Start date"/"deadline" map directly
 * onto the already-real `accessStartAt`/`accessEndAt` fields
 * `adminGrantEnrollment` already accepts.
 *
 * Every row is processed independently and reported on — a failure on one
 * row (bad email, invalid date, entitlement denial) never aborts the rest
 * of the import (FR-032's own "error report for failed rows"). Duplicate
 * handling reuses `adminGrantEnrollment`'s EXISTING idempotent-in-effect
 * behavior (`createEnrollmentInternal`'s `findOpenEnrollment` check) — a
 * row for an already-enrolled user returns that same enrollment rather
 * than erroring or duplicating, and is reported as DUPLICATE rather than
 * CREATED; this also correctly catches two rows in the SAME file for the
 * same user (the second sees the first's just-created enrollment).
 *
 * "Notification" (FR-032's own word) is honestly NOT sent — no welcome/
 * enrollment email exists anywhere in this codebase's enrollment flow
 * today (verified: neither `selfEnroll` nor the pre-existing
 * `adminGrantEnrollment` ever call the `EmailPort`), a pre-existing gap
 * this batch does not invent a one-off exception to, since a bulk import
 * sending email while single admin grants don't would be an inconsistent,
 * arbitrary distinction.
 */

export interface BulkImportRowResult {
  row: number;
  email: string;
  status: 'CREATED' | 'DUPLICATE' | 'ERROR';
  message?: string;
  enrollmentId?: string;
}

export interface BulkImportResult {
  totalRows: number;
  created: number;
  duplicates: number;
  failed: number;
  rows: BulkImportRowResult[];
}

const MAX_ROWS = 1000;

function parseDateOrThrow(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw AppError.badRequest(`Invalid date format: "${value}"`);
  }
  return date;
}

export async function bulkImportEnrollments(courseId: string, csvContent: string, actorId: string): Promise<BulkImportResult> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');

  const table = parseCsv(csvContent);
  if (table.length === 0) throw AppError.badRequest('CSV content is empty');

  const header = table[0].map((h) => h.trim().toLowerCase());
  const emailIdx = header.indexOf('email');
  if (emailIdx === -1) throw AppError.badRequest('CSV header must include an "email" column');
  const accessStartIdx = header.indexOf('accessstartat');
  const accessEndIdx = header.indexOf('accessendat');
  const reasonIdx = header.indexOf('reason');

  const dataRows = table.slice(1).filter((r) => r.some((cell) => cell.trim() !== ''));
  if (dataRows.length === 0) throw AppError.badRequest('CSV contains no data rows');
  if (dataRows.length > MAX_ROWS) throw AppError.badRequest(`CSV exceeds the maximum of ${MAX_ROWS} rows per import`);

  const results: BulkImportRowResult[] = [];
  let created = 0;
  let duplicates = 0;
  let failed = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const rowNumber = i + 2; // 1-indexed data rows, +1 for the header row
    const cols = dataRows[i];
    const email = (cols[emailIdx] ?? '').trim().toLowerCase();

    if (!email) {
      results.push({ row: rowNumber, email: '', status: 'ERROR', message: 'Missing email' });
      failed += 1;
      continue;
    }

    try {
      const user = await findUserByEmail(email);
      if (!user) {
        results.push({ row: rowNumber, email, status: 'ERROR', message: 'No user found with this email' });
        failed += 1;
        continue;
      }

      // Checked and short-circuited BEFORE calling `adminGrantEnrollment` —
      // deliberately never re-invoked for an already-enrolled user. Two
      // rows for the same email in one file (or a row for a user enrolled
      // earlier in this same import) may legitimately carry DIFFERENT
      // accessStartAt/accessEndAt/reason values; calling
      // `adminGrantEnrollment` a second time for the SAME (user, course)
      // pair would reuse its internal idempotency key with a mismatched
      // payload and be rejected as a key-reuse error, not reported as the
      // DUPLICATE this really is.
      const existingOpen = await findOpenEnrollment(user.id, courseId);
      if (existingOpen) {
        results.push({ row: rowNumber, email, status: 'DUPLICATE', message: 'Already enrolled — no duplicate record created', enrollmentId: existingOpen.id });
        duplicates += 1;
        continue;
      }

      const accessStartAt = accessStartIdx >= 0 && cols[accessStartIdx]?.trim() ? parseDateOrThrow(cols[accessStartIdx].trim()) : undefined;
      const accessEndAt = accessEndIdx >= 0 && cols[accessEndIdx]?.trim() ? parseDateOrThrow(cols[accessEndIdx].trim()) : undefined;
      const reason = reasonIdx >= 0 ? cols[reasonIdx]?.trim() || undefined : undefined;

      const enrollment = await adminGrantEnrollment({ userId: user.id, courseId, source: 'ADMIN_GRANT', accessStartAt, accessEndAt, reason }, actorId);
      results.push({ row: rowNumber, email, status: 'CREATED', enrollmentId: enrollment.id });
      created += 1;
    } catch (error) {
      const message = error instanceof AppError ? error.message : 'Unexpected error processing this row';
      results.push({ row: rowNumber, email, status: 'ERROR', message });
      failed += 1;
    }
  }

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.enrollment.bulk_import',
    resourceType: 'course',
    resourceId: courseId,
    metadata: { totalRows: dataRows.length, created, duplicates, failed },
  });

  return { totalRows: dataRows.length, created, duplicates, failed, rows: results };
}
