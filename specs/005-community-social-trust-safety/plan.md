# Implementation Plan: Community, Social Networking, Messaging & Trust and Safety

**Branch**: `005-community-social-trust-safety` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-community-social-trust-safety/spec.md`

## Summary

This feature builds the platform's entire social layer: an explainable, non-engagement-optimized feed; post creation across 17 post types including Questions with accepted answers and safety-screened Collaboration/Opportunity posts; one-directional Follow and mutual Connections; visibility-tiered Groups with Channels; request-gated Direct Messaging; and a full Trust & Safety stack (reporting, a Moderator Console, appeals, strikes, language-aware moderation, and the Financial Claim Policy).

This is one of two features the constitution cites by name for **Article VIII (No Pay-to-Win, No Vanity-Metric Optimization)** — "Vol 05 (share-count integrity, closing principle)" — and it is the primary implementer of the constitution's **Localization & Language Requirements** section, which explicitly requires Tamil/Tanglish/transliterated-content-aware moderation, not English-keyword matching alone.

It reuses **001**'s RBAC module directly for group roles and moderator permissions (no new permission engine), **001**'s audit-log pattern for moderation-decision records, and **003**'s User Profile for member identity. It treats **006** (gamification), **007** (mentor marketplace), **004** (LMS), and **010** (events) as external signal sources per spec.md's Assumptions — this feature only needs to *emit* point-eligible signals to 006 and *consume* mentor/instructor/course/event identity as externally-supplied data, not define any of those systems itself.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–004.

**Primary Dependencies**: NestJS, Next.js, Flutter; a real-time transport for messages/typing-indicators/read-receipts/reaction-counts (FR-127 — NEEDS CLARIFICATION: WebSocket vs. managed real-time service not named in source); a language-aware content-moderation/NLP capability for Tamil/Tanglish/transliterated-term detection (FR-106 — NEEDS CLARIFICATION: no vendor/technique named, consistent with the source not committing to a specific AI/ML approach per spec.md Assumptions); malware/virus scanning for uploads (shared pattern with `002`/`004`); a link-reputation/domain-safety check for link posts and dangerous-domain warnings (FR-019, FR-092).

**Storage**: PostgreSQL (~35 entities per spec.md's Key Entities — post, networking, group, messaging, moderation domains), Redis (real-time presence/typing state, feed-ranking cache, rate-limit counters for follow/connect/message/report actions), object storage with signed URLs for post media and message attachments.

**Testing**: Jest (backend — feed-ranking, reporter-anonymity, and block-effect contract tests are the highest-stakes here), Playwright (web e2e), Flutter test (mobile — offline draft/reaction-queue scenarios per FR-128).

**Target Platform**: Web + mobile, consistent with prior features; messaging and reaction/comment counts need real-time delivery (FR-127).

**Performance Goals**: Cursor-based feed pagination with fast first-meaningful-content, optimistic reaction updates, comment lazy-loading, CDN media delivery, real-time message/typing/read-receipt delivery with reconnection reconciliation (FR-126, FR-127).

**Constraints**: Feed ranking MUST NOT be primarily engagement-volume-driven (FR-003, FR-004, Constitution Article VIII); reporter identity MUST NEVER be exposed to the reported party at any stage (FR-088, SC-005); high-impact permanent moderation actions (permanent ban/removal) MUST require human review even when automated detection flags them (FR-091, SC-006); blocked-user effects MUST hold even inside shared group co-membership (FR-045, SC-008); share counts MUST only increment on confirmed successful shares, never on menu-open (FR-040, SC-003); moderator access to private message content is minimum-necessary, not full-history-by-default (FR-098, edge case).

**Scale/Scope**: ~35 data entities, 128 functional requirements, 9 user stories, a community analytics-event taxonomy (FR-118) and a language-aware moderation requirement spanning Tamil/Tanglish/English/mixed content.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Group roles, moderator permissions, block effects all enforced backend-side | **PASS (extends 001)** | Reuses `001`'s `RbacGuard`, no new engine |
| II. AI Is Assistive, Never Autonomous | AI-assisted ranking/moderation (if used) is advisory; high-impact automated actions require human review | **PASS** | FR-091, SC-006 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | Financial Claim Policy: no guaranteed-result claims, mandatory paid-promotion disclosure, distinguishable verified-vs-unverified claims | **PASS — direct implementation** | FR-103–FR-105 |
| IV. Historical Immutability | Moderation decisions and edit history are append-only audit records | **PASS** | FR-099, FR-029 |
| V. Ledger-Based Internal Economies | Community Points deferred entirely to `006`; this feature only emits point-eligible signals, excluding vanity actions | **PASS (deferred)** | FR-109, spec.md Assumptions |
| VI. Consent Is First-Class | Notification preferences per category/channel; safety notifications cannot be disabled | **PASS** | FR-084 |
| VII. Layered, Explicit RBAC | Group roles (owner/admin/moderator/contributor/member/read-only), moderator permission isolation | **PASS (extends 001)** | FR-059, FR-114 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | **This feature is a constitution-cited source article** ("Vol 05 share-count integrity, closing principle") — feed ranking excludes raw engagement; share counts require confirmed action; reputation score not publicly sold/displayed | **PASS — primary implementer** | FR-003, FR-040, FR-108 |
| IX. Action Before Consumption | N/A — this is a social/community feature, not a learning module | **PASS (N/A)** | — |
| Localization & Language Requirements | Tamil/Tanglish/English as first-class throughout; moderation MUST NOT rely on English-keyword matching alone | **PASS — primary implementer** | FR-106, FR-125 — this constitution section is directly sourced from this volume |
No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/005-community-social-trust-safety/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: real-time transport choice, language-aware moderation/NLP approach, link-reputation service, interim minor/guardian-consent default (flagged NEEDS CLARIFICATION pending legal review per spec.md), and numeric defaults for every "configurable" control (text length, appeal window, mute duration, edit time window, strike expiry, max pinned count, pre-acceptance message limit)
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`004`'s structure — no new top-level projects.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── social-post/          # Community Post, Post Media, Post Link Preview, Post Audience, Post Draft, Post Reaction, Comment, Comment Reaction, Hashtag, Mention (FR-011–FR-045)
│   │   ├── social-qa/            # Question, Accepted Answer, Poll/Poll Option/Poll Vote (FR-020–FR-022)
│   │   ├── social-feed/          # Feed ranking engine, explainability ("Why am I seeing this?"), Community Home composition (FR-001–FR-010)
│   │   ├── social-network/       # Follow, Connection Request/Connection, Member Directory (FR-046–FR-053)
│   │   ├── social-groups/        # Group, Group Member/Role, Group Rule, Group Channel, Group Invitation (FR-054–FR-067)
│   │   ├── social-discovery/     # Community search, trending, Discover page (FR-068–FR-070)
│   │   ├── social-messaging/     # Direct Conversation, Message, Message Attachment, Message Request (FR-071–FR-080)
│   │   ├── social-notifications/ # Community notification generation/grouping/routing (FR-081–FR-084)
│   │   ├── trust-safety-community/ # Report, Moderation Case, Moderation Action/Decision, Appeal, Strike, User Block, User Mute, Financial Claim Policy, language-aware detection (FR-085–FR-107)
│   │   ├── social-reputation/    # Community Badge, Trust Signal, point-eligible-signal emission to 006 (FR-108–FR-109)
│   │   └── social-admin/         # Admin community dashboard, post/group/member/comment management, featuring/pinning (FR-110–FR-117)
│   └── common/                   # reused from 001–004: RbacGuard, audit-log interceptor, rich-text sanitizer (new, shared going forward per FR-014)
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (member)/
        ├── community/{page.tsx, feed/page.tsx, discover/page.tsx}
        ├── community/groups/{page.tsx, [groupId]/page.tsx}
        ├── community/messages/{page.tsx, [conversationId]/page.tsx, requests/page.tsx}
        ├── community/profile/[username]/page.tsx
        └── community/post/[postId]/page.tsx
    └── (admin)/
        └── community/{dashboard,posts,groups,members,comments,moderation-console,reports}/

mobile/
└── lib/features/
    └── community/                # feed, composer, groups, messaging, offline draft/reaction queue (FR-128)
```

**Structure Decision**: 10 new backend modules under `social-*`/`trust-safety-community`, kept parallel to (not merged with) `001`'s generic RBAC/audit modules, which they extend rather than redefine. The rich-text sanitizer built here (FR-014) is deliberately placed in `backend/src/common/` since it's a generic capability other future content-creating features are likely to need — flagged for a future architect to formally promote if a second consumer emerges, not assumed shared prematurely.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
