# Auth Environment Variable Guide

Status: **Implemented**. All variables below have safe, obviously-fake
development defaults in `backend/src/config/env.config.ts` — an empty
`.env` still boots the server. Every variable marked "MUST override in
production" has a default that would be a real security problem if left
unchanged in a production deployment.

| Variable | Default | Required override in production? | Purpose |
| --- | --- | --- | --- |
| `JWT_ACCESS_SECRET` | `dev-only-insecure-access-secret` | **Yes** | Signs access tokens |
| `JWT_REFRESH_SECRET` | `dev-only-insecure-refresh-secret` | **Yes** (Phase 1, unused directly by Phase 4's refresh design — refresh tokens are opaque random values, not JWTs; retained for forward-compatibility) | Reserved |
| `JWT_ACCESS_EXPIRES_IN` | `15m` | No | Access-token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | No | Refresh-token/session lifetime |
| `JWT_ISSUER` | `coachx` | Recommended | Token issuer claim, validated on every verify |
| `JWT_AUDIENCE` | `coachx-api` | Recommended | Token audience claim, validated on every verify |
| `MFA_ENCRYPTION_KEY` | `dev-only-insecure-mfa-encryption-key-32b` | **Yes** | Encrypts TOTP secrets at rest (AES-256-GCM) |
| `AUTH_PASSWORD_RESET_TOKEN_TTL_MIN` | `30` | No | Password-reset token lifetime (minutes) |
| `AUTH_EMAIL_VERIFICATION_TOKEN_TTL_HOURS` | `24` | No | Email-verification token lifetime (hours) |
| `AUTH_LOGIN_LOCKOUT_THRESHOLD` | `5` | No | Failed attempts before account lockout |
| `AUTH_LOGIN_LOCKOUT_DURATION_MIN` | `15` | No | Lockout duration (minutes) |

Test-only: `TEST_DATABASE_URL` — see `docs/database/TESTING.md` §4 and
`docs/auth/TESTING.md`. Never set in `backend/.env.test` itself (which
deliberately has no `DATABASE_URL` at all, per Phase 2's readiness-check
test design) — set as a standalone environment variable when running
the integration suite against a real database.

## Validation

Every variable above is validated by the same Zod schema
(`envSchema` in `env.config.ts`) that has governed the whole backend
since Phase 1 — an invalid or missing *required* field fails the
process fast at startup with a clear message, never a confusing runtime
failure later. All Phase 4 variables have safe defaults, so none of
them are currently in the "required, no default" category — this
should be revisited before a real production deployment (see
`docs/auth/DECISION_GATES.md`).
