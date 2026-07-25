# Implementation Plan: Enterprise Sales Management & Revenue Intelligence (RevOS)

**Branch**: `045-enterprise-sales-revenue-intelligence` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/045-enterprise-sales-revenue-intelligence/spec.md`

## Summary

This feature builds the Enterprise Revenue Operating System (RevOS) described in Volume 14 Part 2 Chapter 12: a standardized 15-stage Revenue Lifecycle (Anonymous Visitor→Advocacy) and a 16-phase Revenue Operating Model unifying marketing, sales, customer success, finance, and AI intelligence; enterprise Lead Capture/Enrichment/Management with a 12-step lead lifecycle; multi-framework Lead Qualification (BANT/MEDDICC/CHAMP/GPCT/custom) and Platinum/Gold/Silver/Bronze/Cold scoring with AI predictive scoring; Lead Assignment (9 methods), Nurturing, and Conversion into Opportunity/Account/Contact/Subscription/Membership/CS Plan; a centralized Opportunity Workspace with multi-framework opportunity qualification (MEDDICC/MEDDPICC/BANT/CHAMP/SPICED/SPIN), a 16-stage configurable opportunity lifecycle, forecasting, and cross-functional collaboration; Deal Management with a 10-step commercial workflow (Draft→Revenue Recognition) and AI Deal Intelligence (discount/margin recommendations that never self-apply); Pipeline Management with continuous AI-assisted Pipeline Health scoring (Excellent→Critical); an enterprise Sales Forecasting Platform (10 forecast types); Sales Activity Management; Territory Management (8 models) with AI-recommended, human-approved rebalancing; Sales Performance Management and coaching; a Pipeline Intelligence Dashboard; Account and Contact Management with relationship mapping; Strategic Account Management (EBRs/QBRs); enterprise Revenue Intelligence & Analytics (ARR/MRR/CLV/CAC); and a Sales Governance Framework with AI guardrails ensuring every AI output is advisory-only.

This chapter is not directly named by the constitution, but its own "Why this priority" rationale (User Stories 5 and 8) explicitly names **Article II** twice — calling FR-062/FR-124's "AI recommendations shall never automatically modify enterprise data without approved workflows" language "the clearest expression of Constitution Article II anywhere in this chapter" — a User-story-rationale citation pattern, not FR-text-verbatim or direct constitution naming. Its Assumptions also invoke **Article IV** (Historical Immutability) for deferring multi-currency/tax logic to `009`.

**Spec.md performs an unusually thorough ownership analysis of its own accord**, explicitly resolving the base-CRM-entity overlap with `013` and forward-flagging `053`/`060` as later redundant chapters that must defer to `045`/`013`. This plan verifies that resolution against `013`'s actual plan.md and surfaces one further overlap spec.md's own Assumptions did not fully address: a three-way Lead Score scale collision spanning `013`, `024`, and this chapter.

## Ownership & Dependency Analysis

### §1. Base CRM entities (`013`) — confirmed clean, verified against `013`'s actual plan.md

Spec.md's own Assumptions already state the resolution: `013` remains canonical for base CRM entity ownership (Lead, Contact, Opportunity, Pipeline Stage schema, capture/duplicate-detection, support-desk/ticketing), and `045` is canonical for the enterprise RevOS layer (Territory, Strategic Account Plan, EBR/QBR Record, Deal commercial workflow, Revenue Intelligence Metric, Sales Governance/Review Record) plus advanced multi-framework qualification and AI revenue-intelligence that extends rather than replaces `013`'s base records. Checked against `013`'s actual plan.md Project Structure: its `crm-lead` module owns "Lead, Lead Source, Lead Score, Lead Assignment, duplicate detection/merge, conversion (FR-013–FR-030)" and its `crm-opportunity` module owns "Opportunity, Pipeline/Pipeline Stage, Opportunity Product, Kanban, deal health, forecasting inputs (FR-038–FR-050)" — this is an exact match to spec.md's own claim. No contradiction found; this is a rare case where spec.md's self-resolution is fully confirmed by the target feature's actual implementation plan.

### §2. Lead Score scale — new finding, extends an already-open three-way collision

`013` independently defines a 0–100 rule-based/AI-assisted lead score with Cold/Warm/Hot/Sales Ready bands. `024-lead-management-scoring` independently defines a 0–1000 rule-based scoring engine with five bands, and its own plan.md explicitly flags the 013/024 scale mismatch as an unresolved, source-level ambiguity ("the source PRD does not state whether these are the same score at two scales... or a drafting duplication," treated as "a downstream integration/mapping concern" rather than resolved). `045`'s own FR-023/FR-024 now define a **third** lead-scoring construct — Platinum/Gold/Silver/Bronze/Cold tiers computed from a distinct factor list (Website Activity, Product Page Visits, Company Size, Industry Fit, etc.) — without acknowledging either prior scale in spec.md's own Assumptions.

**Ownership decision**: this plan does not invent a resolution. It extends the existing NEEDS CLARIFICATION gate (previously 013-vs-024) to explicitly include `045`: whichever underlying score `013`/`024` eventually reconcile to must be the single source that `045`'s Platinum–Cold tiering is computed *from* (a RevOS-layer presentation/business-tier classification), not a fourth independent scoring pool. Implementations MUST NOT build a third parallel lead-scoring engine while this reconciliation remains open.

### §3. Lead-stage AI Predictive Scoring vs. `024` — reuse decision made explicit

`045`'s FR-025 (AI predictive scoring estimating Purchase Probability, Conversion Probability, Lifetime Value, Churn Risk for leads) substantially duplicates `024`'s own "AI Predictive Scoring layer (conversion score, revenue prediction, purchase probability, recommended next action)," which `024`'s plan.md confirms is strictly advisory and consumes `008`'s AI gateway.

**Ownership decision**: `045` consumes `024`'s lead-stage AI Predictive Scoring output as an input rather than rebuilding a parallel lead-AI-scoring model. `045`'s genuinely new AI-intelligence ground is at the Opportunity, Deal, Account, and Revenue level (FR-045, FR-057, FR-062, FR-076, FR-091, FR-093, FR-103, FR-108, FR-112) — none of which `013`/`024` define — and remains this chapter's own authoritative content.

**Correction (2026-07-23, per `060/plan.md` §2)**: the claim above originally included Territory (FR-086) among this "novel ground" — that is inaccurate. `013` FR-073 already defines a basic Territory entity (territory manager, sales users, accounts/leads/opportunities, targets), predating `045`. `045`'s Territory (FR-082–086: 8 named territory models, assignment-rule dimensions, performance monitoring, AI rebalancing) is a genuine, much deeper elaboration of `013`'s basic entity — consistent with this session's repeatedly-verified "later chapter is deeper" pattern — but it extends `013`'s Territory rather than originating novel ground. The correct chain is `013` (basic Territory entity) → `045` (deep structural/coverage model extending it) → `060` (territory-based security enforcement layer built on top of `045`'s model).

### §4. Forward-declared overlaps with not-yet-planned chapters (`053`, `060`) — preserved as stated by spec.md

Spec.md's own Assumptions state `053-enterprise-sales-management-v2` and `060-enterprise-crm-sales-customer-success` are later, redundant re-specifications of this domain, and that both MUST cross-reference `045`/`013` rather than re-deriving requirements independently when they are eventually planned. This cannot be verified yet since neither feature has been planned; preserved as the working assumption.

### §5. RBAC, Consent, Currency/Tax — reuse decisions made explicit

Spec.md's own Assumptions already state RBAC/audit/encryption apply uniformly per the constitution's baseline, and that multi-currency/tax logic defers to `009`'s payments/tax architecture and Article IV historical-immutability rules. This plan makes the specific reuse target explicit: Sales Governance Framework roles (FR-118) configure `016`'s layered RBAC model rather than a new engine; Deal currency/tax fields (FR-060) reference, not redefine, `009`'s tax/currency logic.

### §6. Preserved NEEDS CLARIFICATION items (from spec.md's own FR text and Edge Cases, plus §2's new item — not resolved here)

- Which score governs when a lead/opportunity is evaluated under two configured qualification frameworks simultaneously and outcomes conflict (FR-044, Edge Cases).
- The numeric/role-based approval threshold above which an AI-recommended discount must escalate to a higher approval tier (FR-062).
- The 013/024/045 three-way Lead Score reconciliation (§2, newly extended).
- Conflict-resolution rule when two sales managers dispute ownership of the same AI-rebalanced accounts, and disposition of in-flight opportunities owned by a departing rep (Edge Cases).
- Whether a dismissed AI stalled-deal flag (with recorded justification) suppresses future identical-root-cause alerts or re-triggers next cycle (Edge Cases).
- Whether a strategic account's demotion (Annual Revenue drops below threshold) requires an approval step symmetric to promotion, or happens automatically (Edge Cases).
- Whether stage-advancement document validation checks uploader role in addition to document presence (Edge Cases).
- Which signal drives the Executive Alert when AI-detected Churn Risk contradicts a CSM's manually recorded Health Score on a Strategic Account (Edge Cases).
- Precedence rule when AI Intelligent Assignment and the Workload Balance rule recommend conflicting lead routing (Edge Cases).
- Whether a Lead Score is carried forward as a reference data point after conversion or the Opportunity Quality Score is computed with no shown linkage (Edge Cases).

None of these are silently resolved; each remains an open gate for a future clarification pass.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–044.

**Primary Dependencies**: NestJS, Next.js; `013`'s Lead/Contact/Opportunity/Pipeline Stage base entities as the foundation this RevOS layer extends (per §1); `024`'s lead-stage AI Predictive Scoring as a consumed input (per §3); `008`'s AI gateway for all opportunity/deal/territory/account/revenue-level AI intelligence; `016`'s layered RBAC for Sales Governance roles (per §5); `009`'s currency/tax architecture for Deal commercial data (per §5).

**Storage**: PostgreSQL (14 entities per Key Entities: Lead, Opportunity, Pipeline, Pipeline Stage, Deal, Territory [extends `013` FR-073's basic entity, per §3 correction], Account, Contact, Strategic Account Plan, EBR/QBR Record, Sales Activity, Revenue Intelligence Metric, AI Recommendation, Governance Review Record).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: revenue-lifecycle-zero-gap-traceability for SC-001, ai-recommendation-zero-autonomous-mutation for SC-003, and territory-rebalance-requires-prior-approval for SC-006), Playwright (web e2e — Revenue Lifecycle view, Opportunity Workspace, Pipeline Health Dashboard, Territory Management, Strategic Account Plan/EBR tracker).

**Target Platform**: Web (Sales/RevOps Admin Portal, rendered inside `017`'s workspace shell).

**Performance Goals**: Per FR-126/SC-010, the platform must support millions of leads/accounts/contacts/opportunities with dashboards remaining responsive and AI/analytics processing not degrading transactional performance [NEEDS CLARIFICATION: no numeric thresholds stated in source].

**Constraints**: Zero AI-generated lead/opportunity/deal/territory/forecast recommendation may mutate the referenced entity's state without a recorded human approval action first (FR-124, SC-003; Constitution Article II); zero deal pricing/discount/margin change may take effect outside the deal's Internal Approval workflow (FR-062); zero territory rebalance may reassign an account/lead/opportunity without prior authorized-manager approval (FR-086, SC-006); every Strategic Account must maintain a documented Strategic Account Plan and at least one logged EBR/QBR outcome per configured cadence (SC-007); zero third parallel lead-scoring engine may be built while the 013/024/045 scale reconciliation remains open (§2).

**Scale/Scope**: 14 entities, 126 FRs, 8 user stories, 15-stage Revenue Lifecycle, 16-phase Revenue Operating Model, 12-step Lead Lifecycle, 16-stage Opportunity Lifecycle, 10-step Deal workflow, 10 preserved NEEDS CLARIFICATION items (including one newly extended by this plan), no worsening of any of the 8 previously-accumulated Wave 2/3 architecture gaps, and a new three-way Lead Score scale collision surfaced across `013`/`024`/`045` (§2).

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Lead score, opportunity health, pipeline health, and forecast figures are all server-computed, never client-asserted. |
| II. AI Is Assistive, Never Autonomous | PASS — User-story-rationale citation (US5, US8) | FR-022, FR-025, FR-036, FR-045, FR-052, FR-057, FR-062, FR-070, FR-076, FR-086, FR-091, FR-093, FR-103, FR-108, FR-112, FR-124 all require human approval before an AI output changes entity state; SC-003 states this as a zero-tolerance success criterion. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | FR-009 bars automatic contract approval, financial-settlement execution, and overriding enterprise approval workflows. |
| IV. Historical Immutability | PASS — Assumptions-cited | Deal commercial terms lock as historical record on Closed Won/Revenue Recognition (FR-061, acceptance scenario 4); multi-currency/tax logic defers to `009`'s immutability rules (per §5). |
| V. Ledger-Based Internal Economies | N/A | This chapter has no internal balance/points/wallet construct of its own. |
| VI. Consent Is First-Class, Per-Channel, and Versioned | PASS (reused, not redefined) | Lead records carry Consent Status (FR-013, FR-016); consent mechanics themselves are inherited from `013`/`019`'s existing infrastructure, not redefined here. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS (reused, not redefined) | Sales Governance Framework roles (FR-118) configure `016`'s layered RBAC model rather than a new engine (per §5). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Lead/opportunity scoring and territory rebalancing are all evidence/data-based (FR-023, FR-084) rather than vanity-metric-driven. |
| IX. Action Before Consumption | PASS | Every lead, opportunity, and deal progresses through defined stages with exit-criteria validation toward a measurable outcome (FR-014, FR-047, FR-061), not passive tracking. |
| Localization & Language Requirements | PASS (not primary focus, inherited) | Contact records carry Preferred Language/Channel (FR-101); broader Tamil/Tanglish handling is inherited from `020`/`021`'s established patterns rather than redefined here. |
| Security & Compliance Baseline | PASS | FR-125 (immutable audit logs for every commercial transaction, RBAC-governed revenue-data access, encryption at rest/in transit) aligns with the baseline. |

## Project Structure

### Documentation (this feature)

```
specs/045-enterprise-sales-revenue-intelligence/
├── spec.md
├── plan.md
├── research.md         # 10 NEEDS CLARIFICATION items from §6
├── data-model.md        # 14 entities
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── revenue-lifecycle-zero-gap-traceability.contract.md
    ├── ai-recommendation-zero-autonomous-mutation.contract.md
    └── territory-rebalance-requires-prior-approval.contract.md
```

### Source Code (repository root)

```
backend/src/modules/revos/
├── revenue-lifecycle-operating-model/     # FR-001-010 — RevOS integration, 15-stage lifecycle, 16-phase model
├── lead-capture-enrichment/               # FR-011-018 — lead repository, capture sources, validation, enrichment
├── lead-qualification-scoring/            # FR-019-026 — multi-framework qualification, Platinum-Cold scoring (extends 013/024, per §2-§3)
├── lead-assignment-nurturing-conversion/  # FR-027-037 — assignment methods, nurturing, conversion, Lead Intelligence Dashboard
├── opportunity-workspace/                 # FR-038-041 — unified workspace
├── opportunity-qualification-forecasting/ # FR-042-052 — multi-framework qualification, 16-stage lifecycle, forecast categories
├── opportunity-collaboration-intelligence/ # FR-053-058 — collaboration, Opportunity Intelligence Dashboard
├── deal-commercial-workflow/              # FR-059-063 — Deal, 10-step workflow, AI Deal Intelligence (advisory-only)
├── pipeline-management-health/            # FR-064-071 — pipelines, Pipeline Health, Health Monitoring Dashboard
├── sales-forecasting/                     # FR-072-076 — forecast types, AI forecast intelligence
├── sales-activity-management/             # FR-077-081 — activity types, automation, analytics
├── territory-management/                  # FR-082-086 — territory models, AI rebalancing (human-approved)
├── sales-performance-coaching/            # FR-087-091 — scorecards, coaching plans
├── pipeline-intelligence-dashboard/       # FR-092-094
├── account-contact-management/            # FR-095-103 — accounts, contacts, relationship mapping
├── strategic-account-management/          # FR-104-108 — Strategic Account Plan, EBR/QBR
├── revenue-intelligence-analytics/        # FR-109-115 — ARR/MRR/CLV/CAC, dashboards
└── sales-governance-ai-guardrails/        # FR-116-126 — governance framework, AI non-autonomy enforcement
└── common/
    # reused from 013 (Lead/Contact/Opportunity/Pipeline Stage base entities), 024 (lead-stage AI predictive scoring),
    # 008 (AI gateway), 016 (RBAC), 009 (currency/tax)

web/app/(admin)/revos/
├── revenue-lifecycle/
├── lead-management/
├── opportunity-workspace/
├── deal-workflow/
├── pipeline-health/
├── forecasting/
├── territory-management/
├── accounts-contacts/
├── strategic-accounts/
├── revenue-intelligence/
└── governance/
```

**Structure Decision**: `sales-governance-ai-guardrails` is built and contract-tested first alongside `revenue-lifecycle-operating-model`, since FR-124's "AI recommendations NEVER automatically modify enterprise data without an approved workflow" guarantee is this chapter's own explicit, cross-cutting Acceptance Criterion that every other AI-touching module (lead scoring, opportunity qualification, deal discount, territory rebalancing, forecasting) depends on holding.

## Complexity Tracking

*No constitutional violations identified. This section intentionally left empty.*
