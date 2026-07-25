---
description: "Task list for Feature 040 — Enterprise Retention Intelligence & Churn Prediction"
---

# Tasks: Enterprise Retention Intelligence & Churn Prediction

**Input**: Design documents from `/specs/040-retention-intelligence-churn-prediction/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Feature 029 and the Customer Health Score entity cluster), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `006`'s/`029`'s shared loyalty-points ledger and `008`'s AI gateway exist as extension/integration points.

**Tests**: Included throughout — involuntary-churn payment-recovery routing, Discount Governance enforcement, and treatment-minus-holdout incremental-retention calculation each get a dedicated Foundational contract test, matching this spec's own SC-003, SC-005, and SC-006.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus three supplementary cross-cutting phases for FR groups not owned by any single prioritized story (this feature has 115 FRs across only 8 stories, so a large share of requirement volume sits outside story ownership by design).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor reused via `016`), and that `006`'s/`029`'s shared loyalty-points ledger and `008`'s AI gateway exist as extension/integration points
- [ ] T002 Resolve `research.md` open items before proceeding: multi-churn-type simultaneous-precedence rule, false-positive/false-negative cost-tradeoff policy, rapid-decline-alert-vs-journey-trigger relationship, fatigue-suppression-vs-critical-SLA precedence, negative-current-value-vs-High-Potential classification resolution, and the fourth/fifth "Customer Health Score" naming instance across `029`/`034`/`035`/`040`
- [ ] T003 [P] Add `backend/src/modules/{churn-classification,customer-health-score,early-warning-detection,churn-prediction-engine,retention-segmentation-journeys,payment-recovery-service,cancellation-pause-offers,retention-decision-engine,retention-holdout-experiments,customer-reactivation,loyalty-system,customer-lifetime-value,customer-success-prioritization,communication-fatigue-contact-policy,ai-retention-assistant,retention-economics-reporting,cohort-survival-analytics,retention-governance-model-quality}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Churn Type` entity in `backend/src/modules/churn-classification/churn-type.entity.ts`
- [ ] T005 [P] Define the `Churn Category` entity in `backend/src/modules/churn-classification/churn-category.entity.ts`
- [ ] T006 [P] Define the `Churn Reason` entity in `backend/src/modules/churn-classification/churn-reason.entity.ts`
- [ ] T007 [P] Define the `Customer Health Score` entity in `backend/src/modules/customer-health-score/customer-health-score.entity.ts` — the fourth/fifth independently-specified instance alongside `029`/`034`/`035`
- [ ] T008 [P] Define the `Churn Prediction` entity in `backend/src/modules/churn-prediction-engine/churn-prediction.entity.ts`
- [ ] T009 [P] Define the `Risk Driver` entity in `backend/src/modules/churn-prediction-engine/risk-driver.entity.ts`
- [ ] T010 [P] Define the `Retention Segment` entity in `backend/src/modules/retention-segmentation-journeys/retention-segment.entity.ts`
- [ ] T011 [P] Define the `Retention Case` entity in `backend/src/modules/customer-success-prioritization/retention-case.entity.ts`
- [ ] T012 [P] Define the `Retention Decision / Intervention` entity in `backend/src/modules/retention-decision-engine/retention-decision.entity.ts`
- [ ] T013 [P] Define the `Discount Governance Rule` entity in `backend/src/modules/retention-decision-engine/discount-governance-rule.entity.ts`
- [ ] T014 [P] Define the `Retention Holdout Group` entity in `backend/src/modules/retention-holdout-experiments/retention-holdout-group.entity.ts`
- [ ] T015 [P] Define the `Membership Renewal` entity in `backend/src/modules/retention-segmentation-journeys/membership-renewal.entity.ts`
- [ ] T016 [P] Define the `Loyalty Account` entity in `backend/src/modules/loyalty-system/loyalty-account.entity.ts`
- [ ] T017 [P] Define the `Loyalty Tier` entity in `backend/src/modules/loyalty-system/loyalty-tier.entity.ts`
- [ ] T018 [P] Define the `Reward` entity in `backend/src/modules/loyalty-system/reward.entity.ts`
- [ ] T019 [P] Define the `CLV Category` entity in `backend/src/modules/customer-lifetime-value/clv-category.entity.ts`
- [ ] T020 [P] Define the `Lifetime Value Record` entity in `backend/src/modules/customer-lifetime-value/lifetime-value-record.entity.ts`
- [ ] T021 [P] Define the `Retention Model` entity in `backend/src/modules/retention-governance-model-quality/retention-model.entity.ts`
- [ ] T022 [P] Define the append-only `Loyalty Transaction` entity in `backend/src/modules/loyalty-system/loyalty-transaction.entity.ts` — extends `006`'s/`029`'s shared ledger per Constitution Article V
- [ ] T023 Implement the churn-reason taxonomy (17 primary categories with configurable subcategories), wired to T006 (FR-004)
- [ ] T024 Multi-source churn-reason collection (10 sources) (FR-005)
- [ ] T025 Customer-declared vs. system-inferred churn-reason distinction (FR-006)
- [ ] T026 Early Warning Detection Engine (15 significant-change signal types) (FR-012)
- [ ] T027 Behavioral warning-signal tracking (10 signals) (FR-013)
- [ ] T028 Financial and experience warning-signal tracking (11+11 signals) (FR-014)
- [ ] T029 Churn risk alert generation (10 fields, 6 delivery channels), wired to T009 (FR-015)
- [ ] T030 Alert prioritization (10 factors, value-can-outrank-risk logic) (FR-016)
- [ ] T031 Note: this feature extends `006`'s/`029`'s shared loyalty-points ledger; no second ledger is created (per plan.md §2)
- [ ] T032 Note: `029` consumes this feature's Churn Prediction Engine/Retention Decision Engine outputs per the established authority relationship; this feature does not redefine `029`'s lifecycle state machine (per plan.md §1)
- [ ] T033 Note: this feature's Customer Health Score is a fourth/fifth independently-specified instance alongside `029`/`034`/`035` — flagged, not merged (per plan.md §3)
- [ ] T034 Contract test: 100% of involuntary-churn events route to the payment-recovery workflow rather than a promotional retention journey, in `backend/tests/contract/involuntary-churn-payment-recovery-routing.contract.test.ts` (FR-003, SC-003)
- [ ] T035 Contract test: 100% of automated retention offers pass Discount Governance before delivery, with zero automated discounts to lifetime-exhausted or reason-irrelevant customers, in `backend/tests/contract/discount-governance-blocks-unauthorized-issuance.contract.test.ts` (FR-045–FR-046, SC-005)
- [ ] T036 Contract test: Incremental Retention is computed as treatment-minus-holdout retention rate, not raw treatment retention, in `backend/tests/contract/incremental-retention-treatment-minus-holdout.contract.test.ts` (FR-051, SC-006)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Seven Churn Types Each Route to a Tailored Response (Priority: P1) 🎯 MVP

**Independent Test**: Seed test customers with each of the seven churn signatures in isolation and confirm the system assigns the correct churn type to each.

- [ ] T037 [US1] 7 independent churn-type definitions with independent detectability, wired to T004, acceptance scenario 1 (FR-001)
- [ ] T038 [US1] Contractual-churn classification with Voluntary/Involuntary tagging, wired to acceptance scenario 1 (FR-001, FR-002 tie-in)
- [ ] T039 [US1] Behavioral-churn classification distinct from Contractual, wired to acceptance scenario 2 (FR-001)
- [ ] T040 [US1] Learning-churn classification distinct from Community/generic Behavioral, wired to acceptance scenario 3 (FR-001)
- [ ] T041 [US1] Communication-churn classification without triggering an unrelated membership-retention journey, wired to acceptance scenario 4 (FR-001)
- [ ] T042 [US1] 12-category churn-category classification (Voluntary, Involuntary, Full, Partial, Product-specific, Temporary/Seasonal Inactivity, Preventable/Unpreventable, Confirmed/Predicted/Silent), wired to T005 (FR-002)
- [ ] T043 [P] [US1] Churn-type classification review UI
- [ ] T044 [US1] Integration test: a cancellation is classified Contractual and Voluntary/Involuntary, an active-but-inactive customer is classified Behavioral not Contractual, course-specific disengagement is classified Learning, notification unsubscribe is classified Communication only — all 4 acceptance scenarios in `backend/tests/integration/us1-seven-churn-types.integration.test.ts`

**Checkpoint**: The foundational classification layer every downstream retention capability depends on is independently functional.

---

## Phase 4: User Story 2 — Voluntary vs. Involuntary Churn Routes Payment Failure to Recovery, Not Promotions (Priority: P1)

**Independent Test**: Simulate a payment-gateway failure and confirm the system creates a payment-recovery workflow instead of enrolling the customer in a discount/promotional retention journey.

- [ ] T045 [US2] Involuntary-churn routing (9 sub-causes) to the Payment Recovery Service rather than promotional journeys, wired to T034's contract test, acceptance scenario 1 (FR-003)
- [ ] T046 [US2] Voluntary-churn routing to standard cancellation-flow save actions, wired to acceptance scenario 2 (FR-002 tie-in)
- [ ] T047 [US2] Payment-failure-category-specific recovery workflows (9 categories), wired to acceptance scenario 3 (FR-033)
- [ ] T048 [US2] Smart Payment Retry timing (7 factors) with attempt-limit enforcement, wired to acceptance scenario 4 (FR-032)
- [ ] T049 [US2] Payment Recovery Service core (validation, pre-expiry reminders, smart retries, alternative methods, notifications, grace periods, payment links, billing-support tasks, recovery analytics) (FR-031)
- [ ] T050 [US2] Grace-period configurable access/reminder/restriction/support/pause policies (FR-034)
- [ ] T051 [P] [US2] Payment recovery workflow UI
- [ ] T052 [US2] Integration test: an insufficient-funds failure is classified Involuntary and enters recovery not a promotion, an explicit cancellation is classified Voluntary and routed to the cancellation flow, expired-card vs. bank-rejection get distinct recovery workflows, retry timing considers payment history/bank code/timezone/salary cycle with an attempt limit — all 4 acceptance scenarios in `backend/tests/integration/us2-voluntary-involuntary-payment-recovery.integration.test.ts`

**Checkpoint**: The safeguard preventing a wasteful, confusing "here's a discount" message to a customer whose card simply expired is independently functional.

---

## Phase 5: User Story 3 — Customer Health Score With Named Status Bands and Rapid-Decline Alerts (Priority: P1)

**Independent Test**: Seed a test customer's inputs to produce a score in each of the five bands, confirm correct labeling at each boundary, and simulate a sharp within-band decline to confirm a rapid-decline alert fires anyway.

- [ ] T053 [US3] 0–100 Health Score combining 11 input categories, wired to T007, acceptance scenario 1 (FR-007)
- [ ] T054 [US3] 7 named component scores, wired to acceptance scenario 3 (FR-008)
- [ ] T055 [US3] 5 named status bands with type-configurable thresholds, wired to acceptance scenarios 1, 4 (FR-009)
- [ ] T056 [US3] Trend tracking (current, previous, weekly change, monthly change, highest, lowest, positive drivers, negative drivers), wired to acceptance scenario 3 (FR-010)
- [ ] T057 [US3] Rapid-decline alert firing regardless of band membership, wired to acceptance scenario 2 (FR-011)
- [ ] T058 [P] [US3] Health Score display / trend UI
- [ ] T059 [US3] Integration test: a combined score of 34 is classified "At Risk," a 78-to-63 drop within the "Healthy" band triggers a rapid-decline alert, a profile view shows full trend data, type-specific thresholds produce different bands for the same raw score — all 4 acceptance scenarios in `backend/tests/integration/us3-health-score-bands-alerts.integration.test.ts`

**Checkpoint**: The primary early-warning signal every other retention capability reads from is independently functional.

---

## Phase 6: User Story 4 — Churn Prediction Engine Outputs Probability, Risk Level, and Explainable Drivers (Priority: P1)

**Independent Test**: Feed a test customer a known risk pattern and confirm the engine returns a probability, a risk level, and a driver list matching those inputs, with supporting events retrievable by an authorized user.

- [ ] T060 [US4] 7-window churn-probability estimation, wired to T008 (FR-017)
- [ ] T061 [US4] Full prediction-object fields (probability, risk level, window, drivers, confidence, model version, timestamp, review date), wired to acceptance scenario 2 (FR-018)
- [ ] T062 [US4] 6-level risk classification with multi-dimension configurable thresholds, wired to acceptance scenario 1 (FR-019)
- [ ] T063 [US4] Approved-input allowlist enforcement with sensitive-attribute restriction, wired to acceptance scenario 3 (FR-020)
- [ ] T064 [US4] Explainable plain-language driver list with drill-down to supporting events, wired to T009, acceptance scenario 1 (FR-021)
- [ ] T065 [US4] Multi-window distinct-prediction storage/display, wired to acceptance scenario 4
- [ ] T066 [P] [US4] Churn prediction / driver drill-down UI
- [ ] T067 [US4] Integration test: a known risk pattern produces a probability, risk level, and matching drivers, a prediction includes window/confidence/model-version/timestamp/review-date, a prohibited sensitive attribute is rejected unless approved, two prediction windows are stored and displayed as distinct — all 4 acceptance scenarios in `backend/tests/integration/us4-churn-prediction-engine.integration.test.ts`

**Checkpoint**: The platform's proactive core, with a responsible, never-black-box output, is independently functional.

---

## Phase 7: User Story 5 — Retention Decision Engine Treats "No Contact" as Valid and Enforces Discount Governance (Priority: P1)

**Independent Test**: Score a low-risk, high-satisfaction customer and confirm "No Contact" can be legitimately selected; attempt to issue an over-limit or ineligible discount and confirm Discount Governance blocks or requires approval.

- [ ] T068 [US5] 16-action Retention Decision Engine intervention scoring (11 factors), wired to T012 (FR-040–FR-041)
- [ ] T069 [US5] No-Contact first-class deliberate-decision recording, wired to acceptance scenario 1 (FR-042)
- [ ] T070 [US5] Pre-action eligibility verification (14 checks) (FR-043)
- [ ] T071 [US5] 5-category intervention grouping (Value Reinforcement, Friction Resolution, Engagement Recovery, Financial Support, Human Intervention) (FR-044)
- [ ] T072 [US5] Discount Governance enforcement (9 controls), wired to T013 and T035's contract test, acceptance scenarios 2–3 (FR-045)
- [ ] T073 [US5] No-default-discount-issuance rule, wired to acceptance scenario 3 (FR-046)
- [ ] T074 [US5] Offer-performance evaluation (9 metrics) preferring the lowest-cost effective intervention (FR-047)
- [ ] T075 [US5] Discount-cannot-substitute-for-unresolved-service-recovery rule, wired to acceptance scenario 4 (FR-048)
- [ ] T076 [P] [US5] Retention Decision Engine / Discount Governance review UI
- [ ] T077 [US5] Integration test: a healthy low-risk customer may receive No Contact as a deliberate decision, a support-related churn reason flags the discount as irrelevant and prioritizes escalation, lifetime offer exhaustion blocks automatic discount issuance requiring approval, an open complaint blocks a discount from substituting for service recovery — all 4 acceptance scenarios in `backend/tests/integration/us5-retention-decision-discount-governance.integration.test.ts`

**Checkpoint**: The governance-critical capability protecting margin from unconstrained discounting is independently functional.

---

## Phase 8: User Story 6 — Retention Holdout Groups Measure True Incremental Retention (Priority: P2)

**Independent Test**: Assign at-risk customers to a holdout group and a treatment group, then confirm reported incremental retention is the difference between the two groups' retention rates rather than the treatment group's raw rate.

- [ ] T078 [US6] Holdout/control-group support to isolate incremental intervention value, wired to T014, acceptance scenario 1 (FR-049)
- [ ] T079 [US6] 4-category outcome distinction (retained naturally, retained after intervention, intervention but still churned, would-have-stayed-anyway), wired to acceptance scenarios 2–3 (FR-050)
- [ ] T080 [US6] Incremental Retention calculation (treatment minus control), wired to T036's contract test, acceptance scenario 1 (FR-051)
- [ ] T081 [US6] 12-dimension experimentation support (message, channel, timing, etc.) (FR-052)
- [ ] T082 [US6] Primary-metric and guardrail-metric measurement (8+7 metrics), wired to acceptance scenario 4 (FR-053)
- [ ] T083 [P] [US6] Holdout experiment configuration/results UI
- [ ] T084 [US6] Integration test: incremental retention is computed as treatment-minus-holdout not raw, a holdout renewal is recorded as natural not intervention success, a treatment churn is recorded distinct from never-contacted, guardrails are reported alongside the primary metric — all 4 acceptance scenarios in `backend/tests/integration/us6-retention-holdout-groups.integration.test.ts`

**Checkpoint**: The measurement-integrity capability preventing retention programs from systematically overstating their own value is independently functional.

---

## Phase 9: User Story 7 — Loyalty Tiers With Points, Rewards, and Fraud Detection (Priority: P2)

**Independent Test**: Credit a test customer's points ledger through a qualifying activity, confirm tier progression recalculates, then simulate a fraud pattern and confirm the activity is flagged and held rather than silently rewarded.

- [ ] T085 [US7] 6-dimension loyalty measurement (behavioral, emotional, financial, community, learning, advocacy) preventing automatic high-loyalty misclassification, wired to T016 (FR-058)
- [ ] T086 [US7] Loyalty Analytics Engine (13 measured signals) (FR-059)
- [ ] T087 [US7] 0–100 Loyalty Score calculation (10 inputs) (FR-060)
- [ ] T088 [US7] Configurable Loyalty Tiers (7 example tiers), wired to T017 (FR-061)
- [ ] T089 [US7] Tier-qualification logic (9 inputs), transparent and documented, wired to acceptance scenario 2 (FR-062)
- [ ] T090 [US7] Configurable loyalty benefits (11 types) (FR-063)
- [ ] T091 [US7] TBT Points award for 8 approved behaviors only, extending `006`'s/`029`'s shared ledger per T031's reuse note, wired to acceptance scenario 1 (FR-064)
- [ ] T092 [US7] 5 point-expiration models with advance notification (FR-065)
- [ ] T093 [US7] Reward catalog and 8-step redemption flow, wired to T018, acceptance scenario 4 (FR-066)
- [ ] T094 [US7] 9-pattern loyalty-fraud detection with review-hold, wired to T031's reuse note, acceptance scenario 3 (FR-067)
- [ ] T095 [US7] Advocacy identification (8 signals) plus 4 advocacy scores, excluding referral requests during unresolved negative experiences (FR-068)
- [ ] T096 [P] [US7] Loyalty tier/points/reward/fraud UI
- [ ] T097 [US7] Integration test: course completion awards points within limits and recalculates tier progress, a tier-threshold crossing updates the tier with inspectable qualification logic, a rapid self-referral pattern is flagged and held for review, a redemption flow follows the 8-step order before completing — all 4 acceptance scenarios in `backend/tests/integration/us7-loyalty-tiers-points-fraud.integration.test.ts`

**Checkpoint**: The revenue- and program-integrity-protecting loyalty layer is independently functional.

---

## Phase 10: User Story 8 — Customer Lifetime Value Split Into Historical, Current, and Predicted, With a High-Potential-Customer Category (Priority: P2)

**Independent Test**: Compute Historical LTV from actual past transactions and Predicted LTV from behavioral inputs, confirm both are stored and displayed separately, and confirm a new customer with strong engagement but minimal history is classified "High Potential."

- [ ] T098 [US8] 7 distinct CLV calculation types, wired to T019 (FR-069)
- [ ] T099 [US8] Historical LTV computation (9 inputs), stored distinct from Predicted, wired to acceptance scenario 1 (FR-070)
- [ ] T100 [US8] Predicted LTV computation (12 inputs), stored separately without overwriting Historical, wired to acceptance scenario 2 (FR-071)
- [ ] T101 [US8] 9 distinct LTV components, never blended into one figure (FR-072)
- [ ] T102 [US8] 7-band LTV classification with current and future value displayed separately, wired to T020 (FR-073)
- [ ] T103 [US8] High-Potential-Customer identification (8 qualifying signals) avoiding undervaluation of limited-history customers, wired to acceptance scenario 3 (FR-074)
- [ ] T104 [US8] Revenue at Risk plus Retention Value Opportunity calculation with stated confidence/assumptions, wired to acceptance scenario 4 (FR-075)
- [ ] T105 [P] [US8] CLV / High-Potential customer dashboard UI
- [ ] T106 [US8] Integration test: Historical LTV is stored distinct from Predicted, Predicted LTV is computed separately without overwriting Historical, a new customer with strong engagement is classified High Potential not Low Value, the Revenue at Risk report includes confidence and assumptions — all 4 acceptance scenarios in `backend/tests/integration/us8-customer-lifetime-value.integration.test.ts`

**Checkpoint**: The valuation/prioritization layer underpinning customer-success attention and financial reporting is independently functional.

---

## Phase 11: Retention Segmentation/Journeys/Renewal, Cancellation/Pause/Offers & Reactivation remainder (supports FR-022–FR-030, FR-035–FR-039, FR-054–FR-057; cross-cutting, no single owning story)

- [ ] T107 16 retention segments, wired to T010 (FR-022)
- [ ] T108 9-stage retention lifecycle with cross-stage movement (FR-023)
- [ ] T109 Automated retention journey configuration (11 elements) (FR-024)
- [ ] T110 12 journey trigger types (FR-025)
- [ ] T111 10 journey exit conditions (FR-026)
- [ ] T112 Renewal prediction (9 outputs) (FR-027)
- [ ] T113 Configurable renewal-timeline stages (8 stages, plan-specific), wired to T015 (FR-028)
- [ ] T114 Renewal Readiness Score (10 inputs) (FR-029)
- [ ] T115 Renewal-experience display (11 elements) with no misleading urgency/hidden terms, plus auto-renewal/payment-method/cancellation self-service with audit logging (FR-030)
- [ ] T116 Cancellation flow (display, reason collection, offer, unobstructed confirmation, reactivation instructions) without deceptive barriers (FR-035)
- [ ] T117 Reason-relevant cancellation save actions (9 options) (FR-036)
- [ ] T118 Membership pause (8 configurable parameters) (FR-037)
- [ ] T119 Membership downgrade offer (6 disclosure elements) (FR-038)
- [ ] T120 9 configurable retention-offer types with 7-factor availability governance (FR-039)
- [ ] T121 Reactivation eligibility evaluation (11 factors) (FR-054)
- [ ] T122 10 reactivation segments (FR-055)
- [ ] T123 Reactivation journey (channel/timing selection, personalized message, positive-response re-onboarding with 30-day monitoring, no-response cooldown) (FR-056)
- [ ] T124 9-element reactivated-customer welcome experience (FR-057)

**Checkpoint**: The segmentation/journey/renewal/cancellation/pause/reactivation surface rounding out full retention-lifecycle coverage is independently functional.

---

## Phase 12: Customer Success Prioritization, Fatigue/Contact Policy, AI Assistant & Retention Economics/Cohort/Survival remainder (supports FR-076–FR-101; cross-cutting, no single owning story)

- [ ] T125 Prioritized Customer Success work queues (12 fields), wired to T011 (FR-076)
- [ ] T126 Customer Success Workbench (16 elements) (FR-077)
- [ ] T127 Contact-attempt/outcome recording (9 fields) (FR-078)
- [ ] T128 Automatic retention-task creation (8 trigger conditions) (FR-079)
- [ ] T129 Configurable SLA response targets by case type/severity (5 example targets) (FR-080)
- [ ] T130 Retention communication-fatigue score (8 signal inputs) with reduce/stop-communication response (FR-081)
- [ ] T131 10-dimension contact policy enforcement (FR-082)
- [ ] T132 Multilingual retention content (Tamil, English, Thanglish, plus configured) with regional/tone adaptation (FR-083)
- [ ] T133 AI Retention Assistant natural-language Q&A (6 example question types), consuming `008`'s gateway (FR-084)
- [ ] T134 AI risk-summary generation (4 elements) (FR-085)
- [ ] T135 AI recommendation structure (10 elements) with reasoning and confidence (FR-086)
- [ ] T136 AI churn root-cause analysis (4 output types, 7 correlated-factor categories) (FR-087)
- [ ] T137 High-impact-recommendation full disclosure (8 elements) (FR-088)
- [ ] T138 Retention/renewal/churn/reactivation/LTV/ROI forecasting (10 targets) plus 11-scenario planning (FR-090)
- [ ] T139 Retention economics calculation (11 metrics) (FR-091)
- [ ] T140 Retention ROI formula implementation (FR-092)
- [ ] T141 Loyalty-program economics tracking (10 metrics) plus Reward Liability finance line item (5 fields), wired to T031's reuse note per Constitution Article V (FR-093)
- [ ] T142 Executive Retention Dashboard (15 metrics) (FR-094)
- [ ] T143 5 role-specific dashboards (Customer Success, Membership, Loyalty, Churn, Lifetime Value) (FR-095)
- [ ] T144 Enterprise metrics catalog (13 approved definitions) (FR-096)
- [ ] T145 Retention cohort grouping (11 dimensions) plus 7-metric per-cohort reporting (FR-097)
- [ ] T146 Retention curve display comparable across 8 dimensions (FR-098)
- [ ] T147 Survival analysis (6 outputs) plus churn-hazard-period identification (7 examples) (FR-099)
- [ ] T148 9-stage retention funnel with per-stage drop-off (FR-100)
- [ ] T149 Early-activation-indicator predictive analysis (7 indicators) (FR-101)

**Checkpoint**: The customer-success operational, fatigue-governance, AI-advisory, economics, and cohort/survival analytics layer rounding out full retention-intelligence coverage is independently functional.

---

## Phase 13: Governance/RBAC/Privacy, Model Quality/Bias/Ethics & Security/Performance Polish

- [ ] T150 [P] Retention governance policy coverage (12 categories) (FR-102)
- [ ] T151 RBAC (14 roles) with granular permission controls, wired to `016` (FR-103)
- [ ] T152 Privacy controls (9 categories) (FR-104)
- [ ] T153 Model governance record (13 fields) per churn/retention/LTV model, wired to T021 (FR-105)
- [ ] T154 Model evaluation metrics (12 measures) with business-value consideration (FR-106)
- [ ] T155 Prediction-calibration monitoring over time (FR-107)
- [ ] T156 False-positive/false-negative harm monitoring with additional high-value-false-negative analysis (FR-108)
- [ ] T157 10-dimension model-drift monitoring with review/retrain trigger (FR-109)
- [ ] T158 Ethics/dark-pattern prohibition enforcement (10 rules), wired to Constitution Article III direct-citation compliance (FR-110)
- [ ] T159 Model-version/deployment-date recording on every prediction, wired to Constitution Article IV compliance (FR-111)
- [ ] T160 Security controls (9 categories) plus 13-category audit logging (FR-112)
- [ ] T161 Performance hardening pass toward all 7 numeric targets (FR-113)
- [ ] T162 Scalability requirements (10 categories) (FR-114)
- [ ] T163 Reliability infrastructure (10 mechanisms) plus 12-category error handling (FR-115)
- [ ] T164 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (multi-churn-type precedence, false-positive/negative tradeoff policy, rapid-decline-vs-journey-trigger relationship, fatigue-vs-critical-SLA precedence, negative-value-vs-High-Potential resolution, fourth/fifth Customer Health Score naming instance)
- [ ] T165 Final audit: cross-check every FR-001–FR-115 against an implementation or validation task; verify the loyalty ledger extends `006`'s/`029`'s rather than duplicating it, and `029`'s own churn/retention modeling defers to this feature's outputs
- [ ] T166 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `006`'s/`029`'s loyalty ledger and `008`'s AI gateway, and produces the entity/classification/early-warning infrastructure every subsequent phase depends on.
- **P1 stories (US1–US5)**: US1 (churn types) is the foundational classification layer and must ship first; US2 (voluntary/involuntary routing) depends on US1's classification; US3 (Health Score) is largely independent and can build in parallel; US4 (churn prediction) depends on US1–US3's classification/scoring signals; US5 (retention decision engine) depends on US4's predictions as an input to its intervention scoring.
- **P2 stories (US6–US8)**: US6 (holdout groups) depends on US5's decision engine already running; US7 (loyalty) and US8 (CLV) both depend on Foundational's entities and can build in parallel with US6 and each other.
- **Phase 11 (Segmentation/Journeys/Renewal/Cancellation/Reactivation)** depends on Foundational and US1–US5; should land alongside those stories since it supplies the journey/offer infrastructure they reference.
- **Phase 12 (Customer Success/Fatigue/AI Assistant/Economics/Cohort)** depends on US1–US8 producing real data to prioritize, govern, and report on.
- **Polish (Phase 13)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, churn-reason taxonomy, early warning detection) → **STOP and VALIDATE** the three Foundational contract tests (involuntary-churn-payment-recovery-routing, discount-governance-blocks-unauthorized-issuance, incremental-retention-treatment-minus-holdout) pass → US1 (churn types) → US2 (voluntary/involuntary routing) → **STOP and VALIDATE** every disengagement signal reaches the correct workflow → US3 (Health Score) + US4 (churn prediction) in parallel → US5 (retention decision engine) → **STOP and VALIDATE** the core proactive-retention/margin-protection mechanics are trustworthy → US6 (holdout groups) + US7 (loyalty) + US8 (CLV) in parallel → Phase 11 (segmentation/journeys/renewal/cancellation/reactivation) → Phase 12 (customer success/fatigue/AI assistant/economics/cohort) → Polish.
