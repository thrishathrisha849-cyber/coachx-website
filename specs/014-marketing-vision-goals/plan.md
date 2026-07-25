# Implementation Plan: Marketing Vision & Business Goals

**Branch**: `014-marketing-vision-goals` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-marketing-vision-goals/spec.md`

## Summary

Unlike every feature planned so far, this one is **not a build-ready software feature** — per spec.md's own Assumptions, Chapter 1 "defines no UI, data model, API, or workflow of its own." It is the **strategic governance contract** that Volume 14 Part 1's 19 downstream feature specs (015–033) must satisfy: a 20-item Functional Scope list, a 5-category/25-metric KPI taxonomy, a 15-goal three-horizon roadmap, a 9-item Phase-1 exclusion list, 10 Business Objectives, and Stakeholder/Target-User persona lists. This plan is therefore a **traceability-validation and governance plan**, not a backend/frontend implementation plan — its "tasks" are cross-reference checks against the other 19 features in this wave, not module builds.

This feature is not cited by name anywhere in the constitution, and defines no code of its own. Its sole implementation obligation is downstream: every later Volume 14 Part 1 feature (015–033) must trace its scope, KPIs, and strategic rationale back to this chapter rather than inventing its own, per this spec's own SC-001 through SC-007. Per the constitution's Article IV (Historical Immutability) — invoked explicitly in spec.md's Assumptions — the Phase-1 scope commitment (FR-027) and exclusion list (FR-038) fixed here must not be silently altered by numeric targets or scope claims introduced in later chapters.

## Technical Context

**Language/Version**: N/A — this feature produces no source code; it is a governance/traceability artifact consumed by features 015–033.

**Primary Dependencies**: N/A.

**Storage**: N/A — the Key Entities (Business Objective, Strategic Goal, Functional Scope Item, Out-of-Scope Item, KPI, Problem Statement, Stakeholder, Target User) are documentation-level constructs referenced by downstream features, not persisted records owned by this feature. Where a downstream feature (e.g., `027` Marketing Analytics) needs to persist a KPI value, that feature owns the schema; this chapter owns only the taxonomy/naming contract.

**Testing**: Traceability validation only — cross-referencing this chapter's 20 Functional Scope items, 25 KPIs, 15 Strategic Goals, 9 exclusions, and 10 Business Objectives against features 015–033 as each is planned, per SC-001–SC-007. No unit/integration/contract tests apply since there is no executable surface.

**Target Platform**: N/A.

**Performance Goals**: N/A.

**Constraints**: The Phase-1 scope commitment (20 Functional Scope items, FR-027) and Phase-1 exclusion list (9 items, FR-038) are fixed by this chapter and must not be retroactively altered by later chapters (Constitution Article IV, spec.md Assumptions); every one of the 20 Functional Scope items must map to at least one feature spec in 015–033 with zero orphaned items (SC-001); every one of the 25 named KPIs must be traceable, unrenamed, to feature `027` (SC-002); zero Phase-1-excluded capability may ship in the Phase-1 release feature set (SC-003).

**Scale/Scope**: 38 functional requirements (FR-001–FR-038), 6 user stories, 8 governance-construct "entities" (none of them persisted database tables), and downstream traceability obligations across 19 features (015–033).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | N/A — no client/server surface exists in this governance chapter | **PASS (N/A)** | — |
| II. AI Is Assistive, Never Autonomous | N/A — FR-014/FR-019 name "AI-assisted campaign creation" as a Business Objective/Solution capability but define no AI mechanism themselves; the actual AI Campaign Assistant is built in a later feature (025) and inherits Article II there | **PASS (N/A here; inherited downstream)** | FR-014, FR-019 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A — no customer-facing surface in this chapter | **PASS (N/A)** | — |
| IV. Historical Immutability | The Phase-1 scope commitment and exclusion list fixed here must not be retroactively altered by later chapters' numeric targets or scope claims — explicitly invoked in spec.md's own Assumptions | **PASS — spec.md explicitly ties this to Article IV** | FR-027, FR-038, spec.md Assumptions |
| V. Ledger-Based Internal Economies | N/A | **PASS (N/A)** | — |
| VI. Consent Is First-Class | N/A | **PASS (N/A)** | — |
| VII. Layered, Explicit RBAC | N/A here — this chapter only lists the Stakeholder/Target-User personas that `016` (Marketing RBAC & Roles) must build a permission model around; it defines no permissions itself | **PASS (N/A here; feeds 016)** | FR-036, FR-037 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | N/A — no user-facing content in this chapter | **PASS (N/A)** | — |
| Security & Compliance Baseline | N/A | **PASS (N/A)** | — |

No constitutional violations. No Complexity Tracking entries required.

## Project Structure

### Documentation (this feature)

```text
specs/014-marketing-vision-goals/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: numeric KPI targets/thresholds/measurement periods per metric (deferred to 027/028), explicit start/end dates per goal horizon (deferred to a program-level roadmap document)
├── data-model.md     # documents the 8 governance constructs as a reference taxonomy, not a database schema
├── quickstart.md      # "how to check a proposed capability/KPI/goal against this chapter" checklist
└── tasks.md          # Phase 2 (/speckit.tasks) — traceability-validation tasks, not implementation tasks
```

### Source Code (repository root)

**None.** This feature owns no backend module, no frontend route, and no mobile surface. It is referenced, not extended, by every downstream Volume 14 Part 1 feature.

```text
(no source code — governance/traceability artifact only)
```

**Structure Decision**: No modules. This plan's "implementation" is a set of traceability checklists and cross-reference validations performed once per downstream feature (015–033) as each is planned, plus a final rollup validation once all 19 are complete.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
