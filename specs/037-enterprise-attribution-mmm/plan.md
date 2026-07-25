# Implementation Plan: Enterprise Attribution, Incrementality Measurement & Media Mix Modeling

**Branch**: `037-enterprise-attribution-mmm` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/037-enterprise-attribution-mmm/spec.md`

## Summary

This feature builds the platform's enterprise measurement governance layer: a 5-level Marketing Measurement Framework (Delivery→Engagement→Conversion→Revenue→Incremental Business Value) keeping each level's metrics distinctly bounded; a governed marketing taxonomy and campaign registry with tracking-parameter validation; touchpoint collection and customer-journey reconstruction; a 7-model Attribution Engine (First-Touch, Last-Touch, Last Non-Direct, Linear, Time-Decay, Position-Based, Data-Driven) with a Primary Attribution Model governance gate and 6-level Identity Confidence classification; cross-channel/offline/affiliate/self-reported attribution with centralized deduplication; an Incrementality Measurement Engine (10 experiment types, guardrail metrics, contamination detection, Incremental CPA/ROAS); a Media Mix Modeling Engine reconciled against — not assumed identical to — multi-touch attribution; a Unified Measurement Framework blending all 5 methods; a 7-tier Revenue Contribution Hierarchy; financial formulas (ROAS, Marketing ROI, CAC variants, LTV:CAC, Payback Period); a Budget Optimization Engine with mandatory human approval before any spend reallocation; a 5-state Attribution Finalization lifecycle with audited manual adjustment; data/model governance and reconciliation; executive/finance/campaign/creative/audience/geographic/time-based dashboards and alerting; an AI Marketing Measurement Assistant; privacy/security/RBAC; and API/integration/reliability/testing requirements.

**This chapter is directly named in the constitution's own citation list for Article IV** — the source comment reads: *"Vol 14 Part 2 Ch 4 (attribution finalization states: Preliminary → Finance Reviewed → Finalized/Locked)."* This is the fourth feature this session directly named in the constitution's own citations (after `016` for Article VII, `025` for Article II, `032` for Article VI), and the first for Article IV specifically. **However, having now read this chapter's actual FR-068 text — the finalization vocabulary is Real Time → Preliminary → Updated → Final → Adjusted (5 states) — the constitution's own paraphrase does not match either this chapter's or `028`'s vocabulary exactly.** `028`'s own 8-state vocabulary (Preliminary, Processing, Calculated, Under review, Finance reviewed, Finalized, Reopened, Corrected) contains the literal terms "Finance reviewed" and "Finalized" that the constitution's paraphrase uses; this chapter's vocabulary contains neither literal term. Spec.md's own Assumptions already anticipated exactly this ambiguity and explicitly declined to resolve it: *"The source PRD does not reconcile these two competing finalization-state vocabularies across chapters; this spec preserves Chapter 4's own five-state vocabulary as written... rather than silently adopting feature 028's naming, and implementation planning must decide whether one finalization state machine is implemented with two display labels or whether these remain genuinely separate workflows for different record types."* This plan does not resolve it either — if anything, reading both FR texts side by side suggests `028`'s vocabulary is textually closer to the constitution's paraphrase, but this is an observation, not a resolution, and is carried forward as a NEEDS CLARIFICATION alongside the pre-existing gates.

## Ownership & Dependency Analysis (Feature 037 vs. Features 027, 028)

Per spec.md's own Assumptions — the most thoroughly self-analyzed spec planned this session — this chapter positions itself as the enterprise-wide governance superset over `027` and `028`'s already-specified attribution logic for **official/financial reporting purposes specifically**, without redefining their underlying mechanics. This was checked against both features' own plan.md (both already planned in this session) and found consistent, not contradictory.

### 1. Confirmed clean, three-way ownership hierarchy

- **`027` retains ownership** of general campaign/channel/funnel event tracking, the Tracked Event ingestion pipeline, and the Dashboard framework — this chapter does not rebuild ingestion or general reporting infrastructure.
- **`028` retains ownership** of the granular per-model calculation mechanics (the 19-model attribution catalog including Markov Chain/Shapley Value, and the CAC/CLV/ROAS/ROI/Payback financial-formula engine) — this chapter references but does not re-derive those formulas; where this chapter's own financial formulas (FR-058–FR-062) restate ROAS/ROI/CAC/LTV/Payback, they are read as **governance-layer restatements of the same formulas `028` computes**, not a second independent calculation engine, consistent with the reuse discipline already established for `031`'s and `032`'s relationship to `028`.
- **This chapter (`037`) owns**, as genuinely new ground per its own Assumptions: the 5-level Marketing Measurement Framework, Primary Attribution Model governance, Identity Confidence gating, the Incrementality Experiment Engine, the Media Mix Modeling Engine, MTA/MMM reconciliation, the Revenue Contribution Hierarchy, and the Budget Optimization Engine.

### 2. New finding, resolved consistently with the hierarchy above: a fourth "Customer Journey"-named entity

Not addressed by spec.md's own Assumptions. This chapter's own `Customer Journey` entity ("the reconstructed, time-ordered sequence of a customer's eligible touchpoints... carrying per-touchpoint attribution credit and identity confidence") is conceptually close to `027`'s own `Customer Journey` entity (an "ordered sequence of a resolved identity's marketing touchpoints... from first interaction through conversion, renewal, or churn") — joining `022`'s and `032`'s own, differently-scoped "Customer Journey" entities as a fourth instance of the name across the platform. **Ownership decision, applying this chapter's own established governance hierarchy**: this chapter's `Customer Journey` is the **identity-confidence-gated, official-reporting-eligible extension** of `027`'s general analytical journey concept — the same "037 governs official status, 027/028 retain their existing scope" pattern spec.md already applies to the finalization-state question — not a fifth, independently-computed journey reconstruction. This is **distinct from, and does not touch**, the still-open `022`/`032` Customer Journey collision, which remains unresolved on its own terms.

### 3. Confirmed clean: RBAC, consent, and currency infrastructure

RBAC (FR-082) and consent enforcement are explicitly framed by spec.md's own Assumptions as applications of Constitution Articles VII and VI respectively, reusing the platform-wide role hierarchy and consent system rather than redefining them. Currency/exchange-rate handling (FR-073) explicitly reuses `009`'s finance-approved infrastructure, consistent with `028`'s own established reuse pattern.

### 4. Preserved NEEDS CLARIFICATION items (from spec.md's own Assumptions, not resolved here)

- **The finalization-vocabulary question** (this chapter's 5-state Real-Time→Preliminary→Updated→Final→Adjusted vs. `028`'s 8-state Preliminary→...→Finalized→Reopened→Corrected vs. the constitution's own 3-state paraphrase) — the single most significant open item, since it determines whether one finalization engine with two display labels is built, or two genuinely separate workflows.
- Statistical test / minimum-detectable-effect methodology / contamination-correction procedure for incrementality experiments.
- Specific Media Mix Modeling algorithm/technique.
- Numeric boundaries for each Identity Confidence Level and the aggregation-suppression threshold.
- Which approver-role combination is mandatory for a given budget-recommendation size/risk level.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–036.

**Primary Dependencies**: NestJS, Next.js; reuses `027`'s Tracked Event/Dashboard framework and `028`'s attribution-model/financial-formula engine rather than rebuilding them; Data-Driven Attribution and the AI Marketing Measurement Assistant consuming `008`'s AI gateway; currency/exchange-rate infrastructure reused from `009`.

**Storage**: PostgreSQL for governance/config entities, a warehouse-style store for touchpoint/journey volume (~19 entities per spec.md's Key Entities — Marketing Campaign, Marketing Touchpoint, Customer Journey [extension of 027's], Conversion Event, Attribution Model, Primary Attribution Model, Identity Confidence Level, Attribution Result, Incrementality Experiment, Treatment/Control Group Assignment, Incrementality Results Registry Entry, Media Mix Model, Revenue Contribution Record, Marketing Cost Record, Budget Scenario/Optimization Recommendation, Attribution Finalization State, Model Governance Record, Measurement Definition domains), with Attribution Finalization State records immutable once Final and Revenue Contribution Record tiers never silently combined.

**Testing**: Jest (backend — exactly-one-primary-model-sources-official-reports, identity-confidence-gate-enforced-at-reporting-layer, and no-budget-reallocation-without-recorded-approval contract tests are the highest-stakes tests here, matching this spec's own SC-002, SC-003, and SC-006/Constitution Article II), Playwright (web e2e — Attribution Model Comparison dashboard, MMM/MTA reconciliation view, Budget Scenario Simulator).

**Target Platform**: Web (Finance/Executive Portal, rendered inside `017`'s workspace shell); this is the enterprise governance layer sitting above `027`'s general analytics and `028`'s attribution/financial-formula engine.

**Performance Goals**: Touchpoint ingestion under 2s; conversion processing under 5s; preliminary attribution under 10s; customer journey load under 3s; standard dashboard under 3s; budget scenario response under 10s; 99.9% monthly availability (FR-089).

**Constraints**: Each of the 5 measurement-framework levels stays distinctly labeled with zero cross-level leakage (FR-001, SC-001); exactly one Primary Attribution Model sources official/finance reports at any time (FR-021, SC-002); zero official customer-level reports contain records below the governance-approved Identity Confidence threshold (FR-022, SC-003); every completed incrementality experiment used in a budget decision reports Incremental CPA/ROAS/confidence/significance first (FR-039–FR-041, SC-004); MMM and MTA outputs are never silently blended, always carrying a materiality flag (FR-048, SC-005); zero unapproved autonomous budget reallocations occur (FR-067, SC-006, Constitution Article II); Revenue Contribution Hierarchy tiers are never combined without explicit labeling (FR-052, SC-007); every post-Final change is audit logged with reason/evidence/approval (FR-069, SC-008).

**Scale/Scope**: ~19 data entities (plus extensions to `027`'s Customer Journey and `028`'s attribution/financial-formula engine), 91 functional requirements (FR-001–FR-091), 8 user stories, a 5-level measurement framework, 7 attribution models, 6 identity confidence levels, 10 incrementality experiment types, a 7-tier revenue hierarchy, and 5 NEEDS CLARIFICATION items in spec.md's own Assumptions — most significantly the finalization-vocabulary question shared with `028` and the constitution's own imprecise citation.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Attribution calculation, identity-confidence classification, and finalization-state transitions are entirely server-side; no client-asserted attribution result or state | **PASS — direct implementation (not the constitution's named source for this article)** | FR-012, FR-022 |
| II. AI Is Assistive, Never Autonomous | Every AI Marketing Measurement Assistant answer and Budget Optimization Engine recommendation is advisory-only; zero autonomous budget execution without recorded human approval | **PASS — direct implementation, spec.md explicitly applies this article** | FR-067, FR-081, SC-006 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A for this chapter's own surface — internal measurement/governance layer, no customer-facing claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | **This chapter is directly named in the constitution's own Article IV source citation** — "Vol 14 Part 2 Ch 4" — though the constitution's 3-state paraphrase does not exactly match this chapter's own 5-state FR-068 vocabulary (see Summary); Final records are never silently altered, only corrected via the audited manual-adjustment process | **PASS — directly named by the constitution, with an unresolved vocabulary-precision question flagged, not silently assumed** | FR-068–FR-069, SC-008 |
| V. Ledger-Based Internal Economies | N/A — this feature measures and governs revenue/attribution, it does not manage a redeemable point/wallet balance | **PASS (N/A)** | — |
| VI. Consent Is First-Class | Consent enforcement reused from the platform-wide system per spec.md's own Assumptions | **PASS (aligns; consent capture owned elsewhere, enforcement reused here)** | FR-083 |
| VII. Layered, Explicit RBAC | 11 named roles with granular data/cost/revenue/model/experiment/budget/export visibility controls | **PASS (extends 001/016)** | FR-082 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | N/A for this chapter's own surface — no localized content generated here | **PASS (N/A)** | — |
| Security & Compliance Baseline | RBAC, encryption, MFA, audit logging, consent-aware aggregation-threshold suppression, data-loss prevention | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-083–FR-084 |

No constitutional violations. No Complexity Tracking entries required for principle compliance. The finalization-vocabulary question and the fourth "Customer Journey" naming instance are documented, unresolved ownership items (see analysis above), not constitutional violations.

## Project Structure

### Documentation (this feature)

```text
specs/037-enterprise-attribution-mmm/
├── plan.md
├── research.md      # Phase 0 — MUST resolve, in priority order: (1) the finalization-vocabulary question shared with 028 and the constitution's own imprecise citation; (2) statistical test/MDE methodology/contamination-correction procedure for incrementality experiments; (3) specific MMM algorithm/technique; (4) Identity Confidence Level numeric boundaries and aggregation-suppression threshold; (5) mandatory-approver-role combination by budget size/risk
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`036`'s structure — no new top-level projects; this feature governs which of `027`'s/`028`'s already-specified attribution logic is "official" rather than rebuilding either.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── measurement-framework/       # 5-level framework (FR-001–FR-005)
│   │   ├── marketing-taxonomy-registry/ # taxonomy, campaign registry, tracking params (FR-006–FR-008)
│   │   ├── touchpoint-journey-reconstruction/ # touchpoint capture, Customer Journey extension of 027's (FR-009–FR-011)
│   │   ├── attribution-models-identity/ # 7-model Attribution Engine, Primary Model governance, Identity Confidence (FR-012–FR-023)
│   │   ├── cross-channel-offline-attribution/ # cross-channel/offline/affiliate/self-reported/adjustments (FR-024–FR-030)
│   │   ├── incrementality-engine/       # Incrementality Experiment, registry (FR-031–FR-041)
│   │   ├── media-mix-modeling/          # MMM Engine, MTA reconciliation (FR-042–FR-049)
│   │   ├── revenue-contribution-hierarchy/ # 7-tier Revenue Contribution Record (FR-050–FR-056)
│   │   ├── financial-formulas-governance/ # ROAS/ROI/CAC/LTV/Payback (references 028's engine) (FR-057–FR-062)
│   │   ├── budget-optimization-engine/  # Budget Scenario/Recommendation, approval gate (FR-063–FR-067)
│   │   ├── attribution-finalization/    # Attribution Finalization State (FR-068–FR-070)
│   │   ├── measurement-data-model-governance/ # Measurement Definitions Catalog, reconciliation, Model Governance Record (FR-071–FR-075)
│   │   ├── enterprise-dashboards-alerts/ # executive/finance/campaign/creative/audience/geo/time dashboards, alerts (FR-076–FR-080)
│   │   ├── ai-measurement-assistant/    # AI Marketing Measurement Assistant (FR-081)
│   │   └── attribution-governance-api/  # RBAC/privacy/security, APIs/webhooks/integration, business rules, error handling, performance/reliability, testing (FR-082–FR-091)
│   └── common/                          # reused from 027: Tracked Event stream, Dashboard framework, Customer Journey base; reused from 028: attribution-model/financial-formula engine; reused from 008: AI gateway; reused from 009: currency infrastructure; reused from 001/016: RbacGuard
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── enterprise-measurement/{framework, attribution-governance, incrementality, mmm, revenue-hierarchy, budget-optimization, finalization, executive}/
```

**Structure Decision**: 14 new backend modules under `measurement-*`/`attribution-*`/`incrementality-*`/`media-mix-*`/`budget-optimization-*`/etc., explicitly wired to reuse `027`'s ingestion/dashboard framework and `028`'s attribution/financial-formula engine rather than redefining them. `attribution-models-identity` (Primary Model governance, Identity Confidence gate) and `incrementality-engine` (causal ground-truth measurement) are built and contract-tested first. **No module may assume a specific resolution of the finalization-vocabulary question, and `Customer Journey` here must extend `027`'s entity, not redefine it.**

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations; the finalization-vocabulary question is a documented open ownership item, not an approved exception | — | — |
