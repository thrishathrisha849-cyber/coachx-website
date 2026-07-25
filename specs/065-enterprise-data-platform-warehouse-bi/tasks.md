---
description: "Task list for Feature 065 — Enterprise Data Platform, Data Lake, Warehouse & BI"
---

# Tasks: Enterprise Data Platform, Data Lake, Warehouse & BI

**Input**: Design documents from `/specs/065-enterprise-data-platform-warehouse-bi/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis sharpening the `049` KPI-governance/KPI-computation layering, and surfacing a substantial new MDM-overlap finding with `034` that answers `034`'s own previously-open Edge Case), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC). This feature also assumes `008`'s `ai-gateway`/`ai-guardrails` and `064`'s iPaaS exist as coordination/consumption points.

**Tests**: Included throughout — the MDM golden-record uniqueness gate, the ETL/CDC error-recovery gate, and the AI-data-recommendation human-approval gate each get a dedicated Foundational contract test, matching this spec's own SC-003, SC-002, and SC-009.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single story (Real-Time Streaming Analytics, Data Governance & Quality, Security & Compliance, Enterprise Integrations).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC), and that `008`'s `ai-gateway`/`ai-guardrails` and `064`'s iPaaS exist as coordination/consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: which upstream system is authoritative-of-record per master data domain when multiple systems contribute (explicitly self-flagged); numeric CDC latency targets, storage-tier age thresholds, query-performance targets (explicitly self-flagged); golden-record merge-conflict-with-no-clear-winner routing to a data steward; CDC-lag staleness-timestamp visibility to consumers; failed storage-tier-migration reconciliation; schema-drift detection preventing silent downstream corruption; mid-stage pipeline-failure rollback; below-threshold Data Quality Score consumer/report flagging; streaming-source-disconnect degraded-health reflection; AI-Data-Assistant insufficient-history low-confidence handling
- [ ] T003 [P] Add `backend/src/modules/data-platform/{data-warehouse-schema,ten-layer-architecture,etl-elt-cdc,master-data-management,self-service-bi,executive-dashboards-kpi,storage-tiering-retention,metadata-data-catalog,ai-data-intelligence,governance-quality-streaming}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Data Lake Object` entity in `backend/src/modules/data-platform/ten-layer-architecture/data-lake-object.entity.ts`
- [ ] T005 [P] Define the `Data Warehouse Table (Fact / Dimension)` entity in `backend/src/modules/data-platform/data-warehouse-schema/data-warehouse-table.entity.ts`
- [ ] T006 [P] Define the `Data Mart` entity in `backend/src/modules/data-platform/data-warehouse-schema/data-mart.entity.ts`
- [ ] T007 [P] Define the `ETL/ELT Pipeline` entity in `backend/src/modules/data-platform/etl-elt-cdc/etl-elt-pipeline.entity.ts`
- [ ] T008 [P] Define the `Golden Record` entity (canonical for `034`'s 4 overlapping domains, per plan.md §2) in `backend/src/modules/data-platform/master-data-management/golden-record.entity.ts`
- [ ] T009 [P] Define the `Master Data Source Record` entity in `backend/src/modules/data-platform/master-data-management/master-data-source-record.entity.ts`
- [ ] T010 [P] Define the `Data Catalog Entry` entity in `backend/src/modules/data-platform/metadata-data-catalog/data-catalog-entry.entity.ts`
- [ ] T011 [P] Define the `Storage Tier Policy` entity in `backend/src/modules/data-platform/storage-tiering-retention/storage-tier-policy.entity.ts`
- [ ] T012 [P] Define the `Retention Policy` entity in `backend/src/modules/data-platform/storage-tiering-retention/retention-policy.entity.ts`
- [ ] T013 [P] Define the `Data Quality Metric/Score` entity in `backend/src/modules/data-platform/governance-quality-streaming/data-quality-metric.entity.ts`
- [ ] T014 [P] Define the `Executive KPI` entity (computed-value layer beneath `049`'s KPI Definition governance, per plan.md §1) in `backend/src/modules/data-platform/executive-dashboards-kpi/executive-kpi.entity.ts`
- [ ] T015 [P] Define the `Streaming Event` entity in `backend/src/modules/data-platform/governance-quality-streaming/streaming-event.entity.ts`
- [ ] T016 [P] Define the `AI Recommendation` entity in `backend/src/modules/data-platform/ai-data-intelligence/ai-recommendation.entity.ts`
- [ ] T017 Star Schema and Snowflake Schema warehouse designs, wired to T005 (FR-007)
- [ ] T018 Fact Tables and Dimension Tables in the Data Warehouse (FR-008)
- [ ] T019 Historical data and aggregated data retention (FR-009)
- [ ] T020 OLAP cube support (FR-010)
- [ ] T021 Incremental loads into the Data Warehouse (FR-011)
- [ ] T022 Data compression in the Data Warehouse (FR-012)
- [ ] T023 Query optimization for Data Warehouse queries (FR-013)
- [ ] T024 Note: this feature's Executive KPI entity is the computed-metric layer; `049`'s KPI Definition is the governance record (formula/thresholds/ownership) that governs it — a clean vertical layering, not a naming collision, per plan.md §1
- [ ] T025 Note: this feature is canonical for the 4 domains (Customer, Product, Employee, Vendor/Supplier) overlapping `034`'s own Master Data Management — answering `034`'s own previously-unanswerable Edge Case about MDM/warehouse authority; `034` retains exclusive ownership of its marketing-only entities (Course, Ebook, Podcast, Campaign, Membership, Brand), per plan.md §2
- [ ] T026 Note: this feature's general-purpose warehouse/lake role vs. `034`'s marketing-domain application is confirmed clean except for the T025 MDM exception, per plan.md §3
- [ ] T027 Note: master-data-domain authoritative-source-per-domain question (e.g., CRM `013` vs. ERP for "Customers") is preserved as an explicit NEEDS CLARIFICATION exactly as spec.md states it, per plan.md §4
- [ ] T028 Note: AI Data Assistant and AI Data Intelligence reuse `008`'s `ai-gateway`/`ai-guardrails` for provider access/governance, with forecasting/root-cause-analysis logic as this feature's own structured-warehouse-data query layer, per plan.md §5
- [ ] T029 Note: row/column-level security and data masking configure `001`'s/`016`'s existing layered RBAC engine per the established extension pattern, per plan.md §6
- [ ] T030 Note: `064`'s iPaaS is the confirmed bidirectional ingestion/connectivity path — `064/plan.md` §7 already forward-declared this feature as its Data Lake/BI target, per plan.md §7
- [ ] T031 Contract test: for a master data domain seeded with known duplicates, MDM produces exactly one golden record per real-world entity, with zero unresolved duplicates surviving data-steward review, in `backend/tests/contract/mdm-exactly-one-golden-record-zero-unresolved-duplicates.contract.test.ts` (SC-003)
- [ ] T032 Contract test: a configured ETL/ELT pipeline completes Extract→Archive automatically with CDC correctly limiting repeat runs to changed records, and any injected mid-pipeline failure is caught by error recovery/retry without a partial or corrupted load, in `backend/tests/contract/etl-pipeline-cdc-error-recovery-zero-partial-load.contract.test.ts` (SC-002)
- [ ] T033 Contract test: zero AI Data recommendation triggers a consequential action without a recorded human approval step, in `backend/tests/contract/ai-data-recommendation-zero-autonomous-consequential-action.contract.test.ts` (SC-009)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Data Flows Through the Ten-Layer Enterprise Architecture (Priority: P1) 🎯 MVP

**Independent Test**: Register one source system, confirm its data lands in the Data Lake, is promoted into the Data Warehouse, appears in a Data Mart, and is queryable from the Consumption Layer.

- [ ] T034 [US1] Unified, scalable, AI-powered foundation for collecting, storing, processing, governing, analyzing, visualizing enterprise data (FR-001)
- [ ] T035 [US1] Consolidation from 15 named source categories (HRMS, CRM, ERP, Finance, Procurement, Inventory, Marketing, Community, LMS, Customer Support, Mobile, Web, IoT, AI, third-party) into a single architecture, wired to acceptance scenario 1 (FR-002)
- [ ] T036 [US1] Batch, streaming, structured, semi-structured, unstructured data support (FR-003)
- [ ] T037 [US1] 10 sequential data layers (Source, Ingestion, Data Lake, Data Warehouse, Data Marts, Semantic, Analytics, AI, Reporting, Consumption), wired to acceptance scenarios 2–3 (FR-004)
- [ ] T038 [US1] Architecture features (distributed storage, partitioning, horizontal scaling, replication, fault tolerance, metadata management, multi-tenant support, HA, DR, data virtualization), wired to acceptance scenario 4 (FR-005)
- [ ] T039 [US1] Enterprise-grade data lake storage for raw structured/semi-structured/unstructured data (images, videos, audio, documents, logs, IoT, AI datasets), wired to T004, acceptance scenario 1 (FR-006)
- [ ] T040 [P] [US1] Ten-Layer Data Flow Trace UI
- [ ] T041 [US1] Integration test: ingested CRM data lands raw in the Data Lake before transformation, promoted Data Lake data becomes available in structured Fact/Dimension form for Data Marts, a Semantic/Analytics Layer query returns results without exposing raw source data, two multi-tenant tenants' data remains isolated across all 10 layers — all 4 acceptance scenarios in `backend/tests/integration/us1-ten-layer-architecture.integration.test.ts`

**Checkpoint**: The foundational structure every other chapter capability depends on is independently functional.

---

## Phase 4: User Story 2 — ETL/ELT Pipeline Executes Extract-to-Archive with Change Data Capture (Priority: P1)

**Independent Test**: Run a single pipeline end-to-end against a sample source dataset and confirm each of the eight stages executes in order, CDC correctly identifies only changed/new records on a repeat run, and a failed stage triggers retry/error recovery.

- [ ] T042 [US2] Automated enterprise data movement through ETL/ELT pipelines, wired to T007 (FR-016)
- [ ] T043 [US2] 8-stage pipeline workflow (Extract→Validate→Transform→Cleanse→Enrich→Load→Monitor→Archive), wired to acceptance scenario 1 (FR-017)
- [ ] T044 [US2] Batch processing and real-time streaming pipeline execution (FR-018)
- [ ] T045 [US2] Incremental loads and full loads (FR-019)
- [ ] T046 [US2] Change Data Capture (CDC) for changed-record-only processing, wired to T032's contract test, acceptance scenario 2 (FR-020)
- [ ] T047 [US2] Data validation as part of the pipeline workflow (FR-021)
- [ ] T048 [US2] Error recovery and retry mechanism for failed pipeline runs, wired to acceptance scenario 3 (FR-022)
- [ ] T049 [US2] Pipeline scheduling and dependency management across interdependent pipelines, wired to acceptance scenario 4 (FR-023)
- [ ] T050 [US2] 10 transformation capabilities (cleansing, mapping, standardization, normalization, enrichment, deduplication, aggregation, filtering, calculated fields, custom transformations) (FR-024)
- [ ] T051 [P] [US2] ETL/ELT Pipeline Designer & Monitor UI
- [ ] T052 [US2] Integration test: a pipeline run executes all 8 stages in order, a repeat run against a partially-changed dataset uses CDC for incremental processing only, a mid-run transformation failure invokes retry and surfaces for error recovery rather than partial load, interdependent pipelines enforce dependency management against stale upstream data — all 4 acceptance scenarios in `backend/tests/integration/us2-etl-elt-cdc-pipeline.integration.test.ts`

**Checkpoint**: The mechanism keeping every downstream layer current, a P1 prerequisite for trustworthy reporting, is independently functional.

---

## Phase 5: User Story 3 — Business User Builds a Self-Service BI Report and Dashboard (Priority: P1)

**Independent Test**: Have a business user, without engineering assistance, build a report against an existing Data Mart, save it, and share it as a dashboard another user can view and export.

- [ ] T053 [US3] Self-service analytics features (drag & drop reports, dashboard builder, self-service analytics, pivot tables, drill down/through, ad-hoc reporting, scheduled reports, interactive visualizations, embedded analytics), wired to acceptance scenarios 1–2 (FR-037)
- [ ] T054 [US3] 12 visualization types (KPI Cards, Line/Bar/Pie/Area Charts, Heat Maps, Scatter Charts, Funnel Charts, Treemaps, Sankey Diagrams, Geographic Maps, Gauge Charts) (FR-038)
- [ ] T055 [US3] Saved reports, shared dashboards, PDF/Excel/CSV export, mobile dashboards, real-time refresh, alerts, collaboration, wired to acceptance scenarios 3–4 (FR-039)
- [ ] T056 [P] [US3] Self-Service BI Report & Dashboard Builder UI
- [ ] T057 [US3] Integration test: a user builds a report against a Data Mart via drag-and-drop without writing a query, a saved report added to a dashboard supports drill-down navigation, a completed dashboard exports to PDF/Excel/CSV, a shared dashboard reflects real-time refresh without manual re-run — all 4 acceptance scenarios in `backend/tests/integration/us3-self-service-bi.integration.test.ts`

**Checkpoint**: The most visible, highest-frequency-use capability of the platform is independently functional.

---

## Phase 6: User Story 4 — MDM Creates a Golden Record via Duplicate Detection, Merge, and Survivorship Rules (Priority: P2)

**Independent Test**: Load two known-duplicate records for the same real-world entity, confirm duplicate detection flags them, run the merge with defined survivorship rules, and verify a single golden record results with a full audit trail.

- [ ] T058 [US4] Master data consistency across 10 domains (Customers, Employees, Products, Suppliers, Assets, Projects, Departments, Locations, Accounts, Inventory Items), wired to T008's `034`-canonical note (FR-025)
- [ ] T059 [US4] Golden record management per master data domain (FR-026)
- [ ] T060 [US4] Duplicate detection and record matching against master data, wired to T009, acceptance scenario 1 (FR-027)
- [ ] T061 [US4] Configurable merge rules and survivorship rules, wired to acceptance scenario 2 (FR-028)
- [ ] T062 [US4] Reference data used by MDM matching and merge processes (FR-029)
- [ ] T063 [US4] Master data change synchronization across connected systems, wired to acceptance scenario 3 (FR-030)
- [ ] T064 [US4] Version control and audit trail for master data/golden-record changes, wired to T031's contract test, acceptance scenario 4 (FR-031)
- [ ] T065 [US4] Data stewardship workflows for reviewing/approving master data changes (FR-032)
- [ ] T066 [US4] Data Steward Dashboard (Duplicate Records, Golden Records, Data Quality Score, Synchronization Status, Validation Errors, Pending Reviews, Data Changes, Governance Compliance), wired to acceptance scenario 1 (FR-033)
- [ ] T067 [P] [US4] Data Steward Dashboard UI
- [ ] T068 [US4] Integration test: matching-attribute duplicate records are flagged as candidates on the Data Steward Dashboard, an approved merge applies survivorship rules to determine surviving field values, a contributing source-record update synchronizes with version history/audit trail preserved, a steward can trace and evaluate an incorrectly applied merge via the audit trail — all 4 acceptance scenarios in `backend/tests/integration/us4-mdm-golden-record.integration.test.ts`

**Checkpoint**: The master-data-quality mechanism directly affecting every report's accuracy is independently functional.

---

## Phase 7: User Story 5 — Executive Views Role-Specific KPI Dashboard (Priority: P2)

**Independent Test**: Load a known set of KPI values into the warehouse, open a specific role dashboard, and confirm the correct KPIs, drill-down, and exception alerts render for that role.

- [ ] T069 [US5] Centralized executive performance monitoring dashboards (FR-040)
- [ ] T070 [US5] 12 executive KPIs (Revenue, Profit, Customer Growth, Employee Growth, Sales Performance, Marketing ROI, Inventory Turnover, Procurement Savings, Cash Flow, Customer Satisfaction, Project Delivery, AI Utilization), wired to T014, T024's `049`-layering note (FR-041)
- [ ] T071 [US5] 10 role-specific dashboard types (CEO, CFO, COO, CHRO, CMO, CIO, Sales, Marketing, Finance, Operations), wired to acceptance scenario 1 (FR-042)
- [ ] T072 [US5] Executive dashboard features (interactive KPIs, drill-down analysis, forecast charts, benchmark comparisons, department scorecards, goal tracking, trend analysis, exception alerts, executive reports, mobile access), wired to acceptance scenarios 2–4 (FR-043)
- [ ] T073 [P] [US5] Role-Specific Executive Dashboard UI
- [ ] T074 [US5] Integration test: an executive's role-specific dashboard displays only its relevant KPIs, an out-of-range KPI raises a visible exception alert, drilling down on a displayed KPI shows contributing data/trend analysis, an executive's mobile dashboard renders the same KPIs with mobile access support — all 4 acceptance scenarios in `backend/tests/integration/us5-executive-kpi-dashboard.integration.test.ts`

**Checkpoint**: Executive visibility into enterprise performance, built atop the warehouse/BI/KPI infrastructure, is independently functional.

---

## Phase 8: User Story 6 — Data is Automatically Tiered Across Hot, Warm, Cold, and Archive Storage (Priority: P2)

**Independent Test**: Load a dataset, apply a defined retention policy, advance past a tier-transition threshold, and confirm the platform migrates the data to the next tier while keeping it queryable per policy.

- [ ] T075 [US6] 4 storage tiers (Hot, Warm, Cold, Archive) with policy-driven migration, wired to T011, acceptance scenarios 1–2 (FR-014)
- [ ] T076 [US6] Configurable retention policies (30 Days, 90 Days, 1 Year, 3 Years, 5 Years, 10 Years, Permanent, Custom), wired to T012, acceptance scenario 3 (FR-015)
- [ ] T077 [P] [US6] Storage Tiering & Retention Policy UI
- [ ] T078 [US6] Integration test: frequently-accessed newly ingested data remains in Hot Storage, aged data migrates Hot→Warm→Cold→Archive at configured thresholds, a Custom-policy dataset applies its custom rule instead of a standard tier, Archive-tiered data remains retrievable subject to that tier's access characteristics — all 4 acceptance scenarios in `backend/tests/integration/us6-storage-tiering-retention.integration.test.ts`

**Checkpoint**: The cost/compliance operational concern layered on top of the P1 storage foundation is independently functional.

---

## Phase 9: User Story 7 — Analyst Discovers a Dataset via Metadata & Data Catalog (Priority: P3)

**Independent Test**: Register a dataset with full metadata, search for it in the catalog by a glossary term, and confirm all required metadata fields and lineage are visible.

- [ ] T079 [US7] Complete metadata across 6 types (Technical, Business, Operational, Security, Lineage, Quality) (FR-034)
- [ ] T080 [US7] Data catalog features (dataset registry, business glossary, data dictionary, schema explorer, data lineage, ownership, classification, search, usage statistics, documentation), wired to T010, acceptance scenarios 1, 3 (FR-035)
- [ ] T081 [US7] Cataloged dataset field set (Dataset ID, Name, Description, Owner, Department, Source, Schema, Refresh Frequency, Classification, Tags, Data Quality Score, Last Updated, Consumers), wired to acceptance scenario 2 (FR-036)
- [ ] T082 [P] [US7] Data Catalog & Discovery UI
- [ ] T083 [US7] Integration test: a registered dataset appears in search results by name or glossary term, an opened catalog entry displays all required metadata fields, a dataset's lineage view shows upstream sources and downstream consumers — all 3 acceptance scenarios in `backend/tests/integration/us7-metadata-data-catalog.integration.test.ts`

**Checkpoint**: The discoverability layer reducing duplicate/incorrect dataset usage is independently functional.

---

## Phase 10: User Story 8 — User Queries Enterprise Data via the AI Data Assistant (Priority: P3)

**Independent Test**: Submit one of the chapter's example questions against a populated warehouse and confirm the assistant returns an answer with supporting analytics and a confidence score, presented as advisory only.

- [ ] T084 [US8] AI-driven data management/analytics optimization (predictive analytics, forecasting, classification, auto tagging, cleansing, anomaly detection, pattern recognition, root cause analysis, NL query, auto dashboard generation, recommendation engine, business insight generation), wired to T016, T028's `008`-reuse note, acceptance scenario 1 (FR-050)
- [ ] T085 [US8] AI Data Assistant natural-language Q&A across the documented example questions (FR-051)
- [ ] T086 [US8] AI recommendation full field set (Recommendation, Supporting Analytics, Confidence Score, Business Impact, Financial Impact, Risk Level, Suggested Action, Responsible Department, Expected Outcome), wired to acceptance scenario 2 (FR-052)
- [ ] T087 [US8] Advisory-only presentation with mandatory human/role-gated approval before any consequential action, wired to T033's contract test, acceptance scenarios 3–4 (FR-053)
- [ ] T088 [P] [US8] AI Data Assistant UI
- [ ] T089 [US8] Integration test: a "revenue forecast for next quarter?" query returns a forecast answer with supporting analytics, a displayed AI recommendation includes all 9 required fields, a suggested action is presented as advisory only without automatic execution, a data-quality-affected answer's confidence score reflects the reduced reliability rather than false certainty — all 4 acceptance scenarios in `backend/tests/integration/us8-ai-data-assistant.integration.test.ts`

**Checkpoint**: The accelerant layer over the trustworthy core platform is independently functional.

---

## Phase 11: Real-Time Streaming Analytics, Data Governance & Quality, Security & Compliance, Enterprise Integrations (supports FR-044–FR-049, FR-054–FR-063; cross-cutting, no single owning story)

- [ ] T090 Continuous enterprise analytics from 10 streaming sources (API Events, User Activity, Payments, CRM Updates, IoT Devices, Inventory Transactions, Attendance Systems, Mobile Apps, Website Activity, AI Events), wired to T015 (FR-044)
- [ ] T091 Real-time features (live dashboards, event processing, stream analytics, window functions, continuous queries, real-time alerts, event correlation, anomaly detection, KPI streaming, instant notifications) (FR-045)
- [ ] T092 Streaming Dashboard (Live Users, Live Revenue, Active Transactions, Queue Health, Processing Latency, Events per Second, System Throughput, Error Rate, Active Streams, Streaming Health) (FR-046)
- [ ] T093 Enterprise data governance (ownership, stewardship, classification, privacy policies, retention policies, access controls, compliance monitoring, audit trails, change management, policy enforcement) (FR-047)
- [ ] T094 10 data quality metrics (Accuracy, Completeness, Consistency, Validity, Uniqueness, Timeliness, Integrity, Reliability, Availability, Compliance), wired to T013 (FR-048)
- [ ] T095 Data Quality Dashboard (Overall Quality Score, Missing Data, Duplicate Records, Invalid Values, Failed Validations, Quality Trends, Steward Actions, Compliance Status, Critical Issues, Resolution Time) (FR-049)
- [ ] T096 RBAC for all data platform access, wired to T029's `001`/`016`-reuse note (FR-054)
- [ ] T097 Row-level security and column-level security (FR-055)
- [ ] T098 Data masking (FR-056)
- [ ] T099 Encryption at rest and in transit (FR-057)
- [ ] T100 Audit logging of data platform activity (FR-058)
- [ ] T101 Data lineage tracking across the platform (FR-059)
- [ ] T102 Backup & recovery and disaster recovery (FR-060)
- [ ] T103 Compliance monitoring (FR-061)
- [ ] T104 Multi-region replication (FR-062)
- [ ] T105 Integration with HRMS, CRM, ERP, Finance, Procurement, Inventory & Warehouse, Project Management, Workflow Automation (`063`), DMS (`062`), LMS (`004`), Customer Support, Community Platform, AI Platform (`008`), API Gateway, iPaaS (`064`, confirmed per T030), BI Tools, Data Lake, Data Warehouse (FR-063)
- [ ] T106 [P] Streaming, Governance/Quality & Security/Compliance UI

---

## Phase 12: Polish — Final Validation

- [ ] T107 Resolve and document the 12 preserved NEEDS CLARIFICATION items (3 self-flagged, 9 from Edge Cases) not already closed by `research.md`
- [ ] T108 Final audit: cross-check every FR-001–FR-063 against an implementation or validation task; re-verify the `049`, `034`, `008`, `001`/`016`, `064` reuse decisions are respected
- [ ] T109 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `008`'s `ai-gateway`/`ai-guardrails` and `064`'s iPaaS, and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US3)**: US1 (Ten-Layer Architecture) is the foundational structure every other capability depends on and must land first; US2 (ETL/ELT/CDC) depends on US1's layers existing to move data through; US3 (Self-Service BI) depends on US1's Data Marts existing to query.
- **P2 stories (US4, US5, US6)**: US4 (MDM) depends on US1's architecture being in place; US5 (Executive KPI Dashboard) depends on US1–US3's warehouse/BI infrastructure; US6 (Storage Tiering) is an operational concern layered on the P1 storage foundation.
- **P3 stories (US7, US8)**: US7 (Data Catalog) depends on datasets already existing across US1–US6 to catalog; US8 (AI Data Assistant) depends on the warehouse/BI/governance layers already being trustworthy. Both are independent of each other.
- **Phase 11 (Streaming, Governance/Quality, Security, Integrations)** depends on Foundational and US1; can land alongside US4–US8.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (mdm-exactly-one-golden-record-zero-unresolved-duplicates, etl-pipeline-cdc-error-recovery-zero-partial-load, ai-data-recommendation-zero-autonomous-consequential-action) pass → US1 (Ten-Layer Architecture) → US2 (ETL/ELT/CDC) → US3 (Self-Service BI) → **STOP and VALIDATE** the core data-flow and reporting foundation is trustworthy → US4 (MDM) + US5 (Executive KPI Dashboard) + US6 (Storage Tiering) + Phase 11 (Streaming/Governance/Security) → US7 (Data Catalog) + US8 (AI Data Assistant) → Polish.
