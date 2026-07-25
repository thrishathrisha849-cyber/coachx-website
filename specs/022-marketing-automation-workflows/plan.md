# Implementation Plan: Marketing Automation Workflows, Customer Journeys & Event Triggers

**Branch**: `022-marketing-automation-workflows` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/022-marketing-automation-workflows/spec.md`

## Summary

This feature builds the platform's marketing automation engine: a visual, no-code Workflow Builder (infinite canvas, mini map, undo/redo, auto-save, version history, collaboration mode) with four node types (Trigger/Condition/Delay/Action); 5 workflow categories with named templates; a Customer Journey Builder with 10 entry points and 8 exit conditions; an Event Trigger Engine continuously monitoring 6 platform event categories; a real-time Decision Engine evaluating workflow variables and routing branches; an AI Workflow Assistant with a hard human-approval gate; mandatory dry-run testing that structurally guarantees zero live sends; version control with compare/restore/publish-approval; automatic failure retry/failover/escalation; real-time monitoring and exportable journey analytics; and security/governance controls.

This chapter directly implements two constitution articles, both explicitly cited in its own FR/Assumptions text: **Article II (AI Is Assistive, Never Autonomous)** — FR-032 states verbatim that no AI-recommended workflow change "may take effect against live customers without explicit human review and approval," citing "Constitution Article II" directly — and **Article VI (Consent Is First-Class)** — spec.md's own Assumptions state that although Chapter 9's source text never mentions consent, "per Constitution Article VI... immediate pre-send consent re-verification and immediate propagation of consent withdrawal into in-flight journeys" is a mandatory, inherited requirement enforced at the Action Executor layer regardless of the chapter's silence on it — a rare case of this spec-generation process adding a constitutionally-mandated requirement the source text itself omits.

Per spec.md's own Assumptions, this feature is the **orchestration layer, not the systems it triggers actions against**: Condition-node segment/score evaluation and workflow variables read from `019`'s unified customer profile and CDP, never redefining that data model; the AI Workflow Assistant and "Trigger AI Assistant" action node are workflow-specific applications of `008`'s platform-wide AI Assistant; Send Email/SMS/WhatsApp/Push action nodes dispatch through `020`/`021`'s channel infrastructure, never reimplementing delivery; the "Award Points" action node relies on `006`'s ledger-based points system (Constitution Article V — points are never a directly-writable balance); "Generate Coupon" relies on `009`'s coupon/pricing infrastructure; and "Create Task"/"Create Support Ticket" action nodes create records inside `013`'s CRM/support-desk data model. This chapter defines only the trigger/condition/delay/action orchestration around those systems.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–021.

**Primary Dependencies**: NestJS, Next.js; a visual node-graph editor library for the Workflow Builder canvas (FR-005, FR-006 — no vendor named); an event-processing/streaming pipeline for the Event Trigger Engine (FR-020, sub-500ms target); a job scheduler/queue for Delay-node execution and failure rescheduling (FR-009, FR-042); AI Workflow Assistant consuming `008`'s shared AI gateway (FR-031); action nodes dispatching through `020`/`021` (channel sends), `006` (points ledger), `009` (coupons), and `013` (tasks/tickets) rather than owning that logic.

**Storage**: PostgreSQL (~13 entities per spec.md's Key Entities — Workflow/Workflow Version, Node/Node Connection, Customer Journey, Journey/Workflow Instance, Event, Workflow Variable, Test Run, Failure/Error Record, Monitoring Metric Snapshot, Analytics Report, AI Recommendation, Audit Log Entry domains), with `Workflow Version` stored as an immutable snapshot (FR-038) and `Journey/Workflow Instance` tracking live per-customer execution state at scale (up to millions of actions, FR-002).

**Testing**: Jest (backend — zero-live-sends-during-dry-run, AI-recommendation-never-autonomous, and workflow-failure-always-produces-recovery-plus-notification contract tests are the highest-stakes tests here, matching this spec's own SC-003, SC-005, and SC-007), Playwright (web e2e — Workflow Builder canvas interactions, version compare/restore, monitoring dashboard).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell); this is the orchestration engine every other Volume 14 channel/AI/CDP feature's actions get triggered through.

**Performance Goals**: Workflow publish under 5s; event processing under 500ms; trigger execution under 1s; action dispatch under 2s; monitoring dashboard refresh under 2s; workflow validation under 3s (FR-048–FR-050, SC-001, SC-002).

**Constraints**: Zero live customers ever receive any message or action output during workflow test/dry-run execution, across 100% of sampled test runs — test mode structurally prevents live dispatch, it does not merely rely on correct tester configuration (FR-037, SC-003, edge case); every AI Workflow Assistant recommendation requires and receives explicit human approval before any change reaches a live, published workflow — zero AI-originated changes apply autonomously (FR-032, SC-005, Constitution Article II); every workflow modification produces a new, distinctly recorded version with zero in-place overwrites of a previously published version (FR-038, SC-006); only authorized administrators may publish a workflow to production, with zero unauthorized workflows reaching live customers (FR-047, SC-008); every workflow failure results in at least one recovery action and an administrator notification, with zero silently dropped actions (FR-042, SC-007); consent is re-checked immediately before every automated send at the Action Executor layer, with withdrawal propagating to in-flight journeys without delay, even though the chapter's own text never states this (Constitution Article VI, spec.md Assumptions); an Exit Condition met at the exact moment a pending Delay-node action is about to dispatch takes precedence and cancels that action (edge case); every workflow execution is fully reconstructable end-to-end from audit logs (FR-004, SC-004).

**Scale/Scope**: ~13 data entities, 50 functional requirements (FR-001–FR-050), 7 user stories, 4 node types, 14 named trigger events plus 6 event categories, 5 workflow template categories, 10 journey entry points, 8 exit conditions, and 6 NEEDS CLARIFICATION items in spec.md's Edge Cases (duplicate-event-delivery deduplication, in-flight-instance behavior on republish, terminal failure state once all recovery mechanisms are exhausted, error-threshold-exit vs. per-customer-failure-handling interaction, and simultaneous-collaborative-edit conflict resolution).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Event detection, condition evaluation, and action dispatch are entirely server-side; the Decision Engine never trusts client-asserted routing | **PASS — direct implementation (not the constitution's named source for this article)** | FR-020, FR-029, FR-030 |
| II. AI Is Assistive, Never Autonomous | **This spec's own FR-032 cites "Constitution Article II" verbatim** — no AI-recommended workflow change ever takes effect against live customers without explicit human review and approval | **PASS — direct implementation, spec.md explicitly applies this article** | FR-031–FR-033, SC-005 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A — this is an internal orchestration-engine chapter with no customer-facing claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | Every workflow modification creates a new, immutable version rather than overwriting the published version in place | **PASS (aligns; not the constitution's named source for this article)** | FR-038, FR-039, SC-006 |
| V. Ledger-Based Internal Economies | The "Award Points" action node relies on `006`'s ledger-based points system rather than writing a direct balance | **PASS (defers to 006, Constitution Article V explicitly cited in spec.md Assumptions)** | spec.md Assumptions |
| VI. Consent Is First-Class | **Spec.md's own Assumptions explicitly add this as a constitutionally-inherited requirement the source chapter itself omits** — consent re-checked immediately before every send at the Action Executor layer, withdrawal propagates to in-flight journeys without delay | **PASS — direct implementation, spec.md explicitly applies this article despite chapter silence** | spec.md Assumptions, edge case |
| VII. Layered, Explicit RBAC With Approval Chains | Only authorized administrators may publish a workflow to production; non-administrator edits require approval before going live | **PASS (extends 016)** | FR-046, FR-047, SC-008 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Workflow variables include Language as a first-class personalization input | **PASS (aligns; not the constitution's named source for this article)** | FR-027 |
| Security & Compliance Baseline | RBAC authorization, workflow approval, audit logging, secure API execution, webhook authentication, encryption, rate limiting, data masking | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-046 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/022-marketing-automation-workflows/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: duplicate/replayed event deduplication semantics, in-flight-instance behavior when a workflow is republished mid-execution, the terminal failure state once all recovery mechanisms are exhausted, error-threshold-exit vs. per-customer-failure-handling interaction, and simultaneous collaborative-edit conflict resolution
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`021`'s structure — no new top-level projects; this feature is the orchestration engine `019`/`008`/`020`/`021`/`006`/`009`/`013` all get invoked through via Action nodes.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── workflow-builder/       # Workflow/Version, Node/Node Connection, visual canvas backend (FR-005–FR-010)
│   │   ├── workflow-templates/     # 5 workflow-category templates (FR-011–FR-015)
│   │   ├── workflow-journey/       # Customer Journey Builder, entry/exit conditions (FR-016–FR-019)
│   │   ├── workflow-event-engine/  # Event Trigger Engine, 6 event categories, Event entity (FR-020–FR-026)
│   │   ├── workflow-decision/      # Workflow Variable, Decision Engine (FR-027–FR-030)
│   │   ├── workflow-ai-assistant/  # AI Recommendation, human-approval gate (FR-031–FR-033)
│   │   ├── workflow-testing/       # Test Run (Dry-Run Session), structural live-dispatch prevention (FR-034–FR-037)
│   │   ├── workflow-versioning/    # Workflow Version compare/restore/publish-approval (FR-038–FR-040)
│   │   ├── workflow-error-recovery/ # Failure/Error Record, retry/failover/reschedule/notification (FR-041–FR-042)
│   │   ├── workflow-monitoring/    # Monitoring Metric Snapshot, Analytics Report (FR-043–FR-045)
│   │   └── workflow-governance/    # RBAC/approval/audit enforcement (FR-046–FR-047)
│   └── common/                     # reused from 001: RbacGuard, audit-log interceptor; reused from 016: RBAC/approval; reused from 019: CDP data; reused from 008: AI gateway; reused from 020/021/006/009/013: action-node targets
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── automation/{workflows,workflow-builder/[workflowId],journeys,event-log,test-runs,monitoring,analytics}/
```

**Structure Decision**: 10 new backend modules under `workflow-*`, each mapping to one of spec.md's FR groupings. `workflow-testing` (structural zero-live-send guarantee) and `workflow-ai-assistant` (Article II gate) are built and contract-tested first given their safety-critical role. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
