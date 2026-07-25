# Feature Specification: Social Media Marketing, Content Publishing & Community Distribution

**Feature Branch**: `031-social-media-content-publishing`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 14, Part 1, Chapter 18 — Social Media Marketing, Content Publishing & Community Distribution System (`document 1/Document 1 (30).md`). A centralized enterprise platform for planning, creating, approving, publishing, distributing, monitoring and optimizing all social media and community content across the Tamil Business Tribe ecosystem — covering social account management, content calendar/campaign planning, AI content generation and repurposing, cross-platform publishing, community distribution, digital asset management, hashtag/trend engines, social listening, unified comment/messaging inbox, analytics, executive reporting, revenue attribution, security and compliance."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publish One Piece of Content Across Every Connected Platform (Priority: P1)

A marketing/content team member finishes writing and approving one piece of content and wants it live simultaneously on Facebook, Instagram, LinkedIn, X, Threads, YouTube, Telegram, WhatsApp, and the Internal Community — without manually re-posting to each platform's native tool. The system reformats the content automatically for each destination's constraints (character limits, media specs, aspect ratios) before it goes out.

**Why this priority**: Cross-platform publishing from one dashboard is the platform's core value proposition (Chapter 18, Sections 2, 5, 17) and the reason the module exists — every other capability (calendar, approval, repurposing, analytics) exists in service of getting content out reliably across channels. Without this, the system is not usable as a social media operating system.

**Independent Test**: Connect at least two platform accounts, author one post, select multiple platforms, and publish. Can be fully tested by confirming the post appears correctly formatted on each selected platform and the publish status is recorded per platform — delivers standalone value even with no other module features enabled.

**Acceptance Scenarios**:

1. **Given** an approved content item and three connected platform accounts (Facebook, Instagram, LinkedIn) with valid authentication, **When** the author selects all three platforms and clicks Publish, **Then** the content is published to all three platforms and each platform shows its own publish status (success/failure) in the system.
2. **Given** a single approved content item with a long-form caption, **When** it is published to both LinkedIn and X, **Then** the system automatically adapts formatting (e.g., truncation/threading behavior) appropriate to each platform's constraints without the author manually editing per platform.
3. **Given** a content item scheduled for a future date/time, **When** the scheduled time is reached, **Then** the system auto-publishes to all selected platforms without manual intervention and records the publish outcome.
4. **Given** one of the selected platform accounts has an expired access token, **When** the author attempts to publish, **Then** the system blocks publishing to that specific platform, surfaces a reconnection prompt for that account, and still publishes successfully to the remaining valid platforms.

---

### User Story 2 - AI Content Repurposing Into 12+ Platform-Specific Formats (Priority: P2)

A content creator writes one source piece (e.g., a blog article) and asks the AI Content Repurposing engine to turn it into a LinkedIn article, Facebook post, Instagram caption, Reel script, YouTube Shorts script, X thread, WhatsApp broadcast, Telegram message, Community announcement, Blog article, Podcast summary, and Email newsletter — so the team gets a full multi-channel content set from a single authoring effort instead of rewriting from scratch for every channel.

**Why this priority**: This is the platform's headline productivity multiplier (Chapter 18, Section 12) and second-most-referenced capability after publishing itself; it directly drives the "reduce manual effort" and "improve publishing consistency" business objectives (Section 3), but depends on content creation and approval already existing, so it follows P1.

**Independent Test**: Submit one finished content item to the repurposing engine and verify that distinct, platform-appropriate variants are generated for each target format, each individually traceable back to the source and independently editable — testable without needing multi-platform publish to be wired up.

**Acceptance Scenarios**:

1. **Given** one approved blog article as source content, **When** the author triggers AI Content Repurposing, **Then** the system generates at least the 12 specified variants (LinkedIn article, Facebook post, Instagram caption, Reel script, YouTube Shorts script, X thread, WhatsApp broadcast, Telegram message, Community announcement, Blog article, Podcast summary, Email newsletter), each linked to the source item.
2. **Given** a generated repurposed variant, **When** the author reviews it, **Then** the author can edit the variant independently of the source content and of the other variants before it can be scheduled or published.
3. **Given** a repurposed variant targeted at a consent-gated channel (WhatsApp broadcast or Telegram message), **When** the system prepares to send it, **Then** the system re-checks current per-channel marketing consent for each recipient immediately before sending, not only at some earlier point.
4. **Given** the AI repurposing service is unavailable, **When** the author requests repurposing, **Then** the system informs the author the AI service is down and lets them manually create/copy variants instead of blocking the workflow entirely.

---

### User Story 3 - Content Approval Workflow Before Anything Publishes (Priority: P2)

A Marketing Manager, Brand Manager, or Legal reviewer needs to review, comment on, request revisions to, and formally approve a content item before it can be scheduled or published, with the system enforcing the configured approval chain (Author → Reviewer → Manager → optional Legal → Executive where applicable) and keeping a full history of every decision.

**Why this priority**: Per the platform-wide "AI is assistive, never autonomous" and "layered, explicit RBAC with approval chains" principles, no AI-drafted or human-drafted content may go live without human sign-off; this governs both User Story 1 (publishing) and User Story 2 (repurposing), so it is essential early but is a governance layer on top of authoring/publishing rather than the reason the product exists.

**Independent Test**: Submit a draft content item, route it through the configured approval chain, request a revision, resubmit, and approve — verifiable independently by checking that the item cannot reach "Scheduled" status until all required approvals are recorded.

**Acceptance Scenarios**:

1. **Given** a content item in Draft status, **When** the author submits it for review, **Then** it moves to Internal Review and becomes visible to designated reviewers with the ability to comment.
2. **Given** a content item awaiting Manager Approval, **When** the manager requests a revision with comments, **Then** the item returns to the author with the revision request attached and the version history preserves the prior draft.
3. **Given** a content item whose category requires Legal Review, **When** all prior approval steps are complete but Legal has not yet approved, **Then** the system prevents the item from moving to Scheduling.
4. **Given** a genuine emergency (e.g., breaking-news response), **When** an authorized role invokes emergency publishing, **Then** the bypass is recorded in the audit log together with who authorized it and why.

---

### User Story 4 - Unified Comment & Messaging Inbox With AI-Suggested Replies (Priority: P3)

A community/support-facing team member opens one inbox to see and respond to comments from Facebook, Instagram, LinkedIn, YouTube, and the Community, as well as direct messages from Facebook Messenger, Instagram DM, WhatsApp Business, Telegram, and Internal Community Messages — with customer history, CRM context, and AI-suggested reply drafts available in one place, instead of switching between five or more native apps.

**Why this priority**: Engagement response time and community trust depend on this, and it is explicitly enumerated as a distinct capability set (Sections 25-26), but it operates on content/relationships that already exist from published posts, making it a P3 following the core publish/repurpose/approve loop.

**Independent Test**: Simulate an incoming comment on one platform and an incoming DM on another; verify both surface in the same inbox view, can be assigned to an agent, and offer an AI-suggested reply that the agent must review before sending.

**Acceptance Scenarios**:

1. **Given** new comments arrive on a Facebook post and an Instagram post, **When** the community manager opens the unified inbox, **Then** both comments appear in the same list with their source platform labeled, alongside the same-thread AI-suggested reply.
2. **Given** an inbound WhatsApp Business message from a known customer, **When** the agent opens the conversation, **Then** the system displays that customer's prior history and relevant CRM context alongside the message.
3. **Given** a comment assigned to Agent A, **When** Agent B opens the same conversation, **Then** the system shows the conversation as already assigned to Agent A to prevent two agents sending conflicting replies.
4. **Given** an AI-suggested reply is shown for a customer message, **When** the agent has not yet reviewed or edited it, **Then** the system MUST NOT send that reply automatically — it is sent only after explicit agent action.

---

### User Story 5 - Trend Detection & Social Listening Surfaces a Sentiment Alert (Priority: P3)

The marketing/community team relies on the platform to continuously watch brand mentions, competitor mentions, keywords, products, events, influencers, and industry discussions, classify them by sentiment (Positive/Neutral/Negative/Critical), and proactively alert the team in near real time when something needs attention — such as a spike in negative or critical mentions — rather than the team discovering a problem after the fact by manually searching each platform.

**Why this priority**: Reputational risk and viral-opportunity response are time-sensitive but reactive by nature (they depend on content already being published and monitored), and the acceptance criteria explicitly requires social listening to detect brand mentions and trend detection to alert within a defined performance target, making this an important but not launch-blocking capability relative to publishing itself.

**Independent Test**: Inject a simulated brand mention with negative sentiment and verify the system classifies it correctly and generates an alert visible to the marketing team within the trend-detection performance target, independent of any publishing action.

**Acceptance Scenarios**:

1. **Given** the social listening engine is monitoring configured keywords and brand terms, **When** a new mention matching those terms appears on a monitored channel, **Then** the system classifies its sentiment as Positive, Neutral, Negative, or Critical and records it.
2. **Given** a viral topic or trending keyword emerges in a monitored industry conversation, **When** the trend detection engine identifies it, **Then** the marketing team receives a real-time alert within the defined trend-detection performance target (under 5 minutes).
3. **Given** the mention is written in Tamil or Tanglish rather than English, **When** the sentiment classification runs, **Then** the system correctly classifies sentiment using Tamil/Tanglish-aware processing rather than relying on English-only keyword matching.
4. **Given** negative/critical-sentiment mentions cross a configured volume threshold in a short window, **When** the threshold is crossed, **Then** the system raises a sentiment alert routed to the responsible manager for escalation.

---

### User Story 6 - Automated Community Distribution (Priority: P4)

A content author publishes a post and, based on configurable distribution rules, the platform automatically routes it into the appropriate internal destinations — Community Feed, Groups, Interest Communities, Premium Communities, Regional Communities, Event Groups, or Learning Communities — instead of the author manually cross-posting into each community.

**Why this priority**: This extends reach into TBT's owned community surfaces and supports the "increase community engagement" business objective, but it is a distribution refinement layered on top of the core publish/approve flow, making it lower priority than the customer-facing publish, repurpose, approval, and inbox stories.

**Independent Test**: Configure one distribution rule (e.g., "posts tagged #events go to the Event Groups community") and publish a matching post; verify it appears in the target community automatically without a separate manual post action.

**Acceptance Scenarios**:

1. **Given** a distribution rule mapping a content tag/campaign to a target community, **When** a matching post is published, **Then** the post automatically appears in that community without additional manual steps.
2. **Given** a post is distributed to a Regional Community, **When** a member outside that region/language views the platform, **Then** the post does not appear as a regional-community post to that member (respecting the community's membership/region scoping).
3. **Given** no distribution rule matches a published post, **When** the post is published, **Then** it is not force-distributed into an unrelated community.

---

### User Story 7 - Revenue Attribution Ties a Social Post Back to a Sale (Priority: P4)

An executive or marketing analyst wants to see that a specific social campaign or post contributed to a Membership sale, Course sale, Ebook sale, Event registration, Affiliate revenue, Referral revenue, Community growth, or Subscription revenue outcome — so social spend and effort can be justified with real business results instead of vanity engagement metrics alone.

**Why this priority**: Revenue attribution is explicitly called out as integrating with the separate Attribution & ROI module (feature 028) and depends on posts, campaigns, and conversions already existing and being tracked, so it is the last link in the value chain covered by this chapter and is reasonably deprioritized behind the content and engagement capabilities that generate the underlying data.

**Independent Test**: Publish a campaign-tagged post containing a UTM-tracked link, simulate a resulting membership purchase through that link, and verify the revenue event is attributed back to the originating post/campaign and visible on the Executive Dashboard — testable independent of unified inbox or trend detection.

**Acceptance Scenarios**:

1. **Given** a published post with UTM parameters tied to a campaign, **When** a visitor completes a course purchase after clicking that link, **Then** the purchase is attributed to the originating post/campaign and reflected in revenue attribution reporting.
2. **Given** a completed attribution record for a conversion, **When** the underlying attribution model configuration is later changed, **Then** the already-finalized attribution record is not retroactively altered.
3. **Given** the Executive Dashboard is opened, **When** an executive filters by campaign, **Then** attributed Membership Sales, Course Sales, Ebook Sales, Event Registrations, Affiliate Revenue, Referral Revenue, Community Growth, and Subscription Revenue for that campaign are shown alongside engagement metrics.

---

### Edge Cases

- What happens when a platform's API returns a rate-limit or downtime error during a scheduled auto-publish — does the item stay "Scheduled," move to a visible "Failed" state, or silently drop, and who is notified?
- What happens when an AI-repurposed variant (e.g., a Tamil-to-English or English-to-Tamil translation) loses meaning, tone, or a culturally specific reference in translation — is there a required human review step before a translated variant can publish?
- What happens when negative/critical-sentiment mentions spike sharply (e.g., a potential PR crisis) — does the system distinguish an urgent escalation from routine negative feedback, and who is guaranteed to see it?
- What happens when the same customer message arrives through two channels at once (e.g., a comment and a DM) or two agents act on the same unified-inbox thread simultaneously — how is the routing/assignment conflict resolved so the customer doesn't get duplicate or contradictory replies?
- What happens when a connected platform account's access token expires or is revoked mid-way through a multi-platform publish that already succeeded on some platforms — is the publish treated as partially successful, and is the author told exactly which platforms failed?
- What happens when a content item requires Legal Review but Legal has not acted before its scheduled publish time — does the item hold, or can Emergency Publishing be used to bypass this, and if so what audit trail is required?
- What happens when an AI-generated repurposed variant exceeds a target platform's length/media constraints (e.g., an X thread segment or Instagram caption over the platform limit) — is it auto-truncated, auto-split, or rejected back to the author?
- What happens when a single conversion (e.g., a membership purchase) is reachable through multiple attributed social touchpoints across different platforms — how is revenue attribution split or assigned to avoid double-counting across posts/campaigns?
- What happens when a community distribution rule targets a community whose language/region scope does not match the content's configured language/region — is the post withheld, translated, or distributed as-is?
- What happens when a recommended or campaign hashtag is later flagged/banned by a platform as spam — does the system stop recommending it and warn on posts already scheduled with it?

## Requirements *(mandatory)*

### Functional Requirements

#### Social Account & Platform Connection Management

- **FR-001**: System MUST support publishing to, at minimum: social networks (Facebook, Instagram, LinkedIn, X/Twitter, Threads, Pinterest, TikTok, Snapchat), video platforms (YouTube, YouTube Shorts, Vimeo), messaging platforms (WhatsApp Channels, Telegram Channels), community platforms (TBT Community, Groups, Forums, Discussion Boards), blogging platforms (Internal Blog, Medium, WordPress, Ghost), and podcast platforms (Spotify, Apple Podcasts, Google Podcasts, RSS Distribution).
- **FR-002**: Administrators MUST be able to manage multiple brands, accounts, pages, channels, languages, and regions from a single dashboard.
- **FR-003**: System MUST store, for each connected platform account: account ID, platform, brand, region, language, authentication status, access token, expiration date, publishing permissions, analytics permissions, owner, and status.
- **FR-004**: System MUST track access-token expiration, MUST block publish attempts on a platform account with an expired or invalid token, and MUST surface a reconnection prompt to that account's owner.
- **FR-005**: System MUST record every OAuth connection, token rotation, and platform-account permission change in the platform's immutable audit log.

#### Content Lifecycle, AI Generation & Content Workspace

- **FR-006**: System MUST track every content item through the lifecycle stages Idea → AI Draft → Human Editing → Review → Approval → Scheduling → Publishing → Distribution → Engagement → Analytics → Optimization, with every stage transition fully auditable.
- **FR-007**: System MUST support the content types: Text Posts, Image Posts, Carousel Posts, Video Posts, Reels, Shorts, Stories, Polls, Events, Podcasts, Articles, Blogs, Infographics, Announcements, Case Studies, Testimonials, Community Updates, Educational Posts, Promotional Posts, and AI Generated Posts.
- **FR-008**: The Content Editor MUST support rich text editing, Markdown, AI writing assistance, grammar checking, tone adjustment, emoji support, mentions, hashtags, a CTA builder, URL shortening, UTM parameter generation, link previews, multi-language editing, and version history.
- **FR-009**: System MUST provide an integrated AI content generator that produces social captions, long-form posts, LinkedIn articles, Instagram captions, Facebook posts, X threads, YouTube descriptions, podcast descriptions, event promotions, course promotions, membership campaigns, product-launch copy, and promotional copy, offering multiple tone options (Professional, Friendly, Educational, Motivational, Sales, Funny, Inspirational, Technical).
- **FR-010**: System MUST provide an AI Creative Assistant that suggests image ideas, thumbnail concepts, banner suggestions, carousel layouts, hooks, CTAs, emoji recommendations, brand-consistency checks, color recommendations, and visual storytelling guidance.
- **FR-011**: All AI content-generation and AI-assist calls MUST execute server-side only; no provider API key, system prompt, or privileged instruction MUST ever be exposed to a client.
- **FR-012**: System MUST provide a deterministic, non-AI fallback for content creation (e.g., a manual/blank editor path) so authoring is never blocked when the AI content-generation service is unavailable.

#### AI Content Repurposing

- **FR-013**: System MUST allow one source content item to be automatically repurposed into, at minimum, the following formats: LinkedIn article, Facebook post, Instagram caption, Reel script, YouTube Shorts script, X thread, WhatsApp broadcast message, Telegram message, Community announcement, Blog article, Podcast summary, and Email newsletter.
- **FR-014**: Each repurposed content variant MUST retain a traceable link back to its source content item and record which target format/platform it was generated for.
- **FR-015**: Repurposed variants MUST be individually editable and MUST pass through the same content approval workflow as original content before they can be scheduled or published.
- **FR-016**: Repurposing MUST support Tamil, Tanglish, and English as first-class output languages, not machine-translation-only afterthoughts.
- **FR-017**: System MUST re-check current per-channel marketing consent immediately before publishing/sending a repurposed variant on a consent-gated channel (e.g., WhatsApp broadcast, Telegram message), not only at an earlier point such as signup.

#### Content Calendar, Campaign Planning & Scheduling

- **FR-018**: System MUST provide a content calendar with Daily, Weekly, Monthly, Quarterly, and Yearly views, filterable by Platform, Campaign, Team, Author, Status, Brand, Language, and Region.
- **FR-019**: System MUST support campaign records containing Campaign Name, Objective, Budget, Audience, Platforms, Schedule, KPI, Creative Assets, CTA, UTM Parameters, and Owner, with statuses Draft, Active, Paused, Completed, and Archived.
- **FR-020**: System MUST support Immediate publish, Scheduled publish, Recurring publish, time-zone-aware publishing, smart scheduling, and AI-recommended publish time.

#### Content Approval Workflow

- **FR-021**: System MUST route content through the workflow Draft → Internal Review → Manager Approval → Legal Review (optional) → Scheduling → Auto Publishing → Monitoring.
- **FR-022**: System MUST support the approval levels Author, Reviewer, Marketing Manager, Brand Manager, Legal Team, and Executive, consistent with the platform's layered, explicit RBAC/approval-chain requirement.
- **FR-023**: Each approval step MUST capture reviewer comments, support revision requests back to the author, provide version comparison against prior drafts, and maintain a complete, timestamped approval history.
- **FR-024**: System MUST prevent a content item from advancing to Scheduling or Publishing until it has received every approval required by its configured approval chain.
- **FR-025**: System MUST support parallel approvals, sequential approvals, and an emergency-publishing path; every use of emergency publishing MUST be recorded in the audit log with the authorizing role and reason. [NEEDS CLARIFICATION: the source does not specify who may authorize emergency publishing, under what conditions it is permitted, or whether post-hoc review is mandatory]

#### Multi-Platform Publishing

- **FR-026**: System MUST allow a single publish action to simultaneously publish content to Facebook, Instagram, LinkedIn, X, Threads, YouTube, Telegram, WhatsApp, and the Internal Community.
- **FR-027**: System MUST automatically adapt platform-specific formatting (character limits, media specs, aspect ratios, and equivalent constraints) when the same content is published to multiple platforms.
- **FR-028**: System MUST track and record publish status (success/failure) per platform for every publish attempt as part of the post-publish Monitoring stage, and MUST surface publish failures to the content author/owner.
- **FR-029**: System MUST record the UTM parameters and shortened URL applied to each published post per platform, for downstream analytics and revenue attribution.
- **FR-030**: Publish Requests MUST complete within the defined performance target of under 3 seconds.

#### Community Distribution

- **FR-031**: System MUST support automatic distribution of published posts into Community Feed, Groups, Interest Communities, Premium Communities, Regional Communities, Event Groups, and Learning Communities.
- **FR-032**: Community distribution rules MUST be configurable, mapping content criteria (e.g., tag, campaign, platform scope) to target community destinations.
- **FR-033**: Internal Community distribution MUST route into the TBT Community platform, honoring that platform's existing group/community membership, region, and access rules.

#### Digital Asset Management & Brand Asset Library

- **FR-034**: System MUST support asset types Images, Videos, Audio, Logos, Icons, PDFs, Documents, Templates, GIFs, and Stickers, each storing metadata for Tags, Category, Campaign, Copyright, License, Owner, and Version.
- **FR-035**: System MUST provide a Brand Asset Library storing Logos, Fonts, Brand Colors, Templates, Watermarks, Intro Videos, Outro Videos, Lower Thirds, and Motion Graphics, with version control.

#### AI Hashtag Engine

- **FR-036**: System MUST recommend Trending, Industry, Regional, Campaign, Event, High-Performing, and Seasonal hashtags, and MUST continuously track hashtag performance.

#### Trend Detection & Social Listening

- **FR-037**: System MUST use AI to detect Viral Topics, Trending Keywords, Competitor Campaigns, Emerging Discussions, Industry News, Breaking News, and Seasonal Opportunities, and MUST deliver real-time alerts to marketing teams within the trend-detection performance target of under 5 minutes.
- **FR-038**: System MUST monitor Brand Mentions, Competitor Mentions, Keywords, Products, Events, Influencers, Industry Discussions, and Customer Complaints across supported channels (social listening).
- **FR-039**: System MUST classify every monitored mention into one of the sentiment categories Positive, Neutral, Negative, or Critical.
- **FR-040**: Social listening and sentiment classification MUST natively handle Tamil, Tanglish, and transliterated content; simple English-only keyword matching MUST NOT be relied on alone.
- **FR-041**: System MUST generate a sentiment alert when negative/critical-sentiment mentions cross a configured threshold, routing it to the responsible manager for escalation. [NEEDS CLARIFICATION: the source does not define the specific threshold values, alerting window, or escalation SLA for negative/critical sentiment spikes]

#### Unified Inbox — Comment Management & Messaging Center

- **FR-042**: System MUST provide a unified comment inbox aggregating comments from Facebook, Instagram, LinkedIn, YouTube, and the Community.
- **FR-043**: The unified comment inbox MUST support Reply, Hide, Delete, Assign, Escalate, and AI-suggested replies for each comment.
- **FR-044**: System MUST provide a unified messaging center aggregating Facebook Messenger, Instagram DM, WhatsApp Business, Telegram, and Internal Community Messages.
- **FR-045**: The unified messaging center MUST display customer history, integrate with the CRM, and offer an AI assistant for reply suggestions.
- **FR-046**: AI-suggested replies (comments and messages) MUST be presented as suggestions only; a human agent MUST review and send the reply (or explicitly configure an approved auto-send rule) before it is delivered to the customer.
- **FR-047**: System MUST support assigning an inbox conversation (comment thread or message thread) to a single responsible agent, and MUST reflect current assignment status to other agents to prevent duplicate or conflicting responses to the same conversation.

#### Analytics, Performance Metrics & Executive Reporting

- **FR-048**: System MUST track content performance metrics: Reach, Impressions, Clicks, Shares, Saves, Comments, Likes, Watch Time, Followers, Engagement Rate, CTR, and Conversion Rate.
- **FR-049**: System MUST track community metrics: Active Members, Daily/Weekly/Monthly Active Users, Posts Created, Comments, Shares, Likes, Bookmarks, Referrals, and Member Growth.
- **FR-050**: System MUST provide an AI Performance Optimizer that gives advisory recommendations for better posting time, CTA, hashtags, image, hook, audience, platform, and content format.
- **FR-051**: System MUST provide an Executive Dashboard showing Campaign Performance, Engagement, Followers, Reach, Revenue, ROI, Top Performing Platforms, Top Creators, Top Campaigns, Viral Posts, and Community Growth, with automatically generated executive summaries.
- **FR-052**: The Analytics Dashboard MUST load within the defined performance target of under 3 seconds.

#### Revenue Attribution

- **FR-053**: System MUST attribute social campaign/post activity to Membership Sales, Course Sales, Ebook Sales, Event Registrations, Affiliate Revenue, Referral Revenue, Community Growth, and Subscription Revenue.
- **FR-054**: Revenue attribution for social campaigns/posts MUST integrate with the Attribution & ROI module rather than implement a separate, independent attribution model.
- **FR-055**: The attribution model and touchpoint assignment recorded for a given conversion MUST be snapshotted at the time of the event and MUST NOT be retroactively altered by later attribution-model configuration changes.

#### Collaboration

- **FR-056**: System MUST support collaboration among Authors, Editors, Designers, Video Editors, Marketing Managers, Community Managers, Legal Team, and Executives on content items, including comments, mentions, tasks, notifications, version history, and file sharing.

#### Security & Compliance

- **FR-057**: System MUST enforce RBAC, MFA (mandatory at minimum for admin and finance-equivalent roles), audit logs, encryption, secure OAuth, token rotation, session monitoring, and IP restrictions.
- **FR-058**: System MUST support GDPR, CCPA, and cookie-consent compliance, copyright tracking, brand compliance checks, AI-disclosure labeling on AI-generated content, a defined content retention policy, and full approval-audit trails.

#### APIs

- **FR-059**: System MUST expose REST API endpoints for Create Post, Update Post, Delete Post, Publish, Schedule, Upload Asset, Fetch Analytics, Retrieve Comments, Generate AI Content, and Generate AI Caption, with webhook support for event notifications.

### Key Entities

- **Platform Connection (Social Account)**: A connected external platform account — account ID, platform, brand, region, language, authentication status, access token, expiration date, publishing/analytics permissions, owner, and status. Owns the OAuth relationship used for publishing and listening.
- **Content Item (Social Post)**: A unit of content moving through the lifecycle (Idea → ... → Optimization) — content type, body, associated assets, target platforms, language, campaign, author, version history, and current lifecycle/approval status.
- **Repurposed Content Variant**: An AI-generated, platform/format-specific derivative of a source Content Item (e.g., Reel script, X thread) — target format, generated content, edit state, link to source, and its own approval/publish status.
- **Campaign**: A planned marketing initiative — name, objective, budget, audience, platforms, schedule, KPI, creative assets, CTA, UTM parameters, owner, and status (Draft/Active/Paused/Completed/Archived); groups related Content Items.
- **Approval Record**: A single approval-chain decision on a Content Item or Variant — approval level/role, approver, decision, comments, revision requests, and timestamp, contributing to the item's full approval history.
- **Digital Asset**: A stored media/document file (image, video, audio, logo, icon, PDF, document, template, GIF, sticker) with metadata (tags, category, campaign, copyright, license, owner, version).
- **Brand Asset**: A brand-library resource (logo, font, brand color, template, watermark, intro/outro video, lower third, motion graphic) under version control, distinct from campaign-specific Digital Assets.
- **Hashtag**: A tracked hashtag with category (trending, industry, regional, campaign, event, seasonal) and continuously updated performance data.
- **Trend Alert**: A system-detected emerging topic, keyword, competitor campaign, or news item surfaced to the marketing team with a detection timestamp and category.
- **Social Mention**: A monitored occurrence of a brand/competitor/keyword/product/event/influencer reference captured by social listening, with source, content, and classified sentiment.
- **Sentiment Alert**: An escalation raised when negative/critical Social Mentions cross a configured threshold, routed to a responsible manager.
- **Inbox Message**: A unified comment or direct-message record from a supported platform (Facebook, Instagram, LinkedIn, YouTube, Community, Messenger, Instagram DM, WhatsApp Business, Telegram) — sender, content, thread, assignment, status, and any AI-suggested reply.
- **Community Distribution Rule**: A configurable mapping from content criteria to a target internal community destination (Community Feed, Groups, Interest/Premium/Regional Communities, Event Groups, Learning Communities).
- **Revenue Attribution Record**: A snapshot linking a Content Item/Campaign touchpoint to a downstream revenue event (membership, course, ebook, event registration, affiliate, referral, subscription, community growth), finalized at the time of the conversion.
- **Audit Log Entry**: An immutable record of an administrative, approval, publishing, connection, or emergency-bypass action taken within the module.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can manage all connected brands, accounts, pages, and channels from a single dashboard, with no need to log into a separate native tool to check connection/authentication status.
- **SC-002**: A single publish action successfully delivers correctly (platform-appropriately formatted) content to all selected platforms, with publish status visible per platform, in under 3 seconds per publish request.
- **SC-003**: One source content item can be turned into all 12+ specified repurposed formats through the AI Content Repurposing engine without manual re-authoring of each variant from scratch.
- **SC-004**: No content item reaches Published status without having passed every approval step required by its configured approval chain, and 100% of emergency-publish bypasses are captured in the audit log.
- **SC-005**: Social listening detects and correctly sentiment-classifies brand mentions, including Tamil/Tanglish content, and trend/viral-topic alerts reach the marketing team within 5 minutes of detection.
- **SC-006**: Unified inbox conversations (comments and messages) show correct source-platform attribution, assignment status, and customer/CRM history, with zero instances of two agents sending conflicting replies to the same thread once assignment is set.
- **SC-007**: Revenue attributed to social campaigns (membership, course, ebook, event, affiliate, referral, subscription, community growth) is visible on the Executive Dashboard per campaign, and finalized attribution records remain unchanged after later attribution-model configuration changes.
- **SC-008**: AI-generated content and AI-suggested replies are never delivered/published to an end customer or public platform without a recorded human review/approval step.
- **SC-009**: Content Editor, AI Caption generation, and Analytics Dashboard meet their defined load-time performance targets (under 2 sec, under 5 sec, and under 3 sec respectively) under normal operating load.

## Assumptions

- This feature depends on the AI Assistant Platform (feature 008) for the underlying AI content generation, AI Content Repurposing, AI hashtag/trend recommendations, AI performance optimization, and AI-suggested comment/message replies described here; this spec defines what social/content capabilities must be exposed, not the AI orchestration internals, which are owned by feature 008.
- This feature depends on the Community, Social, Trust & Safety platform (feature 005) as the destination and access-control authority for Internal Community publishing and Community Distribution (Community Feed, Groups, Interest/Premium/Regional Communities, Event Groups, Learning Communities) — this spec does not re-define community membership, moderation, or trust/safety rules already owned by feature 005.
- This feature depends on the Attribution & ROI Measurement module (feature 028) for the actual multi-touch/attribution-model computation; this spec only requires that social posts/campaigns feed attributable touchpoints into that module and display the results.
- Consent management (per-channel opt-in/opt-out for WhatsApp, Telegram, email newsletter repurposing targets) is owned by the platform-wide consent system referenced across the marketing volume; this feature re-checks consent before send but does not own consent storage.
- Legal Review triggers (which content categories/campaign types require it before publish) and emergency-publishing authorization rules are organizational policy decisions not specified in the source chapter and are flagged with [NEEDS CLARIFICATION] rather than assumed.
- Sentiment-alert escalation thresholds and SLAs are organizational policy decisions not specified in the source chapter and are flagged with [NEEDS CLARIFICATION] rather than assumed.
- Security, MFA, RBAC, and compliance baselines (GDPR/CCPA, audit logging, encryption) follow the platform-wide constitution baseline already established for other modules, applied here to social/content-specific actions (publishing, asset access, inbox access).
- Users of this module (marketing team, content team, community managers, social media managers, creators, administrators, executives) already hold authenticated TBT platform accounts with roles assigned via the platform's existing RBAC system (feature 003 for identity, this chapter's Section 33 for module-specific role enforcement).
