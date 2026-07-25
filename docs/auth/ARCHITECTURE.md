# Authentication Architecture Guide

Status: **Implemented** for everything described below unless marked
otherwise. See `docs/auth/TRACEABILITY.md` for the full FR-by-FR status
and the reported spec-vs-implementation conflict (NestJS assumption vs.
the real Express architecture).

## 1. Module layout

`backend/src/auth/` — a flat domain folder, matching the precedent
`backend/src/database/` already established in Phase 3 (not a NestJS
`modules/` tree):

```
backend/src/auth/
├── auth.types.ts               Shared types (AccessTokenClaims, AuthenticatedUser)
├── auth-error-codes.ts         003 FR-156 error codes (implemented subset)
├── auth.validation.ts          Zod request schemas
├── password.util.ts            Argon2id hash/verify, password-policy validation
├── secure-token.util.ts        Crypto-random token generation + SHA-256 hashing
├── token.util.ts                Access-token + MFA-challenge-token sign/verify
├── totp.util.ts                  TOTP secret gen/verify, AES-256-GCM encryption at rest
├── rbac.constants.ts             12 roles, baseline permissions, role→permission grants
├── rbac.service.ts               Permission-check helper, role-assignment workflow
├── email.port.ts                 Email-delivery port + dev/test/prod-failsafe adapters
├── auth.repository.ts            Prisma data access (no business logic)
├── registration.service.ts
├── login.service.ts
├── session.service.ts            Issue/rotate/revoke sessions & tokens
├── email-verification.service.ts
├── password-reset.service.ts
├── mfa.service.ts
├── auth-rate-limit.middleware.ts  Per-route stricter rate limits
├── auth.controller.ts
├── mfa.controller.ts
├── session.controller.ts
├── me.controller.ts
└── admin-identity.controller.ts   Role-assignment endpoint (API only, no admin UI)
```

Plus two shared middlewares (following the existing
`backend/src/middlewares/` convention, not nested under `auth/`):
`authenticate.middleware.ts` (verifies the access token, attaches
`req.user`) and `authorize.middleware.ts` (`requirePermission`/`requireRole`).

## 2. Request flow

```
Client → Express app.ts (Phase 2: helmet/cors/rate-limit/request-id/logging)
       → routes/v1/auth.routes.ts (per-route rate limiter → validate() → [authenticate] → [authorize] → controller)
       → controller (thin — no business logic, only req/res shaping)
       → service (business logic, transactions, audit events)
       → auth.repository.ts (Prisma access)
       → database/transaction.ts / database/db-error.ts (Phase 3 shared infrastructure)
```

Every layer reuses Phase 1–3 shared infrastructure rather than building
parallel mechanisms: `AppError`, `buildSuccessResponse`, `asyncHandler`,
`withTransaction`, `normalizeDatabaseError`, `recordAuditEvent`,
`beginIdempotentOperation`, `redact`. No new response envelope, error
class, or transaction pattern was invented for auth.

## 3. Why email + password only (Phase 4 scope decision)

003 FR-007 requires "an architecture ready to add" mobile OTP,
Google/Apple OAuth, and future SSO — not that all of them ship in this
phase. Building OAuth against real Google/Apple credentials or SMS OTP
against a real SMS gateway would require provider accounts this
environment does not have configured; faking them would violate the
brief's own "Do not integrate a real email vendor unless already
configured" principle extended to its logical conclusion for every
external provider. `Credential.type` is modeled as an enum
(`PASSWORD | GOOGLE | APPLE | OTP_MOBILE`) specifically so adding a real
provider later is an additive change, not a schema migration that
touches existing rows.

## 4. Token strategy summary

See `docs/auth/SESSION_TOKEN_STRATEGY.md` for full detail. Short-lived
signed JWT access tokens (role claims embedded, no DB hit per request)
+ long-lived, hashed, rotating refresh tokens stored as the live state
of a `Session` row (no separate `RefreshToken` table — see the model
comment in `schema.prisma`).

## 5. RBAC summary

See `docs/auth/RBAC_MATRIX.md`. Deny-by-default; permission checks
resolve purely from the access token's embedded `roles` claim against
the static `ROLE_PERMISSION_GRANTS` map — no per-request database
lookup for authorization decisions (a deliberate trade-off, documented
in `auth.types.ts`: a role change takes effect on the user's next token
refresh, not mid-token-lifetime).

## 6. What Phase 4 deliberately did NOT build

- Onboarding, roadmap generation, member dashboard (003 US2/US4) — out
  of this phase's scope by the brief's own constraints.
- Full profile management (username system, photo upload, visibility
  controls — 003's own "Phase D2").
- Admin UI of any kind (list/detail screens) — role-assignment exists
  only as a backend API.
- Mobile OTP, Google/Apple OAuth, passwordless magic links.
- Account deletion/export/deactivation (needs 009/007 financial data
  not yet built — see `docs/auth/DECISION_GATES.md`).

None of these were silently skipped — each is recorded in
`docs/auth/TRACEABILITY.md` with its specific reason.
