import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import { findEnrollmentById, updateEnrollment } from './enrollment.repository';
import { overrideReset } from './completion.service';
import type { TransactionClient } from '../database/transaction';
import type { Course, CourseVersion } from '@prisma/client';

function db(tx?: TransactionClient) {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

/**
 * 004 Course Versioning Policy batch — the admin-supplied FR-099 fields
 * for THIS version, captured at the same moment the snapshot fires.
 * Optional so `snapshotCourseIfPublished`'s existing callers (course
 * updates that don't pass this) keep working unchanged — the version
 * still gets recorded with its default policy (CONTINUE_CURRENT_VERSION),
 * matching this batch's stated default for the previously-unstated case.
 */
export interface CourseVersionPolicyInput {
  changeSummary?: string | null;
  effectiveDate?: Date | null;
  existingLearnerPolicy?: 'CONTINUE_CURRENT_VERSION' | 'OPTIONAL_MIGRATION' | 'MANDATORY_MIGRATION';
}

/**
 * 001 FR-099, Constitution Article IV — closes the gap the schema's own
 * `Course.version` counter comment flagged ("not yet enforced... no
 * concurrent-edit UI exists yet"): whenever a course that is already
 * PUBLISHED is edited, a full non-destructive snapshot is taken FIRST,
 * mirroring `createPageVersion`'s exact pattern (append-only, never
 * overwritten). A course that has never been published has nothing to
 * preserve yet — only PUBLISHED-then-edited content triggers a snapshot.
 *
 * UNCHANGED by the Course Versioning Policy batch — `policy` is purely
 * additive, attached to the same row this function already creates.
 */
export async function snapshotCourseIfPublished(
  course: Course,
  actorId: string,
  tx?: TransactionClient,
  policy?: CourseVersionPolicyInput,
): Promise<void> {
  if (course.status !== 'PUBLISHED') return;

  const versionCount = await db(tx).courseVersion.count({ where: { courseId: course.id } });

  await db(tx).courseVersion.create({
    data: {
      courseId: course.id,
      versionNumber: versionCount + 1,
      snapshot: course as never,
      createdBy: actorId,
      changeSummary: policy?.changeSummary ?? null,
      effectiveDate: policy?.effectiveDate ?? null,
      existingLearnerPolicy: (policy?.existingLearnerPolicy ?? 'CONTINUE_CURRENT_VERSION') as never,
    },
  });
}

export function listCourseVersions(courseId: string, tx?: TransactionClient) {
  return db(tx).courseVersion.findMany({ where: { courseId }, orderBy: { versionNumber: 'desc' } });
}

export interface AdminCourseVersion {
  id: string;
  courseId: string;
  versionNumber: number;
  /** The full raw Course-row JSON snapshot — pre-existing field, unchanged by this batch (a pre-existing test asserts on `snapshot.title`). */
  snapshot: unknown;
  changeSummary: string | null;
  effectiveDate: Date | null;
  existingLearnerPolicy: 'CONTINUE_CURRENT_VERSION' | 'OPTIONAL_MIGRATION' | 'MANDATORY_MIGRATION';
  createdBy: string | null;
  createdAt: Date;
}

function toAdminCourseVersion(row: CourseVersion): AdminCourseVersion {
  return {
    id: row.id,
    courseId: row.courseId,
    versionNumber: row.versionNumber,
    snapshot: row.snapshot,
    changeSummary: row.changeSummary,
    effectiveDate: row.effectiveDate,
    existingLearnerPolicy: row.existingLearnerPolicy as AdminCourseVersion['existingLearnerPolicy'],
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}

/** GET /admin/courses/:id/versions — the admin Version History UI's data source. Same rows `listCourseVersions` already returned (including the full `snapshot` a pre-existing test depends on), now additionally exposing this batch's changeSummary/effectiveDate/existingLearnerPolicy fields through an explicit, typed shape instead of a raw Prisma row. */
export async function listCourseVersionsAdmin(courseId: string): Promise<AdminCourseVersion[]> {
  const rows = await listCourseVersions(courseId);
  return rows.map(toAdminCourseVersion);
}

/** The highest-numbered MANDATORY_MIGRATION version whose effectiveDate has passed (null effectiveDate = due immediately). */
async function findDueMandatoryMigration(courseId: string, tx?: TransactionClient): Promise<CourseVersion | null> {
  const now = new Date();
  const candidates = await db(tx).courseVersion.findMany({
    where: { courseId, existingLearnerPolicy: 'MANDATORY_MIGRATION' },
    orderBy: { versionNumber: 'desc' },
  });
  return candidates.find((v) => !v.effectiveDate || v.effectiveDate <= now) ?? null;
}

/**
 * FR-099 "existing-learner policy... mandatory migration" — the real,
 * automatic enforcement half. Applied at a genuine read-time action point
 * (called from `progress.service.ts`'s `getCourseProgressForLearner`)
 * rather than a scheduled background job — no job scheduler exists in
 * this codebase (the same convention FR-101's translation-outdated flag
 * already established). Idempotent via `Enrollment.migratedToVersionNumber`
 * — an enrollment already migrated to the due version is never re-reset.
 *
 * Reuses `completion.service.ts`'s existing, already-tested `overrideReset`
 * (COURSE scope) verbatim rather than re-implementing progress-clearing —
 * the one deliberate design choice this batch makes about WHOSE id the
 * reset is attributed to: the learner's own `userId`, since this fires as
 * a direct consequence of THEIR OWN read call (the real action point),
 * not a genuinely separate admin action. The `reason` string on the
 * resulting `CompletionOverride`/audit row makes the true cause — an
 * automatic mandatory version migration — explicit either way.
 *
 * The idempotency key passed to `overrideReset` is scoped to the TARGET
 * VERSION NUMBER, not just (enrollment, scope, target) — `overrideReset`'s
 * own no-explicit-key fallback is deterministic per (actorId, enrollmentId,
 * scope, targetId) and never expires, so two GENUINELY DIFFERENT resets on
 * the same enrollment/course (e.g. an earlier OPTIONAL_MIGRATION to v2,
 * then a later MANDATORY_MIGRATION to v3) would otherwise collide on the
 * identical key and the second one would silently replay the first's
 * cached no-op result instead of actually running — caught by this
 * batch's own live verification against `coachx_dev`, not by the
 * integration suite (whose scenarios each only reset once).
 */
export async function applyMandatoryMigrationIfDue(
  userId: string,
  enrollmentId: string,
  courseId: string,
): Promise<{ migrated: boolean; toVersionNumber?: number }> {
  const due = await findDueMandatoryMigration(courseId);
  if (!due) return { migrated: false };

  const enrollment = await findEnrollmentById(enrollmentId);
  if (!enrollment) return { migrated: false };
  if (enrollment.migratedToVersionNumber !== null && enrollment.migratedToVersionNumber >= due.versionNumber) {
    return { migrated: false };
  }

  await overrideReset(
    enrollmentId,
    'COURSE',
    courseId,
    `Automatic mandatory migration to course version ${due.versionNumber}`,
    userId,
    `mandatory-migration-v${due.versionNumber}`,
  );
  await updateEnrollment(enrollmentId, { migratedToVersionNumber: due.versionNumber });

  return { migrated: true, toVersionNumber: due.versionNumber };
}

export interface VersionMigrationStatus {
  latestVersionNumber: number | null;
  changeSummary: string | null;
  effectiveDate: Date | null;
  existingLearnerPolicy: 'CONTINUE_CURRENT_VERSION' | 'OPTIONAL_MIGRATION' | 'MANDATORY_MIGRATION' | null;
  migratedToVersionNumber: number | null;
  migrationAvailable: boolean;
}

/** Read-only status for the learner's own enrollment — powers the "a new version is available" UI affordance. */
export async function getVersionMigrationStatusForLearner(userId: string, enrollmentId: string): Promise<VersionMigrationStatus> {
  const enrollment = await findEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.userId !== userId) throw AppError.notFound('Enrollment not found');

  const versions = await listCourseVersions(enrollment.courseId);
  const latest = versions[0] ?? null;
  const migrationAvailable =
    !!latest &&
    latest.existingLearnerPolicy !== 'CONTINUE_CURRENT_VERSION' &&
    (enrollment.migratedToVersionNumber === null || enrollment.migratedToVersionNumber < latest.versionNumber);

  return {
    latestVersionNumber: latest?.versionNumber ?? null,
    changeSummary: latest?.changeSummary ?? null,
    effectiveDate: latest?.effectiveDate ?? null,
    existingLearnerPolicy: (latest?.existingLearnerPolicy as VersionMigrationStatus['existingLearnerPolicy']) ?? null,
    migratedToVersionNumber: enrollment.migratedToVersionNumber,
    migrationAvailable,
  };
}

/**
 * FR-099 "optional migration" — the learner's own voluntary self-service
 * action. Only offered when the latest version's policy actually permits
 * it (OPTIONAL_MIGRATION or MANDATORY_MIGRATION — migrating early under a
 * mandatory policy is always fine) — CONTINUE_CURRENT_VERSION offers no
 * migration action at all, making the policy field genuinely gate real
 * behavior rather than being inert metadata. Reuses `overrideReset`
 * exactly like the automatic path above, attributed to the learner's own
 * `userId` (a genuinely learner-initiated action this time).
 */
export async function migrateMyProgressToLatestVersion(userId: string, enrollmentId: string): Promise<{ toVersionNumber: number }> {
  const enrollment = await findEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.userId !== userId) throw AppError.notFound('Enrollment not found');

  const versions = await listCourseVersions(enrollment.courseId);
  const latest = versions[0];
  if (!latest) throw AppError.badRequest('This course has no version history to migrate to');
  if (latest.existingLearnerPolicy === 'CONTINUE_CURRENT_VERSION') {
    throw AppError.badRequest('This course version does not offer a migration option');
  }
  if (enrollment.migratedToVersionNumber !== null && enrollment.migratedToVersionNumber >= latest.versionNumber) {
    throw AppError.conflict('You are already on the latest version');
  }

  // Idempotency key scoped to the target version number — see
  // `applyMandatoryMigrationIfDue`'s own doc comment for why a bare
  // (actor, enrollment, scope, target) key would collide across two
  // genuinely different migrations on the same enrollment.
  await overrideReset(
    enrollmentId,
    'COURSE',
    enrollment.courseId,
    `Learner-initiated migration to course version ${latest.versionNumber}`,
    userId,
    `optional-migration-v${latest.versionNumber}`,
  );
  await updateEnrollment(enrollmentId, { migratedToVersionNumber: latest.versionNumber });

  return { toVersionNumber: latest.versionNumber };
}
