/**
 * Phase 6 Part 2B — the shared access-decision vocabulary every evaluator
 * in this module (entitlement, course access, lesson access) returns.
 * Centralizing these types is what makes "one reusable pipeline" (Part 2C's
 * explicit requirement) possible — every endpoint that needs to know
 * "can this user see this content" imports these same types and the same
 * `access-evaluator.service.ts` functions, never a bespoke per-endpoint
 * check.
 */

/**
 * Stable, machine-readable denial-reason taxonomy (Part 2B's explicit
 * required list). Client UIs branch on this CODE, never on the free-text
 * `message` (which may change wording without notice).
 */
export type AccessDenialReason =
  | 'AUTHENTICATION_REQUIRED'
  | 'ENROLLMENT_REQUIRED'
  | 'ENTITLEMENT_REQUIRED'
  | 'ENTITLEMENT_PENDING'
  | 'ACCESS_NOT_STARTED'
  | 'ACCESS_EXPIRED'
  | 'ENROLLMENT_SUSPENDED'
  | 'ENROLLMENT_CANCELLED'
  | 'ENROLLMENT_REVOKED'
  | 'COURSE_UNAVAILABLE'
  | 'COURSE_ARCHIVED'
  | 'COURSE_RETIRED'
  | 'MODULE_LOCKED'
  | 'PREREQUISITE_NOT_MET'
  | 'LESSON_NOT_RELEASED'
  | 'PERMISSION_DENIED';

export interface AccessAllowed {
  allowed: true;
  /** Present when access is granted via a lesson/course's own `isPreview` flag rather than a real enrollment — callers must not treat this as "enrolled." */
  viaPreview?: boolean;
}

export interface AccessDenied {
  allowed: false;
  reason: AccessDenialReason;
  message: string;
  /** Structured, denial-reason-specific detail (e.g. { unlockAt } for LESSON_NOT_RELEASED, { prerequisiteModuleId } for PREREQUISITE_NOT_MET) — FR-035's "unlock condition/date/countdown." */
  detail?: Record<string, unknown>;
}

export type AccessDecision = AccessAllowed | AccessDenied;

export function denied(reason: AccessDenialReason, message: string, detail?: Record<string, unknown>): AccessDenied {
  return { allowed: false, reason, message, detail };
}

export const ALLOWED: AccessAllowed = { allowed: true };

/**
 * The typed entitlement decision Part 2B asks for by name
 * ("allowed/denied/pending/expired/revoked/unavailable"). Distinct from
 * `AccessDecision` above: `EntitlementDecision` is entitlement.service.ts's
 * narrower answer to "does this enrollment source grant access AT ALL,"
 * consumed as ONE input into the broader course-access evaluation
 * (which also checks enrollment status, access window, module locks, etc).
 */
export type EntitlementStatus = 'ALLOWED' | 'DENIED' | 'PENDING' | 'EXPIRED' | 'REVOKED' | 'UNAVAILABLE';

export interface EntitlementDecision {
  status: EntitlementStatus;
  source: string;
  /** Human/audit-readable explanation — never surfaced verbatim to an anonymous caller. */
  reason: string;
  evaluatedAt: Date;
}
