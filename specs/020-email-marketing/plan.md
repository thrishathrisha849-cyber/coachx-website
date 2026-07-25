# Implementation Plan: Email Marketing: Templates, Personalization, Delivery & Analytics

**Branch**: `020-email-marketing` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/020-email-marketing/spec.md`

## Summary

This feature builds the platform's email channel engine: a brand-inheriting visual template builder with dynamic, audience-conditional content blocks progressing through Draft→Review→Approved→Published→Archived; a 4-class email taxonomy (Transactional/Marketing/Lifecycle/Trigger-Based) with strict priority ordering; merge-tag personalization with fallback values; an AI Email Assistant; a scheduling/delivery engine with pluggable providers, queues, and failover; a mandatory pre-send deliverability score (SPF/DKIM/DMARC/reputation/links/spam-keywords/unsubscribe-presence); automatic soft/hard bounce handling and suppression-list management; immediate-effect unsubscribe/preference management; A/B testing with automatic winner rollout; inbox-rendering previews; and near-real-time analytics.

This chapter is not cited by name in the constitution, but User Story 5's unsubscribe mechanism is explicitly framed by its own spec.md as **"a direct implementation of Constitution Article VI"** — an unsubscribe/preference change must take effect immediately and propagate to in-flight or newly scheduled sends without delay, with the action recorded for compliance (FR-039, FR-040, SC-005). The AI Email Assistant (FR-017, FR-018) remains advisory only, consistent with Article II, though this spec flags that the chapter itself doesn't restate an explicit human-approval gate the way other Volume 14 chapters do — canonical ownership of that gate is deferred to `025`.

Per spec.md's own Assumptions, this feature **defines the email-channel engine, not the data or governance models other features own**: consent state (Article VI) is read and re-checked before every send, not originated, here — its data model belongs to `013`/`019`; RBAC/approval-chain roles for template publishing and campaign sending belong to `016`; the AI Email Assistant's approval-workflow canonical ownership sits with `025`; and Revenue Attribution shown in analytics consumes `027`/`028`'s attribution model rather than defining its own. Named provider integrations (Amazon SES, SendGrid, Mailgun, Postmark, SMTP Relay, Microsoft Exchange, Gmail SMTP, Custom SMTP) sit behind a common provider-abstraction layer, consistent with the same pattern established in `001`/`009` — no single mandatory default provider is named for MVP.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–019.

**Primary Dependencies**: NestJS, Next.js; a pluggable email-provider adapter layer (Amazon SES, SendGrid, Mailgun, Postmark, SMTP Relay, Microsoft Exchange, Gmail SMTP, Custom SMTP — FR-023, no default named); AI Email Assistant consuming `008`'s shared AI gateway (FR-017); a job scheduler/queue system for send batching, retries, and failover (FR-021, FR-022); a domain-authentication validation service (SPF/DKIM/DMARC) for the deliverability score (FR-025); audience/segment/consent data consumed directly from `019` (FR-015, FR-016).

**Storage**: PostgreSQL (~12 entities per spec.md's Key Entities — Email Template/Content Block, Merge Tag, Brand Kit, Send Job/Campaign Send, Deliverability Score, Provider Configuration, Bounce Record, Suppression List Entry, Unsubscribe/Preference Record, A/B Test, Email Event/Tracking Record, Analytics Report domains), Redis (send-queue/batch state, rate-limit/throttle counters, near-real-time analytics aggregation).

**Testing**: Jest (backend — transactional-priority-over-marketing-batch, deliverability-score-mandatory-before-send, and hard-bounce-and-unsubscribe-suppression contract tests are the highest-stakes tests here, matching this spec's own SC-009, SC-003, and SC-004/SC-005), Playwright (web e2e — template builder, A/B test configuration, analytics dashboard).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell); this is the email-channel engine `018`'s campaigns and `022`'s automation workflows send through.

**Performance Goals**: Template load under 2s; email preview under 3s; personalization processing under 500ms per recipient; queue creation under 5s; dashboard refresh under 2s; analytics update under 30s (FR-046, SC-001, SC-002, SC-006).

**Constraints**: Transactional emails are dispatched ahead of concurrently queued Marketing/Lifecycle batches 100% of the time, reflecting their "Highest" priority classification (FR-003, SC-009); every Marketing and Lifecycle campaign receives a deliverability score before leaving the send queue (FR-026, SC-003); zero sends reach an address already on the suppression list — hard bounce, spam complaint, manual exclusion, regulatory exclusion, or global unsubscribe (FR-042, SC-004); every recorded unsubscribe action takes effect immediately, with zero emails delivered to a contact after their recorded unsubscribe timestamp for the unsubscribed scope (FR-040, SC-005, Constitution Article VI); soft bounces are automatically retried, hard bounces are automatically and immediately suppressed (FR-037, FR-038); completed A/B tests automatically roll out the winning variant to the remaining audience without manual triggering once the test duration elapses (FR-029, SC-007); the delivery engine processes campaigns addressed to millions of recipients via asynchronous batch/queue processing without blocking concurrent send jobs (FR-022, SC-008).

**Scale/Scope**: ~12 data entities, 46 functional requirements (FR-001–FR-046), 7 user stories, 4 email classes (28 named sub-types across Transactional/Marketing/Lifecycle/Trigger-Based), and 8 NEEDS CLARIFICATION items in spec.md's Assumptions/Edge Cases (default provider, merge-tag fallback templating-engine choice, bounce-retry ceiling/soft-to-hard conversion threshold, un-suppression/appeal path, deliverability-check pass/fail send-blocking threshold, mid-campaign spam-complaint-spike auto-pause behavior, unknown-timezone send-time fallback, and A/B test tie-break/insufficient-data rule).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Deliverability scoring, bounce classification, suppression enforcement, and priority queueing are all server-side, never client-asserted | **PASS — direct implementation (not the constitution's named source for this article)** | FR-025, FR-036, FR-042 |
| II. AI Is Assistive, Never Autonomous | AI Email Assistant output remains advisory; a human must review/approve AI-assisted content before a campaign using it sends | **PASS (aligns; canonical approval-gate ownership deferred to 025, flagged NEEDS CLARIFICATION for this chapter's own restatement)** | FR-017, FR-018 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A — this is a channel/delivery-engine chapter with no customer-facing outcome-claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | Bounce records, suppression entries, and unsubscribe timestamps are append-only compliance records, never silently rewritten | **PASS (aligns; not the constitution's named source for this article)** | FR-040, FR-044 |
| V. Ledger-Based Internal Economies | N/A — Revenue Attribution surfaced in analytics is consumed from `027`/`028`'s model, not computed or ledgered here | **PASS (N/A / deferred)** | spec.md Assumptions |
| VI. Consent Is First-Class | **This spec's own User Story 5 explicitly frames unsubscribe/preference handling as a direct implementation of this article** — immediate effect, propagation to in-flight sends, compliance recording | **PASS — direct implementation, spec.md explicitly applies this article** | FR-039, FR-040, SC-005 |
| VII. Layered, Explicit RBAC | Template approval/publish, campaign send, and SMTP-credential visibility reuse `016`'s RBAC model directly | **PASS (extends 016)** | FR-045 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Merge tags support language/city personalization; dynamic content blocks can serve Tamil vs. English content by audience attribute | **PASS (aligns; not the constitution's named source for this article)** | FR-013, FR-015 |
| Security & Compliance Baseline | Secure SMTP credential storage, TLS encryption, encrypted API communication, audit logging, domain verification, sender authentication; GDPR/CAN-SPAM/CASL/PECR compliance | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-043–FR-045 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/020-email-marketing/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: default/primary email provider for initial launch, merge-tag templating-engine choice, bounce-retry ceiling/soft-to-hard conversion threshold, hard-bounce un-suppression/appeal process, deliverability-check pass/fail send-blocking threshold, mid-campaign spam-complaint-spike auto-pause behavior, unknown-timezone send-time fallback, and A/B test tie-break/insufficient-data rule
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`019`'s structure — no new top-level projects; this feature is the email-channel engine `018`'s campaigns and `022`'s automation workflows send through, consuming `019`'s audience/consent data and `016`'s RBAC.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── email-classes/          # Transactional/Marketing/Lifecycle/Trigger-Based taxonomy, priority queueing (FR-001–FR-006)
│   │   ├── email-template/         # Email Template, Content Block, Brand Kit, visual builder (FR-007–FR-012)
│   │   ├── email-personalization/  # Merge Tag, Dynamic Content Block conditions (FR-013–FR-016)
│   │   ├── email-ai-assistant/     # AI Email Assistant, campaign-scoped touchpoints (FR-017–FR-018)
│   │   ├── email-scheduling/       # Send Job/Campaign Send, scheduling modes, delivery engine, provider adapters (FR-019–FR-024)
│   │   ├── email-deliverability/   # Deliverability Score, pre-send validation (FR-025–FR-026)
│   │   ├── email-ab-testing/       # A/B Test, winner determination/rollout (FR-027–FR-029)
│   │   ├── email-inbox-preview/    # inbox rendering previews (FR-030–FR-031)
│   │   ├── email-tracking/         # Email Event/Tracking Record, Analytics Report (FR-032–FR-035)
│   │   ├── email-bounce-suppression/ # Bounce Record, Suppression List Entry, Unsubscribe/Preference Record (FR-036–FR-042)
│   │   └── email-compliance/       # consent-record reference, privacy-policy links, retention, audit trail (FR-043–FR-044)
│   └── common/                     # reused from 001: RbacGuard, audit-log interceptor; reused from 016: RBAC/approval; reused from 019: audience/consent data; reused from 008: AI gateway
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── email/{templates,brand-kit,campaigns,providers,ab-tests,analytics,suppression-list,compliance}/
```

**Structure Decision**: 11 new backend modules under `email-*`, each mapping to one of spec.md's FR groupings. `email-classes` (priority-queue integrity) and `email-deliverability`/`email-bounce-suppression` (sender-reputation protection) are built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
