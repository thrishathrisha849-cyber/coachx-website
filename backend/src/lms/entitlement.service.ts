import type { EntitlementDecision } from './access.types';

/**
 * Phase 6 Part 2B — the centralized entitlement-validation boundary.
 *
 * 004 spec.md Assumptions: "Entitlement source types... are granted and
 * financially reconciled by Volume 09 (Membership, Payments & Revenue);
 * this spec assumes Volume 09 is the system of record for payment/
 * membership state and only consumes its entitlement signal." Feature 009
 * (009-membership-payments-revenue) does not exist in this codebase yet —
 * no Order/Payment/Invoice/Subscription model, no membership-plan model.
 *
 * This function is therefore the SINGLE place that decision is made, and
 * it is deliberately, permanently FAIL-CLOSED for every entitlement source
 * this LMS cannot itself authorize: MEMBERSHIP, PURCHASE, PROGRAM,
 * ORGANIZATION, COUPON, SCHOLARSHIP, TRIAL, and INVITE all return
 * `UNAVAILABLE` — never a fabricated `ALLOWED`. When Feature 009 (and a
 * future Feature 003/007-owned organization/invite system) is built, this
 * function is the ONE place that needs to change to actually call out to
 * it; no other file in this module encodes payment/membership assumptions.
 *
 * FREE and ADMIN_GRANT are the only two sources this LMS can honestly
 * authorize on its own:
 *  - FREE: the course's own `priceType === 'FREE'` IS the entitlement — a
 *    learner enrolling in a free course needs no external system to
 *    approve it.
 *  - ADMIN_GRANT: the granting administrator's own RBAC-checked authority
 *    (`course.manageInstructors`-adjacent — see enrollment.service.ts's
 *    permission gate) IS the entitlement decision. This is not "faking"
 *    payment approval — it's a distinct, always-been-real access source
 *    (FR-021 lists "admin grant" as its own entitlement type, not a proxy
 *    for payment).
 */
export function evaluateEntitlement(
  source: string,
  course: { priceType: string },
): EntitlementDecision {
  const evaluatedAt = new Date();

  if (source === 'FREE') {
    if (course.priceType !== 'FREE') {
      return { status: 'DENIED', source, reason: 'Course is not FREE-priced; FREE enrollment source does not apply', evaluatedAt };
    }
    return { status: 'ALLOWED', source, reason: 'Free course — no external entitlement required', evaluatedAt };
  }

  if (source === 'ADMIN_GRANT') {
    return { status: 'ALLOWED', source, reason: 'Administrator-granted access', evaluatedAt };
  }

  // MEMBERSHIP, PURCHASE, PROGRAM, ORGANIZATION, COUPON, SCHOLARSHIP,
  // TRIAL, INVITE — every one of these requires an owning system
  // (Feature 009 for payment/membership/coupon/scholarship/trial, a future
  // Program/Organization feature for the rest) that does not exist in this
  // codebase. Fail-closed, not fake-allowed. An integration outage or a
  // not-yet-built dependency must never silently grant access.
  return {
    status: 'UNAVAILABLE',
    source,
    reason: `Entitlement source "${source}" requires an integration (Feature 009 or a future Program/Organization feature) that is not implemented in this phase`,
    evaluatedAt,
  };
}
