# Public Site / CMS Test Guide

Status: **Implemented**. Same graceful-skip pattern established in
`docs/database/TESTING.md` and `docs/auth/TESTING.md` — read those
first.

## Test inventory

| Layer | File | DB required? | Count |
| --- | --- | --- | --- |
| Unit | `tests/unit/block-schemas.unit.test.ts` | No | 11 |
| Unit | `tests/unit/seo.unit.test.ts` | No | 2 |
| Integration | `tests/integration/cms.integration.test.ts` | **Yes** | 17 |

All unit tests run and pass unconditionally. The integration suite
requires a real Postgres instance via `TEST_DATABASE_URL` — see
`docs/database/TESTING.md` §4 for setup steps (this suite additionally
seeds roles/permissions, matching `auth.integration.test.ts`'s pattern,
since page-publish tests need a `content_manager` user).

## What the integration suite covers

Full page publish workflow (DRAFT → REVIEW → APPROVED → PUBLISHED,
public-invisible until published), invalid-transition rejection,
permission-denial for non-`content.manage` users, block-data validation
rejection, non-destructive versioning (a new `PageVersion` on every
update), expiring preview links, nested navigation-tree construction,
date-range-driven announcement visibility (including automatic expiry
without a manual status flip), Contact-form submission with consent
recording and email confirmation, Newsletter subscription with consent
recording, and search (finds a published page by title, rejects a
sub-2-character query).

## Running it

```bash
# Unit tests only (no database):
cd backend && npm test

# With a real test database (same one used for auth.integration.test.ts):
TEST_DATABASE_URL=postgresql://coachx:coachx@localhost:5432/coachx_test \
  npm test --workspace=backend
```

## Reported, not hidden: skipped in this environment

No Docker/Postgres is reachable in the sandbox this phase was built
in (confirmed directly). All 17 integration tests self-report
`⚠ SKIPPING` via `console.warn`, individually printing
`↳ skipped (no test database available)` for each test — identical,
intentional limitation to Phase 3/4's own integration suites.

## Frontend verification performed

No automated frontend test suite was added in this phase (Playwright
e2e is named in 002/plan.md's Testing section but was out of this
part's scope given the size already delivered). Verified instead by:
running `npm run build` (Vite production build succeeds, 120 modules
transform cleanly), `tsc -b` (strict typecheck passes), `eslint`
(clean), and a live dev-server smoke test (both `backend` and
`frontend` dev servers started concurrently; `index.html` served
correctly with the expected React/Vite bootstrap; the backend's
`/api/v1/cms/pages/home` endpoint correctly returned a clean, safe 500
"Database is not connected" error — expected and correct given no
Postgres in this sandbox, not a bug). Full page-render verification
(actual block content on screen) requires a headless browser or a real
database and was not performed — recorded as a real, honest testing
gap rather than an unverified claim.
