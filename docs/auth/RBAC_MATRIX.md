# RBAC and Permission Matrix

Status: **Implemented**. Canonical owner: 001-product-vision-governance
(FR-084–FR-089); 003 explicitly reuses this rather than redefining it
(003 FR-067/FR-068, 003/tasks.md T009).

## The 12 roles

| Role (machine name) | Source | Tier |
| --- | --- | --- |
| `guest` | 001 FR-084 | Consumer |
| `registered_free_user` | 001 FR-084 | Consumer |
| `paid_member` | 001 FR-084 | Consumer |
| `course_instructor` | 001 FR-085 | Operational |
| `mentor` | 001 FR-085 | Operational |
| `community_moderator` | 001 FR-085 | Operational |
| `support_agent` | 001 FR-085 | Operational |
| `content_manager` | 001 FR-085 | Operational |
| `finance_admin` | 001 FR-086 | Administrative — **MFA mandatory** |
| `platform_admin` | 001 FR-086 | Administrative — **MFA mandatory** |
| `super_admin` | 001 FR-086 | Administrative — **MFA mandatory** |
| `organization_admin` | 001 FR-086 | Administrative |

`registered_free_user` is the default role assigned at registration
(Phase 4 brief §3: "Do not automatically grant admin privileges").

## Baseline permission catalog (deliberately minimal)

Per the brief's own "do not invent dozens of placeholder permissions,"
only permissions with a direct spec citation exist:

| Permission key | Citation |
| --- | --- |
| `course.view` | 003 FR-068 example |
| `course.create` | 003 FR-068 example |
| `course.publish` | 001 Key Entities example |
| `community.moderate` | 003 FR-068 example |
| `payment.refund` | 003 FR-068 / 001 example |
| `user.suspend` | 003 FR-068 example |
| `user.role.assign` | 003 FR-130 (role-change workflow needs its own permission) |
| `ticket.manage` | 001 US3 acceptance scenario 3 |
| `organization.manage_own` | 001 FR-086 |

Every future feature adds its own `resource.action` permissions as it
is built, following this same naming convention — this catalog is not
meant to be exhaustive ahead of time.

## Grant matrix

| Role | Granted permissions |
| --- | --- |
| `guest` | *(none)* |
| `registered_free_user` | `course.view` |
| `paid_member` | `course.view` |
| `course_instructor` | `course.view`, `course.create` |
| `mentor` | `course.view` |
| `community_moderator` | `course.view`, `community.moderate` |
| `support_agent` | `course.view`, `ticket.manage` |
| `content_manager` | `course.view`, `course.create`, `course.publish` |
| `finance_admin` | `course.view`, `payment.refund` |
| `platform_admin` | `course.view`, `course.create`, `course.publish`, `community.moderate`, `payment.refund`, `user.suspend`, `user.role.assign`, `ticket.manage` |
| `super_admin` | *(all baseline permissions — 001 FR-086: "full platform access")* |
| `organization_admin` | `course.view`, `organization.manage_own` |

## Enforcement model

- **Deny-by-default**: `roleHasPermission()` returns `false` for any
  role/permission pair not explicitly listed above — there is no
  implicit-allow branch anywhere in `rbac.service.ts`.
- **Backend-only**: every protected route uses
  `authenticate` → `requirePermission(...)`/`requireRole(...)` — no
  authorization decision is ever made client-side (001 FR-087,
  Constitution Article I).
- **Specific denial reason**: `requirePermission`/`requireRole` return
  `AppError.forbidden('permission denied')` — one of 001 FR-089's
  7 named denial reasons (the others — login required, membership
  required, purchase required, access expired, account suspended,
  content unavailable — are emitted by other checks earlier in each
  flow, e.g. `AUTH_ACCOUNT_SUSPENDED`).
- **No self-escalation**: `assignRole()` rejects `actorId === targetUserId`
  unconditionally, before even checking the permission grant — an actor
  can never change their own role regardless of what permission they hold.
- **Audit trail**: every successful role assignment writes an
  `AuditEvent` (`auth.role.assigned`) including the reason (mandatory,
  validated at the schema level) and the actor. A `super_admin` grant
  additionally logs `auth.role.super_admin_grant_attempted` before the
  assignment, flagging the still-open dual-approval decision gate (see
  `docs/auth/DECISION_GATES.md`).

## What is deferred

- **Dual-approval workflow for `super_admin` grants** (003 FR-130's
  "recommended") — no approval-workflow infrastructure exists yet to
  build a second-approver flow against; the single-actor path (with the
  extra audit marker above) is implemented instead.
- **Resource-ownership-based authorization** (e.g., "a course instructor
  may only edit courses they are assigned to," 001 US3 acceptance
  scenario 2) — this requires the owning feature's own data model
  (Course.instructorId) and is implemented by that feature when built,
  not retrofitted here.
- **Organization-scoped data filtering** (001 US3 acceptance scenario 4:
  "Organization Admin sees only their own organization's data") — no
  `Organization` model exists (multi-tenancy remains Phase 3's confirmed
  decision gate); `organization_admin` exists as a role today with no
  org-scoping enforcement behind it yet.
