# Implementation Plan: Omnichannel Marketing Orchestration & Real-Time Engagement

**Branch**: `032-omnichannel-orchestration` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/032-omnichannel-orchestration/spec.md`

## Summary

This feature builds the platform's central customer-journey orchestration layer: a 29-node-type no-code visual journey builder; 26 reusable journey templates; multi-source journey entry/eligibility/re-entry evaluation; goal-driven exit conditions; near-real-time event processing with identity resolution; decision-split and wait/timing controls; channel selection with an ordered fallback chain; anti-fatigue governance (frequency limits + a Communication Fatigue Score); journey priority levels with cross-journey conflict resolution; consent-aware orchestration and suppression; a Next-Best-Action decisioning engine (explainable, advisory-only); message personalization and dynamic content; human-task automation with SLA escalation; approval/versioning/migration workflows; journey testing and experiments (with a strict production-isolation guarantee); journey/node/cross-journey/funnel analytics; channel performance analytics; omnichannel attribution integration; journey cost/ROI reporting; a real-time operations dashboard and controlled emergency communication; error handling/retry; per-customer journey timelines and a preference center; multilingual/multi-brand/multi-tenant/multi-currency/timezone support; capacity/budget/offer/reward governance; cross-functional orchestration into sales/CS/support/community/learning/events/payments; AI journey building/optimization/forecasting; alerting/dashboards/custom reporting; data retention/RBAC/security/privacy/audit; and API/webhook/integration/migration/performance requirements.

**This chapter is directly named in the constitution's own citation list for Article VI** — the source comment reads: *"Vol 14 Part 1 Ch 19 (consent-aware orchestration re-checks before every send)."* This is the third feature in the session directly named in the constitution's own citations (after `016` for Article VII, `025` for Article II), and the first for Article VI specifically. User Story 3, FR-026, and SC-004/SC-007 implement exactly that citation: consent is re-verified before every send, and withdrawal propagates to in-flight journeys without delay.

## Ownership & Dependency Analysis (Feature 032 vs. Features 008, 019, 020, 021, 022, 027, 028, 031)

Per instruction, this feature is scoped as **the orchestration layer only** — it must coordinate existing channel, AI, analytics, and attribution capabilities rather than reimplement them. Each named dependency was checked individually, including reading the actual `plan.md` of features already planned, not just spec.md's own Assumptions, to catch overlaps spec.md itself does not address.

### Clean boundaries (spec.md's own Assumptions state these explicitly; verified, no contradiction found)

- **Feature `019` (Audience Segmentation & CDP)**: owns the unified customer profile, identity resolution, and segment membership. This feature's eligibility/decisioning logic (FR-010, FR-017, FR-030) *consumes* that profile; it does not redefine profile storage or identity resolution. **Clean.**
- **Features `020`/`021` (Email Marketing; SMS/WhatsApp/Push)**: own channel-specific send mechanics — templates, deliverability, provider integration, per-channel content authoring. This feature governs channel *selection*, *sequencing*, and *fallback* (FR-019–FR-021) across those channels; a journey's "email action" / "SMS action" / "WhatsApp action" node types (FR-002) *invoke* `020`/`021`'s existing send capability rather than re-implementing message composition or delivery. Verified against `020`'s plan.md — no competing "sequence"/"journey" ownership claim found there. **Clean.**
- **Feature `018` (Campaign Management)**: campaigns (time-boxed/broadcast-oriented) and journeys (persistent, per-customer state machines) are treated as related but distinct; `018` is the integration point for "campaign capacity," "campaign exclusions," and "Campaign Management System" integration (FR-082) rather than this spec redefining campaign semantics. **Clean.**
- **Feature `031` (Social Media Marketing)**: this feature's "social audience action" and "community notification" node types (FR-002) *dispatch into* `031`'s existing multi-platform publishing and `005`'s community surfaces; this feature does not re-implement cross-platform formatting, content repurposing, or publish-status tracking, all of which remain owned by `031`. **Clean.**

### Corrected/clarified boundaries (spec.md does not address these; resolved here based on reading the dependency's own plan.md)

- **Feature `028` (Attribution & ROI)**: FR-045 already correctly states omnichannel attribution "integrated into the central Marketing Attribution and ROI system" rather than a separate model — **but FR-046 ("journey ROI reports including total cost, attributed and incremental revenue, gross profit, contribution margin, cost per customer/conversion, revenue per customer, return on journey investment, customer lifetime value impact, retention impact, and payback period") is, unaddressed by spec.md, a near-exact re-list of `028`'s own owned financial-formula set (Contribution Margin, CAC-equivalent, CLV, Payback Period — `028` FR-044/FR-047–FR-049)**. **Ownership decision**: this feature MUST NOT independently calculate Contribution Margin, CAC-equivalent cost-per-customer, CLV impact, or Payback Period for journeys — it feeds journey-level cost and revenue data into `028`'s existing formula engine (the same way `031` does for its own revenue attribution) and *displays* `028`'s computed results under the "journey ROI report" label, rather than running a second, potentially divergent calculation. This is the same class of risk flagged when correcting `027`'s plan.md for the `027`/`028` boundary.
- **Feature `027` (Marketing Analytics)**: not mentioned anywhere in spec.md's Assumptions, yet `027` already owns a `Customer Journey` entity and "Customer Journey Analytics" (FR-021–FR-024 of `027`, its `funnel-journey-analytics` module) describing "an individual customer timeline, an aggregated journey map, most common and high-performing conversion paths" — language nearly identical to this feature's own FR-043 "customer path analytics (most common, highest-converting, lowest-converting, fastest-converting, and longest journey paths...)." **Ownership decision**: these are different concepts that happen to share a name and must not be merged or treated as duplicates of each other — `027`'s "Customer Journey" is an **analytical, post-hoc construct** built from `027`'s own ingested `Tracked Event` stream for attribution/reporting purposes; this feature's "Customer Journey Instance" is the **executable, stateful orchestration record** (current node, pending actions, goal status) that only this feature has visibility into, since `027` has no concept of journey nodes, wait steps, or decision splits. This feature therefore legitimately owns journey/node-execution analytics (FR-042–FR-044) natively — but (a) journey-execution events (entries, node completions, exits, conversions) MUST flow into `027`'s existing `Tracked Event` stream as a "workflow execution" data source (already listed in `027`'s FR-002) rather than this feature building a second, parallel event-ingestion/warehouse pipeline, and (b) this feature's operational/executive dashboards (FR-074) MUST render through `027`'s existing Dashboard framework, consistent with how `026`, `028`, `030`, and `031` all plug into it, rather than a fourth parallel dashboard stack.
- **Feature `008` (AI Assistant Platform)**: spec.md's Assumptions do not explicitly name `008` as the AI-orchestration owner (unlike `025`/`026`/`029`/`030`/`031`, which all state this explicitly) — this is a gap in spec.md's own text, not a contradiction. Given the unbroken pattern across every other AI-touching Wave 2 feature planned this session, and given nothing in this spec's FR text (FR-029–FR-031 Next-Best-Action, FR-070 AI Journey Builder, FR-071–FR-072 AI optimization/forecasting) describes rebuilding model routing, prompt architecture, or provider integration, this plan applies the same established boundary: `008` owns the AI gateway/provider routing; this feature defines only the journey-specific AI use cases (recommendation logic, explanation requirements, confidence/risk scoring) layered on top. This is treated as a reasonable extension of established precedent, not spec.md's own explicit statement — flagged here for traceability rather than silently assumed.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–031.

**Primary Dependencies**: NestJS, Next.js; consumes `019`'s unified customer profile/identity/segments; invokes `020`/`021`'s channel-send capability rather than reimplementing it; dispatches into `031`'s social publishing and `005`'s community surfaces; feeds journey-execution events into `027`'s Tracked Event stream and renders through `027`'s Dashboard framework; feeds cost/revenue data into `028`'s attribution/financial-formula engine rather than recomputing it; Next-Best-Action/AI Journey Builder/optimization consuming `008`'s AI gateway; relationship to `022`'s workflow engine is an open NEEDS CLARIFICATION item (see above).

**Storage**: PostgreSQL (~20 entities per spec.md's Key Entities — Journey, Journey Version, Journey Node, Journey Template, Customer Journey Instance, Journey Priority Level, Next-Best-Action Decision, Communication Fatigue Score, Channel Fallback Chain, Consent Record, Suppression Rule, Frequency Policy, Trigger, Decision Rule/Condition, Channel, Message/Content Variation, Offer, Human Task, Experiment, Goal/Exit Condition, Audit Record, Alert domains), with Journey Version stored as an immutable snapshot and Audit Record immutable.

**Testing**: Jest (backend — consent-withdrawal-halts-in-flight-journey-with-no-delay, next-best-action-decision-always-explainable, and journey-priority-conflict-resolution-never-sends-both contract tests are the highest-stakes tests here, matching this spec's own SC-004/Constitution Article VI direct citation, SC-006, and User Story 6/FR-025), Playwright (web e2e — journey builder canvas, fallback-chain configuration, real-time operations dashboard).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell) plus mobile views for journey monitoring/approval/human-task completion (FR-086); this is the cross-cutting orchestration layer sitting above nearly every other Wave 2 feature.

**Performance Goals**: Real-time event ingestion under 1s; journey trigger evaluation/node processing under 2s; real-time personalization under 300ms; journey builder/dashboard load under 3s; channel fallback decision under 2s; standard API response under 2s; critical alert detection under 1 minute; standard analytics update under 5 minutes; AI journey recommendation under 10s (FR-084).

**Constraints**: No customer enters an ineligible journey (FR-010); consent withdrawal halts in-flight sends on the withdrawn channel without delay (FR-026, SC-004, Constitution Article VI); every acted-on Next-Best-Action decision retains a confidence score, explanation, and alternative for audit (FR-031, SC-006); conflicting simultaneous journeys are resolved by priority, never both silently sent (FR-025, User Story 6); a high-fatigue customer's non-critical sends are automatically suppressed while transactional/emergency sends still use a separate policy (FR-022–FR-023, User Story 4); test-mode journey activity produces zero production writes (FR-040, SC-010); emergency-communication activations are 100% traceable to an authorized actor (FR-049, SC-009).

**Scale/Scope**: ~20 data entities, 86 functional requirements (FR-001–FR-086), 9 user stories, 29 journey-node types, 26 journey templates, 6 journey priority levels, and 5 NEEDS CLARIFICATION items in spec.md's own text (the `022`/`032` engine-duplication question — most significant — plus Communication Fatigue Score formula/threshold, human-task SLA defaults, emergency-communication authorization roles, and the equal-priority conflict tie-break rule) plus the 2 additional ownership clarifications surfaced by this plan's dependency analysis (`028`'s financial-formula reuse for FR-046, `027`'s Tracked Event/Dashboard-framework reuse for FR-042–FR-044).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Eligibility evaluation, consent checks, fatigue scoring, and conflict resolution are entirely server-side; no client-asserted eligibility or consent state | **PASS — direct implementation (not the constitution's named source for this article)** | FR-010, FR-026 |
| II. AI Is Assistive, Never Autonomous | Every Next-Best-Action/AI Journey Builder/optimization output is advisory, requires the confidence/explanation/alternative disclosure, and AI-generated journeys require human review before activation | **PASS (aligns; spec.md explicitly applies this article per its own Assumptions, consistent with `008`'s ownership of AI internals)** | FR-031, FR-070, SC-006 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A for this chapter's own surface — journey content is subject to `002`/`016`'s no-dark-pattern rules, not redefined here | **PASS (N/A)** | — |
| IV. Historical Immutability | Journey Version is an immutable snapshot; Audit Record is immutable; finalized attribution snapshots deferred to `028` are not retroactively altered | **PASS (aligns; not the constitution's named source for this article)** | FR-038, FR-079 |
| V. Ledger-Based Internal Economies | N/A directly — reward/offer issuance (FR-061) validates eligibility and supports reversal, but the underlying ledger mechanics belong to `006`/`009`'s reward/wallet systems, not redefined here | **PASS (N/A here; enforced downstream)** | FR-061 |
| VI. Consent Is First-Class | **This chapter is directly named in the constitution's own Article VI source citation** — "Vol 14 Part 1 Ch 19 (consent-aware orchestration re-checks before every send)" — FR-026 implements exactly that requirement | **PASS — direct implementation, co-cited by the constitution itself** | FR-026–FR-028, SC-004, SC-007 |
| VII. Layered, Explicit RBAC | 15 named roles with permissions across viewing/creating/editing/approving/publishing/pausing journeys and emergency-communication authorization | **PASS (extends 001/016)** | FR-077, spec.md Assumptions |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | Journey ROI/analytics exist to justify spend with real business results, not vanity engagement metrics | **PASS (aligns; not the constitution's named source for this article)** | FR-046 (as corrected to defer to 028) |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Journey content supports English, Tamil, and additional configured languages with independent per-language review/approval | **PASS (aligns; not the constitution's named source for this article)** | FR-054 |
| Security & Compliance Baseline | MFA, encryption, RBAC, field-level security, tenant isolation, audit logging, consent-aware messaging, data minimization, deletion requests | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-078–FR-079 |

No constitutional violations. No Complexity Tracking entries required for principle compliance. The `022`/`032` engine-overlap question and the `027`/`028` analytics/financial-formula reuse corrections are documented ownership findings (see analysis above), not constitutional violations.

## Project Structure

### Documentation (this feature)

```text
specs/032-omnichannel-orchestration/
├── plan.md
├── research.md      # Phase 0 — MUST resolve, in priority order: (1) whether 022 and 032 are the same underlying automation engine or two genuinely distinct engines, and if distinct, how the naming collision on "Customer Journey" is resolved; (2) Communication Fatigue Score formula/threshold; (3) human-task SLA defaults per type/role/priority; (4) emergency-communication authorization role(s) and revocation speed; (5) equal-priority journey conflict tie-break rule
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`031`'s structure — no new top-level projects; this feature is the cross-cutting orchestration layer consuming `019`'s profile, `020`/`021`'s channels, `031`'s social/`005`'s community surfaces, `027`'s event stream and dashboard framework, `028`'s attribution/financial engine, and `008`'s AI gateway. Its relationship to `022` is unresolved (see above) and MUST be confirmed before final module boundaries are locked.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── journey-builder/            # Journey, Journey Version, Journey Node, Journey Template (FR-001–FR-006)
│   │   ├── journey-entry-eligibility/  # entry triggers, eligibility, re-entry, exit/goals (FR-007–FR-013)
│   │   ├── event-processing/           # real-time event ingestion, validation, identity resolution (FR-014–FR-016)
│   │   ├── decision-timing/            # decision splits, wait/timing controls (FR-017–FR-018)
│   │   ├── channel-orchestration/      # channel selection, fallback chain (FR-019–FR-021)
│   │   ├── anti-fatigue-governance/    # frequency limits, Communication Fatigue Score (FR-022–FR-023)
│   │   ├── journey-priority-conflict/  # Journey Priority Level, conflict resolution (FR-024–FR-025)
│   │   ├── consent-suppression/        # consent-aware orchestration, suppression, preference windows (FR-026–FR-028)
│   │   ├── next-best-action/           # Next-Best-Action Decision engine (FR-029–FR-031)
│   │   ├── personalization-dynamic-content/ # message personalization, dynamic content blocks (FR-032–FR-033)
│   │   ├── human-task-sla/             # Human Task, SLA escalation, collaboration workspace (FR-034–FR-036)
│   │   ├── journey-approval-versioning/ # approval chain, status/versioning, pre-activation validation (FR-037–FR-039)
│   │   ├── journey-testing-experiments/ # test mode, Experiment (FR-040–FR-041)
│   │   ├── journey-analytics/          # journey/node/path/cross-journey/funnel analytics, feeds 027 (FR-042–FR-044)
│   │   ├── journey-attribution-roi/    # feeds 028, does not recompute formulas (FR-045–FR-046)
│   │   ├── realtime-ops-emergency/     # operational dashboard, control center, emergency communication (FR-047–FR-049)
│   │   ├── error-handling-retry/       # failure detection, retry/fallback/escalation (FR-050–FR-051)
│   │   ├── journey-instance-timeline/  # Customer Journey Instance, timeline, preference center (FR-052–FR-053)
│   │   ├── i18n-multibrand-multitenant/ # language/brand/tenant/currency/timezone (FR-054–FR-057)
│   │   ├── capacity-budget-offer-reward/ # rate limits, budgets, Offer, reward issuance (FR-058–FR-061)
│   │   ├── cross-functional-orchestration/ # sales/CS/support/community/learning/events/payments actions (FR-062–FR-068)
│   │   ├── ai-journey-optimization/    # AI Journey Builder, optimization, forecasting (FR-069–FR-072)
│   │   ├── orchestration-alerts-reporting/ # alerts, dashboards, custom reports (FR-073–FR-075)
│   │   └── orchestration-governance/   # retention, RBAC, security/privacy, Audit Record, APIs/webhooks/migration (FR-076–FR-083)
│   └── common/                         # reused from 019: profile/identity; reused from 020/021: channel send; reused from 031/005: social/community dispatch; reused from 027: Tracked Event stream + Dashboard framework; reused from 028: attribution/financial formulas; reused from 008: AI gateway; reused from 001/016: RbacGuard
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── orchestration/{journeys, journey-builder/[journeyId], operations-center, human-tasks, executive}/
```

**Structure Decision**: 22 new backend modules under `journey-*`/`consent-*`/`next-best-action`/etc., explicitly wired to reuse `019`/`020`/`021`/`027`/`028`/`008` rather than redefining their entities. `journey-builder` (the foundational authoring surface) and `consent-suppression` (Article VI direct-citation compliance) are built and contract-tested first. **No module may begin implementation against `022`'s workflow substrate until the NEEDS CLARIFICATION gate above is resolved.**

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations; the 022/032 engine-relationship question is a documented open ownership item, not an approved exception | — | — |
