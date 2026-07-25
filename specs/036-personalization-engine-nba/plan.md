# Implementation Plan: Enterprise Personalization Engine & Next Best Action

**Branch**: `036-personalization-engine-nba` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/036-personalization-engine-nba/spec.md`

## Summary

This feature builds the platform's centralized decisioning brain: a Personalization Decision Engine returning a scored, explained, versioned decision for every calling module; a 5-level personalization maturity model; a Customer Context Service assembling real-time decision profiles from persistent/session/environmental/business context; a 7-method Recommendation Engine with diversity controls and cold-start handling; Next Best Action (10 categories including first-class "No-Contact"), Next Best Offer (11 offer types with eligibility/suppression), and Next Best Content engines; omnichannel experience personalization across website/mobile/community/learning/commerce/search/notifications; channel selection and send-time optimization; a Communication Fatigue Score; an Experience Eligibility Engine and Business Rules Engine; a strict 10-tier Decision Priority hierarchy and Decision Arbitration; an AI Decision Engine with mandatory confidence/explanation/reason-codes and a 4-stage Model Fallback Chain; personalization strategies/templates/content governance; real-time/batch/anonymous/multi-brand/multi-tenant personalization; an experimentation framework with holdout groups; metrics/ROI/governance dashboards; model management/monitoring/fairness review; privacy/consent/transparency; RBAC/approval/versioning/audit governance; APIs/webhooks/integration; data models; mandatory business rules; error handling/retry; performance/scalability/observability; and accessibility/empty-state/testing requirements.

## Ownership & Dependency Analysis (Feature 036 vs. Features 019, 034, and discovered collisions with 018, 022, 029, 032, 035)

Per instruction, `019` is treated as canonical owner of customer identity, audience membership, and segmentation, and `034` as canonical owner of the enterprise data platform, unified customer intelligence, governance, and Customer 360 data services, unless this spec explicitly transfers ownership. Both were checked against spec.md's own Assumptions and, where spec.md was silent, against the dependency's own plan.md.

### 1. Confirmed clean: `019` and `034` — no new profile, identity, or Customer 360 entity

Spec.md's own Assumptions are explicit and were verified as consistent: the Customer Context Service (FR-011–FR-013) is a **real-time, derived, ephemeral decision-time view** — it assembles context from `019`'s unified customer profile/consent records and `034`'s enterprise data platform, it does not persist a competing profile or Customer 360 record. **Ownership decision**: `Customer Context` (this feature's own Key Entity) is a read-time aggregation for the duration of one decision request, not a new source-of-truth entity — this feature creates zero new identity-resolution, profile, or Customer 360 entities, consistent with instruction #3.

### 2. Confirmed clean: `035` — segments consumed, not redefined

Spec.md's own Assumptions explicitly state Level 2 (Segment-Based) personalization and the second tier of the Model Fallback Chain consume segment membership owned by `035`, treating segments as an input this chapter does not define. No new Segment or Audience entity is created here.

### 3. Inherited, not worsened: the three-way customer-scoring collision

FR-011 lists "customer health score" and "churn probability" among the Customer Context Service's inputs. Given `019`'s 4-score Customer Score, `034`'s 7-score AI-Computed Score, and `035`'s 6-sub-score Customer Health Score already coexist unreconciled (per `035`'s plan.md), **this feature does not add a fourth scoring system** — it consumes "the" health score/churn probability without specifying which of the three existing systems it reads from, which inherits rather than resolves the ambiguity. This is carried forward as a live NEEDS CLARIFICATION, not newly introduced here.

### 4. Major new finding: this chapter claims to be the "shared decisioning brain" `032` already independently built its own version of

Spec.md's own Assumptions state directly: *"This chapter's Personalization Decision Engine, Next Best Action/Offer/Content engines, and Decision Priority hierarchy are assumed to be the shared, centralized decisioning service consumed by other Volume 14 marketing features... most directly Feature 018..., Feature 022..., and **Feature 032 (Omnichannel Orchestration, which relies on this chapter's Channel Selection, Send-Time Optimization, and Decision Arbitration logic to resolve cross-channel contact conflicts)**."* This claim was checked against `032`'s own, already-fully-planned tasks.md and plan.md: **`032` already independently defines its own `Next-Best-Action Decision` entity, a full `next-best-action` module (12 action types, confidence/explanation/alternative-actions requirements), a `Channel Fallback Chain` entity, and its own `journey-priority-conflict` module (6 priority levels, 9 conflict patterns, tie-break rule) — built without any reference to this chapter, which had not yet been planned.** This is the same class of problem as the already-open `022`/`032` engine-relationship gate, now discovered a second time between `032` and `036`, and it is **not resolved here**. This feature's NBA/NBO/NBC engines, Decision Priority hierarchy, and Channel Selection/Send-Time Optimization logic are implemented as specified, but **no task in this feature may assume `032` will be refactored to consume them**, and no task in `032` should be assumed retroactively updated by this plan. The two features' overlapping decisioning capabilities (`032`'s 6-level Journey Priority vs. this feature's 10-tier Decision Priority; `032`'s Next-Best-Action Decision vs. this feature's Decision/NBA) are preserved as independently specified, exactly as the `022`/`032` gate was preserved for `033`/`034`/`035`.

### 5. Major new finding: a third independent "Communication Fatigue Score" entity

Not addressed by spec.md's own Assumptions. This feature's FR-037–FR-038 define a `Fatigue Score` entity (message volume, ignored messages, repeated offers, dismissals, unsubscribe signals, negative feedback → reduce frequency/change channel/change content/delay/No-Contact/manual review) that is **near-field-identical** to `029`'s own `Communication Fatigue Score` entity (customer-lifecycle-retention-loyalty, same input signals, same mitigation actions) and to `032`'s own `Communication Fatigue Score` entity (omnichannel-orchestration, same pattern again). **This is now the third independently-specified instance of the same underlying concept across three planned features (`029`, `032`, `036`).** Per instruction, this is not silently resolved: this feature's Fatigue Score is implemented as its own entity per its own FRs, and the three-way duplication is escalated as a NEEDS CLARIFICATION item for a future consolidation pass, alongside the `032`/`036` decisioning-engine collision.

### 6. Confirmed clean: RBAC, consent, and AI-platform ownership

RBAC (FR-074–FR-075) and consent enforcement (FR-071) are explicitly framed by spec.md's own Assumptions as chapter-specific applications of Constitution Articles VII and VI respectively, with the underlying role hierarchy and consent ledger owned by `016`/`001` and the platform-wide consent system (interoperating with `019`'s Consent Record), not redefined here. The AI Decision Engine (FR-043) is explicitly assumed to run on the shared AI Model Platform referenced via `008`, with this chapter defining only decisioning-specific governance (confidence thresholds, explainability, fallback, override) layered on top — no separate AI stack.

### 7. Preserved NEEDS CLARIFICATION items (not resolved here)

- The `032`/`036` decisioning-engine collision (new, most significant for this feature).
- The three-way `029`/`032`/`036` Communication Fatigue Score duplication (new).
- The inherited three-way customer-scoring-model collision (`019`/`034`/`035`), now also touched by this feature's Context Service without being worsened.
- The inherited `022`/`032` and `018`/`033` and `019`/`034` gates (untouched by this feature).
- Hybrid Recommendation method weighting/precedence formula when methods disagree.
- Real-time page-render behavior while a manual-approval-required low-confidence decision is pending.
- Decision Arbitration tie-breaking when candidates are equally scored on every arbitration factor.
- Whether Model Drift/bias detection automatically pauses the affected model or only raises an alert.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–035.

**Primary Dependencies**: NestJS, Next.js; Customer Context Service reads from `019`'s profile/consent and `034`'s data platform without persisting a competing store; segment inputs consumed from `035`; AI Decision Engine consuming `008`'s AI Model Platform; explicitly NOT wired to consume or be consumed by `032`'s independently-built decisioning modules pending the gate above.

**Storage**: PostgreSQL (~17 entities per spec.md's Key Entities — Decision, Next Best Action, Next Best Offer, Next Best Content, Decision Priority Tier, Confidence Score, Reason Code, Fallback Rule/Fallback Chain, Fatigue Score, Personalization Strategy, Experience, Customer Context, Customer Preference, Recommendation Interaction, Model, Experiment, Audit Log Entry domains), with Decision Record immutable per decision instance and Personalization Strategy versioned.

**Testing**: Jest (backend — decision-response-always-scored-explained-versioned, no-contact-valid-and-outranking, ten-tier-priority-strict-ordering, and model-fallback-chain-never-fails contract tests are the highest-stakes tests here, matching this spec's own SC-004, User Story 2, SC-005, and SC-003/Constitution Article II), Playwright (web e2e — decision explanation inspector, priority-hierarchy audit view, fallback-chain simulation, diversity-control configuration).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell) plus a low-latency decision API consumed by website/mobile/email/community/commerce surfaces; this is the shared decisioning layer feeding personalization across nearly every consumer-facing surface.

**Performance Goals**: Real-time decision under 300ms (cached); complex recommendation under 1s; page-load contribution under 200ms; customer context retrieval under 250ms; strategy dashboard under 3s; 99.9% monthly decision availability (FR-089).

**Constraints**: Every decision includes recommended item, score, reason codes, model/rule version, and expiration (FR-079, SC-004); "No-Contact" must be able to outrank every contact-type action (FR-023, User Story 2); conflicting candidates always resolve per the strict 10-tier hierarchy regardless of score (FR-041, SC-005); AI-unavailability never produces a customer-facing failure — the fallback chain always terminates on a decision (FR-048, SC-003, Constitution Article II); zero decisions bypass consent validation, with withdrawal propagating within the SLA (FR-071, SC-006, Constitution Article VI); every override is audit logged (FR-047, SC-007); diversity maximums are never exceeded (FR-018, SC-008); high-fatigue customers receive a mitigation unless a Tier 1–5 action applies (FR-038, SC-009); no personalized surface ever renders blank (FR-096, SC-010).

**Scale/Scope**: ~17 data entities, 97 functional requirements (FR-001–FR-097) — the largest single feature planned this session — 8 user stories, a 5-level personalization maturity model, 10 recommendation content types, 7 recommendation methods, a 10-category NBA taxonomy, 11 NBO offer types, a 10-tier Decision Priority hierarchy, a 4-stage Model Fallback Chain, and multiple NEEDS CLARIFICATION items — most significantly the newly-discovered `032`/`036` decisioning-engine collision and the three-way `029`/`032`/`036` Fatigue Score duplication, on top of the inherited `022`/`032`, `018`/`033`, `019`/`034`, and three-way-scoring gates.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Decision scoring, priority resolution, and fallback selection are entirely server-side; no client-asserted decision or score | **PASS — direct implementation (not the constitution's named source for this article)** | FR-015, FR-041 |
| II. AI Is Assistive, Never Autonomous | Every AI decision carries confidence/explanation/reason codes; the 4-stage Model Fallback Chain guarantees non-AI-dependent delivery; every override is audit logged | **PASS — direct implementation, spec.md explicitly applies this article** | FR-046–FR-048, FR-047, SC-003, SC-007 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | "No-Contact" is explicitly a valid, non-negotiable decision outcome — a direct anti-dark-pattern guarantee per User Story 2's own rationale | **PASS — direct implementation, spec.md explicitly applies this article** | FR-023, User Story 2 |
| IV. Historical Immutability | Decision Records are immutable per instance; Personalization Strategy changes are versioned with restore capability | **PASS (aligns; not the constitution's named source for this article)** | FR-076, FR-083 |
| V. Ledger-Based Internal Economies | N/A — this feature scores/decides, it does not manage a redeemable point/wallet balance | **PASS (N/A)** | — |
| VI. Consent Is First-Class | Consent validated before every decision delivery, with withdrawal propagating within the defined SLA | **PASS — direct implementation, spec.md explicitly applies this article** | FR-071, SC-006 |
| VII. Layered, Explicit RBAC | 9 named roles; high-impact strategies require multi-owner approval scaled by risk/audience/channel/offer-value | **PASS (extends 001/016)** | FR-074–FR-075 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Tamil, English, Thanglish, plus regional/legal localization | **PASS (aligns; not the constitution's named source for this article)** | FR-058 |
| Security & Compliance Baseline | RBAC, audit logs, privacy-by-design, data minimization, retention policies | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-070, FR-092 |

No constitutional violations. No Complexity Tracking entries required for principle compliance. The `032`/`036` decisioning-engine collision and the three-way Fatigue Score duplication are documented, unresolved ownership items (see analysis above), not constitutional violations.

## Project Structure

### Documentation (this feature)

```text
specs/036-personalization-engine-nba/
├── plan.md
├── research.md      # Phase 0 — MUST resolve, in priority order: (1) the 032/036 decisioning-engine relationship — same class of question as 022/032, requiring an explicit architecture decision before either feature's NBA/priority/fallback logic is treated as canonical; (2) the three-way 029/032/036 Fatigue Score duplication; (3) which of the three existing scoring systems (019/034/035) the Customer Context Service actually reads; (4) Hybrid Recommendation weighting formula; (5) low-confidence provisional-render behavior; (6) arbitration tie-breaking; (7) drift/bias auto-pause vs. alert-only
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`035`'s structure — no new top-level projects; this feature's relationship to `032` is an open architectural question that must be resolved before either feature's decisioning modules are treated as final.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── personalization-core/        # maturity model, Purpose/Objectives shell (FR-001–FR-010)
│   │   ├── customer-context-service/    # Customer Context (derived, ephemeral) (FR-011–FR-013)
│   │   ├── recommendation-engine/       # 7 methods, ranking, diversity, freshness, cold-start (FR-014–FR-020)
│   │   ├── nba-nbo-nbc-engines/         # Decision, NBA, NBO, NBC (FR-021–FR-027)
│   │   ├── omnichannel-experience/      # web/mobile/community/learning/commerce/search/notification personalization (FR-028–FR-034)
│   │   ├── channel-send-optimization/   # channel selection, send-time prediction (FR-035–FR-036)
│   │   ├── fatigue-score/               # Fatigue Score — 3rd independently-specified instance, flagged (FR-037–FR-038)
│   │   ├── eligibility-business-rules/  # Experience Eligibility Engine, Business Rules Engine (FR-039–FR-040)
│   │   ├── decision-priority-arbitration/ # Decision Priority Tier, Decision Arbitration (FR-041–FR-042)
│   │   ├── ai-decision-engine/          # AI Decision Engine, confidence/explanation, override (FR-043–FR-047)
│   │   ├── model-fallback-chain/        # Fallback Rule/Chain (FR-048)
│   │   ├── strategy-experience-governance/ # Personalization Strategy, Experience, content tagging (FR-049–FR-053)
│   │   ├── realtime-batch-multicontext/ # real-time/batch/anonymous/multi-brand/multi-tenant (FR-054–FR-059)
│   │   ├── experimentation-framework/   # Experiment, holdout groups (FR-060–FR-062)
│   │   ├── personalization-metrics-roi/ # metrics, ROI, dashboards, decision timeline (FR-063–FR-066)
│   │   ├── model-management-monitoring/ # Model lifecycle, drift/fairness monitoring (FR-067–FR-069)
│   │   ├── privacy-consent-transparency/ # privacy-by-design, consent, preference center (FR-070–FR-073)
│   │   └── personalization-governance-api/ # RBAC/approval/versioning/audit, APIs/webhooks/integration, data models, business rules, error handling, performance, observability, accessibility (FR-074–FR-097)
│   └── common/                          # reused from 019/034: profile/consent/data platform; reused from 035: segments; reused from 008: AI Model Platform; reused from 001/016: RbacGuard; explicitly NOT wired to 032 pending the ownership gate
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── personalization/{decisions, strategies, experiences, priority-hierarchy, fallback, experiments, models, governance}/
```

**Structure Decision**: 17 new backend modules under `personalization-*`/`nba-nbo-nbc-*`/`decision-*`/etc. `customer-context-service` (the foundational read-model every downstream module needs) and `nba-nbo-nbc-engines`/`decision-priority-arbitration` (the core decisioning contract) are built and contract-tested first. **No module may assume a specific resolution of the `032`/`036` decisioning-engine question, and `fatigue-score` may not be silently merged with `029`'s or `032`'s existing entities without an explicit consolidation decision.**

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations; the 032/036 and Fatigue Score collisions are documented open ownership items, not approved exceptions | — | — |
