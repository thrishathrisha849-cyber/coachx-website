# LMS Test Guide (Phase 6 Part 1)

Status: **Implemented**. Same graceful-skip pattern established in
`docs/database/TESTING.md`, `docs/auth/TESTING.md`,
`docs/public-site/TESTING.md` — read those first.

## Backend test inventory

| Layer | File | DB required? | Count |
| --- | --- | --- | --- |
| Unit | `tests/unit/course-lifecycle.unit.test.ts` | No | 31 |
| Unit | `tests/unit/lms-validation.unit.test.ts` | No | 24 |
| Integration | `tests/integration/lms.integration.test.ts` | **Yes** | 25 |

(Counts as of the spec-alignment correction pass — grew from the
original 21/17/18 as tests were added for the corrected FR-015/FR-100
lifecycle, category depth cap, module prerequisites, and the required
review-note rule; see below.)

All unit tests run and pass unconditionally — `course-lifecycle.policy.ts`
and `lms.validation.ts` are pure functions/schemas with no database
dependency, tested directly. The integration suite requires a real
Postgres instance via `TEST_DATABASE_URL` (see `docs/database/TESTING.md`
§4 for setup) — it additionally seeds RBAC and creates `platform_admin`/
`course_instructor` test users, mirroring `cms.integration.test.ts`'s
own pattern (a `content_manager` user).

### What the unit suite covers

`course-lifecycle.policy.ts`: every listed FR-015/FR-100-aligned
transition is allowed, representative invalid transitions are rejected
(`DRAFT → PUBLISHED`, `SUBMITTED_FOR_REVIEW → PUBLISHED`), the full
happy-path chain, the `CHANGES_REQUESTED` resubmission loop, `RETIRED`'s
true-terminal-state property, publish-readiness field-by-field rejection
(parametrized `it.each` over all 6 required fields, now checked at
`SUBMITTED_FOR_REVIEW → APPROVED`), the
seoTitle/seoDescription-NOT-required fallback behavior, publishAt/
expireAt ordering, the module-count gate, and BOTH visibility
predicates: `isCoursePubliclyVisible()` (the listing rule — excludes
`UNLISTED`) and `isCourseVisibleByDirectLink()` (the detail rule —
includes it), including the `SCHEDULED`-becomes-visible-at-its-publishAt
behavior.

`lms.validation.ts`: slug format, the FREE-price-must-be-zero rule (both
directions), negative-price rejection, publishAt/expireAt and
enrollmentStartAt/enrollmentEndAt ordering, metadata size bound, empty-
update-body rejection, invalid UUID param rejection, category
null-parentId-on-update acceptance, the sort-value whitelist (including
a literal SQL-injection-shaped string as a non-whitelisted value), every
`COURSE_STATUS_VALUES` entry accepted, the OLD generic-prompt-era values
(`REVIEW`/`UNPUBLISHED`) explicitly asserted REJECTED (a regression
guard against reintroducing them), the required-`reviewNote`-on-
`CHANGES_REQUESTED` rule, and module `releaseRuleType`/
`prerequisiteModuleId` acceptance/rejection.

### What the integration suite covers

Category creation + duplicate-slug rejection, parent/child hierarchy +
cycle-prevention rejection, **the 2-level depth cap rejecting a 3rd
hierarchy level**, category archive (excluded from public list, still
admin-fetchable — not hard-deleted). Course creation + duplicate-slug
rejection, invalid-transition rejection, the required-review-note rule
(including that resubmission clears a stale note), publish rejection
with zero modules then success once one exists (now asserted at the
`APPROVED` transition, with `reviewedBy`/`publishedBy` populated),
**`RETIRED`'s true-terminal-state property**, draft never-leaked via
public detail/listing, **`UNLISTED` reachable by direct slug but never
listed**, published course's public response has zero internal-field
leakage (explicit key-absence assertions including the new
`reviewNotes`/`reviewedBy`/`publishedBy` fields). Module creation with
stable ordering, transactional reorder, cross-course reorder rejection,
**cross-course prerequisite rejection, prerequisite cycle rejection,
reorder-violates-prerequisite-order rejection**, archive-without-hard-
delete. Instructor duplicate-assignment rejection, at-most-one-primary
enforcement, last-instructor-removal rejection, IDOR prevention
(instructor B denied on instructor A's course, instructor A succeeds),
permission-escalation prevention (instructor can submit their own course
for review but is denied approving/publishing/archiving it — the
corrected, finer-grained tier check). Discovery pagination/category-
filter/search with exact `meta.totalItems`/`totalPages` assertions, and
sort-whitelist rejection at the HTTP layer.

## Frontend test inventory (Part 1 — new)

| File | Count | Covers |
| --- | --- | --- |
| `pages/__tests__/CourseListPage.test.tsx` | 3 | Published-course rendering, empty state, error state |

Follows the exact `BlogListPage.test.tsx` pattern (Vitest + React
Testing Library, `vi.mock('@/api/lms.api')`). `CourseDetailPage` has no
dedicated test file in Part 1 — see Decision Gates (a known,
acknowledged test-coverage gap, not a silent omission: the page was
manually verified via the frontend build/typecheck/lint passing and
direct code review against the same patterns `BlogDetailPage` already
has test coverage for).

## Running it

```bash
# Backend — unit tests only (no database):
cd backend && npm test

# Backend — with a real test database:
TEST_DATABASE_URL=postgresql://coachx:coachx@localhost:5432/coachx_test \
  npm test --workspace=backend

# Frontend:
npm test --workspace=frontend
```

## Reported, not hidden: skipped in this environment

No Docker/Postgres is reachable in the sandbox this phase was built in.
`lms.integration.test.ts` self-reports `⚠ SKIPPING` via `console.warn`
and each of its 18 tests individually prints `↳ skipped (no test
database available)` — identical, intentional limitation to every prior
phase's own integration suite (Phase 3/4/5).

## Real bug found during implementation (not by a failing test — caught by review before tests were written against it)

See `docs/lms/SECURITY.md`'s "Draft/archived content leakage" section:
an object-spread `OR`-key-collision bug in `course.repository.ts`'s
`publicCourseWhere()` would have silently dropped the publish-window
visibility filter whenever a search query was also supplied. Fixed
before any test was written against the buggy version — the integration
suite's discovery tests exercise the FIXED code path.

## What is NOT covered

Playwright e2e / visual regression (same gap as `docs/public-site/DECISION_GATES.md`
#9 — not reintroduced or re-litigated here). `CourseDetailPage`'s own
dedicated frontend test file (see above). Load/performance testing of
the discovery query under a large course catalog (no realistic dataset
volume exists in this sandbox to test against).

## Phase 6 Part 2 test coverage (CORRECTED counts — see "Test result reporting" below)

**Unit tests, GENUINELY EXECUTED (no database needed):**
- `tests/unit/enrollment-policy.unit.test.ts` (12) — transition table, timestamp-based window fail-closed behavior.
- `tests/unit/entitlement.unit.test.ts` (13) — fail-closed entitlement boundary, every non-FREE/ADMIN_GRANT source individually verified UNAVAILABLE.
- `tests/unit/lesson-validation.unit.test.ts` (21, was 17 — 4 added this correction pass for `completionRuleTypes`) — lesson/activity Zod schemas, per-content-type required-field rules, safe-URL-scheme rejection, closed embed-provider allowlist, multi-condition array validation.
- `tests/unit/progress-validation.unit.test.ts` (17) — typed/bounded `lastPosition` discriminated union, bounded time-spent delta, learner-cannot-supply-own-source enrollment schema.
- `tests/unit/lms-idempotency.unit.test.ts` (5, NEW this correction pass) — `scopedIdempotencyKey`'s actor-scope isolation.
- `tests/unit/completion-rules.unit.test.ts` (4, NEW this correction pass) — `getEffectiveCompletionRules`'s array-vs-singular-fallback logic.

Part 2 unit-test subtotal: **77 tests, all genuinely executed, all passing.**

**Integration tests, DB-GATED and SELF-SKIPPING in this sandbox (same honest-skip pattern as every other integration file):** `tests/integration/lms-part2.integration.test.ts` — 19 test cases (was 9; 10 added this correction pass), covering:
- The original 8 mandatory end-to-end domain scenarios (free-course flow, paid-course-without-entitlement denial, suspended enrollment, prerequisite/drip gating, IDOR protection ×2, instructor scope, idempotent completion, expired-access-via-timestamp).
- Correction 1 (idempotency): first-request-succeeds/identical-retry-replays, same-key-different-payload-rejected, actor-scope-isolation, concurrent-duplicate-requests, duplicate-completion-no-duplicate-audit-event, failed-operation-does-not-finalize-key (6 tests).
- Correction 2 (`ALL_ACTIVITIES_VIEWED`): cannot-complete-via-manual-click-while-unviewed, auto-completes-only-once-server-confirmed, repeat-view-is-idempotent (3 tests).
- Correction 4 (capacity): rejects-enrollment-once-limit-reached (1 test).

## CORRECTION (Part 2 correction pass) — test result reporting

The prior report stated "342/342 passing," which BLENDED genuinely-executed tests with self-skipped DB-gated tests under a single "passing" label — Jest itself reports a `skip()`-early-return test as "passed" (no assertion failed), which is technically accurate but misleading without the skip context. This is corrected here and in the final report: every count below distinguishes PASSED (genuinely executed and verified) from SKIPPED (never actually exercised, no database reachable).

**Backend unit + contract tests (no database dependency):** 258 passed, 0 failed, 0 skipped, 258 total (245 unit + 13 contract).

**Backend DB-gated integration tests:** 0 passed, 0 failed, 107 skipped, 107 total. Reason: PostgreSQL unavailable in this sandbox (`isTestDatabaseAvailable()` returns false — confirmed via a fresh Docker/`pg_isready` check during the correction pass, not assumed from a prior report). Breakdown: `auth.integration.test.ts` (31), `cms.integration.test.ts` (24), `database.integration.test.ts` (8), `lms.integration.test.ts` (25), `lms-part2.integration.test.ts` (19).

**Backend grand total:** 365 total tests, 258 passed for real, 0 failed, 107 skipped.

**Frontend tests:** 79 passed, 0 failed, 0 skipped, 79 total (no database dependency — all API calls mocked).

**Admin tests:** NOT AVAILABLE — `admin/package.json` defines no `test` script.

**Shared tests:** NOT AVAILABLE — `shared/package.json` defines no `test` script.

No test file anywhere in this session reports a genuine FAILURE. Every "skip" is an honest, logged, self-reported skip (`console.warn('  ↳ skipped (no test database available)')`), never a silent pass-through.

## Database verification pass — BLOCKED (honest status, not a pass)

A dedicated pass was run specifically to execute the 111 DB-gated tests against a real PostgreSQL instance. Availability was checked fresh via `docker --version`, `docker compose version`, `pg_isready`, `psql --version`, `command -v`/`which` lookups for all four binaries, a scan of the common Windows install directories (`C:\Program Files\Docker\Docker`, `C:\Program Files\PostgreSQL`), and an environment-variable check for a pre-configured `DATABASE_URL` — none found. `prisma migrate status` was additionally attempted and failed with `P1001: Can't reach database server at localhost:5432`, confirming the negative result at the tool level, not just at the shell level.

**Result: PostgreSQL and Docker remain unavailable in this sandbox. Database verification is BLOCKED, not passed.** No DB-gated test was executed against a real database. The 111-test count above is unchanged from the correction pass, still 100% self-skipped. This is reported honestly per this pass's own explicit instruction: "If neither PostgreSQL nor Docker is available, stop and report that database verification remains blocked. Do not falsely mark it as passed."

**What WAS newly added this pass** (code-reviewed, typechecked, and — where testable without a DB — unit-tested, but NOT DB-verified): the `POST /admin|instructor/modules/:id/release` endpoint (FR-034/FR-038 instructor-manual-release write path) and its 4 integration test cases, which join the 111 self-skipped total (up from 107 after the correction pass, now 111).
