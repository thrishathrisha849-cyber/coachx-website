---
description: "Task list for Feature 021 — SMS, WhatsApp & Push Notification Marketing"
---

# Tasks: SMS, WhatsApp & Push Notification Marketing

**Input**: Design documents from `/specs/021-sms-whatsapp-push-marketing/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `019`'s audience data, `016`'s RBAC, and `008`'s AI gateway exist as integration points, though it does not require their full feature completion to build its own channel engine.

**Tests**: Included throughout — provider-failover-no-duplicate-delivery, consent-suppression, and WhatsApp-template-approval-gate get dedicated Foundational contract tests, matching this spec's own SC-007, SC-008, and FR-009.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (Delivery Status/Analytics/Scheduling remainder FR-023–FR-024, FR-035–FR-037).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor this feature reuses via `016`), and that `019`'s audience data and `008`'s AI gateway exist
- [ ] T002 Resolve `research.md` open items before proceeding: WhatsApp free-form-vs-template session-window/category-eligibility policy enforcement rules, retry-count/backoff-schedule/per-provider rate-limit thresholds for the delivery engine, and the performance-target measurement-percentile methodology
- [ ] T003 [P] Add `backend/src/modules/{messaging-router,messaging-sms,messaging-whatsapp,messaging-push,messaging-personalization,messaging-ai-assistant,messaging-scheduling,messaging-delivery-engine,messaging-providers,messaging-analytics,messaging-compliance}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Message` entity in `backend/src/modules/messaging-router/message.entity.ts` (Key Entities)
- [ ] T005 [P] Define the `Channel` entity in `backend/src/modules/messaging-router/channel.entity.ts`
- [ ] T006 [P] Define the `WhatsApp Template` entity in `backend/src/modules/messaging-whatsapp/whatsapp-template.entity.ts`
- [ ] T007 [P] Define the `Push Token` entity in `backend/src/modules/messaging-push/push-token.entity.ts`
- [ ] T008 [P] Define the `Deep Link` entity in `backend/src/modules/messaging-push/deep-link.entity.ts`
- [ ] T009 [P] Define the `Provider Route` entity in `backend/src/modules/messaging-providers/provider-route.entity.ts`
- [ ] T010 [P] Define the `Communication Preference`/`Consent Record` entity in `backend/src/modules/messaging-compliance/communication-preference.entity.ts`
- [ ] T011 [P] Define the `Delivery Status Event` entity in `backend/src/modules/messaging-analytics/delivery-status-event.entity.ts`
- [ ] T012 [P] Define the `Personalization Token` entity in `backend/src/modules/messaging-personalization/personalization-token.entity.ts`
- [ ] T013 Implement the Communication Router core (provider/retry-strategy/priority determination per channel), wired to T005/T009, in `backend/src/modules/messaging-router/communication-router.service.ts` (FR-001)
- [ ] T014 Implement the campaign pipeline (Audience Selection → Personalization Engine → Communication Router → channel-specific delivery → Analytics & Delivery Tracking) in `backend/src/modules/messaging-router/campaign-pipeline.service.ts` (FR-002)
- [ ] T015 Implement omnichannel campaign support (a single campaign targeting SMS, WhatsApp, and Push together) (FR-003)
- [ ] T016 Implement the per-channel provider-adapter layer (SMS: Twilio/MSG91/Textlocal/Vonage/AWS SNS/custom; WhatsApp: Meta WhatsApp Business Platform/Twilio WhatsApp/Gupshup/Infobip/360dialog; Push: FCM/APNs/OneSignal/Web Push API), wired to T009, in `backend/src/modules/messaging-providers/provider-adapter.service.ts` (FR-031–FR-033)
- [ ] T017 Implement global-vs-per-campaign provider-selection configuration (FR-034)
- [ ] T018 Implement the cross-channel personalization engine (Name, Membership, Purchase History, Preferred Language, Location, Community Interests, Learning Progress, Referral Status, Rewards, Customer Score), wired to T012 and `019`, in `backend/src/modules/messaging-personalization/personalization-engine.service.ts` (FR-020)
- [ ] T019 Implement the push notification component model (Title, Subtitle, Body, Image, Icon, Deep Link, Category, Priority, Expiry, Action Buttons) plus rich media (Images, GIFs, Videos, Audio, Product Cards, Dynamic Banners) in `backend/src/modules/messaging-push/push-notification.entity.ts` (FR-015, FR-016)
- [ ] T020 Implement push delivery to Android, iOS, Web Push, and Desktop Notification targets in `backend/src/modules/messaging-push/push-delivery.service.ts` (FR-014)
- [ ] T021 Note: RBAC for all messaging-platform actions reuses `016`'s model directly (Constitution Article VII)
- [ ] T022 Contract test: provider failover completes with zero manual intervention and zero duplicate messages delivered to any recipient, even when a delayed delivery-confirmation callback arrives after retry re-evaluation, in `backend/tests/contract/messaging-provider-failover-no-duplicate.contract.test.ts` (FR-026, FR-027, SC-007)
- [ ] T023 Contract test: every automated send re-checks the recipient's current per-channel consent immediately before dispatch, with a withdrawn channel receiving zero further sends from any in-flight campaign or journey, in `backend/tests/contract/messaging-consent-suppression.contract.test.ts` (FR-039, SC-008)
- [ ] T024 Contract test: an unapproved WhatsApp template can never be used in a live send, in `backend/tests/contract/messaging-whatsapp-template-approval-gate.contract.test.ts` (FR-009)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Send a Campaign Through the Communication Router With Provider Failover (P1) 🎯 MVP

**Independent Test**: Configure two providers for one channel, force the primary to fail, and confirm the campaign message is still delivered via the secondary provider exactly once, with the failover event visible in delivery status/analytics.

- [ ] T025 [US1] Primary-provider dispatch plus Sent-status recording, wired to T013 (acceptance scenario 1)
- [ ] T026 [US1] Automatic secondary-provider failover on primary failure/timeout, wired to T022, in `backend/src/modules/messaging-router/failover.service.ts` (FR-026, acceptance scenario 2)
- [ ] T027 [US1] Duplicate-delivery prevention on a delayed delivery-confirmation callback during failover re-evaluation (FR-027, acceptance scenario 3)
- [ ] T028 [US1] Per-channel independent provider/retry/priority determination for a multi-channel campaign (acceptance scenario 4)
- [ ] T029 [US1] Intelligent queue management across all 3 channels in `backend/src/modules/messaging-delivery-engine/queue-management.service.ts` (FR-025)
- [ ] T030 [US1] Batch processing plus parallel delivery (FR-028)
- [ ] T031 [US1] Priority handling (OTP dispatched ahead of promotional) (FR-029)
- [ ] T032 [US1] Rate limiting and delivery throttling within provider limits (FR-030)
- [ ] T033 [P] [US1] Router/failover admin monitoring UI in `web/src/app/(marketing-admin)/messaging/providers/page.tsx`
- [ ] T034 [US1] Integration test: primary-provider success, automatic secondary failover, no duplicate on delayed callback, independent per-channel routing — all 4 acceptance scenarios in `backend/tests/integration/us1-communication-router.integration.test.ts`

**Checkpoint**: The foundational reliability guarantee every SMS/WhatsApp/Push send depends on is independently functional.

---

## Phase 4: User Story 2 — Enforce Per-Channel Consent and Opt-Out Before Every Send (P1)

**Independent Test**: Opt a test recipient out of one channel mid-campaign, while a multi-step automated journey targeting them is already in flight, and confirm no further message is sent on that channel while sends on other opted-in channels continue.

- [ ] T035 [US2] Per-channel preference management (Promotional SMS, Transactional SMS, WhatsApp, Push) plus Quiet Hours/Preferred Language/Preferred Time Window, wired to T010, in `backend/src/modules/messaging-compliance/preference-management.service.ts` (FR-038)
- [ ] T036 [US2] Promotional-opt-out send suppression plus reason recording, wired to T023 (acceptance scenario 1)
- [ ] T037 [US2] In-flight-journey immediate preference-update honoring (acceptance scenario 2)
- [ ] T038 [US2] Quiet Hours/Preferred Time Window respect (acceptance scenario 3)
- [ ] T039 [US2] Independent transactional-vs-promotional consent tracking — OTP still delivered on a promotional-only opt-out (acceptance scenario 4)
- [ ] T040 [US2] Consent management plus per-channel opt-out handling (FR-041)
- [ ] T041 [P] [US2] Communication preference center UI in `web/src/app/(member)/settings/notifications/page.tsx`
- [ ] T042 [US2] Integration test: promotional opt-out suppressed with reason, in-flight journey honors updated preference, quiet hours respected, transactional independent of promotional opt-out — all 4 acceptance scenarios in `backend/tests/integration/us2-consent-opt-out.integration.test.ts`

**Checkpoint**: The legal/compliance gate protecting the platform from regulatory exposure is independently functional.

---

## Phase 5: User Story 3 — Create and Approve a WhatsApp Message Template (P2)

**Independent Test**: Create a template, categorize it, submit it for approval, and confirm the system blocks its use in a campaign until an "approved" status is reached, then allows send once approved.

- [ ] T043 [US3] Template creation, wired to T006, in `backend/src/modules/messaging-whatsapp/template-creation.service.ts` (FR-008)
- [ ] T044 [US3] Template categorization (Authentication, Utility, Marketing) (FR-012)
- [ ] T045 [US3] Provider-approval submission plus pending-approval-state blocking, wired to T024 (FR-009, acceptance scenario 1)
- [ ] T046 [US3] Approved-template campaign-selection enablement (acceptance scenario 2)
- [ ] T047 [US3] Approved-template editing subject to re-approval (FR-010, acceptance scenario 3)
- [ ] T048 [US3] Template archiving, removing it from new-campaign selection (FR-011, acceptance scenario 4)
- [ ] T049 [P] [US3] WhatsApp template management UI in `web/src/app/(marketing-admin)/messaging/whatsapp-templates/page.tsx`
- [ ] T050 [US3] Integration test: submission enters pending and is not usable, approved template is selectable, edit supports re-approval, archived template is not selectable — all 4 acceptance scenarios in `backend/tests/integration/us3-whatsapp-template-approval.integration.test.ts`

**Checkpoint**: The hard upstream dependency for every WhatsApp marketing/utility use case is independently functional.

---

## Phase 6: User Story 4 — Send an Interactive WhatsApp Message With Carousel and Quick Replies (P2)

**Independent Test**: Compose a WhatsApp message with a carousel of product cards plus quick-reply buttons, send it to a test recipient, and confirm the interactive elements render and the quick-reply tap is captured as an inbound response/click event.

- [ ] T051 [US4] WhatsApp message-type support (Text, Image, Video, PDF, Audio, Interactive Buttons, Quick Replies, Carousel Cards, Product Catalog Messages, Location Sharing, Contact Cards), wired to T006 (FR-007, acceptance scenario 1)
- [ ] T052 [US4] Quick-reply tap capture as an inbound response/click event, wired to T011 (FR-013, acceptance scenario 2)
- [ ] T053 [US4] CTA button actions (Visit Website, Call Business) (acceptance scenario 3)
- [ ] T054 [US4] Location Sharing and Contact Card native rendering (acceptance scenario 4)
- [ ] T055 [P] [US4] Interactive WhatsApp campaign builder UI
- [ ] T056 [US4] Integration test: carousel intact on delivery, quick-reply tap recorded as Clicked, CTA button triggers external action, location/contact native rendering — all 4 acceptance scenarios in `backend/tests/integration/us4-interactive-whatsapp.integration.test.ts`

**Checkpoint**: The flagship differentiator driving the WhatsApp channel's highest engagement is independently functional.

---

## Phase 7: User Story 5 — Deep Link Into the App From a Push Notification Regardless of App State (P2)

**Independent Test**: Send a push notification with a deep link to a specific destination under three conditions — app in foreground, backgrounded, force-closed — and confirm all three result in navigation to that exact destination.

- [ ] T057 [US5] Deep-link destination catalog (Community Post, Podcast Episode, Ebook Reader, Course Lesson, Event Details, Marketplace Product, Membership Page, Referral Program, AI Assistant, Wallet, Notification Center), wired to T008 (FR-017)
- [ ] T058 [US5] Foreground-app deep-link navigation (acceptance scenario 1)
- [ ] T059 [US5] Backgrounded-app deep-link resume-and-navigate (acceptance scenario 2)
- [ ] T060 [US5] Closed-app deep-link launch-and-navigate (FR-018, acceptance scenario 3)
- [ ] T061 [US5] Sub-1-second deep-link resolution (FR-019, acceptance scenario 4)
- [ ] T062 [US5] Deleted/unpublished-destination safe-fallback handling (edge case)
- [ ] T063 [P] [US5] Mobile deep-link resolution implementation in `mobile/lib/features/messaging/deep_link_resolver.dart`
- [ ] T064 [US5] Integration test: foreground navigation, backgrounded resume-and-navigate, closed launch-and-navigate, sub-1s resolution — all 4 acceptance scenarios in `backend/tests/integration/us5-deep-linking.integration.test.ts`

**Checkpoint**: What converts a push notification tap into an actual engagement outcome is independently functional.

---

## Phase 8: User Story 6 — Send Transactional SMS With Personalization and Guaranteed-Attribute Fallback (P3)

**Independent Test**: Send a personalized SMS to a recipient missing one of the referenced attributes and confirm the message renders with the configured fallback value instead of an empty or literal token string.

- [ ] T065 [US6] SMS campaign-type catalog (Promotional, Transactional, OTP, Reminder, Event Notification, Membership Alert), wired to T004 (FR-004)
- [ ] T066 [US6] SMS Builder (Campaign Name, Sender ID, Audience, Message Content, Personalization Tokens, Schedule, Expiry Time, Priority) in `web/src/app/(marketing-admin)/messaging/sms/create/page.tsx` (FR-005)
- [ ] T067 [US6] SMS personalization-token resolution plus fallback substitution, wired to T012/T018 (FR-006, acceptance scenarios 1, 2)
- [ ] T068 [US6] SMS queue creation within the 3-second target (acceptance scenario 3)
- [ ] T069 [P] [US6] SMS campaign builder UI polish
- [ ] T070 [US6] Integration test: token replacement with actual values, missing-attribute fallback substitution, OTP queue creation within 3s — all 3 acceptance scenarios in `backend/tests/integration/us6-sms-personalization.integration.test.ts`

**Checkpoint**: Time-sensitive transactional SMS quality/completeness is independently functional.

---

## Phase 9: User Story 7 — Use the AI Messaging Assistant to Draft and Optimize a Campaign Message (P3)

**Independent Test**: Request an AI-generated draft for a given campaign brief and channel, confirm the suggestion is presented to the marketer as an editable draft requiring explicit approval before the campaign can be scheduled.

- [ ] T071 [US7] AI Messaging Assistant (message generation, tone optimization, character-limit optimization, emoji recommendations, CTA suggestions, personalization improvements, translation, spam-risk reduction, best-send-time prediction) consuming `008`'s gateway, in `backend/src/modules/messaging-ai-assistant/ai-messaging-assistant.service.ts` (FR-021, acceptance scenario 1)
- [ ] T072 [US7] Character-limit-constrained draft optimization for SMS (acceptance scenario 2)
- [ ] T073 [US7] Editable-draft-requiring-approval gate before scheduling, wired to the Article II discipline established in T024, in `backend/src/modules/messaging-ai-assistant/human-approval-gate.service.ts` (FR-022, acceptance scenario 1)
- [ ] T074 [US7] Best-send-time recommendation with accept/override/ignore options (acceptance scenario 3)
- [ ] T075 [P] [US7] AI Messaging Assistant UI
- [ ] T076 [US7] Integration test: draft presented and not auto-sent, SMS optimized within character limit, send-time recommendation overridable — all 3 acceptance scenarios in `backend/tests/integration/us7-ai-messaging-assistant.integration.test.ts`

**Checkpoint**: The productivity enhancement accelerating campaign-content creation is independently functional.

---

## Phase 10: Delivery Status, Analytics & Scheduling remainder (supports FR-023–FR-024, FR-035–FR-037; cross-cutting, no single owning story)

- [ ] T077 Scheduling modes (Immediate, Scheduled, Recurring, Event-driven, Workflow-triggered, Time-zone-optimized) in `backend/src/modules/messaging-scheduling/scheduling-modes.service.ts` (FR-023)
- [ ] T078 Event-driven/workflow-triggered automated send examples (welcome message, event reminder, renewal reminder, new-podcast push), wired to `022` (FR-024)
- [ ] T079 Delivery-status tracking (Queued, Sent, Delivered, Read, Clicked, Failed, Expired, Rejected, Unsubscribed), wired to T011 (FR-035)
- [ ] T080 Near-real-time delivery-status synchronization within the 30-second target (FR-036)
- [ ] T081 [P] Analytics dashboard (Total Messages Sent, Delivery Rate, Read Rate, Click Rate, Conversion Rate, Revenue Attribution, Response Rate, Failure Rate, Average Delivery Time, Device Distribution, Geographic Reach) with date filters, channel/campaign comparisons, and CSV/PDF export, in `web/src/app/(marketing-admin)/messaging/analytics/page.tsx` (FR-037)

**Checkpoint**: The delivery-visibility and reporting layer across all three channels is independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T082 [P] Compliance pass (GDPR, CAN-SPAM, WhatsApp Business Policies, telecom regulations; consent management, audit logs, data retention policies, regulatory reporting) (FR-040, FR-042–FR-044)
- [ ] T083 Security hardening pass (RBAC, API authentication, end-to-end transport encryption, secure provider-credential storage, message signing/fraud detection, rate limiting, no plain-text sensitive content) (FR-045–FR-050)
- [ ] T084 Performance hardening pass toward all 6 numeric targets (push dispatch, SMS/WhatsApp queue creation, delivery-status update, analytics refresh, deep-link resolution) (FR-051)
- [ ] T085 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (WhatsApp session-window policy enforcement, retry/backoff/rate-limit thresholds, performance-target measurement percentile)
- [ ] T086 Final audit: cross-check every FR-001–FR-051 against an implementation or validation task; verify this feature defers audience/automation/orchestration ownership to `019`/`022`/`032` rather than duplicating them
- [ ] T087 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `019`'s audience data, `016`'s RBAC, and `008`'s AI gateway, and produces the Communication Router/provider/entity infrastructure every subsequent phase depends on.
- **P1 stories (US1–US2)**: US1 (Communication Router/failover) is the foundational reliability guarantee and must ship first; US2 (consent/opt-out) is a legal/compliance gate that must ship alongside the very first send capability and can build in parallel with US1 once Foundational's consent entity exists.
- **P2 stories (US3–US5)**: US3 (WhatsApp template approval) is a hard upstream dependency for US4 (interactive WhatsApp) and must precede it; US5 (deep linking) depends only on Foundational's push infrastructure and can build in parallel with US3/US4.
- **P3 stories (US6–US7)**: US6 (transactional SMS personalization) and US7 (AI Messaging Assistant) are both refinements/completeness items on top of the core send mechanics (US1–US2) and can build in parallel with each other.
- **Phase 10 (Delivery Status/Analytics/Scheduling remainder)** depends on Foundational's Delivery Status Event entity and benefits from US1–US7 producing real send data; can build in parallel with the P2/P3 stories.
- **Polish (Phase 11)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (Communication Router, provider adapters, consent/preference entity) → **STOP and VALIDATE** the three Foundational contract tests (failover-no-duplicate, consent-suppression, WhatsApp-template-approval-gate) pass → US1 (Communication Router/failover) → US2 (consent/opt-out) in parallel → **STOP and VALIDATE** the reliable, compliant send loop works end to end → US3 (WhatsApp template approval) → US4 (interactive WhatsApp, extends US3) → US5 (deep linking) in parallel with US3/US4 → US6 (transactional SMS) + US7 (AI Messaging Assistant) in parallel → Phase 10 (delivery status/analytics/scheduling) → Polish.
