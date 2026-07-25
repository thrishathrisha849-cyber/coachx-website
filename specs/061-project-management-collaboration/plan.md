---
description: "Implementation plan for Feature 061 — Enterprise Project Management & Collaboration"
---

# Implementation Plan: Enterprise Project Management & Collaboration

**Branch**: `061-project-management-collaboration` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/061-project-management-collaboration/spec.md`

## Summary

This feature (Volume 14, Chapter 28) is TBT's internal delivery-management platform — Project Portfolio Management, Planning & Scheduling, Task & Work Management, Agile/Scrum/Kanban, Resource & Capacity Planning, Timesheets & Productivity Tracking, Team Collaboration, Project Financial Management, Portfolio Analytics, and AI Project Intelligence — the first feature this session to cover genuinely new ground (no prior feature specifies project/task/sprint/resource-allocation mechanics). Article II (AI Is Assistive, Never Autonomous) is FR-text-cited at FR-037, requiring authorized human approval before any AI-generated resource reassignment, schedule change, or budget action is applied.

## Ownership & Dependency Analysis

### §1. Project Financial Management vs. `058` (Finance, Accounting & Treasury) — CONFIRMED bidirectionally, closing a gap in `058`'s own integration list

Spec.md's own FR-027 explicitly states "System MUST integrate the Project Finance module with Enterprise Finance." Verified against `058`'s actual spec.md: FR-057 already names "Project Management" among its 8 named Enterprise Integration targets — but `058/plan.md` §5, written before this feature existed, only explicitly cross-referenced `055`/`056`/`057`/`059` by feature number and left "Project Management" as an unmapped item within FR-057's list (only "CRM" was explicitly mapped forward to `060`). **Ownership decision**: `061`'s Project Budget/Cost/Revenue/Billing data (FR-028–FR-030) posts into `058`'s General Ledger as the confirmed destination, the same pattern already established for `009` and `059`; `061` does not implement its own general ledger. (See the note at the end of this plan regarding closing this gap in `058/plan.md` §5.)

### §2. Resource ("Employees") & Leave Integration vs. `059` (HRMS & Payroll) — CONFIRMED bidirectionally, closing a second gap in `058`'s sibling `059`'s own integration list

Spec.md's own FR-018 lists "Employees" as one of ten resource types, and FR-019's "Leave Integration" reduces availability in capacity planning when approved leave overlaps a planned allocation (User Story 5 acceptance scenario 4). Verified against `059`'s actual spec.md: FR-055 already names "Project Management" among its 14 named Enterprise Integration targets — again left unmapped to a specific feature number in `059/plan.md` at the time it was written, since `061` did not yet exist. **Ownership decision**: `061`'s "Employee" resource type consumes `059`'s canonical Employee Master Profile rather than redefining an independent workforce identity, and Leave Integration reads `059`'s Leave Request/Attendance data as an input to capacity planning rather than reimplementing leave accrual/approval logic. (See the note at the end of this plan regarding closing this gap in `059/plan.md`.)

### §3. Project "Client" Field vs. `013` (CRM & Sales Support) — NEW finding, not mentioned anywhere in spec.md's own Assumptions

Spec.md's own Assumptions never mention `013` or the CRM platform by name, despite the Project Master Profile (FR-004) carrying a "Client" field. Checked independently: `013` FR-033 already defines the canonical Account entity (Account ID, name, legal name, type, parent account, industry, billing/shipping address, account owner, territory, customer segment, contract value, etc.) as "the parent of contacts, opportunities, contracts, and the 360-degree customer view." **Ownership decision**: a Project's "Client" field references `013`'s canonical Account entity rather than defining an independent Client concept — consistent with how `013`'s own Account already supports "contract value" and downstream revenue tracking that a client-delivery project's financials (per §1) would need to reconcile against.

### §4. Vendor Costs & Purchase Requests vs. `055` (Enterprise Procurement Platform) — confirmed clean

Not mentioned in spec.md's own Assumptions beyond a generic "Procurement" integration name (FR-040). `061`'s Project Financial Management (FR-028: "Purchase Requests, Vendor Costs") is checked against `055`'s canonical Purchase Request/Purchase Order/Supplier entities. **Ownership decision**: project-linked purchase requests and vendor costs consume `055`'s canonical Purchase Request/PO records (tagged with a project reference) rather than `061` maintaining a second, parallel procurement record — the same pattern already established for `056`'s inventory-procurement-automation reorders consuming `055`'s PR/PO workflow.

### §5. AI Project Intelligence vs. `008` (AI Assistant Platform) — confirmed clean, gateway reused, new structured-project-data grounding pattern

Consistent with the reuse pattern established for `056`–`060`. **Ownership decision**: the AI Project Assistant (FR-034) and AI Project Intelligence (FR-033, including Burnout Detection) reuse `008`'s `ai-gateway`/`ai-guardrails` for provider access and governance, but build their own structured-project-data query/grounding layer (schedule, budget, resource-utilization, timesheet data) — the same "shared gateway, new domain logic" pattern established throughout Wave 4/5.

### §6. RBAC vs. `001`/`016` — confirmed clean, a new three-level layering parallel to `060`'s territory/record-level pattern

Not mentioned in spec.md's own Assumptions beyond a generic RBAC reference (FR-036). **Ownership decision**: Portfolio-Level, Project-Level, and Task-Level Permissions (FR-036) are additive scoping layers on top of `001`'s/`016`'s existing layered RBAC engine, structurally analogous to `060`'s Territory-Based Security and Record-Level Permissions layered on top of CRM RBAC — no new authorization system, a three-tier scoping hierarchy configuring the existing engine.

### §7. Team Collaboration, Document Collaboration & Workflow vs. `062`/`063`/`069` — `062` CONFIRMED, `063` CONFIRMED (updated 2026-07-24), `069` preserved as forward-declared

Spec.md's own Assumptions state Security & Governance and Team Collaboration sections "do not duplicate" dedicated RBAC, Document Management, or Communication Platform chapters elsewhere in Volume 14, without naming specific feature numbers (since `061` predates them being explicitly cross-indexed). Per `specs/FEATURE-MANIFEST.md`: `062` (Document Management/DMS), `063` (Workflow Automation/BPM/Low-Code), and `069` (Enterprise Communication/Omnichannel) are the features this chapter's Document Collaboration (FR-025), Workflow references (FR-040), and Team Chat/Video/Screen-Sharing (FR-024) respectively defer to. `062` has since been planned and confirmed this boundary bidirectionally (`062/plan.md` §4). `069`'s manifest note already lists `021`/`052`/`060` as known consumers of its shared communication substrate — this plan adds `061` to that list now, since Team Chat/Direct Messaging/Video Meetings/Screen Sharing is exactly communication-platform-shaped content that should consume `069`'s future substrate rather than build a fourth parallel comms stack.

`063` has since been planned as the platform's general-purpose, dedicated BPM/Workflow/Approval-Automation chapter, and its own plan.md §1 identifies this feature's FR-037 (Multi-Level Approvals and Digital Signatures, including the mandatory human-approval gate on AI-generated recommendations) as a domain-specific application of the approval-chain mechanics `063` defines canonically. **Ownership decision**: this feature's project/task approval chains should be understood, at implementation time, as configuring `063`'s general-purpose Approval Automation engine for project-management-specific approval types, rather than as an independently built parallel approval implementation. This is a documentation-level cross-reference only; no functional requirement, entity, or task in this feature changes as a result.

`069` (Enterprise Communication & Omnichannel Engagement) has since been planned and CONFIRMS this feature's Team Collaboration dependency from its own side (`069/plan.md` §3): this feature's Team Chat/Direct Messaging/Video Meetings/Screen Sharing (its own FR-024) consume `069`'s Team Channels/presence/screen-sharing substrate (`069` FR-033–FR-034) rather than building independent collaboration infrastructure — CONFIRMED, no longer forward-declared.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile — timesheet entry, notifications) — consistent with 001–060.

**Primary Dependencies**: `058`'s General Ledger as the Project Finance posting destination (per §1, confirmed, closing a `058/plan.md` gap); `059`'s Employee Master Profile and Leave Request data as the resource/capacity-planning input (per §2, confirmed, closing a `059/plan.md` gap); `013`'s canonical Account entity as the Project "Client" field's reference target (per §3, new finding); `055`'s Purchase Request/PO as the vendor-cost/purchase-request source (per §4); `008`'s AI gateway/guardrails for AI Project Intelligence (per §5); `001`/`016`'s layered RBAC as the base layer Portfolio/Project/Task-Level Permissions compose on top of (per §6); `062`/`063`/`069` (not yet planned) for Document Management, Workflow Automation, and Communication Platform (per §7, forward-declared).

**Storage**: PostgreSQL (13 entities per Key Entities: Portfolio/Program, Project, Phase/Milestone, Task/Subtask, Sprint, Kanban Board/Card, Resource, Resource Allocation, Timesheet Entry, Project Budget/Cost Category, AI Recommendation, Burnout Indicator, Notification/Alert — with Project's Client field referencing `013`'s Account per §3, and Resource's Employee type referencing `059`'s Employee Master Profile per §2).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: ai-recommendation-100pct-nine-field-traceable-decision for SC-004, burnout-detection-risk-alert-for-every-overallocated-resource for SC-005, and ai-project-recommendation-zero-autonomous-execution for FR-037), Playwright (web/mobile e2e — project creation/WBS, AI Project Assistant query flow, Kanban board WIP enforcement, timesheet entry/sync, Financial Dashboard).

**Target Platform**: Web (Project/Portfolio console, executive dashboard) and mobile (timesheet entry, notifications).

**Performance Goals**: Per SC-002, the full portfolio hierarchy must be navigable for 100% of active portfolios without gaps; per SC-006, 100% of logged timesheet entries must roll up into Productivity Metrics without manual reconciliation.

**Constraints**: Zero AI-generated resource reassignment, schedule change, or budget action may be applied without authorized human owner approval (FR-037); every overallocated resource must produce both a Burnout Detection recommendation and a Risk Alert notification (SC-005); every AI recommendation must carry all nine required fields and be traceable to an approval/rejection/override decision (FR-035, SC-004); a Kanban column's configured WIP limit must be enforced against card drag-in attempts (User Story 4 acceptance scenario 2).

**Scale/Scope**: 13 entities, 40 FRs, 8 user stories, a 10-level portfolio hierarchy, 7 supported project methodologies, 4 dependency types, 10 timesheet capture methods, 12 executive KPIs, 10 report types, 11 AI Project Intelligence capabilities, 2 explicitly self-flagged NEEDS CLARIFICATION items (numeric thresholds for overallocation/burnout/confidence/budget-overrun; Agile-vs-Waterfall Hybrid-project reconciliation and AI-recommendation-conflict/expiration rules) plus 7 from Edge Cases, two confirmed bidirectional integration closures with `058` and `059` (§1–§2, closing gaps left in both features' own plan.md files), and one new cross-reference finding with `013` never mentioned by spec.md's own Assumptions (§3). This is the fourteenth consecutive feature this session to surface a genuine, previously-uncaught cross-feature nuance during planning.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | WIP-limit enforcement, Critical Path calculation, and productivity-metric roll-ups are all server-computed, never client-asserted (FR-016, FR-023). |
| II. AI Is Assistive, Never Autonomous | PASS — **FR-text-verbatim cited** | FR-037 explicitly requires authorized human owner approval before any AI-generated resource reassignment, schedule change, or budget action is applied; the AI MUST NOT execute such actions autonomously. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | AI recommendations present Confidence Score and Risk Level transparently (FR-035), not as guaranteed predictions. |
| IV. Historical Immutability | PASS | FR-038 requires immutable Audit Trails and Version Control for project, task, financial, and document changes. |
| V. Ledger-Based Internal Economies | PASS (reused, not redefined) | Project financial data posts into `058`'s existing ledger rather than a new one (per §1). |
| VI. Consent Is First-Class, Per-Channel, and Versioned | N/A | Internal team-productivity tool; notifications are operational, not marketing consent. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS | FR-036 requires Portfolio/Project/Task-Level Permissions and FR-037 requires Multi-Level Approvals; configures `001`'s/`016`'s existing engine (per §6). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Productivity Score and Burnout Indicators are evidence-based operational metrics, not purchasable status. |
| IX. Action Before Consumption | PASS | Every project, task, and milestone progresses through a governed status/approval lifecycle before being considered Active/Completed. |
| Localization & Language Requirements | PASS (not primary focus, inherited) | Internal enterprise tool; no dedicated localization surface beyond platform-wide requirements. |
| Security & Compliance Baseline | PASS | FR-039 requires Data Encryption and Compliance Monitoring across the platform. |

## Project Structure

### Documentation (this feature)

```
specs/061-project-management-collaboration/
├── spec.md
├── plan.md
├── research.md         # 9 NEEDS CLARIFICATION items (2 self-flagged, 7 from Edge Cases)
├── data-model.md        # 13 entities (Client references 013's Account, Employee resource references 059's Employee, per §2-§3)
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── ai-recommendation-100pct-nine-field-traceable-decision.contract.md
    ├── burnout-detection-risk-alert-for-every-overallocated-resource.contract.md
    └── ai-project-recommendation-zero-autonomous-execution.contract.md
```

### Source Code (repository root)

```
backend/src/modules/project-management/
├── portfolio-project-foundation/     # FR-001-010 — PPM, Project Master Profile, WBS/Gantt/Critical Path
├── task-work-management/             # FR-011-014 — Task/Subtask, status/priority, checklists
├── ai-project-assistant-intelligence/ # FR-033-034 — risk/delay prediction, NL assistant
├── ai-burnout-detection/             # FR-035 — nine-field recommendation object applied to burnout
├── agile-scrum-kanban/               # FR-015-017 — Sprint/Backlog, Kanban board, Agile metrics
├── resource-capacity-planning/       # FR-018-020 — Resource (Employee type refs 059, per §2), allocation
├── timesheets-productivity/          # FR-021-023 — capture methods, productivity metrics
├── project-financial-management/     # FR-027-030 — Budget/Cost, posts to 058's GL (per §1)
├── portfolio-analytics-executive/    # FR-031-032 — executive dashboard, on-demand reports
└── collaboration-security-integrations/ # FR-024-026, FR-036-040 — forward-declared to 062/063/069 (per §7)
    # reused from 058 (GL posting, per §1), 059 (Employee/Leave, per §2), 013 (Account/Client, per §3),
    # 055 (PR/PO for vendor costs, per §4), 008 (AI gateway, per §5), 001/016 (RBAC, per §6)

web/app/(admin)/project-portal/
├── portfolio-dashboard/
├── project-planning/
├── ai-project-assistant/
├── kanban-scrum-board/
├── resource-dashboard/
├── timesheets/
├── financial-dashboard/
└── executive-analytics/
```

**Structure Decision**: `portfolio-project-foundation` and `task-work-management` are built and contract-tested first — spec.md's own User Story 1 rationale states every other capability (tasks, sprints, resources, timesheets, finance, AI) is scoped to a project record, so project creation/planning and the underlying Task entity must exist before anything else has a subject to operate on.

## Complexity Tracking

*No constitution violations requiring justification. N/A.*

---

**Applied**: §1 and §2 above closed gaps in both `058/plan.md` §5 and `059/plan.md` (which gained a new §7), which each already generically named "Project Management" in their own Enterprise Integrations FR but left it unmapped to a specific feature number since `061` did not yet exist when they were written. Both were updated to explicitly cross-reference `061` after user confirmation.
