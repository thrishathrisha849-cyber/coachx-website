---
description: "Task list for Feature 025 — AI Marketing Assistant, Predictive Intelligence & Content Generation"
---

# Tasks: AI Marketing Assistant, Predictive Intelligence & Content Generation

**Input**: Design documents from `/specs/025-ai-marketing-assistant/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `008`'s AI gateway/provider routing/prompt-priority stack, `019`'s CDP, and `020`/`021`/`023`'s channel execution exist as integration points, though it does not require their full feature completion to build its own marketing-intelligence layer.

**Tests**: Included throughout — the Article-II human-approval gate, sensitive-field masking, and predictive-score confidence display each get a dedicated Foundational contract test, matching this spec's own SC-002 (and the constitution's direct Article II citation of this chapter), SC-004, and SC-003.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus two supplementary cross-cutting phases for FR groups not owned by any single prioritized story.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `008`'s AI gateway/provider routing/prompt-priority stack, `019`'s CDP, `016`'s RBAC model, and `020`/`021`/`023`'s channel execution exist as integration points
- [ ] T002 Resolve `research.md` open items before proceeding: the marketing-specific AI-unavailable fallback UX (what a marketer sees when no predictive score/content can be generated at all), confirmation that campaign-publish is a chain-gated action under `016`'s RBAC model, and confirmation of the authoritative PII-sensitivity field registry against `013`'s consent/legal-basis definitions
- [ ] T003 [P] Add `backend/src/modules/{ai-marketing-dashboard,ai-content-generation,ai-campaign-generation,ai-audience-intelligence,ai-predictive-intelligence,ai-customer-insights,ai-recommendation-engine,ai-personalization,ai-prompt-library,ai-creative-suggestions,ai-performance-optimizer,ai-marketing-copilot,ai-learning-engine,ai-marketing-analytics,ai-marketing-governance}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `AI Campaign Draft` entity (Draft→Under Review→Approved/Rejected→Published states) in `backend/src/modules/ai-campaign-generation/ai-campaign-draft.entity.ts`
- [ ] T005 [P] Define the `AI Content Output` entity in `backend/src/modules/ai-content-generation/ai-content-output.entity.ts`
- [ ] T006 [P] Define the `Predictive Score` entity (9 score types) in `backend/src/modules/ai-predictive-intelligence/predictive-score.entity.ts`
- [ ] T007 [P] Define the `Customer Insight` entity in `backend/src/modules/ai-customer-insights/customer-insight.entity.ts`
- [ ] T008 [P] Define the `Recommendation` entity (Campaign/Customer/Business) in `backend/src/modules/ai-recommendation-engine/recommendation.entity.ts`
- [ ] T009 [P] Define the `Brand Voice Profile` preset-reference entity (referencing `008`'s base entity) in `backend/src/modules/ai-prompt-library/brand-voice-preset.entity.ts`
- [ ] T010 [P] Define the `Prompt Template` entity in `backend/src/modules/ai-prompt-library/prompt-template.entity.ts`
- [ ] T011 [P] Define the `AI Usage / Prompt Audit Log Entry` entity in `backend/src/modules/ai-marketing-governance/prompt-audit-log.entity.ts`
- [ ] T012 [P] Define the `AI Analytics Metric Snapshot` entity in `backend/src/modules/ai-marketing-analytics/ai-analytics-snapshot.entity.ts`
- [ ] T013 Implement the AI marketing data pipeline (CDP → AI Data Processing Layer → ML Models → Prediction Engine → Generative AI Engine → Marketing Assistant → Campaign Execution → Performance Learning) in `backend/src/modules/ai-marketing-dashboard/ai-pipeline.service.ts` (FR-001)
- [ ] T014 Implement the AI Marketing Dashboard (AI Suggestions, Campaign Health Score, Conversion Prediction, Revenue Forecast, Lead Intelligence, Customer Insights, Content Recommendations, Marketing Opportunities, AI Alerts, Optimization Tasks) refreshed within 5s (FR-002)
- [ ] T015 Note: this feature consumes `008`'s AI gateway, provider/model routing, and 10-layer prompt-priority stack directly; none of it is rebuilt here
- [ ] T016 Note: this feature consumes `019`'s CDP audience/customer data directly; data collection/unification is not redefined here
- [ ] T017 Contract test: zero AI-generated campaigns are ever found in a published/live state without a recorded human approval action, in `backend/tests/contract/ai-campaign-human-approval-gate.contract.test.ts` (FR-010, SC-002, Constitution Article II)
- [ ] T018 Contract test: sensitive-classified customer fields are masked/redacted before reaching an AI model, with the masking event recorded in the Prompt Audit Log, in `backend/tests/contract/ai-marketing-sensitive-field-masking.contract.test.ts` (FR-039, SC-004)
- [ ] T019 Contract test: 100% of displayed predictive scores show a visible confidence indicator, in `backend/tests/contract/ai-predictive-score-confidence-display.contract.test.ts` (FR-015, SC-003)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Generate a Full AI Campaign for Human Review (Priority: P1) 🎯 MVP

**Independent Test**: Request AI campaign generation from a text brief, confirm a complete draft is produced containing every required component, and confirm no publish action can succeed anywhere in the system without an explicit, recorded administrator approval step.

- [ ] T020 [US1] Full campaign draft generation (objective, audience, channels, landing page, email/SMS/WhatsApp sequences, push notifications, follow-up workflow, analytics configuration) within 15s, wired to T004 (FR-009, acceptance scenario 1)
- [ ] T021 [US1] Reviewable and editable draft state that blocks any "publish" action until an explicit approval is recorded, wired to T017's contract test (FR-010, acceptance scenario 2)
- [ ] T022 [US1] Approval recording (who approved, when) in the audit log on submission (acceptance scenario 3)
- [ ] T023 [US1] Publish-rejection enforcement for unapproved drafts, including any AI-initiated publish attempt (acceptance scenario 4)
- [ ] T024 [P] [US1] Campaign draft review/approve UI
- [ ] T025 [US1] Integration test: draft contains all required components within 15s, publish blocked until approval, approval recorded and campaign published, AI cannot bypass the approval gate — all 4 acceptance scenarios in `backend/tests/integration/us1-ai-campaign-generation.integration.test.ts`

**Checkpoint**: The flagship capability and the clearest expression of Constitution Article II in this feature is independently functional.

---

## Phase 4: User Story 2 — Generate Channel-Ready Marketing Content (Priority: P1)

**Independent Test**: Select a content type and channel, generate output, and confirm the result matches the requested type/channel/language and is presented as an editable draft that requires a separate, explicit action to publish or send.

- [ ] T026 [US2] Marketing copy generation (headlines, taglines, product descriptions, landing page copy, sales pages, blog articles, case studies) (FR-003)
- [ ] T027 [US2] Communication content generation (email campaigns, SMS messages, WhatsApp campaigns, push notifications, newsletters, announcements) (FR-004)
- [ ] T028 [US2] Social media content generation (Facebook, Instagram, LinkedIn, X, Threads, YouTube descriptions, community posts) with platform-appropriate formatting (FR-005, acceptance scenario 2)
- [ ] T029 [US2] Sales materials generation (scripts, proposal summaries, pitch deck text, call scripts, customer responses) (FR-006)
- [ ] T030 [US2] Multilingual generation (Tamil, Tanglish, English) within 10s (FR-007, acceptance scenario 4)
- [ ] T031 [US2] Editable-draft presentation, clearly marked AI-generated, with no auto-publish or auto-send to any channel (FR-008, acceptance scenario 3)
- [ ] T032 [P] [US2] Content generation UI (type/channel/brief selector)
- [ ] T033 [US2] Integration test: email copy tagged correctly within 10s, platform-appropriate social formatting, output clearly marked AI-generated and not auto-published, requested language honored — all 4 acceptance scenarios in `backend/tests/integration/us2-ai-content-generation.integration.test.ts`

**Checkpoint**: The highest-frequency building block that campaign generation and the Copilot both depend on is independently functional.

---

## Phase 5: User Story 3 — View Predictive Purchase Probability, CLV, and Churn Scores (Priority: P1)

**Independent Test**: Open a customer or segment's AI insights view and confirm purchase probability, CLV, and churn probability display with a confidence score, and that scores are recalculated when triggered by new behavioral data — without any human action needed to view them.

- [ ] T034 [US3] 9-score-type predictive estimation (purchase probability, membership-upgrade likelihood, campaign-success probability, CLV, churn probability, referral probability, course-completion probability, webinar-attendance probability, subscription-renewal probability), wired to T006 (FR-012)
- [ ] T035 [US3] Continuous recalculation on behavior change within 3s, wired to T019's contract test (FR-013, acceptance scenario 2)
- [ ] T036 [US3] Customer Insight identification (high-value customers, at-risk customers, fast-growing segments, hidden opportunities, engagement trends, behavioral changes, preferred channels, peak activity hours), wired to T007 (FR-014, acceptance scenario 4)
- [ ] T037 [US3] Confidence-score display with clear visual distinction for low-confidence scores (FR-015, acceptance scenarios 1, 3)
- [ ] T038 [P] [US3] AI Customer/Segment Insights view UI
- [ ] T039 [US3] Integration test: scores displayed with confidence, recalculated within 3s on data change, low-confidence scores visually flagged, segments shown with confidence — all 4 acceptance scenarios in `backend/tests/integration/us3-predictive-intelligence.integration.test.ts`

**Checkpoint**: The analytical core that the recommendation engine, retention actions, and revenue insights all build on is independently functional.

---

## Phase 6: User Story 4 — Admin Masks Sensitive Customer Data Before AI Processing (Priority: P1)

**Independent Test**: Trigger an AI operation on a customer record that contains fields classified as sensitive, and confirm those fields are masked/redacted before reaching the AI system while non-sensitive fields pass through normally, with the masking event recorded in the prompt audit log.

- [ ] T040 [US4] Sensitive-field classification and masking before AI processing, wired to T018's contract test (FR-039, acceptance scenario 1)
- [ ] T041 [US4] Admin-configurable sensitive-field classification applying to subsequent AI-processing operations (acceptance scenario 2)
- [ ] T042 [US4] Default-block behavior for a field type not yet classified as sensitive or safe (acceptance scenario 3)
- [ ] T043 [US4] Masking-event capture in the Prompt Audit Log, filterable by masking events (acceptance scenario 4, FR-036)
- [ ] T044 [P] [US4] Sensitive-field classification admin UI and audit-log masking-event filter UI
- [ ] T045 [US4] Integration test: classified fields masked before the AI call, updated classification applies going forward, unclassified field blocked by default, audit log filterable by masking events — all 4 acceptance scenarios in `backend/tests/integration/us4-sensitive-data-masking.integration.test.ts`

**Checkpoint**: The compliance/legal-exposure safeguard required by §19 and the Security & Compliance Baseline is independently functional.

---

## Phase 7: User Story 5 — Use the AI Prompt Library with Brand Voice Presets (Priority: P2)

**Independent Test**: Select a prompt template from a category, generate content, and confirm the output tone matches the workspace's selected brand voice preset; separately, confirm an authorized admin can create, edit (as a new version), tag, and share a prompt template, while an unauthorized user cannot edit it.

- [ ] T046 [US5] Prompt Library with 10 categories (Sales, Marketing, Email, SMS, WhatsApp, Social Media, Customer Support, Product Launch, Webinar, Community Engagement), wired to T010 (FR-022, acceptance scenario 1)
- [ ] T047 [US5] Create/edit/share/version/tag prompt templates, with edits recorded as a new version rather than an in-place overwrite (FR-023, acceptance scenario 3)
- [ ] T048 [US5] 9 brand-voice presets (Professional, Friendly, Corporate, Educational, Motivational, Premium, Luxury, Startup, Casual), referencing `008`'s base Brand Voice Profile entity, wired to T009 (FR-024, acceptance scenario 2)
- [ ] T049 [US5] Brand-voice-consistency enforcement across all AI-generated content for a workspace (FR-025)
- [ ] T050 [US5] Permission-gated template editing with denial for unauthorized users (acceptance scenario 4)
- [ ] T051 [P] [US5] Prompt Library browsing/management UI
- [ ] T052 [US5] Integration test: category filtering, brand-voice-consistent output, edit creates a new version, unauthorized edit denied — all 4 acceptance scenarios in `backend/tests/integration/us5-prompt-library-brand-voice.integration.test.ts`

**Checkpoint**: The enterprise-scale reuse layer on top of Stories 1–2 is independently functional.

---

## Phase 8: User Story 6 — Receive AI Recommendations for Next-Best Actions (Priority: P2)

**Independent Test**: View the recommendation panel for a campaign or a customer and confirm recommendations are categorized (campaign/customer/business), each is individually actionable (accept/dismiss), and each acceptance/dismissal is recorded.

- [ ] T053 [US6] Campaign recommendations (best type, audience, channel, schedule, CTA, landing page), wired to T008 (FR-016, acceptance scenario 1)
- [ ] T054 [US6] Customer recommendations (Next Best Offer, Next Best Course, Next Best Ebook, podcast, membership upgrade, referral opportunity) (FR-017, acceptance scenario 2)
- [ ] T055 [US6] Business recommendations (revenue opportunities, customer-retention actions, cross-selling, upselling, win-back campaigns) (FR-018, acceptance scenario 3)
- [ ] T056 [US6] Real-time recommendation updates as underlying data changes (FR-019)
- [ ] T057 [US6] Accept/dismiss action recording feeding the Recommendation Acceptance Rate metric, wired to T012 (acceptance scenario 4)
- [ ] T058 [P] [US6] Recommendation panel UI (campaign/customer/business, accept/dismiss)
- [ ] T059 [US6] Integration test: campaign recommendations shown, customer recommendations shown, business recommendations shown, accept/dismiss recorded and reported — all 4 acceptance scenarios in `backend/tests/integration/us6-recommendation-engine.integration.test.ts`

**Checkpoint**: The layer turning Predictive Intelligence and Audience Intelligence into concrete next actions is independently functional.

---

## Phase 9: User Story 7 — Converse With the AI Marketing Copilot (Priority: P3)

**Independent Test**: Issue a conversational request to the Copilot and confirm it returns the requested output (a campaign draft, a list of underperforming campaigns, a conversion prediction, etc.) accompanied by an explanation of its reasoning, without bypassing any approval gates defined in Stories 1 or 4.

- [ ] T060 [US7] Conversational Copilot handling natural-language marketing tasks, wired to T015's reuse of `008`'s gateway (FR-029, acceptance scenario 1)
- [ ] T061 [US7] Reasoning explanation accompanying every Copilot output (FR-030, acceptance scenario 1)
- [ ] T062 [US7] Underperforming-campaign query support via Performance Optimizer integration (acceptance scenario 2)
- [ ] T063 [US7] Conversion-prediction query support returning reasoning/confidence, not a bare number (acceptance scenario 3)
- [ ] T064 [US7] Approval-gate integrity check: Copilot output cannot bypass US1's approval gate or US4's masking gate
- [ ] T065 [P] [US7] Copilot chat UI
- [ ] T066 [US7] Integration test: premium-brand-voice email with explanation, underperforming campaigns with triggering metrics, conversion prediction with reasoning — all 3 acceptance scenarios in `backend/tests/integration/us7-ai-copilot.integration.test.ts`

**Checkpoint**: The conversational front door onto Stories 1, 2, 3, and 6 is independently functional.

---

## Phase 10: Audience Intelligence, Personalization, Creative Suggestions, Performance Optimizer & Learning Engine remainder (supports FR-011, FR-020–FR-021, FR-026–FR-028, FR-031–FR-032; cross-cutting, no single owning story)

- [ ] T067 Audience analysis (demographics, purchase behavior, learning interests, community participation, device preferences, geographic location, communication history, engagement patterns) plus best-audience recommendation (FR-011)
- [ ] T068 Personalization engine (name, preferred language, interests, previous purchases, membership, community activity, learning progress, favorite topics, recommended products) (FR-020)
- [ ] T069 Cross-channel personalization consistency (FR-021)
- [ ] T070 [P] Creative-direction suggestions (banner concepts, hero images, ad layouts, thumbnail ideas, infographics, social creatives, color palettes, icon suggestions, CTA placement) — no image-generation integration, explicitly out of scope per source §14 (FR-026)
- [ ] T071 Performance monitoring (open rate, click rate, conversion rate, engagement rate, bounce rate, customer retention, revenue, lead quality) (FR-027)
- [ ] T072 Optimization-recommendation generation (better headlines, different CTA, improved timing, alternative audiences, better channels) (FR-028)
- [ ] T073 Continuous learning from campaign performance, customer interactions, purchases, engagement, conversion history, marketing outcomes, user feedback (FR-031)
- [ ] T074 Periodic model retraining (FR-032)

**Checkpoint**: The audience/personalization/creative/optimization/learning substrate underlying Stories 1, 2, 6, and 7 is independently functional.

---

## Phase 11: AI Analytics Dashboard, Governance & Polish

- [ ] T075 [P] AI Analytics Metric Snapshot (AI Content Generated, AI Campaigns Created, Prediction Accuracy, Recommendation Acceptance Rate, Revenue Influenced by AI, AI Optimization Savings, Customer Satisfaction, Time Saved, ROI Improvement), wired to T012, in `web/src/app/(marketing-admin)/ai-assistant/analytics/page.tsx` (FR-033)
- [ ] T076 Filtering by campaign, department, and date range (FR-034)
- [ ] T077 RBAC enforcement across all AI marketing platform functions, wired to `016` (FR-035)
- [ ] T078 Prompt Audit Log capturing every AI marketing request, wired to T011 (FR-036)
- [ ] T079 Content Approval Workflow enforcement for every AI-generated marketing output prior to it taking effect (FR-037)
- [ ] T080 Security hardening pass: encryption, API authentication, rate limiting, usage monitoring, AI Usage Reports (FR-038)
- [ ] T081 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (marketing-specific AI-unavailable fallback UX, campaign-publish approval-chain confirmation under `016`, PII-sensitivity field registry confirmation against `013`)
- [ ] T082 Final audit: cross-check every FR-001–FR-039 against an implementation or validation task; verify this feature reuses `008`'s AI gateway/prompt-priority stack/base Brand Voice Profile without duplication, and hands off campaign components to `020`/`021`/`023` without redefining delivery
- [ ] T083 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `008`'s AI gateway, `019`'s CDP, and `016`'s RBAC model, and produces the entity/pipeline/dashboard infrastructure every subsequent phase depends on.
- **P1 stories (US1–US4)**: US1 (campaign generation) is the flagship capability and should ship first, since it proves the Article II approval gate the whole feature turns on; US2 (content generation) is the building block US1 and US7 both depend on and can build in parallel with US1; US3 (predictive scores) and US4 (masking) are both largely independent of US1/US2 and can build in parallel, though US4's masking must exist before any story processes real customer data through the AI gateway in production.
- **P2 stories (US5–US6)**: US5 (prompt library/brand voice) is an enhancement layer on top of US2 and depends on it; US6 (recommendations) depends on US3's predictive scores and Phase 10's audience intelligence — both can build in parallel.
- **P3 story (US7)** depends on US1, US2, US3, and US6 already existing (it is a conversational front door onto them) and must respect US1's and US4's gates.
- **Phase 10 (Audience Intelligence/Personalization/Creative/Optimizer/Learning remainder)** depends on Foundational and `019`'s CDP; US3 and US6 depend on parts of it (audience intelligence), so it should land alongside or just before those stories.
- **Polish (Phase 11)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, pipeline, dashboard) → **STOP and VALIDATE** the three Foundational contract tests (campaign-human-approval-gate, sensitive-field-masking, predictive-score-confidence-display) pass → US1 (campaign generation) → **STOP and VALIDATE** the Article II approval gate cannot be bypassed → US2 (content generation) + US3 (predictive scores) + US4 (masking) in parallel → **STOP and VALIDATE** the three P1-adjacent capabilities are trustworthy → US5 (prompt library/brand voice) + US6 (recommendations) in parallel → US7 (Copilot) → Phase 10 (audience/personalization/creative/optimizer/learning) → Polish.
