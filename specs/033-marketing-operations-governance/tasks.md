---
description: "Task list for Feature 033 — Marketing Operations, Campaign Governance & Budget Control"
---

# Tasks: Marketing Operations, Campaign Governance & Budget Control

**Input**: Design documents from `/specs/033-marketing-operations-governance/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 001, 016, 018, 022, 027, 028, 032), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `018`'s Campaign entity, `016`'s escalating-approval-chain mechanism, `022`'s automation substrate, `027`'s Dashboard framework/Audit Log Entry, `028`'s ROI engine, and `008`'s AI gateway exist as integration/extension points.

**⚠️ TWO UNRESOLVED DEPENDENCIES, PRESERVED, NOT RESOLVED**:
1. This feature's relationship to `022`/`032`'s still-open workflow-engine question (see `032/plan.md`) — FR-010's operational automations are scoped as a thin layer pending that resolution, not a third engine.
2. Whether this feature's Campaign Registry extends `018`'s existing `Campaign` entity or requires separate reconciliation — spec.md's own Assumptions state the former as the working hypothesis, but this is not yet confirmed against `018`'s actual schema.

Neither gate is closed by this feature. No task below may be treated as final architecture for these two areas until both are resolved.

**Tests**: Included throughout — campaign-lifecycle stage-order enforcement, budget-spend/approval matching, and AI-advisory-only each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-002, and SC-007/Constitution Article II.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus three supplementary cross-cutting phases for FR groups not owned by any single prioritized story (calendar/asset-requests/automation; collaboration/tasks/compliance/legal/brand/documentation; executive reporting/analytics/audit/security).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor reused via `016`), and that `018`'s Campaign entity, `016`'s approval-chain mechanism, `022`'s automation substrate, `027`'s Dashboard framework/Audit Log Entry, `028`'s ROI engine, and `008`'s AI gateway exist as integration/extension points
- [ ] T002 Resolve `research.md` open items before proceeding, **in priority order**: (1) confirm this feature does not add a third automation engine pending the `022`/`032` gate; (2) confirm the Campaign Registry extends `018`'s Campaign entity rather than duplicating it; (3) Emergency-approval authorization rules (who, ceiling, retroactive review); (4) PO-to-invoice reconciliation rule; (5) approval-chain timeout/escalation-on-non-response rule; (6) capacity-conflict override behavior; (7) re-approval threshold for post-approval changes; (8) shared-budget-pool reconciliation rule; (9) vendor SLA/rating-breach consequence workflow
- [ ] T003 [P] Add `backend/src/modules/{campaign-governance-lifecycle,marketing-calendar,marketing-asset-requests,operational-automation,budget-management,financial-approval-chain,vendor-procurement,resource-capacity-planning,team-collaboration-tasks,risk-compliance-legal,operations-reporting,ai-operations-assistant,operations-security}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the Campaign Registry governance-fields extension in `backend/src/modules/campaign-governance-lifecycle/campaign-registry.entity.ts` — **extends `018`'s existing `Campaign` entity**, not a second independent entity (pending schema confirmation)
- [ ] T005 [P] Define the `Budget Category` entity in `backend/src/modules/budget-management/budget-category.entity.ts`
- [ ] T006 [P] Define the `Cost Center Mapping` entity in `backend/src/modules/budget-management/cost-center-mapping.entity.ts`
- [ ] T007 [P] Define the `Approval Step / Financial Approval Chain` entity in `backend/src/modules/financial-approval-chain/approval-step.entity.ts`
- [ ] T008 [P] Define the `Vendor` entity in `backend/src/modules/vendor-procurement/vendor.entity.ts`
- [ ] T009 [P] Define the `Purchase Order / Procurement Record` entity in `backend/src/modules/vendor-procurement/procurement-record.entity.ts`
- [ ] T010 [P] Define the `Risk Record` entity in `backend/src/modules/risk-compliance-legal/risk-record.entity.ts`
- [ ] T011 [P] Define the `Resource / Resource Capacity Plan` entity in `backend/src/modules/resource-capacity-planning/resource.entity.ts`
- [ ] T012 [P] Define the `Task` entity in `backend/src/modules/team-collaboration-tasks/task.entity.ts`
- [ ] T013 [P] Define the `Milestone` entity in `backend/src/modules/team-collaboration-tasks/milestone.entity.ts`
- [ ] T014 [P] Define the `Marketing Calendar Entry` entity in `backend/src/modules/marketing-calendar/marketing-calendar-entry.entity.ts`
- [ ] T015 [P] Define the `AI Recommendation` entity in `backend/src/modules/ai-operations-assistant/ai-recommendation.entity.ts`
- [ ] T016 Note: the Campaign Registry extends `018`'s existing `Campaign` entity via a governance-fields extension/join; it MUST NOT be implemented as a second, independent `Campaign` entity
- [ ] T017 Note: the financial approval chain and campaign approval workflow are configured instances of `016`'s constitution-cited escalating-approval-chain mechanism, not a new approval-chain execution engine
- [ ] T018 Note: FR-010's operational automations run on `022`'s (or the eventually-resolved `022`/`032`) trigger/condition/action substrate; this feature does not build a third automation/workflow execution engine
- [ ] T019 Note: `Audit Log Entry` is reused from `027`'s/`001`'s/`016`'s existing platform-wide audit-log interceptor; no new audit-log entity is created
- [ ] T020 Note: ROI figures displayed in this feature's budget-tracking views are computed by `028`'s existing financial-formula engine, fed by this feature's spend data, not independently recalculated
- [ ] T021 Contract test: campaign lifecycle stages cannot be skipped or reordered, and the audit trail can reconstruct the full lifecycle history, in `backend/tests/contract/campaign-lifecycle-stage-order.contract.test.ts` (FR-001, SC-001)
- [ ] T022 Contract test: zero campaigns record Actual Spend exceeding Allocated Budget without a corresponding approval record at the appropriate financial approval level, in `backend/tests/contract/budget-spend-approval-match.contract.test.ts` (FR-018, SC-002)
- [ ] T023 Contract test: AI Marketing Operations Assistant outputs never autonomously change a campaign's budget, approval status, resource assignments, or risk record, in `backend/tests/contract/ai-ops-assistant-advisory-only.contract.test.ts` (FR-044, SC-007, Constitution Article II)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — A Campaign Request Moves Through the Full Governance Lifecycle (Priority: P1) 🎯 MVP

**Independent Test**: Create a Campaign Request tied to a stated Business Objective, advance it stage by stage through to ROI & Executive Review, and confirm the stage sequence cannot be skipped, each transition is recorded, and the Campaign Registry reflects current stage/status at every point.

- [ ] T024 [US1] 12-stage ordered lifecycle with mandatory sequence enforcement, wired to T004, acceptance scenario 2 (FR-001)
- [ ] T025 [US1] Campaign Registry record (17 fields) creation at the "Campaign Request" stage, wired to acceptance scenario 1 (FR-002)
- [ ] T026 [US1] 16-type campaign classification (FR-003)
- [ ] T027 [US1] Governance policy enforcement (10 categories: SOPs, brand guidelines, naming conventions, approval/budget policies, legal review, compliance checks, content quality, asset management, documentation) (FR-004)
- [ ] T028 [US1] Campaign approval workflow (7 steps, Draft → Active) gating Active status, wired to T007 (FR-005)
- [ ] T029 [US1] 4 approval routing modes (Sequential, Parallel, Conditional, Emergency) (FR-006)
- [ ] T030 [US1] Stage-transition audit recording (actor, timestamp, previous/new stage), wired to T021's contract test, acceptance scenario 4 (FR-001)
- [ ] T031 [US1] ROI & Executive Review final-stage surfacing of Actual vs. Expected ROI, wired to acceptance scenario 3 and T020's reuse note
- [ ] T032 [P] [US1] Campaign governance lifecycle UI
- [ ] T033 [US1] Integration test: a Campaign Request creates a full registry record at the Request stage, a direct jump to Execution is blocked without the required stages, ROI review surfaces Actual vs. Expected ROI as the final stage, every transition is recorded with actor/timestamp/stage change — all 4 acceptance scenarios in `backend/tests/integration/us1-campaign-governance-lifecycle.integration.test.ts`

**Checkpoint**: The operational backbone every other capability in this chapter serves is independently functional.

---

## Phase 4: User Story 2 — Budget Burn-Rate Tracking Triggers an Overspend Alert (Priority: P1)

**Independent Test**: Allocate a campaign budget, record committed and actual spend entries approaching the allocated threshold, and confirm the system fires an alert on threshold crossing, overspend detection, or forecast-exceeds-allocation.

- [ ] T034 [US2] Budget planning across 9 levels (Annual, Quarterly, Monthly, Campaign, Department, Brand, Region, Vendor, Emergency), wired to T005 (FR-011)
- [ ] T035 [US2] Budget allocation across 14 categories (FR-012)
- [ ] T036 [US2] Real-time Allocated/Committed/Actual/Remaining/Forecast/Variance/Burn-Rate/ROI computation, wired to T020's reuse note, acceptance scenario 1 (FR-013)
- [ ] T037 [US2] Threshold-crossing budget alert to owner and finance stakeholders, wired to acceptance scenario 2 (FR-014)
- [ ] T038 [US2] Overspend-detected alert distinct from a threshold warning, wired to acceptance scenario 3 (FR-014)
- [ ] T039 [US2] Forecast-exceeds-allocation alert ahead of actual overspend, wired to acceptance scenario 4 (FR-014)
- [ ] T040 [US2] Cost Center, Profit Center, Department, Business Unit, and Brand mapping, wired to T006 (FR-015)
- [ ] T041 [P] [US2] Budget tracking / alert dashboard UI
- [ ] T042 [US2] Integration test: committed and actual spend entries update Remaining/Forecast/Variance/Burn-Rate/ROI in real time, a threshold crossing raises an alert to owner and finance, actual spend exceeding allocation raises a distinct overspend alert, forecast spend projected to exceed allocation raises an alert before actual crosses — all 4 acceptance scenarios in `backend/tests/integration/us2-budget-burn-rate-alerts.integration.test.ts`

**Checkpoint**: The budget-integrity foundation every other financial workflow depends on is independently functional.

---

## Phase 5: User Story 3 — Financial Approval Escalates Through the Configured Chain (Priority: P1)

**Independent Test**: Submit budget requests at different amounts and confirm each is routed to the correct minimum approval level per configured thresholds, with every approval/rejection decision recorded against its approver.

- [ ] T043 [US3] Configurable 6-level financial approval chain (Team Lead, Marketing Manager, Finance Manager, Finance Director, CMO, CEO) on `016`'s escalating-approval-chain mechanism, wired to T007 (FR-016)
- [ ] T044 [US3] Minimum-required-level determination from requested amount, with sequential routing, wired to acceptance scenario 1 (FR-017)
- [ ] T045 [US3] Multi-level advancement requiring every required level to act before the request is marked Approved, wired to acceptance scenario 2 (FR-017)
- [ ] T046 [US3] Rejection-at-any-level halts advancement with logged reason and approver, wired to acceptance scenario 3 (FR-019)
- [ ] T047 [US3] Full-chain approval unlocks Approval Status and availability for Resource Allocation/Procurement, wired to T022's contract test, acceptance scenario 4 (FR-018)
- [ ] T048 [US3] Emergency approval routing bypass — behavior preserved as `[NEEDS CLARIFICATION]` per spec.md pending T002's research.md resolution (FR-018)
- [ ] T049 [P] [US3] Financial approval chain routing UI
- [ ] T050 [US3] Integration test: a small request resolves at Team Lead, a CMO-level request is not Approved until CMO and CEO act, a rejection at any level stops advancement with a logged reason, full approval unlocks Approval Status and allocation availability — all 4 acceptance scenarios in `backend/tests/integration/us3-financial-approval-chain.integration.test.ts`

**Checkpoint**: The direct, concrete instantiation of Constitution Article VII in this chapter is independently functional.

---

## Phase 6: User Story 4 — A Vendor Procurement Request Moves From Request to Closure (Priority: P2)

**Independent Test**: Create a vendor profile, raise a procurement Request against a campaign budget, obtain a Quotation, route it through Approval, generate a Purchase Order, record Delivery and Invoice, process Payment, and confirm the request reaches Closure.

- [ ] T051 [US4] Vendor profiles across 7 vendor types, wired to T008, acceptance scenario 1 (FR-020)
- [ ] T052 [US4] Per-vendor Contract, Payment, Performance, SLA, and Rating tracking (FR-021)
- [ ] T053 [US4] 8-step procurement workflow (Request → Quotation → Approval → Purchase Order → Delivery → Invoice → Payment → Closure), wired to T009, acceptance scenario 2 (FR-022)
- [ ] T054 [US4] Quotation-attached-request Approval-step gating before Purchase Order generation, wired to acceptance scenario 2 (FR-022)
- [ ] T055 [US4] Delivery/Invoice recording advancing toward Payment, wired to acceptance scenario 3 (FR-022)
- [ ] T056 [US4] Campaign-budget linkage reflecting vendor spend in Committed/Actual Budget figures, wired to acceptance scenario 4 (FR-023)
- [ ] T057 [P] [US4] Vendor/procurement workflow UI
- [ ] T058 [US4] Integration test: a procurement request creates a record linked to vendor and campaign budget, a quotation enters Approval before a Purchase Order, Delivery and Invoice advance toward Payment, Payment confirmation moves the record to Closure and updates the campaign budget — all 4 acceptance scenarios in `backend/tests/integration/us4-vendor-procurement.integration.test.ts`

**Checkpoint**: The controlled mechanism preventing vendor spend outside financial governance is independently functional.

---

## Phase 7: User Story 5 — A Risk Is Logged and Tracked Across Categories (Priority: P2)

**Independent Test**: Log a risk of each category against an active campaign with probability/impact/mitigation/owner, and confirm it appears on the campaign's risk register, can have its status updated, and triggers the risk-escalation notification path when appropriate.

- [ ] T059 [US5] 7-category risk classification (Budget, Delivery, Compliance, Vendor, Performance, Legal, Reputation) with a 5-field risk record, wired to T010, acceptance scenario 1 (FR-031)
- [ ] T060 [US5] Status-change recording reflected on the campaign's risk register, wired to acceptance scenario 2 (FR-032)
- [ ] T061 [US5] Risk re-evaluation-triggered escalation workflow notifying configured stakeholders, wired to acceptance scenario 3 and T018's automation-substrate reuse note (FR-032)
- [ ] T062 [US5] High-severity open-risk surfacing on the Executive Dashboard's "High Risk Campaigns" view, wired to acceptance scenario 4 and T020-style reuse of `027`'s dashboard framework
- [ ] T063 [P] [US5] Risk register UI
- [ ] T064 [US5] Integration test: a risk is logged with a required category and all 5 fields, a status change is recorded and reflected on the register, a probability/impact increase triggers an escalation notification, a high-severity open risk appears on the Executive Dashboard — all 4 acceptance scenarios in `backend/tests/integration/us5-risk-management.integration.test.ts`

**Checkpoint**: The first-class governance capability tracking risks before they materialize is independently functional.

---

## Phase 8: User Story 6 — The AI Marketing Operations Assistant Drafts an Executive Summary (Priority: P2)

**Independent Test**: Request an AI-generated executive summary for a campaign or portfolio and confirm it is produced from underlying campaign/budget/risk/resource data, with no automatic budget reallocation, approval, or status change as a side effect.

- [ ] T065 [US6] AI-drafted executive summaries (campaign status, budget position, resource utilization, risk highlights) drawn from existing records, consuming `008`'s gateway, wired to T015, acceptance scenario 1 (FR-043)
- [ ] T066 [US6] Budget/resource-allocation suggestions presented as advisory-only, never auto-changing records, wired to T023's contract test, acceptance scenario 2 (FR-044)
- [ ] T067 [US6] Risk predictions routed into the Risk Management register for human evaluation rather than auto-changing Risk Level/Status, wired to acceptance scenario 3 (FR-044)
- [ ] T068 [US6] Deterministic non-AI fallback (standard Executive Dashboard/Operational Analytics views) on AI unavailability, wired to acceptance scenario 4 (FR-045)
- [ ] T069 [US6] Remaining AI capabilities (campaign planning, timeline optimization, cost optimization, performance insights) (FR-043)
- [ ] T070 [P] [US6] AI Operations Assistant panel UI
- [ ] T071 [US6] Integration test: an executive summary is drawn from existing records, a recommendation requires human review and does not auto-change a record, a risk prediction is routed to the register rather than auto-applied, an AI outage falls back to the standard dashboards — all 4 acceptance scenarios in `backend/tests/integration/us6-ai-operations-assistant.integration.test.ts`

**Checkpoint**: The Article-II-governed assistive layer on top of the P1 governance/budget/approval capabilities is independently functional.

---

## Phase 9: User Story 7 — Resource Capacity Planning Flags an Over-Allocated Team (Priority: P3)

**Independent Test**: Assign multiple campaign tasks to the same resource until their workload exceeds capacity, and confirm the system's capacity calculations surface an overtime-risk or capacity-gap signal for that resource.

- [ ] T072 [US7] Resource records across 10 resource types, wired to T011, acceptance scenario 1 (FR-024)
- [ ] T073 [US7] Per-resource Availability, Utilization, Capacity, Skills, Assignments, and Workload tracking (FR-025)
- [ ] T074 [US7] 7 capacity calculations (Team Utilization, Resource Availability, Planned Workload, Overtime Risk, Delivery Forecast, Capacity Gaps, Hiring Requirements), wired to acceptance scenarios 2–3 (FR-026)
- [ ] T075 [US7] Within-capacity resource reflected as available rather than flagged as a conflict, wired to acceptance scenario 4
- [ ] T076 [P] [US7] Capacity planning dashboard UI
- [ ] T077 [US7] Integration test: assigned resources are tracked for utilization/capacity/workload, an over-capacity assignment surfaces an overtime-risk or capacity-gap signal, aggregate gaps surface a hiring signal alongside forecast, a within-capacity resource is shown as available — all 4 acceptance scenarios in `backend/tests/integration/us7-resource-capacity-planning.integration.test.ts`

**Checkpoint**: The planning/visibility capability supporting the higher-priority governance and budget workflows is independently functional.

---

## Phase 10: Marketing Calendar, Asset Requests & Operational Automation remainder (supports FR-007–FR-010; cross-cutting, no single owning story)

- [ ] T078 Marketing Calendar (Daily, Weekly, Monthly, Quarterly, Annual views), wired to T014 (FR-007)
- [ ] T079 Calendar filtering (Team, Campaign, Brand, Product, Region, Status, Budget, Owner) (FR-008)
- [ ] T080 Marketing asset request submission (9 asset types) linked to the originating campaign (FR-009)
- [ ] T081 Operational automated workflows (task creation, approval reminders, budget alerts, campaign notifications, SLA reminders, document requests, risk escalation, executive summaries) as a thin layer on T018's automation-substrate reuse note (FR-010)

**Checkpoint**: The scheduling/asset-request/notification substrate underlying campaign operations is independently functional.

---

## Phase 11: Team Collaboration/Task Management & Compliance/Legal/Brand/Documentation remainder (supports FR-027–FR-030, FR-033–FR-036; cross-cutting, no single owning story)

- [ ] T082 Shared team workspace (discussions, comments, mentions, file sharing, version history, notifications, activity feeds) (FR-027)
- [ ] T083 Task management (Name, Owner, Priority, Due Date, Status, Dependencies, Estimated/Actual Hours, Attachments), wired to T012 (FR-028)
- [ ] T084 Project timeline (Milestones, Deliverables, Dependencies, Delays, Resource Conflicts, Critical Path) (FR-029)
- [ ] T085 Milestone tracking (Campaign Approved, Content Ready, Design Complete, QA Complete, Launch, Mid Review, Optimization, Campaign Closed), wired to T013 (FR-030)
- [ ] T086 Compliance checks (Brand Review, Copyright, Trademark, Privacy, GDPR, CCPA, Advertising Standards, Internal Policy) (FR-033)
- [ ] T087 Legal Review (Terms, Claims, Promotions, Offers, Pricing, Contracts, IP, Third-party Content) gating progression past the Legal Review lifecycle stage, wired to T024's stage-order enforcement (FR-034)
- [ ] T088 Brand governance rules (Logo Usage, Typography, Color Palette, Tone of Voice, Visual Consistency, Messaging, Accessibility) (FR-035)
- [ ] T089 Campaign documentation (Brief, Objectives, Audience, Budget, Assets, Timeline, KPIs, Reports, Lessons Learned), wired to the Campaign Registry (FR-036)

**Checkpoint**: The collaboration, task/timeline, and compliance/legal/brand governance surface is independently functional.

---

## Phase 12: Executive Reporting/Analytics/Audit, Security & Polish

- [ ] T090 [P] Executive Dashboard (Active Campaigns, Budget Usage, ROI, Team Utilization, Upcoming Launches, High Risk Campaigns, Delayed Projects, Revenue, Forecast), rendered through `027`'s Dashboard framework, wired to T020's reuse note (FR-037)
- [ ] T091 8 Operational KPIs computation (Campaign Completion Rate, On-Time Delivery, Budget Accuracy, Resource Utilization, Approval Cycle Time, Campaign ROI, Cost Per Campaign, Marketing Efficiency) (FR-038)
- [ ] T092 Marketing scorecards segmented by Campaign, Department, Region, Brand, Team, and Individual (FR-039)
- [ ] T093 Operational analytics (Budget Trends, Campaign Trends, Resource Trends, Productivity, Approval Time, Spend Forecast, Risk Forecast, ROI Forecast) (FR-040)
- [ ] T094 Notifications across 8 event categories (New Task, Budget Approval, Campaign Approval, Deadline, Delay, Risk Escalation, Executive Review, Vendor Updates), reusing T018's automation-substrate note (FR-041)
- [ ] T095 Audit log capture across 8 category types (Campaign Changes, Budget Edits, Approvals, Rejections, User Activity, Document Changes, Financial Updates, Vendor Updates), wired to T019's reuse note (FR-042)
- [ ] T096 RBAC, MFA, encryption, audit trails, IP restrictions, and secure file storage, wired to `001`/`016` (FR-046)
- [ ] T097 Performance hardening pass toward the remaining numeric targets (Campaign/Budget/Resource dashboards under 3s, Approval Workflow under 2s, Executive Dashboard under 5s) (FR-047)
- [ ] T098 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (Emergency-approval rules, PO/invoice reconciliation, approval-chain timeout escalation, capacity-conflict override, re-approval threshold, shared-budget-pool reconciliation, vendor SLA-breach consequence) — plus reaffirm that the `022`/`032` and `018`/`033` ownership gates remain open and unresolved
- [ ] T099 Final audit: cross-check every FR-001–FR-047 against an implementation or validation task; verify the Campaign Registry extends `018`'s entity rather than duplicating it, financial/campaign approval chains reuse `016`'s mechanism, FR-010 automation does not introduce a third workflow engine, ROI figures display `028`'s calculation rather than recomputing it, and dashboards render through `027`'s framework
- [ ] T100 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `018`'s Campaign entity, `016`'s approval-chain mechanism, `022`'s automation substrate, `027`'s Dashboard framework/Audit Log Entry, and `028`'s ROI engine, and produces the entity infrastructure every subsequent phase depends on.
- **P1 stories (US1–US3)**: US1 (governance lifecycle) is the operational backbone every other capability serves and must ship first; US2 (budget burn-rate) and US3 (financial approval chain) both depend on US1's Campaign Registry and lifecycle-stage infrastructure and can build in parallel, though US3's full-chain-approval outcome feeds directly into US2's budget-availability state.
- **P2 stories (US4–US6)**: US4 (vendor procurement) depends on US2's budget infrastructure and US3's approval chain (procurement Approval step reuses the same mechanism); US5 (risk management) depends on US1's active campaigns to attach risk to; US6 (AI assistant) depends on US1–US5's underlying data to summarize — all three can build in parallel once their P1 dependencies are stable.
- **P3 story (US7)** depends on Foundational's Resource entity and Task infrastructure (Phase 11) and is independent of the other stories' approval/budget state.
- **Phase 10 (Calendar/Assets/Automation)** and **Phase 11 (Collaboration/Tasks/Compliance/Legal/Brand)** depend on Foundational and US1; Phase 11's Legal Review task (T087) gates US1's lifecycle stage progression, so it should land alongside US1 rather than strictly after all numbered stories.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities extending `018`/`016`/`022`/`027`/`028`, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (campaign-lifecycle-stage-order, budget-spend-approval-match, ai-ops-assistant-advisory-only) pass → US1 (governance lifecycle) → **STOP and VALIDATE** a campaign can move through the full 12-stage lifecycle with no skipped stages → US2 (budget burn-rate) + US3 (financial approval chain) in parallel → **STOP and VALIDATE** budget integrity and the Article VII approval chain are trustworthy → US4 (vendor procurement) + US5 (risk management) + US6 (AI assistant) in parallel → US7 (resource capacity) → Phase 10 (calendar/assets/automation) + Phase 11 (collaboration/compliance/legal/brand) in parallel → Polish.
