---
description: "Task list for Feature 045 — Enterprise Sales Management & Revenue Intelligence (RevOS)"
---

# Tasks: Enterprise Sales Management & Revenue Intelligence (RevOS)

**Input**: Design documents from `/specs/045-enterprise-sales-revenue-intelligence/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 013, 024, 016, and 009, and its extension of the pre-existing 013/024 Lead Score scale collision), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC reused via `016`). This feature also assumes `013`'s base Lead/Contact/Opportunity/Pipeline Stage entities and `024`'s lead-stage AI Predictive Scoring exist as consumption points.

**Tests**: Included throughout — Revenue Lifecycle zero-gap traceability, AI-recommendation zero-autonomous-mutation, and territory-rebalance-requires-prior-approval each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-003, and SC-006.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus three supplementary cross-cutting phases for FR groups not owned by any single prioritized story (lead capture/enrichment/assignment/nurturing/conversion remainder; opportunity-lifecycle/forecasting/collaboration/pipeline-basics/forecasting-platform/activity-management remainder; sales-performance/pipeline-intelligence/account-contact/revenue-intelligence remainder).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC reused via `016`), and that `013`'s base Lead/Contact/Opportunity/Pipeline Stage entities and `024`'s lead-stage AI Predictive Scoring exist as consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: cross-framework qualification precedence, AI-discount approval-threshold escalation rule, the 013/024/045 three-way Lead Score reconciliation (plan.md §2), territory-rebalance ownership-dispute resolution, stalled-deal flag dismissal/re-trigger behavior, strategic-account demotion approval symmetry, exit-criteria-document uploader-role validation, AI-churn-risk-vs-CSM-health-score conflict, AI-assignment-vs-workload-balance precedence, lead-score-vs-opportunity-quality-score carry-forward
- [ ] T003 [P] Add `backend/src/modules/revos/{revenue-lifecycle-operating-model,lead-capture-enrichment,lead-qualification-scoring,lead-assignment-nurturing-conversion,opportunity-workspace,opportunity-qualification-forecasting,opportunity-collaboration-intelligence,deal-commercial-workflow,pipeline-management-health,sales-forecasting,sales-activity-management,territory-management,sales-performance-coaching,pipeline-intelligence-dashboard,account-contact-management,strategic-account-management,revenue-intelligence-analytics,sales-governance-ai-guardrails}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Lead` entity in `backend/src/modules/revos/lead-capture-enrichment/lead.entity.ts`
- [ ] T005 [P] Define the `Opportunity` entity in `backend/src/modules/revos/opportunity-workspace/opportunity.entity.ts`
- [ ] T006 [P] Define the `Pipeline` entity in `backend/src/modules/revos/pipeline-management-health/pipeline.entity.ts`
- [ ] T007 [P] Define the `Pipeline Stage` entity in `backend/src/modules/revos/opportunity-qualification-forecasting/pipeline-stage.entity.ts`
- [ ] T008 [P] Define the `Deal` entity in `backend/src/modules/revos/deal-commercial-workflow/deal.entity.ts`
- [ ] T009 [P] Define the `Territory` entity in `backend/src/modules/revos/territory-management/territory.entity.ts`
- [ ] T010 [P] Define the `Account` entity in `backend/src/modules/revos/account-contact-management/account.entity.ts`
- [ ] T011 [P] Define the `Contact` entity in `backend/src/modules/revos/account-contact-management/contact.entity.ts`
- [ ] T012 [P] Define the `Strategic Account Plan` entity in `backend/src/modules/revos/strategic-account-management/strategic-account-plan.entity.ts`
- [ ] T013 [P] Define the `EBR/QBR Record` entity in `backend/src/modules/revos/strategic-account-management/ebr-qbr-record.entity.ts`
- [ ] T014 [P] Define the `Sales Activity` entity in `backend/src/modules/revos/sales-activity-management/sales-activity.entity.ts`
- [ ] T015 [P] Define the `Revenue Intelligence Metric` entity in `backend/src/modules/revos/revenue-intelligence-analytics/revenue-intelligence-metric.entity.ts`
- [ ] T016 [P] Define the `AI Recommendation` entity in `backend/src/modules/revos/sales-governance-ai-guardrails/ai-recommendation.entity.ts`
- [ ] T017 [P] Define the `Governance Review Record` entity in `backend/src/modules/revos/sales-governance-ai-guardrails/governance-review-record.entity.ts`
- [ ] T018 RevOS integration of marketing/sales/CS/finance/AI/executive reporting supporting millions of leads/opportunities/customers/transactions (FR-001)
- [ ] T019 16-phase Enterprise Revenue Operating Model (Lead Generation→Revenue Intelligence & Continuous Optimization) with per-phase workflows/approvals/automation/KPIs/AI/dashboards/reporting (FR-003)
- [ ] T020 Revenue-opportunity intake from 12 named channels (FR-004)
- [ ] T021 Sales Data Collection (9 field groups) (FR-005)
- [ ] T022 AI Revenue Intelligence outputs (8 types) (FR-006)
- [ ] T023 AI Sales Optimization outputs (7 types) (FR-007)
- [ ] T024 7 executive dashboards (Revenue, Pipeline, Opportunity, Account, Forecast, AI Revenue Summary, Sales Performance) (FR-008)
- [ ] T025 Prohibited-action guardrails: no ERP/accounting replacement, no automatic contract approval, no automatic financial settlement, no legal-review replacement, no overriding enterprise approval workflows, no payment-gateway replacement (FR-009)
- [ ] T026 Enterprise sales principles enforcement (customer-first selling, data-driven decisions, AI-assisted-with-human-final-authority, cross-department visibility, revenue accountability) (FR-010)
- [ ] T027 Note: base Lead/Contact/Opportunity/Pipeline Stage entity ownership, capture, duplicate-detection remain `013`'s; this feature is the RevOS layer built on top (per plan.md §1)
- [ ] T028 Note: `045`'s Platinum–Cold lead tiering must be computed from whichever score `013`/`024` eventually reconcile to, not a fourth independent scoring engine — extends the open 013/024 scale collision (per plan.md §2)
- [ ] T029 Note: lead-stage AI Predictive Scoring (FR-025) consumes `024`'s existing advisory AI Predictive Scoring output rather than rebuilding it; `045`'s new AI ground is Opportunity/Deal/Territory/Account/Revenue level (per plan.md §3)
- [ ] T030 Note: Sales Governance Framework roles configure `016`'s layered RBAC model; Deal currency/tax fields reference, not redefine, `009`'s tax/currency architecture (per plan.md §5)
- [ ] T031 Contract test: for any customer relationship, an authorized user can trace its complete path through all 15 Revenue Lifecycle stages from a single view with zero gaps in stage-transition history, in `backend/tests/contract/revenue-lifecycle-zero-gap-traceability.contract.test.ts` (FR-002, SC-001)
- [ ] T032 Contract test: zero AI-recommended discount/margin/territory-rebalance/enterprise-data-affecting output changes underlying entity state without a prior recorded human-approval audit log entry, in `backend/tests/contract/ai-recommendation-zero-autonomous-mutation.contract.test.ts` (FR-124, SC-003)
- [ ] T033 Contract test: 100% of executed territory rebalances have a recorded prior approval step and a before/after account-assignment audit trail, in `backend/tests/contract/territory-rebalance-requires-prior-approval.contract.test.ts` (FR-086, SC-006)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Tracing a Revenue Opportunity Through the 15-Stage Revenue Lifecycle (Priority: P1) 🎯 MVP

**Independent Test**: Take a single lead from initial capture through conversion to a customer account and confirm the system records and displays its position at every one of the 15 lifecycle stages, with a complete, queryable history of every transition.

- [ ] T034 [US1] 15-stage lifecycle definition (Anonymous Visitor→Advocacy) with configurable workflows/approvals/KPIs/automation/AI recommendations per stage, wired to T004/T005, acceptance scenario 1 (FR-002 part 1)
- [ ] T035 [US1] SQL-to-Opportunity linkage preserving full stage history rather than starting a disconnected new record, wired to acceptance scenario 2 (FR-002 part 2)
- [ ] T036 [US1] Closed-Won-to-Onboarding→Expansion→Renewal→Advocacy transition keeping the same account thread visible end-to-end, wired to acceptance scenario 3 (FR-002 part 3)
- [ ] T037 [US1] Stage-specific approval/workflow/automation rule enforcement before a transition is finalized, wired to acceptance scenario 4 (FR-002 part 4)
- [ ] T038 [P] [US1] Revenue Lifecycle view UI
- [ ] T039 [US1] Integration test: a Visitor-to-Lead transition is recorded with timestamp and source, an SQL-to-Opportunity link preserves stage history, a Closed-Won opportunity continues into Onboarding/Expansion/Renewal/Advocacy on the same thread, a configured stage rule is enforced before a transition — all 4 acceptance scenarios in `backend/tests/integration/us1-revenue-lifecycle.integration.test.ts`

**Checkpoint**: The organizing spine every other RevOS capability is a lens on is independently functional.

---

## Phase 4: User Story 2 — Multi-Framework Lead Qualification With Platinum-to-Cold Scoring (Priority: P1)

**Independent Test**: Configure one qualification framework and one set of scoring factors, feed a lead through tracked engagement events, and confirm the system produces both a qualification outcome and a score tier with a visible AI Confidence Score.

- [ ] T040 [US2] Configurable qualification frameworks (BANT, MEDDICC, CHAMP, GPCT, custom), wired to T004, acceptance scenario 1 (FR-019)
- [ ] T041 [US2] 11-criteria qualification evaluation (FR-020)
- [ ] T042 [US2] 6-outcome qualification classification (MQL, SAL, SQL, Enterprise Qualified, Nurture Required, Disqualified), wired to acceptance scenario 1 (FR-021)
- [ ] T043 [US2] AI qualification-status recommendation, buying-signal detection, and intent prediction with a human-review requirement, wired to T016 (FR-022)
- [ ] T044 [US2] 13-factor lead score computation, wired to acceptance scenario 2 (FR-023)
- [ ] T045 [US2] 5-tier scoring classification (Platinum, Gold, Silver, Bronze, Cold) with configurable thresholds, consuming the reconciled `013`/`024` score per T028's note, wired to acceptance scenario 2 (FR-024)
- [ ] T046 [US2] AI predictive scoring (Purchase Probability, Conversion Probability, Lifetime Value, Revenue Potential, Churn Risk, Expansion Potential) with confidence and explanation, reusing `024`'s lead-stage AI Predictive Scoring per T029's note, wired to acceptance scenario 3 (FR-025)
- [ ] T047 [US2] Scoring Dashboard (Lead Score Distribution, Top Leads, AI Lead Rankings, High-Priority Accounts, Lead Quality Trends, Conversion Forecasts), wired to acceptance scenario 4 (FR-026)
- [ ] T048 [P] [US2] Lead Qualification & Scoring UI
- [ ] T049 [US2] Integration test: BANT-configured evaluation of Budget/Authority/Need/Timeline assigns an outcome, engagement accumulation classifies into the correct score tier, AI predictive scores show confidence and never silently reclassify or disqualify, the Scoring Dashboard filtered by AI Rankings shows distribution/top leads/priority accounts/forecasts — all 4 acceptance scenarios in `backend/tests/integration/us2-lead-qualification-scoring.integration.test.ts`

**Checkpoint**: The mechanism making lead volume actionable is independently functional.

---

## Phase 5: User Story 3 — Working an Enterprise Opportunity Through the Unified Opportunity Workspace (Priority: P1)

**Independent Test**: Create an opportunity, attach competitors and documents, run an AI qualification pass against a configured framework, and confirm the workspace surfaces Health Score, AI Confidence Score, Risk Level, Competitors, Documents, and Activity Timeline in one unified view.

- [ ] T050 [US3] Centralized Opportunity Workspace with cross-functional collaboration visibility from qualification through contract execution/onboarding/expansion/long-term success, wired to T005 (FR-038)
- [ ] T051 [US3] 13 configurable opportunity categories, wired to acceptance scenario 1 (FR-039)
- [ ] T052 [US3] Opportunity full field set (21 fields), wired to acceptance scenario 1 (FR-040)
- [ ] T053 [US3] Unified opportunity workspace content (Customer Profile, Communication History, Meeting Notes, Proposal Documents, Contract Versions, Demos, AI Recommendations, Sales Tasks, Internal Collaboration, Approval History, Analytics) (FR-041)
- [ ] T054 [US3] 7-framework opportunity qualification (MEDDICC, MEDDPICC, BANT, CHAMP, SPICED, SPIN, custom), wired to acceptance scenario 2 (FR-042)
- [ ] T055 [US3] 12-criteria opportunity qualification evaluation (FR-043)
- [ ] T056 [US3] 6-outcome opportunity classification with configurable thresholds; preserves the cross-framework-conflict NEEDS CLARIFICATION rather than inventing precedence, wired to acceptance scenario 2 (FR-044)
- [ ] T057 [US3] AI opportunity qualification intelligence (Opportunity Quality Score, Buying Intent Prediction, Stakeholder Influence Analysis, Competitive Risk Assessment, Revenue Probability, Recommended Actions) with explainability, wired to T016 (FR-045)
- [ ] T058 [P] [US3] Opportunity Workspace UI
- [ ] T059 [US3] Integration test: an opened opportunity displays the full single-view field set, a MEDDPICC-configured evaluation classifies with explainable rationale, a stakeholder collaboration event is recorded with timestamp/user/version, an AI discount recommendation is shown as advisory only without altering pricing — all 4 acceptance scenarios in `backend/tests/integration/us3-opportunity-workspace.integration.test.ts`

**Checkpoint**: The single highest-touch surface in the enterprise sales motion is independently functional.

---

## Phase 6: User Story 4 — Detecting and Rescuing Stalled Deals via Pipeline Health Scoring (Priority: P1)

**Independent Test**: Seed a pipeline with an opportunity that has had no activity for a configurable period, run the AI risk-detection pass, and confirm the opportunity is flagged as a Stalled Opportunity on the Health Monitoring Dashboard with the pipeline's overall health recalculated and an executive alert raised.

- [ ] T060 [US4] 12-metric pipeline health evaluation, wired to T006, acceptance scenario 1 (FR-068)
- [ ] T061 [US4] 6-tier health classification (Excellent, Healthy, Stable, Warning, At Risk, Critical) with configurable thresholds, wired to acceptance scenario 1 (FR-069)
- [ ] T062 [US4] AI risk-signal identification (Stalled Opportunities, Missing Activities, Low Engagement, High-Risk Deals, Pipeline Imbalance, Revenue Gaps, Forecast Risks, Customer Inactivity) with reviewable/dismissible flags and recorded justification, wired to T016, acceptance scenarios 2 and 4 (FR-070)
- [ ] T063 [US4] Health Monitoring Dashboard (Overall Health, Risk Heatmap, Opportunity Aging, Revenue Gap Analysis, Sales Team Performance, Pipeline Movement, Executive Alerts, AI Recommendations), wired to acceptance scenario 3 (FR-071)
- [ ] T064 [P] [US4] Pipeline Health Dashboard UI
- [ ] T065 [US4] Integration test: pipeline metrics classify into the correct health tier, missing activity and low engagement surfaces a stalled deal with the underlying signal shown, the Health Monitoring Dashboard shows overall health/gap analysis/team performance/recommendations, an AI-flagged stall can be justified and cleared but never auto-closes/reassigns/devalues — all 4 acceptance scenarios in `backend/tests/integration/us4-pipeline-health-scoring.integration.test.ts`

**Checkpoint**: The continuous, AI-assisted risk detection protecting the quarter's forecast is independently functional.

---

## Phase 7: User Story 5 — Commercial Deal Workflow With AI Margin/Discount Analysis Requiring Approval (Priority: P2)

**Independent Test**: Generate an AI discount/margin recommendation on a deal in "Pricing Review" status and confirm the recommendation is visible with rationale, the deal's pricing/discount fields remain unchanged until a designated approver acts, and every state transition is captured in an immutable audit log.

- [ ] T066 [US5] Commercial-aspect management from proposal creation through contract execution and revenue realization with structured governance, wired to T008 (FR-059)
- [ ] T067 [US5] Deal full field set (14 fields), wired to acceptance scenario 1 (FR-060)
- [ ] T068 [US5] 10-step deal workflow (Draft→Revenue Recognition) with full auditability and no-skip exit-criteria enforcement, wired to acceptance scenario 3 (FR-061)
- [ ] T069 [US5] AI Deal Intelligence (Deal Risk Analysis, Discount Recommendations, Margin Analysis, Approval Recommendations, Revenue Impact, Renewal Probability, Upsell Opportunities) as advisory-only, with a hard block on pricing/discount/margin changes outside the Internal Approval workflow, wired to T016, acceptance scenarios 1, 2, and 4 (FR-062)
- [ ] T070 [US5] 8 deal analytics metrics (FR-063)
- [ ] T071 [P] [US5] Deal Workflow UI
- [ ] T072 [US5] Integration test: an AI recommendation is attached as advisory content and pricing remains unchanged, a threshold-exceeding discount routes through Internal Approval and records the approver, a stage transition is fully audited and cannot skip without exit criteria, Closed Won locks the final commercial terms as historical record — all 4 acceptance scenarios in `backend/tests/integration/us5-deal-commercial-workflow.integration.test.ts`

**Checkpoint**: The clearest expression of Constitution Article II in this chapter, with direct P&L consequences, is independently functional.

---

## Phase 8: User Story 6 — AI-Assisted Territory Rebalancing With Human Approval (Priority: P2)

**Independent Test**: Run AI Territory Intelligence against underperforming and overloaded territories, confirm it produces a Territory Rebalancing recommendation with supporting performance data, and confirm no account/lead/opportunity is reassigned until an authorized manager approves.

- [ ] T073 [US6] Efficient allocation of customers/leads/opportunities/accounts across sales teams, wired to T009 (FR-082)
- [ ] T074 [US6] 8 configurable territory models (Geographic, Industry, Product, Enterprise Account, Partner, Language-Based, Strategic, Hybrid), wired to acceptance scenario 3 (FR-083)
- [ ] T075 [US6] 9-factor territory assignment rules, wired to acceptance scenario 3 (FR-084)
- [ ] T076 [US6] 8 monitored territory performance metrics, wired to acceptance scenarios 1 and 4 (FR-085)
- [ ] T077 [US6] AI territory intelligence (Rebalancing, Capacity Adjustments, Market Expansion, Resource Allocation, High-Growth Regions, Optimization Strategies) with a hard block on reassignment without human approval, wired to T016, T033's contract test, acceptance scenarios 1 and 2 (FR-086)
- [ ] T078 [P] [US6] Territory Management UI
- [ ] T079 [US6] Integration test: overloaded-vs-underutilized territories produce a rebalancing recommendation citing specific metrics, a Sales Director can approve/modify/reject before any account moves, the territory model and assignment rules determine the candidate territory, an approved rebalance is recorded as an auditable event and dashboards update — all 4 acceptance scenarios in `backend/tests/integration/us6-territory-rebalancing.integration.test.ts`

**Checkpoint**: The "AI recommends, human approves" guardrail proven at organizational scale is independently functional.

---

## Phase 9: User Story 7 — Running Executive Business Reviews for Strategic Accounts (Priority: P2)

**Independent Test**: Qualify an account as Strategic against configured criteria, create its Strategic Account Plan, schedule an EBR, and confirm the meeting's outcomes are documented and tracked against the plan's Success Metrics.

- [ ] T080 [US7] High-value-customer management via structured planning, executive engagement, and long-term growth strategies, wired to T012 (FR-104)
- [ ] T081 [US7] 8-factor strategic-account qualification with configurable thresholds, wired to acceptance scenario 1 (FR-105)
- [ ] T082 [US7] Strategic Account Plan full field set (Executive Summary, Business Objectives, Customer Goals, Revenue Targets, Expansion Strategy, Renewal Strategy, Risk Assessment, Stakeholder Map, Action Plan, Success Metrics), wired to acceptance scenario 2 (FR-106)
- [ ] T083 [US7] EBR/QBR/Strategic Planning/Executive Workshop/Innovation Session/Partnership Review support with documented and tracked outcomes, wired to T013, acceptance scenarios 2 and 3 (FR-107)
- [ ] T084 [US7] AI strategic intelligence (Expansion Opportunities, Executive Engagement Plans, Revenue Growth Strategies, Partnership Opportunities, Competitive Positioning, Risk Mitigation Actions) remaining advisory, wired to T016, acceptance scenario 4 (FR-108)
- [ ] T085 [P] [US7] Strategic Account Plan & EBR/QBR Tracker UI
- [ ] T086 [US7] Integration test: revenue/growth exceeding threshold offers strategic qualification and plan creation, an EBR is scheduled and linked to the account record, EBR outcomes are documented and tracked against plan metrics visible to the Executive Sponsor and CS Owner, an AI recommendation requires human action to be incorporated into the plan — all 4 acceptance scenarios in `backend/tests/integration/us7-strategic-account-ebr.integration.test.ts`

**Checkpoint**: Where the largest deals in the book of business are protected is independently functional.

---

## Phase 10: User Story 8 — Enforcing "AI Recommends, Human Approves" Across Every Revenue-Impacting AI Output (Priority: P1)

**Independent Test**: Trigger AI outputs across at least three different subsystems (lead scoring, deal discount recommendation, territory rebalancing) and confirm in each case the AI output is a distinct, timestamped, explainable recommendation object, no underlying entity changes state as a side effect, and an audit log entry exists showing which human approved or rejected it before any change.

- [ ] T087 [US8] Sales Governance Framework enforcement across execution/approvals/pricing/forecasting/engagement/reporting, wired to T017 (FR-116)
- [ ] T088 [US8] 10 governance principles enforcement (Customer-Centric Selling, Ethical Selling, Data Integrity, Revenue Accountability, Compliance, Transparency, Auditability, Security, Continuous Improvement, Responsible AI Usage) (FR-117)
- [ ] T089 [US8] 10 configurable governance roles, wired to T030's `016`-reuse note (FR-118)
- [ ] T090 [US8] 10 governance review activities (Pipeline/Forecast/Deal/Pricing/Strategic Account/Performance Reviews, Revenue Audits, AI Governance Reviews, QBRs, Annual Sales Planning), wired to T017 (FR-119)
- [ ] T091 [US8] Governance Dashboard (Compliance Score, Policy Compliance, Forecast Accuracy, Revenue Risks, Open Audit Findings, Pricing Exceptions, Executive Action Items, AI Governance Alerts) (FR-120)
- [ ] T092 [US8] Lead-qualification/opportunity-lifecycle/pipeline-stage/activity-linkage traceability guarantees (FR-121)
- [ ] T093 [US8] Forecast-model/revenue-intelligence-aggregation/analytics/version-history guarantees (FR-122)
- [ ] T094 [US8] Account-profile/contact-mapping/strategic-plan/health-score-automation guarantees (FR-123)
- [ ] T095 [US8] Cross-module AI-confidence-score, transparency/explainability/reviewability, and hard-block-on-unapproved-mutation enforcement, wired to T016 and T032's contract test, all 4 acceptance scenarios (FR-124)
- [ ] T096 [US8] Immutable audit logs for every commercial transaction, RBAC-governed revenue-data access, encryption at rest/in transit (FR-125)
- [ ] T097 [US8] Enterprise-scale (millions of records) responsiveness, independent AI/analytics processing, and future-extensibility architecture (FR-126)
- [ ] T098 [P] [US8] AI Recommendation Audit & Governance Dashboard UI
- [ ] T099 [US8] Integration test: any AI recommendation is persisted as a distinct, timestamped, explainable object separate from the entity it references, an unacted-on recommendation leaves the entity in its prior state, an approved recommendation applies the change and logs the approver and timestamp, AI unavailability falls back to rule-based/manual scoring — all 4 acceptance scenarios in `backend/tests/integration/us8-ai-recommends-human-approves.integration.test.ts`

**Checkpoint**: The cross-cutting guarantee every other user story in this spec depends on holding is independently verified.

---

## Phase 11: Lead capture/enrichment, assignment/nurturing/conversion remainder (supports FR-011–FR-018, FR-027–FR-037; cross-cutting, no single owning story)

- [ ] T100 Centralized lead repository integrated with marketing, CS, AI intelligence, and executive analytics, wired to T004 (FR-011)
- [ ] T101 13 configurable lead categories + admin-definable additional categories (FR-012)
- [ ] T102 Lead full field set (17 fields) (FR-013)
- [ ] T103 12-step lead lifecycle (Captured→Archived) with complete audit history per transition (FR-014)
- [ ] T104 16-source lead capture + configurable additional sources (FR-015)
- [ ] T105 8-check lead validation with flag-for-review rather than silent discard/accept (FR-016)
- [ ] T106 8-source optional lead enrichment with configurable sources (FR-017)
- [ ] T107 8-metric lead capture analytics (FR-018)
- [ ] T108 9-method lead assignment (Round Robin, Geographic, Industry, Product, Enterprise Account, Capacity, Performance, AI Intelligent, Manual), wired to T004 (FR-027)
- [ ] T109 8-factor assignment-rule consideration (FR-028)
- [ ] T110 7-step assignment workflow with full auditability (FR-029)
- [ ] T111 10-channel nurturing + 9 campaign types (FR-030)
- [ ] T112 AI nurturing intelligence (7 recommendation types) remaining configurable (FR-031)
- [ ] T113 6-target lead conversion preserving historical interactions/activities/documents/analytics (FR-032)
- [ ] T114 8-step lead conversion workflow (FR-033)
- [ ] T115 8 conversion analytics metrics (FR-034)
- [ ] T116 Lead Intelligence Dashboard (13 elements) (FR-035)
- [ ] T117 AI lead intelligence (8 output types), explainable/configurable/auditable (FR-036)
- [ ] T118 9 lead-related report types with scheduling, drill-down, PDF/Excel export, RBAC (FR-037)
- [ ] T119 [P] Lead Capture/Enrichment/Assignment/Nurturing UI

---

## Phase 12: Opportunity-lifecycle/forecasting/collaboration remainder, Pipeline-basics, Sales Forecasting Platform, Sales Activity Management (supports FR-046–FR-052, FR-053–FR-058, FR-064–FR-067, FR-072–FR-076, FR-077–FR-081; cross-cutting, no single owning story)

- [ ] T120 16-stage configurable opportunity lifecycle (Opportunity Created→Renewal), wired to T007 (FR-046)
- [ ] T121 Per-stage gate definition (Required Activities, Mandatory Documents, Responsible Teams, Entry Conditions, Exit Criteria, Approval Requirements, Risk Indicators, KPIs, Automation Rules) with no-advance-without-validation rule (FR-047)
- [ ] T122 8 lifecycle metrics tracking (Stage Duration, Average Time in Stage, Conversion Rate, Velocity, Bottlenecks, Approval Delays, Revenue Progression, Historical Performance) (FR-048)
- [ ] T123 7 configurable forecast categories (Pipeline, Best Case, Most Likely, Commit, Closed, Upside, Risk) (FR-049)
- [ ] T124 10-input forecast calculation (FR-050)
- [ ] T125 9 forecast output calculations (FR-051)
- [ ] T126 AI revenue forecasting (6 capabilities) with confidence and historical justification, wired to T016 (FR-052)
- [ ] T127 10-role opportunity collaboration support, wired to T005 (FR-053)
- [ ] T128 10 collaboration feature types (Shared Notes, Discussions, Mentions, Document Collaboration, Meeting Scheduling, Task Assignment, Approval Requests, Activity Timeline, File Sharing, Decision Logs) (FR-054)
- [ ] T129 Collaboration-event full audit capture (Timestamp, User Info, Change History, Version Control, Access Permissions, Audit Trail) (FR-055)
- [ ] T130 Opportunity Intelligence Dashboard (12 elements) (FR-056)
- [ ] T131 AI opportunity intelligence (8 outputs), transparent/explainable/configurable/auditable (FR-057)
- [ ] T132 10 opportunity-related report types (FR-058)
- [ ] T133 Full pipeline composition/movement/velocity/risk/revenue visibility as operational control center, wired to T006 (FR-064)
- [ ] T134 12 configurable pipeline categories + admin-definable additional (FR-065)
- [ ] T135 Pipeline full field set (13 fields) (FR-066)
- [ ] T136 5-stage pipeline lifecycle (Created→Archived) with version control and full auditability (FR-067)
- [ ] T137 Revenue prediction from 5 data domains + AI models supporting strategic planning/budgeting/hiring/investment, wired to T015 (FR-072)
- [ ] T138 10 forecast types (Monthly, Quarterly, Annual, Territory, Product, Account, Sales Rep, Renewal, Expansion, Scenario) (FR-073)
- [ ] T139 11-input forecast-calculation consideration (FR-074)
- [ ] T140 8 forecast output calculations (FR-075)
- [ ] T141 AI forecast intelligence (6 capabilities) with confidence percentages and historical explanations (FR-076)
- [ ] T142 Customer-facing sales-activity planning/execution/monitoring/optimization linking every interaction to progression, wired to T014 (FR-077)
- [ ] T143 12 activity types (FR-078)
- [ ] T144 Activity full field set (12 fields) (FR-079)
- [ ] T145 6-capability activity automation (reminders, next-action recommendation, overdue detection, escalation, timeline updates, stakeholder notification) (FR-080)
- [ ] T146 8 activity analytics metrics (FR-081)
- [ ] T147 [P] Opportunity Lifecycle/Forecasting/Pipeline/Sales Activity Dashboards UI

---

## Phase 13: Sales Performance/Pipeline Intelligence remainder, Account/Contact Management, Revenue Intelligence & Analytics (supports FR-087–FR-094, FR-095–FR-103, FR-109–FR-115; cross-cutting, no single owning story)

- [ ] T148 Individual/team/organizational sales-performance measurement aligned with enterprise revenue goals (FR-087)
- [ ] T149 12 performance measurement metrics (FR-088)
- [ ] T150 6-scope configurable-KPI performance scorecards (Individual Reps, Sales Teams, Territories, Business Units, Product Lines, Regional Organizations) (FR-089)
- [ ] T151 6-capability manager coaching/review/tracking tools (Coaching Plans, Performance Reviews, Improvement Goals, Learning Progress, Feedback, Skill Development) (FR-090)
- [ ] T152 AI sales coaching (6 recommendation types) remaining advisory (FR-091)
- [ ] T153 Pipeline Intelligence Dashboard (14 elements) (FR-092)
- [ ] T154 AI pipeline intelligence (8 outputs), transparent/explainable/configurable/auditable (FR-093)
- [ ] T155 10 pipeline-related report types (FR-094)
- [ ] T156 Full-relationship customer-account management as central cross-ecosystem repository, wired to T010 (FR-095)
- [ ] T157 12 configurable account categories + admin-definable additional (FR-096)
- [ ] T158 Account full field set (17 fields) (FR-097)
- [ ] T159 Unified account workspace (Contacts, Opportunities, Contracts, Invoices, Support Cases, CS Plans, Community Participation, Learning Progress, AI Insights, Executive Notes, Activity Timeline, Documents, Approval History) (FR-098)
- [ ] T160 Contact management with full communication-history/relationship-mapping/engagement-intelligence, wired to T011 (FR-099)
- [ ] T161 12 contact categories (FR-100)
- [ ] T162 Contact full field set (14 fields) (FR-101)
- [ ] T163 8-element relationship mapping (org hierarchies, reporting structures, stakeholder mapping, decision networks, buying committees, influence relationships, internal champions, executive sponsors) (FR-102)
- [ ] T164 AI contact intelligence (Key Decision Makers, Relationship Risks, Communication Gaps, Buying Signals, Executive Influence, Stakeholder Changes) remaining explainable (FR-103)
- [ ] T165 Unified revenue intelligence layer across operational/commercial/behavioral/financial data, wired to T015 (FR-109)
- [ ] T166 11-source revenue intelligence aggregation (FR-110)
- [ ] T167 12 revenue intelligence metric calculations (ARR, MRR, CLV, CAC, Gross/Net Revenue, Expansion/Renewal/Churn Revenue, Revenue Growth Rate, Average Deal Size, Sales Velocity) (FR-111)
- [ ] T168 AI revenue intelligence (6 capabilities) with confidence scores and supporting evidence (FR-112)
- [ ] T169 10 executive dashboard domains (FR-113)
- [ ] T170 13 revenue KPI measurements (FR-114)
- [ ] T171 8 analytics feature capabilities (Real-Time Dashboards, Historical Trend Analysis, Cohort Analysis, Drill-Down, Comparative Analytics, Scenario Analysis, Predictive Analytics, Executive KPI Monitoring) (FR-115)
- [ ] T172 [P] Sales Performance/Account-Contact/Revenue Intelligence Dashboards UI

---

## Phase 14: Polish — Final Validation

- [ ] T173 Resolve and document the 10 preserved NEEDS CLARIFICATION items from plan.md §6 not already closed by `research.md`, including the extended 013/024/045 Lead Score reconciliation
- [ ] T174 Final audit: cross-check every FR-001–FR-126 against an implementation or validation task; re-verify the `013` base-entity, `024` lead-scoring, `016` RBAC, and `009` currency/tax reuse decisions are respected
- [ ] T175 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `013`'s base Lead/Contact/Opportunity/Pipeline Stage entities and `024`'s lead-stage AI Predictive Scoring, and produces the entity/operating-model/governance infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US3, US4, US8)**: US1 (Revenue Lifecycle) is the organizing spine every other capability is a lens on and must land first; US2 (Lead Qualification/Scoring) and US3 (Opportunity Workspace) are independent of each other and can build in parallel; US4 (Pipeline Health) depends on US3's opportunities existing; US8 (AI Recommends/Human Approves enforcement) is cross-cutting and should be validated continuously alongside US2–US4, though its dedicated integration test lands after at least three AI-touching subsystems exist.
- **P2 stories (US5, US6, US7)**: US5 (Deal Workflow) depends on US3's opportunities reaching a commercial stage; US6 (Territory Rebalancing) depends on US1's lifecycle and leads/opportunities/accounts existing to reassign; US7 (Strategic Account EBR) depends on Account records existing (built alongside Phase 13).
- **Phase 11 (Lead capture/assignment/nurturing/conversion remainder)** depends on Foundational and US2; should land alongside US2.
- **Phase 12 (Opportunity-lifecycle/forecasting/collaboration/pipeline-basics/forecasting-platform/activity remainder)** depends on Foundational, US3, and US4; should land alongside US5.
- **Phase 13 (Sales-performance/pipeline-intelligence/account-contact/revenue-intelligence remainder)** depends on Foundational and US6; should land alongside US7.
- **Polish (Phase 14)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, RevOS integration, 16-phase operating model, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (revenue-lifecycle-zero-gap-traceability, ai-recommendation-zero-autonomous-mutation, territory-rebalance-requires-prior-approval) pass → US1 (Revenue Lifecycle) → **STOP and VALIDATE** the organizing spine is sound → US2 (Lead Qualification/Scoring) + US3 (Opportunity Workspace) in parallel → US4 (Pipeline Health) → **STOP and VALIDATE** every AI-flagged risk remains reviewable/dismissible, never auto-acting → US5 (Deal Workflow) + Phase 12 (opportunity/forecasting/pipeline/activity remainder) → US6 (Territory Rebalancing) + Phase 11 (lead capture/assignment/nurturing remainder) → US7 (Strategic Account EBR) + Phase 13 (performance/account-contact/revenue-intelligence remainder) → US8 (cross-cutting AI-governance validation) → Polish.
