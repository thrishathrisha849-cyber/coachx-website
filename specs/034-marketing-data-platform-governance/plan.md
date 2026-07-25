# Implementation Plan: Marketing Data Platform, Unified Customer Intelligence & Data Governance

**Branch**: `034-marketing-data-platform-governance` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/034-marketing-data-platform-governance/spec.md`

## Summary

This feature opens Wave 3 (Volume 14 Part 2) with the platform's enterprise data foundation: a 12-component architecture (Customer Identity Service, Unified Customer Profile, Data Collection Layer, Event Processing Engine, Data Validation Engine, Data Cleansing Engine, Data Governance Engine, Master Data Management, Data Warehouse, AI Intelligence Layer, Analytics Engine, Data Activation Layer) implementing a single enterprise data pipeline from source systems through to marketing automation, personalization, analytics, and executive dashboards. It covers multi-signal identity resolution (8 signals) with intelligent duplicate-profile merging; a 6-field-group unified profile schema (Personal/Demographic/Membership/Engagement/Financial/Behavioral) powering a Customer 360 Dashboard and chronological activity timeline; real-time event collection across 21 event types and 6 channel categories; data validation (7 checks) and automated cleansing (6 removal categories); data enrichment; 10 baseline customer segments; a Marketing Data Warehouse across 11 domains and Master Data Management across 10 master entity types; a 5-tier data classification/governance scheme with consent tracking and full privacy-rights support; an AI Intelligence Layer computing 7 real-time customer scores plus 6 predictive models; a Data Quality Dashboard (6 metrics); enterprise analytics and an executive dashboard; API services; and performance/acceptance-criteria requirements.

**This chapter is not cited by name in the constitution's own source list, and unlike several prior Wave 2 features, its FR text does not quote "Constitution Article N" verbatim and no user-story rationale names a principle by title either — its self-application happens entirely in spec.md's Assumptions paragraphs**, a third, softer citation form: Article II ("the AI Intelligence Layer... is assumed to be governed by the platform-wide 'AI is assistive, never autonomous' principle... even though this chapter does not restate a human-approval requirement explicitly"), Article VI ("Consent tracking... is assumed to be governed by the platform-wide per-channel, versioned consent principle"), and Article VII ("RBAC referenced under Data Security... is assumed to be the same layered RBAC model... rather than a platform-specific role system"). All three are inferred by spec.md's own author from platform-wide precedent rather than restated by the source chapter itself.

**This spec preserves, rather than invents, a foundational cross-chapter ambiguity**: spec.md's own Assumptions state plainly that this feature's Unified Customer Profile and `019`'s (Audience Segmentation & CDP) unified customer profile are "a separate but overlapping foundational data platform, not a strict superset or simple extension" — the two chapters use different field groupings (this feature: Personal/Demographic/Membership/Engagement/Financial/Behavioral; `019`: Identity/Account/Engagement/Transaction/Communication Preferences) and the source PRD does not state whether they are the same physical record, one built on the other, or intentionally distinct stores. Verified directly against `019`'s own plan.md, which independently defines its own `Unified Customer Profile` entity in a `cdp-profile` module — confirming this is a real, unresolved architectural collision, not a hypothetical one. Per spec.md's own explicit instruction, **this plan does not invent a reconciliation or merge rule**; both profile concepts are preserved as independently specified pending a product/architecture decision. A related, narrower naming collision is noted for traceability: this feature's AI-computed "Churn Risk" score (FR-033) and `029`'s (`customer-lifecycle-retention-loyalty`) own `Churn Risk Level` entity from its Churn Prediction Engine use the same term for what may or may not be the same computed value — not resolved here, flagged for the same future reconciliation pass as the `019` overlap.

**Master Data Management resolved against `065` (updated 2026-07-24, per `065/plan.md` §2)**: this feature's own Edge Cases had asked, unanswerably at the time, "what happens when the Master Data Management layer's definition of a master entity... conflicts with a duplicate or variant record already present in the Data Warehouse — which record becomes authoritative?" `065` (Enterprise Data Platform, Data Lake, Warehouse & BI) has since been planned as the platform's general-purpose MDM/warehouse layer, and its own Ownership & Dependency Analysis (§2) resolves this: 4 of this feature's 10 master entity types (Customer, Product, Employee, Vendor) directly overlap `065`'s own 10 master data domains (Customers, Employees, Products, Suppliers, among others). **Ownership decision**: `065` is canonical for the golden-record mechanics (duplicate detection, merge/survivorship rules, Data Steward Dashboard, version control) for those 4 domains — this feature's own Master Data Management for Customer/Product/Employee/Vendor should consume `065`'s golden records rather than maintaining a second, parallel golden-record system. This feature retains full, uncontested ownership of its 6 marketing-only master entities (Course, Ebook, Podcast, Campaign, Membership, Brand), which `065` does not cover at all.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–033.

**Primary Dependencies**: NestJS, Next.js; ingests from every connected TBT module (Digital Channels, Learning, Community, Commerce, Marketing, Support) per FR-005; AI Intelligence Layer consuming `008`'s AI gateway (implied by spec.md's Article II Assumption); consent tracking interoperating with `019`'s Consent Record model per spec.md's own Assumptions; RBAC extending `016`'s marketing RBAC layer and the platform-wide model.

**Storage**: PostgreSQL for governance/config entities, a warehouse-style store for the Marketing Data Warehouse and Raw Event volume (~12 entities per spec.md's Key Entities — Customer Identity, Unified Customer Profile, Customer Timeline/Activity Event, Raw Event, Data Classification Tier, Consent Record, AI-Computed Score, Predictive Model Output, Customer Segment, Master Data Entity, Marketing Data Warehouse Record, Data Quality Metric, Data Governance Policy domains), with Raw Event as the append-only atomic ingestion record and Customer Timeline immutable/chronological.

**Testing**: Jest (backend — identity-resolution-merges-fragmented-signals-into-one-profile, event-processing-under-1-second-with-full-metadata, and ai-model-input-data-is-validated-and-cleansed contract tests are the highest-stakes tests here, matching this spec's own SC-006, SC-001, and FR-048/SC-009), Playwright (web e2e — Customer 360 Dashboard, Data Quality Dashboard, Executive Dashboard).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell); this is the enterprise data foundation every Wave 3 intelligence/governance chapter is expected to build on.

**Performance Goals**: Event processing under 1s; customer lookup under 500ms; profile load under 2s; analytics query under 3s; dashboard render under 3s (FR-040–FR-044, SC-001–SC-005).

**Constraints**: Every customer has exactly one unified profile, with duplicates automatically merged rather than persisting separately (FR-045–FR-046, SC-006); events are collected in real time with complete metadata (FR-047, SC-001); AI models receive only validated/cleansed data (FR-048); segments update automatically as underlying data changes (FR-024, FR-049); every dataset carries one of five classification labels with no unclassified dataset in production (FR-028–FR-029, SC-008); privacy rights (access/delete/correct/export/consent-withdrawal) are enforced (FR-031, FR-051); customer scores/segments/journey/recommendations update within seconds of a triggering event (FR-035, SC-007).

**Scale/Scope**: ~12 data entities, 54 functional requirements (FR-001–FR-054), 7 user stories, a 12-component architecture, 8 identity-matching signals, 21 event types, a 5-tier classification scheme, 7 AI-computed score types, 6 predictive models, and multiple NEEDS CLARIFICATION items in spec.md's Edge Cases and Assumptions — most significantly the unresolved `019`/`034` unified-profile reconciliation (explicitly preserved, not invented), plus false-merge detection/reversal, field-level conflict-resolution precedence between disagreeing sources, degradation behavior when real-time AI recalculation misses its window, and cascade/timeframe behavior for Right-to-Delete requests against warehouse/AI-training/merged-profile copies.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Identity resolution, profile merging, score computation, and classification assignment are entirely server-side; no client-asserted profile match or score | **PASS — direct implementation (not the constitution's named source for this article)** | FR-008, FR-033 |
| II. AI Is Assistive, Never Autonomous | Spec.md's own Assumptions infer this article governs the AI Intelligence Layer even though the source chapter itself doesn't restate a human-approval requirement — AI-computed scores/predictions are positioned as inputs to downstream systems, not autonomous executors | **PASS (aligns; inferred by spec.md's Assumptions from platform-wide precedent, not restated by the source chapter)** | FR-033–FR-035, spec.md Assumptions |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A for this chapter's own surface — internal data-platform/governance layer with no customer-facing claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | Customer Timeline / Activity Event entries are immutable and chronological; Raw Event is append-only before validation/cleansing | **PASS (aligns; not the constitution's named source for this article)** | FR-017, Key Entities — Raw Event |
| V. Ledger-Based Internal Economies | N/A — this feature is a data/intelligence platform, not a financial/point ledger | **PASS (N/A)** | — |
| VI. Consent Is First-Class | Spec.md's own Assumptions infer this article governs consent tracking, interoperating with `019`'s Consent Record model rather than redefining a separate one | **PASS (aligns; inferred by spec.md's Assumptions, interoperates with 019)** | FR-030, spec.md Assumptions |
| VII. Layered, Explicit RBAC | Spec.md's own Assumptions infer this article governs Data Security's RBAC reference, reusing `016`'s layered RBAC model rather than a chapter-specific role system | **PASS (aligns; inferred by spec.md's Assumptions, extends 001/016)** | FR-032, spec.md Assumptions |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Profile Demographic information includes Language as a first-class field | **PASS (aligns; not the constitution's named source for this article)** | FR-011 |
| Security & Compliance Baseline | AES encryption, TLS, MFA, RBAC, audit logs, secure APIs, key rotation; 5-tier classification driving access controls | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-032, FR-028 |

No constitutional violations. No Complexity Tracking entries required for principle compliance. The `019`/`034` unified-profile overlap is a documented, explicitly-preserved source-level ambiguity (see Summary), not a constitutional violation.

## Project Structure

### Documentation (this feature)

```text
specs/034-marketing-data-platform-governance/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: whether this feature's Unified Customer Profile and 019's CDP profile are the same physical record, one built on the other, or intentionally distinct stores (highest priority — affects nearly every downstream entity in this feature); false-merge detection/reversal process; field-level conflict-resolution precedence between disagreeing source systems; degradation behavior when real-time AI recalculation misses its window; Right-to-Delete cascade behavior/timeframe across warehouse/AI-training-data/merged-profile copies; the "Churn Risk" naming overlap with 029
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`033`'s structure — no new top-level projects; this feature ingests from nearly every prior consumer-platform feature and its relationship to `019`'s CDP is an open architectural question (see Summary).

```text
backend/
├── src/
│   ├── modules/
│   │   ├── customer-identity-service/  # Customer Identity, 8-signal matching, merge (FR-007–FR-008)
│   │   ├── unified-customer-profile/   # Unified Customer Profile, 6 field groups, Customer 360 (FR-009–FR-017)
│   │   ├── data-collection-layer/      # Raw Event ingestion across 6 channel categories (FR-005, FR-018–FR-019)
│   │   ├── data-validation-engine/     # 7-check validation (FR-020)
│   │   ├── data-cleansing-engine/      # 6-category automated cleansing (FR-021)
│   │   ├── data-enrichment/            # profile enrichment fields (FR-022)
│   │   ├── customer-segmentation-mdp/  # 10 baseline segments (FR-023–FR-024)
│   │   ├── marketing-data-warehouse/   # 11-domain warehouse (FR-025)
│   │   ├── master-data-management/     # 10 master entity types (FR-026)
│   │   ├── data-governance-classification/ # 5-tier classification, policies, consent, privacy, security (FR-027–FR-032)
│   │   ├── ai-intelligence-layer/      # 7 real-time scores, 6 predictive models (FR-033–FR-035)
│   │   ├── data-quality-dashboard/     # 6-metric Data Quality Dashboard (FR-036)
│   │   ├── enterprise-analytics-executive/ # Enterprise Analytics, Executive Dashboard (FR-037–FR-038)
│   │   └── mdp-api-services/           # Customer Search/Update, Event Submission, Segment/Analytics Query, Recommendation Service (FR-039)
│   └── common/                         # reused from 016/001: RbacGuard; reused from 008: AI gateway (Article II inference); reused from 019: Consent Record interop (pending profile-reconciliation NEEDS CLARIFICATION)
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── data-platform/{customer-360/[customerId], data-quality, governance, executive}/
```

**Structure Decision**: 13 new backend modules under `customer-identity-*`/`unified-customer-*`/`data-*`/`ai-intelligence-*`/etc. `customer-identity-service` (identity resolution correctness) and `data-validation-engine`/`data-cleansing-engine` (clean-data guarantee for every downstream consumer) are built and contract-tested first. No new top-level projects. **No module may assume a specific resolution of the `019`/`034` unified-profile question until it is confirmed** — entity definitions proceed on spec.md's own stated position (two independently-specified profiles, not merged) as a working default, not a confirmed architecture.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations; the 019/034 profile-reconciliation question is a documented, explicitly-preserved open ownership item, not an approved exception | — | — |
