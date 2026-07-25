# Implementation Plan: Gamification: Points, Levels, Badges, Streaks, Leaderboards & Rewards

**Branch**: `006-gamification-rewards` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-gamification-rewards/spec.md`

## Summary

This feature builds the platform's entire internal-economy and recognition layer: non-redeemable XP and Levels; redeemable TBT Reward Points with a full ledger-based earn/redeem/reward-catalog/fulfillment flow; timezone-aware Streaks with Freeze and Recovery; Badges (automatic, verified, progressive, hidden, revocable); Missions; Challenges (individual/team/community-wide, with verified scoring and tiebreakers); segmented, fraud-resistant Leaderboards; non-redemption Recognition; a Fraud Review console; and the admin Point Economy Simulation/governance tooling that keeps the whole system financially sustainable.

This is the constitution's **primary cited source for two separate articles**: **Article V (Ledger-Based Internal Economies)** — "Vol 06 (6 separate point ledgers)" — and **Article VIII (No Pay-to-Win, No Vanity-Metric Optimization)** — "Vol 06 'No Pay-to-Win' hard rule." Every balance in this feature (XP, Reward Points, level, streak, leaderboard rank) is derived from an append-only ledger or server-side evaluation, never a directly-writable field, and rank/level/badges/challenge-wins are explicitly barred from direct cash purchase.

It **consumes, never defines**, the underlying completion/verification events from **004** (LMS: lesson/quiz/assignment completion), **005** (Community: accepted answers, helpful contributions — and in turn *emits* point-eligible signals back to `005` per that feature's own Assumptions), **007** (Mentor: mentor-approved activity), and **010** (Events: attendance). It treats **009** as the system of record for anything monetary (cash co-pay rewards, referral-point financial rules) and reuses **001**'s layered RBAC for every admin/approval-threshold requirement rather than defining a separate gamification role hierarchy.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–005.

**Primary Dependencies**: NestJS, Next.js, Flutter; a job scheduler for scheduled streak-evaluation and leaderboard-period resets (FR-115 — NEEDS CLARIFICATION: no specific scheduler named in source); a fraud/anomaly-signal evaluation capability (FR-093 — NEEDS CLARIFICATION: no specific technique named, consistent with the source not committing to one).

**Storage**: PostgreSQL (~30 entities per spec.md's Key Entities — six append-only ledgers plus Level/Badge/Streak/Mission/Challenge/Leaderboard/Reward/Recognition/Fraud domains), Redis (leaderboard-snapshot cache, nearby-rank query acceleration, streak-day evaluation cache, reward-inventory concurrency locks).

**Testing**: Jest (backend — idempotency, ledger-integrity, and no-overselling contract tests are the highest-stakes tests in this entire feature), Playwright (web e2e), Flutter test (mobile — offline streak/mission/challenge-draft queueing).

**Target Platform**: Web + mobile, consistent with prior features.

**Performance Goals**: Point-award processing asynchronous where suitable without delaying the triggering completion response; near-real-time balance updates; cached leaderboard snapshots with efficient nearby-rank queries; event-driven badge evaluation; scheduled-and-event-based streak calculation; incremental challenge-progress aggregation (FR-115).

**Constraints**: Every point/level/badge/streak/reward-award calculation MUST be server-authoritative (FR-107, Constitution Article I); the same qualifying event MUST NEVER award points more than once, enforced via idempotency key + unique-transaction constraint (FR-014, SC-001); no balance may ever be a directly-writable field — only a derived ledger sum (FR-010, SC-002); reward-stock redemption MUST have zero overselling under concurrent load (FR-083, SC-003); no single weak fraud signal may trigger a permanent penalty (FR-093, SC-007); reward points, XP, rank, badges, and mentor/challenge status can never be purchased directly with cash (Constitution Article VIII); streak-break and leaderboard messaging MUST be non-shaming (FR-042, SC-010).

**Scale/Scope**: ~30 data entities across 6 ledgers + 9 subsystem domains, 116 functional requirements, 9 user stories, a dedicated fraud-review console, and a Point Economy Simulation gate on every rule publish.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | All calculation server-side; client-asserted level/XP rejected | **PASS — direct implementation** | FR-014, FR-107, SC-001 |
| II. AI Is Assistive, Never Autonomous | Fraud detection (if AI-assisted) routes to human review, never auto-punishes on one weak signal | **PASS** | FR-093, SC-007 |
| III. No Dark Patterns | N/A — no monetization surface owned directly here; cash co-pay rewards defer to `009` | **PASS (N/A)** | spec.md Assumptions |
| IV. Historical Immutability | Point-rule edits versioned, never silently overwritten; ledger history never deleted | **PASS** | FR-098, FR-016 |
| V. Ledger-Based Internal Economies | **Constitution-cited primary source** ("Vol 06, 6 separate point ledgers") — every balance derived from an append-only ledger | **PASS — primary implementer** | FR-009, FR-010, SC-002 |
| VI. Consent Is First-Class | Recognition of sensitive/financial achievements requires explicit member consent; auto-sharing defaults off | **PASS** | FR-089, FR-091 |
| VII. Layered, Explicit RBAC | Admin/approval-threshold actions reuse `001`'s RBAC, no separate role hierarchy | **PASS (extends 001)** | FR-100, spec.md Assumptions |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | **Constitution-cited primary source** ("Vol 06 'No Pay-to-Win' hard rule") — rank/badges/mentor-status cannot be purchased; community badges require quality signals not raw counts | **PASS — primary implementer** | FR-028, Constitution Article VIII |
| IX. Action Before Consumption | Streaks are the platform's primary consistency-building mechanic | **PASS (contributes)** | FR-036; shared emphasis with `004` |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/006-gamification-rewards/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: job-scheduler choice for streak/leaderboard-period jobs, fraud-signal evaluation technique, and every numeric default the source leaves unstated (level thresholds pending brand review, high-impact rule-change threshold, manual-adjustment approval threshold, max streak-freeze inventory, max mission replacements, default point-expiry policy)
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`005`'s structure — no new top-level projects.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── gamification-ledger/    # XP/Reward Point/Adjustment/Redemption/Expiry/Reversal ledgers, Point Rule, point-award orchestrator (FR-001–FR-023)
│   │   ├── gamification-level/     # Level, User Level, Level Benefit (FR-003–FR-008)
│   │   ├── gamification-badge/     # Badge, Badge Criterion, User Badge, Achievement, User Achievement (FR-024–FR-035)
│   │   ├── gamification-streak/    # Streak, Streak Activity, Streak Freeze (FR-036–FR-043)
│   │   ├── gamification-mission/   # Mission, User Mission (FR-044–FR-047)
│   │   ├── gamification-challenge/ # Challenge, Challenge Task, Challenge Participant, Challenge Submission, Challenge Review, Challenge Team (FR-048–FR-065)
│   │   ├── gamification-leaderboard/ # Leaderboard, Leaderboard Snapshot, Leaderboard Entry (FR-066–FR-073)
│   │   ├── gamification-reward/    # Reward, Reward Inventory, Reward Redemption, Reward Fulfillment, coupons (FR-074–FR-086)
│   │   ├── gamification-recognition/ # Recognition, Nomination (FR-087–FR-091)
│   │   ├── gamification-fraud/     # Fraud Signal, Gamification Review, Appeal (FR-092–FR-095)
│   │   └── gamification-admin/     # Admin module, Point Economy Simulation, manual adjustments, reports (FR-096–FR-102)
│   └── common/                     # reused from 001–005: RbacGuard, audit-log interceptor
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (member)/
        └── gamification/{wallet,levels,badges,streak,missions,challenges,leaderboard,rewards,recognition}/
    └── (admin)/
        └── gamification/{dashboard,point-rules,levels,badges,missions,challenges,leaderboards,rewards,redemptions,recognition,fraud-review,adjustments,reports,settings}/

mobile/
└── lib/features/
    └── gamification/                # wallet, streak calendar, missions, challenges, leaderboard, rewards, offline queueing (FR-112)
```

**Structure Decision**: 10 new backend modules under `gamification-*`, mirroring spec.md's own FR groupings so each module maps cleanly to a Key Entities cluster. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
