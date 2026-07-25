# Implementation Plan: Marketing Attribution, Revenue Impact & ROI Measurement

**Branch**: `028-attribution-roi-measurement` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/028-attribution-roi-measurement/spec.md`

## Summary

This feature builds the platform's finance-grade attribution and ROI measurement engine: a core entity model (Customer, Touchpoint, Conversion, Attribution Result, Marketing Cost) purpose-built for financial defensibility; touchpoint eligibility rules and engagement-quality weighting; a 19-model attribution catalog (First-Touch, Last-Touch, Lead-Creation, Opportunity-Creation, Linear, Position-Based, Time-Decay, U-Shaped, W-Shaped, Full-Path, Custom Rule-Based, Data-Driven, Markov Chain, Shapley Value, View-Through, Assisted-Conversion identification, Cross-Device, Offline, Account-Based); revenue-integrity deduplication and refund/cancellation/chargeback adjustment; recurring and lifetime revenue attribution; marketing cost allocation and finance reconciliation; the full CAC/CLV/ROAS/ROI/Contribution-Margin/Payback-Period formula library with mandatory revenue-basis labeling; incrementality measurement (holdout/geo-holdout/RCT/diff-in-diff/causal-impact); a deferred Marketing Mix Modeling capability; model comparison, simulation, and versioning; an 8-state Attribution Finalization/Lock workflow; an AI ROI Intelligence Engine constrained to a defined recommendation action set with mandatory human approval; four finance-grade dashboards (Attribution, Revenue Impact, ROI, Executive Revenue Intelligence); and governance, RBAC, approval-workflow, audit, privacy/fraud, multi-currency/tax, and integration/API/performance requirements.

## Ownership & Overlap Analysis (Feature 027 vs Feature 028)

Per instruction, this analysis was performed section-by-section against `027`'s spec.md and plan.md **before** any tasks.md content was drafted, treating `027` as the default canonical owner and requiring an explicit spec-level statement to override that default for any specific area.

### 1. Canonical functionality — remains owned by Feature 027, consumed (not re-implemented) by 028

- **Event ingestion and the Tracked Event stream** (027 FR-001–FR-006): 028's Touchpoint (FR-002) and Conversion (FR-003) entities are **derived, attribution-scoped views built from 027's already-ingested Tracked Event records**, not a second ingestion pipeline. 028 does not re-collect data from source modules/channels/external platforms — it consumes 027's event stream.
- **Identity resolution** (027 FR-007–FR-009): 028's Customer entity (FR-001) — despite its own field list (customer ID, anonymous visitor ID, device identifiers, consent status) — **references 027's Identity Resolution Record as the resolved-identity anchor**, consistent with 028's own Assumptions statement that "the underlying Customer... data [is] supplied by upstream modules." 028 does not run a second identity-resolution engine.
- **General-purpose dashboard/reporting infrastructure**: the `Dashboard` entity, widget framework, custom no-code dashboard builder, Custom Report Builder, and scheduled-report delivery (027 FR-010, FR-057–FR-059) remain owned by 027. 028's four finance dashboards (§ below) are dashboard **templates that plug into 027's Dashboard framework**, not a competing dashboard system.
- **Role-based dashboard framework, including the Finance role dashboard shell** (027 FR-051–FR-056): 027 owns the six-role dashboard framework and RBAC-gated rendering; 028 supplies the deep financial content Finance/CMO/Performance-Marketer views surface, it does not rebuild the role-dashboard mechanism.
- **Executive Narrative generation** (027 FR-049–FR-050): 028's "generated executive narrative" (FR-070) is **additional input content feeding 027's single Executive Narrative generator**, not a second, independently-generated AI narrative. Two independently-generated executive narratives on the same platform would itself violate the no-double-counting/no-misleading-insight principle both chapters' risk registers name.
- **Campaign/Channel/Funnel/Customer Journey analytics** (027 FR-010–FR-024): unchanged, fully owned by 027; 028 does not redefine funnel or journey analytics.
- **Cohort/Retention/CLV summary analytics, Content/Geographic/Device analytics** (027 FR-041–FR-046): remain owned by 027 as summary-level reporting; 028's CLV **calculation formula** (FR-047–FR-048) is the authoritative source those summaries should call into (see §2).
- **Anomaly detection/alerting, data governance (Metric Data Dictionary, Data Quality monitoring), multi-currency/multi-timezone base infrastructure, RBAC/audit/export/API base layer, Cost Record and Budget entities** (027 FR-062–FR-081): remain owned by 027. 028 extends the Cost Record and Audit Log Entry specifically (see §2) rather than duplicating them.
- **The `Audit Log Entry` entity**: 027 already owns a platform-wide immutable audit-log entity. **028 MUST write into 027's Audit Log Entry rather than defining a second, parallel audit-log entity** — this is a clear literal duplication in 028's own Key Entities list (028 names its own "Audit Log Entry") that this plan resolves in favor of reuse, not a second entity.

### 2. New functionality — introduced and owned by Feature 028

- **12 attribution models 027 does not define**: Lead-Creation (FR-018), Opportunity-Creation (FR-019), U-Shaped (FR-023), W-Shaped (FR-024), Full-Path (FR-025), Markov Chain (FR-028, MAY), Shapley Value (FR-029, MAY), View-Through (FR-030), Assisted-Conversion identification (FR-031), Cross-Device (FR-032), Offline (FR-033), Account-Based (FR-034). These are genuinely new and owned outright by 028.
- **The `Attribution Result` entity** (FR-004): a granular, per-touchpoint-per-conversion credit record with its own confidence score and finalization status — 027 has no equivalent entity (027's Attribution Model/Attribution Window describe the *method*, not a *result record*). New, owned by 028.
- **Revenue-integrity deduplication and refund/cancellation/chargeback adjustment mechanics** (FR-035–FR-036): 027 FR-037 states the *requirement* ("must avoid double-counting") at one line; 028 supplies the actual **deduplication engine and adjusted-net-revenue mechanism** that makes that requirement enforceable. Owned by 028; 027's requirement becomes a consumer of 028's mechanism.
- **Recurring and lifetime revenue attribution** (FR-037–FR-038): not present in 027 at all. New, owned by 028.
- **Incrementality Measurement** (FR-050–FR-051) and the Holdout Group/Treatment Group/Control Group/Incrementality Experiment entities: entirely absent from 027. New, owned by 028.
- **Marketing Mix Modeling** (FR-052–FR-053, MAY): absent from 027. Per 028's own Assumptions, this is explicitly flagged as belonging more fully to Feature `037` (`enterprise-attribution-mmm`) — 028 implements only the "may support" baseline the source names for this chapter, and defers the full MMM specification to `037` rather than building competing depth here.
- **Model Comparison, Simulation & Versioning** (FR-054–FR-056): absent from 027. New, owned by 028, though it operates on the same underlying Attribution Model entity 027 defined (see §3).
- **Attribution Finalization & Revenue Reconciliation state machine** (FR-057–FR-060) and the Reconciliation Record entity: absent from 027. New, owned by 028 — **with one flagged discrepancy, see §4**.
- **The full financial-formula library**: Contribution Margin (FR-044), the 9 CAC variants (FR-045), funnel cost-efficiency (FR-046), CLV-to-CAC ratio with risk classification (FR-048), Payback Period (FR-049), and the multi-basis ROAS/ROI breakdowns (FR-042–FR-043). 027 FR-038 names these metrics as a flat 13-item list for its dashboard summary cards; **028 owns the actual calculation logic, revenue-basis labeling, and included/excluded-cost disclosure** — 027's dashboard cards must call into 028's formulas rather than computing a second, potentially divergent CAC/CLV/ROI number. This is the single most important ownership decision in this analysis: two independently-computed CAC figures on the same platform would itself be the "misleading ROI reporting" both chapters' risk registers warn against.
- **AI ROI Intelligence Engine with a defined, bounded recommendation action set** (FR-061–FR-066) and financial scenario modeling: 027 FR-060–FR-061 has a generic "AI Intelligence Engine surfaces insights" and generic predictive forecasting; 028's version is a **distinct, ROI/budget-specific specialization** — new, owned by 028, though its output entity extends 027's `AI Insight` shape (see §3) rather than introducing an unrelated insight format.
- **Marketing cost allocation methods and the reconciliation-status state machine** (FR-039–FR-041): 027 FR-039 owns generic Cost Record management; 028 owns the **allocation-method logic and the Unverified→Imported→Matched→Partially matched→Approved→Disputed→Finalized reconciliation state machine** layered on top of 027's Cost Record.
- **Four finance-grade dashboards**: Attribution Dashboard (FR-067), Revenue Impact Dashboard (FR-068), ROI Dashboard (FR-069), Executive Revenue Intelligence view (FR-070) — new dashboard *content* owned by 028, rendered through 027's Dashboard framework (§1).
- **Fraud/bot/invalid-traffic exclusion specific to attribution/ROI** (FR-076) and **tax/fee treatment configuration** (FR-078): not present in 027. New, owned by 028.
- **The generic `Approval Request` entity**: 027 has no reusable approval-workflow entity (its Historical Reprocessing Job and Data-Driven Attribution gates embed approval inline). 028 introduces a proper, reusable Approval Request entity for model/cost/revenue-correction/finalization/budget approvals — new, owned by 028, and a candidate for 027 (and `037`) to adopt in a future consolidation pass, though that is not required now.

### 3. Extended, not duplicated: FR-by-FR traceability back to Feature 027

| 028 requirement | Extends 027 entity/FR | Relationship |
|---|---|---|
| FR-001 Customer entity | Identity Resolution Record (FR-007–FR-009) | 028's Customer is an attribution-scoped reference into 027's resolved identity, not a third identity system |
| FR-002 Touchpoint entity | Tracked Event (FR-005–FR-006) | Derived/enriched view of 027's ingested events, adding eligibility/weight/model fields |
| FR-003 Conversion entity | Conversion Definition (FR-036) + Tracked Event conversion records | Attribution-specific specialization, not a redefinition of what a conversion is |
| FR-005 Marketing Cost entity | Cost Record (FR-039) | Extends with reconciliation-status state machine and allocation method |
| FR-016 First-Touch, FR-017 Last-Touch, FR-020 Linear, FR-021 Position-Based, FR-022 Time-Decay, FR-027 Data-Driven | Attribution Model entity + FR-026/FR-027/FR-028/FR-029/FR-030 of 027 | Same 7 base models; 028 adds eligibility rules, engagement-quality weighting, and window-type distinctions on top of 027's existing model configuration, rather than defining a second competing model of each type |
| FR-026 Custom Rule-Based model | Custom Attribution Model (FR-033–FR-034) | Extends 027's rule vocabulary (adds channel/campaign priority, engagement quality, time proximity, lead score, sales involvement, offline interaction, device, geography) onto the same draft/testing/version/approval/rollback lifecycle 027 already owns |
| FR-042–FR-049 Financial formulas | Marketing ROI measurements (FR-038), Budget vs. actual (FR-040) | 028 is the calculation engine behind the metric names 027 already lists on its dashboard |
| FR-061–FR-066 AI ROI Intelligence | AI Insight entity (FR-050) | Same insight shape (title/explanation/metrics/confidence/impact/recommended action), specialized for budget/spend actions with an added risk level and bounded action set |
| FR-067–FR-070 Finance dashboards | Dashboard entity, Marketing Analytics Dashboard (FR-010), Executive Intelligence Dashboard (FR-047) | Dashboard *templates* rendered through 027's existing dashboard framework |
| FR-074 Audit logging | Audit Log Entry (027 Key Entities) | Writes into 027's existing immutable audit log; not a second entity |
| FR-075 Privacy/consent in attribution | Consent enforcement (FR-072) | Applies 027's existing consent-aware processing to attribution-specific fallback behaviors (aggregation, pseudonymization) |
| FR-077 Multi-currency | Multi-currency support (FR-069) | Extends 027's currency infrastructure with attribution/cost-specific conversion audit logging |

### 4. Flagged discrepancy — NOT silently resolved

**028's own spec.md Assumptions state that this feature's Attribution Finalization state machine (FR-057, FR-058) is "the authoritative implementation of the constitution's named example"** for Article IV's "attribution-model assignments are snapshotted... Finalized/Locked" language. Having checked the constitution directly, **this claim is not accurate as written**: the constitution's Article IV source comment (`.specify/memory/constitution.md` line 20) names **"Vol 14 Part 2 Ch 4 (attribution finalization states: Preliminary → Finance Reviewed → Finalized/Locked)"** — that is Feature `037` (`enterprise-attribution-mmm`), not this feature (Volume 14 **Part 1** Ch 15). This plan does **not** silently correct 028's spec.md text (per standing instruction, source specifications are never modified silently), and does **not** silently defer this feature's own finalization workflow to the unplanned `037`, since User Story 3/FR-057–FR-058 are explicit, tested requirements of *this* chapter and are needed now regardless of which chapter the constitution literally names. Instead:
- This feature builds its own 8-state finalization workflow (Preliminary, Processing, Calculated, Under review, Finance reviewed, Finalized, Reopened, Corrected) as specified, since it is a superset of the constitution's cited 3-state simplification and does not contradict it in substance.
- **Recommended correction (flagged, not applied)**: when Feature `037` is planned, its plan.md must explicitly reconcile with this feature's finalization state machine — either by adopting 028's 8-state model as the platform-wide implementation the constitution's citation should be read as pointing to, or by documenting why `037` needs a materially different state machine. `037` must not silently build a third, competing finalization workflow.
- **Recommended correction to Feature 027 (flagged, not applied)**: 027's own plan.md Summary currently states 027 is "canonical owner of... the seven-model attribution engine, revenue/ROI calculation" — this plan's §1–§3 analysis instead concludes 027 owns the event/identity/dashboard infrastructure while 028 owns attribution-model calculation logic and the financial-formula library, per 028's spec.md's own explicit, more specific claim ("this feature (028) as the authoritative source of attribution-model logic, financial formulas, and the finalization workflow that feature 027's dashboards should consume rather than re-implement"). This is a genuine contradiction between the two specs' self-declared ownership language, resolved here in favor of 028's more specific claim for calculation logic/formulas specifically, while preserving 027's ownership of ingestion/identity/dashboard-shell infrastructure. **027's plan.md Summary paragraph should be corrected in a follow-up pass to remove its "seven-model attribution engine, revenue/ROI calculation" canonical-ownership claim** — this is listed here as a recommended correction rather than applied silently.

### 5. Shared integration points

Both features integrate with (without either owning the other's internal model): `013` (CRM), `019` (CDP), `018` (Campaign Management), `020`/`021` (Email/SMS/WhatsApp/Push), `022` (Workflow Engine), `023` (Landing Pages/Forms), `024` (Lead Management), `025` (AI Marketing Assistant), `026` (A/B Testing), `009` (Membership/Payments), `030` (Referral/Affiliate), and external advertising/BI platforms. 028 additionally integrates with an Affiliate System and external Finance/Accounting systems not separately named in 027's integration list.

### 6. Preserved NEEDS CLARIFICATION items (from 028's own spec.md, not resolved here)

- Production default values for attribution-window length per conversion type, holdout-group sample-size/duration requirements, and the monetary/percentage threshold triggering mandatory approval for an AI budget recommendation.
- The specific algorithmic/statistical implementation intended for Data-Driven, Markov Chain, and Shapley Value attribution (affects what "confidence score" and "model coverage" concretely mean).
- The formal holdout-group contamination detection/exclusion procedure for incrementality experiments (User Story 5, acceptance scenario 4).
- Plus the ownership discrepancy documented in §4 above (constitution's Article IV citation naming `037`, not this feature, for the finalization state machine), tracked as its own open item since it affects how `037`'s eventual plan must be scoped.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–027.

**Primary Dependencies**: NestJS, Next.js; consumes `027`'s Tracked Event stream and Identity Resolution Record directly rather than re-ingesting or re-resolving identity; AI ROI Intelligence and Data-Driven/Markov Chain/Shapley Value attribution consuming `008`'s AI gateway; multi-currency conversion reusing `009`'s finance-approved exchange-rate infrastructure; renders through `027`'s Dashboard framework rather than a second dashboard stack.

**Storage**: PostgreSQL for governance/config entities, high-throughput storage for Touchpoint/Attribution Result volume (~12 entities per spec.md's Key Entities — Customer, Touchpoint, Conversion, Attribution Result, Marketing Cost, Attribution Model/Model Version, Holdout/Treatment/Control Group, Incrementality Experiment, Reconciliation Record, Approval Request, AI Recommendation domains; Audit Log Entry reused from `027` rather than redefined), with Attribution Result and Finalized-period snapshots immutable once locked.

**Testing**: Jest (backend — attribution-credit-never-exceeds-conversion-revenue-across-all-19-models, finalized-period-locked-against-direct-modification, and ai-roi-recommendation-requires-explicit-human-approval contract tests are the highest-stakes tests here, matching this spec's own SC-001, SC-002/Constitution Article IV, and SC-006/Constitution Article II), Playwright (web e2e — model comparison/simulation UI, finalization/reopen workflow, AI recommendation approval queue).

**Target Platform**: Web (Admin/Finance Portal, rendered inside `027`'s Dashboard framework, itself inside `017`'s workspace shell); this is the finance-grade calculation layer beneath `027`'s general-purpose analytics surface.

**Performance Goals**: Touchpoint processing under 60s; standard conversion attribution under 30s; dashboard initial load under 3s; model comparison under 10s; standard historical recalculation under 15 minutes; ROI dashboard filter update under 3s; attribution API response under 2s; alert generation under 5 minutes; executive summary generation under 15s (FR-081, SC-009).

**Constraints**: Multi-touch attribution results across every model sum to no more than the eligible conversion's revenue, with zero double-counting (FR-035, SC-001); Finalized attribution periods are locked against direct modification, with every correction traceable to reason/approver/audit entry/recalculation record (FR-057–FR-058, SC-002, Constitution Article IV); refunds/cancellations/chargebacks update net attributed revenue within the same processing cycle while retaining the original record (FR-036, SC-003); every ROAS/ROI/CAC/CLV/CLV-CAC/Payback result visibly labels revenue basis, included/excluded costs, attribution model, and currency (SC-004); every incrementality result is labeled with its measurement method and carries a confidence interval (SC-005); zero AI ROI recommendations execute without explicit human approval (FR-062, FR-064, SC-006, Constitution Article II); simulating a draft model produces zero changes to any finalized report (FR-055, SC-007); Disputed/Unverified cost data never silently flows into a finalized ROI figure (FR-041, SC-008); excluded fraud/bot/invalid-traffic records contribute to 0% of finalized calculations while remaining available for audit (FR-076, SC-010).

**Scale/Scope**: ~12 net-new/extended data entities (plus reuse of `027`'s Tracked Event, Identity Resolution Record, Dashboard, Cost Record, AI Insight, and Audit Log Entry), 82 functional requirements (FR-001–FR-082), 8 user stories, 19 attribution models, 9 CAC variants, 8 incrementality methods, an 8-state finalization workflow, and 3 NEEDS CLARIFICATION items in spec.md's Assumptions plus 1 cross-feature ownership discrepancy documented in this plan's §4 (constitution's Article IV citation naming `037` rather than this feature for the finalization state machine).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Attribution calculation, deduplication, finalization-state transitions, and reconciliation are entirely server-side; no client-asserted attribution result or finalization status | **PASS — direct implementation (not the constitution's named source for this article)** | FR-004, FR-057 |
| II. AI Is Assistive, Never Autonomous | **FR-062 cites "Constitution Article II" verbatim** — the AI ROI Intelligence Engine is limited to a defined recommendation action set, every recommendation carries evidence/impact/confidence/risk, and zero recommendations execute without explicit human approval | **PASS — direct implementation, spec.md explicitly applies this article** | FR-061–FR-066, SC-006 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A for this chapter's own surface — internal finance/attribution calculation with no customer-facing claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | **Spec.md's own Assumptions cite "Constitution Article IV" directly** for the Finalization state machine — see this plan's §4 for the flagged discrepancy regarding which chapter the constitution's own citation actually names | **PASS — direct implementation per spec.md's self-citation, with a documented citation discrepancy (§4) requiring reconciliation when `037` is planned** | FR-057–FR-058, SC-002 |
| V. Ledger-Based Internal Economies | N/A — this feature calculates attributed revenue/cost, it does not manage a redeemable point/wallet balance | **PASS (N/A)** | — |
| VI. Consent Is First-Class | Attribution falls back to aggregated/pseudonymized/consent-mode-estimated measurement where individual attribution is not permitted; consent capture itself remains owned by `002`/`003`/`027` | **PASS (aligns; consent capture deferred to 002/003/027, enforcement is this feature's own)** | FR-075 |
| VII. Layered, Explicit RBAC | Role-based permissions separately control customer-level, financial-level, model-creation/approval, and reprocessing access | **PASS (extends 001/016)** | FR-072 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | N/A for this chapter's own surface — no localized content generated here | **PASS (N/A)** | — |
| Security & Compliance Baseline | RBAC, approval workflows, immutable audit logging, currency/tax traceability, fraud/bot exclusion, tenant isolation, API security | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-072–FR-082 |

No constitutional violations. No Complexity Tracking entries required for principle compliance. The `027`/`028` ownership boundary and the Article IV finalization-citation discrepancy are documented source-level ambiguities (see §4), not constitutional violations.

## Project Structure

### Documentation (this feature)

```text
specs/028-attribution-roi-measurement/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: production default values (attribution-window length per conversion type, holdout-group sample-size/duration, AI-budget-recommendation approval threshold), the algorithmic/statistical implementation for Data-Driven/Markov Chain/Shapley Value attribution, the holdout-contamination detection/exclusion procedure, and — critically — the §4 ownership discrepancy (constitution's Article IV citation naming `037` rather than this feature for the finalization state machine)
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`027`'s structure — no new top-level projects; this feature is the finance-grade calculation layer consumed by `027`'s dashboards and is itself expected to be extended by `037`'s incrementality/MMM work.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── attribution-core-entities/      # Customer/Touchpoint/Conversion/Attribution Result/Marketing Cost, referencing 027 (FR-001–FR-005)
│   │   ├── touchpoint-eligibility/         # eligibility rules, engagement quality, attribution windows (FR-006–FR-010)
│   │   ├── conversion-revenue-classification/ # Conversion Definition extension, revenue taxonomy (FR-011–FR-015)
│   │   ├── attribution-model-catalog/      # 19 models; extends 027's Attribution Model for the shared 7 (FR-016–FR-034)
│   │   ├── revenue-integrity/              # deduplication, refund/cancellation adjustment, recurring/lifetime attribution (FR-035–FR-038)
│   │   ├── cost-allocation-reconciliation/ # extends 027's Cost Record with allocation + reconciliation state machine (FR-039–FR-041)
│   │   ├── financial-formulas/             # ROAS/ROI/Contribution Margin/CAC/CLV/CLV-CAC/Payback engine (FR-042–FR-049)
│   │   ├── incrementality-testing/         # Holdout/Treatment/Control, Incrementality Experiment (FR-050–FR-051)
│   │   ├── marketing-mix-modeling/         # MAY-scope baseline only; full spec deferred to 037 (FR-052–FR-053)
│   │   ├── model-comparison-simulation/    # comparison view, simulation, versioning (FR-054–FR-056)
│   │   ├── attribution-finalization/       # 8-state finalization workflow, Reconciliation Record (FR-057–FR-060)
│   │   ├── ai-roi-intelligence/            # extends 027's AI Insight; bounded action set, forecasting, scenarios, alerts (FR-061–FR-066)
│   │   ├── finance-dashboards/             # Attribution/Revenue Impact/ROI/Executive Revenue Intelligence templates for 027's Dashboard framework (FR-067–FR-070)
│   │   ├── attribution-governance/         # governed definitions, RBAC, Approval Request, audit (writes into 027's Audit Log Entry) (FR-071–FR-074)
│   │   └── attribution-privacy-currency-tax/ # privacy fallback, fraud/bot exclusion, multi-currency, tax/fee treatment (FR-075–FR-078)
│   └── common/                             # reused from 027: Tracked Event stream, Identity Resolution Record, Dashboard framework, Cost Record, AI Insight, Audit Log Entry; reused from 008: AI gateway; reused from 009: exchange-rate infrastructure; reused from 001/016: RbacGuard
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── attribution/{dashboard, models/compare, models/simulate, finalization, incrementality, ai-recommendations, cost-reconciliation}/
```

**Structure Decision**: 15 new backend modules under `attribution-*`/`revenue-*`/`cost-*`/`financial-*`/`incrementality-*`/`ai-roi-*`/`finance-dashboards`, explicitly wired to reuse `027`'s Tracked Event, Identity Resolution Record, Dashboard framework, Cost Record, AI Insight, and Audit Log Entry rather than redefining them. `attribution-model-catalog` (correctness of the calculation engine `027`'s dashboards will consume) and `attribution-finalization` (Article IV lock enforcement) are built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
