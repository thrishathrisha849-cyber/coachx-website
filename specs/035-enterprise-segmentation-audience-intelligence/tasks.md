---
description: "Task list for Feature 035 — Enterprise Customer Segmentation & Audience Intelligence"
---

# Tasks: Enterprise Customer Segmentation & Audience Intelligence

**Input**: Design documents from `/specs/035-enterprise-segmentation-audience-intelligence/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 019 and 034), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `019`'s Segment entity/rule engine/Consent Record, `034`'s Unified Customer Profile/Identity Resolution/Behavioral field group, and `008`'s AI gateway exist as extension/integration points.

**⚠️ UNRESOLVED DEPENDENCIES, PRESERVED, NOT RESOLVED**:
1. This feature inherits `034`'s still-open relationship to `019`'s CDP profile — this feature reads from `034`'s profile without taking a position on that gate.
2. A newly-escalated three-way customer-scoring collision: `019`'s 4-score Customer Score, `034`'s 7-score AI-Computed Score, and this feature's own 6-sub-score Customer Health Score all coexist, unreconciled.

Neither gate is closed by this feature. No task below may assume a specific resolution.

**Tests**: Included throughout — dynamic-audience real-time refresh, AI-discovery governance-approval gating, and 100%-suppression-at-activation each get a dedicated Foundational contract test, matching this spec's own SC-002, SC-007/Constitution Article II, and SC-008.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus two supplementary cross-cutting phases for FR groups not owned by any single prioritized story (AI behavioral profiling/remaining APIs; security/privacy/performance polish).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor reused via `016`), and that `019`'s Segment/rule engine/Consent Record, `034`'s Unified Customer Profile/Identity Resolution/Behavioral field group, and `008`'s AI gateway exist as extension/integration points
- [ ] T002 Resolve `research.md` open items before proceeding, **in priority order**: (1) the three-way customer-scoring-model question (`019` vs. `034` vs. `035`); (2) confirmation this feature extends `019`'s Segment/rule engine and `034`'s Behavioral field group rather than duplicating them; (3) missed-audience-refresh degradation behavior; (4) Lookalike Audience refresh cadence; (5) in-flight-campaign behavior on Expiration Policy reached; (6) AI-cluster-vs-existing-Segment overlap handling; (7) real-time refresh event-precedence rule; (8) Approval-Workflow partial-rejection state handling; (9) suppressed-customer Audience Size counting; (10) predictive-segment low-confidence handling; (11) deprecated-custom-attribute handling (shared open question with `019`)
- [ ] T003 [P] Add `backend/src/modules/{segmentation-categories,engagement-health-scoring,ai-behavioral-profiling,dynamic-audience-builder,ai-audience-discovery,lookalike-audience-engine,audience-activation-suppression,segment-analytics,audience-governance,segmentation-security-api}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Segmentation Category` entity in `backend/src/modules/segmentation-categories/segmentation-category.entity.ts`
- [ ] T005 [P] Define the `Customer Health Score` entity in `backend/src/modules/engagement-health-scoring/customer-health-score.entity.ts` — the third, distinct customer-scoring system on the platform (see plan.md §4)
- [ ] T006 [P] Define the `Behavioral Profile` entity in `backend/src/modules/ai-behavioral-profiling/behavioral-profile.entity.ts` — **extends `034`'s existing Behavioral field group**, does not duplicate its Preferred Devices/Time/Channel fields
- [ ] T007 [P] Define the `AI-Discovered Cluster` entity in `backend/src/modules/ai-audience-discovery/ai-discovered-cluster.entity.ts`
- [ ] T008 [P] Define the `Predictive Segment` entity in `backend/src/modules/ai-audience-discovery/predictive-segment.entity.ts`
- [ ] T009 [P] Define the `Lookalike Audience` entity in `backend/src/modules/lookalike-audience-engine/lookalike-audience.entity.ts`
- [ ] T010 [P] Define the immutable `Audience Version` entity in `backend/src/modules/audience-governance/audience-version.entity.ts`
- [ ] T011 [P] Define the `Audience Suppression List` entity in `backend/src/modules/audience-activation-suppression/audience-suppression-list.entity.ts`
- [ ] T012 [P] Define the `Segment Analytics Snapshot` entity in `backend/src/modules/segment-analytics/segment-analytics-snapshot.entity.ts`
- [ ] T013 Note: this feature extends `019`'s existing `Segment` entity and AND/OR/NOT rule engine; no second `Segment` entity is created
- [ ] T014 Note: this feature reads identity/profile data from `034`'s Unified Customer Profile; no second identity-resolution engine or profile store is created
- [ ] T015 Note: three coexisting, non-reconciled customer-scoring systems now exist (`019`'s 4-score Customer Score, `034`'s 7-score AI-Computed Score, this feature's 6-sub-score Customer Health Score) — flagged, not merged
- [ ] T016 Implement the 10-segmentation-category taxonomy (Demographic, Geographic, Behavioral, Psychographic, Technographic, Transactional, Value-Based, Loyalty, Lifecycle, AI Predictive), wired to T004 (FR-005)
- [ ] T017 Demographic Segmentation attributes (Age, Gender, Occupation, Education, Income Range, Marital Status, Language, Family Size) (FR-006)
- [ ] T018 Geographic Segmentation attributes (Country, State, City, Region, PIN Code, Urban, Rural, Climate Zone) (FR-007)
- [ ] T019 Behavioral Segmentation analysis (11 signal types: Website Visits, Mobile Usage, Community Activity, Purchase Frequency, Session Duration, Search Behavior, Click Patterns, Cart Abandonment, Ebook Reading, Podcast Listening, Video Completion) (FR-008)
- [ ] T020 Psychographic Segmentation attributes (Interests, Goals, Lifestyle, Values, Business Stage, Learning Style, Motivation, Professional Interests) (FR-009)
- [ ] T021 Transaction Segmentation tracking (Purchase Frequency, Average Order Value, Total Revenue, Refund Rate, Membership Upgrades, Payment Behavior) (FR-010)
- [ ] T022 Lifecycle Segmentation stages (Visitor, Registered User, Trial User, New Member, Active Member, Power User, VIP, Dormant User, Churn Risk, Returning Customer) (FR-011)
- [ ] T023 Value-Based Segmentation tiers (Platinum, Gold, Silver, Bronze, VIP, High Potential, Low Engagement, Strategic Customer) (FR-012)
- [ ] T024 Technographic and Loyalty Segmentation category registration — behavior preserved as `[NEEDS CLARIFICATION]` per spec.md (no attribute list defined in source) (FR-013)
- [ ] T025 Platform-wide automatic classification and real-time continuous update pipeline, wired to T014's reuse note (FR-001–FR-002)
- [ ] T026 Architecture pipeline sequencing (Customer Events → Identity Resolution → Unified Profile → Behavior Analysis Engine → AI Segmentation Engine → Dynamic Audience Builder → Activation), consuming `034`'s pipeline (FR-003)
- [ ] T027 10-core-component architecture shell (FR-004)
- [ ] T028 Contract test: a dynamic audience's membership refreshes within 5 seconds of a real-time trigger event, in `backend/tests/contract/dynamic-audience-realtime-refresh.contract.test.ts` (FR-020, FR-043, SC-002)
- [ ] T029 Contract test: zero AI-discovered clusters, predictive segments, or lookalike audiences reach active/campaign-usable status without passing the Audience Governance Approval Workflow, in `backend/tests/contract/ai-discovery-governance-approval-gate.contract.test.ts` (FR-023, SC-007, Constitution Article II)
- [ ] T030 Contract test: every audience activation excludes 100% of suppression-listed customers at the moment of activation, in `backend/tests/contract/audience-suppression-100-percent-exclusion.contract.test.ts` (FR-027, SC-008)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Build a Segment via the Dynamic Audience Builder (Priority: P1) 🎯 MVP

**Independent Test**: Construct a nested audience such as "Country Equals India AND (Purchase Frequency Greater Than 3 OR Total Revenue Greater Than ₹10,000)," save it, then trigger a real-time update event for a matching customer and confirm membership updates without manual intervention.

- [ ] T031 [US1] Drag-and-drop condition builder with nested rule groups, extending `019`'s AND/OR/NOT engine, wired to T013's reuse note, acceptance scenario 1 (FR-018)
- [ ] T032 [US1] 10-operator support (AND, OR, NOT, Equals, Greater Than, Less Than, Contains, Between, Exists, In List), wired to acceptance scenario 2 (FR-019)
- [ ] T033 [US1] Saved rule templates with editable reuse, wired to acceptance scenario 3 (FR-018)
- [ ] T034 [US1] AI suggestions and reusable rules within the builder (FR-018)
- [ ] T035 [US1] Real-time membership refresh on 8 trigger events (Purchase Completed, Membership Changed, Course Completed, Community Joined, Referral Generated, Webinar Attended, Payment Failed, Support Ticket Created), wired to T028's contract test, acceptance scenario 4 (FR-020)
- [ ] T036 [P] [US1] Dynamic Audience Builder canvas UI
- [ ] T037 [US1] Integration test: a nested AND/OR condition structure is accepted and displayed, Between and In List operators are accepted, a saved template populates and remains editable, a Purchase Completed event refreshes matching membership automatically — all 4 acceptance scenarios in `backend/tests/integration/us1-dynamic-audience-builder.integration.test.ts`

**Checkpoint**: The core mechanism every other capability in this chapter depends on is independently functional.

---

## Phase 4: User Story 2 — View a Customer's Composite Health Score (Priority: P1)

**Independent Test**: For a single customer with sufficient engagement/loyalty/satisfaction/growth/risk/revenue data, request their Health Score and confirm all six sub-scores are calculated and combined into one 0–100 value.

- [ ] T038 [US2] Engagement Score computation (Login Frequency, Community Activity, Learning Hours, Purchases, Webinar Attendance, Referrals, Reviews, Daily Streak), wired to T005 (FR-014)
- [ ] T039 [US2] 6-sub-score Health Score calculation (Engagement, Loyalty, Satisfaction, Growth, Risk, Revenue), wired to acceptance scenario 1 (FR-015)
- [ ] T040 [US2] Single combined 0–100 value expression, wired to acceptance scenario 2 (FR-016)
- [ ] T041 [US2] Comparative-ranking correctness (stronger sub-score inputs produce a higher final score), wired to acceptance scenario 3
- [ ] T042 [P] [US2] Health Score display UI
- [ ] T043 [US2] Integration test: sufficient data computes all 6 sub-scores, sub-scores combine into a single 0–100 value, a stronger profile shows a higher final score — all 3 acceptance scenarios in `backend/tests/integration/us2-customer-health-score.integration.test.ts`

**Checkpoint**: The chapter's primary composite intelligence signal feeding Value-Based/Lifecycle/Predictive segmentation is independently functional.

---

## Phase 5: User Story 3 — AI Audience Discovery Surfaces a Hidden High-Conversion Cluster (Priority: P2)

**Independent Test**: Run the AI Clustering Engine against a seeded profile set, confirm it proposes at least one candidate cluster with a defined membership, and confirm the cluster requires Audience Governance approval before it is usable by campaign tools.

- [ ] T044 [US3] AI Clustering Engine (Hidden Customer Clusters, High-Conversion Groups, Emerging Trends, Cross-Selling Opportunities, Upsell Opportunities, Churn Clusters), wired to T007, acceptance scenario 1 (FR-021)
- [ ] T045 [US3] AI Predictive Segmentation (Likely to Purchase, Likely to Upgrade, Likely to Churn, Likely to Refer Friends, High Learning Potential, Premium Candidate), wired to T008, acceptance scenario 3 (FR-022)
- [ ] T046 [US3] Governance-approval gate before AI output becomes active/campaign-usable, wired to T029's contract test, acceptance scenario 2 (FR-023)
- [ ] T047 [US3] Approved-cluster activation eligibility for downstream campaigns, wired to acceptance scenario 4
- [ ] T048 [P] [US3] AI discovery review/approval queue UI
- [ ] T049 [US3] Integration test: sufficient data surfaces candidate clusters from the defined set, a High-Conversion Group becomes active only after governance approval, predictive segmentation produces all 6 segment types, an approved Churn Cluster is eligible for retention campaigns — all 4 acceptance scenarios in `backend/tests/integration/us3-ai-audience-discovery.integration.test.ts`

**Checkpoint**: The additive intelligence layer surfacing targeting opportunities a manual segment would miss is independently functional.

---

## Phase 6: User Story 4 — Generate a Lookalike Audience from Best Customers (Priority: P2)

**Independent Test**: Select "Best Customers" as a seed group, generate a Lookalike Audience from it, and confirm a new candidate audience is produced that is distinct from the seed group and available for governance review.

- [ ] T050 [US4] Lookalike Audience Engine across 6 seed groups (Best Customers, Premium Members, Highest Revenue Customers, Top Community Leaders, Frequent Buyers, Referral Champions), wired to T009, acceptance scenarios 1–2 (FR-024)
- [ ] T051 [US4] Distinct-from-seed-group candidate-audience generation, wired to acceptance scenario 1
- [ ] T052 [US4] Governance-review eligibility for generated lookalike audiences, wired to acceptance scenario 3
- [ ] T053 [P] [US4] Lookalike audience generation UI
- [ ] T054 [US4] Integration test: a Best-Customers seed produces a lookalike audience, all 6 seed groups produce corresponding lookalike audiences, an approved lookalike audience is usable for campaign activation — all 3 acceptance scenarios in `backend/tests/integration/us4-lookalike-audience.integration.test.ts`

**Checkpoint**: The reach-extension capability beyond customers who already match explicit rules is independently functional.

---

## Phase 7: User Story 5 — Govern an Audience Through Versioning, Approval & Expiry (Priority: P2)

**Independent Test**: Create a Segment, edit its rules, and confirm the edit is recorded as a new Audience Version with Change History; separately, set an Expiration Policy and confirm governed handling once expiration is reached.

- [ ] T055 [US5] Naming Standards enforcement on Segment/Audience Version submission, wired to T010, acceptance scenario 1 (FR-029)
- [ ] T056 [US5] Version Control and Change History recording on every edit rather than overwrite, wired to acceptance scenario 2 (FR-030)
- [ ] T057 [US5] Approval Workflow gating activation for new/edited Segments (FR-031)
- [ ] T058 [US5] Ownership recording and enforcement per Segment, wired to acceptance scenario 4 (FR-032)
- [ ] T059 [US5] Documentation requirement enforcement per Segment, wired to acceptance scenario 4 (FR-033)
- [ ] T060 [US5] Expiration Policy support with governed handling on reaching expiration, wired to acceptance scenario 3 (FR-034)
- [ ] T061 [P] [US5] Audience Governance workflow UI
- [ ] T062 [US5] Integration test: a new Segment requires Naming Standards compliance and approval before becoming active, a rule edit is recorded as a new version with change history, an expired Segment is handled per policy rather than left active, activation is blocked when Ownership or Documentation is missing — all 4 acceptance scenarios in `backend/tests/integration/us5-audience-governance.integration.test.ts`

**Checkpoint**: The safety layer making every other capability in this chapter usable at enterprise scale is independently functional.

---

## Phase 8: User Story 6 — Activate an Audience Across Channels with Suppression Applied (Priority: P3)

**Independent Test**: Activate a previously governed Segment that includes at least one suppressed customer and confirm that customer is excluded from the activated output while all supported channels can reference the remaining audience.

- [ ] T063 [US6] 9-channel activation dispatch (Email, SMS, WhatsApp, Push Notification, Website, Mobile App, Community Feed, Ad Platforms, CRM), wired to T011, acceptance scenario 1 (FR-025)
- [ ] T064 [US6] 8-category personalization eligibility per activated audience member (FR-026)
- [ ] T065 [US6] 6-category suppression exclusion at activation (Unsubscribed, Blocked, Inactive, Compliance Restricted, Duplicate Profile, Fraud Account), wired to T030's contract test, acceptance scenario 2 (FR-027)
- [ ] T066 [P] [US6] Activation dispatch / suppression review UI
- [ ] T067 [US6] Integration test: an activated Segment is available across all 9 channels, a suppressed customer is excluded from activation, an activated member is eligible for channel-appropriate personalization — all 3 acceptance scenarios in `backend/tests/integration/us6-audience-activation-suppression.integration.test.ts`

**Checkpoint**: The mechanism through which a governed Segment produces business value is independently functional.

---

## Phase 9: User Story 7 — Monitor Segment Performance via the Segment Analytics Dashboard (Priority: P3)

**Independent Test**: Open the analytics view for an existing active Segment and confirm it reports Audience Size, Growth, Revenue, Engagement, Conversion, Retention, Churn, and Campaign Performance within the stated dashboard-load performance target.

- [ ] T068 [US7] Segment Analytics Snapshot (Audience Size, Growth, Revenue, Engagement, Conversion, Retention, Churn, Campaign Performance), wired to T012, acceptance scenario 1 (FR-028)
- [ ] T069 [US7] Sub-3-second dashboard render performance, wired to acceptance scenario 2 (FR-046)
- [ ] T070 [US7] Segment Analytics and Score Retrieval API exposure through the Enterprise API layer, wired to acceptance scenario 3 (FR-041 tie-in)
- [ ] T071 [P] [US7] Segment Analytics Dashboard UI
- [ ] T072 [US7] Integration test: an active Segment reports all 8 metrics, the dashboard loads under 3 seconds, the Analytics/Score Retrieval API returns the requested data — all 3 acceptance scenarios in `backend/tests/integration/us7-segment-analytics-dashboard.integration.test.ts`

**Checkpoint**: The reporting layer allowing segment effectiveness to be monitored without exporting raw data is independently functional.

---

## Phase 10: AI Behavioral Profiling & remaining Enterprise APIs (supports FR-017, remainder of FR-041; cross-cutting, no single owning story)

- [ ] T073 AI behavioral profile (Content Preferences, Learning Preferences, Buying Habits, Preferred Devices, Preferred Communication Channel, Preferred Time of Day, Engagement Pattern, Community Influence), extending `034`'s Behavioral field group per T014's reuse note, wired to T006 (FR-017)
- [ ] T074 Remaining Enterprise API operations (Audience Search, Segment Creation, Audience Export) (FR-041)

**Checkpoint**: The behavioral-intelligence and API surface rounding out full segmentation coverage is independently functional.

---

## Phase 11: Security/Privacy & Polish

- [ ] T075 [P] RBAC over audience/segmentation data and functionality, wired to `016` (FR-035)
- [ ] T076 Encryption of audience/segmentation data (FR-036)
- [ ] T077 Consent enforcement before activation, reading `019`'s existing Consent Record (FR-037)
- [ ] T078 Audit logs of audience/segmentation actions (FR-038)
- [ ] T079 GDPR/CCPA compliance (FR-039)
- [ ] T080 Data retention policy enforcement (FR-040)
- [ ] T081 Performance hardening pass toward the remaining numeric targets (segment creation under 2s, audience export under 30s, profile lookup under 500ms) (FR-042, FR-044–FR-045)
- [ ] T082 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (the three-way scoring-model question as highest priority, missed-refresh degradation, lookalike refresh cadence, in-flight-campaign expiration behavior, AI-cluster-overlap handling, event-precedence rule, approval-rejection state handling, suppressed-customer Audience Size counting, predictive-segment low-confidence handling, deprecated-attribute handling)
- [ ] T083 Final audit: cross-check every FR-001–FR-046 against an implementation or validation task; verify this feature extends `019`'s Segment/rule engine and `034`'s profile/Behavioral field group rather than duplicating them, and that no fourth customer-scoring system was introduced beyond the three already documented
- [ ] T084 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `019`'s Segment/rule engine/Consent Record, `034`'s Unified Customer Profile/Behavioral field group, and `008`'s AI gateway, and produces the segmentation-category/entity infrastructure every subsequent phase depends on.
- **P1 stories (US1–US2)**: US1 (Dynamic Audience Builder) is the core mechanism every other capability operates on and must ship first; US2 (Customer Health Score) is independently computable from profile data and can build in parallel with US1.
- **P2 stories (US3–US5)**: US3 (AI discovery) and US4 (lookalike) both depend on US1's Segment/audience infrastructure and US5's governance gate to become campaign-usable; US5 (governance) should land alongside or just before US3/US4 since FR-023 requires governance approval for their output.
- **P3 stories (US6–US7)**: US6 (activation/suppression) depends on US5's governed, approved segments; US7 (analytics) depends on US1–US6 producing real segment/activation data to report on — both can build in parallel, landing last.
- **Phase 10 (Behavioral Profiling/APIs)** depends on Foundational and US1–US2; can build in parallel with the P2/P3 stories.
- **Polish (Phase 11)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, segmentation-category taxonomy, pipeline) → **STOP and VALIDATE** the three Foundational contract tests (dynamic-audience-realtime-refresh, ai-discovery-governance-approval-gate, audience-suppression-100-percent-exclusion) pass → US1 (Dynamic Audience Builder) + US2 (Customer Health Score) in parallel → **STOP and VALIDATE** the core rule engine and composite scoring are trustworthy → US5 (governance) → US3 (AI discovery) + US4 (lookalike) in parallel → **STOP and VALIDATE** no AI-generated audience reaches campaign-usable status without approval → US6 (activation/suppression) + US7 (analytics) in parallel → Phase 10 (behavioral profiling/APIs) → Polish.
