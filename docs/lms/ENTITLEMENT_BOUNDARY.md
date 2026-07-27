# Entitlement Validation Boundary (Phase 6 Part 2B)

## The rule

`backend/src/lms/entitlement.service.ts`'s `evaluateEntitlement(source, course)` is the ONLY place in this codebase that decides whether an `EnrollmentSource` grants access. No other file — no controller, no route, no other service — makes this decision independently.

## What Part 2 can honestly authorize

004 spec.md's own Assumptions section states: *"Entitlement source types... are granted and financially reconciled by Volume 09 (Membership, Payments & Revenue); this spec assumes Volume 09 is the system of record."* Feature 009 (`009-membership-payments-revenue`) does not exist in this codebase. Per the Part 2B/2C brief, **no Order, Payment, Invoice, or Subscription model is added by this LMS module** — none was added, and `grep`-verified absent (see the "No monetization models" check in `TRACEABILITY_PART2.md`).

Only two `EnrollmentSource` values are therefore ever resolvable to `ALLOWED`:

| Source | Decision | Why it is legitimate (not a workaround) |
|---|---|---|
| `FREE` | `ALLOWED` iff `course.priceType === 'FREE'` | The course's own catalog-level price type IS the entitlement — no external system is needed to approve free access. |
| `ADMIN_GRANT` | Always `ALLOWED` | FR-021 lists "admin grant" as its own distinct access-grant source, not a proxy for payment. The granting administrator's own RBAC-checked authority (`course.manageInstructors` permission, checked at the route layer before `adminGrantEnrollment` is ever called) IS the entitlement decision for this source — this is the source's documented, real semantics, not a bypass. |

Every other value — `MEMBERSHIP`, `PURCHASE`, `PROGRAM`, `ORGANIZATION`, `COUPON`, `SCHOLARSHIP`, `TRIAL`, `INVITE` — is still modeled as a valid `EnrollmentSource` enum value (so the type system stays truthful to FR-021's full taxonomy and a future Feature 009 integration has somewhere to plug in), but `evaluateEntitlement` unconditionally returns `UNAVAILABLE` for all of them. This is fail-closed by construction: there is no code path, feature flag, or configuration option that flips one of these to `ALLOWED` in this phase.

## Fail-closed, not fail-open

- An entitlement decision that isn't `ALLOWED` never creates an `Enrollment` row (`enrollment.service.ts`'s `createEnrollmentInternal` throws `403 FORBIDDEN` before any write).
- There is no "grace period," no "assume allowed if we can't check," and no silent default-allow anywhere in this boundary.
- If a future Feature 009 integration were to become temporarily unreachable at runtime, the correct behavior (once that integration exists) is for `evaluateEntitlement` to return `UNAVAILABLE`/`DENIED` for that call — never `ALLOWED`. This file is written so that extension point is obvious: only `evaluateEntitlement`'s body needs to change.

## What this boundary is not

It is not a payment gateway integration, not a webhook handler, not a coupon-validation engine, and not a subscription-status cache. It has zero knowledge of prices beyond the course's own `priceType` field (which Part 1 already stores as catalog metadata). Building any of those is explicitly Feature 009's responsibility.
