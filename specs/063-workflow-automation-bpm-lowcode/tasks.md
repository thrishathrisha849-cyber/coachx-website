---
description: "Task list for Feature 063 — Enterprise Workflow Automation, BPM & Low-Code Platform"
---

# Tasks: Enterprise Workflow Automation, BPM & Low-Code Platform

**Input**: Design documents from `/specs/063-workflow-automation-bpm-lowcode/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis surfacing the session's largest-scope finding — this feature is the canonical general-purpose Workflow/Approval engine that six already-planned features, 055/057/058/059/061/062, each independently re-described in domain-specific miniature — and extending the pre-existing 022/032 engine-identity gate to a three-way question), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC). This feature also assumes `008`'s `ai-gateway`/`ai-guardrails` exist as a consumption point.

**Tests**: Included throughout — the no-code workflow design/test/publish flow, the immutable approval-history completeness gate, and the AI-process-recommendation human-approval gate each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-002, and SC-007.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single story (Forms & Dynamic Data Collection, Workflow Analytics & Monitoring, Security & Governance).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC), and that `008`'s `ai-gateway`/`ai-guardrails` exist as a consumption point
- [ ] T002 Resolve `research.md` open items before proceeding: rule-conflict tie-breaking/precedence when multiple active rules of equal or differing priority match the same input (explicitly self-flagged); approval "dead end" terminal behavior when both delegation and escalation are exhausted (explicitly self-flagged); in-flight-workflow-instance behavior when the underlying definition is edited/republished (explicitly self-flagged); low-code app permission-overreach review gate prior to publishing; workflow-versioning concurrent-publish conflict handling; contradictory-rule-actions resolution; event-storm queuing/throttling behavior; expired-rule/workflow behavior for in-progress instances; orphaned-conditional-field detection; and the extended three-way 022/032/063 engine-identity question (per plan.md §2)
- [ ] T003 [P] Add `backend/src/modules/workflow-automation/{platform-foundation,workflow-designer-bpm,business-rules-engine,approval-automation,rpa-platform,low-code-app-builder,forms-dynamic-data-collection,event-driven-automation,workflow-analytics-monitoring,ai-process-intelligence,security-governance}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Business Process` entity in `backend/src/modules/workflow-automation/platform-foundation/business-process.entity.ts`
- [ ] T005 [P] Define the `Workflow` entity in `backend/src/modules/workflow-automation/workflow-designer-bpm/workflow.entity.ts`
- [ ] T006 [P] Define the `Workflow Instance` entity in `backend/src/modules/workflow-automation/workflow-designer-bpm/workflow-instance.entity.ts`
- [ ] T007 [P] Define the `Business Rule` entity in `backend/src/modules/workflow-automation/business-rules-engine/business-rule.entity.ts`
- [ ] T008 [P] Define the `Approval Request` entity in `backend/src/modules/workflow-automation/approval-automation/approval-request.entity.ts`
- [ ] T009 [P] Define the `RPA Robot` entity in `backend/src/modules/workflow-automation/rpa-platform/rpa-robot.entity.ts`
- [ ] T010 [P] Define the `RPA Job / Task` entity in `backend/src/modules/workflow-automation/rpa-platform/rpa-job-task.entity.ts`
- [ ] T011 [P] Define the `Low-Code App` entity in `backend/src/modules/workflow-automation/low-code-app-builder/low-code-app.entity.ts`
- [ ] T012 [P] Define the `App Component` entity in `backend/src/modules/workflow-automation/low-code-app-builder/app-component.entity.ts`
- [ ] T013 [P] Define the `Component Marketplace Listing` entity in `backend/src/modules/workflow-automation/low-code-app-builder/component-marketplace-listing.entity.ts`
- [ ] T014 [P] Define the `Form` entity in `backend/src/modules/workflow-automation/forms-dynamic-data-collection/form.entity.ts`
- [ ] T015 [P] Define the `Event Trigger Binding` entity in `backend/src/modules/workflow-automation/event-driven-automation/event-trigger-binding.entity.ts`
- [ ] T016 [P] Define the `Workflow Analytics Record` entity in `backend/src/modules/workflow-automation/workflow-analytics-monitoring/workflow-analytics-record.entity.ts`
- [ ] T017 [P] Define the `AI Recommendation` entity in `backend/src/modules/workflow-automation/ai-process-intelligence/ai-recommendation.entity.ts`
- [ ] T018 Centralized, AI-powered automation engine for designing, executing, monitoring, optimizing, and governing business processes (FR-001)
- [ ] T019 Every department (HR, Finance, CRM, Sales, Procurement, Inventory, Projects, Customer Support, Marketing, Legal, Operations, Administration) can automate business processes without writing code (FR-002)
- [ ] T020 Full process lifecycle (Design→Modeling→Validation→Testing→Approval→Deployment→Execution→Monitoring→Optimization→Version Upgrade→Retirement), wired to T004 (FR-003)
- [ ] T021 Process automation across 13 process types (HR, Finance, Procurement, CRM, Sales, Marketing, Customer Support, Inventory, Project, Legal, IT Operations, Compliance, Custom) (FR-004)
- [ ] T022 Note: this feature is the canonical, general-purpose Workflow/Approval engine — six already-planned features (`055`, `057`, `058`, `059`, `061`, `062`) each independently re-described "Workflow Engine"/"Approval Matrix"/"Multi-Level Approval" FRs from their own source-PRD chapters in domain-specific miniature; their approval/workflow mechanics should be understood as configuring this feature's engine at implementation time, the same layered-configuration pattern established for `001`'s RBAC — a MAJOR, large-scope finding pending explicit user direction on how to annotate the six affected plan.md files (per plan.md §1)
- [ ] T023 Note: `022`'s marketing workflow builder's and `032`'s journey builder's relationship to this feature's engine remains an open, three-way-extended NEEDS CLARIFICATION — not resolved, only extended (per plan.md §2)
- [ ] T024 Note: AI Process Assistant and AI Process Intelligence (including AI Robots) reuse `008`'s `ai-gateway`/`ai-guardrails` for provider access/governance, with process-mining/bottleneck-detection logic as this feature's own new build (per plan.md §3)
- [ ] T025 Note: Workflow-Level and Rule-Level Permissions configure `001`'s/`016`'s existing layered RBAC engine per the established extension pattern (per plan.md §4)
- [ ] T026 Note: `062`'s DMS integration point is confirmed bidirectionally — `062/tasks.md` T080 already forward-declared this feature by name (per plan.md §5)
- [ ] T027 Contract test: a business user with no coding background designs, tests in sandbox, and publishes a multi-step approval workflow (Start→Human Task→Decision→Approval→End) entirely through the visual Workflow Designer, in `backend/tests/contract/no-code-workflow-design-test-publish-without-engineering.contract.test.ts` (SC-001)
- [ ] T028 Contract test: 100% of approval requests produce a complete, immutable Approval History (request, validation, chain, notifications, signature, execution, audit completion) with no missing steps, in `backend/tests/contract/approval-history-100pct-complete-immutable.contract.test.ts` (SC-002)
- [ ] T029 Contract test: 100% of AI Process Intelligence recommendations are presented for human review with all nine required fields before any associated action can be applied, and zero are auto-applied, in `backend/tests/contract/ai-process-recommendation-zero-autonomous-config-change.contract.test.ts` (SC-007)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Business User Builds an Approval Workflow Without Code (Priority: P1) 🎯 MVP

**Independent Test**: Open the Workflow Designer, place a Start Node, a Human Task node, a Decision node, an Approval node, a Notification node, and an End Node, connect them, run the workflow in the sandbox/testing environment, and confirm the workflow reaches "Published" status and executes an approval request end-to-end.

- [ ] T030 [US1] Visual Process Mapping and Swimlane Diagrams (FR-005)
- [ ] T031 [US1] Decision Trees and Conditional Logic within process models (FR-006)
- [ ] T032 [US1] Multi-Step Workflows with Parallel and Sequential Execution (FR-007)
- [ ] T033 [US1] SLA Management, Escalation Rules, Exception Handling for processes (FR-008)
- [ ] T034 [US1] Audit Logging and Version Management for all business processes (FR-009)
- [ ] T035 [US1] Drag-and-drop Workflow Designer, wired to T005, acceptance scenario 1 (FR-010)
- [ ] T036 [US1] 18 workflow node/component types (Start, End, Task, Approval, Decision, Notification, API Call, Database Operation, Timer, Delay, Script, AI Decision, Human Task, File Upload, Condition, Loop, Gateway, Integration Connector), wired to acceptance scenario 1 (FR-011)
- [ ] T037 [US1] Workflow Templates, Nested Workflows, Reusable Components (FR-012)
- [ ] T038 [US1] Variables, Expressions, Custom Actions within workflows (FR-013)
- [ ] T039 [US1] Testing Environment with Sandbox Execution for pre-publish validation, wired to acceptance scenario 2 (FR-014)
- [ ] T040 [US1] Version Control for workflows (FR-015)
- [ ] T041 [US1] Workflow status states (Draft, Testing, Pending Approval, Published, Running, Paused, Completed, Failed, Archived), wired to acceptance scenarios 3–4 (FR-016)
- [ ] T042 [P] [US1] Workflow Designer Canvas UI
- [ ] T043 [US1] Integration test: a connected Start→Human Task→Decision→End chain renders and saves as Draft, a sandbox test run with a sample amount above threshold routes to Finance Approval and reports success without affecting production data, a tested workflow submitted for approval transitions from Pending Approval to Published, a Running instance awaiting Human Task response advances on approver action with the Approval History recording actor/timestamp — all 4 acceptance scenarios in `backend/tests/integration/us1-workflow-designer.integration.test.ts`

**Checkpoint**: The foundational, no-code process-authoring capability every other chapter capability depends on is independently functional.

---

## Phase 4: User Story 2 — Approval Chain Executes With Delegation, Escalation & Digital Signature (Priority: P1)

**Independent Test**: Submit a request into a pre-built multi-level approval workflow, have one approver delegate their step, let a second step breach its SLA to trigger escalation, and confirm the request completes with a full, immutable Approval History and a valid digital signature.

- [ ] T044 [US2] Enterprise approval process automation, wired to T008 (FR-021)
- [ ] T045 [US2] 10 approval types (Employee, Manager, Department, Finance, Procurement, HR, Executive, Legal, Compliance, Multi-Level) (FR-022)
- [ ] T046 [US2] Approval workflow sequence (Request→Validation→Approval Chain→Notifications→Digital Signature→Execution→Audit Completion), wired to T028's contract test, acceptance scenarios 1, 4 (FR-023)
- [ ] T047 [US2] Dynamic Approval Matrix determining the applicable approval chain, wired to acceptance scenario 1 (FR-024)
- [ ] T048 [US2] Delegation and Escalation of approval tasks, wired to acceptance scenarios 2–3 (FR-025)
- [ ] T049 [US2] Auto Approval and Auto Rejection based on configured conditions (FR-026)
- [ ] T050 [US2] Parallel Approval and Sequential Approval chains (FR-027)
- [ ] T051 [US2] SLA Monitoring for approval steps and Mobile Approval, wired to acceptance scenario 3 (FR-028)
- [ ] T052 [US2] Complete Approval History for every request, wired to acceptance scenario 4 (FR-029)
- [ ] T053 [P] [US2] Approval Center UI
- [ ] T054 [US2] Integration test: a validated request computes the Dynamic Approval Matrix and routes to the first approver, an unavailable approver's configured delegate receives the task with actions recorded on the original approver's behalf, an SLA breach escalates per the configured rule and notifies the escalation target, a final approver's signature applies a digital signature and writes an audit-complete Approval History record — all 4 acceptance scenarios in `backend/tests/integration/us2-approval-chain-delegation-escalation.integration.test.ts`

**Checkpoint**: The single most common real-world enterprise BPM use case is independently functional.

---

## Phase 5: User Story 3 — RPA Robot Executes a Repetitive Task (Priority: P2)

**Independent Test**: Register one robot of a given type against a defined RPA capability, run it against a queue of sample records, and confirm the RPA Dashboard reflects the job as completed (or failed) with updated Success Rate, Processing Time, and Automation Hours metrics.

- [ ] T055 [US3] Software robots (RPA) for automating repetitive business activities, wired to T009 (FR-030)
- [ ] T056 [US3] 12 RPA capabilities (Data Entry, Invoice Processing, Report Generation, Email Automation, Spreadsheet Processing, File Management, Browser Automation, ERP Automation, CRM Automation, Data Migration, System Synchronization, Batch Processing) (FR-031)
- [ ] T057 [US3] 6 robot types (Attended, Unattended, Hybrid, AI, Scheduled, Event-Based), wired to acceptance scenarios 1–3 (FR-032)
- [ ] T058 [US3] RPA Dashboard (Active Robots, Running Jobs, Failed Jobs, Queue Length, Success Rate, Processing Time, Cost Savings, Automation Hours, Exception Rate, Robot Health), wired to T010, acceptance scenario 4 (FR-033)
- [ ] T059 [P] [US3] RPA Dashboard UI
- [ ] T060 [US3] Integration test: an Unattended Robot processes a new invoice batch without human interaction with Queue Length/Running Jobs updating, an Event-Based Robot starts a job within event-processing latency on its bound trigger, an Attended Robot performs its automated portion mid-task and returns control to the user, an unrecoverable mid-job error is recorded in Failed Jobs with Exception Rate updating and the failure surfaced — all 4 acceptance scenarios in `backend/tests/integration/us3-rpa-robot-execution.integration.test.ts`

**Checkpoint**: The distinct, independently valuable execution engine targeting high-volume manual work is independently functional.

---

## Phase 6: User Story 4 — Citizen Developer Builds a Department App From the Component Marketplace (Priority: P2)

**Independent Test**: A citizen developer creates a new app, adds at least one component from the Component Marketplace, defines a data model, attaches a workflow, applies a theme, and publishes the app — then confirm the published app is reachable and functional.

- [ ] T061 [US4] Visual, no-code application building for business users, wired to T011 (FR-034)
- [ ] T062 [US4] Drag & Drop UI Designer, Form Builder, embedded Workflow Builder, Data Model Designer, Dashboard Builder, Mobile Layout Builder, wired to acceptance scenarios 1, 3 (FR-035)
- [ ] T063 [US4] Responsive Design and Theme Management, wired to acceptance scenario 2 (FR-036)
- [ ] T064 [US4] Reusable Components and Component Marketplace, wired to T012, T013, acceptance scenario 1 (FR-037)
- [ ] T065 [US4] 18 form/UI component types (Text Field, Number Field, Date Picker, Dropdown, Radio Button, Checkbox, Rich Text Editor, File Upload, Image Upload, Signature Field, QR Scanner, Barcode Scanner, Map, Calendar, Charts, Tables, Cards, Kanban Boards) (FR-038)
- [ ] T066 [US4] 12 app categories (HR, CRM, Finance, Procurement, Inventory, Event, LMS, Community, Surveys, Ticket Systems, Internal Portals, Mobile), wired to acceptance scenario 4 (FR-039)
- [ ] T067 [P] [US4] Low-Code App Builder UI
- [ ] T068 [US4] Integration test: dragged Text Field/Dropdown/File Upload components render on the app form and bind to Data Model Designer fields, toggling Responsive Design adapts the app preview for mobile without custom CSS/code, a submitted app form with an attached workflow starts a workflow instance using the submitted data, a published app becomes available under its correct category and discoverable to intended department users — all 4 acceptance scenarios in `backend/tests/integration/us4-low-code-app-builder.integration.test.ts`

**Checkpoint**: The platform's internal PaaS layer, letting every department build custom applications without engineering, is independently functional.

---

## Phase 7: User Story 5 — Business Rules Engine Enforces Conditional Logic Without Code (Priority: P2)

**Independent Test**: Create one rule of any Rule Type with defined Conditions and Actions, activate it, trigger the condition with sample data, and confirm the configured Action fires exactly when the condition set evaluates true.

- [ ] T069 [US5] Configurable Business Rules Engine requiring no software development to define/change rules, wired to T007 (FR-017)
- [ ] T070 [US5] 12 rule types (Validation, Approval, Assignment, Notification, Pricing, Discount, Tax, SLA, Escalation, Security, Compliance, AI) (FR-018)
- [ ] T071 [US5] Rule full field set (Rule ID, Rule Name, Business Area, Trigger, Conditions, Actions, Priority, Effective Date, Expiry Date, Version, Status, Owner), wired to acceptance scenarios 1, 3 (FR-019)
- [ ] T072 [US5] 12 condition operators (Equal, Not Equal, Greater Than, Less Than, Between, Contains, Starts With, Ends With, Null, Not Null, AND, OR, NOT), wired to acceptance scenarios 1–2 (FR-020)
- [ ] T073 [P] [US5] Business Rules Engine Admin UI
- [ ] T074 [US5] Integration test: an order satisfying both configured conditions fires the rule's Action, an order satisfying only one condition does not fire the Action, a rule with a future Effective Date does not apply even if conditions match, two active rules of differing Priority matching the same input resolve per the (flagged NEEDS CLARIFICATION) precedence behavior — all 4 acceptance scenarios in `backend/tests/integration/us5-business-rules-engine.integration.test.ts`

**Checkpoint**: The mechanism underpinning Decision nodes and Approval Automation across the platform is independently functional.

---

## Phase 8: User Story 6 — Event-Driven Automation Triggers a Workflow From a Platform Event (Priority: P3)

**Independent Test**: Bind one Event Source (e.g., a webhook) to one Automation Action (e.g., Create Record), fire the event, and confirm the action executes without manual initiation.

- [ ] T075 [US6] 13 event sources (User Actions, Database Changes, API Calls, Webhooks, File Uploads, Payment Events, CRM Events, HR Events, Inventory Events, IoT Devices, Mobile App Events, Calendar Events, Scheduled Events), wired to T015, T023's engine-identity note, acceptance scenarios 1, 3 (FR-045)
- [ ] T076 [US6] 14 automation actions (Create/Update/Delete Record, Send Email, Send SMS, Push Notification, WhatsApp Notification, API Call, Generate Document, Generate Report, Trigger AI, Assign Task, Schedule Meeting, Create Ticket) (FR-046)
- [ ] T077 [US6] Scheduler (Real-Time, Hourly, Daily, Weekly, Monthly, Yearly, Cron Expressions, Custom Intervals), wired to acceptance scenario 2 (FR-047)
- [ ] T078 [P] [US6] Event-Driven Automation Admin UI
- [ ] T079 [US6] Integration test: a Database-Changes-bound Send-Email automation fires automatically on the bound change, a Cron-Expression-scheduled automation executes at the scheduled time, a Webhook-bound automation executes its configured Action on external call and logs the triggering event — all 3 acceptance scenarios in `backend/tests/integration/us6-event-driven-automation.integration.test.ts`

**Checkpoint**: The generalization of triggering beyond human-initiated workflow starts is independently functional.

---

## Phase 9: User Story 7 — AI Process Intelligence Identifies an Automation Opportunity (Priority: P3)

**Independent Test**: Run the AI Process Assistant against a dataset of completed workflow executions and confirm it returns at least one recommendation populated with all required fields, independent of whether any recommendation is acted upon.

- [ ] T080 [US7] AI continuous optimization of enterprise workflows (Workflow Optimization, Process Mining, Process Discovery, Bottleneck Detection, SLA Prediction, Intelligent Routing, Auto Assignment, Smart Recommendations, Process Simulation, Failure Prediction, Compliance Monitoring, Automation Opportunity Detection), wired to T017, T024's `008`-reuse note, acceptance scenario 1 (FR-052)
- [ ] T081 [US7] AI Process Assistant natural-language Q&A across the 10 documented example questions (FR-053)
- [ ] T082 [US7] AI recommendation full field set (Recommendation, Supporting Analytics, Confidence Score, Business Impact, Estimated Cost Savings, Risk Level, Suggested Action, Responsible Team, Expected Improvement), wired to acceptance scenario 2 (FR-054)
- [ ] T083 [US7] Advisory-only governance: no workflow/rule/robot configuration change applied autonomously from an AI recommendation, wired to T029's contract test, acceptance scenario 3 (FR-055)
- [ ] T084 [P] [US7] AI Process Assistant UI
- [ ] T085 [US7] Integration test: a "where are the process bottlenecks?" query identifies the known-bottleneck process with supporting analytics, an automate-this-process recommendation includes Confidence Score and Estimated Cost Savings before any human decision, a generated recommendation results in zero automatic workflow/rule/robot changes until a human approves and applies the Suggested Action — all 3 acceptance scenarios in `backend/tests/integration/us7-ai-process-intelligence.integration.test.ts`

**Checkpoint**: The optimization layer closing the loop between execution data and continuous improvement is independently functional.

---

## Phase 10: Forms & Dynamic Data Collection, Workflow Analytics & Monitoring, Security & Governance (supports FR-040–FR-051, FR-056–FR-061; cross-cutting, no single owning story)

- [ ] T086 Enterprise-grade form management (Form Templates, Dynamic Forms, Conditional Fields), wired to T014 (FR-040)
- [ ] T087 Validation Rules, Auto Save, Offline Forms (FR-041)
- [ ] T088 File Attachments, Digital Signature, GPS Capture, QR/Barcode Integration, OCR Capture on forms (FR-042)
- [ ] T089 18 form field types (Text, Number, Currency, Date, Time, Email, Phone, Address, Dropdown, Checkbox, Radio, Rating, Image, Video, Audio, Signature, Rich Text, Location) (FR-043)
- [ ] T090 Form workflow sequence (Create Form→Publish→Data Collection→Validation→Workflow→Storage→Reporting) (FR-044)
- [ ] T091 Continuous workflow execution monitoring (FR-048)
- [ ] T092 10 workflow KPIs (Active/Completed/Failed Workflows, Average Execution Time, SLA Compliance, Automation Rate, Manual Intervention Rate, Approval Time, Queue Size, Exception Count), wired to T016 (FR-049)
- [ ] T093 Executive Dashboard (Automation ROI, Time Saved, Cost Savings, Process Bottlenecks, Workflow Health, Department Performance, Top Automated Processes, SLA Violations, Exception Trends, AI Recommendations) (FR-050)
- [ ] T094 10 reports (Workflow Performance, SLA Report, Process Efficiency, Approval Report, Automation Savings, Error Report, User Activity, Department Analytics, Compliance Report, Executive Summary) (FR-051)
- [ ] T095 RBAC, Workflow-Level Permissions, Rule-Level Permissions, wired to T025's `001`/`016`-reuse note (FR-056)
- [ ] T096 Encryption at Rest and in Transit for all workflow, rule, and process data (FR-057)
- [ ] T097 Digital Signatures and Immutable Audit Logs for workflow and approval activity (FR-058)
- [ ] T098 Version Management, Policy Enforcement, Compliance Monitoring (FR-059)
- [ ] T099 Disaster Recovery and High Availability for the workflow automation platform (FR-060)
- [ ] T100 Integration with HRMS (`059`), CRM (`013`), Finance (`058`), Procurement (`055`)/(`057`), Inventory & Warehouse (`056`), Project Management (`061`), Customer Support, DMS (`062`, confirmed per T026), LMS (`004`), Community Platform, Identity & Access Management, Email/SMS/WhatsApp Services, Payment Gateways, Calendar Services, Business Intelligence, AI Platform (`008`), API Gateway (FR-061)
- [ ] T101 [P] Forms, Analytics/Monitoring & Security/Governance UI

---

## Phase 11: Polish — Final Validation

- [ ] T102 Resolve and document the 9 preserved NEEDS CLARIFICATION items (3 self-flagged, 6 from Edge Cases) not already closed by `research.md`
- [ ] T103 Final audit: cross-check every FR-001–FR-061 against an implementation or validation task; re-verify the `008`, `001`/`016`, `062` reuse decisions are respected, and confirm the §1 large-scope finding and the extended §2 022/032/063 gate remain explicitly documented rather than silently assumed resolved
- [ ] T104 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `008`'s `ai-gateway`/`ai-guardrails`, and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2)**: US1 (Workflow Designer) is the foundational, no-code process-authoring capability every other chapter capability feeds into or depends on and must land first; US2 (Approval Chain) depends on US1's Workflow Designer/node types existing as the substrate approval chains are built from.
- **P2 stories (US3, US4, US5)**: US3 (RPA) is independently valuable and can be built in parallel with US4/US5 once Foundational is complete; US4 (Low-Code Builder) depends on US1's Workflow Designer and US5's Business Rules Engine as building blocks; US5 (Business Rules Engine) is independent and feeds Decision nodes used throughout US1/US2.
- **P3 stories (US6, US7)**: US6 (Event-Driven Automation) extends the reach of the P1/P2 foundation; US7 (AI Process Intelligence) depends on execution history accumulated by US1–US6. Both are independent of each other and should land last among the numbered stories.
- **Phase 10 (Forms, Analytics/Monitoring, Security/Governance)** depends on Foundational and US1–US2; can land alongside US3–US7.
- **Polish (Phase 11)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes — including the large-scope §1 finding) → **STOP and VALIDATE** the three Foundational contract tests (no-code-workflow-design-test-publish-without-engineering, approval-history-100pct-complete-immutable, ai-process-recommendation-zero-autonomous-config-change) pass → US1 (Workflow Designer) → US2 (Approval Chain) → **STOP and VALIDATE** the no-code process-authoring and approval-chain foundation is sound — this is the point at which the six-affected-feature question from §1 should be resolved with the user before further platform features build atop either this engine or their own duplicated logic → US3 (RPA) + US4 (Low-Code Builder) + US5 (Business Rules Engine) + Phase 10 (Forms/Analytics/Security) → US6 (Event-Driven Automation) + US7 (AI Process Intelligence) → Polish.
