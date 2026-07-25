---
description: "Task list for Feature 036 — Enterprise Personalization Engine & Next Best Action"
---

# Tasks: Enterprise Personalization Engine & Next Best Action

**Input**: Design documents from `/specs/036-personalization-engine-nba/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 019, 034, and discovered collisions with 018/022/029/032/035), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `019`'s unified profile/consent, `034`'s data platform, `035`'s segments, and `008`'s AI Model Platform exist as integration points.

**⚠️ UNRESOLVED DEPENDENCIES, PRESERVED, NOT RESOLVED**:
1. This chapter's own spec.md claims to be the "shared, centralized decisioning service" `032` (Omnichannel Orchestration) should consume — but `032` already independently built its own Next-Best-Action Decision entity, Channel Fallback Chain, and journey-priority-conflict-resolution module without reference to this feature. Not resolved here; same class of question as the `022`/`032` gate.
2. A third independent "Communication Fatigue Score" entity now exists (`029`, `032`, and this feature all define near-identical versions). Not merged.
3. This feature inherits, without worsening, the three-way `019`/`034`/`035` customer-scoring-model collision.

No task below may assume a specific resolution of any of these.

**Tests**: Included throughout — decision-response completeness, No-Contact validity, strict 10-tier priority ordering, and fallback-chain reliability each get a dedicated Foundational contract test, matching this spec's own SC-004, User Story 2, SC-005, and SC-003/Constitution Article II.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus four supplementary cross-cutting phases for FR groups not owned by any single prioritized story (this feature has 97 FRs across only 8 stories, so a large share of requirement volume sits outside story ownership by design).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor reused via `016`), and that `019`'s profile/consent, `034`'s data platform, `035`'s segments, and `008`'s AI Model Platform exist as integration points
- [ ] T002 Resolve `research.md` open items before proceeding, **in priority order**: (1) the `032`/`036` decisioning-engine relationship — requires an explicit architecture decision before either feature's NBA/priority/fallback logic is treated as canonical; (2) the three-way `029`/`032`/`036` Fatigue Score duplication; (3) which of the three existing scoring systems (`019`/`034`/`035`) the Customer Context Service actually reads; (4) Hybrid Recommendation weighting formula; (5) low-confidence provisional-render behavior; (6) arbitration tie-breaking; (7) drift/bias auto-pause vs. alert-only
- [ ] T003 [P] Add `backend/src/modules/{personalization-core,customer-context-service,recommendation-engine,nba-nbo-nbc-engines,omnichannel-experience,channel-send-optimization,fatigue-score,eligibility-business-rules,decision-priority-arbitration,ai-decision-engine,model-fallback-chain,strategy-experience-governance,realtime-batch-multicontext,experimentation-framework,personalization-metrics-roi,model-management-monitoring,privacy-consent-transparency,personalization-governance-api}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Decision` (Decision Record) entity in `backend/src/modules/nba-nbo-nbc-engines/decision.entity.ts`
- [ ] T005 [P] Define the `Next Best Action (NBA)` entity in `backend/src/modules/nba-nbo-nbc-engines/next-best-action.entity.ts`
- [ ] T006 [P] Define the `Next Best Offer (NBO)` entity in `backend/src/modules/nba-nbo-nbc-engines/next-best-offer.entity.ts`
- [ ] T007 [P] Define the `Decision Priority Tier` entity in `backend/src/modules/decision-priority-arbitration/decision-priority-tier.entity.ts`
- [ ] T008 [P] Define the `Next Best Content (NBC)` entity in `backend/src/modules/nba-nbo-nbc-engines/next-best-content.entity.ts`
- [ ] T009 [P] Define the `Fatigue Score` entity in `backend/src/modules/fatigue-score/fatigue-score.entity.ts` — the third independently-specified instance alongside `029` and `032`, not merged
- [ ] T010 [P] Define the `Personalization Strategy` entity in `backend/src/modules/strategy-experience-governance/personalization-strategy.entity.ts`
- [ ] T011 [P] Define the `Experience` entity in `backend/src/modules/strategy-experience-governance/experience.entity.ts`
- [ ] T012 [P] Define the `Customer Context` entity (derived, ephemeral read-model) in `backend/src/modules/customer-context-service/customer-context.entity.ts`
- [ ] T013 [P] Define the `Customer Preference` entity in `backend/src/modules/privacy-consent-transparency/customer-preference.entity.ts`
- [ ] T014 [P] Define the `Recommendation Interaction` entity in `backend/src/modules/recommendation-engine/recommendation-interaction.entity.ts`
- [ ] T015 [P] Define the `Model` (ML Model) entity in `backend/src/modules/model-management-monitoring/model.entity.ts`
- [ ] T016 [P] Define the `Experiment` entity in `backend/src/modules/experimentation-framework/experiment.entity.ts`
- [ ] T017 [P] Define the (reused, platform-wide) `Audit Log Entry` reference in `backend/src/modules/personalization-governance-api/audit-log-entry.reference.ts`
- [ ] T018 [P] Define the `Confidence Score` value object in `backend/src/modules/ai-decision-engine/confidence-score.vo.ts`
- [ ] T019 [P] Define the `Reason Code` value object in `backend/src/modules/nba-nbo-nbc-engines/reason-code.vo.ts`
- [ ] T020 [P] Define the `Fallback Rule / Fallback Chain` entity in `backend/src/modules/model-fallback-chain/fallback-chain.entity.ts`
- [ ] T021 Implement the single centralized personalization system across 11 target modules (website, app, community, courses, ebooks, podcasts, events, notifications, campaigns, membership, commerce) (FR-001)
- [ ] T022 Implement multi-signal driver analysis for personalization decisions (FR-002)
- [ ] T023 Implement per-interaction decision dimensions (content, product, channel, offer, action, timing, avoidance) (FR-003)
- [ ] T024 Implement assisted (rule-based) and autonomous (AI-within-policy) personalization support (FR-004)
- [ ] T025 Implement business-objective advancement tracking (FR-005)
- [ ] T026 Level 1 — Basic Personalization (name, language, location, membership, device) (FR-006)
- [ ] T027 Level 2 — Segment-Based Personalization, consuming `035`'s segments (FR-007)
- [ ] T028 Level 3 — Behavioral Personalization (FR-008)
- [ ] T029 Level 4 — Predictive Personalization (FR-009)
- [ ] T030 Level 5 — Real-Time Individual Personalization (FR-010)
- [ ] T031 Customer Context Service real-time decision-profile assembly (18 fields), wired to T012 — reads from `019`/`034`, no new profile store (FR-011)
- [ ] T032 4 context categories (Persistent, Session, Environmental, Business) (FR-012)
- [ ] T033 Sub-250ms context retrieval performance (FR-013)
- [ ] T034 Note: this feature's Customer Context is a derived, ephemeral read-model; no new identity/profile/Customer 360 entity is created (per plan.md §1)
- [ ] T035 Note: this feature's relationship to `032`'s independently-built NBA/priority/fallback modules is UNRESOLVED; no task assumes consumption in either direction (per plan.md §4)
- [ ] T036 Note: `Fatigue Score` here is the third independently-specified instance alongside `029` and `032`; not merged (per plan.md §5)
- [ ] T037 Note: the Customer Context Service reads "the" customer health score/churn probability without resolving which of `019`/`034`/`035`'s three scoring systems it targets (per plan.md §3)
- [ ] T038 Contract test: 100% of decisions returned by the decision API include recommended item, score, reason codes, model-or-rule version, and expiration timestamp, in `backend/tests/contract/decision-response-completeness.contract.test.ts` (FR-079, SC-004)
- [ ] T039 Contract test: "No-Contact" can outrank every contact-type action and is recorded as a first-class, countable decision, in `backend/tests/contract/no-contact-valid-decision.contract.test.ts` (FR-023, User Story 2)
- [ ] T040 Contract test: conflicting candidates always resolve per the strict 10-tier hierarchy regardless of score, in `backend/tests/contract/decision-priority-strict-ordering.contract.test.ts` (FR-041, SC-005)
- [ ] T041 Contract test: AI-unavailability always terminates on a decision via the fallback chain, with zero customer-facing failures, in `backend/tests/contract/model-fallback-chain-never-fails.contract.test.ts` (FR-048, SC-003, Constitution Article II)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Personalization Decision Engine Returns a Scored, Explained Decision (Priority: P1) 🎯 MVP

**Independent Test**: Call the recommendation/decision API for a single customer with known behavioral history and confirm the response contains `recommended_item`, `score`, `reason_codes`, `model_version`/`rule_version`, and `expires_at`.

- [ ] T042 [US1] 13-content-type recommendation generation, wired to T004, acceptance scenario 1 (FR-014)
- [ ] T043 [US1] Decision object required fields (item, score, reason, model version, eligibility, rank, expiration), wired to T038's contract test (FR-015)
- [ ] T044 [US1] Human-readable explanation derivation from reason codes, wired to acceptance scenario 2 (FR-045 tie-in)
- [ ] T045 [US1] Stale-decision (past `expires_at`) rejection requiring a fresh request, wired to acceptance scenario 3
- [ ] T046 [US1] Low-confidence-threshold flagging for fallback/manual approval, wired to acceptance scenario 4 (FR-046 tie-in)
- [ ] T047 [P] [US1] Decision inspector / explanation UI
- [ ] T048 [US1] Integration test: a course recommendation returns the full decision object, an explanation is derivable from reason codes, an expired decision is not reused and a fresh one is requested, a low-confidence decision is flagged rather than silently delivered — all 4 acceptance scenarios in `backend/tests/integration/us1-personalization-decision-engine.integration.test.ts`

**Checkpoint**: The foundational contract every other capability in this chapter depends on is independently functional.

---

## Phase 4: User Story 2 — "No-Contact" Recognized as a Valid Next Best Action (Priority: P1)

**Independent Test**: Place a test customer into a state that should suppress contact, request a Next Best Action, and confirm the engine returns a "No-Contact" decision — recorded and measurable exactly like any other action category.

- [ ] T049 [US2] 14-action NBA catalog across 10 categories, wired to T005 (FR-021)
- [ ] T050 [US2] NBA decision-flow pipeline (context → eligibility → consent/suppression → candidates → scoring → business rules → channel/timing → selection → delivery → outcome → model update), wired to acceptance scenario 1 (FR-022)
- [ ] T051 [US2] No-Contact first-class category recorded as a completed decision, wired to acceptance scenarios 1–2 (FR-023)
- [ ] T052 [US2] No-Contact metrics visibility as a distinct, countable decision, wired to acceptance scenario 2
- [ ] T053 [US2] No-Contact outranking-eligibility in scoring, wired to T039's contract test, acceptance scenario 3
- [ ] T054 [US2] Context-change re-evaluation allowing a later contact action, wired to acceptance scenario 4
- [ ] T055 [P] [US2] NBA category review UI
- [ ] T056 [US2] Integration test: no appropriate action selects No-Contact as a completed decision, No-Contact appears as a distinct metric, No-Contact can outrank contact actions, changed context allows a later contact selection — all 4 acceptance scenarios in `backend/tests/integration/us2-no-contact-valid-action.integration.test.ts`

**Checkpoint**: The direct anti-dark-pattern guarantee distinguishing this engine from a naive send-everything system is independently functional.

---

## Phase 5: User Story 3 — Ten-Tier Decision Priority Hierarchy Resolves Conflicting Recommendations (Priority: P1)

**Independent Test**: Generate two or more simultaneously eligible candidate decisions for one customer at different priority tiers and confirm the engine always selects the higher tier regardless of the lower tier's score, business value, or timing.

- [ ] T057 [US3] Strict 10-tier Decision Priority resolution, wired to T007 and T040's contract test, acceptance scenario 1 (FR-041)
- [ ] T058 [US3] Same-tier tie-breaking via relevance/score fallthrough, wired to acceptance scenario 2
- [ ] T059 [US3] Lower-tier-number-always-outranks enforcement across all 10 tiers, wired to acceptance scenario 3
- [ ] T060 [US3] Determining-tier recorded on the decision record for audit, wired to acceptance scenario 4 (FR-066 tie-in)
- [ ] T061 [US3] Decision Arbitration engine (9 evaluation factors) for simultaneous multi-system contact requests (FR-042)
- [ ] T062 [P] [US3] Priority-hierarchy audit view UI
- [ ] T063 [US3] Integration test: a Tier 1 candidate is always selected over a lower tier, same-tier candidates fall through to the tie-break, a Tier 8 candidate beats a Tier 9 candidate, the decision record identifies the determining tier — all 4 acceptance scenarios in `backend/tests/integration/us3-decision-priority-hierarchy.integration.test.ts`

**Checkpoint**: The deterministic conflict-resolution guarantee protecting legal/safety communications from being crowded out is independently functional.

---

## Phase 6: User Story 4 — Model Fallback Chain Fires When the AI Model Is Unavailable (Priority: P1)

**Independent Test**: Force the AI Decision Engine into a failure/unavailable state, request a personalized decision, and confirm the response is still produced via the fallback chain within performance targets, with the fallback tier used recorded on the decision.

- [ ] T064 [US4] AI Decision Engine model composition (9 model types) operating within governance boundaries, wired to `008`'s platform (FR-043)
- [ ] T065 [US4] Permitted-input scoping with sensitive-attribute exclusion (FR-044)
- [ ] T066 [US4] Understandable explanation composition from primary reasons (FR-045)
- [ ] T067 [US4] Mandatory confidence, response-probability, expected-value, risk-score, model-version, and timestamp on every AI decision, wired to T018 (FR-046)
- [ ] T068 [US4] 4-stage fallback chain (business rules → segment-based personalization → popular content → default experience), wired to T020 and T041's contract test, acceptance scenarios 1–4 (FR-048)
- [ ] T069 [P] [US4] Fallback-chain simulation UI
- [ ] T070 [US4] Integration test: an unavailable model falls back to business rules, no rule match falls back to segment-based personalization, no segment data falls back to popular content, an exhausted chain returns the default experience — all 4 acceptance scenarios in `backend/tests/integration/us4-model-fallback-chain.integration.test.ts`

**Checkpoint**: The Article-II-mandated guarantee that customer experience never depends on AI uptime is independently functional.

---

## Phase 7: User Story 5 — Communication Fatigue Score Throttles Contact Frequency (Priority: P2)

**Independent Test**: Simulate a customer profile with elevated fatigue signals, request a Next Best Action, and confirm the engine's response reflects at least one fatigue mitigation compared to an otherwise-identical low-fatigue customer.

- [ ] T071 [US5] Fatigue score computation (6 signal types), wired to T009 and T036's reuse-flag note, acceptance scenario 1 (FR-037)
- [ ] T072 [US5] High-threshold mitigation application (reduce frequency, change channel, change content type, delay, No-Contact, manual review), wired to acceptance scenario 2 (FR-038)
- [ ] T073 [US5] Repeated-offer-driven fatigue contribution, wired to acceptance scenario 3
- [ ] T074 [US5] Tier 1–5 priority-action exemption from fatigue suppression, wired to acceptance scenario 4
- [ ] T075 [P] [US5] Fatigue score monitoring UI
- [ ] T076 [US5] Integration test: ignored messages raise the fatigue score, high fatigue triggers at least one mitigation, repeated offers contribute to fatigue, a Tier 1–5 action is still delivered despite high fatigue — all 4 acceptance scenarios in `backend/tests/integration/us5-communication-fatigue-score.integration.test.ts`

**Checkpoint**: The primary mechanism preventing over-personalization and message fatigue is independently functional.

---

## Phase 8: User Story 6 — Diversity Controls Prevent Filter Bubbles in Recommendation Sets (Priority: P2)

**Independent Test**: Generate a multi-item recommendation set for a customer with narrow historical engagement, apply configured min/max representation rules, and confirm the returned set satisfies the diversity constraints.

- [ ] T077 [US6] Category/creator/format/difficulty/price-range/new-vs-familiar diversity controls with admin-configurable min/max, wired to acceptance scenario 1 (FR-018)
- [ ] T078 [US6] Balanced multi-dimension recommendation-set assembly, wired to acceptance scenario 2
- [ ] T079 [US6] Community-feed filter-bubble prevention, wired to acceptance scenario 3 (FR-030 tie-in)
- [ ] T080 [US6] Configuration-change propagation to subsequent recommendation sets, wired to acceptance scenario 4
- [ ] T081 [P] [US6] Diversity control configuration UI
- [ ] T082 [US6] Integration test: a dominant category is capped at its configured maximum, the final set is balanced across all 6 dimensions, the community feed maintains controlled diversity, an updated configuration is reflected in subsequent sets — all 4 acceptance scenarios in `backend/tests/integration/us6-diversity-controls.integration.test.ts`

**Checkpoint**: The quality refinement avoiding repetitive or overly similar recommendation sets is independently functional.

---

## Phase 9: User Story 7 — Next Best Offer Respects Eligibility and Suppression Before Presenting a Commercial Offer (Priority: P2)

**Independent Test**: Construct a customer who is eligible for one offer and explicitly ineligible/suppressed for another, request a Next Best Offer, and confirm only the eligible, unsuppressed offer is returned.

- [ ] T083 [US7] NBO engine (11 offer types, 9 evaluation factors), wired to T006 (FR-024)
- [ ] T084 [US7] Mandatory eligibility validation (11 conditions) excluding non-qualifying offers, wired to acceptance scenario 1 (FR-025)
- [ ] T085 [US7] Already-owned-product suppression unless renewal/repurchase applies, wired to acceptance scenario 2 (FR-026)
- [ ] T086 [US7] Rejection-cooldown suppression, wired to acceptance scenario 3 (FR-026)
- [ ] T087 [US7] Frequency/budget/inventory/subscription-conflict suppression with next-best-eligible fallback, wired to acceptance scenario 4 (FR-026)
- [ ] T088 [P] [US7] NBO review/eligibility UI
- [ ] T089 [US7] Integration test: an ineligible offer is excluded, an already-owned product is suppressed unless renewal applies, a cooldown-rejected offer is suppressed until expiry, a frequency/budget/subscription conflict excludes the offer and selects the next-best eligible one — all 4 acceptance scenarios in `backend/tests/integration/us7-next-best-offer.integration.test.ts`

**Checkpoint**: The trust/compliance safeguard preventing ineligible or over-frequency commercial offers is independently functional.

---

## Phase 10: User Story 8 — Authorized User Overrides an AI Decision With a Fully Audited Trail (Priority: P3)

**Independent Test**: Generate an AI decision for a test customer, have an authorized user perform each override action in turn, and confirm each takes effect on live decisioning behavior and produces a corresponding, immutable audit log entry.

- [ ] T090 [US8] Override actions (approve, reject, replace, adjust priority, suppress customer, suppress item, pause model, roll back strategy), wired to T017, acceptance scenario 1 (FR-047)
- [ ] T091 [US8] Customer-suppression-from-AI-targeting enforcement, wired to acceptance scenario 2
- [ ] T092 [US8] Model-pause routing to the Model Fallback Chain, wired to T068, acceptance scenario 3
- [ ] T093 [US8] Strategy-rollback with prior-version identification, wired to acceptance scenario 4
- [ ] T094 [US8] Role-based permissions across 9 roles, wired to `016` (FR-074)
- [ ] T095 [US8] High-impact-strategy multi-owner approval scaled by risk/audience/channel/offer-value (FR-075)
- [ ] T096 [US8] Version history for strategies, rules, models, experiences, offers, templates, taxonomies, and decision policies with compare-and-restore (FR-076)
- [ ] T097 [US8] Audit logging across 10 governance-action categories, reusing the established platform-wide Audit Log Entry (FR-077)
- [ ] T098 [P] [US8] Override / approval / audit-trail UI
- [ ] T099 [US8] Integration test: a rejected recommendation is replaced and both actions are audited, a suppressed customer is excluded from AI targeting and the suppression is audited, a paused model routes to the fallback chain and the pause is audited, a rollback identifies the prior version, actor, and timestamp — all 4 acceptance scenarios in `backend/tests/integration/us8-human-override-audit.integration.test.ts`

**Checkpoint**: The concrete enforcement mechanism for Constitution Article II within this chapter is independently functional.

---

## Phase 11: Recommendation Methods/Freshness/Cold-Start/NBC, Omnichannel Experience & Channel Optimization remainder (supports FR-016–FR-017, FR-019–FR-020, FR-027–FR-036; cross-cutting, no single owning story)

- [ ] T100 7 recommendation methods (Content-Based, Collaborative Filtering, Popularity-Based, Segment-Based, Contextual, Predictive, Hybrid) (FR-016)
- [ ] T101 14-factor ranking score with business-rule override eligibility (FR-017)
- [ ] T102 Freshness prioritization plus stale/completed-content suppression (FR-019)
- [ ] T103 Cold-start personalization path (8 signal sources) transitioning to behavior-based recommendations (FR-020)
- [ ] T104 Next Best Content service (13 content types) balancing customer value and business objectives, wired to T008 (FR-027)
- [ ] T105 Website/web-app personalization (11 surfaces) plus anonymous-user contextual personalization (FR-028)
- [ ] T106 Mobile app personalization (11 surfaces) without excessive cross-session visual change (FR-029)
- [ ] T107 Community personalization (8 surfaces) with filter-bubble avoidance (FR-030)
- [ ] T108 Learning platform personalization (10 surfaces) respecting prerequisites/certification rules (FR-031)
- [ ] T109 Commerce personalization (9 surfaces) without discriminatory/non-transparent pricing (FR-032)
- [ ] T110 Search-result ranking (10 factors) preserving standard filters/sorting (FR-033)
- [ ] T111 Notification personalization (7 dimensions) respecting consent/quiet-hours/fatigue/caps (FR-034)
- [ ] T112 8-channel selection ranking (9 factors) (FR-035)
- [ ] T113 Send-time prediction (7 signal types) with admin-configurable delivery windows (FR-036)

**Checkpoint**: The full recommendation-method and omnichannel-surface coverage underlying every decision type is independently functional.

---

## Phase 12: Experience Eligibility/Business Rules, Strategy/Content Governance, Real-Time/Batch/Multi-Context & Experimentation remainder (supports FR-039–FR-040, FR-049–FR-062; cross-cutting, no single owning story)

- [ ] T114 Experience Eligibility Engine (14 validation checks) before delivery (FR-039)
- [ ] T115 Business Rules Engine (drag-and-drop builder, nested AND/OR/NOT, priority, effective/expiration dates, simulation) (FR-040)
- [ ] T116 12 pre-built personalization templates, wired to T010 (FR-049)
- [ ] T117 Personalization Strategy record (13 fields) (FR-050)
- [ ] T118 9-status strategy lifecycle with Approved-only production activation (FR-051)
- [ ] T119 Experience catalog (12 fields per entry), wired to T011 (FR-052)
- [ ] T120 Content metadata classification (14 fields) plus 6 tagging methods with AI-tag review (FR-053)
- [ ] T121 Real-time decision update on 10 meaningful-event types (FR-054)
- [ ] T122 Scheduled batch decisioning (7 use cases) (FR-055)
- [ ] T123 Consented anonymous-visitor personalization with post-identity-resolution linkage (FR-056)
- [ ] T124 Logged-in unified-profile-based cross-surface consistency, reading from `019`/`034` (FR-057)
- [ ] T125 Multi-language support (Tamil, English, Thanglish, plus configured languages) and multi-region localization (FR-058)
- [ ] T126 Multi-brand personalization plus multi-tenant data isolation (FR-059)
- [ ] T127 6 experiment types, wired to T016 (FR-060)
- [ ] T128 Experiment definition (11 fields) (FR-061)
- [ ] T129 Holdout-group true-incremental-impact measurement with stable assignment (FR-062)

**Checkpoint**: The governance, content-classification, and multi-context personalization substrate is independently functional.

---

## Phase 13: Metrics/ROI/Governance Visibility, Model Management/Monitoring & Privacy/Consent/Transparency remainder (supports FR-063–FR-073; cross-cutting, no single owning story)

- [ ] T130 Personalization/recommendation/NBA metrics tracking (3 metric families) (FR-063)
- [ ] T131 Personalization ROI calculation (9 measures) (FR-064)
- [ ] T132 Operational dashboard (10 widgets) (FR-065)
- [ ] T133 Customer-level decision timeline (8 fields) for service/troubleshooting/audit, wired to T060's tier-recording (FR-066)
- [ ] T134 ML model registry (11 fields) plus 8-stage model lifecycle, wired to T015 (FR-067)
- [ ] T135 Model/prediction/drift/fairness/latency/error/cost monitoring (10 signal types) (FR-068)
- [ ] T136 Fairness/bias evaluation (6 review mechanisms) with human escalation (FR-069)
- [ ] T137 Privacy-by-design enforcement (8 principles) (FR-070)
- [ ] T138 Pre-delivery consent validation (8 consent types) with SLA-bound withdrawal propagation (FR-071)
- [ ] T139 Customer Preference Center (8 controllable dimensions), wired to T013 (FR-072)
- [ ] T140 Plain-language customer-facing explanations without exposing model internals (FR-073)

**Checkpoint**: The measurement, model-governance, and privacy/transparency layer rounding out full platform trustworthiness is independently functional.

---

## Phase 14: API/Webhooks/Integration, Data Models, Business Rules, Error Handling, Performance & Polish

- [ ] T141 [P] Secure APIs (8 operations: recommendations, NBA, personalized content, response submission, strategy/experience/rule management, analytics, suppression, explanation) (FR-078)
- [ ] T142 11 webhook event types (FR-080)
- [ ] T143 Integration-framework wiring across the 14 named systems (FR-081)
- [ ] T144 Remaining data-model persistence verification (Personalization Strategy/Decision/Recommendation Interaction/Customer Preference field completeness) (FR-082, FR-084–FR-085)
- [ ] T145 10 mandatory business rules enforcement pass, cross-checked against every relevant story (FR-086)
- [ ] T146 Error handling (11 failure categories) without exposing internal details (FR-087)
- [ ] T147 Retry policies (backoff, dead-letter queues, idempotency, duplicate prevention, failure alerts, manual reprocessing) (FR-088)
- [ ] T148 Performance hardening pass toward all 5 numeric targets (FR-089)
- [ ] T149 Scalability infrastructure (horizontal scaling, workload separation, caching, multi-region, tenant isolation, peak handling) (FR-090)
- [ ] T150 Availability infrastructure (redundancy, failover, circuit breakers, graceful degradation, disaster recovery) (FR-091)
- [ ] T151 Configurable retention periods across 7 data categories (FR-092)
- [ ] T152 Observability (logs, metrics, traces, dashboards, alerts) (FR-093)
- [ ] T153 10-category alerting (FR-094)
- [ ] T154 Accessibility compliance (7 categories) (FR-095)
- [ ] T155 Empty/loading-state fallback content, never blank (FR-096)
- [ ] T156 Testing-requirement coverage across 13 test categories (FR-097)
- [ ] T157 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (the `032`/`036` decisioning-engine relationship as highest priority, the three-way Fatigue Score duplication, the three-way scoring-model read-target, Hybrid Recommendation weighting, low-confidence provisional-render behavior, arbitration tie-breaking, drift/bias auto-pause-vs-alert)
- [ ] T158 Final audit: cross-check every FR-001–FR-097 against an implementation or validation task; verify no new identity/profile/Customer 360 entity was created, segments are consumed from `035` rather than redefined, and the `032`/`036` relationship remains explicitly unresolved rather than silently assumed
- [ ] T159 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `019`/`034`/`035`/`008` as integration points and produces the entity/context-service infrastructure every subsequent phase depends on, while explicitly not resolving the `032`/`036` relationship.
- **P1 stories (US1–US4)**: US1 (decision engine contract) is the foundational object every other capability produces or manages and must ship first; US2 (No-Contact), US3 (priority hierarchy), and US4 (fallback chain) all depend on US1's decision object and can build in parallel, though US3's hierarchy governs how US2's No-Contact and other candidates are actually selected.
- **P2 stories (US5–US7)**: US5 (fatigue), US6 (diversity), and US7 (NBO eligibility/suppression) all depend on US1–US4's core decisioning contract and can build in parallel.
- **P3 story (US8)** depends on US1–US7 already generating decisions correctly before there is anything meaningful to override, and should land last among the numbered stories.
- **Phase 11 (Recommendation Methods/Omnichannel/Channel Optimization)** and **Phase 12 (Eligibility/Governance/Multi-Context/Experimentation)** depend on Foundational and US1; they should land alongside the P1/P2 stories since they supply the surfaces and governance those stories render/route through.
- **Phase 13 (Metrics/Model Management/Privacy)** depends on US1–US4 producing real decision data to measure and govern.
- **Polish (Phase 14)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, maturity model, Customer Context Service) → **STOP and VALIDATE** the four Foundational contract tests (decision-response-completeness, no-contact-valid-decision, decision-priority-strict-ordering, model-fallback-chain-never-fails) pass → US1 (decision engine contract) → **STOP and VALIDATE** every decision is scored, explained, and versioned → US2 (No-Contact) + US3 (priority hierarchy) + US4 (fallback chain) in parallel → **STOP and VALIDATE** the core decisioning guarantees (anti-dark-pattern, deterministic conflict resolution, AI-independence) hold → US5 (fatigue) + US6 (diversity) + US7 (NBO) in parallel → US8 (override/audit) → Phase 11 (recommendation methods/omnichannel) + Phase 12 (governance/experimentation) in parallel → Phase 13 (metrics/model management/privacy) → Polish.
