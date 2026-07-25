# Implementation Plan: TBT AI Assistant Platform: Modes, Guardrails & Administration

**Branch**: `008-ai-assistant-platform` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-ai-assistant-platform/spec.md`

## Summary

This feature builds the platform's **shared, provider-agnostic AI backend** — the single gateway every other TBT One surface (mobile AI tab, web AI workspace, course lesson assistant, community composer, mentor session prep, admin tools, and future consumers) calls into for AI-assisted functionality. It defines 12 AI modes over one backend; a ten-layer prompt-priority stack with versioned, never-mutated-in-place prompts; a provider/model routing and fallback layer with zero client-exposed secrets; retrieval-augmented generation over permission-scoped knowledge bases; five-level memory/personalization; a ten-layer safety architecture with explicit prompt-injection defense and tenant-isolation guarantees; per-request cost/usage accounting; and a full admin console (providers, models, routing, prompts, templates, knowledge bases, safety, evaluations, incidents).

This feature is the **primary architectural implementer of Constitution Article II (AI Is Assistive, Never Autonomous)** — the constitution's own source note for Article II names this volume specifically ("Vol 08: 10-layer prompt priority stack, anti-hallucination doctrine, no client-side keys"), and every mechanism that note references is a functional requirement here (FR-009/FR-010 the priority stack, FR-079/SC-001 no client-side keys, FR-109–FR-125 the anti-hallucination/guardrail architecture). It is also directly named in the constitution's **Localization & Language Requirements** ("Vol 08: Tamil/Tanglish/English AI modes"). It aligns with, but is not the constitution's named source for, Article III (no guaranteed-outcome claims — FR-023, FR-031, FR-119 independently prohibit the same patterns for AI-generated content) and Article IX (Action Before Consumption — explicitly invoked in this spec's own User Story 3 rationale for course-scoped, citation-backed, hint-gated learning assistance).

It **reuses `001`'s layered RBAC directly** for the 16-role AI access hierarchy (FR-004) and its audit-log pattern for every privileged AI-configuration action (provider/model/prompt/routing changes, staff conversation access — FR-087, FR-090, FR-134, the `AI Audit Log` entity), rather than building a parallel permission or audit system. It **reuses `003`'s identity/RBAC model** to resolve user/role/workspace scope for every AI request (spec.md Assumptions) rather than defining a parallel identity system. It **defines only the shared AI contract**, explicitly *not* the per-consumer business logic that already belongs to other features: course completion/grading logic stays owned by `004` (Learning Assistant only answers within `004`'s course-scoped content and instructor-set AI policy); the community post composer and its publish action stay owned by `005` (Community Assistant drafts, `005` publishes — FR-027); mentor session data and booking state stay owned by `007` (Mentor/Mentor-Preparation Assistants read a user-selected slice of `007`'s data, never all of it automatically — FR-047); exact commercial usage-limit numbers are deferred to `009` (FR-101, spec.md Assumptions). Feature `066` (Wave 5, enterprise AI/ML platform) is expected to build deeper fine-tuning/autonomous-agent infrastructure beyond this scope — this spec remains the canonical source for the assistant-facing gateway contract wherever the two overlap (spec.md Assumptions). **Confirmed 2026-07-24**: `066` has now been planned, and its own Ownership & Dependency Analysis (§1) independently reached the same conclusion — despite `066`'s own spec.md presenting the relationship as an open "judgment call for the architect," `066/plan.md` §1 found this exact paragraph in `008`'s plan.md and confirmed `008` remains the canonical provider-connectivity gateway every other feature correctly reuses, with `066` building the enterprise MLOps/Agent-Governance/Knowledge-Graph/Generative-Watermarking layer on top of it rather than replacing it.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–007.

**Primary Dependencies**: NestJS, Next.js, Flutter; an AI provider adapter layer with an initial Claude-compatible integration kept strictly provider-neutral in its interface (FR-078, FR-080 — NEEDS CLARIFICATION: which additional provider(s), if any, must be supported at launch); a secure secret manager for provider API keys (FR-087 — NEEDS CLARIFICATION: no specific secret-manager technology named); a vector/embedding store for RAG chunk retrieval (FR-074, FR-075 — NEEDS CLARIFICATION: no vendor named); speech-to-text/text-to-speech engines with Tamil/Tanglish/English support (FR-058, FR-059 — NEEDS CLARIFICATION: no vendor named); malware scanning reused from `002`/`004`/`005`/`007`'s shared pattern.

**Storage**: PostgreSQL (~28 entities per spec.md's Key Entities — provider/model/routing, prompt/template, conversation/message/saved-content, usage/cost, memory/personalization, RAG/knowledge-base, safety/incident domains), a vector index for `AI Document Chunk`/`AI Embedding Reference`, object storage with encrypted-at-rest, signed/expiring URLs for uploaded files and raw audio (FR-064), Redis (rate limiting, streaming-session state, usage-limit counters, provider-health cache for routing decisions).

**Testing**: Jest (backend — no-client-side-key-exposure, prompt-injection-defense, and cross-tenant-retrieval-isolation contract tests are the highest-stakes tests in this entire platform), Playwright (web e2e — streaming UI, stop/regenerate, template flows), Flutter test (mobile — offline draft persistence, voice-recording state machine, upload retry per FR-148).

**Target Platform**: Web + mobile + an internal backend gateway consumed by every other feature's AI-assisted surfaces.

**Performance Goals**: Streaming first-token latency low enough to feel conversational (FR-084 — NEEDS CLARIFICATION: no target seconds given in source); fallback failover with no user-visible dead-end and no duplicate usage charge (FR-083, SC-002); token-budget-aware context assembly that never truncates safety/system instructions (FR-015); cached provider-health signals driving routing (FR-082); asynchronous file/voice processing with real, persisted, retrievable progress (FR-106, SC-009).

**Constraints**: Every AI provider call MUST execute server-side only, with zero client-exposed API keys, secrets, or privileged instructions (FR-079, SC-001, Constitution Article II); higher-priority prompt-stack layers MUST NEVER be overridden by lower-priority content (FR-009, FR-010); structured-output parsing failures MUST NEVER expose broken raw JSON to end users (FR-014); AI-generated content on Community/Course/Marketing-facing surfaces MUST NEVER auto-publish — an explicit human action is always required (FR-027, SC-003); cross-user/cross-tenant retrieval leakage MUST be classified and handled as a critical-severity defect (FR-130, SC-004); every high-stakes-domain response MUST carry its required disclaimer and contain no guaranteed-outcome statement (FR-118, SC-005); a failed/errored generation MUST NEVER deduct credit or quota (FR-102, SC-006); a published prompt edit MUST always create a new version, never mutate the live version in place (FR-011, FR-090, SC-007); an "AI disabled"/"hints only" instructor policy MUST withstand rephrased/indirect attempts to extract a graded answer key (FR-056, SC-010); long-running jobs MUST NEVER show a fake "completed" state (FR-106, SC-009).

**Scale/Scope**: ~28 data entities, 151 functional requirements (FR-001–FR-151), 9 user stories, 12 AI modes, 16 access-control roles, a ten-layer prompt-priority stack (FR-009), and a ten-layer safety architecture (FR-116), with 3 NEEDS CLARIFICATION items in spec.md's Assumptions (numeric SLAs, additional-provider/secret-manager choice, workspace/organization model source).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Every provider call server-side only; AI-triggered high-impact actions require explicit user confirmation, never silently executed | **PASS — direct implementation** | FR-079, FR-085, FR-086, SC-001 |
| II. AI Is Assistive, Never Autonomous | **Constitution's named primary source** ("Vol 08: 10-layer prompt priority stack, anti-hallucination doctrine, no client-side keys") — every consequential AI action requires human/role-gated approval; deterministic fallback defined per mode; no client-side keys | **PASS — primary implementer** | FR-009, FR-079, FR-083, FR-086, SC-001, SC-002 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | AI-generated business/marketing/ad content MUST NOT claim guaranteed profit, job, or health/legal/financial outcome | **PASS (aligns; not the constitution's named source for this article)** | FR-023, FR-031, FR-034, FR-035, FR-039, FR-119 |
| IV. Historical Immutability | Published prompt edits always create a new traceable version; live prompt never mutated in place | **PASS (aligns; not the constitution's named source for this article)** | FR-011, FR-090, SC-007 |
| V. Ledger-Based Internal Economies | N/A — AI usage/cost tracking (`AI Usage Record`, `AI Cost Record`) is consumption accounting, not a redeemable internal-economy balance; optional AI credit balance, where used, still defers to `009`'s ledger model | **PASS (N/A)** | FR-101–FR-105, spec.md Assumptions |
| VI. Consent Is First-Class | Session-recording transcription requires explicit consent; memory storage is consent-gated and user-controllable; model-training use of private data requires explicit consent, never anonymization-alone | **PASS** | FR-048, FR-066, FR-132 |
| VII. Layered, Explicit RBAC | 16-role AI access hierarchy reuses `001`'s RBAC directly; staff access to user conversations requires role + purpose + case reference + time limit, never free browsing | **PASS (extends 001)** | FR-004, FR-134 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A — plan-tier usage limits are a commercial dimension deferred to `009`, not a rank/status purchase mechanic | **PASS (N/A)** | FR-101, spec.md Assumptions |
| IX. Action Before Consumption | Explicitly invoked by this spec's own User Story 3 — Learning Assistant answers are course-scoped and citation-backed rather than free-generated, and graded-work policy enforcement (hints-only/disabled) prevents AI from substituting for the learner's own action | **PASS — explicitly aligned** | FR-041, FR-042, FR-053, FR-055, FR-056, User Story 3 rationale |
| Localization & Language Requirements | **Constitution-cited source** ("Vol 08: Tamil/Tanglish/English AI modes") — language detection, Tanglish generation rules, per-language localization of every AI-facing surface | **PASS — cited source** | FR-069, FR-070, FR-151 |
| Security & Compliance Baseline | No client-side keys; encrypted file/audio storage with malware scanning; staff access to conversations logged, time-limited, and purpose-bound | **PASS (aligns)** | FR-064, FR-079, FR-134 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/008-ai-assistant-platform/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: additional AI provider(s) beyond the initial Claude-compatible integration, secret-manager technology, vector-store choice, speech-to-text/text-to-speech vendor, target streaming-latency SLA, and the workspace/organization scoping model this spec assumes but does not define (per spec.md Assumptions/NEEDS CLARIFICATION)
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`007`'s structure — no new top-level projects; this feature is consumed by, not merged into, every prior feature's AI-touchpoint code.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── ai-gateway/             # AI Provider, AI Model, AI Routing Rule, provider adapter layer, fallback orchestration (FR-078–FR-090)
│   │   ├── ai-prompt/              # AI Prompt/AI Prompt Version, AI Template/AI Template Field, ten-layer prompt assembly (FR-009–FR-015, FR-099–FR-100)
│   │   ├── ai-content-creator/     # Content Creator mode generators (FR-016–FR-029)
│   │   ├── ai-business-assistant/  # Business Assistant mode generators (FR-030–FR-039)
│   │   ├── ai-learning-assistant/  # Learning Assistant, academic-integrity policy engine (FR-040–FR-056)
│   │   ├── ai-voice/               # Voice input/output workflow, speech-to-text/text-to-speech (FR-057–FR-059)
│   │   ├── ai-vision-document/     # Image Assistant, Document Assistant, file-processing pipeline (FR-060–FR-064)
│   │   ├── ai-memory/              # AI Memory, Personalization Profile, temporary-chat exclusion (FR-065–FR-073)
│   │   ├── ai-rag/                 # AI Knowledge Base/Source, AI Document Chunk/Embedding Reference, AI Citation, retrieval pipeline (FR-074–FR-077)
│   │   ├── ai-conversation/        # AI Conversation, AI Message, AI Saved Content/Version, AI Folder lifecycle (FR-091–FR-098)
│   │   ├── ai-usage-cost/          # AI Usage Record, AI Credit Balance, AI Cost Record, limits and budgets (FR-101–FR-108)
│   │   ├── ai-guardrails/          # ten-layer safety architecture, anti-hallucination rules, prompt-injection defense, tenant isolation (FR-109–FR-130)
│   │   ├── ai-privacy/             # retention policy, training-data consent, export, staff-access-restriction (FR-131–FR-134)
│   │   └── ai-admin/               # admin console: overview, evaluations, observability, incidents, feature flags, deployment (FR-135–FR-147)
│   └── common/                     # reused from 001: RbacGuard, audit-log interceptor; reused from 002/004/005/007: malware scanner; reused from 003: identity/workspace resolution
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (member)/
        └── ai/{page.tsx, [mode]/page.tsx, conversations/{page.tsx,[conversationId]/page.tsx}, saved/page.tsx, memory/page.tsx, usage/page.tsx}
    └── (admin)/
        └── ai/{overview,providers,models,routing,prompts,templates,knowledge-bases,conversations,usage,costs,safety,evaluations,feedback,incidents,settings,reports}/

mobile/
└── lib/features/
    └── ai/                          # global AI tab, voice recording, camera/file upload, offline draft/upload-retry queueing (FR-148)
```

**Structure Decision**: 13 new backend modules under `ai-*`, each mapping to one of spec.md's FR groupings. `ai-gateway` and `ai-guardrails` are the two modules every other `ai-*` module and every other feature's AI touchpoints route through — they are deliberately built first and treated as the platform's most safety-critical surface area. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
