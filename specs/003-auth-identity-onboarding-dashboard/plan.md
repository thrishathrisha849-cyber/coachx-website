# Implementation Plan: Authentication, Identity, Onboarding, Personalization & Member Dashboard

**Branch**: `003-auth-identity-onboarding-dashboard` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-auth-identity-onboarding-dashboard/spec.md`

## Summary

This feature builds the platform's actual authentication mechanics (signup/login/OTP/social/2FA/session/device management/recovery), the private-vs-public identity split, the 13-step onboarding sequence and its AI-or-deterministic-fallback roadmap generator, and the member dashboard — the single highest-frequency authenticated surface on the platform, aggregating state from nearly every other feature.

It **extends `001-product-vision-governance`'s already-built RBAC module directly** rather than re-defining roles: 001 already seeded the 12-role set (`backend/src/modules/rbac/seed/roles.seed.ts`) and built the `RbacGuard`; this feature adds the authentication mechanics that *populate* sessions with a verified identity for that guard to authorize, plus the specific role-change/account-merge admin workflows this volume describes. It **extends `002`'s Consent Record and audit-log patterns** for the account-lifecycle (deactivate/delete/export) and communication-preference requirements here. The **member dashboard is an aggregation layer**: it does not own course, community, gamification, mentor, event, marketplace, AI, or CRM data — it queries each owning feature's API and composes the priority-ordered view, with per-widget failure isolation (FR-120) as the load-bearing design constraint that makes this safe.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with `001`/`002`.

**Primary Dependencies**: NestJS (backend, extends `001`'s API), Next.js (web — new `(member)` route group pages that were scaffolded but not built out in `001`), Flutter (mobile), an adaptive password-hashing library (e.g., Argon2id — NEEDS CLARIFICATION: not named in source, "approved adaptive hashing algorithm" per FR-138), a TOTP library for authenticator-app 2FA, an SMS/OTP gateway and email provider (both explicitly deferred to a shared communications platform per spec.md Assumptions — NEEDS CLARIFICATION: which feature/vendor is not resolved here), an OAuth client library for Google/Apple Sign-In.

**Storage**: PostgreSQL (User, User Identity/Login Provider, Email/Mobile records, Password Credential, Session, Device, Two-Factor Method, Recovery Code, User Profile, Onboarding Response, Assessment/Assessment Result, Roadmap, Recommendation, User Milestone, Security Event, Account Recovery/Deletion/Export Request — all new to this feature), Redis (OTP storage — hashed, short-TTL; session/refresh-token cache; rate-limit counters for signup/login/OTP/resend).

**Testing**: Jest (backend — extensive contract tests for the enumeration-safety requirements: identical forgot-password responses, duplicate-signup messaging, generic login errors), Playwright (web e2e — full signup→onboarding→dashboard journey per SC-010), Flutter test framework (mobile — session/device management, offline dashboard behavior FR-123).

**Target Platform**: Same as `001`/`002`. Session tokens: short-lived access + rotating refresh, HTTP-only secure cookies (web), secure storage (mobile) per FR-056.

**Project Type**: Extends `001`'s multi-surface structure; adds the `(member)` route group's actual page implementations (only scaffolded as an empty group in `001`).

**Performance Goals**: Immediate loading-state feedback on auth actions and OTP acknowledgment (FR-147); dashboard renders critical content first with parallel-loaded independent widgets and a timeout-based recommendation-engine fallback (FR-148); onboarding-answer local preservation on save failure (FR-149).

**Constraints**: Exactly one primary identity per person, enforced against duplicate signup (FR-001, FR-021, SC-001); account-existence MUST NEVER be leaked via forgot-password or similar flows (FR-043, SC-003, classic enumeration-vulnerability defense); mandatory 2FA for admin/finance/super-admin/high-risk accounts (FR-050, SC-004, Constitution Security Baseline); staff password reset MUST revoke ALL sessions unconditionally (FR-047); AI roadmap generation MUST have a deterministic fallback that is never absent (FR-095, SC-002, Constitution Article II); a single failing dashboard widget MUST NOT break the rest of the dashboard (FR-120, SC-006); passwords/tokens/OTPs/recovery-codes MUST NEVER appear in audit logs or analytics (FR-144, FR-146, SC-008).

**Scale/Scope**: 13 onboarding steps, 4+ initial auth methods (email/OTP/Google/Apple), 12 roles (reused from 001), 10 account statuses, 10-tier dashboard priority order, 18 dashboard widget types, 27 core data entities (FR-155).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Every protected action verified backend-side; frontend hiding a control is never authorization | **PASS** | FR-004, reuses 001's RbacGuard |
| II. AI Is Assistive, Never Autonomous | Roadmap generation may use AI but MUST have deterministic fallback | **PASS** | FR-095, SC-002 — directly implements this article |
| III. No Dark Patterns | N/A — no monetization surface owned here | **PASS (N/A)** | — |
| IV. Historical Immutability | Audit log entries immutable; role changes/merges preserve history | **PASS** | FR-143, FR-131 |
| V. Ledger-Based Internal Economies | Dashboard displays gamification/milestone data but does not own the ledger | **PASS (deferred)** | FR-108 sources from `006`'s ledger per spec.md Assumptions |
| VI. Consent Is First-Class, Per-Channel, Versioned | 7 independent consent channels; security notifications cannot be disabled | **PASS** | FR-136, FR-137, extends `002`'s Consent Record entity |
| VII. Layered, Explicit RBAC | 12-role set, permission-based, audited overrides | **PASS (extends 001)** | FR-067, FR-068, FR-130 — reuses `001`'s RBAC module, does not redefine it |
| VIII. No Pay-to-Win, No Vanity Metrics | Milestones require verification source (self/system/mentor/admin); profile completion never used for public ranking | **PASS** | FR-074, FR-108 |
| IX. Action Before Consumption | Dashboard explicitly MUST NOT be a social-feed clone; one primary next-action at a time | **PASS** | FR-098, FR-102 |

No constitutional violations. No Complexity Tracking entries required for principle compliance — one structural note below.

## Project Structure

### Documentation (this feature)

```text
specs/003-auth-identity-onboarding-dashboard/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: password-hashing library choice, SMS/OTP gateway + email provider (shared comms platform not yet built), inactivity-period/session-timeout/cooling-off-period default values
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`/`002`'s structure — no new top-level projects.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── auth/                       # NEW — signup, login, OTP, social, password reset, 2FA (FR-001–FR-063)
│   │   │   ├── signup.controller.ts
│   │   │   ├── login.controller.ts
│   │   │   ├── otp.service.ts
│   │   │   ├── social-auth.service.ts
│   │   │   ├── password-reset.controller.ts
│   │   │   ├── two-factor.service.ts
│   │   │   └── session.service.ts        # session/device model (FR-055–FR-061)
│   │   ├── risk/                        # NEW — login risk evaluation + graduated response (FR-062–FR-063)
│   │   ├── identity/                    # EXTENDS 001's identity module — adds User Identity/Profile split (FR-069–FR-076)
│   │   ├── onboarding/                  # NEW — 13-step sequence, assessment, auto-save/resume (FR-077–FR-092)
│   │   ├── roadmap/                     # NEW — roadmap generation (AI + deterministic fallback) (FR-093–FR-097)
│   │   ├── dashboard/                   # NEW — aggregation layer querying 004/005/006/007/008/009/010/011/013 (FR-098–FR-125)
│   │   │   └── widgets/                  # one aggregator service per widget type, each independently failable
│   │   ├── account-lifecycle/           # NEW — deactivate/delete/export/consent-withdrawal (FR-132–FR-137)
│   │   └── admin-identity/              # NEW — admin user list/detail, role change, account merge (FR-126–FR-131)
│   └── common/                          # reused from 001: RbacGuard, EntitlementGuard, audit-log interceptor
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (member)/                        # fills in 001's scaffolded-but-empty route group
        ├── onboarding/[step]/page.tsx
        ├── dashboard/page.tsx
        └── settings/{profile,security,devices,privacy,notifications}/page.tsx
    └── (public)/
        ├── login/page.tsx
        ├── signup/page.tsx
        ├── verify/page.tsx
        └── forgot-password/page.tsx

mobile/
└── lib/features/
    ├── auth/                            # signup/login/OTP/social/2FA/session
    ├── onboarding/
    └── dashboard/                        # includes offline-mode handling (FR-123)
```

**Structure Decision**: New `auth/`, `onboarding/`, `roadmap/`, `dashboard/`, `account-lifecycle/`, `admin-identity/` backend modules alongside `001`'s existing `identity/` and `rbac/` modules (extended, not replaced). Web/mobile fill in the `(member)`/`(public)` route groups `001` scaffolded as empty shells. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |

*Structural note: the Dashboard module is unusually cross-cutting — it calls into up to 9 other features' APIs (004/005/006/007/008/009/010/011/013). This is treated as an accepted integration cost of the dashboard's stated purpose (FR-098: summarize the user's entire state in one place), not a layering violation — but it does mean dashboard work realistically cannot be feature-complete until most of those other features expose at least a minimal read API. Recommend implementing dashboard widgets incrementally as each owning feature's API becomes available, using FR-120's per-widget failure isolation to ship early with partial widget coverage rather than blocking on all 9 dependencies.*
