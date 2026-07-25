# Implementation Plan: Customer Lifecycle, Retention, Loyalty & Win-Back Automation

**Branch**: `029-customer-lifecycle-retention-loyalty` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/029-customer-lifecycle-retention-loyalty/spec.md`

## Summary

This feature builds the platform's customer-retention engine: a standardized 8-stage Lifecycle Engine (Visitor→Lead→Prospect→First-Time→Active→Loyal→Brand Advocate→VIP, plus Dormant/At-Risk/Churned/Win-Back/Reactivated alternate states) with admin-configurable multi-condition entry/exit rules; a continuously recalculated 0–100 Customer Health Score across 5 bands; an AI Churn Prediction Engine classifying customers into 4 risk levels with advisory, approval-gated retention recommendations; retention automation and 10 customer-journey types across 5 channels; renewal-management workflows; a 6-tier loyalty system (Bronze→Elite) with an immutable points ledger (5 transaction types); referral-loyalty integration; win-back automation triggered at 30/60/90-day inactivity and other disengagement signals; dynamic real-time customer segmentation and engagement scoring; gamification-system integration; customer feedback/sentiment analysis; a Customer Success Dashboard and an Executive Retention Dashboard with AI-generated summaries and scenario-planning forecasts; an AI Retention Assistant; communication-preference/consent management; and security, governance, and integration requirements.

**This chapter is not cited by name in the constitution's own source list, but it is the most constitution-dense self-citing feature seen this session — its own FR text cites four distinct constitutional articles verbatim, plus flags an unresolved tension with a fifth**: FR-013 and FR-044 both cite "Constitution Article II" verbatim (churn-driven retention recommendations and AI executive summaries are advisory-only, never autonomous); FR-027 cites "(Constitution Article V: Ledger-Based Internal Economies)" verbatim, requiring the Loyalty Points Ledger to be append-only with a derived, never-directly-writable balance; FR-048 cites "consistent with Constitution Article VI" verbatim for per-channel, versioned, immediately-propagating consent. **Distinct from all of these compliance citations, FR-024 self-identifies a genuine, unresolved risk against a fifth article**: Chapter 16 lists "Revenue" as an allowed loyalty-tier-calculation factor, and FR-024 explicitly flags that "per Constitution Article VIII (No Pay-to-Win), status/rank must not be directly purchasable with money" — whether spend-driven tier progression is meaningfully distinguished from a direct pay-for-status purchase is **not resolved in the source** and is preserved here as a NEEDS CLARIFICATION rather than silently designed around.

Per spec.md's own Assumptions, this feature explicitly does not redefine two adjacent systems, and cross-references rather than duplicates them: (1) **Feature `006` (gamification-rewards)** owns the detailed award mechanics, ledger structure, fraud controls, and redemption/fulfillment flow for points/badges/streaks/levels/missions/challenges/leaderboards — this feature integrates with and consumes that gamification state (FR-036–FR-037) and separately defines only its own distinct Loyalty Points Ledger (FR-025–FR-027), which follows the same append-only-ledger pattern as `006`'s ledger without being the same ledger; (2) **Feature `040` (retention-intelligence-churn-prediction, Volume 14 Part 2 Ch 7)** is the deeper, authoritative churn-modeling specification — this feature's Churn Prediction Engine (FR-011–FR-014) is a first-pass capability whose role is customer-lifecycle-level consumption and action-triggering (routing a customer into retention/win-back automation), not competing predictive-modeling internals that `040` will own in greater depth. Underlying completion/activity events (purchases, course completion, community activity, event attendance, support interactions) are authoritatively emitted by `004`/`005`/`007`/`009`/`010`/`013`, consumed here, not re-originated.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–028.

**Primary Dependencies**: NestJS, Next.js; Churn Prediction and AI Retention Assistant consuming `008`'s AI gateway (FR-011, FR-045–FR-046); gamification-state consumption from `006` (FR-036–FR-037), not redefinition; upstream activity events from `004`/`005`/`007`/`009`/`010`/`013`; retention-workflow dispatch through `020`/`021`'s channel infrastructure (FR-016); an integration framework touching `013`/`019`/`022`/`024`/`025`/`020`/`021`/`009`/`030`/Rewards/Payment/Analytics/Support (FR-051).

**Storage**: PostgreSQL (~17 entities per spec.md's Key Entities — Lifecycle Stage, Lifecycle Transition, Lifecycle Rule, Customer Health Score, Churn Risk Level, Retention Recommendation, Customer Journey, Win-Back Journey, Loyalty Tier, Loyalty Points Ledger Entry, Loyalty Reward, Referral Reward Record, Customer Segment, Engagement Score, Renewal Record, Customer Feedback Record, Customer Success Dashboard/Executive Retention Dashboard domains), with Lifecycle Transition and Loyalty Points Ledger Entry both append-only/immutable (Constitution Article IV pattern for the former, Article V for the latter).

**Testing**: Jest (backend — lifecycle-transition-timestamped-and-stored, loyalty-points-ledger-immutability-with-derived-balance, and no-consequential-ai-retention-action-without-approval contract tests are the highest-stakes tests here, matching this spec's own SC-001, SC-004/Constitution Article V, and SC-006/Constitution Article II), Playwright (web e2e — lifecycle rule configuration, loyalty tier/points UI, win-back journey enrollment).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell) plus customer-facing loyalty/points surfaces on web and mobile; this is the retention layer sitting across nearly every prior consumer-platform feature's event stream.

**Performance Goals**: Lifecycle stage update under 2s; Health Score calculation under 1s; churn prediction under 5s; automation trigger execution under 3s; dashboard refresh under 3s; AI recommendation generation under 5s (FR-053).

**Constraints**: Every lifecycle-stage transition is automatic, timestamped, and stored, with no manual reassignment required (FR-003, FR-006, SC-001); the Health Score recalculates and reflects the correct band within 1s of a qualifying input (FR-008–FR-009, SC-002); churn risk classification completes within 5s and every High/Critical classification generates a confidence-scored, advisory retention recommendation (FR-012–FR-013, SC-003); every loyalty-point transaction is an immutable ledger entry with a derived, never-directly-writable balance (FR-026–FR-027, SC-004); every customer crossing a 30/60/90-day inactivity threshold is automatically enrolled into the matching Win-Back journey (FR-030, SC-005); zero consequential AI-generated retention actions execute without human/role-gated approval (FR-013, FR-044, SC-006, Constitution Article II); zero automated messages send on a channel after consent withdrawal, with propagation to in-flight journeys occurring without delay (FR-048, SC-007, Constitution Article VI); dynamic segment membership updates in real time (FR-033, SC-009).

**Scale/Scope**: ~17 data entities, 53 functional requirements (FR-001–FR-053), 7 user stories, an 8-stage core lifecycle plus 5 alternate states, a 5-band Health Score, a 4-level churn-risk classification, 10 customer-journey types, a 6-tier loyalty system with a 5-type ledger, and 7 NEEDS CLARIFICATION items across spec.md's Edge Cases and FR text — most notably FR-024's flagged, unresolved tension between revenue-based tier progression and Constitution Article VIII (No Pay-to-Win), plus win-back re-entry/cooldown policy, points-ledger negative-balance policy after redemption+refund, Health Score threshold-oscillation hysteresis, cross-module lifecycle-signal precedence, concurrent-journey deconfliction for high-tier-yet-at-risk customers, and the churn-prediction-outage deterministic fallback (to be reconciled with `040`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Lifecycle-stage evaluation, Health Score calculation, churn classification, and ledger updates are entirely server-side; no client-asserted stage, score, or balance | **PASS — direct implementation (not the constitution's named source for this article)** | FR-006, FR-008, FR-027 |
| II. AI Is Assistive, Never Autonomous | **FR-013 and FR-044 both cite "Constitution Article II" verbatim** — churn-driven retention recommendations and AI executive summaries are advisory only, with consequential actions requiring human/role-gated approval | **PASS — direct implementation, spec.md explicitly applies this article twice** | FR-013, FR-044–FR-046, SC-006 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A for this chapter's own surface — retention offers/discounts are subject to `002`/`016`'s no-dark-pattern rules, not redefined here | **PASS (N/A)** | — |
| IV. Historical Immutability | Lifecycle Transition records are immutable and timestamped; ledger reversal creates a new "Reversed" entry referencing the original rather than editing it | **PASS (aligns; not the constitution's named source for this article)** | FR-003, FR-026, Key Entities — Lifecycle Transition |
| V. Ledger-Based Internal Economies | **FR-027 cites "Constitution Article V: Ledger-Based Internal Economies" verbatim** — every loyalty-point transaction is an immutable ledger entry; balance is a derived sum, never directly writable | **PASS — direct implementation, spec.md explicitly applies this article** | FR-025–FR-027, SC-004 |
| VI. Consent Is First-Class | **FR-048 cites "consistent with Constitution Article VI" verbatim** — per-channel, versioned consent, re-checked before every automated send, with withdrawal propagating immediately to in-flight automation | **PASS — direct implementation, spec.md explicitly applies this article** | FR-047–FR-048, SC-007 |
| VII. Layered, Explicit RBAC | Rule changes affecting production automation route through an approval workflow per platform RBAC policy | **PASS (extends 001/016)** | FR-007, FR-049, User Story 6 acceptance scenario 4 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | **FR-024 explicitly flags an unresolved risk**: Chapter 16 allows Revenue as a loyalty-tier factor, which FR-024 itself notes may conflict with this article's prohibition on directly-purchasable status/rank | **FLAGGED — NEEDS CLARIFICATION, not silently resolved either direction** | FR-024 |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Preferred language is a first-class communication preference | **PASS (aligns; not the constitution's named source for this article)** | FR-047 |
| Security & Compliance Baseline | RBAC, consent management, audit logs, encryption, permission policies, approval workflows, retention policies, privacy controls, data masking | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-049–FR-050 |

No constitutional violations requiring Complexity Tracking justification. Article VIII's flagged tension (FR-024) is a documented source-level ambiguity requiring a product decision before tier-calculation logic ships, not an approved violation — it must not be silently designed around in either direction (neither by excluding Revenue nor by treating it as unconditionally safe).

## Project Structure

### Documentation (this feature)

```text
specs/029-customer-lifecycle-retention-loyalty/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: FR-024's revenue-based-tier-vs-Article-VIII tension (highest priority), win-back re-entry/cooldown policy, points-ledger negative-balance policy after redemption+refund (reconcile with 006), Health Score threshold-oscillation hysteresis, cross-module lifecycle-signal precedence, concurrent-journey deconfliction, and the churn-prediction-outage deterministic fallback (reconcile with 040)
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`028`'s structure — no new top-level projects; this feature consumes `006`'s gamification state, defers deep churn modeling to `040`, and reads activity events from `004`/`005`/`007`/`009`/`010`/`013`.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── lifecycle-engine/           # Lifecycle Stage/Transition/Rule, 8-stage + alternate states (FR-001–FR-007)
│   │   ├── customer-health-score/      # Customer Health Score, 5 bands (FR-008–FR-010)
│   │   ├── churn-prediction/           # Churn Risk Level, Retention Recommendation (FR-011–FR-014)
│   │   ├── retention-journeys/         # Customer Journey, retention workflows, 10 journey types (FR-015–FR-018)
│   │   ├── renewal-management/         # Renewal Record, renewal workflows/metrics (FR-019–FR-020)
│   │   ├── loyalty-tiers-ledger/       # Loyalty Tier, Loyalty Points Ledger Entry, Loyalty Reward (FR-021–FR-027)
│   │   ├── referral-loyalty/           # Referral Reward Record (FR-028–FR-029)
│   │   ├── winback-automation/         # Win-Back Journey, 30/60/90-day triggers (FR-030–FR-031)
│   │   ├── customer-segmentation/      # Customer Segment, Engagement Score (FR-032–FR-035)
│   │   ├── gamification-integration/   # consumes 006's state; no redefinition (FR-036–FR-037)
│   │   ├── feedback-sentiment/         # Customer Feedback Record, AI sentiment/topic/trend/urgency (FR-038–FR-039)
│   │   ├── retention-dashboards/       # Customer Success Dashboard, Executive Retention Dashboard (FR-040–FR-044)
│   │   ├── ai-retention-assistant/     # AI Retention Assistant recommendations (FR-045–FR-046)
│   │   └── retention-governance/       # consent/preferences, RBAC, audit, integration (FR-047–FR-052)
│   └── common/                         # reused from 001/016: RbacGuard; reused from 006: gamification state; reused from 008: AI gateway; reused from 004/005/007/009/010/013: activity events; reused from 020/021: dispatch channels
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── retention/{dashboard, lifecycle-rules, health-scores, churn-risk, loyalty, winback, executive}/
```

**Structure Decision**: 13 new backend modules under `lifecycle-*`/`churn-*`/`loyalty-*`/`winback-*`/etc. `lifecycle-engine` (the foundation every other module reads/writes) and `loyalty-tiers-ledger` (Article V immutability) are built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no approved constitutional violations; FR-024's Article VIII tension is flagged NEEDS CLARIFICATION, not an approved exception | — | — |
