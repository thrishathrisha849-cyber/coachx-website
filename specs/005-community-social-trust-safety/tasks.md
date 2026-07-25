---
description: "Task list for Feature 005 — Community, Social Networking, Messaging & Trust and Safety"
---

# Tasks: Community, Social Networking, Messaging & Trust and Safety

**Input**: Design documents from `/specs/005-community-social-trust-safety/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Features 001–004's Foundational phases complete** (RBAC/audit-log from 001, Consent from 002, Auth/Profile from 003, content-review-workflow pattern reference from 004).

**Tests**: Included throughout — this is a constitution-cited source feature for Article VIII (share-count integrity, no vanity-metric ranking) and the primary implementer of the Localization & Language Requirements section; the feed-ranking, reporter-anonymity, and block-effect guarantees get dedicated Foundational contract tests.

**Organization**: Tasks are grouped by user story (US1–US9 from spec.md), plus two supplementary cross-cutting phases (Post Engagement & Safety Controls; Discovery & Search + Reputation/Gamification Interop) covering FR groups that don't map to a single story — the same pattern established in 003's Profile Management and 004's Discovery/Analytics phases.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`–`004`'s Foundational phases are deployed (RBAC, audit-log interceptor, Consent Record, Auth/Profile/Account-Status, LMS content-review-workflow pattern for reference)
- [ ] T002 Resolve `research.md` open items before proceeding: real-time transport choice, language-aware moderation/NLP approach, link-reputation service, interim minor/guardian-consent default (flagged NEEDS CLARIFICATION pending legal review), and numeric defaults for every "configurable" control
- [ ] T003 [P] Add `backend/src/modules/{social-post,social-qa,social-feed,social-network,social-groups,social-discovery,social-messaging,social-notifications,trust-safety-community,social-reputation,social-admin}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Define post-domain entities — Community Post, Post Media, Post Link Preview, Post Audience, Post Draft, Post Reaction, Comment, Comment Reaction, Hashtag/Post Hashtag, Mention — in `backend/src/modules/social-post/` (FR-011, FR-031, FR-033–FR-038 field sets)
- [ ] T005 Define `Question`, `Accepted Answer`, `Poll`/`Poll Option`/`Poll Vote` entities in `backend/src/modules/social-qa/` (FR-020, FR-022)
- [ ] T006 Define `Follow`, `Connection Request`/`Connection` entities in `backend/src/modules/social-network/` (FR-046, FR-047)
- [ ] T007 Define `Group`, `Group Member`/`Group Role`, `Group Rule`, `Group Channel`, `Group Invitation` entities in `backend/src/modules/social-groups/` (FR-054, FR-055, FR-059, FR-061, FR-063, FR-065)
- [ ] T008 Define `Direct Conversation`/`Conversation Participant`, `Message`, `Message Attachment`, `Message Request` entities in `backend/src/modules/social-messaging/` (FR-074–FR-078)
- [ ] T009 [P] Define `Saved Post`, `Hidden Post`, `User Block`, `User Mute` entities in `backend/src/modules/{social-post,social-network}/` (FR-042–FR-045)
- [ ] T010 [P] Define `Notification` entity in `backend/src/modules/social-notifications/` (FR-081)
- [ ] T011 Define `Report`, `Moderation Case`, `Moderation Action`/`Moderation Decision`, `Appeal`, `Strike` entities in `backend/src/modules/trust-safety-community/` (FR-086, FR-089, FR-098, FR-099, FR-101, FR-102), extending `001`'s audit-log pattern for decision records
- [ ] T012 [P] Define `Community Badge`, `Trust Signal` entities in `backend/src/modules/social-reputation/` (FR-108)
- [ ] T013 Implement the feed-ranking engine base: positive/negative signal application and the "Why am I seeing this?" explainability contract in `backend/src/modules/social-feed/feed-ranking.service.ts` (FR-002–FR-007)
- [ ] T014 Implement the rich-text sanitization service (strip raw HTML server-side, allow only the approved formatting subset) in `backend/src/common/rich-text-sanitizer.service.ts` (FR-014) — placed in `common/` as a generically reusable capability per plan.md's Structure Decision
- [ ] T015 Note: group-role and moderator-permission enforcement reuses `001`'s `RbacGuard` directly — no new permission engine is created here (FR-059, FR-114, Constitution Article VII)
- [ ] T016 Contract test: feed ranking never places raw-engagement-volume above the stated relevance/helpfulness signals in `backend/tests/contract/feed-no-engagement-bias.contract.test.ts` (FR-003, FR-004, SC-002)
- [ ] T017 Contract test: reporter identity is never exposed to the reported party across submission, decision-notification, and appeal flows in `backend/tests/contract/reporter-anonymity.contract.test.ts` (FR-088, SC-005)
- [ ] T018 Contract test: blocked-user interaction prevention holds across follow/connect/message/mention and inside shared group co-membership in `backend/tests/contract/block-effects.contract.test.ts` (FR-045, SC-008)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — View a Personalized, Explainable Feed (P1) 🎯 MVP

**Independent Test**: Seed a test account with follows, group memberships, and interests; load the feed; verify returned posts are explainable via "Why am I seeing this?" without requiring messaging, groups management, or moderation to be built.

- [ ] T019 [US1] Personalized feed signal aggregator (follows, groups, interests, learning path, course enrollment, business stage, language, prior interactions, saved/hidden/reported content, freshness, quality, trusted-author signals) in `backend/src/modules/social-feed/personalized-feed.service.ts` (FR-002, acceptance scenario 1)
- [ ] T020 [US1] Anti-engagement-bait ranking enforcement (clickbait/low-trust-score content is not artificially boosted) in `backend/src/modules/social-feed/feed-ranking.service.ts` (FR-004, acceptance scenario 2)
- [ ] T021 [US1] Hide/mute filtering applied consistently across Personalized, Following, and Latest feeds in `backend/src/modules/social-feed/feed-filter.service.ts` (FR-009, acceptance scenario 3)
- [ ] T022 [US1] "Why am I seeing this?" explanation endpoint surfacing the specific applicable reason, wired to T013 in `backend/src/modules/social-feed/feed-explainability.service.ts` (FR-007, acceptance scenario 4)
- [ ] T023 [P] [US1] Following feed (Latest/Recommended sort, no unlabeled sponsored content) in `backend/src/modules/social-feed/following-feed.service.ts` (FR-008)
- [ ] T024 [P] [US1] Latest feed (strict chronological order, pagination/infinite scroll, dedup, deleted-content removal, permission-aware filtering) in `backend/src/modules/social-feed/latest-feed.service.ts` (FR-009)
- [ ] T025 [US1] Community Home dynamic section prioritization (composer, announcements, feed, trending, unanswered questions, wins, suggestions, events, guidelines reminder) in `web/src/app/(member)/community/page.tsx` (FR-010)
- [ ] T026 [US1] Web: My Feed with "Why am I seeing this?" control in `web/src/app/(member)/community/feed/page.tsx` (FR-001, FR-007)
- [ ] T027 [US1] Integration test: personalized-feed composition, anti-boost verification, hide/mute suppression, explainability accuracy in `backend/tests/integration/us1-feed.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: The primary community entry surface is independently functional.

---

## Phase 4: User Story 2 — Create and Publish a Post (P1)

**Independent Test**: Open the composer, create one post of each supported type, confirm it renders on the feed and profile, and verify drafts persist across a session interruption.

- [ ] T028 [US2] Post composer (avatar, type selector, text editor, media upload, link preview, audience selector, group selector, tags, mentions, poll builder, draft handling, preview) in `web/src/components/community/post-composer.tsx` (FR-012)
- [ ] T029 [US2] Text-post validation (min content, configurable max length, formatting, mentions/hashtags/links/emoji, Tamil Unicode/Tanglish support, draft autosave) in `backend/src/modules/social-post/text-post.service.ts` (FR-013, acceptance scenario 1)
- [ ] T030 [US2] Rich-text sanitization applied at post-save time using T014's shared sanitizer in `backend/src/modules/social-post/text-post.service.ts` (FR-014, acceptance scenario 3)
- [ ] T031 [P] [US2] Image post handling (upload/format/dimensions/compression/crop/alt-text, fullscreen/swipe/zoom viewer, permission-gated download) in `web/src/components/community/image-post.tsx` (FR-015)
- [ ] T032 [P] [US2] Video post handling (upload/thumbnail/playback/captions/muted-autoplay-policy/duration/processing-state/retry, no raw URL exposure) in `web/src/components/community/video-post.tsx` (FR-016)
- [ ] T033 [P] [US2] Audio post handling (record/upload/playback/waveform/speed/transcript, explicit mic-permission request) in `web/src/components/community/audio-post.tsx` (FR-017)
- [ ] T034 [P] [US2] Document post handling (card display, preview, download permission, virus-scan state, private-group access protection) in `web/src/components/community/document-post.tsx` (FR-018)
- [ ] T035 [P] [US2] Link post metadata fetch (title/description/domain/thumbnail/security-reputation check, editable preview, dangerous-domain warning/block) in `backend/src/modules/social-post/link-preview.service.ts` (FR-019)
- [ ] T036 [P] [US2] Poll post builder (2+ options, single/multi-select, end date, anonymity, results-visibility, vote-change policy, accurate percentage calculation) with post-vote option-editing lock in `backend/src/modules/social-qa/poll.service.ts` (FR-022, edge case: poll locked after votes cast)
- [ ] T037 [P] [US2] Achievement/milestone post templates with explicit user confirmation before publish — a private achievement is never auto-published — in `backend/src/modules/social-post/achievement.service.ts` (FR-023, edge case)
- [ ] T038 [US2] Draft persistence through incomplete media upload, with autosave/manual-save/list/edit/delete/cross-device sync in `backend/src/modules/social-post/post-draft.service.ts` (FR-027, acceptance scenario 2)
- [ ] T039 [US2] Post-audience selection and change-confirmation rules (private-to-public requires confirmation; configurable audience-change policy) in `backend/src/modules/social-post/post-audience.service.ts` (FR-026, acceptance scenario 4)
- [ ] T040 [P] [US2] Post scheduling (publish date/time/timezone/audience/notification), restricted to admins/mentors/instructors/approved creators in `backend/src/modules/social-post/post-scheduling.service.ts` (FR-028)
- [ ] T041 [US2] Post editing (edited label, edit history, poll-option-lock-after-votes, media cleanup, configurable time limit) in `backend/src/modules/social-post/post-edit.service.ts` (FR-029)
- [ ] T042 [US2] Post deletion (soft user-delete, moderator removal, admin permanent delete) with feed removal, comment-handling policy, media cleanup, audit retention, dead-link handling in `backend/src/modules/social-post/post-delete.service.ts` (FR-030)
- [ ] T043 [US2] Integration test: Tamil-Unicode text-post publish, draft persistence through an interrupted upload, server-side HTML sanitization, private-group audience enforcement in `backend/tests/integration/us2-post-creation.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: Content creation independently functional — the second foundational primitive.

---

## Phase 5: User Story 3 — Ask a Question and Get a Community-Vetted Accepted Answer (P1)

**Independent Test**: Post a question, submit two candidate answers from different accounts, accept one, and verify state transitions and accepted-answer distinction.

- [ ] T044 [US3] Question post type (title/details/category/tags/group/attachment/urgency/anonymous-option) with state machine Open → Answered → Accepted → Closed → Archived in `backend/src/modules/social-qa/question.service.ts` (FR-020)
- [ ] T045 [US3] Answer-vs-comment distinction on Question posts (visually distinguished, helpful voting, reply, sort by helpful/latest) in `backend/src/modules/social-qa/answer.service.ts` (FR-021, acceptance scenario 1)
- [ ] T046 [US3] Accepted-answer selection (by the question author or an authorized moderator) with state transition and first-sort placement in `backend/src/modules/social-qa/accepted-answer.service.ts` (FR-021, acceptance scenario 2)
- [ ] T047 [P] [US3] Mentor/instructor answer badging, sourced as an external role signal from `007`/`004` per plan.md in `backend/src/modules/social-qa/answer.service.ts` (FR-021, acceptance scenario 3)
- [ ] T048 [US3] Unanswered-questions surfacing on Community Home in `web/src/app/(member)/community/page.tsx` (FR-010, acceptance scenario 4)
- [ ] T049 [US3] Integration test: answer distinction, accepted-answer state transition, mentor badging, unanswered-questions surfacing in `backend/tests/integration/us3-question-answer.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: The community's #1 stated objective (getting help) is independently functional.

---

## Phase 6: User Story 4 — Follow and Connect With Other Members (P1)

**Independent Test**: Account A follows Account B (one-directional); Account A sends a connection request to Account C that C accepts; verify counts and the mutual Connections list.

- [ ] T050 [US4] One-directional Follow (follow/unfollow, requested-follow for private profiles, cancel-request, follower/following counts, spam rate limits) in `backend/src/modules/social-network/follow.service.ts` (FR-046, acceptance scenario 1)
- [ ] T051 [US4] Connection request flow (send-with-note → accept/decline/ignore → connection created → counts update) in `backend/src/modules/social-network/connection.service.ts` (FR-047, acceptance scenario 2)
- [ ] T052 [US4] Connection-request controls (daily limit, new-account limit, duplicate prevention, block/restriction check, spam-signal detection) in `backend/src/modules/social-network/connection-limits.service.ts` (FR-048, acceptance scenario 3)
- [ ] T053 [US4] Block-prevents-follow/connect enforcement, wired to T018's block-effects contract in `backend/src/modules/social-network/follow.service.ts` (FR-045, acceptance scenario 4)
- [ ] T054 [P] [US4] Connections list (headline/skills/date/mutual groups/message CTA/remove) in `web/src/app/(member)/community/profile/[username]/connections/page.tsx` (FR-049)
- [ ] T055 [P] [US4] Follower/Following lists with block-aware, privacy-respecting visibility in `web/src/app/(member)/community/profile/[username]/{followers,following}/page.tsx` (FR-050)
- [ ] T056 [P] [US4] Member Directory (filterable professional discovery, opt-out setting) in `web/src/app/(member)/community/directory/page.tsx` (FR-051)
- [ ] T057 [US4] Community-facing member profile view (header/bio/skills/achievements/posts/questions/answers/groups/connections/badges, privacy-gated) in `web/src/app/(member)/community/profile/[username]/page.tsx` (FR-052)
- [ ] T058 [P] [US4] Community badge display: transparent-rule badges (verified member, mentor, instructor, group admin, top contributor, helpful expert, course graduate, founding member, organization verified), visually distinct from purchased-membership badges, in `backend/src/modules/social-reputation/community-badge.service.ts` (FR-053)
- [ ] T059 [US4] Integration test: one-directional follow, mutual connection accept, spam-limit enforcement, block-prevents-request in `backend/tests/integration/us4-follow-connect.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: Networking primitives independently functional.

---

## Phase 7: User Story 5 — Join or Participate in a Group and Its Channels (P1)

**Independent Test**: Create a private-visible group with request-approval join; a non-member requests to join; an admin approves; the new member posts into a group channel.

- [ ] T060 [US5] Group visibility-tier access rules (public/private-visible/private-hidden/course-cohort-restricted) in `backend/src/modules/social-groups/group-visibility.service.ts` (FR-056, acceptance scenario 1)
- [ ] T061 [US5] Group join methods (open/request-approval/invitation/course-enrollment/program-enrollment/org-assignment/membership-plan/admin-grant) with join-question capture in `backend/src/modules/social-groups/group-join.service.ts` (FR-057, FR-058, acceptance scenario 2)
- [ ] T062 [US5] Group member-management actions (approve/invite/change-role/mute/remove/ban/restore/export) with mandatory audited reason in `backend/src/modules/social-groups/group-member-management.service.ts` (FR-064, acceptance scenario 3)
- [ ] T063 [US5] Group archiving (configurable read-only-or-unavailable, new-post disabling, content retention, export, reopen, recorded reason) in `backend/src/modules/social-groups/group-archive.service.ts` (FR-067, acceptance scenario 4)
- [ ] T064 [US5] Group Home rendering (cover/rules/announcements/composer/feed/channels/events/files/members/about) in `web/src/app/(member)/community/groups/[groupId]/page.tsx` (FR-060)
- [ ] T065 [P] [US5] Group rules (title/description/order/mandatory-acceptance/change-notification/re-acknowledgment) in `backend/src/modules/social-groups/group-rule.service.ts` (FR-061)
- [ ] T066 [P] [US5] Group announcements (pin/expiry/notify/audience-scope/schedule/category) in `backend/src/modules/social-groups/group-announcement.service.ts` (FR-062)
- [ ] T067 [P] [US5] Group channels (name/description/icon/posting-permissions/visibility/order/archived) in `backend/src/modules/social-groups/group-channel.service.ts` (FR-063)
- [ ] T068 [P] [US5] Group invitations (search/email/link with expiry/usage-limit/revocation/audit) in `backend/src/modules/social-groups/group-invitation.service.ts` (FR-065)
- [ ] T069 [US5] Member-initiated leave and admin-initiated removal (confirmation, notification cleanup, rejoin policy, reason/duration/appeal/content-retention) in `backend/src/modules/social-groups/group-leave-remove.service.ts` (FR-066)
- [ ] T070 [US5] Integration test: private-hidden-group discoverability, request-approval queue, removal audit record, archived-group read-only state in `backend/tests/integration/us5-groups.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: The structural container for cohort/course/interest community activity is independently functional.

---

## Phase 8: User Story 6 — Send and Receive Direct Messages With Request-Gating (P1)

**Independent Test**: A non-connected Account A sends a message to Account B whose setting is "Connections only"; verify it routes to B's request folder with restricted content; test B's accept/decline/block/report actions.

- [ ] T071 [US6] Message-permission-based routing to primary inbox vs. message-request folder in `backend/src/modules/social-messaging/message-routing.service.ts` (FR-072, FR-073, acceptance scenario 1)
- [ ] T072 [US6] Pre-acceptance message-count cap and media/link restriction on pending requests in `backend/src/modules/social-messaging/message-request.service.ts` (FR-073, acceptance scenario 2)
- [ ] T073 [US6] Accept/decline/block/report actions on a message request, with block's platform-wide effects applying immediately in `backend/src/modules/social-messaging/message-request.service.ts` (FR-073, acceptance scenario 3)
- [ ] T074 [US6] Message status tracking (sending/sent/delivered/read/failed/deleted) honoring the recipient's read-receipt privacy preference in `backend/src/modules/social-messaging/message-status.service.ts` (FR-076, acceptance scenario 4)
- [ ] T075 [P] [US6] Chat screen (header/participant-status/safety-menu/history/typing/composer/attachment/voice-input/block-report) in `web/src/app/(member)/community/messages/[conversationId]/page.tsx` (FR-075)
- [ ] T076 [P] [US6] Message editing (time-window, edited label, safety-authorized original-version access) and deletion (delete-for-me/unsend-for-everyone/moderator-retention) in `backend/src/modules/social-messaging/message-edit-delete.service.ts` (FR-077)
- [ ] T077 [US6] Message attachment security (scanning, MIME validation, signed URLs, size limits, dangerous-file blocking, expiring previews) in `backend/src/modules/social-messaging/message-attachment.service.ts` (FR-078)
- [ ] T078 [P] [US6] Group chat (cohort/accountability/mentor/org teams — member list, admin controls, mentions, pinned messages, mute/leave/report) in `backend/src/modules/social-messaging/group-chat.service.ts` (FR-079)
- [ ] T079 [US6] Messaging anti-spam signal monitoring with graduated response (cooldown/limit/link-restriction/CAPTCHA/temporary-restriction/review-queue) in `backend/src/modules/social-messaging/messaging-anti-spam.service.ts` (FR-080)
- [ ] T080 [US6] Integration test: request-folder routing, pre-acceptance cap, decline/block prevents continuation, accurate status tracking in `backend/tests/integration/us6-messaging.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: All 6 P1 stories functional.

---

## Phase 8b: Post Engagement & Safety Controls (supports FR-031–FR-045; cross-cutting, built on Phase 4's posts)

- [ ] T081 [P] Feed post card rendering (author/badge/context/timestamp/audience/content/media/reactions/comments/shares/save/more-menu) in `web/src/components/community/post-card.tsx` (FR-031, FR-032)
- [ ] T082 Reactions (one primary reaction per user per object, change/remove/count/list-view, blocked-user filtering, rate limiting, manipulation monitoring) in `backend/src/modules/social-post/reaction.service.ts` (FR-033)
- [ ] T083 Comments (text/image/link/mention/emoji/reply/reaction/edit/delete/report/pin, pagination) in `backend/src/modules/social-post/comment.service.ts` (FR-034)
- [ ] T084 Nested comment replies (depth-limited with flattening, parent reference, thread count, deleted-parent handling) in `backend/src/modules/social-post/comment-thread.service.ts` (FR-035)
- [ ] T085 [P] Comment sorting (helpful/latest/oldest, accepted-answer-first) in `backend/src/modules/social-post/comment.service.ts` (FR-036)
- [ ] T086 @Mentions (relationship/permission/block/group-aware autocomplete; mass-mention restricted to admins/moderators) in `backend/src/modules/social-post/mention.service.ts` (FR-037)
- [ ] T087 [P] Hashtags (Unicode/Tamil/Tanglish, search, follow, trending calculation, duplicate-case normalization, abuse moderation) in `backend/src/modules/social-post/hashtag.service.ts` (FR-038)
- [ ] T088 Share actions (in-app, group, DM, copy-link, external share-sheet) with confirmed-action-only count increment in `backend/src/modules/social-post/share.service.ts` (FR-039, FR-040, edge case: menu-open without completed share)
- [ ] T089 Private/restricted-content share-prevention to unauthorized destinations, with recipient-access verification in `backend/src/modules/social-post/share.service.ts` (FR-041, edge case)
- [ ] T090 [P] Save/unsave with collections, search-within-saved, unavailable-state handling in `backend/src/modules/social-post/saved-post.service.ts` (FR-042)
- [ ] T091 [P] Hide-post (immediate feed removal, ranking-feedback signal, undo, optional reason, never itself a report) in `backend/src/modules/social-post/hidden-post.service.ts` (FR-043)
- [ ] T092 [P] Mute-user (feed/notification suppression, relationship preserved, configurable DM behavior, temporary-or-permanent) in `backend/src/modules/social-network/mute.service.ts` (FR-044)
- [ ] T093 Block-user (mutual limitation, relationship removal, prevention of follow/DM/mention, notification stop, group co-membership privacy handling, no notification-to-blocked, safety-report offer), wired to T018's contract test in `backend/src/modules/social-network/block.service.ts` (FR-045)
- [ ] T094 Integration test: reaction/comment/mention/hashtag flows, confirmed-share-only counting, block/mute effect verification in `backend/tests/integration/post-engagement.integration.test.ts`

**Checkpoint**: All 6 P1 stories plus engagement/safety controls functional — MVP complete.

---

## Phase 9: User Story 7 — Report Content and Track Moderation/Appeal Outcome (P2)

**Independent Test**: Submit a report against a seeded test post; verify a case ID and priority are generated; a moderator actions it; the reported user is notified without reporter identity; the user files and receives a decision on an appeal.

- [ ] T095 [US7] Report submission flow (object/reason selection, optional detail, block/mute suggestion, confirmation, case-ID creation, priority classification) in `backend/src/modules/trust-safety-community/report.service.ts` (FR-086, FR-087, acceptance scenario 1)
- [ ] T096 [US7] Moderator-action → user-notification pipeline (policy category, action, general reason, appeal link — never reporter identity or detection signal), wired to T017's contract test in `backend/src/modules/trust-safety-community/moderation-notification.service.ts` (FR-100, acceptance scenario 2)
- [ ] T097 [US7] Appeal flow (submit reason + context, reviewer-different-from-original-decision-maker assignment, uphold/modify/reverse outcome, audit update, notification) in `backend/src/modules/trust-safety-community/appeal.service.ts` (FR-101, acceptance scenario 3)
- [ ] T098 [US7] Duplicate-report consolidation (surface the existing case rather than creating an unbounded new entry) in `backend/src/modules/trust-safety-community/report.service.ts` (FR-087, acceptance scenario 4)
- [ ] T099 [US7] Moderation action catalog (no-action through permanent ban, law-enforcement escalation) with content-status tracking in `backend/src/modules/trust-safety-community/moderation-action.service.ts` (FR-089, FR-090)
- [ ] T100 [US7] Automated detection (spam/links/abusive-words/scam-patterns/contact-harvesting/dangerous-files/impersonation/mass-messaging/manipulated-engagement) limited to flag/hold/limit/request-verification, with human review required for high-impact permanent actions in `backend/src/modules/trust-safety-community/automated-detection.service.ts` (FR-091)
- [ ] T101 [P] [US7] Spam-prevention controls (new-user limits, link limits, duplicate-content detection, CAPTCHA, verification requirement, rate limiting, reputation-based limits, suspicious-domain blocking) in `backend/src/modules/trust-safety-community/spam-prevention.service.ts` (FR-092)
- [ ] T102 [P] [US7] Impersonation-report workflow (identification, evidence, ownership verification, verified-profile check, profile-review/username-freeze/badge-removal/restriction/removal/appeal actions) in `backend/src/modules/trust-safety-community/impersonation.service.ts` (FR-094)
- [ ] T103 [P] [US7] Copyright-complaint workflow (rights-holder details, work identification, infringing URL, declaration, contact info, counter-notice, legal retention), operationally separate from the general report flow in `backend/src/modules/trust-safety-community/copyright-complaint.service.ts` (FR-095)
- [ ] T104 [P] [US7] Member safety-tools panel (block/mute/restrict-requests/hide/report/leave-group/privacy-controls/manage-mentions/disable-read-receipts/download-data) in `web/src/app/(member)/community/settings/safety/page.tsx` (FR-096)
- [ ] T105 [US7] Graduated strike model (warning through final-strike/suspension/ban, category-based expiry, severe-violation immediate-escalation override) in `backend/src/modules/trust-safety-community/strike.service.ts` (FR-102)
- [ ] T106 [US7] Language-aware moderation detection across Tamil/Tanglish/English/mixed content, including transliterated abusive/scam terms and context-aware expressions, per `research.md`'s resolved NLP approach — explicitly not relying on English-keyword matching alone — in `backend/src/modules/trust-safety-community/language-aware-detection.service.ts` (FR-106, Constitution Localization & Language Requirements)
- [ ] T107 [US7] False-positive appeal path specifically for language-moderation flags in `backend/src/modules/trust-safety-community/appeal.service.ts` (FR-107, edge case)
- [ ] T108 [P] [US7] Community guidelines publication (respect/no-harassment/no-hate/no-scams/no-misleading-claims/no-spam/no-impersonation/privacy/copyright/safe-financial-health/no-illegal-content) in Tamil/Tanglish/English in `web/src/app/(public)/community-guidelines/page.tsx` (FR-085)
- [ ] T109 [US7] Integration test: report → case → moderator-action → notification → appeal full cycle, duplicate-report consolidation, language-aware detection recall, false-positive appeal in `backend/tests/integration/us7-moderation-appeal.integration.test.ts` (all 4 acceptance scenarios, SC-010)

**Checkpoint**: Trust & Safety reporting and appeal loop independently functional.

---

## Phase 10: User Story 8 — Post a Collaboration/Opportunity Safely Under Scam & Financial-Claim Controls (P2)

**Independent Test**: Create an Opportunity post with a guaranteed-income claim and advance-fee request; verify it's flagged/held for review or shows the identity-verification warning; separately confirm an achievement post with an unverified earnings claim can be admin-labeled "Unverified result."

- [ ] T110 [US8] Opportunity post type (type/title/description/skills/compensation/location/deadline/contact-method/application-link/verification-status) in `backend/src/modules/social-post/opportunity.service.ts` (FR-024)
- [ ] T111 [US8] High-risk scam-indicator evaluation (guaranteed income, advance-fee, personal-bank-detail requests, crypto pressure, fake jobs/mentors, impersonated brands, external-messaging redirection, urgent-money requests) with an identity-verification warning in `backend/src/modules/trust-safety-community/scam-detection.service.ts` (FR-093, acceptance scenarios 1, 4)
- [ ] T112 [US8] Upfront-payment warning plus high-risk-category admin-moderation routing on Opportunity posts in `backend/src/modules/social-post/opportunity.service.ts` (FR-025, acceptance scenario 1)
- [ ] T113 [US8] "Unverified result" admin label for financial-claim posts, applicable without content removal, visually distinct from admin-verified results in `backend/src/modules/trust-safety-community/financial-claim-label.service.ts` (FR-104, FR-105, acceptance scenario 2, Constitution Article III)
- [ ] T114 [US8] Paid-promotion disclosure requirement enforcement, with absence treated as a policy violation in `backend/src/modules/social-post/opportunity.service.ts` (FR-103, acceptance scenario 3)
- [ ] T115 [US8] Integration test: upfront-payment warning + routing, unverified-result labeling, disclosure enforcement, external-redirection scam-indicator detection in `backend/tests/integration/us8-opportunity-safety.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: Financial/scam harm protections independently functional.

---

## Phase 10b: Discovery & Search + Reputation/Gamification Interop (supports FR-068–FR-070, FR-108–FR-109; cross-cutting)

- [ ] T116 [P] Community search across posts/questions/comments/groups/members/hashtags/resources/events, permission-aware results in `backend/src/modules/social-discovery/community-search.service.ts` (FR-068)
- [ ] T117 Trending-content computation (meaningful interactions, comment quality, saves, helpful votes, recency, trusted-participant activity, report rate) with manipulation resistance (like-farms, self-reactions, bots) in `backend/src/modules/social-discovery/trending.service.ts` (FR-069)
- [ ] T118 [P] Discover page (trending, recommended groups, suggested members, popular questions, wins, events, followed topics, new communities) in `web/src/app/(member)/community/discover/page.tsx` (FR-070)
- [ ] T119 Community reputation derivation (helpful answers, accepted answers, constructive comments, profile completion, verified identity, participation, low report rate) feeding posting limits/badges/moderation-eligibility/discovery, without publicly displaying the exact score in `backend/src/modules/social-reputation/reputation.service.ts` (FR-108)
- [ ] T120 Point-eligible-signal emission to `006` for helpful answers/accepted answers/valid resource shares/challenge support/group contribution, explicitly excluding vanity actions (raw post count, empty comments, reaction farming, spam invites) in `backend/src/modules/social-reputation/point-signal-emitter.service.ts` (FR-109, Constitution Article VIII)

**Checkpoint**: Discovery and reputation surfaces independently functional.

---

## Phase 11: User Story 9 — Moderator Reviews and Actions a Case Through the Console (P3)

**Independent Test**: Seed several report cases with varying priority; have a moderator work the queue end-to-end (open case → view evidence/history → issue decision with duration/reason → confirm audit record and appeal-eligibility flag).

- [ ] T121 [US9] Moderator Console priority queue (new reports, automated flags, appeals, suspicious accounts, spam campaigns, group incidents, message safety reports, resolved cases, policy updates) in `web/src/app/(admin)/community/moderation-console/page.tsx` (FR-097, acceptance scenario 1)
- [ ] T122 [US9] Moderation Case screen with minimum-necessary-access to private message content — not full conversation history by default in `web/src/app/(admin)/community/moderation-console/[caseId]/page.tsx` (FR-098, acceptance scenario 2)
- [ ] T123 [US9] Moderation decision persistence (policy category, severity, action, duration, reason, reviewer, evidence, notification, appeal status) to an immutable audit record, extending `001`'s audit-log pattern in `backend/src/modules/trust-safety-community/moderation-decision.service.ts` (FR-099, acceptance scenario 3)
- [ ] T124 [US9] Human-review gate on high-impact automated flags (permanent ban, permanent content removal) before finalization, wired to T100's automated-detection limits in `backend/src/modules/trust-safety-community/moderation-action.service.ts` (FR-091, acceptance scenario 4, SC-006)
- [ ] T125 [P] [US9] Admin community dashboard (active users, posts/comments per day, questions answered, response time, group activity, reports, removal/spam rate, connection/message requests, retention, community-driven learning) in `web/src/app/(admin)/community/dashboard/page.tsx` (FR-110)
- [ ] T126 [P] [US9] Admin post management (filterable list, edit-label/pin/feature/limit/remove/restore/lock-comments/send-notification/audit-history) in `web/src/app/(admin)/community/posts/page.tsx` (FR-111)
- [ ] T127 [P] [US9] Admin "Send Notification" action with configurable audience/channels/schedule/deep-link, correct-post-or-fallback routing on tap in `backend/src/modules/social-admin/send-notification.service.ts` (FR-112)
- [ ] T128 [P] [US9] Admin group management (create/edit/visibility/owner/moderators/join-policy/channels/pin/archive/suspend/delete/export) in `web/src/app/(admin)/community/groups/page.tsx` (FR-113)
- [ ] T129 [P] [US9] Admin member-management actions (profile/history/reports/warnings/restrict-posting/restrict-messaging/suspend/ban/restore/note/badge) with mandatory audit logging in `web/src/app/(admin)/community/members/page.tsx` (FR-114)
- [ ] T130 [P] [US9] Admin comment management (search/filter-reported/view-parent/remove/restore/lock-thread/warn/restrict) in `web/src/app/(admin)/community/comments/page.tsx` (FR-115)
- [ ] T131 [P] [US9] Content featuring (post/question/win/group/member/event, placement/dates/audience/priority/label, mandatory paid-promotion labeling) in `backend/src/modules/social-admin/featuring.service.ts` (FR-116)
- [ ] T132 [P] [US9] Pinning at global/group/channel/course-discussion/organization scope with configurable max-pinned-count in `backend/src/modules/social-admin/pinning.service.ts` (FR-117)
- [ ] T133 [US9] Integration test: priority-queue ordering, minimum-necessary DM access, immutable decision audit, human-review-gate on high-impact automated flags in `backend/tests/integration/us9-moderator-console.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: All 9 user stories independently functional.

---

## Phase 12: Polish & Cross-Cutting Concerns

- [ ] T134 [P] Community notification wiring (reaction through event-reminder events) with grouping/deduplication, deep links, permission re-check at open time, per-category preference controls, safety-notifications-non-disableable in `backend/src/modules/social-notifications/community-notifications.service.ts` (FR-081–FR-084)
- [ ] T135 [P] Community analytics-event taxonomy emission (`community_viewed` through `user_blocked`) in `backend/src/modules/social-discovery/community-analytics.service.ts` (FR-118)
- [ ] T136 [P] Per-post and per-group analytics dashboards (privacy-safe author summary; group growth/activity/retention/moderator-response-time) in `web/src/app/(admin)/community/reports/{post-analytics,group-analytics}/page.tsx` (FR-119, FR-120)
- [ ] T137 Community health indicator computation (meaningful-response rate, median question response time, helpful-answer rate, report/block/spam rate, retention, interaction diversity, moderator backlog) in `backend/src/modules/social-discovery/community-health.service.ts` (FR-121, SC-009)
- [ ] T138 [P] Security pass: server-side permission checks, sanitization, malware scanning, signed media, rate limiting, anti-CSRF/XSS, link reputation, message authorization, private-group isolation, audit logging, moderator permission isolation, sensitive-data masking (FR-122)
- [ ] T139 [P] Privacy pass: private-group isolation, block-relationship enforcement platform-wide, deleted-user anonymization, directory opt-out, contact-details-hidden-by-default, minimum-necessary moderator access, separate public-profile/community-visibility controls (FR-123)
- [ ] T140 [P] Accessibility pass: keyboard-accessible feed, screen-reader post labels, image alt text, video captions, audio transcripts, accessible reactions, comment focus management, non-color status indicators, reduced motion, poll-selection labels (FR-124)
- [ ] T141 [P] Localization pass: Tamil/Tanglish/English UI, Unicode hashtags, mixed-language search, localized timestamps/moderation-reasons, Tamil line-breaking, optional labeled auto-translation with permanent original-content access (FR-125)
- [ ] T142 Performance pass: cursor pagination, optimistic reactions, comment lazy-load, CDN media, thumbnail/background-video processing, notification batching, search indexing, permission-aware caching, partial-failure isolation (FR-126)
- [ ] T143 Real-time delivery verification: messages, typing, read receipts, reaction counts, notification counts, group announcements, moderation removals — with reconnection retry/reconciliation (FR-127)
- [ ] T144 Mobile offline support: cached feed, draft persistence, offline saved items, pending-reaction queue, pending-upload indication, retry manager, network-confirmation-before-large-media-publish, duplicate-submission prevention (FR-128)
- [ ] T145 Run `quickstart.md` validation end-to-end across all 9 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `001`–`004`'s prior work.
- **P1 stories**: US1 (feed) has the lightest dependencies and should ship first as the MVP anchor since it's the highest-traffic entry surface; US2 (post creation) must exist before US3 (questions, which are a post subtype); US4 (follow/connect) and US5 (groups) are independent of US2/US3 and each other; US6 (messaging) is independent of all other P1 stories. Recommended order: US1 → US2 → US3, with US4/US5/US6 built in parallel once Foundational is done.
- **Phase 8b (Post Engagement & Safety Controls)** depends on Phase 4 (posts must exist to react/comment/share/hide/mute/block against) — sequence after the P1 slice, before Polish.
- **P2 stories (US7, US8)**: US7 (moderation/appeal) depends on Foundational's Report/Moderation Case entities and needs *something* reportable (any P1 story's content) to be meaningful; US8 (Opportunity safety) depends on US2 (post creation) and reuses US7's scam-detection infrastructure.
- **Phase 10b (Discovery & Reputation)** depends on Foundational + the P1 slice (needs real posts/questions/groups to search and rank) — may run in parallel with P2 stories.
- **P3 story (US9)** depends on US7 (the console is the operational view over US7's report/case infrastructure).
- **Polish (Phase 12)** depends on all desired stories being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational → US1 (feed) → **STOP and VALIDATE** the primary entry surface is explainable and non-engagement-biased → US2 (posts) → US3 (questions) → US4/US5/US6 in parallel (follow/connect, groups, messaging) → Phase 8b (engagement/safety controls) → **STOP and VALIDATE** the full social loop end-to-end → then US7 (moderation/appeal, recommend immediately after for trust & safety) → US8 (opportunity safety) → Phase 10b (discovery/reputation) → US9 (moderator console) → Polish.
