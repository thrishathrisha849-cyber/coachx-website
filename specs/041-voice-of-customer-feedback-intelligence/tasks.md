---
description: "Task list for Feature 041 — Enterprise Voice of Customer, Feedback Intelligence & Advocacy Platform"
---

# Tasks: Enterprise Voice of Customer, Feedback Intelligence & Advocacy Platform

**Input**: Design documents from `/specs/041-voice-of-customer-feedback-intelligence/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 030, 008, and 013), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `030`'s referral-link/tracking/reward/fraud engine, `013`'s support-case system, and `008`'s AI gateway exist as delegation/integration points.

**Tests**: Included throughout — 12-stage NLP pipeline completeness, Critical-complaint auto-escalation, and no-critical-close-without-resolution each get a dedicated Foundational contract test, matching this spec's own SC-003, SC-004, and SC-005.

**Organization**: Tasks are grouped by user story (US1–US9 from spec.md), plus two supplementary cross-cutting phases for FR groups not owned by any single prioritized story (theme/keyword/intent/categorization, experience/trend, predictive analytics/AI recommendation/executive dashboard; Customer Success integration/security/governance/performance polish).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor reused via `016`), and that `030`'s referral/fraud engine, `013`'s support-case system, and `008`'s AI gateway exist as delegation/integration points
- [ ] T002 Resolve `research.md` open items before proceeding: sentiment-confidence review threshold, numeric performance thresholds ("noticeable delay"/"near real time"/dashboard threshold), feedback/PII data-retention period, survey-fatigue throttling rule, elevated-Advocate fraud-screening applicability, and the closed-loop-case reopen path
- [ ] T003 [P] Add `backend/src/modules/{voc-architecture-collection,survey-engine-builder,nlp-pipeline-sentiment,emotion-intelligence,theme-keyword-intelligence,intent-categorization,complaint-intelligence,experience-trend-analysis,root-cause-intelligence,predictive-feedback-analytics,ai-recommendation-executive,customer-advocacy-referral,brand-ambassador-program,reputation-analytics,cs-integration-closed-loop}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Survey` entity in `backend/src/modules/survey-engine-builder/survey.entity.ts`
- [ ] T005 [P] Define the `Survey Question` entity in `backend/src/modules/survey-engine-builder/survey-question.entity.ts`
- [ ] T006 [P] Define the `Feedback Response` entity in `backend/src/modules/voc-architecture-collection/feedback-response.entity.ts`
- [ ] T007 [P] Define the `NLP Processing Result` entity in `backend/src/modules/nlp-pipeline-sentiment/nlp-processing-result.entity.ts`
- [ ] T008 [P] Define the `Sentiment Score` entity in `backend/src/modules/nlp-pipeline-sentiment/sentiment-score.entity.ts`
- [ ] T009 [P] Define the `Emotion Detection` entity in `backend/src/modules/emotion-intelligence/emotion-detection.entity.ts`
- [ ] T010 [P] Define the `Emotion Timeline Entry` entity in `backend/src/modules/emotion-intelligence/emotion-timeline-entry.entity.ts`
- [ ] T011 [P] Define the `Theme` entity in `backend/src/modules/theme-keyword-intelligence/theme.entity.ts`
- [ ] T012 [P] Define the `Complaint` entity in `backend/src/modules/complaint-intelligence/complaint.entity.ts`
- [ ] T013 [P] Define the `Experience Score` entity in `backend/src/modules/experience-trend-analysis/experience-score.entity.ts`
- [ ] T014 [P] Define the `Root Cause` entity in `backend/src/modules/root-cause-intelligence/root-cause.entity.ts`
- [ ] T015 [P] Define the `Trend Record` entity in `backend/src/modules/experience-trend-analysis/trend-record.entity.ts`
- [ ] T016 [P] Define the `Predictive Forecast` entity in `backend/src/modules/predictive-feedback-analytics/predictive-forecast.entity.ts`
- [ ] T017 [P] Define the `Advocacy Readiness Score` entity in `backend/src/modules/customer-advocacy-referral/advocacy-readiness-score.entity.ts`
- [ ] T018 [P] Define the `Advocacy Status` entity in `backend/src/modules/customer-advocacy-referral/advocacy-status.entity.ts`
- [ ] T019 [P] Define the `Referral` entity in `backend/src/modules/customer-advocacy-referral/referral.entity.ts`
- [ ] T020 [P] Define the `Brand Ambassador` entity in `backend/src/modules/brand-ambassador-program/brand-ambassador.entity.ts`
- [ ] T021 [P] Define the `Closed-Loop Case` entity in `backend/src/modules/cs-integration-closed-loop/closed-loop-case.entity.ts`
- [ ] T022 [P] Define the `Reputation Score` entity in `backend/src/modules/reputation-analytics/reputation-score.entity.ts`
- [ ] T023 [P] Define the `Reputation Risk Alert` entity in `backend/src/modules/reputation-analytics/reputation-risk-alert.entity.ts`
- [ ] T024 [P] Define the `AI Recommendation` entity in `backend/src/modules/ai-recommendation-executive/ai-recommendation.entity.ts`
- [ ] T025 [P] Define the `Executive Report` entity in `backend/src/modules/ai-recommendation-executive/executive-report.entity.ts`
- [ ] T026 Implement the 5-layer VoC architecture shell (Feedback Sources, Collection, Intelligence, Action, Reporting) (FR-001)
- [ ] T027 Collection Layer (receive, validate, deduplicate, spam-detect, identity-map, session-link, timestamp), wired to T006 (FR-002)
- [ ] T028 Intelligence Layer processing shell (AI, NLP, sentiment, theme, classification, priority), wired to `008`'s gateway (FR-003)
- [ ] T029 Action Layer automatic-action creation (Improvement Tasks, Product Requests, Support Escalations, CS Actions, Marketing Campaigns, Executive Alerts) (FR-004)
- [ ] T030 Reporting Layer role-oriented dashboards (Management, Marketing, CS, Product, Operations, Executive) (FR-005)
- [ ] T031 Cross-lifecycle-stage opinion measurement (11 stages) (FR-006)
- [ ] T032 10-stage standardized feedback lifecycle (FR-007)
- [ ] T033 3-category source acceptance (direct, passive, external) (FR-008)
- [ ] T034 Omnichannel submission consolidation into a single repository (11 channels) (FR-009)
- [ ] T035 Note: referral-link generation/tracking/reward issuance and referral-fraud detection are delegated to `030`'s existing engine; this feature only identifies/scores advocacy candidates (per plan.md §1)
- [ ] T036 Note: Critical-complaint case creation delegates to `013`'s existing support-case system; no second ticketing system is built (per plan.md §3)
- [ ] T037 Note: NLP/sentiment/emotion/recommendation pipelines consume `008`'s AI gateway, not a separate AI stack (per plan.md §2)
- [ ] T038 Contract test: every feedback item passes through all 12 NLP pipeline stages in order with each stage logged, in `backend/tests/contract/twelve-stage-pipeline-completeness.contract.test.ts` (FR-027–FR-028, SC-003)
- [ ] T039 Contract test: 100% of Critical-severity complaints automatically create a support case, notify team/CS/admin, and record an audit entry without a manual trigger, in `backend/tests/contract/critical-complaint-auto-escalation.contract.test.ts` (FR-041, SC-004)
- [ ] T040 Contract test: zero Critical complaints are closed without a documented resolution or an approved exception, in `backend/tests/contract/no-critical-close-without-resolution.contract.test.ts` (FR-084, SC-005)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Event-Triggered CSAT/NPS/CES Survey Capture (Priority: P1) 🎯 MVP

**Independent Test**: Fire a ticket-resolution event, confirm a CSAT survey is triggered, submit a response, and verify the CSAT score is recorded against the correct department/team/product with an updated trend.

- [ ] T041 [US1] CSAT trigger on 6 key-interaction types, wired to T004, acceptance scenario 1 (FR-015)
- [ ] T042 [US1] CSAT metrics capture (average score, department/team/product score, trend, distribution, response rate, improvement percentage) (FR-016)
- [ ] T043 [US1] NPS standardized measurement with Promoter/Passive/Detractor classification tracked across 5 levels, wired to acceptance scenario 2 (FR-017)
- [ ] T044 [US1] CES measurement for 7 key tasks with automatic high-effort improvement-recommendation generation, wired to acceptance scenario 3 (FR-018)
- [ ] T045 [US1] Feedback-record completeness (source, timestamp, customer reference) with duplicate/invalid flagging, wired to acceptance scenario 4 (FR-020)
- [ ] T046 [P] [US1] CSAT/NPS/CES dashboard UI
- [ ] T047 [US1] Integration test: a resolved ticket triggers CSAT and creates a pending response, an NPS submission classifies and updates multi-level tracking, a high-effort CES response generates an improvement recommendation, a stored response carries source/timestamp/reference and feeds dashboards without manual aggregation — all 4 acceptance scenarios in `backend/tests/integration/us1-event-triggered-surveys.integration.test.ts`

**Checkpoint**: The foundational, continuous data-collection mechanism the entire chapter depends on is independently functional.

---

## Phase 4: User Story 2 — No-Code Survey Builder with Branching, Piping & Multi-Language (Priority: P1)

**Independent Test**: Build a multi-language survey with a branching question and a piped token, publish it, distribute via multiple channels, and confirm responses render correctly per language/branch and consolidate into one result set.

- [ ] T048 [US2] 11 survey-type support, wired to T004 (FR-010)
- [ ] T049 [US2] 13-question-type drag-and-drop builder, wired to T005 (FR-011)
- [ ] T050 [US2] Advanced logic support (conditional, branching, skip, dynamic sections, mandatory rules, randomization, piping, personalization tokens, multi-language, anonymous mode), wired to acceptance scenarios 1–3 (FR-012)
- [ ] T051 [US2] 10-channel survey distribution, wired to acceptance scenario 4 (FR-013)
- [ ] T052 [US2] Feedback-collection APIs (create, update, submit, retrieve, export, webhook, integrations, bulk upload, real-time streaming) (FR-014)
- [ ] T053 [US2] Zero-code publish with functioning conditional logic, secure storage, and report/export availability, wired to acceptance scenario 4 (FR-019)
- [ ] T054 [P] [US2] No-code Survey Builder canvas UI
- [ ] T055 [US2] Integration test: skip logic shows the follow-up only on a low rating, a multi-language survey renders piped tokens correctly per language, an anonymous response is stored without identity but counted, multi-channel responses consolidate into one result set — all 4 acceptance scenarios in `backend/tests/integration/us2-no-code-survey-builder.integration.test.ts`

**Checkpoint**: The primary structured, direct-feedback collection instrument is independently functional.

---

## Phase 5: User Story 3 — 12-Stage NLP Pipeline Processes Feedback into Sentiment, Intent, Themes & Entities (Priority: P1)

**Independent Test**: Submit a Tanglish free-text feedback item, verify it progresses through all 12 logged stages, and confirm the resulting record carries a sentiment category, confidence score, AI model version, detected intent, and theme tag.

- [ ] T056 [US3] Enterprise AI pipeline processing across 13 text-feedback source types, wired to T007 (FR-021)
- [ ] T057 [US3] 7-category sentiment classification, wired to T008 and T038's contract test (FR-022)
- [ ] T058 [US3] Sentiment metadata completeness (confidence, timestamp, model version, duration, channel) (FR-023)
- [ ] T059 [US3] Low-confidence manual-review flagging, wired to acceptance scenario 4 (FR-024)
- [ ] T060 [US3] Real-time NLP processing with structured cross-system output availability (FR-025)
- [ ] T061 [US3] 4-language support (English, Tamil, Tanglish, Hindi) with installable future language packs, wired to acceptance scenario 2 (FR-026)
- [ ] T062 [US3] 12-stage sequential pipeline execution, wired to acceptance scenario 1 (FR-027)
- [ ] T063 [US3] Per-stage audit logging, wired to acceptance scenario 1 (FR-028)
- [ ] T064 [US3] Emoji-interpretation contribution to sentiment/emotion classification, wired to acceptance scenario 3
- [ ] T065 [P] [US3] NLP pipeline stage inspector UI
- [ ] T066 [US3] Integration test: feedback passes all 12 logged stages in order, Tamil/Tanglish/Hindi is correctly detected and routed, an emoji contributes to sentiment rather than being discarded, below-threshold confidence is flagged for manual review — all 4 acceptance scenarios in `backend/tests/integration/us3-twelve-stage-nlp-pipeline.integration.test.ts`

**Checkpoint**: The Intelligence Layer converting raw text into every downstream capability is independently functional.

---

## Phase 6: User Story 4 — Complaint Intelligence Auto-Classifies Severity and Escalates Critical Complaints (Priority: P1)

**Independent Test**: Submit a complaint with strongly negative sentiment tied to a high-CLV customer, confirm category and Critical severity scoring, and confirm a support case, team notification, CS alert, admin notification, and audit trail are all created automatically.

- [ ] T067 [US4] 12-category complaint classification, wired to T012, acceptance scenario 1 (FR-039)
- [ ] T068 [US4] 5-level severity rating from sentiment/business-impact/frequency/CLV/historical-pattern inputs, wired to acceptance scenario 1 (FR-040)
- [ ] T069 [US4] Critical-severity automatic escalation (support-case creation delegated to `013`, team/CS/admin notification, audit entry), wired to T039's contract test and T036's reuse note, acceptance scenario 2 (FR-041)
- [ ] T070 [US4] Non-critical correct-team routing with visible resolution status, wired to acceptance scenario 3 (FR-042)
- [ ] T071 [US4] Auditable escalation history, wired to acceptance scenario 4
- [ ] T072 [P] [US4] Complaint classification/escalation review UI
- [ ] T073 [US4] Integration test: a payment-failure complaint is categorized and severity-scored, Critical severity triggers full automatic escalation, Low/Informational severity is routed without the Critical path, escalation history is fully auditable — all 4 acceptance scenarios in `backend/tests/integration/us4-complaint-intelligence-escalation.integration.test.ts`

**Checkpoint**: The direct link between VoC intelligence and operational action, protecting the highest-risk and highest-value customers, is independently functional.

---

## Phase 7: User Story 5 — Closed-Loop Feedback Requires Documented Resolution Before Closing a Critical Complaint (Priority: P1)

**Independent Test**: Drive a Critical complaint through all eight closed-loop steps, then attempt to close it without a recorded resolution and confirm the system blocks the close unless an approved exception with justification is recorded.

- [ ] T074 [US5] 8-step closed-loop process implementation, wired to T021, acceptance scenario 4 (FR-083)
- [ ] T075 [US5] Close-block without a documented resolution or an approved exception, wired to T040's contract test, acceptance scenario 1 (FR-084)
- [ ] T076 [US5] Satisfaction-recheck and final-outcome-recording step gate, wired to acceptance scenario 2
- [ ] T077 [US5] Approved-exception path with approver identity and justification audit capture, wired to acceptance scenario 3
- [ ] T078 [P] [US5] Closed-loop case tracker UI
- [ ] T079 [US5] Integration test: closure is blocked without a resolution or exception, satisfaction is rechecked and the outcome recorded before close, an approved exception captures approver and justification, the full 8-step lifecycle is visible with timestamps — all 4 acceptance scenarios in `backend/tests/integration/us5-closed-loop-feedback.integration.test.ts`

**Checkpoint**: The non-negotiable rule preventing Story 4's escalation from becoming a dead end is independently functional.

---

## Phase 8: User Story 6 — Emotion Intelligence Detects 14 Emotions With a Per-Customer Emotion Timeline (Priority: P2)

**Independent Test**: Submit feedback from the same customer across different months expressing different emotions, confirm each item's emotion(s)/confidence/intensity/triggers are recorded, and confirm the Emotion Timeline displays the month-over-month trend.

- [ ] T080 [US6] 14-emotion detection with multi-emotion-per-response support, wired to T009, acceptance scenario 1 (FR-029)
- [ ] T081 [US6] Per-emotion metadata (name, confidence percentage, intensity level, trigger keywords, AI explanation), wired to acceptance scenario 1 (FR-030)
- [ ] T082 [US6] Per-customer Emotion Timeline (period-over-period dominant-emotion rollup), wired to T010, acceptance scenario 2 (FR-031)
- [ ] T083 [US6] Declining-emotion-trend proactive-outreach-signal surfacing, wired to acceptance scenario 3
- [ ] T084 [P] [US6] Emotion Timeline UI
- [ ] T085 [US6] Integration test: a mixed-emotion response records multiple emotions with full metadata, the timeline displays the month-over-month dominant-emotion sequence, a declining trend is visible as an outreach signal — all 3 acceptance scenarios in `backend/tests/integration/us6-emotion-intelligence-timeline.integration.test.ts`

**Checkpoint**: The emotional-depth layer valuable for Customer Success prioritization is independently functional.

---

## Phase 9: User Story 7 — Root Cause Intelligence Ranks Probable Causes Behind Recurring Complaints (Priority: P2)

**Independent Test**: Seed multiple complaints describing payment failures from different customers, run Root Cause Intelligence, and confirm it groups the related feedback and surfaces a ranked list of candidate causes with supporting evidence.

- [ ] T086 [US7] Related-feedback grouping, recurring-pattern detection, and affected-feature identification, wired to T014, acceptance scenario 1 (FR-048)
- [ ] T087 [US7] Probability/impact ranking of candidate root causes, wired to acceptance scenario 2 (FR-049)
- [ ] T088 [US7] Root Cause Dashboard entry completeness (issue summary, probable cause, confidence, affected customers, revenue impact, priority, suggested resolution, responsible team, supporting evidence), wired to acceptance scenario 3 (FR-050)
- [ ] T089 [P] [US7] Root Cause Dashboard UI
- [ ] T090 [US7] Integration test: similar payment failures are grouped with the pattern and affected feature identified, candidate causes are ranked with the full field set, a dashboard entry shows supporting evidence not just a conclusion — all 3 acceptance scenarios in `backend/tests/integration/us7-root-cause-intelligence.integration.test.ts`

**Checkpoint**: The analytical "why" layer built on top of complaint and theme data is independently functional.

---

## Phase 10: User Story 8 — Advocacy Readiness Score Drives a Tiered Brand Ambassador Program (Priority: P2)

**Independent Test**: Take a customer with strong NPS/CSAT history, confirm the Advocacy Readiness Score reflects the ten factors, confirm progression to Active Advocate, and confirm level assignment with an Ambassador Dashboard reflecting referral/conversion/reward data.

- [ ] T091 [US8] Positive-experience-to-advocacy-activity conversion (10 activity types), wired to T017 (FR-061)
- [ ] T092 [US8] 10-factor Advocacy Readiness Score calculation, wired to acceptance scenario 1 (FR-062)
- [ ] T093 [US8] 8-stage advocacy-status lifecycle with full history, wired to T018, acceptance scenarios 1–2 (FR-063)
- [ ] T094 [US8] Referral Propensity Score (8 factors) (FR-064)
- [ ] T095 [US8] 9-step referral workflow, wired to T019 and `030`'s execution engine per T035's reuse note, acceptance scenario 4 (FR-065)
- [ ] T096 [US8] 8 referral campaign types (FR-066)
- [ ] T097 [US8] 8 configurable referral reward types issued only post-qualification, via `030`'s reward mechanics (FR-067)
- [ ] T098 [US8] Referral-fraud detection reusing `030`'s Fraud Risk Score/Fraud Case engine, with manual-review routing for suspicious patterns, wired to acceptance scenario 4 (FR-068)
- [ ] T099 [US8] Ambassador eligibility evaluation (8 factors) with admin-approval configurability, wired to acceptance scenario 3 (FR-069)
- [ ] T100 [US8] 5 configurable ambassador levels, wired to T020 (FR-070)
- [ ] T101 [US8] Ambassador Dashboard (referral count, conversion count, reward balance, campaign performance, assigned activities, content resources, upcoming events, level progress, performance score, compliance status) (FR-071)
- [ ] T102 [US8] Ambassador Governance controls (Code of Conduct, Brand Usage Guidelines, Content Approval Rules, Confidentiality, Conflict of Interest, Suspension, Removal, Audit History) (FR-072)
- [ ] T103 [US8] Immediate permission loss on suspension, wired to acceptance scenario 5 (FR-073)
- [ ] T104 [US8] Testimonial/case-study approval plus advocate-consent recording (FR-074)
- [ ] T105 [P] [US8] Advocacy/Ambassador management UI
- [ ] T106 [US8] Integration test: the score reflects all 10 factors and status updates with history, an Advocate-Ready invitation acceptance moves the customer to Active Advocate, Ambassador criteria met and approved assigns a level with benefits, a referral-link conversion is approved and rewarded while a fraud signal is held for review, a conduct-violation suspension immediately removes permissions and is audited — all 5 acceptance scenarios in `backend/tests/integration/us8-advocacy-ambassador-program.integration.test.ts`

**Checkpoint**: The strategic growth capability converting sentiment/CSAT/NPS/community data into advocacy value is independently functional.

---

## Phase 11: User Story 9 — Reputation Recovery Workflow Responds to Public Reputation Risk (Priority: P3)

**Independent Test**: Simulate a spike in negative public reviews, confirm a Reputation Risk Alert fires, an owner is assigned, the customer is contacted, a resolution is provided, and a public response is approved before publication.

- [ ] T107 [US9] Reputation data collection (9 sources) with privacy-compliant external collection, wired to T022 (FR-075)
- [ ] T108 [US9] 9-metric reputation-score calculation (FR-076)
- [ ] T109 [US9] Review management actions (view, filter, assign owner, respond, escalate, track status, mark resolved, report abuse, request moderation) for administrators (FR-077)
- [ ] T110 [US9] 6-condition reputation-risk-alert generation, wired to T023, acceptance scenario 1 (FR-078)
- [ ] T111 [US9] 8-step Reputation Recovery Workflow, wired to acceptance scenarios 2–4 (FR-079)
- [ ] T112 [P] [US9] Reputation Recovery Workflow UI
- [ ] T113 [US9] Integration test: a rapid negative-review increase fires a risk alert, the workflow classifies the issue and assigns an owner then contacts the customer sequentially, a public response requires approval before publication, follow-up completion triggers a measured reputation impact — all 4 acceptance scenarios in `backend/tests/integration/us9-reputation-recovery-workflow.integration.test.ts`

**Checkpoint**: The reactive, lower-frequency reputation-protection workflow is independently functional.

---

## Phase 12: Theme/Keyword/Intent/Categorization, Experience/Trend & Predictive/AI-Recommendation/Executive remainder (supports FR-032–FR-038, FR-043–FR-047, FR-051–FR-060; cross-cutting, no single owning story)

- [ ] T114 Automatic theme grouping (15 example themes), wired to T011 (FR-032)
- [ ] T115 Theme Intelligence Dashboard (name, mentions, positive/negative/neutral counts, trend direction, average sentiment, priority, recommended owner) (FR-033)
- [ ] T116 Keyword detection (8 categories) (FR-034)
- [ ] T117 Trending keyword displays (today, weekly, monthly, fastest growing, declining, seasonal) (FR-035)
- [ ] T118 Configurable keyword-based alerts (FR-036)
- [ ] T119 Intent identification (12 intent types, multi-intent support) (FR-037)
- [ ] T120 Multi-dimension feedback categorization (11 dimensions) (FR-038)
- [ ] T121 Continuous experience measurement (10 lifecycle dimensions), wired to T013 (FR-043)
- [ ] T122 Per-category experience metrics (score, satisfaction %, average rating, feedback counts, completion rate, trend, benchmark) (FR-044)
- [ ] T123 Trend Analysis Engine (9 trend dimensions), wired to T015 (FR-045)
- [ ] T124 Trend record completeness (growth %, decline %, direction, confidence, business impact, suggested action) (FR-046)
- [ ] T125 Critical-trend admin notification (FR-047)
- [ ] T126 Predictive forecasting (8 forecast targets), wired to T016 (FR-051)
- [ ] T127 8-input-category prediction-model analysis (FR-052)
- [ ] T128 Forecast Dashboard (6 elements) (FR-053)
- [ ] T129 Confidence-level disclosure on every predictive insight (FR-054)
- [ ] T130 AI Recommendation Engine (10 suggested-action types), wired to `008`'s gateway (FR-055)
- [ ] T131 Recommendation completeness (priority, expected impact, confidence, effort, owner, completion time) (FR-056)
- [ ] T132 Continuous-improvement learning loop (5 feedback signal types) (FR-057)
- [ ] T133 Executive Insight Dashboard (10 KPIs) (FR-058)
- [ ] T134 Executive Dashboard widgets (10 types) (FR-059)
- [ ] T135 Automated executive reports (5 cadences, 4 export formats, 4 delivery channels) (FR-060)

**Checkpoint**: The theme/keyword/intent, experience/trend, and predictive/AI-recommendation/executive-reporting layer rounding out full VoC intelligence coverage is independently functional.

---

## Phase 13: Customer Success Integration remainder & Security/Governance/Performance/Reporting Polish

- [ ] T136 [P] Unified customer profile VoC fields (latest feedback, sentiment history, emotion history, CSAT, NPS category, CES, complaint history, advocacy score, referral potential, reputation risk, recommended next action) (FR-080)
- [ ] T137 Automatic Customer Success actions (8 action types) (FR-081)
- [ ] T138 Customer Success Workbench (priority customers, detractor list, unresolved complaints, high-risk accounts, advocacy opportunities, follow-up tasks, recommended actions, customer timeline, resolution status) (FR-082)
- [ ] T139 RBAC/consent/data-protection/retention/action-logging enforcement, wired to `001`/`016` (FR-085)
- [ ] T140 Performance hardening pass toward the enterprise thresholds (pending T002's research.md resolution) (FR-086)
- [ ] T141 Report filtering (date, channel, segment, product, sentiment) plus scheduled delivery and exact reconciliation with source records (FR-087)
- [ ] T142 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (sentiment-confidence threshold, performance thresholds, retention period, survey-fatigue throttling, elevated-Advocate fraud-screening applicability, closed-loop reopen path)
- [ ] T143 Final audit: cross-check every FR-001–FR-087 against an implementation or validation task; verify referral execution/fraud detection reuse `030`'s engine, complaint escalation delegates case creation to `013`, and AI processing reuses `008`'s gateway
- [ ] T144 Run `quickstart.md` validation end-to-end across all 9 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `030`'s referral/fraud engine, `013`'s support-case system, and `008`'s AI gateway, and produces the entity/architecture/collection-layer infrastructure every subsequent phase depends on.
- **P1 stories (US1–US5)**: US1 (event-triggered surveys) and US2 (no-code Survey Builder) are both foundational collection instruments and can build in parallel; US3 (NLP pipeline) depends on feedback already being collected by US1/US2 and is the intelligence layer every analytical capability depends on; US4 (complaint escalation) depends on US3's sentiment/classification output; US5 (closed-loop) depends on US4's escalated complaints having somewhere to route resolution.
- **P2 stories (US6–US8)**: US6 (emotion intelligence) and US7 (root cause) both depend on US3's NLP output and can build in parallel; US8 (advocacy/ambassador) depends on US1/US3's accumulated sentiment/CSAT/NPS data over time.
- **P3 story (US9)** depends on US3's sentiment/theme pipelines already aggregating internal and external review data, and should land last among the numbered stories.
- **Phase 12 (Theme/Keyword/Intent/Experience/Trend/Predictive/AI-Recommendation/Executive)** depends on Foundational and US3; should land alongside the P1/P2 stories since it supplies analytical depth they feed into and consume from.
- **Polish (Phase 13)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, 5-layer architecture, collection layer) → **STOP and VALIDATE** the three Foundational contract tests (twelve-stage-pipeline-completeness, critical-complaint-auto-escalation, no-critical-close-without-resolution) pass → US1 (event-triggered surveys) + US2 (no-code Survey Builder) in parallel → US3 (NLP pipeline) → **STOP and VALIDATE** the intelligence layer produces trustworthy sentiment/theme/intent output → US4 (complaint escalation) → US5 (closed-loop) → **STOP and VALIDATE** every critical issue reaches documented resolution → US6 (emotion intelligence) + US7 (root cause) in parallel → US8 (advocacy/ambassador) → US9 (reputation recovery) → Phase 12 (theme/trend/predictive/AI-recommendation/executive) → Polish.
