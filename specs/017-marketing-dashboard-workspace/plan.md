# Implementation Plan: Marketing Dashboard, Navigation & Admin Workspace

**Branch**: `017-marketing-dashboard-workspace` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-marketing-dashboard-workspace/spec.md`

## Summary

This feature builds the admin workspace shell every marketing operator lives in: the five-region layout (top nav, left sidebar, main content, optional right context panel, footer status bar); Global Search across 9 entity types; a Notification Center; a 10-card KPI dashboard, Executive Summary, and real-time Live Activity Feed; Campaign Performance/Audience Insights/Revenue widgets and a Quick Actions Panel; an AI Recommendation Panel with mandatory confidence-score-plus-confirmation gating; workspace customization (rearrange/resize/hide/save/multi-profile/reset); a power-user navigation layer (command palette, breadcrumbs, favorites, multi-tab); full responsive tiers (desktop/tablet/mobile); WCAG 2.1 AA accessibility; and numeric performance/security targets.

This chapter is not cited by name in the constitution, but FR-022 explicitly resolves an ambiguity in its own source text **per Constitution Article II**: the source's "one-click action" language does not distinguish which AI recommendation categories may apply directly versus which consequential ones require confirmation, so this spec applies the constitution's AI-assistive principle across the board — every consequential one-click action (budget, audience, or schedule change) requires explicit admin confirmation before it alters live state, never firing autonomously on click.

Per spec.md's own Assumptions, this feature is **presentation and aggregation only** — it defines the workspace shell, widget contracts, and navigation experience, but explicitly does not redefine the business logic of the modules it links to or aggregates data from: campaign business rules belong to `018`, segment computation to `019`, email/SMS/WhatsApp/push mechanics to `020`/`021`, automation execution to `022`, landing pages to `023`, AI recommendation generation to `025` (consuming `008`'s AI gateway, never redefining it here), and analytics/attribution computation to `027`/`028`. It **reuses `016`'s RBAC model** directly to determine which sidebar sections, widgets, KPI cards, search results, and quick actions are visible to a given admin (FR-039, SC-008) — this spec applies that model, it does not redefine role hierarchies or approval chains.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–016.

**Primary Dependencies**: NestJS, Next.js, Flutter; a real-time transport for the Live Activity Feed (FR-014 — no vendor named, consistent with the same gap in prior real-time features); a drag-and-drop/grid-layout library for widget customization (FR-023, FR-024 — no specific grid system prescribed by source); AI recommendation generation consuming `008`'s shared AI gateway via `025` (FR-020, FR-021) rather than a parallel AI stack; RBAC-scoped rendering consuming `016`'s permission model directly (FR-039).

**Storage**: PostgreSQL (Dashboard Widget, Saved Layout/Dashboard Profile, AI Recommendation status, Notification, Navigation Favorite/Recently Visited Page per spec.md's Key Entities), Redis (Live Activity Feed real-time state, Global Search result caching, session/navigation-tab state).

**Testing**: Jest (backend — AI-recommendation-confirmation-gating, RBAC-scoped-search/widget-visibility, and layout-persistence contract tests are the highest-stakes tests here, matching this spec's own SC-007, SC-008, and SC-009), Playwright (web e2e — dashboard load, global search, widget customization, responsive breakpoints), axe/WCAG automated audit tooling (SC-006).

**Target Platform**: Web (Admin Portal, desktop/tablet/mobile responsive tiers); this is the shared shell every other Volume 14 Part 1/Part 2 admin feature renders inside.

**Performance Goals**: Dashboard initial load under 3s; widget refresh under 2s; Global Search results under 500ms; in-workspace navigation under 200ms; report rendering under 5s (FR-034–FR-038, SC-001–SC-005) — NEEDS CLARIFICATION: no percentile/consistency methodology specified in source.

**Constraints**: Every AI recommendation displays a confidence score and expected impact before any one-click action can be invoked, and every consequential one-click action requires explicit admin confirmation before altering live campaign/budget/audience/schedule state — never applied silently on click (FR-021, FR-022, SC-007, Constitution Article II); every dashboard module and Global Search result respects the requesting admin's RBAC-visible scope, with zero data rendered without the corresponding permission (FR-039, SC-008); a saved custom layout restores exactly as configured across sessions and devices (FR-026, SC-009); a Global Search match the searching admin cannot view under RBAC is excluded from the result set entirely, never shown as a redacted/access-denied entry that would reveal its existence (edge case); widget resize/drag auto-reflows to prevent overlap rather than persisting an overlapping or inaccessible layout (edge case).

**Scale/Scope**: 43 functional requirements (FR-001–FR-043), 6 user stories, 10 Key Entities, and 4 NEEDS CLARIFICATION items in spec.md's Assumptions (performance-target percentile methodology, AI recommendation category-by-category direct-vs-confirmation distinction, Live Activity Feed retention duration/max saved profiles/context-menu action set).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Dashboard data, search results, and RBAC-scoped visibility are all server-computed and server-filtered, never client-side-only | **PASS — direct implementation (not the constitution's named source for this article)** | FR-039, SC-008 |
| II. AI Is Assistive, Never Autonomous | This spec's own FR-022 explicitly resolves the source's ambiguous "one-click action" language per this article — every consequential AI-recommendation action requires explicit admin confirmation before altering live state | **PASS — direct implementation, spec.md explicitly applies this article** | FR-021, FR-022, SC-007 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A — this is an internal admin workspace, not a customer-facing claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | Live Activity Feed events are append-only timestamped records; AI recommendations track a stale/invalidated state rather than silently disappearing when underlying data changes | **PASS (aligns; not the constitution's named source for this article)** | FR-014, edge case |
| V. Ledger-Based Internal Economies | N/A | **PASS (N/A)** | — |
| VI. Consent Is First-Class | N/A for this chapter's own surface | **PASS (N/A)** | — |
| VII. Layered, Explicit RBAC | Every dashboard module, widget, and search result enforces `016`'s layered permission model; excluded (not redacted) results for unauthorized data | **PASS (extends 016)** | FR-039, SC-008 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Language Selector present in top navigation; full workspace theming (dark/light) supported | **PASS (aligns; not the constitution's named source for this article)** | FR-002, FR-005 |
| Security & Compliance Baseline | Session validation, automatic logout on inactivity, secure API communication, audit logging for administrative actions, data masking for sensitive information | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-040–FR-043 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/017-marketing-dashboard-workspace/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: performance-target percentile/consistency methodology, AI-recommendation category-by-category direct-action-vs-confirmation distinction beyond this spec's blanket Article II resolution, Live Activity Feed retention duration, maximum saved dashboard profiles per user, and the context-menu action set per object type
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`016`'s structure — no new top-level projects; this feature is the presentation/aggregation shell every other Volume 14 feature's admin screens render inside, consuming `016`'s RBAC and `008`'s AI gateway (via `025`) rather than redefining either.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── marketing-workspace-layout/  # layout regions, top nav, sidebar, footer status bar (FR-001–FR-006)
│   │   ├── marketing-global-search/     # cross-entity search, auto-complete, history, filters (FR-007, FR-008)
│   │   ├── marketing-notification-center/ # Notification aggregation/display contract (FR-009)
│   │   ├── marketing-navigation/        # breadcrumbs, recently-visited, favorites, command palette, context menus, multi-tab (FR-010)
│   │   ├── marketing-dashboard-widgets/ # KPI Card, Executive Summary, Live Activity Feed, Campaign Performance/Audience Insights/Revenue widgets, Quick Actions Panel (FR-011–FR-019)
│   │   ├── marketing-ai-recommendation/ # AI Recommendation Panel presentation contract, confirmation gating (FR-020–FR-022)
│   │   └── marketing-workspace-customization/ # Saved Layout/Dashboard Profile, rearrange/resize/hide/save/reset (FR-023–FR-028)
│   └── common/                          # reused from 001: RbacGuard, audit-log interceptor; reused from 008/025: AI gateway; reused from 016: permission model
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── {dashboard,search,notifications,favorites}/
```

**Structure Decision**: 7 new backend modules under `marketing-workspace-*`/`marketing-dashboard-*`/`marketing-ai-recommendation`/`marketing-navigation`/`marketing-global-search`/`marketing-notification-center`, each mapping to one of spec.md's FR groupings. `marketing-ai-recommendation`'s confirmation-gating logic is built and contract-tested first given its direct Article II obligation. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
