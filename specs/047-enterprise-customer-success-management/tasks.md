---
description: "Task list for Feature 047 — Enterprise Customer Success Management (CSOS)"
---

# Tasks: Enterprise Customer Success Management (CSOS)

**Input**: Design documents from `/specs/047-enterprise-customer-success-management/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 013, 040, 044, 030, and 008 — most notably the finding that reverses `044`'s premature "first-appearance canonicity" claim over Customer Success Platform content), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC reused via `016`). This feature also assumes `013`'s base Customer/Health-Score/Success-Plan/Onboarding entities and `040`'s Churn Prediction Engine exist as consumption points.

**Tests**: Included throughout — Customer 360° single-workspace view, renewal-discount human-approval gating, and AI-Copilot human-approval-before-customer-facing-action each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-005, and SC-007.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus three supplementary cross-cutting phases for FR groups not owned by any single prioritized story (registration/segmentation/journey/lifecycle/success-planning/operations/intelligence-dashboard remainder; product-adoption/playbook-catalog/engagement/advocacy/CS-intelligence-dashboard remainder; Customer Success Portal & sub-portals).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC reused via `016`), and that `013`'s base Customer/Health-Score/Success-Plan/Onboarding entities and `040`'s Churn Prediction Engine exist as consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: whether `047`'s Health Score is the same score as `013`'s recalculated or a separate parallel score, default Health Score metric weightages, Health Category numeric boundaries, max AI-recommended renewal discount/escalation threshold, mid-journey onboarding-track correction mechanics, Health-Score-signal-conflict reconciliation, Health-vs-Churn-Risk disagreement precedence, multi-product lifecycle-stage reconciliation, CSM-reassignment continuity, AI-Copilot unauthorized-commitment handling, stalled-renewal escalation — and flag the `044` Customer-Success-Platform ownership-reversal finding (plan.md §3) for explicit user confirmation
- [ ] T003 [P] Add `backend/src/modules/csos/{customer-360-workspace,success-planning-operations,onboarding-lifecycle,activation-milestones,product-adoption-playbooks,customer-engagement,customer-health-score,churn-prediction-prevention,renewal-management,expansion-management,customer-advocacy,customer-success-portal-core,customer-learning-portal,customer-self-service-portal,customer-community-portal,customer-success-executive-portal,customer-success-ai-copilot}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Customer 360° Profile` entity in `backend/src/modules/csos/customer-360-workspace/customer-360-profile.entity.ts`
- [ ] T005 [P] Define the `Customer Segment` entity in `backend/src/modules/csos/customer-360-workspace/customer-segment.entity.ts`
- [ ] T006 [P] Define the `Customer Journey` entity in `backend/src/modules/csos/customer-360-workspace/customer-journey.entity.ts`
- [ ] T007 [P] Define the `Customer Success Plan` entity in `backend/src/modules/csos/success-planning-operations/customer-success-plan.entity.ts`
- [ ] T008 [P] Define the `Onboarding Program / Onboarding Track` entity in `backend/src/modules/csos/onboarding-lifecycle/onboarding-program.entity.ts`
- [ ] T009 [P] Define the `Activation Milestone` entity in `backend/src/modules/csos/activation-milestones/activation-milestone.entity.ts`
- [ ] T010 [P] Define the `Success Playbook` entity in `backend/src/modules/csos/product-adoption-playbooks/success-playbook.entity.ts`
- [ ] T011 [P] Define the `Customer Health Score (CSM variant)` entity in `backend/src/modules/csos/customer-health-score/customer-health-score.entity.ts`
- [ ] T012 [P] Define the `Churn Risk Assessment` entity in `backend/src/modules/csos/churn-prediction-prevention/churn-risk-assessment.entity.ts`
- [ ] T013 [P] Define the `Prevention Playbook` entity in `backend/src/modules/csos/churn-prediction-prevention/prevention-playbook.entity.ts`
- [ ] T014 [P] Define the `Renewal Record` entity in `backend/src/modules/csos/renewal-management/renewal-record.entity.ts`
- [ ] T015 [P] Define the `Expansion Opportunity` entity in `backend/src/modules/csos/expansion-management/expansion-opportunity.entity.ts`
- [ ] T016 [P] Define the `Advocacy Program Enrollment` entity in `backend/src/modules/csos/customer-advocacy/advocacy-program-enrollment.entity.ts`
- [ ] T017 [P] Define the `CS AI Copilot Session` entity in `backend/src/modules/csos/customer-success-ai-copilot/cs-ai-copilot-session.entity.ts`
- [ ] T018 [P] Define the `Executive Business Review (EBR) / Quarterly Business Review (QBR)` entity in `backend/src/modules/csos/success-planning-operations/ebr-qbr.entity.ts`
- [ ] T019 [P] Define the `Customer Success Task` entity in `backend/src/modules/csos/success-planning-operations/customer-success-task.entity.ts`
- [ ] T020 Note: this feature's Customer 360° Profile, Health Score, Success Plan, and Onboarding entities extend `013`'s base Account/Customer/Health-Score/Success-Plan/Onboarding entities as the enterprise-scale orchestration layer, not a replacement (per plan.md §1)
- [ ] T021 Note: Churn Prediction Management consumes `040`'s canonical churn-prediction model/scoring engine as the CS-operational layer on top of it (per plan.md §2)
- [ ] T022 Note: this feature is the canonical, authoritative source for Customer Success Management depth (Health Score model/tiers, Success Playbook catalog, Success Plan workflow, Onboarding Program differentiation, Activation Milestones, Churn Prevention Playbooks, Renewal Management, Expansion Management, AI Copilot) — reversing `044`'s premature "first-appearance canonicity" claim; `044`'s own Customer Success Platform section should be treated as a lighter CXOS-level consumer of this feature's outputs pending explicit user confirmation of the correction (per plan.md §3)
- [ ] T023 Note: Customer Advocacy's referral actions route through `030`'s existing referral execution engine rather than a parallel one; Advocacy Rewards integrate with `006`/`009`'s existing ledger (per plan.md §4)
- [ ] T024 Note: every AI Copilot and advisory-intelligence module consumes `008`'s shared AI gateway rather than a CSOS-specific model-routing layer; Learning/Community/Self-Service sub-portals reuse `004`/`005`/`013`'s existing content rather than duplicating it (per plan.md §5)
- [ ] T025 Contract test: 100% of customers have a Customer 360° Profile viewable in one workspace without navigating to a separate system, in `backend/tests/contract/customer-360-single-workspace-view.contract.test.ts` (FR-001, SC-001)
- [ ] T026 Contract test: zero AI-recommended discounts are applied to a contract without passing through the configured human Approval stage, in `backend/tests/contract/renewal-discount-requires-human-approval.contract.test.ts` (FR-057, SC-005)
- [ ] T027 Contract test: 100% of AI Copilot outputs are logged in AI Audit History with a confidence score and require human approval before any customer-facing action, in `backend/tests/contract/ai-copilot-output-requires-human-approval-before-customer-facing-action.contract.test.ts` (FR-078, SC-007)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Customer Success Manager Works From a Unified Customer 360° Workspace (Priority: P1) 🎯 MVP

**Independent Test**: Load the Customer 360° Workspace for a customer with data across at least three source systems and confirm all fields render correctly in one screen with no missing sections.

- [ ] T028 [US1] Unify commercial/operational/behavioral/financial/learning/community/support/AI intelligence into a single Customer 360° Workspace, wired to T004 and T020's `013`-extension note, acceptance scenario 1 (FR-001)
- [ ] T029 [US1] 12 configurable customer categories + admin-definable additional, wired to acceptance-criteria tie-in (FR-002)
- [ ] T030 [US1] Customer Profile full field set (18 fields), wired to acceptance scenario 4 (FR-003)
- [ ] T031 [US1] Workspace content (16 elements) as the authoritative view reflecting upstream changes, wired to acceptance scenarios 1–3 (FR-004)
- [ ] T032 [P] [US1] Customer 360° Workspace UI
- [ ] T033 [US1] Integration test: the workspace displays all 16 content sections without navigating away, an upstream profile-field change reflects as the authoritative view, cross-module purchases consolidate under one profile, all 5 computed scores are clearly labeled and distinguished — all 4 acceptance scenarios in `backend/tests/integration/us1-customer-360-workspace.integration.test.ts`

**Checkpoint**: The single source of truth every other CSOS capability reads from and writes to is independently functional.

---

## Phase 4: User Story 2 — Onboarding Specialist Runs White-Glove vs. Self-Service Onboarding Tracks (Priority: P1)

**Independent Test**: Onboard one Enterprise customer and one Self-Service customer in parallel and confirm each receives the correct program template, task set, and SLA.

- [ ] T034 [US2] 10 configurable onboarding programs including White-Glove/Self-Service differentiation by customer segment, wired to T008, acceptance scenarios 1–2 (FR-025)
- [ ] T035 [US2] Onboarding program workspace content (14 elements), wired to acceptance scenario 3 (FR-026)
- [ ] T036 [US2] 10-stage onboarding lifecycle (Customer Handover→Onboarding Completion) with SLA tracking, approvals, automation, notifications, and audit logging regardless of track, wired to acceptance scenarios 3–4 (FR-027)
- [ ] T037 [P] [US2] Onboarding Track Assignment UI
- [ ] T038 [US2] Integration test: an Enterprise/Strategic Account customer receives a White-Glove program with CSM/kickoff/training/executive reviews, an Individual/Small Business customer receives a Self-Service checklist-driven program, both tracks progress through the identical 10 stages with full audit logging, a reassignment preserves prior completion history and applies the new track's remaining tasks — all 4 acceptance scenarios in `backend/tests/integration/us2-onboarding-tracks.integration.test.ts`

**Checkpoint**: The capability directly determining time-to-value, activation, and early churn is independently functional.

---

## Phase 5: User Story 3 — CSM Tracks Activation Milestones Independently of Onboarding Stage (Priority: P3)

**Independent Test**: Complete a customer's onboarding stages while intentionally leaving one activation milestone unmet, and confirm the system still flags the gap in Activation Analytics.

- [ ] T039 [US3] 10-component activation management, wired to T009 (FR-028)
- [ ] T040 [US3] 8-milestone tracking distinct from onboarding-stage progress, wired to acceptance scenario 1 (FR-029)
- [ ] T041 [US3] 7-capability activation automation (welcome emails, task assignment, walkthrough scheduling, learning recommendations, CSM notification, inactive-customer escalation, engagement campaigns) (FR-030)
- [ ] T042 [US3] 8-metric Activation Analytics including drop-off detection and configured escalation, wired to acceptance scenarios 2–4 (FR-031)
- [ ] T043 [P] [US3] Activation Milestones UI
- [ ] T044 [US3] Integration test: a customer who completed Onboarding still shows unmet activation milestones independently, a reached milestone records its timestamp and updates Activation Rate/Average Time-to-Activation independent of onboarding status, a stalled milestone flags a drop-off and triggers escalation automation, a redefined milestone set applies going forward without altering already-recorded history — all 4 acceptance scenarios in `backend/tests/integration/us3-activation-milestones.integration.test.ts`

**Checkpoint**: The meaningful-usage signal exposing "onboarded but not activated" customers CSMs would otherwise miss is independently functional.

---

## Phase 6: User Story 4 — Customer Health Score Combines 15 Weighted Metrics Into 7 Health Tiers (Priority: P1)

**Independent Test**: Change one underlying metric for a test customer and confirm the weighted score recalculates and the customer's Health Category updates accordingly.

- [ ] T045 [US4] Dynamic Health Score computation from 15 weighted metric components, wired to T011, acceptance scenario 1 (FR-045)
- [ ] T046 [US4] Configurable per-metric weightage with historical-score immutability on reconfiguration, wired to acceptance scenario 2 (FR-046)
- [ ] T047 [US4] 7-category Health classification (Excellent→Recovery Required) with configurable thresholds, wired to acceptance scenario 3 (FR-047)
- [ ] T048 [US4] 10-signal continuous health monitoring (Daily/Weekly/Monthly trends, usage decline, engagement/satisfaction changes, revenue risk, executive escalations, success activities, AI risk signals) (FR-048)
- [ ] T049 [US4] AI Health Intelligence (Health Forecasts, Root Cause Analysis, Improvement Recommendations, Trend Predictions, Success Plan Suggestions, Risk Prioritization) with confidence, reasoning, and evidence, remaining advisory, wired to acceptance scenario 4 (FR-049)
- [ ] T050 [P] [US4] Customer Health Score Dashboard UI
- [ ] T051 [US4] Integration test: an underlying metric change recalculates the score and Health Category on both the workspace and dashboard, a custom weightage configuration applies to future calculations while historically computed scores remain unchanged, a Recovery-Required classification triggers the configured escalation, an AI Health Forecast/Root Cause output includes confidence/reasoning/evidence and stays advisory — all 4 acceptance scenarios in `backend/tests/integration/us4-customer-health-score.integration.test.ts`

**Checkpoint**: The primary indicator for proactive customer success management is independently functional.

---

## Phase 7: User Story 5 — Churn Prediction Monitors 12 Leading Indicators and Launches Prevention Playbooks (Priority: P1)

**Independent Test**: Simulate a customer with 3+ active churn indicators and confirm the system computes a Risk Level and surfaces a recommended Prevention Playbook.

- [ ] T052 [US5] 12-indicator churn monitoring, wired to T012, acceptance scenario 1 (FR-050)
- [ ] T053 [US5] 5-level configurable Churn Risk classification (Very Low→Critical), wired to acceptance scenario 2 (FR-051)
- [ ] T054 [US5] 9-category Churn Prevention Playbook catalog, wired to T013 and T021's `040`-consumption note, acceptance scenario 2 (FR-052)
- [ ] T055 [US5] AI Churn Intelligence (Churn Probability, Root Cause Analysis, Recovery Strategies, Revenue Impact Predictions, Recommended Success Actions, Escalation Priorities) remaining advisory and fully auditable, wired to acceptance scenarios 1, 3, and 4 (FR-053)
- [ ] T056 [P] [US5] Churn Risk & Prevention Playbook UI
- [ ] T057 [US5] Integration test: a multi-indicator account computes a Churn Probability/Risk Level with root cause and recommended actions, a High/Critical classification recommends a matching Prevention Playbook, an AI churn recommendation displays as advisory with confidence and is fully auditable, risk-level trend data feeds the Churn Risk Overview and Executive Alerts — all 4 acceptance scenarios in `backend/tests/integration/us5-churn-prediction-prevention.integration.test.ts`

**Checkpoint**: The only mechanism converting risk indicators into a concrete, actionable intervention is independently functional.

---

## Phase 8: User Story 6 — Renewal Manager Runs a 9-Stage Renewal With AI Discount Optimization Under Approval (Priority: P1)

**Independent Test**: Run one customer's renewal from Identification through Revenue Recognition and confirm AI's discount recommendation cannot bypass the Approval stage.

- [ ] T058 [US6] 9-stage renewal lifecycle (Renewal Identification→Revenue Recognition), wired to T014, acceptance scenario 1 (FR-054)
- [ ] T059 [US6] Renewal component full field set (Contract Information, Timeline, Forecast, Commercial Terms, Customer Health, Executive Sponsors, Risks, Expansion Opportunities, Approval Workflow, Audit History) (FR-055)
- [ ] T060 [US6] 7-capability renewal automation (reminders, notification, scheduling, playbook launch, escalation, probability prediction, pricing-strategy recommendation) (FR-056)
- [ ] T061 [US6] AI Renewal Intelligence (Renewal Probability, Commercial Recommendations, Discount Optimization, Executive Engagement Suggestions, Contract Risk Analysis, Revenue Forecasts) with a hard block on discount/commercial-term effect until the human/role-gated Approval stage passes, wired to T026's contract test, acceptance scenarios 2–4 (FR-057)
- [ ] T062 [P] [US6] Renewal 9-Stage Tracker UI
- [ ] T063 [US6] Integration test: an approaching-renewal-window contract auto-populates Renewal Identification with contract/timeline/forecast/health, an AI discount recommendation during Commercial Assessment is advisory-only and requires explicit approval before inclusion in a Proposal, threshold-exceeding terms route through the defined approval chain rather than auto-approving, a completed Contract Renewal/Revenue Recognition records the full 9-stage progression and final terms immutably — all 4 acceptance scenarios in `backend/tests/integration/us6-renewal-management.integration.test.ts`

**Checkpoint**: The mechanism directly protecting recurring revenue with the same rigor as the sales pipeline is independently functional.

---

## Phase 9: User Story 7 — Expansion Manager Pursues Growth Across 10 Opportunity Types (Priority: P2)

**Independent Test**: Detect one AI-flagged expansion signal, qualify it, and progress it to Revenue Recognition.

- [ ] T064 [US7] 10-category Expansion Opportunity identification, wired to T015, acceptance scenario 1 (FR-058)
- [ ] T065 [US7] 8-step expansion workflow (Opportunity Detection→Revenue Recognition), wired to acceptance scenarios 2 and 4 (FR-059)
- [ ] T066 [US7] 8-metric Expansion Analytics with each opportunity counted exactly once regardless of contributing indicators, wired to acceptance scenario 3 (FR-060)
- [ ] T067 [US7] AI Expansion Intelligence (Best Opportunities, Product Recommendations, Revenue Optimization, Timing Recommendations, Executive Engagement Plans, Growth Strategies) (FR-061)
- [ ] T068 [P] [US7] Expansion Pipeline UI
- [ ] T069 [US7] Integration test: an AI-detected growth signal creates a typed Expansion Opportunity entering Opportunity Detection, a qualified opportunity proceeds to Executive Review and Customer Discussion, multiple opportunities for the same customer reflect correctly in Pipeline/Revenue/Average-Value without double-counting, an approved opportunity's Commercial Execution/Revenue Recognition reflects on the dashboard — all 4 acceptance scenarios in `backend/tests/integration/us7-expansion-management.integration.test.ts`

**Checkpoint**: The mechanism turning adoption/usage signals into tracked, closeable growth pipeline is independently functional.

---

## Phase 10: User Story 8 — CS AI Copilot Drafts QBR/EBR Agendas Under Explainability and Approval Governance (Priority: P2)

**Independent Test**: Request an EBR agenda draft from the Copilot and confirm it cannot be sent to a customer without a human review/approval step, with the interaction fully logged.

- [ ] T070 [US8] CS AI Copilot natural-language support across 10 use-case categories for 4 user types, wired to T017 (FR-077)
- [ ] T071 [US8] 8-capability automatic drafting/summarization (account summaries, executive reports, next-best-action, draft communications, QBR/EBR agendas, risk identification, playbook recommendation, activity prioritization) with mandatory human review/approval before any customer-facing action, wired to T024's note, T027's contract test, acceptance scenarios 1 and 4 (FR-078)
- [ ] T072 [US8] 8-control enterprise AI governance enforcement (approval workflows, explainable AI, confidence scores, prompt logging, data privacy, security policies, AI audit history, usage monitoring), wired to acceptance scenarios 2–3 (FR-079)
- [ ] T073 [P] [US8] AI Copilot Session UI
- [ ] T074 [US8] Integration test: a requested EBR agenda draft requires human review/edit before being sent or used in the meeting, an account/churn/health summary includes a confidence score and contributing-factor explanation, every prompt/response is recorded in AI Audit History with full logging, an un-acted-on next-best-action recommendation stays advisory without auto-triggering any customer-facing communication — all 4 acceptance scenarios in `backend/tests/integration/us8-ai-copilot-governance.integration.test.ts`

**Checkpoint**: The productivity accelerant that cuts QBR/EBR prep time while preserving human control is independently functional.

---

## Phase 11: Registration/Segmentation/Journey/Lifecycle remainder, Success Planning/Operations/Intelligence Dashboard (supports FR-005–FR-015, FR-016–FR-024; cross-cutting, no single owning story)

- [ ] T075 10-channel customer registration intake, wired to T004 (FR-005)
- [ ] T076 14-field registration collection with configurable mandatory/optional fields (FR-006)
- [ ] T077 9-capability customer self-service profile management (update info, security settings, communication preferences, profile image, notification settings, privacy preferences, login history, data download, deletion request) (FR-007)
- [ ] T078 6-method identity verification (FR-008)
- [ ] T079 12-criteria configurable customer segmentation, wired to T005 (FR-009)
- [ ] T080 10-source segmentation-rule derivation (FR-010)
- [ ] T081 AI Segmentation Intelligence (Dynamic Clusters, Growth Potential, Churn Risk Groups, Upsell Opportunities, Personalized Recommendations, Strategic Customer Identification) with confidence and evidence (FR-011)
- [ ] T082 10-stage configurable Customer Journey tracking (Awareness→Advocacy), wired to T006 (FR-012)
- [ ] T083 Journey record content (Milestones, Goals, Tasks, Communications, Events, Product Usage, Surveys, Reviews, Success Metrics, Executive Checkpoints) (FR-013)
- [ ] T084 7-capability journey automation (onboarding emails, success tasks, business review scheduling, learning recommendations, engagement campaigns, risk escalation, stakeholder notification) (FR-014)
- [ ] T085 14-stage standardized Customer Lifecycle (Customer Created→Long-Term Partnership), wired to T004 (FR-015)
- [ ] T086 Collaborative Success Plan full field set (10 elements), wired to T007 (FR-016)
- [ ] T087 8-stage Success Planning workflow (Plan Creation→Continuous Optimization) (FR-017)
- [ ] T088 AI Success Intelligence (Playbooks, Milestone Adjustments, Adoption Improvements, Engagement Strategies, Review Agendas, Expansion Recommendations) (FR-018)
- [ ] T089 10-component CS Operations toolkit (Task Management, SLA Management, Playbook Execution, Customer Reviews, EBRs, QBRs, Escalation Management, Success Automation, Workflow Management, KPI Monitoring), wired to T018/T019 (FR-019)
- [ ] T090 8-metric operational analytics (FR-020)
- [ ] T091 AI Operational Intelligence (Workload Optimization, Success Recommendations, Customer Prioritization, Escalation Predictions, Productivity Analysis, Operational Risk Alerts), advisory-only (FR-021)
- [ ] T092 Customer Intelligence Dashboard (14 elements) (FR-022)
- [ ] T093 AI on Customer Intelligence Dashboard (8 outputs), transparent/configurable/explainable/auditable (FR-023)
- [ ] T094 10 configurable executive report types with scheduling/export/drill-down/benchmarking/RBAC (FR-024)
- [ ] T095 [P] Registration/Segmentation/Journey/Success-Planning/Intelligence-Dashboard UI

---

## Phase 12: Product-adoption/Success-Playbook-catalog remainder, Customer Engagement/Adoption-Dashboard remainder, Advocacy/CS-Intelligence-Dashboard remainder (supports FR-032–FR-039, FR-040–FR-044, FR-062–FR-066; cross-cutting, no single owning story)

- [ ] T096 10-metric Adoption Metrics monitoring (FR-032)
- [ ] T097 8 configurable Adoption Category classification (Newly Activated→At-Risk Adoption) (FR-033)
- [ ] T098 10-type Adoption Campaign support (FR-034)
- [ ] T099 AI Adoption Intelligence (Feature Recommendations, Adoption Predictions, Usage Pattern Analysis, Product Health Analysis, Behavior Modeling, Personalized Plans) with confidence and evidence (FR-035)
- [ ] T100 10 configurable Success Playbook categories + custom, wired to T010 (FR-036)
- [ ] T101 Playbook full field set (Objectives, Tasks, Milestones, Success Metrics, Communication Templates, Automation Rules, Escalation Policies, AI Recommendations, Review Checkpoints, Completion Criteria) (FR-037)
- [ ] T102 7-capability playbook execution automation (FR-038)
- [ ] T103 AI Playbook Intelligence (Best-Fit Playbooks, Personalized Task Sequences, Customer-Specific Adjustments, Risk Mitigation, Success Opportunities, Improvement Suggestions) (FR-039)
- [ ] T104 12-channel customer engagement support (FR-040)
- [ ] T105 10-type engagement activity support (FR-041)
- [ ] T106 9-metric Engagement Analytics (FR-042)
- [ ] T107 AI Engagement Intelligence (Best Channels, Optimal Times, Personalized Messaging, Engagement Strategies, Risk-Based Outreach, Relationship Improvements), advisory-only (FR-043)
- [ ] T108 Adoption Intelligence Dashboard (12 elements) with transparent/explainable/auditable AI forecasts + configurable exportable reports (FR-044)
- [ ] T109 10-type Advocacy Program support, wired to T016 (FR-062)
- [ ] T110 7-capability customer advocacy participation (testimonials, webinars, referrals, experience sharing, advisory councils, community mentoring, feedback sessions), routing referrals through `030` per T023's note (FR-063)
- [ ] T111 8 configurable Advocacy Reward types, reusing `006`/`009`'s ledger per T023's note (FR-064)
- [ ] T112 AI Advocacy Intelligence (Ideal Candidates, Referral Opportunities, Success Story Identification, Recognition Plans, Community Leadership, Ambassador Programs) (FR-065)
- [ ] T113 Customer Success Intelligence Dashboard (12 elements) with transparent/explainable/auditable AI CLV forecasts + configurable exportable reports (FR-066)
- [ ] T114 [P] Product Adoption/Playbook/Engagement/Advocacy Dashboards UI

---

## Phase 13: Customer Success Portal & Sub-Portals (supports FR-067–FR-076; cross-cutting, no single owning story)

- [ ] T115 Unified Customer Success Portal (15 modules) with responsive web/mobile experiences (FR-067)
- [ ] T116 Customer Dashboard (12 widget types) configurable by role and subscription level (FR-068)
- [ ] T117 Portal security (RBAC, MFA, SSO, Session Management, Device Management, API Security, Audit Logging, Data Encryption, Privacy Controls, Security Notifications) (FR-069)
- [ ] T118 Customer Learning Portal (10 components) + 8 browse/enroll/track/certify capabilities, reusing `004`'s LMS content per T024's note (FR-070)
- [ ] T119 AI Learning Intelligence (Personalized Learning Paths, Skill Development Plans, Course Recommendations, Certification Readiness, Learning Priorities, Business Improvement Suggestions), advisory-only (FR-071)
- [ ] T120 8-metric Learning Analytics (FR-072)
- [ ] T121 Customer Self-Service Portal (10 components) (FR-073)
- [ ] T122 7-capability self-service automation (troubleshooting, smart search, guided diagnostics, product recommendations, self-healing workflows, automated requests, intelligent suggestions) with explainable/reviewable AI responses (FR-074)
- [ ] T123 Customer Community Portal (10 features) + moderation (6 controls) + 7-metric community analytics, reusing `005`'s Community content per T024's note (FR-075)
- [ ] T124 Customer Success Executive Portal (13 elements + 9 analytics types) + configurable exportable reports (FR-076)
- [ ] T125 [P] Customer Success Portal & Sub-Portals UI

---

## Phase 14: Polish — Governance, Security, Scalability & Final Validation

- [ ] T126 Immutable, fully auditable history for every customer operation (onboarding, adoption, renewal, expansion) (FR-080)
- [ ] T127 Cross-CSOS AI confidence-score/rationale requirement + advisory-unless-approved enforcement (FR-081)
- [ ] T128 Encryption at rest/in transit + RBAC/MFA/SSO across the Customer Success platform (FR-082)
- [ ] T129 Enterprise-scale (millions of customers) support + independent analytics/AI processing + multi-region/multi-language/multi-currency/multi-tenant architecture (FR-083)
- [ ] T130 Resolve and document the 12 preserved NEEDS CLARIFICATION items from plan.md §6 not already closed by `research.md`, including explicit user confirmation of the `044` Customer-Success-Platform ownership-reversal finding (plan.md §3)
- [ ] T131 Final audit: cross-check every FR-001–FR-083 against an implementation or validation task; re-verify the `013`, `040`, `030`, and `008` reuse decisions are respected, and — if the `044` correction is confirmed — flag `044/plan.md`'s Summary and §3 for the same kind of corrective edit applied to `027/plan.md` earlier this session
- [ ] T132 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `013`'s base Customer/Health-Score/Success-Plan/Onboarding entities and `040`'s Churn Prediction Engine, and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US4, US5, US6)**: US1 (Customer 360° Workspace) is the authoritative source of truth every other capability reads from and writes to, and must land first; US2 (Onboarding) depends on US1's customer record existing; US4 (Health Score), US5 (Churn Prediction), and US6 (Renewal) are independent of each other and of US2, and can build in parallel once US1 is complete.
- **P2 stories (US7, US8)**: US7 (Expansion) depends on US4's Health Score and US6's Renewal data existing as inputs; US8 (AI Copilot) is an accelerant layered on top of every other capability and should land after at least US4–US6 exist to summarize.
- **P3 story (US3)** depends on US2's onboarding stages existing as the baseline Activation Milestones are tracked independently against, and should land after US2.
- **Phase 11 (Registration/Segmentation/Journey/Success-Planning/Intelligence-Dashboard remainder)** depends on Foundational and US1; should land alongside US2.
- **Phase 12 (Product-Adoption/Playbook-Catalog/Engagement/Advocacy remainder)** depends on Foundational and US5's Prevention Playbook catalog; should land alongside US7.
- **Phase 13 (Customer Success Portal & Sub-Portals)** depends on Foundational and US8 (the Portal bundles the AI Copilot); should land last among the supplementary phases.
- **Polish (Phase 14)** depends on all desired stories and phases being complete, and MUST include explicit resolution of the `044` ownership-reversal finding before sign-off.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (customer-360-single-workspace-view, renewal-discount-requires-human-approval, ai-copilot-output-requires-human-approval-before-customer-facing-action) pass → US1 (Customer 360° Workspace) → **STOP and VALIDATE** the single source of truth is sound → US2 (Onboarding Tracks) → US4 (Health Score) + US5 (Churn Prediction/Prevention) + US6 (Renewal) in parallel → **STOP and VALIDATE** every AI-gated approval (renewal discount, churn recommendation) blocks correctly → US3 (Activation Milestones) + Phase 11 (registration/segmentation/journey/success-planning remainder) → US7 (Expansion) + Phase 12 (adoption/playbook/engagement/advocacy remainder) → US8 (AI Copilot) + Phase 13 (Customer Success Portal & Sub-Portals) → Polish, including explicit confirmation of the `044` correction.
