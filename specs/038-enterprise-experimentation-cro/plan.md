# Implementation Plan: Enterprise Experimentation, A/B Testing & Growth Intelligence

**Branch**: `038-enterprise-experimentation-cro` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/038-enterprise-experimentation-cro/spec.md`

## Summary

This feature builds the platform's experimentation governance and scientific-rigor layer: mandatory structured-hypothesis gating with duplicate detection; ICE/RICE backlog prioritization with audited leadership override; experiment-type/design support (A/B, A/B/n, multivariate, split-URL, feature-flag, client-side, server-side) across every marketing/product surface; a metrics framework distinguishing primary/secondary/guardrail/diagnostic metrics with a certified definition registry; sample-size/randomization/assignment rigor (mutual exclusion, layered experiments, contamination detection, sample-ratio-mismatch monitoring); pre-launch validation/QA and a 17-status lifecycle; statistical rigor (Frequentist and Bayesian analysis, sequential-testing peeking prevention, multiple-comparison correction, novelty/learning-effect awareness, seasonality controls); guardrail-driven auto-pause and a mandatory sub-60-second kill switch on every production experiment; risk-classified (Low/Medium/High) multi-role approval chains with enhanced governance for pricing/payment/legal experiments; decision/rollout governance and a searchable knowledge repository with mandatory negative/neutral-result publication; a Growth Intelligence Platform with a configurable multiplicative growth model, North Star Metric tracking, and portfolio/capacity/calendar management; ethics/privacy/accessibility guardrails; RBAC/versioning/audit governance; advisory-only AI assistance across 4 capabilities; and platform/API/reliability requirements.

**This chapter is directly named in the constitution's own citation list for Article III** — the source comment reads: *"Vol 14 Part 2 Ch 5 & Ch 7 (experimentation and retention ethics sections)."* This is the fifth feature this session directly named in the constitution's own citations (after `016` for Article VII, `025` for Article II, `032` for Article VI, `037` for Article IV), and the first for Article III specifically — and it establishes that Feature `040` (Ch 7, retention-intelligence-churn-prediction) is co-cited for the same article, worth carrying forward when that feature is planned. User Story 8 and FR-095 implement exactly this citation: fabricated urgency/scarcity, hidden cancellation friction, and false social proof are hard pre-launch blocks, not advisory guidelines.

## Ownership & Dependency Analysis (Feature 038 vs. Feature 026)

Spec.md's own Assumptions establish a clean, already-reasoned division that was checked against `026`'s own plan.md and found **consistent, with no contradiction** (unlike the `022`/`032`, `019`/`034`, and `032`/`036` collisions found in earlier Wave 3 features):

- **`026` remains the canonical execution engine**: the visual experiment builder, traffic-allocation engine, variation rendering, feature-flag delivery, statistical dashboard UI, CRO engine, and heatmap/session-replay tooling that customers and internal teams directly operate. This feature does not rebuild any of that.
- **This feature (`038`) is the enterprise governance and scientific-rigor layer on top of `026`'s engine**: mandatory hypothesis structure and approval gating, ICE/RICE prioritization, statistical-integrity rules (sequential-testing peeking prevention, multiple-comparison correction, Bayesian/Frequentist labeling), guardrail-driven auto-pause and mandatory kill switch, risk-classified multi-role approval chains, Growth Intelligence/North Star Metric, the ethics/dark-pattern gate, and mandatory negative/neutral-result publication.
- **Where both chapters describe the same object** (guardrail metrics, kill switch, feature flags, statistical significance, experiment dashboard), this feature is authoritative for the **mandate, methodology, and approval requirement**; `026` is authoritative for the **underlying execution mechanics** that must satisfy those mandates. Concretely: `026`'s Experiment/Feature-Flag/Statistical-Result entities are extended with this feature's governance fields (risk classification, approval chain, hypothesis record, guardrail-breach audit) rather than a second, parallel experiment-execution system being built.
- **Verified against `026`'s plan.md**: no competing governance claim found — `026` does not claim ownership of hypothesis mandates, ICE/RICE scoring, risk-classified approval, or knowledge-repository publication requirements, confirming the boundary is genuinely non-contradictory rather than merely asserted by one side.

This clean hierarchy is carried into Project Structure below: this feature's modules extend `026`'s entities rather than redefining `Experiment`, `Variant`/`Feature Flag`, or `Statistical Result` from scratch.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–037.

**Primary Dependencies**: NestJS, Next.js; extends `026`'s Experiment/Feature-Flag/Statistical-Result entities with governance fields rather than redefining them; AI Opportunity Discovery/Hypothesis Generator/Design Assistant/Result Interpreter consuming `008`'s AI gateway; upstream identity/consent/payment signals consumed from `003`/`009`/the platform consent system, not originated here.

**Storage**: PostgreSQL (~19 entities per spec.md's Key Entities — Opportunity, Hypothesis, ICE/RICE Score, Experiment [extends 026's], Variant [extends 026's], Assignment, Exposure Event, Metric Definition, Guardrail Metric/Breach, Kill Switch, Risk Classification, Approval Record, Experiment Result, Experiment Decision, Rollback Record, Knowledge Repository Entry, Growth Model Variable, North Star Metric, Feature Flag [extends 026's], Sample Ratio Mismatch Alert domains), with Exposure Event recorded separately from Assignment per FR-110, and Knowledge Repository Entry permanent/searchable.

**Testing**: Jest (backend — hypothesis-completeness-blocks-approval-entry, kill-switch-sub-60-second-stop, guardrail-breach-auto-pause, and high-risk-approval-chain-blocks-launch contract tests are the highest-stakes tests here, matching this spec's own SC-001, SC-002, SC-003, and SC-005), Playwright (web e2e — hypothesis submission form, live experiment monitoring dashboard, knowledge repository search, risk-classification approval queue).

**Target Platform**: Web (Admin/Growth Portal, rendered inside `017`'s workspace shell); this is the governance layer sitting on top of `026`'s execution engine.

**Performance Goals**: Cached-eligibility variant assignment under 100ms; variant configuration retrieval under 150ms; exposure event collection under 2s; standard dashboard under 3s; feature-flag propagation under 60s; emergency stop under 60s; 99.9% monthly availability (FR-113).

**Constraints**: Zero experiments reach "Awaiting Approval" without a complete, field-validated hypothesis (FR-004, SC-001); kill switch halts new variant delivery and restores the default within 60s for ≥99% of activations (FR-061, SC-002); guardrail breaches auto-pause without manual intervention for ≥95% of cases (FR-062, SC-003); sample ratio mismatches trigger an alert and flag results as potentially invalid (FR-042, SC-004); High Risk experiments are blocked from launch until every required approval role has signed off (FR-065, SC-005); ≥95% of Concluded experiments — including negative/neutral outcomes — publish to the knowledge repository within one reporting cycle, at the same rate as wins (FR-071, SC-006); zero dark-pattern-flagged variants reach production without a completed ethics/compliance review (FR-095, SC-009, Constitution Article III).

**Scale/Scope**: ~19 net-new/extended data entities, 116 functional requirements (FR-001–FR-116) — the largest single feature planned this session — 9 user stories, a 17-status experiment lifecycle, 3 risk tiers, and 2 NEEDS CLARIFICATION items in spec.md's own Assumptions (production default values for ICE/RICE scales/significance threshold/correction methods/sample-ratio-mismatch tolerance, and ethics-review SLA/freeze-exception authority).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Guardrail monitoring, kill-switch execution, and statistical calculation are entirely server-side; no client-asserted significance or guardrail state | **PASS — direct implementation (not the constitution's named source for this article)** | FR-042, FR-062 |
| II. AI Is Assistive, Never Autonomous | All 4 AI capabilities (opportunity discovery, hypothesis generation, design assistance, result interpretation) are explicitly advisory-only per FR-105–FR-108, with final decisions remaining with authorized teams | **PASS (aligns; spec.md explicitly applies this article per its own Assumptions)** | FR-105–FR-108, spec.md Assumptions |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | **This chapter is directly named in the constitution's own Article III source citation** — "Vol 14 Part 2 Ch 5 & Ch 7 (experimentation and retention ethics sections)" — FR-095 and User Story 8 implement exactly this as a hard pre-launch block | **PASS — direct implementation, co-cited by the constitution itself** | FR-095, User Story 8, SC-009 |
| IV. Historical Immutability | Versioning applies to hypotheses, designs, audience rules, metrics, variants, allocation, and decisions; post-launch changes create a new version rather than overwriting | **PASS (aligns; not the constitution's named source for this article)** | FR-102 |
| V. Ledger-Based Internal Economies | N/A — this feature governs experimentation, it does not manage a redeemable point/wallet balance | **PASS (N/A)** | — |
| VI. Consent Is First-Class | Consent enforced in audience eligibility/exclusion rules and WhatsApp/SMS experiment rules; consent state consumed from upstream, not originated here | **PASS (aligns; consent capture owned elsewhere, enforcement is this feature's own)** | FR-021, FR-037–FR-038 |
| VII. Layered, Explicit RBAC | 14 named roles; risk-classified, multi-role approval chains directly implement this article for high-blast-radius pricing/payment/legal experiments | **PASS (extends 001/016)** | FR-064–FR-067, FR-099 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | Winner declaration explicitly must consider guardrails/customer experience/long-term impact, not a single favorable metric — an anti-vanity-metric guarantee | **PASS (aligns; explicit anti-single-metric framing)** | FR-069 |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | N/A for this chapter's own surface — governance layer, not a localized content surface | **PASS (N/A)** | — |
| Security & Compliance Baseline | RBAC, consent enforcement, data minimization, masking, retention policies, audit logging | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-096, FR-103 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/038-enterprise-experimentation-cro/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: production default values for ICE/RICE scoring scales, standard significance threshold, specific sequential-testing/multiple-comparison-correction methods, sample-ratio-mismatch materiality tolerance, ethics/compliance review SLA, and freeze-period-exception approval authority
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`037`'s structure — no new top-level projects; this feature extends `026`'s Experiment/Feature-Flag/Statistical-Result entities with governance fields rather than redefining them.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── opportunity-hypothesis-management/ # Opportunity, Hypothesis, mandatory gate, dedup (FR-001–FR-006)
│   │   ├── backlog-prioritization/       # ICE/RICE Score, override+audit (FR-007–FR-011)
│   │   ├── experiment-types-design/      # extends 026's Experiment/Variant for A/B/A-B-n/MVT/split-URL/flag/client/server-side (FR-012–FR-023)
│   │   ├── metrics-framework/            # Metric Definition registry, primary/secondary/guardrail/diagnostic (FR-024–FR-030)
│   │   ├── sample-randomization-assignment/ # Assignment, Exposure Event, mutual exclusion, layering, contamination, SRM (FR-031–FR-042)
│   │   ├── prelaunch-validation-lifecycle/ # QA checklist, 17-status lifecycle (FR-043–FR-045)
│   │   ├── statistical-rigor-engine/     # Frequentist/Bayesian, peeking prevention, multi-comparison correction (FR-046–FR-060)
│   │   ├── guardrails-kill-switch/       # Guardrail Metric/Breach, Kill Switch (FR-061–FR-063)
│   │   ├── risk-classification-approval/ # Risk Classification, Approval Record (FR-064–FR-067)
│   │   ├── decision-rollout-knowledge/   # Experiment Decision, Rollback Record, Knowledge Repository Entry (FR-068–FR-079)
│   │   ├── growth-intelligence-north-star/ # Growth Model Variable, North Star Metric, portfolio/capacity/calendar (FR-080–FR-094)
│   │   ├── ethics-privacy-accessibility/ # ethics gate, privacy, accessibility (FR-095–FR-098)
│   │   ├── experimentation-governance-rbac/ # RBAC, environments, versioning, audit (FR-099–FR-104)
│   │   ├── ai-experimentation-assistance/ # 4 advisory-only AI capabilities (FR-105–FR-108)
│   │   └── experimentation-platform-api/ # APIs, webhooks, integration, performance, reliability, retention (FR-109–FR-116)
│   └── common/                           # reused from 026: Experiment/Variant/Feature-Flag/Statistical-Result entities and execution engine; reused from 008: AI gateway; reused from 003/009: identity/payment signals; reused from 001/016: RbacGuard
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── experimentation-governance/{hypotheses, backlog, guardrails, approvals, decisions, knowledge-repository, growth-intelligence}/
```

**Structure Decision**: 14 new backend modules under `opportunity-*`/`backlog-*`/`statistical-rigor-*`/`guardrails-*`/`risk-classification-*`/`growth-intelligence-*`/etc., explicitly wired to extend `026`'s execution engine rather than redefining Experiment/Variant/Feature-Flag entities. `opportunity-hypothesis-management` (the mandatory quality gate) and `guardrails-kill-switch` (the safety mechanism protecting checkout/pricing/payments experiments) are built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
