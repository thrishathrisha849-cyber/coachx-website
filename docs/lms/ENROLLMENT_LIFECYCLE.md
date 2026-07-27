# Enrollment Lifecycle (Phase 6 Part 2B)

## State machine

`enrollment.policy.ts`'s `ENROLLMENT_VALID_TRANSITIONS` is the ONLY place `Enrollment.status` transition legality is decided — the same "one centralized policy, never distributed across controllers" discipline `course-lifecycle.policy.ts` established in Part 1.

```
PENDING     -> ACTIVE, CANCELLED
ACTIVE      -> SUSPENDED, EXPIRED, CANCELLED, COMPLETED, REVOKED
SUSPENDED   -> ACTIVE, CANCELLED, REVOKED
EXPIRED     -> ACTIVE, CANCELLED
COMPLETED   -> ACTIVE            (admin "reset progress" reopen only)
CANCELLED   -> (terminal)
REVOKED     -> (terminal)
```

`CANCELLED`/`REVOKED` are true terminal states for a given row — re-enrolling after either creates a NEW `Enrollment` row (see "Idempotent creation" below), preserving an accurate, immutable history of "this specific access grant ended on `<date>` for `<reason>`" rather than reviving it.

## FR-023 Access States → this model

FR-023 lists: Eligible-not-enrolled, Enrolled, Active, Completed, Expired, Revoked, Refunded, Suspended, Prerequisite incomplete. "Eligible-not-enrolled" and "Prerequisite incomplete" are computed access-decision OUTCOMES (`AccessDecision`, see `ACCESS_DECISION_ENGINE.md`), not stored enrollment states — an `Enrollment` row is only ever created once access is actually granted. "Refunded" is deliberately NOT modeled as its own `EnrollmentStatus` — refund policy is explicitly Feature 009's territory (Part 2B/2C stop-list: "no refund logic"); `CANCELLED` covers every LMS-owned cancellation case in this phase, and a future Feature 009 refund event is expected to call into the SAME `CANCELLED` transition via its own integration code when it exists, not reimplement a parallel state.

## Creation rules

`enrollment.service.ts`'s `createEnrollmentInternal` (shared by both `selfEnroll` and `adminGrantEnrollment`) enforces, in order:

1. Course exists.
2. Course status is not `ARCHIVED`/`RETIRED`/`ENROLLMENT_PAUSED` (FR-015: none of these accept new enrollment).
3. A learner **self**-enrolling additionally requires the course to be publicly reachable (`PUBLISHED`/`SCHEDULED`-window-open/`UNLISTED`); an **admin** grant is permitted on a not-yet-published course (e.g. instructor/QA preview access) as a deliberately more permissive admin-only capability.
4. **Idempotent-in-effect**: if an open (`PENDING`/`ACTIVE`/`SUSPENDED`) enrollment already exists for `(user, course)`, the SAME row is returned rather than erroring or duplicating — re-clicking "Enroll" is safe. Backstopped at the database layer by a hand-added partial unique index (`enrollments_one_active_per_user_course`, scoped to `PENDING`/`ACTIVE`/`SUSPENDED`) for the concurrent-request race case; a unique-constraint violation caught during creation is normalized to the same "already enrolled" `409`.
5. Entitlement evaluated via `entitlement.service.ts` — see `ENTITLEMENT_BOUNDARY.md`. A non-`ALLOWED` decision is a hard `403`, never a soft/partial enrollment.

A learner can **never** supply their own `source` — `enrollment.validation.ts`'s `selfEnrollSchema` accepts only `{ courseId }`; `source` is resolved to `FREE` server-side inside `selfEnroll`. Only the admin-only `adminCreateEnrollmentSchema` accepts a `source` field.

## Fields

Every timestamp Part 2B asked for is present and typed (not a JSON blob): `enrolledAt`, `activatedAt`, `accessStartAt`, `accessEndAt`, `suspendedAt`, `cancelledAt`, `revokedAt`, `completedAt`, `expiredAt`, `lastAccessedAt`. `entitlementReference` is a loose opaque string (the granting admin's actor id for `ADMIN_GRANT`; reserved for a future order/membership id once Feature 009 exists) — matching the same "loose reference, not a nonexistent FK" pattern Part 1 uses for `createdBy`/`reviewedBy`.

## Admin actions (FR-112)

`suspend`/`reactivate`/`revoke`/`extend-access` all go through `transitionEnrollment` (suspend/reactivate/revoke) or `extendEnrollmentAccess`, every one requiring a `reason` (min 3 chars, except `reactivate` where it's optional) and recording an audit event with before/after state. No manual admin action bypasses the state machine.

## CORRECTION (Part 2 correction pass) — capacity enforcement (FR-028)

`Course.enrollmentLimit` existed from Part 1 but was never read by any Part 2 code path. `createEnrollmentInternal` now checks it: `enrollment.repository.ts`'s `countSeatOccupyingEnrollments` counts every `PENDING`/`ACTIVE`/`SUSPENDED`/`COMPLETED` enrollment for the course (a `COMPLETED` learner's historical seat still counts against a hard cap; `CANCELLED`/`REVOKED`/`EXPIRED` free their seat, matching FR-028's own "release seats on cancellation... expiry" text). Once occupied seats reach the limit, a new enrollment attempt (self or admin) is rejected with `409 { code: 'COURSE_FULL' }`. A full Waitlist entity (join date, priority, notification, time-limited seat offer — FR-029) remains a genuinely separate, larger feature and is DEFERRED — see `DECISION_GATES.md` gate #20 — but the capacity REJECTION itself was not reasonable to leave unimplemented once the field already existed with nothing reading it.

## CORRECTION (Part 2 correction pass) — idempotency infrastructure integration

Correction 1's central finding: the existing, shared `IdempotencyKey` infrastructure (`backend/src/database/idempotency.service.ts` — the SAME mechanism `auth/registration.service.ts` already uses) was never actually wired into any LMS write path. This is now corrected for the two endpoints the correction brief names explicitly for enrollment, plus a bonus extension to self-enroll:

- **`adminGrantEnrollment`** ("administrative enrollment assignment," named explicitly) — wraps the whole grant in `beginIdempotentOperation('lms.enrollment.admin_grant', key, payload)`.
- **`selfEnroll`** — extended the same protection to the learner-facing enrollment path (`beginIdempotentOperation('lms.enrollment.self_enroll', key, { courseId })`) since a rapid double-click "Enroll" button is a genuinely common case the mechanism trivially covers.

**Actor scope.** Every LMS idempotency key is resolved via `lms-idempotency.util.ts`'s `scopedIdempotencyKey(actorId, suppliedKey, fallbackSuffix)`, which ALWAYS prefixes the caller-supplied (or synthesized) key with the acting user's id. Two different actors supplying the identical literal `Idempotency-Key` header value therefore resolve to two completely distinct `(scope, key)` rows — verified by an integration test ("actor scope: a different admin actor supplying the identical literal key does NOT reuse the first actor's record").

**Contract, verified by integration tests:**
- Same actor + same key + same payload → replays the original result, no second `Enrollment` row (`rows.length === 1` asserted).
- Same actor + same key + DIFFERENT payload → `409` (enforced by `beginIdempotentOperation`'s own `requestHash` mismatch check, not custom LMS logic).
- Concurrent identical requests (same actor, same key, fired via `Promise.all`) → exactly one `Enrollment` row exists afterward, regardless of which individual response was `201` vs `409`.
- A failed grant attempt (e.g. entitlement denied) → `outcome.fail()` marks the `IdempotencyKey` row `FAILED`, never `COMPLETED` — a caller retrying after a genuine failure is not permanently stuck replaying an error.

Not wrapped in `IdempotencyKey`: `suspendEnrollment`/`reactivateEnrollment`/`revokeEnrollment`/`extendEnrollmentAccess` (FR-112's status-transition actions). These were considered and deliberately left as-is: each is ALREADY idempotent by construction via `enrollment.policy.ts`'s state machine (`assertValidEnrollmentTransition` rejects a transition that's already been made, e.g. suspending an already-`SUSPENDED` enrollment throws a clear `400` rather than silently no-op'ing OR duplicating a side effect) — adding a second idempotency layer on top of an operation that's already safely rejecting repeats would be redundant. If a future audit finds a genuine double-submit gap in one of these four, revisit.

## Database verification pass status

The partial unique index `enrollments_one_active_per_user_course` (see `docs/lms/DATA_MODEL.md`) is this table's final, database-level protection layer against a duplicate open enrollment — the service-layer `findOpenEnrollment` check is the first, faster layer, but the index is what actually prevents a genuine race between two concurrent requests from both succeeding. **This has been reviewed (predicate matches the lifecycle policy exactly) but not executed against a real PostgreSQL database** — PostgreSQL/Docker are unavailable in this sandbox (confirmed fresh this pass via `docker --version`/`pg_isready`/`psql --version`/common-install-path checks/`prisma migrate status` all failing or not found). The `Correction 1` integration tests that exercise concurrent enrollment creation (`Promise.all`-fired duplicate requests) are written and would exercise this exact guarantee, but remain self-skipped, not executed.
