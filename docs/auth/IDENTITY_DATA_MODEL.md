# Identity Data Model

Status: **Implemented** — see `database/prisma/schema.prisma`'s Phase 4
section for the authoritative field-by-field definitions and citations;
this document is the narrative/relationship overview.

## Entity-relationship summary

```
User (1) ──── (1) UserProfile         private identity vs public profile (FR-002/FR-070)
User (1) ──── (N) Credential           one row per login method (password today)
User (1) ──── (N) Session              one row per device/session, IS the refresh-token state
User (1) ──── (N) UserRole ──── (N) Role ──── (N) RolePermission ──── (N) Permission
User (1) ──── (0/1) MfaCredential      TOTP secret (encrypted), enabled flag
User (1) ──── (N) RecoveryCode         hashed, batched (regenerate invalidates old batch)
User (1) ──── (N) PasswordResetToken   hashed, single-use, expiring
User (1) ──── (N) EmailVerificationToken  hashed, single-use, expiring
User (1) ──── (N) LoginAttempt          operational rate-limit/lockout data
```

`AuditEvent` (Phase 3, shared) records every significant auth action —
not modeled as a relation (deliberately decoupled, see
`docs/database/AUDITABILITY.md`).

## Why `User` and not a separate `Account`

003's own Key Entities describe `User` as "the root account record" —
Phase 4's `User` model IS that account root (private/auth fields:
email, status, lockout counters, mfaEnabled). There is no separate
`Account` model because it would duplicate `User` with no distinct
field set — see `Phase 4 brief §2`'s own model list framing ("only when
required by the specification").

## Why `UserProfile` is minimal

FR-002/FR-070 require private-vs-public separation, which `UserProfile`
provides (`displayName`, `username`) — but the FULL public-profile field
set (photo, bio, headline, skills, social links, achievements) belongs
to 003/tasks.md's own "Phase D2: Profile Management" supplementary
phase, explicitly out of Phase 4's auth/identity/RBAC mandate. Adding
those fields now would be building ahead of the phase that owns them.

## Why `Credential` is separate from `User`

Lets a user hold multiple login methods against one identity (FR-001)
without denormalizing auth-method-specific fields onto `User` itself.
Today only `type = PASSWORD` is populated; `providerSubject` is reserved
for a future OAuth provider's subject ID.

## Why `Session` holds the refresh token directly (no `RefreshToken` table)

A session's current refresh token IS its live rotation state — there is
never a need to query "all refresh tokens for a session" independent of
the session record itself. `tokenFamily` groups every token a single
session has ever rotated through; reuse of a stale token revokes the
whole family. See `docs/auth/SESSION_TOKEN_STRATEGY.md`.

## Why `LoginAttempt` is separate from `AuditEvent`

`AuditEvent` (Phase 3) is the permanent, immutable compliance trail.
`LoginAttempt` is short-lived operational data purely for the
rolling-window lockout calculation — different retention lifecycle,
different consumer (a lockout check, not a compliance audit), hence a
separate table rather than overloading `AuditEvent`'s semantics.

## Unique constraints and indexes (duplicate-prevention, Phase 4 brief §2)

| Constraint | Prevents |
| --- | --- |
| `User.email` unique | Two accounts with the same email |
| `UserProfile.userId` unique | A user having more than one profile |
| `UserProfile.username` unique | Two users claiming the same username |
| `Credential(userId, type)` unique | A user having two password credentials |
| `Session.refreshTokenHash` unique | Two sessions sharing a refresh token |
| `Role.name` unique | Duplicate role definitions |
| `Permission.key` unique | Duplicate permission definitions |
| `RolePermission(roleId, permissionId)` PK | A role holding the same permission twice |
| `UserRole(userId, roleId)` PK | A user holding the same role twice |
| `PasswordResetToken.tokenHash` / `EmailVerificationToken.tokenHash` unique | Token collision |
| `MfaCredential.userId` unique | Two MFA configurations for one user |

## Timestamps

Every model uses `createdAt` (all) and `updatedAt` (mutable models
only — `@updatedAt`), `Timestamptz(6)`, matching
`docs/database/ARCHITECTURE.md` §1's established convention. Immutable
event-log-shaped models (`LoginAttempt`) intentionally have no
`updatedAt`, mirroring `AuditEvent`'s own immutable-by-design pattern
from Phase 3.
