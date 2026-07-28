# Session and Token Strategy

Status: **Implemented** — see `backend/src/auth/session.service.ts` and
`token.util.ts` for the authoritative code.

## Access tokens

- Format: signed JWT (`jsonwebtoken`), `HS256` (HMAC with
  `JWT_ACCESS_SECRET`).
- Claims: `sub` (User.id), `sid` (Session.id), `roles` (string array),
  `type: 'access'`.
- Lifetime: `JWT_ACCESS_EXPIRES_IN` (default 15 minutes, Phase 1's
  existing default, unchanged).
- Issuer/audience validated on every verify (`JWT_ISSUER`/`JWT_AUDIENCE`).
- Transport: returned in the JSON response body, sent by the client via
  `Authorization: Bearer <token>` — **not** a cookie. This is a
  deliberate choice for an API-first backend serving both a web SPA and
  a future mobile app identically (no cookie-vs-native-storage split
  logic needed); CSRF protection is therefore not applicable (CSRF
  specifically targets cookie-based auth) — see `docs/auth/THREAT_MODEL.md`.
- Role claims are embedded so authorization checks never need a
  database round-trip — the explicit trade-off (documented in
  `auth.types.ts`) is that a role change takes effect on the user's
  NEXT token refresh, not instantly mid-token-lifetime (bounded by the
  15-minute access-token TTL).

## Refresh tokens

- A cryptographically random 256-bit value (`secure-token.util.ts`),
  returned to the client once; only its SHA-256 hash is ever persisted
  (`Session.refreshTokenHash`).
- Each `Session` row is the rotation state for ONE refresh token within
  a device/session's lineage — there is no separate `RefreshToken`
  table (see the model comment in `schema.prisma`). A device/session's
  full lineage is its `tokenFamily` (a stable UUID shared across every
  row produced by rotating that session forward).
- **Rotation**: every `/auth/refresh` call issues a brand-new refresh
  token, marks the PRESENTED row `revoked` (reason
  `refresh_token_rotated`, hash left untouched), and creates a NEW
  `Session` row in the same `tokenFamily` holding the new hash. Rotation
  deliberately does NOT overwrite `refreshTokenHash` in place — doing so
  would make the old hash unmatchable by any future lookup, so a replay
  of the old token would fall into "no session found" rather than "found
  or, but revoked," and reuse detection below would never actually fire.
- **Reuse detection**: if a presented refresh token's hash matches a
  row that is already `revoked` (i.e. a token from earlier in the
  family's rotation lineage, already superseded), the ENTIRE
  `tokenFamily` is revoked — not just the specific token — committed in
  its own transaction before the request fails, so the revocation is
  never rolled back by the error response that follows it. This is the
  "a stolen or reused refresh token must not remain valid indefinitely"
  requirement: even a legitimately-rotated-forward token from the same
  family becomes invalid the moment reuse of an earlier token in that
  family is detected, forcing a fresh login. If the presented hash
  matches no row at all (never valid, or valid so long ago its row was
  itself since revoked by a family-wide revoke), the request is rejected
  generically — there is no family to identify or revoke in that case.
- Lifetime: `JWT_REFRESH_EXPIRES_IN` (default 7 days, Phase 1's existing
  default, unchanged).

## Session lifecycle

| Action | Effect |
| --- | --- |
| Login / register (post-verification) | New `Session` row, new token family |
| `/auth/refresh` | Revokes the presented row, creates a new row in the same family |
| `/auth/logout` | Revokes the current session (`req.user.sessionId`) only |
| `/auth/logout-all` | Revokes every active session for the user |
| `DELETE /auth/sessions/:id` | Revokes a specific session, ownership-checked (IDOR-safe) |
| Password reset | Revokes ALL sessions (unconditional for MFA-mandatory roles per FR-047; Phase 4 applies this to every user as the safer default — see `docs/auth/DECISION_GATES.md`) |
| Refresh-token reuse detected | Revokes the entire token family |
| Concurrent-session ceiling exceeded | Oldest active session evicted (`MAX_CONCURRENT_SESSIONS = 10`) |

## What is deferred

- **Admin-configurable session limits by role/organization policy**
  (FR-058's full scope) — a fixed platform-wide ceiling is enforced
  instead; no admin console exists yet to configure a per-role policy
  through.
- **Precise device/location metadata** beyond User-Agent and IP — FR-055
  lists "approximate location," which needs a geo-IP provider not
  configured in this phase.
- **Secure httpOnly cookie transport** — not used; see the access-token
  transport note above. If a future requirement mandates cookie-based
  web auth, CSRF protection would need to be added at that point (not
  needed today).
