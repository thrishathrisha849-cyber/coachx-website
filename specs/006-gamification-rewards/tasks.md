---
description: "Task list for Feature 006 — Gamification: Points, Levels, Badges, Streaks, Leaderboards & Rewards"
---

# Tasks: Gamification: Points, Levels, Badges, Streaks, Leaderboards & Rewards

**Input**: Design documents from `/specs/006-gamification-rewards/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Features 001–005's Foundational phases complete** (RBAC/audit-log from 001, Consent from 002, Auth/Profile from 003, LMS completion events from 004, Community accepted-answer/point-signal events from 005).

**Tests**: Included throughout — this is the constitution's primary cited source for both Article V (ledger integrity) and Article VIII (no pay-to-win); idempotency, ledger-derivation, and no-overselling get dedicated Foundational contract tests, matching SC-001/SC-002/SC-003.

**Organization**: Tasks are grouped by user story (US1–US9 from spec.md), plus one supplementary cross-cutting phase (Recognition) covering FR-087–FR-091, which spans multiple stories rather than belonging to one.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`–`005`'s Foundational phases are deployed (RBAC, audit-log interceptor, Consent Record, Auth/Profile, LMS/Community event-emission points this feature consumes)
- [ ] T002 Resolve `research.md` open items before proceeding: job-scheduler choice, fraud-signal evaluation technique, and every numeric default the source leaves unstated (level thresholds pending brand review, high-impact rule-change threshold, manual-adjustment approval threshold, max streak-freeze inventory, max mission replacements, default point-expiry policy)
- [ ] T003 [P] Add `backend/src/modules/{gamification-ledger,gamification-level,gamification-badge,gamification-streak,gamification-mission,gamification-challenge,gamification-leaderboard,gamification-reward,gamification-recognition,gamification-fraud,gamification-admin}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Define the 6 append-only ledgers — Experience (XP) Transaction, Reward Point Transaction, Point Expiry Lot, Point Adjustment (Adjustment ledger), plus Redemption-ledger and Reversal-ledger entries — in `backend/src/modules/gamification-ledger/` (FR-009, FR-016)
- [ ] T005 Define the `Point Rule` entity in `backend/src/modules/gamification-ledger/point-rule.entity.ts` (FR-012 field set)
- [ ] T006 Define `Level`, `User Level`, `Level Benefit` entities in `backend/src/modules/gamification-level/` (FR-003, FR-006)
- [ ] T007 Define `Badge`, `Badge Criterion`, `User Badge`, `Achievement`, `User Achievement` entities in `backend/src/modules/gamification-badge/` (FR-026, FR-035)
- [ ] T008 Define `Streak`, `Streak Activity`, `Streak Freeze` entities in `backend/src/modules/gamification-streak/` (FR-036–FR-041 field refs)
- [ ] T009 [P] Define `Mission`, `User Mission` entities in `backend/src/modules/gamification-mission/` (FR-044)
- [ ] T010 Define `Challenge`, `Challenge Task`, `Challenge Participant`, `Challenge Submission`, `Challenge Review`, `Challenge Team` entities in `backend/src/modules/gamification-challenge/` (FR-050, FR-055, FR-057, FR-061)
- [ ] T011 Define `Leaderboard`, `Leaderboard Snapshot`, `Leaderboard Entry` entities in `backend/src/modules/gamification-leaderboard/` (FR-066–FR-069)
- [ ] T012 Define `Reward`, `Reward Inventory`, `Reward Redemption`, `Reward Fulfillment` entities plus coupon fields in `backend/src/modules/gamification-reward/` (FR-075, FR-079, FR-080, FR-081, FR-084)
- [ ] T013 [P] Define `Recognition`, `Nomination` entities in `backend/src/modules/gamification-recognition/` (FR-087, FR-088)
- [ ] T014 Define `Fraud Signal`, `Gamification Review` (Fraud Review Case), `Appeal` entities in `backend/src/modules/gamification-fraud/` (FR-092, FR-095)
- [ ] T015 [P] Define the `Reputation Score` entity (internal, not-necessarily-public, distinct from XP/points) in `backend/src/modules/gamification-badge/reputation-score.entity.ts` — receives signals from `005` per that feature's Assumptions
- [ ] T016 Implement the point-award process orchestrator (verify event authenticity → check eligibility → rule status/effective period → duplicate check → daily/weekly/lifetime caps → fraud-signal evaluation → create immediate-or-pending transaction → update balance → evaluate level/badge/challenge progress → notify → analytics), requiring source event ID + rule ID + user ID + idempotency key on every request, in `backend/src/modules/gamification-ledger/point-award.service.ts` (FR-013, FR-014, Constitution Article I)
- [ ] T017 Implement the ledger-balance derivation service: current balance is always computed from ledger transactions (or a safely-cached aggregation), never a directly-writable field, in `backend/src/modules/gamification-ledger/balance-derivation.service.ts` (FR-010)
- [ ] T018 Note: admin role and approval-threshold enforcement (FR-100) reuses `001`'s layered RBAC directly — no separate gamification role hierarchy is created here (Constitution Article VII)
- [ ] T019 Contract test: zero duplicate point awards for the same qualifying event under retry/replay conditions, across lesson-completion/quiz/assignment/business-milestone event types in `backend/tests/contract/gamification-idempotency.contract.test.ts` (FR-014, SC-001)
- [ ] T020 Contract test: every XP/reward-point/level/reward-inventory balance change traces to an immutable ledger transaction — no direct balance write path exists — in `backend/tests/contract/gamification-ledger-integrity.contract.test.ts` (FR-010, SC-002)
- [ ] T021 Contract test: zero overselling on limited-stock reward redemption under concurrent load in `backend/tests/contract/reward-no-overselling.contract.test.ts` (FR-078, FR-083, SC-003)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Earn XP and Progress Through Levels (P1) 🎯 MVP

**Independent Test**: Trigger a qualifying learning event for a test user; verify an XP ledger entry is created, the level engine recalculates eligibility server-side, and the level-progress widget reflects the new state.

- [ ] T022 [US1] XP award on a qualifying event, server-computed, wired to T016's orchestrator in `backend/src/modules/gamification-ledger/xp-award.service.ts` (FR-001, FR-002, acceptance scenario 1)
- [ ] T023 [US1] Level-threshold-crossing evaluation as an atomic transaction (update level, unlock benefits, celebration, notification, profile badge, analytics) in `backend/src/modules/gamification-level/level-evaluation.service.ts` (FR-005, acceptance scenario 2)
- [ ] T024 [US1] Level downgrade restricted to fraudulent-XP removal, major admin correction, or account-merge only — every downgrade requires notification + reason + audit + benefit recalculation + appeal option in `backend/src/modules/gamification-level/level-downgrade.service.ts` (FR-007, acceptance scenario 3)
- [ ] T025 [US1] Client-asserted level/XP value rejection — level/XP are computed only from server-side ledger and rule evaluation, wired to T016's idempotency contract in `backend/src/modules/gamification-level/level-evaluation.service.ts` (FR-014 reuse, acceptance scenario 4)
- [ ] T026 [US1] Non-linear level-threshold structure + configurable level benefits, with core learning/safety features never gated behind level in `backend/src/modules/gamification-level/level-config.service.ts` (FR-003, FR-004, FR-006)
- [ ] T027 [P] [US1] Level-progress widget (backend-computed values only) in `web/src/components/gamification/level-progress-widget.tsx` (FR-008)
- [ ] T028 [US1] Integration test: XP award → level-crossing celebration, downgrade-only-for-fraud, client-tamper rejection in `backend/tests/integration/us1-xp-level.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: The foundation every other gamification mechanic reads from is independently functional.

---

## Phase 4: User Story 2 — Earn and Redeem TBT Reward Points Against the Reward Catalog (P1)

**Independent Test**: Credit a test user's Reward Point ledger, redeem an in-stock catalog reward, and confirm the redemption transitions Initiated → Points reserved → Confirmed → Fulfilled with ledger and stock both correctly decremented.

- [ ] T029 [US2] Point-earning action categories (Learning/Community/Business/Consistency/Event) with verification-gated business-milestone awards in `backend/src/modules/gamification-ledger/point-categories.service.ts` (FR-011)
- [ ] T030 [US2] Pending-point lifecycle (Pending → Approved/Rejected/Expired/Reversed) with pending balance shown separately from available balance in `backend/src/modules/gamification-ledger/pending-points.service.ts` (FR-015, edge case: pending points later rejected)
- [ ] T031 [US2] Point reversal referencing the original transaction, with ledger history never deleted in `backend/src/modules/gamification-ledger/point-reversal.service.ts` (FR-016)
- [ ] T032 [US2] Negative-balance policy (deduct from future earnings / lock redemption / admin review / cancel reward), with no direct cash-payment recovery absent an approved policy, and a clear user-facing explanation in `backend/src/modules/gamification-ledger/negative-balance.service.ts` (FR-017, edge case)
- [ ] T033 [US2] Point-expiry policy per T002's resolution, with 30-day and 7-day expiring-soon reminders, tracked at the lot level in `backend/src/modules/gamification-ledger/point-expiry.service.ts` (FR-018)
- [ ] T034 [P] [US2] Points wallet screen (available/pending/expiring/lifetime-earned/lifetime-redeemed/current-XP/level/next-level-progress, filterable transactions) in `web/src/app/(member)/gamification/wallet/page.tsx` (FR-019, FR-020)
- [ ] T035 [US2] Point caps (per-action-day/week, category, total-daily, campaign, lifetime) with a high-value-verified-action exception path, plus diminishing returns on repeated low-value actions in `backend/src/modules/gamification-ledger/point-caps.service.ts` (FR-021, FR-022)
- [ ] T036 [US2] Baseline referral-point anti-abuse safeguards (verified referred user, meaningful activation, waiting period, self-referral/device-duplication detection, reversal on refund/fraud) in `backend/src/modules/gamification-ledger/referral-safeguards.service.ts` (FR-023)
- [ ] T037 [US2] Reward redemption flow (select → eligibility → stock → balance → terms → delivery-details capture → reserve points → create transaction → reserve stock → initiate fulfillment → confirm → debit-or-release) as an atomic or compensating transaction in `backend/src/modules/gamification-reward/redemption-flow.service.ts` (FR-078, acceptance scenario 1)
- [ ] T038 [US2] Concurrent-redemption stock-locking, wired to T021's no-overselling contract, in `backend/src/modules/gamification-reward/stock-lock.service.ts` (FR-083, acceptance scenario 2, edge case: last-unit race)
- [ ] T039 [US2] Redemption-failure reversal (refund points, reference the original redemption transaction) in `backend/src/modules/gamification-reward/redemption-refund.service.ts` (FR-082, acceptance scenario 3)
- [ ] T040 [US2] Oldest-expiring-lot-first debit, re-validated at redemption commit time (not browse time) in `backend/src/modules/gamification-reward/redemption-flow.service.ts` (FR-018, acceptance scenario 4, edge case: points expiring mid-redemption)
- [ ] T041 [P] [US2] Reward catalog browsing and reward detail screen in `web/src/app/(member)/gamification/rewards/{page.tsx,[rewardId]/page.tsx}` (FR-077)
- [ ] T042 [P] [US2] Digital reward fulfillment (unique codes, expiry, usage count, secure delivery, reissue policy, redemption audit) in `backend/src/modules/gamification-reward/digital-fulfillment.service.ts` (FR-080)
- [ ] T043 [P] [US2] Physical reward fulfillment (shipping address as sensitive, retention-limited data; tracking; delivery confirmation; return policy) in `backend/src/modules/gamification-reward/physical-fulfillment.service.ts` (FR-081)
- [ ] T044 [P] [US2] Reward coupon definition (code/value/type/product/min-spend/expiry/restriction), never exposed in plain-text logs in `backend/src/modules/gamification-reward/coupon.service.ts` (FR-084)
- [ ] T045 [US2] Integration test: full redemption flow, concurrent-stock race safety, failure-reversal, oldest-lot-first commit-time debit in `backend/tests/integration/us2-points-rewards.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: The core "value exchange" that makes gamification meaningful is independently functional.

---

## Phase 5: User Story 3 — Maintain a Daily Streak With Freeze and Recovery (P1)

**Independent Test**: Perform a qualifying action on consecutive server-recognized days in a fixed timezone; confirm daily increments; skip a day and confirm the streak breaks or is protected by a Freeze without demotivating copy; confirm Recovery is offered within its window.

- [ ] T046 [US3] Timezone-aware streak-day calculation using the user's timezone with server timestamps as the source of truth in `backend/src/modules/gamification-streak/streak-day.service.ts` (FR-037, acceptance scenario 1)
- [ ] T047 [US3] Streak Freeze application (auto-or-manual, single-day-only — cannot retroactively cover multiple missed days) in `backend/src/modules/gamification-streak/streak-freeze.service.ts` (FR-040, acceptance scenario 2, edge case: multi-day gap)
- [ ] T048 [US3] Non-shaming streak-break messaging that keeps previous achievements visible in `web/src/components/gamification/streak-break-message.tsx` (FR-042, acceptance scenario 3)
- [ ] T049 [US3] Streak Recovery (defined window, eligible streak length, required comeback task, optional point cost, limited monthly use) in `backend/src/modules/gamification-streak/streak-recovery.service.ts` (FR-041, acceptance scenario 4)
- [ ] T050 [US3] Streak qualification models (Model A/B/C, with Model A as the recommended default) plus the streak-state widget (current/longest/today's-status/weekly-calendar/next-milestone/freeze-availability/recovery-state) in `backend/src/modules/gamification-streak/streak-model.service.ts` (FR-038, FR-039)
- [ ] T051 [US3] Weekly Consistency as an inclusive alternative to daily streaks for irregular schedules in `backend/src/modules/gamification-streak/weekly-consistency.service.ts` (FR-043)
- [ ] T052 [US3] Timezone-change abuse protection (blocks manufactured extra days while remaining fair to legitimate travelers) in `backend/src/modules/gamification-streak/streak-day.service.ts` (FR-037, edge case)
- [ ] T053 [US3] Integration test: local-timezone day-boundary correctness, freeze application, non-shaming break messaging, recovery-within-window in `backend/tests/integration/us3-streaks.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: The platform's primary consistency-building mechanic is independently functional.

---

## Phase 6: User Story 4 — Earn Badges Including Hidden and Progressive Badges (P2)

**Independent Test**: Trigger a badge-qualifying event and confirm an Automatic badge is awarded without human review; separately test a Verified badge held until reviewer approval, and a Hidden badge whose criteria aren't shown until unlocked.

- [ ] T054 [US4] Automatic badge award (system-rule evaluation, existing-ownership check, no auto-post to community without consent) in `backend/src/modules/gamification-badge/automatic-badge.service.ts` (FR-031, acceptance scenario 1)
- [ ] T055 [US4] Progressive badge tiers (Bronze/Silver/Gold/Platinum) with tier-specific progress display in `backend/src/modules/gamification-badge/progressive-badge.service.ts` (FR-025, acceptance scenario 2)
- [ ] T056 [US4] Hidden badge criteria (restricted description until unlocked) in `backend/src/modules/gamification-badge/hidden-badge.service.ts` (FR-025, FR-033, acceptance scenario 3)
- [ ] T057 [US4] Badge revocation (authorized action, reason, audit entry, user notification, public-profile update, appeal eligibility) in `backend/src/modules/gamification-badge/badge-revocation.service.ts` (FR-034, acceptance scenario 4)
- [ ] T058 [P] [US4] Verified badge review workflow (mentor/instructor/moderator/admin approval) in `backend/src/modules/gamification-badge/verified-badge.service.ts` (FR-025)
- [ ] T059 [US4] Community-badge no-raw-count enforcement — requires helpfulness/quality signals, not post volume in `backend/src/modules/gamification-badge/badge-rules.service.ts` (FR-028)
- [ ] T060 [US4] Business-milestone badge verification plus sensitive-financial-amount privacy-by-default in `backend/src/modules/gamification-badge/milestone-badge.service.ts` (FR-029)
- [ ] T061 [US4] Consistency badges including the mandatory "Comeback" badge in `backend/src/modules/gamification-badge/consistency-badge.service.ts` (FR-030)
- [ ] T062 [P] [US4] Badge showcase (featured/all/locked/recently-earned, configurable featured-count) and badge detail screen in `web/src/app/(member)/gamification/badges/page.tsx` (FR-032, FR-033)
- [ ] T063 [P] [US4] Achievement system, distinct from and more granular than badges in `backend/src/modules/gamification-badge/achievement.service.ts` (FR-035)
- [ ] T064 [US4] Integration test: automatic award, progressive tier crossing, hidden-criteria restriction, revocation with appeal in `backend/tests/integration/us4-badges.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: The primary visible-recognition layer is independently functional.

---

## Phase 7: User Story 5 — Join a Challenge and Get Verified, Scored Progress (P2)

**Independent Test**: Join an active challenge, submit evidence for a verification-required task, have a reviewer approve/reject it, and confirm the dashboard's score/rank/progress updates correctly.

- [ ] T065 [US5] Challenge join flow (eligibility check, registration-window check, capacity check, rule agreement capture, team selection where applicable, task initialization, dashboard open) in `backend/src/modules/gamification-challenge/challenge-join.service.ts` (FR-054, acceptance scenario 1)
- [ ] T066 [US5] Verified-submission review gating — score updates only after reviewer approval in `backend/src/modules/gamification-challenge/submission-review.service.ts` (FR-058, acceptance scenario 2)
- [ ] T067 [US5] Weighted-task scoring model with a deterministic tiebreaker sequence, defined before the challenge starts in `backend/src/modules/gamification-challenge/scoring.service.ts` (FR-059, acceptance scenario 3)
- [ ] T068 [US5] Participant disqualification (fraud/duplicate evidence) removing them from leaderboard/winner calculation with reason and audit trail in `backend/src/modules/gamification-challenge/disqualification.service.ts` (FR-065, acceptance scenario 4)
- [ ] T069 [US5] Challenge status model (Draft → Review → Scheduled → Registration open/closed → Active → Verification → Completed, with Cancelled/Archived terminal states) in `backend/src/modules/gamification-challenge/challenge-status.service.ts` (FR-051)
- [ ] T070 [P] [US5] Challenge discovery (sections, filters) and detail screen in `web/src/app/(member)/gamification/challenges/{page.tsx,[challengeId]/page.tsx}` (FR-052, FR-053)
- [ ] T071 [US5] Challenge task types and submission content types/states in `backend/src/modules/gamification-challenge/challenge-task.service.ts` (FR-055, FR-057)
- [ ] T072 [US5] Challenge scoring models and winner categories, with mandatory legal/official-rules review before any random-prize-draw challenge can publish in `backend/src/modules/gamification-challenge/scoring.service.ts` (FR-059, FR-060, edge case: random-draw compliance)
- [ ] T073 [US5] Team Challenges (team fields/rules) including defined behavior for member churn mid-challenge in `backend/src/modules/gamification-challenge/team-challenge.service.ts` (FR-061, edge case)
- [ ] T074 [P] [US5] Community-Wide Challenges (shared target, individual-vs-collective contribution tracking) in `backend/src/modules/gamification-challenge/community-challenge.service.ts` (FR-062)
- [ ] T075 [US5] Challenge-specific discussion, governed by `005`'s community permission model in `backend/src/modules/gamification-challenge/challenge-discussion.service.ts` (FR-063)
- [ ] T076 [US5] Admin challenge-builder wizard (step sequence, mandatory autosave, preview) in `web/src/app/(admin)/gamification/challenges/builder/[step]/page.tsx` (FR-064)
- [ ] T077 [US5] Admin challenge-participant management table and actions in `web/src/app/(admin)/gamification/challenges/[challengeId]/participants/page.tsx` (FR-065)
- [ ] T078 [US5] Integration test: join flow, verified-submission score-gating, tiebreaker application, disqualification removal in `backend/tests/integration/us5-challenges.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: The most complex sub-system in this volume is independently functional.

---

## Phase 8: User Story 6 — View a Fair, Segmented, Anti-Abuse Leaderboard (P2)

**Independent Test**: Seed several test users with differing scores (including one fraud-flagged) into a scoped leaderboard; confirm server-side ranks, fraud exclusion, deterministic tiebreakers, and privacy-preference honoring.

- [ ] T079 [US6] Weekly/Monthly leaderboard period reset with historical snapshot retention in `backend/src/modules/gamification-leaderboard/period-reset.service.ts` (FR-067, acceptance scenario 1)
- [ ] T080 [US6] Fraud-flagged score temporary exclusion from ranking, wired to `gamification-fraud`, in `backend/src/modules/gamification-leaderboard/fraud-exclusion.service.ts` (FR-069, FR-073, acceptance scenario 2)
- [ ] T081 [US6] Leaderboard privacy display (anonymous member code option) in `backend/src/modules/gamification-leaderboard/leaderboard-privacy.service.ts` (FR-070, acceptance scenario 3)
- [ ] T082 [US6] Deterministic tiebreaker sequence (higher verified score, more high-value activities, earlier completion, fewer penalties) in `backend/src/modules/gamification-leaderboard/tiebreaker.service.ts` (FR-069, acceptance scenario 4)
- [ ] T083 [US6] Leaderboard types and segmentation filters, with no mandatory Global board in `backend/src/modules/gamification-leaderboard/leaderboard-config.service.ts` (FR-066, FR-068)
- [ ] T084 [P] [US6] Leaderboard row rendering (rank/rank-change/avatar/name/level/score/badge, sticky own-row) in `web/src/components/gamification/leaderboard-row.tsx` (FR-071)
- [ ] T085 [US6] Unfair-comparison avoidance with a transparently documented normalized-scoring formula in `backend/src/modules/gamification-leaderboard/fair-comparison.service.ts` (FR-072)
- [ ] T086 [US6] Leaderboard-abuse detection (multi-account, bot, device-farm) with temporary exclusion, review-queue routing, and post-review restoration in `backend/src/modules/gamification-leaderboard/leaderboard-abuse.service.ts` (FR-073, edge case: multi-account gaming mid-period)
- [ ] T087 [US6] Integration test: period-reset with snapshot, fraud-score exclusion, privacy display, deterministic tiebreaker in `backend/tests/integration/us6-leaderboards.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: A highly visible, fairness-critical surface is independently functional.

---

## Phase 9: User Story 7 — Admin Previews a New Point Rule via Point Economy Simulation Before Publishing (P2)

**Independent Test**: Draft a new point rule, run the simulation, confirm it returns issuance/liability/affected-user projections before publish is allowed, and confirm a high-impact rule cannot go live without completing approval.

- [ ] T088 [US7] Point Economy Simulation engine (estimated daily/monthly issuance, expected liability, affected users, abuse risk, reward affordability, comparison against the current rule) in `backend/src/modules/gamification-admin/point-simulation.service.ts` (FR-099, acceptance scenario 1)
- [ ] T089 [US7] High-impact rule-change approval-workflow gate, using T002's resolved threshold in `backend/src/modules/gamification-admin/rule-approval.service.ts` (FR-099, acceptance scenario 2)
- [ ] T090 [US7] Published point-rule edit versioning — never a silent overwrite — in `backend/src/modules/gamification-ledger/point-rule.service.ts` (FR-098, acceptance scenario 3)
- [ ] T091 [US7] Rule effective-end-date auto-stop with no manual intervention required in `backend/src/modules/gamification-ledger/point-rule.service.ts` (FR-012, acceptance scenario 4)
- [ ] T092 [US7] Level threshold-change impact-simulation/migration-plan requirement before activation in `backend/src/modules/gamification-level/level-migration.service.ts` (FR-101, edge case: existing-member impact)
- [ ] T093 [US7] Manual point-adjustment workflow (target user, amount, reason category, note, approval-above-threshold, audit entry, notification policy), expressed only as a ledger transaction — never a direct balance edit — in `backend/src/modules/gamification-admin/manual-adjustment.service.ts` (FR-100)
- [ ] T094 [P] [US7] Gamification admin module navigation (Dashboard, Point Rules, Levels, Badges, Missions, Challenges, Leaderboards, Rewards, Redemptions, Recognition, Fraud Review, Adjustments, Reports, Settings) in `web/src/app/(admin)/gamification/layout.tsx` (FR-096)
- [ ] T095 [P] [US7] Gamification admin dashboard reporting (active participants, XP/points issued/redeemed, outstanding liability, redemption rate, streak/challenge/badge stats, level distribution, fraud flags, expiring points, top-earning actions, retention) in `web/src/app/(admin)/gamification/dashboard/page.tsx` (FR-097)
- [ ] T096 [US7] Integration test: simulation-required-before-publish, high-impact-approval-gate, rule-edit-versioning, auto-end-date-stop in `backend/tests/integration/us7-point-economy-simulation.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: The governance capability that makes the entire point economy operable at scale without financial risk is independently functional.

---

## Phase 10: User Story 8 — Fraud Detection Flags Suspicious Point Activity for Admin Review (P2)

**Independent Test**: Simulate a fraud signal for a test user; confirm the activity routes to the Fraud Review queue instead of immediate reversal/punishment; confirm a reviewer action correctly updates ledger, leaderboard exclusion, and audit log.

- [ ] T097 [US8] Fraud-signal evaluation routing to the Fraud Review queue rather than immediate reversal/punishment in `backend/src/modules/gamification-fraud/fraud-routing.service.ts` (FR-093, acceptance scenario 1)
- [ ] T098 [US8] Single-weak-signal-never-triggers-permanent-punishment rule enforcement in `backend/src/modules/gamification-fraud/fraud-evaluation.service.ts` (FR-093, acceptance scenario 2)
- [ ] T099 [US8] Reviewer action set (clear/hold/reverse/exclude/disqualify/restrict/escalate) that correctly updates the ledger, leaderboard exclusion, and audit log in `backend/src/modules/gamification-fraud/reviewer-actions.service.ts` (FR-092, acceptance scenario 3)
- [ ] T100 [US8] Fraud-penalty appeal capture (action, reason, user explanation, evidence) routed to review with eventual decision and audit record in `backend/src/modules/gamification-fraud/fraud-appeal.service.ts` (FR-095, acceptance scenario 4)
- [ ] T101 [P] [US8] Fraud Review console (queue sources, reviewer action UI) in `web/src/app/(admin)/gamification/fraud-review/page.tsx` (FR-092)
- [ ] T102 [US8] Gamification-specific fraud-signal catalog evaluation (impossible completion speed, repeated assessment across accounts, high activity within seconds, device/IP clustering, repeated media evidence, duplicate links, account-creation burst, referral loops, excessive cross-account reactions, timezone switching, API replay) in `backend/src/modules/gamification-fraud/fraud-signal-catalog.service.ts` (FR-093)
- [ ] T103 [US8] Gamification-penalty separation from general community moderation, with negative public scoring/humiliation explicitly barred as a penalty mechanism in `backend/src/modules/gamification-fraud/penalty-policy.service.ts` (FR-094)
- [ ] T104 [US8] Integration test: signal → queue not auto-punish, weak-signal-no-permanent-action, reviewer-action updates all systems, appeal capture in `backend/tests/integration/us8-fraud-detection.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: The trust layer that keeps every other gamification mechanic exploitation-resistant is independently functional.

---

## Phase 10b: Recognition (supports FR-087–FR-091; cross-cutting, no single owning story)

- [ ] T105 [P] Recognition types and nomination capture (system/mentor/instructor/group-admin/member/admin sources; popularity voting alone never determines the final decision) in `backend/src/modules/gamification-recognition/recognition.service.ts` (FR-087, FR-088)
- [ ] T106 Public Recognition Wall with explicit member consent required before publishing financial or otherwise sensitive achievements in `web/src/app/(member)/gamification/recognition/page.tsx` (FR-089)
- [ ] T107 [P] Milestone-celebration UI, respecting the user's reduced-motion preference, for level-up/course-completed/badge-earned/streak-milestone/challenge-completed/first-client/reward-redeemed events in `web/src/components/gamification/milestone-celebration.tsx` (FR-090)
- [ ] T108 Achievement sharing (community post, group post, DM, external share card with copy-verification-link), editable share text, auto-share default off in `backend/src/modules/gamification-recognition/achievement-share.service.ts` (FR-091)

**Checkpoint**: Non-redemption recognition independently functional.

---

## Phase 11: User Story 9 — Complete Daily and Weekly Missions (P3)

**Independent Test**: Generate a daily mission, complete its underlying qualifying action, confirm the mission transitions Available → In progress → Completed → Claimed with the correct reward credited; test the limited mission-replacement flow.

- [ ] T109 [US9] Daily mission generation and qualifying-action completion transition (Available → In progress → Completed → Claimed) in `backend/src/modules/gamification-mission/daily-mission.service.ts` (FR-044, FR-046, acceptance scenario 1)
- [ ] T110 [US9] Weekly mission personalization (active course, learning goal, business stage, time availability, previous behavior) in `backend/src/modules/gamification-mission/weekly-mission.service.ts` (FR-045, acceptance scenario 2)
- [ ] T111 [US9] Mission-replacement flow (max-replacements limit per T002's resolution, no reward-farming, equal-difficulty replacement, unchanged expiry, audit record) in `backend/src/modules/gamification-mission/mission-replacement.service.ts` (FR-047, acceptance scenario 3)
- [ ] T112 [US9] Mission-expiry transition with no silent carry-over of unclaimed progress in `backend/src/modules/gamification-mission/mission-expiry.service.ts` (FR-046, acceptance scenario 4)
- [ ] T113 [US9] Integration test: full mission lifecycle, personalization difference across users, replacement-limit enforcement, expiry behavior in `backend/tests/integration/us9-missions.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: All 9 user stories independently functional.

---

## Phase 12: Polish & Cross-Cutting Concerns

- [ ] T114 [P] Gamification notification wiring (points-earned through recognition-received), with digest-summarization for low-value events and immediate delivery for major achievements, plus preference controls and grouping in `backend/src/modules/gamification-admin/gamification-notifications.service.ts` (FR-103, FR-104)
- [ ] T115 [P] Member gamification dashboard (level, XP progress, TBT Point balance, streak, missions, challenges, badges, leaderboard position, rewards, achievement history), reorderable in `web/src/app/(member)/gamification/dashboard/page.tsx` (FR-105)
- [ ] T116 [P] Profile gamification section with user-controlled visibility toggles for points/streak/badges/rank/rewards — reward-point balance never displayed publicly in `web/src/components/gamification/profile-section.tsx` (FR-106)
- [ ] T117 [P] Security pass: server-authoritative calculation, signed internal events, enforced idempotency, role-based balance adjustments, immutable audit-logged ledger, client-tampering prevention (FR-107)
- [ ] T118 [P] Additional security: rate limiting, API-replay protection, reward-inventory concurrency locks, encrypted fulfillment data, admin-approval-threshold enforcement, sanitized leaderboard output (FR-108)
- [ ] T119 [P] Privacy pass: private reward-point balance/exact history, user-configurable leaderboard visibility, private business-revenue milestones, restricted shipping address, defined challenge-evidence audience, role-based admin access, non-public fraud signals, consent-gated recognition publication (FR-109)
- [ ] T120 [P] Accessibility pass: screen-reader progress-bar labels, non-color level indicators, keyboard-accessible reward catalog, reduced-motion celebrations, labeled streak calendars, accessible leaderboard table, badge alt-text, accessible countdowns, textual task-status, recoverable errors, no flashing animations, locale-formatted point values (FR-110)
- [ ] T121 [P] Localization pass: Tamil/Tanglish/English content variants for level names, badge names, mission text, challenge rules, reward terms, notifications, dates, number formatting, points-expiry communication (FR-111)
- [ ] T122 Mobile offline support: streak-activity queueing, mission-progress caching, challenge drafts, evidence-upload retry, with a pending state shown until the server confirms the final award in `mobile/lib/features/gamification/offline_queue.dart` (FR-112)
- [ ] T123 [P] Gamification analytics-event taxonomy emission (`xp_awarded` through `recognition_received`) in `backend/src/modules/gamification-admin/gamification-analytics.service.ts` (FR-113)
- [ ] T124 Gamification product-metrics tracking (active-XP-earner %, daily mission completion, weekly consistency, completion uplift, challenge join/completion, redemption rate, point liability, fulfillment success, streak retention, badge share rate, leaderboard participation, fraud rate, notification opt-out rate) in `backend/src/modules/gamification-admin/gamification-metrics.service.ts` (FR-114)
- [ ] T125 Performance pass: async point-award processing without delaying the triggering completion response, near-real-time balance updates, cached leaderboard snapshots with efficient nearby-rank queries, event-driven badge evaluation, scheduled-and-event-based streak calculation, incremental challenge-progress aggregation, reward-stock concurrency protection, partial-loading dashboards, paginated ledger queries (FR-115)
- [ ] T126 Loading-skeleton and empty-state definitions across all gamification screens, with no fake zero values shown during load (FR-116)
- [ ] T127 Run `quickstart.md` validation end-to-end across all 9 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `001`–`005`'s prior work, especially `004`/`005`'s event-emission points this feature consumes.
- **P1 stories**: US1 (XP/Level) is the foundation every other mechanic reads from and should ship first; US2 (points/rewards) and US3 (streaks) both depend on US1's ledger/award-orchestrator infrastructure (T016) but not on each other — build in parallel once US1 is stable.
- **P2 stories (US4–US8)**: US4 (badges) depends on Foundational only; US5 (challenges) is the most complex sub-system and depends on US1's XP infrastructure for scoring; US6 (leaderboards) depends on US1/US2/US3's score data already existing; US7 (Point Economy Simulation) and US8 (fraud detection) both depend on Foundational's ledger/rule entities and can run in parallel with each other and with US4–US6.
- **Phase 10b (Recognition)** depends on Foundational + at least one of US1/US3/US4/US5 (needs achievements to recognize) — may run in parallel with the P2 stories.
- **P3 story (US9)** depends on Foundational's point-award infrastructure (T016) — missions are a lighter engagement layer on top of it.
- **Polish (Phase 12)** depends on all desired stories being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational → US1 (XP/Level) → **STOP and VALIDATE** the server-authoritative award engine → US2 (points/rewards) + US3 (streaks) in parallel → **STOP and VALIDATE** the core economy is trustworthy end-to-end → then US4 (badges) → US5 (challenges) → US6 (leaderboards) → US7 (economy simulation, recommend early among P2s since it gates every future rule change) → US8 (fraud detection) → Phase 10b (recognition) → US9 (missions, P3) → Polish.
