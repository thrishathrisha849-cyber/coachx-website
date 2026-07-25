---
description: "Implementation plan for Feature 059 — Enterprise HRMS & Payroll"
---

# Implementation Plan: Enterprise HRMS & Payroll

**Branch**: `059-hrms-payroll` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/059-hrms-payroll/spec.md`

## Summary

This feature (Volume 14, Chapter 26) builds TBT's internal, employee-facing HRMS & Payroll platform: the full employee lifecycle from workforce planning through recruitment (ATS), onboarding, org structure, attendance/leave, performance management (PMS), embedded corporate Learning & Development, payroll, Employee/Manager Self-Service (ESS/MSS), AI HR Intelligence, and HR Security & Compliance. Article II (AI Is Assistive, Never Autonomous) is the most-repeated citation pattern — FR-text-cited at FR-012 (AI resume screening is advisory), FR-047 (no AI output may change status/compensation/disbursement autonomously), and FR-048 (payroll anomaly flags block only the flagged line item, requiring human clearance). Article IV (Historical Immutability) is FR-text-cited at FR-040 (a finalized, disbursed payroll run is never retroactively altered).

## Ownership & Dependency Analysis

### §1. Internal Corporate L&D vs. `004` (Learning Management System) — confirmed clean

Spec.md's own Assumptions state this feature's embedded Learning & Development module (FR-032–FR-034) is TBT's internal *corporate training* catalog for its own employees, structurally distinct from `004`, the member-facing commercial LMS TBT sells to external learners. Verified against `004/plan.md`: its own Structure Decision explicitly scopes its 13 `lms-*` backend modules to "member-facing learning routes," confirming no employee-training scope exists there. **Ownership decision**: CONFIRMED as spec.md states — `059`'s Training Course/Enrollment entity is a separate, internally-scoped catalog; any shared underlying course-delivery technology is an implementation choice, not a spec-level merge.

### §2. Internal ATS vs. `012` (Jobs, Talent & Recruitment) — confirmed clean, plus a NEW entity-naming note

Spec.md's own Assumptions state this feature's internal ATS (TBT hiring its own employees) has no functional overlap with `012`, TBT's external jobs-marketplace product. Verified against `012`'s actual spec.md and plan.md: `012` is confirmed to be a product where third-party employers/recruiters use TBT's platform to post jobs and hire from TBT's own member base (job seekers) — a `jobs-pipeline` module already defines its own "Candidate," "Offer Letter," and "Hiring Pipeline Stage" entities (`012` FR-045–FR-050) for that external population. This is genuinely distinct from `059`'s "Candidate," "Offer," and "Interview" entities (TBT's own internal hiring), confirming spec.md's claim.

**Ownership decision**: CONFIRMED, no functional overlap — but both features independently define "Candidate" and "Offer" entities for two entirely separate populations (external job-seekers hired by third-party employers via `012`, vs. TBT's own prospective employees via `059`). This is a naming collision requiring schema/documentation-level disambiguation (e.g., `012`'s "Marketplace Candidate"/"Marketplace Offer" vs. `059`'s "Internal Candidate"/"Internal Offer" in cross-feature documentation), the same class of finding as the `009`/`055` "Purchase Order" collision — not a business-logic duplication, since neither entity should be merged or removed.

### §3. Payroll Accounting Entry vs. `058` (Finance, Accounting & Treasury) — confirmed clean, bidirectionally

Spec.md's own Assumptions state Payroll's Accounting Entry step (FR-036, FR-039) depends on `058` for actual General Ledger posting, chart-of-accounts mapping, and financial reporting, deferring GL posting mechanics to `058`. Verified against `058`'s actual plan.md: `058`'s FR-057 (Enterprise Integrations) already names "HRMS, Payroll" as a named integration target, and `058`'s FR-003 describes its General Ledger as "the central financial repository into which all other finance modules post" — `058/plan.md` §5 had already forward-declared this exact dependency as pending since `059` was not yet planned. **Ownership decision**: CONFIRMED, bidirectionally — `059` produces a payroll accounting-entry event per run; `058`'s GL is the posting destination. `059` does not implement its own general ledger. (See the note at the end of this plan regarding closing `058/plan.md`'s forward-declared item.)

### §4. "Workforce Cost Forecast" Terminology vs. `058`'s Budgeting & Forecasting — NEW finding, not caught by either spec's own Assumptions

Not mentioned by either spec. `058` FR-029 names "Workforce Cost Forecast" as one of its 7 Budget-module forecast types; `059` FR-045's AI HR Assistant answers "next month's payroll forecast" and FR-039's Payroll Reports include a "Payroll Cost" report. These are related but distinct: `058`'s Workforce Cost Forecast is a budget-planning-cycle projection tied to its own Budget workflow (Creation → Review → Approval → Lock); `059`'s payroll forecast/cost reporting is a shorter-horizon, operational output grounded in live attendance/leave/payroll-run data. **Ownership decision**: `059`'s AI payroll forecast and Payroll Cost report are operational-level outputs that feed into `058`'s Workforce Cost Forecast as an input signal during budget planning, not a competing definition of the same forecast. No entity merge needed; the two forecasts operate at different time horizons and serve different workflows.

### §5. AI HR Intelligence vs. `008` (AI Assistant Platform) — confirmed clean, gateway reused, new structured-HR-data grounding pattern

Not mentioned in spec.md's own Assumptions. Consistent with the reuse pattern established for `056`, `057`, and `058`'s AI assistants, `008`'s `ai-gateway`/`ai-guardrails` modules are the correct reuse target for provider routing, fallback, and human-review/override/confidence-threshold discipline. **Ownership decision**: this feature's AI HR Intelligence (FR-044) and AI HR Assistant (FR-045) reuse `008`'s `ai-gateway`/`ai-guardrails` for provider access and governance, but build their own structured-HR-data query/grounding layer (employee, attendance, performance, payroll data) — the same "shared gateway, new domain logic" pattern already established for `042`, `049`, `052`, `056`, `057`, and `058`.

### §6. Auth & RBAC vs. `003`/`001`/`016` — confirmed clean, Employee as a new population

Not mentioned in spec.md's own Assumptions. Checked against `003`'s actual plan.md: `003` is scoped to platform member identity, with no existing "employee/staff" concept — confirming `059`'s Employee entity is genuinely new ground, not a duplicate of an existing identity type. **Ownership decision**: ESS/MSS login and employee account credentials (FR-017's "account creation, email setup") technically reuse `003`'s auth/session/credential infrastructure, while the Employee profile itself (FR-002) is a new HR-domain entity for a population `003` does not otherwise model. RBAC for HRMS modules (FR-049) configures `001`'s/`016`'s existing layered RBAC engine per the established extension pattern, applied to HR-specific roles (recruiter, HR admin, payroll administrator, manager).

### §7. Enterprise Integrations "Project Management" target vs. `061` — RESOLVED (added 2026-07-23, per `061/plan.md` §2)

FR-055's Enterprise Integrations list names "Project Management" generically among 14 targets, left unmapped to a specific feature number since `061` did not yet exist when this plan was written. `061` has now been planned and closes the gap: `061/plan.md` §2 confirms this feature's "Employees" resource type consumes this feature's canonical Employee Master Profile, and its Leave Integration reads this feature's Leave Request/Attendance data as a capacity-planning input, rather than either being redefined. **Ownership decision**: CONFIRMED — `061` is the Project Management integration target FR-055 names.

### §8. Multi-Level Approval Workflows vs. `063` (Workflow Automation, BPM & Low-Code Platform) — cross-reference added 2026-07-24, per `063/plan.md` §1

`063` has now been planned as the platform's general-purpose, dedicated BPM/Workflow/Approval-Automation chapter, and its own plan.md §1 identifies this feature's FR-050 (multi-level approval workflows for recruitment offers, leave, payroll runs, offboarding clearance) as a domain-specific application of the approval-chain mechanics `063` defines canonically. **Ownership decision**: this feature's HR approval chains should be understood, at implementation time, as configuring `063`'s general-purpose Approval Automation engine for HR-specific approval types — the same layered-configuration pattern already established for `001`'s RBAC engine — rather than as an independently built parallel approval implementation. This is a documentation-level cross-reference only; no functional requirement, entity, or task in this feature changes as a result.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile — attendance check-in, ESS) — consistent with 001–058.

**Primary Dependencies**: `004`'s confirmed member-facing-only LMS scope (per §1, no overlap); `012`'s confirmed external-jobs-marketplace scope, with a naming-disambiguation note for "Candidate"/"Offer" (per §2); `058`'s General Ledger as the payroll accounting-entry posting destination (per §3, confirmed bidirectionally) and Workforce Cost Forecast as the budget-cycle consumer of this feature's operational payroll forecasts (per §4); `008`'s AI gateway/guardrails for AI HR Intelligence and the AI HR Assistant (per §5); `003`'s auth foundation for ESS/MSS login and `001`/`016`'s layered RBAC for HR role governance (per §6).

**Storage**: PostgreSQL (19 entities per Key Entities: Employee, Organization Unit, Job Requisition, Candidate, Interview, Offer, Onboarding Checklist Instance, Offboarding Case, Attendance Record, Leave Policy, Leave Request, Performance Review Cycle, Goal, Training Course/Enrollment, Salary Structure, Payroll Run, Payslip, HR Ticket, AI HR Recommendation — with Candidate/Offer disambiguated from `012`'s marketplace entities per §2).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: onboarding-checklist-100pct-complete-before-active-status for SC-002, payroll-anomaly-100pct-flagged-resolved-before-disbursement for SC-006, and ai-hr-recommendation-zero-autonomous-status-compensation-change for SC-005), Playwright (web/mobile e2e — ATS pipeline, onboarding checklist, leave request/approval, payroll run, ESS/MSS).

**Target Platform**: Web (HR admin console, ESS/MSS portals) and mobile (attendance check-in, ESS).

**Performance Goals**: Per SC-004, a full-workforce payroll run must complete calculation, approval, payslip generation, and accounting-entry posting within one defined payroll processing window per cycle.

**Constraints**: Zero employee may reach Active/Confirmed status with an outstanding mandatory onboarding checklist item (FR-020, SC-002); zero finalized/disbursed payroll run may be retroactively altered — corrections flow to a subsequent or off-cycle run instead (FR-040); zero flagged payroll anomaly line item may be disbursed until an administrator reviews and clears or corrects it, without blocking unflagged line items in the same run (FR-048, SC-006); zero AI HR recommendation may autonomously change employee status, compensation, or payroll disbursement without recorded human approval (FR-047, SC-005); leave requests for non-negative-balance leave types must be rejected before reaching manager approval if the balance is insufficient (FR-026).

**Scale/Scope**: 19 entities, 55 FRs, 9 user stories, a 20-stage employee lifecycle, a 10-step recruitment pipeline, a 10-stage offboarding pipeline, a 10-stage performance cycle, an 8-step payroll workflow, 8 Treasury-adjacent Payroll reports, 4 explicitly self-flagged NEEDS CLARIFICATION items (jurisdiction-specific statutory payroll rules, leave accrual/carry-forward defaults, AI bias-audit/model-governance process) plus 9 from Edge Cases, one confirmed-clean reuse chain with `004`/`012`/`008`/`003`/`001`/`016` backed by specific verified evidence (§1–§2, §5–§6), and two new cross-feature nuances surfaced with `058` — a bidirectional GL-posting confirmation closing `058`'s own forward-declared item (§3), and a Workforce Cost Forecast terminology clarification (§4) — the twelfth consecutive feature this session to surface a genuine, previously-uncaught cross-feature nuance during planning.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Leave-balance validation, attendance status derivation, and payroll calculation are all server-computed, never client-asserted (FR-026, FR-035). |
| II. AI Is Assistive, Never Autonomous | PASS — **FR-text-verbatim cited repeatedly** | FR-012 (AI resume screening is advisory, not automatic accept/reject), FR-047 (no AI output may autonomously change status/compensation/disbursement), FR-048 (anomaly flags block only the flagged line item pending human clearance). |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | AI attrition/promotion-readiness scores are presented with confidence scores and supporting rationale, not as guaranteed predictions (FR-046). |
| IV. Historical Immutability | PASS — **FR-text-verbatim cited** | FR-040 explicitly prohibits retroactively altering a finalized, disbursed payroll run, consistent with the platform's historical-immutability principle. |
| V. Ledger-Based Internal Economies | PASS (reused, not redefined) | Payroll's accounting entry posts into `058`'s existing ledger rather than a new one (per §3). |
| VI. Consent Is First-Class, Per-Channel, and Versioned | N/A | Internal employee-facing HR tool; candidate communication and employee notifications are operational, not marketing consent. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS | FR-049 requires RBAC across all modules; FR-050 requires multi-level approval for sensitive HR actions (offers, leave, payroll, offboarding clearance); configures `001`'s/`016`'s existing engine (per §6). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Performance ratings and promotion-readiness scores are evidence/rationale-based (FR-029, User Story 8 acceptance scenario 3), not purchasable status. |
| IX. Action Before Consumption | PASS | Every candidate, employee, and payroll run progresses through a governed workflow with audit history before reaching a consequential status (Hired, Active, Disbursed). |
| Localization & Language Requirements | PASS (not primary focus, inherited) | Internal enterprise HR tool; FR-005's multi-company/multi-branch/multi-location support is the relevant platform-architecture requirement. |
| Security & Compliance Baseline | PASS | FR-051 (encryption of statutory identity data at rest/in transit), FR-052 (immutable audit logs), FR-054 (configurable data-retention policies) directly implement the baseline. |

## Project Structure

### Documentation (this feature)

```
specs/059-hrms-payroll/
├── spec.md
├── plan.md
├── research.md         # 13 NEEDS CLARIFICATION items (4 self-flagged, 9 from Edge Cases)
├── data-model.md        # 19 entities (Candidate/Offer disambiguated from 012's marketplace entities, per §2)
├── quickstart.md         # 9 user-story validation walkthrough
└── contracts/
    ├── onboarding-checklist-100pct-complete-before-active-status.contract.md
    ├── payroll-anomaly-100pct-flagged-resolved-before-disbursement.contract.md
    └── ai-hr-recommendation-zero-autonomous-status-compensation-change.contract.md
```

### Source Code (repository root)

```
backend/src/modules/hrms/
├── employee-org-foundation/          # FR-001-008 — Employee Master Profile, Org hierarchy
├── recruitment-ats/                  # FR-009-016 — requisition-to-offer pipeline (Candidate/Offer disambiguated, per §2)
├── onboarding-offboarding/           # FR-017-021 — checklist gate, exit workflow
├── attendance-leave/                 # FR-022-027 — capture methods, leave workflow
├── performance-management/           # FR-028-031 — goal-to-promotion cycle
├── learning-development/             # FR-032-034 — corporate L&D, distinct from 004 (per §1)
├── payroll/                          # FR-035-040 — calculation, workflow, GL posting to 058 (per §3)
├── self-service-ess-mss/             # FR-041-043 — employee/manager portals
├── ai-hr-intelligence-attrition/     # FR-044-045 — attrition risk, AI Assistant (per §5)
├── ai-hr-promotion-readiness/        # FR-046 — promotion-readiness scoring
├── ai-hr-payroll-anomaly/            # FR-047-048 — anomaly flag, disbursement block
└── security-compliance/              # FR-049-055
    # reused from 004 (no overlap, confirmed per §1), 012 (no overlap, naming disambiguated per §2),
    # 058 (GL posting destination, per §3), 008 (AI gateway, per §5), 003/001/016 (auth/RBAC, per §6)

web/app/(admin)/hrms-portal/
├── recruitment/
├── onboarding/
├── attendance-leave/
├── performance/
├── payroll/
├── ai-hr-assistant/
└── ess-mss/
```

**Structure Decision**: `employee-org-foundation` is built and contract-tested first — every other module (recruitment's hiring-manager association, attendance's employee record, payroll's salary structure) depends on the Employee Master Profile and Org hierarchy existing. `recruitment-ats` and `onboarding-offboarding` follow together per spec.md's own User Story 1/2 rationale: recruitment is the entry point of the employee lifecycle, and onboarding is the mandatory bridge to an active, payroll-eligible employee.

## Complexity Tracking

*No constitution violations requiring justification. N/A.*

---

**Note on `058/plan.md` update**: §3 above confirms, from `059`'s side, the HRMS/Payroll integration point `058/plan.md` §5 already forward-declared as pending. Per this session's standing protocol, updating `058/plan.md` §5 to mark this item CONFIRMED rather than forward-declared is recommended but not yet applied.
