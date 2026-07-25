# Implementation Plan: A/B Testing, Experimentation & Conversion Rate Optimization

**Branch**: `026-ab-testing-cro` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/026-ab-testing-cro/spec.md`

## Summary

This feature builds the platform's organization-level experimentation engine: 5 experiment-type families (page, campaign, commerce, community, learning) run through a visual builder with Draft/publish workflow; 7 traffic-allocation methods with consistent visitor bucketing and mid-run adjustment; unlimited custom variations plus first-class multivariate testing that auto-computes combination counts; 11 targetable audience dimensions evaluated in real time; 9 primary goals plus secondary goals and 10 conversion-event types linked to assigned variations; feature flag management (region/role/membership/device/campaign scoping, scheduled activation, instant rollback) integrated with the experimentation engine; a statistical analysis engine with configurable confidence-threshold auto-stop; an AI Experiment Assistant (suggestions, hypotheses, result interpretation, next-experiment suggestions, all with mandatory reasoning); a CRO engine surfacing prioritized issues; a behavior-analysis toolkit (heatmaps, session replay, rage/dead-click detection, exit intent, navigation paths); a real-time dashboard; automation with a manual-approval gate before production deployment; a 14-system integration framework; and RBAC/audit/security governance.

This chapter is not cited by name in the constitution's own source list, but **this spec's own FR text self-applies Constitution Article II verbatim in two places**: FR-027 ("Every AI Experiment Assistant recommendation MUST explain why the recommendation was made... Constitution Article II — AI Is Assistive, Never Autonomous") and FR-038 (manual approval before an automation/AI-identified winner deploys to production, citing Article II directly) — the same self-applying pattern seen in `018`, `020`–`023`, distinct from a feature the constitution names outright (`016`, `025`).

**This spec explicitly defines its relationship to a later, larger feature rather than leaving it implicit**: per spec.md's own Assumptions, Feature `038` (`enterprise-experimentation-cro`, Volume 14 Part 2 Chapter 5) is "a later, enterprise-grade evolution/superset of this same capability area, not a duplicate or unrelated feature." This spec (Chapter 13) is authoritative for the base experimentation, traffic-allocation, statistical-engine, behavior-toolkit, and feature-flag capabilities; `038` is expected to extend this with additional enterprise-grade statistical rigor, governance, and scale, and — when that feature is planned — its plan.md must cross-reference this one rather than re-deriving the same base entities from scratch.

Per spec.md's own Assumptions, this feature reuses rather than redefines: the AI Experiment Assistant is a feature-specific application of `008`'s platform-wide AI Assistant (model routing/prompt architecture/provider integration stay in `008`); the 14 systems named in the Integration Framework (`023` Landing Pages, `013` CRM, `019` CDP, `022` Workflow Engine, `025` AI Marketing Assistant, `020`/`021` Email/SMS/WhatsApp/Push, `009` Membership/Payments, `030` Referral/Affiliate, plus Analytics Platform, Payment Gateway, Community Module) emit/receive experiment-outcome events without this spec redefining their internal data models; and session-replay/heatmap/behavior-event consent handling is deferred to `002`/`003`'s existing consent-capture system (Constitution Article VI) rather than duplicated here.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–025.

**Primary Dependencies**: NestJS, Next.js; AI Experiment Assistant consuming `008`'s AI gateway (FR-025–FR-027); real-time visitor-eligibility evaluation and sub-200ms variation delivery (FR-015, FR-046); a statistical-analysis computation engine (FR-023–FR-024); heatmap/session-replay capture and rendering pipeline (FR-030–FR-034); integration sync to 14 named systems (FR-039–FR-040).

**Storage**: PostgreSQL (~17 entities per spec.md's Key Entities — Experiment, Variant/Variation, Multivariate Combination, Traffic Allocation Rule, Audience Target, Experiment Goal, Conversion Event, Statistical Result, Feature Flag, Heatmap Session, Session Replay, Behavior Event, CRO Issue, AI Recommendation, Automation Rule, Approval Record, Integration Sync Record, Audit Log Entry domains), with Audit Log Entry immutable and Statistical Result stored as point-in-time snapshots so historical confidence/significance values are never overwritten as an experiment continues running.

**Testing**: Jest (backend — sub-200ms-variation-delivery, auto-stop-halts-at-configured-threshold, and no-winner-reaches-production-without-approval contract tests are the highest-stakes tests here, matching this spec's own SC-001, SC-002, and SC-005/Constitution Article II), Playwright (web e2e — experiment builder wizard, multivariate combination calculation, feature flag rollback, dashboard).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell) for the builder/dashboard/toolkit, plus real-time variation-serving logic embedded across `023`'s public pages and `020`/`021`'s channel sends.

**Performance Goals**: Experiment creation under 5s; variation delivery under 200ms; traffic allocation in real time; analytics processing under 30s; AI recommendation generation under 5s; dashboard refresh under 3s (FR-046, SC-001, SC-009).

**Constraints**: A visitor consistently receives the same assigned variation across repeat visits within an experiment rather than being re-randomized (User Story 1, acceptance scenario 4); an experiment configured with an auto-stop confidence threshold halts data collection automatically once reached, with zero manual intervention required (FR-024, SC-002); a multivariate experiment's full combination set is computed automatically from per-element variation counts with zero manual enumeration (FR-013, SC-003); every AI Experiment Assistant recommendation carries a human-readable explanation (FR-027, SC-004); a winning variation identified by automation or AI does not reach production traffic without passing the configured manual-approval step when approval is enabled (FR-038, SC-005); every conversion event is correctly attributed to the visitor's assigned variation (FR-019, SC-006); a feature flag rollback takes effect instantly with no new deployment (FR-021, SC-007); only RBAC-authorized, approval-workflow-cleared users may publish experiments affecting production traffic (FR-041, FR-042, FR-045, SC-008).

**Scale/Scope**: ~17 data entities, 46 functional requirements (FR-001–FR-046), 7 user stories, 5 experiment-type families, 7 traffic-allocation methods, 11 audience-targeting dimensions, 9 primary goals, 10 conversion-event types, a 14-system integration framework, and 2 NEEDS CLARIFICATION items embedded directly in FR text (FR-024's unspecified default confidence threshold / minimum sample-size floor for auto-stop, and FR-038's ambiguity over whether manual approval before production deployment is mandatory for every experiment/environment or an administrator-configurable toggle).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Variation assignment, eligibility evaluation, statistical computation, and winner determination are entirely server-side; no client-asserted variation or statistical result | **PASS — direct implementation (not the constitution's named source for this article)** | FR-015, FR-023, User Story 1 acceptance scenario 4 |
| II. AI Is Assistive, Never Autonomous | **This spec's own FR-027 and FR-038 cite "Constitution Article II" verbatim** — every AI recommendation must explain its reasoning, and a winner identified by automation/AI cannot reach production without a recorded human approval | **PASS — direct implementation, spec.md explicitly applies this article twice** | FR-025–FR-027, FR-037–FR-038, SC-004, SC-005 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A for this chapter's own surface — experiments run against pages/campaigns already governed by `002`/`016`'s no-dark-pattern rules; this chapter tests variations, it does not create new claim surfaces | **PASS (N/A)** | — |
| IV. Historical Immutability | Statistical Results are point-in-time snapshots; Audit Log Entry is immutable; traffic-allocation changes mid-run are recorded as audit history rather than silently overwriting prior configuration | **PASS (aligns; not the constitution's named source for this article)** | FR-043, Key Entities — Statistical Result, Audit Log Entry |
| V. Ledger-Based Internal Economies | N/A — this feature has no financial/point balance | **PASS (N/A)** | — |
| VI. Consent Is First-Class | N/A for this chapter's own surface — session-replay/heatmap/behavior-event consent is enforced by `002`/`003`'s existing consent-capture system per spec.md's own Assumptions | **PASS (N/A here; deferred to 002/003 per spec.md Assumptions)** | spec.md Assumptions |
| VII. Layered, Explicit RBAC | Experiment creation, editing, and publishing enforce RBAC; only authorized administrators may publish experiments affecting production traffic | **PASS (extends 001/016)** | FR-041, FR-045 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Audience targeting includes Language as a first-class dimension | **PASS (aligns; not the constitution's named source for this article)** | FR-014 |
| Security & Compliance Baseline | RBAC, approval workflow, audit logging/version history, encryption, permission inheritance, rollback capability, compliance monitoring | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-041–FR-045 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/026-ab-testing-cro/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: default confidence threshold and minimum sample-size floor for auto-stop (FR-024), and whether manual approval before production deployment is mandatory for every experiment/environment or an administrator-configurable toggle (FR-038)
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`025`'s structure — no new top-level projects; this feature serves variations into `023`'s public pages and `020`/`021`'s channel sends, consumes `008`'s AI gateway, and syncs outcomes to 14 named systems.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── experiment-core/            # Experiment entity, lifecycle, audit history (FR-001–FR-002)
│   │   ├── experiment-types/           # page/campaign/commerce/community/learning type support (FR-003–FR-007)
│   │   ├── experiment-builder/         # visual builder, wizard, Draft/publish workflow (FR-008)
│   │   ├── traffic-allocation/         # Traffic Allocation Rule, 7 methods, mid-run adjustment (FR-009–FR-010)
│   │   ├── experiment-variations/      # Variant/Variation, Multivariate Combination engine (FR-011–FR-013)
│   │   ├── audience-targeting/         # Audience Target, real-time eligibility evaluation (FR-014–FR-015)
│   │   ├── experiment-goals/           # Experiment Goal, Conversion Event tracking (FR-016–FR-019)
│   │   ├── feature-flags/              # Feature Flag, scheduled activation, instant rollback (FR-020–FR-022)
│   │   ├── statistical-engine/         # Statistical Result, continuous evaluation, auto-stop (FR-023–FR-024)
│   │   ├── ai-experiment-assistant/    # AI Recommendation, suggestion/hypothesis/interpretation (FR-025–FR-027)
│   │   ├── cro-engine/                 # CRO Issue identification + prioritized recommendations (FR-028–FR-029)
│   │   ├── behavior-toolkit/           # Heatmap Session, Session Replay, Behavior Event (FR-030–FR-034)
│   │   ├── experiment-dashboard/       # real-time dashboard (FR-035–FR-036)
│   │   ├── experiment-automation/      # Automation Rule, Approval Record, manual-approval gate (FR-037–FR-038)
│   │   ├── experiment-integrations/    # Integration Sync Record, 14-system sync (FR-039–FR-040)
│   │   └── experiment-governance/      # RBAC, approval workflow, audit/version history, security (FR-041–FR-045)
│   └── common/                         # reused from 001/016: RbacGuard; reused from 008: AI gateway; reused from 023/020/021: variation-serving surfaces; reused from 013/019/022/025/009/030: integration targets
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── experiments/{page.tsx, builder/[experimentId], feature-flags, behavior/[pageId], dashboard}/
```

**Structure Decision**: 15 new backend modules under `experiment-*`/`traffic-*`/`audience-*`/`feature-flags`/`statistical-*`/`ai-experiment-*`/`cro-*`/`behavior-*`. `traffic-allocation`/`experiment-variations` (sub-200ms serving correctness) and `experiment-automation` (Article II approval gate) are built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
