---
description: "Task list for Feature 024 — Lead Management, Qualification & Scoring"
---

# Tasks: Lead Management, Qualification & Scoring

**Input**: Design documents from `/specs/024-lead-management-scoring/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `023` hands off a captured lead, `019`'s CDP and `013`'s CRM expose sync targets, and `008`'s AI gateway exists, though it does not require their full feature completion to build its own lead-intelligence engine.

**Tests**: Included throughout — lifecycle-audit-completeness, real-time score recalculation, and AI-advisory-only get dedicated Foundational contract tests, matching this spec's own SC-001, SC-002, and SC-006.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (Status/Segmentation/Timeline/Nurturing/Analytics remainder FR-014–FR-015, FR-037–FR-040, FR-044–FR-047).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor this feature reuses via `016`), and that `023` can hand off captured leads and `019`/`013`/`008` exist as integration points
- [ ] T002 Resolve `research.md` open items before proceeding: score-frequency cap/cooldown rule, score floor-at-zero confirmation, assignment-engine fallback behavior when no eligible owner exists, band-oscillation re-trigger semantics, MQL/SQL/PQL mutual-exclusivity, and — critically — how this feature's 0–1000/5-band score reconciles with `013`'s independently defined 0–100 CRM lead score
- [ ] T003 [P] Add `backend/src/modules/{lead-lifecycle,lead-capture-sources,lead-profile,lead-status,lead-qualification,lead-assignment,lead-scoring,lead-ai-scoring,lead-segmentation,lead-timeline,lead-duplicate,lead-nurturing,lead-analytics}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Lead` entity and the 8-stage lifecycle state machine (Visitor→Lead Captured→Lead Validated→Lead Qualified→Lead Scored→Sales Assigned→Opportunity→Customer) in `backend/src/modules/lead-lifecycle/lead.entity.ts` (FR-001, FR-002)
- [ ] T005 [P] Define `Lead Score`/`Score Event` entities in `backend/src/modules/lead-scoring/lead-score.entity.ts` (FR-024)
- [ ] T006 [P] Define the `Qualification Status` entity in `backend/src/modules/lead-qualification/qualification-status.entity.ts` (FR-016)
- [ ] T007 [P] Define the `Lead Status` entity (11 statuses) in `backend/src/modules/lead-status/lead-status.entity.ts` (FR-014)
- [ ] T008 [P] Define the `Lead Source` entity (5 categories) in `backend/src/modules/lead-capture-sources/lead-source.entity.ts`
- [ ] T009 [P] Define the `Assignment Rule` entity in `backend/src/modules/lead-assignment/assignment-rule.entity.ts` (FR-021)
- [ ] T010 [P] Define the `Lead Segment` entity in `backend/src/modules/lead-segmentation/lead-segment.entity.ts` (FR-037)
- [ ] T011 [P] Define the `Lead Timeline Event` entity in `backend/src/modules/lead-timeline/lead-timeline-event.entity.ts` (FR-039)
- [ ] T012 [P] Define the `Duplicate Match` entity in `backend/src/modules/lead-duplicate/duplicate-match.entity.ts` (FR-041)
- [ ] T013 [P] Define the `AI Score Insight` entity in `backend/src/modules/lead-ai-scoring/ai-score-insight.entity.ts` (FR-031)
- [ ] T014 Implement 5-source-category lead capture (Website, Marketing Campaigns, Social Media, External Platforms, Manual Sources), wired to T008, in `backend/src/modules/lead-capture-sources/capture-sources.service.ts` (FR-005–FR-009)
- [ ] T015 Implement unified lead-profile aggregation (Identity, Marketing, Behavioral, Commercial information), wired to T004, in `backend/src/modules/lead-profile/unified-profile.service.ts` (FR-010–FR-013)
- [ ] T016 Implement every-lead centralization into a single unified profile (FR-004)
- [ ] T017 Implement CRM/CDP/Workflow/AI-Assistant/Campaign-Manager/Analytics integration touchpoints (FR-001)
- [ ] T018 Note: RBAC reuses `001`/`016`'s model directly for all lead-management actions (Constitution Article VII)
- [ ] T019 Note: this feature's 0–1000/5-band score is authoritative for this feature; reconciliation with `013`'s 0–100 CRM score is a documented, unresolved downstream integration/mapping concern, not silently resolved here
- [ ] T020 Contract test: 100% of lead lifecycle stage transitions are recorded with a timestamp and retrievable from the audit log, with zero unrecorded transitions, in `backend/tests/contract/lead-lifecycle-audit-completeness.contract.test.ts` (FR-003, SC-001)
- [ ] T021 Contract test: a lead's score and band reflect a newly-occurred scored behavior within 500ms using the currently configured point value, in `backend/tests/contract/lead-score-realtime-recalculation.contract.test.ts` (FR-026, SC-002)
- [ ] T022 Contract test: AI-generated scores/predictions/recommendations never autonomously change a lead's status, qualification, or assignment, and the rule-based score keeps functioning correctly when AI scoring fails, in `backend/tests/contract/lead-ai-advisory-only.contract.test.ts` (FR-036, SC-006)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — A Captured Lead Progresses Through the Standardized Lifecycle (P1) 🎯 MVP

**Independent Test**: Capture a single lead from any configured source and manually drive it through each lifecycle stage, then confirm the lead's audit trail shows a timestamped record for every transition with no gaps.

- [ ] T023 [US1] Lead-record creation in the "Lead Captured" stage on form submission, wired to T004 (FR-002, acceptance scenario 1)
- [ ] T024 [US1] Lead Validated transition (verified email/phone) plus audit logging, wired to T020 (acceptance scenario 2)
- [ ] T025 [US1] Sales-Assigned/Opportunity/Customer stage progression with auditable ordering (acceptance scenario 3)
- [ ] T026 [US1] Chronological lifecycle audit-log view, distinct from the general activity timeline, wired to T011 (acceptance scenario 4)
- [ ] T027 [P] [US1] Lead lifecycle/audit-trail UI in `web/src/app/(marketing-admin)/leads/[leadId]/lifecycle/page.tsx`
- [ ] T028 [US1] Integration test: capture creates Lead Captured stage, validation transition is audited, sales-assignment-through-conversion is auditable, full chronological audit-log view — all 4 acceptance scenarios in `backend/tests/integration/us1-lead-lifecycle.integration.test.ts`

**Checkpoint**: The backbone every other capability in this chapter attaches to is independently functional.

---

## Phase 4: User Story 2 — A Numeric Lead Score Updates When a Scored Behavior Occurs (P1)

**Independent Test**: Trigger a single scored behavior on a lead with a known starting score and confirm the new score equals the prior score plus the configured point value, with band classification updating if a threshold is crossed.

- [ ] T029 [US2] 0–1000 numeric score maintenance per lead, wired to T005 (FR-024)
- [ ] T030 [US2] Score-band classification (Cold Lead 0–199, Warm Lead 200–399, Qualified Lead 400–699, Hot Lead 700–899, Sales Ready 900–1000), wired to T021's contract test (FR-025, acceptance scenario 2)
- [ ] T031 [US2] Dynamic real-time recalculation on scoring-relevant behavior in `backend/src/modules/lead-scoring/score-recalculation.service.ts` (FR-026, acceptance scenario 1)
- [ ] T032 [US2] Behavioral point table (Website Visit +5, Landing Page Visit +10, Ebook Download +25, Podcast Completion +20, Webinar Registration +40, Demo Request +80, Pricing Page Visit +50, Email Open +5, Email Click +15, Purchase +100) (FR-027, acceptance scenario 4)
- [ ] T033 [US2] Administrator point-value customization applying to subsequent events only, not retroactively, wired to T019 (FR-028, acceptance scenario 3)
- [ ] T034 [P] [US2] Score display and point-table admin configuration UI
- [ ] T035 [US2] Integration test: sequential behaviors sum correctly, band crossing reclassifies the lead, a customized point value applies going forward, a purchase updates the score within the performance target — all 4 acceptance scenarios in `backend/tests/integration/us2-lead-scoring.integration.test.ts`

**Checkpoint**: The mechanism that makes "prioritize high-value opportunities" operational is independently functional.

---

## Phase 5: User Story 3 — Negative Scoring Applies When a Lead's Quality Degrades (P1)

**Independent Test**: Take a lead with a known score, trigger a single negative-scoring event, and confirm the score decreases by exactly the configured amount immediately.

- [ ] T036 [US3] Negative point table (Email Bounce -40, Unsubscribe -50, Spam Complaint -100, Inactive 90 Days -60, Invalid Contact -80, Duplicate Lead -30), wired to T005, in `backend/src/modules/lead-scoring/negative-scoring.service.ts` (FR-029, acceptance scenarios 1, 2)
- [ ] T037 [US3] Real-time negative-adjustment application, independent of other in-progress scoring activity (FR-030, acceptance scenario 4)
- [ ] T038 [US3] Inactivity-threshold evaluation triggering the Inactive 90 Days penalty (acceptance scenario 3)
- [ ] T039 [P] [US3] Negative-scoring event log UI
- [ ] T040 [US3] Integration test: a bounce reduces the score by the exact amount, a spam complaint reduces and reclassifies, the inactivity penalty applies at the threshold, the duplicate penalty applies without delay — all 4 acceptance scenarios in `backend/tests/integration/us3-negative-scoring.integration.test.ts`

**Checkpoint**: What keeps the 0–1000 score trustworthy as a prioritization signal is independently functional.

---

## Phase 6: User Story 4 — A Lead Is Classified as MQL, SQL, or PQL (P1)

**Independent Test**: Give a lead one of the qualifying example behaviors for each category and confirm the system reflects the corresponding qualification classification on the lead record.

- [ ] T041 [US4] Qualification-factor evaluation (valid email, verified phone, organization size, budget, interest level, purchase intent, geographic eligibility, product fit, engagement history), wired to T006 (FR-016, acceptance scenario 4)
- [ ] T042 [US4] MQL classification (ebook download, webinar registration, multiple email opens, advertisement clicks) (FR-017, acceptance scenario 1)
- [ ] T043 [US4] SQL classification (demo request, pricing request, booked consultation, proposal request) (FR-018, acceptance scenario 2)
- [ ] T044 [US4] PQL classification (free trial usage, freemium usage, product-usage-threshold crossing) (FR-019, acceptance scenario 3)
- [ ] T045 [US4] Automatic qualification evaluation without requiring manual per-lead review in `backend/src/modules/lead-qualification/auto-qualification.service.ts` (FR-020)
- [ ] T046 [P] [US4] Qualification status display UI
- [ ] T047 [US4] Integration test: MQL classification on marketing engagement, SQL classification on sales intent, PQL classification on product experience, a non-qualifying lead receives no classification — all 4 acceptance scenarios in `backend/tests/integration/us4-lead-qualification.integration.test.ts`

**Checkpoint**: The layer that turns a raw score into an actionable sales/marketing decision is independently functional.

---

## Phase 7: User Story 5 — AI Predictive Conversion Score Augments Rule-Based Scoring (P2)

**Independent Test**: Run AI scoring on a lead with a known behavioral history and confirm all four outputs are produced without altering the rule-based score, and confirm the rule-based score/qualification remain fully functional when the AI call is disabled/failed.

- [ ] T048 [US5] AI continuous evaluation (buying intent, engagement trends, historical conversions, customer similarity, revenue potential, churn probability, preferred products, communication preferences) consuming `008`'s gateway, wired to T013, in `backend/src/modules/lead-ai-scoring/ai-evaluation.service.ts` (FR-031)
- [ ] T049 [US5] AI Predictive Conversion Score, Revenue Prediction, Purchase Probability, and Recommended Next Action generation, displayed alongside — never merged into — the rule-based score (FR-032–FR-035, acceptance scenario 1)
- [ ] T050 [US5] AI-service-failure fallback preserving rule-based score/band correctness, wired to T022's contract test (acceptance scenario 2)
- [ ] T051 [US5] High-churn-probability surfaced as a human-review recommendation without auto-changing status, band, or qualification (acceptance scenario 3)
- [ ] T052 [US5] Batch AI-scoring-update refresh within the performance target (acceptance scenario 4)
- [ ] T053 [P] [US5] AI Score Insight display UI
- [ ] T054 [US5] Integration test: four AI outputs displayed alongside not merged, AI failure does not affect the rule-based score, churn recommendation surfaced not auto-applied, batch refresh within target — all 4 acceptance scenarios in `backend/tests/integration/us5-ai-predictive-scoring.integration.test.ts`

**Checkpoint**: The advisory intelligence layer directly implementing Article II is independently functional.

---

## Phase 8: User Story 6 — Automated Lead Assignment by Round-Robin, Territory, or AI (P2)

**Independent Test**: Configure Round Robin assignment across a pool of sales users, generate a qualified lead, and confirm it is auto-assigned to the next eligible user with an immediate notification, then repeat with a Territory-Based rule.

- [ ] T055 [US6] Lead Assignment Engine core, wired to T009, in `backend/src/modules/lead-assignment/assignment-engine.service.ts` (FR-021)
- [ ] T056 [US6] Round Robin strategy with immediate notification (FR-022, FR-023, acceptance scenario 1)
- [ ] T057 [US6] Territory-Based strategy (country/state matching) (acceptance scenario 2)
- [ ] T058 [US6] AI Recommendation strategy consuming `008`'s gateway (acceptance scenario 3)
- [ ] T059 [US6] Product-Based, Department-Based, Language-Based, Country-Based, and Manual Assignment strategies with the same immediate-notification guarantee (FR-022, FR-023, acceptance scenario 4)
- [ ] T060 [P] [US6] Assignment rule configuration UI
- [ ] T061 [US6] Integration test: round-robin rotation with immediate notification, territory-based routing, AI-recommendation routing, manual assignment with the same notification guarantee — all 4 acceptance scenarios in `backend/tests/integration/us6-lead-assignment.integration.test.ts`

**Checkpoint**: The hand-off point between marketing intelligence and sales execution is independently functional.

---

## Phase 9: User Story 7 — Duplicate Lead Detection and Resolution (P3)

**Independent Test**: Create two lead submissions sharing the same email address through two different sources, and confirm the system flags them as a duplicate pair, applies the penalty, and offers resolution options.

- [ ] T062 [US7] Duplicate detection matching Email Address, Phone Number, Customer ID, Company Name, and optional Government ID, wired to T012, in `backend/src/modules/lead-duplicate/duplicate-detection.service.ts` (FR-041, acceptance scenario 1)
- [ ] T063 [US7] Administrator resolution options (merge, keep both, delete, manual review) (FR-042, acceptance scenario 2)
- [ ] T064 [US7] Duplicate Lead penalty application on a confirmed match, wired to T036 (FR-043, acceptance scenario 3)
- [ ] T065 [US7] Optional-field-absent detection continuing with remaining criteria (acceptance scenario 4)
- [ ] T066 [P] [US7] Duplicate review admin UI
- [ ] T067 [US7] Integration test: same-email flagged as a probable duplicate, admin resolution options available, confirmed match applies the penalty, missing optional field does not block detection — all 4 acceptance scenarios in `backend/tests/integration/us7-duplicate-detection.integration.test.ts`

**Checkpoint**: The data-quality safeguard eliminating disconnected duplicate records is independently functional.

---

## Phase 10: Status, Segmentation, Timeline, Nurturing & Analytics remainder (supports FR-014–FR-015, FR-037–FR-040, FR-044–FR-047; cross-cutting, no single owning story)

- [ ] T068 Lead status model (New, Contacted, Interested, Qualified, Proposal Sent, Negotiation, Converted, Lost, Duplicate, Disqualified, Archived), wired to T007 (FR-014)
- [ ] T069 Status-change-triggers-workflow-automation, wired to `022` (FR-015)
- [ ] T070 [P] Lead segment catalog (New Leads, Returning Leads, Premium Prospects, Enterprise Customers, Students, Business Owners, High Intent, Low Engagement, Referral Leads, VIP Prospects), wired to T010 (FR-037)
- [ ] T071 Auto-updating segment membership based on behavior (FR-038)
- [ ] T072 Chronological lead-activity timeline (registration, emails, SMS, WhatsApp, website visits, downloads, purchases, support tickets, AI conversations, community activity), wired to T011 (FR-039, FR-040)
- [ ] T073 Automatic nurturing-campaign enrollment for qualified leads (educational emails, webinar invitations, ebook recommendations, product comparisons, success stories, AI follow-ups), wired to `020`/`021` (FR-044)
- [ ] T074 Nurturing-campaign continuation-until-convert/disqualify/manual-removal (FR-045)
- [ ] T075 [P] Lead Analytics Dashboard (total leads, new, qualified, SQLs, converted, lost, average score, sources, funnel, revenue by source, sales performance, lead aging) in `web/src/app/(marketing-admin)/leads/analytics/page.tsx` (FR-046)
- [ ] T076 Drill-down analysis and scheduled exports (FR-047)

**Checkpoint**: The status/segmentation/nurturing/analytics surface rounding out full lead-management operation is independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T077 [P] Integration framework pass (CDP, CRM, Email/SMS/WhatsApp Marketing, Workflow Engine, AI Assistant, Support System, Membership, Referral, Analytics, External APIs) with near-real-time sync (FR-048, FR-049)
- [ ] T078 Security hardening pass (RBAC, encryption at rest/in transit, audit logs, permission policies, IP restrictions, API authentication, sensitive-data masking, retention policies) (FR-050, FR-051)
- [ ] T079 Performance hardening pass toward all 6 numeric targets (lead creation, score calculation, duplicate detection, assignment, dashboard refresh, AI scoring) (FR-052–FR-057)
- [ ] T080 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (score cap/cooldown, score floor, assignment-fallback when no eligible owner, band-oscillation re-trigger, MQL/SQL/PQL mutual-exclusivity, and the `013` 0–100-vs-`024` 0–1000 scoring-scale reconciliation)
- [ ] T081 Final audit: cross-check every FR-001–FR-057 against an implementation or validation task; verify this feature hands off to `013` at Opportunity/Customer and defers CDP/AI/channel/workflow ownership to `019`/`008`/`020`/`021`/`022` rather than duplicating them
- [ ] T082 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `023`'s captured-lead hand-off, `019`/`013`'s sync targets, and `008`'s AI gateway, and produces the lifecycle/profile/entity infrastructure every subsequent phase depends on.
- **P1 stories (US1–US4)**: US1 (lifecycle) is the backbone every other capability attaches to and must ship first; US2 (positive scoring) and US3 (negative scoring) both depend on Foundational's Score Event entity and can build in parallel; US4 (qualification) depends on US2/US3's scoring data being available to evaluate against.
- **P2 stories (US5–US6)**: US5 (AI predictive scoring) depends on US2–US4's rule-based scoring already working (it augments, never replaces); US6 (assignment) depends on US4's qualification classification producing leads ready to route — both can build in parallel.
- **P3 story (US7)** depends on Foundational's capture infrastructure and can build in parallel with US5/US6.
- **Phase 10 (Status/Segmentation/Timeline/Nurturing/Analytics remainder)** depends on Foundational and benefits from US1–US7 producing real lead data; can build in parallel with the P2/P3 stories.
- **Polish (Phase 11)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (lifecycle, entities, capture/profile core) → **STOP and VALIDATE** the three Foundational contract tests (lifecycle-audit-completeness, real-time-score-recalculation, AI-advisory-only) pass → US1 (lifecycle) → **STOP and VALIDATE** a lead can be tracked end to end with full auditability → US2 (positive scoring) + US3 (negative scoring) in parallel → US4 (qualification) → **STOP and VALIDATE** the core scoring/qualification loop is trustworthy → US5 (AI predictive scoring) + US6 (assignment) in parallel → US7 (duplicate detection) → Phase 10 (status/segmentation/timeline/nurturing/analytics) → Polish.
