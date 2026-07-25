# Implementation Plan: SMS, WhatsApp & Push Notification Marketing

**Branch**: `021-sms-whatsapp-push-marketing` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/021-sms-whatsapp-push-marketing/spec.md`

## Summary

This feature builds the platform's mobile-first messaging channels: a centralized Communication Router that determines provider, retry strategy, and delivery priority for every outbound SMS/WhatsApp/Push message with automatic, no-duplicate provider failover; an SMS Builder with 6 campaign types and personalization/fallback; WhatsApp template management (Authentication/Utility/Marketing categories) with a mandatory provider-approval gate before live use, plus interactive features (carousels, quick replies, catalog, location/contact cards); push notifications with rich media and deep linking that resolves correctly whether the app is foreground, backgrounded, or closed; a cross-channel personalization engine; an AI Messaging Assistant; scheduling/automation; a provider-abstracted delivery engine with queueing/batching/priority/rate-limiting; delivery-status tracking and analytics; per-channel communication preferences/opt-out; and compliance/security controls.

This chapter is not cited by name in the constitution, but two of its requirements directly and explicitly apply constitutional articles in their own FR text: **FR-022** states "AI-generated message content and send-time suggestions MUST be presented as editable, advisory drafts... the AI MUST NOT autonomously dispatch a campaign" citing **"Constitution Principle II"** verbatim; and **FR-039**/SC-008 require preference and consent updates to apply immediately across all campaigns and in-flight automated journeys, citing **"Constitution Principle VI"** verbatim. Both are treated here as direct implementations, not merely aligned behavior.

Per spec.md's own Assumptions, this feature **is the SMS/WhatsApp/Push channel layer, not the systems it integrates with at the Communication Router boundary**: audience selection is owned by `019`; this module explicitly "complements" `020` (Email) as a sibling channel, not a replacement; event-driven/workflow-triggered sends are owned by `022`; and the broader cross-channel composition/orchestration layer is owned by `032` — none of those systems' internals are redefined here, only referenced at the Router's integration boundary. Named SMS/WhatsApp/Push providers (Twilio, MSG91, Textlocal, Vonage, AWS SNS / Meta WhatsApp Business Platform, Twilio WhatsApp, Gupshup, Infobip, 360dialog / FCM, APNs, OneSignal, Web Push API) sit behind the same pluggable Provider Route abstraction established for email in `020` — no exhaustive or exclusive provider list is implied. It **reuses `016`'s RBAC model** directly for all messaging-platform actions (FR-045) and consumes `008`'s shared AI gateway for the AI Messaging Assistant rather than building a parallel AI stack.

**Confirmed canonical against two later Wave 5 chapters (updated 2026-07-24)**: `064` (Enterprise Integration Platform, iPaaS) and `069` (Enterprise Communication & Omnichannel Engagement) each independently claimed this feature's SMS/WhatsApp/Push sends should route through *their* channel infrastructure instead. Both claims were checked against this feature's actual plan.md and corrected in the other feature's own plan.md rather than here: this feature's Provider Route (14 named providers with failover, its own "provider-failover-no-duplicate-delivery" contract test) remains the canonical SMS/WhatsApp/Push provider-connectivity layer. `064`'s "Communication Platforms" connectors and `069`'s Unified Inbox/Outbox both sit *above* this feature's Provider Route — `064` as a general-purpose connector catalog for other departments' use cases, `069` as the conversation-merging layer consuming delivery/read-receipt events from this feature's sends — neither replaces it. Separately, `069/plan.md` §2 identifies this feature's own "Communication Preference/Consent Record" entity as the marketing-specific consumer of `069`'s now-canonical, platform-wide Notification/Consent model (`069` covers all 10 notification types, not just marketing); this feature's existing consent-check mechanism should reference `069`'s canonical record going forward rather than maintaining an independent one.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–020.

**Primary Dependencies**: NestJS, Next.js, Flutter (deep-link resolution on-device); a pluggable provider-adapter layer per channel (SMS: Twilio/MSG91/Textlocal/Vonage/AWS SNS/custom; WhatsApp: Meta WhatsApp Business Platform/Twilio WhatsApp/Gupshup/Infobip/360dialog; Push: FCM/APNs/OneSignal/Web Push API — FR-031–FR-033); AI Messaging Assistant consuming `008`'s shared AI gateway (FR-021); a job scheduler/queue system for send batching, retries, and failover (FR-025–FR-030); audience data consumed directly from `019` (FR-020).

**Storage**: PostgreSQL (~9 entities per spec.md's Key Entities — Message, Channel, WhatsApp Template, Push Token, Deep Link, Provider Route, Communication Preference/Consent Record, Delivery Status Event, Personalization Token domains), Redis (send-queue/batch/rate-limit state, near-real-time delivery-status aggregation).

**Testing**: Jest (backend — provider-failover-no-duplicate-delivery, consent-suppression-before-every-send, and unapproved-WhatsApp-template-blocked-from-live-send contract tests are the highest-stakes tests here, matching this spec's own SC-007, SC-008, and FR-009), Playwright (web e2e — SMS/WhatsApp campaign builders, template approval flow), Flutter integration tests (mobile — deep-link resolution across foreground/background/closed app states).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell) + mobile (deep-link resolution and push receipt); this is the mobile-first messaging engine `022`'s automation workflows and `032`'s omnichannel orchestration send through.

**Performance Goals**: Push dispatch under 5s; SMS/WhatsApp queue creation under 3s; delivery-status update under 30s; analytics refresh under 30s; deep-link resolution under 1s (FR-051, SC-001–SC-006).

**Constraints**: Every outbound message routes through the centralized Communication Router, which determines provider/retry-strategy/priority independently per channel (FR-001, User Story 1 acceptance scenario 4); automatic provider failover occurs with zero manual intervention and zero duplicate messages delivered to any recipient, even when a delayed delivery-confirmation callback arrives after failover retry logic re-evaluates (FR-026, FR-027, SC-007); every automated send re-checks the recipient's current per-channel consent/preference immediately before dispatch — not just at audience-build time — with a withdrawn channel receiving zero further sends from any in-flight campaign or journey (FR-039, SC-008, Constitution Article VI); an unapproved WhatsApp template can never be used in a live send (FR-009); deep links resolve to the exact linked destination — never a generic home screen — regardless of whether the app is foreground, backgrounded, or closed, within 1 second (FR-017–FR-019, SC-005); AI-generated message content and send-time suggestions are always presented as editable, advisory drafts requiring explicit marketer approval — the AI never autonomously dispatches a campaign (FR-022, Constitution Article II); missing personalization attributes substitute a defined fallback value rather than an unresolved token or blank field (FR-006, FR-020).

**Scale/Scope**: ~9 data entities, 51 functional requirements (FR-001–FR-051), 7 user stories, 3 channels (SMS/WhatsApp/Push), 14 named provider integrations across the 3 channels, and 4 NEEDS CLARIFICATION items in spec.md's Assumptions/Edge Cases (WhatsApp free-form-vs-template session-window policy enforcement, retry-count/backoff-schedule/per-provider rate-limit thresholds, performance-target measurement-percentile methodology).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Communication Router provider selection, failover, and delivery-status tracking are entirely server-side; deep-link resolution is server-validated before client navigation | **PASS — direct implementation (not the constitution's named source for this article)** | FR-001, FR-035 |
| II. AI Is Assistive, Never Autonomous | **This spec's own FR-022 cites "Constitution Principle II" verbatim** — AI-generated content/send-time suggestions are always editable, advisory drafts requiring explicit marketer approval; the AI never autonomously dispatches a campaign | **PASS — direct implementation, spec.md explicitly applies this article** | FR-021, FR-022 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A — this is a channel/delivery-engine chapter with no customer-facing outcome-claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | Delivery Status Events are append-only, timestamped transitions; consent/preference change history is retained for compliance audit | **PASS (aligns; not the constitution's named source for this article)** | FR-042, Key Entities |
| V. Ledger-Based Internal Economies | N/A | **PASS (N/A)** | — |
| VI. Consent Is First-Class | **This spec's own FR-039/SC-008 cites "Constitution Principle VI" verbatim** — per-channel consent re-checked immediately before every automated send, with withdrawal propagating to in-flight journeys without delay | **PASS — direct implementation, spec.md explicitly applies this article** | FR-038–FR-041, SC-008 |
| VII. Layered, Explicit RBAC | All messaging-platform actions reuse `016`'s RBAC model directly | **PASS (extends 016)** | FR-045 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Personalization engine includes Preferred Language as a first-class audience attribute across all three channels | **PASS (aligns; not the constitution's named source for this article)** | FR-020, FR-038 |
| Security & Compliance Baseline | RBAC enforcement, API authentication, end-to-end transport encryption, secure provider-credential storage, message signing/fraud detection/rate limiting, no plain-text sensitive content, GDPR/CAN-SPAM/WhatsApp-policy/telecom-regulation compliance | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-045–FR-050 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/021-sms-whatsapp-push-marketing/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: WhatsApp free-form-vs-template session-window/category-eligibility policy enforcement rules, retry-count/backoff-schedule/per-provider rate-limit thresholds for the delivery engine, and the performance-target measurement-percentile methodology
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`020`'s structure — no new top-level projects; this feature is the SMS/WhatsApp/Push channel engine `022`'s automation workflows and `032`'s omnichannel orchestration send through, consuming `019`'s audience data and `016`'s RBAC, and sitting alongside `020` (Email) as a sibling channel.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── messaging-router/       # Communication Router, campaign pipeline, omnichannel dispatch (FR-001–FR-003)
│   │   ├── messaging-sms/          # SMS Builder, campaign types, personalization/fallback (FR-004–FR-006)
│   │   ├── messaging-whatsapp/     # WhatsApp Template lifecycle, message types, interactive features (FR-007–FR-013)
│   │   ├── messaging-push/         # Push notification delivery, rich media, deep linking (FR-014–FR-019)
│   │   ├── messaging-personalization/ # cross-channel Personalization Token resolution (FR-020)
│   │   ├── messaging-ai-assistant/ # AI Messaging Assistant, human-approval gate (FR-021–FR-022)
│   │   ├── messaging-scheduling/   # scheduling modes, event/workflow-triggered sends (FR-023–FR-024)
│   │   ├── messaging-delivery-engine/ # queueing, failover, retry, batching, priority, rate limiting (FR-025–FR-030)
│   │   ├── messaging-providers/    # per-channel Provider Route, provider-adapter layer (FR-031–FR-034)
│   │   ├── messaging-analytics/    # Delivery Status Event, analytics dashboard (FR-035–FR-037)
│   │   └── messaging-compliance/   # Communication Preference/Consent Record, opt-out, regulatory compliance (FR-038–FR-044)
│   └── common/                     # reused from 001: RbacGuard, audit-log interceptor; reused from 016: RBAC; reused from 019: audience data; reused from 008: AI gateway
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── messaging/{sms,whatsapp-templates,push,providers,preferences,analytics}/

mobile/
└── lib/features/
    └── messaging/                   # deep-link resolution, push receipt handling across app states
```

**Structure Decision**: 11 new backend modules under `messaging-*`, each mapping to one of spec.md's FR groupings. `messaging-router` (failover/no-duplicate-delivery integrity) and `messaging-compliance` (consent-propagation safety) are built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
