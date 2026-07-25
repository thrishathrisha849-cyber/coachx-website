# Implementation Plan: AI Marketing Assistant, Predictive Intelligence & Content Generation

**Branch**: `025-ai-marketing-assistant` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/025-ai-marketing-assistant/spec.md`

## Summary

This feature builds the marketing-domain intelligence layer on top of `008`'s shared AI Assistant Platform: AI campaign generation (a full multi-channel draft — objective, audience, channels, landing page, email/SMS/WhatsApp sequences, push, follow-up workflow, analytics config) gated behind mandatory human approval; channel-ready content generation (copy, communications, social, sales materials) in Tamil/Tanglish/English; Predictive Intelligence (9 score types with confidence indicators); AI Customer Insights; a Recommendation Engine (campaign/customer/business); a Personalization Engine; a marketing Prompt Library with brand-voice presets; AI Image/Creative *suggestions* (no generation); a Performance Optimizer; a conversational Copilot; a continuous Learning Engine; an AI Analytics Dashboard; and governance (RBAC, Prompt Audit Log, sensitive-data masking, Content Approval Workflow).

**This chapter is directly named in the constitution's own citation list for Article II** — not merely aligned with it. The constitution's Article II source comment reads: *"Vol 14 Part 1 Ch 12 (human review before AI campaign publish)."* This spec's User Story 1 and FR-010 implement exactly that citation: an AI-generated campaign draft MUST NOT reach a published/live state without a recorded, explicit administrator approval, and the AI itself is blocked from ever performing the publish action — this is the second feature in this session (after `016` for Article VII) directly named by the constitution's own source list, distinct from the more common pattern (seen in `018`, `020`–`023`) of a feature's own FR text self-applying a constitutional article the source chapter doesn't restate.

This feature is explicitly **not a separate AI system**: per spec.md's own Assumptions and its Traceability note, the AI gateway, provider/model routing, the 10-layer prompt-priority stack, anti-hallucination doctrine, memory/personalization infrastructure, and the base Brand Voice Profile / AI Prompt Version entities are owned and already specified by `008` (Volume 08) — this spec defines only the marketing-specific generation surfaces, predictive-score display, prompt categories, brand-voice preset selection, and marketing-specific masking/audit requirements layered on that shared platform. It consumes `019`'s CDP for the audience/customer data behind Audience Intelligence and Predictive Intelligence without redefining data collection/unification; it hands AI-generated campaign components off to `020`/`021`/`023` for actual channel execution without redefining delivery mechanics; and RBAC for prompt management, brand-voice configuration, and sensitive-field classification maps to `016`'s marketing RBAC model rather than a standalone permission scheme.

Per spec.md's own Assumptions, several of the source chapter's own "Future Enhancements" (§21) — Autonomous AI Campaign Manager, Autonomous Budget Optimization, Self-Optimizing Campaigns, Autonomous Revenue Growth Assistant — are explicitly out of scope for this spec's functional requirements and, as named, would conflict with Article II absent a defined human-approval gate; this plan does not build toward them.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–024.

**Primary Dependencies**: NestJS, Next.js; directly consumes `008`'s AI gateway, provider/model routing, and 10-layer prompt-priority stack rather than rebuilding any of it (FR-001, FR-003–FR-009, FR-029); audience/customer data from `019`'s CDP (FR-011, FR-012, FR-014, FR-020); campaign-component execution handed to `020` (email), `021` (SMS/WhatsApp/push), `023` (landing pages) (FR-009); RBAC via `016`'s marketing RBAC model (FR-035).

**Storage**: PostgreSQL (~9 entities per spec.md's Key Entities — AI Campaign Draft, AI Content Output, Predictive Score, Customer Insight, Recommendation, Brand Voice Profile [preset reference to `008`'s base entity], Prompt Template, AI Usage/Prompt Audit Log Entry, AI Analytics Metric Snapshot domains), with Prompt Template edits creating a new version rather than mutating in place (FR-023) and the Prompt Audit Log append-only (FR-036).

**Testing**: Jest (backend — campaign-never-published-without-human-approval, sensitive-field-masked-before-ai-call, and predictive-score-confidence-always-displayed contract tests are the highest-stakes tests here, matching this spec's own SC-002/Constitution Article II direct citation, SC-004/User Story 4, and SC-003/User Story 3), Playwright (web e2e — campaign-draft review/approve flow, prompt library filtering, Copilot conversation).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell); this is the AI intelligence layer sitting across `018`'s campaign management, `019`'s CDP, `020`/`021`'s channels, and `024`'s lead scoring.

**Performance Goals**: Channel-ready content generation under 10s; full campaign draft generation under 15s; predictive-score recalculation under 3s; AI Marketing Dashboard refresh under 5s (FR-002, FR-007, FR-009, FR-013, SC-001, SC-003, SC-005).

**Constraints**: Generated content is always presented as an editable draft and never auto-published or auto-sent to any channel (FR-008, User Story 2); an AI-generated campaign MUST NOT reach a published/live state without a recorded human approval action, and any attempt — including by the AI itself — to publish an unapproved draft is rejected (FR-010, SC-002, Constitution Article II direct citation); every displayed predictive score and customer insight carries a visible confidence indicator (FR-015, SC-003); sensitive customer fields are masked/redacted before reaching an AI model whenever a masking rule applies, with the masking event captured in the Prompt Audit Log, and an unclassified field is excluded/blocked rather than sent unmasked by default (FR-039, SC-004); every AI marketing content-generation, campaign-generation, and recommendation action is captured in the Prompt Audit Log with no gaps (FR-036, SC-007).

**Scale/Scope**: ~9 data entities, 39 functional requirements (FR-001–FR-039), 7 user stories, 9 predictive-score types, 9 brand-voice presets, 10 prompt-library categories, and 3 NEEDS CLARIFICATION items in spec.md's Assumptions (marketing-specific AI-unavailable fallback UX, confirmation that campaign-publish is a chain-gated action under `016`'s RBAC model, and confirmation of the authoritative PII-sensitivity field registry against `013`'s consent/legal-basis definitions).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Campaign publish, approval recording, masking enforcement, and predictive-score calculation are all server-side; no client can assert an approval or a masked field passed through | **PASS — direct implementation (not the constitution's named source for this article)** | FR-010, FR-039 |
| II. AI Is Assistive, Never Autonomous | **This chapter is named directly in the constitution's own Article II source citation** — "Vol 14 Part 1 Ch 12 (human review before AI campaign publish)" — and this spec's FR-008/FR-010/User Story 1 implement exactly that requirement, plus a mandatory Content Approval Workflow for every AI output (FR-037) | **PASS — direct implementation, co-cited by the constitution itself** | FR-008, FR-010, FR-037, SC-002 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A for this chapter's own surface — AI-generated marketing copy is subject to `002`'s and `016`'s no-guaranteed-outcome-claims review, not redefined here | **PASS (N/A)** | — |
| IV. Historical Immutability | Prompt Template edits create a new version rather than overwriting; Predictive Scores are timestamped snapshots, not silently overwritten in place | **PASS (aligns; not the constitution's named source for this article)** | FR-023, Key Entities — Predictive Score |
| V. Ledger-Based Internal Economies | N/A — this feature has no financial/point balance | **PASS (N/A)** | — |
| VI. Consent Is First-Class | N/A for this chapter's own surface — personalization/channel-send consent is enforced downstream at `020`/`021`/`023`'s dispatch layer | **PASS (N/A here; enforced downstream)** | FR-020, FR-021 |
| VII. Layered, Explicit RBAC | All AI marketing platform functions — prompt management, brand-voice configuration, sensitive-field classification, campaign approval — enforce RBAC | **PASS (extends 001/016)** | FR-035, spec.md Assumptions |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Content generation supports Tamil, Tanglish, and English on request | **PASS (aligns; not the constitution's named source for this article)** | FR-007 |
| Security & Compliance Baseline | RBAC, encryption, API authentication, rate limiting, usage monitoring, Prompt Audit Log, sensitive-data masking | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-035, FR-036, FR-038, FR-039 |

No constitutional violations. No Complexity Tracking entries required for principle compliance. This is the second feature in the session (after `016`) directly named in the constitution's own source citations, and the first directly named for Article II specifically.

## Project Structure

### Documentation (this feature)

```text
specs/025-ai-marketing-assistant/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: marketing-specific AI-unavailable fallback UX (what a marketer sees when no predictive score/content can be generated at all), confirmation that campaign-publish is a chain-gated action under `016`'s RBAC model, and confirmation of the authoritative PII-sensitivity field registry against `013`'s consent/legal-basis definitions
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`024`'s structure — no new top-level projects; this feature is a marketing-domain consumer of `008`'s AI platform, reads audience data from `019`, and hands campaign components to `020`/`021`/`023` for execution.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── ai-marketing-dashboard/     # AI Marketing Dashboard (FR-001–FR-002)
│   │   ├── ai-content-generation/      # AI Content Output, copy/comms/social/sales generation (FR-003–FR-008)
│   │   ├── ai-campaign-generation/     # AI Campaign Draft, full-campaign generation, approval gate (FR-009–FR-010)
│   │   ├── ai-audience-intelligence/   # audience analysis, best-audience recommendation (FR-011)
│   │   ├── ai-predictive-intelligence/ # Predictive Score, 9 score types (FR-012–FR-013)
│   │   ├── ai-customer-insights/       # Customer Insight, confidence scoring (FR-014–FR-015)
│   │   ├── ai-recommendation-engine/   # Recommendation (campaign/customer/business) (FR-016–FR-019)
│   │   ├── ai-personalization/         # personalization engine (FR-020–FR-021)
│   │   ├── ai-prompt-library/          # Prompt Template, marketing categories, brand-voice preset selection (FR-022–FR-025)
│   │   ├── ai-creative-suggestions/    # creative-direction suggestions, no image generation (FR-026)
│   │   ├── ai-performance-optimizer/   # monitoring + optimization recommendations (FR-027–FR-028)
│   │   ├── ai-marketing-copilot/       # conversational Copilot (FR-029–FR-030)
│   │   ├── ai-learning-engine/         # continuous learning, periodic retraining (FR-031–FR-032)
│   │   ├── ai-marketing-analytics/     # AI Analytics Metric Snapshot, AI Analytics Dashboard (FR-033–FR-034)
│   │   └── ai-marketing-governance/    # RBAC enforcement, Prompt Audit Log, Content Approval Workflow, masking (FR-035–FR-039)
│   └── common/                         # reused from 008: AI gateway, provider routing, prompt-priority stack, base Brand Voice Profile/AI Prompt Version entities; reused from 001/016: RbacGuard; reused from 019: CDP audience data; reused from 020/021/023: channel execution
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── ai-assistant/{dashboard, content-generator, campaign-generator, insights, recommendations, prompt-library, copilot, analytics}/
```

**Structure Decision**: 14 new backend modules under `ai-*`, each mapping to one of spec.md's FR groupings. `ai-campaign-generation` (the Article-II approval gate) and `ai-marketing-governance` (masking/audit) are built and contract-tested first. No new top-level projects; no AI-gateway/provider code is duplicated from `008`.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
