---
description: "Task list for Feature 032 — Omnichannel Marketing Orchestration & Real-Time Engagement"
---

# Tasks: Omnichannel Marketing Orchestration & Real-Time Engagement

**Input**: Design documents from `/specs/032-omnichannel-orchestration/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 008, 019, 020, 021, 022, 027, 028, 031), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `019`'s unified customer profile, `020`/`021`'s channel-send capability, `031`'s social publishing, `027`'s Tracked Event stream and Dashboard framework, `028`'s attribution/financial-formula engine, and `008`'s AI gateway exist as integration points.

**⚠️ UNRESOLVED DEPENDENCY**: This feature's relationship to `022` (Marketing Automation Workflows, which already has its own `Customer Journey` and `Journey/Workflow Instance` entities) is an open NEEDS CLARIFICATION per plan.md's Ownership & Dependency Analysis. Foundational entity tasks below proceed against spec.md's own stated working hypothesis (this feature is the customer-journey-specific application layered on `022`'s substrate) but **no task may be treated as final architecture** until that question is resolved — see T002 and T157.

**Tests**: Included throughout — consent-withdrawal-halts-journey, Next-Best-Action explainability, and journey-priority conflict resolution each get a dedicated Foundational contract test, matching this spec's own SC-004/Constitution Article VI direct citation, SC-006, and User Story 6.

**Organization**: Tasks are grouped by user story (US1–US9 from spec.md), plus three supplementary cross-cutting phases for FR groups not owned by any single prioritized story (personalization/approval-versioning/journey-analytics-attribution-ROI; capacity-budget-offer-reward/cross-functional-orchestration/AI-optimization; alerts-dashboards-reporting/governance/API-webhook-integration/performance).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor reused via `016`), and that `019`'s profile, `020`/`021`'s channel-send, `031`'s social publishing, `027`'s event stream/dashboard framework, `028`'s attribution engine, and `008`'s AI gateway exist as integration points
- [ ] T002 Resolve `research.md` open items before proceeding, **in priority order**: (1) whether `022` and this feature are the same underlying automation engine or two genuinely distinct engines, and if distinct, how the `Customer Journey` naming collision is resolved — **this must be resolved before any entity in Phase 2 is treated as final architecture**; (2) Communication Fatigue Score formula/threshold; (3) human-task SLA defaults per type/role/priority; (4) emergency-communication authorization role(s) and revocation speed; (5) equal-priority journey conflict tie-break rule
- [ ] T003 [P] Add `backend/src/modules/{journey-builder,journey-entry-eligibility,event-processing,decision-timing,channel-orchestration,anti-fatigue-governance,journey-priority-conflict,consent-suppression,next-best-action,personalization-dynamic-content,human-task-sla,journey-approval-versioning,journey-testing-experiments,journey-analytics,journey-attribution-roi,realtime-ops-emergency,error-handling-retry,journey-instance-timeline,i18n-multibrand-multitenant,capacity-budget-offer-reward,cross-functional-orchestration,ai-journey-optimization,orchestration-alerts-reporting,orchestration-governance}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Journey` entity in `backend/src/modules/journey-builder/journey.entity.ts`
- [ ] T005 [P] Define the immutable `Journey Version` entity in `backend/src/modules/journey-builder/journey-version.entity.ts`
- [ ] T006 [P] Define the `Journey Node` entity in `backend/src/modules/journey-builder/journey-node.entity.ts`
- [ ] T007 [P] Define the `Journey Template` entity in `backend/src/modules/journey-builder/journey-template.entity.ts`
- [ ] T008 [P] Define the `Customer Journey Instance` entity in `backend/src/modules/journey-instance-timeline/customer-journey-instance.entity.ts`
- [ ] T009 [P] Define the `Journey Priority Level` entity in `backend/src/modules/journey-priority-conflict/journey-priority-level.entity.ts`
- [ ] T010 [P] Define the `Next-Best-Action Decision` entity in `backend/src/modules/next-best-action/next-best-action-decision.entity.ts`
- [ ] T011 [P] Define the `Communication Fatigue Score` entity in `backend/src/modules/anti-fatigue-governance/communication-fatigue-score.entity.ts`
- [ ] T012 [P] Define the `Channel Fallback Chain` entity in `backend/src/modules/channel-orchestration/channel-fallback-chain.entity.ts`
- [ ] T013 [P] Define the `Consent Record` entity in `backend/src/modules/consent-suppression/consent-record.entity.ts`
- [ ] T014 [P] Define the `Suppression Rule` entity in `backend/src/modules/consent-suppression/suppression-rule.entity.ts`
- [ ] T015 [P] Define the `Frequency Policy` entity in `backend/src/modules/anti-fatigue-governance/frequency-policy.entity.ts`
- [ ] T016 [P] Define the `Trigger` entity in `backend/src/modules/journey-entry-eligibility/trigger.entity.ts`
- [ ] T017 [P] Define the `Decision Rule / Condition` entity in `backend/src/modules/decision-timing/decision-rule.entity.ts`
- [ ] T018 [P] Define the `Channel` entity in `backend/src/modules/channel-orchestration/channel.entity.ts`
- [ ] T019 [P] Define the `Message / Content Variation` entity in `backend/src/modules/personalization-dynamic-content/message-content-variation.entity.ts`
- [ ] T020 [P] Define the `Offer` entity in `backend/src/modules/capacity-budget-offer-reward/offer.entity.ts`
- [ ] T021 [P] Define the `Human Task` entity in `backend/src/modules/human-task-sla/human-task.entity.ts`
- [ ] T022 [P] Define the `Experiment` entity in `backend/src/modules/journey-testing-experiments/experiment.entity.ts`
- [ ] T023 [P] Define the `Goal / Exit Condition` entity in `backend/src/modules/journey-entry-eligibility/goal-exit-condition.entity.ts`
- [ ] T024 [P] Define the immutable `Audit Record` entity in `backend/src/modules/orchestration-governance/audit-record.entity.ts`
- [ ] T025 [P] Define the `Alert` entity in `backend/src/modules/orchestration-alerts-reporting/alert.entity.ts`
- [ ] T026 Journey entry via behavioral and transactional triggers, wired to T016 (FR-007)
- [ ] T027 Journey entry via profile and time-based triggers (FR-008)
- [ ] T028 Journey entry via external triggers (FR-009)
- [ ] T029 Pre-entry eligibility evaluation across 16 criteria; ineligible customers never enter (FR-010)
- [ ] T030 Configurable re-entry rules preventing unintended duplicate participation (FR-011)
- [ ] T031 Exit-condition evaluation across 14 triggers with exit-event recording, wired to T023 (FR-012)
- [ ] T032 Configurable journey goals (16 types) with primary/secondary goal support (FR-013)
- [ ] T033 Near-real-time event processing (12 event types) triggering 8 direct consequences, wired to T004 (FR-014)
- [ ] T034 Event validation (11 checks) with an error-queue for invalid events (FR-015)
- [ ] T035 Anonymous-to-known identity resolution (7 signal types) preserving pre-identification activity, reusing `019`'s profile system (FR-016)
- [ ] T036 Decision-split conditions (17 attribute types, 10 operators), wired to T017 (FR-017)
- [ ] T037 Wait-step configuration (8 wait types) evaluated in customer-local/organization/campaign time zones (FR-018)
- [ ] T038 Customer Journey Instance recording (13 fields) with inspectable individual instances, wired to T008 (FR-052)
- [ ] T039 Customer preference center (8 categories) synchronizing with active journeys (FR-053)
- [ ] T040 Note: this feature's relationship to `022`'s workflow engine is UNRESOLVED (see plan.md's Ownership & Dependency Analysis); no Foundational entity here is final architecture until T002's research.md gate closes
- [ ] T041 Note: journey-execution events feed into `027`'s existing Tracked Event stream as a "workflow execution" data source rather than a second, parallel ingestion pipeline
- [ ] T042 Note: journey cost/revenue data feeds into `028`'s attribution/financial-formula engine; this feature does not independently recompute Contribution Margin, CAC-equivalent, CLV impact, or Payback Period
- [ ] T043 Contract test: consent withdrawal halts all further sends on the withdrawn channel within an active journey without delay, in `backend/tests/contract/consent-withdrawal-halts-journey.contract.test.ts` (FR-026, SC-004, Constitution Article VI)
- [ ] T044 Contract test: 100% of Next-Best-Action recommendations acted on by a journey retain a confidence score, explanation, and at least one alternative action, in `backend/tests/contract/next-best-action-explainability.contract.test.ts` (FR-031, SC-006)
- [ ] T045 Contract test: conflicting simultaneous journeys targeting the same customer are resolved by priority, never both silently sent, in `backend/tests/contract/journey-priority-conflict-resolution.contract.test.ts` (FR-025, User Story 6)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Build a Multi-Channel Customer Journey Visually (Priority: P1) 🎯 MVP

**Independent Test**: Drag entry/condition/wait/action/exit nodes onto a canvas, connect them into at least one branching path including a "Wait Until Event" node, run the built-in validation panel, and publish.

- [ ] T046 [US1] Visual no-code drag-and-drop journey builder canvas, wired to T004, acceptance scenario 1 (FR-001)
- [ ] T047 [US1] 29 node/component types support, wired to T006 (FR-002)
- [ ] T048 [US1] Builder interface elements (canvas, toolbar, config panel, audience preview, journey summary, validation panel, error/warning panel, version history, test mode, publish controls, analytics overlay, collaboration comments, approval status) (FR-003)
- [ ] T049 [US1] Canvas operations (zoom, pan, duplicate nodes, copy branches, labels, grouping, internal notes, search, collapse, version comparison), wired to acceptance scenario 4 (FR-004)
- [ ] T050 [US1] 26 reusable, editable journey templates, wired to T007 (FR-005)
- [ ] T051 [US1] Template reuse across campaigns without altering the source template (FR-006)
- [ ] T052 [US1] Validation-panel blocking of publish on an unconnected branch with specific error/warning detail, wired to acceptance scenario 2 (FR-039 tie-in)
- [ ] T053 [US1] Version-migration choice enforcement (remain on existing version, move to new version, restart under new version, exit/re-enter) on republish with active customers, wired to acceptance scenario 3 (FR-038 tie-in)
- [ ] T054 [P] [US1] Journey builder canvas UI
- [ ] T055 [US1] Integration test: entry→wait-until-event→email→exit validates cleanly, an unconnected branch blocks publish with a specific error, republishing with active customers requires a migration choice, duplicate/group/note canvas operations are preserved for collaborators — all 4 acceptance scenarios in `backend/tests/integration/us1-journey-builder.integration.test.ts`

**Checkpoint**: The foundational authoring surface every other capability in this chapter executes inside is independently functional.

---

## Phase 4: User Story 2 — Next-Best-Action Recommends Channel, Message and Offer with Explanation (Priority: P1)

**Independent Test**: Feed a single test customer profile into the Next-Best-Action Engine in isolation and verify it returns a recommended action accompanied by a confidence score, explanation, supporting signals, expected result, risk level, and at least one alternative.

- [ ] T056 [US2] Next-Best-Action Engine action catalog (12 action types), wired to T010 (FR-029)
- [ ] T057 [US2] Signal-drawing inputs (19 factors) with optional conversion/churn/fatigue/revenue-impact estimates, wired to acceptance scenario 1 (FR-030)
- [ ] T058 [US2] Mandatory confidence-score/explanation/supporting-signals/expected-result/risk-level/alternative-actions disclosure on every decision, wired to T044's contract test, acceptance scenario 1 (FR-031)
- [ ] T059 [US2] High-risk-flag human-approval-hold routing, wired to acceptance scenario 2
- [ ] T060 [US2] Alternative-candidate retention and surfacing rather than silent discard, wired to acceptance scenario 3
- [ ] T061 [US2] Decision-record retrievability for later audit inspection, wired to acceptance scenario 4
- [ ] T062 [P] [US2] Next-Best-Action decision review UI
- [ ] T063 [US2] Integration test: high-churn/low-engagement customer returns a recommendation with explanation and alternative, a high-risk recommendation is held for human approval, an unselected candidate is retained as an alternative, a decision record is retrievable for audit — all 4 acceptance scenarios in `backend/tests/integration/us2-next-best-action.integration.test.ts`

**Checkpoint**: The chapter's core intelligence layer, directly implementing Constitution Article II, is independently functional.

---

## Phase 5: User Story 3 — Consent Withdrawal Immediately Halts an Active Journey (Priority: P1)

**Independent Test**: Place a test customer inside an active journey with a pending future send, withdraw consent for that channel mid-journey, and verify the pending send does not fire and the journey instance reflects the consent-driven exit/suppression.

- [ ] T064 [US3] Pre-send consent verification (9 checks) before every communication, wired to T013, acceptance scenario 1 (FR-026)
- [ ] T065 [US3] Immediate in-flight-automation propagation on consent change with no delay, wired to T043's contract test, acceptance scenarios 1–2 (FR-026)
- [ ] T066 [US3] Global-consent-withdrawal journey exit with reason "consent withdrawn" and exit-event recording, wired to acceptance scenario 2 (FR-012 tie-in)
- [ ] T067 [US3] 12-category suppression rules overriding promotional journeys, wired to T014 (FR-027)
- [ ] T068 [US3] Single-channel-withdrawal fallback-chain skip-and-continue behavior, wired to acceptance scenario 3 (FR-020 tie-in)
- [ ] T069 [US3] Customer-configurable contact-window preferences plus organization default contact-window policy, wired to T015 (FR-028)
- [ ] T070 [US3] Consent-change audit logging (actor, timestamp, affected instance), wired to acceptance scenario 4 (FR-079 tie-in)
- [ ] T071 [P] [US3] Consent/suppression management UI
- [ ] T072 [US3] Integration test: withdrawn WhatsApp consent cancels a pending scheduled send, full consent withdrawal exits the journey with reason and an analytics record, single-channel withdrawal skips to the next eligible fallback channel, consent change and downstream effects are captured in the audit log — all 4 acceptance scenarios in `backend/tests/integration/us3-consent-withdrawal.integration.test.ts`

**Checkpoint**: The Article-VI direct-citation compliance behavior, non-negotiable and independent of any journey design, is independently functional.

---

## Phase 6: User Story 4 — Communication Fatigue Score Throttles an Over-Messaged Customer (Priority: P2)

**Independent Test**: Simulate a customer profile with a high recent message count, low open/click rate, and a recent notification-disable event, compute the fatigue score, and verify subsequent non-critical journey sends are automatically suppressed or reduced.

- [ ] T073 [US4] Configurable customer-contact limits (9 categories) with separate promotional-vs-transactional/emergency policies, wired to T015 (FR-022)
- [ ] T074 [US4] Communication Fatigue Score calculation (10 inputs), wired to T011, acceptance scenario 1 — threshold/formula preserved as `[NEEDS CLARIFICATION]` per spec.md (FR-023)
- [ ] T075 [US4] High-fatigue-threshold auto-suppression/reduction of non-critical communication, wired to acceptance scenario 2 (FR-023)
- [ ] T076 [US4] Transactional/Critical-priority-journey exemption from fatigue suppression, wired to acceptance scenario 3
- [ ] T077 [US4] Fatigue-score recovery removing suppression state when engagement resumes, wired to acceptance scenario 4
- [ ] T078 [P] [US4] Fatigue-score monitoring UI
- [ ] T079 [US4] Integration test: unopened messages plus a spam complaint cross the fatigue threshold and flag the customer, a Standard-priority send is suppressed for a high-fatigue customer, a Transactional/Critical-priority send is still delivered, improved engagement removes the suppression state — all 4 acceptance scenarios in `backend/tests/integration/us4-communication-fatigue.integration.test.ts`

**Checkpoint**: The customer-experience and deliverability-reputation safeguard is independently functional.

---

## Phase 7: User Story 5 — Channel Fallback Chain Escalates a Failed Delivery (Priority: P2)

**Independent Test**: Configure a single node with a 4-step fallback chain, force delivery failure on the first channel and non-engagement on the second, and verify the system progresses to email and, on continued failure, creates a sales task.

- [ ] T080 [US5] Channel selection logic (13 factors), wired to T018 (FR-019)
- [ ] T081 [US5] Configurable ordered channel priority/fallback chain per node/journey with 8 trigger conditions, wired to T012, acceptance scenario 1 (FR-020)
- [ ] T082 [US5] Non-engagement time-limit-triggered fallback progression, wired to acceptance scenario 2 (FR-020)
- [ ] T083 [US5] Channel-capability enforcement (5 capability types across 7 channels) with regulatory-limitation compliance (FR-021)
- [ ] T084 [US5] Chain-exhaustion sales-task creation ("all channels exhausted"), wired to acceptance scenario 3 (FR-034 tie-in)
- [ ] T085 [US5] Per-attempt channel/outcome/fallback-reason visibility for review, wired to acceptance scenario 4
- [ ] T086 [P] [US5] Fallback-chain configuration/review UI
- [ ] T087 [US5] Integration test: WhatsApp failure falls back to Push, unopened Push within the window falls back to Email, an exhausted chain creates a sales task with reason and source, fallback progression is fully visible per attempt — all 4 acceptance scenarios in `backend/tests/integration/us5-channel-fallback-chain.integration.test.ts`

**Checkpoint**: The reach/conversion-improving fallback mechanism is independently functional.

---

## Phase 8: User Story 6 — Conflicting Journeys Are Resolved by Priority (Priority: P2)

**Independent Test**: Enroll one test customer simultaneously into a Standard-priority promotional journey and a Critical-priority service-recovery journey, and verify the promotional action is automatically suppressed or delayed while the Critical action proceeds.

- [ ] T088 [US6] 6 journey priority levels (Critical, Transactional, High, Standard, Low, Experimental) with 9 configurable priority-rule inputs, wired to T009 (FR-024)
- [ ] T089 [US6] Cross-journey conflict detection (9 named conflict patterns) targeting the same customer, wired to acceptance scenarios 1–2 (FR-025)
- [ ] T090 [US6] Conflict resolution actions (suppress, delay, replace, merge, escalate for manual review, exit lower-priority journey) (FR-025)
- [ ] T091 [US6] Equal-priority tie-break rule application, wired to T045's contract test, acceptance scenario 3 — behavior preserved as `[NEEDS CLARIFICATION]` per spec.md (FR-025)
- [ ] T092 [US6] Cross-journey-analytics conflict visibility (journeys involved, resolution method applied), wired to acceptance scenario 4
- [ ] T093 [P] [US6] Conflict resolution review UI
- [ ] T094 [US6] Integration test: a Standard-priority promotion is suppressed while a Critical-priority support communication proceeds, a completed renewal suppresses a pending renewal-reminder, an equal-priority conflict applies the documented tie-break rule, a suppressed conflict is visible in cross-journey analytics — all 4 acceptance scenarios in `backend/tests/integration/us6-journey-priority-conflict.integration.test.ts`

**Checkpoint**: The safeguard against customer-damaging contradictory automated messaging is independently functional.

---

## Phase 9: User Story 7 — Authorized Emergency Communication Bypasses Normal Frequency Limits (Priority: P3)

**Independent Test**: Have an authorized administrator activate an emergency communication for a defined customer set, verify it is delivered despite an active frequency-limit or quiet-hours restriction, and verify every detail of the activation is captured in the audit log.

- [ ] T095 [US7] Real-time operational control center actions (13 administrator capabilities), wired to T025 (FR-048)
- [ ] T096 [US7] Controlled emergency communication (8 use-case categories) with an authorized-access requirement, wired to acceptance scenario 1 (FR-049)
- [ ] T097 [US7] Frequency-cap/quiet-hours bypass for emergency communication via a separate policy, wired to acceptance scenario 1 (FR-049)
- [ ] T098 [US7] Emergency-activation audit capture (actor, timestamp, reason/category, affected customer scope), wired to acceptance scenario 2 (FR-079 tie-in)
- [ ] T099 [US7] Rapid pause/correction support for an in-flight emergency send, wired to acceptance scenario 3 (FR-049)
- [ ] T100 [US7] Non-authorized-user denial without any frequency or consent bypass, wired to acceptance scenario 4
- [ ] T101 [P] [US7] Emergency communication activation/control UI
- [ ] T102 [US7] Integration test: a capped customer still receives the emergency notice, activation is captured with actor/reason/scope, an in-flight emergency send can be paused or corrected, an unauthorized user is denied without any bypass — all 4 acceptance scenarios in `backend/tests/integration/us7-emergency-communication.integration.test.ts`

**Checkpoint**: The real-but-infrequent, high-stakes operational capability is independently functional.

---

## Phase 10: User Story 8 — Journey Creates a Human Task with SLA Escalation (Priority: P3)

**Independent Test**: Have a journey node create a human task with a defined SLA for a test customer, allow the SLA window to lapse without the task being completed, and verify the system triggers the configured escalation.

- [ ] T103 [US8] Human-task creation for 8 staff roles with 8 required record fields, wired to T021, acceptance scenario 1 (FR-034)
- [ ] T104 [US8] Configurable SLA requirements per task type/role/priority with breach-triggered escalation, wired to acceptance scenario 2 — defaults preserved as `[NEEDS CLARIFICATION]` per spec.md (FR-035)
- [ ] T105 [US8] Task-completion event recording available to the originating journey and journey analytics, wired to acceptance scenario 3
- [ ] T106 [US8] On-time completion reflected in SLA reporting without escalation, wired to acceptance scenario 4
- [ ] T107 [US8] Journey collaboration workspace (comments, mentions, reviewer assignment, change requests, internal notes, version comparison, approval history, file attachments, journey tasks, unresolved-feedback tracking) (FR-036)
- [ ] T108 [P] [US8] Human task queue / SLA dashboard UI
- [ ] T109 [US8] Integration test: a high-value lead creates a task with full context, an SLA breach triggers the configured escalation, completion is recorded and available to the journey and analytics, on-time completion shows no escalation in SLA reporting — all 4 acceptance scenarios in `backend/tests/integration/us8-human-task-sla.integration.test.ts`

**Checkpoint**: The bridge from automated orchestration to human-driven revenue/retention action is independently functional.

---

## Phase 11: User Story 9 — Test a Journey in Simulation Without Affecting Production (Priority: P3)

**Independent Test**: Run a journey in test mode against a test customer profile with simulated events and time acceleration, exercising every branch including a simulated failure, and verify zero writes occur to production customer records or production journey analytics.

- [ ] T110 [US9] Journey testing (test profiles, event/journey simulation, time acceleration, channel/content/personalization preview, branch testing, failure simulation) with zero production impact, wired to acceptance scenario 1 (FR-040)
- [ ] T111 [US9] Sandbox/mock webhook testing rather than calling live production endpoints by default, wired to acceptance scenario 2
- [ ] T112 [US9] Production-analytics isolation verification for test runs, wired to acceptance scenario 3
- [ ] T113 [US9] Journey experiments (10 test dimensions, 3 allocation methods, 4 group types) with holdout-impact measurement (7 metrics), wired to T022 (FR-041)
- [ ] T114 [US9] Pre-publish "test users excluded from production" validation confirmation, wired to acceptance scenario 4 (FR-039 tie-in)
- [ ] T115 [P] [US9] Journey test-mode / experiment configuration UI
- [ ] T116 [US9] Integration test: a test-mode journey uses simulated events and time acceleration, a webhook node tests against a sandbox rather than production, a completed test run is absent from production analytics, the validation panel confirms test-user exclusion before publish — all 4 acceptance scenarios in `backend/tests/integration/us9-journey-testing-simulation.integration.test.ts`

**Checkpoint**: The safe-iteration/QA capability guaranteeing zero production side effects is independently functional.

---

## Phase 12: Personalization/Dynamic Content, Approval/Versioning remainder & Journey Analytics/Attribution/ROI (supports FR-032–FR-033, FR-037–FR-039, FR-042–FR-046; cross-cutting, no single owning story)

- [ ] T117 Message personalization (17 variable categories), wired to T019 (FR-032)
- [ ] T118 Dynamic content blocks varying by customer eligibility with pre-publish preview, plus real-time web/app surface personalization (7 surface types) (FR-033)
- [ ] T119 Sequential/parallel/conditional approval chain (7 roles) with auto-approval for low-risk templates and an audited emergency bypass, wired to T005 (FR-037)
- [ ] T120 Journey status lifecycle (11 statuses) with activation gated to approved versions only (FR-037)
- [ ] T121 Journey Version field completeness (12 fields) plus configurable migration rules on republish (FR-038)
- [ ] T122 Pre-activation validation (12 checks: entry/exit/goal existence, connected branches, approved content, configured channels, applied consent/frequency rules, no broken links, personalization fallback values, valid wait periods, reachable webhooks, controlled loops, active templates, test-user exclusion) (FR-039)
- [ ] T123 Journey/node-level execution analytics (16+11 metrics), wired to T041's reuse note feeding `027`'s Tracked Event stream, viewable on the journey canvas (FR-042)
- [ ] T124 Customer path, cross-journey, and journey funnel analytics, rendered through `027`'s Dashboard framework per the reuse note (FR-043)
- [ ] T125 Channel performance analytics (11 metrics) (FR-044)
- [ ] T126 Omnichannel attribution model selection feeding `028`'s central attribution system rather than a separate model, wired to T042's reuse note (FR-045)
- [ ] T127 Journey cost tracking (8 categories) feeding `028`'s financial-formula engine for ROI-report display rather than independent calculation, wired to T042's reuse note (FR-046)

**Checkpoint**: The personalization, governance-versioning, and journey-execution analytics surface — explicitly deferring financial/analytics computation to `027`/`028` — is independently functional.

---

## Phase 13: Capacity/Budget/Offer/Reward, Cross-Functional Orchestration & AI Optimization remainder (supports FR-058–FR-072; cross-cutting, no single owning story)

- [ ] T128 Rate/capacity limits (8 categories) with queue/delay/alternative-path handling at threshold (FR-058)
- [ ] T129 Journey budget definitions (7 categories) with automatic action-pause at threshold (FR-059)
- [ ] T130 Offer eligibility determination (13 factors) with logged, explainable decisions, wired to T020 (FR-060)
- [ ] T131 Reward issuance (10 reward types) with eligibility validation and reversal support (FR-061)
- [ ] T132 Sales orchestration actions (11 capabilities) (FR-062)
- [ ] T133 Customer-success orchestration actions (9 capabilities) (FR-063)
- [ ] T134 Support orchestration actions (8 capabilities) (FR-064)
- [ ] T135 Community orchestration actions (10 capabilities), dispatching into `005`/`031`'s existing surfaces (FR-065)
- [ ] T136 Learning orchestration actions (9 capabilities) (FR-066)
- [ ] T137 Events orchestration actions (13 capabilities) (FR-067)
- [ ] T138 Payments orchestration actions (11 capabilities) (FR-068)
- [ ] T139 AI journey recommendations (11 input factors) with expected-audience/conversion/effort/risk disclosure, consuming `008`'s gateway (FR-069)
- [ ] T140 AI Journey Builder (natural-language objective → proposed journey) with mandatory human review before activation (FR-070)
- [ ] T141 AI journey-optimization recommendations (11 categories) with evidence/confidence/risk/expected-impact (FR-071)
- [ ] T142 Journey forecasting (12 targets, 7 scenarios) plus anomaly detection (12 types) (FR-072)

**Checkpoint**: The capacity/budget/offer/reward governance, cross-functional action, and AI-optimization layer rounding out full orchestration coverage is independently functional.

---

## Phase 14: Alerts/Dashboards/Reporting, Governance & Polish

- [ ] T143 [P] Administrator alerting across 11 trigger categories (FR-073)
- [ ] T144 Operational dashboard (12 metrics) and executive engagement dashboard (12 metrics) with an AI-generated narrative, rendered through `027`'s Dashboard framework (FR-074)
- [ ] T145 Custom report builder (14 dimensions, 11 metric categories) with 6 scheduling options and 6 delivery formats (FR-075)
- [ ] T146 Configurable data-retention policy across 10 record categories (FR-076)
- [ ] T147 Layered RBAC across 15 named roles, wired to `016` (FR-077)
- [ ] T148 Security controls (MFA, encryption, secure API auth, field-level security, tenant isolation, session monitoring, IP restrictions, webhook signature validation, secret rotation) plus privacy controls (consent-aware messaging, data minimization, purpose-based processing, access/correction/deletion requests, pseudonymized analytics, masking, geographic privacy, retention) (FR-078)
- [ ] T149 Immutable audit log across 13 sensitive-action categories, wired to T024 (FR-079)
- [ ] T150 Secure APIs (11 operations) with full governance controls (FR-080)
- [ ] T151 Signed, retryable webhooks (12 event types) with delivery logs, secret rotation, idempotency, failure alerts, endpoint verification (FR-081)
- [ ] T152 Integration-framework wiring across the 20 named systems (FR-082)
- [ ] T153 Data-migration import support (10 data types) with validation, preview, duplicate detection, error reports, partial import, rollback, audit history (FR-083)
- [ ] T154 Performance hardening pass toward the remaining numeric targets (FR-084)
- [ ] T155 Scalability/availability infrastructure (queue-based processing, retry, dead-letter queues, duplicate protection, checkpoints, provider failover, disaster recovery, backups, monitoring, alerting, manual recovery) at the stated availability targets (FR-085)
- [ ] T156 Accessibility compliance (10 categories) plus mobile-capability support (7 capabilities) (FR-086)
- [ ] T157 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass — **the `022`/`032` engine-relationship question first and foremost**, then Communication Fatigue Score formula/threshold, human-task SLA defaults, emergency-communication authorization roles, and the equal-priority tie-break rule
- [ ] T158 Final audit: cross-check every FR-001–FR-086 against an implementation or validation task; verify journey-execution events feed `027`'s Tracked Event stream rather than a parallel pipeline, journey ROI reports display (not recompute) `028`'s financial formulas, and no module duplicates `020`/`021`'s channel-send mechanics or `031`'s social publishing
- [ ] T159 Run `quickstart.md` validation end-to-end across all 9 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `019`/`020`/`021`/`027`/`028`/`008` as integration points and on resolving (or explicitly deferring under the stated working hypothesis) the `022` relationship, and produces the entity/eligibility/event-processing infrastructure every subsequent phase depends on.
- **P1 stories (US1–US3)**: US1 (journey builder) is the foundational authoring surface every other capability executes inside and must ship first; US2 (Next-Best-Action) and US3 (consent withdrawal) both depend on US1's journey/node infrastructure existing to act within, and can build in parallel once US1 is stable.
- **P2 stories (US4–US6)**: US4 (fatigue), US5 (channel fallback), and US6 (priority conflict) all depend on US1–US3's journey/consent foundation and can build in parallel.
- **P3 stories (US7–US9)**: US7 (emergency communication) depends on US4's frequency-policy infrastructure (it uses a separate policy that must exist to be bypassed); US8 (human tasks) depends on US5's fallback-chain-exhaustion pattern; US9 (testing/simulation) depends on US1's journey builder being complete enough to test — all three can build in parallel.
- **Phase 12 (Personalization/Approval-Versioning/Analytics-Attribution-ROI)** depends on Foundational and US1; its analytics/attribution/ROI tasks explicitly depend on `027`/`028` integration points and should land alongside the P1/P2 stories to give them real data.
- **Phase 13 (Capacity/Budget/Offer/Reward/Cross-Functional/AI)** depends on Foundational and US1–US6; can build in parallel with the P3 stories.
- **Polish (Phase 14)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, event processing, eligibility) → **STOP and VALIDATE** the three Foundational contract tests (consent-withdrawal-halts-journey, next-best-action-explainability, journey-priority-conflict-resolution) pass, and confirm the `022` relationship question has at least a documented working answer → US1 (journey builder) → **STOP and VALIDATE** a real multi-node journey can be built, validated, and published → US2 (Next-Best-Action) + US3 (consent withdrawal) in parallel → **STOP and VALIDATE** the Article-II and Article-VI compliance behaviors are trustworthy → US4 (fatigue) + US5 (channel fallback) + US6 (priority conflict) in parallel → US7 (emergency communication) + US8 (human tasks) + US9 (testing/simulation) in parallel → Phase 12 (personalization/versioning/analytics) + Phase 13 (capacity/cross-functional/AI) in parallel → Polish.
