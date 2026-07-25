---
description: "Task list for Feature 070 — Enterprise CX Personalization & Loyalty (Third CX Re-Specification)"
---

# Tasks: Enterprise CX Personalization & Loyalty (Third CX Re-Specification)

**Input**: Design documents from `/specs/070-enterprise-cx-personalization-loyalty/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis confirming the "Community Participation" stage's distinctiveness with specific verified evidence, spot-verifying citation accuracy against `052`, closing `052`'s own forward-declaration, and clarifying `006` as the specific ledger mechanic this feature's Loyalty content integrates with), spec.md, **Feature 044's Foundational phase complete** (15-stage lifecycle, Health Score), **Feature 052's Foundational phase complete** (Unified Customer Profile, AI Customer Intelligence), and **Feature 006's Foundational phase complete** (Reward Points ledger). This feature also assumes `001`'s layered RBAC and `008`'s `ai-gateway`/`ai-guardrails` (directly or via `066`) exist as consumption points.

**Tests**: Included throughout — the Community Participation non-skippable gate, the zero-pay-to-win gate, and the zero-duplicate-engine architecture gate each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-003, and SC-008.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single story, most of which are explicit citations to `044`/`052` (Customer Success/Journey Analytics/Omnichannel/AI Capabilities remainder, Security & Governance).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `044`'s Foundational phase (15-stage lifecycle, Health Score), `052`'s Foundational phase (Unified Customer Profile, AI Customer Intelligence), and `006`'s Foundational phase (Reward Points ledger) are deployed, and that `001`'s layered RBAC and `008`'s `ai-gateway`/`ai-guardrails` (directly or via `066`) exist as consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: whether Community Participation is a mandatory gate or optional/informational stage in the 11-stage funnel (explicitly flagged in Edge Cases); the mapping rule between this chapter's 11-stage funnel and `044`/`052`'s 15-stage lifecycles (assumed coarser reporting view, not stated explicitly in source); Language-vs-Location personalization-signal precedence; double-counted Reward Activity idempotency; SLA-breach-vs-Retention-Strategy-in-flight coordination; consent-withdrawal-vs-non-communication-surface personalization boundary; conflicting AI outputs across 044/052/070 for the same customer/segment; simultaneous-qualifying-activity distinct-ledger-entry requirement
- [ ] T003 [P] Add `backend/src/modules/enterprise-cx-personalization-loyalty/{platform-foundation,community-participation-stage,personalization-engine,journey-builder-triggers,loyalty-rewards,experience-governance-service-quality,voice-of-customer,ai-cx-assistant,customer-success-analytics-omnichannel-remainder}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Journey Stage (11-stage funnel)` entity in `backend/src/modules/enterprise-cx-personalization-loyalty/community-participation-stage/journey-stage.entity.ts`
- [ ] T005 [P] Define the `Journey Trigger` entity in `backend/src/modules/enterprise-cx-personalization-loyalty/journey-builder-triggers/journey-trigger.entity.ts`
- [ ] T006 [P] Define the `Personalization Surface` entity in `backend/src/modules/enterprise-cx-personalization-loyalty/personalization-engine/personalization-surface.entity.ts`
- [ ] T007 [P] Define the `Personalization Method` entity in `backend/src/modules/enterprise-cx-personalization-loyalty/personalization-engine/personalization-method.entity.ts`
- [ ] T008 [P] Define the `Experience Governance Standard` entity in `backend/src/modules/enterprise-cx-personalization-loyalty/experience-governance-service-quality/experience-governance-standard.entity.ts`
- [ ] T009 [P] Define the `AI CX Recommendation` entity in `backend/src/modules/enterprise-cx-personalization-loyalty/ai-cx-assistant/ai-cx-recommendation.entity.ts`
- [ ] T010 Unified, AI-powered customer engagement ecosystem orchestrating journeys, personalization, loyalty, customer success, VoC, experience analytics, service quality, omnichannel, and AI intelligence (FR-001)
- [ ] T011 Customer-first architecture unifying 10 named layers across 12 named Customer Touchpoints (Website, Mobile App, Community Platform, LMS, Email, SMS, Push, WhatsApp, Live Chat, Voice Support, Video Meetings, Social Channels) (FR-002)
- [ ] T012 10 Core CX Principles (Customer First, Personalization by Default, Omnichannel Consistency, Continuous Engagement, Transparency, Simplicity, Accessibility, Trust, Data Privacy, Continuous Improvement) as governing design constraints (FR-003)
- [ ] T013 Note: this feature's "Community Participation" journey stage is confirmed genuinely distinctive — `044`'s 15-stage lifecycle uses "Community Participation" extensively as a signal (5 separate FRs) but never as a named stage; this feature elevates it to an explicit, gated funnel stage layered on top of `044`'s canonical lifecycle (per plan.md §1)
- [ ] T014 Note: this feature's citations against `052` (FR-007/015/020/021) were spot-verified accurate — Unified Customer Profile and AI Customer Intelligence remain `052`'s canonical property, not reimplemented here (per plan.md §2)
- [ ] T015 Note: `052/plan.md` §6 already forward-declared this feature by name and predicted its exact scope — confirmed, closing that forward-declared item (per plan.md §3)
- [ ] T016 Note: `006` is the constitution's primary cited source for both Article V (Ledger-Based Internal Economies) and Article VIII (No Pay-to-Win) — the exact two articles this feature's own FR-013/FR-034 invoke; this feature's Loyalty content (FR-010–FR-013) integrates with `006`'s canonical ledger, matching the identical pattern `044`/`052` already established for their own Loyalty sections (per plan.md §4)
- [ ] T017 Note: AI CX Assistant reuses `008`'s `ai-gateway`/`ai-guardrails`, directly or transitively via `066`, consuming predictions from `052`'s canonical AI Customer Intelligence engine rather than a fifth independent AI-prediction stack (per plan.md §5)
- [ ] T018 Note: RBAC configures `001`'s/`016`'s existing layered engine per the established extension pattern (per plan.md §6)
- [ ] T019 Contract test: 100% of customers with an account record can be located at a current, correct stage of the 11-stage journey funnel, with "Community Participation" tracked as a distinct, non-skippable data point, in `backend/tests/contract/journey-funnel-100pct-community-participation-non-skippable.contract.test.ts` (SC-001)
- [ ] T020 Contract test: zero instances of Membership Tier/VIP Membership/Achievement Badges/Loyalty Status being directly purchasable with money outside the defined Reward Activities, in `backend/tests/contract/loyalty-zero-pay-to-win-purchasable-tier-badge-status.contract.test.ts` (SC-003)
- [ ] T021 Contract test: this feature introduces zero duplicate Customer Health Score/Success Plan/Churn Prediction/AI Customer Intelligence/Unified Customer Profile engines beyond `044`/`052`'s canonical ones, verified via architecture review confirming shared data stores/services, in `backend/tests/contract/zero-duplicate-health-score-churn-profile-engines-vs-044-052.contract.test.ts` (SC-008)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Customer's Journey Explicitly Passes Through the "Community Participation" Stage (Priority: P1) 🎯 MVP

**Independent Test**: Drive one test customer through Registration→Onboarding→Activation→Engagement→Purchase→Learning, confirming the platform does not advance them to "Retention" until they register at least one Community Participation signal, and confirming the stage and its entry/exit criteria are visible and configurable independently of the 044/052 lifecycle-stage engines.

- [ ] T022 [US1] 11-stage journey funnel (Awareness, Interest, Registration, Onboarding, Activation, Engagement, Purchase, Learning, **Community Participation**, Retention, Advocacy) with Community Participation as its own distinct, named, evaluated stage, wired to T004, T013's distinctiveness note, acceptance scenarios 1–4 (FR-004)
- [ ] T023 [P] [US1] Journey Funnel Stage Configuration UI
- [ ] T024 [US1] Integration test: a Learning-stage-completed customer is evaluated against Community Participation criteria before Retention consideration rather than silently skipped, a community post/group-join/discussion-participation activity advances/credits the customer at the Community Participation stage, a CX administrator can view/edit the stage's position/entry-criteria/success-metrics without a software change, a never-engaged customer is flagged as never having reached Community Participation rather than silently equivalenced to Learning completion — all 4 acceptance scenarios in `backend/tests/integration/us1-community-participation-stage.integration.test.ts`

**Checkpoint**: The single most distinctive, non-duplicative element this chapter contributes is independently functional.

---

## Phase 4: User Story 2 — Personalization Engine Applies "Personalization by Default" Across Named Surfaces (Priority: P1)

**Independent Test**: Create one test customer with known purchase history, learning progress, community activity, device, location, language, and subscription plan, then confirm each of the ten listed surfaces renders content that differs measurably from a control customer with none of that signal.

- [ ] T025 [US2] 10 Personalization Areas (Dashboard, Homepage, Course Recommendations, Product Recommendations, Community Feed, Notifications, Emails, Search Results, Learning Paths, Marketing Campaigns), wired to T006, acceptance scenarios 1–3 (FR-007)
- [ ] T026 [US2] 10 Personalization Methods (Behavioral Analysis, Purchase History, Learning Progress, Community Activity, Device Type, Location, Language, Interests, Subscription Plan, AI Recommendations), wired to T007, acceptance scenario 4 (FR-008)
- [ ] T027 [US2] Recommendation Engine (Course Suggestions, Product Suggestions, Events, Community Groups, Business Opportunities, Learning Resources, Mentors, Certifications, Webinars, AI Assistants) (FR-009)
- [ ] T028 [P] [US2] Personalization Engine Admin UI
- [ ] T029 [US2] Integration test: a signal-bearing customer's Dashboard/Homepage differs from a no-signal customer without manual configuration, Community Feed/Notifications/Search Results reflect Behavioral Analysis/Device/Location/Language signals, Learning Paths/Marketing Campaigns reflect Subscription Plan/AI Recommendations, a changed Language/Location preference propagates across all ten surfaces without full re-onboarding — all 4 acceptance scenarios in `backend/tests/integration/us2-personalization-by-default.integration.test.ts`

**Checkpoint**: The second load-bearing, distinctive contribution of this chapter is independently functional.

---

## Phase 5: User Story 3 — CX Team Configures Journey Builder Automation with Triggers, Wait Conditions, and Branch Logic (Priority: P2)

**Independent Test**: Build one journey using the Journey Builder with a "Community Post Created" trigger, a wait condition, and branch logic that splits customers by whether they complete a follow-up action, publishing it, and confirming test customers are routed down the correct branch.

- [ ] T030 [US3] Journey Features (Journey Builder, Journey Templates, Trigger-Based Automation, Event-Driven Actions, Multi-Step Workflows, Wait Conditions, Branch Logic, Goal Tracking, Journey Versioning, Journey Analytics), wired to acceptance scenarios 1–3 (FR-005)
- [ ] T031 [US3] 10 named Journey Triggers (New Registration, First Login, Course Enrollment, Purchase Completed, Community Post Created, Subscription Renewal, Inactivity, Support Ticket Created, Event Registration, Milestone Achievement), wired to T005, acceptance scenario 4 (FR-006)
- [ ] T032 [P] [US3] Journey Builder UI
- [ ] T033 [US3] Integration test: an "Inactivity" trigger allows configuring a wait condition and at least two branches, a "Milestone Achievement" event fires the correct multi-step workflow for the enrolled customer, an edited journey retains its prior version via Journey Versioning with Journey Analytics attributable per version, a customer matching multiple simultaneous triggers resolves to a defined, non-contradictory routing — all 4 acceptance scenarios in `backend/tests/integration/us3-journey-builder-triggers.integration.test.ts`

**Checkpoint**: The concrete authoring capability built on top of the journey-stage model is independently functional.

---

## Phase 6: User Story 4 — Customer Views and Redeems Loyalty & Rewards Without Purchasing Rank (Priority: P1)

**Independent Test**: Seed one test customer with qualifying activity across several Reward Activities, confirm their Loyalty Dashboard displays all ten listed fields correctly, and confirm there is no purchasable path to directly buy Membership Tier, VIP Membership, or an Achievement Badge.

- [ ] T034 [US4] Loyalty Program Features (Membership Levels, Reward Points, Achievement Badges, Referral Rewards, Cashback Programs, Coupons, Digital Wallet, Special Benefits, VIP Membership, Anniversary Rewards), wired to T016's `006`-ledger note, acceptance scenario 4 (FR-010)
- [ ] T035 [US4] 10 named Reward Activities (Registration, Daily Login, Course Completion, Certificate Earned, Community Contribution, Product Purchase, Event Participation, Referral Success, Profile Completion, Learning Streak), wired to acceptance scenario 1 (FR-011)
- [ ] T036 [US4] Loyalty Dashboard (Membership Tier, Reward Points, Earned Badges, Available Coupons, Redemption History, Referral Performance, Achievement Progress, Lifetime Rewards, Loyalty Status, VIP Benefits), wired to acceptance scenario 2 (FR-012)
- [ ] T037 [US4] Hard block: Membership Tier/VIP Membership/Achievement Badges/Loyalty Status MUST NOT be purchased directly with money, wired to T020's contract test, acceptance scenario 3 (FR-013)
- [ ] T038 [P] [US4] Loyalty Dashboard UI
- [ ] T039 [US4] Integration test: completed qualifying Reward Activities credit Reward Points and update Redemption History/Achievement Progress, the Loyalty Dashboard renders all 10 required fields, a direct-purchase attempt for VIP Membership/higher tier is not permitted, an anniversary date automatically credits the configured Anniversary Reward without manual intervention — all 4 acceptance scenarios in `backend/tests/integration/us4-loyalty-rewards-no-pay-to-win.integration.test.ts`

**Checkpoint**: The customer-facing, revenue-adjacent capability directly engaging Article VIII is independently functional.

---

## Phase 7: User Story 5 — CX Governance Enforces Experience Standards and Service Quality Metrics (Priority: P2)

**Independent Test**: Seed one SLA breach and one customer complaint, confirm both are captured against the ten named Service Quality Metrics, confirm a Service Review can be scheduled and completed, and confirm Executive Oversight can view the aggregated Experience Score.

- [ ] T040 [US5] Governance Features (CX Policies, Experience Standards, SLA Monitoring, Quality Assurance, Customer Audits, Process Compliance, Escalation Management, Service Reviews, Continuous Improvement, Executive Oversight), wired to T008, acceptance scenarios 2, 4 (FR-023)
- [ ] T041 [US5] 10 named Service Quality Metrics (Response Time, Resolution Time, Customer Satisfaction, First Contact Resolution, Complaint Rate, Service Availability, Escalation Rate, Quality Score, SLA Compliance, Experience Score), wired to acceptance scenarios 1, 3 (FR-024)
- [ ] T042 [P] [US5] Experience Governance Dashboard UI
- [ ] T043 [US5] Integration test: an SLA-breaching interaction is captured in SLA Monitoring and reflected in SLA Compliance/Escalation Rate metrics, a conducted Customer Audit records findings against Process Compliance feeding Continuous Improvement, Executive Oversight's Experience Score view is traceable to underlying Service Quality Metrics, a resolved escalation's Corrective Action is captured for the Service Review record — all 4 acceptance scenarios in `backend/tests/integration/us5-cx-governance-service-quality.integration.test.ts`

**Checkpoint**: The distinctive service-quality governance layer this chapter contributes is independently functional.

---

## Phase 8: User Story 6 — VoC Team Consolidates Feedback Channels and Surfaces Sentiment (Priority: P2)

**Independent Test**: Submit one feedback item through a Survey and one through Community Discussions, confirm each is categorized and sentiment-scored, and confirm the resulting record is consumable by the existing (044/052) feedback workflow rather than a duplicate pipeline.

- [ ] T044 [US6] 10 named Feedback Channels (Surveys, Ratings, Reviews, Community Discussions, Support Tickets, Live Chat, Emails, Social Media, Polls, Feedback Forms), wired to acceptance scenario 1 (FR-014)
- [ ] T045 [US6] Feedback Features (NPS, CSAT, CES, Open Feedback, Anonymous Feedback, Feature Requests, Complaint Management, Suggestion Box, Feedback Categorization, Sentiment Analysis), wired to acceptance scenarios 2–3 (FR-015)
- [ ] T046 [US6] 10 VoC collection areas (Customer Expectations, Satisfaction Levels, Product Experience, Learning Experience, Community Experience, Service Experience, Purchase Experience, Brand Perception, Improvement Suggestions, Success Stories), wired to acceptance scenario 4 (FR-016)
- [ ] T047 [P] [US6] VoC Consolidation UI
- [ ] T048 [US6] Integration test: Survey/Rating/Poll feedback is recorded with category and Sentiment Analysis applied, an NPS/CSAT/CES response is reflected in the appropriate VoC collection area, anonymous Suggestion-Box feedback is categorized without identity disclosure, a Success Story is routed distinctly from a Complaint — all 4 acceptance scenarios in `backend/tests/integration/us6-voc-feedback-consolidation.integration.test.ts`

**Checkpoint**: The feedback consolidation layer, deferring to the canonical 044/052 workflow, is independently functional.

---

## Phase 9: User Story 7 — AI CX Assistant Answers Executive Questions with Governed Recommendations (Priority: P3)

**Independent Test**: Ask the AI CX Assistant two of the ten listed example questions against seeded test data and confirm each response includes all nine required recommendation fields, with the Suggested Action requiring human review before any customer-facing or budget-affecting action is taken.

- [ ] T049 [US7] AI CX Assistant natural-language Q&A across the 10 documented example questions, wired to T017's `008`/`066`-reuse note, acceptance scenario 1 (FR-028)
- [ ] T050 [US7] AI recommendation full field set (Recommendation, Supporting Analytics, Confidence Score, Customer Impact, Business Impact, Suggested Action, Responsible Team, Expected Outcome, Estimated ROI), wired to T009, acceptance scenarios 2–3 (FR-029)
- [ ] T051 [P] [US7] AI CX Assistant UI
- [ ] T052 [US7] Integration test: a "which customers need immediate attention?" query returns all 9 required recommendation fields, a loyalty-campaign-change Suggested Action requires human review/approval before implementation, an insufficient-data question indicates low/no confidence rather than fabricating a Confidence Score — all 3 acceptance scenarios in `backend/tests/integration/us7-ai-cx-assistant.integration.test.ts`

**Checkpoint**: The executive-facing convenience layer built entirely on top of Stories 1–6's data is independently functional.

---

## Phase 10: Customer Success/Journey Analytics/Omnichannel/AI-Capabilities Remainder, Security & Governance (supports FR-017–FR-022, FR-025–FR-027, FR-030–FR-035; cross-cutting, no single owning story, largely citations to 044/052/006)

- [ ] T053 Reference, do not redefine: Customer Success Features (Health Scores, Success Plans, Milestones, Renewal Tracking, Churn Prediction, Success Tasks, Engagement Tracking, Account Reviews, Success Reports, Customer Education) — canonical in `044`/`052` (FR-017)
- [ ] T054 10 named Retention Strategies (Personalized Follow-Up, Learning Recommendations, Exclusive Rewards, Community Engagement, Renewal Campaigns, Customer Recognition, Mentorship Programs, Product Adoption Campaigns, Win-Back Campaigns, VIP Support), tying to T004's Community Participation stage and T034's Loyalty program (FR-018)
- [ ] T055 Reference, do not redefine: 10 named Customer Health Metrics (Login Frequency, Learning Progress, Community Participation, Purchase Activity, Support History, Satisfaction Score, Referral Activity, Feature Usage, Renewal Probability, Churn Risk) — duplicate of `044`'s/`052`'s Health Score inputs (FR-019)
- [ ] T056 Journey Analytics (Entry Sources, Funnel Conversion, Journey Completion, Drop-Off Analysis, Time to Conversion, Engagement Rate, Retention Rate, Revenue Contribution, Journey Efficiency, Customer Lifetime Value) applied against the 11-stage funnel (FR-020)
- [ ] T057 10 named Dashboards (Customer Journey, Engagement, Loyalty, Retention, Feedback, Executive, Community, Learning, Revenue, Customer Success) (FR-021)
- [ ] T058 10 named Reports (Customer Journey, Retention, Churn Analysis, Loyalty, Experience, Engagement, NPS, Revenue, Customer Success, Executive Summary) (FR-022)
- [ ] T059 Consistent customer engagement across 12 named Supported Channels (FR-025)
- [ ] T060 Reference, do not redefine: Omnichannel Features (Unified Customer Profile, Channel Synchronization, Conversation Continuity, Cross-Channel Notifications, Unified Activity Timeline, Channel Preference Management, Session Continuity, Personalized Experiences, Journey Synchronization, Centralized Analytics) — canonical in `052` (FR-026)
- [ ] T061 Reference, do not redefine: AI Capabilities (Customer Segmentation, Personalization Recommendations, Churn Prediction, CLV Prediction, Next Best Action, Sentiment Analysis, Journey Optimization, Behavioral Analysis, Recommendation Engine, Customer Success Automation, VoC Analysis, Engagement Forecasting) — near-identical to `052`'s canonical AI Customer Intelligence engine (FR-027)
- [ ] T062 RBAC, Customer Consent Management, Privacy Controls, Data Encryption, Customer Data Governance, Audit Logging, Data Retention Policies, Compliance Monitoring, AI Ethics Controls, HA, DR, Experience Governance Framework, wired to T018's `001`/`016`-reuse note (FR-030)
- [ ] T063 Integration with Enterprise AI Platform (`066`), Enterprise Data Platform (`065`), Enterprise Communication Platform (`069`), Enterprise Cloud Infrastructure (`068`), Enterprise Cybersecurity Platform (`067`), CRM (`060`), HRMS, Finance, Procurement, Inventory, Workflow Automation (`063`), Project Management (`061`), DMS (`062`), LMS (`004`), Community Platform, Customer Support Platform, Mobile/Web Applications, API Gateway (FR-031)
- [ ] T064 No autonomous execution of AI-driven personalization/loyalty/retention/governance recommendations without human/role-gated approval (FR-032)
- [ ] T065 Per-channel consent-withdrawal propagation without disabling personalization on non-withdrawn surfaces (FR-033)
- [ ] T066 Append-only, auditable Reward Point ledger entry per distinct qualifying event, wired to T016's `006`-ledger note (FR-034)
- [ ] T067 Every AI-generated recommendation/prediction in this chapter is advisory only, with predictive models canonically owned by `044`/`052` — no independent parallel AI models (FR-035)
- [ ] T068 [P] Customer Success/Analytics/Omnichannel/Security Remainder UI

---

## Phase 11: Polish — Final Validation

- [ ] T069 Resolve and document the 2 source-silent NEEDS CLARIFICATION items plus 7 from Edge Cases not already closed by `research.md`
- [ ] T070 Final audit: cross-check every FR-001–FR-035 against an implementation, reference-note, or validation task; re-verify the `044`, `052`, `006`, `008`/`066`, `001`/`016` reuse decisions are respected and zero duplicate engines were introduced
- [ ] T071 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `044`'s, `052`'s, and `006`'s Foundational phases, and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US4)**: US1 (Community Participation Stage) is this feature's primary reason for existing and must land first; US2 (Personalization by Default) is independent and can be built in parallel; US4 (Loyalty & Rewards) depends on `006`'s ledger already existing and can be built in parallel with US1/US2.
- **P2 stories (US3, US5, US6)**: US3 (Journey Builder) depends on US1's journey-stage model existing; US5 (CX Governance) depends on journey/personalization/loyalty capabilities already producing data to govern; US6 (VoC) is independent, deferring to `044`/`052`'s canonical feedback workflow.
- **P3 story (US7)** depends on US1–US6 already producing data to reason over, and should land last among the numbered stories.
- **Phase 10 (Customer Success/Analytics/Omnichannel/Security remainder)** depends on Foundational and US1/US4; can land alongside US3, US5, US6, US7.
- **Polish (Phase 11)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (journey-funnel-100pct-community-participation-non-skippable, loyalty-zero-pay-to-win-purchasable-tier-badge-status, zero-duplicate-health-score-churn-profile-engines-vs-044-052) pass → US1 (Community Participation Stage) → US2 (Personalization by Default) → **STOP and VALIDATE** the two load-bearing distinctive contributions are sound → US4 (Loyalty & Rewards) → US3 (Journey Builder) + US5 (CX Governance) + US6 (VoC) + Phase 10 (remainder) → US7 (AI CX Assistant) → Polish.
