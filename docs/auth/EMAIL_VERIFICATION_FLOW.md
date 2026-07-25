# Email Verification Flow

Status: **Implemented** (backend). The verification screen itself
(masked email, countdown, resend button — 003 FR-025) is a frontend
task, not built in this backend-only phase.

## Sequence

```
1. POST /auth/register → account created (status=PENDING_VERIFICATION)
                         → EmailVerificationToken row created (hash only)
                         → getEmailAdapter().send(verification email with raw token)
2. User clicks the link / submits the token
3. POST /auth/verify-email { token } →
     - looks up by hash(token)
     - rejects: not found / already used / expired
     - marks token used, sets User.emailVerifiedAt + status=ACTIVE
     - AuditEvent: auth.email.verified
4. POST /auth/resend-verification { email } — enumeration-safe:
     - silently no-ops for a nonexistent OR already-verified account
     - cooldown: 1 minute between resends
     - daily limit: 5 resends
     - AuditEvent: auth.email.verification_resent
```

## Token properties

- 256-bit cryptographically random (`generateSecureToken()`).
- Only the SHA-256 hash is stored (`EmailVerificationToken.tokenHash`).
- Expiry: `AUTH_EMAIL_VERIFICATION_TOKEN_TTL_HOURS` (default 24 hours).
- Single-use: `usedAt` set on consumption; a second attempt is rejected
  with `AUTH_TOKEN_ALREADY_USED`.

## Email delivery

Routed through `email.port.ts`'s `EmailPort` interface — see
`docs/auth/ARCHITECTURE.md` §3 and the `email.port.ts` source. In this
environment (`NODE_ENV != production`), the dev adapter logs the
message (including the raw token, deliberately, so a developer can
complete the flow without a real inbox) instead of delivering it
anywhere real. **Requires an external provider**: production delivery
needs a real email/SMS platform wired into `getEmailAdapter()` —
003/spec.md's own Assumptions defer this to "a shared communications
platform" (Volume 14) not yet built; until then, `NODE_ENV=production`
with no adapter configured FAILS LOUDLY (throws) rather than faking a
successful send.
