---
description: "Task list for Feature 029 — Customer Lifecycle, Retention, Loyalty & Win-Back Automation"
---

# Tasks: Customer Lifecycle, Retention, Loyalty & Win-Back Automation

**Input**: Design documents from `/specs/029-customer-lifecycle-retention-loyalty/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `006`'s gamification state, `008`'s AI gateway, and activity events from `004`/`005`/`007`/`009`/`010`/`013` exist as integration points, though it does not require their full feature completion to build its own lifecycle/retention/loyalty engine.

**Tests**: Included throughout — real-time lifecycle-transition timestamping, loyalty-ledger immutability, and the AI retention-action approval gate each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-004/Constitution Article V, and SC-006/Constitution Article II.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (retention journeys, renewal management, referral-loyalty, segmentation/engagement, gamification consumption, feedback/sentiment, and the AI Retention Assistant/Customer Success Dashboard).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor reused via `016`), and that `006`'s gamification state, `008`'s AI gateway, and `004`/`005`/`007`/`009`/`010`/`013`'s activity events exist as integration points
- [ ] T002 Resolve `research.md` open items before proceeding: **FR-024's revenue-based-tier-vs-Constitution-Article-VIII tension (highest priority — must be resolved before tier-calculation logic ships)**, win-back re-entry/cooldown policy, points-ledger negative-balance policy after redemption+refund (reconcile with `006`), Health Score threshold-oscillation hysteresis, cross-module lifecycle-signal precedence, concurrent-journey deconfliction for high-tier-yet-at-risk customers, and the churn-prediction-outage deterministic fallback (reconcile with `040`)
- [ ] T003 [P] Add `backend/src/modules/{lifecycle-engine,customer-health-score,churn-prediction,retention-journeys,renewal-management,loyalty-tiers-ledger,referral-loyalty,winback-automation,customer-segmentation,gamification-integration,feedback-sentiment,retention-dashboards,ai-retention-assistant,retention-governance}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Lifecycle Stage` entity (8 core + 5 alternate states) in `backend/src/modules/lifecycle-engine/lifecycle-stage.entity.ts`
- [ ] T005 [P] Define the append-only `Lifecycle Transition` entity in `backend/src/modules/lifecycle-engine/lifecycle-transition.entity.ts`
- [ ] T006 [P] Define the `Lifecycle Rule` entity in `backend/src/modules/lifecycle-engine/lifecycle-rule.entity.ts`
- [ ] T007 [P] Define the `Customer Health Score` entity in `backend/src/modules/customer-health-score/customer-health-score.entity.ts`
- [ ] T008 [P] Define the `Churn Risk Level` entity in `backend/src/modules/churn-prediction/churn-risk-level.entity.ts`
- [ ] T009 [P] Define the `Retention Recommendation` entity in `backend/src/modules/churn-prediction/retention-recommendation.entity.ts`
- [ ] T010 [P] Define the `Customer Journey` entity in `backend/src/modules/retention-journeys/customer-journey.entity.ts`
- [ ] T011 [P] Define the `Win-Back Journey` entity in `backend/src/modules/winback-automation/winback-journey.entity.ts`
- [ ] T012 [P] Define the `Loyalty Tier` entity in `backend/src/modules/loyalty-tiers-ledger/loyalty-tier.entity.ts`
- [ ] T013 [P] Define the append-only `Loyalty Points Ledger Entry` entity in `backend/src/modules/loyalty-tiers-ledger/loyalty-points-ledger-entry.entity.ts`
- [ ] T014 [P] Define the `Loyalty Reward` entity in `backend/src/modules/loyalty-tiers-ledger/loyalty-reward.entity.ts`
- [ ] T015 [P] Define the `Referral Reward Record` entity in `backend/src/modules/referral-loyalty/referral-reward-record.entity.ts`
- [ ] T016 [P] Define the `Customer Segment` entity in `backend/src/modules/customer-segmentation/customer-segment.entity.ts`
- [ ] T017 [P] Define the `Engagement Score` entity in `backend/src/modules/customer-segmentation/engagement-score.entity.ts`
- [ ] T018 [P] Define the `Renewal Record` entity in `backend/src/modules/renewal-management/renewal-record.entity.ts`
- [ ] T019 [P] Define the `Customer Feedback Record` entity in `backend/src/modules/feedback-sentiment/customer-feedback-record.entity.ts`
- [ ] T020 [P] Define the `Customer Success Dashboard` view model in `backend/src/modules/retention-dashboards/customer-success-dashboard.entity.ts`
- [ ] T021 [P] Define the `Executive Retention Dashboard` view model in `backend/src/modules/retention-dashboards/executive-retention-dashboard.entity.ts`
- [ ] T022 Note: gamification award mechanics (points/badges/streaks/levels/missions/challenges/leaderboards) are reused directly from `006`; this module consumes gamification state, it does not redefine it (FR-036–FR-037)
- [ ] T023 Note: deep churn-prediction-modeling internals are deferred to `040`; this module performs lifecycle-level consumption and action-triggering only (FR-011 scope boundary)
- [ ] T024 Contract test: 100% of lifecycle-stage transitions are applied and timestamped within 2 seconds of the triggering rule being satisfied, in `backend/tests/contract/lifecycle-transition-timestamped-realtime.contract.test.ts` (FR-003, FR-006, SC-001)
- [ ] T025 Contract test: 100% of loyalty-point transactions are captured as immutable ledger entries with a derived, never-directly-writable balance, in `backend/tests/contract/loyalty-ledger-immutability-derived-balance.contract.test.ts` (FR-026–FR-027, SC-004, Constitution Article V)
- [ ] T026 Contract test: zero consequential AI-generated retention actions execute without completing the required human/role-gated approval step, in `backend/tests/contract/ai-retention-action-approval-gate.contract.test.ts` (FR-013, FR-044, SC-006, Constitution Article II)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Customer Progresses Through the 7-Stage Lifecycle With Automatic Stage Transitions (Priority: P1) 🎯 MVP

**Independent Test**: Create a test customer, feed it a sequence of qualifying events (first purchase, repeat purchases, a referral), and confirm the customer's stage advances Visitor → Lead → First-Time Customer → Active Customer automatically as each admin-defined rule is satisfied, with every transition timestamped and stored.

- [ ] T027 [US1] 8-stage core lifecycle plus 5 alternate states model, wired to T004 (FR-001–FR-002)
- [ ] T028 [US1] Lifecycle-transition timestamping and storage, wired to T024's contract test (FR-003, acceptance scenario 1)
- [ ] T029 [US1] Stage-specific characteristics and primary-goal evaluation per stage (FR-004)
- [ ] T030 [US1] Lifecycle Engine continuous evaluation across 10 signal categories (purchases, website activity, community, ebook/podcast, AI conversations, events, referrals, membership, support), wired to acceptance scenario 2 (FR-005)
- [ ] T031 [US1] Automatic stage update on rule satisfaction with no manual reassignment, wired to acceptance scenario 3 (FR-006)
- [ ] T032 [US1] Admin rule definition per stage (entry/exit/duration/qualification/triggers/actions/notifications/approval) supporting IF/ELSE, event triggers, time delays, AI recommendations, multi-condition logic, wired to T006, acceptance scenario 4 (FR-007)
- [ ] T033 [P] [US1] Lifecycle stage visualization and rule-configuration UI
- [ ] T034 [US1] Integration test: capture transitions Visitor→Lead, first purchase transitions to First-Time Customer, Loyal Customer entry rule auto-applies, exit rule moves customer to Dormant/At-Risk — all 4 acceptance scenarios in `backend/tests/integration/us1-lifecycle-progression.integration.test.ts`

**Checkpoint**: The foundational customer state every other capability in this feature reads from or writes to is independently functional.

---

## Phase 4: User Story 2 — Customer Health Score Triggers a Retention Journey When It Drops (Priority: P1)

**Independent Test**: Seed a test customer's inputs (declining login frequency, a missed renewal) and confirm the Health Score recalculates, moves from "Healthy" (61–80) into "At Risk" (21–40), and the score's category change is visible on the Customer Success Dashboard.

- [ ] T035 [US2] 0–100 Health Score maintenance per customer, wired to T007 (FR-008)
- [ ] T036 [US2] 5-band classification (Critical/At Risk/Stable/Healthy/Excellent), wired to acceptance scenario 1 (FR-009)
- [ ] T037 [US2] Score calculation from 8 input categories (purchase frequency, login frequency, community activity, support satisfaction, course completion, renewal history, referral activity, payment behavior), wired to acceptance scenario 3 (FR-010)
- [ ] T038 [US2] Real-time reclassification with Customer Success Dashboard visibility on band change (acceptance scenario 2)
- [ ] T039 [US2] Sub-1-second recalculation performance (acceptance scenario 4)
- [ ] T040 [P] [US2] Health Score display/trend UI
- [ ] T041 [US2] Integration test: declining activity drops the score into At Risk, Critical band reflects on the dashboard and makes the customer retention-eligible, resumed activity raises the score, recalculation completes under 1 second — all 4 acceptance scenarios in `backend/tests/integration/us2-health-score.integration.test.ts`

**Checkpoint**: The primary early-warning signal all retention automation depends on is independently functional.

---

## Phase 5: User Story 3 — AI Churn Prediction Engine Flags High/Critical Risk Customers for Retention Action (Priority: P1)

**Independent Test**: Simulate a customer's declining engagement/purchase pattern, confirm the churn prediction reclassifies the customer into High or Critical Risk within 5 seconds, that a recommended retention strategy with a confidence score and expected business impact is generated, and that no consequential retention action executes without approval.

- [ ] T042 [US3] AI continuous churn evaluation (7 signal types) consuming `008`'s gateway, wired to T008 and T023's scope-boundary note (FR-011)
- [ ] T043 [US3] 4-level risk classification within 5 seconds, wired to acceptance scenario 1 (FR-012)
- [ ] T044 [US3] Automatic retention-strategy recommendation with confidence score and expected business impact for Critical Risk customers, wired to T009, acceptance scenario 2 (FR-013)
- [ ] T045 [US3] Advisory-only enforcement with a required human/role-gated approval before any consequential action, wired to T026's contract test, acceptance scenario 3 (FR-013)
- [ ] T046 [US3] Deterministic non-AI fallback when the Churn Prediction Engine is unavailable, wired to acceptance scenario 4 — behavior preserved as `[NEEDS CLARIFICATION]` per spec.md, to be reconciled with `040` (FR-014)
- [ ] T047 [P] [US3] Churn risk dashboard and recommendation-review UI
- [ ] T048 [US3] Integration test: declining signals classify High/Critical Risk within 5 seconds, Critical classification generates a recommendation with confidence and impact, recommendation requires approval before send, engine outage falls back to a deterministic rule — all 4 acceptance scenarios in `backend/tests/integration/us3-churn-prediction.integration.test.ts`

**Checkpoint**: The platform's core proactive-retention mechanism, bounded to advisory recommendations, is independently functional.

---

## Phase 6: User Story 4 — Customer Earns and Redeems Loyalty Points Across Six Tiers (Priority: P2)

**Independent Test**: Credit a test customer's points ledger via a qualifying action, confirm an immutable ledger entry is created and the derived balance updates, then confirm the customer's tier recalculates when qualifying activity crosses an admin-configured threshold.

- [ ] T049 [US4] 8 reward-category structure (Purchase, Referral, Community, Learning, Attendance, Anniversary, Achievement, Milestone Rewards), wired to T014 (FR-021)
- [ ] T050 [US4] Reward-type catalog (points, wallet credits, coupons, cashback, membership discounts, free courses, premium content, event passes) (FR-022)
- [ ] T051 [US4] 6-tier loyalty system (Bronze, Silver, Gold, Platinum, Diamond, Elite), wired to T012 (FR-023)
- [ ] T052 [US4] Admin-configurable tier-qualification criteria (revenue, purchase count, referrals, community participation, membership duration, activity score, learning progress) — **explicitly carries forward FR-024's flagged Article VIII tension unresolved**, wired to acceptance scenario 3 (FR-024)
- [ ] T053 [US4] 10-source point-earning rules (registration, first purchase, daily login, community posting, course completion, ebook reading, podcast listening, referral success, event attendance, membership renewal), wired to T013, acceptance scenario 1 (FR-025)
- [ ] T054 [US4] 5-type ledger transactions (Earned, Redeemed, Expired, Adjusted, Reversed), wired to T025's contract test, acceptance scenarios 1–2 (FR-026)
- [ ] T055 [US4] Immutable ledger enforcement with a derived, never-directly-writable balance, wired to acceptance scenario 4 (FR-027)
- [ ] T056 [P] [US4] Loyalty tier / points ledger UI
- [ ] T057 [US4] Integration test: qualifying action creates an Earned entry and increases the balance, redemption creates a Redeemed entry and decrements the balance, tier crosses threshold and updates with unlocked rewards, invalid transaction creates a Reversed entry referencing the original — all 4 acceptance scenarios in `backend/tests/integration/us4-loyalty-tiers-ledger.integration.test.ts`

**Checkpoint**: The primary mechanism for rewarding and retaining valuable customers, ledger-accurate per Constitution Article V, is independently functional.

---

## Phase 7: User Story 5 — Win-Back Automation Recovers Inactive Customers at 30/60/90-Day Inactivity (Priority: P2)

**Independent Test**: Simulate a customer crossing the 30-day-inactive threshold, confirm automatic enrollment into the 30-Day Win-Back journey with the configured channel mix, then simulate continued inactivity to 60 and 90 days and confirm escalated win-back treatment.

- [ ] T058 [US5] 6-trigger automatic win-back enrollment (30/60/90 Days Inactive, Expired Membership, Cart Abandonment, Lost Customer classification), wired to T011, acceptance scenario 1 (FR-030)
- [ ] T059 [US5] Escalating treatment across the 60-day and 90-day thresholds per the configured journey, wired to acceptance scenario 2 (FR-031)
- [ ] T060 [US5] Membership-expiration win-back journey distinct from plain inactivity-based journeys, wired to acceptance scenario 3 (FR-030)
- [ ] T061 [US5] Re-engagement exit from win-back journey with transition toward Reactivated Customer status, wired to acceptance scenario 4
- [ ] T062 [US5] Personalized-email, exclusive-discount, limited-time-offer, free-resource, AI-recommendation, and human-follow-up channel mix (FR-031)
- [ ] T063 [P] [US5] Win-back journey monitoring UI
- [ ] T064 [US5] Integration test: 30-day threshold auto-enrolls with a personalized email, 60/60-day and 90-day thresholds escalate treatment, membership expiration triggers a distinct journey, re-engagement exits and transitions toward Reactivated — all 4 acceptance scenarios in `backend/tests/integration/us5-winback-automation.integration.test.ts`

**Checkpoint**: The feature's primary revenue-recovery mechanism for already-disengaged customers is independently functional.

---

## Phase 8: User Story 6 — Administrator Configures Lifecycle, Retention, and Loyalty Automation Rules (Priority: P2)

**Independent Test**: Have an admin define a new lifecycle exit rule and a tier qualification rule, publish them, and confirm the Lifecycle Engine and tier-calculation engine apply the new rules to real customer data on the next evaluation cycle.

- [ ] T065 [US6] Unified rule-configuration surface for lifecycle/tier/point rules (IF/ELSE conditions, event triggers, time delays, AI recommendations, multi-condition logic), wired to T006, acceptance scenario 1 (FR-007)
- [ ] T066 [US6] Time-delay-based automation trigger configuration and execution, wired to acceptance scenario 2 (FR-007)
- [ ] T067 [US6] Tier-qualification-criteria publish with affected-customer tier recalculation, wired to T052, acceptance scenario 3 (FR-024)
- [ ] T068 [US6] Approval-workflow gating for sensitive rule changes per platform RBAC, wired to acceptance scenario 4 (FR-007, FR-049)
- [ ] T069 [P] [US6] Rule builder / publish-approval UI
- [ ] T070 [US6] Integration test: multi-condition entry rule applied on publish, time-delay trigger fires on elapse, tier-criteria publish recalculates affected customers, approval required before the change takes effect — all 4 acceptance scenarios in `backend/tests/integration/us6-automation-rule-configuration.integration.test.ts`

**Checkpoint**: The configuration surface that governs every automated behavior in this feature is independently functional.

---

## Phase 9: User Story 7 — Executive Views Retention Dashboard With AI-Generated Summary (Priority: P3)

**Independent Test**: Seed representative lifecycle/retention/loyalty activity for a test cohort and confirm the Executive Retention Dashboard renders the defined KPI set within 3 seconds along with an AI-generated summary.

- [ ] T071 [US7] Executive Retention Dashboard (12 KPIs: Customer Growth, Active Users, MAU, DAU, Retention Rate, Churn Rate, CLV, CAC Recovery, Loyalty/Referral/Renewal/Win-Back Revenue), wired to T021, acceptance scenario 1 (FR-043)
- [ ] T072 [US7] AI-generated executive summary (risks, opportunities, recommended actions, confidence indication) that never itself executes a strategic/financial action, wired to T026's contract test, acceptance scenario 2 (FR-044)
- [ ] T073 [US7] RBAC-gated access denial for roles without executive-reporting permission, wired to acceptance scenario 3 (FR-049)
- [ ] T074 [US7] Predictive retention analytics with best-case/expected/worst-case scenario planning for churn, renewals, and CLV, wired to acceptance scenario 4 (FR-041–FR-042)
- [ ] T075 [P] [US7] Executive dashboard UI
- [ ] T076 [US7] Integration test: dashboard loads all 12 KPIs under 3 seconds, AI summary highlights risk with confidence and no autonomous action, unauthorized role denied access, scenario planning shows three cases — all 4 acceptance scenarios in `backend/tests/integration/us7-executive-retention-dashboard.integration.test.ts`

**Checkpoint**: The governance/oversight reporting layer on top of the P1/P2 retention mechanics is independently functional.

---

## Phase 10: Retention Journeys, Renewal, Referral-Loyalty, Segmentation/Engagement, Gamification & Feedback remainder (supports FR-015–FR-020, FR-028–FR-029, FR-032–FR-040, FR-045–FR-046; cross-cutting, no single owning story)

- [ ] T077 9 retention-workflow types (welcome series, educational campaigns, product adoption, engagement reminders, anniversary, renewal reminders, loyalty rewards, referral invitations, upgrade campaigns), wired to T010 (FR-015)
- [ ] T078 5-channel delivery (Email, SMS, WhatsApp, Push, In-App) for every retention workflow, wired to `020`/`021` (FR-016)
- [ ] T079 10 customer-journey types (Welcome, First Purchase, Product Adoption, Renewal, Referral, VIP, Loyalty, Win-Back, Anniversary, Birthday) (FR-017)
- [ ] T080 Conditional branching and AI optimization per journey (FR-018)
- [ ] T081 Renewal workflows (reminder, discount, loyalty bonus, auto-renewal notification, payment recovery, grace period management) and Renewal Record, wired to T018 (FR-019)
- [ ] T082 Renewal metrics (Renewal Rate, Expiration Rate, Renewal Revenue, Lost Renewals, Recovery Rate) (FR-020)
- [ ] T083 Referral reward types (Referrer, New Customer, Multi-Level, Campaign Bonus, Seasonal) and referral metrics (Invitations Sent, Successful Referrals, Referral Revenue, Conversion Rate, Referral LTV), wired to T015 (FR-028–FR-029)
- [ ] T084 Dynamic real-time customer segmentation (10 example segments), wired to T016 (FR-032–FR-033)
- [ ] T085 Cross-platform engagement score calculation (10 inputs) influencing retention-automation decisions, wired to T017 (FR-034–FR-035)
- [ ] T086 Gamification-state consumption (badges, achievements, levels, streaks, leaderboards, missions, challenges, seasonal events) contributing to engagement/loyalty scores, wired to T022's reuse note (FR-036–FR-037)
- [ ] T087 Customer feedback collection (surveys, NPS, CSAT, CES, community/product reviews, event feedback) with AI sentiment/topic/trend/urgency analysis, wired to T019 (FR-038–FR-039)
- [ ] T088 Customer Success Dashboard (12 metrics), wired to T020 (FR-040)
- [ ] T089 AI Retention Assistant recommendations (9 categories: best campaign, channel, send time, loyalty upgrades, personalized rewards, recovery strategy, upsell/cross-sell, referral invitations) with confidence and expected business impact (FR-045–FR-046)

**Checkpoint**: The retention-journey, renewal, referral, segmentation, gamification-consumption, and feedback surface rounding out full retention operation is independently functional.

---

## Phase 11: Consent/Preferences, Security/Governance/Integration & Polish

- [ ] T090 [P] Communication preference management (preferred language, preferred channel, communication frequency, quiet hours, notification categories, marketing consent, transactional consent) (FR-047)
- [ ] T091 Article VI consent enforcement across all retention/lifecycle/renewal/win-back automation with immediate withdrawal propagation to in-flight journeys, wired to T026-style gate pattern (FR-048)
- [ ] T092 RBAC, consent management, audit logs, encryption, permission policies, workflow approvals, data-retention policies, customer privacy controls (FR-049)
- [ ] T093 Sensitive customer data masking where appropriate (FR-050)
- [ ] T094 Integration-framework wiring across the 16 named systems (CRM, CDP, Lead Management, Marketing Automation, AI Marketing Assistant, Email/SMS/WhatsApp/Push, Membership, Community, Referral, Rewards, Payment Gateway, Analytics, Support) (FR-051)
- [ ] T095 Cross-system lifecycle-event synchronization meeting the stated performance targets (FR-052)
- [ ] T096 Performance hardening pass toward remaining numeric targets (FR-053)
- [ ] T097 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (FR-024's Article VIII tension as highest priority, win-back re-entry/cooldown, points-ledger negative-balance policy reconciled with `006`, Health Score hysteresis, cross-module signal precedence, concurrent-journey deconfliction, churn-outage fallback reconciled with `040`)
- [ ] T098 Final audit: cross-check every FR-001–FR-053 against an implementation or validation task; verify gamification mechanics are consumed from `006` rather than redefined, and churn-modeling depth is deferred to `040`
- [ ] T099 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `001`/`016`'s RBAC, `006`'s gamification state, `008`'s AI gateway, and upstream activity events, and produces the entity infrastructure every subsequent phase depends on.
- **P1 stories (US1–US3)**: US1 (lifecycle) is the foundational customer state every other capability reads from or writes to and must ship first; US2 (Health Score) and US3 (churn prediction) both depend on US1's lifecycle signals and can build in parallel once US1 is stable, though US3's retention recommendations are most useful once US2's Health Score is also live.
- **P2 stories (US4–US6)**: US4 (loyalty), US5 (win-back), and US6 (rule configuration) all depend on US1's lifecycle infrastructure; US5 additionally depends on US2's Health Score/inactivity signals; US6 depends on US1's Lifecycle Rule entity and extends it to loyalty/tier rules — all three can build in parallel.
- **P3 story (US7)** depends on US1–US6 producing real operational data to display and should land last among the numbered stories.
- **Phase 10 (Retention Journeys/Renewal/Referral/Segmentation/Gamification/Feedback remainder)** depends on Foundational and US1; US4/US5 depend on parts of it (customer journeys, engagement scores), so it should land alongside or just before those stories.
- **Polish (Phase 11)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, gamification/churn scope-boundary notes) → **STOP and VALIDATE** the three Foundational contract tests (lifecycle-transition-timestamped-realtime, loyalty-ledger-immutability, ai-retention-action-approval-gate) pass → US1 (lifecycle progression) → **STOP and VALIDATE** a customer can be tracked end to end through automatic stage transitions → US2 (Health Score) + US3 (churn prediction) in parallel → **STOP and VALIDATE** the early-warning signals are trustworthy → US4 (loyalty) + US5 (win-back) + US6 (rule configuration) in parallel → US7 (executive dashboard) → Phase 10 (journeys/renewal/referral/segmentation/gamification/feedback) → Polish.
