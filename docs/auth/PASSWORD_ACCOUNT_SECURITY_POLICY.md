# Password and Account Security Policy

Status: **Implemented** for everything below except where marked deferred.

## Password hashing

Argon2id (`argon2` npm package, native binding — confirmed working in
this environment by direct testing), parameters: `memoryCost=19456`
(~19MB), `timeCost=2`, `parallelism=1` — argon2's own recommended
interactive-login minimums, not invented values. Resolves 003/plan.md's
own `NEEDS CLARIFICATION` on which "approved adaptive hashing algorithm"
(FR-138) to use.

## Password policy (FR-013/FR-014)

| Rule | Standard users | Staff (`strict: true`) |
| --- | --- | --- |
| Minimum length | 8 | 12 |
| Requires a letter | Yes | Yes (upper AND lower) |
| Requires a number | Yes | Yes |
| Requires a special character | No | Yes |
| Rejects common compromised passwords | Yes (offline list) | Yes |
| Rejects password = email or name | Yes | Yes |
| Rejects breached passwords (external check) | **Deferred** — no breach-check provider configured | **Deferred** |

The "strict" staff policy is available (`validatePasswordPolicy(pw, {
strict: true })`) but not yet wired to auto-apply based on role — the
registration/reset flows currently apply the standard policy uniformly;
enforcing the strict policy specifically for staff-role accounts is a
follow-up wiring task, not a missing capability (see
`docs/auth/DECISION_GATES.md`).

## Account lockout (FR-062's repeated-failures signal)

- Threshold: `AUTH_LOGIN_LOCKOUT_THRESHOLD` (default 5 consecutive
  failed attempts).
- Duration: `AUTH_LOGIN_LOCKOUT_DURATION_MIN` (default 15 minutes).
- The counter resets to zero on any successful login.
- Locking is per-account (by email), not per-IP — IP-based throttling is
  provided separately by the route-level rate limiters
  (`auth-rate-limit.middleware.ts`).

## Account states

`PENDING_VERIFICATION → ACTIVE → {LOCKED, SUSPENDED, DEACTIVATED} → DELETED`
(soft-delete via `deletedAt`, per `docs/database/ARCHITECTURE.md` §9's
standard, distinct from the `status` enum). See
`docs/auth/TRACEABILITY.md` FR-064 for exactly which of 003's 10 named
states are implemented vs. deferred.

## Session revocation on password change

- Standard users: sessions are revoked on every successful password
  reset (Phase 4's chosen default — see
  `docs/auth/DECISION_GATES.md` for why the "configurable" option in
  FR-046 was not built as a separate toggle).
- MFA-mandatory roles (`finance_admin`/`platform_admin`/`super_admin`):
  unconditional full revocation, per FR-047 — cannot be configured off.

## MFA requirement

Mandatory for `finance_admin`, `platform_admin`, `super_admin` (003
FR-050). Login itself succeeds (a session is still issued — there would
be no way to reach the enrollment endpoint, which itself requires a
valid session, otherwise), but the login response carries
`mfaSetupRequired: true` whenever a privileged-role user has not yet
enabled MFA (`login.service.ts`), so the caller can force the
enrollment flow before allowing any further privileged action.
**Partial**: this is a signal, not yet a hard server-side block on
privileged *endpoints* themselves (e.g. `payment.refund`-gated routes
do not yet separately check `mfaSetupRequired`) — see
`docs/auth/DECISION_GATES.md` for the stronger endpoint-level gate this
is a stepping stone toward.

## Deferred (not implemented)

- Breach-corpus password checking (needs an external service).
- IP/geo-based risk signals beyond simple failed-attempt counting.
- Hard endpoint-level MFA-incomplete block for privileged actions
  (currently a response-level signal only — see above).
