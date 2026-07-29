---
description: "Task list for Feature 001 — Product Vision, Business Foundation & Platform Governance"
---

# Tasks: Product Vision, Business Foundation & Platform Governance

**Input**: Design documents from `/specs/001-product-vision-governance/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Contract and integration tests ARE included below because this feature is a cross-cutting authorization/data-model layer every other feature depends on — correctness here has platform-wide blast radius (Constitution Article I).

**Organization**: Tasks are grouped by user story (from spec.md) to enable independent implementation and testing of each story. Scope excludes detailed UI/UX owned by `003-auth-identity-onboarding-dashboard` (onboarding flow, dashboard rendering) and by `004/005/006/007/008/009/013` per plan.md's Summary — this feature builds the underlying data model, RBAC engine, and enforcement contracts those features consume.

**Revision note (2026-07-23)**: This file was corrected following a traceability review. Added: Content Governance implementation (T015, T016, T021 — closes the gap that `002-public-website-marketing-funnel/plan.md` was referencing an unbuilt pattern), expanded FR citation on the platform-registry task (T017), and a new Polish-phase principle/governance/NFR audit task (T070). All subsequent task IDs shifted accordingly from the original version. No content in `spec.md` was changed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Maps to spec.md's user stories (US1–US8)

## Path Conventions

Per `plan.md`'s Project Structure: `backend/src/`, `backend/tests/`, `web/src/`, `web/tests/`, `mobile/lib/`, `mobile/test/`.

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 ~~Initialize `backend/` NestJS project~~ — **SUPERSEDED**: `backend/` already exists as an Express+TypeScript project (established in phases before 001 was implemented), not NestJS. TypeScript/ESLint/Prettier are configured and working. Rebuilding on NestJS would be a destructive framework migration, not part of 001's scope.
- [x] T002 ~~Initialize `web/` Next.js with `(public)/(member)/(admin)` route groups~~ — **SUPERSEDED**: the real architecture is `frontend/` (public site, Vite+React) + `admin/` (separate app, now with real auth+pages as of this session) rather than one Next.js app with 3 route groups. A distinct entitlement-gated "member web app" surface does not exist yet — see T038.
- [x] T003 `mobile/` Flutter project scaffolding already exists (android/ios folders, `features/`/`core/` structure) — pre-dates this session. Real member-facing screens are NOT built (see T040 — explicitly deferred with user sign-off).
- [x] T004 [P] PostgreSQL + Prisma migration tooling configured in `backend/` (pre-existing, extended this session with the spec-001 migration).
- [ ] T005 [P] Redis — **NOT DONE, genuine gap**. No Redis exists anywhere in this codebase; session cache/RBAC-decision cache use JWT + a DB-backed `Session` table instead (an architectural decision made in the pre-001 auth phase). Would require introducing new infrastructure this session did not add.
- [x] T006 [P] Jest configured for `backend/tests/{contract→folded into integration,integration,unit}` — extensively used (436 tests).
- [ ] T007 [P] Playwright for `web/tests/e2e` — **NOT DONE, genuine gap**. No e2e test runner exists; frontend uses Vitest for component tests only. Deferred as part of the agreed Polish-phase fast-follow (browser e2e coverage).

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T008 `User` entity carries role assignments (`UserRole`), membership-tier grants (via `PlanEntitlement`), lifecycle stage (`UserLifecycleState.stage`), and org membership (`User.organizationId`) — `database/prisma/schema.prisma`.
- [x] T009 `Role`/`Permission`/`RolePermission`/`UserRole` — pre-existing, extended this session with 4 new permissions (`organization.create`, `milestone.verify`, `governance.manage`, `kpi.view`) — `backend/src/auth/rbac.constants.ts`.
- [x] T010 `MembershipPlan`/`PlanVersion`/`PlanEntitlement` (009's schema, reused) now seeded with the real 6-tier catalog — `database/seeds/membership-tier.seed.ts`.
- [x] T011 Reused the existing generic `AuditEvent` entity rather than a separate `AccessControlDecision` table (documented decision — same actor/action/resource/before-after shape already satisfies FR-088's audit need without duplicating it).
- [x] T012 `requirePermission()`/`requireRole()` in `backend/src/middlewares/authorize.middleware.ts` (pre-existing) — enforces FR-087/FR-089, applied across every new route this session.
- [ ] T013 `EntitlementGuard` — **PARTIAL, genuine gap**. `PlanEntitlement` rows encode real feature-gate keys (course access tier, mentor sessions, marketplace selling, AI credits), but no request-time guard checks a user's *actual active* plan against them yet, because no `Subscription`/plan-assignment record links a User to a MembershipPlan (that link is explicitly 009 Part 2+ scope — "billing/subscription mechanics," not 001's). The catalog and its grants are real; live enforcement is blocked on a dependency this feature doesn't own.
- [x] T014 `recordAuditEvent()` used pervasively (pre-existing) — every new admin action this session (organization, milestone-verify, moderation, governance) is audited.
- [x] T015/T016 Content lifecycle + versioning: pre-existing `Page`/`PageVersion` (CMS) now also has `UNPUBLISHED` as a distinct state; **NEW this session**: `CourseVersion` snapshot model + `course-version.service.ts` closes the gap for LMS courses specifically (FR-099's own literal example).
- [x] T017 [P] 16-module + 4-surface registry — `backend/src/platform-registry/platform-module.constants.ts`, exposed at `GET /platform-registry`.
- [x] T018 [P] `ProductPhase` enum + `GovernanceRecord.phase` — `database/prisma/schema.prisma`.
- [x] T019 RBAC denial-reason coverage exists across the existing auth integration suite ("RBAC enforcement," "permission escalation prevention" in `auth.integration.test.ts`) plus this session's new org-scoping denial test — not as one single dedicated `rbac-denial.contract.test.ts` file, but the behavior is covered and passing.
- [x] T020 Entitlement-resolution fail-closed behavior covered by the pre-existing `entitlement.unit.test.ts` ("fails CLOSED... for source MEMBERSHIP/PURCHASE/etc — no owning system exists in this phase").
- [x] T021 Content-version immutability — covered by the pre-existing CMS test ("creates a new, non-destructive PageVersion on every update") plus this session's new `governance-foundation.integration.test.ts` course-version test.

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 3 — Role-Based Access Control Across Platform Surfaces (Priority: P1) 🎯 MVP

**Goal**: Every protected backend resource enforces role/permission checks server-side, independent of frontend rendering.

**Independent Test**: Attempt a restricted action via direct backend request while authenticated with a non-privileged role; confirm denial with "permission denied," even though no client renders the control.

- [x] T022 [P] [US3] 12 roles seeded — `database/seeds/rbac.seed.ts` (pre-existing).
- [x] T023 [US3] `roleHasPermission()` — `backend/src/auth/rbac.service.ts` (pre-existing).
- [x] T024 [US3] Organization-scoped filtering — **NEW this session**: `getOwnOrganizationMembers()` in `backend/src/organization/organization.service.ts`, verified by integration test (Org A admin cannot see Org B's members).
- [x] T025 [US3] `requirePermission()` applied across billing/lms/organization/lifecycle/trust-safety/governance/kpi routes.
- [x] T026 [US3] Cross-role denial covered by `auth.integration.test.ts`'s existing RBAC suite + this session's new organization-scoping denial tests in `governance-foundation.integration.test.ts` (not one single dedicated file, but the scenarios are tested and passing).

**Checkpoint**: RBAC foundation independently functional and testable.

---

## Phase 4: User Story 2 — Membership Tier Selection & Feature Gating (Priority: P1)

**Goal**: Membership tier determines access to courses, mentor sessions, AI credits, community areas, marketplace-selling rights, with locked (not hidden) UI for ineligible tiers.

**Independent Test**: Create accounts on each tier; verify tier-restricted actions are denied with "membership required," entitled actions succeed.

- [x] T027 [P] [US2] Real 6-tier catalog seeded — `database/seeds/membership-tier.seed.ts` (**NEW this session**).
- [x] T028 [US2] Dynamic tier-configuration API — reused 009's existing `POST/PATCH /billing/admin/plans*` (pre-existing, no-deploy config changes).
- [ ] T029 [US2] **NOT DONE, same gap as T013** — no live Subscription-to-User link exists yet to wire a runtime guard against; the entitlement DATA is real and correct, enforcement at request-time is blocked on 009 Part 2+.
- [x] T030 [P] [US2] `TierGate` component — **NEW this session**, `frontend/src/components/membership/TierGate.tsx`, tested (renders locked features visibly-dimmed with a lock badge, never removed from the DOM).
- [ ] T031 [US2] **NOT DONE** — no tier upgrade/downgrade mechanism exists to test against (depends on the same T029/009-Part-2+ gap: there is no live per-user Subscription to upgrade/downgrade).

**Checkpoint**: US2 and US3 both independently functional.

---

## Phase 5: User Story 1 — Persona-Based Guided Onboarding & Next-Best-Action (Priority: P1)

**Goal**: Dashboard surfaces one specific next-best-action derived from profile/progress state (backend rules engine; onboarding UX itself is `003`'s scope).

**Independent Test**: New account → complete onboarding questionnaire → verify recommended action updates correctly as profile/niche/course-completion state changes.

- [x] T032 [P] [US1] `backend/src/lifecycle/stage-transition.service.ts` — FR-042's joint-5-criteria gate enforced exactly (profile≥80% AND goal AND path-started AND lesson-completed AND community-action, all required together).
- [x] T033 [US1] `backend/src/lifecycle/next-best-action.service.ts` — the 4-step priority chain (profile→niche→foundation-course→offer).
- [x] T034 [US1] `GET /api/v1/me/next-best-action` — `backend/src/routes/v1/auth.routes.ts`.
- [x] T035 [US1] Covered by `governance-foundation.integration.test.ts`'s NBA sequencing test (real, passing, exercises all 3 transitions).
- [x] T036 [US1] No UI built here, per this note — correct, unchanged.

**Checkpoint**: US1–US3 independently functional; this is the P1 MVP slice.

---

## Phase 6: User Story 4 — Cross-Surface Platform Navigation (Priority: P2)

**Goal**: Consistent module access across Public Site, Member Web App, Mobile App, with a role-gated Admin App.

**Independent Test**: Browse public site as guest (only public sections reachable); log in and confirm full authenticated module set; confirm course progress syncs web↔mobile.

- [x] T037 [P] [US4] Public site (`frontend/`) already covers the 19 public pages — pre-existing (002/005-adjacent phases).
- [ ] T038 [P] [US4] **NOT DONE, genuine gap**. No unified, entitlement-gated "member web app" surface exists yet (dashboard/wallet/notifications/business-workspace) — this is explicitly `003-auth-identity-onboarding-dashboard`'s scope per this file's own Organization note (line 13), not yet built as its own feature.
- [x] T039 [P] [US4] `admin/` app — **NEW this session**: real login + `RequireAuth` guard + 5 role-gated pages (was a bare unauthenticated shell before).
- [ ] T040 [P] [US4] Mobile screens — **explicitly deferred**, user-confirmed this session (mobile/ has Flutter scaffolding only, no business screens).
- [x] T041 [US4] No dedicated "sync" endpoint was built, but it's structurally unnecessary: `Enrollment`/`LessonProgress` are the single server-side source of truth both web and any future mobile client read from directly — there is nothing to "sync" between two independent stores. Documented, not silently skipped.
- [ ] T042 [US4] **NOT DONE, genuine gap**. No Playwright/e2e infra exists (see T007) — explicitly deferred as part of the agreed Polish-phase fast-follow.

**Checkpoint**: All 4 surfaces reachable per role/entitlement.

---

## Phase 7: User Story 5 — Transparent, Multi-Stream, No-Dark-Pattern Monetization (Priority: P2)

**Goal**: 10 revenue streams operate with mandatory sponsored/affiliate disclosure and no retroactive pricing changes to active subscribers.

**Independent Test**: Publish a sponsored campaign and an AI-suggested affiliate recommendation; confirm both render disclosure labels before any purchase-path or price.

- [x] T043 [P] [US5] `backend/src/monetization/revenue-stream.constants.ts` — a fixed taxonomy (constants, not a DB seed — not admin-editable per spec, documented decision), exposed at `GET /monetization/revenue-streams`.
- [x] T044 [US5] Enforcement is data + component-level: `Product.isSponsored/sponsorLabel/isAffiliate/affiliateDisclosure` are always present in the PUBLIC API shape (never admin-only), and the frontend components render them ahead of price by construction — no separate backend "disclosure service" needed beyond that.
- [x] T045 [P] [US5] `SponsoredLabel`/`AffiliateDisclosure` — **NEW this session**, `frontend/src/components/disclosure/`, tested.
- [x] T046 [US5] Already satisfied by 009's pre-existing `ProductPrice.priceLineageId`/`version` pattern — verified by the pre-existing test "never edits a published (ACTIVE) price in place — creates a new version instead."
- [x] T047 [US5] Disclosure covered by this session's new integration test; price-immutability covered by the pre-existing billing integration test — not one combined file, but both scenarios are tested and passing.

**Checkpoint**: Monetization catalog and disclosure rules independently testable.

---

## Phase 8: User Story 6 — Measurable Business Milestone Tracking & Lifecycle Progression (Priority: P2)

**Goal**: Lifecycle stage and Achiever milestones update only at verified transition points, never from unverified self-report.

**Independent Test**: Simulate activity from registration through a verified first-revenue milestone; confirm lifecycle-stage and KPI counters update only at defined transitions.

- [x] T048 [P] [US6] `backend/src/lifecycle/stage-transition.service.ts` — 6 stages (Registered→Advocate; Visitor/Lead precede User-row existence, out of scope per spec.md Assumptions — owned by a future CRM/marketing feature).
- [x] T049 [US6] `backend/src/lifecycle/milestone.service.ts` — claim/verify/reject; verified by integration test that an unverified claim never auto-advances to Achiever.
- [x] T050 [P] [US6] `backend/src/kpi/kpi-collector.service.ts` — all 7 categories, computing real metrics where data exists and explicitly `null`-with-reason where the owning feature isn't built yet (never a fabricated number).
- [x] T051 [US6] Covered by `governance-foundation.integration.test.ts`'s milestone-claim/verify/reject/deny tests.

**Checkpoint**: Lifecycle/KPI tracking independently functional.

---

## Phase 9: User Story 7 — Trust & Safety Reporting and Moderation Foundation (Priority: P2)

**Goal**: Report/block/mute enter a moderation queue with evidence retention and an appeal path.

**Independent Test**: One user reports another's post; report appears in moderation queue; moderator actions it with evidence recorded; affected user can appeal.

- [x] T052 [P] [US7] `TrustSafetyCase` + `Appeal` models — `database/prisma/schema.prisma`.
- [x] T053 [US7] `backend/src/trust-safety/reporting.service.ts` — report/block/mute, no special permission required (every user).
- [x] T054 [US7] `backend/src/trust-safety/moderation.service.ts` — queue + action; spam/suspicious-account auto-detection is explicitly `[NEEDS CLARIFICATION]` per spec.md (no thresholds specified) — moderator-driven review is what's built, matching the spec's own acknowledged gap.
- [x] T055 [US7] `backend/src/trust-safety/appeal.service.ts` — submit + resolve; an OVERTURNED decision actually restores account access (verified end-to-end: suspend → login blocked → appeal → overturn → login restored).
- [x] T056 [P] [US7] `CommunityRulesGate` — **NEW this session (was missed in the first pass, added now)**: `frontend/src/components/community/CommunityRulesGate.tsx`, wired into `JoinPage` so it gates account finalization (FR-093's signup-completion checkpoint); the "before first post" checkpoint has no UI to attach to yet (Community/005 doesn't exist) but the same component is ready to reuse there.
- [x] T057 [US7] Full report→queue→action→login-block→appeal→overturn→restore flow covered end-to-end by `governance-foundation.integration.test.ts`.

**Checkpoint**: Trust & Safety foundation independently functional.

---

## Phase 10: User Story 8 — Governance-Gated, Phased Feature Rollout (Priority: P3)

**Goal**: Feature releases pass through a fixed governance sequence; Phase N+1 capabilities are blocked until Phase N completion.

**Independent Test**: Attempt to enable a Phase 2+ capability while Phase 1 modules are incomplete; confirm release is blocked until phase-completion and governance-checklist criteria are satisfied.

- [x] T058 [P] [US8] `backend/src/platform-registry/phase-gate.service.ts` — verified: a Phase 2 feature is blocked from reaching Release Approval while Phase 1 is incomplete.
- [x] T059 [US8] `backend/src/governance/governance-workflow.service.ts` — the exact 10-stage sequence, one stage at a time, no skipping.
- [x] T060 [US8] `checkMvpScopeExclusion()` in `phase-gate.service.ts` — flags all 10 documented MVP-excluded capabilities.
- [x] T061 [US8] `admin/src/pages/GovernancePage.tsx` — **NEW this session**.
- [x] T062 [US8] Covered by `governance-foundation.integration.test.ts`'s governance-sequence + phase-gate tests.

**Checkpoint**: All 8 user stories independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T063 [P] Accessibility pass — **NOT DONE**. Deferred per user's explicit "fast-follow after core 001" decision this session; a full sweep across the entire web app (not just new UI) is a broad QA task, not new functionality.
- [ ] T064 [P] Performance pass — **NOT DONE**, same deferral.
- [ ] T065 [P] Cross-browser/responsive verification — **NOT DONE**, same deferral.
- [x] T066 Non-production data-safety audit — already satisfied: `database/seeds/index.ts`'s `assertSafeToSeed()` (pre-existing) refuses to run against production-looking hosts; `.env` files are gitignored, `.env.test`/`.env.example` contain only placeholders — spot-checked, no committed secrets found.
- [ ] T067 [P] Brand/design QA pass — **NOT DONE**, same Polish-phase deferral (this session's UI additions follow the existing brand tokens established in an earlier branding task, but a full audit wasn't performed).
- [x] T068 Audit-trail coverage — verified: every new admin action (organization create/update, milestone verify/reject, moderation action/dismiss, appeal resolve, governance stage-advance) calls `recordAuditEvent()`; course-version snapshots are append-only (never overwritten).
- [ ] T069 `quickstart.md` — does not exist (never generated for this feature) — nothing to run.
- [x] T070 **[NEW]** NFR/principle audit — **DONE this session**: `backend/tests/integration/principle-governance-audit.integration.test.ts`, 10 real assertions passing + 5 honest `.todo` entries for genuinely unassertable/out-of-scope items (FR-003/007 localization, FR-070 payment rate with no live billing yet, FR-072–074 owned by 004/005, FR-094/FR-101 explicitly `[NEEDS CLARIFICATION]` per spec.md).

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)** blocks all user stories.
- **P1 stories (US1, US2, US3)** — recommended order: US3 (RBAC) → US2 (membership gating, depends on RBAC) → US1 (lifecycle/next-best-action, independent of US2/US3 but conventionally sequenced last among P1s since it's the most cross-cutting-feeling one). All three may run in parallel once Foundational is done if staffed separately, per template guidance.
- **P2 stories (US4, US5, US6, US7)** depend on Foundational only, not on each other — may run in parallel.
- **P3 story (US8)** depends on Foundational only.
- **Polish (Phase 11)** depends on all desired stories being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational → US3 (RBAC) → US2 (Membership) → US1 (Lifecycle/Next-Best-Action) → **STOP and VALIDATE** independently, then proceed to P2/P3 stories incrementally, each independently deployable and demoable per the Independent Test defined in spec.md.
