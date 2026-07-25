---
description: "Task list for Feature 022 — Marketing Automation Workflows, Customer Journeys & Event Triggers"
---

# Tasks: Marketing Automation Workflows, Customer Journeys & Event Triggers

**Input**: Design documents from `/specs/022-marketing-automation-workflows/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `019`'s CDP data and `008`'s AI gateway exist as integration points, and dispatches through `020`/`021` (channels), `006` (points ledger), `009` (coupons), and `013` (CRM records) as action-node targets, though it does not require their full feature completion to build its own orchestration engine.

**Tests**: Included throughout — dry-run-zero-live-sends, AI-recommendation-never-autonomous, and failure-recovery-guaranteed get dedicated Foundational contract tests, matching this spec's own SC-003, SC-005, and SC-007.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (Workflow Categories & Templates remainder FR-011–FR-015).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor this feature reuses via `016`), and that `019`'s CDP data and `008`'s AI gateway exist
- [ ] T002 Resolve `research.md` open items before proceeding: duplicate/replayed event deduplication semantics, in-flight-instance behavior when a workflow is republished mid-execution, the terminal failure state once all recovery mechanisms are exhausted, error-threshold-exit vs. per-customer-failure-handling interaction, and simultaneous collaborative-edit conflict resolution
- [ ] T003 [P] Add `backend/src/modules/{workflow-builder,workflow-templates,workflow-journey,workflow-event-engine,workflow-decision,workflow-ai-assistant,workflow-testing,workflow-versioning,workflow-error-recovery,workflow-monitoring,workflow-governance}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define `Workflow`/`Workflow Version` entities in `backend/src/modules/workflow-builder/workflow.entity.ts` (Key Entities)
- [ ] T005 [P] Define `Node`/`Node Connection` entities in `backend/src/modules/workflow-builder/node.entity.ts`
- [ ] T006 [P] Define the `Customer Journey` entity in `backend/src/modules/workflow-journey/customer-journey.entity.ts` (FR-016)
- [ ] T007 [P] Define the `Journey`/`Workflow Instance` (Execution Run) entity in `backend/src/modules/workflow-journey/workflow-instance.entity.ts`
- [ ] T008 [P] Define the `Event` entity in `backend/src/modules/workflow-event-engine/event.entity.ts`
- [ ] T009 [P] Define the `Workflow Variable` entity in `backend/src/modules/workflow-decision/workflow-variable.entity.ts`
- [ ] T010 [P] Define the `Test Run` (Dry-Run Session) entity in `backend/src/modules/workflow-testing/test-run.entity.ts`
- [ ] T011 [P] Define the `Failure`/`Error Record` entity in `backend/src/modules/workflow-error-recovery/failure-record.entity.ts`
- [ ] T012 [P] Define the `Monitoring Metric Snapshot` entity in `backend/src/modules/workflow-monitoring/metric-snapshot.entity.ts`
- [ ] T013 [P] Define the `Analytics Report` entity in `backend/src/modules/workflow-monitoring/analytics-report.entity.ts`
- [ ] T014 [P] Define the `AI Recommendation` entity in `backend/src/modules/workflow-ai-assistant/ai-recommendation.entity.ts`
- [ ] T015 [P] Define the `Audit Log Entry` entity, extending `001`'s audit-log pattern, in `backend/src/modules/workflow-governance/workflow-audit-log.entity.ts`
- [ ] T016 Implement the layered execution pipeline (Customer Events → Event Processing Engine → Workflow Rules Engine → Decision Engine → Action Executor → Communication Channels → Analytics & Monitoring) in `backend/src/modules/workflow-event-engine/execution-pipeline.service.ts` (FR-003)
- [ ] T017 Implement full audit-trail traceability for every workflow execution, wired to T015 (FR-004)
- [ ] T018 Implement the continuous, minimal-intervention operation architecture (reliability, scalability, observability, security at up-to-millions-of-actions scale) (FR-001, FR-002)
- [ ] T019 Implement global workflow variables (Customer Name, Customer ID, Membership Type, Language, Wallet Balance, Reward Points, Course Progress, Community Rank, Current Date, Current Time, Campaign Name) plus custom-variable definition, wired to T009 and `019`, in `backend/src/modules/workflow-decision/workflow-variables.service.ts` (FR-027, FR-028)
- [ ] T020 Implement the Decision Engine (customer attributes, behavioral history, segment membership, purchase history, AI scores, workflow state, time conditions), wired to `019`, in `backend/src/modules/workflow-decision/decision-engine.service.ts` (FR-029)
- [ ] T021 Implement real-time decision execution (FR-030)
- [ ] T022 Note: RBAC and publish approval reuse `016`'s model directly (Constitution Article VII)
- [ ] T023 Note: Award Points, Generate Coupon, Create Task, and Create Support Ticket action nodes defer to `006`, `009`, and `013` respectively — this feature never redefines their data models
- [ ] T024 Note: consent is re-checked immediately before every automated send at the Action Executor layer, per Constitution Article VI, inherited even though the source chapter's own text is silent on it
- [ ] T025 Contract test: zero live customers receive any message or action output during workflow test/dry-run execution, structurally guaranteed rather than dependent on correct tester configuration, in `backend/tests/contract/workflow-dry-run-zero-live-sends.contract.test.ts` (FR-037, SC-003)
- [ ] T026 Contract test: no AI-recommended workflow change ever takes effect against live customers without explicit human review and approval, in `backend/tests/contract/workflow-ai-recommendation-never-autonomous.contract.test.ts` (FR-032, SC-005)
- [ ] T027 Contract test: every workflow failure results in at least one recovery action and an administrator notification, with zero silently dropped actions, in `backend/tests/contract/workflow-failure-recovery-guaranteed.contract.test.ts` (FR-042, SC-007)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Building a Multi-Step Workflow With Trigger, Condition, Delay & Action Nodes (P1) 🎯 MVP

**Independent Test**: Open the Workflow Builder, drag a Trigger node, a Delay node, and two Action nodes onto the canvas, connect them in sequence, and confirm the canvas auto-saves the draft, records a version, and validates the workflow.

- [ ] T028 [US1] Visual drag-and-drop, no-code workflow builder, wired to T004/T005, in `web/src/app/(marketing-admin)/automation/workflow-builder/[workflowId]/page.tsx` (FR-005)
- [ ] T029 [US1] Canvas capabilities (infinite canvas, zoom controls, mini map, undo/redo, auto-save, version history, collaboration mode) (FR-006, acceptance scenarios 1–3)
- [ ] T030 [US1] Trigger Node catalog (User Registration, Login, Logout, Purchase, Payment Success, Payment Failure, Course Enrollment, Lesson Completed, Ebook Download, Podcast Played, Community Post, Referral Completed, Membership Upgrade, Event Registration) (FR-007)
- [ ] T031 [US1] Condition Node catalog (If/Else branching, 12 operators) (FR-008)
- [ ] T032 [US1] Delay Node catalog (Minutes, Hours, Days, Weeks, Months, Specific Date, Business Days, Time Zone Based) (FR-009)
- [ ] T033 [US1] Action Node catalog (16 named actions including Send Email/SMS/WhatsApp, Push Notification, Create Task, Update Customer Profile, Add/Remove Tag, Add/Remove Segment, Create Support Ticket, Generate Coupon, Award Points, Trigger AI Assistant, Call API, Execute Webhook) (FR-010)
- [ ] T034 [US1] Workflow validation (disconnected-node detection, circular-branch detection) blocking publish, wired to T004's version entity, in `backend/src/modules/workflow-builder/workflow-validation.service.ts` (acceptance scenario 4, edge case: circular branch)
- [ ] T035 [P] [US1] Workflow Builder canvas UI polish
- [ ] T036 [US1] Integration test: node chain auto-saves, undo restores a deleted node exactly, mini map enables navigation, disconnected node blocks publish — all 4 acceptance scenarios in `backend/tests/integration/us1-workflow-builder.integration.test.ts`

**Checkpoint**: The foundational construction mechanism every other capability in this chapter operates on top of is independently functional.

---

## Phase 4: User Story 2 — Event-Triggered Customer Journey Firing on a Platform Event (P1)

**Independent Test**: Publish a workflow with a single Trigger node bound to a specific platform event, perform that event as a test/live customer, and confirm the Event Processing Engine detects it and the workflow's first downstream node executes.

- [ ] T037 [US2] Event Trigger Engine continuous platform-activity monitoring, wired to T008, in `backend/src/modules/workflow-event-engine/event-trigger-engine.service.ts` (FR-020)
- [ ] T038 [US2] User Events (Login, Logout, Registration, Password Reset, Profile Update) (FR-021)
- [ ] T039 [US2] Commerce Events (Purchase, Refund, Cart Abandonment, Coupon Usage, Wallet Recharge) (FR-022, acceptance scenario 1)
- [ ] T040 [US2] Learning Events (Course Started, Lesson Completed, Quiz Passed, Certificate Earned) (FR-023)
- [ ] T041 [US2] Community Events (Post Published, Comment Added, Like Received, Followed User, Shared Content) (FR-024)
- [ ] T042 [US2] Membership Events (Upgrade, Renewal, Expiry, Cancellation) (FR-025)
- [ ] T043 [US2] AI Events (AI Chat Started, AI Recommendation Accepted, AI Content Generated) (FR-026)
- [ ] T044 [US2] Condition-node real-time segment-match evaluation and branch routing, wired to T020 (acceptance scenario 2)
- [ ] T045 [US2] Customer Journey Builder (Entry Point, Wait, Decision, Action, Goal, Exit nodes) with unlimited branches and nested logic, wired to T006 (FR-016, FR-017)
- [ ] T046 [US2] 10 journey entry points (Registration, First Login, First Purchase, Premium Upgrade, Event Registration, Referral, Community Activity, Manual Enrollment, API Request, Scheduled Entry) (FR-018, acceptance scenario 3)
- [ ] T047 [US2] 8 journey exit conditions (Goal achieved, workflow completed, membership expired, unsubscribed, removed, manual stop, timeout, error threshold exceeded), wired to T007 (FR-019, acceptance scenario 4)
- [ ] T048 [US2] Exit-condition-takes-precedence-over-pending-delayed-action handling (edge case)
- [ ] T049 [P] [US2] Journey entry/exit configuration UI
- [ ] T050 [US2] Integration test: purchase event detected and evaluated, segment-match condition routes branch, multi-entry-point journey entry, exit condition stops further actions — all 4 acceptance scenarios in `backend/tests/integration/us2-event-triggered-journey.integration.test.ts`

**Checkpoint**: Real-time reaction to customer behavior — the core value proposition distinguishing this from a static scheduler — is independently functional.

---

## Phase 5: User Story 3 — Dry-Run Testing a Workflow With Zero Live Sends Before Publishing (P1)

**Independent Test**: Run a workflow containing at least one Send Email and one Send WhatsApp action node in dry-run mode against a test customer, confirming simulated outcomes for every node and that no message is actually dispatched to any real channel.

- [ ] T051 [US3] Test-run execution against a designated test customer and test events, wired to T010/T025, in `backend/src/modules/workflow-testing/test-run-execution.service.ts` (FR-034, FR-035, acceptance scenario 1)
- [ ] T052 [US3] Simulated-delay execution (no real-time wait) (FR-036, acceptance scenario 2)
- [ ] T053 [US3] Simulated-dispatch-outcome recording with structural live-channel prevention in `backend/src/modules/workflow-testing/dispatch-simulation.service.ts` (acceptance scenario 3)
- [ ] T054 [US3] Error-simulation invocation surfacing configured recovery behavior without affecting live execution (acceptance scenario 4)
- [ ] T055 [US3] Branch validation plus performance testing within test-run mode (FR-036)
- [ ] T056 [P] [US3] Dry-run test console UI in `web/src/app/(marketing-admin)/automation/test-runs/page.tsx`
- [ ] T057 [US3] Integration test: dry-run executes against the test customer only, delay is simulated not waited, action is simulated not dispatched, error simulation surfaces recovery without live impact — all 4 acceptance scenarios in `backend/tests/integration/us3-dry-run-testing.integration.test.ts`

**Checkpoint**: The unconditional, P1 safety guarantee — "no live customer receives messages during testing" — is independently functional.

---

## Phase 6: User Story 4 — AI Workflow Assistant Detecting a Bottleneck and Recommending Optimization (P2)

**Independent Test**: Run a workflow with an intentionally long delay and a low-traffic branch, trigger the AI Workflow Assistant's analysis, and confirm it surfaces a bottleneck/inactive-branch recommendation that is NOT applied to the live workflow until an administrator explicitly approves it.

- [ ] T058 [US4] AI Workflow Assistant analysis (bottleneck detection, drop-off prediction, suggested actions, inactive-branch identification, delay optimization) consuming `008`'s gateway, wired to T014, in `backend/src/modules/workflow-ai-assistant/ai-analysis.service.ts` (FR-031, acceptance scenario 1)
- [ ] T059 [US4] AI-generated workflow description plus candidate journey structure recommendation for new workflows (acceptance scenario 2)
- [ ] T060 [US4] Proposed-change hold pending human review — never auto-applied to the live workflow, wired to T026's contract test, in `backend/src/modules/workflow-ai-assistant/proposal-hold.service.ts` (FR-032, acceptance scenario 3)
- [ ] T061 [US4] Approved-AI-recommendation applied through the standard version-control process, wired to the versioning module (FR-033, acceptance scenario 4)
- [ ] T062 [P] [US4] AI Workflow Assistant review UI
- [ ] T063 [US4] Integration test: bottleneck-and-inactive-branch recommendations surfaced, new-workflow description generation, recommendation not auto-applied, approval creates a new version — all 4 acceptance scenarios in `backend/tests/integration/us4-ai-workflow-assistant.integration.test.ts`

**Checkpoint**: The differentiating optimization capability with a demonstrably enforced Article II approval gate is independently functional.

---

## Phase 7: User Story 5 — Reviewing, Comparing & Restoring Workflow Versions Under Approval Control (P2)

**Independent Test**: Edit a published workflow (creating a new version in pending-approval state), compare the new version against the previously published version, then either publish it as an authorized administrator or restore the prior version.

- [ ] T064 [US5] New-version creation on every modification (version number, author, created date, change log, approval status), wired to T004 (FR-038, FR-039, acceptance scenario 1)
- [ ] T065 [US5] Version compare (side-by-side diff) in `backend/src/modules/workflow-versioning/version-compare.service.ts` (FR-040, acceptance scenario 2)
- [ ] T066 [US5] Non-administrator publish-block requiring authorized-administrator approval, wired to T022 (FR-047, acceptance scenario 3)
- [ ] T067 [US5] Version restore recorded as a new version event (FR-040, acceptance scenario 4)
- [ ] T068 [P] [US5] Version history/compare/restore UI
- [ ] T069 [US5] Integration test: modification creates a new version rather than overwriting, compare shows the differences, non-admin publish is blocked, restore creates a new version event — all 4 acceptance scenarios in `backend/tests/integration/us5-version-control.integration.test.ts`

**Checkpoint**: What makes the automation platform governable and auditable at enterprise scale is independently functional.

---

## Phase 8: User Story 6 — Recovering From a Failed Workflow Action via Automatic Retry & Escalation (P2)

**Independent Test**: Force a known failure condition on a live Action node execution and confirm the system logs the failure, attempts automatic retry, falls back to an alternate provider or reschedules as configured, and raises an administrator notification.

- [ ] T070 [US6] Failure detection and classification (invalid condition, missing template, provider unavailable, timeout, API failure, permission denied, invalid customer data), wired to T011 (FR-041, acceptance scenario 4)
- [ ] T071 [US6] Automatic retry per configured policy, wired to T027's contract test, in `backend/src/modules/workflow-error-recovery/retry.service.ts` (FR-042, acceptance scenario 1)
- [ ] T072 [US6] Alternative-provider failover (acceptance scenario 2)
- [ ] T073 [US6] Execution-queue rescheduling when retry/failover options are exhausted (acceptance scenario 3)
- [ ] T074 [US6] Administrator notification plus failure logging/audit retrievability for every failure (acceptance scenario 4)
- [ ] T075 [US6] Terminal-failure-state handling once all recovery mechanisms are exhausted (edge case)
- [ ] T076 [P] [US6] Failure log/recovery admin UI in `web/src/app/(marketing-admin)/automation/failures/page.tsx`
- [ ] T077 [US6] Integration test: provider-unavailable triggers retry, repeated failure triggers alternate-provider failover, exhausted options reschedule rather than drop, every failure type notifies and logs — all 4 acceptance scenarios in `backend/tests/integration/us6-failure-recovery.integration.test.ts`

**Checkpoint**: The reliable failure recovery keeping the "continuous, minimal-intervention operation" promise credible is independently functional.

---

## Phase 9: User Story 7 — Monitoring Live Workflows and Exporting Journey Analytics (P3)

**Independent Test**: Run several workflows to completion (some successfully, some with induced failures), open the monitoring dashboard to confirm counts and error rate update within the documented refresh target, then export a workflow analytics report.

- [ ] T078 [US7] Real-time monitoring dashboard (running workflows, active customers, completed, failed, average execution time, queue length, error rate, conversion rate, journey completion rate), wired to T012, in `web/src/app/(marketing-admin)/automation/monitoring/page.tsx` (FR-043, acceptance scenarios 1, 4)
- [ ] T079 [US7] Workflow analytics report (entry/exit count, drop-off analysis, conversion funnel, average journey duration, revenue attribution, goal completion, communication performance), wired to T013 (FR-044, acceptance scenario 2)
- [ ] T080 [US7] PDF/Excel/CSV export (FR-045, acceptance scenario 3)
- [ ] T081 [P] [US7] Monitoring dashboard and analytics report UI polish
- [ ] T082 [US7] Integration test: dashboard metrics refresh within target, analytics report contains the full field set, multi-format export succeeds, elevated error rate is visible — all 4 acceptance scenarios in `backend/tests/integration/us7-monitoring-analytics.integration.test.ts`

**Checkpoint**: The observability layer over already-running, already-recovering workflows is independently functional.

---

## Phase 10: Workflow Categories & Templates remainder (supports FR-011–FR-015; cross-cutting, no single owning story)

- [ ] T083 Welcome Automation category and template (Registration → Welcome Email → Wait 1 Day → Push Notification → Recommend Courses), wired to T004 (FR-011)
- [ ] T084 [P] Engagement Automation category (Daily Motivation, Community Reminder, Podcast Recommendation, Ebook Reminder, Course Progress Reminder) (FR-012)
- [ ] T085 [P] Sales Automation category (Premium Upgrade, Limited-Time Offer, Flash Sale, Cross-Sell, Upsell) (FR-013)
- [ ] T086 [P] Retention Automation category (Inactive User, Subscription Expiry, Membership Renewal, Win-back Campaign) (FR-014)
- [ ] T087 [P] Referral Automation category (Invite Friend, Referral Reward, Milestone Celebration) (FR-015)

**Checkpoint**: The named, ready-to-use workflow starting points across all 5 categories are independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T088 [P] Security/governance hardening pass (RBAC authorization, workflow approval, audit logging, secure API execution, webhook authentication, encryption, rate limiting, data masking) (FR-046)
- [ ] T089 Performance hardening pass toward all 6 numeric targets (publish, event processing, trigger execution, action dispatch, dashboard refresh, validation) (FR-048–FR-050)
- [ ] T090 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (event deduplication, in-flight-instance republish behavior, terminal failure state, error-threshold-exit interaction, collaborative-edit conflict resolution)
- [ ] T091 Final audit: cross-check every FR-001–FR-050 against an implementation or validation task; verify this feature defers CDP/AI/channel/points/coupon/CRM ownership to `019`/`008`/`020`/`021`/`006`/`009`/`013` rather than duplicating them
- [ ] T092 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `019`'s CDP data, `016`'s RBAC, and `008`'s AI gateway, and produces the execution-pipeline/entity infrastructure every subsequent phase depends on.
- **P1 stories (US1–US3)**: US1 (Workflow Builder) is the foundational construction mechanism and must ship first; US2 (event-triggered journeys) depends on US1 producing a buildable workflow; US3 (dry-run testing) depends on US1/US2 producing a testable workflow with trigger/action nodes.
- **P2 stories (US4–US6)**: US4 (AI Workflow Assistant) depends on US1's workflow structure and historical execution data from US2; US5 (version control) depends on US1's workflow entity and benefits from edits already happening; US6 (failure recovery) depends on US2's live execution producing failures to recover from — all three can build in parallel once US1–US3 are stable.
- **P3 story (US7)** depends on US1–US6 producing real running/completed/failed workflow data to monitor and analyze — build last among the prioritized stories.
- **Phase 10 (Categories/Templates remainder)** depends on Foundational's Workflow entity and can build in parallel with US4–US7.
- **Polish (Phase 11)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (execution pipeline, entities, Decision Engine) → **STOP and VALIDATE** the three Foundational contract tests (dry-run-zero-live-sends, AI-never-autonomous, failure-recovery-guaranteed) pass → US1 (Workflow Builder) → **STOP and VALIDATE** a multi-node workflow can be built and validated end to end → US2 (event-triggered journeys) → US3 (dry-run testing) → **STOP and VALIDATE** workflows fire correctly on real events and can be safely tested before going live → US4 (AI Workflow Assistant) + US5 (version control) + US6 (failure recovery) in parallel → US7 (monitoring/analytics) → Phase 10 (categories/templates) → Polish.
