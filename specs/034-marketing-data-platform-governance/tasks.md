---
description: "Task list for Feature 034 — Marketing Data Platform, Unified Customer Intelligence & Data Governance"
---

# Tasks: Marketing Data Platform, Unified Customer Intelligence & Data Governance

**Input**: Design documents from `/specs/034-marketing-data-platform-governance/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `008`'s AI gateway and `019`'s Consent Record model exist as integration points.

**⚠️ UNRESOLVED DEPENDENCY**: This feature's Unified Customer Profile and `019`'s CDP profile are **not reconciled** — spec.md explicitly preserves both as independently specified rather than inventing a merge rule, and this is verified as a real collision against `019`'s own plan.md (which already defines its own `Unified Customer Profile` entity). No task below may assume a specific resolution.

**Tests**: Included throughout — identity-resolution merging, real-time event processing with complete metadata, and AI-input data cleanliness each get a dedicated Foundational contract test, matching this spec's own SC-006, SC-001, and FR-048.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus two supplementary cross-cutting phases for FR groups not owned by any single prioritized story (enrichment/segmentation/warehouse/MDM/enterprise-analytics; API services/performance/acceptance-criteria verification).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor reused via `016`), and that `008`'s AI gateway and `019`'s Consent Record model exist as integration points
- [ ] T002 Resolve `research.md` open items before proceeding, **in priority order**: (1) whether this feature's Unified Customer Profile and `019`'s CDP profile are the same physical record, one built on the other, or intentionally distinct stores — affects nearly every downstream entity in this feature; (2) false-merge detection/reversal process; (3) field-level conflict-resolution precedence between disagreeing source systems; (4) degradation behavior when real-time AI recalculation misses its window; (5) Right-to-Delete cascade behavior/timeframe across warehouse/AI-training-data/merged-profile copies; (6) the "Churn Risk" naming overlap with `029`
- [ ] T003 [P] Add `backend/src/modules/{customer-identity-service,unified-customer-profile,data-collection-layer,data-validation-engine,data-cleansing-engine,data-enrichment,customer-segmentation-mdp,marketing-data-warehouse,master-data-management,data-governance-classification,ai-intelligence-layer,data-quality-dashboard,enterprise-analytics-executive,mdp-api-services}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Customer Identity` entity in `backend/src/modules/customer-identity-service/customer-identity.entity.ts`
- [ ] T005 [P] Define the `Unified Customer Profile` entity in `backend/src/modules/unified-customer-profile/unified-customer-profile.entity.ts` — **preserved as independently specified from `019`'s CDP profile**, not merged
- [ ] T006 [P] Define the `Customer Timeline / Activity Event` entity in `backend/src/modules/unified-customer-profile/customer-timeline-event.entity.ts`
- [ ] T007 [P] Define the append-only `Raw Event` entity in `backend/src/modules/data-collection-layer/raw-event.entity.ts`
- [ ] T008 [P] Define the `Data Classification Tier` entity in `backend/src/modules/data-governance-classification/data-classification-tier.entity.ts`
- [ ] T009 [P] Define the `Consent Record` entity in `backend/src/modules/data-governance-classification/consent-record.entity.ts` — interoperates with `019`'s Consent Record model per spec.md's Assumptions
- [ ] T010 [P] Define the `AI-Computed Score` entity in `backend/src/modules/ai-intelligence-layer/ai-computed-score.entity.ts`
- [ ] T011 [P] Define the `Predictive Model Output` entity in `backend/src/modules/ai-intelligence-layer/predictive-model-output.entity.ts`
- [ ] T012 [P] Define the `Customer Segment` entity in `backend/src/modules/customer-segmentation-mdp/customer-segment.entity.ts`
- [ ] T013 [P] Define the `Master Data Entity` entity in `backend/src/modules/master-data-management/master-data-entity.entity.ts`
- [ ] T014 [P] Define the `Marketing Data Warehouse Record` entity in `backend/src/modules/marketing-data-warehouse/warehouse-record.entity.ts`
- [ ] T015 [P] Define the `Data Quality Metric` entity in `backend/src/modules/data-quality-dashboard/data-quality-metric.entity.ts`
- [ ] T016 [P] Define the `Data Governance Policy` entity in `backend/src/modules/data-governance-classification/data-governance-policy.entity.ts`
- [ ] T017 Implement single-source-of-truth data unification across the 7 data-generation domains, wired to T005 (FR-001)
- [ ] T018 Implement the continuous collect/clean/validate/enrich/classify/analyze/activate pipeline (FR-002)
- [ ] T019 Implement the 12-core-component architecture shell (FR-003)
- [ ] T020 Implement the enterprise data architecture pipeline sequencing (source systems → Event Collection → Validation → Identity Resolution → Unified Profile → Data Warehouse → AI Intelligence → downstream), wired to T007 (FR-004)
- [ ] T021 Implement downstream-capability powering across 9 categories (Marketing Automation, Personalization, Recommendation Engine, AI Decision Engine, Community Intelligence, Customer Journey, Sales Intelligence, Customer Success, Executive Analytics) (FR-006)
- [ ] T022 Note: this feature's Unified Customer Profile and `019`'s CDP profile are NOT reconciled — both remain independently specified per spec.md's explicit instruction; no task assumes a merge
- [ ] T023 Note: the AI Intelligence Layer consumes `008`'s AI gateway per spec.md's Article II inference, not a separate AI stack
- [ ] T024 Note: "Churn Risk" as computed here (FR-033) and `029`'s `Churn Risk Level` entity are a naming overlap, not confirmed to be the same value — flagged, not merged
- [ ] T025 Contract test: interactions referencing the same underlying person through two different identity signals resolve to a single merged profile rather than creating two, in `backend/tests/contract/identity-resolution-merge.contract.test.ts` (FR-008, SC-006)
- [ ] T026 Contract test: every collected event is processed within 1 second with complete required metadata, in `backend/tests/contract/event-processing-realtime-metadata.contract.test.ts` (FR-019, FR-040, SC-001)
- [ ] T027 Contract test: data reaching the AI Intelligence Layer has passed validation and cleansing, with zero invalid/dirty records feeding AI models, in `backend/tests/contract/ai-input-data-validated-cleansed.contract.test.ts` (FR-048)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Identity Resolution Merges a Customer's Fragmented Footprint Into One Profile (Priority: P1) 🎯 MVP

**Independent Test**: Generate interaction events referencing the same underlying person through two different identity signals and verify the platform resolves both to a single merged customer profile.

- [ ] T028 [US1] 8-signal identity matching (Email, Mobile Number, Login Account, Device ID, Browser Fingerprint, Membership ID, Referral ID, Payment ID), wired to T004, acceptance scenario 1 (FR-007)
- [ ] T029 [US1] Cross-device, same-mobile-number resolution to an existing profile, wired to acceptance scenario 1
- [ ] T030 [US1] Cross-source-system intelligent merge (e.g., web registration plus a payment-ID-sharing transaction), wired to T025's contract test, acceptance scenario 2 (FR-008)
- [ ] T031 [US1] Known-Device-ID-with-new-browser-fingerprint attribution to the existing identity, wired to acceptance scenario 3
- [ ] T032 [US1] Referral-ID-match linking to an existing profile, wired to acceptance scenario 4
- [ ] T033 [P] [US1] Identity resolution review UI
- [ ] T034 [US1] Integration test: a new device with the same mobile number resolves to the existing profile, cross-source Payment ID match merges the records, a known Device ID with a new browser fingerprint is attributed to the existing identity, a Referral ID match links to the existing identity — all 4 acceptance scenarios in `backend/tests/integration/us1-identity-resolution.integration.test.ts`

**Checkpoint**: The foundational capability every other component depends on for exactly one trustworthy profile per customer is independently functional.

---

## Phase 4: User Story 2 — Unified Customer Profile Powers a Real-Time Customer 360 View (Priority: P1)

**Independent Test**: Trigger interactions for a single customer across at least three different source modules, then open that customer's Customer 360 Dashboard and confirm all three appear correctly attributed to the same profile with timestamps.

- [ ] T035 [US2] Exactly-one-master-profile-per-customer enforcement, wired to T005 (FR-009)
- [ ] T036 [US2] Personal information field group (Customer ID, Name, Username, Email, Mobile, Profile Photo) (FR-010)
- [ ] T037 [US2] Demographic information field group (Age, Gender, Language, Country, State, City) (FR-011)
- [ ] T038 [US2] Membership information field group (Membership Type, Join Date, Renewal Date, Status) (FR-012)
- [ ] T039 [US2] Engagement information field group (Community Score, Learning Score, Activity Score, Loyalty Score) (FR-013)
- [ ] T040 [US2] Financial information field group (Lifetime Spend, Wallet Balance, Total Purchases, Average Order Value) (FR-014)
- [ ] T041 [US2] Behavioral information field group (Last Login, Active Devices, Preferred Time, Preferred Channel) (FR-015)
- [ ] T042 [US2] Customer 360 Dashboard (14 sections: Personal Information, Activity Timeline, Purchases, Membership, Community History, Learning Progress, Podcast Listening, Ebook Reading, Event Attendance, Campaign Responses, Support History, Rewards, Referrals, AI Insights), wired to acceptance scenarios 1–2 (FR-016)
- [ ] T043 [US2] Chronological Customer Timeline with timestamped interactions, wired to T006, acceptance scenario 1 (FR-017)
- [ ] T044 [US2] Real-time profile-field update on new event without requiring a manual refresh, wired to acceptance scenario 3
- [ ] T045 [US2] Sub-2-second profile load performance, wired to acceptance scenario 4 (FR-042)
- [ ] T046 [P] [US2] Customer 360 Dashboard UI
- [ ] T047 [US2] Integration test: three cross-module interactions appear correctly attributed on the timeline, all 6 field groups are visible on one screen, a new event updates the affected profile field without manual refresh, the profile loads within the performance target — all 4 acceptance scenarios in `backend/tests/integration/us2-unified-customer-profile-360.integration.test.ts`

**Checkpoint**: The single-source-of-truth read target for every downstream capability is independently functional.

---

## Phase 5: User Story 3 — Real-Time Event Collection Feeds the Platform From Every Channel (Priority: P1)

**Independent Test**: Fire a supported event type from a source module and verify it is captured by the Event Collection Engine with complete metadata within the stated performance target.

- [ ] T048 [US3] Data collection across 6 channel categories (Digital Channels, Learning Platforms, Community, Commerce, Marketing, Customer Support), wired to T004 (FR-005)
- [ ] T049 [US3] 21 supported event types, wired to acceptance scenario 1 (FR-018)
- [ ] T050 [US3] 13-field event metadata capture on every collected event, wired to T026's contract test, acceptance scenario 1 (FR-019)
- [ ] T051 [US3] Sub-1-second event processing performance, wired to acceptance scenario 2 (FR-040)
- [ ] T052 [US3] Chronological-order preservation for sequential events (e.g., search then click), wired to acceptance scenario 3
- [ ] T053 [US3] Social Media / Marketing Platform external-channel ingestion through the same collection layer as first-party events, wired to acceptance scenario 4
- [ ] T054 [P] [US3] Event collection monitoring UI
- [ ] T055 [US3] Integration test: a video play event is captured with full metadata, any supported event is processed under 1 second, a search followed by a click appear in correct chronological order, an external-channel event is ingested through the same layer as first-party events — all 4 acceptance scenarios in `backend/tests/integration/us3-realtime-event-collection.integration.test.ts`

**Checkpoint**: The raw material every downstream capability operates on is independently functional.

---

## Phase 6: User Story 4 — Data Validation and Cleansing Keep the Platform Trustworthy (Priority: P2)

**Independent Test**: Submit a batch of events/records containing at least one known-invalid case and verify the Data Validation Engine flags/rejects them while the Data Cleansing Engine removes or corrects them before they reach the unified profile.

- [ ] T056 [US4] 7-check validation (Required Fields, Format, Duplicate Detection, Null Checking, Timestamp Validation, Schema Validation, Relationship Validation), wired to T027's contract test, acceptance scenario 1 (FR-020)
- [ ] T057 [US4] Malformed-email removal/correction before reaching the unified profile, wired to acceptance scenario 2 (FR-021)
- [ ] T058 [US4] Duplicate-record removal on detection, wired to acceptance scenario 3 (FR-021)
- [ ] T059 [US4] Invalid-Campaign-ID relationship-validation flagging, wired to acceptance scenario 4 (FR-020)
- [ ] T060 [US4] Remaining cleansing categories (fake accounts, spam activities, broken references) (FR-021)
- [ ] T061 [P] [US4] Validation/cleansing review UI
- [ ] T062 [US4] Integration test: a missing required field is flagged, a malformed email is removed or corrected rather than written unchanged, a duplicate record is removed, an invalid Campaign ID is flagged under Relationship Validation — all 4 acceptance scenarios in `backend/tests/integration/us4-data-validation-cleansing.integration.test.ts`

**Checkpoint**: The guarantee that downstream consumers never work around dirty data themselves is independently functional.

---

## Phase 7: User Story 5 — Data Classification and Governance Protect Sensitive Data (Priority: P2)

**Independent Test**: Assign a classification label to a representative dataset, verify the platform enforces access/security controls consistent with that label, and verify a customer's privacy-rights request against that dataset is honored.

- [ ] T063 [US5] 8-category governance policy implementation (Ownership, Stewardship, Classification, Privacy, Retention, Archiving, Deletion, Audit), wired to T016 (FR-027)
- [ ] T064 [US5] 5-tier classification labeling with mandatory assignment on every dataset, wired to T008, acceptance scenario 1 (FR-028–FR-029)
- [ ] T065 [US5] 7-type consent tracking, wired to T009 (FR-030)
- [ ] T066 [US5] Privacy Controls (Right to Access, Right to Delete, Right to Correct, Data Export, Consent Withdrawal), wired to acceptance scenarios 2–3 (FR-031)
- [ ] T067 [US5] Data Security controls (AES Encryption, TLS, MFA, RBAC, Audit Logs, Secure APIs, Key Rotation), wired to acceptance scenario 4 (FR-032)
- [ ] T068 [P] [US5] Data governance/classification admin UI
- [ ] T069 [US5] Integration test: a payment dataset is classified Highly Confidential or Restricted, a Right to Delete request is honored per Privacy Controls, a consent withdrawal is reflected in tracking, Restricted-dataset access is captured in the audit log — all 4 acceptance scenarios in `backend/tests/integration/us5-data-classification-governance.integration.test.ts`

**Checkpoint**: The cross-cutting controls required before the platform can be trusted to hold enterprise/customer data at scale are independently functional.

---

## Phase 8: User Story 6 — AI Intelligence Layer Computes Real-Time Customer Scores (Priority: P2)

**Independent Test**: Generate a sequence of events sufficient to move a test customer's profile toward a known risk pattern, and verify the AI Intelligence Layer's Churn Risk score updates to reflect that pattern within the real-time update window.

- [ ] T070 [US6] 7 real-time customer score computations (Churn Risk, Purchase Intent, Learning Probability, Engagement Score, Lifetime Value, Referral Potential, Community Influence), wired to T010, acceptance scenario 1 (FR-033)
- [ ] T071 [US6] 6 predictive models (Purchase Prediction, Membership Renewal, Churn Prediction, Content Recommendation, Campaign Response, Upsell Probability), wired to T011, acceptance scenario 3 (FR-034)
- [ ] T072 [US6] Sub-seconds real-time score/activity/segment/journey/recommendation update on a triggering event, wired to acceptance scenario 2 (FR-035)
- [ ] T073 [US6] Fresh-value-on-display guarantee, never showing a stale cached value, wired to acceptance scenario 4
- [ ] T074 [P] [US6] AI Intelligence score display UI
- [ ] T075 [US6] Integration test: purchase and engagement history produces the 5 core scores, a qualifying event updates score/segment/recommendations within seconds, predictive models produce renewal and upsell probability, a displayed score reflects the latest recalculation rather than a stale cache — all 4 acceptance scenarios in `backend/tests/integration/us6-ai-intelligence-layer.integration.test.ts`

**Checkpoint**: The high-value intelligence layer downstream marketing/personalization systems act on is independently functional.

---

## Phase 9: User Story 7 — Data Quality Dashboard Surfaces Platform Health (Priority: P3)

**Independent Test**: With a known set of validated and flagged records already in the platform, open the Data Quality Dashboard and verify the 6 metrics reflect the actual state of those records.

- [ ] T076 [US7] 6-metric Data Quality Dashboard (Completeness, Accuracy, Consistency, Timeliness, Validity, Uniqueness), wired to T015, acceptance scenario 1 (FR-036)
- [ ] T077 [US7] Completeness metric reflecting missing-optional-field gaps, wired to acceptance scenario 1
- [ ] T078 [US7] Uniqueness metric reflecting post-cleansing duplicate reduction, wired to acceptance scenario 2
- [ ] T079 [US7] Sub-3-second dashboard render performance, wired to acceptance scenario 3 (FR-044)
- [ ] T080 [US7] Timeliness metric reflecting stale-timestamp records, wired to acceptance scenario 4
- [ ] T081 [P] [US7] Data Quality Dashboard UI
- [ ] T082 [US7] Integration test: Completeness reflects a missing-field gap, Uniqueness reflects merged-duplicate reduction, the dashboard renders under 3 seconds, Timeliness reflects stale records — all 4 acceptance scenarios in `backend/tests/integration/us7-data-quality-dashboard.integration.test.ts`

**Checkpoint**: The observability layer catching data-quality problems before they degrade AI models, segmentation, or executive reporting is independently functional.

---

## Phase 10: Data Enrichment, Segmentation, Warehouse/MDM & Enterprise Analytics/Executive Dashboard remainder (supports FR-022–FR-026, FR-037–FR-038; cross-cutting, no single owning story)

- [ ] T083 Profile enrichment (Interest Categories, Behavioral Scores, Purchase Intent, Churn Probability, Lifetime Value, Preferred Content, Learning Style, Community Engagement) (FR-022)
- [ ] T084 10 baseline customer segments (New Users, Premium Members, Free Users, Active Learners, Inactive Users, Community Leaders, High Value Customers, VIP Members, Frequent Buyers, Churn Risk Users), wired to T012 (FR-023)
- [ ] T085 Automatic segment-membership update as underlying customer data changes (FR-024)
- [ ] T086 Marketing Data Warehouse across 11 domains (Customer, Campaign, Community, Learning, Commerce, Finance, Events, Marketing, Sales, Support, Operations), wired to T014 (FR-025)
- [ ] T087 Master Data Management across 10 master entity types (Customer, Course, Ebook, Podcast, Campaign, Product, Membership, Brand, Vendor, Employee), wired to T013 (FR-026)
- [ ] T088 Enterprise Analytics reports (Customer Growth, Active Users, Retention, Revenue, Community Activity, Learning Analytics, Marketing Performance), consistent with `027`'s dashboard/reporting conventions where practicable (FR-037)
- [ ] T089 Executive Dashboard (Customer Count, Active Members, Revenue, Campaign ROI, Growth Rate, Churn, Engagement, AI Insights) (FR-038)

**Checkpoint**: The enrichment, segmentation, warehouse, MDM, and enterprise-reporting surface rounding out full platform coverage is independently functional.

---

## Phase 11: API Services, Performance/Acceptance-Criteria Verification & Polish

- [ ] T090 [P] API services (Customer Search, Customer Update, Event Submission, Segment Query, Analytics Query, Recommendation Service) (FR-039)
- [ ] T091 Performance hardening pass toward all 5 numeric targets (event processing under 1s, customer lookup under 500ms, profile load under 2s, analytics query under 3s, dashboard render under 3s) (FR-040–FR-044)
- [ ] T092 Final acceptance-criteria verification pass across all 10 stated criteria (FR-045–FR-054, SC-009)
- [ ] T093 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (`019`/`034` profile reconciliation as highest priority, false-merge detection/reversal, field-level conflict-resolution precedence, real-time-recalculation-miss degradation behavior, Right-to-Delete cascade/timeframe, the "Churn Risk" naming overlap with `029`)
- [ ] T094 Final audit: cross-check every FR-001–FR-054 against an implementation or validation task; verify the `019`/`034` profile question remains explicitly unresolved rather than silently merged, and the AI Intelligence Layer reuses `008`'s gateway rather than a separate AI stack
- [ ] T095 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `008`'s AI gateway and `019`'s Consent Record model, and produces the entity/pipeline infrastructure every subsequent phase depends on, while explicitly not resolving the `019`/`034` profile question.
- **P1 stories (US1–US3)**: these three form one inseparable ingestion-to-profile pipeline per spec.md's own framing — US3 (event collection) supplies the raw material, US1 (identity resolution) determines whose data it is, and US2 (unified profile/Customer 360) is the consolidated read target; they should be built and validated together, with US3 landing first since US1 and US2 both consume its output.
- **P2 stories (US4–US6)**: US4 (validation/cleansing) sits directly between raw collection (P1) and every consumer; US5 (classification/governance) is a cross-cutting control layer; US6 (AI Intelligence) depends on US4's clean-data guarantee — all three can build in parallel once US1–US3 are stable, though US6 should follow US4 given FR-048's clean-data requirement.
- **P3 story (US7)** depends on US4/US5 producing validated, classified data to report on and should land last among the numbered stories.
- **Phase 10 (Enrichment/Segmentation/Warehouse/MDM/Enterprise Analytics)** depends on Foundational and US1–US4; can build in parallel with the P2/P3 stories.
- **Polish (Phase 11)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, pipeline architecture) → **STOP and VALIDATE** the three Foundational contract tests (identity-resolution-merge, event-processing-realtime-metadata, ai-input-data-validated-cleansed) pass → US3 (event collection) → US1 (identity resolution) → US2 (unified profile/Customer 360) → **STOP and VALIDATE** the ingestion-to-profile pipeline produces exactly one trustworthy profile per customer → US4 (validation/cleansing) + US5 (classification/governance) in parallel → US6 (AI Intelligence) → **STOP and VALIDATE** AI scores are computed only from clean, classified data → US7 (Data Quality Dashboard) → Phase 10 (enrichment/segmentation/warehouse/MDM/enterprise analytics) → Polish.
