---
description: "Task list for Feature 061 — Enterprise Project Management & Collaboration"
---

# Tasks: Enterprise Project Management & Collaboration

**Input**: Design documents from `/specs/061-project-management-collaboration/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis closing bidirectional integration gaps with `058` and `059`, and surfacing a new Project-"Client"-vs-`013`-Account cross-reference), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC). This feature also assumes `058`'s General Ledger, `059`'s Employee Master Profile/Leave Request, `013`'s Account entity, `055`'s Purchase Request/PO, and `008`'s `ai-gateway`/`ai-guardrails` exist as consumption points.

**Tests**: Included throughout — the AI recommendation nine-field/traceability gate, the burnout-detection-to-risk-alert guarantee, and the AI-project-recommendation human-approval gate each get a dedicated Foundational contract test, matching this spec's own SC-004, SC-005, and FR-037.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single story (Team Collaboration, Security & Governance, Enterprise Integrations — all forward-declared to not-yet-planned 062/063/069 where applicable).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC), and that `058`'s General Ledger, `059`'s Employee Master Profile/Leave Request, `013`'s Account entity, `055`'s Purchase Request/PO, and `008`'s `ai-gateway`/`ai-guardrails` exist as consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: numeric thresholds for "Overallocated" utilization %, Burnout Detection triggering signals, AI confidence-score thresholds, and budget-overrun block-vs-warning percentage (explicitly self-flagged); Agile-vs-Waterfall reconciliation within a single Hybrid project; burnout-flag-specific override/dispute workflow; concurrent-allocation-conflict blocking/warning behavior; conflicting simultaneous AI recommendations about the same resource; dependency-cycle/conflict detection across the four dependency types; milestone-rejection resubmission workflow; terminal-status (Cancelled/Archived) project time-logging/cost-recording behavior; AI-recommendation expiration/re-evaluation rule
- [ ] T003 [P] Add `backend/src/modules/project-management/{portfolio-project-foundation,task-work-management,ai-project-assistant-intelligence,ai-burnout-detection,agile-scrum-kanban,resource-capacity-planning,timesheets-productivity,project-financial-management,portfolio-analytics-executive,collaboration-security-integrations}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Portfolio / Program` entity in `backend/src/modules/project-management/portfolio-project-foundation/portfolio-program.entity.ts`
- [ ] T005 [P] Define the `Project` entity in `backend/src/modules/project-management/portfolio-project-foundation/project.entity.ts`
- [ ] T006 [P] Define the `Phase / Milestone` entity in `backend/src/modules/project-management/portfolio-project-foundation/phase-milestone.entity.ts`
- [ ] T007 [P] Define the `Task / Subtask` entity in `backend/src/modules/project-management/task-work-management/task-subtask.entity.ts`
- [ ] T008 [P] Define the `Sprint (Product Backlog / Sprint Backlog)` entity in `backend/src/modules/project-management/agile-scrum-kanban/sprint.entity.ts`
- [ ] T009 [P] Define the `Kanban Board / Card` entity in `backend/src/modules/project-management/agile-scrum-kanban/kanban-board-card.entity.ts`
- [ ] T010 [P] Define the `Resource` entity (Employee type referencing `059`'s Employee Master Profile, per plan.md §2) in `backend/src/modules/project-management/resource-capacity-planning/resource.entity.ts`
- [ ] T011 [P] Define the `Resource Allocation` entity in `backend/src/modules/project-management/resource-capacity-planning/resource-allocation.entity.ts`
- [ ] T012 [P] Define the `Timesheet Entry` entity in `backend/src/modules/project-management/timesheets-productivity/timesheet-entry.entity.ts`
- [ ] T013 [P] Define the `Project Budget / Cost Category` entity in `backend/src/modules/project-management/project-financial-management/project-budget-cost-category.entity.ts`
- [ ] T014 [P] Define the `AI Recommendation` entity in `backend/src/modules/project-management/ai-project-assistant-intelligence/ai-recommendation.entity.ts`
- [ ] T015 [P] Define the `Burnout Indicator` entity in `backend/src/modules/project-management/ai-burnout-detection/burnout-indicator.entity.ts`
- [ ] T016 [P] Define the `Notification / Alert` entity in `backend/src/modules/project-management/collaboration-security-integrations/notification-alert.entity.ts`
- [ ] T017 Task full field set (Task ID, Name, Description, Project, Parent Task, Assignee, Reviewer, Priority, Status, Estimated/Actual Hours, Due Date, Dependencies, Attachments, Comments, Activity History), wired to T007 (FR-011)
- [ ] T018 Task status values (Backlog, Planned, Assigned, In Progress, Blocked, Under Review, Testing, Completed, Reopened, Cancelled) (FR-012)
- [ ] T019 Task priority values (Critical, High, Medium, Low) (FR-013)
- [ ] T020 Work management features (Task Assignment, Recurring Tasks, Task Templates, Checklists, Subtasks, Task Dependencies, Bulk Updates, Notifications, File Attachments, Version History) (FR-014)
- [ ] T021 Note: Project Financial Management (Budget/Cost/Revenue/Billing) posts into `058`'s General Ledger as the confirmed destination — closes a gap in `058/plan.md` §5, which had left "Project Management" unmapped to a specific feature number (per plan.md §1)
- [ ] T022 Note: the "Employees" resource type consumes `059`'s canonical Employee Master Profile and Leave Integration reads `059`'s Leave Request/Attendance data — closes a gap now recorded in `059/plan.md` §7 (per plan.md §2)
- [ ] T023 Note: a Project's "Client" field references `013`'s canonical Account entity rather than defining an independent Client concept — a cross-reference never mentioned by this feature's own spec.md Assumptions (per plan.md §3)
- [ ] T024 Note: project-linked Purchase Requests and Vendor Costs consume `055`'s canonical Purchase Request/PO records tagged with a project reference, rather than a second parallel procurement record (per plan.md §4)
- [ ] T025 Note: AI Project Assistant and AI Project Intelligence (including Burnout Detection) reuse `008`'s `ai-gateway`/`ai-guardrails` for provider access/governance, with structured-project-data query/grounding as this feature's own new build (per plan.md §5)
- [ ] T026 Note: Portfolio-Level, Project-Level, and Task-Level Permissions are additive scoping layers on `001`'s/`016`'s existing RBAC engine, structurally analogous to `060`'s Territory-Based Security/Record-Level Permissions layering (per plan.md §6)
- [ ] T027 Note: Team Collaboration (chat/video/screen-sharing), Document Collaboration, and Workflow references are forward-declared to not-yet-planned `069` (Communication Platform), `062` (DMS), and `063` (Workflow Automation) respectively (per plan.md §7)
- [ ] T028 Contract test: 100% of AI recommendations (risk, delay, burnout, resource, budget) carry all nine required fields and are traceable to an approval, rejection, or override decision by a named Responsible Owner, in `backend/tests/contract/ai-recommendation-100pct-nine-field-traceable-decision.contract.test.ts` (SC-004)
- [ ] T029 Contract test: an AI Burnout Detection recommendation and a corresponding Risk Alert notification are produced for every resource whose allocation crosses into "Overallocated," in `backend/tests/contract/burnout-detection-risk-alert-for-every-overallocated-resource.contract.test.ts` (SC-005)
- [ ] T030 Contract test: zero AI-generated resource reassignment, schedule change, or budget action is applied without authorized human owner approval, in `backend/tests/contract/ai-project-recommendation-zero-autonomous-execution.contract.test.ts` (FR-037)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Create and Plan a Project Under Any Supported Methodology (Priority: P1) 🎯 MVP

**Independent Test**: Create one project with methodology set to "Hybrid," populate its Project Master Profile fields, build a WBS with milestones and dependencies, and confirm the Gantt/Timeline/Calendar views and Critical Path Analysis reflect the plan.

- [ ] T031 [US1] Centralized, AI-powered environment spanning portfolios, programs, projects, resources, budgets, schedules, risks, quality, deliverables, collaboration, and executive reporting (FR-001)
- [ ] T032 [US1] 10-level portfolio hierarchy (Enterprise→Business Unit→Portfolio→Program→Project→Phase→Milestone→Task→Subtask→Checklist), wired to T004 (FR-002)
- [ ] T033 [US1] Portfolio management features (Portfolio Creation, Program Management, Project Templates, Business Case Management, Prioritization, Strategic Alignment, Governance, Budgeting, Benefits Tracking, Portfolio Risk Management, Executive Approvals, Health Monitoring) (FR-003)
- [ ] T034 [US1] Project Master Profile full field set (Project ID/Code/Name, Description, Business Unit, Client [references `013`'s Account per T023], Project Manager, Sponsor, Team Members, Budget, Actual Cost, Planned Start/End Date, Current Status, Progress %, Priority, Risk Level, Methodology, Tags, Documents, Linked Projects), wired to T005, acceptance scenario 1 (FR-004)
- [ ] T035 [US1] 7 project methodologies (Traditional, Agile, Hybrid, Scrum, Kanban, Waterfall, custom), including simultaneous multi-methodology Hybrid support, wired to acceptance scenario 2 (FR-005)
- [ ] T036 [US1] Project status values (Proposed, Planned, Approved, Active, On Hold, Delayed, Completed, Cancelled, Archived) (FR-006)
- [ ] T037 [US1] Enterprise-grade planning features (WBS, Milestones, Gantt Charts, Timeline View, Calendar View, Dependencies, Critical Path Analysis, Baseline Planning, Resource Scheduling, Capacity Planning, Sprint Planning, Release Planning, Roadmaps), wired to acceptance scenario 3 (FR-007)
- [ ] T038 [US1] 4 task dependency types (Finish to Start, Start to Start, Finish to Finish, Start to Finish), wired to acceptance scenario 3 (FR-008)
- [ ] T039 [US1] 5 scheduling modes (Automatic, Manual, Resource-Based, Constraint-Based, AI Scheduling) (FR-009)
- [ ] T040 [US1] Milestone full field set (Milestone ID, Title, Owner, Due Date, Dependencies, Completion Status, Approval Status, Supporting Documents), wired to T006, acceptance scenario 4 (FR-010)
- [ ] T041 [P] [US1] Project Creation, WBS & Gantt Planning UI
- [ ] T042 [US1] Integration test: a new project request captures the full Project Master Profile field set and sets status to "Proposed"/"Planned," a Hybrid-methodology project accepts both Agile sprint elements and Waterfall phases/milestones without forced re-classification, a WBS with all 4 dependency types reflects in the Gantt Chart/Timeline View/Critical Path Analysis, a saved milestone records the full required field set — all 4 acceptance scenarios in `backend/tests/integration/us1-project-creation-planning.integration.test.ts`

**Checkpoint**: The foundational MVP slice every other capability is scoped to is independently functional.

---

## Phase 4: User Story 2 — AI Project Assistant Surfaces At-Risk Projects and Predicted Delays (Priority: P1)

**Independent Test**: Pose each of the ten documented example questions to the assistant against a portfolio with live project data and confirm every answer is grounded in supporting data.

- [ ] T043 [US2] AI capabilities covering Project Risk Prediction, Schedule Optimization, Resource Allocation, Capacity Forecasting, Budget Forecasting, Task Prioritization, Delay Prediction, Productivity Analysis, Quality Prediction, Executive Summaries, Portfolio Optimization, wired to T014, T025's structured-data-grounding note (FR-033)
- [ ] T044 [US2] AI Project Assistant natural-language Q&A across the 10 documented example questions, wired to acceptance scenarios 1, 3 (FR-034)
- [ ] T045 [P] [US2] AI Project Assistant Risk/Delay UI
- [ ] T046 [US2] Integration test: a "which projects are at risk?" or "which milestones may be delayed?" query returns a ranked, evidence-backed answer, a displayed AI recommendation includes the full nine-field object shape, a project's schedule/budget data change triggers Delay/Risk Prediction re-evaluation surfaced to future assistant answers, an AI-recommended schedule/resource change requires authorized human owner approval before application — all 4 acceptance scenarios in `backend/tests/integration/us2-ai-project-assistant-risk-delay.integration.test.ts`

**Checkpoint**: The platform's headline AI capability, converting passive status data into a proactive decision aid, is independently functional.

---

## Phase 5: User Story 3 — AI Burnout Detection Flags an Overloaded Team Member (Priority: P1)

**Independent Test**: Allocate a single resource above capacity across two or more projects, confirm the Resource Dashboard shows them under "Overallocated Resources," confirm the AI Burnout Detection recommendation is produced with the required fields, and confirm a Risk Alert notification is delivered.

- [ ] T047 [US3] AI Recommendation nine-field object shape (Recommendation, Business Reason, Supporting Data, Confidence Score, Estimated Business Impact, Risk Level, Suggested Action, Responsible Owner, Expected Completion Date) applied to Burnout Detection, wired to T029's contract test, acceptance scenarios 1–3 (FR-035)
- [ ] T048 [P] [US3] Burnout Detection & Risk Alert Review UI
- [ ] T049 [US3] Integration test: an over-capacity resource allocation appears under "Overallocated Resources" with Utilization %/Available Capacity, sustained overallocation/extended-hours signals produce a Burnout Detection recommendation with the full required field set, the recommendation's surfacing to the responsible manager delivers a Risk Alert notification, a Project Manager's accept/adjust/reject decision requires human review rather than automatic application — all 4 acceptance scenarios in `backend/tests/integration/us3-ai-burnout-detection.integration.test.ts`

**Checkpoint**: The people-risk safeguard protecting delivery and workforce health is independently functional.

---

## Phase 6: User Story 4 — Run a Sprint on a Kanban/Scrum Board (Priority: P2)

**Independent Test**: Move a Product Backlog item into a Sprint Backlog, drag its card across Kanban columns respecting a configured WIP limit, and confirm the Burndown Chart and Velocity Tracking update.

- [ ] T050 [US4] Scrum features (Product Backlog, Sprint Planning, Sprint Backlog, Daily Stand-ups, Sprint Review, Sprint Retrospective, Burndown Charts, Velocity Tracking, Story Points, Sprint Goals), wired to T008, acceptance scenarios 1, 4 (FR-015)
- [ ] T051 [US4] Kanban features (Kanban Boards, Custom Columns, WIP Limits, Swimlanes, Card Templates, Drag & Drop Workflow, Board Analytics, Cycle Time Tracking), wired to T009, acceptance scenario 2 (FR-016)
- [ ] T052 [US4] Agile metrics (Sprint Velocity, Lead Time, Cycle Time, Burndown, Burnup, Team Capacity, Story Completion Rate, Sprint Predictability, Defect Rate, Deployment Frequency), wired to acceptance scenario 3 (FR-017)
- [ ] T053 [P] [US4] Kanban/Scrum Board UI
- [ ] T054 [US4] Integration test: Sprint Planning moves selected backlog items into the Sprint Backlog with a Sprint Goal and Story Points, a Kanban column at its WIP limit rejects a further card drag-in, active-sprint daily work updates Burndown/Burnup/Velocity with per-card Cycle Time tracked, a sprint's Review/Retrospective records Sprint Completion Rate and Sprint Predictability — all 4 acceptance scenarios in `backend/tests/integration/us4-sprint-kanban-scrum.integration.test.ts`

**Checkpoint**: Iterative-delivery teams' day-to-day workflow is independently functional.

---

## Phase 7: User Story 5 — Balance Resource Allocation and Capacity Across Multiple Projects (Priority: P2)

**Independent Test**: Allocate a resource type to two concurrent projects and confirm the Resource Dashboard's Utilization %, Available Capacity, and Allocation Forecast reflect the combined allocation.

- [ ] T055 [US5] 10 resource types (Employees, Contractors, Consultants, Freelancers, Teams, Departments, Equipment, Meeting Rooms, Software Licenses, External Vendors), wired to T010, T022's `059`-Employee-reference note, acceptance scenario 1 (FR-018)
- [ ] T056 [US5] Resource & capacity capabilities (Resource Allocation, Capacity Planning, Utilization Tracking, Availability Calendar, Skills Matrix, Workload Balancing, Leave Integration, Shift Planning, Resource Forecasting, Multi-Project Allocation), wired to T011, acceptance scenarios 2, 4 (FR-019)
- [ ] T057 [US5] Resource Dashboard (Utilization %, Available Capacity, Overallocated Resources, Underutilized Resources, Skills Availability, Upcoming Availability, Allocation Forecast, Project Staffing), wired to acceptance scenario 3 (FR-020)
- [ ] T058 [P] [US5] Resource & Capacity Dashboard UI
- [ ] T059 [US5] Integration test: allocating a resource type to a project reflects in Utilization Tracking and the Availability Calendar, a Skills Matrix search supports staffing-match by Skills Availability, the Resource Dashboard displays all 8 required metrics across concurrent project demands, approved leave overlapping a planned allocation reduces reflected availability via Leave Integration — all 4 acceptance scenarios in `backend/tests/integration/us5-resource-capacity-planning.integration.test.ts`

**Checkpoint**: The manual complement to AI burnout/risk prediction, and their underlying data source, is independently functional.

---

## Phase 8: User Story 6 — Capture Timesheets and Track Productivity (Priority: P2)

**Independent Test**: Log a timesheet entry against a specific project/task via manual entry and via the mobile app, and confirm the entry's Billable Hours, Non-Billable Hours, and Overtime roll up into the Productivity Metrics view.

- [ ] T060 [US6] Time tracking methods (Manual Entry, Timer, Mobile App, Desktop Agent, Calendar Integration, Automated Detection, Offline Entry), wired to acceptance scenarios 1, 3 (FR-021)
- [ ] T061 [US6] Timesheet entry full field set (Employee, Project, Task, Date, Start/End Time, Duration, Billable/Non-Billable Hours, Overtime, Comments), wired to T012, acceptance scenario 1 (FR-022)
- [ ] T062 [US6] Productivity metrics (Planned/Actual Hours, Utilization, Efficiency, Task Completion Rate, Overtime, Idle Time, Billable Utilization, Productivity Score, Team Performance), wired to acceptance scenarios 2, 4 (FR-023)
- [ ] T063 [P] [US6] Timesheet Entry & Productivity UI
- [ ] T064 [US6] Integration test: a timesheet entry via any supported method records the full required field set, a period's logged timesheets compute the full productivity-metrics field set, an offline-logged entry synchronizes to the central record on reconnect, elevated Overtime/Utilization from recalculated metrics becomes available as AI Burnout Detection input — all 4 acceptance scenarios in `backend/tests/integration/us6-timesheets-productivity.integration.test.ts`

**Checkpoint**: The primary source-of-truth data feeding resource utilization, financial billing, and AI burnout analysis is independently functional.

---

## Phase 9: User Story 7 — Manage Project Budget, Cost, and Portfolio ROI (Priority: P2)

**Independent Test**: Set a project Budget, record Actual Cost across the 9 cost categories, and confirm the Financial Dashboard shows Remaining Budget, Cost Variance, Budget Variance, Forecasted Cost, and ROI.

- [ ] T065 [US7] Project Finance integration with `058`'s Enterprise Finance, wired to T021's GL-posting note (FR-027)
- [ ] T066 [US7] Financial management capabilities (Project Budget, Cost Planning, Expense Tracking, Purchase Requests [via T024's `055`-reference note], Vendor Costs, Resource Costs, Revenue Tracking, Profitability Analysis, Billing, Invoicing, Forecasting), wired to acceptance scenarios 2–3 (FR-028)
- [ ] T067 [US7] 9 cost categories (Labor, Equipment, Software, Infrastructure, Procurement, Marketing, Travel, Training, Miscellaneous), wired to T013, acceptance scenario 1 (FR-029)
- [ ] T068 [US7] Financial Dashboard (Budget, Actual Cost, Remaining Budget, Revenue, Profit, Margin, Cost Variance, Budget Variance, Forecasted Cost, ROI), wired to acceptance scenario 4 (FR-030)
- [ ] T069 [P] [US7] Project Financial Dashboard UI
- [ ] T070 [US7] Integration test: completed Cost Planning categorizes costs across all 9 categories, recorded Expense Tracking/Purchase Requests/Vendor Costs/Resource Costs update Actual Cost/Remaining Budget/Cost Variance/Budget Variance, recorded Revenue Tracking/Billing computes Profit/Margin/ROI, multiple portfolio projects' ROI/Revenue Contribution are available for portfolio-level comparison — all 4 acceptance scenarios in `backend/tests/integration/us7-project-financial-management.integration.test.ts`

**Checkpoint**: The financial-control layer governing which projects continue to receive funding/staffing is independently functional.

---

## Phase 10: User Story 8 — Executive Reviews Portfolio Health on the Analytics Dashboard (Priority: P3)

**Independent Test**: Populate several projects with status, budget, resource, and risk data, open the executive dashboard, and confirm all twelve documented KPIs and the ten documented report types render with current data.

- [ ] T071 [US8] Executive dashboard (Active Projects, Portfolio Health, Budget Utilization, Schedule Variance, Cost Variance, Project Success Rate, Resource Utilization, Revenue Contribution, Delivery Performance, Customer Satisfaction, Risk Score, ROI), wired to acceptance scenario 1 (FR-031)
- [ ] T072 [US8] On-demand reports (Portfolio Summary, Project Status, Resource Report, Financial Report, Productivity Report, Risk Report, Milestone Report, Executive Scorecard, Team Performance, Capacity Forecast), wired to acceptance scenario 2 (FR-032)
- [ ] T073 [P] [US8] Executive Portfolio Analytics Dashboard UI
- [ ] T074 [US8] Integration test: opening the dashboard across active portfolio projects displays all 12 required KPIs, requesting a report generates any of the 10 documented report types on demand, a project's status/budget/risk data change refreshes the affected KPIs — all 3 acceptance scenarios in `backend/tests/integration/us8-executive-portfolio-analytics.integration.test.ts`

**Checkpoint**: The read-only executive roll-up depending on every other story's data is independently functional.

---

## Phase 11: Team Collaboration, Security & Governance, Enterprise Integrations (supports FR-024–FR-026, FR-036–FR-040; cross-cutting, no single owning story)

- [ ] T075 Collaboration features (Team Chat, Direct Messaging, Project Channels, Group Discussions, Audio Calls, Video Meetings, Screen Sharing, Announcements, Discussion Threads, Mentions, Polls, Reactions), forward-declared to `069` per T027's note (FR-024)
- [ ] T076 Document collaboration (File Sharing, Version Control, Document Comments, Collaborative Editing, Approval Workflows, Access Permissions, Activity Timeline, Secure Storage), forward-declared to `062` per T027's note (FR-025)
- [ ] T077 Notification generation (Task Assignments, Due Dates, Mentions, Comments, Approvals, Status Changes, Milestone Completion, Risk Alerts, Budget Alerts, AI Recommendations), wired to T016 (FR-026)
- [ ] T078 RBAC with Portfolio/Project/Task-Level Permissions, wired to T026's layered-scoping note (FR-036)
- [ ] T079 Multi-Level Approvals, Digital Signatures, and mandatory human approval before any AI-generated recommendation is applied, wired to T030's contract test (FR-037)
- [ ] T080 Audit Trails and Version Control for project, task, financial, and document changes (FR-038)
- [ ] T081 Data Encryption and Compliance Monitoring across the platform (FR-039)
- [ ] T082 Integration with HRMS (`059`), CRM (`013`), Finance (`058`), Procurement (`055`), Inventory (`056`), Document Management (`062`), Workflow Automation (`063`), Calendar Services, Email Services, Video Conferencing, Notification Service, Business Intelligence, AI Platform (`008`), API Gateway (FR-040)
- [ ] T083 [P] Collaboration, Security/Governance & Integrations UI

---

## Phase 12: Polish — Final Validation

- [ ] T084 Resolve and document the 9 preserved NEEDS CLARIFICATION items (2 self-flagged, 7 from Edge Cases) not already closed by `research.md`
- [ ] T085 Final audit: cross-check every FR-001–FR-040 against an implementation or validation task; re-verify the `058`, `059`, `013`, `055`, `008`, `001`/`016` reuse decisions are respected, and confirm `062`/`063`/`069` remain explicitly forward-declared rather than silently assumed
- [ ] T086 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `058`'s GL, `059`'s Employee/Leave data, `013`'s Account entity, `055`'s PR/PO, and `008`'s `ai-gateway`/`ai-guardrails`, and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US3)**: US1 (Project Creation/Planning) is the foundational MVP slice every other capability is scoped to and must land first; US2 (AI Risk/Delay Assistant) and US3 (AI Burnout Detection) both depend on US1's projects existing as a subject, and can be built in parallel with each other.
- **P2 stories (US4, US5, US6, US7)**: US4 (Sprint/Kanban) depends on US1's WBS/task foundation; US5 (Resource/Capacity) depends on US1's projects existing to allocate resources against, and feeds US2/US3's AI risk/burnout data; US6 (Timesheets) depends on US1's tasks existing to log time against, and feeds US3's burnout signals; US7 (Financial Management) depends on US1's projects existing. US4–US7 can be built in parallel with each other.
- **P3 story (US8)** depends on US1, US5, US6, and US7's data already existing to roll up, and should land last among the numbered stories.
- **Phase 11 (Collaboration/Security/Integrations)** depends on Foundational and US1; can land alongside US4–US8.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (ai-recommendation-100pct-nine-field-traceable-decision, burnout-detection-risk-alert-for-every-overallocated-resource, ai-project-recommendation-zero-autonomous-execution) pass → US1 (Project Creation/Planning) → **STOP and VALIDATE** the foundational MVP slice is sound → US2 (AI Risk/Delay Assistant) + US3 (AI Burnout Detection) → **STOP and VALIDATE** both AI-advisory gates hold → US4 (Sprint/Kanban) + US5 (Resource/Capacity) + US6 (Timesheets) + US7 (Financial Management) + Phase 11 (Collaboration/Security/Integrations) → US8 (Executive Portfolio Analytics) → Polish.
