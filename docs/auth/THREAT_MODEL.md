# Threat Model

Status: a focused review against the 10 threats the Phase 4 brief §13
names explicitly, plus the broader control checklist. Each entry states
the concrete mitigation and its actual implementation, or names the gap
honestly rather than claiming coverage that doesn't exist.

## 1. Brute-force login

**Mitigated.** Two independent layers: (a) `loginRateLimiter` — 10
attempts / 15 minutes per IP (`auth-rate-limit.middleware.ts`); (b)
per-account lockout — `AUTH_LOGIN_LOCKOUT_THRESHOLD` (default 5) failed
attempts locks the account for `AUTH_LOGIN_LOCKOUT_DURATION_MIN`
(default 15 min), independent of the caller's IP. Verified by an
integration test (`login.integration` "locks the account after
repeated failed attempts").

## 2. Credential stuffing

**Partially mitigated.** The same rate limit/lockout layers raise the
cost of a stuffing attack, but there is no CAPTCHA, no known-breached-
credential check (FR-019's breach-checking is deferred — no external
provider configured), and no distributed-attack/IP-reputation signal.
Documented as a real, not-fully-closed gap in
`docs/auth/DECISION_GATES.md`.

## 3. Token theft

**Mitigated for the transport/storage properties within this phase's
control.** Access tokens are short-lived (15 min default) to bound the
damage window of a stolen token. Refresh tokens are never stored raw
(SHA-256 hash only) — a database compromise does not directly yield
usable refresh tokens. TOTP secrets are encrypted at rest
(AES-256-GCM). **Not mitigated here**: XSS-based token theft from a
browser client is a frontend concern (no frontend auth UI exists yet in
this backend-only phase) — see `docs/auth/ARCHITECTURE.md` §4's token-
transport note.

## 4. Refresh replay

**Mitigated.** Rotation-with-reuse-detection: presenting an
already-superseded refresh token revokes the ENTIRE token family, not
just that token — verified directly by an integration test ("detects
reuse of a revoked/already-rotated-past token and revokes the whole
session family"). See `docs/auth/SESSION_TOKEN_STRATEGY.md`.

## 5. Privilege escalation

**Mitigated for the two concrete vectors in scope.** (a) Self-escalation:
`assignRole()` unconditionally rejects `actorId === targetUserId` before
even checking the permission grant — verified by an integration test.
(b) Unauthorized role assignment: gated by `requirePermission('user.role.assign')`,
deny-by-default. **Gap**: no dual-approval workflow yet for
`super_admin` grants (003 FR-130's own "recommended," not "required") —
see `docs/auth/DECISION_GATES.md`.

## 6. IDOR (Insecure Direct Object Reference)

**Mitigated for session management**, the one resource-ownership check
Phase 4 builds: `DELETE /auth/sessions/:sessionId` verifies
`session.userId === req.user.id` before revoking, returning 404 (not
403, to avoid confirming the session ID's existence to a non-owner) —
verified directly by an integration test ("rejects revoking another
user's session"). Every other resource-ownership check belongs to the
feature that owns that resource, not built here.

## 7. Reset-token abuse

**Mitigated.** Single-use (`usedAt` check), time-limited (30 min
default), cryptographically random, hashed storage, rate-limited
requests (3/15min per account), and enumeration-safe (identical
response for a match vs. non-match) — verified by integration tests
covering reuse rejection and the enumeration-safety invariant.

## 8. Verification-token abuse

**Mitigated.** Same properties as reset tokens: single-use, expiring
(24h default), hashed storage, resend rate-limited (cooldown + daily
cap), enumeration-safe resend endpoint.

## 9. MFA bypass

**Mitigated for the implemented attack surface.** TOTP replay is
blocked via `lastUsedStep`; recovery codes are one-time-use; the MFA
challenge token has its own distinct `type` claim so an access token
can never be substituted for it (or vice versa) — verified by unit
tests. **Gap**: no hard endpoint-level block yet forces a
privileged-role user with `mfaSetupRequired: true` to complete
enrollment before using privileged endpoints (currently a response
signal only) — see `docs/auth/DECISION_GATES.md`.

## 10. Session fixation

**Mitigated by design, not by an explicit fixation-specific check.**
Every session is server-generated at login time (`issueSession()`
creates a brand-new `Session` row with a fresh, server-generated
`tokenFamily`) — there is no code path anywhere that accepts a
client-supplied session/token identifier and adopts it as a live
session. Classic fixation (attacker pre-sets a victim's session ID)
is structurally not possible in a bearer-token-issued-only-by-the-server
design; there is no session-ID-in-URL or client-settable-cookie
mechanism to fixate.

## Additional controls verified

- **Account enumeration**: identical responses for login failure
  (nonexistent email vs. wrong password) and forgot-password (match vs.
  non-match) — both verified directly by integration tests comparing
  response bodies byte-for-byte.
- **Constant-time comparison**: password verification via argon2's own
  internal constant-time compare; `constantTimeEquals()` utility
  available for any future direct-token-comparison need.
- **No secrets in logs/audit/responses**: verified by dedicated tests —
  `/me` never returns a password hash or MFA secret; `AuditEvent` rows
  for registration never contain the raw password; `redact.ts` (Phase 3,
  extended this phase) scrubs credential-shaped strings from any log
  line regardless of key name.
- **CORS/secure headers**: inherited from Phase 2's `app.ts` (Helmet,
  CORS allowlist) — unchanged by this phase.
- **No secrets committed**: verified — see the final Phase 4 report's
  git-status/secrets-scan section.
