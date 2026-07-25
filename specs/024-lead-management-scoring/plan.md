# Implementation Plan: Lead Management, Qualification & Scoring

**Branch**: `024-lead-management-scoring` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/024-lead-management-scoring/spec.md`

## Summary

This feature builds the platform's lead-intelligence engine: a standardized 8-stage lead lifecycle (Visitor→Customer) with full audit-trail traceability; a unified lead profile aggregating Identity/Marketing/Behavioral/Commercial data from 5 source categories; an 11-status lead-status model; MQL/SQL/PQL qualification against 9 factors; a 0–1000 point rule-based scoring engine with an administrator-configurable positive point table and a separate real-time negative point table; an AI Predictive Scoring layer (conversion score, revenue prediction, purchase probability, recommended next action) that is strictly advisory and never overrides the rule-based score; an 8-strategy Lead Assignment Engine with immediate notification; lead segmentation, timeline, duplicate detection/resolution, and nurturing; an analytics dashboard; and integration/security/performance controls.

This chapter directly implements **Article II (AI Is Assistive, Never Autonomous)**, cited verbatim in its own FR-036: AI-generated scores/predictions/recommendations "MUST remain advisory alongside the rule-based 0–1000 score and MUST NOT autonomously change a lead's status, qualification, or assignment," with the rule-based system required to keep functioning as a deterministic fallback whenever AI scoring fails or is unavailable — directly validated by User Story 5's independent test of disabling the AI call and confirming rule-based scoring is unaffected.

**This spec carries forward a genuine, explicitly flagged cross-chapter overlap rather than silently resolving it**: `013` (CRM, sourced from Volume 13) independently defines its own lead capture, duplicate detection, and a *0–100* rule-based/AI-assisted scoring system with Cold/Warm/Hot/Sales Ready bands, while this chapter (Volume 14 Part 1 Ch. 11) defines a *0–1000* scale with five bands for the same underlying concept. The source PRD does not state whether these are the same score at two scales, two intentionally separate scoring pools, or a drafting duplication. Per spec.md's own Assumptions, **this spec treats the 0–1000 scale as this feature's authoritative model** per its explicit source point table, and treats reconciliation with `013`'s 0–100 scale as a downstream integration/mapping concern — not something to invent a resolution for here.

Per spec.md's own Assumptions, this feature **owns lead capture through Sales Assigned and nothing past it**: once a lead converts into an Opportunity, downstream sales-pipeline execution (Opportunity stages, quotations, contracts, closed-won/lost) belongs to `013`, consistent with the lifecycle diagram ending at "Opportunity → Customer" without defining opportunity-stage mechanics. It receives leads from `023`'s landing-page/form capture at the "Lead Created" hand-off point, syncs to `019`'s CDP, dispatches nurturing content through `020`/`021`, and drives status-change automation through `022`'s Workflow Engine — none of those systems' internals are redefined here.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–023.

**Primary Dependencies**: NestJS, Next.js; AI Predictive Scoring consuming `008`'s shared AI gateway (FR-031–FR-035); a rule engine for the configurable behavioral/negative point tables (FR-027–FR-029); lead sync to `019` (CDP), `013` (CRM), and further integrated systems within near-real-time targets (FR-048, FR-049); nurturing-content dispatch through `020`/`021`'s channel infrastructure (FR-044).

**Storage**: PostgreSQL (~11 entities per spec.md's Key Entities — Lead, Lead Score, Score Event, Qualification Status, Lead Status, Lead Source, Assignment Rule, Lead Segment, Lead Timeline Event, Duplicate Match, AI Score Insight domains), with `Score Event` stored as an append-only ledger-style log whose running sum produces the current `Lead Score` (consistent with the platform's general append-only-ledger pattern, though not itself a financial ledger).

**Testing**: Jest (backend — lifecycle-transition-audit-completeness, score-recalculation-correctness-and-real-time-negative-application, and AI-advisory-never-overrides-rule-based-score contract tests are the highest-stakes tests here, matching this spec's own SC-001, SC-002/User Story 3, and SC-006/Constitution Article II), Playwright (web e2e — lead profile view, assignment configuration, analytics dashboard).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell); this is the lead-intelligence layer between `023`'s capture engine and `013`'s sales-pipeline execution.

**Performance Goals**: Lead creation under 2s; score calculation under 500ms; duplicate detection under 1s; lead assignment under 2s; dashboard refresh under 2s; AI scoring updates under 5s (FR-052–FR-057, SC-002–SC-006).

**Constraints**: Every lifecycle-stage transition is timestamped and audit-logged with zero unrecorded transitions (FR-003, SC-001); a lead's score and band classification reflect a newly-occurred scored behavior within 500ms, using the administrator's currently configured point value, not a stale one (FR-026–FR-028, SC-002); negative-scoring adjustments apply and reflect in real time (FR-030); AI-generated scores/predictions/recommendations never autonomously change a lead's status, qualification, or assignment, and the rule-based score remains fully functional whenever AI scoring fails (FR-036, SC-006, Constitution Article II); every lead assignment triggers an immediate notification regardless of strategy, including manual assignment (FR-023, SC-005); a duplicate lead is automatically flagged within 1 second of the second record's creation, with the Duplicate Lead penalty applied consistently (FR-041, FR-043, SC-004); only authorized users may create or modify lead records (FR-051).

**Scale/Scope**: ~11 data entities, 57 functional requirements (FR-001–FR-057), 7 user stories, an 8-stage lifecycle, 5 lead-source categories, 11 lead statuses, 3 qualification types (MQL/SQL/PQL), a 0–1000 score with 5 bands, 10 behavioral point values, 6 negative point values, 8 assignment strategies, and 6 NEEDS CLARIFICATION items in spec.md's Assumptions/Edge Cases (score-frequency cap/cooldown, score floor-at-zero, assignment-fallback when no eligible owner exists, band-oscillation re-trigger behavior, multi-qualification-category mutual-exclusivity, and — most significantly — the 0–1000-vs-0–100 scoring-scale overlap with `013`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Score calculation, qualification evaluation, and assignment routing are entirely server-side; no client-asserted score or status | **PASS — direct implementation (not the constitution's named source for this article)** | FR-026, FR-020, FR-021 |
| II. AI Is Assistive, Never Autonomous | **This spec's own FR-036 cites "Constitution Article II" verbatim** — AI outputs remain advisory alongside the rule-based score, never autonomously altering status/qualification/assignment, with the rule-based system as a required deterministic fallback | **PASS — direct implementation, spec.md explicitly applies this article** | FR-031–FR-036, SC-006 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A — this is an internal lead-intelligence chapter with no customer-facing claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | Score Events are append-only occurrences whose running sum produces the current score; historical events are never rewritten when the point table is later reconfigured | **PASS (aligns; not the constitution's named source for this article)** | Key Entities — Score Event, acceptance scenario (US2-3) |
| V. Ledger-Based Internal Economies | N/A — the lead score is a prioritization metric, not a financial/redeemable balance; it follows an append-only-log pattern by analogy, not because it is a `006`/`009`-style economy | **PASS (N/A)** | Key Entities — Score Event |
| VI. Consent Is First-Class | N/A for this chapter's own surface — nurturing-campaign dispatch consent is enforced at `020`/`021`'s Action Executor layer | **PASS (N/A here; enforced downstream)** | FR-044 |
| VII. Layered, Explicit RBAC | Only authorized users may create or modify lead records; RBAC enforced across all lead-management actions | **PASS (extends 001/016)** | FR-050, FR-051 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Preferred language captured as identity information and used in segmentation/assignment (Language-Based strategy) | **PASS (aligns; not the constitution's named source for this article)** | FR-010, FR-022 |
| Security & Compliance Baseline | RBAC, encryption at rest/in transit, audit logs, permission policies, IP restrictions, API authentication, sensitive-data masking, data retention policies | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-050 |

No constitutional violations. No Complexity Tracking entries required for principle compliance. The `013`/`024` scoring-scale overlap is a documented source-level ambiguity (see Summary), not a constitutional violation.

## Project Structure

### Documentation (this feature)

```text
specs/024-lead-management-scoring/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: score-frequency cap/cooldown rule, score floor-at-zero confirmation, assignment-engine fallback behavior when no eligible owner exists, band-oscillation re-trigger semantics, MQL/SQL/PQL mutual-exclusivity, and — critically — how this feature's 0–1000/5-band score reconciles with `013`'s independently defined 0–100 CRM lead score (same score at different scales vs. two separate scoring pools vs. drafting duplication)
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`023`'s structure — no new top-level projects; this feature sits between `023`'s capture engine and `013`'s sales-pipeline execution, syncing to `019` and dispatching through `020`/`021`/`022`.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── lead-lifecycle/         # Lead entity, 8-stage lifecycle state machine, audit trail (FR-001–FR-004)
│   │   ├── lead-capture-sources/   # 5 source-category capture, Lead Source entity (FR-005–FR-009)
│   │   ├── lead-profile/           # unified Lead profile (Identity/Marketing/Behavioral/Commercial) (FR-010–FR-013)
│   │   ├── lead-status/            # Lead Status model, workflow-automation trigger (FR-014–FR-015)
│   │   ├── lead-qualification/     # Qualification Status, MQL/SQL/PQL evaluation (FR-016–FR-020)
│   │   ├── lead-assignment/        # Assignment Rule/Record, 8-strategy routing engine (FR-021–FR-023)
│   │   ├── lead-scoring/           # Lead Score, Score Event, positive/negative point tables (FR-024–FR-030)
│   │   ├── lead-ai-scoring/        # AI Score Insight, advisory-only enforcement (FR-031–FR-036)
│   │   ├── lead-segmentation/      # Lead Segment, auto-updating membership (FR-037–FR-038)
│   │   ├── lead-timeline/          # Lead Timeline Event (FR-039–FR-040)
│   │   ├── lead-duplicate/         # Duplicate Match, detection/resolution (FR-041–FR-043)
│   │   ├── lead-nurturing/         # nurturing-campaign enrollment/exit (FR-044–FR-045)
│   │   └── lead-analytics/         # Lead Analytics Dashboard (FR-046–FR-047)
│   └── common/                     # reused from 001: RbacGuard, audit-log interceptor; reused from 019/013: sync targets; reused from 008: AI gateway; reused from 020/021: nurturing dispatch; reused from 022: workflow triggers
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── leads/{page.tsx, [leadId]/page.tsx, assignment-rules, segments, duplicates, analytics}/
```

**Structure Decision**: 12 new backend modules under `lead-*`, each mapping to one of spec.md's FR groupings. `lead-scoring` (real-time correctness) and `lead-ai-scoring` (Article II advisory-only enforcement) are built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
