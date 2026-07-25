---
description: "Task list for Feature 049 — Enterprise Business Intelligence & KPI Management"
---

# Tasks: Enterprise Business Intelligence & KPI Management

**Input**: Design documents from `/specs/049-business-intelligence-kpi-management/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 037, 040, and 003, and its documented — not resolved — connection between this chapter's KPI-governance principle and the session's accumulated metric-duplication clusters), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC reused via `016`). This feature also assumes `037`'s attribution/MMM model, `040`'s churn model, and `003`'s auth/identity infrastructure exist as non-duplicated peers/consumption points.

**Tests**: Included throughout — single-KPI-definition governance, report sign-off distribution gating, and AI-recommendation zero-autonomous-execution each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-004, and SC-007.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md). Unlike every prior feature this session, this spec's 8 user stories fully partition the 69 FRs with no leftover FR groups — no cross-cutting supplementary phases are needed.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC reused via `016`), and that `037`'s attribution/MMM model, `040`'s churn model, and `003`'s auth/identity infrastructure exist
- [ ] T002 Resolve `research.md` open items before proceeding: cross-department/cross-feature same-name KPI divergence detection, Digital Sign-Off escalation mechanics, AI Business Ranking dispute/override workflow, cross-domain variance reconciliation, AI "do not suggest again" governance control, dashboard widget staleness indicator, Prescriptive-recommendation execution-API separation, predictive/decision cold-start policy, cross-workflow conflicting-recommendation reconciliation, and the KPI-governance-vs-metric-duplication-clusters connection (plan.md §3)
- [ ] T003 [P] Add `backend/src/modules/bi-kpi/{bi-workspace-intelligence-domains,executive-analytics-management,kpi-management-governance,enterprise-reporting,ai-reporting-intelligence,business-performance-management,bi-dashboard-business-rankings,decision-intelligence,ai-predictive-prescriptive-analytics,executive-decision-support,enterprise-intelligence-portal,executive-intelligence-workspace,bi-collaboration,bi-governance-compliance}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Intelligence Domain` entity in `backend/src/modules/bi-kpi/bi-workspace-intelligence-domains/intelligence-domain.entity.ts`
- [ ] T005 [P] Define the `KPI Definition` entity in `backend/src/modules/bi-kpi/kpi-management-governance/kpi-definition.entity.ts`
- [ ] T006 [P] Define the `KPI Threshold` entity in `backend/src/modules/bi-kpi/kpi-management-governance/kpi-threshold.entity.ts`
- [ ] T007 [P] Define the `KPI Alert` entity in `backend/src/modules/bi-kpi/kpi-management-governance/kpi-alert.entity.ts`
- [ ] T008 [P] Define the `Report` entity in `backend/src/modules/bi-kpi/enterprise-reporting/report.entity.ts`
- [ ] T009 [P] Define the `Report Sign-off Record` entity in `backend/src/modules/bi-kpi/enterprise-reporting/report-signoff-record.entity.ts`
- [ ] T010 [P] Define the `AI Executive Highlight` entity in `backend/src/modules/bi-kpi/ai-reporting-intelligence/ai-executive-highlight.entity.ts`
- [ ] T011 [P] Define the `Business Performance Objective` entity in `backend/src/modules/bi-kpi/business-performance-management/business-performance-objective.entity.ts`
- [ ] T012 [P] Define the `Business Ranking` entity in `backend/src/modules/bi-kpi/bi-dashboard-business-rankings/business-ranking.entity.ts`
- [ ] T013 [P] Define the `Executive Analytics Workflow Instance` entity in `backend/src/modules/bi-kpi/executive-analytics-management/executive-analytics-workflow-instance.entity.ts`
- [ ] T014 [P] Define the `Decision Record` entity in `backend/src/modules/bi-kpi/decision-intelligence/decision-record.entity.ts`
- [ ] T015 [P] Define the `AI Model (Registry Entry)` entity in `backend/src/modules/bi-kpi/ai-predictive-prescriptive-analytics/ai-model-registry-entry.entity.ts`
- [ ] T016 [P] Define the `Governance Policy` entity in `backend/src/modules/bi-kpi/bi-governance-compliance/governance-policy.entity.ts`
- [ ] T017 [P] Define the `Audit Log Entry` entity in `backend/src/modules/bi-kpi/bi-governance-compliance/audit-log-entry.entity.ts`
- [ ] T018 [P] Define the `Collaboration Meeting Record` entity in `backend/src/modules/bi-kpi/bi-collaboration/collaboration-meeting-record.entity.ts`
- [ ] T019 Note: Predictive/Prescriptive Analytics here is the enterprise-wide, BI-anchored decision layer, distinct from and not duplicating `037`'s attribution/MMM model or `040`'s churn model (per plan.md §1)
- [ ] T020 Note: Workspace Security (RBAC/MFA/SSO/Conditional Access/Device Trust) integrates with `003`'s existing auth/identity system rather than a separate identity provider (per plan.md §2)
- [ ] T021 Note: this chapter's KPI-governance principle (single definition per KPI name, no divergent calculation logic) is the source-implied future mechanism for reconciling the session's accumulated metric-duplication clusters (Customer/Health Score across 7 features, ARR/MRR/CAC/CLV/GRR/NRR across 009/045/048, Lead Score scale across 013/024/045) — NOT resolved here; this feature's own KPI Definitions for an already-owned metric name MUST govern/register the existing canonical calculation, not define a competing one (per plan.md §3)
- [ ] T022 Note: the Enterprise Intelligence Portal and Executive Intelligence Workspace aggregate and consolidate every prior Wave 1-3 feature's own dashboards/reports/KPIs rather than rebuilding them — an intentional capstone role, not a collision (per plan.md §4)
- [ ] T023 Contract test: zero same-name KPI Definitions carry divergent calculation formulas in production, in `backend/tests/contract/single-kpi-definition-no-divergent-formula.contract.test.ts` (FR-019, SC-001)
- [ ] T024 Contract test: zero reports configured for Digital Sign-Off are distributed through any channel prior to completed sign-off, in `backend/tests/contract/report-signoff-blocks-distribution-until-complete.contract.test.ts` (FR-026, SC-004)
- [ ] T025 Contract test: 100% of AI-generated recommendations across Decision Intelligence/Prescriptive Analytics/AI KPI Intelligence/the AI Executive Advisor remain advisory with zero automatic execution absent recorded human approval, in `backend/tests/contract/ai-recommendation-zero-autonomous-execution.contract.test.ts` (FR-052/FR-068, SC-007)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — BI 360° Workspace Spanning 15 Intelligence Domains (Priority: P1) 🎯 MVP

**Independent Test**: Configure at least two Intelligence Domains, populate each domain's Business Intelligence Profile, and confirm the unified workspace surfaces both domains' data in one place.

- [ ] T026 [US1] Unified BI 360° Workspace as the authoritative enterprise analytics source of truth, wired to T004 (FR-001)
- [ ] T027 [US1] 15 configurable Intelligence Domains + admin-definable additional without software modification, wired to acceptance scenario 1 (FR-002)
- [ ] T028 [US1] Business Intelligence Profile full field set (12 fields) per domain, wired to T004 (FR-003)
- [ ] T029 [US1] Unified BI Workspace (13 modules: Executive Overview→Audit Timeline), wired to acceptance scenario 3 (FR-004)
- [ ] T030 [US1] 10 BI business objectives enforcement (centralize operations, improve visibility, standardize analytics, etc.) (FR-005)
- [ ] T031 [US1] Independently configurable and auditable Data Refresh Schedule and Governance Status per domain, wired to acceptance scenario 2 (FR-006)
- [ ] T032 [US1] Multi-department, multi-region, and multi-business-unit analytics model support, wired to acceptance scenario 4 (FR-007)
- [ ] T033 [P] [US1] BI 360° Workspace UI
- [ ] T034 [US1] Integration test: a new domain is configurable without a software change and available across the workspace, two domains' refresh schedule and governance status are independently configurable and auditable, all 13 workspace modules are present and reflect every configured domain, results are filterable at the multi-department/region/business-unit level — all 4 acceptance scenarios in `backend/tests/integration/us1-bi-360-workspace.integration.test.ts`

**Checkpoint**: The foundational, must-ship-first capability every other chapter capability is built on top of is independently functional.

---

## Phase 4: User Story 2 — Executive Analytics Management as a Real-Time Command Center (Priority: P1)

**Independent Test**: Feed a data set through all 8 workflow stages and confirm each stage produces a recorded, auditable output with configurable approvals and notifications.

- [ ] T035 [US2] Real-time enterprise command center for strategic decision-making (FR-008)
- [ ] T036 [US2] 12 Executive Analytics Categories, wired to acceptance scenario 4 (FR-009)
- [ ] T037 [US2] 10 Executive Analytics Components, wired to T013, acceptance scenario 2 (FR-010)
- [ ] T038 [US2] 8-stage Executive Analytics Workflow (Data Aggregation→Continuous Monitoring), wired to acceptance scenario 1 (FR-011)
- [ ] T039 [US2] Per-stage configurable approvals, notifications, and audit history (FR-012)
- [ ] T040 [US2] AI Executive outputs (Briefings, Strategic Recommendations, Opportunity Identification, Business Forecasts, Scenario Planning, Executive Priority Analysis) with explainable reasoning and confidence metrics, wired to acceptance scenario 3 (FR-013)
- [ ] T041 [P] [US2] Executive Analytics Command Center UI
- [ ] T042 [US2] Integration test: multi-domain data runs through all 8 stages recording an audit entry/notification/approval status per stage, a requested Analytics Category returns its full component set, an AI Executive Briefing/Recommendation includes reasoning and confidence, all 12 categories render independently with their own component set — all 4 acceptance scenarios in `backend/tests/integration/us2-executive-analytics-command-center.integration.test.ts`

**Checkpoint**: The most direct path from governed data to an executive decision is independently functional.

---

## Phase 5: User Story 3 — KPI Management Enforcing Standardized Definitions Across 14 Categories (Priority: P1)

**Independent Test**: Define a KPI with a Calculation Formula, Target Value, and Thresholds, attempt to have two departments report the same KPI name with different formulas, and confirm the system enforces a single governed definition.

- [ ] T043 [US3] Standardized KPI definition/governance/monitoring/reporting/optimization enablement (FR-014)
- [ ] T044 [US3] 14 KPI Categories + admin-definable additional, wired to T005 (FR-015)
- [ ] T045 [US3] KPI Definition full field set (11 fields), wired to acceptance scenario 1 (FR-016)
- [ ] T046 [US3] 8-metric continuous KPI monitoring (Target Achievement, Trends, Variance, Alerts, Historical/Department/BU/Enterprise Performance), wired to acceptance scenario 3 (FR-017)
- [ ] T047 [US3] AI KPI Intelligence (6 recommendation types) advisory-only, wired to acceptance scenario 4 (FR-018)
- [ ] T048 [US3] Hard governance rule: single standardized definition/ownership/calculation-logic/thresholds per KPI name, divergent calculation logic not permitted, wired to T023's contract test and T021's cluster note (FR-019)
- [ ] T049 [US3] KPI threshold-crossing Alert notification to configured stakeholders, wired to T006/T007, acceptance scenario 2 (FR-020)
- [ ] T050 [P] [US3] KPI Library & Governance UI
- [ ] T051 [US3] Integration test: a new KPI is saved with all 12 required fields, a threshold crossing raises an alert and notifies stakeholders, ongoing monitoring shows target achievement/trends/variance/historical/department/BU/enterprise performance, underperforming trends produce AI advisory suggestions — all 4 acceptance scenarios in `backend/tests/integration/us3-kpi-management-governance.integration.test.ts`

**Checkpoint**: The governance backbone every other analytics surface reads from is independently functional.

---

## Phase 6: User Story 4 — Enterprise Reporting With Drag-and-Drop Building, Sign-Off, and Versioning (Priority: P2)

**Independent Test**: Build a report using the drag-and-drop designer, route it through Digital Sign-Off, confirm it cannot be distributed until sign-off completes, then deliver it through at least two channels and confirm versioning.

- [ ] T052 [US4] Report creation/governance/scheduling/distribution/version-control/lifecycle enablement (FR-021)
- [ ] T053 [US4] 14 Report Categories, wired to T008 (FR-022)
- [ ] T054 [US4] 10 Report Features including Report Builder, Drag-and-Drop Designer, Digital Sign-Off, Versioning, Templates, wired to acceptance scenario 1 (FR-023)
- [ ] T055 [US4] 8-channel Report Delivery, wired to acceptance scenario 3 (FR-024)
- [ ] T056 [US4] Scheduled/interactive/versioned/approved/secure report support, wired to acceptance scenario 4 (FR-025)
- [ ] T057 [US4] Digital Sign-Off hard block on distribution until sign-off is complete, wired to T009 and T024's contract test, acceptance scenario 2 (FR-026)
- [ ] T058 [P] [US4] Report Builder & Drag-and-Drop Designer UI
- [ ] T059 [US4] Integration test: a saved report is versioned with the prior version retrievable, an unsigned-off report is not released through any distribution channel, a scheduled report delivers through its configured channels on trigger, an interactive report supports drill-down without leaving the report — all 4 acceptance scenarios in `backend/tests/integration/us4-enterprise-reporting-signoff.integration.test.ts`

**Checkpoint**: The primary distribution mechanism for governed BI and KPI data is independently functional.

---

## Phase 7: User Story 5 — AI Reporting Intelligence Generating Narrative "Executive Highlights" (Priority: P2)

**Independent Test**: Generate a report containing at least one significant trend and confirm the AI Reporting Intelligence layer produces a Narrative Summary, a Trend Explanation, and an Executive Highlights section referencing that trend.

- [ ] T060 [US5] AI Automatic Report Generation, Narrative Summaries, Trend Explanations, Report Recommendations, Executive Highlights, Intelligent Insights, wired to T010 (FR-027)
- [ ] T061 [US5] 10 configurable executive-level report types (FR-028)
- [ ] T062 [US5] Report support (scheduled delivery, PDF/Excel export, drill-down, historical comparisons, predictive forecasting, benchmarking, RBAC, retention) (FR-029)
- [ ] T063 [P] [US5] AI Executive Highlights UI
- [ ] T064 [US5] Integration test: a completed report processed by AI Reporting Intelligence produces a generation output/narrative summary/trend explanations, an executive's condensed view surfaces Highlights and Insights distinct from the full report body, AI report recommendations are presented as accept/modify/dismiss suggestions rather than auto-applied changes — all 3 acceptance scenarios in `backend/tests/integration/us5-ai-reporting-intelligence.integration.test.ts`

**Checkpoint**: The high-leverage layer multiplying the value of every existing report is independently functional.

---

## Phase 8: User Story 6 — Business Performance Management Tying Every Domain to Objectives, KPIs, and Variance (Priority: P2)

**Independent Test**: Configure one Performance Domain with an Objective, a linked KPI, a Target, and Current Performance, generate an intentional variance, and confirm Variance Analysis, an Executive Action prompt, and an AI Recommendation all appear together for that domain.

- [ ] T065 [US6] Continuous performance measurement/monitoring/benchmarking/optimization against strategic objectives (FR-030)
- [ ] T066 [US6] 10 Performance Domains, wired to T011 (FR-031)
- [ ] T067 [US6] Per-domain full field set (Objectives, KPIs, Targets, Current Performance, Historical Trends, Variance Analysis, Executive Actions, AI Recommendations), wired to acceptance scenario 1 (FR-032)
- [ ] T068 [US6] 6-capability business-leader review tools (scorecards, department comparison, region benchmarking, initiative evaluation, objective monitoring, improvement-plan approval), wired to acceptance scenario 2 (FR-033)
- [ ] T069 [US6] AI Performance Intelligence (6 outputs) remaining advisory, wired to acceptance scenario 3 (FR-034)
- [ ] T070 [US6] Improvement-plan approval as a distinct, auditable business-leader action separate from the informing AI recommendation, wired to acceptance scenario 4 (FR-035)
- [ ] T071 [P] [US6] Business Performance Management UI
- [ ] T072 [US6] Integration test: below-target performance triggers Variance Analysis alongside the Objective and KPI, a completed review cycle supports scorecard/department/region/initiative review, an underperforming domain gets AI advisory recommendations, a leadership approval is recorded distinctly from the informing AI recommendation — all 4 acceptance scenarios in `backend/tests/integration/us6-business-performance-management.integration.test.ts`

**Checkpoint**: Where governed KPIs and reporting are converted into leadership action is independently functional.

---

## Phase 9: User Story 7 — BI Dashboard With Explainable, Auditable AI-Generated Business Rankings (Priority: P3)

**Independent Test**: Populate dashboard data for at least three of the twelve components, trigger an AI Business Ranking, and confirm an authorized user can inspect the ranking's underlying reasoning, confidence, and audit trail.

- [ ] T073 [US7] Centralized real-time executive/business-leader dashboard consolidating enterprise analytics (FR-036)
- [ ] T074 [US7] 12 Executive Dashboard components, wired to T012, acceptance scenario 1 (FR-037)
- [ ] T075 [US7] AI dashboard outputs (Business Forecasts, KPI Predictions, Trend Detection, Strategic Recommendations, Risk ID, Opportunity Analysis, Investment Priorities, Executive Strategic Insights) (FR-038)
- [ ] T076 [US7] Transparent/configurable/explainable/fully-auditable requirement on every AI insight and Business Ranking, wired to acceptance scenario 2 (FR-039)
- [ ] T077 [US7] Real-time, configurable, role-based dashboard visibility (FR-040)
- [ ] T078 [US7] Drill-down analytics, benchmarking, filtering, and export support, wired to acceptance scenario 3 (FR-041)
- [ ] T079 [P] [US7] BI Dashboard & Business Rankings UI
- [ ] T080 [US7] Integration test: all 12 components render with real-time role-based visibility, a disputed AI ranking exposes its reasoning/confidence/audit history, drill-down/filter/benchmark/export are available, a scheduled executive report triggers with full export/comparison/forecast/RBAC/retention — all 4 acceptance scenarios in `backend/tests/integration/us7-bi-dashboard-business-rankings.integration.test.ts`

**Checkpoint**: The consolidated, always-on capstone consumption surface is independently functional.

---

## Phase 10: User Story 8 — Decision Intelligence, Predictive/Prescriptive Analytics & Enterprise Intelligence Governance (Priority: P4)

**Independent Test**: Run a single business question through the 10-step Decision Intelligence Workflow to a recorded Decision Approval, confirm a Prescriptive Analytics recommendation was advisory-only until approved, and confirm the decision, its supporting AI reasoning, and the approval are all visible in the Governance & Compliance audit log.

- [ ] T081 [US8] Decision Intelligence framework combining data/AI/predictive-analytics/organizational-knowledge/business-rules/strategic-objectives for evidence-based recommendations, wired to T014 (FR-042)
- [ ] T082 [US8] 15 configurable Decision Categories (FR-043)
- [ ] T083 [US8] 10-stage Decision Intelligence Workflow (Data Collection→Continuous Outcome Monitoring) with per-stage configurable approvals/audit/notifications/governance, wired to acceptance scenario 1 (FR-044)
- [ ] T084 [US8] AI Decision outputs (Recommendations, Scenarios, Opportunity Analysis, Executive Priorities, Risk Assessments, Expected Outcomes) with reasoning/evidence/confidence/impact (FR-045)
- [ ] T085 [US8] AI Analytics across 12 domains continuously learning from organizational data, wired to T015 (FR-046)
- [ ] T086 [US8] AI Analytics capabilities (Pattern Recognition, Trend Detection, Correlation, Anomaly Detection, Root Cause, Forecast Generation, Segmentation, Behavioral Analytics, Recommendations, Automated Insights) (FR-047)
- [ ] T087 [US8] AI Model Management (Registry, Version Control, Validation, Continuous Training, Monitoring, Performance Evaluation, Explainability Reports, Bias Monitoring) (FR-048)
- [ ] T088 [US8] Predictive Analytics forecasting across 12 targets (FR-049)
- [ ] T089 [US8] Per-prediction confidence levels/assumptions/historical comparisons/business impact analysis requirement (FR-050)
- [ ] T090 [US8] Prescriptive Analytics recommending 10 optimal-action types evaluated against 8 input factors, wired to acceptance scenario 2 (FR-051)
- [ ] T091 [US8] AI prescriptive outputs (Ranked Recommendations, Expected Outcomes, Cost-Benefit Analysis, ROI Estimation, Priority Scores, Action Plans) remaining advisory unless approved, wired to T025's contract test, acceptance scenario 2 (FR-052)
- [ ] T092 [US8] Executive Decision Support Platform with 12-element Executive Workspace (FR-053)
- [ ] T093 [US8] 8-capability executive review/comparison/approval/monitoring tools (FR-054)
- [ ] T094 [US8] AI Executive Advisor (8 output types) (FR-055)
- [ ] T095 [US8] Enterprise Intelligence Portal (14 modules), wired to T022's dashboard-aggregation note (FR-056)
- [ ] T096 [US8] Portal dashboard (12 elements) (FR-057)
- [ ] T097 [US8] Executive Intelligence Workspace as the centralized strategic command center, wired to acceptance scenario 3 (FR-058)
- [ ] T098 [US8] Workspace modules (15 elements) supporting desktop/tablet/mobile (FR-059)
- [ ] T099 [US8] Workspace dashboard (14 elements) with role-based personalization, configurable layouts, real-time updates, drill-down (FR-060)
- [ ] T100 [US8] Workspace Security (10 controls), reusing `003`'s auth per T020's note, wired to acceptance scenario 3 (FR-061)
- [ ] T101 [US8] Enterprise BI Collaboration across 12 team types (FR-062)
- [ ] T102 [US8] Collaboration capabilities (12 types: Shared Dashboards, KPI Libraries, Collaborative Reports, etc.), wired to T018 (FR-063)
- [ ] T103 [US8] 8 structured Collaboration Meeting types with full record-keeping, wired to acceptance scenario 4 (FR-064)
- [ ] T104 [US8] AI Collaboration Intelligence (8 outputs: Meeting Summaries, Action Item Extraction, etc.), wired to acceptance scenario 4 (FR-065)
- [ ] T105 [US8] BI Governance & Compliance framework across 10 governance types, wired to T016 (FR-066)
- [ ] T106 [US8] Immutable audit records across 10 categories, wired to T017, acceptance scenario 5 (FR-067)
- [ ] T107 [US8] AI Governance enforcement (8 controls) across the BI ecosystem (FR-068)
- [ ] T108 [US8] Enterprise-scale support + independent processing paths + multi-language/currency/region/tenant/high-availability + future extensibility (FR-069)
- [ ] T109 [P] [US8] Decision Intelligence, Predictive/Prescriptive Analytics, Executive Decision Support, Enterprise Intelligence Portal, Executive Intelligence Workspace, BI Collaboration & Governance UI
- [ ] T110 [US8] Integration test: a business question moves through all 10 Decision Intelligence stages recording approvals/audit/notifications/governance per stage, a Prescriptive recommendation with its full field set remains advisory-only without approval, the Portal and Workspace present a unified view secured by RBAC/MFA/SSO/conditional-access/audit logging, a QBR meeting produces an AI Meeting Summary and extracted Action Items with full audit retention, any ecosystem-wide change is captured in an immutable Governance audit record — all 5 acceptance scenarios in `backend/tests/integration/us8-decision-intelligence-governance.integration.test.ts`

**Checkpoint**: The chapter's outer ring — sitting on top of the core BI/KPI/Reporting/Performance/Dashboard stack — is independently functional.

---

## Phase 11: Polish — Final Validation

- [ ] T111 Resolve and document the 10 preserved NEEDS CLARIFICATION items from plan.md §5 not already closed by `research.md`
- [ ] T112 Final audit: cross-check every FR-001–FR-069 against an implementation or validation task; re-verify the `037`/`040` non-duplication and `003` auth-reuse decisions are respected, and confirm the Enterprise Intelligence Portal/Executive Intelligence Workspace correctly aggregate rather than rebuild every prior Wave 1–3 feature's dashboards
- [ ] T113 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `037`/`040`'s non-duplicated deeper models and `003`'s auth infrastructure, and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US3)**: US1 (BI 360° Workspace) is the foundational, must-ship-first capability every other capability is built on top of; US2 (Executive Analytics) and US3 (KPI Management) both depend on US1's Intelligence Domain data and can build in parallel once US1 is complete.
- **P2 stories (US4, US5, US6)**: US4 (Enterprise Reporting) depends on US1–US3 already producing governed data to report on; US5 (AI Reporting Intelligence) depends on US4's reports existing; US6 (Business Performance Management) depends on US3's governed KPIs and US4's reporting foundation.
- **P3 story (US7)** depends on the Workspace, Executive Analytics, KPI Management, Reporting, and Performance Management already producing governed data, making it the natural capstone consumption surface.
- **P4 story (US8)** is structurally dependent on User Stories 1–7 all being operational first, and is correctly sequenced last.
- **Polish (Phase 11)** depends on all desired stories being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (single-kpi-definition-no-divergent-formula, report-signoff-blocks-distribution-until-complete, ai-recommendation-zero-autonomous-execution) pass → US1 (BI 360° Workspace) → **STOP and VALIDATE** the foundational unification layer is sound → US2 (Executive Analytics) + US3 (KPI Management) in parallel → **STOP and VALIDATE** KPI governance blocks divergent definitions → US4 (Enterprise Reporting) → US5 (AI Reporting Intelligence) + US6 (Business Performance Management) → US7 (BI Dashboard) → US8 (Decision Intelligence & outer ring) → Polish. This closes Wave 3 (034–049).
