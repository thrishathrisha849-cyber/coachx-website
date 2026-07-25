---
description: "Task list for Feature 048 — Enterprise Revenue Operations (RevOps)"
---

# Tasks: Enterprise Revenue Operations (RevOps)

**Input**: Design documents from `/specs/048-revenue-operations/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 009, 045, 047, 040, 008, and 003), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC reused via `016`). This feature also assumes `009`'s Financial Ledger/Subscription/Order/Payment entities, `045`'s Opportunity/Pipeline entities, `047`'s Renewal Record/Expansion Opportunity entities, and `040`'s Churn Prediction Engine exist as consumption points.

**Tests**: Included throughout — Revenue 360° single-view consolidation, AI-output zero-effect-without-approval, and immutable-audit-record survival across later config changes each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-004, and SC-005.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus three supplementary cross-cutting phases for FR groups not owned by any single prioritized story (pipeline/performance/operations-management remainder; analytics/executive-intelligence remainder; portal/collaboration-workspace remainder).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC reused via `016`), and that `009`'s Financial Ledger/Subscription/Order/Payment entities, `045`'s Opportunity/Pipeline entities, `047`'s Renewal Record/Expansion Opportunity entities, and `040`'s Churn Prediction Engine exist as consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: Commercial Approval Matrix thresholds/role mapping, target SLA durations, enterprise data retention periods, expected-vs-anomalous variance distinction, optimization-vs-pricing-freeze conflict handling, multi-category risk double-counting prevention, offline-action audit-trail reconciliation, Revenue Category rename/merge/delete historical-immutability handling, cross-revenue-source double-counting prevention, stale-source-data forecast handling, multi-currency ARR/MRR/GRR/NRR consolidation, risk-mitigation-pending-separate-approval blocking behavior
- [ ] T003 [P] Add `backend/src/modules/revops/{revenue-foundation-lifecycle,revenue-360-workspace,revenue-planning-goals,revenue-pipeline-management,revenue-performance-management,revenue-operations-management,revenue-forecasting,revenue-analytics-metrics,revenue-optimization,revenue-risk-management,ai-revenue-copilot,executive-revenue-intelligence,revenue-operations-portal,revenue-collaboration-workspace,revenue-governance-compliance}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Revenue Category` entity in `backend/src/modules/revops/revenue-360-workspace/revenue-category.entity.ts`
- [ ] T005 [P] Define the `Revenue Record / Revenue Profile` entity in `backend/src/modules/revops/revenue-360-workspace/revenue-profile.entity.ts`
- [ ] T006 [P] Define the `Revenue Plan / Goal` entity in `backend/src/modules/revops/revenue-planning-goals/revenue-plan.entity.ts`
- [ ] T007 [P] Define the `Pipeline Opportunity` entity in `backend/src/modules/revops/revenue-pipeline-management/pipeline-opportunity.entity.ts`
- [ ] T008 [P] Define the `Forecast` entity in `backend/src/modules/revops/revenue-forecasting/forecast.entity.ts`
- [ ] T009 [P] Define the `Revenue Optimization Action` entity in `backend/src/modules/revops/revenue-optimization/revenue-optimization-action.entity.ts`
- [ ] T010 [P] Define the `Revenue Risk Record` entity in `backend/src/modules/revops/revenue-risk-management/revenue-risk-record.entity.ts`
- [ ] T011 [P] Define the `AI Revenue Insight / Recommendation` entity in `backend/src/modules/revops/ai-revenue-copilot/ai-revenue-insight.entity.ts`
- [ ] T012 [P] Define the `Audit Record` entity in `backend/src/modules/revops/revenue-governance-compliance/audit-record.entity.ts`
- [ ] T013 [P] Define the `Revenue Scorecard` entity in `backend/src/modules/revops/revenue-performance-management/revenue-scorecard.entity.ts`
- [ ] T014 [P] Define the `Revenue Collaboration Record` entity in `backend/src/modules/revops/revenue-collaboration-workspace/revenue-collaboration-record.entity.ts`
- [ ] T015 [P] Define the `Executive Report` entity in `backend/src/modules/revops/executive-revenue-intelligence/executive-report.entity.ts`
- [ ] T016 Unify Sales/Marketing/Customer Success/Finance/Executive Operations revenue data into a single Revenue Operating System (FR-001)
- [ ] T017 Centralize revenue planning/pipeline/forecasting/performance/operational-intelligence/AI-optimization/executive-reporting (FR-002)
- [ ] T018 Revenue data ingestion from 10 named source systems (Layer 1), not acting as originating source of truth (FR-003)
- [ ] T019 Prohibited-action guardrails: no ERP/GL/Payroll/Tax-system replacement, no banking-transaction execution, no overriding financial compliance or statutory accounting (FR-004)
- [ ] T020 Implement the standardized 13-stage Enterprise Revenue Lifecycle (Market Demand→Long-Term Revenue Growth) (FR-005)
- [ ] T021 Implement the 12-phase Enterprise Revenue Operating Model (Revenue Planning→Continuous AI Optimization) (FR-006)
- [ ] T022 Data-Driven Decision Making: base revenue decisions on real-time operational/financial/customer/pipeline/predictive data (FR-007)
- [ ] T023 Continuous Revenue Optimization: continuously identify opportunities/bottlenecks/improvements/strategies (FR-008)
- [ ] T024 Note: Contract Value/Billing Frequency/Currency/Recognition Schedule fields synchronize from `009`'s Financial Ledger/Subscription/Order/Payment systems of record rather than being independently authored (per plan.md §1)
- [ ] T025 Note: Revenue Pipeline Management consumes `045`'s Opportunity/Pipeline entities rather than rebuilding a competing pipeline system of record (per plan.md §2)
- [ ] T026 Note: Revenue Workspace/Optimization/Risk content consumes `047`'s Renewal Record/Expansion Opportunity data and `040`'s Churn Prediction Engine output as inputs rather than recomputing renewal/expansion/churn logic independently (per plan.md §3)
- [ ] T027 Note: every AI Revenue Copilot and advisory-intelligence module consumes `008`'s shared AI gateway server-side only (per plan.md §4)
- [ ] T028 Note: Revenue Operations Portal reuses `003`'s auth/RBAC/design-system foundation rather than a new identity system (per plan.md §5)
- [ ] T029 Contract test: opening the Revenue 360° Workspace for a single revenue record renders all 14 workspace components with consolidated multi-source data in one view, in `backend/tests/contract/revenue-360-single-consolidated-view.contract.test.ts` (FR-011, SC-001)
- [ ] T030 Contract test: 0% of AI-generated forecasts/optimization recommendations/planning recommendations/risk scores take effect without a recorded human approval, in `backend/tests/contract/ai-output-zero-effect-without-human-approval.contract.test.ts` (FR-039/FR-046, SC-004)
- [ ] T031 Contract test: 100% of pricing/forecast/pipeline/executive-approval/commercial-agreement/AI-recommendation changes produce an immutable audit record that remains unchanged after later configuration changes, in `backend/tests/contract/immutable-audit-record-survives-later-config-change.contract.test.ts` (FR-062, SC-005)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Revenue 360° Workspace Across 15 Configurable Revenue Categories (Priority: P1) 🎯 MVP

**Independent Test**: Open the Revenue 360° Workspace for a single customer/revenue record and confirm all 14 workspace components render consolidated data, and that a new, organization-defined 16th revenue category can be configured without a software change.

- [ ] T032 [US1] 15 configurable Revenue Categories + admin-definable additional without software modification, wired to T004, acceptance scenario 2 (FR-009)
- [ ] T033 [US1] Revenue Profile full field set (16 fields), wired to T005, acceptance scenario 1 (FR-010)
- [ ] T034 [US1] Unified Revenue 360° Workspace (14 components) reconciling data across CRM/Marketing/CS/Subscription/Billing/Partner systems into one view, wired to acceptance scenarios 1 and 3 (FR-011)
- [ ] T035 [P] [US1] Revenue 360° Workspace UI
- [ ] T036 [US1] Integration test: the workspace displays the full Revenue Profile alongside all 14 components, a new 16th category is configurable without a software change and becomes selectable, multi-source data reconciles into the single view without requiring separate system lookups — all 3 acceptance scenarios in `backend/tests/integration/us1-revenue-360-workspace.integration.test.ts`

**Checkpoint**: The foundational unification layer every other RevOps capability reads from or writes into is independently functional.

---

## Phase 4: User Story 2 — Cascading Annual → Quarterly → Monthly Revenue Planning with AI Feasibility Analysis (Priority: P1)

**Independent Test**: Create one Annual Revenue Plan, cascade it into at least one Quarterly Plan and Monthly Target, run it through the 8-step Goal Management Workflow, and confirm an AI Goal Feasibility Analysis with a confidence score is attached before the Approval step is reached.

- [ ] T037 [US2] 10 plan-scope types cascading Annual→Quarterly→Monthly, wired to T006, acceptance scenario 1 (FR-012)
- [ ] T038 [US2] 10 configurable Goal Types + admin-definable additional (FR-013)
- [ ] T039 [US2] 8-step Goal Management Workflow (Goal Definition→Final Evaluation) with configurable approvals/notifications/audit, wired to acceptance scenarios 3 and 4 (FR-014)
- [ ] T040 [US2] AI Planning Intelligence (Revenue Target Recommendations, Capacity Planning, Goal Feasibility Analysis, Growth Scenarios, Budget Optimization, Strategic Planning Insights) with confidence and evidence, wired to acceptance scenario 2 (FR-015)
- [ ] T041 [P] [US2] Revenue Planning & Goal Cascade UI
- [ ] T042 [US2] Integration test: an Annual ARR goal cascades into Quarterly/Monthly plans summing consistently to the annual figure, a draft plan receives an AI Feasibility Analysis/capacity plan/growth scenario before Executive Review, an approved plan moves to Execution while unapproved plans are blocked, a Mid-Cycle Review shows progress across 5 target types with every stage transition audited — all 4 acceptance scenarios in `backend/tests/integration/us2-cascading-revenue-planning.integration.test.ts`

**Checkpoint**: The anchor every downstream RevOps process compares against is independently functional.

---

## Phase 5: User Story 3 — Revenue Forecasting Across 12 Categories with Continuous Variance Tracking and Anomaly Detection (Priority: P1)

**Independent Test**: Generate a Monthly Revenue Forecast from Forecast Inputs, let it run through one automatic refresh cycle, and confirm a forecast-vs-actual comparison, a confidence score, and (when variance exceeds tolerance) an anomaly alert are produced.

- [ ] T043 [US3] Short/medium/long-term forecast support for planning/budgeting/allocation/investment/growth decisions (FR-027)
- [ ] T044 [US3] 12 Forecast Categories + configurable additional models, wired to T008, acceptance scenario 1 (FR-028)
- [ ] T045 [US3] 12-input forecast derivation (historical revenue, pipeline, customer health, conversion rates, seasonality, etc.) (FR-029)
- [ ] T046 [US3] Automatic refresh, forecast-vs-actual comparison, anomaly detection, executive alerts, corrective-action recommendation, confidence identification, planning-review trigger, wired to acceptance scenarios 2–4 (FR-030)
- [ ] T047 [US3] AI Forecast Intelligence (Revenue Predictions, Scenario Simulations, Confidence Scores, Variance Analysis, Pipeline Forecasts, Executive Planning Recommendations) with rationale and confidence, wired to acceptance scenario 1 (FR-031)
- [ ] T048 [P] [US3] Forecast Variance & Anomaly Dashboard UI
- [ ] T049 [US3] Integration test: forecast generation returns a prediction/confidence score/rationale, recorded actual revenue triggers automatic forecast-vs-actual variance computation, threshold-exceeding variance detects an anomaly and generates an alert with a corrective-action recommendation, a low-confidence/high-variance forecast supports triggering a planning review — all 4 acceptance scenarios in `backend/tests/integration/us3-revenue-forecasting-variance.integration.test.ts`

**Checkpoint**: The platform's stated "primary decision-support mechanism for strategic planning" is independently functional.

---

## Phase 6: User Story 4 — Revenue Optimization Across 10 Areas via AI-Recommended, Human-Approved Actions (Priority: P2)

**Independent Test**: Surface one AI-detected optimization opportunity, route it through prioritization, have an authorized user approve or reject it, and confirm the platform tracks the approved action's measured business impact over time.

- [ ] T050 [US4] 10 Optimization Areas, wired to T009, T024's `009`/`045`-reuse notes, and T026's `047`/`040`-consumption note, acceptance scenario 1 (FR-036)
- [ ] T051 [US4] 10 Optimization Strategies (Pricing Optimization, Bundle Recommendations, Discount Governance, etc.) (FR-037)
- [ ] T052 [US4] Optimization automation (detect, recommend, prioritize, track, measure, notify, report) (FR-038)
- [ ] T053 [US4] AI Optimization Intelligence (6 outputs) remaining advisory until explicit enterprise-workflow approval, wired to acceptance scenarios 2–4 (FR-039)
- [ ] T054 [P] [US4] Revenue Optimization Queue UI
- [ ] T055 [US4] Integration test: a detected inefficiency surfaces an opportunity with a recommended action and priority, an AI recommendation stays advisory-only with zero effect until approved, an approved action's execution tracks the measured business impact and reports it, opportunities across multiple areas support executive prioritization across all 10 — all 4 acceptance scenarios in `backend/tests/integration/us4-revenue-optimization.integration.test.ts`

**Checkpoint**: Where the platform converts intelligence into revenue outcomes is independently functional.

---

## Phase 7: User Story 5 — Revenue Risk Management Across 12 Risk Categories Through an 8-Step Workflow (Priority: P2)

**Independent Test**: Inject one monitored risk signal, confirm the system creates a Revenue Risk Record classified into one of the 12 risk categories, and walk that record through all 8 workflow steps to Closure with a complete audit trail.

- [ ] T056 [US5] 12 Risk Categories, wired to T010 and T026's `040`/`047`-consumption note, acceptance scenario 1 (FR-040)
- [ ] T057 [US5] 10-signal continuous risk monitoring, wired to acceptance scenario 1 (FR-041)
- [ ] T058 [US5] 8-step Risk Workflow (Detection→Closure), wired to acceptance scenarios 2 and 3 (FR-042)
- [ ] T059 [US5] AI Risk Intelligence (Revenue Risk Scores, Root Cause Analysis, Mitigation Recommendations, Risk Forecasts, Executive Alerts, Business Continuity Recommendations), wired to acceptance scenario 2 (FR-043)
- [ ] T060 [P] [US5] Revenue Risk Workflow UI
- [ ] T061 [US5] Integration test: a threshold-crossing signal creates a classified Risk Record with an AI Risk Score, a risk advancing through Assessment/Impact Analysis attaches AI Root Cause Analysis and routes to Executive Review, an executive-reviewed risk supports Mitigation Planning through Action Execution/Continuous Monitoring to Closure, any state change is captured with rationale in audit history — all 4 acceptance scenarios in `backend/tests/integration/us5-revenue-risk-management.integration.test.ts`

**Checkpoint**: The mechanism protecting already-planned and already-forecast revenue is independently functional.

---

## Phase 8: User Story 6 — AI Revenue Copilot Drafting Board-Ready Briefings Under Governance (Priority: P2)

**Independent Test**: Issue one natural-language request to the Copilot, confirm it produces a draft summary/forecast narrative with confidence scores and explainable rationale, and confirm the draft cannot be distributed or acted upon until it passes Human Approval.

- [ ] T062 [US6] AI Revenue Copilot enterprise advisor across 5 functional user groups, wired to T011 (FR-044)
- [ ] T063 [US6] 10 Copilot capability types (Natural Language Conversations, Revenue Analysis, Forecast Interpretation, Pipeline Reviews, Executive Summaries, Pricing Guidance, etc.) (FR-045)
- [ ] T064 [US6] 8-capability automatic drafting (summaries, briefings, business reviews, forecasting summaries, strategic priorities, trend explanations, activity prioritization, board-ready insights) as drafts requiring human review, never autonomously distributed, wired to acceptance scenarios 1 and 2 (FR-046)
- [ ] T065 [US6] 8-control Enterprise AI Governance enforcement (approval workflows, explainable AI, confidence scores, prompt logging, privacy, security, audit history, usage analytics), wired to acceptance scenario 3 (FR-047)
- [ ] T066 [US6] Deterministic non-AI fallback for Copilot-dependent workflows, wired to acceptance scenario 4 (FR-048)
- [ ] T067 [P] [US6] AI Revenue Copilot Session UI
- [ ] T068 [US6] Integration test: a natural-language request returns an explainable answer with supporting data and confidence, a drafted briefing/review/summary is held for Human Approval before distribution and never auto-published, every interaction is captured in AI Audit History and Usage Analytics, AI unavailability falls back to a deterministic non-AI report rather than blocking executive reporting — all 4 acceptance scenarios in `backend/tests/integration/us6-ai-revenue-copilot.integration.test.ts`

**Checkpoint**: The productivity multiplier layered on top of every other RevOps capability is independently functional.

---

## Phase 9: User Story 7 — Immutable Audit Records on Pricing, Forecast, and AI-Recommendation Changes (Priority: P3)

**Independent Test**: Make one pricing change and one AI-recommendation approval, then confirm both appear as separate, immutable, timestamped, attributable audit entries that cannot be edited or deleted, and that a later configuration change does not retroactively alter the earlier entries.

- [ ] T069 [US7] Governance Framework across 10 components (Revenue Policies, Commercial Approval Matrix, Financial/Data/Security/Risk/AI Governance, Compliance Monitoring, Internal Controls, Audit Management), wired to T012 (FR-060)
- [ ] T070 [US7] 7-framework regulatory/organizational compliance support with region-configurable rules (FR-061)
- [ ] T071 [US7] Immutable audit records across 10 categories with zero retroactive alteration after later configuration changes, wired to T031's contract test, acceptance scenarios 1, 3, and 4 (FR-062)
- [ ] T072 [US7] AI Governance enforcement (8 controls) across all RevOps AI features, wired to acceptance scenario 2 (FR-063)
- [ ] T073 [US7] Encryption at rest/in transit + RBAC/MFA/SSO throughout the platform (FR-064)
- [ ] T074 [US7] Enterprise-scale (millions of records) support + independent operational/analytics/AI workloads + multi-region/multi-language/multi-currency/multi-tenant/high-availability deployment (FR-065)
- [ ] T075 [P] [US7] Governance & Audit Trail UI
- [ ] T076 [US7] Integration test: a pricing change creates an immutable audit entry with prior value/new value/actor/timestamp, an AI-recommendation approval or rejection links the original output (with confidence score) to the human decision and actor, a later configuration change leaves existing finalized audit records unchanged, a compliance reviewer retrieves all 10 audited categories with RBAC applied — all 4 acceptance scenarios in `backend/tests/integration/us7-immutable-audit-records.integration.test.ts`

**Checkpoint**: The cross-cutting compliance requirement mandatory for go-live is independently functional.

---

## Phase 10: Revenue Pipeline Management, Revenue Performance Management, Revenue Operations Management remainder (supports FR-016–FR-019, FR-020–FR-023, FR-024–FR-026; cross-cutting, no single owning story)

- [ ] T077 Configurable 9-stage pipeline (Lead Identified→Revenue Recognition), wired to T007 and T025's `045`-reuse note (FR-016)
- [ ] T078 10-metric pipeline monitoring (Pipeline Value, Weighted Pipeline, Coverage Ratio, Win Rate, etc.) (FR-017)
- [ ] T079 7-capability pipeline automation (stalled-opportunity ID, next-action recommendation, notification, escalation, follow-up, close-probability prediction, forecast update) (FR-018)
- [ ] T080 AI Pipeline Intelligence (Risk Analysis, Deal Prioritization, Revenue Probability, Sales Recommendations, Health Scores, Commercial Forecasting) remaining advisory (FR-019)
- [ ] T081 12-metric Performance Metrics monitoring, wired to T013 (FR-020)
- [ ] T082 8-scope configurable Performance Scorecards (FR-021)
- [ ] T083 6-capability revenue-leader review tools (KPI review, historical comparison, benchmarking, bottleneck ID, corrective-action approval, initiative monitoring) (FR-022)
- [ ] T084 AI Performance Intelligence (6 outputs) (FR-023)
- [ ] T085 10-component Revenue Workflow standardization/governance across Sales/Marketing/CS/Finance/Partnerships, wired to T014 (FR-024)
- [ ] T086 8-metric operations-efficiency monitoring (FR-025)
- [ ] T087 AI Operational Intelligence (6 outputs) remaining advisory (FR-026)
- [ ] T088 [P] Pipeline/Performance/Operations Dashboards UI

---

## Phase 11: Revenue Analytics & Metrics, Executive Revenue Intelligence/Dashboards/Reporting remainder (supports FR-032–FR-035, FR-049–FR-054; cross-cutting, no single owning story)

- [ ] T089 10 Analytics domains support (Sales, Marketing, Customer, Subscription, Product, Partner, Geographic, Operational, Financial, Executive) (FR-032)
- [ ] T090 12 Revenue KPI monitoring (Total Revenue, ARR, MRR, Growth, ARPU, GRR, NRR, CLV, CAC, Revenue per Employee, Expansion Revenue) (FR-033)
- [ ] T091 8-type analysis capability (Trend, Cohort, Funnel, Comparative, Benchmarking, Root Cause, Predictive, Prescriptive) (FR-034)
- [ ] T092 AI Analytics Intelligence (6 outputs) remaining transparent and auditable (FR-035)
- [ ] T093 Revenue Intelligence Dashboard + Executive Revenue Dashboard (13 elements), wired to T015 (FR-049)
- [ ] T094 Executive KPI Dashboard (13 elements) (FR-050)
- [ ] T095 10 Executive Visualization Component types with configurable filters, drill-down, real-time updates (FR-051)
- [ ] T096 8-capability executive review/comparison/export tools (FR-052)
- [ ] T097 AI Executive Intelligence (8 outputs) transparent/configurable/explainable/auditable (FR-053)
- [ ] T098 13 configurable Executive Report types with scheduling, PDF/Excel export, drill-down, historical comparisons, benchmarking, predictive forecasting, RBAC, retention (FR-054)
- [ ] T099 [P] Revenue Analytics & Executive Intelligence Dashboards UI

---

## Phase 12: Revenue Operations Portal & Collaboration Workspace remainder (supports FR-055–FR-059; cross-cutting, no single owning story)

- [ ] T100 Unified Revenue Operations Portal (13 modules) across 7 functional groups, wired to T028's `003`-reuse note (FR-055)
- [ ] T101 Portal security (RBAC, MFA, SSO, Session Management, Device Management, API Security, Audit Logging, Encryption in Transit/at Rest, Security Notifications) (FR-056)
- [ ] T102 Revenue Collaboration Workspace (Shared Workspaces, Tasks, Discussion Threads, Activity Timeline, File Sharing, Notes, Meeting Scheduling, Action Items, Executive Approvals, Workflow Notifications) across 8 team types, wired to T014 (FR-057)
- [ ] T103 7 structured meeting types (Weekly/Monthly Reviews, QBRs, Executive Revenue Reviews, Strategic Planning Meetings, Forecast Review Sessions, Risk Reviews) with full record-keeping (FR-058)
- [ ] T104 AI Collaboration Intelligence (Meeting Agendas, Discussion Summaries, Outstanding Action Items, Priority Opportunities, Coordination Suggestions, Effectiveness Improvements) (FR-059)
- [ ] T105 [P] Revenue Operations Portal & Collaboration Workspace UI

---

## Phase 13: Polish — Final Validation

- [ ] T106 Resolve and document the 12 preserved NEEDS CLARIFICATION items from plan.md §6 not already closed by `research.md`
- [ ] T107 Final audit: cross-check every FR-001–FR-065 against an implementation or validation task; re-verify the `009`, `045`, `047`/`040`, `008`, and `003` reuse decisions are respected
- [ ] T108 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `009`'s Financial Ledger, `045`'s Opportunity/Pipeline, `047`'s Renewal/Expansion, and `040`'s Churn Prediction Engine, and produces the entity/lifecycle/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US3)**: US1 (Revenue 360° Workspace) is the foundational unification layer every other capability reads from or writes into and must land first; US2 (Cascading Planning) and US3 (Forecasting) are independent of each other and can build in parallel once US1 is complete.
- **P2 stories (US4, US5, US6)**: US4 (Optimization) and US5 (Risk Management) both depend on US3's forecast data and Foundational's `047`/`040` consumption notes; US6 (AI Copilot) is a productivity layer over US2–US5 and should land after at least Planning and Forecasting exist to summarize.
- **P3 story (US7)** depends on every other capability already producing events to audit, and is correctly sequenced last despite being mandatory for go-live.
- **Phase 10 (Pipeline/Performance/Operations-Management remainder)** depends on Foundational and US3; should land alongside US4.
- **Phase 11 (Analytics/Executive-Intelligence remainder)** depends on Foundational and US5; should land alongside US6.
- **Phase 12 (Portal/Collaboration-Workspace remainder)** depends on Foundational and US6; should land alongside US7.
- **Polish (Phase 13)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, unification principles, 13-stage lifecycle, 12-phase model, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (revenue-360-single-consolidated-view, ai-output-zero-effect-without-human-approval, immutable-audit-record-survives-later-config-change) pass → US1 (Revenue 360° Workspace) → **STOP and VALIDATE** the unification layer is sound → US2 (Cascading Planning) + US3 (Forecasting) in parallel → **STOP and VALIDATE** every AI planning/forecast output carries a confidence score and stays advisory → US4 (Optimization) + US5 (Risk Management) + Phase 10 (pipeline/performance/operations remainder) → US6 (AI Copilot) + Phase 11 (analytics/executive-intelligence remainder) → US7 (Immutable Audit/Governance) + Phase 12 (portal/collaboration remainder) → Polish.
