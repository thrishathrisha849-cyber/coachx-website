---
description: "Implementation plan for Feature 065 — Enterprise Data Platform, Data Lake, Warehouse & BI"
---

# Implementation Plan: Enterprise Data Platform, Data Lake, Warehouse & BI

**Branch**: `065-enterprise-data-platform-warehouse-bi` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/065-enterprise-data-platform-warehouse-bi/spec.md`

## Summary

This feature (Volume 14, Chapter 32) is the platform's foundational, platform-wide data infrastructure layer — a ten-layer data architecture (Source→Ingestion→Data Lake→Data Warehouse→Data Marts→Semantic→Analytics→AI→Reporting→Consumption), ETL/ELT with CDC, Master Data Management with golden records, self-service BI, metadata/data catalog, storage tiering, and AI Data Intelligence. Article II (AI Is Assistive, Never Autonomous) is FR-text-cited at FR-053, requiring human/role-gated approval before any consequential action derived from an AI Data recommendation.

## Ownership & Dependency Analysis

### §1. Relationship to `049` (Business Intelligence & KPI Management) — CONFIRMED and sharpened into a clean vertical layering

Spec.md's own Assumptions state this feature is the underlying data-platform layer (warehouse, marts, semantic layer, pipelines) that `049`'s BI/KPI capabilities query and render, with `049` remaining authoritative for KPI-catalog/definition-governance/dashboard-permission detail. Verified against `049`'s actual spec.md: its `KPI Definition` entity is explicitly described as "the single governed record of a Key Performance Indicator... that all consumers (dashboards, reports, performance scorecards) must read from rather than recompute independently," carrying a "Data Sources" field that anticipates exactly the kind of underlying infrastructure this feature provides — but `049/plan.md` never names a warehouse dependency, having been planned without this feature existing yet.

Both features also independently use the term "Executive KPI" — this feature's FR-041 (12 named metrics: Revenue, Profit, Customer Growth, etc.) and `049`'s FR-010 (Executive Analytics Components including "Executive KPIs"). **Ownership decision**: CONFIRMED, with the relationship sharpened rather than merely restated — this feature's "Executive KPI" entity is the *computed metric value* (current value, trend, target, role-dashboard association) sourced from the warehouse; `049`'s "KPI Definition" is the *governance record* (calculation formula, thresholds, ownership, data sources) that governs how that value is computed and who may consume it. This is a clean vertical layering, not a naming collision requiring resolution — `049` defines what a KPI means and who owns it; this feature computes and serves the value.

### §2. Master Data Management vs. `034` (Marketing Data Platform & Governance) — NEW, substantial finding, not caught by either spec

Not mentioned in either spec's own Assumptions. Checked independently given this feature's FR-025 (10 master data domains: Customers, Employees, Products, Suppliers, Assets, Projects, Departments, Locations, Accounts, Inventory Items) and `034`'s own FR-026 (Master Data Management for 10 master entities: Customer, Course, Ebook, Podcast, Campaign, Product, Membership, Brand, Vendor, Employee) — a **4-domain overlap** (Customer, Product, Employee, Vendor≈Supplier). `034` was planned as the opening feature of Wave 3, long before this feature existed, and already built its own independent golden-record/MDM mechanics for those entities. Notably, `034`'s own Edge Cases anticipated exactly this class of conflict in the abstract: *"What happens when the Master Data Management layer's definition of a master entity (e.g., Customer, Product, Campaign) conflicts with a duplicate or variant record already present in the Data Warehouse — which record becomes authoritative?"* — a question `034` could not answer at the time because this feature, the actual general-purpose MDM/warehouse platform, did not yet exist.

**Ownership decision**: this feature is canonical for the 4 overlapping domains' (Customer, Product, Employee, Vendor/Supplier) golden-record mechanics — duplicate detection, merge/survivorship rules, Data Steward Dashboard, version control — the general-purpose, platform-wide, deeper implementation (per this session's now-familiar "later/dedicated chapter is deeper" pattern). `034` retains exclusive, uncontested ownership of its marketing-only master entities (Course, Ebook, Podcast, Campaign, Membership, Brand), which this feature does not cover at all. For the 4 overlapping domains, `034`'s own MDM should be understood as consuming this feature's golden records rather than maintaining a second, parallel golden-record system. This answers `034`'s own previously-unanswerable Edge Case. (See the note at the end of this plan regarding a cross-reference addition to `034/plan.md`.)

Note, for scope clarity: this feature's "Golden Record" (MDM — reconciling which source system's version of an entity's basic attributes is authoritative) is a structurally different concern from `019`'s and `034`'s own, already-unresolved "Unified Customer Profile" overlap (aggregating behavioral/engagement/transactional data for CDP/personalization purposes) — this plan does not fold the MDM finding into that pre-existing gate, since they answer different questions, but notes both concern the same underlying "Customer" identity and should ideally reference the same resolved identity at implementation time.

### §3. General-Purpose Data Platform vs. `034` More Broadly — confirmed clean, per spec.md's own framing, except for §2

Spec.md's own Assumptions correctly frame this feature as the general-purpose enterprise warehouse/lake `034`'s marketing-specific data platform sits on top of or federates with. Verified: `034`'s 12-component architecture (Customer Identity Service, Unified Customer Profile, Data Collection Layer, Event Processing Engine, Data Validation/Cleansing Engines, Data Governance Engine, Master Data Management, Data Warehouse, AI Intelligence Layer, Analytics Engine, Data Activation Layer) is a marketing-domain-scoped pipeline, consistent with this framing — with §2's MDM overlap as the one specific exception requiring correction rather than a wholesale re-architecture.

### §4. Master Data Domain Authoritative-Source Question vs. `003`/`013` — preserved as an explicit NEEDS CLARIFICATION by spec.md itself

Spec.md's own Assumptions explicitly flag that the source PRD does not specify which upstream system is authoritative-of-record per master data domain when multiple systems contribute (e.g., CRM `013` and ERP both feeding "Customers"). This plan preserves this exactly as spec.md states it — this feature defines the MDM *mechanism* (matching, merge, survivorship), not the source-of-truth boundary per domain, which remains an open product/architecture decision.

### §5. AI Data Intelligence vs. `008` (AI Assistant Platform) — confirmed clean, gateway reused

Consistent with the reuse pattern established for `056`–`064`. **Ownership decision**: the AI Data Assistant (FR-051) and AI Data Intelligence (FR-050) reuse `008`'s `ai-gateway`/`ai-guardrails` for provider access and governance, with forecasting/anomaly-detection/root-cause-analysis logic as this feature's own structured-warehouse-data query layer.

### §6. RBAC vs. `001`/`016` — confirmed clean, standard layered-extension pattern

Not mentioned in spec.md's own Assumptions beyond a generic reference to "the constitution's layered RBAC" (FR-054). **Ownership decision**: row-level/column-level security and data masking (FR-055, FR-056) configure `001`'s/`016`'s existing layered RBAC engine per the established extension pattern, applied to data-platform-specific roles (data steward, data engineer, platform administrator).

### §7. Enterprise Integrations vs. `064` (iPaaS) — confirmed bidirectionally

FR-063 names "Enterprise Integration Platform (iPaaS)" among 17 integration targets. Verified against `064`'s actual plan.md: `064/plan.md` §7 already preserved "Data Lake" and "Business Intelligence" as forward-declared connectivity targets pointing to this feature. **Ownership decision**: CONFIRMED bidirectionally — this feature is the Data Lake/Data Warehouse/BI destination `064`'s connectivity path already named; `064`'s API/ESB/event infrastructure is this feature's ingestion path for `064`-mediated source systems.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web) — consistent with 001–064.

**Primary Dependencies**: `049`'s KPI Definition governance layer as the consumer of this feature's Executive KPI computed values (per §1, sharpened relationship); `034`'s Master Data Management for the 4 overlapping domains, now consuming this feature's golden records rather than maintaining a parallel system (per §2, new finding answering `034`'s own open Edge Case); `008`'s AI gateway/guardrails for AI Data Intelligence (per §5); `001`/`016`'s layered RBAC (per §6); `064`'s iPaaS as the confirmed bidirectional ingestion/connectivity path (per §7).

**Storage**: PostgreSQL/data-warehouse-style store (13 entities per Key Entities: Data Lake Object, Data Warehouse Table (Fact/Dimension), Data Mart, ETL/ELT Pipeline, Golden Record, Master Data Source Record, Data Catalog Entry, Storage Tier Policy, Retention Policy, Data Quality Metric/Score, Executive KPI, Streaming Event, AI Recommendation).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: mdm-exactly-one-golden-record-zero-unresolved-duplicates for SC-003, etl-pipeline-cdc-error-recovery-zero-partial-load for SC-002, and ai-data-recommendation-zero-autonomous-consequential-action for SC-009), Playwright (web e2e — ten-layer data flow trace, self-service BI report builder, MDM Data Steward Dashboard, executive role dashboards).

**Target Platform**: Web (Data Steward Dashboard, BI report/dashboard builder, Data Catalog, executive role dashboards, Streaming/Data Quality Dashboards).

**Performance Goals**: Per SC-008, the Streaming Dashboard must reflect live event throughput with near-real-time freshness, with degraded streaming health visibly reflected rather than silently dropped.

**Constraints**: Zero pipeline failure may produce a partial or corrupted load (FR-022, SC-002); MDM must produce exactly one golden record per real-world entity with zero unresolved duplicates surviving data-steward review (SC-003); zero AI Data recommendation may trigger a consequential action without a recorded human approval step (FR-053, SC-009); a storage-tier migration must complete with zero data loss, verified by post-migration retrieval (SC-006).

**Scale/Scope**: 13 entities, 63 FRs, 8 user stories, a 10-layer data architecture, Star/Snowflake schema support, 8-stage ETL/ELT pipeline, 4 storage tiers, 10 retention policy options, 10 master data domains, 12 BI visualization types, 10 executive dashboard types, 12 executive KPIs, 6 metadata types, 10 data quality metrics, 3 explicitly self-flagged NEEDS CLARIFICATION items plus 9 from Edge Cases, one confirmed-and-sharpened relationship with `049` (§1), and one substantial new MDM-overlap finding with `034` answering that feature's own previously-open Edge Case (§2). This is the eighteenth consecutive feature this session to surface a genuine, previously-uncaught cross-feature nuance during planning.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Data quality scoring, CDC change detection, and MDM matching are all server-computed, never client-asserted (FR-020, FR-027). |
| II. AI Is Assistive, Never Autonomous | PASS — **FR-text-verbatim cited** | FR-053 explicitly requires human/role-gated approval before any consequential action derived from an AI Data recommendation; low-confidence answers reflect reduced reliability rather than false certainty (User Story 8 acceptance scenario 4). |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | AI recommendations present Confidence Score and Risk Level transparently (FR-052), not as guaranteed outcomes. |
| IV. Historical Immutability | PASS | FR-031 requires version control and an audit trail for all master data/golden-record changes; FR-058 requires audit logging of data platform activity. |
| V. Ledger-Based Internal Economies | N/A | No financial ledger surface in this feature's own scope. |
| VI. Consent Is First-Class, Per-Channel, and Versioned | N/A | Foundational data-infrastructure layer; consent enforcement is applied by consuming features (e.g., `034`, `019`). |
| VII. Layered, Explicit RBAC With Approval Chains | PASS | FR-032 requires data stewardship workflows for reviewing/approving master data changes; RBAC configures `001`'s/`016`'s existing engine (per §6). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Data Quality Score and Executive KPIs are evidence-based operational metrics, not purchasable status. |
| IX. Action Before Consumption | PASS | Data progresses through the governed ten-layer architecture (Source→...→Consumption) before being considered analytics-ready (FR-004). |
| Localization & Language Requirements | PASS (not primary focus, inherited) | Foundational enterprise data infrastructure; no dedicated localization surface beyond platform-wide requirements. |
| Security & Compliance Baseline | PASS | FR-055 (row/column-level security), FR-056 (data masking), FR-057 (encryption at rest/transit) directly implement the baseline. |

## Project Structure

### Documentation (this feature)

```
specs/065-enterprise-data-platform-warehouse-bi/
├── spec.md
├── plan.md
├── research.md         # 12 NEEDS CLARIFICATION items (3 self-flagged, 9 from Edge Cases)
├── data-model.md        # 13 entities (Golden Record now canonical for 034's 4 overlapping domains, per §2)
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── mdm-exactly-one-golden-record-zero-unresolved-duplicates.contract.md
    ├── etl-pipeline-cdc-error-recovery-zero-partial-load.contract.md
    └── ai-data-recommendation-zero-autonomous-consequential-action.contract.md
```

### Source Code (repository root)

```
backend/src/modules/data-platform/
├── data-warehouse-schema/            # FR-007-013 — Star/Snowflake, Fact/Dimension, OLAP
├── ten-layer-architecture/           # FR-001-006 — Source through Consumption, Data Lake
├── etl-elt-cdc/                      # FR-016-024 — 8-stage pipeline, CDC, transformations
├── master-data-management/           # FR-025-033 — golden records, canonical for 034's overlap (per §2)
├── self-service-bi/                  # FR-037-039 — drag-drop reports, dashboards
├── executive-dashboards-kpi/         # FR-040-043 — role dashboards, consumed by 049 (per §1)
├── storage-tiering-retention/        # FR-014-015
├── metadata-data-catalog/            # FR-034-036
├── ai-data-intelligence/             # FR-050-053 — reuses 008 (per §5)
└── governance-quality-streaming/     # FR-044-049, FR-054-063 — reuses 001/016 (per §6), confirms 064 (per §7)

web/app/(admin)/data-platform-portal/
├── data-steward-dashboard/
├── bi-report-builder/
├── executive-dashboards/
├── data-catalog/
├── data-quality-dashboard/
└── streaming-dashboard/
```

**Structure Decision**: `data-warehouse-schema` and `ten-layer-architecture` are built and contract-tested first — spec.md's own User Story 1 rationale states this ten-layer architecture is the foundational structure every other capability (ETL, MDM, BI, dashboards, streaming, AI) depends on.

## Complexity Tracking

*No constitution violations requiring justification. N/A.*

---

**Note on `034/plan.md` update**: §2 above is a substantial new finding — this feature is canonical for 4 of `034`'s 10 Master Data Management entity types (Customer, Product, Employee, Vendor/Supplier), answering `034`'s own previously-unanswerable Edge Case about MDM/warehouse authority conflicts. Per this session's standing protocol, adding a cross-reference note to `034/plan.md` is recommended but not yet applied.
