---
description: "Task list for Feature 046 — Enterprise Partner Relationship Management (PRM/PEOS)"
---

# Tasks: Enterprise Partner Relationship Management (PRM/PEOS)

**Input**: Design documents from `/specs/046-partner-relationship-management/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 030, 045, 013, 003, and 009), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC reused via `016`). This feature also assumes `030`'s Partner Wallet ledger/Fraud Risk Score/Commission Rule entities, `045`'s Opportunity entity, and `013`'s Lead entity exist as consumption points.

**Tests**: Included throughout — partner-lifecycle audit-trail completeness, verification never-auto-approving, and incentive/commission Finance+Executive approval gating each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-002, and SC-004.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus three supplementary cross-cutting phases for FR groups not owned by any single prioritized story (registration/onboarding/success-management/intelligence-dashboard remainder; channel-opportunity/lead-distribution/channel-performance remainder; affiliate-registration/affiliate-performance/portal-sub-module remainder).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC reused via `016`), and that `030`'s Partner Wallet ledger/Fraud Risk Score/Commission Rule entities, `045`'s Opportunity entity, and `013`'s Lead entity exist as consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: deal-registration conflict merge/arbitration rule, protection-period-expiration default behavior, MDF budget-overrun handling, fraud false-positive reinstatement path, lapsed-certification effect on in-flight deals/incentives, lead-rejection-reassignment priority effect, duplicate-partner-registration handling, health-score-decline retroactive effect, AI-vs-human community-moderation requirement, dual-role partner identity/wallet question
- [ ] T003 [P] Add `backend/src/modules/prm/{partner-lifecycle-operating-model,partner-registration,partner-verification-due-diligence,partner-onboarding,partner-certification,partner-success-management,partner-intelligence-dashboard,channel-sales-opportunity,channel-lead-distribution,deal-registration-conflict-resolution,channel-incentive-management,channel-performance-intelligence,affiliate-registration,affiliate-tracking-attribution-fraud,commission-management,affiliate-performance-intelligence,partner-portal-core,partner-learning-certification-portal,partner-marketing-resource-center,partner-support-center,partner-community-platform,partner-intelligence-portal}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Partner` entity in `backend/src/modules/prm/partner-lifecycle-operating-model/partner.entity.ts`
- [ ] T005 [P] Define the `Partner Application / Registration` entity in `backend/src/modules/prm/partner-registration/partner-application.entity.ts`
- [ ] T006 [P] Define the `Verification & Due Diligence Record` entity in `backend/src/modules/prm/partner-verification-due-diligence/verification-due-diligence-record.entity.ts`
- [ ] T007 [P] Define the `Onboarding Checklist` entity in `backend/src/modules/prm/partner-onboarding/onboarding-checklist.entity.ts`
- [ ] T008 [P] Define the `Certification` entity in `backend/src/modules/prm/partner-certification/certification.entity.ts`
- [ ] T009 [P] Define the `Channel Opportunity` entity in `backend/src/modules/prm/channel-sales-opportunity/channel-opportunity.entity.ts`
- [ ] T010 [P] Define the `Deal Registration` entity in `backend/src/modules/prm/deal-registration-conflict-resolution/deal-registration.entity.ts`
- [ ] T011 [P] Define the `Lead Assignment` entity in `backend/src/modules/prm/channel-lead-distribution/lead-assignment.entity.ts`
- [ ] T012 [P] Define the `Channel Incentive / MDF Program` entity in `backend/src/modules/prm/channel-incentive-management/channel-incentive-program.entity.ts`
- [ ] T013 [P] Define the `Commission Model / Commission Record` entity in `backend/src/modules/prm/commission-management/commission-record.entity.ts`
- [ ] T014 [P] Define the `Affiliate Profile` entity in `backend/src/modules/prm/affiliate-registration/affiliate-profile.entity.ts`
- [ ] T015 [P] Define the `Tracking / Attribution Record` entity in `backend/src/modules/prm/affiliate-tracking-attribution-fraud/tracking-attribution-record.entity.ts`
- [ ] T016 [P] Define the `Partner Portal Resource` entity in `backend/src/modules/prm/partner-marketing-resource-center/partner-portal-resource.entity.ts`
- [ ] T017 [P] Define the `Support Ticket` entity in `backend/src/modules/prm/partner-support-center/support-ticket.entity.ts`
- [ ] T018 [P] Define the `Community Post / Contribution` entity in `backend/src/modules/prm/partner-community-platform/community-post.entity.ts`
- [ ] T019 [P] Define the `Executive Dashboard / Report` entity in `backend/src/modules/prm/partner-intelligence-dashboard/executive-dashboard-report.entity.ts`
- [ ] T020 [P] Define the `Audit Record` entity in `backend/src/modules/prm/partner-lifecycle-operating-model/audit-record.entity.ts`
- [ ] T021 Partner relationships based on mutual value/transparency/shared outcomes + consistent cross-surface experience (FR-001)
- [ ] T022 AI assistance across 8 named capability areas remaining advisory only (FR-002)
- [ ] T023 RBAC-governed authorized visibility into partner revenue/performance/pipeline/certification/incentives/support/marketing/satisfaction (FR-003)
- [ ] T024 Enterprise policy/legal/revenue-sharing/compliance/audit/security/ethics requirement across every partnership (FR-004)
- [ ] T025 Implement the layered enterprise architecture (5 layers: acquisition, operations, intelligence, optimization, executive intelligence) (FR-005)
- [ ] T026 Prohibited-action guardrails: no ERP/accounting/legal-system/tax-system replacement, no direct banking execution, no automatic commercial-agreement approval, no overriding compliance processes (FR-006)
- [ ] T027 Implement the 14-phase Enterprise Partner Operating Model (Partner Recruitment→AI Optimization & Ecosystem Intelligence) (FR-008)
- [ ] T028 15 configurable partner classifications + admin-definable additional types, wired to T004 (FR-010)
- [ ] T029 Note: Channel Incentive/MDF and Commission Records post as append-only entries against `030`'s existing Partner Wallet ledger, reusing its Fraud Risk Score/Fraud Case and Commission Rule/Commission entity shape rather than a second parallel ledger; the 9-vs-10 commission-model naming mismatch with `030` is preserved, not reconciled (per plan.md §1)
- [ ] T030 Note: Channel Opportunity extends `045`'s canonical Opportunity entity rather than competing with a fully independent parallel entity/lifecycle (per plan.md §2)
- [ ] T031 Note: Channel Lead Distribution consumes `013`'s canonical Lead entity rather than defining a parallel Lead entity (per plan.md §3)
- [ ] T032 Note: Partner Portal RBAC/MFA/SSO reuses `003`'s auth/identity infrastructure; Deal/Incentive/Commission currency and tax fields reference, not redefine, `009`'s payment/tax architecture (per plan.md §4-§5)
- [ ] T033 Contract test: 100% of partner lifecycle stage transitions across all 16 stages are captured in the immutable audit log with actor/timestamp/previous-new value, in `backend/tests/contract/partner-lifecycle-full-audit-trail.contract.test.ts` (FR-007, SC-001)
- [ ] T034 Contract test: zero instances of an AI risk score alone triggering partner approval or rejection without a recorded human decision, in `backend/tests/contract/verification-never-auto-approves-or-rejects.contract.test.ts` (FR-019, SC-002)
- [ ] T035 Contract test: 100% of channel incentive and commission payments pass both Finance Review and Executive Approval, in that order, before payment processing, in `backend/tests/contract/incentive-commission-requires-finance-and-executive-approval.contract.test.ts` (FR-052/FR-070, SC-004)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — A Partner Progresses Through the 16-Stage Enterprise Partner Lifecycle (Priority: P1) 🎯 MVP

**Independent Test**: Register a partner, advance it stage-by-stage from "Prospect Partner" through "Active Partner," confirm each stage transition is recorded with actor/timestamp/previous-new value, and confirm the Partner 360° workspace surfaces the correct aggregated data at each stage.

- [ ] T036 [US1] 16-stage lifecycle implementation (Prospect Partner→Alumni/Offboarded) with configurable workflows/automation/KPIs/approvals/AI recommendations/audit logs per stage, wired to T004, acceptance scenario 1 (FR-007)
- [ ] T037 [US1] Unified Partner 360° workspace integrating commercial/operational/financial/learning/support/compliance/AI intelligence as single source of truth, wired to acceptance scenario 3 (FR-009)
- [ ] T038 [US1] Partner profile full field set (17 fields), wired to acceptance scenario 1 (FR-011)
- [ ] T039 [US1] Unified partner workspace content (17 elements), wired to acceptance scenario 3 (FR-012)
- [ ] T040 [US1] Due-diligence-approval-triggered progression to "Approved" with actor/timestamp audit capture, wired to acceptance scenario 2
- [ ] T041 [US1] Alumni/Offboarded transition retaining full historical audit history and revenue records, wired to acceptance scenario 4
- [ ] T042 [P] [US1] Partner 360° Workspace UI
- [ ] T043 [US1] Integration test: application submission creates a Prospect Partner/Applied record, due-diligence approval progresses to Approved with actor/timestamp logged, an Active Partner's workspace shows the full consolidated view, an ended relationship transitions to Alumni/Offboarded retaining history — all 4 acceptance scenarios in `backend/tests/integration/us1-partner-lifecycle.integration.test.ts`

**Checkpoint**: The foundational operating model every other PRM/PEOS capability attaches to is independently functional.

---

## Phase 4: User Story 2 — Partner Verification & Due Diligence With AI-Generated Risk Scoring (Priority: P1)

**Independent Test**: Submit a prospective partner through all ten verification components and ten due diligence categories, confirm the AI risk analysis returns a risk assessment with evidence and confidence score for review, and confirm a human reviewer makes the final approve/reject decision.

- [ ] T044 [US2] 10-component partner verification (identity, business, tax, legal, financial, compliance, risk, security, background, reference), wired to T006, acceptance scenario 1 (FR-017)
- [ ] T045 [US2] 10-category due diligence evaluation, wired to acceptance scenario 2 (FR-018)
- [ ] T046 [US2] AI risk intelligence (7 risk dimensions) with evidence and confidence score, keeping the final decision a human action, wired to T034's contract test, acceptance scenarios 2-3 (FR-019)
- [ ] T047 [US2] Verification Dashboard (7 elements), wired to acceptance scenario 3 (FR-020)
- [ ] T048 [P] [US2] Verification & Due Diligence Dashboard UI
- [ ] T049 [US2] Integration test: verification runs all 10 components and records each status, AI risk analysis produces 7 dimension assessments with evidence and confidence pending human decision, an elevated risk score surfaces on the dashboard without auto-rejecting, a finalized outcome is captured with decision/evidence/reviewer in the audit log — all 4 acceptance scenarios in `backend/tests/integration/us2-verification-due-diligence.integration.test.ts`

**Checkpoint**: The trust gate every downstream capability depends on is independently functional.

---

## Phase 5: User Story 3 — Deal Registration Protects Partner-Sourced Opportunities Through Conflict Resolution (Priority: P1)

**Independent Test**: Submit a deal registration for a customer opportunity, confirm it passes duplicate validation and becomes "Protected Opportunity," then submit a second, conflicting registration from a different partner and confirm the system surfaces a conflict for resolution.

- [ ] T050 [US3] Deal registration full field set, wired to T010, acceptance scenario 1 (FR-046)
- [ ] T051 [US3] 9-step deal registration workflow (Deal Submitted→Renewal/Expiration), wired to acceptance scenarios 1-2 (FR-047)
- [ ] T052 [US3] Conflict resolution (duplicate detection, territory validation, partner priority, executive escalation, commercial arbitration) with full auditability, wired to acceptance scenario 3 (FR-048)
- [ ] T053 [US3] Deal registration analytics (8 metrics), wired to acceptance scenario 4 (FR-049)
- [ ] T054 [P] [US3] Deal Registration & Conflict Resolution UI
- [ ] T055 [US3] Integration test: a submitted registration passes duplicate/conflict checks before internal review, an approved registration is marked Protected Opportunity with exclusivity recorded, two partners registering the same opportunity triggers territory-validation/priority-rule resolution escalating to executive arbitration when unresolved, an expiring protection period moves to a configured renewal/expiration state — all 4 acceptance scenarios in `backend/tests/integration/us3-deal-registration-conflict.integration.test.ts`

**Checkpoint**: The mechanism protecting partner trust and channel revenue predictability is independently functional.

---

## Phase 6: User Story 4 — Channel Incentive Management (Commission, MDF, Tiered Rewards) With Finance → Executive Approval (Priority: P1)

**Independent Test**: Configure an MDF or commission incentive program, drive a partner's qualifying performance through eligibility validation and calculation, confirm the incentive cannot be released without passing both Finance Review and Executive Approval in sequence, and confirm payment confirmation is recorded and auditable.

- [ ] T056 [US4] 10 configurable channel incentive program types, wired to T012, acceptance scenario 1 (FR-050)
- [ ] T057 [US4] Incentive calculation from 10 named inputs, wired to acceptance scenario 1 (FR-051)
- [ ] T058 [US4] 7-step incentive approval workflow (Performance Calculation→Payment Confirmation) with hard block on release without sequential Finance Review and Executive Approval, wired to T035's contract test, acceptance scenarios 2-3 (FR-052)
- [ ] T059 [US4] AI incentive intelligence (6 recommendation types) remaining advisory, wired to acceptance scenario 4 (FR-053)
- [ ] T060 [P] [US4] Channel Incentive Management UI
- [ ] T061 [US4] Integration test: qualifying performance data computes an incentive amount pending Finance Review, a Finance-reviewed incentive is not released until Executive Approval is explicitly recorded, an approved incentive's payment confirmation shows the full approval chain in the audit trail, an AI budget/program recommendation is advisory and requires human decision — all 4 acceptance scenarios in `backend/tests/integration/us4-channel-incentive-approval.integration.test.ts`

**Checkpoint**: The direct financial mechanism driving partner-sourced revenue is independently functional.

---

## Phase 7: User Story 5 — Partner Certification Tiers Tied to Learning Paths, Exams, and Recertification (Priority: P2)

**Independent Test**: Enroll a partner user in a certification program, complete the learning modules and assessments, pass the certification exam to receive a digital badge and certificate with a validity date, and confirm the system surfaces a recertification reminder as the validity date approaches.

- [ ] T062 [US5] 7 configurable certification levels + admin-definable additional tiers, wired to T008 (FR-025)
- [ ] T063 [US5] Certification program content (9 elements incl. exams/badges/certificates), wired to acceptance scenario 1 (FR-026)
- [ ] T064 [US5] 7-stage certification lifecycle (Enrollment→Recertification) with validity dates and renewal requirements, wired to acceptance scenario 2 (FR-027)
- [ ] T065 [US5] AI learning intelligence (5 capabilities) remaining advisory, wired to acceptance scenarios 3-4 (FR-028)
- [ ] T066 [P] [US5] Certification Center UI
- [ ] T067 [US5] Integration test: completed learning modules/labs/assessments make a partner user exam-eligible, a passed exam issues a certification level/badge/certificate with a validity date, AI-identified weak skill areas produce an advisory personalized learning path, an approaching validity date sends a recertification reminder and tracks Renewal→Recertification — all 4 acceptance scenarios in `backend/tests/integration/us5-certification-lifecycle.integration.test.ts`

**Checkpoint**: The load-bearing dependency gating incentive tiers and deal-registration eligibility elsewhere in the platform is independently functional.

---

## Phase 8: User Story 6 — Affiliate Tracking With Six Attribution Models and AI Fraud Detection (Priority: P2)

**Independent Test**: Generate a referral link, drive traffic through it under a configured attribution model, confirm clicks/leads/conversions are recorded with device/browser/session detail, and simulate bot-like traffic to confirm the AI tracking intelligence flags it for human review.

- [ ] T068 [US6] Referral link/short-URL/QR/campaign-URL/coupon/UTM/device/browser/session tracking, wired to T015, acceptance scenario 2 (FR-064)
- [ ] T069 [US6] 10-event conversion monitoring (clicks through cross-sells), wired to acceptance scenario 4 (FR-065)
- [ ] T070 [US6] 6 configurable attribution models with applied-model recorded per conversion, wired to acceptance scenario 1 (FR-066)
- [ ] T071 [US6] AI tracking intelligence (6 detection capabilities) with explainable/reviewable, never auto-actioned, alerts, wired to acceptance scenario 3 (FR-067)
- [ ] T072 [P] [US6] Affiliate Tracking & Fraud Review UI
- [ ] T073 [US6] Integration test: a Time-Decay-configured multi-touchpoint conversion attributes credit per the configured model, a recorded click captures device/browser/session/link/campaign detail, AI-flagged duplicate/bot patterns surface an explainable alert rather than silent exclusion or payment, a qualifying purchase links to the correct affiliate/campaign/model for downstream commission — all 4 acceptance scenarios in `backend/tests/integration/us6-affiliate-tracking-fraud.integration.test.ts`

**Checkpoint**: The trust foundation of the entire affiliate revenue channel is independently functional.

---

## Phase 9: User Story 7 — Commission Management With Ten Commission Models and a Full Payout Audit Trail (Priority: P2)

**Independent Test**: Configure one commission model, record a qualifying conversion, drive it through eligibility validation, fraud detection, and calculation, confirm it requires both Finance Review and Executive Approval before payment processing, and confirm every step is individually visible in the audit trail.

- [ ] T074 [US7] 10 configurable commission models, wired to T013, acceptance scenario 1 (FR-068)
- [ ] T075 [US7] Commission calculation from 10 named inputs plus AI optimization rules, wired to acceptance scenario 1 (FR-069)
- [ ] T076 [US7] 8-step commission workflow (Conversion Recorded→Settlement Confirmation) with hard block on payment before Finance Review and Executive Approval, wired to T035's contract test, acceptance scenarios 2-3 (FR-070)
- [ ] T077 [US7] AI commission intelligence (6 capabilities), wired to acceptance scenario 4 (FR-071)
- [ ] T078 [P] [US7] Commission Management UI
- [ ] T079 [US7] Integration test: a Tiered-model qualifying conversion validates eligibility, fraud-checks, and calculates a commission pending Finance Review, Finance-reviewed commissions await Executive Approval before payment, a settled commission shows the full 8-step workflow history in the audit trail, an AI fraud flag holds the commission from automatic calculation/payment — all 4 acceptance scenarios in `backend/tests/integration/us7-commission-management.integration.test.ts`

**Checkpoint**: The payment engine underlying both the affiliate and channel incentive ecosystems is independently functional.

---

## Phase 10: User Story 8 — Partner Portal Bundles Learning, Marketing Resources, Support, and Community (Priority: P3)

**Independent Test**: Log in as an active partner, confirm the dashboard widgets reflect underlying records, and confirm the partner can navigate to and use the Learning Center, Marketing Resource Center, Support Center, and Community modules from the same authenticated session.

- [ ] T080 [US8] Unified Partner Portal with 16 named modules across sales/marketing/learning/certification/incentives/opportunities/support/analytics/community/AI/executive communications (FR-076)
- [ ] T081 [US8] Role-configurable partner dashboard (12 widget types), wired to acceptance scenario 1 (FR-077)
- [ ] T082 [US8] Portal security (RBAC, MFA, SSO, session management, device management, IP restrictions, audit logging, API auth, encryption, security notifications), reusing `003`'s auth infrastructure per T032's note, wired to acceptance scenario 2 (FR-078)
- [ ] T083 [P] [US8] Partner Portal Dashboard UI
- [ ] T084 [US8] Integration test: an active partner's dashboard widgets match underlying certification/opportunity/commission records, authentication enforces RBAC and configured MFA/SSO, the Marketing Resource Center allows campaign-joining/asset-download/template-customization/MDF-request, a submitted support ticket routes per category/SLA and is trackable alongside certifications and community activity — all 4 acceptance scenarios in `backend/tests/integration/us8-partner-portal.integration.test.ts`

**Checkpoint**: The day-to-day partner-facing experience that makes every other capability usable and self-service is independently functional.

---

## Phase 11: Registration/Onboarding/Success-Management/Intelligence-Dashboard remainder (supports FR-013–FR-016, FR-021–FR-024, FR-029–FR-035; cross-cutting, no single owning story)

- [ ] T085 10-channel partner registration intake, wired to T005 (FR-013)
- [ ] T086 Registration information collection (16 fields) with configurable mandatory/optional fields (FR-014)
- [ ] T087 9-step registration workflow (Application Submitted→Portal Activation) with immutable audit logs (FR-015)
- [ ] T088 8-metric registration analytics (FR-016)
- [ ] T089 10-component structured onboarding process, wired to T007 (FR-021)
- [ ] T090 10-item onboarding checklist tracking (FR-022)
- [ ] T091 6-capability onboarding automation (auto-assign, schedule, remind, notify, track, escalate, recommend) (FR-023)
- [ ] T092 7-metric onboarding analytics (FR-024)
- [ ] T093 10 partner success objectives measurement (FR-029)
- [ ] T094 Configurable Partner Health Score from 10 input categories (FR-030)
- [ ] T095 Strategic-partner Success Plans (8 elements) (FR-031)
- [ ] T096 AI partner success intelligence (6 outputs), transparent/reviewable (FR-032)
- [ ] T097 Executive Partner Intelligence Dashboard (14 elements), wired to T019 (FR-033)
- [ ] T098 AI partner intelligence (8 outputs), explainable/configurable/auditable (FR-034)
- [ ] T099 10 configurable executive report types with scheduling/export/drill-down/RBAC (FR-035)
- [ ] T100 [P] Registration/Onboarding/Success/Intelligence Dashboard UI

---

## Phase 12: Channel-opportunity/lead-distribution/channel-performance remainder (supports FR-036–FR-041, FR-042–FR-045, FR-054–FR-059; cross-cutting, no single owning story)

- [ ] T101 12 configurable channel categories + admin-definable additional (FR-036)
- [ ] T102 Dedicated channel partner workspace (12 elements) (FR-037)
- [ ] T103 12-stage Channel Opportunity lifecycle (Lead Assigned→Expansion), wired to T009 and T030's `045`-extension note (FR-038)
- [ ] T104 Channel Opportunity full field set (14 fields) (FR-039)
- [ ] T105 Opportunity collaboration (8 capabilities) preventing duplication/channel conflicts (FR-040)
- [ ] T106 Opportunity analytics (8 metrics) + AI opportunity intelligence (6 outputs), transparent/reviewable (FR-041)
- [ ] T107 10 configurable lead assignment models, wired to T011 and T031's `013`-Lead-reuse note (FR-042)
- [ ] T108 10-factor lead-distribution-rule consideration (FR-043)
- [ ] T109 6-step lead acceptance workflow with full audit logging (FR-044)
- [ ] T110 8-metric lead distribution analytics (FR-045)
- [ ] T111 12-metric channel performance measurement (FR-054)
- [ ] T112 6-scope configurable performance scorecards (FR-055)
- [ ] T113 6-capability manager business-review/improvement-plan tools (FR-056)
- [ ] T114 AI channel performance intelligence (6 outputs), advisory (FR-057)
- [ ] T115 Channel Intelligence Dashboard (13 elements) (FR-058)
- [ ] T116 AI channel intelligence (8 outputs), explainable/auditable + configurable channel executive reports (FR-059)
- [ ] T117 [P] Channel Opportunity/Lead Distribution/Channel Performance Dashboards UI

---

## Phase 13: Affiliate-registration/affiliate-performance/portal-sub-module remainder (supports FR-060–FR-063, FR-072–FR-075, FR-079–FR-088; cross-cutting, no single owning story)

- [ ] T118 13 configurable affiliate classifications, wired to T014 (FR-060)
- [ ] T119 Affiliate profile full field set + unified affiliate workspace, wired to T014 (FR-061)
- [ ] T120 10-channel affiliate registration intake with configurable mandatory/optional fields (FR-062)
- [ ] T121 9-step affiliate registration workflow with immutable audit logs + 8-metric registration analytics (FR-063)
- [ ] T122 12-metric affiliate performance measurement + 6-scope configurable scorecards (FR-072)
- [ ] T123 6-capability affiliate-manager coaching/review tools + AI recommendations (6 types), advisory (FR-073)
- [ ] T124 Affiliate Intelligence Dashboard (13 elements), explainable/configurable/auditable (FR-074)
- [ ] T125 10 configurable affiliate executive report types (FR-075)
- [ ] T126 10-component learning catalog + browse/enroll/continue/download/track/schedule/renew/history capabilities, wired to T008 (FR-079)
- [ ] T127 AI learning intelligence (6 capabilities), advisory + 8-metric learning analytics (FR-080)
- [ ] T128 13 marketing asset types with brand-consistency enforcement, wired to T016 (FR-081)
- [ ] T129 6-capability marketing engagement (join/download/customize/submit/request-MDF/track/generate-links) + AI marketing intelligence (6 types) + 7-metric marketing analytics (FR-082)
- [ ] T130 9-channel support + 10 ticket categories, wired to T017 (FR-083)
- [ ] T131 SLA management (6 capabilities) + AI support intelligence (5 capabilities) (FR-084)
- [ ] T132 11-feature community platform + 7 participation capabilities, wired to T018 (FR-085)
- [ ] T133 6-capability community moderation + AI content monitoring + 7-metric community analytics (FR-086)
- [ ] T134 Partner Intelligence Portal (10 modules) (FR-087)
- [ ] T135 AI partner intelligence to partners (8 outputs), explainable/configurable/auditable + configurable partner-facing reports (FR-088)
- [ ] T136 [P] Affiliate Registration/Performance & Learning/Marketing/Support/Community/Intelligence Portal UI

---

## Phase 14: Polish — Governance, Security, Scalability & Final Validation

- [ ] T137 Full auditability of registration/verification/onboarding/certification + unified 360° enterprise view + configurable role-based portal permissions (FR-089)
- [ ] T138 Duplicate deal-registration/channel-conflict prevention + accurate affiliate attribution + configurable commission business rules/approval workflows (FR-090)
- [ ] T139 Self-paced/instructor-led certification training + renewal/validity tracking + marketing-resource version control/approval history + configurable community governance (FR-091)
- [ ] T140 Cross-platform AI confidence-score/rationale requirement + advisory-unless-approved enforcement + full AI activity logging (FR-092)
- [ ] T141 Immutable audit logs for every commercial/operational event + encryption at rest/in transit + RBAC/MFA/SSO across the Partner Portal + real-time executive dashboards (FR-093)
- [ ] T142 Enterprise-scale (millions of records) support + independent analytics/AI/reporting workloads + multi-region/multi-language/multi-currency/multi-tenant support + future extensibility (FR-094)
- [ ] T143 Resolve and document the 10 preserved NEEDS CLARIFICATION items from plan.md §6 not already closed by `research.md`
- [ ] T144 Final audit: cross-check every FR-001–FR-094 against an implementation or validation task; re-verify the `030` Partner-Wallet/fraud/commission, `045` Channel-Opportunity-extension, `013` Lead-reuse, and `003`/`009` reuse decisions are respected
- [ ] T145 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `030`'s Partner Wallet/fraud/commission entities, `045`'s Opportunity entity, and `013`'s Lead entity, and produces the entity/operating-model/governance infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US3, US4)**: US1 (16-stage lifecycle) is the foundational operating model every other capability attaches to and must land first; US2 (Verification/Due Diligence) depends on US1's partner record existing; US3 (Deal Registration) and US4 (Channel Incentive) are independent of each other and of US2, and can build in parallel once US1 is complete.
- **P2 stories (US5, US6, US7)**: US5 (Certification) depends on US1's Onboarding/Training phases conceptually but is independently testable once Foundational is complete; US6 (Affiliate Tracking) and US7 (Commission Management) are sequential — US7 depends on US6's tracking/attribution records existing as an input.
- **P3 story (US8)** depends on the lifecycle, certification, incentive, and commission capabilities already existing to populate the portal, and should land last among the numbered stories.
- **Phase 11 (Registration/Onboarding/Success/Intelligence Dashboard remainder)** depends on Foundational and US1; should land alongside US2.
- **Phase 12 (Channel-Opportunity/Lead-Distribution/Channel-Performance remainder)** depends on Foundational, US3, and US4; should land alongside US5.
- **Phase 13 (Affiliate-Registration/Performance/Portal-sub-module remainder)** depends on Foundational, US6, and US7; should land alongside US8.
- **Polish (Phase 14)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, operating model, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (partner-lifecycle-full-audit-trail, verification-never-auto-approves-or-rejects, incentive-commission-requires-finance-and-executive-approval) pass → US1 (16-stage lifecycle) → **STOP and VALIDATE** the foundational operating model is sound → US2 (Verification/Due Diligence) + US3 (Deal Registration) + US4 (Channel Incentive) → **STOP and VALIDATE** every approval chain (verification, deal-conflict, incentive) blocks correctly and every override is logged → US5 (Certification) + Phase 11 (registration/onboarding/success remainder) → US6 (Affiliate Tracking) → US7 (Commission Management) + Phase 12 (channel-opportunity/lead-distribution remainder) → US8 (Partner Portal) + Phase 13 (affiliate/portal-sub-module remainder) → Polish.
