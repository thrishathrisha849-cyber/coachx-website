import type { AccessDenialReason } from './access.types';

export type { AccessDenialReason, EntitlementStatus } from './access.types';

/**
 * 004 Error-code taxonomy batch (FR-125). The single, defined LMS error-
 * code taxonomy FR-125 asks for ("course-, lesson-, quiz-, assignment-,
 * and certificate-family error codes ... so client UIs can present
 * specific, actionable error states").
 *
 * Two pieces of this ALREADY existed before this batch, well-centralized,
 * and are re-exported here unchanged rather than duplicated:
 * `AccessDenialReason` (`access.types.ts`) is the course/module/lesson
 * access-DENIAL family (16 reasons, returned as `details.reason` on every
 * 403 from `evaluateCourseAccess`/`evaluateModuleAccess`/
 * `evaluateLessonAccess`); `EntitlementStatus` is the entitlement-decision
 * family. What this batch adds is the piece that was genuinely missing —
 * the BUSINESS-RULE-REJECTION family below (capacity/attempt-limit/
 * eligibility codes) — which were scattered as inline, undeclared string
 * literals with no single source of truth before this batch (`COURSE_FULL`
 * duplicated across `enrollment.service.ts` and `wishlist.service.ts`;
 * `QUIZ_ATTEMPT_LIMIT_REACHED`/`ASSIGNMENT_ATTEMPT_LIMIT_REACHED` each
 * defined once with no shared reference; certificate ineligibility had no
 * code at all, only a message).
 *
 * Every code below is a REAL, reachable value — verified against actual
 * throw sites by `lms-error-codes.unit.test.ts`, never aspirational. The
 * top-level HTTP `error.code` for all of these remains the existing
 * generic `ERROR_CODES.FORBIDDEN`/`VALIDATION_ERROR`/`CONFLICT` (Part 2C's
 * own established convention) — this taxonomy documents the SPECIFIC
 * reason nested in `details`, which is what a client actually branches on.
 */
export const LMS_BUSINESS_RULE_CODES = {
  /** FR-028/029 — a course with `enrollmentLimit` set has no free (or reserved-via-offer) seat left. Surfaced via `details.code`; Waitlist (FR-028/029) is the real next step for the caller. */
  COURSE_FULL: 'The course has reached its configured enrollment capacity.',
  /** FR-062-adjacent — every allowed attempt for this quiz has already been finalized (GRADED/timed-out). */
  QUIZ_ATTEMPT_LIMIT_REACHED: 'The learner has used every allowed attempt for this quiz.',
  /** Assignment analogue of `QUIZ_ATTEMPT_LIMIT_REACHED` — every allowed resubmission has already been used. */
  ASSIGNMENT_ATTEMPT_LIMIT_REACHED: 'The learner has used every allowed submission attempt for this assignment.',
  /** FR-081 — the enrollment does not yet satisfy this course's certificate eligibility conditions (see `details.conditions` for exactly which). */
  CERTIFICATE_NOT_ELIGIBLE: "The enrollment does not yet satisfy this course's certificate eligibility conditions.",
} as const;

export type LmsBusinessRuleCode = keyof typeof LMS_BUSINESS_RULE_CODES;

/** Every LMS-specific error code this codebase can surface, across every FR-125-named family — the complete taxonomy. */
export type LmsErrorCode = AccessDenialReason | LmsBusinessRuleCode;
