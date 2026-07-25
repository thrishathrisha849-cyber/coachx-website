# Implementation Plan: Marketing Analytics, Attribution Modeling & Executive Intelligence

**Branch**: `027-marketing-analytics-attribution` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/027-marketing-analytics-attribution/spec.md`

## Summary

This feature builds the platform's centralized marketing intelligence layer: a 7-stage analytics pipeline (Marketing Channels & TBT Modules → Event Collection & Ingestion → Validation/Cleaning/Identity Resolution → Marketing Data Warehouse → Metric & Attribution Calculation Engine → Analytics/Forecasting/AI Intelligence → Operational/Management/Executive Dashboards) ingesting from every internal TBT module, every marketing channel, and named external platforms; a standardized event-tracking framework (16 event types, a fixed 21-field event schema); an identity-resolution engine merging anonymous and known interactions with confidence scoring and audit trail; campaign/channel/funnel/customer-journey analytics; attribution-model *configuration and dashboard-level summary reporting* for the 7 standard models (First-Touch, Last-Touch, Linear, Time-Decay, Position-Based, Data-Driven, Custom) — the underlying credit-distribution calculation logic itself is owned by `028` and consumed here rather than duplicated (see correction note below); conversion definitions, revenue attribution, and ROI/budget summary display drawing on `028`'s financial-formula engine; cohort/retention/CLV analytics; content/geographic/device analytics; an Executive Intelligence Dashboard with an AI-generated executive narrative; 6 role-specific dashboards (CEO, CMO, Marketing Manager, Performance Marketer, Content Manager, Finance); custom no-code dashboards and a validated custom report builder with scheduled delivery; AI-generated insights and predictive forecasting; anomaly detection and alerting; data governance (a metric data dictionary, continuous data-quality monitoring, approval-gated historical reprocessing); multi-currency/multi-timezone support; and access control, privacy, audit, export, and API layers.

**This chapter is not cited by name in the constitution's own source list, but its own text self-applies two constitutional articles directly in the User Story rationale, not merely in FR wording**: User Story 5's "Why this priority" states the AI-generated executive narrative "directly engag[es] Constitution Article II (AI Is Assistive, Never Autonomous)," backed by FR-050's advisory-only/human-review requirement for every AI insight; User Story 6's "Why this priority" states historical reprocessing "directly reflect[s] Constitution Article IV (Historical Immutability)," backed by FR-068's approval-gated, impact-previewed, rollback-capable reprocessing workflow — the Edge Cases section separately invokes Article IV again for the consent-withdrawal-after-historical-inclusion scenario. This is a distinct citation pattern from the FR-text-verbatim self-citation seen in `018`/`020`–`023`/`025`(FR)/`026`(FR): here the constitutional grounding is stated explicitly in the *user-story rationale* for two separate stories rather than inside FR numbering itself.

**This spec carries forward one genuine, explicitly flagged cross-chapter overlap, and documents a correction to how a second one was originally framed here, rather than silently resolving either**: (1) spec.md's own Assumptions flag that the *very next* source chapter, Feature `028` (`attribution-roi-measurement`, Ch 15), appears by title to re-specify ground already covered here (§16–§29: attribution models, conversion definitions, revenue attribution, marketing ROI) — spec.md explicitly marks this **[NEEDS CLARIFICATION: whether 028 is a genuine deeper extension or a redundant re-specification]**; per the correction below, this feature is canonical for event-tracking, identity-resolution, and executive/role-based dashboard infrastructure, while `028` is canonical for attribution-model calculation logic and the financial-formula library, so `028`'s own spec/plan is not required to duplicate that infrastructure and this feature's dashboards consume `028`'s calculations rather than re-deriving them. (2) Feature `037` (`enterprise-attribution-mmm`, Volume 14 Part 2 Ch 4) is a **later, clearly-differentiated** extension — incrementality testing, controlled experiments, and media mix modeling built *on top of* this chapter's Tracked Event/Attribution Model/Attribution Window entities, not a duplicate, and its own plan must reference this spec's entities as its data foundation rather than redefining them.

**Correction (2026-07-23, applied following a formal ownership/overlap analysis performed while planning `028`)**: this Summary previously claimed 027 was canonical owner of "the seven-model attribution engine, revenue/ROI calculation" in addition to event-tracking, identity-resolution, and dashboards. That formal analysis — documented in full at `specs/028-attribution-roi-measurement/plan.md` §1–§6 — found this claim directly conflicted with `028`'s own spec.md, which explicitly states *028* is "the authoritative source of attribution-model logic, financial formulas, and the finalization workflow that feature 027's dashboards should consume rather than re-implement." The conflict is resolved in `028`'s favor for those two specific areas: this feature (027) retains the `Attribution Model` *entity* and its configuration/lifecycle (draft/testing/version/approval/rollback per FR-033–FR-034) and displays the resulting numbers on its dashboards, but the actual per-touchpoint credit-distribution math for every model and the CAC/CLV/ROAS/ROI/Payback-Period formula engine behind FR-038's metric list are owned and computed by `028`. This feature's own attribution-engine tasks (see tasks.md's US3 phase) should be read as configuring and displaying `028`'s calculated results, not independently computing a second, potentially divergent credit distribution or ROI figure — two independently-computed CAC/ROI numbers on the same platform would itself be the "misleading ROI reporting" both chapters' risk registers warn against.

Per spec.md's own Assumptions, this feature reuses rather than redefines: consent capture (Constitution Article VI, `002`/`003`) — this module only enforces consent already captured, at ingestion time; the unified customer identity/account system (Volume 3 / `003`) as the anchor for "known" customer IDs; platform-wide RBAC (Constitution Article VII, `001`/`016`) — this spec defines only the analytics-specific permission categories (FR-071); finance-approved cost data reconciled against `009`'s Membership/Payments/Revenue Operations ledger, not redefined here; and the Data-Driven Attribution/AI-narrative capabilities running on `008`'s AI service layer, subject to Article II's server-side-only execution, mandatory human review, and deterministic-fallback requirements.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–026.

**Primary Dependencies**: NestJS, Next.js; a high-throughput event-ingestion pipeline supporting batch, near-real-time, and scheduled-recalculation processing (FR-001); Data-Driven Attribution and executive-narrative generation consuming `008`'s AI gateway (FR-031, FR-049–FR-050); identity resolution reading `003`'s account system as the "known" anchor (FR-007–FR-009); finance-cost sync from `009` (FR-038–FR-039); an integration framework touching `019` (CDP), `013` (CRM), `018` (Campaign Management), `020`/`021` (Email/SMS/WhatsApp/Push), `022` (Workflow Automation), `023` (Landing Pages/Forms), `024` (Lead Management), `025` (AI Marketing Assistant), `026` (A/B Testing), `009` (Membership/Payments), and community/course/ebook/podcast/referral platforms (FR-077).

**Storage**: PostgreSQL for governance/config entities, a columnar/warehouse-style store for the Marketing Data Warehouse and Tracked Event volume (~20 entities per spec.md's Key Entities — Tracked Event, Identity Resolution Record, Attribution Model, Attribution Window, Conversion Definition, Campaign/Channel Performance Record, Customer Journey, Funnel Definition, Cohort, Dashboard, Custom Report, Executive Narrative, AI Insight, Anomaly Alert, Metric Data Dictionary Entry, Data Quality Issue, Historical Reprocessing Job, Cost Record, Budget, Audit Log Entry domains), with Tracked Event as the append-only atomic record every downstream calculation is built from and Audit Log Entry immutable.

**Testing**: Jest (backend — event-schema-completeness-and-real-time-visibility, attribution-credit-sums-to-100-percent-with-no-double-counting, and historical-reprocessing-requires-approval-before-commit contract tests are the highest-stakes tests here, matching this spec's own SC-002/User Story 1, SC-007/User Story 3, and SC-010/User Story 6/Constitution Article IV), Playwright (web e2e — role-specific dashboard rendering, custom report builder validation, executive narrative review).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell) plus mobile-web/app executive summary views (FR-080); this is the cross-cutting intelligence layer sitting above every other Wave 1/Wave 2 feature's event stream.

**Performance Goals**: Executive Intelligence Dashboard initial load under 3s, filter updates under 2s; new events visible within 60s; standard reports under 10s, large reports under 60s, scheduled delivery within 15 minutes; attribution recalculation under 5 minutes, anomaly detection under 5 minutes (FR-078, SC-001–SC-004).

**Constraints**: Every tracked event contains the full 21-field standardized schema and is visible in the pipeline within the real-time target (FR-005, SC-002); malformed/unknown campaign IDs are flagged as data-quality issues rather than silently accepted (User Story 1, acceptance scenario 3); uncertain identity matches route to manual review rather than auto-merging (FR-009, User Story 2, acceptance scenario 3); attribution credit sums to 100% of conversion value with zero cross-report/cross-model double-counting (FR-028, FR-037, SC-007); Data-Driven Attribution results are blocked from financial/executive use until human review and model-governance approval complete (FR-032, User Story 3, acceptance scenario 3); every AI-generated insight/narrative statement carries a confidence score and supporting evidence and is treated as advisory only (FR-050, SC-008); historical reprocessing that alters previously reported figures requires an impact preview and explicit approval before commit, with rollback where technically possible (FR-068, SC-010, Constitution Article IV); role-specific dashboards withhold financial/customer-level detail from unauthorized roles (FR-071, SC-009); historical exchange rates and time-zone-aware aggregation remain stable regardless of when a report is viewed (FR-069–FR-070).

**Scale/Scope**: ~20 data entities, 81 functional requirements (FR-001–FR-081), 8 user stories, a 7-stage pipeline, 16 standardized event types, 7 attribution models plus Custom, 6 role-specific dashboards, a 77-source integration framework (internal + external + TBT modules), and 1 major NEEDS CLARIFICATION item in spec.md's Assumptions — whether Feature `028` is a genuine extension of or a redundant re-specification of this chapter's attribution/ROI capabilities (§16–§29), pending which this feature is treated as the canonical owner.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Event validation, identity resolution, attribution calculation, and anomaly detection are entirely server-side; no client-asserted metric or attribution result | **PASS — direct implementation (not the constitution's named source for this article)** | FR-001, FR-007, FR-025 |
| II. AI Is Assistive, Never Autonomous | **User Story 5's own rationale states this "directly engag[es] Constitution Article II"** — every AI insight/executive-narrative statement is advisory, carries a confidence score and supporting evidence, and requires human review before informing a consequential decision | **PASS — direct implementation, spec.md explicitly applies this article** | FR-049–FR-050, FR-031–FR-032, SC-008 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A for this chapter's own surface — this is an internal analytics/reporting layer with no customer-facing claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | **User Story 6's own rationale states this "directly reflect[s] Constitution Article IV"** — historical reprocessing requires an impact preview and explicit approval before committing changes to previously reported figures, with rollback where technically possible | **PASS — direct implementation, spec.md explicitly applies this article** | FR-068, User Story 6, SC-010 |
| V. Ledger-Based Internal Economies | N/A — this feature reports on revenue/cost, it does not manage a redeemable point/wallet balance | **PASS (N/A)** | — |
| VI. Consent Is First-Class | Event processing is consent-aware, honoring restricted tracking for opted-out users; consent capture itself is owned by `002`/`003` per spec.md's own Assumptions | **PASS (aligns; consent capture deferred to 002/003 per spec.md Assumptions, enforcement is this feature's own)** | FR-072, User Story 1 acceptance scenario 4 |
| VII. Layered, Explicit RBAC | Granular role-based permissions gate dashboard/financial/customer-level data, report creation, attribution-model approval, and historical reprocessing | **PASS (extends 001/016)** | FR-071 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Multi-timezone and geographic-region reporting; language is a dashboard filter dimension | **PASS (aligns; not the constitution's named source for this article)** | FR-011, FR-070 |
| Security & Compliance Baseline | RBAC, consent-aware processing, data masking, audit logging, secure APIs, export controls, data-retention rules | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-071–FR-076 |

No constitutional violations. No Complexity Tracking entries required for principle compliance. The `027`/`028` overlap is a documented source-level ambiguity (see Summary), not a constitutional violation.

## Project Structure

### Documentation (this feature)

```text
specs/027-marketing-analytics-attribution/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: whether Feature 028 is a genuine deeper extension of, or a redundant re-specification of, this chapter's attribution/ROI capabilities (§16–§29) — the single most significant open item, since it determines whether 028's plan.md may proceed independently or must be built strictly as a thin extension of this one
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`026`'s structure — no new top-level projects; this feature ingests events from nearly every prior feature and is in turn read by `028` and extended by `037`.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── analytics-ingestion/        # event pipeline, 16 event types, 21-field schema (FR-001–FR-006)
│   │   ├── identity-resolution/        # Identity Resolution Record, merge/audit (FR-007–FR-009)
│   │   ├── campaign-channel-analytics/ # Campaign/Channel Performance Record, dashboards (FR-010–FR-020)
│   │   ├── funnel-journey-analytics/   # Funnel Definition, Customer Journey (FR-021–FR-024)
│   │   ├── attribution-engine/         # Attribution Model, Attribution Window, 7 models + Custom (FR-025–FR-035)
│   │   ├── conversion-revenue-roi/     # Conversion Definition, revenue attribution, ROI, budgets (FR-036–FR-040)
│   │   ├── cohort-retention-clv/       # Cohort, retention/churn, CLV (FR-041–FR-043)
│   │   ├── content-geo-device-analytics/ # content/geographic/device analytics (FR-044–FR-046)
│   │   ├── executive-intelligence/     # Executive Narrative, AI Insight, KPI dashboard (FR-047–FR-050)
│   │   ├── role-dashboards/            # 6 role-specific Dashboard configs (FR-051–FR-056)
│   │   ├── custom-dashboards-reports/  # Custom Report, scheduling/delivery (FR-057–FR-059)
│   │   ├── ai-predictive-analytics/    # AI Insight generation, forecasting (FR-060–FR-061)
│   │   ├── anomaly-alerts-benchmarking/ # Anomaly Alert, alert config, benchmarking (FR-062–FR-064)
│   │   ├── analytics-governance/       # Metric Data Dictionary, Data Quality Issue, reprocessing (FR-065–FR-068)
│   │   ├── analytics-currency-timezone/ # multi-currency/multi-timezone handling (FR-069–FR-070)
│   │   └── analytics-access-audit-api/ # RBAC, privacy, Audit Log Entry, export, sharing, APIs (FR-071–FR-077)
│   └── common/                         # reused from 002/003: consent capture; reused from 003: identity anchor; reused from 001/016: RbacGuard; reused from 008: AI gateway; reused from 009: finance cost data
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── analytics/{dashboard, executive, roles/[role], reports/builder, reports/scheduled, alerts, governance}/
```

**Structure Decision**: 16 new backend modules under `analytics-*`/`identity-resolution`/`attribution-engine`/etc., each mapping to one of spec.md's FR groupings. `analytics-ingestion` (event-schema integrity) and `attribution-engine` (double-counting-free credit calculation) are built and contract-tested first, since every other module depends on their correctness. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
