---
description: "Implementation plan for Feature 069 — Enterprise Communication & Omnichannel Engagement"
---

# Implementation Plan: Enterprise Communication & Omnichannel Engagement (Employee/Partner/Customer)

**Branch**: `069-enterprise-communication-omnichannel` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/069-enterprise-communication-omnichannel/spec.md`

## Summary

This feature (Volume 14, Chapter 36) is the platform's Unified Inbox/Outbox, WhatsApp-as-first-class-channel, VoIP/IVR, video, live chat, team collaboration, Notification Center, and AI Communication Intelligence platform. Per the manifest's own prior note (confirmed here), this chapter is the shared substrate several already-planned features (`021`, `052`, `060`, `061`) consume rather than reimplement — though checking that claim precisely revealed a directional nuance for `021` specifically.

## Ownership & Dependency Analysis

### §1. SMS/WhatsApp/Push Provider Connectivity vs. `021` — directional correction, consistent with the precedent already established in `064`

Spec.md's own Assumptions state `021` "is assumed to dispatch actual sends through this chapter's channel infrastructure (Email/SMS/Push/WhatsApp Features, Sections 3–4) rather than maintaining a separate send pipeline." Verified against `021`'s actual plan.md — the same check already performed once this session (`064/plan.md` §2, which corrected an identical overreach): `021` already owns a deep, self-sufficient, 14-named-provider, failover-capable `messaging-providers` module (Provider Route/adapter layer, FR-031–FR-034) with "provider-failover-no-duplicate-delivery" as one of its own highest-stakes contract tests — mature, already-complete architecture that predates this chapter.

**Ownership decision**: CORRECTED, same direction as the `064` finding — this chapter's Unified Inbox/Outbox is the **conversation-merging layer sitting above** `021`'s already-canonical SMS/WhatsApp/Push provider-connectivity layer, not a replacement for it. This chapter consumes delivery-status/read-receipt *events* from `021`'s Provider Route to populate the unified per-contact timeline (FR-002–FR-004, FR-008), rather than reimplementing SMS/WhatsApp/Push provider integration itself. This chapter's own FR-011–FR-013 (Email/SMS/Push Services) should be read as the platform-wide *capability description* consumers see, not a second provider-integration build. This chapter's genuinely new ground — voice/VoIP/IVR, video, live chat, team collaboration, and the Notification Center — has no prior-feature overlap and remains fully owned here.

### §2. Notification/Consent Entity Overlap vs. `021` — smaller, related finding

Not stated by either spec's own Assumptions. `021`'s own Key Entities already include a "Communication Preference/Consent Record" domain, predating this chapter's own Notification Preference (FR-039) and Communication Consent Record (Key Entities). **Ownership decision**: this chapter's Notification Center is the platform-wide superset (covering all 10 named notification types — system, security, workflow, assignment, community, learning, payment, support, marketing, executive — not just marketing sends); this chapter's Communication Consent Record is canonical going forward, with `021`'s existing consent-check mechanism understood as the marketing-specific consumer of the same canonical record at send time (consistent with this chapter's own Edge Case on broadcast-list consent drift). (See the note at the end of this plan regarding a cross-reference addition to `021/plan.md`.)

### §3. Team Collaboration vs. `061` (Project Management & Collaboration) — confirmed, closing that feature's own forward-declared item

`061/plan.md` §7 already forward-declared this chapter as the deferred target for its own Team Chat/Direct Messaging/Video Meetings/Screen Sharing requirement (its own FR-024), and the manifest's `069` row note already lists `061` as a known consumer of this chapter's shared communication substrate. **Ownership decision**: CONFIRMED — this chapter's Team Channels/presence/screen-sharing (FR-033–FR-034) are the substrate `061`'s project-scoped collaboration consumes, closing `061/plan.md` §7's forward-declared item.

### §4. Relationship to `052` (Enterprise CXM) and `060` (Enterprise CRM) — confirmed clean, per spec's own precise scoping

Spec.md's own Assumptions state `052` and `060` own customer-facing engagement strategy/journey design/CX/CRM business logic, but render and deliver customer conversations through this chapter's Unified Inbox/Outbox, Live Chat, and Omnichannel Engagement channels rather than building independent messaging infrastructure. Consistent with the general pattern this session has established for shared-infrastructure chapters (`001`'s RBAC, `008`'s AI gateway, `063`'s workflow engine) — no correction needed.

### §5. Campaign Trigger Automation & AI Chat Workflow vs. `063` (Workflow Automation, BPM & Low-Code) — consistent with the established platform pattern

Not mentioned in spec.md's own Assumptions. `063/plan.md` §1 established that domain-specific workflow/trigger/automation FRs across the platform should be understood as configuring `063`'s general-purpose engine. **Ownership decision**: this chapter's FR-018 (WhatsApp AI-chat workflow automation) and FR-043 (trigger-based campaign delivery without manual re-approval) should configure `063`'s Event-Driven Automation and Business Rules Engine, consistent with the pattern already applied to `055`/`057`/`058`/`059`/`061`/`062`/`064`.

### §6. AI Capabilities vs. `008`/`066` — confirmed clean, transitive reuse

Not separately verified by spec.md's own Assumptions beyond the general "assistive/advisory" framing. Consistent with the established transitive-reuse pattern: this chapter's AI Chat Integration/AI Voice Assistant/AI Communication Assistant (FR-018, FR-027, FR-047–FR-049) reuse `008`'s `ai-gateway`/`ai-guardrails`, either directly or transitively via `066`'s enterprise AI/ML platform, rather than a fourth independent provider-connectivity layer.

### §7. RBAC vs. `001`/`016`/`067` — confirmed clean, standard layered-extension pattern

Not mentioned in spec.md's own Assumptions beyond a generic RBAC reference (FR-050). **Ownership decision**: this chapter's RBAC (FR-050) configures `001`'s/`016`'s existing layered engine, coordinating with `067`'s Identity/IAM layer for communication-specific roles (support agent, sales rep, department staff, communication administrator).

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–068.

**Primary Dependencies**: `021`'s already-canonical SMS/WhatsApp/Push Provider Route as the provider-connectivity layer this chapter's Unified Inbox consumes events from, not replaces (per §1, corrected direction consistent with the `064` precedent); `021`'s existing consent-check mechanism as the marketing-specific consumer of this chapter's now-canonical Communication Consent Record (per §2); `061`'s confirmed consumption of this chapter's Team Channels/collaboration substrate (per §3, closing that feature's forward-declared item); `052`/`060`'s confirmed consumption of this chapter's Unified Inbox/Live Chat/Omnichannel channels (per §4); `063`'s Workflow/Business-Rules engine for WhatsApp AI-chat automation and trigger-based campaigns (per §5); `008`'s AI gateway, directly or transitively via `066` (per §6); `001`/`016`'s layered RBAC, coordinating with `067`'s IAM (per §7).

**Storage**: PostgreSQL + message-store (14 entities per Key Entities: Conversation, Unified Inbox Item, Contact Directory Entry, WhatsApp Session, WhatsApp Broadcast List, Voice Call Record, IVR Menu/Routing Rule, AI Voice Assistant Interaction, Notification, Notification Preference, Campaign Communication Record, AI Communication Recommendation, Team Channel, Communication Consent Record).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: unified-inbox-100pct-cross-channel-history-single-view for SC-001, zero-automated-send-after-consent-withdrawal for SC-007, and ai-communication-recommendation-100pct-human-approval-before-consequential-action for SC-008), Playwright (web e2e — Unified Inbox merge view, WhatsApp automated reply/interactive button flow, IVR call routing, Notification Center preference management).

**Target Platform**: Web (Unified Inbox, IVR/Call Console, Notification Center, Campaign Dashboard, Team Collaboration workspace) and mobile (push notifications, WhatsApp, team collaboration).

**Performance Goals**: Per SC-009, the Notification Dashboard must accurately reflect unread/read/scheduled/failed counts in near-real time relative to underlying delivery events.

**Constraints**: Zero automated send may occur to a contact after consent withdrawal for the relevant channel, verified by consent re-check at send time (FR-039/Key Entities Communication Consent Record, SC-007); a WhatsApp free-form send outside the session window must be blocked with the constraint surfaced to the agent, not silently failed (Edge Cases); every AI recommendation requires human review/approval before any consequential action (FR-049, SC-008); notification delivery must honor configured channel/quiet-hours preferences except explicitly-overriding types, with any override visibly disclosed (SC-005).

**Scale/Scope**: 14 entities, 56 FRs, 8 user stories, 12 unified channel types, a 7-step campaign workflow, 10 notification types, 8 call-routing strategies, 9 privacy/security governance features, 2 explicitly self-flagged NEEDS CLARIFICATION items (WhatsApp session-window duration, notification-preference-override disclosure rule) plus 9 from Edge Cases, one directional correction consistent with the `064` precedent (§1 — the second time this session `021`'s already-deeper provider architecture has corrected a later chapter's overreaching claim), and a confirmed closure of `061/plan.md`'s forward-declared item (§3). This is the twenty-second consecutive feature this session to surface a genuine, previously-uncaught cross-feature nuance during planning.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Delivery status, read receipts, and consent checks are all server-computed, never client-asserted (FR-008, SC-007). |
| II. AI Is Assistive, Never Autonomous | PASS | FR-049 explicitly requires human review/approval before any consequential action from an AI Communication Recommendation; AI Voice Assistant escalates rather than autonomously resolving out-of-scope requests (User Story 4 acceptance scenario 2). |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | AI recommendations present Confidence Score and Business Impact transparently (FR-049), not as guaranteed outcomes. |
| IV. Historical Immutability | PASS | FR-052 requires message retention policies and audit logging for all communication activity. |
| V. Ledger-Based Internal Economies | N/A | No financial ledger surface in this feature's own scope. |
| VI. Consent Is First-Class, Per-Channel, and Versioned | PASS — **primary implementer for this platform-wide principle within this chapter** | Communication Consent Record (Key Entities) is explicitly per-channel, timestamped, source-tracked, and re-checked immediately before every automated send. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS | FR-050 requires RBAC across all channels and admin functions, configuring `001`'s/`016`'s existing engine (per §7); FR-043 requires campaign approval before delivery. |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Engagement Score and Communication KPIs are evidence-based operational metrics, not purchasable status. |
| IX. Action Before Consumption | PASS | Campaigns progress through the governed Audience Selection→...→Optimization workflow requiring approval before delivery (FR-043). |
| Localization & Language Requirements | PASS (not primary focus, inherited) | FR-012/FR-039 name localization/language among SMS and notification-preference features, consistent with the constitution's Tamil/Tanglish/English requirement. |
| Security & Compliance Baseline | PASS | FR-051 (end-to-end/data encryption), FR-052 (retention/audit logging), FR-054 (spam/abuse detection) directly implement the baseline. |

## Project Structure

### Documentation (this feature)

```
specs/069-enterprise-communication-omnichannel/
├── spec.md
├── plan.md
├── research.md         # 2 NEEDS CLARIFICATION items (self-flagged) + 9 from Edge Cases
├── data-model.md        # 14 entities (SMS/WhatsApp/Push provider events consumed from 021, per §1)
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── unified-inbox-100pct-cross-channel-history-single-view.contract.md
    ├── zero-automated-send-after-consent-withdrawal.contract.md
    └── ai-communication-recommendation-100pct-human-approval-before-consequential-action.contract.md
```

### Source Code (repository root)

```
backend/src/modules/enterprise-communication/
├── platform-foundation/              # FR-011-013 — Email/SMS/Push capability description, per §1
├── unified-inbox-outbox/             # FR-001-010 — conversation merging, consumes 021's provider events
├── whatsapp-business-api/            # FR-014-019 — automated replies, interactive buttons
├── voip-ivr/                         # FR-020-026 — call routing, queues, recording
├── ai-voice-assistant/               # FR-027 — reuses 008/066 transitively, per §6
├── notification-center/              # FR-038-040 — canonical consent/preference model, per §2
├── team-collaboration/               # FR-033-034 — confirmed substrate for 061, per §3
├── campaign-communication/           # FR-041-043 — dispatch substrate for 018/021/022, workflow via 063 per §5
├── ai-communication-intelligence/    # FR-047-049
└── video-livechat-omnichannel-analytics-security/ # FR-028-032, FR-035-037, FR-044-046, FR-050-056

web/app/(admin)/communication-portal/
├── unified-inbox/
├── whatsapp-console/
├── ivr-call-console/
├── notification-center/
├── team-collaboration/
├── campaign-dashboard/
└── ai-communication-assistant/
```

**Structure Decision**: `unified-inbox-outbox` is built and contract-tested first — spec.md's own User Story 1 rationale states this is the foundational capability every other channel plugs into; without it, "omnichannel" is just disconnected tools. `whatsapp-business-api` follows immediately given its explicit framing as a first-class enterprise channel for the platform's Tamil-first customer base.

## Complexity Tracking

*No constitution violations requiring justification. N/A.*

---

**Note on `021/plan.md` update**: §1 and §2 above extend the `021`-vs-later-chapter correction pattern already established in `064/plan.md` §2, and surface a smaller related consent/preference-entity cross-reference. Per this session's standing protocol, adding a cross-reference note to `021/plan.md` acknowledging this chapter as the conversation-merging layer above its provider infrastructure, and as the canonical Notification/Consent model, is recommended but not yet applied.
