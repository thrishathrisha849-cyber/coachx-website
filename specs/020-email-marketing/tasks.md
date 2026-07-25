---
description: "Task list for Feature 020 — Email Marketing: Templates, Personalization, Delivery & Analytics"
---

# Tasks: Email Marketing: Templates, Personalization, Delivery & Analytics

**Input**: Design documents from `/specs/020-email-marketing/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `019`'s audience/consent data and `008`'s AI gateway exist as integration points, though it does not require their full feature completion to build its own email engine.

**Tests**: Included throughout — transactional-priority, deliverability-score-mandatory, and suppression-enforcement get dedicated Foundational contract tests, matching this spec's own SC-009, SC-003, and SC-004.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (AI Assistant/Inbox Preview remainder FR-017–FR-018, FR-030–FR-031).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor this feature reuses via `016`), and that `019`'s audience/consent data and `008`'s AI gateway exist
- [ ] T002 Resolve `research.md` open items before proceeding: default/primary email provider for initial launch, merge-tag templating-engine choice, bounce-retry ceiling/soft-to-hard conversion threshold, hard-bounce un-suppression/appeal process, deliverability-check pass/fail send-blocking threshold, mid-campaign spam-complaint-spike auto-pause behavior, unknown-timezone send-time fallback, and A/B test tie-break/insufficient-data rule
- [ ] T003 [P] Add `backend/src/modules/{email-classes,email-template,email-personalization,email-ai-assistant,email-scheduling,email-deliverability,email-ab-testing,email-inbox-preview,email-tracking,email-bounce-suppression,email-compliance}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define `Email Template` and `Content Block` entities in `backend/src/modules/email-template/email-template.entity.ts` (FR-007)
- [ ] T005 [P] Define the `Merge Tag` entity in `backend/src/modules/email-personalization/merge-tag.entity.ts` (FR-013)
- [ ] T006 [P] Define the `Brand Kit` entity in `backend/src/modules/email-template/brand-kit.entity.ts` (FR-011)
- [ ] T007 [P] Define the `Send Job`/`Campaign Send` entity with an email-class field in `backend/src/modules/email-scheduling/send-job.entity.ts`
- [ ] T008 [P] Define the `Deliverability Score` entity in `backend/src/modules/email-deliverability/deliverability-score.entity.ts`
- [ ] T009 [P] Define the `Email Provider Configuration` entity in `backend/src/modules/email-scheduling/provider-configuration.entity.ts` (FR-023)
- [ ] T010 [P] Define the `Bounce Record` entity in `backend/src/modules/email-bounce-suppression/bounce-record.entity.ts` (FR-036)
- [ ] T011 [P] Define the `Suppression List Entry` entity in `backend/src/modules/email-bounce-suppression/suppression-entry.entity.ts` (FR-041)
- [ ] T012 [P] Define the `Unsubscribe`/`Preference Record` entity in `backend/src/modules/email-bounce-suppression/unsubscribe-record.entity.ts` (FR-039)
- [ ] T013 [P] Define the `A/B Test` entity in `backend/src/modules/email-ab-testing/ab-test.entity.ts` (FR-027)
- [ ] T014 [P] Define the `Email Event`/`Tracking Record` entity in `backend/src/modules/email-tracking/email-event.entity.ts` (FR-032)
- [ ] T015 [P] Define the `Analytics Report` entity in `backend/src/modules/email-tracking/analytics-report.entity.ts` (FR-034)
- [ ] T016 Implement the pluggable email-provider adapter layer (Amazon SES, SendGrid, Mailgun, Postmark, SMTP Relay, Microsoft Exchange, Gmail SMTP, Custom SMTP) in `backend/src/modules/email-scheduling/provider-adapter.service.ts` (FR-023, FR-024)
- [ ] T017 Implement the delivery engine core (queue management, batch processing, parallel sending, rate limiting, retry mechanism, failover SMTP, priority queues, delivery throttling) in `backend/src/modules/email-scheduling/delivery-engine.service.ts` (FR-021)
- [ ] T018 Implement asynchronous large-campaign processing in `backend/src/modules/email-scheduling/async-batch-processor.service.ts` (FR-022)
- [ ] T019 Note: RBAC reuses `016`'s model directly for template approval/publish, campaign send, and SMTP-credential visibility (Constitution Article VII)
- [ ] T020 Note: consent state is read and re-checked from `013`/`019` before every send — this feature does not originate consent data (Constitution Article VI)
- [ ] T021 Contract test: transactional emails dispatch ahead of concurrently queued Marketing/Lifecycle batches 100% of the time, in `backend/tests/contract/email-transactional-priority.contract.test.ts` (FR-003, SC-009)
- [ ] T022 Contract test: every Marketing/Lifecycle campaign receives a deliverability score before leaving the send queue, in `backend/tests/contract/email-deliverability-score-mandatory.contract.test.ts` (FR-026, SC-003)
- [ ] T023 Contract test: zero sends reach an address already on the suppression list (hard bounce, spam complaint, manual/regulatory exclusion, global unsubscribe), in `backend/tests/contract/email-suppression-enforcement.contract.test.ts` (FR-042, SC-004)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Building a Branded Template With Dynamic Content Blocks (P1) 🎯 MVP

**Independent Test**: Create a new template, confirm the organization's brand assets are applied automatically, add a dynamic content block with a membership-based condition, and preview it rendering different content for a "Premium" vs. "Free" test profile.

- [ ] T024 [US1] Template management (Name, Category, Description, Version, Owner, Language, Status, Created/Updated Date), wired to T004, in `backend/src/modules/email-template/template-management.service.ts` (FR-007)
- [ ] T025 [US1] Template status lifecycle (Draft → Review → Approved → Published → Archived) (FR-008, acceptance scenario 4)
- [ ] T026 [US1] Visual email builder (drag-and-drop, HTML, Markdown editing; responsive/mobile/desktop/dark-mode preview) in `web/src/app/(marketing-admin)/email/templates/[templateId]/builder/page.tsx` (FR-009, acceptance scenario 2)
- [ ] T027 [US1] Template component library (Text, Headings, Images, Videos, Buttons, Dividers, Social icons, Product cards, Countdown timers, Tables, Dynamic content blocks, Custom HTML) (FR-010)
- [ ] T028 [US1] Brand Kit configuration (logo, brand colors, typography, footer, social links, contact information, default signature, header design), wired to T006 (FR-011)
- [ ] T029 [US1] Automatic brand-asset application to new templates (FR-012, acceptance scenario 1)
- [ ] T030 [US1] Merge-tag personalization with fallback values, wired to T005 (FR-013, FR-014)
- [ ] T031 [US1] Dynamic content block conditions (membership, purchase history, language, location, device, customer score, segment), wired to `019` (FR-015, FR-016, acceptance scenario 3)
- [ ] T032 [P] [US1] Visual email builder UI polish
- [ ] T033 [US1] Integration test: brand assets auto-applied, cross-mode preview consistency, dynamic-block premium-vs-free rendering, Draft-to-Published lifecycle — all 4 acceptance scenarios in `backend/tests/integration/us1-template-builder.integration.test.ts`

**Checkpoint**: The foundational content-creation capability every other email feature operates on top of is independently functional.

---

## Phase 4: User Story 2 — Sending the Correct Email Class With the Correct Priority (P1)

**Independent Test**: Queue a bulk marketing campaign and, immediately after, trigger a transactional email for a single recipient, then confirm the transactional email is processed and delivered ahead of the marketing campaign's remaining batch.

- [ ] T034 [US2] 4-class taxonomy (Transactional, Marketing, Lifecycle, Trigger-Based), wired to T007 (FR-001)
- [ ] T035 [US2] Transactional email type catalog (Welcome, Account Verification, OTP, Password Reset, Purchase Confirmation, Invoice, Payment Receipt, Subscription Confirmation) plus highest-priority classification, wired to T021's contract test (FR-002, FR-003, acceptance scenario 1)
- [ ] T036 [US2] Marketing email type catalog (Product Launch, Offers, Discounts, Festival Campaigns, Newsletters, Educational Content, Community Updates, Membership Promotions) (FR-004)
- [ ] T037 [US2] Lifecycle email type catalog (Welcome Journey, Onboarding Series, Inactivity Reminder, Membership Renewal, Birthday Greetings, Anniversary Messages, Referral Invitation, Upsell Campaign) plus sequence-timing scheduling (FR-005, acceptance scenario 3)
- [ ] T038 [US2] Trigger-Based email type catalog (Course Completed, Ebook Downloaded, Podcast Finished, Event Registered, Referral Successful, Cart Abandoned, Payment Failed) plus behavioral-event binding (FR-006, acceptance scenario 4)
- [ ] T039 [P] [US2] Email-class indicator UI
- [ ] T040 [US2] Integration test: purchase confirmation enters highest-priority queue, transactional delivered ahead of marketing batch, welcome journey classified Lifecycle, cart abandoned classified Trigger-Based — all 4 acceptance scenarios in `backend/tests/integration/us2-email-class-priority.integration.test.ts`

**Checkpoint**: Business-critical account/payment communications are protected from delay behind bulk marketing sends.

---

## Phase 5: User Story 3 — Deliverability Score Surfaces Risk Before a Campaign Sends (P1)

**Independent Test**: Compose a campaign with a known issue (e.g., a broken unsubscribe link) and confirm the system's automatic pre-send validation flags it and produces a deliverability score, versus a clean campaign receiving a passing score.

- [ ] T041 [US3] Full pre-send validation suite (SPF, DKIM, DMARC, sender reputation, domain authentication, broken links, spam keywords, image-to-text ratio, unsubscribe-link presence, tracking configuration), wired to T008/T022, in `backend/src/modules/email-deliverability/prepublish-validation.service.ts` (FR-025, acceptance scenario 1)
- [ ] T042 [US3] Broken/missing unsubscribe-link specific-failure surfacing (acceptance scenario 2)
- [ ] T043 [US3] Domain-authentication-failure specific-failure surfacing (acceptance scenario 3)
- [ ] T044 [US3] Clean-campaign passing-score confirmation (acceptance scenario 4)
- [ ] T045 [P] [US3] Deliverability score review UI
- [ ] T046 [US3] Integration test: full check suite produces a score, unsubscribe-link failure surfaced, domain-auth failure surfaced, clean campaign passes — all 4 acceptance scenarios in `backend/tests/integration/us3-deliverability-score.integration.test.ts`

**Checkpoint**: The mandatory quality gate protecting inbox placement for every future campaign is independently functional.

---

## Phase 6: User Story 4 — Bounce Handling Automatically Protects Sender Reputation (P1)

**Independent Test**: Send to a list containing a known soft-bounce address and a known hard-bounce address, and confirm the soft bounce is automatically scheduled for retry while the hard bounce is immediately suppressed and excluded from the next campaign.

- [ ] T047 [US4] Bounce classification (Soft vs. Hard), wired to T010, in `backend/src/modules/email-bounce-suppression/bounce-classification.service.ts` (FR-036)
- [ ] T048 [US4] Soft-bounce automatic retry scheduling (FR-037, acceptance scenario 1)
- [ ] T049 [US4] Hard-bounce automatic suppression-list addition, wired to T011/T023 (FR-038, acceptance scenario 2)
- [ ] T050 [US4] Suppressed-address automatic exclusion from subsequent sends to the same list (acceptance scenario 3)
- [ ] T051 [US4] Bounce-type analytics reflection (Bounced metric, Bounce Rate widget) (acceptance scenario 4)
- [ ] T052 [P] [US4] Bounce management admin UI
- [ ] T053 [US4] Integration test: soft bounce scheduled for retry, hard bounce immediately suppressed, suppressed address excluded from new send, both bounce types reflected in analytics — all 4 acceptance scenarios in `backend/tests/integration/us4-bounce-handling.integration.test.ts`

**Checkpoint**: The core, non-optional delivery-engine behavior protecting sender reputation is independently functional.

---

## Phase 7: User Story 5 — Recipient Unsubscribes and the Change Takes Effect Immediately (P1)

**Independent Test**: Unsubscribe a test recipient (all-emails or single-category), trigger a new send targeting that recipient and confirm they are excluded, and confirm the unsubscribe action is timestamped and retrievable as a compliance record.

- [ ] T054 [US5] Unsubscribe-from-all-emails action with immediate effect plus compliance recording, wired to T012 (FR-039, FR-040, acceptance scenario 1)
- [ ] T055 [US5] Unsubscribe-by-category action (FR-039, acceptance scenario 2)
- [ ] T056 [US5] Temporary-pause action (FR-039, acceptance scenario 3)
- [ ] T057 [US5] In-flight/queued-send suppression on a just-recorded unsubscribe, wired to T023 (acceptance scenario 4)
- [ ] T058 [US5] Suppression-list-source catalog (hard bounce, spam complaint, manual exclusion, regulatory exclusion, global unsubscribe), wired to T011 (FR-041)
- [ ] T059 [P] [US5] Unsubscribe/preference-center UI
- [ ] T060 [US5] Integration test: unsubscribe-all immediate and recorded, category unsubscribe scoped correctly, temporary pause withholds without a full cycle, in-flight send honors a just-recorded unsubscribe — all 4 acceptance scenarios in `backend/tests/integration/us5-unsubscribe-preference.integration.test.ts`

**Checkpoint**: The regulatory-compliant, Article-VI-aligned consent-withdrawal mechanism is independently functional.

---

## Phase 8: User Story 6 — A/B Test Automatically Rolls Out the Winning Variant (P2)

**Independent Test**: Configure an A/B test with a small test audience percentage and short duration, let both variants send to the test slice, confirm the winning-metric leader is determined, and confirm the winning variant is automatically sent to the remaining audience.

- [ ] T061 [US6] A/B test configuration (subject line, sender name, CTA button, email layout, images, send time, content length; test-audience-percentage, winning-metric, test-duration), wired to T013, in `backend/src/modules/email-ab-testing/ab-test-config.service.ts` (FR-027, FR-028, acceptance scenario 1)
- [ ] T062 [US6] Winner determination at test-window close (acceptance scenario 2)
- [ ] T063 [US6] Automatic winning-variant continuation to the remaining audience, wired to T017 (FR-029, acceptance scenario 3)
- [ ] T064 [US6] Per-variant results display alongside standard delivery/open/click metrics (acceptance scenario 4)
- [ ] T065 [P] [US6] A/B test configuration and results UI
- [ ] T066 [US6] Integration test: test split and metric tracking, winner determined at duration elapse, automatic continuation to remaining audience, per-variant results viewable — all 4 acceptance scenarios in `backend/tests/integration/us6-ab-testing.integration.test.ts`

**Checkpoint**: The optimization layer improving open/click performance across future campaigns is independently functional.

---

## Phase 9: User Story 7 — Reviewing Near-Real-Time Campaign Analytics (P2)

**Independent Test**: Send a test campaign, wait for tracked events to register, and confirm the dashboard's widgets update within the expected refresh window and that filter/comparison/drill-down/export controls function.

- [ ] T067 [US7] Per-email event tracking (Sent, Delivered, Deferred, Opened, Clicked, Unsubscribed, Bounced, Complained, Converted, Revenue Generated), wired to T014 (FR-032, acceptance scenario 1)
- [ ] T068 [US7] Near-real-time metric update pipeline in `backend/src/modules/email-tracking/realtime-metrics.service.ts` (FR-033)
- [ ] T069 [US7] Analytics dashboard widgets (Delivery Rate, Open Rate, CTR, CTOR, Bounce Rate, Spam Complaint Rate, Conversion Rate, Revenue Attribution, Geographic Distribution, Device Breakdown), wired to T015 and `027`/`028` (FR-034, acceptance scenario 2)
- [ ] T070 [US7] Filter, comparison, scheduled export, and drill-down analysis (FR-035, acceptance scenarios 3, 4)
- [ ] T071 [P] [US7] Analytics dashboard UI in `web/src/app/(marketing-admin)/email/analytics/page.tsx`
- [ ] T072 [US7] Integration test: events update the dashboard near real time, filter/comparison scopes the widgets, scheduled export delivered, drill-down shows underlying detail — all 4 acceptance scenarios in `backend/tests/integration/us7-email-analytics.integration.test.ts`

**Checkpoint**: The reporting layer turning individual sends into an optimizable program is independently functional.

---

## Phase 10: AI Assistant & Inbox Preview remainder (supports FR-017–FR-018, FR-030–FR-031; cross-cutting, no single owning story)

- [ ] T073 AI Email Assistant (subject line, body, CTA recommendations, grammar improvements, tone adjustment, content summarization, personalization suggestions, spam-score reduction, translation, A/B test suggestions) consuming `008`'s gateway in `backend/src/modules/email-ai-assistant/ai-email-assistant.service.ts` (FR-017)
- [ ] T074 Human-review/approval gate for AI-assisted content before a campaign using it is sent, canonical ownership deferred to `025`, in `backend/src/modules/email-ai-assistant/human-review-gate.service.ts` (FR-018, Constitution Article II)
- [ ] T075 [P] Inbox rendering previews (Gmail, Outlook, Apple Mail, Yahoo Mail, mobile, tablet, dark mode) in `backend/src/modules/email-inbox-preview/inbox-preview.service.ts` (FR-030)
- [ ] T076 Rendering-inconsistency highlighting before a template/campaign is published (FR-031)

**Checkpoint**: The AI-assisted content creation and cross-client rendering assurance layers are independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T077 [P] Compliance pass (GDPR, CAN-SPAM, CASL, PECR; consent records, easy unsubscribe, privacy policy links, data retention controls, audit trails) (FR-043, FR-044)
- [ ] T078 Security hardening pass (RBAC, secure SMTP credential storage, TLS encryption, encrypted API communication, audit logging, rate limiting, domain verification, sender authentication) (FR-045)
- [ ] T079 Performance hardening pass toward all 6 numeric targets (template load, preview, personalization processing, queue creation, dashboard refresh, analytics update) (FR-046)
- [ ] T080 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (default provider, merge-tag templating engine, bounce-retry ceiling, un-suppression path, deliverability blocking threshold, spam-spike auto-pause, unknown-timezone fallback, A/B tie-break rule)
- [ ] T081 Final audit: cross-check every FR-001–FR-046 against an implementation or validation task; verify this feature defers consent/RBAC/AI-approval/attribution ownership to `013`/`019`/`016`/`025`/`027`/`028` rather than duplicating them
- [ ] T082 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `019`'s audience/consent data, `016`'s RBAC, and `008`'s AI gateway, and produces the delivery-engine/entity infrastructure every subsequent phase depends on.
- **P1 stories (US1–US5)**: US1 (template builder) is the foundational content-creation capability and should ship first; US2 (email class priority), US3 (deliverability score), US4 (bounce handling), and US5 (unsubscribe) all depend on Foundational's delivery engine and can build in parallel with each other once US1 produces a sendable template.
- **P2 stories (US6–US7)**: US6 (A/B testing) and US7 (analytics) both depend on US1–US5's send/track pipeline already working; they are optimization/reporting layers and can build in parallel with each other.
- **Phase 10 (AI Assistant/Inbox Preview remainder)** depends on Foundational's template entity and `008`'s AI gateway; can build in parallel with US6–US7.
- **Polish (Phase 11)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (delivery engine, entities, provider adapters) → **STOP and VALIDATE** the three Foundational contract tests (transactional-priority, deliverability-score-mandatory, suppression-enforcement) pass → US1 (template builder) → **STOP and VALIDATE** a branded, dynamic-content template can be built and previewed end to end → US2 (email class priority) + US3 (deliverability score) + US4 (bounce handling) + US5 (unsubscribe) in parallel → **STOP and VALIDATE** the send/protect/comply loop is trustworthy → US6 (A/B testing) + US7 (analytics) in parallel → Phase 10 (AI assistant/inbox preview) → Polish.
