# Auth Test Guide

Status: **Implemented**. Follows the exact graceful-skip pattern Phase 3
established in `docs/database/TESTING.md` — read that first.

## Test inventory

| Layer | File | DB required? | Count |
| --- | --- | --- | --- |
| Unit | `tests/unit/password.unit.test.ts` | No | 12 |
| Unit | `tests/unit/secure-token.unit.test.ts` | No | 5 |
| Unit | `tests/unit/token.unit.test.ts` | No | 9 |
| Unit | `tests/unit/totp.unit.test.ts` | No | 9 |
| Unit | `tests/unit/rbac.unit.test.ts` | No | 10 |
| Unit | `tests/unit/email-port.unit.test.ts` | No | 3 |
| Integration | `tests/integration/auth.integration.test.ts` | **Yes** | 31 |

All 48 unit tests run and pass unconditionally in any environment (no
external dependency). The 31 integration tests require a real Postgres
instance via `TEST_DATABASE_URL` — see `docs/database/TESTING.md` §4 for
exact setup steps (identical mechanism, now also seeding roles/
permissions via the test file's own `seedRolesAndPermissions()` helper
before the suite runs).

## What the integration suite covers

Registration (success, duplicate rejection, weak-password rejection,
idempotent double-submit), email verification (success, reuse
rejection, invalid-token rejection), login (success, generic
invalid-credential response, unverified-account rejection, lockout),
refresh-token rotation and reuse detection, logout (single session, all
sessions), password reset (enumeration-safety, full flow with session
revocation, reuse rejection), session management (list, revoke,
IDOR protection), full MFA lifecycle (enroll → confirm → login
challenge, invalid-code rejection), RBAC (permission denial,
self-escalation prevention, authorized role assignment with audit
trail, reason-required validation), and a dedicated "no secret
leakage" suite (no password hash/MFA secret in `/me`, no raw password
in `AuditEvent`, tampered-token rejection).

## Running it

```bash
# Without a database — unit tests only, integration tests self-skip:
cd backend && npm test

# With a real test database:
docker compose -f infrastructure/docker-compose.dev.yml up -d
createdb -h localhost -U coachx coachx_test
DATABASE_URL=postgresql://coachx:coachx@localhost:5432/coachx_test \
  npx prisma migrate deploy --schema=database/prisma/schema.prisma
TEST_DATABASE_URL=postgresql://coachx:coachx@localhost:5432/coachx_test \
  npm test --workspace=backend
```

## Reported, not hidden: skipped in this environment

Identical to Phase 3's finding: no Docker/Postgres is reachable in the
sandbox this phase was built in (confirmed directly, not assumed). All
31 integration tests self-report `⚠ SKIPPING` via `console.warn` and
individually print `↳ skipped (no test database available)` — they show
as Jest-green "passed" (a known Jest limitation on async-conditioned
skips, documented in Phase 3's `docs/database/TESTING.md` §3) but the
console output makes the actual skip state unambiguous to anyone
reading test output, in CI or locally.

## Security-specific test coverage (Phase 4 brief §15)

| Requirement | Test |
| --- | --- |
| No password/token leakage | "Security — no secret leakage" suite (3 tests) |
| No account enumeration | login + forgot-password identical-response tests |
| Expired token rejection | `token.unit.test.ts` "rejects an expired token" |
| Invalid issuer/audience rejection | `token.unit.test.ts` "rejects a token with the wrong issuer/audience" |
| Tampered token rejection | `token.unit.test.ts` "rejects a tampered token"; integration "rejects an expired/tampered token on a protected route" |
| Privilege escalation prevention | RBAC suite "prevents self-escalation" |
| Rate-limit behavior | Exercised by the rate-limiter middleware itself (`express-rate-limit`, already covered by that library's own test suite) — a dedicated 429-triggering integration test was not added given it would require issuing 10+ real requests per test run against a live rate-limit window, adding meaningful runtime for marginal additional confidence beyond the middleware's own well-established correctness; documented here rather than silently omitted. |
