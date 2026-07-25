---
description: "Task list for Feature 044 — Enterprise Customer Experience Operating System (CXOS)"
---

# Tasks: Enterprise Customer Experience Operating System (CXOS)

**Input**: Design documents from `/specs/044-enterprise-cx-journey-success/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 040, 041, 030, 016, 003, 006, and 009), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC reused via `016`). This feature also assumes `040`'s Churn Prediction Engine, `041`'s NLP/sentiment/survey engine, and `030`'s referral execution engine exist as consumption points.

**Tests**: Included throughout — CX Lifecycle stage currency, Playbook human-review gating, and Feedback workflow audit-trail completeness each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-004, and SC-005.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus four supplementary cross-cutting phases for FR groups not owned by any single prioritized story (touchpoint/omnichannel remainder; CS platform core/onboarding/adoption/retention/CS-dashboard remainder; CLM dashboard/reports/engagement/sentiment/experience-analytics remainder; governance/security/scale polish).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC reused via `016`), and that `040`'s Churn Prediction Engine, `041`'s NLP/sentiment/survey engine, and `030`'s referral execution engine exist as consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: the two-health-score CS-queue question (plan.md §1), health-score sub-score floor/cap rule, duplicate-playbook-trigger precedence, VoC-vs-survey signal reconciliation, governance-rejection rollback of in-flight changes, conflicting-journey precedence, mid-flight segment-change handling, multi-category feedback classification, conflicting-AI-next-best-action reconciliation, unresolved-feedback-blocks-Advocate-transition rule, Health Score recalculation-latency SLA, CS-queue time-to-queue SLA
- [ ] T003 [P] Add `backend/src/modules/cxos/{lifecycle-operating-model,journey-mapping-analytics,touchpoint-omnichannel,journey-governance-intelligence,customer-success-health-playbooks,success-plans-onboarding-adoption,retention-cs-dashboard,customer-lifecycle-clm,segmentation-persona,engagement-loyalty,advocacy-referral,voc-feedback-workflow,survey-management,sentiment-experience-analytics,cx-governance}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `CX Lifecycle Stage` entity in `backend/src/modules/cxos/lifecycle-operating-model/cx-lifecycle-stage.entity.ts`
- [ ] T005 [P] Define the `CX Operating Model Phase` entity in `backend/src/modules/cxos/lifecycle-operating-model/cx-operating-model-phase.entity.ts`
- [ ] T006 [P] Define the `Customer Journey` entity in `backend/src/modules/cxos/journey-mapping-analytics/customer-journey.entity.ts`
- [ ] T007 [P] Define the `Journey Map` entity in `backend/src/modules/cxos/journey-mapping-analytics/journey-map.entity.ts`
- [ ] T008 [P] Define the `Journey Stage / Journey Element` entity in `backend/src/modules/cxos/journey-mapping-analytics/journey-stage-element.entity.ts`
- [ ] T009 [P] Define the `Touchpoint` entity in `backend/src/modules/cxos/touchpoint-omnichannel/touchpoint.entity.ts`
- [ ] T010 [P] Define the `Customer Health Score (CX variant)` entity in `backend/src/modules/cxos/customer-success-health-playbooks/cx-health-score.entity.ts`
- [ ] T011 [P] Define the `Success Plan` entity in `backend/src/modules/cxos/success-plans-onboarding-adoption/success-plan.entity.ts`
- [ ] T012 [P] Define the `Success Playbook` entity in `backend/src/modules/cxos/customer-success-health-playbooks/success-playbook.entity.ts`
- [ ] T013 [P] Define the `Customer Success Lifecycle Stage` entity in `backend/src/modules/cxos/retention-cs-dashboard/cs-lifecycle-stage.entity.ts`
- [ ] T014 [P] Define the `Customer Lifecycle Stage (17-stage CLM)` entity in `backend/src/modules/cxos/customer-lifecycle-clm/clm-stage.entity.ts`
- [ ] T015 [P] Define the `Customer Segment` entity in `backend/src/modules/cxos/segmentation-persona/customer-segment.entity.ts`
- [ ] T016 [P] Define the `Customer Persona` entity in `backend/src/modules/cxos/segmentation-persona/customer-persona.entity.ts`
- [ ] T017 [P] Define the `Loyalty Program / Loyalty Benefit` entity in `backend/src/modules/cxos/engagement-loyalty/loyalty-program.entity.ts`
- [ ] T018 [P] Define the `Advocacy Signal / Advocate` entity in `backend/src/modules/cxos/advocacy-referral/advocacy-signal.entity.ts`
- [ ] T019 [P] Define the `Referral` entity in `backend/src/modules/cxos/advocacy-referral/referral.entity.ts`
- [ ] T020 [P] Define the `VoC Data Source` entity in `backend/src/modules/cxos/voc-feedback-workflow/voc-data-source.entity.ts`
- [ ] T021 [P] Define the `Feedback Record` entity in `backend/src/modules/cxos/voc-feedback-workflow/feedback-record.entity.ts`
- [ ] T022 [P] Define the `Survey` entity in `backend/src/modules/cxos/survey-management/survey.entity.ts`
- [ ] T023 [P] Define the `Sentiment Record` entity in `backend/src/modules/cxos/sentiment-experience-analytics/sentiment-record.entity.ts`
- [ ] T024 [P] Define the `CX Governance Record` entity in `backend/src/modules/cxos/cx-governance/cx-governance-record.entity.ts`
- [ ] T025 Continuous CX measurement/analysis/optimization across every stage with a unified relationship view from first touchpoint to advocacy (FR-001)
- [ ] T026 Personalization based on Customer Profile, Membership Level, Product Usage, Learning Progress, Purchase History, Community Activity, Customer Goals, Behavioral Signals (FR-002)
- [ ] T027 Continuous experience improvement using Feedback, Behavioral Analytics, AI Insights, Product Analytics, CS Data (FR-003)
- [ ] T028 Consistent experience delivery across 10 named channels (FR-004)
- [ ] T029 Privacy/governance-compliant customer-data handling + configurable/reviewable final customer-impacting decisions wherever AI assists (FR-005)
- [ ] T030 Full platform scope coverage across the 19 named CXOS capability areas (FR-006)
- [ ] T031 Prohibited-action guardrails: no CRM/Help-Desk replacement, no unapproved automatic communications, no unauthorized account modification, no legal/compliance-review replacement, no external customer-data publication, no privacy-preference override (FR-007)
- [ ] T032 Implement the 5-layer CX architecture (Interaction Sources, Data Collection, Customer Intelligence, Experience Optimization, Executive Intelligence) (FR-008)
- [ ] T033 Implement the 14-phase CX Operating Model (Acquisition→Continuous Experience Improvement) with per-phase KPIs/ownership/automation/AI recommendations/executive reporting, wired to T005 (FR-010)
- [ ] T034 Note: retention strategies and elevated-churn-risk CS-queue routing consume `040`'s canonical Churn Prediction Engine/Health Score rather than a second churn model (per plan.md §1)
- [ ] T035 Note: VoC data ingestion, sentiment/NLP classification, and survey design/distribution consume `041`'s canonical engine rather than rebuilding it (per plan.md §2)
- [ ] T036 Note: Referral link generation, tracking, reward issuance, and fraud detection consume `030`'s canonical referral execution engine rather than a second referral workflow (per plan.md §3)
- [ ] T037 Note: CX Governance roles configure `016`'s layered RBAC model; audit trails reuse `003`'s auth/identity infrastructure and the platform-wide immutable audit log; Loyalty Benefits fulfillment integrates with `006`/`009`'s existing ledger (per plan.md §5)
- [ ] T038 Contract test: 100% of customers with an account record carry a current, correct CX Lifecycle stage at all times, visible on the Customer Health Dashboard, in `backend/tests/contract/cx-lifecycle-stage-always-current.contract.test.ts` (FR-009, SC-001)
- [ ] T039 Contract test: 100% of AI-recommended, auto-triggered Success Playbook actions pass a configurable human review gate before any customer-facing communication is sent, in `backend/tests/contract/playbook-actions-require-human-review-gate.contract.test.ts` (FR-037, SC-004)
- [ ] T040 Contract test: 100% of Feedback Records are traceable end-to-end with an immutable audit log entry for every one of the 10 workflow transitions, in `backend/tests/contract/feedback-workflow-full-audit-trail.contract.test.ts` (FR-079, SC-005)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Customer Progresses Through the 15-Stage CX Lifecycle (Priority: P1) 🎯 MVP

**Independent Test**: Create a test customer record, drive it through registration→trial→purchase→cancellation, and verify at each step the system assigns the correct lifecycle stage, exposes configurable KPIs/automation rules, and the stage is visible on the Customer Health Dashboard.

- [ ] T041 [US1] 15-stage lifecycle progression (Visitor→Archived) with configurable KPIs/automation rules/engagement strategy/success metrics per stage, wired to T004, acceptance scenario 1 (FR-009 part 1)
- [ ] T042 [US1] Purchase-confirmation-driven transition (Trial User→New Customer→Onboarding) per configured stage-entry criteria, wired to acceptance scenario 2 (FR-009 part 2)
- [ ] T043 [US1] Inactivity-threshold Win-Back-stage evaluation flagging rather than silently leaving a customer at "Engaged," wired to acceptance scenario 3 (FR-009 part 3)
- [ ] T044 [US1] No-code stage configuration (KPIs, engagement strategies, success metrics) for authorized CX administrators, wired to acceptance scenario 4 (FR-009 part 4)
- [ ] T045 [P] [US1] CX Lifecycle Dashboard UI
- [ ] T046 [US1] Integration test: a lead-capture submission creates a Lead-stage record with configured KPIs, a confirmed trial purchase transitions New Customer then Onboarding, a crossed inactivity threshold flags Win-Back evaluation, an admin edits stage configuration without a software change — all 4 acceptance scenarios in `backend/tests/integration/us1-cx-lifecycle.integration.test.ts`

**Checkpoint**: The foundational data model every other CXOS capability is built on top of is independently functional.

---

## Phase 4: User Story 2 — CX Team Maps and Analyzes a Customer Journey with AI-Detected Friction Points (Priority: P1)

**Independent Test**: Create one journey map end-to-end, publish it through the journey approval workflow, view it in each of the 8 visualization modes, and confirm Journey Analytics surfaces at least one AI-identified friction point with supporting data.

- [ ] T047 [US2] Unified end-to-end touchpoint connection (measurable, personalized, AI-assisted, continuously optimized), wired to T006 (FR-011)
- [ ] T048 [US2] 14 configurable journey types + admin-definable additional types without software modification, wired to T006 (FR-012)
- [ ] T049 [US2] 9-stage journey lifecycle (Created→Archived) with complete version history and audit records, wired to acceptance scenario 3 (FR-013)
- [ ] T050 [US2] Journey Map full field set (Journey Name, Persona, Lifecycle Stage, Business Objective, Customer Goal, Description, Entry/Exit Point, Success Criteria, Owner, Status, Review Schedule), wired to T007 (FR-014)
- [ ] T051 [US2] Configurable journey stages (11 named) with 10-element per-stage capture (Goals, Actions, UI Screens, Business Processes, Emotions, Pain Points, Opportunities, Internal Teams, Supporting Systems, Success Metrics), wired to T008, acceptance scenario 1 (FR-015)
- [ ] T052 [US2] 8-mode journey visualization (Timeline, Flow Diagram, Swimlane, Persona, Channel, Heat Map, Sankey Flow, Interactive Canvas), wired to acceptance scenario 1 (FR-016)
- [ ] T053 [US2] Journey Analytics (10 combined metrics) + 10 behavioral signal monitoring (FR-017)
- [ ] T054 [US2] AI bottleneck/friction-point/drop-off identification + Journey Analytics dashboard (8 elements), wired to acceptance scenario 2 (FR-018)
- [ ] T055 [US2] Journey Optimization as an ongoing enterprise process with 9 named inputs and 8 optimization activity types (FR-021)
- [ ] T056 [US2] AI journey-change recommendations (remove friction, merge steps, add automation, personalize, add features, improve navigation, simplify, improve conversion) requiring configurable review before implementation, wired to acceptance scenario 4 (FR-022)
- [ ] T057 [P] [US2] Journey Canvas UI supporting all 8 visualization modes
- [ ] T058 [US2] Integration test: a journey map is saved and available in all 8 modes, AI analytics surfaces a friction point with supporting data, a journey revision retains version history and an audit record, an AI recommendation requires explicit review before implementation — all 4 acceptance scenarios in `backend/tests/integration/us2-journey-mapping-analytics.integration.test.ts`

**Checkpoint**: The primary CX/product/marketing diagnostic tool, feeding Journey Optimization and the Journey Intelligence Dashboard, is independently functional.

---

## Phase 5: User Story 3 — Customer Success Manager Monitors Health Score and Receives an Auto-Triggered Playbook (Priority: P1)

**Independent Test**: Seed a test account with declining usage and a missed payment, confirm the blended health score recalculates into a lower tier with correct sub-score contributions visible, and confirm the configured playbook's trigger condition fires and creates a reviewable task for the assigned CSM.

- [ ] T059 [US3] 14-category weighted Health Score evaluation with administrator-configurable category weights, wired to T010, acceptance scenario 1 (FR-031)
- [ ] T060 [US3] 6-tier classification (Excellent, Healthy, Stable, Attention Required, At Risk, Critical) with configurable thresholds, wired to acceptance scenario 1 (FR-032)
- [ ] T061 [US3] AI risk/opportunity signal identification (Declining Engagement, Churn Signals, Renewal Risk, Upsell Opportunities, Frustration, Product Misalignment, Success Probability, Recommended Interventions) with confidence score and supporting evidence, wired to acceptance scenario 3 (FR-033)
- [ ] T062 [US3] Health Monitoring Dashboard (Overall Health Distribution, High-Risk Customers, Health Trend Analysis, Renewal Forecast, Customer Segmentation, AI Risk Alerts, Executive Summary), wired to acceptance scenario 4 (FR-034)
- [ ] T063 [US3] 11-category Success Playbook standardization, wired to T012 (FR-035)
- [ ] T064 [US3] Playbook full field set (Name, Business Objective, Trigger Conditions, Recommended Actions, Responsible Team, Timeline, Communication Templates, Success Metrics, Exit Criteria) (FR-036)
- [ ] T065 [US3] 8-condition auto-trigger evaluation with configurable-review-gated execution, wired to T039's contract test, acceptance scenario 2 (FR-037)
- [ ] T066 [P] [US3] Health Score & Playbook Trigger UI
- [ ] T067 [US3] Integration test: underlying data change recalculates the blended score and reassigns the correct tier, an At-Risk threshold crossing evaluates playbook triggers and creates reviewable actions for the assigned team, an AI prediction includes confidence score and evidence, a newly high-churn-risk account auto-appears in the CS review queue — all 4 acceptance scenarios in `backend/tests/integration/us3-health-score-playbook-trigger.integration.test.ts`

**Checkpoint**: The operational core translating raw signal into proactive human action is independently functional.

---

## Phase 6: User Story 4 — CSM Builds and Executes a Success Plan from a Template (Priority: P2)

**Independent Test**: Assign a template to one test account, edit its milestones and target dates, let a milestone go overdue, and confirm the platform auto-escalates it.

- [ ] T068 [US4] Personalized Success Plan strategy definition tailored to customer objectives, maturity, and lifecycle stage, wired to T011 (FR-038)
- [ ] T069 [US4] Success Plan full field set (Customer Goals, Business Objectives, Milestones, Action Items, Assigned CSM, Target Dates, KPIs, Dependencies, Risks, Review Schedule, Completion Status), wired to acceptance scenario 1 (FR-039)
- [ ] T070 [US4] 8 reusable success plan templates + custom template creation, wired to acceptance scenario 1 (FR-040)
- [ ] T071 [US4] Success Plan automation (auto-assign templates, schedule reviews, create follow-up tasks, monitor milestones, send reminders, escalate overdue actions, AI-recommend improvements), wired to acceptance scenarios 2–3 (FR-041)
- [ ] T072 [P] [US4] Success Plan Builder UI
- [ ] T073 [US4] Integration test: an assigned template creates a plan with configurable goals/milestones/action items/KPIs/dependencies/risks/review schedule, a scheduled milestone review auto-creates a task and notifies the CSM, an overdue action item auto-escalates — all 3 acceptance scenarios in `backend/tests/integration/us4-success-plan-templates.integration.test.ts`

**Checkpoint**: The trackable, milestone-based operationalization of the health-score/playbook signal is independently functional.

---

## Phase 7: User Story 5 — Customer Progresses Through the 17-Stage Customer Lifecycle with Dynamic Segmentation (Priority: P2)

**Independent Test**: Drive one test customer through several CLM stage transitions, confirm lifecycle automation fires at each transition, and confirm their dynamic segment membership updates near-real-time as their purchase/usage data changes.

- [ ] T074 [US5] Unified customer-relationship management from first interaction through advocacy/expansion/re-engagement, aligning marketing/sales/product/CS/community/support around one journey, wired to T014 (FR-051)
- [ ] T075 [US5] Configurable 17-stage CLM (Anonymous Visitor→Alumni) with per-stage entry/exit criteria, KPIs, automation, ownership, wired to acceptance scenario 1 (FR-052)
- [ ] T076 [US5] Automatic transition detection triggering onboarding workflows, CS task assignment, engagement campaigns, product recommendations, review scheduling, team notification, high-risk escalation, wired to acceptance scenario 1 (FR-053)
- [ ] T077 [US5] 12-criteria Customer Segmentation, wired to T015 (FR-054)
- [ ] T078 [US5] Dynamic Segment auto-creation from 10 named inputs with near-real-time membership updates, wired to acceptance scenario 2 (FR-055)
- [ ] T079 [US5] Per-segment display (Customer Count, Revenue Contribution, Engagement Score, Product Adoption, Customer Health, Retention Rate, Churn Risk, Growth Trend, Average CLV, Average NPS) (FR-056)
- [ ] T080 [US5] Research-based Customer Persona library (11 named + custom categories), wired to T016 (FR-057)
- [ ] T081 [US5] Persona full field set (13 fields), wired to acceptance scenario 3 (FR-058)
- [ ] T082 [US5] AI persona refinement (recommend updates, detect emerging types, predict migration, identify underserved personas, recommend personalized experiences, analyze performance) (FR-059)
- [ ] T083 [P] [US5] CLM & Segmentation/Persona UI
- [ ] T084 [US5] Integration test: a confirmed purchase transitions Registered User to Paying Customer and triggers onboarding, a Health Score/usage change recalculates dynamic segment membership in near real time, a persona match informs personalized content — all 3 acceptance scenarios in `backend/tests/integration/us5-clm-dynamic-segmentation.integration.test.ts`

**Checkpoint**: The cross-functional lifecycle/segmentation/persona layer driving personalization across the whole platform is independently functional.

---

## Phase 8: User Story 6 — CX Team Identifies and Nurtures an Advocate via AI Signals and Loyalty Program (Priority: P2)

**Independent Test**: Seed a test account with high NPS, high usage, and referral activity, confirm the AI advocate-identification signals surface the account for review, and confirm a manually approved referral produces a correctly tracked reward through the referral workflow.

- [ ] T085 [US6] 10 Loyalty Program types + 9 monitored loyalty metrics, wired to T017 (FR-066)
- [ ] T086 [US6] 10 configurable Loyalty Benefits, reusing `006`/`009`'s ledger per T037's note (FR-067)
- [ ] T087 [US6] 10-channel Advocate identification/nurturing/empowerment activities, wired to T018 (FR-068)
- [ ] T088 [US6] AI advocate-identification signals (High NPS, High Usage, Community Leadership, Referral Success, Positive Feedback, Long-Term Retention, Loyalty Score, Engagement Consistency), wired to acceptance scenario 1 (FR-069)
- [ ] T089 [US6] 8 Advocacy metrics (FR-070)
- [ ] T090 [US6] 8-source-type Referral Management through the 7-step workflow, reusing `030`'s referral execution engine per T036's note, wired to T019, acceptance scenario 2 (FR-071)
- [ ] T091 [US6] 8 configurable Referral Reward models + 8 monitored metrics including Fraud Detection Alerts, wired to acceptance scenario 3 (FR-072)
- [ ] T092 [P] [US6] Advocacy & Loyalty Dashboard UI
- [ ] T093 [US6] Integration test: high NPS/usage/community-leadership surfaces the customer as a potential advocate for review, an approved advocate's referral progresses through all 7 workflow stages with fraud-detection checks, a loyalty-point redemption is recorded against loyalty metrics — all 3 acceptance scenarios in `backend/tests/integration/us6-advocacy-loyalty-referral.integration.test.ts`

**Checkpoint**: The downstream, high-value outcome of a healthy customer relationship is independently functional.

---

## Phase 9: User Story 7 — VoC Team Consolidates 20 Feedback Sources Through a 10-Step Workflow (Priority: P1)

**Independent Test**: Submit one feedback item through each of several channels, confirm each is classified into a voice category with a sentiment score, and drive one item through the full 10-step workflow to "Closed," confirming an immutable audit log exists for every transition.

- [ ] T094 [US7] Continuous capture/consolidation/analysis/prioritization/action across the entire customer lifecycle, wired to T021 (FR-073)
- [ ] T095 [US7] 20-source VoC data collection, reusing `041`'s ingestion surface per T035's note, wired to T020 (FR-074)
- [ ] T096 [US7] 13-category Voice Category classification (FR-075)
- [ ] T097 [US7] Executive VoC Dashboard (Total Feedback, Feedback by Category, Satisfaction Trends, Sentiment Distribution, Top Requests, Feature Demand, Pain Points, AI Insights, Executive Action Queue) (FR-076)
- [ ] T098 [US7] 11-channel structured feedback collection/classification/routing/prioritization/resolution/tracking (FR-077)
- [ ] T099 [US7] Feedback Record full field set (13 fields), wired to T021, acceptance scenario 1 (FR-078)
- [ ] T100 [US7] 10-step feedback workflow (Submitted→Archived) with an immutable audit log per transition, wired to T040's contract test, acceptance scenario 2 (FR-079)
- [ ] T101 [US7] 8-factor configurable feedback prioritization (FR-080)
- [ ] T102 [US7] 12 structured survey types across multiple customer touchpoints, wired to T022, acceptance scenario 4 (FR-081)
- [ ] T103 [US7] Survey designer (drag-and-drop, question library, conditional logic, branching, multi-language, file upload, rating scales, matrix questions, multiple choice, open text, AI question suggestions), wired to acceptance scenario 4 (FR-082)
- [ ] T104 [US7] 9-channel survey delivery + 8 monitored metrics (FR-083)
- [ ] T105 [US7] AI/NLP sentiment classification (6 categories, custom labels supported) across 10 source types, reusing `041`'s sentiment engine, wired to T023, acceptance scenario 3 (FR-084)
- [ ] T106 [P] [US7] VoC Feedback Workflow & Survey Designer UI
- [ ] T107 [US7] Integration test: multi-channel feedback is recorded with category/sentiment/priority/stage/team, a Prioritized-to-Assigned transition is captured in an immutable audit log, open-text feedback is classified into a sentiment category with emotion/topic/confidence, a survey supports drag-and-drop/branching/multi-language and 9-channel distribution — all 4 acceptance scenarios in `backend/tests/integration/us7-voc-feedback-workflow.integration.test.ts`

**Checkpoint**: The Mission-Critical "central source of customer intelligence" feeding health scoring, journey optimization, and executive dashboards alike is independently functional.

---

## Phase 10: User Story 8 — CX Governance Committee Reviews an AI-Recommended Journey Change (Priority: P3)

**Independent Test**: Submit one journey-optimization recommendation through the governance workflow, confirm a governance role can approve/reject/request changes, and confirm every governance action is captured in an immutable audit log and reflected in the Governance Dashboard's compliance score.

- [ ] T108 [US8] 8 Journey Governance principles + 10 configurable role permissions, wired to T024 (FR-025 part 1)
- [ ] T109 [US8] 7 Journey Governance workflows (Approval, Publication, Revision, Retirement, Compliance Review, Accessibility Review, Executive Approval) with immutable audit logs, wired to acceptance scenario 1 (FR-025 part 2)
- [ ] T110 [US8] Journey Intelligence Dashboard (14 elements) (FR-026)
- [ ] T111 [US8] AI journey-health/behavior/conversion/churn/engagement/revenue predictions, transparent/explainable/reviewable (FR-027)
- [ ] T112 [US8] 9 CX Governance principles enforcement (FR-091)
- [ ] T113 [US8] 11 configurable CX Governance roles, wired to T037's `016`-reuse note (FR-092)
- [ ] T114 [US8] 9 governance activities (Experience/Journey/Survey/Product Feedback Reviews, CX Audits, Accessibility Audits, AI Model Reviews, Executive Steering Committees, Continuous Improvement Programs), wired to acceptance scenario 3 (FR-093)
- [ ] T115 [US8] Governance Dashboard (Compliance Score, Open CX Risks, Satisfaction Trends, Improvement Initiatives, Executive Action Items, Audit Findings, AI Governance Alerts), wired to acceptance scenarios 2–3 (FR-094)
- [ ] T116 [P] [US8] CX Governance Dashboard UI
- [ ] T117 [US8] Integration test: a recommendation routes through Journey Approval, Compliance Review, and Accessibility Review before Executive Approval, a Compliance Officer rejection blocks publication and logs the reason immutably, AI Model Review findings are recorded and reflected in the dashboard — all 3 acceptance scenarios in `backend/tests/integration/us8-cx-governance.integration.test.ts`

**Checkpoint**: The cross-cutting control layer ensuring enterprise-standard quality, consistency, accessibility, and ethical AI use is independently functional.

---

## Phase 11: Touchpoint & Omnichannel remainder (supports FR-019–FR-020, FR-023–FR-024; cross-cutting, no single owning story)

- [ ] T118 Touchpoint repository (17 channels) with full field set plus a centralized repository linking journeys, owners, documentation, and historical performance, wired to T009 (FR-019)
- [ ] T119 Touchpoint performance monitoring (Interactions, Response Time, Resolution Time, Satisfaction, Abandonment Rate, Conversion Rate, Revenue Impact, Engagement Score) (FR-020)
- [ ] T120 Omnichannel unified customer profile contribution across 14 channels plus 8 unification capabilities (Unified Identity, Cross-Channel Session Tracking, Personalized Recommendations, Unified Notification Center, Shared Preferences, Interaction History, Cross-Channel Analytics, Channel Performance Comparison) (FR-023)
- [ ] T121 Cross-channel authorized-team access to customer profile/history data regardless of the serving channel (FR-024)
- [ ] T122 [P] Touchpoint & Omnichannel Dashboard UI

---

## Phase 12: Customer Success Platform core, Onboarding/Adoption/Retention/CS-Dashboard remainder (supports FR-028–FR-030, FR-042–FR-050; cross-cutting, no single owning story)

- [ ] T123 Proactive, continuous CS monitoring functioning as the operational hub for retention/expansion/advocacy (FR-028)
- [ ] T124 11 Customer Success Platform core components, wired to T012 (FR-029)
- [ ] T125 Configurable 12-stage Customer Success Lifecycle, wired to T013 (FR-030)
- [ ] T126 Onboarding program structure (Welcome Experience, Account Configuration, Profile Completion, Product Setup, Guided Tutorials, Knowledge Base, Community Introduction, AI Assistant Orientation, Initial Milestones) + 10-item onboarding checklist (FR-042)
- [ ] T127 Onboarding progress display (Completion %, Time-to-Activation, Drop-Off Points, Satisfaction, Success Probability, AI Recommendations) (FR-043)
- [ ] T128 Product Adoption measurement (10 metrics) + 8 adoption campaign types (FR-044)
- [ ] T129 AI Adoption Intelligence (Features to Promote, Customers Needing Assistance, Personalized Tutorials, Learning Paths, Community Groups, Product Enhancements) (FR-045)
- [ ] T130 10 Customer Retention strategies (FR-046)
- [ ] T131 AI churn-signal evaluation (8 inputs) reusing `040`'s canonical model, with elevated-risk accounts auto-surfaced in CS queues, wired to T034's reuse note (FR-047)
- [ ] T132 8 retention analytics metrics (Churn Rate, Renewal Rate, Retention Rate, CLV, Engagement Trends, Loyalty Score, Revenue Retention, Expansion Revenue) (FR-048)
- [ ] T133 Customer Success Dashboard (14 elements) + 8 AI-driven forecast/insight types, each transparent/explainable/metric-supported (FR-049)
- [ ] T134 10 configurable Customer Success report types with scheduled delivery, PDF/Excel export, drill-down analytics, RBAC (FR-050)
- [ ] T135 [P] Onboarding/Adoption/Retention/Customer Success Dashboard UI

---

## Phase 13: CLM Dashboard/Reports remainder, Engagement remainder, Sentiment/Experience Analytics remainder (supports FR-060–FR-065, FR-085–FR-089; cross-cutting, no single owning story)

- [ ] T136 Customer Lifecycle Intelligence Dashboard (14 elements), wired to T014-T016 (FR-060)
- [ ] T137 AI lifecycle-transition/value/retention/loyalty/referral/expansion/persona-evolution/journey/strategic insight generation (9 types), explainable/configurable/auditable (FR-061)
- [ ] T138 9 CLM report types with scheduling, RBAC, drill-down, export, historical trend analysis (FR-062)
- [ ] T139 12-channel engagement planning/automation/monitoring/optimization focused on value over volume (FR-063)
- [ ] T140 11 engagement activity types + 10 measured metrics (FR-064)
- [ ] T141 AI Engagement Optimization (Best Channel, Best Time, Personalized Content, Next Best Action, Campaign Frequency, Customer-Specific Offers, Educational Resources) (FR-065)
- [ ] T142 Sentiment Dashboard (Overall Sentiment Score, Positive vs Negative Trends, Emotion Distribution, Topic Heatmaps, Escalation Queue, Executive Alerts, Segment Comparison), wired to T023 (FR-086)
- [ ] T143 Unified Experience Analytics (12 measured metrics) across operational/behavioral/financial/perception data (FR-087)
- [ ] T144 7 experience-domain dashboards (Executive CX, Journey, Customer Success, Product, Community, Learning, Support) (FR-088)
- [ ] T145 AI experience-deterioration prediction + 5 recommendation types, reviewable before implementation (FR-089)
- [ ] T146 AI Emotion Detection/Intent Recognition/Topic Extraction/Trend Analysis/Root Cause Identification/Escalation Recommendations/Frustration Detection/Advocacy Detection with confidence and evidence, reusing `041`'s engine, wired to T035's note (FR-085)
- [ ] T147 [P] CLM/Engagement/Sentiment/Experience Analytics Dashboards UI

---

## Phase 14: Polish — Governance, Security, Scalability & Final Validation

- [ ] T148 Immutable audit logs for all customer-related changes + RBAC-governed customer-information access + encryption at rest/in transit + privacy/governance compliance + transparent/explainable/reviewable AI recommendations (FR-095)
- [ ] T149 Enterprise-scale (millions of records/interactions/feedback events) dashboard responsiveness + non-degrading background analytics + extensible architecture for future channels/capabilities (FR-096)
- [ ] T150 Resolve and document the 12 preserved NEEDS CLARIFICATION items from plan.md §6 not already closed by `research.md`, including the new two-health-score CS-queue question from §1
- [ ] T151 Final audit: cross-check every FR-001–FR-096 against an implementation or validation task; re-verify the `040` churn-model, `041` VoC/sentiment/survey, `030` referral-execution, and `016`/`003`/`006`/`009` reuse decisions are respected
- [ ] T152 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `040`'s Churn Prediction Engine, `041`'s NLP/sentiment/survey engine, and `030`'s referral execution engine, and produces the entity/architecture/operating-model infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US3, US7)**: US1 (15-stage CX Lifecycle) is the foundational data model every other CXOS capability is built on top of and must land first; US2 (Journey Mapping) is the second most foundational and independent of Customer Success/VoC; US3 (Health Score/Playbooks) depends conceptually on US1's lifecycle existing but is independently testable once Foundational is complete; US7 (VoC) is independent of US1–US3 and can build in parallel.
- **P2 stories (US4, US5, US6)**: US4 (Success Plans) depends on US3 (Health Scoring/Playbooks) already existing; US5 (17-stage CLM/Segmentation) extends rather than replaces US1's CX Lifecycle and can be layered on afterward; US6 (Advocacy/Loyalty) depends on the lifecycle, health-scoring, and engagement capabilities already existing.
- **P3 story (US8)** depends on the journey, health-score, and VoC capabilities it governs already existing and producing recommendations to review, and should land last among the numbered stories.
- **Phase 11 (Touchpoint/Omnichannel remainder)** depends on Foundational and US2; should land alongside US2.
- **Phase 12 (CS Platform core/Onboarding/Adoption/Retention/CS-Dashboard remainder)** depends on Foundational and US3; should land alongside US4.
- **Phase 13 (CLM Dashboard/Engagement/Sentiment/Experience Analytics remainder)** depends on Foundational, US5, and US7; should land alongside US6.
- **Polish (Phase 14)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, 5-layer architecture, 14-phase operating model, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (cx-lifecycle-stage-always-current, playbook-actions-require-human-review-gate, feedback-workflow-full-audit-trail) pass → US1 (15-stage CX Lifecycle) → **STOP and VALIDATE** the foundational data model is sound → US2 (Journey Mapping) + US7 (VoC) in parallel → US3 (Health Score/Playbooks) → **STOP and VALIDATE** every AI-triggered playbook action passes a human review gate → US4 (Success Plans) + Phase 12 (CS Platform/Onboarding/Adoption/Retention remainder) → US5 (17-stage CLM/Segmentation) + Phase 11 (Touchpoint/Omnichannel remainder) → US6 (Advocacy/Loyalty) + Phase 13 (CLM Dashboard/Engagement/Sentiment/Experience Analytics remainder) → US8 (CX Governance) → Polish.
