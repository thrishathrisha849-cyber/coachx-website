# Implementation Plan: Marketing Operations, Campaign Governance & Budget Control

**Branch**: `033-marketing-operations-governance` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/033-marketing-operations-governance/spec.md`

## Summary

This feature builds the platform's marketing operations backbone: a 12-stage campaign governance lifecycle (Business Objective → ... → ROI & Executive Review) with fully traceable stage transitions; a Campaign Registry across 16 campaign types; governance policy enforcement; a campaign approval workflow (Draft→Manager→Finance→Legal→Compliance→Executive→Active) with 4 routing modes; a marketing calendar; marketing asset requests; automated operational workflows (task creation, reminders, alerts, escalations); budget planning across 9 levels and 14 categories with real-time burn-rate/variance/forecast tracking and threshold/overspend/forecast alerts; cost-center mapping; a configurable 6-level financial approval chain (Team Lead→CEO) directly implementing Constitution Article VII; vendor profiles and an 8-step procurement workflow; resource/capacity planning across 10 resource types with 7 capacity calculations; team collaboration, task management, project timelines, and milestone tracking; a 7-category risk register; compliance and legal review; brand governance; campaign documentation; an Executive Dashboard, Operational KPIs, scorecards, and operational analytics; an AI Marketing Operations Assistant (strictly advisory, per Constitution Article II); notifications; audit logging; and security/performance requirements. This is the closing chapter of Volume 14 Part 1.

This chapter is not cited by name in the constitution's own source list, but its own FR text cites two constitutional articles verbatim, each twice: **FR-016 and FR-017 both cite "Constitution Article VII"** — the 6-level financial approval chain is described as "the direct, concrete instantiation of Constitution Article VII" in User Story 3's own rationale, matching the constitutional requirement that high-blast-radius actions "require a defined multi-step approval chain, not a single permission bit"; **FR-044 and FR-045 both cite "Constitution Article II"** — every AI Marketing Operations Assistant output is advisory-only with a deterministic non-AI fallback guaranteed.

## Ownership & Dependency Analysis (Feature 033 vs. Features 001, 016, 018, 022, 027, 028, 032)

Per instruction, this analysis preserves the `022`/`032` NEEDS CLARIFICATION gate established when planning `032` — it is **not** resolved here, and this feature's own automation requirements are scoped to avoid adding a third competing implementation to that unresolved question. Each named dependency was checked by reading the dependency's own plan.md, not just spec.md's own Assumptions.

### 1. The `022`/`032` journey/workflow-engine gate: explicitly preserved, not touched

`032`'s plan.md documents an unresolved question — whether `022` (Marketing Automation Workflows) and `032` (Omnichannel Orchestration) are the same underlying automation engine or two distinct engines, given `022` already has its own `Customer Journey`/`Journey Instance` entities. **This plan does not resolve that question and does not let `033` add a fourth entity into the collision.** FR-010 ("System MUST support automated workflows for task creation, approval reminders, budget alerts, campaign notifications, SLA reminders, document requests, risk escalation, and executive summaries") describes **internal, staff-facing operational notifications and reminders** — a materially different audience and purpose from `032`'s customer-facing omnichannel journeys, and simpler in kind than either `022`'s or `032`'s full node-based builders (no branching customer journey, no channel fallback, no consent gating). **Ownership decision**: FR-010's automated workflows are implemented as configured trigger→condition→action rules running on **whichever substrate `022`/`032`'s eventual resolution designates as the shared automation engine** — this feature does not build a third, independent automation/workflow execution engine. Until that resolution lands, FR-010 tasks in this feature are scoped as thin, staff-notification-only rule configurations layered on `022`'s already-planned trigger/condition/action primitives (the lower-level, simpler of the two engines), explicitly flagged as provisional pending the upstream gate closing.

### 2. A second, analogous entity-collision: `018` (Campaign Management) vs. this feature's Campaign Registry

Spec.md's own Assumptions already flag this directly: *"The Campaign Registry (§6) in this chapter is assumed to be the same underlying Campaign entity introduced in `018-campaign-management`... not a separate, duplicate campaign object. Implementation planning should reconcile the two rather than modeling two independent 'Campaign' entities."* This is the same class of problem as the `022`/`032` `Customer Journey` collision, one chapter earlier in the source. **This plan does not silently pick a winner.** Working hypothesis for planning purposes only (matching spec.md's own stated assumption): `018`'s `Campaign` entity remains the base record (name, type, objective, channels, schedule); this feature's Campaign Registry **extends** that same entity with governance/budget/risk/approval-status fields (Business Unit, Brand, Planned Revenue, Expected ROI, Priority, lifecycle Stage, Team Members, Risk Level, Approval Status, KPI Targets) rather than creating a second, parallel `Campaign` record. **Recommended correction (flagged, not applied)**: when this feature's Foundational entities are actually implemented, they must extend `018`'s existing `Campaign` entity via a governance-fields extension/join rather than a new top-level entity named `Campaign` a second time — this must be confirmed against `018`'s actual schema before implementation, not assumed to "just work."

### 3. Reuse from `001`/`016`: RBAC and the approval-chain mechanism

- **RBAC** (FR-046): extends `001`'s organizational hierarchy (Organization → Department/Team → Role → Permission Group → Permission) and `016`'s marketing-specific RBAC layer; this feature does not define a new permission model.
- **The financial approval chain mechanism** (FR-016–FR-019): `016` (`marketing-rbac-roles`) is directly cited in the constitution's own Article VII source list for "10 standard roles, escalating approval chain." **Ownership decision**: this feature's 6-level Team Lead→Marketing Manager→Finance Manager→Finance Director→CMO→CEO financial approval chain is a **configured instance** of the generic escalating-approval-chain mechanism `016` already establishes as the constitution's own cited example — this feature defines the specific levels, thresholds, and financial-approval semantics, but does not build a second, independent approval-chain execution engine parallel to `016`'s. The campaign approval workflow (FR-005, Draft→Manager→Finance→Legal→Compliance→Executive→Active) is a second, distinct configured chain instance on the same underlying mechanism, not a third bespoke engine.

### 4. Corrected boundaries with `027` and `028` (found by reading their plan.md, not stated in spec.md)

- **Feature `028` (Attribution & ROI)**: FR-013 requires tracking "ROI" per campaign alongside Allocated/Committed/Actual/Remaining/Forecast Budget, Variance, and Burn Rate. Unaddressed by spec.md, this ROI figure risks independently recomputing what `028` already owns as its formula engine (Marketing ROI, `028` FR-043). **Ownership decision, applying the same pattern already corrected once for `032` and originally established for `027`**: this feature's budget-tracking view **displays** ROI computed by `028`'s existing financial-formula engine, fed by this feature's Allocated/Committed/Actual spend data as inputs — it does not run a second, independent ROI calculation. Burn Rate, Variance, and Forecast Spend (pace-of-spend metrics, not revenue-basis financial formulas) remain natively owned by this feature, since `028` has no equivalent concept.
- **Feature `027` (Marketing Analytics)**: this feature's Executive Dashboard (FR-037), Operational KPIs/scorecards (FR-038–FR-039), and operational analytics (FR-040) are **operations-specific** (budget accuracy, approval cycle time, resource utilization, cost per campaign) — a different metric domain from `027`'s marketing-performance/attribution analytics and from `032`'s journey-execution analytics, so no metric-level duplication exists. **Ownership decision**: consistent with the established pattern (`026`, `028`, `030`, `031`, `032` all render through `027`'s existing Dashboard framework rather than building a parallel dashboard stack), this feature's Executive Dashboard and scorecards render through `027`'s Dashboard framework as operations-specific dashboard templates, rather than a sixth independent dashboard implementation.

### 5. Audit logging: reuse, not redefinition

Spec.md's own Key Entities list a feature-local "Audit Log Entry," matching a recurring pattern already corrected for `027` (which established the platform-wide marketing Audit Log Entry) and reused as-is by `028`, `029`, `030`, `031`, and `032`. **Ownership decision**: this feature writes into that same existing Audit Log Entry (ultimately backed by `001`/`016`'s audit-log interceptor) rather than defining a seventh parallel audit-log entity.

### 6. Genuinely new, non-duplicative ground

Vendor/Procurement (FR-020–FR-023) is explicitly scoped by spec.md's own Assumptions as distinct from Volume 11's Digital Marketplace vendor/seller model and from any later Volume 14 Part 2+ enterprise procurement chapter (Feature `057`) — no contradiction found, no feature currently planned owns marketing-specific vendor/procurement governance. Resource/Capacity Planning (FR-024–FR-026), Risk Management (FR-031–FR-032), Compliance/Legal Review (FR-033–FR-034), Brand Governance (FR-035), and Campaign Documentation (FR-036) are all genuinely new capabilities with no prior-feature owner. These are implemented natively by this feature.

### 7. Preserved NEEDS CLARIFICATION items (not resolved here)

- The `022`/`032` engine-relationship gate (reaffirmed above, unresolved).
- The `018`/`033` Campaign-entity reconciliation (flagged above, unresolved pending schema-level confirmation).
- FR-018/Edge Cases: who may invoke "Emergency" approval bypassing the sequential financial chain, any amount ceiling, and whether retroactive review is mandatory.
- Edge Cases: PO-to-invoice reconciliation rule on amount mismatch; approval-chain timeout/escalation-on-non-response; capacity-conflict override behavior; re-approval threshold for post-approval budget/objective changes; shared-budget-pool (Emergency/Contingency) reconciliation across competing campaigns; vendor SLA/rating-breach consequence workflow.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–032.

**Primary Dependencies**: NestJS, Next.js; extends `018`'s Campaign entity rather than redefining it (pending confirmation, see analysis above); reuses `016`'s escalating-approval-chain mechanism for both the financial and campaign approval workflows; reuses `022`'s (or the eventual `022`/`032` resolution's) trigger/condition/action substrate for FR-010's internal operational automations; feeds budget/spend data into `028`'s ROI formula engine rather than recomputing it; renders dashboards through `027`'s Dashboard framework; AI Marketing Operations Assistant consuming `008`'s AI gateway.

**Storage**: PostgreSQL (~12 entities per spec.md's Key Entities — Campaign Request/Campaign [extending `018`'s], Budget Category, Cost Center Mapping, Approval Step/Financial Approval Chain, Vendor, Purchase Order/Procurement Record, Risk Record, Resource/Resource Capacity Plan, Task, Milestone, Marketing Calendar Entry, AI Recommendation domains; Audit Log Entry reused from `027`/`001`/`016` rather than redefined).

**Testing**: Jest (backend — lifecycle-stage-order-cannot-be-skipped, no-spend-exceeds-approved-budget-without-matching-approval-level, and ai-recommendation-never-auto-changes-campaign-record contract tests are the highest-stakes tests here, matching this spec's own SC-001, SC-002, and SC-007/Constitution Article II), Playwright (web e2e — campaign governance lifecycle view, financial approval chain routing, procurement workflow, risk register).

**Target Platform**: Web (Admin/Finance Portal, rendered inside `017`'s workspace shell); this is the internal operations-governance layer sitting alongside `018`'s campaign definitions and `028`'s financial-formula engine.

**Performance Goals**: Campaign/Budget/Resource dashboards under 3s; Approval Workflow view under 2s; Executive Dashboard under 5s (FR-047).

**Constraints**: No campaign reaches "Campaign Active" without passing every governance stage in order, verified via audit trail (FR-001, FR-005, SC-001); zero campaigns record Actual Spend exceeding Allocated Budget without a matching-level approval record (FR-018, SC-002); every campaign change/budget edit/approval/rejection/vendor update is audit-logged (FR-042, SC-005); every AI Marketing Operations Assistant output is advisory and requires human action before any linked record changes (FR-044, SC-007, Constitution Article II); every procurement record remains within its 8-step workflow with no out-of-workflow spend posted (FR-022–FR-023, SC-009).

**Scale/Scope**: ~12 data entities (plus reuse of `018`'s Campaign, `016`'s approval-chain mechanism, `022`'s automation substrate, `027`'s Dashboard framework/Audit Log Entry, and `028`'s ROI engine), 47 functional requirements (FR-001–FR-047), 7 user stories, a 12-stage governance lifecycle, a 6-level financial approval chain, an 8-step procurement workflow, and multiple NEEDS CLARIFICATION items — most significantly the reaffirmed, unresolved `022`/`032` gate and the newly-flagged `018`/`033` Campaign-entity reconciliation, plus FR-018's Emergency-approval authorization rules and several Edge-Cases items (PO/invoice reconciliation, approval-chain timeout escalation, capacity-conflict override, re-approval threshold, shared-budget-pool reconciliation, vendor SLA-breach consequence).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Lifecycle-stage transitions, budget calculations, and approval-chain routing are entirely server-side; no client-asserted stage or approval | **PASS — direct implementation (not the constitution's named source for this article)** | FR-001, FR-017 |
| II. AI Is Assistive, Never Autonomous | **FR-044 and FR-045 both cite "Constitution Article II" verbatim** — every AI Marketing Operations Assistant output is advisory, requires human review, and a deterministic non-AI fallback is guaranteed | **PASS — direct implementation, spec.md explicitly applies this article twice** | FR-043–FR-045, SC-007 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A for this chapter's own surface — internal operations/governance tooling with no customer-facing claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | Every stage transition, approval/rejection decision, and audit entry is immutable and timestamped; budget edits are tracked as audit history rather than silently overwritten | **PASS (aligns; not the constitution's named source for this article)** | FR-001, FR-019, FR-042 |
| V. Ledger-Based Internal Economies | N/A — this feature tracks marketing operational budget, not a redeemable point/wallet balance | **PASS (N/A)** | — |
| VI. Consent Is First-Class | N/A — this feature governs internal marketing operations, not customer-facing consent-gated communication | **PASS (N/A)** | — |
| VII. Layered, Explicit RBAC | **FR-016 and FR-017 both cite "Constitution Article VII" verbatim** — the 6-level financial approval chain is explicitly named as "the direct, concrete instantiation" of this article, reusing `016`'s constitution-cited escalating-approval-chain mechanism | **PASS — direct implementation, spec.md explicitly applies this article twice** | FR-016–FR-019 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | N/A for this chapter's own surface — internal operations tooling | **PASS (N/A)** | — |
| Security & Compliance Baseline | RBAC, MFA, encryption, audit trails, IP restrictions, secure file storage; GDPR/CCPA compliance checks sit alongside the full platform baseline per spec.md's own Assumptions | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-046, spec.md Assumptions |

No constitutional violations. No Complexity Tracking entries required for principle compliance. The `022`/`032` gate and the `018`/`033` Campaign-entity question are documented, unresolved ownership items (see analysis above), not constitutional violations.

## Project Structure

### Documentation (this feature)

```text
specs/033-marketing-operations-governance/
├── plan.md
├── research.md      # Phase 0 — MUST resolve, in priority order: (1) confirm this feature does not add a third automation engine pending the 022/032 gate; (2) confirm the Campaign Registry extends 018's Campaign entity rather than duplicating it; (3) Emergency-approval authorization rules (who, ceiling, retroactive review); (4) PO-to-invoice reconciliation rule; (5) approval-chain timeout/escalation-on-non-response rule; (6) capacity-conflict override behavior; (7) re-approval threshold for post-approval changes; (8) shared-budget-pool reconciliation rule; (9) vendor SLA/rating-breach consequence workflow
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`032`'s structure — no new top-level projects; this feature extends `018`'s Campaign entity, reuses `016`'s approval-chain mechanism, `022`'s automation substrate (pending the `022`/`032` resolution), `027`'s Dashboard framework/Audit Log Entry, and `028`'s ROI engine.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── campaign-governance-lifecycle/  # 12-stage lifecycle, Campaign Registry extension of 018 (FR-001–FR-006)
│   │   ├── marketing-calendar/             # Marketing Calendar Entry (FR-007–FR-008)
│   │   ├── marketing-asset-requests/       # asset request submission linked to campaign (FR-009)
│   │   ├── operational-automation/         # FR-010 workflows, thin layer on 022's/032's resolved substrate (FR-010)
│   │   ├── budget-management/              # Budget Category, burn-rate/variance/forecast, alerts (FR-011–FR-015)
│   │   ├── financial-approval-chain/       # Approval Step, 6-level chain on 016's mechanism (FR-016–FR-019)
│   │   ├── vendor-procurement/             # Vendor, Purchase Order/Procurement Record (FR-020–FR-023)
│   │   ├── resource-capacity-planning/     # Resource, capacity calculations (FR-024–FR-026)
│   │   ├── team-collaboration-tasks/       # workspace, Task, Milestone, project timeline (FR-027–FR-030)
│   │   ├── risk-compliance-legal/          # Risk Record, compliance checks, Legal Review, brand governance, documentation (FR-031–FR-036)
│   │   ├── operations-reporting/           # Executive Dashboard (via 027), KPIs, scorecards, analytics, notifications, audit (FR-037–FR-042)
│   │   ├── ai-operations-assistant/        # AI Marketing Operations Assistant (FR-043–FR-045)
│   │   └── operations-security/            # RBAC/MFA/encryption/audit/IP restrictions (FR-046)
│   └── common/                             # reused from 018: Campaign entity; reused from 016: approval-chain mechanism, RBAC; reused from 001: org hierarchy; reused from 022/032: automation substrate (pending resolution); reused from 027: Dashboard framework, Audit Log Entry; reused from 028: ROI engine; reused from 008: AI gateway
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── operations/{campaigns, calendar, budgets, approvals, vendors, resources, risks, executive}/
```

**Structure Decision**: 12 new backend modules under `campaign-governance-*`/`budget-*`/`financial-approval-*`/`vendor-*`/etc., explicitly wired to reuse `018`/`016`/`022`/`027`/`028` rather than redefining their entities. `campaign-governance-lifecycle` (stage-order enforcement) and `financial-approval-chain` (Article VII compliance) are built and contract-tested first. **No module may begin implementation against a new, independent `Campaign` entity or a fourth automation engine until the flagged ownership questions are resolved.**

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations; the 022/032 and 018/033 entity questions are documented open ownership items, not approved exceptions | — | — |
