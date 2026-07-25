---
description: "Task list for Feature 017 — Marketing Dashboard, Navigation & Admin Workspace"
---

# Tasks: Marketing Dashboard, Navigation & Admin Workspace

**Input**: Design documents from `/specs/017-marketing-dashboard-workspace/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `016`'s RBAC model and `008`'s AI gateway (consumed via `025`) exist as integration points, though it does not require their full feature completion to build its own presentation/aggregation shell.

**Tests**: Included throughout — AI-recommendation-confirmation-gating, RBAC-scoped workspace visibility, and layout-persistence get dedicated Foundational contract tests, matching this spec's own SC-007, SC-008, and SC-009.

**Organization**: Tasks are grouped by user story (US1–US6 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (Widget & Quick Actions remainder FR-016–FR-019).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor this feature reuses via `016`)
- [ ] T002 Resolve `research.md` open items before proceeding: performance-target percentile/consistency methodology, AI-recommendation category-by-category direct-action-vs-confirmation distinction beyond this spec's blanket Article II resolution, Live Activity Feed retention duration, maximum saved dashboard profiles per user, and the context-menu action set per object type
- [ ] T003 [P] Add `backend/src/modules/{marketing-workspace-layout,marketing-global-search,marketing-notification-center,marketing-navigation,marketing-dashboard-widgets,marketing-ai-recommendation,marketing-workspace-customization}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Dashboard Widget` entity in `backend/src/modules/marketing-dashboard-widgets/dashboard-widget.entity.ts` (Key Entities)
- [ ] T005 [P] Define `Saved Layout`/`Dashboard Profile` entities in `backend/src/modules/marketing-workspace-customization/saved-layout.entity.ts` (FR-026, FR-027)
- [ ] T006 [P] Define the `KPI Card` entity in `backend/src/modules/marketing-dashboard-widgets/kpi-card.entity.ts` (FR-012)
- [ ] T007 [P] Define the `Live Activity Feed Event` entity in `backend/src/modules/marketing-dashboard-widgets/activity-feed-event.entity.ts` (FR-014)
- [ ] T008 [P] Define the `AI Recommendation` entity in `backend/src/modules/marketing-ai-recommendation/ai-recommendation.entity.ts` (FR-020, FR-021)
- [ ] T009 [P] Define the `Quick Action` entity in `backend/src/modules/marketing-dashboard-widgets/quick-action.entity.ts` (FR-019)
- [ ] T010 [P] Define the `Notification` entity in `backend/src/modules/marketing-notification-center/notification.entity.ts` (FR-009)
- [ ] T011 [P] Define the cross-entity `Global Search Result` index in `backend/src/modules/marketing-global-search/search-index.entity.ts` (FR-007)
- [ ] T012 [P] Define `Navigation Favorite`/`Recently Visited Page` entities in `backend/src/modules/marketing-navigation/favorite.entity.ts` (FR-010)
- [ ] T013 [P] Define the `Command Palette Action` entity in `backend/src/modules/marketing-navigation/command-palette-action.entity.ts` (FR-010)
- [ ] T014 Implement the five-region layout shell (Top Navigation Bar, Left Sidebar Navigation, Main Content Area, optional Right Context Panel, Footer Status Bar) in `web/src/app/(marketing-admin)/layout.tsx` (FR-001)
- [ ] T015 Implement the Top Navigation Bar (logo, workspace indicator, Global Search, AI Assistant shortcut, Notifications, Tasks, Help Center, Theme Switcher, Language Selector, User Profile, Organization Switcher) in `web/src/components/marketing/top-nav.tsx` (FR-002)
- [ ] T016 Implement the Left Sidebar hierarchical navigation (Dashboard, Campaigns, Audience, Communication, Automation, Content, Analytics, AI Tools, Integrations, Settings, each with defined sub-items) in `web/src/components/marketing/sidebar-nav.tsx` (FR-003)
- [ ] T017 [P] Implement Dark/Light mode support across the workspace (FR-005)
- [ ] T018 Implement full keyboard accessibility for workspace navigation and interactive controls in `backend/src/modules/marketing-workspace-layout/keyboard-accessibility.service.ts` (FR-006)
- [ ] T019 Implement Notification Center aggregation (campaign approvals, workflow failures, scheduled-campaign reminders, system alerts, team mentions, AI recommendations, security notifications), wired to T010, in `backend/src/modules/marketing-notification-center/notification-aggregation.service.ts` (FR-009)
- [ ] T020 Implement RBAC-scoped rendering enforcement across every dashboard module, wired to `016`'s permission model, in `backend/src/modules/marketing-workspace-layout/rbac-scoped-rendering.service.ts` (FR-039)
- [ ] T021 Note: role/permission enforcement reuses `016`'s RBAC model directly — this feature applies it, it does not redefine role hierarchies or approval chains (Constitution Article VII)
- [ ] T022 Contract test: every consequential AI-recommendation one-click action requires explicit admin confirmation before altering live campaign/budget/audience/schedule state, in `backend/tests/contract/marketing-ai-recommendation-confirmation-gate.contract.test.ts` (FR-022, SC-007)
- [ ] T023 Contract test: every dashboard module and Global Search result respects the requesting admin's RBAC-visible scope, with unauthorized results excluded rather than redacted, in `backend/tests/contract/marketing-workspace-rbac-scoping.contract.test.ts` (FR-039, SC-008)
- [ ] T024 Contract test: a saved custom layout restores exactly as configured across sessions and devices, in `backend/tests/contract/marketing-layout-persistence.contract.test.ts` (FR-026, SC-009)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Monitor Marketing Performance at a Glance (P1) 🎯 MVP

**Independent Test**: Load the dashboard as an authenticated marketing admin and confirm KPI cards, Executive Summary, and Live Activity Feed render with current data, trend indicators, and quick-action links.

- [ ] T025 [US1] 10-card KPI dashboard (Active Campaigns, Campaigns Scheduled Today, Total Leads, Conversion Rate, Revenue Generated, New Members, Push Notification CTR, Email Open Rate, WhatsApp Delivery Rate, SMS Success Rate) in `backend/src/modules/marketing-dashboard-widgets/kpi-dashboard.service.ts` (FR-011, acceptance scenario 1)
- [ ] T026 [US1] Per-KPI-card detail (current value, previous-period comparison, percentage change, trend indicator, quick action link), wired to T006 (FR-012, acceptance scenario 1)
- [ ] T027 [US1] Executive Summary section (today's performance, weekly summary, monthly overview, quarterly trends, revenue impact, top performing campaigns, AI insights, recommended actions) in `backend/src/modules/marketing-dashboard-widgets/executive-summary.service.ts` (FR-013, acceptance scenario 4)
- [ ] T028 [US1] Live Activity Feed real-time event stream (campaign published, email sent, user registered, lead converted, subscription purchased, workflow completed, automation failed, segment updated), wired to T007, in `backend/src/modules/marketing-dashboard-widgets/live-activity-feed.service.ts` (FR-014, acceptance scenario 2)
- [ ] T029 [US1] Live Activity Feed infinite scroll, filter, search, export, and time grouping (FR-015, acceptance scenario 3)
- [ ] T030 [P] [US1] Dashboard overview UI in `web/src/app/(marketing-admin)/dashboard/page.tsx`
- [ ] T031 [US1] Integration test: KPI-card full-detail rendering, real-time feed update without refresh, infinite-scroll-filter-export, Executive Summary full-section rendering — all 4 acceptance scenarios in `backend/tests/integration/us1-dashboard-overview.integration.test.ts`

**Checkpoint**: The dashboard's stated core purpose — the command center for all marketing operations — is independently functional.

---

## Phase 4: User Story 2 — Find Anything Instantly via Global Search (P1)

**Independent Test**: Type a partial campaign or segment name into the global search bar and confirm matching results, auto-complete suggestions, and applicable filters appear within the performance target.

- [ ] T032 [US2] Cross-entity search (Campaigns, Users, Segments, Templates, Landing Pages, Workflows, Reports, Notifications, Marketing Assets), wired to T011, in `backend/src/modules/marketing-global-search/cross-entity-search.service.ts` (FR-007, acceptance scenario 1)
- [ ] T033 [US2] Auto-complete plus search history and recent searches (FR-008, acceptance scenario 2)
- [ ] T034 [US2] Result-type filtering (FR-008, acceptance scenario 3)
- [ ] T035 [US2] Keyboard-shortcut invocation with input focus (FR-008, acceptance scenario 4)
- [ ] T036 [P] [US2] Global search UI in `web/src/components/marketing/global-search.tsx`
- [ ] T037 [US2] Integration test: matching results with auto-complete, search-history reuse, type-filter narrowing, keyboard-shortcut focus — all 4 acceptance scenarios, validated against T023's RBAC-scoping contract test, in `backend/tests/integration/us2-global-search.integration.test.ts`

**Checkpoint**: The primary way an admin operating at enterprise scale locates a specific object is independently functional.

---

## Phase 5: User Story 3 — Act on an AI Recommendation With Visible Confidence (P2)

**Independent Test**: View the AI Recommendation Panel, confirm each recommendation displays a confidence score, expected impact, and a one-click action, and confirm that invoking the action requires explicit admin intent rather than firing automatically on render.

- [ ] T038 [US3] AI recommendation generation (send-time, subject-line, audience-expansion, budget, landing-page, personalization categories) consuming `008`'s gateway via `025`, in `backend/src/modules/marketing-ai-recommendation/recommendation-generation.service.ts` (FR-020, acceptance scenario 1)
- [ ] T039 [US3] Confidence-score, expected-impact, and one-click-action display per recommendation, wired to T008 (FR-021, acceptance scenario 1)
- [ ] T040 [US3] Confidence-score visual distinction (low vs. high) in `web/src/components/marketing/recommendation-card.tsx` (FR-021, acceptance scenario 2)
- [ ] T041 [US3] Consequential-action confirmation gate, wired to T022's contract test, in `backend/src/modules/marketing-ai-recommendation/confirmation-gate.service.ts` (FR-022, acceptance scenario 3)
- [ ] T042 [US3] Recommendation dismissal removing it from the active list (FR-020, acceptance scenario 4)
- [ ] T043 [P] [US3] AI Recommendation Panel UI in `web/src/app/(marketing-admin)/dashboard/ai-recommendations/page.tsx`
- [ ] T044 [US3] Integration test: confidence-and-impact display, low-vs-high-confidence distinction, confirmation required for consequential action, dismiss removes from list — all 4 acceptance scenarios in `backend/tests/integration/us3-ai-recommendation-panel.integration.test.ts`

**Checkpoint**: The dashboard's differentiated, AI-driven capability with human judgment preserved is independently functional.

---

## Phase 6: User Story 4 — Customize and Save a Personal Dashboard Layout (P2)

**Independent Test**: Rearrange and resize widgets, hide a module, save the layout, reload the dashboard, and confirm the saved arrangement persists.

- [ ] T045 [US4] Widget rearrangement with auto-reflow to prevent overlap in `backend/src/modules/marketing-workspace-customization/widget-rearrange.service.ts` (FR-023, FR-024, acceptance scenario 1)
- [ ] T046 [US4] Widget hide/re-add (FR-025, acceptance scenario 2)
- [ ] T047 [US4] Layout save persisted across sessions and devices, wired to T005/T024, in `backend/src/modules/marketing-workspace-customization/layout-save.service.ts` (FR-026, acceptance scenario 3)
- [ ] T048 [US4] Multiple named dashboard profiles per user (FR-027, acceptance scenario 3)
- [ ] T049 [US4] Reset-to-platform-default (FR-028, acceptance scenario 4)
- [ ] T050 [P] [US4] Widget customization UI (drag/resize) in `web/src/components/marketing/dashboard-grid.tsx`
- [ ] T051 [US4] Integration test: drag-reposition with no overlap, hide-and-re-add, save persists across sessions and profiles, reset to default — all 4 acceptance scenarios in `backend/tests/integration/us4-workspace-customization.integration.test.ts`

**Checkpoint**: The tailoring capability serving different admin roles (campaign manager, analyst, executive) is independently functional.

---

## Phase 7: User Story 5 — Navigate Efficiently via Command Palette, Breadcrumbs & Favorites (P3)

**Independent Test**: Open the command palette via keyboard shortcut, execute a navigation command, confirm breadcrumbs reflect the resulting location, and confirm a page can be marked as a favorite for later one-click access.

- [ ] T052 [US5] Command palette keyboard-invoked navigation, wired to T013, in `web/src/components/marketing/command-palette.tsx` (FR-010, acceptance scenario 1)
- [ ] T053 [US5] Breadcrumb trail with clickable ancestor levels (FR-010, acceptance scenario 2)
- [ ] T054 [US5] Favorites list with one-click access, wired to T012 (FR-010, acceptance scenario 3)
- [ ] T055 [US5] Multi-tab independent navigation state (FR-010, acceptance scenario 4)
- [ ] T056 [P] [US5] Command palette, breadcrumb, and favorites UI polish
- [ ] T057 [US5] Integration test: command-palette execution, breadcrumb accuracy, favorite one-click access, multi-tab independent state — all 4 acceptance scenarios in `backend/tests/integration/us5-navigation-experience.integration.test.ts`

**Checkpoint**: The efficiency layer for power users operating the workspace at scale is independently functional.

---

## Phase 8: User Story 6 — Operate the Workspace on Mobile via Bottom Navigation (P3)

**Independent Test**: Load the workspace on a mobile viewport and confirm bottom navigation, single-column widget stacking, compact KPI cards, and swipe gestures function.

- [ ] T058 [US6] Mobile bottom-navigation plus single-column widget stacking in `web/src/components/marketing/mobile-bottom-nav.tsx` (FR-031, acceptance scenario 1)
- [ ] T059 [US6] Compact KPI card mobile rendering (FR-031, acceptance scenario 2)
- [ ] T060 [US6] Swipe gesture support (dismiss, reveal action) (FR-031, acceptance scenario 3)
- [ ] T061 [US6] Overflow/"more" entry point for sidebar sections without a direct bottom-nav slot (FR-031, acceptance scenario 4, edge case)
- [ ] T062 [US6] Tablet responsive tier (collapsible sidebar, two-column layout, touch-optimized interactions) (FR-030)
- [ ] T063 [US6] Desktop responsive tier (full sidebar, multi-column widget layout, expanded analytics views) (FR-029)
- [ ] T064 [P] [US6] Mobile workspace UI polish
- [ ] T065 [US6] Integration test: bottom-nav-and-single-column, compact KPI cards, swipe gestures, overflow-menu reachability — all 4 acceptance scenarios in `backend/tests/integration/us6-mobile-workspace.integration.test.ts`

**Checkpoint**: The secondary, mobile access mode reaching the same core information is independently functional.

---

## Phase 9: Widget & Quick Actions remainder (supports FR-016–FR-019; cross-cutting, no single owning story)

- [ ] T066 Campaign Performance Widget (totals by status, average CTR/conversion rate, revenue contribution, line/bar/pie/heat-map visualizations) in `backend/src/modules/marketing-dashboard-widgets/campaign-performance-widget.service.ts` (FR-016)
- [ ] T067 Audience Insights Widget (total/active/inactive/new/returning users, segmentation breakdown, geographic distribution, device usage) in `backend/src/modules/marketing-dashboard-widgets/audience-insights-widget.service.ts` (FR-017)
- [ ] T068 Revenue Dashboard (Revenue Today, Weekly, Monthly, Campaign Revenue, AOV, CLV, Refunds, Net Revenue) in `backend/src/modules/marketing-dashboard-widgets/revenue-dashboard.service.ts` (FR-018)
- [ ] T069 [P] Quick Actions Panel (Create Campaign, Import Audience, Build Segment, Send Test Email, Create Landing Page, Start Workflow, Generate AI Content, Export Report), wired to T009 (FR-019)

**Checkpoint**: The remaining dashboard widgets are independently functional.

---

## Phase 10: Polish & Cross-Cutting Concerns

- [ ] T070 [P] WCAG 2.1 AA accessibility full pass (keyboard navigation, screen reader compatibility, high-contrast mode, adjustable font sizes, visible focus indicators, accessible color contrast) across every workspace surface (FR-032, FR-033, SC-006)
- [ ] T071 Performance hardening pass toward the 5 numeric targets (dashboard load, widget refresh, search response, navigation response, report render) (FR-034–FR-038, SC-001–SC-005)
- [ ] T072 Security hardening pass: session validation plus automatic logout on inactivity, secure API communication, audit logging for administrative actions, data masking for sensitive information (FR-040–FR-043)
- [ ] T073 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (performance-target percentile methodology, AI-recommendation category-by-category distinction, feed retention duration, max saved profiles, context-menu action set)
- [ ] T074 Final audit: cross-check every FR-001–FR-043 against an implementation or validation task; verify this feature aggregates rather than duplicates the business logic owned by `018`/`019`/`020`/`021`/`022`/`023`/`025`/`027`/`028`
- [ ] T075 Run `quickstart.md` validation end-to-end across all 6 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `016`'s RBAC model and `008`'s AI gateway (via `025`), and produces the layout shell/RBAC-scoping infrastructure every subsequent phase depends on.
- **P1 stories (US1–US2)**: US1 (dashboard overview) is the landing view every other capability needs a home screen in and should ship first; US2 (global search) is independent of US1 and can build in parallel.
- **P2 stories (US3–US4)**: US3 (AI recommendations) depends on Foundational's confirmation-gate infrastructure and `025`'s recommendation generation; US4 (layout customization) depends on Foundational's Saved Layout entity — both can build in parallel.
- **P3 stories (US5–US6)**: US5 (command palette/breadcrumbs/favorites) and US6 (mobile) are both efficiency/access-mode layers on top of the P1/P2 core screens and can build in parallel with each other, after US1–US4.
- **Phase 9 (Widget remainder)** depends on Foundational's Dashboard Widget entity and can build in parallel with US3–US6.
- **Polish (Phase 10)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (layout shell, RBAC scoping, entities) → **STOP and VALIDATE** the three Foundational contract tests (AI-confirmation-gate, RBAC-scoping, layout-persistence) pass → US1 (dashboard overview) → **STOP and VALIDATE** the command-center landing view works end to end → US2 (global search) → US3 (AI recommendations) + US4 (layout customization) in parallel → US5 (navigation experience) + US6 (mobile) in parallel → Phase 9 (widget remainder) → Polish.
