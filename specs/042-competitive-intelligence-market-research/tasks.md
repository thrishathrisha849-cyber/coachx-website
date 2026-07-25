---
description: "Task list for Feature 042 — Enterprise Competitive Intelligence & Market Research"
---

# Tasks: Enterprise Competitive Intelligence & Market Research

**Input**: Design documents from `/specs/042-competitive-intelligence-market-research/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 035, 008, 013, 009, and 041), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC reused via `016`). This feature also assumes `035`'s Segment/Segmentation-Category/Segment-Analytics engine, `008`'s AI gateway, `013`'s CRM data, `009`'s membership/revenue data, and `041`'s Sentiment Score/Reputation Score outputs exist as consumption points.

**Tests**: Included throughout — EDSS non-autonomy, research consent/approval gating, and approved-research-document immutability each get a dedicated Foundational contract test, matching this spec's own SC-005, SC-003, and SC-004.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus two supplementary cross-cutting phases for FR groups not owned by any single prioritized story (pricing intelligence/offers/trend/opportunity/threat/strategic-insights-dashboard; secondary-research/interview/focus-group/survey/repository remainder plus AI Market Intelligence/predictive analytics/executive reporting).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC reused via `016`), and that `035`'s Segment engine, `008`'s AI gateway, `013`'s CRM data, `009`'s membership/revenue data, and `041`'s Sentiment/Reputation outputs exist as consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: Competitor Priority Score weighting/thresholds, unauthorized-collection technical enforcement, consent-withdrawal-vs-immutability reconciliation, scenario-invalidation trigger, competitor/pricing duplicate-conflict-resolution rule, reclassification state-carry-forward rule, AI-recommendation timeout/escalation rule, benchmark-source-unreliability re-review trigger, rejected-research-informal-data handling, sensitive-disclosure redaction control, pricing staleness threshold
- [ ] T003 [P] Add `backend/src/modules/competitive-intelligence/{ethical-boundaries-guardrails,intelligence-architecture-lifecycle,competitor-profile-classification,competitor-product-lifecycle,competitor-pricing-intelligence,competitor-offers,feature-comparison-gap-analysis,change-monitoring-competitive-alerts,research-project-governance,research-secondary-sources,research-methods-interview-focus-survey,research-repository,persona-market-segmentation,industry-benchmarking,trend-opportunity-threat-intelligence,strategic-insights-dashboard,executive-decision-support-edss,ai-market-intelligence-predictive-scenario,executive-reporting-briefings}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Competitor` entity in `backend/src/modules/competitive-intelligence/competitor-profile-classification/competitor.entity.ts`
- [ ] T005 [P] Define the `Competitor Product` entity in `backend/src/modules/competitive-intelligence/competitor-product-lifecycle/competitor-product.entity.ts`
- [ ] T006 [P] Define the `Pricing Record / Pricing History Entry` entity in `backend/src/modules/competitive-intelligence/competitor-pricing-intelligence/pricing-record.entity.ts`
- [ ] T007 [P] Define the `Research Project / Research Study` entity in `backend/src/modules/competitive-intelligence/research-project-governance/research-project.entity.ts`
- [ ] T008 [P] Define the `Research Participant` entity in `backend/src/modules/competitive-intelligence/research-project-governance/research-participant.entity.ts`
- [ ] T009 [P] Define the `Feature Comparison Matrix Entry` entity in `backend/src/modules/competitive-intelligence/feature-comparison-gap-analysis/feature-comparison-entry.entity.ts`
- [ ] T010 [P] Define the `Competitor Change / Competitive Alert` entity in `backend/src/modules/competitive-intelligence/change-monitoring-competitive-alerts/competitive-alert.entity.ts`
- [ ] T011 [P] Define the `Customer Persona` entity in `backend/src/modules/competitive-intelligence/persona-market-segmentation/customer-persona.entity.ts`
- [ ] T012 [P] Define the `Market Segment` entity in `backend/src/modules/competitive-intelligence/persona-market-segmentation/market-segment.entity.ts`
- [ ] T013 [P] Define the `Benchmark Scorecard Entry` entity in `backend/src/modules/competitive-intelligence/industry-benchmarking/benchmark-scorecard-entry.entity.ts`
- [ ] T014 [P] Define the `Trend` entity in `backend/src/modules/competitive-intelligence/trend-opportunity-threat-intelligence/trend.entity.ts`
- [ ] T015 [P] Define the `Opportunity` entity in `backend/src/modules/competitive-intelligence/trend-opportunity-threat-intelligence/opportunity.entity.ts`
- [ ] T016 [P] Define the `Threat` entity in `backend/src/modules/competitive-intelligence/trend-opportunity-threat-intelligence/threat.entity.ts`
- [ ] T017 [P] Define the `Executive Decision / EDSS Recommendation` entity in `backend/src/modules/competitive-intelligence/executive-decision-support-edss/edss-recommendation.entity.ts`
- [ ] T018 [P] Define the `Scenario Plan` entity in `backend/src/modules/competitive-intelligence/ai-market-intelligence-predictive-scenario/scenario-plan.entity.ts`
- [ ] T019 [P] Define the `Executive Report / Intelligence Briefing` entity in `backend/src/modules/competitive-intelligence/executive-reporting-briefings/executive-report.entity.ts`
- [ ] T020 [P] Define the `Competitor Offer` entity in `backend/src/modules/competitive-intelligence/competitor-offers/competitor-offer.entity.ts`
- [ ] T021 [P] Define the `Research Repository Document` entity in `backend/src/modules/competitive-intelligence/research-repository/research-repository-document.entity.ts`
- [ ] T022 [P] Define the `Customer Interview / Focus Group / Survey` entity in `backend/src/modules/competitive-intelligence/research-methods-interview-focus-survey/research-method-record.entity.ts`
- [ ] T023 Ethical boundary guardrail: block unauthorized competitor-system access (FR-001)
- [ ] T024 Ethical boundary guardrail: block illegal private-data collection (FR-002)
- [ ] T025 Ethical boundary guardrail: block website-security-control bypass (FR-003)
- [ ] T026 Ethical boundary guardrail: block confidential-data purchase from unauthorized sources (FR-004)
- [ ] T027 Block automatic public publication of strategic reports; require an explicit human action (FR-005)
- [ ] T028 Block any AI-generated recommendation, forecast, or scenario output from making a final business decision without human approval (FR-006)
- [ ] T029 Present a visible disclaimer that the platform/AI outputs/research findings are not a replacement for legal, financial, or professional advisors (FR-007)
- [ ] T030 Block customer research data collection without consent; enforce applicable law/policy/governance across every research activity (FR-008)
- [ ] T031 Evidence-Based Intelligence: tie every surfaced insight to measurable data, research findings, customer evidence, or approved analyst observations (FR-009)
- [ ] T032 Continuous monitoring of configured competitors, market categories, customer signals, and industry developments (FR-010)
- [ ] T033 Centralized repository displaying Information Source, Collection Date, Last Updated Date, Confidence Level, Analyst Notes, and Verification Status on every external insight (FR-011)
- [ ] T034 RBAC restriction of sensitive research/internal-strategy/competitor-assessment/future-plan data to authorized users, wired to `016` (FR-012)
- [ ] T035 Implement the six-layer intelligence architecture (Intelligence Sources, Data Collection & Validation, Intelligence Processing, Strategic Analysis, Business Action, Dashboards & Reporting) (FR-013)
- [ ] T036 Implement the 13-stage intelligence lifecycle (Information Identified → Intelligence Archived or Updated) (FR-014)
- [ ] T037 Note: Market Segment extends `035`'s Segment/Segmentation-Category/Segment-Analytics-Snapshot engine rather than rebuilding a parallel segmentation-model taxonomy; AI-Based Dynamic Segmentation reuses `035`'s dynamic-refresh mechanism (per plan.md §1)
- [ ] T038 Note: AI persona generation, pricing/opportunity/threat/scenario/EDSS/AI-Market-Intelligence recommendation generation consume `008`'s AI gateway (per plan.md §2)
- [ ] T039 Note: Sales/CRM/Membership/Course Performance Intelligence Source data is sourced from `013`/`009`, not duplicated (per plan.md §3)
- [ ] T040 Note: Customer Feedback/Negative Brand Sentiment inputs to AI Market Intelligence and Threat Detection consume `041`'s Sentiment Score/Reputation Score/Reputation Risk Alert/Predictive Feedback Analytics outputs rather than re-implementing sentiment analysis (per plan.md §4)
- [ ] T041 Contract test: the EDSS never modifies a linked business system (pricing, roadmap, budget, partnership) without a recorded human approval action, in `backend/tests/contract/edss-never-auto-executes.contract.test.ts` (FR-070, SC-005)
- [ ] T042 Contract test: zero research projects reach Data Collection without passing Approval, and zero participant records are used in a research output without a recorded Consent Status, in `backend/tests/contract/research-consent-and-approval-gate.contract.test.ts` (FR-044, SC-003)
- [ ] T043 Contract test: zero approved research documents are permanently deleted; 100% remain retrievable in archived form, in `backend/tests/contract/approved-research-document-immutability.contract.test.ts` (FR-052, SC-004)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — An Analyst Classifies and Prioritizes a New Competitor (Priority: P1) 🎯 MVP

**Independent Test**: Create a competitor profile, assign a classification (Direct/Indirect/Replacement/Aspirational), populate the priority-score inputs, and confirm the system computes a Priority Score and assigns a priority tier.

- [ ] T044 [US1] Competitor Profile Repository with full field set, wired to T004, acceptance scenario 1 (FR-015)
- [ ] T045 [US1] 8 profile statuses with High Priority activation/archive/modification restricted to authorized users, wired to acceptance scenario 4 (FR-016)
- [ ] T046 [US1] Administrator-defined tags with tag-based search, filtering, segmentation, and reporting (FR-017)
- [ ] T047 [US1] 4-class classification (Direct/Indirect/Replacement/Aspirational) using the source's stated definitions, wired to acceptance scenario 2 (FR-018)
- [ ] T048 [US1] Direct-competitor default higher monitoring priority + Indirect-to-Direct reclassification support (FR-019)
- [ ] T049 [US1] Replacement-competitor behavior tracking + Aspirational-competitor study notes across 8 dimensions (FR-020)
- [ ] T050 [US1] 10-factor configurable Competitor Priority Score with 5-tier classification, wired to acceptance scenario 3 (FR-021)
- [ ] T051 [US1] Create/update/archive, owner assignment, source/notes recording, report generation, alert configuration, and versioned change history per competitor (FR-022)
- [ ] T052 [P] [US1] Competitor Profile Repository UI
- [ ] T053 [US1] Integration test: a new competitor profile is saved as Draft with an owner, classification sets the correct default monitoring priority, populated priority-score inputs produce the correct tier, an unauthorized user is blocked from modifying a High Priority record — all 4 acceptance scenarios in `backend/tests/integration/us1-competitor-classification-priority.integration.test.ts`

**Checkpoint**: The central source-of-truth competitor record every other capability attaches to is independently functional.

---

## Phase 4: User Story 2 — An Analyst Tracks a Competitor Product Through Its Full Lifecycle (Priority: P2)

**Independent Test**: Create a competitor product record, advance it through the eight lifecycle stages, record timeline events, and confirm each transition appears in the Change Timeline with an assigned Impact Level and, where significant, generates a Competitive Alert.

- [ ] T054 [US2] Competitor Product record full field set, wired to T005, acceptance scenario 1 (FR-023)
- [ ] T055 [US2] 8-stage lifecycle tracking (Rumored→Announced→Beta→Publicly Available→Mature→Limited Availability→Discontinued→Replaced) with every transition logged in the Product Timeline, wired to acceptance scenario 2 (FR-024)
- [ ] T056 [US2] Competitor Product Timeline (Launches, Feature Releases, Pricing Changes, Rebranding, Expansion, Reduction, Partnerships, Discontinuation, Customer Reaction) (FR-025)
- [ ] T057 [US2] 15-category Change Timeline logging (Change Date, Category, Description, Business Impact, Supporting Evidence, Assigned Analyst, Follow-up Status), wired to T010 (FR-037)
- [ ] T058 [US2] 5-level Impact Level assignment (Critical/High/Medium/Low/Informational) (FR-038)
- [ ] T059 [US2] Competitive Alert generation for 11 named event types delivered across 6 channels (FR-039)
- [ ] T060 [US2] 9-step alert workflow (Change Detected → Outcome Recorded), wired to acceptance scenario 3 (FR-040)
- [ ] T061 [US2] Executive Competitive Dashboard (10 elements) (FR-041)
- [ ] T062 [US2] Discontinued/Replaced products remain visible in the historical timeline with Customer Reaction captured, wired to acceptance scenario 4
- [ ] T063 [P] [US2] Product Timeline & Change Monitoring UI
- [ ] T064 [US2] Integration test: a new product is recorded as Rumored with source references, a Beta-to-Publicly-Available transition is logged in both timelines, a Critical/High-impact change runs the full 9-step workflow and notifies stakeholders, a discontinued product stays visible with its Customer Reaction — all 4 acceptance scenarios in `backend/tests/integration/us2-product-lifecycle-change-monitoring.integration.test.ts`

**Checkpoint**: The mechanism keeping competitive intelligence current rather than a one-time snapshot is independently functional.

---

## Phase 5: User Story 3 — Product and Marketing Compare TBT to Competitors Using the Feature Comparison Matrix (Priority: P1)

**Independent Test**: Populate feature comparison rows for TBT and at least one competitor, and confirm the Gap Analysis Dashboard automatically surfaces unique advantages, missing features, universally-available-but-TBT-missing features, and prioritized recommendations.

- [ ] T065 [US3] Feature Repository full field set across 16 categories, wired to T009 (FR-032)
- [ ] T066 [US3] Feature Comparison Matrix row (TBT Availability + up to 4 competitor columns, Feature Maturity, Competitive Rating, Analyst Recommendation), wired to acceptance scenario 1 (FR-033)
- [ ] T067 [US3] Per-comparison ratings (Business Value, Customer Demand, Competitive Importance, Development Complexity, Strategic Priority, Estimated ROI, Innovation Score), wired to acceptance scenario 4 (FR-034)
- [ ] T068 [US3] Automated Gap Analysis (unique advantages, missing features, universal-but-missing features, low-business-value features), wired to acceptance scenarios 2–3 (FR-035)
- [ ] T069 [US3] Configurable-business-rule prioritization on the Gap Analysis Dashboard (FR-036)
- [ ] T070 [P] [US3] Feature Comparison Matrix & Gap Analysis Dashboard UI
- [ ] T071 [US3] Integration test: TBT-Fully-Available/competitors-Not-Available is flagged a unique advantage, three-competitors-have-it-TBT-missing is flagged high-priority, ratings (not just availability) drive prioritization, a matrix row displays all required columns — all 4 acceptance scenarios in `backend/tests/integration/us3-feature-comparison-gap-analysis.integration.test.ts`

**Checkpoint**: The continuously-updated, single-source-of-truth competitive feature comparison is independently functional.

---

## Phase 6: User Story 4 — Research Teams Conduct Primary and Secondary Research Under Research Governance (Priority: P1)

**Independent Test**: Create a Primary Research project, attempt to record participant data without a recorded Consent Status (must be blocked/flagged), complete the research with consent recorded, and confirm the resulting document is versioned, subject to approval, and cannot be permanently deleted once approved.

- [ ] T072 [US4] 12-type research classification + 12-stage lifecycle enforcement (Research Request → Research Archive), wired to T007, acceptance scenario 1 (FR-042)
- [ ] T073 [US4] 10-method Primary Research support with full project field set (Project Name, Research Objective, Business Problem, Research Type, Target Audience, Sample Size, Research Method, Research Owner, Timeline, Budget, Current Status, Expected Deliverables) (FR-043)
- [ ] T074 [US4] Participant Profile with mandatory Consent Status gate before data use, wired to T008, T042's contract test, acceptance scenario 2 (FR-044)
- [ ] T075 [US4] Research Governance policy enforcement (Approval Workflow, Data Quality Standards, Participant Consent Management, Privacy Compliance, Document Version Control, Access Control, Review and Approval, Retention Policies, Audit Logging, Regulatory Compliance) across 8 configurable Research Roles (FR-051)
- [ ] T076 [US4] Full research-activity audit record (User, Action, Timestamp, Previous/Updated Value, Approval Status, Review Comments, Version Number) + permanent-delete block on approved documents, wired to T043's contract test, acceptance scenario 4 (FR-052)
- [ ] T077 [P] [US4] Research Governance/Approval workflow UI
- [ ] T078 [US4] Integration test: a project requires Approval before Data Collection may begin, participant data is blocked without recorded Consent Status, an AI interview summary requires analyst review before being treated as final, deletion of an approved document is blocked with the archive retained — all 4 acceptance scenarios in `backend/tests/integration/us4-research-governance.integration.test.ts`

**Checkpoint**: The non-negotiable ethical/legal governance layer over every research activity is independently functional.

---

## Phase 7: User Story 5 — Product, Marketing, and Sales Work From AI-Assisted, Auto-Updating Customer Personas and Segments (Priority: P2)

**Independent Test**: Create a Customer Persona from research inputs, confirm an AI Confidence Score is attached, then simulate a significant change in a customer's Purchase Activity or Product Usage and confirm their assigned Market Segment updates automatically.

- [ ] T079 [US5] Customer Persona built from research/behavior/demographic/purchase/engagement/AI-assisted inputs across 12 named types plus custom types, wired to T011, acceptance scenario 1 (FR-053)
- [ ] T080 [US5] Persona full field set plus AI Confidence Score and auto-summarized Common Goals/Frustrations/Buying Triggers/Decision Factors (FR-054)
- [ ] T081 [US5] Market Segment as an extension of `035`'s Segment/Segmentation-Category engine across 10 models, wired to T012 and T037's reuse note, acceptance scenario 2 (FR-055)
- [ ] T082 [US5] AI-Based Dynamic Segmentation auto-reassignment on 8 behavioral-change triggers, reusing `035`'s dynamic-refresh mechanism, wired to acceptance scenario 2 (FR-056)
- [ ] T083 [US5] Segment Comparison Dashboard (9 comparison dimensions) with retained historical segment movement, wired to acceptance scenario 3 (FR-057)
- [ ] T084 [US5] Deterministic fallback: last-computed persona/segment data displayed when the AI segmentation service is unavailable, wired to acceptance scenario 4 (Constitution Article II)
- [ ] T085 [P] [US5] Persona & Segment Comparison Dashboard UI
- [ ] T086 [US5] Integration test: a persona includes every required field plus a confidence score, a significant behavioral change auto-updates the segment without a manual analyst action, segment history is retained not overwritten, AI unavailability falls back to last-computed data rather than blocking access — all 4 acceptance scenarios in `backend/tests/integration/us5-persona-dynamic-segmentation.integration.test.ts`

**Checkpoint**: The shared, current understanding of TBT's customers that product/marketing/sales all work from is independently functional.

---

## Phase 8: User Story 6 — Leadership Reviews an Industry Benchmark Scorecard (Priority: P2)

**Independent Test**: Load a benchmark data set for at least one KPI category and confirm the Benchmark Dashboard computes Gap Percentage and assigns the correct Benchmark Scorecard classification.

- [ ] T087 [US6] TBT-vs-industry benchmarking across 13 KPI categories with sourced data (7 source types, references, update timestamps), wired to T013, acceptance scenario 1 (FR-058)
- [ ] T088 [US6] Benchmark Dashboard (TBT Performance, Industry Average, Top Performer, Gap Percentage, Improvement Target, Trend Direction, Benchmark Confidence, Executive Recommendations) plus per-KPI Gap Analysis, wired to acceptance scenario 4 (FR-059)
- [ ] T089 [US6] 5-tier Benchmark Scorecard classification (Industry Leader→Critical Improvement Required), wired to acceptance scenario 2 (FR-060)
- [ ] T090 [US6] Expiration Review Date staleness flagging, wired to acceptance scenario 3
- [ ] T091 [P] [US6] Benchmark Dashboard UI
- [ ] T092 [US6] Integration test: benchmark data displays all required fields, a worse-than-average Churn Rate is classified Critical/Below Average rather than better, an expired review date is flagged rather than silently current, a multi-KPI Gap Analysis identifies improvement opportunities — all 4 acceptance scenarios in `backend/tests/integration/us6-industry-benchmark-scorecard.integration.test.ts`

**Checkpoint**: The comparison layer letting leadership immediately spot where TBT is falling behind is independently functional.

---

## Phase 9: User Story 7 — Leadership Evaluates Strategic Options Using Scenario Planning (Priority: P3)

**Independent Test**: Configure at least two scenarios with different input assumptions, generate estimated outputs for each, and confirm the AI-generated comparison/recommendation is clearly marked as requiring executive approval and does not itself alter any live record.

- [ ] T093 [US7] 10 scenario types with 10 configurable input categories, wired to T018, acceptance scenario 1 (FR-074)
- [ ] T094 [US7] Per-scenario output estimation (Revenue, Profitability, Customer Growth, Market Share, Customer Retention, Business Risks, Resource Requirements, Strategic Opportunities, Expected ROI, Success Probability), wired to acceptance scenario 1 (FR-075)
- [ ] T095 [US7] AI multi-scenario comparison producing a Preferred/Alternative Strategy, Risk Mitigation Plan, Investment Priorities, Execution Timeline, and Resource Allocation, requiring executive approval before adoption, wired to acceptance scenarios 2–3 (FR-076)
- [ ] T096 [US7] Invalidated-assumption flagging and re-run path, wired to acceptance scenario 4
- [ ] T097 [P] [US7] Scenario Planning UI
- [ ] T098 [US7] Integration test: two configured scenarios produce the full output set, the AI comparison proposes a Preferred and Alternative Strategy, the recommendation is marked pending executive approval and takes no automatic action, an invalidated assumption can be flagged and the scenario re-run — all 4 acceptance scenarios in `backend/tests/integration/us7-strategic-scenario-planning.integration.test.ts`

**Checkpoint**: The most forward-looking, judgment-dependent capability in the chapter is independently functional.

---

## Phase 10: User Story 8 — The Executive Decision Support System Never Executes Strategic Actions Automatically (Priority: P1)

**Independent Test**: Generate an EDSS recommendation from existing research/competitor/benchmark/performance data, confirm it displays Supporting Evidence, Source References, AI Explanation, Confidence Score, and Human Review Status, and confirm no linked business system changes state until an authorized executive records an explicit approval.

- [ ] T099 [US8] EDSS analysis across 9 named data sources, wired to T017, acceptance scenario 1 (FR-067)
- [ ] T100 [US8] 10 recommendation types with a full Executive Decision Dashboard field set in a pending-approval state, wired to T041's contract test, acceptance scenario 1 (FR-068)
- [ ] T101 [US8] Supporting Evidence/Source References/AI Explanation/Human Review Status/Approval Workflow/Decision History/Audit Trail retention on every recommendation (FR-069)
- [ ] T102 [US8] Hard block: no linked business system (pricing engine, product roadmap, budget, partnership record) is modified without an explicit executive approval, wired to T041's contract test, acceptance scenario 2 (FR-070)
- [ ] T103 [US8] Approval recording writes to Decision History/Audit Trail with an assigned Executive Owner and enables Progress Tracking and Outcome Measurement, wired to acceptance scenario 3
- [ ] T104 [US8] Rejected or unapproved recommendations remain visible in decision history rather than being silently discarded, wired to acceptance scenario 4
- [ ] T105 [P] [US8] Executive Decision Dashboard UI
- [ ] T106 [US8] Integration test: a recommendation displays the full field set in a pending state, no linked system is modified without approval, an approval is recorded with owner and tracking enabled, a rejected recommendation stays visible in the audit trail — all 4 acceptance scenarios in `backend/tests/integration/us8-edss-non-autonomy.integration.test.ts`

**Checkpoint**: The direct, explicit instantiation of Constitution Article II for this chapter is independently functional and verified never to auto-execute.

---

## Phase 11: Pricing Intelligence, Offers & Trend/Opportunity/Threat Intelligence + Strategic Insights Dashboard (supports FR-026–FR-031, FR-061–FR-066; cross-cutting, no single owning story)

- [ ] T107 Competitor Pricing record full field set (Product Name, Plan Name, Currency, Monthly/Annual/Lifetime/Enterprise Price, Trial/Free Plan Availability, Billing Cycle, Pricing Model, Last Verified Date, Source Reference), wired to T006 (FR-026)
- [ ] T108 Pricing Comparison Dashboard (Lowest/Highest/Average/Median Price, TBT Position, Competitor Distribution, Price Differences, Value Comparison) (FR-027)
- [ ] T109 AI pricing-action suggestions (8 types) requiring administrator approval before implementation (FR-028)
- [ ] T110 Pricing History record on every detected change (Previous/New Price, % Change, Effective/Detected Date, Reason, Notes, Source URL, Verification Status) plus 6 pricing trend insight types and a visual Pricing Timeline (FR-029)
- [ ] T111 12-type Competitor Offer tracking with full field set, wired to T020 (FR-030)
- [ ] T112 Offer Performance Notes (Customer Response, Social Engagement, Market Impact, Estimated Adoption, Competitive Risk, Lessons Learned) (FR-031)
- [ ] T113 12-category Trend monitoring with a 6-stage lifecycle (Emerging→Archived) and retained historical trend data, wired to T014 (FR-061)
- [ ] T114 12-category Opportunity identification with full field set, wired to T015 (FR-062)
- [ ] T115 AI opportunity recommendations from 7 source signals requiring human review before execution (FR-063)
- [ ] T116 12-category Threat monitoring with full field set, wired to T016 (FR-064)
- [ ] T117 5-level Risk Matrix classification plus heatmaps and trend analysis for executive review (FR-065)
- [ ] T118 Strategic Insights Dashboard (10 widgets) with filter by Region/Industry/Segment, time-period comparison, export/schedule, dashboard views, sharing, and bookmarking (FR-066)

---

## Phase 12: Secondary Research/Interview/Focus Group/Survey/Repository remainder & AI Market Intelligence/Predictive Analytics & Executive Reporting (supports FR-045–FR-050, FR-071–FR-073, FR-077–FR-079)

- [ ] T119 14-source-type Secondary Research organization with full field set (Source Name, Publisher, Publication Date, URL/Reference, Credibility Score, Verification Status, Analyst Notes, Expiration Review Date) (FR-045)
- [ ] T120 AI secondary-research assistance (summarize, extract findings/statistics, detect trends, compare reports, highlight opportunities/risks, suggest follow-up research) reviewable by authorized analysts before use (FR-046)
- [ ] T121 Customer Interview planning plus outputs (Transcript, Key Insights, Customer Quotes, Pain Points, Opportunities, Recommendations, AI Summary, Follow-up Tasks) and Interview Analytics, wired to T022 (FR-047)
- [ ] T122 Focus Group sessions plus outputs and AI discussion analysis (6 capabilities) with analyst validate/edit of AI-generated findings (FR-048)
- [ ] T123 No-code Survey Builder (13 question types, 10 survey types, branching/logic/scheduling/publishing) plus Survey Analytics (8 metrics) (FR-049)
- [ ] T124 Enterprise Research Repository (11 content types) with Advanced Search, Version Control, Tags, Categories, Filters, Bookmarks, Related Documents, Access Permissions, Download History, Audit Logs, template reuse, and duplicate-project avoidance, wired to T021 (FR-050)
- [ ] T125 AI Market Intelligence Platform processing 14 input types into 10 output types, all subject to human review and approval (FR-071)
- [ ] T126 AI Market Intelligence recommendation full field set (Recommendation Title, Executive Summary, Supporting Evidence, Business Rationale, Expected Benefits, Estimated Investment/ROI, Business Risk, Confidence Score, Suggested Owner, Suggested Timeline) (FR-072)
- [ ] T127 12-target Predictive Analytics forecasting from 10 input types, with an 8-element Predictive Dashboard (FR-073)
- [ ] T128 10 Executive Report types with 10-section composition, distributed across 6 channels, wired to T019 (FR-077)
- [ ] T129 Automated Executive Intelligence Briefings (9-element composition: Top 10 Strategic Insights, Top Opportunities, Top Threats, etc.) (FR-078)
- [ ] T130 Report filtering (date, business unit, geography, market segment) plus scheduled automatic delivery and approved-enterprise-data-source dashboard refresh (FR-079)

---

## Phase 13: Polish — Governance, Security, Performance & Final Validation

- [ ] T131 [P] RBAC-governed access control, encryption of sensitive strategic data, immutable audit logs, and configurable data retention policies, wired to `016` (FR-080)
- [ ] T132 Evidence/confidence-score requirement, auditable and explainable AI processing, and analyst review/feedback support across every AI-generating module in this platform (FR-081)
- [ ] T133 Enterprise-scale dashboard/report performance hardening plus isolation of background intelligence processing from operational (customer-facing) systems (FR-082)
- [ ] T134 Resolve and document the 11 preserved NEEDS CLARIFICATION items from plan.md §5 not already closed by `research.md`
- [ ] T135 Final audit: cross-check every FR-001–FR-082 against an implementation or validation task; re-verify the `035` Market-Segment-extension decision, the `041` Sentiment/Reputation-reuse decision, and the `008`/`013`/`009` reuse decisions are respected
- [ ] T136 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `035`'s Segment engine, `008`'s AI gateway, `013`/`009`'s data, and `041`'s Sentiment/Reputation outputs, and produces the entity/architecture/ethical-guardrail infrastructure every subsequent phase depends on.
- **P1 stories (US1, US3, US4, US8)**: US1 (competitor classification/priority) is the foundational record every other capability attaches to and must land first; US3 (Feature Comparison Matrix) and US4 (Research Governance) are independent of US1 and of each other and can build in parallel; US8 (EDSS non-autonomy) depends on research/competitor/benchmark/performance data existing to analyze, so should land after US1/US3/US4 produce that data, even though it is P1.
- **P2 stories (US2, US5, US6)**: US2 (product lifecycle/change monitoring) depends on US1's competitor record; US5 (personas/dynamic segmentation) depends on `035`'s Segment engine and benefits from US4's research inputs; US6 (industry benchmarking) is independent of the others and can build in parallel.
- **P3 story (US7)** depends on research, competitor intelligence, benchmarking, and predictive analytics already existing and being populated, and should land last among the numbered stories.
- **Phase 11 (Pricing/Offers/Trend/Opportunity/Threat/Strategic Insights Dashboard)** depends on Foundational and US1 (pricing/offers attach to a Competitor); should land alongside US2.
- **Phase 12 (Secondary Research/Interview/Focus Group/Survey/Repository remainder, AI Market Intelligence/Predictive Analytics, Executive Reporting)** depends on Foundational and US4 (shares the Research Governance substrate) plus US8 (Executive Reporting surfaces EDSS output); should land after both.
- **Polish (Phase 13)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, ethical guardrails, 6-layer architecture, 13-stage lifecycle) → **STOP and VALIDATE** the three Foundational contract tests (edss-never-auto-executes, research-consent-and-approval-gate, approved-research-document-immutability) pass → US1 (competitor classification/priority) → **STOP and VALIDATE** the central competitor record is sound → US3 (Feature Comparison Matrix) + US4 (Research Governance) in parallel → US2 (product lifecycle/change monitoring) + Phase 11 (pricing/offers/trend/opportunity/threat/strategic-insights) → US5 (personas/dynamic segmentation) + US6 (industry benchmarking) in parallel → US8 (EDSS) → **STOP and VALIDATE** zero unapproved auto-execution across every AI module → Phase 12 (secondary research/AI market intelligence/executive reporting) → US7 (scenario planning) → Polish.
