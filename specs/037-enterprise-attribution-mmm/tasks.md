---
description: "Task list for Feature 037 — Enterprise Attribution, Incrementality Measurement & Media Mix Modeling"
---

# Tasks: Enterprise Attribution, Incrementality Measurement & Media Mix Modeling

**Input**: Design documents from `/specs/037-enterprise-attribution-mmm/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 027 and 028), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `027`'s Tracked Event stream/Dashboard framework/Customer Journey entity, `028`'s attribution-model/financial-formula engine, `009`'s currency infrastructure, and `008`'s AI gateway exist as extension/integration points.

**⚠️ UNRESOLVED DEPENDENCY**: This feature's 5-state finalization vocabulary (Real Time → Preliminary → Updated → Final → Adjusted) and `028`'s 8-state vocabulary (Preliminary → ... → Finalized → Reopened → Corrected) both exist independently — spec.md explicitly preserves this rather than silently adopting either naming, and the constitution's own Article IV citation ("Preliminary → Finance Reviewed → Finalized/Locked") matches neither exactly. No task below may assume a specific resolution.

**Tests**: Included throughout — Primary Attribution Model exclusivity, Identity Confidence reporting-gate enforcement, and budget-reallocation approval gating each get a dedicated Foundational contract test, matching this spec's own SC-002, SC-003, and SC-006/Constitution Article II.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus three supplementary cross-cutting phases for FR groups not owned by any single prioritized story (cross-channel/offline/affiliate attribution and financial formulas; data/model governance and dashboards/AI assistant; privacy/security/API/reliability polish).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor reused via `016`), and that `027`'s ingestion/dashboard/Customer Journey, `028`'s attribution/financial-formula engine, `009`'s currency infrastructure, and `008`'s AI gateway exist as integration points
- [ ] T002 Resolve `research.md` open items before proceeding, **in priority order**: (1) the finalization-vocabulary question shared with `028` and the constitution's own imprecise citation; (2) statistical test / minimum-detectable-effect methodology / contamination-correction procedure for incrementality experiments; (3) specific MMM algorithm/technique; (4) Identity Confidence Level numeric boundaries and aggregation-suppression threshold; (5) mandatory-approver-role combination by budget size/risk
- [ ] T003 [P] Add `backend/src/modules/{measurement-framework,marketing-taxonomy-registry,touchpoint-journey-reconstruction,attribution-models-identity,cross-channel-offline-attribution,incrementality-engine,media-mix-modeling,revenue-contribution-hierarchy,financial-formulas-governance,budget-optimization-engine,attribution-finalization,measurement-data-model-governance,enterprise-dashboards-alerts,ai-measurement-assistant,attribution-governance-api}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Marketing Campaign` entity in `backend/src/modules/marketing-taxonomy-registry/marketing-campaign.entity.ts`
- [ ] T005 [P] Define the `Marketing Touchpoint` entity in `backend/src/modules/touchpoint-journey-reconstruction/marketing-touchpoint.entity.ts`
- [ ] T006 [P] Define the `Customer Journey` extension entity in `backend/src/modules/touchpoint-journey-reconstruction/customer-journey.entity.ts` — extends `027`'s existing entity, not a fifth independent journey system
- [ ] T007 [P] Define the `Conversion Event` entity in `backend/src/modules/touchpoint-journey-reconstruction/conversion-event.entity.ts`
- [ ] T008 [P] Define the `Attribution Model` entity in `backend/src/modules/attribution-models-identity/attribution-model.entity.ts` — extends `028`'s existing model catalog
- [ ] T009 [P] Define the `Identity Confidence Level` entity in `backend/src/modules/attribution-models-identity/identity-confidence-level.entity.ts`
- [ ] T010 [P] Define the `Incrementality Experiment` entity in `backend/src/modules/incrementality-engine/incrementality-experiment.entity.ts`
- [ ] T011 [P] Define the `Treatment/Control Group Assignment` entity in `backend/src/modules/incrementality-engine/treatment-control-assignment.entity.ts`
- [ ] T012 [P] Define the `Incrementality Results Registry Entry` entity in `backend/src/modules/incrementality-engine/incrementality-registry-entry.entity.ts`
- [ ] T013 [P] Define the `Media Mix Model (MMM)` entity in `backend/src/modules/media-mix-modeling/media-mix-model.entity.ts`
- [ ] T014 [P] Define the `Budget Scenario / Budget Optimization Recommendation` entity in `backend/src/modules/budget-optimization-engine/budget-optimization-recommendation.entity.ts`
- [ ] T015 [P] Define the `Revenue Contribution Record` entity in `backend/src/modules/revenue-contribution-hierarchy/revenue-contribution-record.entity.ts`
- [ ] T016 [P] Define the `Attribution Finalization State` entity in `backend/src/modules/attribution-finalization/attribution-finalization-state.entity.ts`
- [ ] T017 [P] Define the `Marketing Cost Record` entity in `backend/src/modules/financial-formulas-governance/marketing-cost-record.entity.ts`
- [ ] T018 [P] Define the `Model Governance Record` entity in `backend/src/modules/measurement-data-model-governance/model-governance-record.entity.ts`
- [ ] T019 [P] Define the `Measurement Definition` entity in `backend/src/modules/measurement-data-model-governance/measurement-definition.entity.ts`
- [ ] T020 [P] Define the `Primary Attribution Model` designation entity in `backend/src/modules/attribution-models-identity/primary-attribution-model.entity.ts`
- [ ] T021 [P] Define the `Attribution Result` entity in `backend/src/modules/attribution-models-identity/attribution-result.entity.ts`
- [ ] T022 [P] Define the platform-wide `Audit Log Entry` reference in `backend/src/modules/attribution-governance-api/audit-log-entry.reference.ts`
- [ ] T023 Implement the governed marketing taxonomy (17 dimensions) with naming-convention validation, wired to T004 (FR-006)
- [ ] T024 Implement campaign-registration requirements (17 fields) before launch (FR-007)
- [ ] T025 Implement standardized tracking-parameter generation/management with anomaly detection (FR-008)
- [ ] T026 Implement touchpoint capture (12 types, 17 metadata fields), wired to T005 (FR-009)
- [ ] T027 Implement conversion-event capture (11 types, 12 fields), wired to T007 (FR-010)
- [ ] T028 Implement customer-journey reconstruction — extends `027`'s entity, configurable attribution windows — wired to T006 (FR-011)
- [ ] T029 Implement the Attribution Engine core (7 attribution approaches) — reproducible, model-version-linked — extends `028`'s engine, wired to T008 (FR-012)
- [ ] T030 First-Touch attribution, extending `028`'s model (FR-013)
- [ ] T031 Last-Touch attribution, extending `028`'s model (FR-014)
- [ ] T032 Last Non-Direct attribution with direct-visit-replacement prevention (FR-015)
- [ ] T033 Linear attribution, extending `028`'s model (FR-016)
- [ ] T034 Time-Decay attribution with configurable decay rate, extending `028`'s model (FR-017)
- [ ] T035 Position-Based attribution with configurable allocation, extending `028`'s model (FR-018)
- [ ] T036 Data-Driven Attribution with model confidence/explanation, extending `028`'s model (FR-019)
- [ ] T037 Note: this feature's `Customer Journey` extends `027`'s entity; it is not a fifth independent journey-reconstruction system (per plan.md §2)
- [ ] T038 Note: base attribution-model calculation mechanics are reused from `028`'s engine; this feature adds governance (Primary Model designation, Identity Confidence gating) on top (per plan.md §1)
- [ ] T039 Note: financial formulas referenced by this feature (FR-057–FR-062) restate, not recompute, `028`'s ROAS/ROI/CAC/LTV/Payback engine
- [ ] T040 Contract test: exactly one Primary Attribution Model sources official/finance-facing reports at any time, in `backend/tests/contract/primary-model-exclusive-official-source.contract.test.ts` (FR-021, SC-002)
- [ ] T041 Contract test: zero official customer-level reports contain records below the governance-approved Identity Confidence threshold, enforced at the reporting layer itself, in `backend/tests/contract/identity-confidence-reporting-gate.contract.test.ts` (FR-022, SC-003)
- [ ] T042 Contract test: zero budget reallocations take effect without a recorded approval-chain decision, in `backend/tests/contract/budget-reallocation-approval-gate.contract.test.ts` (FR-067, SC-006, Constitution Article II)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Navigate Performance Through the Five-Level Marketing Measurement Framework (Priority: P1) 🎯 MVP

**Independent Test**: Pull metrics for one campaign and confirm each of the five levels renders its own defined metric set without any level's figures leaking into another.

- [ ] T043 [US1] 5-level framework implementation with distinct, non-leaking metric labeling, wired to acceptance scenario 1 (FR-001)
- [ ] T044 [US1] Level 1 (Delivery) and Level 2 (Engagement) metric capture (FR-002)
- [ ] T045 [US1] Level 3 (Conversion) and Level 4 (Revenue) metric capture (FR-003)
- [ ] T046 [US1] Level 5 (Incremental Business Value) populated only from validated incrementality sources, wired to acceptance scenarios 2–3 (FR-004)
- [ ] T047 [US1] Business-outcome connection (13 outcome types) with graceful measurement under incomplete tracking, wired to acceptance scenario 4 (FR-005)
- [ ] T048 [P] [US1] Five-level measurement view UI
- [ ] T049 [US1] Integration test: a campaign view shows Levels 1–4 under their own labels, Level 5 shows incremental metrics distinct from Levels 3/4, an experiment-less campaign shows Level 5 as unavailable rather than substituted, an attribution-vs-incrementality question is routed to the correct levels — all 4 acceptance scenarios in `backend/tests/integration/us1-five-level-measurement-framework.integration.test.ts`

**Checkpoint**: The organizing structure the entire chapter is built on, providing shared vocabulary across marketing/finance/executives, is independently functional.

---

## Phase 4: User Story 2 — Designate a Primary Attribution Model for Official Reporting, With Alternates for Analysis (Priority: P1)

**Independent Test**: Configure two attribution models against the same conversion data; confirm official dashboards use only the primary model's output, the alternate is comparison-only, and changing the primary model requires the full governance record.

- [ ] T050 [US2] Attribution Model Comparison capability (7 comparison dimensions), wired to T040's contract test, acceptance scenario 3 (FR-020)
- [ ] T051 [US2] Primary Attribution Model designation requiring the full governance record (owner, version, effective date, justification, review date, approval), wired to acceptance scenario 1 (FR-021)
- [ ] T052 [US2] Official-report exclusive sourcing from the primary model, with alternates comparison-only, wired to acceptance scenario 2 (FR-021)
- [ ] T053 [US2] Primary-model-change governance (new justification, executive approval, change history — no silent replacement), wired to acceptance scenario 4 (FR-021)
- [ ] T054 [P] [US2] Primary Attribution Model governance UI
- [ ] T055 [US2] Integration test: primary designation requires the full governance record, official reports use only the primary model with clear labeling, the comparison dashboard shows all 7 dimensions and flags conclusion shifts, a primary-model change requires justification/approval/history — all 4 acceptance scenarios in `backend/tests/integration/us2-primary-attribution-model-governance.integration.test.ts`

**Checkpoint**: The governance requirement every downstream financial figure depends on, directly implementing Constitution Article IV, is independently functional.

---

## Phase 5: User Story 3 — Identity Confidence Classification Gates Customer-Level Records From Official Reporting (Priority: P1)

**Independent Test**: Feed the system touchpoints with varying identity-match strength; confirm each is classified into the correct confidence level and official customer-level reports exclude or label records below the configured threshold.

- [ ] T056 [US3] 6-level Identity Confidence classification, wired to T009, acceptance scenario 1 (FR-022)
- [ ] T057 [US3] Governance-policy-driven exclusion of low-confidence records from official reporting, wired to T041's contract test, acceptance scenarios 2–3 (FR-022)
- [ ] T058 [US3] Per-touchpoint (not blended-journey) confidence labeling, wired to acceptance scenario 4
- [ ] T059 [US3] Cross-device attribution (6 device/signal types) with per-journey confidence recording, wired to T037's reuse note (FR-023)
- [ ] T060 [P] [US3] Identity confidence review UI
- [ ] T061 [US3] Integration test: a logged-in match is classified Verified and eligible, a probabilistic match is classified Low Confidence/Anonymous per policy, excluded records remain visible in an exploratory view with their label, a mixed-confidence journey shows per-touchpoint labels rather than one blended value — all 4 acceptance scenarios in `backend/tests/integration/us3-identity-confidence-classification.integration.test.ts`

**Checkpoint**: The foundational data-integrity gate preventing probabilistic matches from silently inflating official numbers is independently functional.

---

## Phase 6: User Story 4 — Run an Incrementality Experiment (RCT / Geo-Holdout) and Compute Incremental CPA and Incremental ROAS (Priority: P1)

**Independent Test**: Configure a geo-holdout experiment, run it to completion, and confirm the registry entry reports lift/CI/significance plus Incremental CPA and Incremental ROAS, stored separately from attributed CPA/ROAS.

- [ ] T062 [US4] Treatment/control comparison for 6 incremental outcome types, wired to T010 (FR-031)
- [ ] T063 [US4] 10 experiment types (RCT, customer holdout, geo-holdout, channel holdout, campaign holdout, time-based, matched-market, creative, offer, conversion-lift), wired to acceptance scenario 1 (FR-032)
- [ ] T064 [US4] Stable treatment/control assignment across 9 randomization-unit types minimizing contamination, wired to T011 (FR-033)
- [ ] T065 [US4] Holdout management (6 scopes) with automated suppression from marketing activation (FR-034)
- [ ] T066 [US4] Incremental-result calculation (absolute/relative lift, count, revenue, confidence interval, significance) (FR-035)
- [ ] T067 [US4] Experiment result reporting (11 fields) with premature-declaration prevention, wired to acceptance scenario 2 (FR-036)
- [ ] T068 [US4] 10 guardrail metrics with auto-pause on breach, wired to acceptance scenario 4 (FR-037)
- [ ] T069 [US4] 6-type contamination detection with flagging (FR-038)
- [ ] T070 [US4] Incremental CPA calculation (Campaign Cost ÷ Incremental Conversions), wired to acceptance scenario 3 (FR-039)
- [ ] T071 [US4] Incremental ROAS calculation (Incremental Revenue ÷ Advertising Cost), treated as a stronger causal metric than attributed ROAS, wired to acceptance scenario 3 (FR-040)
- [ ] T072 [US4] Incrementality Results Registry (13 fields) reusable for planning/MMM, wired to T012 (FR-041)
- [ ] T073 [P] [US4] Incrementality experiment configuration/results UI
- [ ] T074 [US4] Integration test: a geo-holdout reports full lift/significance metrics, an early request prevents a success/failure declaration, Incremental CPA and ROAS are calculated and displayed distinctly, a guardrail breach pauses and flags the experiment — all 4 acceptance scenarios in `backend/tests/integration/us4-incrementality-experiment.integration.test.ts`

**Checkpoint**: The causal ground-truth measurement preventing marketing from over-crediting itself is independently functional.

---

## Phase 7: User Story 5 — Reconcile Media Mix Modeling Against Multi-Touch Attribution Rather Than Assuming Identical Results (Priority: P2)

**Independent Test**: Run MMM and MTA independently over the same historical quarter; confirm the reconciliation view shows both outputs side by side, flags material divergence, and does not merge or average them.

- [ ] T075 [US5] MMM Engine estimation from historical time-series data across defined trigger conditions, wired to T013, acceptance scenario 1 (FR-042)
- [ ] T076 [US5] MMM input acceptance (19 input types) across 17 covered channels (FR-043)
- [ ] T077 [US5] Carryover-effect modeling with configurable/validated assumptions (FR-044)
- [ ] T078 [US5] Saturation/diminishing-returns modeling (efficient range, saturation point, overspend, underinvestment) (FR-045)
- [ ] T079 [US5] Seasonality and external-factor controls (9+9 categories), documented (FR-046)
- [ ] T080 [US5] MMM output set (11 outputs), wired to acceptance scenario 1 (FR-047)
- [ ] T081 [US5] MTA-vs-MMM reconciliation flagging overvalued/undervalued channels without assuming identical results, wired to acceptance scenarios 2–4 (FR-048)
- [ ] T082 [US5] Unified Measurement Framework blending MTA/incrementality/MMM/self-reported/revenue-intelligence, wired to T037/T038's reuse notes (FR-049)
- [ ] T083 [P] [US5] MMM/MTA reconciliation dashboard UI
- [ ] T084 [US5] Integration test: an MMM run produces all 11 output types, an undervalued TV channel is labeled with a brand-effect gap rather than zero contribution, an overvalued channel is flagged with possible explanations, a combined report never sums MMM and MTA into one total — all 4 acceptance scenarios in `backend/tests/integration/us5-mmm-mta-reconciliation.integration.test.ts`

**Checkpoint**: The safeguard against over- or under-investing in brand/offline/long-tail channels MTA cannot see is independently functional.

---

## Phase 8: User Story 6 — Submit a Budget Optimization Engine Recommendation for Finance/Executive Approval Before Reallocating Spend (Priority: P2)

**Independent Test**: Generate a budget optimization recommendation from known marginal-return estimates and constraints; confirm the recommendation respects every constraint, is presented via the scenario simulator, is never applied automatically, and only applies after explicit approver acceptance.

- [ ] T085 [US6] Forecasting Engine (10 forecast targets, 10 scenario types) (FR-063)
- [ ] T086 [US6] Budget Optimization Engine recommendation generation against 8 approved objectives, wired to T014, acceptance scenario 1 (FR-064)
- [ ] T087 [US6] Constraint respect (12 constraint types), wired to acceptance scenario 1 (FR-065)
- [ ] T088 [US6] Marginal-return analysis plus Budget Scenario Simulator (6 adjustable inputs, 8 projected outputs), wired to acceptance scenario 2 (FR-066)
- [ ] T089 [US6] Mandatory human-approval gate before any budget change, with recorded accept/reject, wired to T042's contract test, acceptance scenarios 3–4 (FR-067)
- [ ] T090 [P] [US6] Budget Scenario Simulator / approval-queue UI
- [ ] T091 [US6] Integration test: a recommendation respects all constraints, the simulator shows 8 projections before any change, a single rejection blocks the change with a recorded reason, full approval records the audit trail and applies the change never automatically — all 4 acceptance scenarios in `backend/tests/integration/us6-budget-optimization-approval.integration.test.ts`

**Checkpoint**: The Article-II-mandated mechanism turning measurement into an actual, human-approved budget action is independently functional.

---

## Phase 9: User Story 7 — View the Revenue Contribution Hierarchy Without Double-Counting or Blending Revenue Tiers (Priority: P2)

**Independent Test**: Take one conversion with a known gross amount, apply attribution/incrementality/a subsequent refund, and confirm the system displays all seven tiers separately, never sums two without a label, and the refund updates only Net/Recognized.

- [ ] T092 [US7] Marketing-activity-to-business-outcome connection (11 outcome types) with consistent definitions, wired to T015 (FR-050)
- [ ] T093 [US7] Marketing-Sourced/Influenced/Incremental Revenue definitions with causal-validation gating, wired to acceptance scenario 1 (FR-051)
- [ ] T094 [US7] 7-tier Revenue Contribution Hierarchy display, never combined without labeling, wired to acceptance scenarios 1, 3–4 (FR-052)
- [ ] T095 [US7] Refund/cancellation flow-through updating Net/Recognized without altering Observed/Attributed, wired to acceptance scenario 2 (FR-030 tie-in, FR-052)
- [ ] T096 [US7] Customer-quality-indicator evaluation (10 indicators) plus cohort grouping (9 dimensions) (FR-053)
- [ ] T097 [US7] Retention-revenue calculations (7 metrics) separate from acquisition (FR-054)
- [ ] T098 [US7] Funnel analytics (9 stages, 7 metrics) (FR-055)
- [ ] T099 [US7] Multi-product/subscription revenue tracking (7+7 dimensions) (FR-056)
- [ ] T100 [P] [US7] Revenue Contribution Hierarchy UI
- [ ] T101 [US7] Integration test: a purchase shows 4 separate labeled tiers, a refund updates Net/Recognized while Observed/Attributed remain intact, a dashboard blocks unlabeled tier combination, Incremental Profit is shown as its own distinct tier — all 4 acceptance scenarios in `backend/tests/integration/us7-revenue-contribution-hierarchy.integration.test.ts`

**Checkpoint**: The connective structure preventing executives and finance from double-counting the same rupee under two revenue definitions is independently functional.

---

## Phase 10: User Story 8 — Attribution Finalization Lifecycle With Audited Manual Adjustments (Priority: P3)

**Independent Test**: Generate a real-time attribution result, allow it to progress to Final, then submit a manual adjustment against the Final result and confirm the adjustment requires reason/evidence/approval and preserves the original Final figure.

- [ ] T102 [US8] 5-state finalization lifecycle (Real Time, Preliminary, Updated, Final, Adjusted), wired to T016 — vocabulary preserved as-written, not silently merged with `028`'s per plan.md's finding — acceptance scenarios 1–2 (FR-068)
- [ ] T103 [US8] Final-status immutability with manual-adjustment-only correction path, wired to acceptance scenario 3 (FR-069)
- [ ] T104 [US8] Dashboard freshness/finalization-status labeling preventing preliminary-as-final confusion, wired to acceptance scenario 4 (FR-070)
- [ ] T105 [P] [US8] Finalization status / manual adjustment UI
- [ ] T106 [US8] Integration test: a new conversion is marked Real Time/Preliminary and labeled, a clean window close/reconciliation moves it to Final, a correction requires reason/evidence/identity/timestamp/approval and preserves the Final figure, a dashboard clearly shows freshness and finalization status — all 4 acceptance scenarios in `backend/tests/integration/us8-attribution-finalization-lifecycle.integration.test.ts`

**Checkpoint**: The concrete implementation of historical immutability for attribution/revenue data in this chapter is independently functional.

---

## Phase 11: Cross-Channel/Offline/Affiliate/Adjustment Attribution & Financial Formulas remainder (supports FR-024–FR-030, FR-057–FR-062; cross-cutting, no single owning story)

- [ ] T107 Cross-channel touchpoint connection (14 channels) with centralized duplication/overlap resolution (FR-024)
- [ ] T108 Offline conversion imports (7 sources) with matching-key/timestamp requirement (FR-025)
- [ ] T109 Affiliate module (10 tracked fields) with duplicate-commission prevention; influencer measurement (6 methods, 8 metrics) (FR-026)
- [ ] T110 Organic-source measurement (7 types) separate from paid, plus dark-traffic classification with estimated-label disclosure (FR-027)
- [ ] T111 Self-reported attribution as a supplement, never a silent replacement, for behavioral attribution (FR-028)
- [ ] T112 Controlled manual attribution adjustments (6 trigger types) requiring reason/evidence/identity/timestamp/approval/audit (FR-029)
- [ ] T113 Refund/cancellation/payment-failure/chargeback/return revenue updates (4 distinct revenue figures); revenue-type distinction (10 categories) with a Finance-defined official field (FR-030)
- [ ] T114 ROAS calculation referencing `028`'s engine, revenue-basis-labeled (FR-058)
- [ ] T115 Marketing ROI calculation referencing `028`'s engine (FR-059)
- [ ] T116 CAC calculation (5 variants) referencing `028`'s engine (FR-060)
- [ ] T117 CLV and LTV:CAC ratio referencing `028`'s engine (FR-061)
- [ ] T118 CAC Payback Period referencing `028`'s engine (FR-062)

**Checkpoint**: The cross-channel/offline/affiliate attribution and financial-formula restatement layer is independently functional.

---

## Phase 12: Data/Model Governance, Dashboards/Alerts & AI Assistant remainder (supports FR-071–FR-081; cross-cutting, no single owning story)

- [ ] T119 Measurement Definitions Catalog (15 governed terms), wired to T019 (FR-071)
- [ ] T120 Cross-system reconciliation (8 systems, 8 mismatch types) (FR-072)
- [ ] T121 Currency/timezone handling referencing `009`'s infrastructure (FR-073)
- [ ] T122 Model Governance Record (13 fields) plus 10-category validation, wired to T018 (FR-074)
- [ ] T123 Plain-language model explanation plus 8-signal drift/quality monitoring (FR-075)
- [ ] T124 Executive Marketing Dashboard (15 metrics) plus Finance Dashboard (11 metrics) (FR-076)
- [ ] T125 Campaign/Channel Performance Dashboards (17 metrics) (FR-077)
- [ ] T126 Creative Performance analytics (9 dimensions, 8 metrics) plus Audience Performance reports (10 metrics) (FR-078)
- [ ] T127 Geographic performance (5 granularities) plus time-based performance (7 dimensions) (FR-079)
- [ ] T128 Attribution alerts (10 types) plus financial alerts (10 types) (FR-080)
- [ ] T129 AI Marketing Measurement Assistant (5 example question types, structured answer format), reviewable before external distribution, wired to `008`'s gateway (FR-081)

**Checkpoint**: The governance, reconciliation, dashboard, and AI-assistant layer rounding out full enterprise measurement coverage is independently functional.

---

## Phase 13: Privacy/Security/RBAC, API/Integration/Reliability & Polish

- [ ] T130 [P] RBAC (11 roles) with agency-user restriction scope, wired to `016` (FR-082)
- [ ] T131 Privacy controls (first-party data, consent, minimization, deletion, export restriction, aggregation-threshold suppression, masking, purpose recording) (FR-083)
- [ ] T132 Security controls (encryption, RBAC, MFA, API auth, secrets, key rotation, network restrictions, audit, intrusion monitoring, DLP) across 12 logged action categories (FR-084)
- [ ] T133 Secure APIs (11 operations) plus 10 webhook event types (FR-085)
- [ ] T134 Integration-framework wiring across the 15 named systems (FR-086)
- [ ] T135 15 mandatory business rules enforcement pass (FR-087)
- [ ] T136 Error handling (13 categories) plus retry infrastructure (8 mechanisms) (FR-088)
- [ ] T137 Performance hardening pass toward all 7 numeric targets plus scale requirements (FR-089)
- [ ] T138 Reliability infrastructure (redundancy, failover, queue-ingestion, replication, health, degradation, disaster recovery) plus configurable retention (10 data types) plus observability (10 dimensions) (FR-090)
- [ ] T139 Testing-requirement coverage across 15 test categories (FR-091)
- [ ] T140 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (finalization-vocabulary question as highest priority, statistical-test/MDE/contamination-correction methodology, MMM algorithm choice, Identity Confidence numeric boundaries, approver-role threshold)
- [ ] T141 Final audit: cross-check every FR-001–FR-091 against an implementation or validation task; verify base attribution-model mechanics and financial formulas reuse `028`'s engine rather than recomputing, `Customer Journey` extends `027`'s entity, and the finalization-vocabulary question remains explicitly unresolved rather than silently assumed
- [ ] T142 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `027`'s ingestion/dashboard/journey infrastructure and `028`'s attribution/financial-formula engine, and produces the entity/taxonomy/base-model infrastructure every subsequent phase depends on.
- **P1 stories (US1–US4)**: US1 (5-level framework) is the organizing structure and should ship first; US2 (Primary Model governance) and US3 (Identity Confidence) are both data-integrity gates that can build in parallel once US1's framework exists; US4 (incrementality) depends on Foundational's touchpoint/conversion infrastructure and can build in parallel with US2/US3.
- **P2 stories (US5–US7)**: US5 (MMM reconciliation) depends on US4's incrementality outputs as one of its reconciliation inputs; US6 (budget optimization) depends on US4's incremental metrics and US5's MMM outputs as trustworthy inputs; US7 (revenue hierarchy) depends on US2's attribution governance and US4's incrementality validation — all three should follow the P1 stories.
- **P3 story (US8)** depends on US1–US7 already producing the attribution/revenue records this story finalizes and corrects, and should land last among the numbered stories.
- **Phase 11 (Cross-Channel/Offline/Affiliate/Financial Formulas)** depends on Foundational and US2/US4; should land alongside those stories since it supplies additional attribution sources and formula restatements they consume.
- **Phase 12 (Data/Model Governance/Dashboards/AI Assistant)** depends on US1–US7 producing real data to govern and display.
- **Polish (Phase 13)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, taxonomy/registry, base attribution models extending `028`) → **STOP and VALIDATE** the three Foundational contract tests (primary-model-exclusive-official-source, identity-confidence-reporting-gate, budget-reallocation-approval-gate) pass → US1 (5-level framework) → **STOP and VALIDATE** delivery/engagement/conversion/revenue/incremental figures never blend → US2 (Primary Model governance) + US3 (Identity Confidence) in parallel → US4 (incrementality) → **STOP and VALIDATE** the causal ground-truth measurement is trustworthy → US5 (MMM reconciliation) + US7 (revenue hierarchy) in parallel → US6 (budget optimization approval) → US8 (finalization lifecycle) → Phase 11 (cross-channel/financial formulas) + Phase 12 (governance/dashboards/AI assistant) in parallel → Polish.
