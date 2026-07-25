---
description: "Task list for Feature 027 — Marketing Analytics, Attribution Modeling & Executive Intelligence"
---

# Tasks: Marketing Analytics, Attribution Modeling & Executive Intelligence

**Input**: Design documents from `/specs/027-marketing-analytics-attribution/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `002`/`003`'s consent capture, `003`'s identity/account system, `008`'s AI gateway, and `009`'s finance cost data exist as integration points, though it does not require their full feature completion to build its own analytics/attribution engine.

**Tests**: Included throughout — event-schema completeness, no-double-counting attribution, and approval-gated historical reprocessing each get a dedicated Foundational contract test, matching this spec's own SC-002, SC-007, and SC-010/Constitution Article IV.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus three supplementary cross-cutting phases for FR groups not owned by any single prioritized story (this feature has 81 FRs across only 8 stories, so a large share of requirement volume — campaign/channel/funnel/journey analytics, revenue/ROI/cohort/content/predictive analytics, and governance/currency/access/reliability — sits outside story ownership by design).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor this feature reuses via `016`), and that `002`/`003`'s consent capture, `003`'s identity system, `008`'s AI gateway, and `009`'s finance data exist as integration points
- [ ] T002 Resolve `research.md` open items before proceeding: whether Feature `028` is a genuine deeper extension of, or a redundant re-specification of, this chapter's attribution/ROI capabilities (§16–§29) — the single most significant open item, since it determines whether `028` may proceed independently or must be built strictly as a thin extension of this feature
- [ ] T003 [P] Add `backend/src/modules/{analytics-ingestion,identity-resolution,campaign-channel-analytics,funnel-journey-analytics,attribution-engine,conversion-revenue-roi,cohort-retention-clv,content-geo-device-analytics,executive-intelligence,role-dashboards,custom-dashboards-reports,ai-predictive-analytics,anomaly-alerts-benchmarking,analytics-governance,analytics-currency-timezone,analytics-access-audit-api}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the append-only `Tracked Event` entity in `backend/src/modules/analytics-ingestion/tracked-event.entity.ts`
- [ ] T005 [P] Define the `Identity Resolution Record` entity in `backend/src/modules/identity-resolution/identity-resolution-record.entity.ts`
- [ ] T006 [P] Define the `Attribution Model` entity in `backend/src/modules/attribution-engine/attribution-model.entity.ts`
- [ ] T007 [P] Define the `Attribution Window` entity in `backend/src/modules/attribution-engine/attribution-window.entity.ts`
- [ ] T008 [P] Define the `Conversion Definition` entity in `backend/src/modules/conversion-revenue-roi/conversion-definition.entity.ts`
- [ ] T009 [P] Define the `Campaign Performance Record` entity in `backend/src/modules/campaign-channel-analytics/campaign-performance-record.entity.ts`
- [ ] T010 [P] Define the `Channel Performance Record` entity in `backend/src/modules/campaign-channel-analytics/channel-performance-record.entity.ts`
- [ ] T011 [P] Define the `Customer Journey` entity in `backend/src/modules/funnel-journey-analytics/customer-journey.entity.ts`
- [ ] T012 [P] Define the `Funnel Definition` entity in `backend/src/modules/funnel-journey-analytics/funnel-definition.entity.ts`
- [ ] T013 [P] Define the `Cohort` entity in `backend/src/modules/cohort-retention-clv/cohort.entity.ts`
- [ ] T014 [P] Define the `Dashboard` entity (system role-specific + custom) in `backend/src/modules/role-dashboards/dashboard.entity.ts`
- [ ] T015 [P] Define the `Custom Report` entity in `backend/src/modules/custom-dashboards-reports/custom-report.entity.ts`
- [ ] T016 [P] Define the `Executive Narrative` entity in `backend/src/modules/executive-intelligence/executive-narrative.entity.ts`
- [ ] T017 [P] Define the `AI Insight` entity in `backend/src/modules/executive-intelligence/ai-insight.entity.ts`
- [ ] T018 [P] Define the `Anomaly Alert` entity in `backend/src/modules/anomaly-alerts-benchmarking/anomaly-alert.entity.ts`
- [ ] T019 [P] Define the `Metric Data Dictionary Entry` entity in `backend/src/modules/analytics-governance/metric-dictionary-entry.entity.ts`
- [ ] T020 [P] Define the `Data Quality Issue` entity in `backend/src/modules/analytics-governance/data-quality-issue.entity.ts`
- [ ] T021 [P] Define the `Historical Reprocessing Job` entity in `backend/src/modules/analytics-governance/historical-reprocessing-job.entity.ts`
- [ ] T022 [P] Define the `Cost Record` entity in `backend/src/modules/conversion-revenue-roi/cost-record.entity.ts`
- [ ] T023 [P] Define the `Budget` entity in `backend/src/modules/conversion-revenue-roi/budget.entity.ts`
- [ ] T024 [P] Define the append-only `Audit Log Entry` entity in `backend/src/modules/analytics-access-audit-api/audit-log-entry.entity.ts`
- [ ] T025 Implement the 7-stage analytics pipeline with batch, near-real-time, and scheduled-recalculation processing modes, wired to T004 (FR-001)
- [ ] T026 Implement internal TBT source event collection (registration, membership, courses, ebooks/podcasts, community, referrals, rewards, wallet, events/webinars, support, AI assistant, landing pages, forms, leads, campaigns, workflows, payments) (FR-002)
- [ ] T027 Implement marketing-communication source collection (email, SMS, WhatsApp, mobile/in-app/browser push, social, affiliate, referral, display, search) (FR-003)
- [ ] T028 Implement external source ingestion (Google Ads, Meta Ads, LinkedIn Ads, YouTube, Google Analytics, Google Search Console, CRM platforms, payment gateways, webinar providers, social management platforms, external DW/BI tools, custom APIs, webhooks, CSV import) (FR-004)
- [ ] T029 Note: consent capture is reused from `002`/`003`; this module only enforces consent already captured, at ingestion time
- [ ] T030 Note: the "known" customer identity anchor is reused from `003`'s account/identity system; this module connects anonymous activity to it, not the identity system itself
- [ ] T031 Contract test: every tracked event contains the full 21-field standardized schema and is visible in the analytics pipeline within 60 seconds, in `backend/tests/contract/event-schema-completeness-realtime-visibility.contract.test.ts` (FR-005, SC-002)
- [ ] T032 Contract test: attribution credit sums to 100% of conversion value for a given conversion, with zero cross-report/cross-model double-counting, in `backend/tests/contract/attribution-credit-no-double-counting.contract.test.ts` (FR-028, FR-037, SC-007)
- [ ] T033 Contract test: historical reprocessing that would alter previously reported figures requires an impact preview and explicit approval before any commit, in `backend/tests/contract/historical-reprocessing-approval-gate.contract.test.ts` (FR-068, SC-010, Constitution Article IV)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Standardized Event Flows Through the Tracking Framework (Priority: P1) 🎯 MVP

**Independent Test**: Trigger a known event from a source module and confirm a single, complete standardized event record is produced and visible in the data pipeline within the real-time visibility target.

- [ ] T034 [US1] 21-field standardized event schema enforcement at ingestion, wired to T004 (FR-005, acceptance scenario 1)
- [ ] T035 [US1] Customer-ID-linked event capture for known customers, queued for the metric and attribution calculation engine (FR-005, acceptance scenario 2)
- [ ] T036 [US1] Data-quality flagging for malformed/unknown campaign IDs rather than silent acceptance into campaign performance metrics, wired to T031's contract test (acceptance scenario 3)
- [ ] T037 [US1] Consent-status-aware event recording with exclusion from consent-restricted processing paths (acceptance scenario 4)
- [ ] T038 [US1] 16 standardized marketing event types (campaign sent through customer churned) (FR-006)
- [ ] T039 [P] [US1] Event pipeline / data-quality monitoring UI
- [ ] T040 [US1] Integration test: anonymous click captured with full schema, purchase linked to customer and queued, malformed campaign ID flagged, consent-withdrawn event excluded from restricted processing — all 4 acceptance scenarios in `backend/tests/integration/us1-event-tracking-framework.integration.test.ts`

**Checkpoint**: The foundation everything else in this chapter is built on is independently functional.

---

## Phase 4: User Story 2 — Identity Resolution Merges Anonymous and Known Interactions (Priority: P1)

**Independent Test**: Generate anonymous browsing events tied to a device/cookie identifier, submit a form with an email address from the same device, and confirm the system links the prior anonymous events to the newly created identity, records a merge/link audit entry, and surfaces low-confidence matches for manual review instead of auto-merging.

- [ ] T041 [US2] Identity-resolution engine using 10 identity signals, wired to T005 (FR-007)
- [ ] T042 [US2] Anonymous-to-known conversion attaching prior events to the resulting identity as one unified journey (FR-009, acceptance scenario 1)
- [ ] T043 [US2] Cross-device identity matching via verified signals (e.g., phone number) (acceptance scenario 2)
- [ ] T044 [US2] Confidence-threshold-based manual-review routing for uncertain matches rather than auto-merging (acceptance scenario 3)
- [ ] T045 [US2] Duplicate-profile detection, profile-merge controls, conflict-resolution rules, and full identity-merge audit history (FR-009, acceptance scenario 4)
- [ ] T046 [US2] Privacy-, consent-, and retention-respecting merge behavior (FR-008)
- [ ] T047 [P] [US2] Identity-resolution review/audit UI
- [ ] T048 [US2] Integration test: anonymous-to-known conversion attaches prior events, cross-device matching links histories, low-confidence match routes to manual review, merge audit history visible and correctable — all 4 acceptance scenarios in `backend/tests/integration/us2-identity-resolution.integration.test.ts`

**Checkpoint**: The architectural layer attribution and journey analytics structurally depend on is independently functional.

---

## Phase 5: User Story 3 — Choosing an Attribution Model for Revenue-Accurate Reporting (Priority: P1)

**Independent Test**: Generate a synthetic four-touchpoint customer journey ending in a defined conversion, run it through first-touch, last-touch, linear, time-decay, and position-based models, and confirm each produces a distinct, mathematically correct credit distribution summing to 100% of the conversion value with no duplication.

- [ ] T049 [US3] Attribution-model framework (configurable windows, multiple selectable models), wired to T006/T007 (FR-025)
- [ ] T050 [US3] First-Touch Attribution preserving the original acquisition source even when later campaigns influence the conversion (FR-026)
- [ ] T051 [US3] Last-Touch Attribution with a configurable lookback period (FR-027)
- [ ] T052 [US3] Linear Attribution with equal-share credit display (touchpoint count, credit/revenue per touchpoint, channel/campaign-level aggregation), wired to T032's contract test (FR-028, acceptance scenario 1)
- [ ] T053 [US3] Time-Decay Attribution with configurable window, decay rate, minimum eligible interaction, included channels, excluded events, and conversion definition (FR-029)
- [ ] T054 [US3] Position-Based Attribution with default 40%/40%/20% weighting and administrator-customizable percentages (FR-030, acceptance scenario 2)
- [ ] T055 [US3] Data-Driven Attribution analysis (channel combinations, interaction order, timing, segment, campaign type, creative type, device, geography, conversion value) producing confidence score, model version, training period, data coverage, excluded data, and stated limitations, wired to `008`'s gateway (FR-031)
- [ ] T056 [US3] Mandatory human-review and model-governance approval gate before Data-Driven Attribution results reach financial/executive reporting, wired to T033's approval pattern (FR-032, acceptance scenario 3)
- [ ] T057 [US3] Custom Attribution Model configuration (window, touchpoint eligibility, channel/campaign/position weighting, decay rules, segment rules, conversion-value rules, offline-interaction inclusion, direct-traffic treatment, duplicate-touchpoint handling) (FR-033)
- [ ] T058 [US3] Custom-model lifecycle — draft status, testing mode, version history, approval workflow, effective date, historical recalculation, rollback, wired to acceptance scenario 4 (FR-034)
- [ ] T059 [US3] Configurable attribution windows (same-session through 180 days plus custom), with per-conversion-type window assignment (FR-035)
- [ ] T060 [P] [US3] Attribution model comparison/configuration UI
- [ ] T061 [US3] Integration test: linear model gives 25% each with aggregated credit shown, position-based gives 40/40/20 with customization, data-driven results blocked until governance approval, custom model enters draft with testing/version/approval workflow — all 4 acceptance scenarios in `backend/tests/integration/us3-attribution-model-selection.integration.test.ts`

**Checkpoint**: The single highest-stakes calculation in the module — the analytical core turning raw events into defensible revenue and ROI numbers — is independently functional.

---

## Phase 6: User Story 4 — Role-Specific Dashboard Renders for the Right Audience (Priority: P2)

**Independent Test**: Log in as users assigned to two different roles (e.g., CMO and Finance) and confirm each sees their role's specified focus-area widgets and KPIs, with financial detail available to Finance/CMO but not to a role without financial permission.

- [ ] T062 [US4] Chief Executive dashboard (business growth, marketing revenue contribution, marketing ROI, customer growth, strategic risks, forecasts), wired to T014 (FR-051, acceptance scenario 1)
- [ ] T063 [US4] Chief Marketing Officer dashboard (channel performance, campaign effectiveness, budget allocation, attribution, brand/audience growth, marketing pipeline) (FR-052, acceptance scenario 2)
- [ ] T064 [US4] Marketing Manager dashboard (active campaigns, team performance, lead generation, campaign targets, conversion optimization, operational alerts) (FR-053)
- [ ] T065 [US4] Performance Marketer dashboard (ad spend, CTR, CPL/CPA, ROAS, creative performance) (FR-054)
- [ ] T066 [US4] Content Manager dashboard (content engagement, creative performance, channel distribution, conversion contribution, content experiments, audience preferences) (FR-055)
- [ ] T067 [US4] Finance dashboard (marketing spend, budget variance, attributed revenue, profitability, cost control, financial reconciliation) with revenue/customer-financial detail visible only to authorized roles, wired to `016`'s RBAC (FR-056, acceptance scenario 3)
- [ ] T068 [US4] RBAC-based field withholding for any role without financial-metric permission (acceptance scenario 4)
- [ ] T069 [P] [US4] Role-specific dashboard UI shells (6 roles)
- [ ] T070 [US4] Integration test: CEO dashboard shows correct focus areas, CMO dashboard shows correct focus areas, Finance dashboard shows financial detail only to authorized users, unauthorized-role fields withheld — all 4 acceptance scenarios in `backend/tests/integration/us4-role-specific-dashboards.integration.test.ts`

**Checkpoint**: The six individually-specified role deliverables of "Executive Intelligence" are independently functional.

---

## Phase 7: User Story 5 — AI Generates an Executive Narrative Summary (Priority: P2)

**Independent Test**: Run the narrative generator against a dataset with a known performance shift (e.g., a channel's CAC doubling) and confirm the generated narrative references that specific change with supporting metrics, a comparison period, and a confidence indicator, with no narrative statement presented without underlying evidence a reviewer can inspect.

- [ ] T071 [US5] Executive Intelligence Dashboard KPI cards (14 metrics), wired to T014 (FR-047)
- [ ] T072 [US5] Executive visualization suite (11 chart/visualization types) (FR-048)
- [ ] T073 [US5] AI-generated executive narrative (performance changes, top/underperforming campaigns/channels, revenue impact, budget risks, behavior changes, forecasted outcomes, recommended actions) with every claim traceable to evidence, wired to T016 and `008`'s gateway (FR-049, acceptance scenario 1)
- [ ] T074 [US5] AI Insight structure (title, business explanation, supporting metrics, comparison period, confidence score, estimated impact, recommended action, related campaigns/channels), wired to T017 (FR-050, acceptance scenario 2)
- [ ] T075 [US5] Advisory-only treatment requiring human review/acceptance before any downstream action is treated as approved, audit-logged, wired to T033's approval pattern (acceptance scenario 3)
- [ ] T076 [US5] Data-freshness suppression/warning for incomplete or delayed underlying data rather than presenting stale conclusions as final (acceptance scenario 4)
- [ ] T077 [P] [US5] Executive narrative and AI insight panel UI
- [ ] T078 [US5] Integration test: narrative names the specific change with impact and recommended action, insight includes all 8 required fields, advisory-only treatment with audit-logged human review, stale data suppresses or warns the narrative — all 4 acceptance scenarios in `backend/tests/integration/us5-ai-executive-narrative.integration.test.ts`

**Checkpoint**: The signature "Executive Intelligence" capability, directly engaging Constitution Article II, is independently functional.

---

## Phase 8: User Story 6 — Historical Data Is Reprocessed Under Approval Control (Priority: P2)

**Independent Test**: Trigger a reprocessing request for a defined date range after changing a conversion definition, confirm an impact preview is generated before execution, that execution requires explicit approval, that progress and error logs are visible during the run, and that a before/after version comparison is available afterward.

- [ ] T079 [US6] Impact-preview generation showing which metrics/reports would change before any recalculation is committed, wired to T021 (FR-068, acceptance scenario 1)
- [ ] T080 [US6] Approval-gated execution with visible processing progress and an error log, wired to T033's contract test (acceptance scenario 2)
- [ ] T081 [US6] Version comparison between pre- and post-reprocessing results (acceptance scenario 3)
- [ ] T082 [US6] Rollback to the prior calculated state where technically possible (acceptance scenario 4)
- [ ] T083 [US6] Supported reprocessing triggers (attribution rule change, conversion definition change, event correction, currency-rate update, duplicate removal, identity merge, cost-data addition, analytics-logic upgrade) (FR-068)
- [ ] T084 [P] [US6] Historical reprocessing request/approval UI
- [ ] T085 [US6] Integration test: impact preview generated before commit, approval required with visible progress and error log, version comparison available afterward, rollback supported on an erroneous result — all 4 acceptance scenarios in `backend/tests/integration/us6-historical-reprocessing-approval.integration.test.ts`

**Checkpoint**: The controlled, auditable, reversible-where-possible recalculation process directly reflecting Constitution Article IV is independently functional.

---

## Phase 9: User Story 7 — Analyst Builds a Custom Report and Schedules Its Delivery (Priority: P3)

**Independent Test**: Build a report selecting a data source, metrics, dimensions, filters, grouping, sorting, an attribution model, and a date range, confirm the system blocks an invalid configuration that would double-count revenue, then schedule it weekly for email delivery as a PDF and confirm delivery within the target window.

- [ ] T086 [US7] No-code custom dashboard builder (16 widget types, resizing, drag-and-drop, filters, date controls, metric/dimension selection, sorting, comparison periods, thresholds, conditional alerts, role-based visibility, cloning, template saving), wired to T014 (FR-057)
- [ ] T087 [US7] Custom Report Builder (data source, metrics, dimensions, filters, grouping, sorting, attribution model, date range, comparison period, visualization type, export format), wired to T015 (FR-058, acceptance scenario 1)
- [ ] T088 [US7] Configuration validation blocking unsupported joins, metric duplication, revenue double-counting, excessive query load, unauthorized data access, and invalid attribution comparisons, wired to T032's contract test (acceptance scenario 2)
- [ ] T089 [US7] Scheduled report delivery (daily/weekly/monthly/quarterly/custom schedules, 6 delivery channels, 6 export formats) within the 15-minute target (FR-059, acceptance scenario 3)
- [ ] T090 [US7] Data-freshness flagging or delay/retry handling for a scheduled report whose data source fails to refresh (acceptance scenario 4)
- [ ] T091 [P] [US7] Custom dashboard builder, report builder, and scheduling UI
- [ ] T092 [US7] Integration test: report renders with the selected configuration, a double-counting configuration is blocked with an explanation, weekly PDF delivered within 15 minutes, stale data flagged or delayed rather than silently delivered — all 4 acceptance scenarios in `backend/tests/integration/us7-custom-report-builder-scheduling.integration.test.ts`

**Checkpoint**: The self-service capability reducing dependency on engineering is independently functional.

---

## Phase 10: User Story 8 — Anomaly Is Detected and an Alert Is Raised (Priority: P3)

**Independent Test**: Inject a synthetic spend spike or conversion drop into test data, run the anomaly-detection job, and confirm an alert is raised within the target detection window containing severity, affected metric, detected time, expected range, actual value, possible cause, recommended action, assigned owner, and resolution status, delivered through the configured alert channel(s).

- [ ] T093 [US8] Anomaly detection across 12 named anomaly types, wired to T018 (FR-062, acceptance scenario 1)
- [ ] T094 [US8] Alert record structure (severity, affected metric, detected time, expected range, actual value, possible cause, recommended action, assigned owner, resolution status) raised within the 5-minute detection target
- [ ] T095 [US8] Threshold-based alert configuration across 7 configurable trigger types, delivered via 7 channels, wired to acceptance scenario 2 (FR-063)
- [ ] T096 [US8] Alert resolution-status tracking through to closure, wired to acceptance scenario 3
- [ ] T097 [US8] Anomaly-type distinction — data-quality anomalies (duplicate/bot activity) distinguishable from genuine performance anomalies (acceptance scenario 4)
- [ ] T098 [US8] Internal performance benchmarking across 10 comparison axes; external industry benchmarks reserved for future release (FR-064)
- [ ] T099 [P] [US8] Anomaly alert dashboard and alert-configuration UI
- [ ] T100 [US8] Integration test: spend-spike alert raised within 5 minutes with all required fields, threshold alert delivered via the configured channel, resolution status tracked to closure, bot/duplicate anomaly distinguishable from a genuine performance anomaly — all 4 acceptance scenarios in `backend/tests/integration/us8-anomaly-detection-alerts.integration.test.ts`

**Checkpoint**: The data-quality and financial-protection safeguard preventing budget waste or a broken pipeline from running unnoticed is independently functional.

---

## Phase 11: Campaign, Channel, Funnel & Customer Journey Analytics remainder (supports FR-010–FR-024; cross-cutting, no single owning story)

- [ ] T101 Marketing Analytics Dashboard summary cards (16 metrics), wired to T014 (FR-010)
- [ ] T102 Dashboard filtering across 17 dimensions plus 9 time-comparison types (FR-011–FR-012)
- [ ] T103 Campaign detail performance page (23 fields) plus trend/breakdown/funnel/journey/AI-recommendation sections, wired to T009 (FR-013–FR-014)
- [ ] T104 Individual and comparative channel analytics across 13 channels sharing 16 common metrics, wired to T010 (FR-015–FR-016)
- [ ] T105 Channel-specific analytics: Email (FR-017), SMS (FR-018), WhatsApp (FR-019), Push (FR-020)
- [ ] T106 Custom funnel builder (stages, entry/completion conditions, conversion window, sequential/flexible order, segment, exclusions) plus funnel metrics, wired to T012 (FR-021–FR-022)
- [ ] T107 Customer Journey Analytics (touchpoints, engagement, behavior, qualification, sales, purchases, renewals, support, referrals, churn) plus journey views (individual timeline, aggregated map, common/high-drop-off paths, average touchpoints/time-to-conversion, channel-transition analysis, cross-device journey), wired to T011 (FR-023–FR-024)

**Checkpoint**: The campaign/channel/funnel/journey reporting surface every P1 story's data feeds into is independently functional.

---

## Phase 12: Revenue/ROI, Cohort/Retention/CLV, Content/Geographic/Device & Predictive Analytics remainder (supports FR-036–FR-046, FR-060–FR-061; cross-cutting, no single owning story)

- [ ] T108 Conversion Definition management (12 example event types, triggering condition, conversion value, revenue source, attribution model/window, duplicate-conversion rule, active/inactive status), wired to T008 (FR-036)
- [ ] T109 Revenue attribution calculation (gross/net/discount/refund/tax/subscription/renewal/upsell/cross-sell/recurring/attributed/unattributed revenue) with no double-counting, wired to T032's contract test (FR-037)
- [ ] T110 Marketing ROI measurement (13 metrics) with finance-approved cost import/sync from `009` (FR-038)
- [ ] T111 Cost Record management (11 cost types, 4 entry methods, approval workflow, currency conversion, cost-center/budget-category assignment), wired to T022 (FR-039)
- [ ] T112 Budget-vs-actual comparison (10 tracked values) broken down across 9 dimensions, wired to T023 (FR-040)
- [ ] T113 Cohort analysis (9 grouping dimensions, 10 metrics), wired to T013 (FR-041)
- [ ] T114 Retention and churn analytics (8 metrics) comparable across 8 axes (FR-042)
- [ ] T115 Historical and predicted Customer Lifetime Value calculation (10 inputs, 5 aggregation levels) (FR-043)
- [ ] T116 Content and creative-asset performance analytics (10 asset types, 8 metrics) (FR-044)
- [ ] T117 Geographic analytics (6 granularities, 9 metrics), location data gated on legal permission and consent (FR-045)
- [ ] T118 Device and platform analytics (7 dimensions) (FR-046)
- [ ] T119 AI Intelligence Engine actionable-insight surfacing, wired to T017 (FR-060)
- [ ] T120 Predictive forecasting (12 forecast targets, best/expected/worst-case scenarios, confidence range, historical trend comparison, seasonality adjustments, campaign-specific assumptions) (FR-061)

**Checkpoint**: The revenue/ROI, lifecycle-value, and predictive-analytics surface underlying executive and role dashboards is independently functional.

---

## Phase 13: Data Governance, Currency/Timezone, Access/Audit/API, Integration & Reliability Polish

- [ ] T121 [P] Data-freshness indicator on every dashboard and report (last-updated time, processing status, delayed/failed sources, estimated next refresh, real-time/batch classification), wired to T017 (FR-065)
- [ ] T122 Centralized Metric Data Dictionary (10 governed metrics with full definition/calculation/ownership/version/approval metadata), wired to T019 (FR-066)
- [ ] T123 Continuous data-quality monitoring (12 issue types) surfaced in the administrator data-quality dashboard, wired to T020 (FR-067)
- [ ] T124 Multi-currency support (original/reporting/base currency, exchange-rate source and effective date, historical-rate preservation, currency-specific dashboards) (FR-069)
- [ ] T125 Multi-timezone support (org default, campaign, customer local, user-preferred reporting timezone, UTC storage, timezone-aware aggregation, DST adjustment) (FR-070)
- [ ] T126 Granular RBAC across 13 analytics permission categories, wired to `016` (FR-071)
- [ ] T127 Privacy/consent enforcement (restricted tracking, masking, pseudonymized reporting, deletion, retention rules, purpose-based processing, geographic privacy controls) (FR-072)
- [ ] T128 Audit Log Entry capture across 10 sensitive-action categories, wired to T024 (FR-073)
- [ ] T129 Data export (CSV, Excel, PDF, JSON, presentation summary, secure API response) respecting permissions, row-level access, masking, limits, consent, audit logging, retention (FR-074)
- [ ] T130 Dashboard/report sharing (comments, tags, saved views, subscriptions, expiring view-only links, download restriction, revocation, public access disabled by default) (FR-075)
- [ ] T131 Secure analytics APIs (9 operation categories) with authentication, authorization, rate limiting, request logging, field-level permissions, masking, versioning, idempotency (FR-076)
- [ ] T132 Full integration-framework wiring across the 19 named systems (FR-077)
- [ ] T133 Reliability infrastructure (retry mechanisms, duplicate-event protection, processing checkpoints, dead-letter queues, recovery procedures, reconciliation reports, backup/disaster recovery) for billions of events and thousands of concurrent users (FR-078)
- [ ] T134 Accessibility compliance (keyboard navigation, screen readers, accessible labels, color-contrast, text alternatives for visualizations, data-table alternatives, zoom support, non-color status indicators, accessible export formats) (FR-079)
- [ ] T135 Responsive/mobile interface with mobile-prioritized executive KPIs, campaign alerts, spend/revenue status, performance trends, AI insights, and approval actions (FR-080)
- [ ] T136 Empty, loading, and error state coverage across all major analytics surfaces (FR-081)
- [ ] T137 Resolve and document the remaining NEEDS CLARIFICATION item not already closed by T002's `research.md` pass (whether `028` is a genuine extension or a redundant re-specification of this chapter's §16–§29)
- [ ] T138 Final audit: cross-check every FR-001–FR-081 against an implementation or validation task; verify this feature is documented as the canonical owner for `028` to cross-reference and as the data foundation `037` extends rather than duplicates
- [ ] T139 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `001`/`016`'s RBAC, `002`/`003`'s consent capture, `003`'s identity anchor, and `008`'s AI gateway, and produces the entity/pipeline infrastructure every subsequent phase depends on.
- **P1 stories (US1–US3)**: US1 (event tracking) is the foundation everything else is built on and must ship first; US2 (identity resolution) depends on US1's event stream and must precede any journey/attribution work that spans anonymous-to-known transitions; US3 (attribution model selection) depends on both US1's events and US2's resolved identities.
- **P2 stories (US4–US6)**: US4 (role dashboards), US5 (AI executive narrative), and US6 (historical reprocessing) all depend on US1–US3's data/attribution foundation and can build in parallel; US5 additionally depends on `008`'s AI gateway.
- **P3 stories (US7–US8)**: US7 (custom report builder) depends on US3's attribution models being selectable and US4's dashboard infrastructure; US8 (anomaly detection) depends on US1's event stream and benefits from US3's attribution baseline to detect attribution-related anomalies — both can build in parallel.
- **Phase 11 (Campaign/Channel/Funnel/Journey remainder)** and **Phase 12 (Revenue/ROI/Cohort/Content/Predictive remainder)** depend on Foundational and are consumed by US3, US4, and US5; they should land alongside or just before those stories rather than strictly after all numbered stories.
- **Polish (Phase 13)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, pipeline, ingestion) → **STOP and VALIDATE** the three Foundational contract tests (event-schema-completeness, attribution-no-double-counting, historical-reprocessing-approval-gate) pass → US1 (event tracking) → **STOP and VALIDATE** events flow correctly from at least one real source → US2 (identity resolution) → US3 (attribution model selection) → **STOP and VALIDATE** the analytical core producing defensible revenue/ROI numbers is trustworthy → Phase 11 + Phase 12 (analytics/revenue/cohort/predictive remainder) to give the P2 stories real data to render → US4 (role dashboards) + US5 (AI executive narrative) + US6 (historical reprocessing) in parallel → US7 (custom reports) + US8 (anomaly detection) in parallel → Polish.
