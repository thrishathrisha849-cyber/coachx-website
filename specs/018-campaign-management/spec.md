# Feature Specification: Campaign Management: Lifecycle, Creation, Scheduling & Publishing

**Feature Branch**: `018-campaign-management`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 14 — Marketing Automation Platform, Part 1 — Marketing Foundation, Chapter 5 — Campaign Management Module (Campaign Lifecycle, Creation, Scheduling & Publishing). Source: `document 1/Document 1 (17).md`. Define the core operational engine of the marketing platform: campaign categories, the standardized lifecycle (Idea → Archived), the 9-step campaign creation wizard, campaign dashboard and statuses, templates, the scheduling engine (immediate/scheduled/recurring/event-based), the pre-publish validation and publishing workflow, collaboration, the AI Campaign Assistant, version control, real-time monitoring, duplication, archiving, error handling, performance targets, and security — per Constitution Article II (AI Is Assistive, Never Autonomous) and Article VII (Layered, Explicit RBAC With Approval Chains)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Campaign via the 9-Step Guided Wizard (Priority: P1)

A marketer creates a new campaign by working through a guided, 9-step wizard — Basic Information, Objectives, Target Audience, Communication Channels, Campaign Content, Attachments, Tracking, Approval, and Schedule — ending with a complete, saveable campaign record ready for review.

**Why this priority**: The wizard is the single entry point for every campaign in the platform; without it, no campaign of any type or channel can be created. It is the foundational capability every other capability in this module (scheduling, validation, AI assistance, version control) builds on.

**Independent Test**: Can be fully tested by starting a new campaign, completing all 9 steps with valid data (name, type, owner, objectives, an audience selection, at least one channel, content, tracking, a reviewer, and a schedule choice), and confirming a Draft-status campaign record is created and persisted with every field captured.

**Acceptance Scenarios**:

1. **Given** a marketer starts the wizard, **When** they complete Step 1 (Basic Information) with Campaign Name, Campaign Code, Campaign Type, Business Unit, Owner, Priority, Category, Tags, and Description, **Then** the wizard advances to Step 2 (Objectives) with the entered data retained.
2. **Given** a marketer is on Step 3 (Target Audience), **When** they select a Saved Segment and apply a Custom Filter, **Then** the system displays a preview showing estimated audience size, reach estimate, overlap detection, and duplicate removal before they proceed.
3. **Given** a marketer is on Step 4 (Communication Channels), **When** they select both Email and WhatsApp, **Then** Step 5 (Campaign Content) presents a content editor scoped to both selected channels.
4. **Given** a marketer completes all 9 steps, **When** they save the campaign, **Then** the campaign is created in Draft status in under 2 seconds and a version 1 record is generated.

---

### User Story 2 - Schedule a Campaign: Immediate, Future, Recurring, or Event-Triggered (Priority: P1)

A marketer chooses how and when a campaign is sent — instantly, at a specific future date/time, on a recurring pattern (daily/weekly/monthly/quarterly/yearly/custom), or automatically in response to a member event such as registration, purchase, or course completion.

**Why this priority**: Scheduling is core to campaign execution; every campaign type (acquisition, retention, referral, etc.) depends on correct, predictable timing, and event-based triggers are required for lifecycle-style campaigns (e.g., abandoned-cart, welcome series) described throughout the module.

**Independent Test**: Can be fully tested by taking a completed campaign draft to Step 9 (Schedule), selecting each of the four scheduling modes in turn (Immediate, Scheduled, Recurring, Event-Based) with a time zone and, where applicable, frequency/expiry, and confirming the resulting campaign record reflects the chosen schedule type and parameters.

**Acceptance Scenarios**:

1. **Given** a validated campaign ready to schedule, **When** the marketer selects "Publish Immediately," **Then** the campaign is queued to start instantly upon publish.
2. **Given** a validated campaign, **When** the marketer selects "Schedule Later," sets a future date/time, and selects a time zone, **Then** the campaign is set to Scheduled status and will run only at that date/time in that time zone.
3. **Given** a validated campaign, **When** the marketer selects "Recurring" and chooses a Weekly pattern with an expiry date, **Then** the campaign runs on the defined weekly cadence until the expiry date is reached.
4. **Given** a validated campaign, **When** the marketer selects "Event-Based" and chooses the "Course completion" trigger, **Then** the campaign sends automatically to each member who completes a course, rather than at a fixed date/time.

---

### User Story 3 - Pre-Publish Validation Blocks Incomplete or Broken Campaigns (Priority: P1)

Before any campaign can go live, the system automatically checks audience availability, required approvals, template completeness, broken links, missing images, personalization variables, tracking configuration, and channel availability — and blocks publishing with detailed, actionable error messages if any check fails.

**Why this priority**: This is the platform's primary safeguard against sending broken, non-compliant, or unapproved campaigns to real members; the source explicitly names this validation gate ahead of the general publishing step, and it directly protects brand trust and deliverability.

**Independent Test**: Can be fully tested by attempting to publish a campaign with a deliberately broken link in its content and confirming publish is blocked with a specific, actionable error identifying the broken link, while an otherwise-identical campaign with a valid link publishes successfully.

**Acceptance Scenarios**:

1. **Given** a campaign whose content contains a broken link, **When** the marketer attempts to publish, **Then** publishing is blocked and an error message identifies the broken link as the cause.
2. **Given** a campaign missing a required approval, **When** the marketer attempts to publish, **Then** publishing is blocked with an "approval pending" error rather than proceeding.
3. **Given** a campaign with unresolved personalization tokens (e.g., a `{{first_name}}` token with no fallback), **When** pre-publish validation runs, **Then** the missing personalization variable is reported as a validation failure before publish.
4. **Given** a campaign that passes all validation checks, **When** the marketer publishes, **Then** validation completes in under 3 seconds and the campaign transitions to Published/Running within 10 seconds.

---

### User Story 4 - Route a Campaign Through Content Review and Approval (Priority: P2)

A campaign moves from Draft through Content Review and Approval before it can be scheduled. The creator selects a reviewer, approval level, approval deadline, and required comments in Step 8; the reviewer's decision is recorded and gates progression to Scheduling.

**Why this priority**: The lifecycle explicitly places Content Review and Approval as mandatory stages before Scheduling; without an enforced approval gate, unreviewed campaign content could reach members, which the module's governance intent (and Constitution Article VII) does not permit.

**Independent Test**: Can be fully tested by submitting a completed campaign for approval with a designated reviewer, confirming the campaign status becomes "Awaiting Approval," and confirming the campaign cannot progress to "Scheduled" until an "Approved" decision is recorded.

**Acceptance Scenarios**:

1. **Given** a campaign in Draft with all wizard steps complete, **When** the creator submits it for review, **Then** the campaign status changes to "Awaiting Review" and then "Awaiting Approval," and the designated reviewer is notified.
2. **Given** a campaign "Awaiting Approval," **When** the reviewer approves it, **Then** the status changes to "Approved" and an audit record is created capturing the reviewer, decision, and timestamp.
3. **Given** a campaign "Awaiting Approval," **When** the marketer attempts to move it directly to "Scheduled" without an approval decision, **Then** the system blocks the transition.
4. **Given** an approval deadline set in Step 8, **When** the deadline passes without a reviewer decision, **Then** the campaign remains blocked from scheduling and its pending-approval state remains visible on the dashboard.

---

### User Story 5 - Compare and Restore Prior Campaign Versions (Priority: P2)

Every save of a campaign creates a new version capturing the version number, author, timestamp, change summary, and approval status. Users can compare any two versions side by side, restore an earlier version, or download a version.

**Why this priority**: Campaigns are frequently edited by multiple collaborators before and after approval; without version history, an accidental edit or content regression cannot be safely undone, and approval integrity (knowing exactly what was approved) would be lost.

**Independent Test**: Can be fully tested by saving a campaign three times with different content edits, confirming three distinct version records exist with author/timestamp/change-summary metadata, comparing version 1 to version 3, and restoring version 1 as the active content.

**Acceptance Scenarios**:

1. **Given** a campaign is edited and saved, **When** the save completes, **Then** a new version record is created capturing version number, author, timestamp, change summary, and current approval status, and no prior version is overwritten.
2. **Given** two existing versions of a campaign, **When** a user selects "Compare Versions," **Then** the system displays the differences between the two selected versions.
3. **Given** an earlier version of a campaign, **When** a user selects "Restore," **Then** that version's content becomes the active version and a new version record is created reflecting the restore action (the version history is never destructively rewritten).
4. **Given** any version of a campaign, **When** a user selects "Download," **Then** that specific version's content is exported.

---

### User Story 6 - Use the AI Campaign Assistant With Mandatory Human Review (Priority: P2)

A marketer requests AI assistance while building a campaign — campaign name suggestions, subject-line generation, content generation, CTA recommendations, audience recommendations, best-send-time prediction, predicted open rate, predicted CTR, and a campaign score — and reviews, edits, and explicitly approves any suggestion before it becomes part of the campaign sent to members.

**Why this priority**: AI assistance materially speeds up campaign creation (Step 5 explicitly lists "AI-generated content" as a supported content type), but per Constitution Article II (AI Is Assistive, Never Autonomous), no AI output may reach members without human review — making the review gate a P2 capability essential to safe adoption of P1 features rather than a P1 itself.

**Independent Test**: Can be fully tested by requesting an AI-generated subject line for a draft campaign, confirming the suggestion is inserted as an editable, unpublished draft field, and confirming the campaign cannot be published with that AI suggestion in place until a human has viewed and explicitly accepted (with or without edits) the suggested content.

**Acceptance Scenarios**:

1. **Given** a marketer requests subject-line suggestions from the AI Campaign Assistant, **When** the suggestions are returned, **Then** they appear as editable, non-final draft text — not as already-applied, live campaign content.
2. **Given** an AI-generated content suggestion has been inserted into the campaign, **When** the marketer attempts to publish without any recorded human review action on that field, **Then** the system does not treat the AI suggestion as approved and publishing is blocked or the human review step is enforced first.
3. **Given** the AI Campaign Assistant predicts an open rate and CTR for a draft campaign, **When** the prediction is displayed, **Then** it is clearly labeled as a prediction/estimate, not a guaranteed outcome.
4. **Given** the AI Campaign Assistant recommends an audience segment, **When** the marketer accepts the recommendation, **Then** the accepted segment is applied to Step 3 exactly as if the marketer had selected it manually, with no different validation path.

---

### User Story 7 - Duplicate a Campaign or Start From a Template (Priority: P3)

A marketer creates a new campaign quickly by cloning an existing campaign (including its audience, schedule, templates, automation workflow, and tracking settings) or by starting from a reusable template such as Welcome Campaign, Festival Offer, or Abandoned Cart, editing only the fields that need to change.

**Why this priority**: Duplication and templates are efficiency features that reduce repetitive setup; valuable but not required for the module's core lifecycle, scheduling, or governance guarantees to function, so they rank below creation, scheduling, and validation.

**Independent Test**: Can be fully tested by duplicating an existing, fully configured campaign, confirming the duplicate is created as a new Draft with the source campaign's audience/schedule/templates/automation/tracking copied over, editing the campaign name/schedule/audience/budget/objectives on the duplicate, and confirming the original campaign is unchanged.

**Acceptance Scenarios**:

1. **Given** an existing campaign, **When** a marketer selects "Duplicate," **Then** a new Draft-status campaign is created with the audience, schedule, templates, automation workflow, and tracking settings copied from the source.
2. **Given** a newly duplicated campaign, **When** the marketer edits its name, schedule, audience, budget, or objectives, **Then** those changes apply only to the duplicate and the original campaign remains unmodified.
3. **Given** the template library, **When** a marketer selects the "Abandoned Cart" template, **Then** a new campaign is pre-populated with that template's structure and content, ready for the wizard's remaining fields to be completed.
4. **Given** a saved template, **When** a marketer clones, edits, and saves it, **Then** the change is stored as a new template version without altering the original template that other users may still be using.

---

### Edge Cases

- What happens when two audience selections in Step 3 (e.g., a Saved Segment and a Custom Filter) produce overlapping members — does the system surface the overlap and deduplicate before the estimated audience size is shown, and can the marketer proceed without acknowledging the overlap?
- What happens when a Step-3 audience selection resolves to zero estimated members — does the wizard block progression, or does it defer the "missing audience" failure to pre-publish validation?
- How does the system handle an invalid or self-contradictory schedule, such as an Expiry Date set earlier than the recurring campaign's start date, or a custom recurrence rule that never produces a valid next-run time?
- How does the system handle a campaign where multiple pre-publish validation failures occur simultaneously (e.g., a broken link AND a missing image AND an unresolved tracking configuration) — are all failures reported together, or only the first one encountered?
- What happens when a marketer attempts to publish a campaign whose AI-generated subject line or content has never been opened/edited/explicitly reviewed by a human — is this distinguishable from human-authored content that also happens to be unedited from a prior save?
- How does the system handle a channel that was available when the campaign was scheduled but becomes unavailable (e.g., the WhatsApp Business API integration is suspended) before the scheduled publish time arrives?
- What happens when a user restores an older campaign version after the campaign has already progressed through Approval — does restoring reset the campaign's approval status back to requiring re-review, or does the previously granted approval remain attached to the now-restored content?
- What happens when the campaign's declared Budget (set in Step 2) is exceeded by projected send volume or channel costs at the time of publish — is this caught by pre-publish validation ("Budget exceeded") before members are contacted?
- What happens when two editors have the same campaign open simultaneously and both submit conflicting edits before either saves — does the version-control model produce two divergent versions, or is a conflict surfaced at save time?

## Requirements *(mandatory)*

### Functional Requirements — Campaign Categories & Lifecycle

- **FR-001**: System MUST provide a single, centralized interface for creating, executing, monitoring, and managing all marketing campaigns across the organization, eliminating manual coordination between separate tools.
- **FR-002**: System MUST support omnichannel campaign execution — Email, SMS, WhatsApp, Push Notification, In-App Notification, Landing Page, Social Media, and Web Banner — from a single campaign record.
- **FR-003**: System MUST support at minimum six campaign categories, each with its own defined purpose set: Acquisition (new registrations, lead generation, app installs, website traffic, webinar registrations), Engagement (daily engagement, community participation, podcast listening, ebook reading, course activity), Conversion (premium upgrades, course purchases, ebook sales, event ticket sales, membership renewals), Retention (win-back, re-engagement, loyalty rewards, membership reminders, subscription renewals), Referral (invite friends, referral rewards, affiliate marketing, community growth), and Promotional (offers, discounts, flash sales, festival promotions, product launches).
- **FR-004**: System MUST progress every campaign through the standardized lifecycle stages, in order: Idea → Planning → Draft → Content Review → Approval → Scheduling → Ready → Published → Running → Completed → Archived.
- **FR-005**: System MUST enforce applicable business rules, audit logging, and permission validation at every lifecycle-stage transition.
- **FR-006**: System MUST support the full set of campaign statuses: Draft, Awaiting Review, Awaiting Approval, Approved, Scheduled, Running, Paused, Completed, Failed, Archived, and Cancelled.
- **FR-007**: System MUST generate an audit record for every campaign status transition.
- **FR-008**: System MUST track campaign conversions and revenue as part of the campaign lifecycle.
- **FR-009**: System MUST support enterprise collaboration across the campaign lifecycle (see Collaboration requirements below).

### Functional Requirements — Creation Wizard

- **FR-010**: System MUST provide a guided, sequential 9-step wizard for campaign creation: Basic Information, Objectives, Target Audience, Communication Channels, Campaign Content, Attachments, Tracking, Approval, and Schedule.
- **FR-011**: Step 1 (Basic Information) MUST capture Campaign Name, Campaign Code, Campaign Type, Business Unit, Owner, Priority, Category, Tags, and Description.
- **FR-012**: Step 2 (Objectives) MUST capture Primary Goal, Secondary Goal, Expected ROI, Budget, KPI Targets, and Success Metrics.
- **FR-013**: Step 3 (Target Audience) MUST allow audience selection via Saved Segments, Dynamic Segments, Custom Filters, Geographic Location, Language, Interests, Membership Status, Purchase History, Engagement Score, and Device Type.
- **FR-014**: Step 3 MUST display an audience preview showing estimated audience size, reach estimate, overlap detection, and duplicate removal before the wizard proceeds.
- **FR-015**: Step 4 (Communication Channels) MUST allow selection of one or multiple channels from Email, SMS, WhatsApp, Push Notification, In-App Notification, Landing Page, Social Media, and Web Banner.
- **FR-016**: Step 5 (Campaign Content) MUST provide a content editor supporting rich text, HTML, Markdown, image uploads, video embedding, personalization tokens, dynamic variables, and AI-generated content.
- **FR-017**: Step 6 (Attachments) MUST support Images, Videos, PDFs, Audio, GIFs, Documents, and custom buttons as campaign assets.
- **FR-018**: Step 7 (Tracking) MUST allow configuration of UTM parameters, conversion events, Google Analytics, Meta Pixel, internal analytics, revenue tracking, and custom events.
- **FR-019**: Step 8 (Approval) MUST allow the creator to select a Reviewer, Approval Level, Approval Deadline, and Required Comments.
- **FR-020**: Step 9 (Schedule) MUST allow the creator to choose Publish Immediately, Schedule Later, Recurring Campaign, Time Zone, Frequency, and Expiry Date.

### Functional Requirements — Scheduling

- **FR-021**: System MUST support an Immediate scheduling mode in which the campaign starts instantly upon publish.
- **FR-022**: System MUST support a Scheduled mode in which the campaign runs at a specified future date and time.
- **FR-023**: System MUST support a Recurring scheduling mode with Daily, Weekly, Monthly, Quarterly, Yearly, and custom recurrence-rule patterns.
- **FR-024**: System MUST support an Event-Based scheduling mode triggered by Registration, Purchase, Login, Referral, Premium upgrade, Course completion, or Ebook download events.
- **FR-025**: System MUST allow a Time Zone to be selected for Scheduled and Recurring campaigns.
- **FR-026**: System MUST allow an Expiry Date to be set on a Recurring or Event-Based campaign to bound how long it continues to trigger.

### Functional Requirements — Pre-Publish Validation & Publishing Workflow

- **FR-027**: System MUST validate, before allowing a campaign to be published, all of the following: audience availability, required approvals, template completeness, broken links, missing images, personalization variables, tracking configuration, and channel availability.
- **FR-028**: System MUST block publishing and present detailed, actionable error messages whenever pre-publish validation fails.
- **FR-029**: System MUST detect and report, at minimum, the following validation/error conditions: missing audience, invalid schedule, empty content, approval pending, missing tracking, expired template, channel unavailable, and budget exceeded.
- **FR-030**: System MUST provide actionable guidance for resolving each reported validation error, not merely an error code or generic message.
- **FR-031**: System MUST complete pre-publish validation in under 3 seconds.
- **FR-032**: System MUST complete the campaign publish action, once validation passes, in under 10 seconds.

### Functional Requirements — Version Control

- **FR-033**: System MUST create a new version record every time a campaign is saved.
- **FR-034**: Each version record MUST capture version number, author, timestamp, change summary, and approval status at the time of that save.
- **FR-035**: Users MUST be able to compare any two campaign versions and view the differences between them.
- **FR-036**: Users MUST be able to restore a prior campaign version as the active version.
- **FR-037**: Users MUST be able to download a specific campaign version.
- **FR-038**: System MUST preserve all prior versions when a save, restore, or edit occurs — no version-history entry may be destructively overwritten.

### Functional Requirements — AI Campaign Assistant

- **FR-039**: System MUST provide an AI Campaign Assistant capable of generating campaign name suggestions.
- **FR-040**: System MUST provide AI-generated subject-line suggestions.
- **FR-041**: System MUST provide AI-generated campaign content suggestions.
- **FR-042**: System MUST provide AI-generated CTA (call-to-action) recommendations.
- **FR-043**: System MUST provide AI-generated audience recommendations.
- **FR-044**: System MUST provide an AI-predicted best send time.
- **FR-045**: System MUST provide an AI-predicted open rate for a draft campaign.
- **FR-046**: System MUST provide an AI-predicted click-through rate (CTR) for a draft campaign.
- **FR-047**: System MUST provide an AI-generated campaign score.
- **FR-048**: System MUST require an explicit, recorded human review-and-approval action on any AI-generated campaign name, subject line, content, CTA, or audience recommendation before that content can be published to members, per Constitution Article II (AI Is Assistive, Never Autonomous); AI Campaign Assistant output MUST NOT be treated as auto-approved or publishable without human review.
- **FR-049**: System MUST visually and functionally distinguish AI-generated predictions (open rate, CTR, campaign score, best send time) as estimates, not guaranteed outcomes.

### Functional Requirements — Campaign Dashboard, Templates & Duplication

- **FR-050**: System MUST display, for each campaign, current status, reach, opens, clicks, conversions, revenue, ROI, delivery rate, bounce rate, unsubscribe count, complaint rate, and last-modified timestamp.
- **FR-051**: System MUST refresh dashboard metrics in under 2 seconds and return campaign search results in under 500 milliseconds.
- **FR-052**: System MUST provide reusable campaign templates including, at minimum, Welcome Campaign, Premium Upgrade, Webinar Reminder, Festival Offer, Flash Sale, Product Launch, Birthday Wishes, Membership Renewal, Referral Invite, and Abandoned Cart.
- **FR-053**: Users MUST be able to clone, edit, save, share, version, and archive campaign templates.
- **FR-054**: Users MUST be able to duplicate an entire campaign, including its audience, schedule, templates, automation workflow, and tracking settings.
- **FR-055**: During duplication, System MUST allow the campaign name, schedule, audience, budget, and objectives to be edited on the duplicate without altering the source campaign.
- **FR-056**: System MUST mark archived campaigns as read-only while keeping them searchable and preserving their analytics and audit history.
- **FR-057**: System MUST support restoration of an archived campaign.
- **FR-058**: System MUST exclude archived campaigns from active dashboards unless explicitly requested by the user.

### Functional Requirements — Collaboration & Real-Time Monitoring

- **FR-059**: System MUST support multiple simultaneous editors on a campaign.
- **FR-060**: System MUST support comments, @mentions, approval notes, an activity timeline, draft sharing, and change requests on a campaign, in addition to version history.
- **FR-061**: System MUST provide real-time monitoring, during campaign execution, of deliveries, opens, clicks, conversions, revenue, failures, bounce rates, spam complaints, queue status, and processing speed.
- **FR-062**: System MUST automatically refresh monitored real-time metrics without requiring a manual reload.

### Functional Requirements — Security & Performance

- **FR-063**: System MUST enforce RBAC permissions on all campaign management actions.
- **FR-064**: System MUST enforce approval requirements, audit logging, version control, secure file uploads, encrypted API communication, session validation, and rate limiting across all campaign management operations.
- **FR-065**: System MUST meet the following performance targets: campaign creation under 2 seconds; save draft under 1 second; publish validation under 3 seconds; campaign publish under 10 seconds; dashboard refresh under 2 seconds; campaign search under 500 milliseconds.

### Key Entities *(include if feature involves data)*

- **Campaign**: The core record representing a single marketing campaign — name, code, type/category, business unit, owner, priority, tags, description, objectives (primary/secondary goal, expected ROI, budget, KPI targets, success metrics), current lifecycle stage, current status, and links to its audience selection, channel configuration, content, attachments, tracking configuration, approval record, schedule, and version history.
- **Campaign Version**: An immutable snapshot created on every save, capturing version number, author, timestamp, change summary, approval status at save time, and the full campaign content/configuration at that point; supports compare, restore, and download.
- **Campaign Schedule**: The scheduling configuration attached to a campaign — mode (Immediate, Scheduled, Recurring, Event-Based), target date/time, time zone, recurrence pattern/frequency, custom recurrence rule, triggering event type (for Event-Based), and expiry date.
- **Audience Selection / Audience Snapshot**: The set of criteria (saved segment, dynamic segment, custom filters, geography, language, interests, membership status, purchase history, engagement score, device type) used to resolve a campaign's target audience, plus the resolved preview data (estimated size, reach estimate, overlap-detection result, deduplicated count) captured at the time of selection. Segment/member data itself is owned by the audience-segmentation/CDP feature (019); this entity represents the campaign's reference to and snapshot of that data.
- **Campaign Channel Configuration**: The set of communication channels selected for a campaign (Email, SMS, WhatsApp, Push, In-App, Landing Page, Social Media, Web Banner) and any channel-specific settings needed for publishing.
- **Campaign Content**: The editable content body for a campaign (rich text/HTML/Markdown), including personalization tokens, dynamic variables, and any AI-generated content, along with its review/approval status.
- **Campaign Attachment**: An uploaded asset (image, video, PDF, audio, GIF, document, custom button) associated with a campaign.
- **Tracking Configuration**: UTM parameters, conversion events, Google Analytics/Meta Pixel integration flags, internal analytics settings, revenue-tracking configuration, and custom events attached to a campaign.
- **Approval Record**: The reviewer, approval level, approval deadline, required comments, decision (approved/rejected/pending), decision timestamp, and associated audit trail for a campaign's Content Review and Approval stages.
- **AI Suggestion**: A single AI Campaign Assistant output (name suggestion, subject line, content draft, CTA recommendation, audience recommendation, predicted send time, predicted open rate, predicted CTR, or campaign score), tagged with its type, the prompt/context used, and its human review status (unreviewed, edited, accepted, rejected) — required before the suggestion can be incorporated into a publishable campaign.
- **Campaign Template**: A reusable, named starting configuration (e.g., Welcome Campaign, Abandoned Cart) that can be cloned, edited, saved, shared, versioned, and archived independently of any specific campaign instance.
- **Campaign Duplication Record**: The link between a source campaign and a duplicated campaign, tracking which fields (name, schedule, audience, budget, objectives) were changed on the duplicate.
- **Campaign Dashboard Metrics**: The aggregated, refreshing set of per-campaign metrics — status, reach, opens, clicks, conversions, revenue, ROI, delivery rate, bounce rate, unsubscribe count, complaint rate, last-modified timestamp — surfaced on the campaign dashboard and during real-time monitoring.
- **Campaign Activity / Audit Log Entry**: An immutable record of a lifecycle-stage transition, status change, approval decision, comment, mention, change request, or version action, capturing actor, timestamp, and details.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of new campaigns are created through the 9-step wizard with all required fields captured, completing the create action in under 2 seconds and draft saves in under 1 second.
- **SC-002**: 100% of campaigns with a broken link, missing image, unresolved personalization variable, missing tracking configuration, unavailable channel, missing audience, invalid schedule, pending approval, or exceeded budget are blocked from publishing, each with an actionable error message; pre-publish validation completes in under 3 seconds.
- **SC-003**: A validated, approved campaign completes the publish action end-to-end in under 10 seconds.
- **SC-004**: 100% of campaign saves produce a retrievable version record (version number, author, timestamp, change summary, approval status); 100% of version restores succeed without loss of any prior version's history.
- **SC-005**: Zero instances of AI-generated campaign name, subject line, content, or CTA reaching Published status without a recorded, explicit human review action against that content.
- **SC-006**: 100% of lifecycle-stage transitions (Idea through Archived) and status transitions produce an audit record capturing actor and timestamp.
- **SC-007**: 100% of Step 3 audience selections with overlapping segments surface an overlap-detection and duplicate-removal result in the preview before the wizard can proceed to Step 4.
- **SC-008**: Campaign dashboards refresh in under 2 seconds and campaign search returns results in under 500 milliseconds, at the scale of the organization's full active + archived campaign volume.
- **SC-009**: 100% of recurring and event-based campaigns respect their configured expiry date/condition — zero sends triggered after expiry.

## Assumptions

- This spec defines the shared campaign object, lifecycle, creation wizard, scheduling engine, pre-publish validation, publishing workflow, collaboration, version control, AI assistance touchpoints, dashboard, templates, duplication, archiving, and security/performance requirements owned by Volume 14 Part 1 Chapter 5. Per-channel send/delivery mechanics (email rendering and deliverability, SMS/WhatsApp/push provider integration, landing page building, social post publishing) are owned by their respective feature specs (020 email-marketing, 021 sms-whatsapp-push-marketing, 023 landing-pages-lead-capture, 031 social-media-content-publishing) and are referenced here, not duplicated.
- This spec assumes dependency on **feature 019 (audience-segmentation-cdp)** for all underlying audience/segment data — saved segments, dynamic segments, engagement score, purchase history, and member profile attributes used in Step 3 (Target Audience) and its overlap/duplicate-detection preview. This chapter's "Audience Selection / Audience Snapshot" entity references that data; it does not redefine segment computation.
- This spec assumes dependency on **feature 008 (ai-assistant-platform)** for the underlying AI provider/model gateway, prompt orchestration, guardrails, and anti-hallucination infrastructure that powers the AI Campaign Assistant described in Section 12. This chapter defines only the campaign-specific AI touchpoints (name/subject-line/content/CTA generation, audience/send-time recommendations, predicted performance, campaign scoring) and their mandatory human-review gate; it does not redefine the shared AI platform contract.
- RBAC roles, permission groups, and the approval-chain hierarchy referenced by Step 8 (Approval) and by the Security section are assumed to be owned by **feature 016 (marketing-rbac-roles)**; this spec assumes that role/permission model exists and references reviewer/approval-level selection without redefining RBAC itself.
- Deeper attribution/ROI computation methodology (how revenue and ROI shown on the Campaign Dashboard are calculated and attributed) is assumed to be owned by features 027/028 (marketing-analytics-attribution, attribution-roi-measurement); this chapter only requires that ROI/revenue/conversions be surfaced on the dashboard, not how they are computed.
- The chapter's own "AI Campaign Assistant" (Section 12) is a compact, campaign-scoped feature set (name/subject-line/content/CTA generation, audience/send-time recommendations, predicted open rate/CTR, campaign score). A separate, broader "AI Marketing Assistant" is expected to be specified under feature 025; where the two overlap, this spec is the canonical source only for the campaign-creation-scoped AI touchpoints listed above.
- Automated recurring and event-based sends are assumed to re-check consent status per channel immediately before each send, per Constitution Article VI (Consent Is First-Class, Per-Channel, and Versioned); this chapter's source text does not restate that mechanism inline, but the constitution applies it platform-wide and the omnichannel orchestration feature (032) is assumed to own the consent-recheck implementation detail.
- [NEEDS CLARIFICATION: The source's "Future Roadmap" (Section 20) lists "Autonomous AI campaign execution" as a planned enhancement. This appears to directly conflict with Constitution Article II (AI Is Assistive, Never Autonomous), which requires human approval before any consequential action such as publishing. This spec treats all Section 20 items, including autonomous execution, as explicitly out of scope for current functional requirements; the conflict should be resolved (or the roadmap item removed/reworded) before any future implementation work targets it.]
- [NEEDS CLARIFICATION: The source does not specify what happens to a campaign's Approval status when an earlier version is restored after approval was already granted (does restore require re-approval, or does approval carry over) — this spec's FR-036/FR-038 require that version history be preserved, but the re-approval behavior on restore is not stated in the source and is flagged rather than assumed.]
- [NEEDS CLARIFICATION: The source does not specify concurrency-conflict behavior when multiple simultaneous editors (Section 11) save conflicting changes to the same campaign at the same time — whether this produces a merge, a blocking lock, or two divergent versions is not stated.]
- [NEEDS CLARIFICATION: The source does not define numeric thresholds for "Budget exceeded" (Section 17) — e.g., whether this compares projected send cost against the Step 2 Budget field, and by what margin — only that the condition exists as a validation failure.]
- Detailed database schema, API endpoint signatures, and channel-provider integration contracts are explicitly deferred to later architecture/API documents (consistent with how other chapters in this volume defer such detail); this spec defines required entities and capabilities, not physical schema or endpoints.
