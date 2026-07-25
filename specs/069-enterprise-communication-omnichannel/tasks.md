---
description: "Task list for Feature 069 — Enterprise Communication & Omnichannel Engagement"
---

# Tasks: Enterprise Communication & Omnichannel Engagement (Employee/Partner/Customer)

**Input**: Design documents from `/specs/069-enterprise-communication-omnichannel/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis correcting spec.md's own claim about `021`'s SMS/WhatsApp/Push provider layer — consistent with the precedent already established correcting `064`'s identical overreach — and confirming closure of `061`'s forward-declared Team Collaboration dependency), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC). This feature also assumes `021`'s Provider Route, `063`'s Workflow engine, and `008`'s AI gateway (directly or via `066`) exist as coordination/consumption points.

**Tests**: Included throughout — the unified cross-channel-history gate, the consent-withdrawal-blocks-send gate, and the AI-recommendation human-approval gate each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-007, and SC-008.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single story (Video/Live Streaming, Live Chat, Omnichannel Engagement, Communication Analytics, Security & Governance).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC), and that `021`'s Provider Route, `063`'s Workflow engine, and `008`'s AI gateway (directly or via `066`) exist as coordination/consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: WhatsApp session-window duration confirmed against the actual WhatsApp Business API policy in force at build time (explicitly self-flagged); Notification-Preference-vs-"always deliver" override resolution/disclosure rule (explicitly self-flagged); channel-routing conflict when consent differs per channel for the same trigger; IVR misroute/dead-end fallback behavior; duplicate-inbound-message-across-channels merge/dedup behavior; AI Voice Assistant low-confidence escalation threshold; broadcast-list consent-drift re-check timing; call-recording jurisdiction/consent-disclosure requirement
- [ ] T003 [P] Add `backend/src/modules/enterprise-communication/{platform-foundation,unified-inbox-outbox,whatsapp-business-api,voip-ivr,ai-voice-assistant,notification-center,team-collaboration,campaign-communication,ai-communication-intelligence,video-livechat-omnichannel-analytics-security}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Conversation` entity in `backend/src/modules/enterprise-communication/unified-inbox-outbox/conversation.entity.ts`
- [ ] T005 [P] Define the `Unified Inbox Item` entity in `backend/src/modules/enterprise-communication/unified-inbox-outbox/unified-inbox-item.entity.ts`
- [ ] T006 [P] Define the `Contact Directory Entry` entity in `backend/src/modules/enterprise-communication/unified-inbox-outbox/contact-directory-entry.entity.ts`
- [ ] T007 [P] Define the `WhatsApp Session` entity in `backend/src/modules/enterprise-communication/whatsapp-business-api/whatsapp-session.entity.ts`
- [ ] T008 [P] Define the `WhatsApp Broadcast List` entity in `backend/src/modules/enterprise-communication/whatsapp-business-api/whatsapp-broadcast-list.entity.ts`
- [ ] T009 [P] Define the `Voice Call Record` entity in `backend/src/modules/enterprise-communication/voip-ivr/voice-call-record.entity.ts`
- [ ] T010 [P] Define the `IVR Menu / Routing Rule` entity in `backend/src/modules/enterprise-communication/voip-ivr/ivr-menu-routing-rule.entity.ts`
- [ ] T011 [P] Define the `AI Voice Assistant Interaction` entity in `backend/src/modules/enterprise-communication/ai-voice-assistant/ai-voice-assistant-interaction.entity.ts`
- [ ] T012 [P] Define the `Notification` entity in `backend/src/modules/enterprise-communication/notification-center/notification.entity.ts`
- [ ] T013 [P] Define the `Notification Preference` entity in `backend/src/modules/enterprise-communication/notification-center/notification-preference.entity.ts`
- [ ] T014 [P] Define the `Campaign Communication Record` entity in `backend/src/modules/enterprise-communication/campaign-communication/campaign-communication-record.entity.ts`
- [ ] T015 [P] Define the `AI Communication Recommendation` entity in `backend/src/modules/enterprise-communication/ai-communication-intelligence/ai-communication-recommendation.entity.ts`
- [ ] T016 [P] Define the `Team Channel` entity in `backend/src/modules/enterprise-communication/team-collaboration/team-channel.entity.ts`
- [ ] T017 [P] Define the `Communication Consent Record` entity (canonical, per plan.md §2) in `backend/src/modules/enterprise-communication/notification-center/communication-consent-record.entity.ts`
- [ ] T018 Enterprise-scale transactional/marketing email (templates, rich HTML, attachments, scheduled/bulk sending, dynamic personalization, tracking pixels, delivery monitoring) (FR-011)
- [ ] T019 SMS messaging capability description (OTP, transaction alerts, promotional, bulk, scheduled, delivery reports, templates, localization, URL tracking, analytics) — provider connectivity consumed from `021`, per T021's note (FR-012)
- [ ] T020 Push notifications across mobile/web/desktop (silent, rich, deep linking, scheduled, geo-based, event-based, priority) — provider connectivity consumed from `021`, per T021's note (FR-013)
- [ ] T021 Note: this feature's Unified Inbox/Outbox is the conversation-merging layer above `021`'s already-canonical SMS/WhatsApp/Push Provider Route (14 providers, failover-capable) — consumes delivery/read-receipt events from `021` rather than reimplementing provider connectivity, the same direction as the correction already applied to `064` (per plan.md §1)
- [ ] T022 Note: this feature's Communication Consent Record and Notification Preference are the canonical, platform-wide model; `021`'s existing "Communication Preference/Consent Record" entity is the marketing-specific consumer of the same canonical record going forward (per plan.md §2)
- [ ] T023 Note: this feature's Team Channels/presence/screen-sharing are the confirmed substrate `061`'s project-scoped collaboration consumes, closing `061/plan.md` §7's forward-declared item (per plan.md §3)
- [ ] T024 Note: `052`'s and `060`'s customer engagement strategy/CX/CRM business logic render and deliver through this feature's Unified Inbox/Live Chat/Omnichannel channels rather than independent messaging infrastructure (per plan.md §4)
- [ ] T025 Note: WhatsApp AI-chat workflow automation and trigger-based campaign delivery configure `063`'s Event-Driven Automation/Business Rules Engine, consistent with the established platform pattern (per plan.md §5)
- [ ] T026 Note: AI Chat Integration/AI Voice Assistant/AI Communication Assistant reuse `008`'s `ai-gateway`/`ai-guardrails`, directly or transitively via `066` (per plan.md §6)
- [ ] T027 Note: RBAC configures `001`'s/`016`'s existing layered engine, coordinating with `067`'s Identity/IAM layer for communication-specific roles (per plan.md §7)
- [ ] T028 Contract test: an employee can locate the full cross-channel history with any given contact in a single Unified Inbox view without switching tools, for 100% of contacts with multi-channel history, in `backend/tests/contract/unified-inbox-100pct-cross-channel-history-single-view.contract.test.ts` (SC-001)
- [ ] T029 Contract test: zero automated sends occur to a contact after that contact's consent for the relevant channel has been withdrawn, verified by consent re-check logs at send time, in `backend/tests/contract/zero-automated-send-after-consent-withdrawal.contract.test.ts` (SC-007)
- [ ] T030 Contract test: 100% of AI recommendations require recorded human approval before a consequential action is applied, in `backend/tests/contract/ai-communication-recommendation-100pct-human-approval-before-consequential-action.contract.test.ts` (SC-008)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Unified Inbox conversation timeline across channels (Priority: P1) 🎯 MVP

**Independent Test**: Send messages to the same contact across at least three channels and confirm the Unified Inbox renders them in a single merged, correctly time-ordered conversation timeline with searchable history.

- [ ] T031 [US1] Single communication hub unifying 12 channel types (email, SMS, push, WhatsApp, in-app, voice, video, live chat, team messaging, community messaging, broadcast, AI conversations), wired to T004 (FR-001)
- [ ] T032 [US1] Unified Inbox and Unified Outbox for all supported channels, wired to acceptance scenario 2 (FR-002)
- [ ] T033 [US1] Merged Conversation Timeline per contact spanning all channels, wired to T005, acceptance scenario 1 (FR-003)
- [ ] T034 [US1] Contact Directory and per-contact Message History, wired to T006 (FR-004)
- [ ] T035 [US1] Smart Search across conversations and message history, wired to acceptance scenario 3 (FR-005)
- [ ] T036 [US1] Labels and Priority Messages for conversation organization, wired to acceptance scenario 3 (FR-006)
- [ ] T037 [US1] Message Scheduling for outbound communication (FR-007)
- [ ] T038 [US1] Read Receipts and Delivery Status per message where supported, wired to T028's contract test, acceptance scenario 4 (FR-008)
- [ ] T039 [US1] Conversation Analytics (FR-009)
- [ ] T040 [US1] Support for 10 participant types (employees, customers, students, community members, partners, vendors, administrators, AI assistants, chatbots, external users) (FR-010)
- [ ] T041 [P] [US1] Unified Inbox UI
- [ ] T042 [US1] Integration test: a contact's email/SMS/WhatsApp threads merge into one chronological conversation timeline, a new inbound message on any channel appears in the Unified Inbox with a dispatchable outbound reply, a labeled/prioritized conversation persists and is retrievable via Smart Search, a read message reflects accurate read-receipt/delivery status — all 4 acceptance scenarios in `backend/tests/integration/us1-unified-inbox.integration.test.ts`

**Checkpoint**: The foundational capability every other channel plugs into is independently functional.

---

## Phase 4: User Story 2 — WhatsApp Business API automated replies and interactive buttons (Priority: P1)

**Independent Test**: Configure a WhatsApp Business API automated reply flow with at least one interactive button, send an inbound message that triggers it, and confirm the correct automated reply, button interaction capture, delivery tracking, and read receipt are recorded.

- [ ] T043 [US2] WhatsApp Business API as a supported enterprise communication channel, wired to T007 (FR-014)
- [ ] T044 [US2] Automated replies and interactive buttons within WhatsApp conversations, wired to T025's `063`-workflow note, acceptance scenarios 1–2 (FR-015)
- [ ] T045 [US2] Media and document sharing over WhatsApp (FR-016)
- [ ] T046 [US2] WhatsApp broadcast lists, wired to T008, acceptance scenario 3 (FR-017)
- [ ] T047 [US2] AI chat integration with workflow automation of replies, wired to T026's `008`-reuse note (FR-018)
- [ ] T048 [US2] WhatsApp delivery status and read receipts per message, wired to acceptance scenario 3 (FR-019)
- [ ] T049 [P] [US2] WhatsApp Business Console UI
- [ ] T050 [US2] Integration test: an inbound message matching a configured trigger sends the correct automated reply with optional interactive buttons, an interactive-button tap routes the conversation per the configured workflow, a broadcast to opted-in contacts records delivery tracking/read receipts per recipient, a free-form send attempt after the session window flags the constraint before send — all 4 acceptance scenarios in `backend/tests/integration/us2-whatsapp-automated-replies.integration.test.ts`

**Checkpoint**: The dominant channel for the Tamil-first customer base, with automation value from day one, is independently functional.

---

## Phase 5: User Story 3 — VoIP call with IVR routing (Priority: P2)

**Independent Test**: Place an inbound call into the IVR, select a routing option, and confirm the call reaches the correctly routed queue/agent with a call record captured in Call Analytics.

- [ ] T051 [US3] VoIP calling with call recording, wired to T009 (FR-020)
- [ ] T052 [US3] IVR for inbound call handling, wired to T010, acceptance scenario 1 (FR-021)
- [ ] T053 [US3] Call routing (skill-based, department, queue-based, priority, language, geographic, availability-based), wired to acceptance scenario 1 (FR-022)
- [ ] T054 [US3] Call queues holding calls awaiting an available agent, wired to acceptance scenario 2 (FR-023)
- [ ] T055 [US3] Conference calls with multiple participants, wired to acceptance scenario 4 (FR-024)
- [ ] T056 [US3] Voice notes and caller identification (FR-025)
- [ ] T057 [US3] Call analytics, wired to acceptance scenario 3 (FR-026)
- [ ] T058 [P] [US3] IVR & Call Console UI
- [ ] T059 [US3] Integration test: an IVR menu interaction routes the call per the configured strategy, a busy-agent queue holds the caller with expected-wait handling, a completed call's recording/caller-ID/duration/routing-path are stored and retrievable, a conference call keeps all parties connected and reflected in the call record — all 4 acceptance scenarios in `backend/tests/integration/us3-voip-ivr-routing.integration.test.ts`

**Checkpoint**: The voice channel infrastructure required before AI Voice Assistant or any voice-based support workflow can function is independently functional.

---

## Phase 6: User Story 4 — AI Voice Assistant handling a routine voice request (Priority: P2)

**Independent Test**: Place a call handled entirely by the AI Voice Assistant for a routine, low-risk inquiry and confirm correct intent detection/resolution, then separately test an escalation trigger that hands the call to a human agent through the existing call-routing path.

- [ ] T060 [US4] AI Voice Assistant capable of handling voice-channel requests with detection/resolution and escalation-to-human-routing/queue-context-preservation, wired to T011, acceptance scenarios 1–4 (FR-027)
- [ ] T061 [P] [US4] AI Voice Assistant Interaction Review UI
- [ ] T062 [US4] Integration test: a routine well-understood request is intent-detected and resolved or next-stepped directly, an unconfident/human-requested escalation hands off through standard call routing with context preserved, a completed interaction produces a call record and conversation summary in Call Analytics, an AI-service-unavailable scenario falls back to standard IVR/queue routing rather than dropping the call — all 4 acceptance scenarios in `backend/tests/integration/us4-ai-voice-assistant.integration.test.ts`

**Checkpoint**: The AI-assistive voice layer that must never be the sole path to resolution is independently functional.

---

## Phase 7: User Story 5 — Notification Center cross-channel preference management (Priority: P2)

**Independent Test**: A user sets quiet hours and a preferred channel, triggers a notification during quiet hours, and confirms it is deferred/rerouted per preference, plus confirms the Notification Dashboard accurately displays unread/read/scheduled/failed counts.

- [ ] T063 [US5] Centralized Notification Center across 10 notification types (system, security, workflow, assignment, community, learning, payment, support, marketing, executive), wired to T012 (FR-038)
- [ ] T064 [US5] Configurable preferences (preferred channels, quiet hours, notification categories, language, delivery priority, frequency, device/email/SMS/push preferences), wired to T013, T022's canonical-consent note, acceptance scenarios 1–2, 4 (FR-039)
- [ ] T065 [US5] Notification Dashboard (unread, read, scheduled messages, failed deliveries, delivery status, user preferences, notification history, engagement metrics, delivery trends, channel performance), wired to acceptance scenario 3 (FR-040)
- [ ] T066 [P] [US5] Notification Center UI
- [ ] T067 [US5] Integration test: a non-urgent notification during quiet hours is deferred/rerouted per the user's fallback preference, a disabled Notification Category suppresses only that type while others deliver, a failed scheduled delivery is visible under Failed Deliveries with status, an updated device preference is honored for subsequent notifications — all 4 acceptance scenarios in `backend/tests/integration/us5-notification-center.integration.test.ts`

**Checkpoint**: The mechanism operationalizing the platform-wide per-channel, versioned consent principle for this chapter is independently functional.

---

## Phase 8: User Story 6 — Employee team collaboration and enterprise messaging (Priority: P3)

**Independent Test**: Create a Team Channel, post an announcement with a shared document, and confirm presence status and team directory entries update correctly and are visible to channel members only.

- [ ] T068 [US6] Team/Department/Project Channels (announcements, task sharing, document sharing, meeting notes, team calendar, shared bookmarks, team knowledge base), wired to T016, T023's `061`-confirmation note, acceptance scenario 1 (FR-033)
- [ ] T069 [US6] Collaboration tools (presence status, activity feed, shared workspaces, team directories, file collaboration, voice notes, whiteboards, screen sharing, meeting rooms, team analytics), wired to acceptance scenarios 2–3 (FR-034)
- [ ] T070 [P] [US6] Team Collaboration Workspace UI
- [ ] T071 [US6] Integration test: a posted announcement with an attached document is visible to all Department Channel members, a started screen share is viewable in real time by another workspace participant, a set presence status displays correctly in the Team Directory — all 3 acceptance scenarios in `backend/tests/integration/us6-team-collaboration.integration.test.ts`

**Checkpoint**: The internal, enterprise-facing collaboration capability distinct from customer engagement is independently functional.

---

## Phase 9: User Story 7 — Marketing-linked campaign communication delivery (Priority: P3)

**Independent Test**: Submit a campaign through the Approval workflow, schedule it for delivery across two channels, and confirm Campaign Reports and the Campaign Dashboard show accurate delivery, open/click, and ROI figures.

- [ ] T072 [US7] 10 campaign types (email, SMS, WhatsApp, push, in-app, event, product launch, promotion, community, customer success), wired to T014 (FR-041)
- [ ] T073 [US7] Campaign capabilities (audience segmentation, personalization, A/B testing, scheduling, automation, trigger-based campaigns, approval workflow, templates, calendar, reports), wired to acceptance scenario 2 (FR-042)
- [ ] T074 [US7] Campaign workflow (Audience Selection→Design→Approval→Scheduling→Delivery→Tracking→Optimization) requiring approval before delivery, wired to T025's `063`-workflow note, acceptance scenarios 1, 3 (FR-043)
- [ ] T075 [P] [US7] Campaign Dashboard UI
- [ ] T076 [US7] Integration test: an approved campaign's scheduled delivery dispatches across configured channels through shared send infrastructure, a delivered campaign's dashboard shows delivery/open/click/response rate and ROI, a met trigger-based condition sends the corresponding message automatically without manual re-approval — all 3 acceptance scenarios in `backend/tests/integration/us7-campaign-communication-delivery.integration.test.ts`

**Checkpoint**: The send/delivery/tracking substrate for the dedicated marketing-automation features is independently functional.

---

## Phase 10: User Story 8 — AI-powered communication intelligence query (Priority: P3)

**Independent Test**: Ask the AI Communication Assistant a supported question against a populated dataset of message/campaign history and confirm the response includes a recommendation, supporting analytics, and a confidence score.

- [ ] T077 [US8] AI capabilities (smart message generation, tone optimization, translation, auto summarization, smart reply suggestions, spam detection, sentiment analysis, customer intent detection, delivery time optimization, audience recommendations, AI chat assistants, conversation intelligence), wired to T026's `008`-reuse note (FR-047)
- [ ] T078 [US8] AI Communication Assistant natural-language Q&A, wired to acceptance scenarios 1–2 (FR-048)
- [ ] T079 [US8] AI recommendation full field set (Recommendation, Supporting Analytics, Confidence Score, Business Impact, Customer Impact, Suggested Action, Responsible Team, Expected Improvement, Estimated ROI), wired to T015, T030's contract test, acceptance scenario 3 (FR-049)
- [ ] T080 [P] [US8] AI Communication Assistant UI
- [ ] T081 [US8] Integration test: a "highest engagement channel" query returns a channel-ranked answer with supporting analytics, an "escalation-needed conversations" query returns a rationale-backed list, a displayed recommendation shows all 9 required fields and requires human review before any consequential change — all 3 acceptance scenarios in `backend/tests/integration/us8-ai-communication-intelligence.integration.test.ts`

**Checkpoint**: The optimization layer built on top of the analytics and channel data produced by the rest of the chapter is independently functional.

---

## Phase 11: Video/Live Streaming, Live Chat, Omnichannel Engagement, Communication Analytics, Security & Governance (supports FR-028–FR-032, FR-035–FR-037, FR-044–FR-046, FR-050–FR-056; cross-cutting, no single owning story)

- [ ] T082 One-to-one and group video meetings (screen sharing, recording, breakout rooms, virtual backgrounds) (FR-028)
- [ ] T083 Live streaming and webinar-format video sessions with meeting scheduling/analytics (FR-029)
- [ ] T084 Real-time live chat (AI chatbot handling with human handover, typing indicators, read receipts, file sharing, emoji, reactions, conversation history) (FR-030)
- [ ] T085 Messaging capabilities (one-to-one, group chat, community chat, threaded conversations, editing, deletion, @mentions, pinned messages, polls, shared files) (FR-031)
- [ ] T086 Chat routing (skill-based, department, queue-based, priority, AI, language, geographic, availability-based) (FR-032)
- [ ] T087 Consistent customer engagement across 10 channels (email, SMS, push, WhatsApp, social media, live chat, community, voice, video, mobile) (FR-035)
- [ ] T088 Customer journey tracking (Awareness→Interest→Lead→Customer→Engagement→Retention→Loyalty→Advocacy) (FR-036)
- [ ] T089 Engagement features (personalized messages, segmentation, event-based messaging, loyalty campaigns, feedback collection, surveys, preference capture, engagement scoring, retention campaigns) (FR-037)
- [ ] T090 Communication KPIs (messages sent, delivery/open/click/response/bounce/unsubscribe rate, engagement score, customer satisfaction, campaign ROI) (FR-044)
- [ ] T091 10 channel-specific dashboards (Communication, Email, SMS, Push, WhatsApp, Campaign, Executive, Customer Engagement, Delivery, Collaboration) (FR-045)
- [ ] T092 10 report types (delivery, engagement, campaign, channel performance, user activity, team collaboration, customer response, communication trends, cost analysis, executive summary) (FR-046)
- [ ] T093 RBAC across all communication channels and admin functions, wired to T027's `001`/`016`/`067` note (FR-050)
- [ ] T094 End-to-end encryption and data encryption for communications (FR-051)
- [ ] T095 Message retention policies and audit logging (FR-052)
- [ ] T096 Digital signatures and compliance monitoring (FR-053)
- [ ] T097 Spam protection and abuse detection (FR-054)
- [ ] T098 High availability and disaster recovery for the communication platform (FR-055)
- [ ] T099 Integration with Enterprise AI Platform (`066`), Enterprise Data Platform (`065`), iPaaS (`064`), Cybersecurity Platform (`067`), Cloud Infrastructure Platform (`068`), HRMS, CRM, Finance, Procurement, Inventory, Workflow Automation (`063`), Project Management (`061`), DMS (`062`), LMS (`004`), Community Platform, Customer Support, Mobile/Web Applications, API Gateway (FR-056)
- [ ] T100 [P] Video/Live Chat/Omnichannel/Analytics/Security UI

---

## Phase 12: Polish — Final Validation

- [ ] T101 Resolve and document the 2 self-flagged NEEDS CLARIFICATION items plus 9 from Edge Cases not already closed by `research.md`
- [ ] T102 Final audit: cross-check every FR-001–FR-056 against an implementation or validation task; re-verify the `021`, `061`, `052`/`060`, `063`, `008`/`066`, `001`/`016`/`067` reuse/boundary decisions are respected
- [ ] T103 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `021`'s Provider Route, `063`'s Workflow engine, and `008`'s AI gateway (directly or via `066`), and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2)**: US1 (Unified Inbox) is the foundational capability every other channel plugs into and must land first; US2 (WhatsApp) depends on US1's conversation-merging infrastructure existing to surface WhatsApp messages within.
- **P2 stories (US3, US4, US5)**: US3 (VoIP/IVR) is independent voice infrastructure that can be built in parallel with US1/US2; US4 (AI Voice Assistant) depends on US3's call-routing/queue infrastructure already existing; US5 (Notification Center) depends on US1/US2's multi-channel senders already existing to route preferences against.
- **P3 stories (US6, US7, US8)**: US6 (Team Collaboration) is independent internal-facing infrastructure; US7 (Campaign Communication) depends on US1/US2's send substrate already existing; US8 (AI Communication Intelligence) depends on US1–US3 and Communication Analytics already producing underlying data. All three can be built in parallel once their respective dependencies are met.
- **Phase 11 (Video/Live Chat/Omnichannel/Analytics/Security)** depends on Foundational and US1; can land alongside US3–US8.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (unified-inbox-100pct-cross-channel-history-single-view, zero-automated-send-after-consent-withdrawal, ai-communication-recommendation-100pct-human-approval-before-consequential-action) pass → US1 (Unified Inbox) → US2 (WhatsApp) → **STOP and VALIDATE** the "single communication hub" premise holds → US3 (VoIP/IVR) + US4 (AI Voice Assistant) + US5 (Notification Center) + Phase 11 (Video/Live Chat/Omnichannel/Analytics/Security) → US6 (Team Collaboration) + US7 (Campaign Communication) + US8 (AI Communication Intelligence) → Polish.
