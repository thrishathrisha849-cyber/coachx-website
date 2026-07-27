import { AppError } from '../utils/app-error';

/**
 * Phase 6 Part 2B — centralized Enrollment status state machine (the SAME
 * "one place status transitions are decided" discipline as Part 1's
 * `course-lifecycle.policy.ts`). Every service function that changes an
 * Enrollment's status MUST go through `assertValidEnrollmentTransition` —
 * never set `.status` directly.
 *
 * CANCELLED/REVOKED are true terminal states for a given Enrollment ROW —
 * a learner who wants access again after either gets a NEW Enrollment row
 * (enforced by the partial unique index
 * `enrollments_one_active_per_user_course`, which only covers
 * PENDING/ACTIVE/SUSPENDED), not a reversal of the old one. This preserves
 * an accurate, immutable history of "this access grant was revoked on
 * <date> for <reason>" rather than silently resurrecting it.
 */
export const ENROLLMENT_VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['SUSPENDED', 'EXPIRED', 'CANCELLED', 'COMPLETED', 'REVOKED'],
  SUSPENDED: ['ACTIVE', 'CANCELLED', 'REVOKED'],
  EXPIRED: ['ACTIVE', 'CANCELLED'],
  // An admin "reset progress" action on a COMPLETED enrollment reopens it —
  // FR-113's override path, not a normal learner-driven transition.
  COMPLETED: ['ACTIVE'],
  CANCELLED: [],
  REVOKED: [],
};

export function assertValidEnrollmentTransition(from: string, to: string): void {
  const allowed = ENROLLMENT_VALID_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw AppError.badRequest(`Cannot transition enrollment from ${from} to ${to}`);
  }
}

/**
 * Read-time expiry check — the "fail-closed via timestamp checks even
 * without a scheduler" requirement (Part 2B/2C: "Access evaluation must
 * still deny expired access based on timestamps even if a background job
 * has not yet updated the stored status"). No background worker exists
 * anywhere in this codebase (same documented limitation as Part 1's
 * `isCoursePubliclyVisible`) — this function is called by the access
 * evaluator on EVERY access check, so a stale `ACTIVE` status past its
 * `accessEndAt` is still correctly denied even though the stored `status`
 * column itself hasn't been flipped to `EXPIRED` by any job.
 */
export function isEnrollmentAccessWindowOpen(enrollment: {
  accessStartAt: Date | null;
  accessEndAt: Date | null;
}): boolean {
  const now = new Date();
  if (enrollment.accessStartAt && enrollment.accessStartAt > now) return false;
  if (enrollment.accessEndAt && enrollment.accessEndAt <= now) return false;
  return true;
}
