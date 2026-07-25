# Implementation Plan: Enterprise Customer Journey Analytics & Path Analysis

**Branch**: `039-customer-journey-analytics` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/039-customer-journey-analytics/spec.md`

## Summary

This feature builds the platform's UX/product-analytics journey-intelligence layer: continuous journey reconstruction from captured events into a "digital twin" timeline spanning 10 lifecycle stages; multi-signal identity resolution merging anonymous and known activity; session grouping with 9 aggregate metrics; automatic funnel building with AI-assisted drop-off-cause detection; 9-category path classification (Most Common, Most Successful, Fastest, Longest, Highest Revenue, Highest Retention, Abandoned, Looping, Dead-End) with per-node conversion measurement and a visual journey map; 12-touchpoint performance scoring and cross-channel/cross-device transition tracking; a 7-dimension Journey Score (Engagement, Conversion, Friction, Retention, Loyalty, Revenue, Health); an 8-signal Friction Intelligence layer; an Experience Optimization Engine and an advisory-only AI Journey Assistant answering operational questions; predictive journey analytics (purchase/churn/membership/completion/engagement/referral likelihoods); journey-stage personalization and 8-segment journey grouping; session replay and 4-type heatmaps with mandatory sensitive-data masking; 7 role-oriented dashboards and 8 Journey APIs; and security/compliance requirements.

**Source note**: per spec.md's own Source Note (already flagged in `CLAUDE.md`), Chapter 6 is one of the thinner drafts in Volume 14 — a flat "shall" list with no field-level data models, scoring formulas, or risk tables. This spec's 33 FRs are extracted from every stated capability with nothing padded in, and this plan follows the same discipline: no invented implementation detail beyond what spec.md itself states or flags as NEEDS CLARIFICATION.

## Ownership & Dependency Analysis (Feature 039 vs. Features 034, 040, 044, and the "Customer Journey" entity cluster)

Spec.md's own Assumptions explicitly address three of these relationships; a fourth — the recurring "Customer Journey" naming collision already seen across `022`, `027`, `032`, and `037` — is not addressed by spec.md and is surfaced here.

### 1. Confirmed clean: `034` supplies the raw substrate, not redefined here

Spec.md's own Assumptions state plainly that this chapter assumes `034`'s event collection, identity, and data-governance layer already exists to supply the raw event stream, consent state, and retention enforcement this feature's reconstruction/identity-resolution/security requirements depend on — the source chapter itself specifies no event schema, ingestion pipeline, or storage architecture. **This feature's `Event` and `Identity` entities are consumed views into `034`'s Raw Event/Customer Identity Service, not a second ingestion or identity-resolution engine.**

### 2. Confirmed clean: forward boundaries with `040` and `044`

Spec.md's own Assumptions explicitly scope this feature's predictive churn/purchase likelihoods (FR-025) as "a lightweight forecast within this chapter's scope," with the full churn-prediction model and retention-intervention workflows reserved for `040` (`retention-intelligence-churn-prediction`) as canonical, and broader enterprise CX/journey/success workflows reserved for `044` (`enterprise-cx-journey-success`). This feature does not attempt either deeper capability.

### 3. New finding: a fifth "Customer Journey"-named entity, resolved by distinguishing analytical purpose rather than merged or left unaddressed

Not addressed by spec.md's own Assumptions. This feature's own `Journey` entity ("the complete, reconstructed, chronologically ordered sequence of a single customer's interactions... the unit that scores, paths, and predictions are computed against") joins `022`'s (workflow-instance journey), `027`'s (attribution touchpoint-sequence journey), `032`'s (orchestration execution-state journey instance), and `037`'s (identity-confidence-gated, official-reporting journey extending `027`'s) as a **fifth** independently-specified "Customer Journey"-flavored entity on the platform. **Ownership decision**: unlike the `022`/`032` collision (which is a genuine, unresolved duplicate-purpose conflict) or `037`'s relationship to `027` (which is a direct extension along the same analytical axis), this feature's `Journey` is a **UX/product-analytics reconstruction** — sessions, funnels, 9-category path classification, 7-dimension scoring, friction signals, replay/heatmaps — a **materially different analytical lens** from `027`'s/`037`'s attribution-and-revenue-focused journey and from `032`'s live orchestration-execution state. It is built from `034`'s same underlying event stream (per §1 above) but is not merged with `027`'s/`037`'s entity, since their field sets and purposes (attribution credit, identity-confidence-gated official reporting) do not overlap with this feature's (funnel/path/friction/replay analytics). **This is flagged, not silently resolved, as a fifth instance of the naming pattern** — a candidate for a future platform-wide consolidation review (e.g., a single underlying `Journey` fact table with purpose-specific analytical views), but not something this plan invents a merge for.

### 4. Confirmed clean: AI governance and consent

Spec.md's own Assumptions state the source's Core Principles (privacy compliance, AI as assistive not autonomous, per-channel/versioned consent) are treated as informing FR-024 (AI recommendations require human review) and FR-033 (consent enforcement) rather than generating separate duplicate requirements — consistent with Constitution Articles II and VI, reusing the platform-wide model rather than redefining it.

### 5. Preserved NEEDS CLARIFICATION items (from spec.md's own Assumptions/Edge Cases, not resolved here)

- Gap-handling/partial-reconstruction policy for an incomplete event stream.
- Identity-resolution matching/confidence policy for weak-signal (non-login) device linkage.
- Fail-closed (mask-by-default) behavior for a newly introduced, not-yet-covered sensitive field type in Journey Replay.
- Health Score weighting/conflict-resolution rule when dimension scores disagree (e.g., high Conversion + high Friction).
- Looping-Path vs. legitimate-repeat-engagement distinction; Dead-End-Path vs. simple-inactivity distinction (no abandonment time threshold stated).
- Cold-start behavior for Predictive Journey Analytics on customers with little/no historical data.
- Concurrency/load envelope the stated performance targets must hold under.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–038.

**Primary Dependencies**: NestJS, Next.js; consumes `034`'s Raw Event stream and Customer Identity Service rather than re-ingesting or re-resolving identity; AI drop-off-cause detection, AI Journey Assistant, and Predictive Journey Analytics consuming `008`'s AI gateway; RBAC/consent reused from `001`/`016` and the platform-wide consent system.

**Storage**: PostgreSQL for scores/sessions/funnels/paths, a high-throughput store for Event/replay volume (~13 entities per spec.md's Key Entities — Journey, Journey Stage, Event, Session, Identity, Funnel, Path, Touchpoint, Journey Score, Friction Signal, Heatmap, Journey Replay, Predictive Journey Forecast, Journey Segment domains).

**Testing**: Jest (backend — journey-reconstruction-under-2-seconds, replay-masking-100-percent, and path-classification-all-9-types contract tests are the highest-stakes tests here, matching this spec's own SC-001, SC-007, and SC-006), Playwright (web e2e — journey timeline view, funnel/drop-off dashboard, session replay with masking verification).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell); this is the UX/product-analytics layer consuming `034`'s event substrate.

**Performance Goals**: Journey reconstruction under 2s; live events reflected under 1s; dashboards under 3s; Journey API queries under 500ms (FR performance targets, SC-001–SC-004).

**Constraints**: 100% of meaningful in-scope interactions produce a corresponding timestamped event with no unexplained timeline gaps (FR-007, SC-005); path analysis correctly categorizes journeys across all 9 path types (FR-013, SC-006); zero unmasked sensitive data appears in Journey Replay (FR-029, SC-007); every reconstructed journey carries a complete, non-null value for all 7 Journey Score dimensions (FR-019, SC-008); AI-generated recommendations are presented for human review, never executed automatically (FR-024, Constitution Article II).

**Scale/Scope**: ~13 data entities, 33 functional requirements (FR-001–FR-033), 7 user stories, 10 journey lifecycle stages, 9 path categories, 7 score dimensions, 8 friction signal types, 6 predictive forecast types, and multiple NEEDS CLARIFICATION items in spec.md's own Edge Cases — most notably the newly-flagged fifth "Customer Journey" naming instance across `022`/`027`/`032`/`037`/`039`, alongside gap-handling, identity-confidence, masking-fail-closed, scoring-conflict, and cold-start policy gaps already flagged by spec.md itself.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Journey reconstruction, scoring, and path classification are entirely server-side; no client-asserted journey state or score | **PASS — direct implementation (not the constitution's named source for this article)** | FR-002, FR-019 |
| II. AI Is Assistive, Never Autonomous | Spec.md's own Assumptions apply this article to FR-024 (AI recommendations require human review) and predictive forecasts (advisory signal, not automatic action) | **PASS (aligns; spec.md explicitly applies this article per its own Assumptions)** | FR-024, User Story 7 acceptance scenario 3 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A for this chapter's own surface — internal analytics/replay tooling, no customer-facing claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | Event/Session records are timestamped and chronologically fixed; journey reconstruction does not retroactively alter past events | **PASS (aligns; not the constitution's named source for this article)** | FR-007, Key Entities — Event |
| V. Ledger-Based Internal Economies | N/A — this feature analyzes journeys, it does not manage a redeemable point/wallet balance | **PASS (N/A)** | — |
| VI. Consent Is First-Class | Spec.md's own Assumptions apply this article to FR-033's consent enforcement, reusing the platform-wide per-channel/versioned model rather than redefining it | **PASS (aligns; consent capture owned elsewhere, enforcement is this feature's own)** | FR-033 |
| VII. Layered, Explicit RBAC | RBAC over journey data, replay access restricted to authorized users | **PASS (extends 001/016)** | FR-033 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | N/A for this chapter's own surface — no localized content generated here | **PASS (N/A)** | — |
| Security & Compliance Baseline | Encryption, RBAC, audit logs, consent, data masking, GDPR support, retention policies | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-033 |

No constitutional violations. No Complexity Tracking entries required for principle compliance. The fifth "Customer Journey" naming instance is a documented ownership finding (see analysis above), not a constitutional violation.

## Project Structure

### Documentation (this feature)

```text
specs/039-customer-journey-analytics/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: gap-handling/partial-reconstruction policy, identity-resolution confidence policy, replay masking fail-closed behavior for new sensitive-field types, Health Score weighting/conflict-resolution rule, Looping/Dead-End path distinction thresholds, predictive cold-start behavior, and concurrency/load envelope for the stated performance targets
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`038`'s structure — no new top-level projects; this feature consumes `034`'s event/identity substrate and defers deeper churn modeling to `040` and broader CX/journey/success workflows to `044`.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── journey-reconstruction/     # Journey, Journey Stage, Event, Session, Identity — consumes 034 (FR-001–FR-009)
│   │   ├── funnel-intelligence/        # Funnel, AI drop-off-cause detection (FR-010–FR-012)
│   │   ├── path-analysis/              # Path, 9-category classification, journey map (FR-013–FR-015)
│   │   ├── touchpoint-cross-channel/   # Touchpoint scoring, channel/device transitions (FR-016–FR-018)
│   │   ├── journey-scoring/            # Journey Score, 7 dimensions (FR-019–FR-020)
│   │   ├── friction-intelligence/      # Friction Signal (FR-021)
│   │   ├── experience-optimization-ai/ # Experience Optimizer, AI Journey Assistant (FR-022–FR-024)
│   │   ├── predictive-journey-analytics/ # Predictive Journey Forecast (FR-025)
│   │   ├── journey-personalization-segmentation/ # stage personalization, Journey Segment (FR-026–FR-027)
│   │   ├── journey-replay-heatmaps/    # Journey Replay, Heatmap, masking (FR-028–FR-030)
│   │   └── journey-dashboards-api/     # 7 dashboards, 8 APIs, security/compliance (FR-031–FR-033)
│   └── common/                         # reused from 034: Raw Event stream, Customer Identity Service; reused from 008: AI gateway; reused from 001/016: RbacGuard; reused from platform consent system
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── journey-analytics/{timeline/[customerId], funnels, paths, friction, replay/[sessionId], predictive, executive}/
```

**Structure Decision**: 10 new backend modules under `journey-*`/`funnel-*`/`path-*`/`friction-*`/etc., explicitly wired to consume `034`'s event/identity substrate rather than re-ingesting or re-resolving. `journey-reconstruction` (the foundational "digital twin" every other capability computes on top of) and `journey-replay-heatmaps` (the mandatory masking guarantee) are built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations; the fifth "Customer Journey" naming instance is a documented open ownership item, not an approved exception | — | — |
