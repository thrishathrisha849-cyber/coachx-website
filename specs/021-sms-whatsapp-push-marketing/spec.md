# Feature Specification: SMS, WhatsApp & Push Notification Marketing

**Feature Branch**: `021-sms-whatsapp-push-marketing`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "SMS, WhatsApp & Push Notification Marketing System — Volume 14 (Enterprise Marketing Platform), Part 1 (Marketing Foundation), Chapter 8. Source: `document 1/Document 1 (20).md`. Defines the unified, multi-channel messaging architecture that complements the Email Marketing System (Chapter 7 / feature 020) by providing high-engagement, mobile-first communication across SMS, WhatsApp, and Push Notifications: a centralized Communication Router, per-channel campaign builders, WhatsApp interactive/template management, push deep linking into the app, cross-channel personalization, an AI messaging assistant, scheduling/automation, a provider-abstracted delivery engine with failover, delivery-status analytics, per-channel communication preferences/opt-out, and compliance/security controls."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Send a Campaign Through the Communication Router With Provider Failover (Priority: P1)

A marketing operator launches a campaign (e.g., a membership renewal reminder) targeting a segmented audience. The platform's centralized Communication Router selects the configured provider for the channel, dispatches the message, and — if the primary provider is unavailable or rejects the send — automatically fails over to a secondary configured provider without operator intervention or duplicate delivery to the recipient.

**Why this priority**: This is the foundational reliability guarantee of the entire chapter (Section 4 "Unified Messaging Architecture" and Section 12 "Delivery Engine"). Every other capability in this spec — SMS, WhatsApp, Push — is dispatched through this router. Without router-managed failover, a single provider outage stops all outbound marketing communication platform-wide.

**Independent Test**: Can be fully tested by configuring two providers for one channel, forcing the primary to fail (simulated outage/4xx/5xx), and confirming the campaign message is still delivered via the secondary provider exactly once, with the failover event visible in delivery status/analytics.

**Acceptance Scenarios**:

1. **Given** a campaign is queued for send on a channel with a primary and secondary provider configured, **When** the primary provider is reachable and accepts the message, **Then** the message is dispatched via the primary provider and its status is recorded as Sent.
2. **Given** a campaign is queued for send and the primary provider returns a failure or times out, **When** the Communication Router detects the failure, **Then** the system automatically retries via the secondary configured provider and does not require manual operator action.
3. **Given** a message has already been successfully delivered by the primary provider but the delivery-confirmation callback was delayed, **When** the retry/failover logic re-evaluates the message, **Then** the system MUST NOT send a duplicate message to the same recipient.
4. **Given** a campaign spans SMS, WhatsApp, and Push channels simultaneously, **When** the campaign is dispatched, **Then** the router determines the appropriate provider, retry strategy, and delivery priority independently for each channel.

---

### User Story 2 - Enforce Per-Channel Consent and Opt-Out Before Every Send (Priority: P1)

A recipient has opted out of Promotional SMS but remains opted in to Transactional SMS and WhatsApp. When any campaign or automated journey attempts to message this recipient, the system checks the recipient's current, channel-specific preference immediately before dispatch — not just at campaign-audience-build time — and suppresses sends to channels the recipient has opted out of, while still allowing sends on channels they remain opted in to.

**Why this priority**: This is a legal/compliance gate (Section 16 "Communication Preferences," Section 17 "Compliance") and a cross-cutting platform principle (consent is per-channel, versioned, and re-checked before every send). A violation here creates regulatory exposure (GDPR, telecom regulations, WhatsApp Business Policies) and must ship alongside the very first send capability, not be deferred.

**Independent Test**: Can be fully tested by opting a test recipient out of one channel mid-campaign (while a multi-step automated journey targeting them is already in flight) and confirming no further message is sent on that channel, while sends on other still-opted-in channels continue.

**Acceptance Scenarios**:

1. **Given** a recipient has opted out of Promotional SMS, **When** a promotional SMS campaign attempts to send to them, **Then** the system suppresses the send and records the suppression reason.
2. **Given** a recipient updates their communication preferences (e.g., disables WhatsApp Messages), **When** an in-flight automated journey next attempts to message them on WhatsApp, **Then** the updated preference is honored immediately, with no further WhatsApp sends from that journey.
3. **Given** a recipient has set Quiet Hours or a Preferred Time Window, **When** a campaign would otherwise send during that window, **Then** the system respects the recipient's preferred time window.
4. **Given** a recipient opts out of Promotional SMS only, **When** a transactional OTP SMS is triggered for them, **Then** the OTP message is still delivered, since transactional and promotional consent are tracked independently.

---

### User Story 3 - Create and Approve a WhatsApp Message Template (Priority: P2)

A marketer drafts a new WhatsApp message template, assigns it to a category (Authentication, Utility, or Marketing), and submits it for provider approval. The system tracks the template through its approval lifecycle and only allows the template to be used in a live send once it has been approved; once approved, the marketer may still edit or archive the template following the same governance path.

**Why this priority**: WhatsApp campaigns cannot be sent at all without an approved template for many message categories — this is a hard upstream dependency for User Story 4 (interactive WhatsApp sends) and for any WhatsApp marketing/utility use case. It is P2 rather than P1 because SMS and Push campaigns (User Stories 1-2) can ship and deliver value independently of WhatsApp template approval.

**Independent Test**: Can be fully tested by creating a template, categorizing it, submitting it for approval, and confirming the system blocks its use in a campaign until an "approved" status is reached, then allows send once approved.

**Acceptance Scenarios**:

1. **Given** a marketer creates a new WhatsApp template, **When** they categorize it as Marketing and submit it for provider approval, **Then** the template enters a pending-approval state and is not usable in a live campaign send.
2. **Given** a template has been approved by the provider, **When** a marketer selects it for a campaign, **Then** the system allows it to be used for sending.
3. **Given** an approved template needs a wording change, **When** the marketer edits it, **Then** the system supports editing the approved template (subject to re-approval as required by the provider's policy).
4. **Given** a template is no longer needed, **When** a marketer archives it, **Then** the archived template is no longer selectable for new campaigns.

---

### User Story 4 - Send an Interactive WhatsApp Message With Carousel and Quick Replies (Priority: P2)

A marketer builds a WhatsApp campaign using rich, interactive content — a carousel of product cards, quick-reply buttons, and a call-to-action button (e.g., "Visit Website" or "View Product") — and sends it to a segmented audience. Recipients can tap quick replies or catalog items directly within WhatsApp to continue the interaction.

**Why this priority**: This is the flagship differentiator of the WhatsApp channel (Section 6 "Supported Message Types" and "Interactive Features") and drives the highest engagement of the three channels, but it depends on User Story 3 (an approved template/category) and the core router (User Story 1), so it is sequenced after both.

**Independent Test**: Can be fully tested by composing a WhatsApp message with a carousel of product cards plus quick-reply buttons, sending it to a test recipient, and confirming the interactive elements render and the quick-reply tap is captured as an inbound response/click event.

**Acceptance Scenarios**:

1. **Given** a marketer composes a WhatsApp campaign with Product Catalog Messages and Carousel Cards, **When** the campaign is sent, **Then** the recipient receives the message with the interactive carousel intact.
2. **Given** a WhatsApp message includes Quick Reply buttons, **When** the recipient taps a quick reply, **Then** the interaction is recorded and reflected in delivery/engagement tracking (Clicked status).
3. **Given** a WhatsApp message includes a "Visit Website" or "Call Business" call-to-action button, **When** the recipient taps it, **Then** the appropriate external action (open URL / initiate call) occurs.
4. **Given** a WhatsApp message includes Location Sharing or a Contact Card, **When** the message is sent, **Then** the recipient receives the location/contact content in a WhatsApp-native rendering.

---

### User Story 5 - Deep Link Into the App From a Push Notification Regardless of App State (Priority: P2)

A user receives a push notification (e.g., "New podcast episode available"). Whether the TBT app is running in the foreground, running in the background, or fully closed, tapping the notification opens the app and navigates directly to the linked destination (the specific podcast episode) rather than a generic app home screen.

**Why this priority**: Deep linking is what converts a push notification tap into an actual engagement outcome (Section 8 "Deep Linking"). Without it, push notifications only reopen the app generically, which materially weakens the channel's value — but push notifications can technically be sent and delivered (User Story 1 mechanics) before this refinement is layered on, so it is P2.

**Independent Test**: Can be fully tested by sending a push notification with a deep link to a specific destination (e.g., a course lesson) under three conditions — app in foreground, app backgrounded, app force-closed — and confirming all three result in navigation to that exact destination.

**Acceptance Scenarios**:

1. **Given** the TBT app is running in the foreground, **When** a user taps a push notification containing a deep link to a Course Lesson, **Then** the app navigates directly to that lesson.
2. **Given** the TBT app is backgrounded, **When** a user taps a push notification containing a deep link to an Event Details page, **Then** the app resumes and navigates directly to that event.
3. **Given** the TBT app is fully closed, **When** a user taps a push notification containing a deep link to a Marketplace Product, **Then** the app launches and navigates directly to that product, not to a generic home screen.
4. **Given** a deep link is tapped, **When** the app resolves the destination, **Then** resolution completes within the platform's 1-second target (Section 19 Performance Requirements).

---

### User Story 6 - Send Transactional SMS With Personalization and Guaranteed-Attribute Fallback (Priority: P3)

The system sends a time-sensitive transactional SMS (e.g., OTP verification, payment confirmation) using the SMS Builder, personalizing it with recipient attributes such as `{{first_name}}` and `{{renewal_date}}`. When a personalization attribute is missing for a given recipient (e.g., no `{{course_name}}` because they are not enrolled in any course), the system substitutes a defined fallback value rather than sending a broken or blank message.

**Why this priority**: Transactional SMS (OTP, payment confirmation) is operationally important but is largely a refinement of the core send/personalization mechanics already exercised by User Stories 1 and 2; it is prioritized P3 as a completeness/quality item rather than a net-new capability.

**Independent Test**: Can be fully tested by sending a personalized SMS to a recipient missing one of the referenced attributes and confirming the message renders with the configured fallback value instead of an empty or literal `{{token}}` string.

**Acceptance Scenarios**:

1. **Given** a recipient has a `first_name` and `renewal_date` on file, **When** a membership-renewal SMS is generated from the template, **Then** both tokens are replaced with the recipient's actual values.
2. **Given** a recipient has no `course_name` attribute (not enrolled in any course), **When** an SMS template referencing `{{course_name}}` is sent to them, **Then** the system substitutes the configured fallback value instead of leaving the token unresolved.
3. **Given** an OTP SMS campaign type is used, **When** it is queued for send, **Then** SMS queue creation completes within the 3-second performance target (Section 19).

---

### User Story 7 - Use the AI Messaging Assistant to Draft and Optimize a Campaign Message (Priority: P3)

A marketer drafting an SMS or WhatsApp campaign invokes the AI Messaging Assistant to generate a first-draft message, optimize its tone, fit it within the channel's character limit, suggest emojis and a CTA, and predict the best send time. The marketer reviews and edits the AI's suggestions before the campaign is scheduled or sent — the AI never sends on its own authority.

**Why this priority**: This is a productivity enhancement (Section 10 "AI Messaging Assistant") layered on top of the core campaign-authoring flow already covered by other stories; it accelerates content creation but is not required for the channel to function, so it is P3.

**Independent Test**: Can be fully tested by requesting an AI-generated draft for a given campaign brief and channel, confirming the suggestion (message text, emoji, CTA, best-send-time) is presented to the marketer as an editable draft requiring explicit approval before the campaign can be scheduled.

**Acceptance Scenarios**:

1. **Given** a marketer requests AI assistance for a WhatsApp campaign, **When** the AI generates a draft message, **Then** the draft is presented for review and is not sent automatically.
2. **Given** an AI-suggested message exceeds the SMS character limit, **When** the assistant optimizes it, **Then** the optimized draft fits within the channel's character constraint.
3. **Given** a marketer requests best-send-time prediction, **When** the AI returns a recommended time, **Then** the marketer can accept, override, or ignore the recommendation before scheduling.

---

### Edge Cases

- What happens when the primary provider for a channel experiences an outage mid-campaign? The Communication Router must detect the failure and fail over to the configured secondary provider without dropping or duplicating messages already in flight.
- What happens when a submitted WhatsApp template is rejected by the provider (e.g., Meta) during the approval process? The template must remain unusable for live sends, and the rejection reason/status must be visible to the marketer so it can be revised and resubmitted.
- What happens when a push notification's deep link points to content that has since been deleted, unpublished, or made private (e.g., a removed ebook, a canceled event)? The system must resolve to a safe fallback destination rather than crashing the app or opening a dead link.
- What happens when a device's push token has been invalidated (app uninstalled, app data cleared, token rotated by the OS/provider)? The failed delivery must be recorded (e.g., Failed/Expired status) and the stale token must not be retried indefinitely.
- What happens when a large broadcast campaign hits a provider's rate limit mid-send? The delivery engine must queue and throttle remaining messages rather than dropping them or bursting past the provider's limit.
- What happens when a personalization variable (e.g., `{{wallet_balance}}`) has no value for a given recipient? The message must use the defined fallback value rather than sending a message with an unresolved token or blank field.
- What happens when a retried message may have already been delivered by the time the retry fires (delayed provider callback)? The system must avoid sending a duplicate to the same recipient.
- What happens when a recipient withdraws consent (opts out) for a channel while they are mid-journey in an active automated workflow? The withdrawal must propagate to that in-flight journey immediately, suppressing further sends on that channel without delay.
- What happens when a marketer attempts to send a free-form WhatsApp message outside of an approved template/category context governed by WhatsApp Business Policy constraints? [NEEDS CLARIFICATION: the source chapter states only that the platform "must comply with... WhatsApp Business Policies" (Section 17) without detailing session-window/category-specific messaging constraints (e.g., template-only vs. free-form send eligibility) — exact enforcement rules are not specified in this chapter and should be clarified against Meta's current WhatsApp Business Platform policy.]

## Requirements *(mandatory)*

### Functional Requirements

#### Unified Messaging Router

- **FR-001**: System MUST route every outbound SMS, WhatsApp, and Push Notification message through a centralized Communication Router that determines the provider, retry strategy, and delivery priority for that message. (Source: §4 Unified Messaging Architecture)
- **FR-002**: System MUST process every campaign through the pipeline: Audience Selection → Personalization Engine → Communication Router → channel-specific delivery (SMS / WhatsApp / Push) → Analytics & Delivery Tracking. (Source: §4)
- **FR-003**: System MUST support omnichannel messaging, allowing a single campaign to target SMS, WhatsApp, and Push Notification channels together. (Source: §2 Objectives, §4)

#### SMS Marketing

- **FR-004**: System MUST support the SMS campaign types: Promotional SMS, Transactional SMS, OTP Messages, Reminder Messages, Event Notifications, and Membership Alerts, covering use cases including OTP verification, login alerts, payment confirmation, order updates, event reminders, membership renewal, and promotional offers. (Source: §3 SMS, §5 SMS Campaign Types)
- **FR-005**: System MUST provide an SMS Builder capturing, at minimum: Campaign Name, Sender ID, Audience, Message Content, Personalization Tokens, Schedule, Expiry Time, and Priority. (Source: §5 SMS Builder)
- **FR-006**: System MUST support the SMS personalization variables `{{first_name}}`, `{{membership_type}}`, `{{course_name}}`, `{{event_name}}`, `{{reward_points}}`, `{{wallet_balance}}`, and `{{renewal_date}}`, and MUST substitute a defined fallback value when a referenced attribute is missing for a given recipient. (Source: §5 SMS Personalization)

#### WhatsApp Marketing

- **FR-007**: System MUST support the WhatsApp message types: Text, Image, Video, PDF, Audio, Interactive Buttons, Quick Replies, Carousel Cards, Product Catalog Messages, Location Sharing, and Contact Cards. (Source: §6 Supported Message Types)
- **FR-008**: System MUST allow administrators to create WhatsApp message templates. (Source: §6 WhatsApp Template Management)
- **FR-009**: System MUST allow administrators to submit WhatsApp templates for provider approval, and MUST prevent an unapproved template from being used in a live send. (Source: §6 WhatsApp Template Management)
- **FR-010**: System MUST allow administrators to edit approved WhatsApp templates. (Source: §6 WhatsApp Template Management)
- **FR-011**: System MUST allow administrators to archive WhatsApp templates, removing them from selection for new campaigns. (Source: §6 WhatsApp Template Management)
- **FR-012**: System MUST allow administrators to categorize WhatsApp templates into Authentication, Utility, and Marketing categories. (Source: §6 Template categories)
- **FR-013**: System MUST support interactive WhatsApp features: call-to-action buttons, Visit Website, Call Business, Quick Reply, Product View, Catalog Navigation, and Event Registration. (Source: §6 Interactive Features)

#### Push Notification

- **FR-014**: System MUST support push notification delivery to Android, iOS, Web Push, and Desktop Notification targets. (Source: §7 Push Notification Module)
- **FR-015**: Every push notification MUST support the components: Title, Subtitle, Body, Image, Icon, Deep Link, Category, Priority, Expiry, and Action Buttons. (Source: §7 Notification Components)
- **FR-016**: System MUST support rich notification media: Images, GIFs, Videos, Audio, Product Cards, and Dynamic Banners. (Source: §7 Rich Notifications)

#### Deep Linking

- **FR-017**: System MUST support push-notification deep links into defined in-app destinations, including: Community Post, Podcast Episode, Ebook Reader, Course Lesson, Event Details, Marketplace Product, Membership Page, Referral Program, AI Assistant, Wallet, and Notification Center. (Source: §8 Deep Linking)
- **FR-018**: Deep links MUST function correctly regardless of whether the application is running (foreground), backgrounded, or closed. (Source: §8 "Deep links must work whether the application is: Running / Backgrounded / Closed")
- **FR-019**: System MUST resolve deep links within the 1-second performance target. (Source: §19 Performance Requirements)

#### Personalization Engine

- **FR-020**: System MUST apply personalization consistently across SMS, WhatsApp, and Push Notification channels using audience attributes: Name, Membership, Purchase History, Preferred Language, Location, Community Interests, Learning Progress, Referral Status, Rewards, and Customer Score, adapting message content automatically based on these attributes without manual per-recipient authoring. (Source: §9 Messaging Personalization Engine)

#### AI Messaging Assistant

- **FR-021**: System MUST provide an AI messaging assistant supporting message generation, tone optimization, character-limit optimization, emoji recommendations, CTA suggestions, personalization improvements, translation, spam-risk reduction, and best-send-time prediction. (Source: §10 AI Messaging Assistant)
- **FR-022**: AI-generated message content and send-time suggestions MUST be presented as editable, advisory drafts requiring explicit marketer review and approval before a campaign is scheduled or sent; the AI MUST NOT autonomously dispatch a campaign. (Source: Constitution Principle II — AI Is Assistive, Never Autonomous, applied to §10)

#### Scheduling & Automation

- **FR-023**: System MUST support the scheduling modes: Immediate, Scheduled, Recurring, Event-driven, Workflow-triggered, and Time-zone-optimized delivery. (Source: §11 Scheduling & Automation)
- **FR-024**: System MUST support event-driven and workflow-triggered automated sends, including examples such as a welcome message after registration, a reminder before an event, a membership-renewal reminder sent 7 days before expiry, and a push notification after a new podcast release. (Source: §11 Scheduling & Automation examples)

#### Delivery Engine

- **FR-025**: System MUST provide intelligent queue management for outbound messages across all three channels. (Source: §12 Delivery Engine)
- **FR-026**: System MUST provide automatic provider failover when a configured provider is unavailable or fails to accept a message. (Source: §12 Delivery Engine)
- **FR-027**: System MUST apply retry logic to temporary delivery failures while avoiding duplicate deliveries to the same recipient. (Source: §12 "automatically retries temporary failures while avoiding duplicate deliveries")
- **FR-028**: System MUST support batch processing and parallel delivery of messages. (Source: §12 Delivery Engine)
- **FR-029**: System MUST support priority handling so time-sensitive messages (e.g., OTP) can be dispatched ahead of lower-priority messages (e.g., promotional). (Source: §12 Priority handling)
- **FR-030**: System MUST enforce rate limiting and delivery throttling to stay within provider-imposed sending limits. (Source: §12 Rate limiting, Delivery throttling)

#### Provider Integration

- **FR-031**: System MUST support integration with SMS providers including Twilio, MSG91, Textlocal, Vonage, AWS SNS, and custom SMS gateways. (Source: §13 SMS Providers)
- **FR-032**: System MUST support integration with WhatsApp providers including Meta WhatsApp Business Platform, Twilio WhatsApp, Gupshup, Infobip, and 360dialog. (Source: §13 WhatsApp Providers)
- **FR-033**: System MUST support integration with push providers including Firebase Cloud Messaging (FCM), Apple Push Notification Service (APNs), OneSignal, and Web Push API. (Source: §13 Push Providers)
- **FR-034**: System MUST allow provider selection to be configured either globally (platform default per channel) or overridden per campaign. (Source: §13 "Provider selection can be configured globally or per campaign")

#### Delivery Status Tracking & Analytics

- **FR-035**: System MUST record, for every message, a delivery status from the set: Queued, Sent, Delivered, Read, Clicked, Failed, Expired, Rejected, and Unsubscribed. (Source: §14 Delivery Status Tracking)
- **FR-036**: System MUST synchronize delivery status updates in near real time, meeting the 30-second update target. (Source: §14; §19 Performance Requirements)
- **FR-037**: System MUST provide an analytics dashboard reporting Total Messages Sent, Delivery Rate, Read Rate, Click Rate, Conversion Rate, Revenue Attribution, Response Rate, Failure Rate, Average Delivery Time, Device Distribution, and Geographic Reach, with support for date filters, channel comparisons, campaign comparisons, and export to CSV/PDF, refreshing within the 30-second target. (Source: §15 Analytics Dashboard; §19)

#### Compliance & Opt-Out

- **FR-038**: System MUST allow users to independently manage communication preferences per channel: Promotional SMS, Transactional SMS, WhatsApp Messages, and Push Notifications, plus Quiet Hours, Preferred Language, and Preferred Time Window. (Source: §16 Communication Preferences)
- **FR-039**: Preference and consent updates MUST apply immediately across all campaigns and in-flight automated journeys, with no further sends on a withdrawn channel after the update. (Source: §16 "Preference updates are applied immediately across all campaigns"; Constitution Principle VI)
- **FR-040**: System MUST comply with GDPR, CAN-SPAM (where applicable), WhatsApp Business Policies, telecom regulations, and applicable regional messaging laws. (Source: §17 Compliance)
- **FR-041**: System MUST provide consent management and per-channel opt-out handling. (Source: §17 Compliance features)
- **FR-042**: System MUST maintain audit logs covering compliance-relevant events (consent changes, opt-outs) and administrative/messaging platform actions. (Source: §17 Compliance features — Audit logs; §18 Security — Audit logging)
- **FR-043**: System MUST enforce data retention policies for messaging data. (Source: §17 Compliance features — Data retention policies)
- **FR-044**: System MUST support regulatory reporting. (Source: §17 Compliance features — Regulatory reporting)

#### Security

- **FR-045**: System MUST enforce RBAC authorization for all messaging platform actions. (Source: §18 Security)
- **FR-046**: System MUST enforce API authentication for provider and internal messaging integrations. (Source: §18 Security)
- **FR-047**: System MUST encrypt message transport end-to-end between the platform and providers. (Source: §18 Security)
- **FR-048**: System MUST store provider credentials securely and MUST NOT expose them client-side. (Source: §18 Security — Secure provider credentials)
- **FR-049**: System MUST support message signing and fraud detection, and MUST enforce rate limiting to mitigate abuse. (Source: §18 Security — Message signing, Rate limiting, Fraud detection)
- **FR-050**: System MUST NOT store sensitive message content in plain text. (Source: §18 "Sensitive content must never be stored in plain text")

#### Performance

- **FR-051**: System MUST meet the following performance targets: Push Notification Dispatch < 5 seconds; SMS Queue Creation < 3 seconds; WhatsApp Queue Creation < 3 seconds; Delivery Status Update < 30 seconds; Analytics Refresh < 30 seconds; Deep Link Resolution < 1 second. (Source: §19 Performance Requirements)

### Key Entities *(include if feature involves data)*

- **Message**: A single outbound (or inbound reply) communication on one channel (SMS, WhatsApp, or Push). Attributes include channel, campaign reference, recipient, rendered content (post-personalization), current delivery status (Queued/Sent/Delivered/Read/Clicked/Failed/Expired/Rejected/Unsubscribed), priority, provider used, timestamps for each status transition, and any deep link attached.
- **Channel**: One of SMS, WhatsApp, or Push Notification; carries channel-specific configuration (default provider, rate limits, supported message-type capabilities) and is the unit against which a recipient's communication preference/opt-out is tracked.
- **WhatsApp Template**: A reusable, provider-governed WhatsApp message definition with a category (Authentication, Utility, Marketing), an approval status (draft/pending/approved/rejected/archived), and template body/variables; only an approved template may be used in a live send.
- **Push Token**: A device- or browser-specific registration identifier (per Android/iOS/Web Push/Desktop) that push messages are addressed to; can become invalid (uninstall, cleared data, rotation) and must be tracked as such so delivery attempts stop being retried against it.
- **Deep Link**: A structured pointer from a push notification (or WhatsApp/SMS CTA) into a specific in-app destination (Community Post, Podcast Episode, Ebook Reader, Course Lesson, Event Details, Marketplace Product, Membership Page, Referral Program, AI Assistant, Wallet, Notification Center); must resolve consistently whether the app is foreground, background, or closed.
- **Provider Route**: The configuration linking a channel to one or more provider integrations (e.g., Twilio + MSG91 for SMS; Meta WhatsApp Business Platform + Gupshup for WhatsApp; FCM + APNs + OneSignal for Push), including primary/secondary ordering used for failover, and whether selection is global or campaign-level.
- **Communication Preference (Consent Record)**: A per-user, per-channel record (Promotional SMS, Transactional SMS, WhatsApp, Push) capturing opt-in/opt-out state, Quiet Hours, Preferred Language, and Preferred Time Window; re-checked immediately before every automated send.
- **Delivery Status Event**: A timestamped status transition for a Message (e.g., Sent → Delivered → Read → Clicked, or Sent → Failed), synchronized near-real-time and aggregated into the Analytics Dashboard.
- **Personalization Token**: A named variable (e.g., `{{first_name}}`, `{{wallet_balance}}`, `{{renewal_date}}`) resolved against recipient/audience attributes at send time, with a defined fallback value used when the underlying attribute is absent.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Push notification dispatch completes within 5 seconds of the triggering event, as measured from trigger to provider handoff. (Source: §19)
- **SC-002**: SMS queue creation completes within 3 seconds of the send request. (Source: §19)
- **SC-003**: WhatsApp queue creation completes within 3 seconds of the send request. (Source: §19)
- **SC-004**: Delivery status changes (Delivered/Read/Clicked/Failed, etc.) are reflected in the platform's delivery tracking and analytics within 30 seconds of the provider reporting the event. (Source: §19)
- **SC-005**: Deep link resolution from a notification tap to the correct in-app destination completes within 1 second, regardless of whether the app was in the foreground, backgrounded, or closed. (Source: §8, §19)
- **SC-006**: The analytics dashboard reflects newly ingested delivery/engagement data within 30 seconds. (Source: §19)
- **SC-007**: When a configured provider becomes unavailable mid-campaign, the Communication Router completes automatic failover to a secondary provider with zero manual operator intervention and zero duplicate messages delivered to any single recipient. (Source: §4, §12)
- **SC-008**: 100% of automated sends re-check the recipient's current per-channel communication preference/consent state immediately before dispatch, and a withdrawn/opted-out channel receives zero further sends from any in-flight campaign or journey after the withdrawal is recorded. (Source: §16; Constitution Principle VI)

## Assumptions

- The named SMS providers (Twilio, MSG91, Textlocal, Vonage, AWS SNS), WhatsApp providers (Meta WhatsApp Business Platform, Twilio WhatsApp, Gupshup, Infobip, 360dialog), and push providers (Firebase Cloud Messaging, Apple Push Notification Service, OneSignal, Web Push API) are cited in the source chapter as **supported integrations under a provider-abstraction model** (Communication Router / Provider Route), not as an exhaustive or exclusive list — the platform is assumed to support adding further providers behind the same routing abstraction without changing channel-level behavior. "Custom SMS Gateway" is explicitly named alongside the commercial providers, reinforcing that the provider layer is meant to be pluggable.
- The chapter does not specify exact rate-limit thresholds, retry-count ceilings, or backoff intervals for the Delivery Engine (§12) — these are assumed to be configurable operational parameters rather than fixed values, and are flagged as [NEEDS CLARIFICATION: specific retry count / backoff schedule / per-provider rate-limit thresholds not stated in source].
- The chapter states performance targets (§19) as single thresholds without specifying the measurement methodology (e.g., p50/p95/p99, or 100%-of-sends) — this spec treats them as the target ceiling for typical sends; the precise SLA percentile is [NEEDS CLARIFICATION: not specified in source].
- WhatsApp-specific platform policy mechanics beyond "must comply with WhatsApp Business Policies" (e.g., 24-hour customer-service messaging window, category-based session eligibility) are not detailed in this chapter and are assumed to be governed by whatever the connected WhatsApp provider's/Meta's current policy requires at implementation time — see the flagged edge case above.
- This feature assumes the existence of, and integrates with, the Audience Segmentation/CDP feature (spec 019) for audience selection, the Email Marketing feature (spec 020) as the sibling channel this module "complements," and the Marketing Automation Workflows feature (spec 022) for event-driven/workflow-triggered sends (§11) — those systems' internals are out of scope here and are only referenced at their integration boundary (the Communication Router).
- The AI Messaging Assistant (§10) is assumed to run server-side only and never to expose provider API keys, campaign-send authority, or system prompts to the client, per the platform-wide constitution principle "AI Is Assistive, Never Autonomous"; the chapter itself does not repeat this constraint explicitly for this module, so it is carried in from the constitution rather than chapter text.
- Consent/opt-out record-keeping (§16, §17) is assumed to be a per-channel, versioned, timestamped structure (per Constitution Principle VI) even though the chapter's own language ("Users can manage preferences for...") does not spell out the storage schema; the schema-level detail is left to the data model in a future `plan.md`, not this spec.
- Out of scope for this spec: the Email Marketing channel itself (spec 020), general Marketing Automation Workflow/journey-builder mechanics (spec 022), and the broader Omnichannel Orchestration layer (spec 032) that composes SMS/WhatsApp/Push/Email together — this spec covers only the SMS/WhatsApp/Push channel capabilities defined in Chapter 8 and their direct dependencies (Communication Router, provider integration, deep linking, compliance/opt-out).
