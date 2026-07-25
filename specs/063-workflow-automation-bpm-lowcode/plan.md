---
description: "Implementation plan for Feature 063 — Enterprise Workflow Automation, BPM & Low-Code Platform"
---

# Implementation Plan: Enterprise Workflow Automation, BPM & Low-Code Platform

**Branch**: `063-workflow-automation-bpm-lowcode` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/063-workflow-automation-bpm-lowcode/spec.md`

## Summary

This feature (Volume 14, Chapter 30) is the platform's general-purpose, cross-department Workflow Designer, Business Rules Engine, Approval Automation, RPA platform, and Low-Code/No-Code Application Builder — an internal PaaS layer. Article II (AI Is Assistive, Never Autonomous) is FR-text-cited at FR-055, requiring human review before any AI Process Intelligence recommendation results in an applied workflow/rule/robot configuration change.

## Ownership & Dependency Analysis

### §1. General-Purpose Workflow/Approval Engine vs. Six Already-Planned Features — MAJOR finding, the largest-scope architectural discovery this session

Spec.md's own Assumptions state approval workflows, business rules, and low-code apps built under this platform "are expected to be consumed by/embedded within other enterprise features (e.g., Procurement 055/057, Finance 058, HRMS 059, Project Management 061, Document Management 062) as their underlying automation/approval engine." This claim was checked against the actual, already-planned source-PRD text of those features rather than trusted at face value — and it holds up with striking precision: `055`'s own Chapter-22-sourced FR-043 reads *"System MUST provide a Workflow Engine supporting a drag-and-drop workflow builder, conditional logic, a rule engine, an Approval Matrix, Parallel Approvals, Sequential Approvals, scheduled automation, event-based automation, retry logic, and exception handling"* — a near-verbatim, compressed subset of this chapter's own Workflow Designer (FR-010–FR-016), Business Rules Engine (FR-017–FR-020), and Event-Driven Automation (FR-045–FR-047) capabilities, just described in one FR instead of 61.

This is the same "a domain chapter re-describes a shared platform capability in miniature, while a dedicated chapter defines it canonically and in far greater depth" pattern this session has found repeatedly (`047`>`044`, `040`>`029`, `013`→`045`→`060` Territory, `050`/`051`→`062` Retention) — but at a scale no prior finding has reached: **six already-planned features** (`055`, `057`, `058`, `059`, `061`, `062`) each independently built their own "Workflow Engine" / "Approval Matrix" / "Multi-Level Approval Workflow" FRs and tasks, none aware that Chapter 30 — the platform's actual, dedicated BPM chapter — existed, because `063` had not yet been planned when they were.

**Ownership decision**: `063` is the canonical, general-purpose Workflow Designer / Business Rules Engine / Approval Automation platform. Every affected feature's domain-specific approval/workflow FR — `055` FR-042–FR-045 (Workflow Engine, Approval Matrix), `057`'s approval-composition FR-011 (citing `055`'s mechanics), `058` FR-050–FR-052 (Multi-Level Approvals, Digital Signatures), `059` FR-050 (Multi-Level Approval Workflows), `061` FR-037 (Multi-Level Approvals, Digital Signatures), `062` FR-026–FR-028 (8 Approval Workflow Types, e-Signature) — should be understood, at implementation time, as *configuring* `063`'s general-purpose engine for that domain's specific node types, rules, and approval chains, the same "layered configuration over a shared engine" pattern already established for `001`'s RBAC engine, rather than as six independent, parallel BPM implementations.

**Given the scope of this finding, this plan does not silently rewrite six already-completed features' plan.md/tasks.md files.** It documents the finding here, in full, and recommends a lightweight cross-reference note (not a full re-architecture) be added to each of the six affected features' Ownership & Dependency Analysis sections — consistent in scope with every other retroactive correction this session has made only after explicit user confirmation. (See the note at the end of this plan.)

### §2. Marketing Workflow Builder vs. `022`/`032` — extends the pre-existing engine-identity gate to a three-way question, not resolved

Spec.md's own Assumptions explicitly flag `022` (Marketing Automation Workflows) as a `[NEEDS CLARIFICATION]`: whether `022`'s marketing-only visual workflow/journey builder and this chapter's general Workflow Designer share a single underlying execution engine or are independently implemented — the source does not state it either way. This is the same unresolved question already carried forward from `032`'s own planning (the "022/032 gate," `032`'s 29-node journey builder vs. `022`'s 4-node workflow engine). This plan extends that gate to a three-way question rather than resolving it: whether `022`, `032`, and `063` are one underlying automation engine described three times, two engines, or three genuinely distinct engines is preserved as an open NEEDS CLARIFICATION, consistent with this session's standing protocol of not inventing an architecture decision where ownership is unclear.

### §3. RPA & AI Process Intelligence vs. `008` (AI Assistant Platform) — confirmed clean, gateway reused

Not mentioned in spec.md's own Assumptions beyond a generic "AI Platform" integration name (FR-061). Consistent with the reuse pattern established for `056`–`062`. **Ownership decision**: the AI Process Assistant (FR-053) and AI Process Intelligence (FR-052, including AI Robots per FR-032) reuse `008`'s `ai-gateway`/`ai-guardrails` for provider access and governance, with process-mining/bottleneck-detection/automation-opportunity logic as this feature's own new, structured-execution-data query layer.

### §4. RBAC vs. `001`/`016` — confirmed clean, standard layered-extension pattern

Not mentioned in spec.md's own Assumptions beyond a generic RBAC reference (FR-056). **Ownership decision**: Workflow-Level and Rule-Level Permissions (FR-056) configure `001`'s/`016`'s existing layered RBAC engine per the established extension pattern.

### §5. Enterprise Integrations vs. `062` (DMS), `004` (LMS), and other named targets — confirmed / forward-declared

FR-061 names `062` (Document Management System) explicitly among 18 integration targets. Verified against `062`'s actual plan.md: `062/tasks.md` T080 already names `063` (Workflow Automation) as a forward-declared integration target for its own FR-040. **Ownership decision**: CONFIRMED bidirectionally, closing that item. `004` (LMS) is named generically; consistent with the established pattern, this feature's low-code "LMS Apps" category (FR-039) would consume `004`'s canonical Course/Assessment entities rather than redefining them, though no LMS-specific FR in this chapter requires deeper verification.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web) — consistent with 001–062.

**Primary Dependencies**: This feature is itself a foundational platform capability six already-planned features (`055`, `057`, `058`, `059`, `061`, `062`) should configure rather than duplicate (per §1 — the largest cross-feature finding this session); `022`/`032`'s marketing/journey builders' engine-identity relationship to this feature remains an open, extended NEEDS CLARIFICATION (per §2); `008`'s AI gateway/guardrails for AI Process Intelligence (per §3); `001`/`016`'s layered RBAC for Workflow/Rule-Level Permissions (per §4); `062`'s DMS as a confirmed bidirectional integration (per §5).

**Storage**: PostgreSQL (14 entities per Key Entities: Business Process, Workflow, Workflow Instance, Business Rule, Approval Request, RPA Robot, RPA Job/Task, Low-Code App, App Component, Component Marketplace Listing, Form, Event Trigger Binding, Workflow Analytics Record, AI Recommendation).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: no-code-workflow-design-test-publish-without-engineering for SC-001, approval-history-100pct-complete-immutable for SC-002, and ai-process-recommendation-zero-autonomous-config-change for SC-007), Playwright (web e2e — Workflow Designer drag-and-drop, approval chain delegation/escalation, RPA Dashboard, Low-Code App Builder publish flow).

**Target Platform**: Web (Workflow Designer canvas, Low-Code App Builder, RPA Dashboard, Executive Dashboard).

**Performance Goals**: Per SC-005, Real-Time-scheduled event-driven automations must execute their bound Automation Action without a manually initiated step.

**Constraints**: Zero unbalanced/invalid workflow may reach Published status without passing sandbox Testing (FR-014, FR-016); zero AI Process Intelligence recommendation may autonomously apply a workflow, rule, or robot configuration change without human approval (FR-055, SC-007); zero RPA job failure may be silently dropped or misreported as Completed (SC-003); a rule with a future Effective Date must not apply even if its conditions would otherwise match (FR-019, User Story 5 acceptance scenario 3).

**Scale/Scope**: 14 entities, 61 FRs, 7 user stories, 12 automatable department types, 17 workflow node types, 12 business rule types, 6 RPA robot types, 12 RPA capabilities, 12 low-code app categories, 18 form/UI component types, 13 event sources, 14 automation actions, 3 explicitly self-flagged NEEDS CLARIFICATION items (rule-conflict precedence, approval "dead end" terminal behavior, in-flight-instance-vs-republished-workflow behavior) plus 6 from Edge Cases, one MAJOR finding affecting six already-planned features (§1 — this feature is the canonical engine `055`/`057`/`058`/`059`/`061`/`062` should configure rather than duplicate), and one extension of the pre-existing `022`/`032` engine-identity gate to a three-way question (§2). This is the sixteenth consecutive feature this session to surface a genuine, previously-uncaught cross-feature nuance during planning — and by far the largest in scope.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Workflow node transitions, rule condition evaluation, and approval-chain routing are all server-computed, never client-asserted (FR-023, FR-020). |
| II. AI Is Assistive, Never Autonomous | PASS — **FR-text-verbatim cited** | FR-055 explicitly prohibits autonomous application of a workflow/rule/robot configuration change from an AI recommendation; every AI Process Intelligence output requires human review (User Story 7 acceptance scenario 3). |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | AI recommendations present Confidence Score and Risk Level transparently (FR-054), not as guaranteed outcomes. |
| IV. Historical Immutability | PASS — **FR-text-verbatim cited** | FR-058 requires Immutable Audit Logs for workflow and approval activity; FR-009 requires Audit Logging/Version Management for all business processes. |
| V. Ledger-Based Internal Economies | N/A | No financial ledger surface in this feature's scope. |
| VI. Consent Is First-Class, Per-Channel, and Versioned | N/A | Internal PaaS/automation tool; no direct customer-communication-consent surface. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS — **primary implementer for the entire platform's approval-chain mechanics** | FR-021–FR-029 (Approval Automation) is the canonical approval-chain engine per §1; FR-056 requires RBAC with Workflow/Rule-Level Permissions, configuring `001`'s/`016`'s existing engine (per §4). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Automation ROI and Workflow Health are evidence-based operational metrics (FR-050), not purchasable status. |
| IX. Action Before Consumption | PASS | Every workflow progresses through Draft→Testing→Pending Approval→Published before becoming Running (FR-016). |
| Localization & Language Requirements | PASS (not primary focus, inherited) | Internal enterprise PaaS tool; no dedicated localization surface beyond platform-wide requirements. |
| Security & Compliance Baseline | PASS | FR-057 (encryption at rest/transit), FR-058 (immutable audit logs), FR-060 (DR/HA) directly implement the baseline. |

## Project Structure

### Documentation (this feature)

```
specs/063-workflow-automation-bpm-lowcode/
├── spec.md
├── plan.md
├── research.md         # 9 NEEDS CLARIFICATION items (3 self-flagged, 6 from Edge Cases) + the extended 022/032/063 engine-identity gate
├── data-model.md        # 14 entities
├── quickstart.md         # 7 user-story validation walkthrough
└── contracts/
    ├── no-code-workflow-design-test-publish-without-engineering.contract.md
    ├── approval-history-100pct-complete-immutable.contract.md
    └── ai-process-recommendation-zero-autonomous-config-change.contract.md
```

### Source Code (repository root)

```
backend/src/modules/workflow-automation/
├── platform-foundation/              # FR-001-004 — automation engine scope, process lifecycle
├── workflow-designer-bpm/            # FR-005-016 — drag-and-drop canvas, node types, sandbox testing
├── business-rules-engine/            # FR-017-020 — rule types, condition operators
├── approval-automation/              # FR-021-029 — canonical Approval Matrix/chain engine (per §1)
├── rpa-platform/                     # FR-030-033 — 6 robot types, RPA Dashboard
├── low-code-app-builder/             # FR-034-039 — UI Designer, Component Marketplace
├── forms-dynamic-data-collection/    # FR-040-044
├── event-driven-automation/          # FR-045-047 — engine-identity question re: 022/032 (per §2)
├── workflow-analytics-monitoring/    # FR-048-051
├── ai-process-intelligence/          # FR-052-055 — reuses 008 (per §3)
└── security-governance/              # FR-056-061 — reuses 001/016 (per §4), confirms 062 (per §5)

web/app/(admin)/workflow-portal/
├── workflow-designer/
├── business-rules/
├── approval-center/
├── rpa-dashboard/
├── low-code-builder/
├── event-automation/
├── ai-process-assistant/
└── executive-dashboard/
```

**Structure Decision**: `workflow-designer-bpm` and `approval-automation` are built and contract-tested first — spec.md's own User Story 1/2 priority framing names these as the foundational, no-code process-authoring and approval-chain capabilities every other capability (RPA, low-code apps, event triggers, analytics) either feeds into or depends on. Given §1's finding, these two modules also carry the highest architectural weight of any module planned this session, since six already-completed features' approval mechanics should eventually configure rather than duplicate them.

## Complexity Tracking

*No constitution violations requiring justification. N/A.*

---

**Note on six affected plan.md files**: §1 above is this session's largest-scope finding — `055`, `057`, `058`, `059`, `061`, and `062` each independently built domain-specific "Workflow Engine"/"Approval Matrix"/"Multi-Level Approval" FRs and tasks before this feature (the platform's actual dedicated BPM chapter) existed. Per this session's standing protocol, a lightweight cross-reference note was recommended for each of the six affected features' Ownership & Dependency Analysis sections; the user confirmed applying it to all six on 2026-07-24, and each of `055/plan.md` §8, `057/plan.md` §8, `058/plan.md` §6, `059/plan.md` §8, `061/plan.md` §7, and `062/plan.md` §7 now documents that their domain-specific approval/workflow FRs should be understood as configuring this feature's general-purpose engine at implementation time.
