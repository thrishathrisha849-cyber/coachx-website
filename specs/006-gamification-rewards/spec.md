# Feature Specification: Gamification: Points, Levels, Badges, Streaks, Leaderboards & Rewards

**Feature Branch**: `006-gamification-rewards`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 06 — Gamification, TBT Points, Levels, Badges, Streaks, Leaderboards, Challenges, Rewards and Recognition System (`document 1/Document 1 (5).md`)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Earn XP and Progress Through Levels (Priority: P1)

A member completes meaningful platform actions (finishing a lesson, passing a quiz, getting an assignment approved) and earns non-redeemable Experience Points (XP). As cumulative XP crosses defined thresholds, the member's Level rises, unlocking level benefits and a visible celebration, without ever trusting the client to grant the level itself.

**Why this priority**: XP and Level are the foundation of the entire gamification system — every other mechanic (badges, streaks, challenges, leaderboards) either feeds into or reads from XP/Level state. Without a correct, server-authoritative XP/Level engine, nothing else in this volume can be trusted.

**Independent Test**: Can be fully tested by triggering a qualifying learning event (e.g., a completion webhook) for a test user, verifying an XP ledger entry is created, the level engine recalculates level eligibility server-side, and the level-progress widget reflects the new level and next-level XP requirement — independent of badges, streaks, or challenges.

**Acceptance Scenarios**:

1. **Given** a user has 0 XP and completes their first lesson, **When** the lesson-completion event reaches the backend, **Then** the system creates an XP ledger transaction, updates the derived XP balance, and evaluates whether a level threshold was crossed.
2. **Given** a user's cumulative XP crosses the Level 2 minimum-XP threshold, **When** the level-progression evaluation runs, **Then** the system updates the level in an atomic transaction, unlocks level benefits, shows a celebration, sends a notification, updates the profile badge, and records an analytics event.
3. **Given** a user's XP was legitimately earned and is later found to include fraudulent activity, **When** an admin removes the fraudulent XP, **Then** the system may downgrade the level, and must notify the user, log the reason, record an audit entry, recalculate benefits, and offer an appeal option where applicable.
4. **Given** a client attempts to submit a level or XP value directly (bypassing the qualifying event), **When** the request reaches the backend, **Then** the system rejects the client-asserted value and computes level/XP only from server-side ledger and rule evaluation.

---

### User Story 2 - Earn and Redeem TBT Reward Points Against the Reward Catalog (Priority: P1)

A member earns redeemable TBT Reward Points (separate from XP) through qualifying actions, views their wallet balance, browses the reward catalog, and redeems points for a digital or physical reward through a flow that reserves points and stock, confirms fulfillment, and handles failure/refund paths safely.

**Why this priority**: Reward Points and their redemption are the core "value exchange" that makes gamification meaningful beyond vanity numbers — without a trustworthy, ledger-based, race-condition-safe redemption flow, the point economy cannot be operated responsibly (Constitution Article V: Ledger-Based Internal Economies).

**Independent Test**: Can be fully tested by crediting a test user's Reward Point ledger via a qualifying action, then redeeming an in-stock catalog reward and confirming the redemption transitions through Initiated → Points reserved → Confirmed → Fulfilled, with the ledger and reward stock counts both correctly decremented — independent of levels, badges, or challenges.

**Acceptance Scenarios**:

1. **Given** a user has 100 available TBT Points and a reward costs 80 points, **When** the user selects "Redeem," **Then** the system checks eligibility, stock, and balance, reserves the points and stock, creates a redemption transaction, and initiates fulfillment.
2. **Given** a reward has only 1 unit of stock left and two users attempt to redeem it simultaneously, **When** both redemption requests are processed, **Then** only one redemption succeeds and the other is rejected with an out-of-stock error, with no overselling.
3. **Given** a confirmed redemption's fulfillment subsequently fails, **When** the failure is recorded, **Then** the system reverses the point reservation, refunds the points to the user's available balance, and references the original redemption transaction.
4. **Given** a user's reward-point lots have differing expiry dates, **When** a redemption debits points, **Then** the system debits from the oldest-expiring lot first.

---

### User Story 3 - Maintain a Daily Streak With Freeze and Recovery (Priority: P1)

A member performs a qualifying meaningful action each day and builds a consecutive-day streak, calculated in the member's own timezone using server timestamps. The member can use an earned Streak Freeze to protect an accidental miss, or use a limited Streak Recovery after a break, without shame-based messaging.

**Why this priority**: Streaks are the platform's primary consistency-building mechanic (Constitution Article IX: Action Before Consumption) and are explicitly timezone- and abuse-sensitive; getting the day-boundary, freeze, and recovery logic right is required before the feature can be trusted at scale.

**Independent Test**: Can be fully tested by performing a qualifying action on consecutive server-recognized days for a test user in a fixed timezone, confirming the streak counter increments daily, then skipping a day and confirming the streak breaks (or is protected by an available Freeze) without demotivating copy, and confirming Recovery is offered within its window — independent of badges, challenges, or leaderboards.

**Acceptance Scenarios**:

1. **Given** a user in timezone IST completes a qualifying action at 11:55 PM local time, **When** the streak-day calculation runs, **Then** the action counts toward that user's local calendar day, not UTC's day.
2. **Given** a user has an active streak and one available Streak Freeze, **When** the user misses a qualifying action for exactly one day, **Then** the system automatically or manually applies the freeze to cover that single day and the streak is not marked Broken.
3. **Given** a user's streak breaks because no qualifying action occurred and no freeze was available, **When** the streak-break state is shown, **Then** the system displays encouraging, non-shaming messaging and keeps the user's previous achievements visible.
4. **Given** a user's streak broke within the eligible recovery window, **When** the user completes the required comeback task within that window, **Then** the system marks the streak Recovered per the configured recovery rules (limited monthly use, optional point cost).

---

### User Story 4 - Earn Badges Including Hidden and Progressive Badges (Priority: P2)

A member earns badges for specific achievements — some automatic, some requiring mentor/instructor/admin verification, some progressive (Bronze → Silver → Gold → Platinum), and some Hidden (criteria undisclosed until unlocked) — and can showcase featured badges on their profile.

**Why this priority**: Badges are the primary visible recognition layer referenced throughout the rest of the platform (profile, recognition wall, challenges) and have the most distinct sub-behaviors (verification, revocation, hidden criteria) requiring dedicated testing before other features can safely reference them.

**Independent Test**: Can be fully tested by triggering a badge-qualifying event for a test user and confirming an Automatic badge is awarded without human review, then separately testing a Verified badge that stays unissued until a reviewer approves it, and a Hidden badge whose criteria are not shown until unlocked — independent of streaks, challenges, or leaderboards.

**Acceptance Scenarios**:

1. **Given** a user meets an Automatic badge's system rule, **When** the qualifying event is evaluated, **Then** the system checks existing ownership, awards the badge, updates the profile inventory, and sends a celebration notification without auto-posting to the community without consent.
2. **Given** a badge is configured as Progressive with Bronze/Silver/Gold/Platinum tiers, **When** a user crosses each tier's threshold, **Then** the system awards the corresponding tier and shows tier-specific progress.
3. **Given** a badge is configured as Hidden, **When** a user who has not yet unlocked it views the badge detail screen, **Then** the system may show a restricted description instead of the full criteria.
4. **Given** a badge was awarded and the underlying eligibility is later found fraudulent, **When** an admin revokes the badge, **Then** the system records the authorized action, reason, and audit entry, notifies the user, updates the public profile, and offers appeal eligibility where applicable.

---

### User Story 5 - Join a Challenge and Get Verified, Scored Progress (Priority: P2)

A member discovers an active challenge, joins it (individually or as part of a team), completes defined tasks with required evidence, has submissions verified (automatically or by a reviewer), and sees their score and rank update as the challenge progresses toward defined winner categories.

**Why this priority**: Challenges are the platform's structured, time-bound engagement mechanic that ties together tasks, verification, scoring, teams, and rewards — the single most complex sub-system in this volume, and a distinct value slice from ongoing XP/streak mechanics.

**Independent Test**: Can be fully tested by joining an active challenge as a test user, submitting evidence for a task requiring verification, having a reviewer approve or reject it, and confirming the challenge dashboard's score/rank/progress updates correctly — independent of leaderboards, badges, or rewards outside the challenge.

**Acceptance Scenarios**:

1. **Given** an open challenge with available capacity, **When** an eligible user requests to join, **Then** the system checks eligibility, the registration window, and capacity, captures rule agreement, initializes tasks, and opens the challenge dashboard.
2. **Given** a challenge task requires image-proof evidence and mentor review, **When** the user submits their proof, **Then** the submission enters "Under review" state and only updates the user's score after a reviewer approves it.
3. **Given** a challenge uses a weighted-task scoring model with a defined tiebreaker sequence, **When** two participants finish with equal completion counts, **Then** the system applies the pre-defined tiebreaker rules to determine relative rank.
4. **Given** a participant is found to have submitted duplicate/fraudulent evidence, **When** an admin disqualifies the participant, **Then** the system removes them from the leaderboard/winner calculation and records the disqualification with reason and audit trail.

---

### User Story 6 - View a Fair, Segmented, Anti-Abuse Leaderboard (Priority: P2)

A member views a leaderboard relevant to them (e.g., their cohort, group, or a weekly XP board) with fraud-excluded, server-calculated ranks, deterministic tiebreakers, and privacy controls over how their identity appears — without being unfairly compared to dissimilar cohorts.

**Why this priority**: Leaderboards are highly visible and can either motivate or demoralize members depending on fairness and anti-abuse correctness; they depend on XP/points/streak data already validated by higher-priority stories, making this a natural next slice.

**Independent Test**: Can be fully tested by seeding several test users with differing scores (including one with a fraud-flagged score) into a scoped leaderboard (e.g., a specific cohort, weekly period) and confirming ranks are computed server-side, the fraud-flagged score is excluded, ties resolve deterministically, and a user's privacy display preference is honored — independent of challenge or badge flows.

**Acceptance Scenarios**:

1. **Given** a weekly XP leaderboard scoped to a specific cohort, **When** the ranking period resets, **Then** the system snapshots the previous period's final ranks for history and starts a fresh ranking period.
2. **Given** a user's recent point-earning activity was flagged as suspicious, **When** the leaderboard is calculated, **Then** that user's flagged score is temporarily excluded from ranking until cleared by review.
3. **Given** a user sets their leaderboard privacy preference to "anonymous member code," **When** other users view the leaderboard, **Then** the system displays the anonymous code instead of the user's real name.
4. **Given** two users have identical scores, **When** ranks are computed, **Then** the system applies the deterministic tiebreaker sequence (higher verified score, more high-value activities, earlier completion, fewer penalties) rather than an arbitrary order.

---

### User Story 7 - Admin Previews a New Point Rule via Point Economy Simulation Before Publishing (Priority: P2)

Before publishing a new or changed point-earning rule, an authorized admin runs a Point Economy Simulation that previews estimated daily/monthly issuance, expected point liability, affected users, abuse risk, and reward affordability compared to the current rule, and — for high-impact changes — routes the change through an approval workflow.

**Why this priority**: Uncontrolled point-rule changes directly threaten the sustainability of the entire reward economy (unbounded liability, reward insolvency); this admin governance capability is what makes every other earning/redemption story operable at scale without financial risk.

**Independent Test**: Can be fully tested by drafting a new point rule in the admin panel, running the simulation, confirming it returns issuance/liability/affected-user projections before publish is allowed, and confirming a rule flagged as high-impact cannot go live without completing its approval workflow — independent of any specific reward catalog item or user-facing flow.

**Acceptance Scenarios**:

1. **Given** an admin has drafted a new point-earning rule, **When** the admin requests a simulation before publishing, **Then** the system returns estimated daily issuance, estimated monthly issuance, expected liability, affected users, abuse risk, and reward affordability compared with the current rule.
2. **Given** a simulation flags a rule change as high-impact, **When** the admin attempts to publish, **Then** the system requires the configured approval workflow to complete before the rule takes effect.
3. **Given** a point rule is already published and live, **When** an admin edits it, **Then** the system versions the edit rather than silently overwriting the prior configuration, preserving history for audit.
4. **Given** a point rule reaches its configured effective-end date, **When** that date passes, **Then** the system stops awarding points under that rule without manual intervention.

---

### User Story 8 - Fraud Detection Flags Suspicious Point Activity for Admin Review (Priority: P2)

The system continuously evaluates gamification activity for fraud signals (impossible completion speed, device/IP clustering, duplicate evidence, timezone switching, API replay, etc.), routes suspicious activity to a Fraud Review console rather than auto-punishing on a single weak signal, and lets a reviewer clear, hold, reverse, exclude, disqualify, restrict, or escalate.

**Why this priority**: Every earning, streak, badge, challenge, and leaderboard mechanic is exploitable; a working fraud-detection-and-review loop is what keeps the whole point economy and leaderboard trustworthy, and depends on the earlier stories' ledgers/events already existing.

**Independent Test**: Can be fully tested by simulating a fraud signal (e.g., impossible completion speed on a lesson) for a test user, confirming the activity is routed to the Fraud Review queue instead of immediately reversed or punished, and confirming a reviewer action (e.g., "reverse points") correctly updates the ledger, leaderboard exclusion, and audit log — independent of any specific reward or challenge.

**Acceptance Scenarios**:

1. **Given** a user completes a course assessment in an implausibly short time, **When** the fraud-signal evaluation runs, **Then** the event is flagged and routed to the Fraud Review queue rather than immediately and permanently punished.
2. **Given** only one weak fraud signal is present for a user, **When** the fraud evaluation completes, **Then** the system does not apply a permanent punishment based on that single weak signal alone.
3. **Given** a reviewer examines a flagged case and confirms fraud, **When** the reviewer selects "reverse points" and "exclude leaderboard," **Then** the system reverses the relevant ledger transactions (referencing the originals), excludes the user's flagged score from leaderboards, and records the action in the audit log.
4. **Given** a user disagrees with a fraud-based penalty, **When** the user submits an appeal, **Then** the system captures the action, reason, user explanation, evidence, and routes it to a review status with an eventual decision and audit record.

---

### User Story 9 - Complete Daily and Weekly Missions (Priority: P3)

A member sees personalized daily and weekly missions (short, meaningful actions), tracks mission progress through defined states, claims completed-mission rewards, and — if a mission is irrelevant to them — can use a limited replacement option.

**Why this priority**: Missions are a lighter-weight engagement layer built on top of the same point-earning and eligibility infrastructure already required by higher-priority stories; valuable for retention but not required for the core economy to function.

**Independent Test**: Can be fully tested by generating a daily mission for a test user, completing its underlying qualifying action, confirming the mission transitions Available → In progress → Completed → Claimed with the correct reward credited, and separately testing the limited mission-replacement flow — independent of challenges or badges.

**Acceptance Scenarios**:

1. **Given** a user is shown a daily mission ("complete one lesson"), **When** the user completes a qualifying lesson, **Then** the mission transitions to Completed and, per its configuration, either auto-awards or awaits claim for its reward.
2. **Given** a weekly mission is personalized using the user's active course and learning goal, **When** missions are generated for that user, **Then** the mission set differs from a user with a different active course/goal.
3. **Given** a user finds an assigned mission irrelevant, **When** the user requests a replacement within the allowed limit, **Then** the system provides a new mission of equal difficulty with an unchanged expiry and logs the replacement for audit.
4. **Given** a mission's expiry passes without completion, **When** the expiry is reached, **Then** the mission transitions to Expired and does not silently carry over unclaimed progress.

---

### Edge Cases

- **Duplicate event retries**: A lesson-completion, quiz-attempt, assignment-approval, or business-milestone event is redelivered or retried by an upstream system (e.g., webhook retry). The idempotency key + unique-transaction constraint (§12 of source) must ensure no duplicate XP/Reward Point award occurs, even under concurrent retries.
- **Negative reward-point balance**: A user redeems points, and the underlying earning transaction is later reversed (e.g., course completion invalidated), pushing their available balance negative. The system must apply a defined policy (deduct from future earnings, lock redemption, admin review, cancel reward) and must never silently request direct cash payment absent an approved legal/financial policy (§15).
- **Streak timezone edge cases**: A user changes their device/account timezone shortly before or after a day boundary, or travels across timezones — the system must apply timezone-change abuse protection so a user cannot "manufacture" an extra qualifying day, while a legitimately traveling user is not unfairly broken (§39, §107 "timezone switching" fraud signal).
- **Reward stock race conditions**: Two or more users attempt to redeem the last unit(s) of a limited-stock reward simultaneously; the system must lock/reserve inventory atomically so exactly the available stock is granted and no overselling occurs (§84, §120).
- **Pending points later rejected**: An assignment is submitted and pending points are shown, but the instructor later rejects the assignment (or the business-milestone verification fails); the pending points must transition to Rejected and never be added to the available balance, and any UI that showed them as "earned" must reconcile (§13, §19).
- **Points expiring mid-redemption**: A user's oldest reward-point lot expires between browsing a reward and completing the redemption; the redemption flow must re-validate available balance/expiry at commit time, not only at browse time (§16, §79).
- **Level threshold changes affecting existing members**: Admin edits a level's minimum-XP threshold after users have already progressed; the change requires an impact-simulation/migration plan so existing members' levels are not silently and confusingly recalculated (§100).
- **Badge revoked after auto-share**: A badge is revoked for fraud after the user has already shared it externally or in a community post; the revocation flow must still update the public profile and notify the user, even though the external share may persist outside platform control (§33, §36, §90).
- **Team challenge member churn**: A team-challenge member goes inactive, leaves, or is replaced mid-challenge; team-score calculation and disqualification handling must have a defined behavior for the remaining team rather than leaving team scoring undefined (§64).
- **Multi-account / device-farm leaderboard gaming**: Suspicious account linking or device/IP clustering is detected for a top-ranked leaderboard user mid-period; the system must be able to temporarily exclude the suspicious score from the live leaderboard and restore it (or not) after review, without corrupting the historical snapshot already shown to other users (§74, §107).
- **Streak freeze cannot retroactively cover multiple missed days**: A user who has been inactive for several days attempts to apply a single Streak Freeze to cover the whole gap; the system must enforce that a freeze cannot cover multiple unconfigured missed days (§43).
- **Random prize-draw compliance**: A challenge configured with a random prize draw for winner selection must undergo applicable-law and official-rules review before the draw is used; the system must be able to block/hold a random-draw challenge from publishing without that review recorded (§63).

## Requirements *(mandatory)*

### XP & Level Requirements

- **FR-001**: System MUST maintain a non-redeemable Experience Points (XP) value per user, used only for level calculation, learning progression, personal achievement, and profile status display, kept separate from redeemable Reward Points (TBT Points).
- **FR-002**: XP MUST have no cash value, MUST NOT be transferable or redeemable for rewards, and MUST NOT normally expire; XP MAY be reversed when awarded for fraudulent or invalid activity.
- **FR-003**: System MUST define a Level structure of progressively (non-linearly) increasing XP thresholds, with per-level fields: level number, name, description, minimum XP, maximum XP, icon, visual style, benefits, unlocks, celebration message, and status. [NEEDS CLARIFICATION: exact level count, names, and XP thresholds are stated as illustrative examples only ("final naming... change pannalaam", "launch before real behavior simulation required") — final baseline values are pending brand review and behavioral simulation before launch.]
- **FR-004**: System MUST launch with a single unified member level; category-specific sub-levels (learning progression, community contribution, business milestone) are explicitly deferred to a future phase.
- **FR-005**: When a user's cumulative XP crosses a level threshold, System MUST: calculate level eligibility, check account restrictions, update the level in an atomic transaction, unlock benefits, display a celebration, send a notification, update the profile badge, and record an analytics event.
- **FR-006**: System MUST support configurable level benefits (profile frame, special badge, additional saved collections, challenge eligibility, community group access, event priority, reward multiplier campaign, mentor session application, beta feature access, recognition eligibility), and MUST NOT gate core learning or safety features behind level.
- **FR-007**: System MUST NOT downgrade a user's level due to ordinary (non-fraudulent) XP changes. Level downgrade is permitted only for fraudulent-XP removal, major administrative correction, or account-merge correction, and every downgrade MUST include user notification, stated reason, an audit log entry, benefit recalculation, and an appeal option where applicable.
- **FR-008**: System MUST display a level-progress widget (current level, level icon, current XP, XP needed for next level, progress bar, next unlock, view-details action) whose progress values are computed entirely by the backend.

### Points Ledger, Earning & Award Process Requirements

- **FR-009**: System MUST implement point balances as separate, append-only, immutable ledgers — at minimum: Experience ledger, Reward Points ledger, Adjustment ledger, Redemption ledger, Expiry ledger, and Reversal ledger — with every transaction stored as an immutable record.
- **FR-010**: Current point balance MUST be calculated from ledger transactions (or a safely-cached aggregation derived from them), and MUST NOT be a directly-writable stored field.
- **FR-011**: System MUST support configurable point-earning action categories: Learning Actions, Community Actions, Business Actions, Consistency Actions, and Event Actions, with business-milestone awards requiring verification where configured, and event-registration points optional and lower-value than verified event-attendance points.
- **FR-012**: Every point-earning rule MUST be admin-configurable with fields: rule ID, rule name, action event, description, XP amount, reward-point amount, minimum requirement, maximum awards per day, maximum awards per week, maximum lifetime awards, cooldown, user eligibility, membership eligibility, verification mode, effective start, effective end, status, version, created-by, and approved-by.
- **FR-013**: On each qualifying event, System MUST execute the point-award process in order: verify event authenticity, check user eligibility, check rule status/effective period, check for duplicate events, check daily/weekly/lifetime caps, evaluate fraud signals, create an immediate-or-pending transaction, update balance, evaluate level/badge/challenge progress, notify the user, and record an analytics event.
- **FR-014**: System MUST require a source event ID, rule ID, user ID, and idempotency key on every point-award request, and MUST enforce a unique-transaction constraint at the backend so the same qualifying event can never award points more than once (see Constitution Article I: Server-Authoritative State).
- **FR-015**: System MUST support a "pending" point status — for actions such as an assignment under review, business-milestone verification, community contribution under moderation, purchase-linked reward, unfinalized event attendance, or referral eligibility — with lifecycle Pending → Approved / Rejected / Expired / Reversed, and MUST show the user's pending balance separately from their available balance.
- **FR-016**: System MUST support point reversal for invalidated course completion, reversed assignment approval, duplicate award, fraud, refund, cancelled event, deleted qualifying content, moderator decision, or admin correction. Every reversal MUST reference the original transaction, and ledger history MUST NOT be deleted.
- **FR-017**: System MUST allow a user's reward-point balance to go negative when a redemption's underlying earning is later reversed, and MUST support policy responses of: deducting from future earnings, temporarily locking redemption, routing to admin review, or cancelling the reward where possible. The user MUST always be shown a clear explanation of the negative balance. [NEEDS CLARIFICATION: direct cash payment recovery for a negative balance is explicitly stated as prohibited "unless legal policy established" — no such policy currently exists in source, §15.]
- **FR-018**: Reward Points MAY be configured with no expiry, a fixed number of months after earning, end-of-year expiry, membership-inactivity-based expiry, or campaign-specific expiry; System MUST surface expiring-soon balances with 30-day and 7-day reminders, track expiry at the individual transaction (lot) level, and redeem oldest-expiring points first. [NEEDS CLARIFICATION: which expiry policy is the platform default is not specified — source lists options without selecting one, §16.]
- **FR-019**: System MUST provide a member points-wallet screen showing available TBT Points, pending points, expiring points, lifetime earned, lifetime redeemed, current XP, current level, next-level progress, recent transactions, an "earn points" action, and a "rewards" action, with transactions filterable by Earned/Pending/Redeemed/Reversed/Expired/Adjusted.
- **FR-020**: Each point-transaction record MUST display action title, point amount, XP-or-TBT-Point type, date, status, source, expiry (if applicable), and details.
- **FR-021**: System MUST support per-action-per-day, per-action-per-week, category, total-daily-reward-point, campaign, and user-lifetime point caps, with an exception path for high-value verified actions.
- **FR-022**: System MUST support diminishing returns for repeated low-value actions (e.g., reduced value after the first occurrence, capped after a threshold), and MUST clearly communicate these rules to users.
- **FR-023**: Detailed referral-reward rules are governed by the membership/growth module (Volume 09); this feature MUST still enforce baseline referral safeguards for any referral points it disburses: verified referred user, meaningful activation, a waiting period, self-referral detection, device/payment duplication checks, and reversal on refund or fraud. Signup alone MUST NOT qualify for a high-value referral reward.

### Badge Requirements

- **FR-024**: System MUST support Badges representing a specific achievement, role, status, or contribution, categorized as: Learning, Skill, Community, Consistency, Business milestone, Event, Challenge, Membership, Verified status, Staff-assigned recognition, and Limited edition.
- **FR-025**: System MUST support seven badge types: Automatic (auto-awarded when a system rule is met), Verified (requires mentor/instructor/moderator/admin review), Role (instructor/mentor/moderator/organization-admin), Time-Limited (active only during a specific period), Progressive (Bronze/Silver/Gold/Platinum stages), Hidden (criteria hidden or partially hidden until unlocked), and Revocable (removable when eligibility is lost).
- **FR-026**: Every badge MUST be defined with: badge ID, name, slug, description, category, icon, active icon, locked icon, tier, rarity, criteria type, criteria configuration, verification requirement, issue limit, start date, end date, expiry, revocable flag, display priority, and status.
- **FR-027**: System MUST support badges scoped globally or to a specific course.
- **FR-028**: System MUST NOT award high-value community badges for raw post count alone; community badges MUST require helpfulness or quality signals.
- **FR-029**: Business-milestone badges MUST support configurable verification requirements, and sensitive financial amounts tied to a business-milestone badge MUST be hidden from public display by default.
- **FR-030**: Consistency badges (e.g., 3-Day / 7-Day / 30-Day / 100-Day streak, Weekly Winner, Monthly Focus) MUST include a "Comeback" badge that encourages re-engagement after a streak break, using non-shaming messaging.
- **FR-031**: On a qualifying event, System MUST run the badge-earning flow: evaluate the badge rule, check existing ownership, check the verification requirement, create the badge-award record, update the profile inventory, send a celebration notification, and optionally offer a share prompt; System MUST NOT auto-create a public community post without explicit user consent.
- **FR-032**: System MUST provide a badge showcase on the profile (featured badges, all badges, locked badges, recently earned, badge category, badge detail, earned date, verification details), and MUST let the user configure a maximum featured-badge count.
- **FR-033**: System MUST provide a badge detail screen (artwork, name, description, criteria, earned status, earned date, progress, rarity, related challenge/course, share action); for Hidden-criteria badges, the description MAY be restricted until unlocked.
- **FR-034**: System MUST support badge revocation for fraud, incorrect issuance, lost eligibility, ended role, challenge disqualification, or content violation. Every revocation MUST record an authorized action, reason, and audit entry, notify the user, update the public profile, and offer appeal eligibility where applicable.
- **FR-035**: System MUST support an Achievement system distinct from badges, tracking title, description, progress, milestone stages, completion date, reward, related evidence, and a share option (e.g., "Complete first learning path," "Submit 10 assignments," "Help 25 members," "Attend 5 live workshops," "Publish first business offer").

### Streak Requirements

- **FR-036**: System MUST track a Streak as consecutive qualifying days on which the user completes an admin-configured meaningful activity; app-open alone MUST NOT qualify a streak day.
- **FR-037**: Streak day boundaries MUST be calculated using the user's timezone with server timestamps as the source of truth. System MUST implement timezone-change abuse protection, a defined day start/end, a grace period, offline-activity sync, and duplicate-activity prevention.
- **FR-038**: System MUST support configurable daily-streak qualification models — Model A (any one meaningful activity), Model B (minimum daily activity/goal points), Model C (custom user-selected learning goal) — with Model A (one verified meaningful learning or business-building action) as the recommended initial model.
- **FR-039**: System MUST track streak state as one of: Not started, Active today, At risk, Completed today, Grace period, Frozen, Broken, Recovered, and MUST display a streak widget (current streak, longest streak, today's status, weekly calendar, next milestone, qualifying-action call-to-action, freeze availability, recovery state).
- **FR-040**: System MUST support Streak Freeze as an earnable/optional protection (earned via level reward, monthly consistency, reward-point redemption, admin campaign, or membership benefit), with automatic-or-manual activation, a maximum inventory, inability to cover multiple unconfigured missed days, optional expiry, and fraud safeguards. Streak Freeze MUST NOT be a cash-purchase-only feature. [NEEDS CLARIFICATION: maximum streak-freeze inventory count and earn rate are not numerically specified, §43.]
- **FR-041**: System MUST support limited Streak Recovery for a broken streak, with a defined recovery window, eligible streak length, a required comeback task, an optional reward-point cost, a limited monthly use count, and an optional previous-inactivity reason; recovery MUST require a meaningful comeback action rather than merely penalizing the user.
- **FR-042**: On a streak break, System MUST use non-shaming, encouraging messaging that acknowledges the break and invites the user to restart, and MUST keep the user's previous achievements visible.
- **FR-043**: System MUST support Weekly Consistency as an inclusive alternative to daily streaks (weekly goal, completed days, required activities, weekly success, consecutive successful weeks) for users with irregular schedules.

### Mission Requirements

- **FR-044**: System MUST support Daily Missions (short, meaningful actions) with fields: title, description, action, reward, eligibility, expiry, and completion validation.
- **FR-045**: System MUST support Weekly Missions personalized using inputs such as active course, learning goal, business stage, time availability, and previous behavior.
- **FR-046**: System MUST track mission state as one of Locked, Available, In progress, Completed, Claimed, Expired, Replaced, and MUST support configuring mission rewards as auto-awarded or claim-based.
- **FR-047**: System MUST support a limited mission-replacement option when a user receives an irrelevant mission, with a maximum-replacements limit, no reward-farming allowance, an equal-difficulty replacement mission, an unchanged expiry, and an audit record. [NEEDS CLARIFICATION: the maximum number of allowed mission replacements is not numerically specified, §50.]

### Challenge Requirements

- **FR-048**: System MUST support Challenge categories: Learning, Business launch, Content, Sales, Habit, Community, Team, Event, Mentor-led, and Organization challenges.
- **FR-049**: System MUST support Challenge types: Individual, Community (shared target), Competitive (rank-based winners), Team, Cohort-restricted, Verified-Submission (evidence upload and review required), and Automatic-Tracking (progress tracked from platform events).
- **FR-050**: Every challenge MUST be defined with: challenge ID, title, slug, description, objective, category, cover image, start date, end date, registration start, registration end, timezone, eligibility, participant limit, participation mode, rules, tasks, progress model, submission requirements, verification mode, rewards, badge, leaderboard settings, sponsors, status, created-by, and approved-by.
- **FR-051**: A Challenge MUST progress through the status model: Draft → Review → Scheduled → Registration open → Registration closed → Active → Verification → Completed, with Cancelled and Archived as terminal states reachable at appropriate points.
- **FR-052**: System MUST provide challenge discovery with sections (Recommended, Active, Starting soon, Joined, Completed, Team challenges, Mentor challenges, Organization challenges) and filters (category, duration, difficulty, reward, individual/team, free/member-only, language).
- **FR-053**: System MUST provide a challenge detail screen (title, objective, host, dates, countdown, participant count, eligibility, tasks, rules, rewards, badge, leaderboard status, submission requirements, join action, FAQ, discussion).
- **FR-054**: When a user joins a challenge, System MUST execute: eligibility check, registration-window check, capacity check, rules display, agreement capture, team selection where applicable, participation-record creation, task initialization, welcome notification, and open the challenge dashboard.
- **FR-055**: System MUST support challenge task types (lesson completion, quiz, assignment, habit check-in, text response, image proof, video proof, link submission, business milestone, community contribution, live attendance, manual mentor approval), with each task defining title, description, points, deadline, mandatory status, evidence requirement, verification mode, and retry rule.
- **FR-056**: System MUST display challenge progress (overall progress, completed tasks, remaining tasks, current score, current rank if enabled, deadline, next action, reward eligibility).
- **FR-057**: System MUST support challenge submission content types (text, image, file, link, audio, video, external proof, declaration) and submission states (Draft, Submitted, Under review, Approved, Changes requested, Rejected, Late, Disqualified).
- **FR-058**: System MUST support challenge verification modes (automatic event verification, instructor review, mentor review, admin review, peer validation, hybrid verification, random audit); high-value rewards MAY require manual or hybrid verification.
- **FR-059**: System MUST support challenge scoring models (completion-based, points-based, speed-based, quality rubric, consistency, team total, team average, weighted task score), with tiebreaker rules defined before the challenge starts.
- **FR-060**: System MUST support challenge winner categories (first/second/third place, top 10, best quality, most consistent, community choice, mentor choice, all-completers); where a random prize draw is used, applicable-law and official-rules review MUST be mandatory before use.
- **FR-061**: System MUST support Team Challenges with team fields (name, icon, captain, members, capacity, score, rank, join method, communication group) and team rules (member-switching cutoff, captain replacement, inactive-member handling, team-score calculation, disqualification handling).
- **FR-062**: System MUST support Community-Wide Challenges with a shared collective target, visually displayed shared progress, and separate tracking of individual contribution versus collective reward.
- **FR-063**: System MUST provide challenge-specific discussion (announcements, questions, progress updates, team discussions, mentor tips, resource sharing) governed by the community permission model defined in Volume 05 (Community, Groups, Channels, Feed, Messaging, Moderation, Trust & Safety).
- **FR-064**: Admin MUST be able to build a challenge through a defined step sequence (basic details, eligibility, schedule, tasks, verification, scoring, leaderboard, rewards, communication, rules, review, publish) with mandatory draft autosave and preview.
- **FR-065**: Admin MUST be able to manage challenge participants via a table (participant, join date, progress, score, rank, submission state, fraud flag, completion, reward) with actions: view, approve submission, request changes, adjust score, disqualify, restore, send message, export.

### Leaderboard Requirements

- **FR-066**: System MUST support leaderboard types: XP, Learning, Challenge, Community-helpfulness, Streak, Group, Cohort, Team, and Organization leaderboards.
- **FR-067**: System MUST support leaderboard time periods: Daily, Weekly, Monthly, Challenge period, Cohort period, and All-time; Weekly and Monthly boards MUST automatically reset their ranking period while retaining historical snapshots.
- **FR-068**: System MUST support leaderboard segmentation filters (Global, Country/region, Language, Group, Course, Cohort, Organization, Level range, Membership, Friends/connections). A Global leaderboard is not mandatory; System MAY default users to a local/relevant leaderboard.
- **FR-069**: Leaderboard rank calculation MUST be server-side, use a deterministic tiebreaker sequence (higher verified score, more high-value activities, earlier completion, fewer penalties), exclude fraud-flagged score and pending points, use cached/snapshotted results, surface rank change, and support efficient "nearby ranks" queries.
- **FR-070**: System MUST provide user leaderboard-privacy options (show full name, show display name, show anonymous member code, hide from optional leaderboards); mandatory participation in an official challenge leaderboard MUST be disclosed in that challenge's join terms.
- **FR-071**: Each leaderboard row MUST display rank, rank change, avatar, name, level, score, badge, and relevant achievement, with the viewing user's own row sticky or highlighted.
- **FR-072**: System MUST avoid unfair leaderboard comparisons (e.g., new users vs. multi-year users on short-term boards, paid vs. free access without segmentation, differing challenge task availability, differing organization rules), and MUST transparently document any normalized-scoring formula used.
- **FR-073**: System MUST detect leaderboard-relevant abuse (repeated low-value action farming, multiple accounts, bot actions, coordinated reactions, duplicate submissions, time manipulation, API abuse, device farms, suspicious account linking) and, on a suspicious score, temporarily exclude it, mark it pending, route it to a review queue, and restore it after clearance.

### Reward Catalog & Fulfillment Requirements

- **FR-074**: System MUST support reward types: course discount, membership discount, event ticket, mentor session, digital template, e-book, exclusive content, profile frame, challenge entry, group access, merchandise, partner benefit, recognition feature, and a future-ready donation option.
- **FR-075**: Every reward MUST be defined with: reward ID, name, description, image, category, point cost, cash co-pay (if allowed), stock, per-user limit, eligibility, level requirement, membership requirement, start date, end date, redemption instructions, delivery type, fulfillment SLA, expiry after redemption, refund policy, and status.
- **FR-076**: Reward availability MUST be tracked as one of: Available, Coming soon, Limited stock, Out of stock, Eligibility locked, Expired, Paused, Archived.
- **FR-077**: System MUST provide a reward detail screen (image, description, point cost, the user's current balance, eligibility, stock, redemption limit, delivery method, terms, expiry, redeem action).
- **FR-078**: On redemption, System MUST execute in order: reward selection, eligibility check, stock check, point-balance check, terms confirmation, capture of required delivery details, point reservation, redemption-transaction creation, stock reservation, fulfillment initiation, confirmation notification, and final debit-or-release based on outcome — implemented as an atomic transaction or a compensating workflow.
- **FR-079**: Reward redemption MUST progress through states: Initiated, Points reserved, Confirmed, Processing, Fulfilled, Failed, Cancelled, Refunded, Expired.
- **FR-080**: For digital reward fulfillment (coupon code, download link, course access, event access, digital badge, mentor-booking credit), System MUST support unique codes, expiry, usage count, secure delivery, a reissue policy, and redemption audit.
- **FR-081**: For physical reward fulfillment, System MUST capture shipping address, phone, and region eligibility, track shipping status and tracking number, capture delivery confirmation, and define a return policy. Shipping address MUST be treated as sensitive data, stored and retained only for the fulfillment period.
- **FR-082**: System MUST support point refunds for reward unavailability, fulfillment failure, admin cancellation, duplicate redemption, or user cancellation within an allowed window, with every refund referencing the original redemption transaction and a clearly defined policy for refunding points that have since expired.
- **FR-083**: Admin reward inventory MUST track total stock, available, reserved, fulfilled, cancelled, expired reservations, and a low-stock threshold, with concurrency controls that prevent overselling during simultaneous redemptions.
- **FR-084**: Reward coupons MUST be defined with code, value, type, applicable product, minimum spend, expiry, user restriction, usage limit, and status; coupon codes MUST NOT be exposed in plain-text database logs where a security risk exists.
- **FR-085**: Admin MUST be able to create/edit rewards, set cost, manage stock, configure eligibility, upload terms, set fulfillment, pause, archive, view redemptions, and issue refunds.
- **FR-086**: Admin MUST have a redemption-operations screen (columns: redemption ID, user, reward, point cost, status, requested date, fulfillment type, SLA, assigned operator) with actions: confirm, process, fulfill, add tracking, fail, cancel, refund, contact user.

### Recognition Requirements

- **FR-087**: System MUST support a Recognition system that celebrates member contribution independent of any point redemption, with types including Member of the Week, Learner of the Month, Community Helper, Challenge Champion, Business Builder, Mentor Choice, Comeback Story, and Rising Member.
- **FR-088**: System MUST support recognition nomination from system, mentor, instructor, group admin, member, and admin sources, capturing nominee, category, reason, evidence, period, reviewer, and status; popularity voting alone MUST NOT determine the final recognition decision.
- **FR-089**: System MUST provide a public Recognition Wall (featured member, achievement, story, badge, period, related milestone, member consent), and MUST require explicit member consent before publishing financial or otherwise sensitive achievements.
- **FR-090**: System MUST trigger a milestone-celebration UI (modal/bottom-sheet, animation, achievement details, reward summary, share option, continue action) for events including level up, course completed, badge earned, streak milestone reached, challenge completed, verified first-client milestone, or reward redeemed, and MUST respect the user's reduced-motion preference.
- **FR-091**: System MUST let users share achievements to a community post, group post, direct message, or an external share card (with a copy-verification-link option where applicable), MUST let the user edit the share post text before posting, and MUST default auto-sharing to off.

### Fraud Prevention Requirements

- **FR-092**: Admin MUST have a Fraud Review console with queue sources (unusual point velocity, duplicate device accounts, suspicious challenge submissions, reaction farming, time manipulation, repeated referral patterns, reward abuse, multiple redemption attempts, manual report) and reviewer actions (clear, hold points, reverse points, exclude from leaderboard, disqualify from challenge, restrict account, escalate).
- **FR-093**: System MUST evaluate gamification-specific fraud signals (impossible completion speed, the same assessment repeated across accounts, high activity within seconds, device/IP clustering, repeated media evidence, duplicate links, account-creation burst, referral loops, excessive reactions between the same accounts, timezone switching, API replay); no single weak signal alone MUST trigger a permanent punishment.
- **FR-094**: System MUST derive gamification penalties (point reversal, leaderboard exclusion, challenge disqualification, badge revocation, reward restriction) separately from general community-moderation actions, and MUST NOT use negative public scoring or humiliation as a penalty mechanism.
- **FR-095**: System MUST provide a user appeal process for challenge disqualification, point reversal, badge revocation, leaderboard exclusion, and reward cancellation, capturing action, reason, user explanation, evidence, review status, decision, and audit trail.

### Point Economy Governance Requirements

- **FR-096**: Admin MUST have a Gamification admin module covering: Gamification Dashboard, Point Rules, Levels, Badges, Missions, Challenges, Leaderboards, Rewards, Redemptions, Recognition, Fraud Review, Adjustments, Reports, and Settings.
- **FR-097**: The Gamification admin dashboard MUST report: active participants, XP awarded, TBT Points issued, TBT Points redeemed, outstanding point liability, reward-redemption rate, streak participation, challenge completion, badge awards, level distribution, fraud flags, expiring points, top-earning actions, and gamification-driven retention.
- **FR-098**: The Point Rule admin screen MUST list rule, event, XP, reward points, caps, eligibility, status, effective dates, and updated-by, with actions: create, edit, duplicate, pause, schedule, archive, view impact, and view transactions; edits to a published rule MUST be versioned.
- **FR-099**: Before publishing a new or changed point rule, Admin MUST be able to run a Point Economy Simulation previewing estimated daily issuance, estimated monthly issuance, expected liability, affected users, abuse risk, reward affordability, and a comparison against the current rule; high-impact rule changes MAY require an approval workflow. [NEEDS CLARIFICATION: the numeric/qualitative threshold that classifies a rule change as "high-impact" (requiring approval) is not specified, §98.]
- **FR-100**: Manual point adjustments (add/remove XP, add/remove TBT Points, release pending points, reverse a transaction) MUST be restricted to authorized admins and MUST require: target user, amount, reason category, detailed note, approval above a defined threshold, an audit entry, and a notification policy. Direct balance edits without a corresponding ledger transaction MUST be prohibited. [NEEDS CLARIFICATION: the specific approval-threshold amount for manual point adjustments is not specified, §99.]
- **FR-101**: Admin MUST be able to create levels, edit unpublished levels, update thresholds with a migration plan, configure benefits, preview, activate, and archive levels; threshold changes MUST require an impact simulation for existing users before activation.
- **FR-102**: Admin MUST be able to create badges, upload icons, define criteria, set rarity, set availability, configure verification, award manually, revoke, view recipients, and export a recipient report.

### Notifications, Dashboard & Profile Requirements

- **FR-103**: System MUST support gamification notification types: points earned, points pending, points expiring, level up, badge earned, streak at risk, streak milestone, mission available, mission completed, challenge starting, challenge task due, rank changed, reward available, reward fulfilled, and recognition received.
- **FR-104**: System MUST NOT push an individual notification for every small point event; low-value events MUST be summarized (e.g., a daily digest), major achievements MUST trigger immediate notification, and users MUST have preference controls and notification grouping.
- **FR-105**: The member gamification dashboard MUST include current level, XP progress, TBT Point balance, daily streak, daily missions, active challenges, recent badges, leaderboard position, rewards, and achievement history, reorderable via personalization.
- **FR-106**: The profile gamification section MUST display level, featured badges, current streak (optional), challenge wins, recognition, certificates, and contribution summary, with user-controlled visibility toggles for points, streak, badges, rank, and rewards. Reward-point balance MUST NOT be displayed publicly.

### Security, Privacy & Audit Requirements

- **FR-107**: All point, level, badge, streak, and reward-award calculation MUST be server-authoritative; internal events MUST be signed, idempotency MUST be enforced, balance adjustments MUST be role-based, the ledger MUST be immutable and audit-logged, and client-side score tampering MUST be prevented.
- **FR-108**: System MUST apply rate limiting and API-replay protection to gamification endpoints, lock reward inventory during concurrent redemption, encrypt sensitive fulfillment data, monitor for fraud, enforce admin-approval thresholds for high-impact changes, and sanitize leaderboard output.
- **FR-109**: System MUST keep reward-point balance private, exact point history private, leaderboard visibility user-configurable, business-revenue milestones private by default, shipping address restricted, challenge-evidence audience clearly defined, admin access role-based, fraud signals never publicly displayed, and recognition publication gated on consent where sensitive.

### Accessibility & Localization Requirements

- **FR-110**: Gamification UI MUST provide screen-reader labels on progress bars, non-color level indicators, a keyboard-accessible reward catalog, reduced-motion celebration animations, clearly labeled streak calendars, an accessible leaderboard table, badge alt-text descriptions, accessible countdowns, textual challenge-task status, recoverable error messages, no flashing animations, and locale-formatted point values.
- **FR-111**: Gamification content (level names, badge names, mission text, challenge rules, reward terms, notifications, dates, number formatting, points-expiry communication) MUST support Tamil, Tanglish, and English, with admin-manageable per-language content variants (see Constitution: Localization & Language Requirements).

### Mobile & Offline Requirements

- **FR-112**: The mobile app MUST support points wallet, level widget, badge showcase, streak calendar, daily missions, challenge join, task submission, leaderboard, rewards, redemption status, achievement sharing, and push deep links, with offline support for streak-activity queueing, mission-progress caching, challenge drafts, and evidence-upload retry. The app MUST show a pending state until the server confirms the final award.

### Analytics & Performance Requirements

- **FR-113**: System MUST emit the defined gamification analytics event taxonomy: `xp_awarded`, `reward_points_awarded`, `points_reversed`, `points_expired`, `level_up`, `badge_earned`, `badge_featured`, `streak_started`, `streak_continued`, `streak_broken`, `streak_recovered`, `mission_started`, `mission_completed`, `challenge_viewed`, `challenge_joined`, `challenge_task_completed`, `challenge_submitted`, `challenge_completed`, `leaderboard_viewed`, `reward_viewed`, `reward_redeemed`, `reward_fulfilled`, `recognition_received`.
- **FR-114**: System MUST track gamification product metrics: percentage of active users earning XP, daily mission completion, weekly consistency, course/assignment completion uplift, challenge join/completion rate, reward redemption rate, point liability, reward fulfillment success, streak retention, badge share rate, leaderboard participation, fraud rate, and notification opt-out rate.
- **FR-115**: Point-award processing MUST be asynchronous where suitable without delaying the critical completion response; balance updates MUST be near-real-time; leaderboards MUST use cached snapshots with efficient nearby-rank queries; badge evaluation MUST be event-driven; streak calculation MUST be both scheduled and event-based; challenge progress MUST use incremental aggregation; reward stock MUST have concurrency protection; dashboards MUST support partial loading; ledger queries MUST be paginated.
- **FR-116**: Gamification screens MUST define loading-skeleton states (wallet, level, badge grid, challenge card, leaderboard rows, reward cards, redemption processing) without displaying fake zero values during load, and MUST define empty states for no points, no badges, no active challenge, no rewards, and no leaderboard entry.

### Key Entities *(include if feature involves data)*

- **Point Rule**: Admin-configured definition of a point-earning action (event trigger, XP amount, reward-point amount, caps, cooldown, eligibility, verification mode, effective dates, version, approval state). Drives the point-award process.
- **Experience (XP) Transaction**: Immutable ledger entry recording an XP award or reversal, referencing the source event, rule, and user; the sum of these entries derives a user's XP balance.
- **Reward Point Transaction**: Immutable ledger entry recording a reward-point issuance, redemption, expiry, reversal, or adjustment, referencing the source event/rule/redemption; the sum derives a user's available/pending/reserved/redeemed/expired/reversed reward-point balances.
- **Point Expiry Lot**: A dated batch of earned reward points subject to its own expiry rule, consumed oldest-first on redemption.
- **Reputation Score**: Internal, not-necessarily-public score evaluating community trust and helpful contribution, distinct from XP and reward points.
- **Level**: Named, ordered progression stage with a minimum/maximum XP range, benefits, unlocks, and celebration content.
- **User Level**: A user's current level assignment, history, and benefit-unlock state, recalculated from XP via server-side evaluation.
- **Level Benefit**: A specific unlock (profile frame, group access, event priority, etc.) attached to a level.
- **Badge**: Definition of an awardable achievement/status (category, type, criteria, verification requirement, rarity, revocable flag, issue limit, active window).
- **Badge Criterion**: The specific rule/configuration that must be met to earn a given badge, including hidden/partially-hidden criteria.
- **User Badge**: A specific badge instance awarded to a user, with earned date, verification details, tier (if progressive), and revocation state.
- **Achievement**: A detailed milestone record (title, progress, stages, completion date, reward, evidence) distinct from and more granular than a badge.
- **User Achievement**: A user's progress/completion record against a specific Achievement.
- **Streak**: A user's consecutive-qualifying-day counter, including current length, longest length, and current status (active/at-risk/frozen/broken/recovered).
- **Streak Activity**: A record of a specific day's qualifying activity that counted toward (or broke) a user's streak.
- **Streak Freeze**: An inventory item that can be applied to protect a single missed streak day, with source, expiry, and usage state.
- **Mission**: A definition of a short daily/weekly task (title, action, reward, eligibility, expiry, completion validation, personalization inputs).
- **User Mission**: A specific mission instance assigned to a user, tracked through Locked/Available/In progress/Completed/Claimed/Expired/Replaced states.
- **Challenge**: A structured, time-bound competition or mission definition (objective, category, schedule, eligibility, tasks, scoring model, verification mode, rewards, leaderboard settings, status).
- **Challenge Task**: A specific task within a challenge (type, points, deadline, mandatory flag, evidence requirement, verification mode, retry rule).
- **Challenge Participant**: A user's (or team's) registration and progress record within a specific challenge, including score, rank, and fraud-flag state.
- **Challenge Submission**: Evidence submitted against a challenge task, tracked through Draft/Submitted/Under review/Approved/Changes requested/Rejected/Late/Disqualified states.
- **Challenge Review**: A reviewer's decision record against a challenge submission (approve, request changes, reject, disqualify), including reviewer identity and reason.
- **Challenge Team**: A group of participants competing together within a Team Challenge, with captain, members, capacity, team score, and rank.
- **Leaderboard**: A defined ranking view (type, time period, segmentation filters) over user or team scores.
- **Leaderboard Snapshot**: A retained, point-in-time capture of a leaderboard's final ranking for a completed period, used for history.
- **Leaderboard Entry**: A single ranked row (user/team, score, rank, rank change) within a leaderboard or snapshot.
- **Reward**: A catalog item redeemable for reward points (type, cost, stock, eligibility, delivery type, fulfillment SLA, expiry, refund policy, status).
- **Reward Inventory**: The stock-tracking record for a reward (total, available, reserved, fulfilled, cancelled, expired reservations, low-stock threshold).
- **Reward Redemption**: A user's request to redeem a specific reward, tracked through Initiated/Points reserved/Confirmed/Processing/Fulfilled/Failed/Cancelled/Refunded/Expired states.
- **Reward Fulfillment**: The delivery record for a confirmed redemption (digital code/link or physical shipping details, tracking, delivery confirmation).
- **Recognition**: A non-redemption-based public celebration record (type, featured member, achievement, story, period, consent state).
- **Nomination**: A submitted proposal for a Recognition, including nominator source, category, reason, evidence, and review status.
- **Fraud Signal**: A detected pattern (velocity, device/IP clustering, duplicate evidence, timezone switching, API replay, etc.) attached to a user, event, or leaderboard score for review.
- **Gamification Review (Fraud Review Case)**: A queued case routing one or more fraud signals to a reviewer, with reviewer action (clear/hold/reverse/exclude/disqualify/restrict/escalate) and outcome.
- **Point Adjustment**: A manually authorized admin change to a user's XP or reward-point ledger (add/remove/release/reverse), always expressed as a ledger transaction, never a direct balance edit.
- **Appeal**: A user-submitted challenge to a gamification penalty (point reversal, badge revocation, leaderboard exclusion, challenge disqualification, reward cancellation), tracked through review to decision.
- **Audit Log**: The immutable record of every administrative, adjustment, revocation, and fraud-review action taken against gamification state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero duplicate point awards occur for the same qualifying event (100% idempotency enforcement) across lesson-completion, quiz, assignment, and business-milestone events, verified under retry/replay conditions.
- **SC-002**: 100% of XP, reward-point, level, and reward-inventory balance changes are traceable to an immutable ledger transaction; no balance change occurs without a corresponding ledger entry.
- **SC-003**: Zero overselling incidents occur on limited-stock rewards under concurrent redemption load.
- **SC-004**: 100% of reward-point lots configured with an expiry generate both a 30-day and a 7-day expiring-soon reminder to the affected user before the lot expires.
- **SC-005**: Outstanding reward-point liability (the sum of all unredeemed, unexpired reward points) is visible and reconcilable in the admin dashboard at all times, enabling finance to confirm it remains within a sustainable, catalog-affordable range.
- **SC-006**: Following gamification launch, meaningful learning activity (course/assignment completion) shows measurable uplift while low-quality/spam activity (as defined by fraud-signal volume) does not increase — matching the source's stated success-evaluation criteria.
- **SC-007**: 100% of activity flagged by a fraud signal is routed to the Fraud Review queue before any point reversal, leaderboard exclusion, badge revocation, or account restriction is applied — no single weak signal alone triggers an automatic permanent penalty.
- **SC-008**: Streak-day calculation produces zero false streak breaks attributable to timezone-boundary miscalculation across defined QA timezone test cases (including DST transitions and cross-timezone travel scenarios).
- **SC-009**: 100% of point-rule publishes classified as high-impact have a completed Point Economy Simulation record and, where required, a completed approval-workflow record on file prior to going live.
- **SC-010**: Post-launch qualitative success evaluation (member surveys / support-ticket sentiment) shows no meaningful increase in members reporting pressure, anxiety, or shame attributable to streak-loss or leaderboard-ranking messaging.

## Assumptions

- All specific XP amounts, reward-point amounts, level XP thresholds, and level names shown in the source (e.g., the sample point-rule matrix, the 10-level threshold table, level names "Thodakkam" through "Legacy Builder") are explicitly stated as illustrative baselines only. Final values must be set through the Point Economy Simulation and abuse testing described in this spec before launch, and level names are subject to brand review.
- Cash withdrawal or direct cash-equivalent redemption of TBT Reward Points is out of scope for this feature unless and until a future legal/financial policy explicitly approves it; this spec does not define such a policy.
- TBT Reward Points are a distinct, non-monetary internal-economy ledger, separate from the monetary member wallet, invoicing, and payment-processing mechanics owned by Volume 09 (Membership Plans, Subscriptions, Payments, Invoices, Affiliates, Revenue Ops). Any reward with a "cash co-pay" component depends on Volume 09's payment infrastructure, which this spec does not redefine.
- The underlying completion/verification events that trigger point, badge, streak, and challenge-task awards (lesson completion, quiz pass, assignment approval, accepted community answer, verified business milestone, event attendance, mentor-approved activity) are authoritatively defined and emitted by their owning modules — Volume 04 (Learning Management System), Volume 05 (Community, Groups, Channels, Feed, Messaging, Moderation, Trust & Safety), Volume 07 (Mentor Marketplace), and Volume 10 (Events, Webinars, Workshops, Cohorts, Ticketing, Live Streaming). This spec defines how the gamification system consumes and governs those events once emitted, not the completion/verification logic itself.
- Detailed referral-point rules are owned by Volume 09 (Membership, Payments, Revenue) or a future growth module; this spec defines only the baseline anti-abuse safeguards applied to any referral points the gamification ledger disburses.
- Team-challenge communication groups and challenge discussion permissions rely on the community/messaging infrastructure and permission model defined in Volume 05, referenced but not redefined here.
- Detailed database schema for the entities listed under Key Entities and detailed API endpoint contracts are explicitly deferred by the source to later architecture volumes (database schema to Volume 14's data-platform chapters; API endpoints to a "Volume 15" not present in the current document set). This spec defines the data and API *requirement groups*, not the implementation-level schema or endpoint contracts.
- Admin roles referenced as "authorized admin" / "reviewer" / roles requiring "approval above a defined threshold" follow the platform-wide layered RBAC and approval-chain model (Constitution Article VII), rather than defining a separate gamification-specific role hierarchy.
- Random-prize-draw challenge winner selection requires jurisdiction-specific legal/official-rules review before use; this spec does not define that legal review process itself, only that it is a mandatory precondition (see Edge Cases).
- Where the source leaves a specific numeric threshold, count, or default policy unstated (e.g., high-impact rule-change threshold, manual-adjustment approval threshold, max streak-freeze inventory, max mission replacements, default point-expiry policy), the corresponding functional requirement is marked with `[NEEDS CLARIFICATION: ...]` rather than an invented default.
