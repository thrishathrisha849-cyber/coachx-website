---
description: "Task list for Feature 052 — Enterprise Customer Experience Management (CXM)"
---

# Tasks: Enterprise Customer Experience Management (CXM)

**Input**: Design documents from `/specs/052-enterprise-cxm/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 044, 047, 040, 030, 001/016, 006/009, and the not-yet-planned 070), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC). This feature also assumes `044`'s Journey/Touchpoint/CX Governance mechanics, `047`'s Customer Health Score/Success Playbook engine (consumed via `044`), `040`'s Churn Prediction Engine/CLV framework, and `030`'s referral execution engine exist as consumption points.

**Tests**: Included throughout — AI-risk-flag human-review gating, Data-Subject-Request retention-hold handling, and compliance-critical-AI zero-autonomous-execution each get a dedicated Foundational contract test, matching this spec's own SC-002, SC-003, and SC-005.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (Unified Profile/Journey/Touchpoint remainder; Customer Success Platform remainder; Compliance Framework remainder; Communication Center; Executive Dashboard/Analytics remainder).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC), and that `044`'s Journey/Touchpoint mechanics, `047`'s Customer Health Score/Success Playbook engine, `040`'s Churn Prediction Engine/CLV framework, and `030`'s referral execution engine exist as consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: GDPR-vs-DPDP regulatory precedence, open-critical-escalation Health-Score floor/cap rule, conflicting-AI-signal reconciliation (Churn Risk vs. Upsell), bias-flagged-model suspension-vs-continued-serving policy, multi-category-feedback-plus-duplicate-detection interplay, high-impact-approval-gate automation-pause scope
- [ ] T003 [P] Add `backend/src/modules/cxm/{platform-scope-lifecycle,unified-profile-journey-omnichannel,customer-success-platform,ai-customer-intelligence,ai-risk-detection,ai-governance,compliance-framework,consent-data-rights,customer-feedback-management,loyalty-engagement-automation,customer-communication-center,experience-governance-analytics-portal}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Customer Intelligence Profile` entity in `backend/src/modules/cxm/ai-customer-intelligence/customer-intelligence-profile.entity.ts`
- [ ] T005 [P] Define the `Unified Customer Profile` entity in `backend/src/modules/cxm/unified-profile-journey-omnichannel/unified-customer-profile.entity.ts`
- [ ] T006 [P] Define the `Risk Signal` entity in `backend/src/modules/cxm/ai-risk-detection/risk-signal.entity.ts`
- [ ] T007 [P] Define the `Customer Journey / Journey Touchpoint` entity in `backend/src/modules/cxm/unified-profile-journey-omnichannel/customer-journey-touchpoint.entity.ts`
- [ ] T008 [P] Define the `Customer Health Score` entity in `backend/src/modules/cxm/customer-success-platform/customer-health-score.entity.ts`
- [ ] T009 [P] Define the `Consent Record` entity in `backend/src/modules/cxm/consent-data-rights/consent-record.entity.ts`
- [ ] T010 [P] Define the `Data Subject Request` entity in `backend/src/modules/cxm/consent-data-rights/data-subject-request.entity.ts`
- [ ] T011 [P] Define the `AI Governance Record` entity in `backend/src/modules/cxm/ai-governance/ai-governance-record.entity.ts`
- [ ] T012 [P] Define the `Engagement Automation Rule` entity in `backend/src/modules/cxm/loyalty-engagement-automation/engagement-automation-rule.entity.ts`
- [ ] T013 [P] Define the `Feedback Record` entity in `backend/src/modules/cxm/customer-feedback-management/feedback-record.entity.ts`
- [ ] T014 [P] Define the `Loyalty Profile / Reward Event` entity in `backend/src/modules/cxm/loyalty-engagement-automation/loyalty-profile.entity.ts`
- [ ] T015 [P] Define the `Communication Record` entity in `backend/src/modules/cxm/customer-communication-center/communication-record.entity.ts`
- [ ] T016 [P] Define the `Experience Governance Policy / Governance Record` entity in `backend/src/modules/cxm/experience-governance-analytics-portal/experience-governance-record.entity.ts`
- [ ] T017 [P] Define the `Customer Segment` entity in `backend/src/modules/cxm/unified-profile-journey-omnichannel/customer-segment.entity.ts`
- [ ] T018 Unify customer data/engagement/channels/support/behavioral-analytics/AI-insights/journey-orchestration into one intelligent CXM platform (FR-001)
- [ ] T019 Implement the full defined Platform Scope (14 named capability areas) (FR-002)
- [ ] T020 Prohibited-integration guardrails: no ERP/Financial/Payroll/HRMS/MES/source-repo/infra-monitoring replacement, with required integration where needed (FR-003)
- [ ] T021 Implement the 5-layer architecture (Interaction Sources, Data Processing, Experience Intelligence, AI Customer Intelligence, Experience Delivery) (FR-004)
- [ ] T022 Implement the governed 15-stage Customer Lifecycle (Visitor→Historical Archive) with configurable workflows/AI/personalization/governance/analytics/audit per stage (FR-005)
- [ ] T023 Implement the 12-phase Customer Experience Operating Model (FR-006)
- [ ] T024 Note: this feature consumes `044`'s Journey Mapping/Touchpoint/CX Governance mechanics rather than rebuilding a second journey-mapping engine (per plan.md §1)
- [ ] T025 Note: Customer Success Platform content (Health Score, Success Playbooks, Renewal/Expansion) traces through `044` to `047` as the ultimate canonical source — not redefined here (per plan.md §2)
- [ ] T026 Note: AI Customer Intelligence (Churn/CLV/Health Forecast) consumes `040`'s Churn Prediction Engine/CLV framework and `047`'s Customer Health Score rather than computing a fourth independent model; this feature's genuinely new ground is the AI Governance & Compliance layer wrapped around those outputs (per plan.md §3)
- [ ] T027 Note: Loyalty Referral Programs consume `030`'s canonical referral-link/reward/fraud execution engine rather than rebuilding it (per plan.md §4)
- [ ] T028 Note: this feature is the canonical, first-appearance owner of the platform's Data Subject Request (Right to Access/Rectification/Erasure) workflow — confirmed as new ground, not a duplication (per plan.md §5)
- [ ] T029 Contract test: zero AI Risk Detection flag triggers a customer-facing retention action without routing to a human-reviewable queue first, in `backend/tests/contract/ai-risk-flag-human-review-before-action.contract.test.ts` (FR-026, SC-002)
- [ ] T030 Contract test: zero Data Subject Request results in a silent deletion of records under an active retention hold, in `backend/tests/contract/data-subject-request-retention-hold-no-silent-deletion.contract.test.ts` (FR-039, SC-003)
- [ ] T031 Contract test: zero AI-generated recommendation classified as compliance-critical or security-sensitive executes without mandatory human review, in `backend/tests/contract/compliance-critical-ai-zero-autonomous-execution.contract.test.ts` (FR-032, SC-005)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — AI Customer Intelligence Computes Churn, CLV, Next-Best-Action & Health Forecast (Priority: P1) 🎯 MVP

**Independent Test**: Seed one test customer profile with purchase, engagement, and support history, run the AI Customer Intelligence engine, and confirm it produces a Churn Prediction, a CLV estimate, a Customer Health Forecast, and at least one Next Best Action recommendation — each with a confidence score and supporting rationale.

- [ ] T032 [US1] AI Customer Intelligence Platform continuous analysis of behavior/interactions/preferences/journeys/outcomes, wired to T004 and T026's `040`-consumption note, acceptance scenario 1 (FR-020)
- [ ] T033 [US1] 11 AI Intelligence outputs (Segmentation, Churn, Purchase, Intent, Sentiment, CLV, Recommendation Engine, Health Forecast, Journey Optimization, Personalized Experiences, Next Best Action, Executive Insights), consuming `040`'s Churn/CLV and `047`'s Health Score per T026's note, acceptance scenario 1 (FR-021)
- [ ] T034 [US1] AI Recommendation Engine (10 recommendation types: Products, Services, Learning Content, Community Groups, Support Articles, Marketing Campaigns, Renewal Offers, Cross-Sell, Upsell, Success Actions) (FR-022)
- [ ] T035 [US1] AI Journey Intelligence (10 outputs: Journey Predictions, Churn Signals, Purchase/Support Intent, Expansion Opportunities, Journey Risk Analysis, Journey Optimization, Personalized NBA, Recommended Communications, Behavior Forecasting) (FR-023)
- [ ] T036 [US1] AI Engagement Intelligence (10 outputs: Best Channel, Best Time, Personalized Messaging, Intent, Engagement Opportunities, Campaign Optimization, Follow-Up Timing, Channel Effectiveness, Mood Analysis, Retention Actions) (FR-024)
- [ ] T037 [US1] AI Executive Insights (Customer Experience Summary, Health Forecast, Churn Forecast, Growth Opportunities, Journey Optimization Recommendations, Engagement Suggestions, Executive Alerts, Satisfaction Improvement Plans, Revenue Impact Analysis, Experience Benchmarking), explainable/role-aware/configurable/traceable/auditable, wired to acceptance scenario 3 (FR-025)
- [ ] T038 [P] [US1] AI Customer Intelligence Dashboard UI
- [ ] T039 [US1] Integration test: a sufficient-history customer produces Churn/Purchase/CLV/Health-Forecast/NBA outputs each with a confidence score, an NBA recommendation surfaced to a CS team member remains advisory requiring human review, an executive's AI Executive Insights request returns an explainable/role-aware/traceable/auditable summary set, corrected underlying data triggers a recompute-and-resurface rather than leaving a stale prediction visible — all 4 acceptance scenarios in `backend/tests/integration/us1-ai-customer-intelligence.integration.test.ts`

**Checkpoint**: The analytical core the chapter is named for, feeding nearly every downstream proactive capability, is independently functional.

---

## Phase 4: User Story 2 — AI Risk Detection Flags Churn, Payment, Escalation, Renewal & Dissatisfaction Risk (Priority: P1)

**Independent Test**: Seed a test account with declining login frequency, a missed payment, and an open high-priority support ticket, run AI Risk Detection, and confirm the account is flagged for at least Churn Risk and Payment Risk, appears in the Customer Success Dashboard's At-Risk Customers view, and that no communication or account change is sent/applied automatically without a human review step.

- [ ] T040 [US2] 10-signal AI Risk Detection (Churn Risk, Dissatisfaction, Reduced Engagement, Payment Risk, Support Escalation, Negative Sentiment, Inactive Customers, Adoption Gaps, Renewal Risks, Customer Complaints), wired to T006, acceptance scenarios 1–3 (FR-026)
- [ ] T041 [US2] Customer Success Dashboard (Customer Health, At-Risk Customers, Renewal Pipeline, Expansion Pipeline, Adoption Trends, Success Tasks, Customer Goals, Executive Reviews, Satisfaction Scores, Churn Predictions), wired to T008 (FR-019)
- [ ] T042 [P] [US2] Risk Detection & At-Risk Customers Dashboard UI
- [ ] T043 [US2] Integration test: a declining-usage/login/sentiment account flags Churn Risk and Reduced Engagement appearing in the At-Risk Customers view, a failed-payment account flags Payment Risk distinctly from Churn Risk, an open escalated ticket flags Support Escalation visible on Governance and Customer Success views, multiple same-window risk types are presented together rather than as separate uncorrelated alerts — all 4 acceptance scenarios in `backend/tests/integration/us2-ai-risk-detection.integration.test.ts`

**Checkpoint**: The platform's principal proactive-retention mechanism, triggering nearly every Success Workflow/Playbook/Engagement Automation, is independently functional.

---

## Phase 5: User Story 3 — Data Subject Exercises Right to Erasure, Access, or Rectification Under the Compliance Framework (Priority: P1)

**Independent Test**: Submit one Right to Access request and one Right to Erasure request for two separate test customer profiles, confirming the Access request returns a complete data export and the Erasure request either fully deletes the profile or is correctly blocked/partially fulfilled with a logged reason when a retention conflict exists.

- [ ] T044 [US3] Privacy Management (Consent Collection/Withdrawal, Cookie/Marketing/Communication Preferences, Data Export, Right to Access/Rectification/Erasure, Retention Policies, Privacy Audit Logs), wired to T010, acceptance scenarios 1–4 (FR-039)
- [ ] T045 [US3] Pre-processing Consent Validation (Layer 2) before behavioral tracking/segmentation/personalization, with immediate withdrawal propagation to in-flight automation, wired to T009 and T030's contract test (FR-041)
- [ ] T046 [P] [US3] Data Subject Request & Privacy Center UI
- [ ] T047 [US3] Integration test: a Right to Access request returns a complete data export logged in the Privacy Audit Log, a Right to Rectification correction updates the Unified Customer Profile and logs the change, a no-conflict Right to Erasure performs Secure Deletion and logs completion, a retention-hold-conflicted Erasure request is flagged for compliance review rather than silently deleted — all 4 acceptance scenarios in `backend/tests/integration/us3-data-subject-request.integration.test.ts`

**Checkpoint**: The hard compliance requirement carrying direct legal exposure if mishandled is independently functional.

---

## Phase 6: User Story 4 — AI Governance Enforces PII Detection, Bias Monitoring & Human Oversight for Compliance-Critical Decisions (Priority: P1)

**Independent Test**: Submit one AI Customer Intelligence output for review confirming a confidence score and explainability trace; run AI Bias Monitoring against a test model confirming a detected bias produces a reviewable governance alert; confirm a PII string injected into a test AI prompt/response is detected and blocked from logging in cleartext.

- [ ] T048 [US4] AI Governance (Explainable AI, Confidence Scores, Human Review, Prompt Logging, Model Monitoring, Bias Detection, Privacy Controls, Consent Validation, Audit Logging, Regulatory Compliance), wired to T011, acceptance scenario 1 (FR-027)
- [ ] T049 [US4] Confidence scores on every AI recommendation + mandatory human approval for critical business actions (FR-028)
- [ ] T050 [US4] AI explainability/auditability + hard block on customer-data use beyond approved consent boundaries (FR-029)
- [ ] T051 [US4] Configurable human-approval gates for 5 high-impact engagement-automation action types (contract renewals, pricing decisions, refunds, legal communications, executive escalations) (FR-030)
- [ ] T052 [US4] AI Security & Privacy Governance (Prompt Monitoring, Model Version Tracking, Explainable AI, Consent Validation, PII Detection, Data Leakage Prevention, AI Bias Monitoring, Security Risk Scoring, Compliance Reporting, Audit Trail Generation), wired to acceptance scenario 3 (FR-031)
- [ ] T053 [US4] Hard rule: human oversight mandatory for all security-sensitive/compliance-critical AI decisions, wired to T031's contract test, acceptance scenario 4 (FR-032)
- [ ] T054 [US4] AI Governance Intelligence (Policy Violation Detection, Compliance Recommendations, Risk Forecasting, Service Quality Analysis, Experience Gap Detection, Executive Governance Reports, Continuous Improvement Suggestions, Operational Risk Alerts, AI Transparency Reports, Governance Performance Metrics) (FR-033)
- [ ] T055 [P] [US4] AI Governance Control Center UI
- [ ] T056 [US4] Integration test: any AI recommendation includes a confidence score, is logged for audit, and remains reviewable/explainable, a detected model-bias skew raises a governance alert for human review rather than continuing unreviewed, PII in an AI prompt/response is flagged/redacted before cleartext persistence, a compliance-critical/security-sensitive AI recommendation routes to mandatory human review with zero autonomous execution — all 4 acceptance scenarios in `backend/tests/integration/us4-ai-governance.integration.test.ts`

**Checkpoint**: The direct enforcement mechanism for "AI Is Assistive, Never Autonomous" as applied to customer data, which every other AI capability in this spec depends on, is independently functional.

---

## Phase 7: User Story 5 — Omnichannel Engagement Automation Delivers Consistent, AI-Timed Communications Across Channels (Priority: P2)

**Independent Test**: Configure one automation workflow with a trigger, a wait condition, and an approval gate for a high-impact step; enroll one test customer; confirm AI Engagement Intelligence selects a channel/time recommendation; confirm the message is logged in Unified Conversation History; confirm withdrawing consent for that channel mid-workflow halts further sends immediately.

- [ ] T057 [US5] Omnichannel engagement across 14 channels, wired to T015 (FR-014)
- [ ] T058 [US5] Unified Conversation History (context, routing, handoff, preference management, scheduling, delivery tracking, read receipts, response analytics, automated escalation) across all channels, wired to acceptance scenario 4 (FR-015)
- [ ] T059 [US5] Configurable-trigger Customer Engagement Automation (14 trigger types) across 12 automated program types, wired to T012, acceptance scenario 1 (FR-047)
- [ ] T060 [US5] Workflow Builder (Trigger Conditions, Decision Rules, Wait Conditions, Branching Logic, Approval Gates, Exception Handling, Retry Policies, Workflow Monitoring, Audit Logs), wired to acceptance scenarios 2–3 (FR-048)
- [ ] T061 [P] [US5] Engagement Automation Workflow Builder UI
- [ ] T062 [US5] Integration test: a renewal-approaching trigger produces an AI channel/time recommendation logged in Unified Conversation History, a high-impact-step approval gate pauses for explicit human approval and is never executed autonomously, a mid-workflow WhatsApp consent withdrawal halts in-flight sends on that channel immediately while other channels continue, a cross-channel customer interaction preserves Cross-Channel Context and supports Conversation Handoff — all 4 acceptance scenarios in `backend/tests/integration/us5-omnichannel-engagement-automation.integration.test.ts`

**Checkpoint**: The primary mechanism turning AI Customer Intelligence and Risk Detection signals into actual customer-facing outcomes at scale is independently functional.

---

## Phase 8: User Story 6 — Customer Uses the Enterprise Experience Portal for Self-Service Across the Lifecycle (Priority: P2)

**Independent Test**: Log in as one test customer, confirm the Personalized Home Dashboard renders content specific to that customer, and complete at least three self-service actions end-to-end without any agent intervention.

- [ ] T063 [US6] Customer self-service (profile, subscription, invoice, payment method, notification, communication-preference management) + Privacy & Consent Management as a dedicated Portal module, wired to T005, acceptance scenarios 1–4 (FR-040)
- [ ] T064 [US6] Enterprise Customer Experience Portal (20 modules) unifying Learning/Community/Support/Subscriptions/Communication/CS/Loyalty/Feedback/AI-Assistance/Self-Service across web/mobile/tablet/desktop, wired to acceptance scenario 1 (FR-054)
- [ ] T065 [P] [US6] Enterprise Customer Experience Portal UI
- [ ] T066 [US6] Integration test: an authenticated customer's Personalized Home Dashboard displays Learning/Subscription/Loyalty/AI-Recommendation content adapted to behavior/interests/tier, a Subscription Center payment-method change/invoice download completes without agent involvement, a Loyalty Center redemption records against the Loyalty Profile and reflects immediately in the Reward Points balance, a Settings communication-preference/consent change takes effect platform-wide without delay — all 4 acceptance scenarios in `backend/tests/integration/us6-enterprise-experience-portal.integration.test.ts`

**Checkpoint**: The customer-facing surface unifying every other capability in this chapter, reducing customer effort and increasing self-service adoption, is independently functional.

---

## Phase 9: User Story 7 — CX Team Collects Feedback and Operates the Loyalty Program (Priority: P2)

**Independent Test**: Submit one feedback item through a survey and one through a support ticket, confirming both are auto-classified with a category and sentiment score, and trigger one Reward Engine event confirming Reward Points and an updated Loyalty Profile result.

- [ ] T067 [US7] Feedback collection/analysis/classification/prioritization/action across 19 named sources, wired to T013, acceptance scenario 1 (FR-042)
- [ ] T068 [US7] Feedback Record full field set (17 fields) (FR-043)
- [ ] T069 [US7] AI Feedback Intelligence (Sentiment Analysis, Emotion Detection, Topic Classification, Duplicate Feedback Detection, Urgency Detection, Trend Identification, Root Cause Analysis, Suggested Responses, Product Improvement Recommendations, Executive Summaries), wired to acceptance scenario 2 (FR-044)
- [ ] T070 [US7] 12 Loyalty Program types with Loyalty Profile full field set (12 fields), wired to T014 (FR-045)
- [ ] T071 [US7] Reward Engine automatic award across 10 qualifying activity types, extending `030`'s referral engine per T027's note, wired to acceptance scenarios 3–4 (FR-046)
- [ ] T072 [P] [US7] Feedback & Loyalty Management UI
- [ ] T073 [US7] Integration test: survey/ticket/review feedback records Category/Sentiment/Priority/Team/Status with AI Sentiment/Topic attached, cross-channel same-issue feedback flags a likely duplicate for human confirmation rather than silent merge/discard, a course-completion event auto-awards a Reward Engine benefit and updates the Loyalty Profile, a milestone-reaching Loyalty Profile surfaces an AI VIP-Candidate/Personalized-Reward recommendation requiring CX review rather than an automatic grant — all 4 acceptance scenarios in `backend/tests/integration/us7-feedback-loyalty.integration.test.ts`

**Checkpoint**: The chapter's mechanisms for capturing customer voice and reinforcing retention/advocacy are independently functional.

---

## Phase 10: User Story 8 — Governance Committee Monitors SLA, Compliance & AI Policy Violations via the Governance Dashboard (Priority: P3)

**Independent Test**: Seed one SLA breach and one AI Bias Monitoring alert, confirm both appear in Governance Monitoring, and confirm a Governance reviewer can record a Corrective Action captured in an immutable Audit Log and reflected in Governance Reporting.

- [ ] T074 [US8] Customer Experience Governance Platform (11 policy/standard categories: Experience Policies, Standards, SLAs, Response Standards, Escalation Policies, Privacy Policies, Accessibility Standards, AI Governance, QA, Compliance Management, Risk Management), wired to T016 (FR-050)
- [ ] T075 [US8] 10 Governance Workflow types (Policy Reviews, Compliance Audits, Experience Reviews, Executive Approvals, Risk Assessments, Incident Management, Corrective Actions, Continuous Improvement, Governance Reporting, Audit Logging), wired to acceptance scenarios 1–3 (FR-051)
- [ ] T076 [US8] 10-metric Governance Monitoring (SLA Compliance, Customer Satisfaction, Response/Resolution Times, Escalations, Complaint Resolution, Accessibility Compliance, Privacy Compliance, Communication Quality, AI Compliance), wired to acceptance scenario 1 (FR-035)
- [ ] T077 [P] [US8] Governance Monitoring & Corrective Action UI
- [ ] T078 [US8] Integration test: an SLA-breaching support response is captured in Governance Monitoring and visible in Governance Reporting, an AI Governance Policy Violation Detection alert routes to a governance reviewer logged with the policy and evidence, a recorded Corrective Action against a flagged violation is captured in the immutable Audit Log and reflected in Governance Performance Metrics — all 3 acceptance scenarios in `backend/tests/integration/us8-governance-dashboard.integration.test.ts`

**Checkpoint**: The cross-cutting control and audit layer essential for compliance is independently functional.

---

## Phase 11: Unified Profile/Journey/Touchpoint remainder, Customer Success Platform remainder, Compliance Framework remainder, Communication Center, Executive Dashboard/Analytics remainder (supports FR-007–FR-013, FR-016–FR-018, FR-034, FR-036–FR-038, FR-049, FR-052–FR-053; cross-cutting, no single owning story)

- [ ] T079 Real-time 360-degree customer profile access for every authorized team, wired to T005 (FR-007)
- [ ] T080 Unified Customer Profile full field set (21 fields) (FR-008)
- [ ] T081 Chronological Customer Interaction Timeline (19 event types) (FR-009)
- [ ] T082 Personalization across 12 surface types (Home Screens, Product Recommendations, Marketing Campaigns, Learning Content, Support Articles, etc.) (FR-010)
- [ ] T083 Dynamic Customer Segmentation (13 criteria), wired to T017 (FR-011)
- [ ] T084 Customer Journey Intelligence across 14 journey stages with 10 journey-mapping capabilities, wired to T007 (FR-012)
- [ ] T085 Journey Touchpoint monitoring (13 types) plus 10 journey-performance metrics (FR-013)
- [ ] T086 Proactive customer management (Health Monitoring, Success Planning, Onboarding Programs, Adoption Tracking, Success Milestones, Business Reviews, Success Playbooks, Renewal Planning, Expansion Planning, Risk Management), consuming `047`'s engine via `044` per T025's note, wired to T008 (FR-016)
- [ ] T087 Customer Health Score calculation (10 input factors), consuming `047`'s canonical score per T025's note (FR-017)
- [ ] T088 10 configurable Success Workflow types (Automated Onboarding, Health Alerts, Renewal Workflows, Escalation Management, Risk Mitigation Plans, Executive Reviews, Success Meetings, Customer Check-Ins, Expansion Opportunities, Retention Campaigns) (FR-018)
- [ ] T089 7 named compliance frameworks (GDPR, CCPA, DPDP Act, ISO 27001, SOC 2, PCI DSS, WCAG) with configurable extensibility for future regulations (FR-034)
- [ ] T090 10-signal Security Monitoring (Login Attempts, Suspicious Activities, Device Changes, Location Anomalies, Failed Authentication, Unauthorized Access, API Misuse, Data Leakage Risks, AI Misuse, Compliance Violations) (FR-036)
- [ ] T091 Identity & Access Management (Secure Registration, Email/OTP Verification, MFA, SSO, Passwordless, Biometric, Device Registration, Session Management, Adaptive/Risk-Based Authentication, Account Recovery) (FR-037)
- [ ] T092 Customer Data Protection (Encryption at Rest/in Transit, Tokenization, Secure Key Management, Backup Encryption, Secure Data Sync, Data Masking, Data Classification, Secure Archival, Secure Deletion) (FR-038)
- [ ] T093 Unified Customer Communication Center across 12 communication types and 12 channels with Templates, Personalization Tokens, Multi-Language Messaging, Scheduling, Automation, Read Receipts, Delivery Reports, Response Tracking, Preferences, Opt-In/Opt-Out, Conversation History, wired to T015 (FR-049)
- [ ] T094 Executive Dashboard (15 metric categories: Total/Active/New/Returning Customers, CSAT, NPS, CES, Health Score, Retention, Churn, Revenue Growth, CLV, Adoption, Engagement, AI Optimization) (FR-052)
- [ ] T095 Customer Analytics & Performance Intelligence (17 measured metrics) with explainable/traceable/configurable/fully auditable AI analytics (FR-053)
- [ ] T096 [P] Unified Profile/Journey/Success/Compliance/Communication/Analytics Dashboards UI

---

## Phase 12: Polish — Final Validation

- [ ] T097 Enterprise-scale (millions of customer profiles) support with near-real-time journey processing and multi-region/multilingual/multi-tenant architecture (FR-055)
- [ ] T098 Resolve and document the 6 preserved NEEDS CLARIFICATION items from plan.md §8 not already closed by `research.md`
- [ ] T099 Final audit: cross-check every FR-001–FR-055 against an implementation or validation task; re-verify the `044`, `047` (via `044`), `040`, `030`, `001`/`016`, `006`/`009`, and `008` reuse decisions are respected
- [ ] T100 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `044`'s Journey/Touchpoint mechanics, `047`'s Health Score engine (via `044`), `040`'s Churn/CLV framework, and `030`'s referral engine, and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US3, US4)**: US1 (AI Customer Intelligence) is the analytical core feeding nearly every downstream capability and should land first; US2 (Risk Detection), US3 (Data Subject Request), and US4 (AI Governance) are independent of each other and of US1's depth, and can build in parallel once US1's core exists — US4 in particular is the enforcement layer every other AI capability depends on.
- **P2 stories (US5, US6, US7)**: US5 (Engagement Automation) depends on US1/US2's signals to trigger on; US6 (Experience Portal) depends on the Unified Customer Profile, Loyalty, and Communication capabilities already existing as backing data; US7 (Feedback/Loyalty) operates on top of the customer profile and AI intelligence layer already established.
- **P3 story (US8)** depends on the underlying capabilities it governs (Journey, Success, Feedback, AI Intelligence) already existing and producing events to monitor, and should land last among the numbered stories.
- **Phase 11 (Unified Profile/Journey/Success/Compliance/Communication/Analytics remainder)** depends on Foundational, US1, and US4; should land alongside US5/US7.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (ai-risk-flag-human-review-before-action, data-subject-request-retention-hold-no-silent-deletion, compliance-critical-ai-zero-autonomous-execution) pass → US1 (AI Customer Intelligence) → **STOP and VALIDATE** every prediction carries a confidence score and consumes rather than recomputes 040/047's models → US2 (Risk Detection) + US3 (Data Subject Request) + US4 (AI Governance) → **STOP and VALIDATE** zero autonomous execution across every AI-touching surface → US5 (Engagement Automation) + Phase 11 (Unified Profile/Success/Compliance/Communication remainder) → US6 (Experience Portal) + US7 (Feedback/Loyalty) → US8 (Governance Dashboard) → Polish.
