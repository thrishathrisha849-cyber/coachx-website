---
description: "Task list for Feature 039 — Enterprise Customer Journey Analytics & Path Analysis"
---

# Tasks: Enterprise Customer Journey Analytics & Path Analysis

**Input**: Design documents from `/specs/039-customer-journey-analytics/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 034, 040, 044, and the "Customer Journey" entity cluster spanning 022/027/032/037), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `034`'s Raw Event stream/Customer Identity Service and `008`'s AI gateway exist as integration points.

**Tests**: Included throughout — sub-2-second journey reconstruction, 100% replay masking, and correct 9-way path classification each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-007, and SC-006.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus two supplementary cross-cutting phases for FR groups not owned by any single prioritized story (touchpoint/cross-channel/cross-device, AI assistant, personalization/segmentation; dashboards/APIs/security polish).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor reused via `016`), and that `034`'s Raw Event stream/Customer Identity Service and `008`'s AI gateway exist as integration points
- [ ] T002 Resolve `research.md` open items before proceeding: gap-handling/partial-reconstruction policy, identity-resolution confidence policy for weak-signal device linkage, replay masking fail-closed behavior for newly introduced sensitive-field types, Health Score weighting/conflict-resolution rule, Looping-Path/Dead-End-Path distinction thresholds, predictive cold-start behavior, and the concurrency/load envelope for the stated performance targets
- [ ] T003 [P] Add `backend/src/modules/{journey-reconstruction,funnel-intelligence,path-analysis,touchpoint-cross-channel,journey-scoring,friction-intelligence,experience-optimization-ai,predictive-journey-analytics,journey-personalization-segmentation,journey-replay-heatmaps,journey-dashboards-api}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Journey` entity in `backend/src/modules/journey-reconstruction/journey.entity.ts` — the fifth "Customer Journey"-flavored entity on the platform, a UX/product-analytics reconstruction distinct from `027`'s/`032`'s/`037`'s
- [ ] T005 [P] Define the `Journey Stage` entity in `backend/src/modules/journey-reconstruction/journey-stage.entity.ts`
- [ ] T006 [P] Define the `Event` entity in `backend/src/modules/journey-reconstruction/event.entity.ts` — a consumed view into `034`'s Raw Event
- [ ] T007 [P] Define the `Session` entity in `backend/src/modules/journey-reconstruction/session.entity.ts`
- [ ] T008 [P] Define the `Funnel` entity in `backend/src/modules/funnel-intelligence/funnel.entity.ts`
- [ ] T009 [P] Define the `Identity` entity in `backend/src/modules/journey-reconstruction/identity.entity.ts` — a consumed view into `034`'s Customer Identity Service
- [ ] T010 [P] Define the `Path` entity in `backend/src/modules/path-analysis/path.entity.ts`
- [ ] T011 [P] Define the `Touchpoint` entity in `backend/src/modules/touchpoint-cross-channel/touchpoint.entity.ts`
- [ ] T012 [P] Define the `Journey Score` entity in `backend/src/modules/journey-scoring/journey-score.entity.ts`
- [ ] T013 [P] Define the `Friction Signal` entity in `backend/src/modules/friction-intelligence/friction-signal.entity.ts`
- [ ] T014 [P] Define the `Journey Replay` entity in `backend/src/modules/journey-replay-heatmaps/journey-replay.entity.ts`
- [ ] T015 [P] Define the `Heatmap` entity in `backend/src/modules/journey-replay-heatmaps/heatmap.entity.ts`
- [ ] T016 [P] Define the `Predictive Journey Forecast` entity in `backend/src/modules/predictive-journey-analytics/predictive-journey-forecast.entity.ts`
- [ ] T017 Note: this feature consumes `034`'s Raw Event stream and Customer Identity Service; no second ingestion/identity-resolution engine is built (per plan.md §1)
- [ ] T018 Note: predictive churn/purchase forecasts here are lightweight; deep churn modeling is deferred to `040`, broader CX/journey/success workflows to `044` (per plan.md §2)
- [ ] T019 Note: this feature's `Journey` entity is a UX/product-analytics reconstruction, distinct in purpose from but built on the same `034` event substrate as `027`'s/`032`'s/`037`'s Customer-Journey-flavored entities — the fifth such instance, flagged not merged (per plan.md §3)
- [ ] T020 Contract test: journey reconstruction for a requested customer completes in under 2 seconds, in `backend/tests/contract/journey-reconstruction-under-2-seconds.contract.test.ts` (SC-001)
- [ ] T021 Contract test: zero unmasked sensitive data appears across Journey Replay sessions, in `backend/tests/contract/replay-masking-100-percent.contract.test.ts` (FR-029, SC-007)
- [ ] T022 Contract test: path analysis correctly categorizes journeys across all 9 defined path types, in `backend/tests/contract/path-classification-all-9-types.contract.test.ts` (FR-013, SC-006)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Reconstruct the Complete Customer Journey ("Digital Twin") (Priority: P1) 🎯 MVP

**Independent Test**: Generate a sequence of events for a single customer across at least two identity states and two touchpoints, then confirm the system returns one unified, chronologically ordered timeline within the 2-second reconstruction target.

- [ ] T023 [US1] Continuous capture/reconstruct/analyze/optimize pipeline combining behavioral/event/attribution/marketing/transactional/AI data, wired to T017's reuse note (FR-001)
- [ ] T024 [US1] Automatic complete-journey reconstruction from captured events, wired to T004, acceptance scenario 1 (FR-002)
- [ ] T025 [US1] Journey Intelligence Graph representation of every interaction (FR-003)
- [ ] T026 [US1] 10-stage lifecycle tracking with measurable KPIs, wired to T005 (FR-004)
- [ ] T027 [US1] 12-component journey-intelligence architecture shell (FR-005)
- [ ] T028 [US1] 20-event-type generation for meaningful interactions, wired to T006 (FR-006)
- [ ] T029 [US1] Chronological timestamped timeline maintenance, wired to acceptance scenario 1 (FR-007)
- [ ] T030 [US1] 7-identifier identity resolution merging anonymous and known activity, wired to T009, acceptance scenario 2 (FR-008)
- [ ] T031 [US1] Session grouping with 9 aggregate metrics, wired to T007, acceptance scenario 3 (FR-009)
- [ ] T032 [US1] Sub-2-second reconstruction performance, wired to T020's contract test, acceptance scenario 4
- [ ] T033 [P] [US1] Journey timeline / digital-twin UI
- [ ] T034 [US1] Integration test: a multi-event single session produces a chronological timeline, anonymous and logged-in activity merge under a single identity, multi-day activity groups into sessions with full metrics, reconstruction completes under 2 seconds — all 4 acceptance scenarios in `backend/tests/integration/us1-journey-reconstruction.integration.test.ts`

**Checkpoint**: The foundational "digital twin" every other capability in this chapter is computed on top of is independently functional.

---

## Phase 4: User Story 2 — Funnel Intelligence and Drop-off Detection (Priority: P1)

**Independent Test**: Feed a known funnel step sequence with a deliberate drop-off point and confirm the system reports accurate Entries/Exits/Completion Rate/Drop-off Rate per step, and flags the drop-off step when failure-pattern events are injected.

- [ ] T035 [US2] Automatic funnel building from defined step sequences, wired to T008, acceptance scenario 1 (FR-010)
- [ ] T036 [US2] 9-metric per-step funnel calculation (Visitors, Entries, Exits, Completion Rate, Drop-off Rate, Average Time, Revenue, Device Split, Channel Split), wired to acceptance scenario 1 (FR-011)
- [ ] T037 [US2] AI drop-off-cause identification (8 cause types), wired to acceptance scenario 2 (FR-012)
- [ ] T038 [US2] Independent multi-funnel calculation and reporting, wired to acceptance scenario 3 (FR-010 tie-in)
- [ ] T039 [P] [US2] Funnel/drop-off dashboard UI
- [ ] T040 [US2] Integration test: a funnel calculates all 9 metrics per step, a sudden exit spike is flagged with likely causes, two funnels are reported independently with their own KPI sets — all 3 acceptance scenarios in `backend/tests/integration/us2-funnel-drop-off-detection.integration.test.ts`

**Checkpoint**: The most immediate, actionable lever for conversion optimization is independently functional.

---

## Phase 5: User Story 3 — Path Analysis (Common, Fastest, Highest-Revenue, Looping, Dead-End Paths) (Priority: P2)

**Independent Test**: Generate multiple simulated customer journeys with known, distinct paths and confirm the system correctly labels each into its respective category.

- [ ] T041 [US3] 9-category path classification, wired to T010, acceptance scenario 1 (FR-013)
- [ ] T042 [US3] Per-node conversion measurement along analyzed paths, wired to acceptance scenario 2 (FR-014)
- [ ] T043 [US3] Looping-path detection (same-node revisit without progression), wired to T022's contract test, acceptance scenario 3 (FR-013 tie-in)
- [ ] T044 [US3] Dead-end/abandoned-path detection (activity cessation without conversion), wired to acceptance scenario 4 (FR-013 tie-in)
- [ ] T045 [US3] Visual customer journey map (nodes and edges) (FR-015)
- [ ] T046 [P] [US3] Path analysis / journey map UI
- [ ] T047 [US3] Integration test: a journey population is classified across all 9 path types, conversion is measured at every node, a repeated node revisit is classified Looping, activity cessation is classified Dead-End/Abandoned — all 4 acceptance scenarios in `backend/tests/integration/us3-path-analysis.integration.test.ts`

**Checkpoint**: The comparative, decision-ready intelligence turning raw journeys into actionable direction is independently functional.

---

## Phase 6: User Story 4 — Journey Scoring Across 7 Dimensions (Priority: P2)

**Independent Test**: Run scoring against a known-good journey and a known-poor journey and confirm the two receive materially different scores across all 7 dimensions.

- [ ] T048 [US4] 7-dimension score computation (Engagement, Conversion, Friction, Retention, Loyalty, Revenue, Health), wired to T012, acceptance scenario 1 (FR-019)
- [ ] T049 [US4] Health Score derivation from 8 signal inputs (Session Quality, Feature Adoption, Learning Progress, Community Activity, Purchase History, Support Requests, Satisfaction, Retention), wired to acceptance scenario 2 (FR-020)
- [ ] T050 [US4] Directionally-consistent score differentiation across differing behavior profiles, wired to acceptance scenario 3
- [ ] T051 [P] [US4] Journey score display UI
- [ ] T052 [US4] Integration test: a fully reconstructed journey returns all 7 scores, the Health Score reflects its 8 input signals, differing behavior profiles produce directionally consistent score differences — all 3 acceptance scenarios in `backend/tests/integration/us4-journey-scoring.integration.test.ts`

**Checkpoint**: The high-value summarization layer used across Executive/Marketing/Product/CS dashboards is independently functional.

---

## Phase 7: User Story 5 — Friction Intelligence (Rage Clicks, OTP Failures, Navigation Loops, Form Errors) (Priority: P2)

**Independent Test**: Inject a known friction pattern into a session's event stream and confirm the system flags both a click-pattern friction signal and an OTP-failure friction signal against that session.

- [ ] T053 [US5] 8-signal friction detection (rage clicks, navigation loops, search failures, form errors, OTP failures, payment retries, session timeouts, loading delays), wired to T013, acceptance scenario 1 (FR-021)
- [ ] T054 [US5] OTP-failure-pattern flagging, wired to acceptance scenario 2
- [ ] T055 [US5] Navigation-loop flagging (same-sequence revisit without progress), wired to acceptance scenario 3
- [ ] T056 [US5] Experience Optimization Engine recommendation generation (simplifying forms, removing unnecessary steps, faster pages, better CTAs/recommendations/onboarding/notifications) from detected friction, wired to acceptance scenario 4 (FR-022)
- [ ] T057 [P] [US5] Friction signal review UI
- [ ] T058 [US5] Integration test: rapid repeated clicks are flagged as rage-click friction, repeated failed OTP attempts are flagged, a revisited navigation sequence is flagged as a loop, detected friction produces optimization recommendations — all 4 acceptance scenarios in `backend/tests/integration/us5-friction-intelligence.integration.test.ts`

**Checkpoint**: The specialized analytical layer feeding the Experience Optimization Engine is independently functional.

---

## Phase 8: User Story 6 — Journey Replay and Heatmaps With Mandatory Sensitive-Data Masking (Priority: P3)

**Independent Test**: Replay a session containing a captured sensitive field and confirm the replay UI renders that field masked while all non-sensitive interaction data replays correctly.

- [ ] T059 [US6] Full session replay (clicks, scrolls, searches, errors, purchases, navigation, device information) in original sequence, wired to T014, acceptance scenario 1 (FR-028)
- [ ] T060 [US6] Mandatory sensitive-information masking, never shown in cleartext, wired to T021's contract test, acceptance scenario 2 (FR-029)
- [ ] T061 [US6] Non-sensitive interaction data replays correctly alongside masked fields
- [ ] T062 [US6] 4-type heatmap generation (Click, Scroll, Hover, Attention), wired to T015, acceptance scenario 3 (FR-030)
- [ ] T063 [P] [US6] Session replay / heatmap viewer UI
- [ ] T064 [US6] Integration test: replay reconstructs the full interaction sequence, a sensitive field is masked and never shown in cleartext, page-level heatmaps render all 4 types — all 3 acceptance scenarios in `backend/tests/integration/us6-journey-replay-heatmaps.integration.test.ts`

**Checkpoint**: The high-value diagnostic tool carrying the platform's most explicit privacy obligation is independently functional.

---

## Phase 9: User Story 7 — Predictive Journey Analytics (Churn, Purchase, and Engagement Likelihood) (Priority: P3)

**Independent Test**: Run the prediction model against a journey with a historical pattern strongly correlated with a known outcome and confirm the system returns a directionally correct likelihood score against a held-out validation set.

- [ ] T065 [US7] 6-type predictive forecast (Likelihood to Purchase, Likelihood to Churn, Membership Probability, Course Completion Probability, Community Engagement Probability, Referral Probability), wired to T016 and `008`'s gateway, acceptance scenario 1 (FR-025)
- [ ] T066 [US7] Course-Completion and Community-Engagement probability for actively-engaged customers, wired to acceptance scenario 2
- [ ] T067 [US7] Advisory-only presentation to human operators, never an automatically executed action, wired to acceptance scenario 3 (Constitution Article II)
- [ ] T068 [P] [US7] Predictive journey forecast UI
- [ ] T069 [US7] Integration test: an in-progress journey returns purchase and churn likelihood, an engaged customer returns completion and engagement probability, a high-churn prediction is presented as advisory rather than automatic — all 3 acceptance scenarios in `backend/tests/integration/us7-predictive-journey-analytics.integration.test.ts`

**Checkpoint**: The forward-looking capstone capability built on the descriptive layers above is independently functional.

---

## Phase 10: Touchpoint/Cross-Channel/Cross-Device, AI Assistant & Personalization/Segmentation remainder (supports FR-016–FR-018, FR-023–FR-024, FR-026–FR-027; cross-cutting, no single owning story)

- [ ] T070 12-touchpoint performance scoring, wired to T011 and T017's reuse note (FR-016)
- [ ] T071 Cross-channel transition identification (e.g., Facebook Ad → Website → Email → App → Purchase) (FR-017)
- [ ] T072 Cross-device journey tracking (Desktop, Tablet, Mobile, App); Smart TV/Voice Assistant explicitly out of scope per source (FR-018)
- [ ] T073 AI Journey Assistant answering 5 example operational question types, consuming `008`'s gateway (FR-023)
- [ ] T074 AI-recommendation human-review requirement, never auto-executed (FR-024)
- [ ] T075 Journey-stage-based personalization (Homepage, Recommendations, Courses, Podcasts, Notifications, Emails, Offers, Community Feed) (FR-026)
- [ ] T076 8-segment journey grouping (New Visitors, Returning Visitors, Premium Members, High Value Customers, Dormant Users, Active Learners, Community Leaders, At Risk Customers) (FR-027)

**Checkpoint**: The touchpoint/channel/device intelligence and personalization/segmentation surface rounding out full journey coverage is independently functional.

---

## Phase 11: Dashboards/APIs/Security & Polish

- [ ] T077 [P] 7 role-oriented dashboards (Executive, Marketing, Product, Customer Success, Community, Learning, Revenue) (FR-031)
- [ ] T078 8 Journey APIs (Get Journey, Get Session, Get Funnel, Get Path, Get Drop-off, Get Score, Get Events, Get Touchpoints) (FR-032)
- [ ] T079 Security/compliance controls (encryption, RBAC, audit logs, consent, data masking, GDPR support, retention policies), wired to `001`/`016` (FR-033)
- [ ] T080 Performance hardening pass toward the remaining numeric targets (live events under 1s, dashboards under 3s, API queries under 500ms)
- [ ] T081 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (gap-handling policy, identity-confidence policy, replay masking fail-closed behavior, Health Score conflict-resolution rule, Looping/Dead-End thresholds, predictive cold-start behavior, concurrency/load envelope)
- [ ] T082 Final audit: cross-check every FR-001–FR-033 against an implementation or validation task; verify Event/Identity are consumed from `034` rather than re-ingested/re-resolved, and predictive/CX-workflow depth is deferred to `040`/`044`
- [ ] T083 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `034`'s event/identity substrate and `008`'s AI gateway, and produces the entity infrastructure every subsequent phase depends on.
- **P1 stories (US1–US2)**: US1 (journey reconstruction) is the foundational "digital twin" every other capability computes on top of and must ship first; US2 (funnel intelligence) depends on US1's reconstructed events and can build immediately after.
- **P2 stories (US3–US5)**: US3 (path analysis) depends on US1's reconstruction and US2's funnel infrastructure; US4 (journey scoring) and US5 (friction intelligence) both depend on US1's reconstructed journey and can build in parallel with US3.
- **P3 stories (US6–US7)**: US6 (replay/heatmaps) depends on US1's event/session data; US7 (predictive analytics) depends on US1–US5's historical journey/score/friction data as model inputs — both should follow the P1/P2 stories and can build in parallel.
- **Phase 10 (Touchpoint/Cross-Channel/AI Assistant/Personalization)** depends on Foundational and US1; can build in parallel with the P2/P3 stories.
- **Polish (Phase 11)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (journey-reconstruction-under-2-seconds, replay-masking-100-percent, path-classification-all-9-types) pass → US1 (journey reconstruction) → **STOP and VALIDATE** the digital twin is accurate and fast → US2 (funnel intelligence) → US3 (path analysis) + US4 (journey scoring) + US5 (friction intelligence) in parallel → **STOP and VALIDATE** the descriptive analytics layer is trustworthy → US6 (replay/heatmaps) + US7 (predictive analytics) in parallel → Phase 10 (touchpoint/AI assistant/personalization) → Polish.
