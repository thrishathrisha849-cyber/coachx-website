# Public Site / CMS Test Guide

Status: **Implemented**. Same graceful-skip pattern established in
`docs/database/TESTING.md` and `docs/auth/TESTING.md` — read those
first. Phase 5 Part 2 added the frontend test suite (zero frontend
tests existed after Part 1).

## Backend test inventory

| Layer | File | DB required? | Count |
| --- | --- | --- | --- |
| Unit | `tests/unit/block-schemas.unit.test.ts` | No | 11 |
| Unit | `tests/unit/seo.unit.test.ts` | No | 2 |
| Unit | `tests/unit/search-ranking.unit.test.ts` (Part 2) | No | 11 |
| Integration | `tests/integration/cms.integration.test.ts` | **Yes** | 23 |

All unit tests run and pass unconditionally. The integration suite
requires a real Postgres instance via `TEST_DATABASE_URL` — see
`docs/database/TESTING.md` §4 for setup steps (this suite additionally
seeds roles/permissions, matching `auth.integration.test.ts`'s pattern,
since page-publish tests need a `content_manager` user).

### What the backend integration suite covers

Full page publish workflow (DRAFT → REVIEW → APPROVED → PUBLISHED,
public-invisible until published), invalid-transition rejection,
permission-denial for non-`content.manage` users, block-data validation
rejection, non-destructive versioning, expiring preview links, nested
navigation-tree construction, date-range-driven announcement visibility,
Contact-form submission with consent recording and email confirmation,
Newsletter subscription with consent recording. **Part 2 additions**:
search pagination/ranking/no-draft-leakage, Blog tag filtering,
Newsletter safe unsubscribe (including idempotency and the
guessed-email-link rejection case), honeypot silent-no-op for both
Contact and Newsletter, SEO duplicate-title detection, and the
Redirect-check endpoint (including its open-redirect guard).

## Frontend test inventory (Phase 5 Part 2 — new)

Vitest + React Testing Library + jest-axe, configured in
`frontend/vite.config.ts`'s `test` block (Vitest 2.1.9, chosen for Vite
5 compatibility — Vitest 4.x requires Vite 6+, which would be a forced
major upgrade this phase does not make).

| File | Count | Covers |
| --- | --- | --- |
| `utils/__tests__/sanitizeHtml.test.ts` | 8 | XSS sanitization allowlist |
| `utils/__tests__/url.test.ts` | 6 | Open-redirect classification |
| `utils/__tests__/readingTime.test.ts` | 5 | Blog reading-time estimate |
| `components/cms-blocks/__tests__/BlockRenderer.test.tsx` | 9 | CMS block rendering, incl. GALLERY/DOWNLOAD, sanitization, a11y |
| `components/layout/__tests__/Header.test.tsx` | 4 | Navigation (CMS-driven, not hardcoded) |
| `components/layout/__tests__/MobileNav.test.tsx` | 7 | Dialog a11y, focus trap, Escape/close |
| `components/layout/__tests__/CookieConsentBanner.test.tsx` | 8 | Per-category consent, persistence |
| `components/forms/__tests__/ContactForm.test.tsx` | 6 | Validation, honeypot, duplicate-submit guard |
| `components/forms/__tests__/NewsletterForm.test.tsx` | 4 | Validation, honeypot, duplicate-submit guard |
| `components/system/__tests__/EmptyState.test.tsx` | 3 | Generic empty state |
| `pages/__tests__/SearchPage.test.tsx` | 4 | Pagination, highlighting, empty state |
| `pages/__tests__/BlogListPage.test.tsx` | 3 | Tag filter request, empty state |
| `hooks/__tests__/useDocumentHead.test.tsx` | 9 | SEO meta tags, JSON-LD injection |

**Total: 76 frontend tests, all passing.**

### Accessibility tests

`src/test/a11y.ts`'s `expectNoA11yViolations()` runs `jest-axe` against
a rendered container. Asserted (zero violations found) for:
`EmptyState`, `BlockRenderer` (HERO), `Header`, `MobileNav`,
`ContactForm`, `NewsletterForm`, `CookieConsentBanner`.

## Running it

```bash
# Backend — unit tests only (no database):
cd backend && npm test

# Backend — with a real test database:
TEST_DATABASE_URL=postgresql://coachx:coachx@localhost:5432/coachx_test \
  npm test --workspace=backend

# Frontend:
npm test --workspace=frontend        # vitest run
npm run test:watch --workspace=frontend   # watch mode

# Both, from the repo root:
npm test
```

## Reported, not hidden: skipped in this environment

No Docker/Postgres is reachable in the sandbox this phase was built
in (confirmed directly). All 23 backend integration tests self-report
`⚠ SKIPPING` via `console.warn`, individually printing
`↳ skipped (no test database available)` for each test — identical,
intentional limitation to Phase 3/4's own integration suites. The
frontend test suite has NO such dependency (every test mocks the API
layer via `vi.mock('@/api/cms.api')`) and runs fully in every
environment, including this one.

## Real bugs found by writing these tests (not hidden)

- **`SearchPage`'s "enter at least 2 characters" hint never rendered**
  when a user typed 1 character and clicked Search — the message was
  keyed off the URL-synced `query` state, which never got set for a
  too-short query, so the hint silently never appeared. Found by a
  frontend test, fixed by keying the hint off the local `input` state
  instead. A genuine UX bug this test suite caught before it shipped.
- **A test-authoring bug**, not a code bug: an early version of
  `scoreMatch()`'s unit test asserted `'pricing plans'.startsWith('price')`
  — false, since "pricing" and "price" diverge at the 5th character.
  Caught immediately by the failing test; fixed the test's own
  expectation, not the (correct) implementation.

## What is NOT covered

Playwright e2e / visual regression (`docs/public-site/DECISION_GATES.md`
#9) — this phase's frontend tests are component/unit-level (jsdom), not
full-browser end-to-end. Manual color-contrast verification
(`docs/public-site/DECISION_GATES.md` #15) — jsdom does not compute
real rendered pixel colors.
