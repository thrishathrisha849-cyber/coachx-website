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

- [ ] T001 Initialize `backend/` NestJS project with TypeScript, ESLint, Prettier
- [ ] T002 Initialize `web/` Next.js project with the `(public)`, `(member)`, `(admin)` route group scaffolding per plan.md
- [ ] T003 Initialize `mobile/` Flutter project with the `features/`/`core/` structure per plan.md
- [ ] T004 [P] Configure PostgreSQL connection and migration tooling in `backend/`
- [ ] T005 [P] Configure Redis connection for session cache and RBAC-decision cache in `backend/`
- [ ] T006 [P] Configure Jest for `backend/tests/{contract,integration,unit}`
- [ ] T007 [P] Configure Playwright for `web/tests/e2e`

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T008 Define `User Account` entity/migration in `backend/src/modules/identity/user-account.entity.ts` (id, role assignments, membership tier, lifecycle stage, org membership — per spec.md Key Entities)
- [ ] T009 Define `Role` and `Permission` entities/migrations in `backend/src/modules/rbac/` (FR-084–FR-086: 12 named roles across consumer/operational/administrative tiers)
- [ ] T010 Define `Membership Tier` catalog entity/migration in `backend/src/modules/membership/membership-tier.entity.ts` (FR-047–FR-053: Free/Starter/Growth/Pro/Elite/Organization, admin-configurable, no hardcoded pricing per FR-047)
- [ ] T011 Define `Access Control Decision` audit entity in `backend/src/modules/rbac/access-decision.entity.ts` (FR-088: authentication, status, role, entitlement, ownership, org, visibility, expiry, geography, admin-permission checks)
- [ ] T012 Implement the backend `RbacGuard` in `backend/src/common/guards/rbac.guard.ts` enforcing FR-087 (backend-only authorization; frontend state is never trusted) and FR-089 (specific denial reasons: login required / membership required / purchase required / access expired / permission denied / account suspended / content unavailable)
- [ ] T013 Implement the backend `EntitlementGuard` in `backend/src/common/guards/entitlement.guard.ts` resolving membership-tier feature gates (FR-048–FR-053)
- [ ] T014 Implement immutable `Audit Log` interceptor in `backend/src/common/interceptors/audit-log.interceptor.ts` (FR-077 — every admin config change recorded, never overwritten)
- [ ] T015 **[NEW]** Define `Content Item` entity and the Draft→Review→Scheduled→Published→Unpublished→Archived lifecycle state machine in `backend/src/modules/content-governance/content-item.entity.ts` + `content-lifecycle.service.ts` (FR-097: lifecycle states; FR-098: every content record stores creator, reviewer, publish date, last-modified date, version, visibility, membership access level, language, SEO metadata, thumbnail, status) — this is the shared Content Governance module `002-public-website-marketing-funnel/plan.md` builds its own CMS Page entity on top of
- [ ] T016 **[NEW]** Implement the `Content Version` preservation service in `backend/src/modules/content-governance/content-version.service.ts`: editing published content MUST retain the prior version (queryable, non-destructive), never overwrite it (FR-099, Constitution Article IV — Historical Immutability)
- [ ] T017 [P] Define `Platform Module` and `Platform Surface` registry seed data in `backend/src/modules/platform-registry/` **(FR-020–FR-038: the 4 access surfaces AND the full 16-module catalog — Module 01 Authentication through Module 16 Analytics — every module in FR-024–FR-038 MUST be registered as a first-class platform-registry entry even though each module's detailed mechanics are owned by other features per plan.md's Summary)**
- [ ] T018 [P] Define `Product Phase` entity/migration in `backend/src/modules/platform-registry/product-phase.entity.ts` (FR-078–FR-082: 4 phases with gating dependencies)
- [ ] T019 Contract test: RBAC denial reasons in `backend/tests/contract/rbac-denial.contract.test.ts` — asserts every denial path returns one of the 7 specific reasons from FR-089, never a generic 403
- [ ] T020 Contract test: entitlement resolution in `backend/tests/contract/entitlement.contract.test.ts` — asserts tier-gated resources resolve consistently regardless of client-supplied state (FR-087)
- [ ] T021 **[NEW]** Contract test: content version immutability in `backend/tests/contract/content-version-immutability.contract.test.ts` — asserts that editing and republishing previously published content never destroys the prior version, and that the prior version remains retrievable (FR-099, edge case: "admin edits and republishes previously published course content")

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 3 — Role-Based Access Control Across Platform Surfaces (Priority: P1) 🎯 MVP

**Goal**: Every protected backend resource enforces role/permission checks server-side, independent of frontend rendering.

**Independent Test**: Attempt a restricted action via direct backend request while authenticated with a non-privileged role; confirm denial with "permission denied," even though no client renders the control.

- [ ] T022 [P] [US3] Seed the 12 named roles (Guest, Registered Free User, Paid Member, Course Instructor, Mentor, Community Moderator, Support Agent, Content Manager, Finance Admin, Platform Admin, Super Admin, Organization Admin) in `backend/src/modules/rbac/seed/roles.seed.ts` (FR-084–FR-086)
- [ ] T023 [US3] Implement permission-to-role mapping resolver in `backend/src/modules/rbac/permission-resolver.service.ts` (FR-085–FR-086)
- [ ] T024 [US3] Implement Organization-scoped data filtering (Organization Admin sees only own-org data) in `backend/src/modules/rbac/org-scope.guard.ts` (FR-086, edge case: org data isolation)
- [ ] T025 [US3] Apply `RbacGuard` to a representative protected route set (payment/refund tools, course editing, ticket queue, payout settings) in `backend/src/modules/*/[resource].controller.ts`
- [ ] T026 [US3] Integration test: cross-role denial matrix in `backend/tests/integration/rbac-cross-role.integration.test.ts` covering all 4 acceptance scenarios in spec.md US3

**Checkpoint**: RBAC foundation independently functional and testable.

---

## Phase 4: User Story 2 — Membership Tier Selection & Feature Gating (Priority: P1)

**Goal**: Membership tier determines access to courses, mentor sessions, AI credits, community areas, marketplace-selling rights, with locked (not hidden) UI for ineligible tiers.

**Independent Test**: Create accounts on each tier; verify tier-restricted actions are denied with "membership required," entitled actions succeed.

- [ ] T027 [P] [US2] Seed the 6 membership tiers with their feature-grant lists in `backend/src/modules/membership/seed/tiers.seed.ts` (FR-048–FR-053)
- [ ] T028 [US2] Implement admin tier-configuration API (dynamic, no-deploy updates) in `backend/src/modules/membership/tier-admin.controller.ts` (FR-047, acceptance scenario 4)
- [ ] T029 [US2] Wire `EntitlementGuard` to the seeded tier feature-grants for course access, mentor booking, marketplace selling (FR-048–FR-053)
- [ ] T030 [P] [US2] Web: locked-but-visible UI treatment for tier-gated features in `web/src/components/tier-gate.tsx` (spec: "clearly locked (not hidden)")
- [ ] T031 [US2] Integration test: tier upgrade/downgrade access-boundary change in `backend/tests/integration/membership-tier.integration.test.ts` covering all 4 acceptance scenarios in spec.md US2

**Checkpoint**: US2 and US3 both independently functional.

---

## Phase 5: User Story 1 — Persona-Based Guided Onboarding & Next-Best-Action (Priority: P1)

**Goal**: Dashboard surfaces one specific next-best-action derived from profile/progress state (backend rules engine; onboarding UX itself is `003`'s scope).

**Independent Test**: New account → complete onboarding questionnaire → verify recommended action updates correctly as profile/niche/course-completion state changes.

- [ ] T032 [P] [US1] Define `User Lifecycle Stage` state machine in `backend/src/modules/lifecycle/lifecycle-stage.service.ts` (FR-042: Activated Member requires joint satisfaction of 5 criteria, not any-one)
- [ ] T033 [US1] Implement Next-Best-Action resolver in `backend/src/modules/lifecycle/next-best-action.service.ts` evaluating profile completion, niche selection, foundation-course completion, offer creation in priority order (FR-014, acceptance scenarios 1–4)
- [ ] T034 [US1] Expose `GET /api/users/:id/next-best-action` contract in `backend/src/modules/lifecycle/next-best-action.controller.ts` for `003`'s dashboard to consume
- [ ] T035 [US1] Contract test: next-best-action sequencing in `backend/tests/contract/next-best-action.contract.test.ts` covering all 4 acceptance scenarios in spec.md US1
- [ ] T036 [US1] Note: onboarding questionnaire UI, roadmap rendering, and dashboard composition are implemented by `003-auth-identity-onboarding-dashboard` against this contract — no `web/`/`mobile/` UI task owned here beyond T034's API.

**Checkpoint**: US1–US3 independently functional; this is the P1 MVP slice.

---

## Phase 6: User Story 4 — Cross-Surface Platform Navigation (Priority: P2)

**Goal**: Consistent module access across Public Site, Member Web App, Mobile App, with a role-gated Admin App.

**Independent Test**: Browse public site as guest (only public sections reachable); log in and confirm full authenticated module set; confirm course progress syncs web↔mobile.

- [ ] T037 [P] [US4] Implement `(public)` route group with the 19 listed public pages in `web/src/app/(public)/` (FR-020)
- [ ] T038 [P] [US4] Implement `(member)` route group with the 15 listed member sections, entitlement-gated, in `web/src/app/(member)/` (FR-021)
- [ ] T039 [P] [US4] Implement `(admin)` route group, role-gated to internal staff, in `web/src/app/(admin)/` (FR-023)
- [ ] T040 [P] [US4] Mirror the member module set in `mobile/lib/features/` (FR-022)
- [ ] T041 [US4] Implement cross-device progress-sync endpoint in `backend/src/modules/identity/progress-sync.controller.ts` (FR-076, acceptance scenario 3)
- [ ] T042 [US4] E2E test: guest/member/admin surface boundaries in `web/tests/e2e/surface-boundaries.spec.ts` covering all 4 acceptance scenarios in spec.md US4

**Checkpoint**: All 4 surfaces reachable per role/entitlement.

---

## Phase 7: User Story 5 — Transparent, Multi-Stream, No-Dark-Pattern Monetization (Priority: P2)

**Goal**: 10 revenue streams operate with mandatory sponsored/affiliate disclosure and no retroactive pricing changes to active subscribers.

**Independent Test**: Publish a sponsored campaign and an AI-suggested affiliate recommendation; confirm both render disclosure labels before any purchase-path or price.

- [ ] T043 [P] [US5] Seed the 10 revenue-stream catalog in `backend/src/modules/monetization/seed/revenue-streams.seed.ts` (FR-054–FR-063)
- [ ] T044 [US5] Implement mandatory disclosure enforcement (sponsored/affiliate labels block-render before price/CTA) in `backend/src/modules/monetization/disclosure.service.ts` (FR-062, FR-063, Constitution Article III)
- [ ] T045 [P] [US5] Web: `SponsoredLabel`/`AffiliateDisclosure` components in `web/src/components/disclosure/` consumed wherever monetized content renders
- [ ] T046 [US5] Implement price-snapshot-at-purchase immutability check in `backend/src/modules/monetization/price-snapshot.service.ts` (edge case, Constitution Article IV — active subscriber pricing not retroactively altered)
- [ ] T047 [US5] Integration test: disclosure-before-price and price-immutability in `backend/tests/integration/monetization-disclosure.integration.test.ts` covering all 4 acceptance scenarios in spec.md US5

**Checkpoint**: Monetization catalog and disclosure rules independently testable.

---

## Phase 8: User Story 6 — Measurable Business Milestone Tracking & Lifecycle Progression (Priority: P2)

**Goal**: Lifecycle stage and Achiever milestones update only at verified transition points, never from unverified self-report.

**Independent Test**: Simulate activity from registration through a verified first-revenue milestone; confirm lifecycle-stage and KPI counters update only at defined transitions.

- [ ] T048 [P] [US6] Implement lifecycle-stage transition evaluator (all 8 stages) in `backend/src/modules/lifecycle/stage-transition.service.ts` (FR-039–FR-046)
- [ ] T049 [US6] Implement milestone-verification workflow (first client / ₹1,000 / ₹10,000 / ₹1 lakh / course launch / 100 members) in `backend/src/modules/lifecycle/milestone-verification.service.ts` (FR-045, Constitution Article VIII — unverified claims MUST NOT auto-mark Achiever)
- [ ] T050 [P] [US6] Implement the 7-category KPI instrumentation contract (Acquisition/Activation/Engagement/Learning/Revenue/Retention/Transformation) in `backend/src/modules/kpi/kpi-collector.service.ts` (FR-064–FR-068)
- [ ] T051 [US6] Contract test: milestone verification gate in `backend/tests/contract/milestone-verification.contract.test.ts` covering all 4 acceptance scenarios in spec.md US6

**Checkpoint**: Lifecycle/KPI tracking independently functional.

---

## Phase 9: User Story 7 — Trust & Safety Reporting and Moderation Foundation (Priority: P2)

**Goal**: Report/block/mute enter a moderation queue with evidence retention and an appeal path.

**Independent Test**: One user reports another's post; report appears in moderation queue; moderator actions it with evidence recorded; affected user can appeal.

- [ ] T052 [P] [US7] Define `Trust & Safety Case` entity/migration in `backend/src/modules/trust-safety/case.entity.ts` (report/block/mute, evidence, escalation, resolution, appeal — FR-090–FR-092)
- [ ] T053 [US7] Implement report/block/mute endpoints in `backend/src/modules/trust-safety/reporting.controller.ts` (FR-090)
- [ ] T054 [US7] Implement moderation queue with spam/suspicious-account flagging hooks in `backend/src/modules/trust-safety/moderation-queue.service.ts` (FR-091 — detection thresholds NEEDS CLARIFICATION per spec.md)
- [ ] T055 [US7] Implement appeal workflow linked to the originating moderation action in `backend/src/modules/trust-safety/appeal.service.ts` (FR-092)
- [ ] T056 [P] [US7] Web: community-rules display gate at signup-completion and first-post in `web/src/components/community-rules-gate.tsx` (FR-093)
- [ ] T057 [US7] Integration test: report → queue → action → appeal in `backend/tests/integration/trust-safety.integration.test.ts` covering all 4 acceptance scenarios in spec.md US7

**Checkpoint**: Trust & Safety foundation independently functional.

---

## Phase 10: User Story 8 — Governance-Gated, Phased Feature Rollout (Priority: P3)

**Goal**: Feature releases pass through a fixed governance sequence; Phase N+1 capabilities are blocked until Phase N completion.

**Independent Test**: Attempt to enable a Phase 2+ capability while Phase 1 modules are incomplete; confirm release is blocked until phase-completion and governance-checklist criteria are satisfied.

- [ ] T058 [P] [US8] Implement Product Phase gating evaluator in `backend/src/modules/platform-registry/phase-gate.service.ts` (FR-078–FR-082)
- [ ] T059 [US8] Implement the governance-sequence tracker (requirement approval → UX review → technical review → security review → development → QA → UAT → release approval → monitoring → post-release review) in `backend/src/modules/platform-registry/governance-workflow.service.ts` (FR-083)
- [ ] T060 [US8] Implement MVP-scope-exclusion flag check in `backend/src/modules/platform-registry/mvp-scope.service.ts` (FR-082 — flags proposals against the documented MVP boundary)
- [ ] T061 [US8] Admin UI: governance-sequence dashboard in `web/src/app/(admin)/governance/page.tsx`
- [ ] T062 [US8] Integration test: phase-gate blocking and governance-sequence enforcement in `backend/tests/integration/governance-phasing.integration.test.ts` covering all 4 acceptance scenarios in spec.md US8

**Checkpoint**: All 8 user stories independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T063 [P] Accessibility pass (keyboard nav, screen-reader labels, contrast, captions, focus indicators) across `web/src/app/**` (FR-102)
- [ ] T064 [P] Performance pass: dashboard <3s load, pagination/cursor-loading on long lists, lazy-loading on large dashboards (FR-071, FR-100)
- [ ] T065 [P] Cross-browser/responsive verification (Chrome/Edge/Firefox/Safari × mobile/tablet/laptop/desktop) (FR-103)
- [ ] T066 Non-production environment data-safety audit: confirm no production data or committed secrets in dev/QA/UAT/staging configs (FR-104, FR-105)
- [ ] T067 [P] Brand/design QA pass against stated brand values and anti-clutter constraints (FR-106, FR-107)
- [ ] T068 Full audit-trail coverage verification: every admin config change and every published-content edit produces an immutable log entry (SC-007, FR-077, FR-099)
- [ ] T069 Run `quickstart.md` validation (if generated) end-to-end across all 8 user stories
- [ ] T070 **[NEW]** Principle, governance & launch-readiness NFR audit in `backend/tests/integration/principle-governance-audit.integration.test.ts` — a documented pass/fail check against every requirement not otherwise covered by an implementation task, specifically: FR-001–FR-013 (vision/mission/core-principle statements — verify the built product actually reflects "unified account journey," "action before consumption," "Tamil-first architecture," "transparent pricing/trainer info," etc.), FR-069–FR-070 (signup reliability, ≥95% payment success rate — cross-check against `002`/`009`'s own test suites rather than re-testing), FR-072–FR-076 (course resume without data loss owned by `004`, community flows owned by `005`, notification deep-links, payment-access-immediacy owned by `002`/`009`, mobile/web progress sync — T041 above), FR-094–FR-096 (data minimization policy, user data-rights controls — cross-reference `003`'s account-lifecycle feature which implements export/deletion/consent, flagging here only whether the minimum-data-collection principle FR-094 itself needs a policy decision per its `[NEEDS CLARIFICATION]` tag), and FR-101 (availability/scale target — flag as an open ops decision, `[NEEDS CLARIFICATION]` per spec.md). This task's output is a traceability table, not new code, and exists specifically because narrative/principle-level FRs don't map cleanly to a single implementation task.

---

## Dependencies & Execution Order

- **Setup (Phase 1)** → **Foundational (Phase 2)** blocks all user stories.
- **P1 stories (US1, US2, US3)** — recommended order: US3 (RBAC) → US2 (membership gating, depends on RBAC) → US1 (lifecycle/next-best-action, independent of US2/US3 but conventionally sequenced last among P1s since it's the most cross-cutting-feeling one). All three may run in parallel once Foundational is done if staffed separately, per template guidance.
- **P2 stories (US4, US5, US6, US7)** depend on Foundational only, not on each other — may run in parallel.
- **P3 story (US8)** depends on Foundational only.
- **Polish (Phase 11)** depends on all desired stories being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational → US3 (RBAC) → US2 (Membership) → US1 (Lifecycle/Next-Best-Action) → **STOP and VALIDATE** independently, then proceed to P2/P3 stories incrementally, each independently deployable and demoable per the Independent Test defined in spec.md.
