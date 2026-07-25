# Implementation Plan: Enterprise Customer Segmentation & Audience Intelligence

**Branch**: `035-enterprise-segmentation-audience-intelligence` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/035-enterprise-segmentation-audience-intelligence/spec.md`

## Summary

This feature builds an enterprise intelligence and governance layer over the platform's existing segmentation foundation: 10 formal segmentation categories (Demographic, Geographic, Behavioral, Psychographic, Technographic, Transactional, Value-Based, Loyalty, Lifecycle, AI Predictive); a Dynamic Audience Builder with nested AND/OR/NOT rule logic across 10 operators; a per-customer Engagement Score and a composite 6-sub-score Customer Health Score; an AI behavioral profile; real-time audience-membership refresh on 8 trigger events; an AI Clustering Engine discovering 6 candidate-audience types plus 6 AI Predictive Segments, both gated through Audience Governance approval; a Lookalike Audience Engine across 6 seed groups; multi-channel Audience Activation (9 channels) with 6-category suppression; a Segment Analytics Dashboard; formal Audience Governance (naming standards, versioning/change history, approval workflow, ownership, documentation, expiration policies); RBAC/consent/encryption/audit/compliance/retention; enterprise APIs; and performance targets.

## Ownership & Dependency Analysis (Feature 035 vs. Features 019, 034)

Per instruction, `019` is treated as the canonical owner of customer identity, audience membership, and segmentation unless this spec explicitly transfers ownership; `034` is treated as the canonical owner of the enterprise data platform, unified customer intelligence, governance, and Customer 360 data services. Both were verified directly against their own plan.md files, not just spec.md's Assumptions.

### 1. Confirmed clean: `019` remains canonical owner of the base Segment/Audience Rule model

Spec.md's own Assumptions already state this explicitly, and it is verified against `019`'s plan.md (which independently defines its own `cdp-profile` and rule-based Segment entity): **`019` owns the base `Segment` entity and AND/OR/NOT rule-logic engine**; this feature does not redefine either. This feature's `Segmentation Category` taxonomy (10 formal categories), Audience Governance (naming/versioning/approval/expiration/change history), AI Audience Discovery, Predictive Segments, and the Lookalike Audience Engine are all **additive layers on top of `019`'s existing `Segment` object**, not a parallel segment/audience system. Where this feature's FR-019 restates the AND/OR/NOT/Equals/Greater-Than/etc. operator set, it is describing the same rule engine `019` already owns, extended with 3 additional operators (Contains, Between, Exists, In List beyond `019`'s base set) — this feature's tasks must extend `019`'s rule engine, not build a second one.

### 2. Confirmed clean: `034` remains canonical owner of identity resolution and the Unified Customer Profile

This feature's own architecture description (FR-003: Customer Events → Identity Resolution → Unified Customer Profile → Behavior Analysis Engine → AI Segmentation Engine → Dynamic Audience Builder → Activation) explicitly builds on `034`'s pipeline (source systems → Event Collection → Validation → Identity Resolution → Unified Customer Profile → Warehouse → AI Intelligence → downstream) rather than redefining it. **This feature MUST NOT create a second identity-resolution engine or a second Unified Customer Profile entity** — it reads from `034`'s (whose own relationship to `019`'s profile is itself an open, unresolved NEEDS CLARIFICATION per `034`'s plan.md). This feature inherits that open question rather than resolving it: whichever profile `034`'s gate eventually resolves to is the one this feature's segmentation/scoring logic reads from.

### 3. New finding: a partial field-level duplication between this feature's `Behavioral Profile` and `034`'s Behavioral information field group

Not addressed by spec.md's own Assumptions. `034`'s Unified Customer Profile already defines a "Behavioral information" field group (Last Login, Active Devices, **Preferred Time**, **Preferred Channel** — `034` FR-015). This feature's own `Behavioral Profile` entity (FR-017) defines 8 fields including **Preferred Devices**, **Preferred Communication Channel**, **Preferred Time of Day** — a near-verbatim overlap with 3 of `034`'s 4 Behavioral fields, plus 5 genuinely new fields (Content Preferences, Learning Preferences, Buying Habits, Engagement Pattern, Community Influence) `034` does not have. **Ownership decision**: this feature's `Behavioral Profile` **extends** `034`'s existing Behavioral field group with the 5 new fields, rather than maintaining a second, parallel copy of Preferred Devices/Time/Channel — those three fields are read from `034`'s profile, not independently stored a second time.

### 4. Escalating finding: a third, independent customer-scoring model now exists

Spec.md's own Assumptions already flag that this feature's 6-sub-score Customer Health Score (Engagement/Loyalty/Satisfaction/Growth/Risk/Revenue, 0–100) is "a DIFFERENT scoring model" from `019`'s 4-score Customer Score (Engagement/Purchase/Loyalty/Churn Risk) and explicitly declines to invent a reconciliation. **This plan extends that same non-reconciliation to a third system found by reading `034`'s plan.md**: `034` independently computes its own 7-score `AI-Computed Score` set (Churn Risk, Purchase Intent, Learning Probability, Engagement Score, Lifetime Value, Referral Potential, Community Influence) via its AI Intelligence Layer. **There are now three separately-specified, non-identical customer-scoring systems on the platform** (`019`'s 4 scores, `034`'s 7 scores, this feature's 6 sub-scores), each sharing at least one score name ("Engagement") with at least one other, with no source-PRD statement on whether any of them supersede, feed, or duplicate one another. Per instruction, this is **not resolved here** — this feature's Customer Health Score is implemented as its own distinct entity, explicitly not claimed to be a superset or replacement of the other two, and this three-way collision is escalated as its own NEEDS CLARIFICATION item alongside the pre-existing `019`/`034` profile gate.

### 5. Confirmed clean: RBAC, consent, and channel-send ownership

RBAC (FR-035) extends `016`'s marketing RBAC layer, consistent with how `019` already treats RBAC — no new role system. Consent enforcement before activation (FR-037) reads `019`'s existing Consent Record rather than redefining consent capture, per spec.md's own Assumptions. Actual message/send execution on each of the 9 activation channels remains owned by the respective channel features (`020`, `021`, `032`, etc.) per spec.md's own Assumptions — this feature's scope ends at producing a governed, suppression-applied audience.

### 6. Preserved NEEDS CLARIFICATION items (not resolved here)

- The pre-existing `019`/`034` Unified Customer Profile reconciliation gate (inherited, not touched).
- **New**: the three-way customer-scoring-model question (`019`'s 4-score Customer Score vs. `034`'s 7-score AI-Computed Score vs. this feature's 6-sub-score Customer Health Score) — which, if any, should feed or supersede the others.
- Missed-audience-refresh degradation behavior at enterprise scale (stale display vs. queued refresh with a "last updated" indicator).
- Lookalike Audience refresh cadence as the seed group's composition changes over time.
- In-flight-campaign behavior when a Segment's Expiration Policy is reached mid-send.
- AI-discovered-cluster overlap/deduplication against an existing manually-built Segment.
- Real-time refresh precedence when contradictory events (e.g., Purchase Completed vs. Payment Failed) arrive in quick succession for the same customer.
- Approval-Workflow-rejection-after-partial-approval state handling and reversibility.
- Whether a suppressed customer who otherwise matches a Segment's rules counts toward reported Audience Size in Segment Analytics.
- Minimum-data/confidence-handling rule for Predictive Segments computed from insufficient historical behavior (same open question already unresolved for `019`'s own custom attributes).
- Behavior when an Audience Rule references a later-removed/deprecated custom attribute (same open question already unresolved in `019`).

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–034.

**Primary Dependencies**: NestJS, Next.js; extends `019`'s Segment entity and rule engine rather than redefining it; reads identity/profile data from `034`'s Unified Customer Profile (whose own relationship to `019` remains an open gate); AI Clustering Engine, Predictive Segments, and Lookalike Audience Engine consuming `008`'s AI gateway; channel-send execution deferred to `020`/`021`/`032`.

**Storage**: PostgreSQL (~10 net-new entities per spec.md's Key Entities — Segmentation Category, Customer Health Score, AI-Discovered Cluster, Predictive Segment, Lookalike Audience, Audience Version, Audience Suppression List, Segment Analytics Snapshot domains, plus the extended Segment/Audience Rule and Behavioral Profile described above), with Audience Version as an immutable, versioned snapshot under Change History.

**Testing**: Jest (backend — dynamic-audience-real-time-refresh, ai-discovered-cluster-requires-governance-approval, and suppression-list-excludes-100-percent-at-activation contract tests are the highest-stakes tests here, matching this spec's own SC-002, SC-007/Constitution Article II, and SC-008), Playwright (web e2e — Dynamic Audience Builder canvas, Audience Governance approval queue, Segment Analytics Dashboard).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell); this is the enterprise segmentation/audience-intelligence layer sitting on top of `019`'s base CDP and `034`'s data platform.

**Performance Goals**: Segment creation under 2s; audience refresh under 5s; profile lookup under 500ms; audience export under 30s; Segment Analytics Dashboard load under 3s (FR-042–FR-046).

**Constraints**: Every customer is automatically segmented into at least one applicable segment without manual classification (FR-001, SC-006); AI-discovered clusters/predictive segments/lookalike audiences never reach active/campaign-usable status without passing Audience Governance approval (FR-023, SC-007, Constitution Article II); every audience activation excludes 100% of suppression-listed customers at the moment of activation (FR-027, SC-008); every Segment creation/edit/expiration is captured in Version Control and Change History, with no expired Segment usable for a new campaign (FR-030, FR-034, SC-009).

**Scale/Scope**: ~10 net-new data entities (plus extensions to `019`'s Segment/rule engine and `034`'s Behavioral Profile field group), 46 functional requirements (FR-001–FR-046), 7 user stories, 10 segmentation categories, 10 rule operators, a 6-sub-score Customer Health Score, 6 AI-discovered cluster types, 6 predictive segment types, 6 lookalike seed groups, 9 activation channels, 6 suppression categories, and multiple NEEDS CLARIFICATION items — most significantly the inherited `019`/`034` profile gate plus the newly-escalated three-way scoring-model collision documented above.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Segment membership evaluation, score computation, and suppression enforcement are entirely server-side; no client-asserted membership or score | **PASS — direct implementation (not the constitution's named source for this article)** | FR-002, FR-016 |
| II. AI Is Assistive, Never Autonomous | Spec.md's own Assumptions infer this article governs AI Audience Discovery and Lookalike Audiences, mirroring the human-review gate `019` already establishes for its own AI-proposed segments; FR-023 requires Audience Governance approval before any AI output becomes campaign-usable | **PASS (aligns; spec.md explicitly applies this article by inference, consistent with 019's precedent)** | FR-023, SC-007 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A for this chapter's own surface — segmentation/audience intelligence, no customer-facing claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | Audience Version is a versioned snapshot under Change History; edits create a new version rather than overwriting the prior definition | **PASS (aligns; not the constitution's named source for this article)** | FR-030, User Story 5 |
| V. Ledger-Based Internal Economies | N/A — this feature scores and segments customers, it does not manage a redeemable point/wallet balance | **PASS (N/A)** | — |
| VI. Consent Is First-Class | Consent enforced before any audience activation on any channel, reading `019`'s existing Consent Record rather than redefining consent capture | **PASS (aligns; consent capture owned by 019, enforcement is this feature's own)** | FR-037 |
| VII. Layered, Explicit RBAC | RBAC over audience/segmentation data and functionality, extending `016`'s model | **PASS (extends 001/016)** | FR-035 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Demographic Segmentation includes Language as a first-class attribute | **PASS (aligns; not the constitution's named source for this article)** | FR-006 |
| Security & Compliance Baseline | RBAC, encryption, audit logs, GDPR/CCPA compliance, data retention policies | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-035–FR-040 |

No constitutional violations. No Complexity Tracking entries required for principle compliance. The inherited `019`/`034` profile gate and the newly-escalated three-way scoring-model collision are documented, unresolved ownership items (see analysis above), not constitutional violations.

## Project Structure

### Documentation (this feature)

```text
specs/035-enterprise-segmentation-audience-intelligence/
├── plan.md
├── research.md      # Phase 0 — MUST resolve, in priority order: (1) the three-way customer-scoring-model question (019 vs. 034 vs. 035); (2) confirmation this feature extends 019's Segment/rule engine and 034's Behavioral field group rather than duplicating them; (3) missed-audience-refresh degradation behavior; (4) Lookalike Audience refresh cadence; (5) in-flight-campaign behavior on Expiration Policy reached; (6) AI-cluster-vs-existing-Segment overlap handling; (7) real-time refresh event-precedence rule; (8) Approval-Workflow partial-rejection state handling; (9) suppressed-customer Audience Size counting; (10) predictive-segment low-confidence handling; (11) deprecated-custom-attribute handling (shared open question with 019)
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`034`'s structure — no new top-level projects; this feature extends `019`'s Segment/rule engine and `034`'s Unified Customer Profile/Behavioral field group rather than redefining them.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── segmentation-categories/     # Segmentation Category taxonomy, extends 019's Segment (FR-005–FR-013)
│   │   ├── engagement-health-scoring/   # Engagement Score, Customer Health Score — distinct 3rd scoring system (FR-014–FR-016)
│   │   ├── ai-behavioral-profiling/     # Behavioral Profile, extends 034's Behavioral field group (FR-017)
│   │   ├── dynamic-audience-builder/    # extends 019's rule engine with 3 additional operators (FR-018–FR-020)
│   │   ├── ai-audience-discovery/       # AI-Discovered Cluster, Predictive Segment (FR-021–FR-023)
│   │   ├── lookalike-audience-engine/   # Lookalike Audience (FR-024)
│   │   ├── audience-activation-suppression/ # Audience Suppression List, activation dispatch to 020/021/032 (FR-025–FR-027)
│   │   ├── segment-analytics/           # Segment Analytics Snapshot (FR-028)
│   │   ├── audience-governance/         # Audience Version, naming/approval/ownership/documentation/expiration (FR-029–FR-034)
│   │   └── segmentation-security-api/   # RBAC/encryption/consent/audit/compliance/retention, Enterprise APIs (FR-035–FR-041)
│   └── common/                          # reused from 019: Segment entity, rule engine, Consent Record; reused from 034: Unified Customer Profile, Identity Resolution, Behavioral field group; reused from 008: AI gateway; reused from 001/016: RbacGuard; reused from 020/021/032: channel-send execution
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── audiences/{builder, governance, discovery, lookalike, analytics}/
```

**Structure Decision**: 10 new backend modules under `segmentation-*`/`audience-*`/`ai-*`, explicitly wired to extend `019`'s Segment/rule engine and `034`'s profile/behavioral data rather than redefining them. `dynamic-audience-builder` (extension of `019`'s rule engine) and `audience-governance` (the safety layer for every other capability) are built and contract-tested first. **No module may create a second Segment entity, a second identity-resolution/profile store, or a fourth customer-scoring system beyond the three already documented.**

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations; the inherited 019/034 gate and the three-way scoring-model question are documented open ownership items, not approved exceptions | — | — |
