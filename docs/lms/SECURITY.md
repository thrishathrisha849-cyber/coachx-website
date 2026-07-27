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
