# Implementation Plan: Social Media Marketing, Content Publishing & Community Distribution

**Branch**: `031-social-media-content-publishing` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/031-social-media-content-publishing/spec.md`

## Summary

This feature builds the platform's social-media operating system: multi-brand/multi-account platform-connection management across 20+ destinations (social, video, messaging, community, blogging, podcast); a 11-stage content lifecycle (Idea→...→Optimization) with an AI content generator/creative assistant (server-side-only, deterministic-fallback-guaranteed); AI Content Repurposing of one source item into 12+ platform-specific formats with per-send consent re-checking; a content calendar/campaign-planning/scheduling system; a configured approval workflow (Author→Reviewer→Manager→optional Legal→Executive) with parallel/sequential approvals and an audited emergency-publish bypass; simultaneous multi-platform publishing with automatic per-platform format adaptation and per-platform status tracking; automated internal community distribution; digital/brand asset libraries; an AI hashtag engine; AI-powered trend detection and Tamil/Tanglish-aware social listening with sentiment classification and alerting; a unified comment/messaging inbox with AI-suggested (human-reviewed) replies and conflict-free assignment; content/community analytics and an Executive Dashboard; revenue attribution integrating with the platform's Attribution & ROI module; cross-role collaboration; and security/compliance/API requirements.

**This chapter is not cited by name in the constitution's own source list, and its FR text does not quote "Constitution Article N" verbatim, but User Story 3's own rationale explicitly names two constitutional principles by their descriptive titles**: "Per the platform-wide 'AI is assistive, never autonomous' and 'layered, explicit RBAC with approval chains' principles, no AI-drafted or human-drafted content may go live without human sign-off." This is a softer self-citation form than `025`/`026`/`029`'s literal "Constitution Article N" FR quotes, but unambiguous in intent, and is independently reinforced by FR-011 (AI calls execute server-side only, no client-exposed keys/prompts — Article II's own operational requirements, unquoted) and FR-046 (AI-suggested replies require human review/send before delivery). FR-055's requirement that a finalized attribution snapshot "MUST NOT be retroactively altered by later attribution-model configuration changes" mirrors Article IV's Historical Immutability pattern without naming it, consistent with this feature deferring the actual attribution computation to `028` (see below) rather than re-deriving Article IV compliance independently.

Per spec.md's own Assumptions, this feature explicitly does not redefine three adjacent systems, cross-referencing rather than duplicating them: (1) **Feature `008` (AI Assistant Platform)** owns the AI orchestration internals (model routing, prompt architecture, provider integration) behind every AI capability here — content generation, repurposing, hashtag/trend recommendations, performance optimization, and suggested replies; this spec defines only which social/content capabilities must be exposed. (2) **Feature `005` (Community, Social, Trust & Safety)** is the destination and access-control authority for Internal Community publishing and Community Distribution — this spec does not redefine community membership, moderation, or trust/safety rules. (3) **Feature `028` (Attribution & ROI Measurement)** owns the actual multi-touch attribution computation; this feature only feeds attributable touchpoints into it and displays results, per FR-054's explicit requirement not to implement "a separate, independent attribution model."

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–030.

**Primary Dependencies**: NestJS, Next.js; all AI content generation/repurposing/hashtag/trend/reply-suggestion capabilities consuming `008`'s AI gateway rather than a separate AI stack; Internal Community publishing/distribution routed through `005`'s existing community/access-control rules; revenue-attribution touchpoints fed into `028`'s attribution engine rather than computed independently; OAuth connections to 20+ external platform APIs (Facebook, Instagram, LinkedIn, X, Threads, YouTube, Telegram, WhatsApp, etc.).

**Storage**: PostgreSQL (~15 entities per spec.md's Key Entities — Platform Connection, Content Item, Repurposed Content Variant, Campaign, Approval Record, Digital Asset, Brand Asset, Hashtag, Trend Alert, Social Mention, Sentiment Alert, Inbox Message, Community Distribution Rule, Revenue Attribution Record, Audit Log Entry domains), with Revenue Attribution Record snapshotted immutably at conversion time and Audit Log Entry immutable.

**Testing**: Jest (backend — multi-platform-publish-per-platform-status-tracking, no-publish-without-complete-approval-chain, and ai-content-never-delivered-without-human-review contract tests are the highest-stakes tests here, matching this spec's own SC-002, SC-004, and SC-008), Playwright (web e2e — content editor/repurposing flow, approval-chain routing, unified inbox assignment).

**Target Platform**: Web (Admin/Content Portal, rendered inside `017`'s workspace shell); this is the content-operations layer publishing into `005`'s community surfaces and feeding `028`'s attribution engine.

**Performance Goals**: Publish requests under 3s; trend-detection alerts within 5 minutes of detection; Analytics Dashboard load under 3s; Content Editor load under 2s; AI Caption generation under 5s (FR-030, FR-037, FR-052, SC-002, SC-005, SC-009).

**Constraints**: A single publish action delivers correctly-formatted content to all selected platforms with per-platform status visible, in under 3s (FR-026–FR-030, SC-002); no content item reaches Published without every approval required by its configured chain, with 100% of emergency bypasses audit-logged (FR-024–FR-025, SC-004); AI-generated content and AI-suggested replies are never delivered to an end customer or public platform without a recorded human review/approval step (FR-046, SC-008); social listening/sentiment classification natively handles Tamil/Tanglish, not English-only keyword matching (FR-040, SC-005); unified-inbox conversation assignment prevents two agents from sending conflicting replies to the same thread (FR-047, SC-006); finalized revenue-attribution records remain unchanged after later attribution-model configuration changes (FR-055, SC-007).

**Scale/Scope**: ~15 data entities, 59 functional requirements (FR-001–FR-059), 7 user stories, 20+ publishing destinations, an 11-stage content lifecycle, 12+ repurposing target formats, and 2 NEEDS CLARIFICATION items in FR text (FR-025's unspecified emergency-publishing authorization rules, FR-041's unspecified sentiment-alert threshold/SLA values) plus 2 more flagged in spec.md's Assumptions (Legal Review trigger criteria, sentiment-escalation SLA ownership) as organizational policy decisions not stated in the source.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Publish-status tracking, approval-chain enforcement, and attribution snapshotting are entirely server-side; no client-asserted publish success or approval state | **PASS — direct implementation (not the constitution's named source for this article)** | FR-028, FR-024 |
| II. AI Is Assistive, Never Autonomous | **User Story 3's rationale names "AI is assistive, never autonomous" by title**; reinforced by FR-011 (server-side-only AI execution, no client-exposed keys), FR-012 (deterministic non-AI fallback), FR-046 (AI-suggested replies require human review/send) | **PASS — direct implementation, spec.md explicitly applies this principle by name** | FR-011–FR-012, FR-046, SC-008 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | AI-disclosure labeling required on AI-generated content; brand-compliance checks | **PASS (aligns; not the constitution's named source for this article)** | FR-058 |
| IV. Historical Immutability | FR-055 requires a finalized attribution snapshot to never be retroactively altered by later model-configuration changes, mirroring Article IV without naming it, consistent with deferring actual computation to `028` | **PASS (aligns; not the constitution's named source for this article, computation deferred to 028)** | FR-055, SC-007 |
| V. Ledger-Based Internal Economies | N/A — this feature has no financial/point balance of its own | **PASS (N/A)** | — |
| VI. Consent Is First-Class | Per-channel marketing consent re-checked immediately before sending a repurposed variant on a consent-gated channel, not only at signup | **PASS (aligns; consent storage owned by platform-wide system per spec.md Assumptions)** | FR-017 |
| VII. Layered, Explicit RBAC | **User Story 3's rationale names "layered, explicit RBAC with approval chains" by title** — Author/Reviewer/Manager/Legal/Executive approval levels | **PASS — direct implementation, spec.md explicitly applies this principle by name** | FR-022–FR-024 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | Revenue attribution explicitly exists to justify social spend "with real business results instead of vanity engagement metrics alone" (User Story 7) | **PASS (aligns; explicit anti-vanity-metric framing)** | FR-053, User Story 7 |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Repurposing and social listening/sentiment classification both require Tamil/Tanglish as first-class, not machine-translation afterthoughts | **PASS (aligns; not the constitution's named source for this article)** | FR-016, FR-040 |
| Security & Compliance Baseline | RBAC, mandatory MFA for admin/finance-equivalent roles, audit logs, encryption, secure OAuth, token rotation, session monitoring, IP restrictions, GDPR/CCPA/cookie-consent compliance | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-057–FR-058 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/031-social-media-content-publishing/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: emergency-publishing authorization rules and conditions (FR-025), sentiment-alert threshold/window/escalation-SLA values (FR-041), Legal Review trigger criteria by content category (spec.md Assumptions), and sentiment-escalation SLA ownership
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`030`'s structure — no new top-level projects; this feature consumes `008`'s AI gateway, publishes into `005`'s community surfaces, and feeds `028`'s attribution engine.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── platform-connections/       # Platform Connection, OAuth/token management (FR-001–FR-005)
│   │   ├── content-lifecycle/          # Content Item, AI generation/creative assistant, editor (FR-006–FR-012)
│   │   ├── content-repurposing/        # Repurposed Content Variant, 12+ format generation (FR-013–FR-017)
│   │   ├── content-calendar-campaigns/ # Campaign, calendar views, scheduling (FR-018–FR-020)
│   │   ├── content-approval/           # Approval Record, approval-chain engine, emergency publish (FR-021–FR-025)
│   │   ├── multi-platform-publishing/  # publish orchestration, per-platform status (FR-026–FR-030)
│   │   ├── community-distribution/     # Community Distribution Rule (FR-031–FR-033)
│   │   ├── digital-brand-assets/       # Digital Asset, Brand Asset (FR-034–FR-035)
│   │   ├── ai-hashtag-engine/          # Hashtag (FR-036)
│   │   ├── trend-social-listening/     # Trend Alert, Social Mention, Sentiment Alert (FR-037–FR-041)
│   │   ├── unified-inbox/              # Inbox Message, comment/messaging aggregation (FR-042–FR-047)
│   │   ├── social-analytics-reporting/ # content/community metrics, AI Performance Optimizer, Executive Dashboard (FR-048–FR-052)
│   │   ├── social-revenue-attribution/ # Revenue Attribution Record, 028 integration (FR-053–FR-055)
│   │   └── social-collaboration-governance/ # collaboration, RBAC/MFA/compliance, APIs (FR-056–FR-059)
│   └── common/                         # reused from 008: AI gateway; reused from 005: community publish/access rules; reused from 028: attribution computation; reused from 001/016: RbacGuard
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── social/{dashboard, calendar, editor, approvals, inbox, listening, assets, executive}/
```

**Structure Decision**: 13 new backend modules under `content-*`/`multi-platform-*`/`unified-inbox`/etc. `multi-platform-publishing` (core value proposition, per-platform status correctness) and `content-approval` (governance gate before anything publishes) are built and contract-tested first. No new top-level projects; no AI-gateway, community, or attribution logic duplicated from `008`/`005`/`028`.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
