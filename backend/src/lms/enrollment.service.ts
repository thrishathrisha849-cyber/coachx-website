import { HttpStatus, ERROR_CODES } from '@coachx/shared';
import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { beginIdempotentOperation } from '../database/idempotency.service';
import { recordLearningEvent } from './learning-event.service';
import { parsePaginationParams, buildPaginationMeta } from '../database/pagination';
import type { PaginationMeta } from '@coachx/shared';
import { findCourseById } from './course.repository';
import { evaluateEntitlement } from './entitlement.service';
import { assertValidEnrollmentTransition } from './enrollment.policy';
import { scopedIdempotencyKey } from './lms-idempotency.util';
import {
  findEnrollmentById,
  findOpenEnrollment,
  findEnrollmentsForUser,
  findEnrollmentsAdmin,
  findEnrollmentsForCourse,
  countSeatOccupyingEnrollments,
  createEnrollment,
  updateEnrollment,
  type AdminEnrollmentFilter,
} from './enrollment.repository';
import { toAdminEnrollment } from './enrollment.serializers';
import type { AdminEnrollment, MyEnrollment } from './enrollment.types';

// Course statuses that never accept a NEW enrollment, regardless of who is
// creating it (004 FR-015: Archived/Retired both exclude new enrollment;
// Enrollment_paused is explicitly "not accepting new enrollment" by name).
const NO_NEW_ENROLLMENT_STATUSES = new Set(['ARCHIVED', 'RETIRED', 'ENROLLMENT_PAUSED']);
// Additionally, a learner SELF-enrolling may only do so into a course that
// is actually publicly reachable (published/scheduled-window-open/unlisted
// direct-link) — an admin MAY grant access to a not-yet-published course
// (e.g. instructor/QA preview access) as a deliberately more permissive
// admin-only capability.
const SELF_ENROLL_ALLOWED_STATUSES = new Set(['PUBLISHED', 'SCHEDULED', 'UNLISTED']);

interface CreateEnrollmentOptions {
  accessStartAt?: Date;
  accessEndAt?: Date;
  entitlementReference?: string;
  reason?: string;
}

async function createEnrollmentInternal(
  courseId: string,
  userId: string,
  source: string,
  actorId: string,
  isAdminActor: boolean,
  options: CreateEnrollmentOptions = {},
): Promise<AdminEnrollment> {
  return withTransaction(async (tx) => {
    const course = await findCourseById(courseId, tx);
    if (!course) throw AppError.notFound('Course not found');

    if (NO_NEW_ENROLLMENT_STATUSES.has(course.status)) {
      throw AppError.badRequest(`Course is not accepting new enrollment (status: ${course.status})`, { code: 'COURSE_UNAVAILABLE' });
    }
    if (!isAdminActor && !SELF_ENROLL_ALLOWED_STATUSES.has(course.status)) {
      throw AppError.notFound('Course not found');
    }

    // Idempotent-in-effect: re-requesting enrollment while an open
    // (PENDING/ACTIVE/SUSPENDED) enrollment already exists returns that
    // SAME row rather than erroring or creating a duplicate — the
    // practical idempotency guarantee Part 2B asks for, backstopped at the
    // database layer by the partial unique index
    // (`enrollments_one_active_per_user_course`) for the concurrent-
    // request race case (caught below).
    const existingOpen = await findOpenEnrollment(userId, courseId, tx);
    if (existingOpen) return toAdminEnrollment(existingOpen);

    // FR-028 capacity control. `Course.enrollmentLimit` already existed
    // from Part 1 but was never read by any Part 2 code path — CORRECTED
    // here: a course with a configured limit rejects a new enrollment once
    // that many seats are occupied (see `countSeatOccupyingEnrollments`'s
    // doc comment for exactly which statuses count as a seat). A full
    // Waitlist entity (join date/priority/notification/time-limited offer,
    // FR-029) is a genuinely separate, larger feature and remains DEFERRED
    // — see docs/lms/DECISION_GATES.md and TRACEABILITY_PART2.md — but the
    // capacity REJECTION itself is simple, spec-grounded, and was not
    // reasonable to leave unimplemented once `enrollmentLimit` already
    // existed as a field with nothing reading it.
    if (course.enrollmentLimit !== null) {
      const occupied = await countSeatOccupyingEnrollments(courseId, tx);
      if (occupied >= course.enrollmentLimit) {
        throw AppError.conflict('This course has reached its enrollment capacity', { code: 'COURSE_FULL' });
      }
    }

    const decision = evaluateEntitlement(source, course);
    if (decision.status !== 'ALLOWED') {
      // Fail-closed (Part 2B/2C: "no fake paid entitlement approval" /
      // "an integration outage must not grant access by default").
      throw new AppError(decision.reason, HttpStatus.FORBIDDEN, ERROR_CODES.FORBIDDEN, { entitlementStatus: decision.status });
    }

    const now = new Date();
    const enrollment = await createEnrollment(
      {
        user: { connect: { id: userId } },
        course: { connect: { id: courseId } },
        source: source as never,
        status: 'ACTIVE',
        entitlementReference: options.entitlementReference ?? null,
        enrolledAt: now,
        activatedAt: now,
        accessStartAt: options.accessStartAt,
        accessEndAt: options.accessEndAt,
        createdBy: actorId,
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      // A concurrent request racing this same (user, course) pair would
      // hit the partial unique index — normalize to the SAME "already
      // enrolled" outcome rather than a raw 500.
      const normalized = normalizeDatabaseError(error);
      if (normalized.statusCode === 409) {
        throw AppError.conflict('An enrollment for this user and course already exists');
      }
      throw normalized;
    });

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.enrollment.created',
        resourceType: 'enrollment',
        resourceId: enrollment.id,
        afterState: { courseId, userId, source, status: 'ACTIVE' },
        reason: options.reason ?? null,
      },
      tx,
    );

    await recordLearningEvent(
      { eventType: 'COURSE_ENROLLED', userId, courseId, enrollmentId: enrollment.id, metadata: { source } },
      tx,
    );

    return toAdminEnrollment(enrollment);
  });
}

/**
 * Learner self-enrollment (004 US1). Source is ALWAYS resolved to `FREE`
 * server-side — a learner request body can only ever supply `courseId`
 * (see `enrollment.validation.ts`'s `selfEnrollSchema`), closing the
 * "learner requests their own privileged entitlement source" escalation
 * path.
 *
 * CORRECTION (Part 2 correction pass): now routed through the shared
 * `IdempotencyKey` infrastructure (`beginIdempotentOperation`) — a rapid
 * double-click on "Enroll" with the same (actor-scoped) key returns the
 * SAME cached result rather than racing a second creation attempt. See
 * `docs/lms/ENROLLMENT_LIFECYCLE.md`'s "Idempotency" section.
 */
export async function selfEnroll(courseId: string, userId: string, idempotencyKey?: string): Promise<MyEnrollment> {
  const key = scopedIdempotencyKey(userId, idempotencyKey, courseId);
  const outcome = await beginIdempotentOperation<MyEnrollment>('lms.enrollment.self_enroll', key, { courseId });

  if (outcome.status === 'replayed') {
    if (!outcome.response) throw AppError.internal('Idempotent enrollment has no cached response');
    return outcome.response;
  }
  if (outcome.status === 'in-progress') {
    throw AppError.conflict('An enrollment request for this course is already in progress');
  }

  try {
    const result = toMyEnrollmentShape(await createEnrollmentInternal(courseId, userId, 'FREE', userId, false));
    await outcome.complete(result);
    return result;
  } catch (error) {
    // Failed transaction MUST NOT leave a COMPLETED idempotency record —
    // `fail()` marks the row FAILED (re-claimable on retry), never
    // COMPLETED, so a caller who retries after a genuine failure is not
    // permanently stuck replaying an error.
    await outcome.fail();
    throw error;
  }
}

/**
 * Admin-initiated enrollment grant (FR-112 "grant access").
 * `course.manageInstructors`-tier permission required at the route layer.
 *
 * CORRECTION (Part 2 correction pass): the ONE endpoint the correction
 * brief names explicitly ("administrative enrollment assignment") — now
 * wrapped in `beginIdempotentOperation`. Same actor + same
 * `Idempotency-Key` + same payload replays the original result; same key
 * + a DIFFERENT payload is rejected with the project-standard 409
 * conflict (enforced by `beginIdempotentOperation` itself via its
 * `requestHash` mismatch check — see idempotency.service.ts); a
 * concurrent duplicate request (same key, still PENDING) is rejected with
 * 409 rather than racing a second `Enrollment` row into existence.
 */
export async function adminGrantEnrollment(
  input: { userId: string; courseId: string; source: string; accessStartAt?: Date; accessEndAt?: Date; reason?: string },
  actorId: string,
  idempotencyKey?: string,
): Promise<AdminEnrollment> {
  const key = scopedIdempotencyKey(actorId, idempotencyKey, `${input.userId}:${input.courseId}`);
  const payload = { userId: input.userId, courseId: input.courseId, source: input.source, accessStartAt: input.accessStartAt, accessEndAt: input.accessEndAt };
  const outcome = await beginIdempotentOperation<AdminEnrollment>('lms.enrollment.admin_grant', key, payload);

  if (outcome.status === 'replayed') {
    if (!outcome.response) throw AppError.internal('Idempotent enrollment grant has no cached response');
    return outcome.response;
  }
  if (outcome.status === 'in-progress') {
    throw AppError.conflict('An enrollment grant for this user and course is already in progress');
  }

  try {
    const result = await createEnrollmentInternal(input.courseId, input.userId, input.source, actorId, true, {
      accessStartAt: input.accessStartAt,
      accessEndAt: input.accessEndAt,
      entitlementReference: actorId,
      reason: input.reason,
    });
    await outcome.complete(result);
    return result;
  } catch (error) {
    await outcome.fail();
    throw error;
  }
}

function toMyEnrollmentShape(e: AdminEnrollment): MyEnrollment {
  // Explicit allow-list (never a destructure-and-omit) — the same
  // "never accidentally leak an admin-only field to a learner" discipline
  // every other serializer in this module follows.
  return {
    id: e.id,
    courseId: e.courseId,
    courseTitle: e.courseTitle,
    courseSlug: e.courseSlug,
    source: e.source,
    status: e.status,
    enrolledAt: e.enrolledAt,
    activatedAt: e.activatedAt,
    accessStartAt: e.accessStartAt,
    accessEndAt: e.accessEndAt,
    completedAt: e.completedAt,
    lastAccessedAt: e.lastAccessedAt,
  };
}

async function transitionEnrollment(
  id: string,
  newStatus: string,
  actorId: string,
  reason: string | undefined,
  extraFields: Record<string, unknown> = {},
): Promise<AdminEnrollment> {
  return withTransaction(async (tx) => {
    const existing = await findEnrollmentById(id, tx);
    if (!existing) throw AppError.notFound('Enrollment not found');

    assertValidEnrollmentTransition(existing.status, newStatus);

    const now = new Date();
    const statusTimestampField: Record<string, string> = {
      SUSPENDED: 'suspendedAt',
      CANCELLED: 'cancelledAt',
      REVOKED: 'revokedAt',
      EXPIRED: 'expiredAt',
      COMPLETED: 'completedAt',
    };
    const timestampField = statusTimestampField[newStatus];

    const updated = await updateEnrollment(
      id,
      {
        status: newStatus as never,
        ...(timestampField ? { [timestampField]: now } : {}),
        ...(newStatus === 'ACTIVE' ? { activatedAt: existing.activatedAt ?? now } : {}),
        ...extraFields,
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.enrollment.status_changed',
        resourceType: 'enrollment',
        resourceId: id,
        beforeState: { status: existing.status },
        afterState: { status: newStatus },
        reason: reason ?? null,
      },
      tx,
    );

    return toAdminEnrollment(updated);
  });
}

export const suspendEnrollment = (id: string, actorId: string, reason: string) => transitionEnrollment(id, 'SUSPENDED', actorId, reason);
export const reactivateEnrollment = (id: string, actorId: string, reason?: string) => transitionEnrollment(id, 'ACTIVE', actorId, reason);
export const revokeEnrollment = (id: string, actorId: string, reason: string) => transitionEnrollment(id, 'REVOKED', actorId, reason);

export async function extendEnrollmentAccess(id: string, actorId: string, accessEndAt: Date | null): Promise<AdminEnrollment> {
  return withTransaction(async (tx) => {
    const existing = await findEnrollmentById(id, tx);
    if (!existing) throw AppError.notFound('Enrollment not found');

    const updated = await updateEnrollment(id, { accessEndAt, updatedBy: actorId }, tx).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.enrollment.access_extended',
        resourceType: 'enrollment',
        resourceId: id,
        beforeState: { accessEndAt: existing.accessEndAt },
        afterState: { accessEndAt },
      },
      tx,
    );

    return toAdminEnrollment(updated);
  });
}

// --- Reads ------------------------------------------------------------------

export async function listMyEnrollments(userId: string): Promise<MyEnrollment[]> {
  const rows = await findEnrollmentsForUser(userId);
  return rows.map((r) => toMyEnrollmentShape(toAdminEnrollment(r)));
}

/** IDOR guard for every `/me/*` route that takes an enrollment/course id — never trust a client-supplied userId. */
export async function assertEnrollmentBelongsToUser(enrollmentId: string, userId: string) {
  const enrollment = await findEnrollmentById(enrollmentId);
  if (!enrollment || enrollment.userId !== userId) throw AppError.notFound('Enrollment not found');
  return enrollment;
}

export async function listEnrollmentsAdmin(
  filter: AdminEnrollmentFilter,
  pagination: { page?: string; pageSize?: string },
): Promise<{ data: AdminEnrollment[]; meta: PaginationMeta }> {
  const { page, pageSize, skip, take } = parsePaginationParams(pagination);
  const [rows, total] = await findEnrollmentsAdmin(filter, { skip, take });
  return { data: rows.map(toAdminEnrollment), meta: buildPaginationMeta(page, pageSize, total) };
}

export async function listEnrollmentsForCourseInstructor(
  courseId: string,
  pagination: { page?: string; pageSize?: string },
): Promise<{ data: AdminEnrollment[]; meta: PaginationMeta }> {
  const { page, pageSize, skip, take } = parsePaginationParams(pagination);
  const [rows, total] = await findEnrollmentsForCourse(courseId, { skip, take });
  return { data: rows.map(toAdminEnrollment), meta: buildPaginationMeta(page, pageSize, total) };
}

export async function getEnrollmentAdmin(id: string): Promise<AdminEnrollment> {
  const row = await findEnrollmentById(id);
  if (!row) throw AppError.notFound('Enrollment not found');
  return toAdminEnrollment(row);
}
