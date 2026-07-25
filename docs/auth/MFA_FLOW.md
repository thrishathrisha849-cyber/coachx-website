# MFA Flow

Status: **Implemented** — TOTP (authenticator app) + recovery codes
only. See `docs/auth/TRACEABILITY.md` for why SMS/email-OTP-as-2FA
methods are deferred (no SMS/email provider configured) — this is a
scoping decision, not an unresolved "which method" gate: 003 FR-051
explicitly names authenticator-app TOTP as "preferred," and it is the
one method requiring no external provider.

## Enrollment (FR-052)

```
1. POST /auth/mfa/enroll { password }   [authenticated]
     - re-verifies the current password (defense against a hijacked
       but-not-fully-compromised session enabling MFA on the attacker's
       own device)
     - generates a new TOTP secret, encrypts it (AES-256-GCM,
       MFA_ENCRYPTION_KEY), stores it — NOT yet enabled
     - returns { provisioningUri, secretBase32 } for a QR code /
       manual-entry setup — this is the ONLY time the secret is ever
       returned by the API
     - AuditEvent: auth.mfa.enrollment_started

2. POST /auth/mfa/confirm { code }   [authenticated]
     - validates the 6-digit TOTP code against the stored (encrypted)
       secret, ±1 time-step window
     - on success: enables MFA, sets User.mfaEnabled=true, generates
       10 one-time recovery codes (hashed storage, returned once)
     - AuditEvent: auth.mfa.enabled
```

## Login challenge (§9 "MFA login challenge")

```
1. POST /auth/login { email, password }
     - password verified successfully AND user.mfaEnabled=true
     - returns { mfaRequired: true, mfaChallengeToken } instead of tokens
     - mfaChallengeToken: a separate, short-lived (5 min) signed JWT,
       distinct `type` claim so it can never be used as an access token
     - AuditEvent: auth.login.mfa_challenge_issued

2. POST /auth/mfa/challenge { mfaChallengeToken, code }
     - code may be a 6-digit TOTP code OR an unused recovery code
     - on success: issues a real session (access + refresh tokens)
     - AuditEvent: auth.mfa.challenge_succeeded / auth.mfa.challenge_failed
```

## Disable (FR-054)

```
POST /auth/mfa/disable { password, code }   [authenticated]
  - requires BOTH the current password AND a valid TOTP/recovery code
  - deletes the MFA credential and all recovery codes
  - AuditEvent: auth.mfa.disabled
```

## Replay protection

- **TOTP**: `MfaCredential.lastUsedStep` records the last consumed
  30-second time-step; the same step can never be accepted twice, even
  within its own validity window.
- **Recovery codes**: one-time use, enforced by `usedAt` — a consumed
  code is never accepted again.

## Recovery codes (FR-053)

- 10 codes generated at enrollment, regenerable via
  `POST /auth/mfa/recovery-codes/regenerate` (invalidates the entire
  previous batch — enforced via a `batchId`, only the current batch's
  unused codes are ever accepted).
- Hashed storage (`RecoveryCode.codeHash`), never stored or logged
  raw — the one exception is the single API response at
  generation/confirmation time, which is the explicit purpose of a
  recovery code (the user must see it once to save it).

## What is deferred

- SMS OTP / email OTP as alternative 2FA methods (FR-051) — no
  provider configured; requires an external provider.
- Sensitive-action re-challenge (Phase 4 brief §9's "sensitive-action
  challenge") — no specific sensitive action is defined yet to gate,
  since business features (payments, refunds) aren't built.
- Hard endpoint-level block for privileged-role users who haven't
  completed MFA setup — currently a `mfaSetupRequired` response flag
  only, see `docs/auth/PASSWORD_ACCOUNT_SECURITY_POLICY.md`.
