# Feature Specification: Community, Social Networking, Messaging & Trust and Safety

**Feature Branch**: `005-community-social-trust-safety`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 05 — Community, Groups, Channels, Feed, Posts, Networking, Messaging, Moderation and Trust & Safety" (source: `document 1/Document 1 (4).md`)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View A Personalized, Explainable Feed (Priority: P1)

A member opens Community Home and sees a feed built from what they actually follow, joined groups, interests, learning path, and course enrollment — not a pure engagement-optimized stream. If a post looks out of place, the member can ask "Why am I seeing this?" and get a plain-language reason (they follow the author, it's from a joined group, it matches their learning goal, or the community rated it helpful).

**Why this priority**: The feed is the primary entry surface for the entire community module (Community Home, §6) and the platform's explicit "Value Before Virality" principle (§3.1) depends on ranking being relevance/helpfulness-driven and auditable to the user — this is the single highest-traffic, highest-trust surface in the volume.

**Independent Test**: Can be fully tested by seeding a test account with follows, group memberships, and interests, loading the feed, and verifying returned posts are explainable via the "Why am I seeing this?" control without requiring any other module (messaging, groups management, moderation) to be built.

**Acceptance Scenarios**:

1. **Given** a member follows Author A and is in Group G, **When** the member opens My Feed, **Then** posts from Author A and from Group G appear and each is traceable to a ranking reason.
2. **Given** a post has a high engagement count but is flagged as clickbait or low-trust-score content, **When** the feed is ranked, **Then** the post is not artificially boosted above more relevant/helpful lower-engagement posts.
3. **Given** a member has hidden or muted a specific author, **When** the feed is rendered, **Then** no content from that author appears in Personalized, Following, or Latest feeds.
4. **Given** a member selects "Why am I seeing this?" on a feed card, **When** the explanation panel opens, **Then** it shows a specific, real reason (follow relationship, group membership, learning-goal relevance, or community helpfulness rating) rather than a generic message.

---

### User Story 2 - Create And Publish A Post (Priority: P1)

A member opens the post composer from Community Home, a group page, or the mobile create button, selects a post type (text, image, video, audio, document, link, achievement, or collaboration/opportunity), writes/attaches content, sets an audience, and publishes — with drafts autosaved along the way and full Tamil/Tanglish/English text support.

**Why this priority**: Content creation is the second foundational primitive after the feed; without it there is nothing to rank, comment on, react to, or moderate. It is explicitly P0 in the source MVP tier (§127).

**Independent Test**: Can be fully tested by opening the composer, creating one post of each supported type, confirming it renders correctly on the feed and profile, and verifying drafts persist across a session interruption — independent of groups, messaging, or moderation being complete.

**Acceptance Scenarios**:

1. **Given** a member is composing a text post in Tamil Unicode, **When** they submit valid content within the configured length limit, **Then** the post publishes and displays correctly without being blocked for using non-Latin script.
2. **Given** a member has an in-progress post with an incomplete media upload, **When** they navigate away and return, **Then** the draft (including partial media state) is preserved.
3. **Given** a member attempts to submit raw HTML inside a rich-text post, **When** the post is saved, **Then** the HTML is sanitized/stripped server-side and never rendered as live markup.
4. **Given** a member sets a post's audience to a private group, **When** another member outside that group views the community feed, **Then** the post is not visible to them.

---

### User Story 3 - Ask A Question And Get A Community-Vetted Accepted Answer (Priority: P1)

A member posts a Question (title, details, category, tags, optional group) and receives answers from other members. The question author (or an authorized moderator) can mark one answer as "Accepted," instructor/mentor answers are visibly badged, and the question's state moves from Open through Answered to Closed/Archived.

**Why this priority**: Asking learning-related questions and getting help is stated as the #1 community objective (§2.1) and Questions/Accepted Answers are explicitly P1 "Growth Critical" in the MVP tiering (§127) — this is what differentiates the community from a generic social feed.

**Independent Test**: Can be tested end-to-end by posting a question, submitting two candidate answers from different accounts, accepting one, and verifying the question's state transitions and the accepted answer is visually distinguished and sorted first.

**Acceptance Scenarios**:

1. **Given** a member posts a Question, **When** other members reply in the comment thread, **Then** those replies are visually distinguished as "Answers" rather than generic comments.
2. **Given** a question has multiple answers, **When** the question author selects one as the accepted answer, **Then** the question's state changes to "Accepted answer" and that answer is shown first when sorting by helpfulness.
3. **Given** an answer is written by a Mentor or Instructor, **When** the answer is displayed, **Then** it carries a mentor/instructor badge distinguishing it from a peer answer.
4. **Given** a question has received no answers within the community's expected window, **When** it is surfaced on Community Home, **Then** it appears in an "Unanswered Questions" section to attract responses.

---

### User Story 4 - Follow And Connect With Other Members (Priority: P1)

A member follows other members, mentors, instructors, or organizations one-directionally to see their content, and separately sends mutual "Connection" requests (with an optional note) to build a two-way professional relationship, visible in a Connections list with mutual-group and skill context.

**Why this priority**: Networking ("similar goal members connect pannanum," §2.3) is a core community objective, and Follow/Connections are explicitly P0 items in the MVP tier (§127) required before messaging or the member directory are useful.

**Independent Test**: Can be tested by having Account A follow Account B (one-directional, no acceptance needed) and Account A send a connection request to Account C that Account C accepts, then verifying follower/following counts and the mutual Connections list independent of groups or messaging.

**Acceptance Scenarios**:

1. **Given** Account A follows Account B, **When** Account B has not followed back, **Then** the relationship remains one-directional and only Account A sees Account B's content preferentially.
2. **Given** Account A sends a connection request with an optional note to Account C, **When** Account C accepts, **Then** both accounts' connection counts update and the connection appears in both Connections lists.
3. **Given** an account has sent an excessive number of unsolicited connection requests in a short window, **When** the daily/new-account limit is reached, **Then** further requests are blocked and the pattern is available as a spam signal.
4. **Given** Account A has blocked Account C, **When** Account C attempts to send a follow or connection request to Account A, **Then** the request is prevented.

---

### User Story 5 - Join Or Participate In A Group And Its Channels (Priority: P1)

A member discovers a public, private-visible, or private-hidden group, joins via the group's configured join method (open, request-approval, invitation, or automatic course/program enrollment), reads group rules, and participates in the group's feed and channels (e.g., General, Questions, Wins, Resources).

**Why this priority**: Groups/channels are the structural container for cohort-, course-, and interest-based community activity and are explicitly P0 (public/private groups, member management) in the MVP tier (§127); without them, course cohorts and accountability groups have no home.

**Independent Test**: Can be tested by creating a private-visible group with request-approval join, having a non-member request to join, an admin approving it, and the new member posting into a group channel — independent of the global feed or messaging.

**Acceptance Scenarios**:

1. **Given** a group is set to "Private Hidden," **When** a non-invited, non-member user searches the community, **Then** the group does not appear in discoverable search results.
2. **Given** a group requires request-approval to join, **When** a user submits a join request (with configured join questions answered), **Then** the request is queued for an admin/moderator with the applicant's answers, profile, and mutual-member context visible for decision.
3. **Given** a member is removed/banned from a group, **When** the removal occurs, **Then** the reason, duration, and content-retention outcome are recorded in an auditable record and an appeal option is offered where severity allows.
4. **Given** a group is archived, **When** a member visits it, **Then** existing content remains viewable per the archive's configured read-only/unavailable setting and no new posts can be created.

---

### User Story 6 - Send And Receive Direct Messages With Request-Gating (Priority: P1)

A member messages another member according to that recipient's message permission setting (everyone / follows / connections only / same groups only / nobody). If the sender is not already connected/eligible, the message lands in a "Message Request" folder with a limited pre-acceptance message count and restricted media/links, and the recipient can accept, decline, block, or report before a normal conversation opens.

**Why this priority**: Direct messaging is explicitly P0 (§127), and the request-gating mechanic is the primary defense described in the source against messaging being misused as "a dating or unsolicited promotional channel" (§68) — it is inseparable from the safety model, not an optional add-on.

**Independent Test**: Can be tested by having a non-connected Account A send a message to Account B whose setting is "Connections only," verifying the message routes to B's request folder with restricted content, and then testing B's accept/decline/block/report actions independently of the group or feed modules.

**Acceptance Scenarios**:

1. **Given** Account B's message permission is "Connections only" and Account A is not connected to B, **When** Account A sends a first message, **Then** it is placed in B's message-request folder rather than the primary inbox.
2. **Given** a message request is pending, **When** Account A attempts to send further messages before acceptance, **Then** the sender is capped at the configured pre-acceptance message limit and restricted from sending media/links.
3. **Given** Account B declines or blocks the message request, **When** the action is taken, **Then** Account A cannot continue the conversation and (for block) the block's platform-wide effects apply.
4. **Given** a message thread is active, **When** either participant checks message status, **Then** sending/sent/delivered/read/failed/deleted states are accurately reflected, honoring each user's read-receipt privacy preference.

---

### User Story 7 - Report Content And Track Moderation/Appeal Outcome (Priority: P2)

A member reports a post, comment, message, profile, group, or event for a specific reason (spam, scam, harassment, hate, threat, sexual content, illegal activity, impersonation, privacy violation, copyright, misinformation, self-harm concern, other). The report is queued for a moderator with a generated case ID and priority; the reporter's identity is never revealed to the reported party. If action is taken, the affected user is notified (without exposing detection methods or reporter identity) and can appeal to a separate reviewer.

**Why this priority**: Trust & Safety is a stated core objective ("spam, scams and abusive behavior minimize pannanum," §2.8) and reporting/moderation is P0 (§127), but it is correctly sequenced after the content and networking primitives exist, since there must be something reportable first.

**Independent Test**: Can be tested by submitting a report against a seeded test post with a specific reason, verifying a case ID and priority are generated, a moderator actions it, the reported user receives a policy-referenced notification without reporter identity, and the user successfully files and receives a decision on an appeal — independent of feed ranking or gamification.

**Acceptance Scenarios**:

1. **Given** a member reports a post for "Scam or fraud," **When** the report is submitted, **Then** a case ID is created, the report is prioritized into the moderator queue, and the reporter receives a submission confirmation.
2. **Given** a moderator removes a post following a report, **When** the affected author is notified, **Then** the notification includes the policy category, action taken, general reason, and an appeal link — but never the reporter's identity or the specific detection signal.
3. **Given** a user disagrees with a moderation decision, **When** they submit an appeal within the configured window with additional context, **Then** a reviewer different from the original decision-maker is assigned where possible, and the outcome (upheld/modified/reversed) is recorded to an audit trail and communicated to the user.
4. **Given** the same content has already been reported by another user, **When** a second report is submitted for the same object, **Then** the system surfaces the existing case rather than creating an unbounded duplicate queue entry.

---

### User Story 8 - Post A Collaboration/Opportunity Safely Under Scam & Financial-Claim Controls (Priority: P2)

A member creates a Collaboration/Opportunity post (freelance work, job, partnership, internship, etc.) with compensation type, deadline, and contact method, or shares a business win/achievement. The system screens for high-risk scam indicators (guaranteed income, advance-fee requests, crypto pressure, urgent money requests) and enforces the Financial Claim Policy (no guaranteed-result claims, no misleading screenshots, paid-promotion disclosure) before/around publication.

**Why this priority**: This is the concrete expression of "safe financial and health discussions" (§82) and the Financial Claim Policy (§91) and directly protects members from real monetary harm, but it is a specialized sub-flow of post creation (P1) and reporting (P2), so it is appropriately P2.

**Independent Test**: Can be tested by creating an Opportunity post containing a guaranteed-income claim and an advance-fee request, verifying the system flags/holds it for review or displays the identity-verification warning, and separately testing that an achievement post with an unverified earnings claim can be labeled "Unverified result" by an admin — independent of the messaging or groups modules.

**Acceptance Scenarios**:

1. **Given** an Opportunity post requests upfront payment from applicants, **When** it is submitted, **Then** the system surfaces an upfront-payment warning and routes high-risk categories to admin moderation before or shortly after publication.
2. **Given** a member's achievement post includes an income claim, **When** the post lacks verifiable context, **Then** an admin can apply an "Unverified result" label without deleting the underlying post.
3. **Given** a post promotes a product/service for payment, **When** the post is published, **Then** paid-promotion disclosure is required and its absence is treated as a policy violation.
4. **Given** an Opportunity post redirects respondents to an external messaging channel to bypass platform safety controls, **When** automated scam detection evaluates the post, **Then** "external messaging redirection" is treated as a high-risk indicator eligible for flag/hold/limit/verification-request action.

---

### User Story 9 - Moderator Reviews And Actions A Case Through The Console (Priority: P3)

A community moderator or trust-and-safety reviewer opens the Moderator Console, works through a prioritized queue (new reports, automated flags, appeals, suspicious accounts), opens a case screen showing the reported object, context, prior history, and available policy-mapped actions, and issues a decision that is recorded with full audit detail.

**Why this priority**: This is the operational back-office view over capabilities already covered by User Story 7 (reporting) and is essential for scale, but it is a staff-facing tool rather than a member-facing MVP primitive, so it is sequenced as P3 (though the source lists queue/case functionality as required infrastructure).

**Independent Test**: Can be tested by seeding several report cases with varying priority and having a moderator account work the queue end-to-end (open case → view evidence and history → issue a decision with duration/reason → confirm audit record and appeal eligibility flag are set) independent of any specific content-creation flow.

**Acceptance Scenarios**:

1. **Given** multiple open cases exist, **When** a moderator opens the console, **Then** cases are presented in a priority queue distinguishing new reports, automated flags, and appeals.
2. **Given** a moderator opens a case involving a reported direct message, **When** the case screen renders, **Then** private message content is shown only to the extent necessary for the specific investigation (minimum-necessary-access), not the full conversation history by default.
3. **Given** a moderator issues a decision, **When** the decision is saved, **Then** policy category, severity, action, duration, reason, reviewer identity, evidence, and appeal status are all persisted to an immutable audit record.
4. **Given** an automated system flags content as high-risk, **When** the flagged action would be a high-impact permanent action (e.g., permanent ban, permanent content removal), **Then** the action requires human moderator review before being finalized.

---

### Edge Cases

- What happens when abusive or scam language is written in transliterated Tamil/Tanglish rather than English (e.g., romanized slurs or scam phrases) — does simple English keyword-matching fail to catch it, and does the moderation system need dedicated Tamil/Tanglish/mixed-language and context-aware detection (§88)?
- How does the system handle a minor or otherwise vulnerable user given that the platform's minimum age and guardian-consent policy is explicitly not yet finalized ("Age policy product legal review base-la define pannappadanum," §95) — what is the interim safe default for messaging, contact-info visibility, and adult-minor interaction restriction?
- What happens if a reported user attempts to identify their reporter (e.g., by inferring from context or requesting details) — is reporter identity protected as an absolute rule across both the report-submission flow (§84) and the post-decision user notification (§99)?
- How does a moderator's access to a reported private direct message get bounded so that opening a Trust & Safety case does not expose the participants' full unrelated message history beyond the minimum necessary for that investigation (§97, §123)?
- What happens when a user who has been blocked by another member tries to follow, connect with, mention, or message them, or when both users share group co-membership — does the block still suppress visibility and interaction inside the shared group context (§42)?
- What happens when a user opens the external device share sheet for a post but does not complete the share, or repeatedly re-shares the same content — does the share counter avoid incrementing on open-only actions and prevent inflated/duplicate counts (§38.1)?
- What happens to in-progress channel discussions, pinned messages, and files when a group is archived or a member leaves/is removed mid-conversation — is content retained per policy and are notification preferences cleaned up (§63, §64)?
- What happens when votes have already been cast on a poll and the author attempts to edit the poll's options — is the poll structure locked to protect the integrity of already-cast votes (§22, §28)?
- What happens when an achievement/milestone post is system-generated from a private event (e.g., a private course completion) — does it require explicit user confirmation before becoming a public post, and can a private achievement ever auto-publish (§23)?
- What happens when automated moderation produces a false positive on legitimate Tamil/Tanglish content — is there a guaranteed appeal path distinct from the general moderation appeal, and how is the false positive corrected without penalizing the user's reputation (§88, §100)?
- What happens when a push notification or admin "Send Notification" deep link points to a post that has since been deleted or restricted — does the system show a defined fallback screen instead of a broken link or an access error (§80, §106)?
- What happens when a private-group document is shared outside the group (e.g., forwarded link, screenshot) — does the system prevent unauthorized destination sharing and verify recipient access before rendering restricted content (§18, §38.2)?

## Requirements *(mandatory)*

### Feed & Ranking Requirements

- **FR-001**: System MUST support distinct feed types: Personalized feed, Following feed, Latest feed, Group feed, Questions feed, Member Wins feed, Mentor posts feed, Saved posts feed, Organization feed, and Admin announcement feed.
- **FR-002**: System MUST build the Personalized feed from signals including followed users, joined groups, selected interests, learning path, course enrollment, business stage, language preference, prior interactions, saved posts, hidden content, reported content, post freshness, content quality, and trusted-author signals.
- **FR-003**: System MUST rank feed content primarily on relevance, helpfulness, learning value, genuine progress, trusted participation, and timeliness, and MUST NOT rank primarily on raw engagement volume (Constitution Article VIII, "No Pay-to-Win, No Vanity-Metric Optimization").
- **FR-004**: System MUST NOT artificially boost sensational or misleading content in the feed even when it produces high engagement.
- **FR-005**: System MUST apply positive ranking signals (user follows author, same group, same goal, same course, instructor/mentor relevance, helpful votes, accepted answer, meaningful comments, recency, saved-content similarity) and negative ranking signals (user hid the post, user muted the author, repeated duplicate content, clickbait, excessive self-promotion, low trust score, report pattern, engagement manipulation) when computing feed order.
- **FR-006**: System MUST avoid repeated overexposure of the same author, MUST surface discovery opportunities for new members, and MUST reduce low-quality engagement-bait and suppress spam/duplicate content in feed ranking.
- **FR-007**: System MUST provide an optional "Why am I seeing this?" explanation for feed items, presenting the specific applicable reason (e.g., followed author, joined-group post, learning-goal relevance, community-rated helpfulness).
- **FR-008**: System MUST offer Latest and Recommended sort options on the Following feed and MUST NOT include sponsored or unrelated posts in it unless clearly labeled as such.
- **FR-009**: System MUST render the Latest feed in strict chronological order of permitted community posts, with pagination/infinite scroll, duplicate prevention, removal of deleted content, permission-aware filtering, and block/mute filtering.
- **FR-010**: System MUST dynamically prioritize Community Home sections (post composer, announcements, personalized feed, trending discussions, unanswered questions, member wins, suggested groups/members, upcoming events, guidelines reminder) based on user state to avoid dashboard clutter.

### Post Creation & Content Type Requirements

- **FR-011**: System MUST support the following post types, each with independent validation rules and a dedicated display template: text, image, multi-image, video, audio, document, link, question, poll, achievement, business milestone, resource share, event, course-related discussion, job/collaboration opportunity, mentor announcement, and admin announcement.
- **FR-012**: System MUST expose the post composer from Community Home, a group page, course discussion, member profile, a quick-action button, and the mobile center create button, and MUST include avatar, post-type selector, text editor, media upload, link preview, audience selector, group selector, tags, mentions, poll builder, draft handling, preview, and a post/submit control.
- **FR-013**: System MUST validate text posts for minimum meaningful content and enforce a configurable maximum length, while supporting paragraph formatting, mentions, hashtags, links, emojis, Tamil Unicode, Tanglish, line breaks, and draft autosave, and MUST NOT unnecessarily block unsupported scripts or characters.
- **FR-014**: System MUST support rich-text formatting limited to bold, italic, bullet lists, numbered lists, quote, code block, link, and optional heading; System MUST NOT allow raw HTML input and MUST sanitize all rich-text content server-side.
- **FR-015**: System MUST support single/multiple image uploads with approved formats, a configurable file limit, min/max dimensions, compression, orientation correction, crop, alt text, and upload progress, and MUST render images at proper aspect ratio without excessive cropping, with a fullscreen/swipe/zoom viewer, download gated by permission, alt text, and a report-media action.
- **FR-016**: System MUST support video posts with upload, thumbnail generation, playback controls, optional captions, a mute/autoplay policy that is muted-by-default, user-preference-aware, network-aware, and accessibility-aware, fullscreen, duration display, processing-state indication, and failure retry, and MUST NOT expose a direct raw video URL.
- **FR-017**: System MUST support audio posts (voice update, short lesson, feedback, question) with record, upload, playback, duration, optional waveform, speed control, and optional transcript, and MUST request microphone permission with clear context.
- **FR-018**: System MUST support document posts (PDF, spreadsheet, presentation, text document, template) displayed as a card with filename, file type, file size, description, preview, download permission, and virus-scan state, and MUST prevent unauthorized users from accessing private-group documents.
- **FR-019**: System MUST fetch and display link-post metadata (title, description, domain, thumbnail, security reputation check) for a valid URL, allow the user to edit or remove the preview/text, and warn on or block dangerous domains.
- **FR-020**: System MUST support Question posts with title, details, category, tags, group, optional attachment, optional urgency flag, and an anonymous option only where explicitly enabled, and MUST track question state as Open, Answered, Accepted Answer, Closed, or Archived.
- **FR-021**: System MUST distinguish answers from generic comments on Question posts, support answer submission, helpful voting, reply, instructor/mentor badging, sorting by helpful/latest, and report; the question author or an authorized moderator MUST be able to select the accepted answer, and accepted-answer changes MUST be optionally auditable.
- **FR-022**: System MUST support Poll posts with a question, two or more options, single- or multiple-selection mode, end date, anonymous-results option, results-visibility control, and optional option-suggestion, MUST track poll state as Open, Closed, or Cancelled, MUST apply a configurable vote-change policy, and MUST calculate result percentages accurately.
- **FR-023**: System MUST provide dedicated achievement/milestone templates (course completed, certificate earned, first client, revenue milestone, challenge completed, product launched, streak achieved, community contribution), MUST require explicit user confirmation before a system-generated achievement becomes a post, and MUST NOT automatically publish a private achievement as a public post.
- **FR-024**: System MUST support Collaboration/Opportunity posts with opportunity type (freelance, job, partnership, collaboration, internship, volunteer, vendor requirement), title, description, required skills, compensation type, location/remote, deadline, contact method, application link, and verification status.
- **FR-025**: System MUST apply safety controls to Collaboration/Opportunity posts: scam detection, an upfront-payment warning, contact-privacy protection, a report option, a verified-organization badge where applicable, and admin moderation for high-risk categories.
- **FR-026**: System MUST support audience selection per post from public website (where approved), all members, followers, connections, a selected group, course members, program cohort, organization members, or private draft, MUST allow reducing a public post's audience to private, and MUST require confirmation before changing a private post's audience to public; the audience-change policy after publishing MUST be configurable.
- **FR-027**: System MUST support post drafts with autosave, manual save, a draft list, edit, delete, publish, last-saved-time display, and cross-device sync, and MUST preserve draft state through an incomplete media upload.
- **FR-028**: System MUST support post scheduling (publish date, time, timezone, audience, notification option) restricted to admins, mentors, instructors, and approved creators, with edit-before-publish, cancel, preview, and failure-alert capability.
- **FR-029**: System MUST allow an author to edit their own post, displaying an "edited" label and retaining edit history for internal audit, MUST restrict editing a poll's option structure after votes exist, MUST clean up access to removed media, and MUST support a configurable time limit on editing for specific post types.
- **FR-030**: System MUST support post deletion as soft delete (user delete), moderator removal, or admin permanent delete under policy; a user-initiated delete MUST remove the post from feeds, apply the configured comment-handling policy, queue media for cleanup, retain audit metadata, and render previously shared links unavailable.

### Post Display & Engagement Requirements

- **FR-031**: Every feed post card MUST display author avatar, display name, verification/role badge, group/context, timestamp, audience indicator, post content, media, reaction summary, comment count, share count, save control, and a "more" menu offering follow/unfollow, save, copy link, hide, mute author, report, block, owner edit/delete, and moderator actions where authorized.
- **FR-032**: System MUST display relative timestamps in the feed (just now, X minutes/hours ago, yesterday, X days ago) while making the exact date/time accessible in post details, localized to the user's timezone preference.
- **FR-033**: System MUST support reactions (Like, Helpful, Celebrate, Support, Insightful) limited to one primary reaction per user per object, with change, remove, count aggregation, a reaction-list view, blocked-user filtering, and rate limiting, and MUST monitor the reaction system for popularity manipulation.
- **FR-034**: System MUST support comments with text, optional image, link, mention, emoji, reply, reaction, edit, delete, report, and pin (by an authorized role), using pagination or lazy loading.
- **FR-035**: System MUST support nested comment replies with a limited visual nesting depth (deep replies flattened with a "Replying to" indicator), a parent reference, thread count, view/collapse controls, mention-parent-author, and deleted-parent handling.
- **FR-036**: System MUST support comment sorting by most-helpful, latest, and oldest, and MUST allow showing the accepted answer first on Question posts.
- **FR-037**: System MUST support @mentions of members, mentors, instructors, groups, and courses (where appropriate) via relationship-, permission-, block-, and group-membership-aware autocomplete, and MUST restrict mass mentions (e.g., `@everyone`, `@group`, `@cohort`) to authorized admins/moderators only.
- **FR-038**: System MUST support hashtags with Unicode/Tamil/Tanglish support, valid-character rules, search, optional hashtag-follow, trending calculation, abuse moderation, and normalization of duplicate case variations.
- **FR-039**: System MUST support sharing a post inside TBT, to a group, via direct message, by copy-link, and through the device external share sheet.
- **FR-040**: System MUST increment share count only on an actual successful/confirmed share action (internal share record created, or external share-sheet completion that is platform-measurable) and MUST NOT increment the count merely on opening the share menu, and MUST prevent false or duplicate repeated counting.
- **FR-041**: System MUST prevent sharing of private-group or restricted-post content to unauthorized destinations, MUST disable external public links for such content, MUST verify recipient access before rendering it, and MUST display a restricted-content label where applicable.
- **FR-042**: System MUST allow users to save and unsave posts, with optional collections, search within saved posts, filter by type, saved-time display, and private storage, and MUST show an "unavailable" message when a saved post is later deleted or access is revoked.
- **FR-043**: System MUST allow a user to hide a specific post, immediately removing it from their feed, capturing the hide as a ranking-feedback signal, offering undo, and optionally capturing a reason (not interested, repetitive, irrelevant, already seen); hiding MUST NOT itself generate a report.
- **FR-044**: System MUST support muting a user such that the muted user's posts no longer appear in the muter's feed and no notifications are sent to the muter from that user, while preserving any existing follow/connection relationship; direct-message behavior under mute MUST be configurable, and mute MUST support temporary or permanent duration.
- **FR-045**: System MUST support blocking a user such that both profiles become mutually limited, existing follow/connection relationships are removed, new follow attempts are prevented, direct messages are prevented, mentions are prevented, content visibility is reduced, notifications stop, and group co-membership is handled privacy-aware; the blocked user MUST NOT receive explicit notification of being blocked, and a safety-reporting option MUST be offered within the block flow.

### Networking (Follow/Connect) Requirements

- **FR-046**: System MUST implement Following as a one-directional relationship supporting follow, unfollow, a "requested follow" state for private profiles, and cancel-request, and MUST track follower and following counts with mandatory spam rate limits on follow/unfollow actions.
- **FR-047**: System MUST implement Connections as a mutual professional relationship via a request flow (send request with optional note → recipient accepts/declines/ignores → connection created → both connection counts update) with tracked states of not connected, request sent, request received, connected, declined, and blocked.
- **FR-048**: System MUST enforce connection-request controls including a daily limit, a new-account limit, duplicate-request prevention, a block check, an account-restriction check, respect for recipient privacy preference, and consideration of mutual-group/purpose signals, and MUST be able to treat excessive unsolicited connection requests as a spam signal.
- **FR-049**: System MUST present a Connections list per profile showing connected member, headline, skills, connection date, mutual groups, a message call-to-action, and a remove-connection control, searchable/filterable by name, skill, industry, location, and group.
- **FR-050**: System MUST provide Follower and Following lists with search, follow/unfollow controls, connection status, mutual-connection count, block-aware visibility, and MUST respect private-account visibility settings.
- **FR-051**: System MUST provide a Member Directory for professional discovery with member cards (avatar, name, headline, skills, optional location, optional business stage, badges, mutual groups, follow/connect call-to-action), filterable by skill, profession, industry, business stage, location, language, mentor availability, group, and learning path, and MUST provide a privacy setting to opt a user out of directory discoverability.
- **FR-052**: System MUST provide a community-facing member profile view with header, bio, skills, business interests, achievements, posts, questions, helpful answers, groups, connections, followers, badges, and privacy-gated courses/certificates, offering follow, connect, message, share-profile, report, and block actions.
- **FR-053**: System MUST support transparent-rule profile badges (verified member, mentor, instructor, group admin, top contributor, helpful expert, course graduate, founding member, organization verified) and MUST NOT allow a purchased-membership badge to be visually confusable with a trust/verification badge.

### Groups & Channels Requirements

- **FR-054**: System MUST support group types including public, private visible, private hidden, course, cohort, program, organization, mentor, interest, location, and accountability groups.
- **FR-055**: System MUST persist per-group data including group ID, name, slug, description, cover image, icon, group type, visibility, join method, category, tags, language, owner, admins, moderators, member count, post count, rules, status, and created date.
- **FR-056**: System MUST enforce visibility-tier access rules: public groups follow platform-wide visibility policy for members/visitors; private-visible groups are discoverable but content is member-only; private-hidden groups are visible only via invitation or a direct authorized link; course/cohort-restricted groups grant access automatically based on enrollment.
- **FR-057**: System MUST support group join methods of open join, request-approval, invitation-only, course enrollment, program enrollment, organization assignment, membership-plan requirement, and admin grant.
- **FR-058**: System MUST support admin-configurable group join questions (short text, multiple choice, agreement checkbox), and applications MUST include answers, applicant profile, mutual members, risk flags, and an approve/decline decision; sensitive questions MUST be avoided.
- **FR-059**: System MUST support independently configurable group roles of owner, admin, moderator, contributor, member, and read-only member.
- **FR-060**: System MUST render a Group Home with cover/description, join/membership state, rules, announcements, create-post, feed, channels, events, files, members, and about sections.
- **FR-061**: System MUST support group-specific rules with title, description, display order, mandatory-acceptance flag, updated date, and change notification, with optional re-acknowledgment on major rule updates.
- **FR-062**: System MUST allow group admins/moderators to create, pin, set expiry on, notify for, target-audience-scope, and schedule group announcements, categorized as important, event, deadline, rule update, or general.
- **FR-063**: System MUST support group channels (e.g., General, Introductions, Questions, Wins, Resources, Jobs, Accountability, Announcements) with name, description, icon, posting permissions, visibility, order, and archived status per channel.
- **FR-064**: System MUST provide group member-management actions (view members, approve requests, invite, change role, mute, remove, ban, restore, export a permitted list) to authorized roles, and MUST require an audited reason for every removal or ban.
- **FR-065**: System MUST support group invitations via member search, email, invite link, and organization assignment, with invite links supporting expiry, usage limit, revocation, group-visibility check, and audit trail.
- **FR-066**: System MUST support member-initiated group leaving (with confirmation, draft warning, notification-preference cleanup, and rejoin policy) and admin-initiated removal (with reason, duration, appeal option based on severity, and content-retention policy).
- **FR-067**: System MUST support group archiving with a configurable read-only-or-fully-unavailable state, disabling of new posts, retention of existing content, optional export, a reopen permission, and a recorded archive reason.

### Discovery & Search Requirements

- **FR-068**: System MUST support community search across posts, questions, comments, groups, members, hashtags, resources, and events, returning only permission-aware (authorized-visibility) results, filterable by content type, group, author, date, language, hashtag, answered/unanswered status, and media type.
- **FR-069**: System MUST compute trending content from unique meaningful interactions, comment quality, save count, helpful votes, recency, trusted-participant activity, and report rate over configurable periods (today, this week, this month), while preventing like-farms, repeated self-reactions, coordinated manipulation, and bot activity from influencing trending.
- **FR-070**: System MUST provide a Discover page with trending posts, recommended groups, suggested members, popular questions, member wins, upcoming events, followed topics, and new communities, balancing personalization with content diversity.

### Messaging Requirements

- **FR-071**: System MUST restrict direct messaging to professional-conversation, collaboration, mentorship-communication, and supportive-networking use, and MUST NOT allow it to be used as a dating or unsolicited-promotional channel.
- **FR-072**: System MUST allow each user to configure who may message them (everyone, members they follow, connections only, same groups only, nobody, or mentor-clients-only in mentor context), and MUST keep admin/support transactional messages on a separate channel from these preferences.
- **FR-073**: System MUST route a first message from a non-connected sender into a message-request folder for the recipient, who may accept, decline, block, or report; the sender MUST be limited in pre-acceptance message count, and media/links before acceptance MUST be restrictable.
- **FR-074**: System MUST support message types of text, image, file, audio, link, post share, profile share, event share, course share, and system message.
- **FR-075**: System MUST render a chat screen with conversation header, participant status, a safety menu, message history, typing indicator, read status, composer, attachment, voice input, shared context, and block/report controls.
- **FR-076**: System MUST track message status as sending, sent, delivered, read, failed, or deleted, with read receipts governed by the recipient's configurable privacy preference.
- **FR-077**: System MUST support message editing within a configurable time window (with an "edited" label and original-version audit restricted to safety-authorized access), and message deletion as delete-for-me, unsend-for-everyone within a time window, or moderator safety retention per policy.
- **FR-078**: System MUST secure message attachments with file scanning, MIME validation, signed URLs, size limits, dangerous-file blocking, private storage, and expiring preview links.
- **FR-079**: System MUST support group chat for program cohorts, accountability teams, mentor groups, and organization teams, with member list, admin controls, mentions, pinned messages, files, mute, leave, and report, while steering large communities toward feed/channel usage rather than unlimited large-scale chat.
- **FR-080**: System MUST monitor messaging anti-spam signals (high message volume, repeated identical text, many new recipients, link-heavy requests, report rate, new-account behavior, block rate) and MUST be able to respond with cooldown, message-request limits, link restriction, CAPTCHA, temporary messaging restriction, or a review queue.

### Notifications Requirements

- **FR-081**: System MUST generate community notifications for reaction, comment, reply, mention, follow, connection request, connection accepted, group invite, group approval, message, accepted answer, helpful answer, announcement, moderation action, post shared, and event reminder events.
- **FR-082**: System MUST group related notifications (e.g., "Arun and 8 others reacted to your post") reducing duplicates, MUST support grouped-actor display, deep links, read/unread state, priority, expiry, and MUST re-check permission at open time (not only at generation time).
- **FR-083**: System MUST route a tapped push notification to the correct destination (post, comment, message, group, event, member profile, or moderation appeal) and MUST show a defined fallback screen when the target resource is deleted or unavailable.
- **FR-084**: System MUST provide per-category notification preference controls (reactions, comments, mentions, follows, connections, groups, messages, announcements, recommendations, safety) across in-app, push, and email channels, and MUST NOT allow safety notifications to be disabled.

### Moderation & Reporting Requirements

- **FR-085**: System MUST publish community guidelines covering respect for others, no harassment, no hate, no scams, no misleading income claims, no spam, no unauthorized promotion, no impersonation, respect for privacy, respect for copyright, safe financial/health discussions, and no illegal content, available in Tamil, Tanglish, and English.
- **FR-086**: System MUST allow users to report a post, comment, message, profile, group, event, opportunity, or media item, selecting from reasons spam, scam/fraud, harassment, hate, threat, sexual content, illegal activity, impersonation, privacy violation, copyright, misinformation, self-harm concern, or other.
- **FR-087**: System MUST process report submission through: object/reason selection, optional detail entry, an optional block/mute suggestion, submission, confirmation, internal case-ID creation, priority classification, and placement into the moderator queue.
- **FR-088**: System MUST NOT reveal reporter identity to the reported user at any stage of the reporting or notification flow.
- **FR-089**: System MUST support moderation actions ranging from no action, warning, content label, reduce distribution, remove content, disable comments, temporary posting restriction, messaging restriction, group removal, temporary suspension, and permanent ban, up to law-enforcement escalation where legally required.
- **FR-090**: System MUST track content status as published, processing, under review, limited distribution, removed by author, removed by moderator, restored, archived, or legally restricted.
- **FR-091**: System MUST run automated detection for spam, repeated links, abusive words, scam patterns, contact harvesting, dangerous files, impersonation patterns, mass messaging, and manipulated engagement, and MUST limit automated systems to flag, hold, limit, or request-verification actions; high-impact permanent actions MUST generally require human review.
- **FR-092**: System MUST enforce spam-prevention controls including new-user posting limits, link limits, duplicate-content detection, CAPTCHA, email/mobile verification, rate limiting, reputation-based limits, community-specific approval, and suspicious-domain blocking.
- **FR-093**: System MUST evaluate high-risk scam indicators (guaranteed income, advance-fee requests, personal-bank-detail requests, crypto-investment pressure, fake jobs, fake mentors, impersonated brands, external-messaging redirection, urgent money requests) and MUST surface an identity-verification warning before financial or personal-financial detail exchange is encouraged.
- **FR-094**: System MUST provide an impersonation-report workflow requiring identification of the impersonated person/organization, evidence, ownership verification, and an existing-verified-profile check, with available actions of profile review, username freeze, badge removal, account restriction, content removal, and appeal.
- **FR-095**: System MUST provide a copyright-complaint workflow requiring rights-holder details, work identification, infringing-content URL, declaration, contact information, a counter-notice process where applicable, and audit/legal retention, kept operationally separate from the normal content-report flow.
- **FR-096**: System MUST provide member safety tools of block, mute, restrict message requests, hide posts, report, leave group, privacy controls, manage mentions, optional disable-read-receipts, and download-account-data.
- **FR-097**: System MUST provide a Moderator Console with a priority queue, new reports, automated flags, appeals, suspicious accounts, spam campaigns, group incidents, message safety reports, resolved cases, and policy updates.
- **FR-098**: System MUST render a Moderation Case screen showing the reported object, context, reporter reason, previous reports, user history, related content, automated signals, policy reference, available actions, reviewer notes, decision, and appeal eligibility, and MUST display sensitive private-message content on a minimum-necessary-access basis.
- **FR-099**: Every moderation decision MUST record policy category, severity, action, duration, reason, reviewer, evidence, user notification, appeal status, and an audit record.
- **FR-100**: System MUST notify the affected user of a moderation action with the content/action affected, policy category, action duration, general reason, an appeal option, and a support link, and MUST NOT reveal internal detection methods or reporter identity in that notification.
- **FR-101**: System MUST provide an appeal flow: eligible user opens an appeal, submits a reason, provides additional context, is assigned a reviewer separate from the original decision-maker where possible, receives a decision (uphold, modify, or reverse), is notified of the outcome, and the audit record is updated; the appeal time window MUST be configurable.
- **FR-102**: System MUST support an optional graduated strike model (warning, strike 1, strike 2, final strike, suspension, ban) with configurable strike expiry by policy category, while allowing severe violations to trigger immediate suspension or ban outside the graduated sequence.

### Trust & Safety / Financial Claim Policy Requirements

- **FR-103**: System MUST allow members to share business success but MUST NOT permit guaranteed-result claims, misleading screenshots, or earnings promises presented without context, and MUST require disclosure of paid promotion (Constitution Article III, "No Dark Patterns, No Guaranteed-Outcome Claims").
- **FR-104**: System MUST allow an admin to apply an "Unverified result" label to a financial-claim post without requiring content removal.
- **FR-105**: System MUST NOT allow admin-verified financial results and unverified/self-reported claims to be visually indistinguishable to viewers.

### Language-Aware Moderation Requirements

- **FR-106**: System MUST support moderation detection and review across Tamil, Tanglish, English, and mixed-language content, including common transliterated abusive terms and context-aware expressions, and MUST NOT rely on simple English keyword blocking alone (Constitution: Localization & Language Requirements).
- **FR-107**: System MUST provide appeal support specifically for false-positive language-moderation flags.

### Reputation & Gamification Interop Requirements

- **FR-108**: System MUST derive community reputation from positive signals including helpful answers, accepted answers, constructive comments, completed profile, verified identity, consistent participation, and low report rate, and MUST use reputation for use cases including increased posting limits, contributor badges, group-moderation eligibility, and improved discovery, without requiring the exact reputation score to be publicly displayed.
- **FR-109**: System MUST support awarding community points for actions such as helpful answers, accepted answers, valid resource shares, challenge support, and group contribution, and MUST NOT reward raw post quantity, empty comments, reaction farming, or spam invites; detailed point-ledger mechanics are governed by the gamification feature (see Assumptions).

### Admin Community Management Requirements

- **FR-110**: System MUST provide an admin community dashboard reporting active community users, posts per day, comments per day, questions answered, response time, group activity, reports, removal rate, spam rate, connection requests, message requests, member retention, and community-driven learning actions.
- **FR-111**: System MUST provide admin post management with a filterable/sortable list (author, preview, type, audience, group, status, reports, reactions, comments, created date) and actions including view, edit policy label, pin, feature, limit, remove, restore, lock comments, send notification, and view audit history.
- **FR-112**: System MUST provide an admin "Send Notification" action on a post with configurable title, body, audience (all members, specific membership, specific group, course learners, program cohort, language, role, or selected users), channels, schedule, deep-link target, preview, and estimated recipient count, and the resulting notification tap MUST open the exact post detail page or a defined fallback if the post is deleted/restricted.
- **FR-113**: System MUST provide admin group management functions: create, edit, configure visibility, assign owner, assign moderators, manage join policy, configure channels, pin announcements, archive, suspend, delete, and export allowed data.
- **FR-114**: System MUST provide admin member-management actions (view profile, view community history, view reports, view warnings, restrict posting, restrict messaging, suspend, ban, restore, add note, assign badge, remove badge) under role-based permission with mandatory audit logging.
- **FR-115**: System MUST provide admin comment management: search, filter reported comments, view parent post, remove, restore, lock thread, warn user, and apply restriction.
- **FR-116**: System MUST allow admins to feature a post, question, member win, group, member, or event with configurable placement, start/end date, audience, priority, label, and reason, and MUST clearly label paid promotional featured content.
- **FR-117**: System MUST support pinning content at global-community, group, channel, course-discussion, and organization scope, with a configurable maximum pinned count.

### Analytics Requirements

- **FR-118**: System MUST emit community analytics events including community_viewed, feed_viewed, post_composer_opened, post_created, post_viewed, post_edited, post_deleted, post_reacted, comment_created, reply_created, post_saved, post_shared, post_hidden, user_followed, connection_requested, connection_accepted, group_joined, group_left, message_request_sent, message_sent, content_reported, and user_blocked.
- **FR-119**: System MUST track per-post analytics of impressions, unique viewers, detail opens, read duration, video watch, reactions, comments, saves, shares, follows generated, reports, and hide rate, and MUST present these to the author as a privacy-safe summary.
- **FR-120**: System MUST track per-group analytics of member growth, active members, posts, comments, questions, answer rate, event attendance, retention, reports, top topics, and moderator response time.
- **FR-121**: System MUST track community health indicators including percentage of posts receiving meaningful response, median question response time, new-member first response, helpful-answer rate, report rate, block rate, spam rate, member retention, cross-member interaction diversity, and moderator backlog.

### Security, Privacy, Accessibility & Localization Requirements

- **FR-122**: System MUST enforce server-side permission checks, input sanitization, secure media uploads with malware scanning, signed media access, rate limiting, anti-CSRF, XSS prevention, link reputation checks, message authorization, private-group isolation, audit logging, moderator permission isolation, sensitive-data masking, and abuse-detection monitoring.
- **FR-123**: System MUST isolate private-group content, respect block relationships throughout the platform, anonymize deleted-user identity per policy, provide a member-directory opt-out, hide contact details by default, avoid using message contents for unnecessary analytics, restrict moderator access to a minimum-necessary basis, and keep public-profile visibility and community visibility as separate controls.
- **FR-124**: System MUST meet accessibility requirements including keyboard-accessible feed, screen-reader post labels, image alt text, video captions, audio transcript support, accessible reaction controls, comment focus management, a clear report flow, non-color status indicators, reduced-motion support, accessible message announcements, and poll-selection labels.
- **FR-125**: System MUST support the community interface in Tamil, Tanglish, and English with Unicode hashtags, mixed-language search, localized timestamps, localized moderation reasons, Tamil-friendly line breaking, optional clearly-labeled automatic translation of user content, and permanent access to the original content.

### Performance & Real-Time Requirements

- **FR-126**: System MUST implement cursor-based feed pagination with infinite-scroll duplicate prevention, optimistic reaction updates, comment lazy loading, media CDN delivery, thumbnail generation, background video processing, notification batching, search indexing, permission-aware caching, and partial-component-failure isolation, and MUST display first meaningful feed content quickly.
- **FR-127**: System MUST deliver new messages, typing indicators, read receipts, optional new-comment updates, reaction-count updates, notification counts, group announcements, and moderation removals in real time, with retry and reconciliation logic after connection interruption.
- **FR-128**: System MUST support offline/low-network mobile use via cached feed items, draft post/comment persistence, offline saved items, a pending-reaction queue, pending-post-upload indication, and a retry manager, MUST require network confirmation before finalizing a post publish with large media, and MUST prevent duplicate submission.

### Key Entities

- **Community Post**: A published or draft content item of a specific post type (text, image, video, audio, document, link, question, poll, achievement, opportunity, etc.) with author, audience, group/context, status, timestamps, and engagement aggregates.
- **Post Media**: Uploaded image/video/audio/document assets attached to a post, with processing state, dimensions/duration, alt text, and virus-scan status.
- **Post Link Preview**: Fetched metadata (title, description, domain, thumbnail, security reputation) for a link post.
- **Post Audience**: The visibility scope assigned to a post (public, all members, followers, connections, group, course members, cohort, organization, private draft) and its change history.
- **Post Draft**: An unpublished, autosaved or manually saved in-progress post, including partial media upload state.
- **Post Reaction**: A single user's reaction (like/helpful/celebrate/support/insightful) to a post or comment, one primary reaction per user per object.
- **Comment**: A reply to a post, distinguished as an "Answer" on Question posts, supporting text/image/link/mention, edit, delete, report, pin, and nested replies.
- **Comment Reaction**: A reaction attached to a comment.
- **Question**: A specialized post subtype carrying category, tags, urgency, and a state machine (Open/Answered/Accepted/Closed/Archived).
- **Accepted Answer**: The comment/answer designated by the question author or moderator as the accepted resolution, with optional change audit.
- **Poll / Poll Option / Poll Vote**: A poll post's configuration (question, options, selection mode, end date, anonymity, results visibility) and the individual member votes cast against it.
- **Hashtag / Post Hashtag**: A normalized tag entity and its association to posts, supporting Unicode/Tamil/Tanglish, search, and trending computation.
- **Mention**: A reference from a post/comment/message to a member, mentor, instructor, group, or course, subject to relationship/permission/block/membership-aware resolution.
- **Saved Post**: A user's private bookmark of a post, optionally organized into collections.
- **Hidden Post**: A record of a user hiding a specific post from their own feed, with optional reason and ranking-feedback value.
- **Follow**: A one-directional relationship from one member to another (or to a mentor/instructor/organization).
- **Connection Request / Connection**: A mutual-relationship request with lifecycle states (sent/received/accepted/declined/blocked) and the resulting bidirectional Connection record.
- **Group**: A community sub-space with type, visibility, join method, roles, rules, channels, and membership.
- **Group Member / Group Role**: A member's membership record within a group and their assigned role (owner/admin/moderator/contributor/member/read-only).
- **Group Rule**: A group-specific guideline with acceptance/acknowledgment tracking.
- **Group Channel**: A topic-scoped sub-space within a group with its own posting permissions and visibility.
- **Group Invitation**: An invitation to join a group via search, email, or link, with expiry/usage-limit/revocation tracking.
- **Direct Conversation / Conversation Participant**: A messaging thread and its participants, including message-request state.
- **Message**: An individual message within a conversation, with type, status (sending/sent/delivered/read/failed/deleted), and edit/delete history.
- **Message Attachment**: A file/media/link attached to a message, subject to scanning, MIME validation, and signed/expiring access.
- **Message Request**: The pending, capped-interaction state of a first message from a non-eligible sender pending recipient accept/decline/block/report.
- **Notification**: A generated event (reaction, comment, mention, follow, moderation action, etc.) with grouping, deep link, read state, priority, and expiry.
- **Report**: A user-submitted complaint against an object (post/comment/message/profile/group/event/opportunity/media) with reason, optional detail, case ID, priority, and reporter-identity protection.
- **Moderation Case**: The internal review record aggregating a report/automated flag, evidence, history, and available actions for a moderator.
- **Moderation Action / Moderation Decision**: The recorded outcome of a moderation case (policy category, severity, action, duration, reason, reviewer, evidence, notification, appeal status).
- **Appeal**: A user's contest of a moderation decision, with reviewer assignment, additional context, and outcome (uphold/modify/reverse).
- **Strike**: An optional graduated trust-and-safety record (warning through final strike/suspension/ban) with category-based expiry.
- **User Block**: A record that a member has blocked another, suppressing mutual visibility and interaction platform-wide.
- **User Mute**: A record that a member has muted another (posts/notifications suppressed) without altering follow/connection state.
- **Community Badge**: A transparent-rule profile badge (verified member, mentor, instructor, group admin, top contributor, helpful expert, course graduate, founding member, organization verified), visually distinct from purchased-membership badges.
- **Trust Signal**: An internal reputation/risk input (report pattern, low trust score, verified identity, consistent participation) feeding ranking, posting limits, and moderation prioritization.
- **Audit Log**: The immutable record of moderation, admin, and safety-relevant actions (actor, reason, evidence, timestamp, appeal status).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A member can identify why any given post appears in their feed via the "Why am I seeing this?" control, with an accurate, specific reason shown for effectively all ranked items (not a generic fallback message).
- **SC-002**: Sensational or misleading high-engagement content does not outrank genuinely relevant/helpful lower-engagement content in personalized feed ordering, verified by audit sampling against the stated positive/negative ranking signals.
- **SC-003**: The share counter increments only for confirmed successful share actions; opening the share menu without completing a share produces zero count increment, with no observed duplicate/inflated counts in audit sampling.
- **SC-004**: Every moderation decision that affects a user is traceable end-to-end through an audit record containing actor, policy category, evidence, reason, timestamp, and appeal status, with 100% of decisions carrying these fields.
- **SC-005**: Reporter identity is never exposed to a reported party in any moderation notification or case artifact, verified across the reporting, decision-notification, and appeal flows.
- **SC-006**: High-impact permanent moderation actions (permanent ban, permanent content removal) are not taken by automated systems without a human review step, across all automated-flag pathways.
- **SC-007**: A non-connected sender's first message to a gated recipient always lands in the message-request folder (never the primary inbox) prior to recipient acceptance, verified against each of the five message-permission settings.
- **SC-008**: Blocked users cannot follow, connect with, message, or mention the blocking user, and this holds even where both users share group co-membership, verified across all listed block effects.
- **SC-009**: Community health indicators (report rate, spam rate, block rate, helpful-answer rate, median question response time, moderator backlog) are continuously measurable from emitted analytics events without requiring ad hoc data extraction.
- **SC-010**: Content in Tamil, Tanglish, English, and mixed-language form is evaluated by moderation detection with materially better recall on transliterated abusive/scam terms than a simple English-keyword-only baseline, with a working appeal path for language-related false positives.

## Assumptions

- This spec covers the community/social/networking/messaging/moderation surface of Volume 05 only. Detailed database schema is deferred to Volume 14 (per source §116) and detailed API endpoint contracts to Volume 15 (per source §117) — this spec defines behavior and data-entity shape, not wire formats.
- Community Points and detailed gamification mechanics (levels, streaks, leaderboards, full point-ledger rules) are explicitly deferred to the Gamification feature (specs/006-gamification-rewards, source Volume 06, referenced at source §103); this spec only requires that community actions be capable of emitting point-eligible signals and that vanity actions (raw post count, empty comments, reaction farming, spam invites) are excluded from reward eligibility, consistent with Constitution Article VIII.
- Mentor and Instructor badges, mentor-client-only messaging context, and mentor-announcement post handling intersect with the Mentor Marketplace feature (specs/007-mentor-marketplace, source Volume 07); this spec treats mentor/instructor status as an externally-supplied role signal rather than defining mentor onboarding/verification itself.
- Course-related discussion posts, course groups/cohort groups, and course-enrollment-driven group access intersect with the Learning Management System feature (specs/004-learning-management-system, source Volume 04); this spec treats course/cohort/enrollment state as an externally-supplied signal.
- Community events integration (event posts, event share, community event feed inputs) intersects with the Events feature (specs/010-events-webinars-live, source Volume 10); this spec treats events as a referenced entity, not a fully modeled one.
- The minimum age policy and guardian-consent requirements for minors (§95) are explicitly stated in the source as pending legal review and are flagged with `[NEEDS CLARIFICATION: age policy and guardian-consent mechanics not finalized in source — legal review pending]`; this spec assumes an interim conservative default of restricted messaging/contact-visibility for any account flagged as a minor until that policy is finalized.
- Where the source states a control is "configurable" (e.g., text length limits, appeal windows, mute duration, edit time windows, strike expiry, maximum pinned count, message pre-acceptance limit) without specifying the exact value, this spec treats the configurability itself as the requirement and defers exact default values to implementation planning, since the source does not commit to specific numbers.
- Server-authoritative enforcement of all role/permission checks (group roles, moderator actions, blocking effects) is assumed per Constitution Article I and Article VII, even where the source describes only the user-facing behavior.
- AI-assisted feed ranking and AI-assisted automated moderation, where used, are assumed to be assistive/advisory with human review for high-impact actions per Constitution Article II; this spec does not assume any specific AI/ML technique, consistent with the source not naming one.
- "Volume 15" and "Volume 14" references from the source (§116, §117) refer to database schema and API documentation that fall outside this spec's numbered feature range in the current manifest; this spec does not attempt to originate those artifacts.
