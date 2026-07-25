# Password Reset Flow

Status: **Implemented** (backend). The reset request/confirmation
screens are frontend tasks, not built in this phase.

## Sequence

```
1. POST /auth/forgot-password { email }
     - identical response whether or not the email matches an account
       (enumeration-safe, SC-003) — silent no-op internally for a
       non-match, but the HTTP response is byte-for-byte the same
     - rate limit: 3 requests / 15 minutes per account (also serves as
       the enumeration-safe "no-op" path when exceeded)
     - PasswordResetToken row created (hash only) + email sent
     - AuditEvent: auth.password_reset.requested

2. POST /auth/reset-password { token, newPassword, confirmNewPassword }
     - looks up by hash(token); rejects not-found / used / expired
     - validates newPassword against the password policy
     - updates Credential.passwordHash, resets User.failedLoginCount/lockedUntil
     - AuditEvent: auth.password_reset.completed
     - revokes ALL of the user's sessions (unconditional for MFA-mandatory
       roles per FR-047; applied to every user in this phase — see
       docs/auth/DECISION_GATES.md)
     - sends a "your password was changed" security notification email
```

## Token properties

Identical security properties to the email-verification token (256-bit
random, SHA-256-hashed storage, single-use, expiring —
`AUTH_PASSWORD_RESET_TOKEN_TTL_MIN`, default 30 minutes).

## Enumeration safety (SC-003)

Verified directly by an integration test
(`auth.integration.test.ts`, "returns an identical response for an
existing and a nonexistent email") — both requests return `{ message:
"If an account matches this email, password reset instructions were
sent." }` with the same status code, regardless of match.

## What is deferred

- A distinct, separately-configurable "revoke sessions on reset" policy
  toggle for standard (non-staff) users — FR-046 describes this as
  "configurable"; Phase 4 applies the safer always-revoke default
  uniformly instead of building an unused admin-configurable toggle with
  no admin console to configure it through. See
  `docs/auth/DECISION_GATES.md`.
