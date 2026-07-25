---
description: "Task list for Feature 031 — Social Media Marketing, Content Publishing & Community Distribution"
---

# Tasks: Social Media Marketing, Content Publishing & Community Distribution

**Input**: Design documents from `/specs/031-social-media-content-publishing/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses via `016`). This feature also assumes `008`'s AI gateway, `005`'s community publish/access rules, and `028`'s attribution engine exist as integration points — per plan.md's ownership analysis, this feature does **not** rebuild AI orchestration, community moderation/access rules, or attribution-model computation.

**Tests**: Included throughout — multi-platform publish status tracking, approval-chain completeness with audited emergency bypass, and the AI-content human-review gate each get a dedicated Foundational contract test, matching this spec's own SC-002, SC-004, and SC-008.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus two supplementary cross-cutting phases for FR groups not owned by any single prioritized story (calendar/campaign-planning/assets/hashtag engine; analytics/executive-reporting/collaboration).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor reused via `016`), and that `008`'s AI gateway, `005`'s community rules, and `028`'s attribution engine exist as integration points
- [ ] T002 Resolve `research.md` open items before proceeding: emergency-publishing authorization rules and conditions (FR-025), sentiment-alert threshold/window/escalation-SLA values (FR-041), Legal Review trigger criteria by content category, and sentiment-escalation SLA ownership
- [ ] T003 [P] Add `backend/src/modules/{platform-connections,content-lifecycle,content-repurposing,content-calendar-campaigns,content-approval,multi-platform-publishing,community-distribution,digital-brand-assets,ai-hashtag-engine,trend-social-listening,unified-inbox,social-analytics-reporting,social-revenue-attribution,social-collaboration-governance}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Platform Connection` entity in `backend/src/modules/platform-connections/platform-connection.entity.ts`
- [ ] T005 [P] Define the `Content Item` entity in `backend/src/modules/content-lifecycle/content-item.entity.ts`
- [ ] T006 [P] Define the `Repurposed Content Variant` entity in `backend/src/modules/content-repurposing/repurposed-content-variant.entity.ts`
- [ ] T007 [P] Define the `Campaign` entity in `backend/src/modules/content-calendar-campaigns/campaign.entity.ts`
- [ ] T008 [P] Define the `Approval Record` entity in `backend/src/modules/content-approval/approval-record.entity.ts`
- [ ] T009 [P] Define the `Digital Asset` entity in `backend/src/modules/digital-brand-assets/digital-asset.entity.ts`
- [ ] T010 [P] Define the `Brand Asset` entity in `backend/src/modules/digital-brand-assets/brand-asset.entity.ts`
- [ ] T011 [P] Define the `Hashtag` entity in `backend/src/modules/ai-hashtag-engine/hashtag.entity.ts`
- [ ] T012 [P] Define the `Trend Alert` entity in `backend/src/modules/trend-social-listening/trend-alert.entity.ts`
- [ ] T013 [P] Define the `Social Mention` entity in `backend/src/modules/trend-social-listening/social-mention.entity.ts`
- [ ] T014 [P] Define the `Sentiment Alert` entity in `backend/src/modules/trend-social-listening/sentiment-alert.entity.ts`
- [ ] T015 [P] Define the `Inbox Message` entity in `backend/src/modules/unified-inbox/inbox-message.entity.ts`
- [ ] T016 [P] Define the `Community Distribution Rule` entity in `backend/src/modules/community-distribution/community-distribution-rule.entity.ts`
- [ ] T017 [P] Define the `Revenue Attribution Record` entity in `backend/src/modules/social-revenue-attribution/revenue-attribution-record.entity.ts`
- [ ] T018 [P] Define the immutable `Audit Log Entry` entity in `backend/src/modules/social-collaboration-governance/audit-log-entry.entity.ts`
- [ ] T019 20+ destination publishing-support catalog (social, video, messaging, community, blogging, podcast platforms), wired to T004 (FR-001)
- [ ] T020 Multi-brand/account/page/channel/language/region management from a single dashboard (FR-002)
- [ ] T021 Platform Connection field storage (account ID, platform, brand, region, language, auth status, access token, expiration, permissions, owner, status) (FR-003)
- [ ] T022 Token-expiration tracking with publish-block and reconnection prompt for the account owner (FR-004)
- [ ] T023 OAuth-connection/token-rotation/permission-change audit logging, wired to T018 (FR-005)
- [ ] T024 11-stage content lifecycle model (Idea → ... → Optimization) with full stage-transition auditability, wired to T005 (FR-006)
- [ ] T025 20-item content-type catalog (Text Posts through AI Generated Posts) (FR-007)
- [ ] T026 Content Editor (rich text, Markdown, AI writing assistance, grammar checking, tone adjustment, emoji, mentions, hashtags, CTA builder, URL shortening, UTM generation, link previews, multi-language editing, version history) (FR-008)
- [ ] T027 Integrated AI content generator (13 output types, 8 tone options), consuming `008`'s gateway (FR-009)
- [ ] T028 AI Creative Assistant (image ideas, thumbnails, banners, carousel layouts, hooks, CTAs, emoji recommendations, brand-consistency checks, color recommendations, visual-storytelling guidance) (FR-010)
- [ ] T029 Server-side-only AI execution enforcement — no provider API key, system prompt, or privileged instruction ever exposed to a client (FR-011)
- [ ] T030 Deterministic non-AI fallback (manual/blank editor path) so authoring is never blocked when the AI service is unavailable (FR-012)
- [ ] T031 Contract test: a single publish action's per-platform status (success/failure) is recorded and surfaced for every selected platform, in `backend/tests/contract/multi-platform-publish-status-tracking.contract.test.ts` (FR-028, SC-002)
- [ ] T032 Contract test: no content item reaches Published status without every approval required by its configured chain, and 100% of emergency-publish bypasses are captured in the audit log, in `backend/tests/contract/approval-chain-completeness-emergency-audit.contract.test.ts` (FR-024–FR-025, SC-004)
- [ ] T033 Contract test: AI-generated content and AI-suggested replies are never delivered to an end customer or public platform without a recorded human review/approval step, in `backend/tests/contract/ai-content-human-review-gate.contract.test.ts` (FR-046, SC-008, Constitution Article II)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Publish One Piece of Content Across Every Connected Platform (Priority: P1) 🎯 MVP

**Independent Test**: Connect at least two platform accounts, author one post, select multiple platforms, and publish; confirm the post appears correctly formatted on each selected platform and the publish status is recorded per platform.

- [ ] T034 [US1] Simultaneous multi-platform publish action across 9 destinations, wired to T004, acceptance scenario 1 (FR-026)
- [ ] T035 [US1] Automatic per-platform format adaptation (character limits, media specs, aspect ratios, equivalent constraints), wired to acceptance scenario 2 (FR-027)
- [ ] T036 [US1] Per-platform publish-status tracking with failure surfacing to the author/owner, wired to T031's contract test, acceptance scenario 1 (FR-028)
- [ ] T037 [US1] UTM parameter and shortened-URL recording per published post per platform (FR-029)
- [ ] T038 [US1] Sub-3-second publish-request performance (FR-030)
- [ ] T039 [US1] Scheduled auto-publish execution at the target time without manual intervention, recording the outcome, wired to acceptance scenario 3 (FR-020 tie-in)
- [ ] T040 [US1] Expired-token partial-publish handling: block the affected platform, surface a reconnection prompt, and still publish successfully to remaining valid platforms, wired to acceptance scenario 4 (FR-004 tie-in)
- [ ] T041 [P] [US1] Multi-platform publish composer/status UI
- [ ] T042 [US1] Integration test: three-platform publish shows per-platform status, a long-form caption auto-adapts for LinkedIn and X, a scheduled post auto-publishes and records the outcome, an expired token blocks one platform while others still succeed — all 4 acceptance scenarios in `backend/tests/integration/us1-multi-platform-publishing.integration.test.ts`

**Checkpoint**: The core value proposition — every other capability exists in service of this — is independently functional.

---

## Phase 4: User Story 2 — AI Content Repurposing Into 12+ Platform-Specific Formats (Priority: P2)

**Independent Test**: Submit one finished content item to the repurposing engine and verify distinct, platform-appropriate variants are generated for each target format, each individually traceable back to the source and independently editable.

- [ ] T043 [US2] 12+ format repurposing from one source item, wired to T006, acceptance scenario 1 (FR-013)
- [ ] T044 [US2] Traceable source link and target-format recording per variant (FR-014)
- [ ] T045 [US2] Independent variant editability with the same approval workflow required before scheduling/publishing, wired to acceptance scenario 2 (FR-015)
- [ ] T046 [US2] Tamil, Tanglish, and English as first-class repurposing output languages (FR-016)
- [ ] T047 [US2] Immediate pre-send consent re-check for consent-gated channel variants (WhatsApp broadcast, Telegram), wired to acceptance scenario 3 (FR-017)
- [ ] T048 [US2] Graceful degradation to manual variant creation when the AI repurposing service is unavailable, wired to acceptance scenario 4
- [ ] T049 [P] [US2] Repurposing review/edit UI
- [ ] T050 [US2] Integration test: 12-variant generation linked to source, variant independently editable before scheduling, consent-gated channel rechecks consent immediately before send, AI outage allows manual variant creation without blocking the workflow — all 4 acceptance scenarios in `backend/tests/integration/us2-ai-content-repurposing.integration.test.ts`

**Checkpoint**: The platform's headline productivity multiplier is independently functional.

---

## Phase 5: User Story 3 — Content Approval Workflow Before Anything Publishes (Priority: P2)

**Independent Test**: Submit a draft content item, route it through the configured approval chain, request a revision, resubmit, and approve; verify the item cannot reach "Scheduled" status until all required approvals are recorded.

- [ ] T051 [US3] 7-stage workflow (Draft → Internal Review → Manager Approval → Legal Review optional → Scheduling → Auto Publishing → Monitoring), wired to T008, acceptance scenario 1 (FR-021)
- [ ] T052 [US3] 6 approval levels (Author, Reviewer, Marketing Manager, Brand Manager, Legal Team, Executive) (FR-022)
- [ ] T053 [US3] Reviewer comments, revision requests, version comparison against prior drafts, and a complete timestamped approval history, wired to acceptance scenario 2 (FR-023)
- [ ] T054 [US3] Advancement block until every required approval is recorded, wired to T032's contract test, acceptance scenario 3 (FR-024)
- [ ] T055 [US3] Parallel and sequential approvals plus an audited emergency-publishing path, wired to acceptance scenario 4 — behavior preserved as `[NEEDS CLARIFICATION]` per spec.md pending T002's research.md resolution (FR-025)
- [ ] T056 [P] [US3] Approval-chain review/comment UI
- [ ] T057 [US3] Integration test: draft submission moves to Internal Review and is visible to reviewers, a revision request returns to the author with history preserved, a Legal-Review-required item is blocked from Scheduling until approved, an emergency bypass is recorded with the authorizer and reason — all 4 acceptance scenarios in `backend/tests/integration/us3-content-approval-workflow.integration.test.ts`

**Checkpoint**: The governance layer ensuring no AI-drafted or human-drafted content goes live without human sign-off is independently functional.

---

## Phase 6: User Story 4 — Unified Comment & Messaging Inbox With AI-Suggested Replies (Priority: P3)

**Independent Test**: Simulate an incoming comment on one platform and an incoming DM on another; verify both surface in the same inbox view, can be assigned to an agent, and offer an AI-suggested reply the agent must review before sending.

- [ ] T058 [US4] Unified comment inbox aggregating Facebook, Instagram, LinkedIn, YouTube, and Community comments, wired to T015, acceptance scenario 1 (FR-042)
- [ ] T059 [US4] Reply, Hide, Delete, Assign, Escalate, and AI-suggested-reply actions per comment (FR-043)
- [ ] T060 [US4] Unified messaging center aggregating Messenger, Instagram DM, WhatsApp Business, Telegram, and Internal Community Messages, wired to acceptance scenario 2 (FR-044)
- [ ] T061 [US4] Customer history, CRM integration, and an AI reply-suggestion assistant, wired to acceptance scenario 2 (FR-045)
- [ ] T062 [US4] AI-suggested-reply human-review-before-send enforcement, wired to T033's contract test, acceptance scenario 4 (FR-046)
- [ ] T063 [US4] Single-agent conversation assignment with cross-agent assignment-status visibility to prevent conflicting responses, wired to acceptance scenario 3 (FR-047)
- [ ] T064 [P] [US4] Unified inbox UI
- [ ] T065 [US4] Integration test: comments from two platforms appear in the same list with source and AI suggestion, a WhatsApp message shows customer history and CRM context, a second agent sees the existing assignment, an AI-suggested reply is not auto-sent without review — all 4 acceptance scenarios in `backend/tests/integration/us4-unified-inbox.integration.test.ts`

**Checkpoint**: The single-inbox experience sustaining engagement response time and community trust is independently functional.

---

## Phase 7: User Story 5 — Trend Detection & Social Listening Surfaces a Sentiment Alert (Priority: P3)

**Independent Test**: Inject a simulated brand mention with negative sentiment and verify the system classifies it correctly and generates an alert visible to the marketing team within the trend-detection performance target.

- [ ] T066 [US5] AI viral/trend detection (7 categories) with sub-5-minute real-time alerting, wired to T012, acceptance scenario 2 (FR-037)
- [ ] T067 [US5] Social listening monitoring (8 target types) across supported channels, wired to T013, acceptance scenario 1 (FR-038)
- [ ] T068 [US5] 4-category sentiment classification per monitored mention (FR-039)
- [ ] T069 [US5] Tamil/Tanglish/transliterated-aware sentiment processing, not reliant on English-only keyword matching, wired to acceptance scenario 3 (FR-040)
- [ ] T070 [US5] Threshold-crossing sentiment alert routed to the responsible manager, wired to T014, acceptance scenario 4 — threshold/window/SLA values preserved as `[NEEDS CLARIFICATION]` per spec.md (FR-041)
- [ ] T071 [P] [US5] Social listening / trend dashboard UI
- [ ] T072 [US5] Integration test: a matching mention is classified and recorded, a trending keyword alerts the team within 5 minutes, a Tamil/Tanglish mention is correctly classified, a volume-threshold crossing raises an escalation alert — all 4 acceptance scenarios in `backend/tests/integration/us5-trend-detection-social-listening.integration.test.ts`

**Checkpoint**: The proactive reputational-risk and viral-opportunity detection capability is independently functional.

---

## Phase 8: User Story 6 — Automated Community Distribution (Priority: P4)

**Independent Test**: Configure one distribution rule and publish a matching post; verify it appears in the target community automatically without a separate manual post action.

- [ ] T073 [US6] Automatic distribution into 7 community destination types, wired to T016, acceptance scenario 1 (FR-031)
- [ ] T074 [US6] Configurable content-criteria-to-destination mapping rules (FR-032)
- [ ] T075 [US6] Internal Community routing honoring `005`'s existing membership/region/access rules, wired to acceptance scenario 2 (FR-033)
- [ ] T076 [US6] No-force-distribution when no rule matches a published post, wired to acceptance scenario 3
- [ ] T077 [P] [US6] Community distribution rule configuration UI
- [ ] T078 [US6] Integration test: a matching rule auto-distributes without a manual step, a regional-community post respects membership/region scope, an unmatched post is not force-distributed — all 3 acceptance scenarios in `backend/tests/integration/us6-community-distribution.integration.test.ts`

**Checkpoint**: The reach-extension into TBT's owned community surfaces is independently functional.

---

## Phase 9: User Story 7 — Revenue Attribution Ties a Social Post Back to a Sale (Priority: P4)

**Independent Test**: Publish a campaign-tagged post containing a UTM-tracked link, simulate a resulting membership purchase through that link, and verify the revenue event is attributed back to the originating post/campaign and visible on the Executive Dashboard.

- [ ] T079 [US7] Social-touchpoint-to-revenue-event attribution across 8 outcome types, feeding `028`'s attribution engine, wired to T017, acceptance scenario 1 (FR-053)
- [ ] T080 [US7] Integration with `028`'s Attribution & ROI module rather than a separate, independent attribution model (FR-054)
- [ ] T081 [US7] Immutable snapshot at conversion time, not retroactively altered by later attribution-model configuration changes, wired to acceptance scenario 2 (FR-055)
- [ ] T082 [US7] Executive Dashboard campaign-filtered revenue display across 8 categories alongside engagement metrics, wired to acceptance scenario 3
- [ ] T083 [P] [US7] Revenue attribution / executive filter UI
- [ ] T084 [US7] Integration test: a UTM-tracked purchase is attributed to the originating post and visible in revenue-attribution reporting, an attribution record remains unchanged after a later model-configuration change, the Executive Dashboard shows all 8 revenue categories per campaign filter — all 3 acceptance scenarios in `backend/tests/integration/us7-social-revenue-attribution.integration.test.ts`

**Checkpoint**: The last link in the value chain — justifying social spend with real business results — is independently functional.

---

## Phase 10: Content Calendar/Campaign Planning, Digital/Brand Assets & AI Hashtag Engine remainder (supports FR-018–FR-020, FR-034–FR-036; cross-cutting, no single owning story)

- [ ] T085 Content calendar (Daily/Weekly/Monthly/Quarterly/Yearly views, filterable by 8 dimensions), wired to T005 (FR-018)
- [ ] T086 Campaign record management (11 fields, 5 statuses), wired to T007 (FR-019)
- [ ] T087 Publish-mode support (immediate, scheduled, recurring, timezone-aware, smart scheduling, AI-recommended publish time) (FR-020)
- [ ] T088 Digital Asset management (10 asset types, 7 metadata fields), wired to T009 (FR-034)
- [ ] T089 Brand Asset Library (9 resource types) with version control, wired to T010 (FR-035)
- [ ] T090 AI Hashtag Engine (7 recommendation categories) with continuous performance tracking, wired to T011 (FR-036)

**Checkpoint**: The planning, asset-management, and hashtag substrate underlying content creation and publishing is independently functional.

---

## Phase 11: Analytics/Performance/Executive Reporting & Collaboration remainder (supports FR-048–FR-052, FR-056; cross-cutting, no single owning story)

- [ ] T091 Content performance metrics (12 metrics: Reach, Impressions, Clicks, Shares, Saves, Comments, Likes, Watch Time, Followers, Engagement Rate, CTR, Conversion Rate) (FR-048)
- [ ] T092 Community metrics (9 metrics) (FR-049)
- [ ] T093 AI Performance Optimizer advisory recommendations (8 categories) (FR-050)
- [ ] T094 Executive Dashboard (11 metrics) with automatically generated executive summaries (FR-051)
- [ ] T095 Sub-3-second Analytics Dashboard load performance (FR-052)
- [ ] T096 Cross-role collaboration (8 roles) on content items — comments, mentions, tasks, notifications, version history, file sharing (FR-056)

**Checkpoint**: The reporting and cross-team collaboration surface rounding out full social-operations coverage is independently functional.

---

## Phase 12: Security, Compliance, APIs & Polish

- [ ] T097 [P] RBAC, mandatory MFA for admin/finance-equivalent roles, audit logs, encryption, secure OAuth, token rotation, session monitoring, IP restrictions, wired to `016` (FR-057)
- [ ] T098 GDPR/CCPA/cookie-consent compliance, copyright tracking, brand-compliance checks, AI-disclosure labeling on AI-generated content, content-retention policy, full approval-audit trails (FR-058)
- [ ] T099 REST API endpoints (Create/Update/Delete Post, Publish, Schedule, Upload Asset, Fetch Analytics, Retrieve Comments, Generate AI Content, Generate AI Caption) with webhook support (FR-059)
- [ ] T100 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (emergency-publishing authorization rules, sentiment-alert threshold/window/SLA values, Legal Review trigger criteria, sentiment-escalation SLA ownership)
- [ ] T101 Final audit: cross-check every FR-001–FR-059 against an implementation or validation task; verify AI orchestration is consumed from `008`, community distribution routes through `005`'s existing rules, and attribution computation is deferred to `028` rather than re-implemented
- [ ] T102 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `001`/`016`'s RBAC, `008`'s AI gateway, `005`'s community rules, and `028`'s attribution engine, and produces the entity/content-lifecycle/AI-generation infrastructure every subsequent phase depends on.
- **P1 story (US1)**: Multi-platform publishing is the core value proposition and must ship first; every other story assumes publishing already works.
- **P2 stories (US2–US3)**: US2 (repurposing) depends on US1's publishing pipeline to eventually schedule/publish variants; US3 (approval workflow) governs both US1's original content and US2's repurposed variants and should land alongside or just after US2 since FR-015 requires variants to pass through the same approval workflow.
- **P3 stories (US4–US5)**: US4 (unified inbox) depends on US1 having published content that generates comments/messages to respond to; US5 (trend detection/listening) is largely independent of publishing and can build in parallel with US4.
- **P4 stories (US6–US7)**: US6 (community distribution) depends on US1/US3's publish-and-approve pipeline; US7 (revenue attribution) depends on US1's UTM/tracking infrastructure and `028`'s attribution engine — both can build in parallel and are the last link in the value chain by design.
- **Phase 10 (Calendar/Campaigns/Assets/Hashtag)** and **Phase 11 (Analytics/Executive/Collaboration)** depend on Foundational and US1; they should land alongside the P2/P3 stories since campaign/asset/hashtag data and analytics feed several of those stories.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, content lifecycle, AI generation core) → **STOP and VALIDATE** the three Foundational contract tests (multi-platform-publish-status-tracking, approval-chain-completeness-emergency-audit, ai-content-human-review-gate) pass → US1 (multi-platform publishing) → **STOP and VALIDATE** one piece of content can go live correctly formatted across multiple real platforms → US2 (AI repurposing) + US3 (approval workflow) in parallel, since variants must flow through approval → **STOP and VALIDATE** nothing reaches a public platform without human sign-off → US4 (unified inbox) + US5 (trend detection/listening) in parallel → US6 (community distribution) + US7 (revenue attribution) in parallel → Phase 10 (calendar/assets/hashtag) + Phase 11 (analytics/executive/collaboration) in parallel → Polish.
