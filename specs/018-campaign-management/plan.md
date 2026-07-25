# Implementation Plan: Campaign Management: Lifecycle, Creation, Scheduling & Publishing

**Branch**: `018-campaign-management` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-campaign-management/spec.md`

## Summary

This feature builds the marketing platform's core operational engine: 6 campaign categories across an 11-stage lifecycle (Idea→Archived); a 9-step guided creation wizard (Basic Info→Objectives→Audience→Channels→Content→Attachments→Tracking→Approval→Schedule); a 4-mode scheduling engine (Immediate/Scheduled/Recurring/Event-Based); pre-publish validation blocking broken/incomplete/unapproved campaigns with actionable errors; a mandatory content-review-and-approval gate; immutable version control (compare/restore/download); an AI Campaign Assistant with a hard human-review gate before any AI content reaches members; a campaign dashboard, reusable templates, and duplication; multi-editor collaboration; and real-time execution monitoring.

This chapter directly implements two constitution articles named explicitly in its own Input description: **Article II (AI Is Assistive, Never Autonomous)** — every AI-generated name/subject-line/content/CTA/audience recommendation requires an explicit, recorded human review-and-approval action before it can reach Published status, with predictions clearly labeled as estimates, never guarantees (FR-048, FR-049, SC-005) — and **Article VII (Layered, Explicit RBAC With Approval Chains)** — the mandatory Content Review and Approval lifecycle stage gates every campaign before Scheduling (FR-019, User Story 4). Its own spec.md flags a direct conflict between the source's "Future Roadmap" item "Autonomous AI campaign execution" and Article II, treating the roadmap item as explicitly out of scope until that conflict is resolved.

Per spec.md's own Assumptions, this feature **defines the shared campaign object and lifecycle, not the underlying mechanics other features own**: per-channel send/delivery (email rendering/deliverability, SMS/WhatsApp/push provider integration, landing pages, social posts) belongs to `020`/`021`/`023`/`031`; audience/segment computation belongs to `019` (this chapter's "Audience Selection/Snapshot" entity only references and snapshots that data); the AI provider/model gateway belongs to `008` (this chapter defines only the campaign-scoped AI touchpoints and their human-review gate); RBAC roles and the approval-chain hierarchy belong to `016`; attribution/ROI computation methodology belongs to `027`/`028` (this chapter only surfaces the resulting numbers on the dashboard); and per-channel consent re-checking before automated recurring/event-based sends belongs to `032`'s omnichannel orchestration, per Constitution Article VI. It explicitly distinguishes itself from `025`'s broader "AI Marketing Assistant" — this chapter is canonical only for the compact, campaign-creation-scoped AI touchpoints (name/subject-line/content/CTA generation, audience/send-time recommendations, predicted performance, campaign scoring).

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–017.

**Primary Dependencies**: NestJS, Next.js; audience/segment resolution consuming `019`'s CDP directly (FR-013, FR-014); AI Campaign Assistant consuming `008`'s shared AI gateway (FR-039–FR-047); RBAC/approval-chain consuming `016`'s permission model directly (FR-063, Step 8); a job scheduler for Scheduled/Recurring/Event-Based campaign triggers (FR-021–FR-026); a link-checker/content-validation service for pre-publish validation (FR-027–FR-029, no vendor named).

**Storage**: PostgreSQL (~13 entities per spec.md's Key Entities — Campaign, Campaign Version, Campaign Schedule, Audience Selection/Snapshot, Channel Configuration, Campaign Content, Attachment, Tracking Configuration, Approval Record, AI Suggestion, Campaign Template, Duplication Record, Dashboard Metrics domains), with `Campaign Version` stored as an append-only, never-overwritten snapshot table (FR-038).

**Testing**: Jest (backend — pre-publish-validation-blocking, AI-content-never-publishes-without-human-review, and version-history-never-overwritten contract tests are the highest-stakes tests here, matching this spec's own SC-002, SC-005, and SC-004), Playwright (web e2e — 9-step wizard, approval flow, version compare/restore).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell); this is the shared campaign engine every channel-specific feature (020/021/023/031) and every AI/analytics feature (025/027/028) plugs into.

**Performance Goals**: Campaign creation under 2s; draft save under 1s; pre-publish validation under 3s; publish action under 10s; dashboard refresh under 2s; campaign search under 500ms (FR-065, SC-001, SC-002, SC-003, SC-008).

**Constraints**: Every one of 9 named pre-publish validation conditions (missing audience, invalid schedule, empty content, approval pending, missing tracking, expired template, channel unavailable, budget exceeded, broken link/missing image/unresolved personalization) blocks publishing with an actionable error, never a generic one (FR-027–FR-030, SC-002); no AI-generated name/subject-line/content/CTA reaches Published status without a recorded, explicit human review action against that specific content (FR-048, SC-005, Constitution Article II); every campaign save creates a new, non-destructive version record — no prior version is ever overwritten (FR-033, FR-038, SC-004); every lifecycle-stage and status transition produces an audit record (FR-005, FR-007, SC-006); recurring/event-based campaigns respect their configured expiry with zero sends triggered after it (FR-026, SC-009); a campaign cannot progress to Scheduled without a recorded Approved decision (FR-019, User Story 4 acceptance scenario 3).

**Scale/Scope**: ~13 data entities, 65 functional requirements (FR-001–FR-065), 7 user stories, 6 campaign categories, an 11-stage lifecycle, a 9-step wizard, and 4 NEEDS CLARIFICATION items in spec.md's Assumptions (the Article-II-conflicting "autonomous AI campaign execution" roadmap item, restore-vs-re-approval behavior, concurrent-edit conflict resolution, and the numeric "budget exceeded" threshold).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Pre-publish validation, budget/schedule checks, and approval-gate enforcement all run server-side | **PASS — direct implementation (not the constitution's named source for this article)** | FR-027, FR-028 |
| II. AI Is Assistive, Never Autonomous | Every AI-generated campaign name/subject-line/content/CTA/audience recommendation requires explicit, recorded human review before publish; predictions labeled as estimates, never guarantees; spec.md explicitly flags the source's "autonomous AI campaign execution" roadmap item as conflicting with this article and out of scope | **PASS — direct implementation, spec.md explicitly applies this article** | FR-048, FR-049, SC-005 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | AI-predicted open rate/CTR/campaign score visually and functionally distinguished as estimates, not guarantees | **PASS (aligns; not the constitution's named source for this article)** | FR-049 |
| IV. Historical Immutability | Every campaign save creates a new, non-destructive version record; no prior version is ever overwritten, including on restore | **PASS (aligns; not the constitution's named source for this article)** | FR-033, FR-038, SC-004 |
| V. Ledger-Based Internal Economies | N/A — campaign budget/revenue/ROI are surfaced, not computed or ledgered, here; computation belongs to `027`/`028` | **PASS (N/A / deferred)** | spec.md Assumptions |
| VI. Consent Is First-Class | Automated recurring/event-based sends re-check per-channel consent immediately before each send, per `032`'s implementation of this article | **PASS (aligns; deferred implementation to 032)** | spec.md Assumptions |
| VII. Layered, Explicit RBAC With Approval Chains | Mandatory Content Review and Approval lifecycle stage gates every campaign before Scheduling; reuses `016`'s RBAC/approval-chain model directly | **PASS — direct implementation (extends 016)** | FR-019, FR-063, User Story 4 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Not addressed directly in this chapter's own requirements — campaign content language is a Content/Personalization concern of Step 5, not this chapter's own localization requirement | **PASS (N/A for this feature's own surface)** | — |
| Security & Compliance Baseline | RBAC enforcement, audit logging, secure file uploads, encrypted API communication, session validation, rate limiting across all campaign operations | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-063, FR-064 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/018-campaign-management/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: the Article-II conflict flagged for "autonomous AI campaign execution," restore-vs-re-approval behavior on version restore, concurrent-multi-editor conflict resolution (merge/lock/divergent-versions), and the numeric "budget exceeded" validation threshold/comparison basis
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`017`'s structure — no new top-level projects; audience resolution calls `019`, AI touchpoints call `008`, approval/RBAC calls `016`, and per-channel delivery is deferred to `020`/`021`/`023`/`031`.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── campaign-core/          # Campaign entity, category catalog, lifecycle/status state machines, audit trail (FR-001–FR-009)
│   │   ├── campaign-wizard/        # 9-step creation wizard orchestration (FR-010–FR-020)
│   │   ├── campaign-scheduling/    # Campaign Schedule, 4 scheduling modes, job-scheduler integration (FR-021–FR-026)
│   │   ├── campaign-validation/    # pre-publish validation engine, publishing workflow (FR-027–FR-032)
│   │   ├── campaign-versioning/    # Campaign Version, compare/restore/download (FR-033–FR-038)
│   │   ├── campaign-ai-assistant/  # AI Suggestion, campaign-scoped AI touchpoints + human-review gate (FR-039–FR-049)
│   │   ├── campaign-dashboard/     # Dashboard Metrics, Campaign Template, Duplication Record, archiving (FR-050–FR-058)
│   │   └── campaign-collaboration/ # multi-editor support, comments/mentions/activity timeline, real-time monitoring (FR-059–FR-062)
│   └── common/                     # reused from 001: RbacGuard, audit-log interceptor; reused from 016: approval-chain engine; reused from 019: audience resolution; reused from 008: AI gateway
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── campaigns/{page.tsx, create/[step]/page.tsx, [campaignId]/{page.tsx,versions,approval,monitor}/}
```

**Structure Decision**: 8 new backend modules under `campaign-*`, each mapping to one of spec.md's FR groupings. `campaign-validation` (the platform's primary safeguard against broken/unapproved sends) and `campaign-ai-assistant`'s human-review gate are built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
