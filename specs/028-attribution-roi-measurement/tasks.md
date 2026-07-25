---
description: "Task list for Feature 028 — Marketing Attribution, Revenue Impact & ROI Measurement"
---

# Tasks: Marketing Attribution, Revenue Impact & ROI Measurement

**Input**: Design documents from `/specs/028-attribution-roi-measurement/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its formal §1–§6 ownership/overlap analysis against `027`), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `027`'s Tracked Event stream, Identity Resolution Record, Dashboard framework, Cost Record, and AI Insight entities exist as reuse targets, `008`'s AI gateway, and `009`'s exchange-rate infrastructure — per plan.md's ownership analysis, this feature does **not** re-ingest events, re-resolve identity, or rebuild dashboard infrastructure.

**Tests**: Included throughout — no-double-counting across all 19 models, finalization-lock enforcement, and the AI ROI approval gate each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-002/Constitution Article IV, and SC-006/Constitution Article II.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus two supplementary cross-cutting phases for FR groups not owned by any single prioritized story (Marketing Mix Modeling baseline + finance dashboards; governance/privacy/currency/integration/reliability polish). Per plan.md's ownership analysis, tasks that extend a `027` entity are explicitly marked "extends 027" rather than defining a competing entity, and no task recreates `027`'s Audit Log Entry, Dashboard framework, Tracked Event, or Identity Resolution Record.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor reused via `016`), and that `027`'s Tracked Event stream, Identity Resolution Record, Dashboard framework, Cost Record, and AI Insight entities, `008`'s AI gateway, and `009`'s exchange-rate infrastructure exist as reuse/integration points
- [ ] T002 Resolve `research.md` open items before proceeding: production default values (attribution-window length per conversion type, holdout-group sample-size/duration, AI-budget-recommendation approval threshold), the algorithmic/statistical implementation for Data-Driven/Markov Chain/Shapley Value attribution, the holdout-contamination detection/exclusion procedure, and — critically — plan.md §4's flagged discrepancy that the constitution's Article IV citation names `037`, not this feature, for the "Preliminary → Finance Reviewed → Finalized/Locked" pattern
- [ ] T003 [P] Add `backend/src/modules/{attribution-core-entities,touchpoint-eligibility,conversion-revenue-classification,attribution-model-catalog,revenue-integrity,cost-allocation-reconciliation,financial-formulas,incrementality-testing,marketing-mix-modeling,model-comparison-simulation,attribution-finalization,ai-roi-intelligence,finance-dashboards,attribution-governance,attribution-privacy-currency-tax}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Customer` entity in `backend/src/modules/attribution-core-entities/customer.entity.ts` — **extends `027`'s Identity Resolution Record** as the resolved-identity anchor, not a new identity system (FR-001)
- [ ] T005 [P] Define the `Touchpoint` entity in `backend/src/modules/attribution-core-entities/touchpoint.entity.ts` — **derived from `027`'s Tracked Event stream**, not a second ingestion pipeline (FR-002)
- [ ] T006 [P] Define the `Conversion` entity in `backend/src/modules/attribution-core-entities/conversion.entity.ts` — **extends `027`'s Conversion Definition** (FR-003)
- [ ] T007 [P] Define the `Attribution Result` entity in `backend/src/modules/attribution-core-entities/attribution-result.entity.ts` — new, no `027` equivalent (FR-004)
- [ ] T008 [P] Define the `Marketing Cost` entity in `backend/src/modules/cost-allocation-reconciliation/marketing-cost.entity.ts` — **extends `027`'s Cost Record** (FR-005)
- [ ] T009 [P] Define the `Attribution Model / Model Version` entity in `backend/src/modules/attribution-model-catalog/attribution-model.entity.ts` — **extends `027`'s Attribution Model** for the 7 shared model types, adds 12 new model types (FR-016–FR-034 scope)
- [ ] T010 [P] Define the `Holdout Group / Treatment Group / Control Group` entity in `backend/src/modules/incrementality-testing/holdout-group.entity.ts` — new (FR-050)
- [ ] T011 [P] Define the `Incrementality Experiment` entity in `backend/src/modules/incrementality-testing/incrementality-experiment.entity.ts` — new (FR-050–FR-051)
- [ ] T012 [P] Define the `Reconciliation Record` entity in `backend/src/modules/cost-allocation-reconciliation/reconciliation-record.entity.ts` — new (FR-041, FR-059–FR-060)
- [ ] T013 [P] Define the generic `Approval Request` entity in `backend/src/modules/attribution-governance/approval-request.entity.ts` — new, reusable across model/cost/revenue-correction/finalization/budget approvals (FR-073)
- [ ] T014 [P] Define the `AI Recommendation` entity in `backend/src/modules/ai-roi-intelligence/ai-recommendation.entity.ts` — **extends `027`'s AI Insight** shape with risk level and a bounded action set (FR-061–FR-062)
- [ ] T015 Note: this feature writes into `027`'s existing `Audit Log Entry`; no second, parallel audit-log entity is created despite spec.md's own Key Entities list naming one
- [ ] T016 Implement touchpoint collection across all named sources (paid/organic/direct/referral/affiliate/messaging/community/webinar/event/landing-page/form/content/offline/QR/partner), wired to T005 (FR-006)
- [ ] T017 Implement touchpoint eligibility rules (14 criteria) with a hard rule that internal administrative activity never receives attribution credit (FR-007)
- [ ] T018 Implement engagement quality levels (Passive, Low, Medium, High, Conversion Assist, Conversion) as a model input (FR-008)
- [ ] T019 Implement configurable attribution windows (11 durations) independently configurable by conversion type, product, plan, channel, campaign, segment, and business unit, wired to T009 (FR-009)
- [ ] T020 Implement window-type distinctions (click-through, view-through, lead-to-conversion, conversion-to-renewal, re-engagement) (FR-010)
- [ ] T021 Extend `027`'s Conversion Definition with 4 conversion categories (lead, transaction, recurring revenue, engagement), wired to T006 (FR-011)
- [ ] T022 Implement conversion-definition field completeness enforcement (name, condition, value, revenue field, eligible customer type, model, window, duplicate rule, active status, effective date) (FR-012)
- [ ] T023 Implement conversion value types (fixed, transaction-based, estimated, predicted LTV, no monetary value, finance-approved) with estimated-vs-realized separation in reports (FR-013)
- [ ] T024 Implement revenue classification (17 categories) with the revenue basis clearly indicated on every report (FR-014)
- [ ] T025 Implement revenue-source distinction (directly attributed, marketing-influenced, sales-sourced, partner-sourced, unattributed) preventing incorrect summation across categories (FR-015)
- [ ] T026 Contract test: attribution credit, summed across all eligible touchpoints for any of the 19 supported models, never exceeds the eligible conversion's revenue — zero double-counting, in `backend/tests/contract/attribution-credit-no-double-counting-19-models.contract.test.ts` (FR-035, SC-001)
- [ ] T027 Contract test: a Finalized attribution period is locked against direct modification, and every historical correction requires a reason, approver, audit log entry, and recalculation record, in `backend/tests/contract/attribution-finalization-lock-enforcement.contract.test.ts` (FR-057–FR-058, SC-002, Constitution Article IV)
- [ ] T028 Contract test: zero AI ROI Intelligence recommendations execute (budget/spend/campaign change) without explicit human approval, in `backend/tests/contract/ai-roi-recommendation-approval-gate.contract.test.ts` (FR-062, FR-064, SC-006, Constitution Article II)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Apply a Multi-Touch Attribution Model to a Customer Journey (Priority: P1) 🎯 MVP

**Independent Test**: Take a customer journey with 4+ eligible touchpoints and one conversion of known revenue, run it through the standard models (first-touch, last-touch, linear, position-based, time-decay, U-shaped, W-shaped, full-path) and the advanced models (data-driven, Markov Chain, Shapley Value), and verify each model's attributed revenue sums to no more than the eligible conversion revenue with per-touchpoint credit matching the model's defined logic.

- [ ] T029 [US1] First-Touch attribution — **extends `027`'s model** — with acquisition-source preservation, anonymous first-touch tracking, cross-device reconciliation, configurable direct-traffic treatment, historical retention (FR-016)
- [ ] T030 [US1] Last-Touch attribution — **extends `027`'s model** — with 5 configurable variants (last non-direct/paid/campaign/MQL/sales-assisted touch) and configurable lookback (FR-017)
- [ ] T031 [US1] Lead-Creation attribution (new) with preservation even when the lead later converts through a different campaign (FR-018)
- [ ] T032 [US1] Opportunity-Creation attribution (new) using MQL activity, SQL transition, demo/proposal requests, consultation, sales meeting, account-level engagement inputs (FR-019)
- [ ] T033 [US1] Linear attribution — **extends `027`'s model** — with duplicate-touchpoint consolidation and minimum-engagement requirements, wired to T026's contract test (FR-020, acceptance scenario 1)
- [ ] T034 [US1] Position-Based attribution — **extends `027`'s model** — with default 40%/40%/20% and defined one-touch/two-touch journey treatment (FR-021, acceptance scenario 2)
- [ ] T035 [US1] Time-Decay attribution — **extends `027`'s model** — with configurable half-life, minimum touchpoint weight, maximum lookback, eligible channels, event-quality weighting, displaying touchpoint age, decay factor, final weight, attributed revenue, and model explanation (FR-022)
- [ ] T036 [US1] U-Shaped attribution (new) emphasizing first touch and lead-creation touch, default 40%/40%/20%, wired to acceptance scenario 2 (FR-023)
- [ ] T037 [US1] W-Shaped attribution (new) emphasizing first touch, lead creation, and opportunity creation with configurable milestone shares, wired to acceptance scenario 3 (FR-024)
- [ ] T038 [US1] Full-Path attribution (new) covering first touch through customer conversion with configurable per-milestone credit, wired to acceptance scenario 3 (FR-025)
- [ ] T039 [US1] Custom Rule-Based attribution — **extends `027`'s Custom Attribution Model** with additional rule types (channel/campaign priority, engagement quality, time proximity, lead score, sales involvement, offline interaction, device type, geographic region) on the same draft/simulate/approve/version/rollback lifecycle `027` already owns (FR-026)
- [ ] T040 [US1] Data-Driven Attribution — **extends `027`'s model** — with historical journey analysis producing contribution scores, confidence score, model coverage, training date, model version, and explanation; MUST NOT be presented as causal evidence absent incrementality validation, wired to acceptance scenario 4 (FR-027)
- [ ] T041 [US1] Markov Chain attribution (MAY, new) — removal-effect analysis producing transition probabilities, removal effect, channel contribution, path frequency, conversion probability, confidence, data-coverage warning, restricted to authorized analytics users, wired to acceptance scenario 4 (FR-028)
- [ ] T042 [US1] Shapley Value attribution (MAY, new) — marginal-contribution analysis with computational limits, confidence indicators, model-assumption explanation, approximation methods for high-volume datasets, wired to acceptance scenario 4 (FR-029)
- [ ] T043 [US1] View-Through attribution (new) with configurable eligible channels, viewability requirement, minimum exposure, frequency limit, window, priority vs. click-through, fraud/bot filtering; view-through revenue shown separately unless explicitly combined (FR-030)
- [ ] T044 [US1] Assisted-Conversion identification (new): assisted conversions, direct conversions, assist-to-final ratio, assisted revenue, final-touch revenue, average position, average time before conversion (FR-031)
- [ ] T045 [US1] Cross-Device attribution (new) using deterministic identity links or approved probabilistic signals, with probabilistic matches clearly labeled and privacy-governed (FR-032)
- [ ] T046 [US1] Offline attribution (new) for events, meetups, retail, calls, sales visits, print ads, offline referrals, QR campaigns, manual lead imports (FR-033)
- [ ] T047 [US1] Account-Based attribution (new) aggregating multi-contact enterprise-account interactions (FR-034)
- [ ] T048 [P] [US1] Attribution model catalog / configuration UI (19 models)
- [ ] T049 [US1] Integration test: Linear gives 25% each summing to eligible revenue, U-Shaped gives 40/40/20 by default, W-Shaped/Full-Path give configured milestone shares, Data-Driven/Markov Chain/Shapley Value show contribution/confidence/coverage with a non-causal warning — all 4 acceptance scenarios in `backend/tests/integration/us1-multi-touch-attribution.integration.test.ts`

**Checkpoint**: The core function this entire chapter exists to deliver — every downstream financial number depends on it — is independently functional.

---

## Phase 4: User Story 2 — Calculate CAC, CLV, ROAS, Marketing ROI and Payback Period (Priority: P1)

**Independent Test**: Feed a known set of marketing costs and resulting customers/revenue into the system for one campaign, and verify Blended CAC, Paid CAC, ROAS (gross/net/contribution-margin basis), Marketing ROI, CLV, CLV-to-CAC ratio, and payback period all compute to expected values per documented formulas, with revenue basis and included costs visibly labeled.

- [ ] T050 [US2] CAC calculation — Blended, Paid, Organic, Channel, Campaign, Segment, Product, Region, New-Customer, Reactivation — with reporting period and shared-cost treatment shown, wired to T009's financial-formulas module (FR-045, acceptance scenario 1)
- [ ] T051 [US2] Historical and predicted CLV by customer/cohort/campaign/channel/segment/product/plan/geography/acquisition-month, with an insufficient-data warning, wired to acceptance scenario 2 (FR-047)
- [ ] T052 [US2] ROAS — gross-revenue, net-revenue, contribution-margin basis, by channel/campaign/creative/audience/product/cohort — with the selected basis visible, wired to acceptance scenario 3 (FR-042)
- [ ] T053 [US2] CLV-to-CAC ratio and Payback Period — break-even date, expected vs. actual payback duration, customers not yet recovered — wired to acceptance scenario 4 (FR-048–FR-049)
- [ ] T054 [US2] Marketing ROI — revenue-based, gross-profit, contribution-margin, incremental, LTV, campaign, channel, product, regional, portfolio — with revenue basis, included/excluded costs, model, window, period, currency, freshness, approval status all displayed (FR-043)
- [ ] T055 [US2] Contribution Margin calculation (net revenue, product cost, payment fees, delivery, support, partner commissions, refunds, variable service costs, marketing costs) (FR-044)
- [ ] T056 [US2] Funnel cost-efficiency calculation (cost per impression through referral, 11 stages) (FR-046)
- [ ] T057 [P] [US2] Financial formula results / metrics panel UI
- [ ] T058 [US2] Integration test: CAC variants computed with period and shared-cost treatment shown, CLV shown historical and predicted with insufficient-data warning, ROAS shown with revenue basis, CLV-CAC ratio and payback period shown — all 4 acceptance scenarios in `backend/tests/integration/us2-financial-formula-calculations.integration.test.ts`

**Checkpoint**: The financial metrics executives and finance use to make budget decisions are independently functional.

---

## Phase 5: User Story 3 — Move an Attribution Result Through Finalization States (Priority: P1)

**Independent Test**: Run an attribution calculation to "Calculated" status, submit it for finance review, finalize it, attempt a direct edit to the finalized period (must be blocked), then perform a governed Reopen → Corrected flow with a required reason/approver, verifying the original finalized snapshot and the correction are both preserved and auditable.

- [ ] T059 [US3] 8-state finalization workflow (Preliminary, Processing, Calculated, Under review, Finance reviewed, Finalized, Reopened, Corrected) with only an authorized finance role able to finalize, wired to T007 and T027's contract test (FR-057, acceptance scenario 1)
- [ ] T060 [US3] Direct-modification rejection for Finalized periods, requiring the Reopen workflow instead (acceptance scenario 2)
- [ ] T061 [US3] Reopen → Corrected flow requiring reason, approval, audit log entry, model version, and recalculation record before re-finalization, wired to T013 (FR-058, acceptance scenario 3)
- [ ] T062 [US3] Model-version traceability: a Finalized report continues referencing the model version in effect at calculation time even after later model recalibration (acceptance scenario 4)
- [ ] T063 [US3] Revenue reconciliation against authoritative finance sources (conversion records, payment gateway, order, subscription, refund records, finance ledger, recognized revenue), wired to T012 (FR-059)
- [ ] T064 [US3] Reconciliation output structure (matched, unmatched, duplicate, missing transactions, currency differences, timing differences, refund differences, final status) (FR-060)
- [ ] T065 [P] [US3] Finalization workflow and Reopen/Correct UI
- [ ] T066 [US3] Integration test: state transitions recorded and role-gated, Finalized period blocks direct edit, Reopen→Corrected requires reason/approval/audit/recalc, Finalized report keeps referencing the old model version after recalibration — all 4 acceptance scenarios in `backend/tests/integration/us3-attribution-finalization.integration.test.ts`

**Checkpoint**: The direct implementation of Constitution Article IV for this chapter's financial records is independently functional.

---

## Phase 6: User Story 4 — Prevent Revenue Double-Counting and Adjust Attribution on Refund or Cancellation (Priority: P1)

**Independent Test**: Attribute one ₹10,000 conversion across 5 touchpoints under a multi-touch model (confirming the sum equals ₹10,000, not more), then issue a partial ₹4,000 refund and confirm the system retains the original ₹10,000 attribution record while producing an adjusted net attributed revenue of ₹6,000 that financial reports use by default.

- [ ] T067 [US4] Deduplication engine keyed on transaction ID, order ID, subscription ID, payment reference, conversion ID, customer ID, product ID, timestamp, refund status — capping total attributed revenue at the eligible conversion value, wired to T026's contract test (FR-035, acceptance scenario 1)
- [ ] T068 [US4] Refund/cancellation/chargeback adjustment retaining the original attributed revenue record and producing an adjusted net attributed revenue record without deleting the original (FR-036, acceptance scenario 2)
- [ ] T069 [US4] Financial-report default to adjusted net revenue unless a user explicitly requests the original/gross basis (acceptance scenario 3)
- [ ] T070 [US4] Partial-refund line-item-scoped adjustment leaving unaffected line items' attribution unchanged (acceptance scenario 4)
- [ ] T071 [US4] Recurring revenue attribution with 5 configurable policies (original acquisition source, renewal campaign, most-recent eligible touchpoint, shared acquisition-and-retention model, custom) (FR-037)
- [ ] T072 [US4] Lifetime revenue measurement by campaign/channel (initial purchase, repeat purchases, renewals, upgrades, cross-sells, upsells, referral revenue, refunds, churn) across first-30-day/first-90-day/first-year/total-lifetime/predicted-lifetime horizons (FR-038)
- [ ] T073 [P] [US4] Revenue integrity / refund-adjustment audit UI
- [ ] T074 [US4] Integration test: multi-touch attribution sum never exceeds conversion value, refund preserves original and creates adjusted net revenue, reports default to net unless gross explicitly requested, partial refund scoped only to the affected line item — all 4 acceptance scenarios in `backend/tests/integration/us4-revenue-integrity-refund-adjustment.integration.test.ts`

**Checkpoint**: The top two risks named in the source chapter's own risk table — double-counting and stale post-refund attribution — are closed and independently verifiable.

---

## Phase 7: User Story 5 — Run an Incrementality Holdout-Group Test (Priority: P2)

**Independent Test**: Configure a holdout-group experiment on a single campaign with a defined treatment/control split, run it for its configured duration, and confirm the resulting report shows treatment group, control group, incremental conversions/revenue/cost/ROI, confidence interval, statistical significance, and any stated experiment limitations.

- [ ] T075 [US5] 8 incrementality measurement methods (holdout groups, geographic holdouts, audience control groups, campaign suppression groups, RCT, pre/post comparison, difference-in-differences, causal impact modeling) with non-overlapping treatment/control enforcement, wired to T010 (FR-050, acceptance scenario 1)
- [ ] T076 [US5] Incrementality report (treatment group, control group, incremental conversions/revenue/cost/ROI, confidence interval, statistical significance, experiment limitations), wired to T011 (FR-051, acceptance scenario 2)
- [ ] T077 [US5] Explicit method labeling preventing silent cross-method result comparison (acceptance scenario 3)
- [ ] T078 [US5] Contamination detection, flagging, and exclusion for compromised control-group members (acceptance scenario 4) — behavior preserved as `[NEEDS CLARIFICATION]` per spec.md; implement the flagging/exclusion mechanism per T002's research.md resolution
- [ ] T079 [P] [US5] Incrementality experiment configuration and results UI
- [ ] T080 [US5] Integration test: treatment/control groups enforced non-overlapping, report shows all required fields, measurement method explicitly labeled, contaminated observation flagged and excluded — all 4 acceptance scenarios in `backend/tests/integration/us5-incrementality-testing.integration.test.ts`

**Checkpoint**: The capability separating "revenue merely associated with marketing" from "revenue actually caused by marketing" is independently functional.

---

## Phase 8: User Story 6 — Receive and Approve an AI ROI Intelligence Budget Recommendation (Priority: P2)

**Independent Test**: Feed the AI ROI Intelligence Engine a scenario with a clearly underperforming channel and a clearly high-CLV segment, confirm it generates a recommendation with evidence, expected impact, confidence score, and risk level, and confirm no budget or spend configuration changes until an authorized human explicitly approves the recommendation.

- [ ] T081 [US6] AI ROI Intelligence Engine analysis (campaign cost, attributed/incremental revenue, customer quality/CLV, payback period, channel saturation, attribution uncertainty, budget utilization), wired to T014 and `008`'s gateway (FR-061)
- [ ] T082 [US6] Bounded recommendation action set (9 actions) each with supporting evidence, expected financial impact, confidence score, risk level, and required approval, wired to T028's contract test (FR-062, acceptance scenario 1)
- [ ] T083 [US6] No-execution-without-approval enforcement for any budget/spend/campaign change (acceptance scenario 2)
- [ ] T084 [US6] Approval audit trail showing recommendation, evidence, approver, and effective change (acceptance scenario 3)
- [ ] T085 [US6] Low-confidence/low-data-coverage warning displayed alongside any recommendation based on such results (acceptance scenario 4)
- [ ] T086 [US6] ROI/financial forecasting (10 targets) with expected/best/worst/reduced-budget/increased-budget/channel-reallocation scenarios and displayed assumptions/confidence ranges (FR-063)
- [ ] T087 [US6] Budget allocation recommendation across 7 dimensions against 8 objectives, human-approval-gated before execution (FR-064)
- [ ] T088 [US6] Financial scenario modeling (11 adjustable inputs → 8 estimated outputs) (FR-065)
- [ ] T089 [US6] ROI-specific alert configuration (12 conditions, 7 delivery channels) (FR-066)
- [ ] T090 [P] [US6] AI ROI recommendation review/approval queue and scenario modeling UI
- [ ] T091 [US6] Integration test: recommendation includes evidence/impact/confidence/risk/required approval, no execution without approval, audit trail shows the full decision chain, low-confidence warning shown alongside the recommendation — all 4 acceptance scenarios in `backend/tests/integration/us6-ai-roi-intelligence.integration.test.ts`

**Checkpoint**: The Article-II-governed AI decision layer built on top of the P1 financial foundation is independently functional.

---

## Phase 9: User Story 7 — Compare and Simulate Attribution Models Before Activation (Priority: P2)

**Independent Test**: Run the same historical period through two different standard models, confirm the comparison view shows revenue/credit/CAC/ROI differences per model plus an explanation of the variance, and confirm simulating a draft custom model against historical data produces a preview report that does not alter any finalized report.

- [ ] T092 [US7] Multi-model comparison view (revenue by channel/campaign, conversion credit, assisted-conversion credit, first/last-touch credit, model variance, budget-recommendation changes, CAC, ROI) with a variance explanation, wired to T009 (FR-054, acceptance scenario 1)
- [ ] T093 [US7] Draft-model simulation against historical data (revenue redistribution, campaign winners/losers, channel-level changes, ROI changes, budget implications, unattributed revenue, processing requirements, data coverage, model risks) that does not alter finalized reports, wired to acceptance scenario 2 (FR-055)
- [ ] T094 [US7] Model versioning (model ID, version number, type, rule configuration, created-by, approved-by, effective/end date, status, change reason, historical impact, rollback reference), wired to acceptance scenario 3 (FR-056)
- [ ] T095 [US7] Model rollback to the prior version via the stored rollback reference, recorded in the audit log (acceptance scenario 4)
- [ ] T096 [P] [US7] Model comparison and simulation UI
- [ ] T097 [US7] Integration test: comparison view shows required metrics with a variance explanation, simulation produces zero changes to finalized reports, activation records full version metadata, rollback reverts and audits — all 4 acceptance scenarios in `backend/tests/integration/us7-model-comparison-simulation.integration.test.ts`

**Checkpoint**: The governance capability preventing an org from activating a miscalibrated custom model is independently functional.

---

## Phase 10: User Story 8 — Import, Allocate and Reconcile Marketing Costs Against Finance Records (Priority: P3)

**Independent Test**: Import a sample advertising-platform spend file and a manual cost entry, allocate a shared indirect cost across three campaigns by revenue share, and confirm the reconciliation status (Unverified → Imported → Matched/Partially matched → Approved/Disputed → Finalized) correctly blocks unapproved cost data from a finalized ROI report.

- [ ] T098 [US8] Direct and indirect cost recording with full metadata (category, vendor, amount, currency, tax, effective date, cost center, payment status, approval status, data source), wired to T008 (FR-039, acceptance scenario 1)
- [ ] T099 [US8] Shared-cost allocation across 8 methods (campaign spend, revenue share, lead volume, conversion volume, channel usage, time period, team allocation, manual percentage) with the chosen method visible on the resulting per-campaign cost, wired to acceptance scenario 2 (FR-040)
- [ ] T100 [US8] Reconciliation against advertising platforms, vendor invoices, payment records, finance systems, purchase orders, agency reports, and manual entries through the 7-state status progression, wired to T012 (FR-041, acceptance scenario 3)
- [ ] T101 [US8] Disputed/Unverified cost exclusion from finalized ROI reports unless explicitly permitted, with the exclusion visible in the report (acceptance scenario 4)
- [ ] T102 [P] [US8] Cost import/allocation/reconciliation UI
- [ ] T103 [US8] Integration test: cost entry stores full metadata, allocation method is visible on the resulting per-campaign cost, reconciliation status progresses through the defined states, Disputed/Unverified cost excluded from the finalized report — all 4 acceptance scenarios in `backend/tests/integration/us8-cost-allocation-reconciliation.integration.test.ts`

**Checkpoint**: The prerequisite for every ROI/ROAS/CAC number in this feature to be trustworthy is independently functional.

---

## Phase 11: Marketing Mix Modeling baseline & Finance Dashboards remainder (supports FR-052–FR-053, FR-067–FR-070; cross-cutting, no single owning story)

- [ ] T104 Marketing Mix Modeling MAY-scope baseline (channel spend, revenue, seasonality, promotions, pricing, economic conditions, geographic differences, brand activity, competitive signals, offline marketing, product launches as inputs) — full MMM specification explicitly deferred to `037` per plan.md §2 (FR-052)
- [ ] T105 MMM outputs where this baseline supports them (channel contribution, diminishing returns, saturation curves, spend-response curves, optimal budget recommendations, scenario simulations) (FR-053)
- [ ] T106 Attribution Dashboard (11 summary metrics, 8 visualizations), rendered as a template through `027`'s Dashboard framework, wired to T007 (FR-067)
- [ ] T107 Revenue Impact Dashboard (11 metrics) (FR-068)
- [ ] T108 ROI Dashboard (13 metrics, 6 comparison bases) (FR-069)
- [ ] T109 Executive Revenue Intelligence view, with its narrative content feeding into `027`'s single Executive Narrative generator rather than a second AI narrative (FR-070)

**Checkpoint**: The finance-grade dashboard content plugging into `027`'s existing dashboard framework is independently functional.

---

## Phase 12: Governance, Privacy/Fraud/Currency/Tax, Integration/API & Polish

- [ ] T110 [P] Governed financial/attribution definitions (15 terms with business/technical owner, calculation logic, effective date, approval status, version history), consistent with `027`'s Metric Data Dictionary pattern (FR-071)
- [ ] T111 RBAC across 14 attribution-specific permission categories, with customer-level and financial-level access separately controlled, wired to `016` (FR-072)
- [ ] T112 Approval workflows across 9 action types (models, model changes, historical recalculation, cost adjustments, revenue corrections, period finalization, budget recommendations, AI-generated financial actions, sensitive-data export), wired to T013 (FR-073)
- [ ] T113 Audit logging into `027`'s Audit Log Entry across all sensitive attribution/cost/finalization actions, immutable for the configured retention period (FR-074)
- [ ] T114 Privacy/consent fallback (aggregated reporting, pseudonymized analysis, consent-mode estimation, privacy-preserving measurement) with estimated results clearly labeled (FR-075)
- [ ] T115 Fraud/bot/invalid-traffic exclusion (10 categories) retained for audit but excluded from finalized attribution/ROI calculations (FR-076)
- [ ] T116 Multi-currency conversion (7 currency/rate concepts) reusing `009`'s finance-approved exchange-rate infrastructure (FR-077)
- [ ] T117 Tax/fee treatment configuration (7 fee types) with the selected treatment visible in financial reports (FR-078)
- [ ] T118 Integration-framework wiring across the 19 named systems (FR-079)
- [ ] T119 Secure attribution APIs (9 operation categories) with authentication, authorization, rate limiting, idempotency, request validation, audit logging, versioning, tenant isolation, field-level permissions (FR-080)
- [ ] T120 Performance hardening pass toward the remaining numeric targets (FR-081)
- [ ] T121 Reliability/scalability infrastructure (retry processing, duplicate protection, dead-letter queues, processing checkpoints, backup, disaster recovery, calculation rollback, failure alerts) at the stated availability targets (FR-082)
- [ ] T122 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (production defaults, ML technique for Data-Driven/Markov Chain/Shapley Value, contamination-detection procedure, and plan.md §4's finalization-ownership discrepancy pending `037`)
- [ ] T123 Final audit: cross-check every FR-001–FR-082 against an implementation or validation task; verify each `027`-reused entity (Customer→Identity Resolution Record, Touchpoint→Tracked Event, Marketing Cost→Cost Record, Attribution Model→027's Attribution Model, AI Recommendation→AI Insight, Audit Log Entry→027's) is implemented as an extension, not a duplicate, per plan.md §1–§3
- [ ] T124 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `027`'s Tracked Event/Identity Resolution/Cost Record/AI Insight/Audit Log Entry as reuse targets and `008`'s AI gateway, and produces the entity/eligibility/conversion-classification infrastructure every subsequent phase depends on.
- **P1 stories (US1–US4)**: US1 (attribution models) is the core function everything else is built on and must ship first; US2 (financial formulas) and US4 (revenue integrity/deduplication) both depend on US1's attribution results and can build in parallel; US3 (finalization) depends on US1's Attribution Result entity existing and should follow shortly after, since it governs how those results become trustworthy financial records.
- **P2 stories (US5–US7)**: US5 (incrementality) depends on US1's attribution baseline (it exists to validate/contrast against algorithmic attribution); US6 (AI ROI Intelligence) depends on US1–US4's financial foundation and `008`'s AI gateway; US7 (model comparison/simulation) depends on US1's model catalog and US3's finalization state machine (simulation must not touch finalized reports) — all three can build in parallel once their P1 dependencies are stable.
- **P3 story (US8)** depends on Foundational's Marketing Cost entity and feeds US2's financial formulas and US3's finalized ROI reports; can build in parallel with the P2 stories.
- **Phase 11 (MMM baseline & finance dashboards)** depends on US1–US4 for real attribution/revenue data to display; should land alongside or just after the P1 stories.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities extending `027`, eligibility, conversion classification) → **STOP and VALIDATE** the three Foundational contract tests (no-double-counting-19-models, finalization-lock-enforcement, ai-roi-approval-gate) pass → US1 (multi-touch attribution) → **STOP and VALIDATE** the core calculation engine `027`'s dashboards will consume is trustworthy → US2 (financial formulas) + US4 (revenue integrity) in parallel → US3 (finalization) → **STOP and VALIDATE** the finance-grade foundation is defensible enough for board-level reporting → US5 (incrementality) + US6 (AI ROI Intelligence) + US7 (model comparison/simulation) in parallel → US8 (cost reconciliation) → Phase 11 (MMM baseline/dashboards) → Polish.
