# Authentication API Reference

Status: **Implemented**. Base path: `<API_PREFIX>/v1` (default `/api/v1`).
Standard response envelope throughout (`@coachx/shared`'s
`buildSuccessResponse`/`buildErrorResponse` — `{ success, data }` /
`{ success: false, error: { code, message, details? } }`), correlation
ID on every response via the `X-Request-Id` header (Phase 2).

## Public (unauthenticated)

| Method | Path | Rate limit | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | 5 / hour | 003 FR-008/FR-011 |
| POST | `/auth/login` | 10 / 15 min | 003 FR-037 |
| POST | `/auth/refresh` | app-wide only | 003 FR-056 |
| POST | `/auth/verify-email` | app-wide only | 003 FR-024 |
| POST | `/auth/resend-verification` | 5 / 15 min | 003 FR-026 |
| POST | `/auth/forgot-password` | 5 / 15 min | 003 FR-043 |
| POST | `/auth/reset-password` | app-wide only | 003 FR-045 |
| POST | `/auth/mfa/challenge` | 10 / 15 min | 003 §9 |

## Authenticated (`Authorization: Bearer <accessToken>`)

| Method | Path | Additional guard | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/logout` | — | 003 FR-059 (current session) |
| POST | `/auth/logout-all` | — | 003 FR-059 (all sessions) |
| POST | `/auth/mfa/enroll` | rate-limited | 003 FR-052 step 1 |
| POST | `/auth/mfa/confirm` | rate-limited | 003 FR-052 step 2 |
| POST | `/auth/mfa/disable` | — | 003 FR-054 |
| POST | `/auth/mfa/recovery-codes/regenerate` | — | 003 FR-053 |
| GET | `/auth/sessions` | — | 003 FR-060 |
| DELETE | `/auth/sessions/:sessionId` | ownership-checked | 003 FR-061 |
| GET | `/me` | — | current user's identity summary |
| PATCH | `/admin/users/:userId/role` | `requirePermission('user.role.assign')` | 003 FR-130 |

## Endpoints named by the Phase 4 brief but NOT built

`/auth/logout` and `/auth/logout-all` above cover the brief's listed
group; `mfa/*` and `sessions` likewise. Not built: any mobile-OTP or
social-login endpoint (deferred, see `docs/auth/TRACEABILITY.md`) — the
brief's own instruction was "Do not blindly create every listed
endpoint. Create only those supported by Feature 003," and Phase 4's
scope decision was email+password only.

## Request/response shape examples

**POST /auth/register**
```json
// Request
{ "name": "Jane Doe", "email": "jane@example.com", "password": "GoodPassword1", "confirmPassword": "GoodPassword1", "acceptedTerms": true }
// 201 Response
{ "success": true, "data": { "userId": "...", "email": "jane@example.com", "status": "PENDING_VERIFICATION", "verificationRequired": true } }
```

**POST /auth/login**
```json
// 200 Response (no MFA)
{ "success": true, "data": { "accessToken": "...", "refreshToken": "...", "expiresAt": "...", "mfaSetupRequired": false } }
// 200 Response (MFA enabled)
{ "success": true, "data": { "mfaRequired": true, "mfaChallengeToken": "..." } }
```

**Error shape** (every failure mode)
```json
{ "success": false, "error": { "code": "AUTH_INVALID_CREDENTIALS", "message": "Invalid email or password" } }
```

See `backend/src/auth/auth-error-codes.ts` for the full code list and
`backend/src/auth/auth.validation.ts` for exact request-body schemas.
