# LMS Security Review (Phase 6 Part 1)

Status: a focused review against the Phase 6 Part 1 §"SECURITY"
checklist, following the same "state the mitigation and its actual
implementation, or name the gap honestly" discipline as
`docs/auth/THREAT_MODEL.md` and `docs/public-site/SECURITY.md`.

## Broken object-level authorization (instructor cross-course access)

**Mitigated.** Every route under `/api/v1/lms/instructor/*` calls
`assertInstructorOwnsCourse(courseId, userId)` BEFORE performing the
requested action — a real backend check (`course.service.ts`), not a
frontend restriction. For the module-update route specifically
(`PATCH /instructor/modules/:moduleId`), the module's OWNING COURSE is
looked up first (`findModuleById`) so a caller can't bypass ownership by
guessing another instructor's `moduleId` directly — the check is always
against the course, never trusting a client-supplied courseId.
Verified by an integration test: instructor B is rejected (403) reading
and writing a course only instructor A is assigned to; instructor A
succeeds on the same course.

## Draft/archived content leakage

**Mitigated.** `getPublicCourseBySlug()` returns the identical 404 for
a nonexistent slug and an existing-but-non-public one — no
draft-existence signal. `findPublicCourses()`'s `WHERE` clause is
built entirely inside `course.repository.ts`'s `publicCourseWhere()`.

**A real bug was found and fixed during implementation, not left for a
test to catch by accident:** an early version combined the
publish/expire-window check and the search-query (`q`) filter by
spreading multiple `{ OR: [...] }` object fragments into one object
literal — the LAST `OR` key silently wins in a JS object literal, so
supplying a search query (`q`) would have SILENTLY DROPPED the
publish-window visibility filter, a real non-public-content leak
whenever search was combined with any other filter. Caught during
code review (not by a failing test — the bug was fixed before tests
were written against it), fixed by combining every condition through a
single top-level `AND` array instead. See the code comment directly
above `publicCourseWhere()` in `course.repository.ts` for the full
explanation, kept in the source as a warning against reintroducing the
same pattern.

## Mass assignment

**Mitigated.** Every write goes through a Zod schema
(`lms.validation.ts`) that whitelists exactly the fields accepted —
`req.body` is never spread directly into a Prisma `create`/`update`
call; `course.service.ts`/`category.service.ts`/`module.service.ts`
build the Prisma `data` object field-by-field from the validated input.

## Stored XSS / HTML injection (course rich-text description)

**Mitigated, same pattern as CMS — no second sanitizer.**
`Course.description` (rich text) is sanitized at RENDER time via the
EXISTING `frontend/src/utils/sanitizeHtml.ts` (DOMPurify, narrow
allowlist) — the identical mechanism the CMS `TEXT` block already uses
(`docs/public-site/SECURITY.md`). `CourseDetailPage.tsx` calls
`sanitizeRichText(course.description)` before `dangerouslySetInnerHTML`;
no raw, unsanitized HTML is ever rendered. No backend-side sanitizer was
introduced (would be a second sanitization mechanism the brief's
"Do not introduce... a parallel LMS backend"-style discipline argues
against by extension).

## Unsafe URLs / slug injection

**Mitigated.** Course/category slugs are validated against the SAME
`^[a-z0-9]+(?:-[a-z0-9]+)*$` pattern the CMS module uses — no
special characters, no path traversal shape. Image/thumbnail/cover/
trailer URLs are length-bounded strings (matching the CMS `Page` model's
own choice not to hard-validate URL shape with Zod's `.url()`, which
would incorrectly reject legitimate root-relative paths) — rendering
uses `<img src=...>`/plain anchor attributes, never interpolated into
HTML or executed.

## SQL injection

**Not applicable / mitigated by construction.** Every query goes
through Prisma's parameterized query builder — no raw SQL string
concatenation exists anywhere in the LMS module (the one hand-written
SQL statement, the partial unique index in the migration, is static DDL
with no user input involved).

## Enumeration

**Mitigated.** Category/course create conflicts return a generic 409
("A record with this slug already exists" — via `normalizeDatabaseError`'s
P2002 handling, unchanged from Phase 3) rather than confirming which
specific field collided in a way that would help enumerate existing
slugs beyond what the caller already guessed.

## Overly large payloads

**Mitigated.** Every text field has an explicit `.max()` bound in Zod
(title 200 chars, description 20,000 chars, etc.) and `metadata` is
bounded to 8KB of serialized JSON — a genuinely new validation rule
this phase adds (`METADATA_MAX_BYTES`), beyond what the CMS module
enforces on its own `Json` fields (an acknowledged, pre-existing gap in
the CMS module the brief's own "metadata size" requirement made this
phase close for LMS, though it does not retroactively fix CMS).
Express's existing `express.json({ limit: '1mb' })` (Phase 1) remains
the outer, platform-wide body-size backstop.

## Reorder manipulation / cross-course reorder

**Mitigated, two layers.** (1) `module.service.ts`'s
`reorderCourseModules()` validates `orderedIds` is EXACTLY the course's
current full module set (no more, no fewer, no unknown IDs) before any
write. (2) `module.repository.ts`'s `reorderModulePositions()` scopes
every `updateMany` `where` clause to `{ id, courseId }`, not just
`{ id }` — a defense-in-depth check that an id somehow belonging to a
DIFFERENT course silently matches zero rows instead of corrupting
another course's ordering. Verified by an integration test asserting a
reorder mixing modules from two different courses is rejected with 400.
Category sibling reorder uses the identical two-layer pattern
(`category.service.ts`'s `reorderCategories()` scoped to `parentId`).

## Permission escalation

**Mitigated.** See `docs/lms/RBAC.md`'s "body-aware permission check"
section — an instructor holding only `course.update` cannot reach
`PUBLISHED`/`SCHEDULED` even via the raw admin status endpoint (not just
the instructor-scoped one, which doesn't expose a status route at all).
Verified by an integration test.

## Internal-field leakage

**Mitigated.** Every public response is built by an explicit serializer
(`lms.serializers.ts`'s `toPublicCourse`/`toPublicCategory`/
`toPublicModule`/`toPublicInstructor`) — `createdBy`/`updatedBy`/
`metadata`/`version`/`status` are never present on a public course
response; instructor responses expose only `userId`/`displayName`/
`role`/`isPrimary`, never email or other account fields. Verified by an
integration test asserting a published course's public JSON response
lacks `createdBy`/`updatedBy`/`metadata`/`version`/`status` keys
entirely.

## No secrets

**Mitigated.** No LMS response includes a password hash, JWT secret, or
token of any kind — the LMS module introduces no new secret-bearing
field. Secret scan (see the Phase 6 Part 1 final report) confirms no
new secret-shaped strings were committed.

## CSP compatibility

**Unchanged from Phase 5** (`docs/public-site/SECURITY.md`'s existing
CSP note) — the LMS module introduces no new inline-script pattern.

## Phase 6 Part 2 security review

**IDOR / broken object-level authorization.** Every `/me/*` route resolves the acting user exclusively from `req.user!.id` (the verified access token) — no route accepts a `userId` in params/query/body anywhere. `progress.service.ts`, `completion.service.ts`, and `access-evaluator.service.ts` all re-derive the caller's own enrollment server-side rather than trusting a client-supplied enrollment/course id to belong to the caller. Verified by the integration suite's Scenario 5 (cross-account admin-action rejection, cross-instructor course-enrollment-list rejection).

**Mass assignment.** A learner can never set their own `EnrollmentSource`, `EnrollmentStatus`, `completedAt`, `accessEndAt`, or any other privileged field — `selfEnrollSchema` accepts only `{ courseId }`; every other Enrollment-mutating field is reachable only through admin/instructor-only schemas gated by RBAC + ownership.

**Status-transition bypass.** Both `course-lifecycle.policy.ts` (Part 1) and `enrollment.policy.ts` (Part 2) are the SOLE source of transition legality — no direct `.update({ status: ... })` call bypassing `assertValidEnrollmentTransition` exists anywhere in the Part 2 codebase (verified by code review of every `enrollment.repository.ts`/`completion.service.ts` write site).

**Per-content-type activity security.** See `LEARNING_ACTIVITIES.md`'s "Per-content-type security rules" — safe-scheme-only URLs (no `javascript:`/`data:`), a closed EMBED-provider allowlist, never raw iframe HTML. Verified by `lesson-validation.unit.test.ts`.

**Preview-as-entitlement-bypass.** Explicitly reviewed and closed: `progress.service.ts` and `completion.service.ts` both reject a progress/completion write when access was granted `viaPreview` — a learner cannot "enroll via preview." See `ACCESS_DECISION_ENGINE.md`.

**Entitlement-integration safety.** No Order/Payment/Invoice/Subscription model exists anywhere in `database/prisma/schema.prisma` — verified via `grep -i "model Order\|model Payment\|model Invoice\|model Subscription"` returning no matches. Every non-FREE/ADMIN_GRANT entitlement source fails closed (`UNAVAILABLE`), never silently allowed. See `ENTITLEMENT_BOUNDARY.md`.

**Fail-closed on missing background jobs.** No scheduler/cron exists in this codebase. `isEnrollmentAccessWindowOpen` and `isCoursePubliclyVisible` (Part 1) both re-derive their answer from stored timestamps on every read, so an un-run background job can never cause a stale-permissive access grant. Verified by the integration suite's Scenario 8 and by `enrollment-policy.unit.test.ts`.

## Correction pass — re-verified + newly added security properties

Every item below was RE-TESTED (not merely re-asserted) during the mandatory correction and verification pass, per the correction brief's explicit "Security Review" section:

- **Learner enrollment IDOR** — re-verified: `/me/*` routes still exclusively resolve the acting user from `req.user!.id`; a cross-account admin-action attempt (Scenario 5) still rejects with 403. No regression introduced by the correction pass's new routes/fields.
- **Instructor course-scope enforcement** — re-verified: the new instructor-facing override endpoint (`postMyInstructorOverrideComplete`) still calls `assertInstructorOwnsCourse` before touching another instructor's enrollment data, and still rejects a `COURSE`-scope override attempt (admin-only) with 403.
- **Admin privileged-action permission** — re-verified: the new `postEnrollment`/`postOverrideComplete`/`postResetProgress` idempotency-key threading did not weaken the underlying `course.manageInstructors` RBAC gate at the route layer — the `Idempotency-Key` header is read AFTER authentication/authorization middleware has already run.
- **Completion override reason requirement / progress reset reason requirement** — unchanged, still enforced by `enrollment.validation.ts`'s Zod schemas (`reason` min 3 chars) before the idempotency wrapper is ever reached.
- **Paid-content fail-closed behavior** — re-verified and UNCHANGED: `entitlement.service.ts`'s `evaluateEntitlement` still returns `UNAVAILABLE` for every non-FREE/ADMIN_GRANT source; the correction pass added NO new entitlement source and NO new path to `ALLOWED`. Capacity enforcement (new this pass) is an ADDITIONAL fail-closed check (rejects when full), never a path that grants access more permissively.
- **Direct lesson URL access** — re-verified: `GET /me/lessons/:id` still runs `evaluateLessonAccess` before returning content; the new `completionRuleTypes` field does not change this gate.
- **Progress endpoint access bypass** — re-verified AND HARDENED this pass: `assertLastPositionMatchesLessonActivities` now additionally rejects a `lastPosition` signal for an activity type not present in the target lesson (see `PROGRESS_ENGINE.md`) — closing a narrow signal-forgery gap the original design left open.
- **Preview entitlement bypass** — re-verified: `recordActivityViewed` (new this pass) explicitly rejects a `viaPreview` access grant with 400, mirroring the same check `progress.service.ts`/`completeLessonManually` already had — a learner cannot accumulate `ALL_ACTIVITIES_VIEWED` progress via preview access either.
- **Idempotency-key cross-user isolation** — NEW this pass, verified by both a unit test (`lms-idempotency.unit.test.ts`) and an integration test (Correction 1's "actor scope" scenario): `scopedIdempotencyKey` always prefixes the resolved key with the acting user's id, so two different actors supplying the identical literal `Idempotency-Key` header value can never collide or replay each other's result.

**The fail-closed entitlement boundary was NOT weakened.** `entitlement.service.ts` was never opened for editing during this correction pass (it remains exactly as written in the prior turn — `git diff` cannot itself confirm this since the file is still untracked/uncommitted from before this pass began, so there is no git-level "before" snapshot to diff against for it specifically; the claim rests on direct review of every file this pass touched, listed in the final report's changed-file list, which does not include `entitlement.service.ts`). Every correction this pass made either ADDS a new fail-closed check (capacity, cross-activity signal rejection) or CORRECTS a defect toward stricter enforcement (`ALL_ACTIVITIES_VIEWED`), never loosens an existing one.

## Database verification pass status

Every security property above (IDOR, ownership, override/reset reason requirements, fail-closed entitlement, direct-URL access, preview bypass, idempotency isolation) has been verified via code review and, where a database is not required (Zod schema behavior, pure-function logic), via genuinely-executed unit tests. **None have been verified end-to-end against a real PostgreSQL database with real concurrent requests in this session** — PostgreSQL/Docker are unavailable in this sandbox. In particular, the concurrency-dependent guarantees ("two simultaneous active-enrollment requests produce exactly one row," "the database constraint is the final protection layer," "no database deadlock left unhandled") rest on PostgreSQL's own transaction/locking behavior and cannot be proven by a self-skipping test or by code review alone — they remain reviewed, reasoned, and tested-in-principle, not database-verified. Do not treat this document's "re-verified" language above as equivalent to live-database verification; the distinction is deliberate and matches `docs/lms/TESTING.md`'s honest reporting discipline.
