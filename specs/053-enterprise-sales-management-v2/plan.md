# Implementation Plan: Enterprise Sales Management & AI Sales Intelligence (v2)

**Branch**: `053-enterprise-sales-management-v2` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/053-enterprise-sales-management-v2/spec.md`

## Summary

This feature builds the distinctive, non-duplicative additions Volume 14 Part 2 Chapter 20 contributes on top of the already-canonical sales/CRM/RevOS data model: an AI Sales Assistant producing human-review-gated drafts (emails, meeting prep, call summaries, objection handling, pricing guidance); AI Pipeline/Opportunity/Revenue/Risk Intelligence (win probability, deal risk, stalled-deal detection, forecast adjustments) layered as advisory output over existing pipeline data; an 8/10-tier Sales Data Classification scheme (Public through Executive Confidential) with automatic field/record-level security controls; a distinct Pricing Security control surface protecting margin/cost/discount data separately from general data classification; Territory Management's chapter-specific AI-recommendation layer; a Partner & Channel Sales Management module; AI-confidence-scored Sales Forecasting with documented-reason manual overrides; a Sales Communication Center; Sales Governance & the role-based Enterprise Sales Portal; and Compliance (RBAC/ABAC/MFA/SSO, named regulatory frameworks, immutable sales audit logging).

This chapter self-cites Article II verbatim in FR text three times (FR-010, FR-019, FR-022) — the densest FR-text-verbatim citation density for a single article of any feature this session.

**Spec.md performs the most rigorous self-scoping of any feature this session**: it explicitly identifies itself as the *third* sales-management specification (after `013` and `045`), explicitly refuses to redefine Opportunity/Pipeline/Territory/Forecast/Account, and narrows its own FR list to only the chapter's genuinely distinctive contributions. This plan verifies that self-scoping against `013`'s and `045`'s actual plan.md files (confirmed accurate) and surfaces one substantial overlap `053`'s own Assumptions never mention: its "Partner & Channel Sales Management" section duplicates `046`'s already-comprehensive, already-planned scope.

## Ownership & Dependency Analysis

### §1. Opportunity/Pipeline/Territory/Forecast/Account vs. `013`/`045` — confirmed clean, verified against both actual plan.md files

Spec.md's own Assumptions state `013` owns the base CRM entities and `045` owns the canonical RevOS Opportunity/Pipeline/Territory/Forecast/Account entities and their AI scoring/forecasting/territory-rebalancing depth, and that `053` intentionally does not redefine any of them. Checked against both features' actual plan.md files: `013`'s `crm-lead`/`crm-opportunity` modules and `045`'s RevOS-layer Opportunity/Pipeline/Territory/Forecast modules confirm this split exactly as `053`'s Assumptions describe. `045`'s own plan.md additionally already flags `053` (and `060`) by name as "later, redundant re-specifications of this domain" that must defer to `045`/`013` — a rare case of both sides of a cross-chapter relationship agreeing from the start, consistent with the `013`/`040` precedent found earlier this session.

### §2. Partner & Channel Sales Management vs. `046` — new finding, not caught by `053`'s own Assumptions

`053`'s FR-037–FR-042 define Partner categories (12 types), a Partner profile (Partner ID, Organization, Tier, Certifications, Revenue Contribution, Territory, Products Sold, Contracts, Incentives, Performance Metrics, Training Status, Compliance Status), partner onboarding/certification/deal-registration/incentive-management operations, a deal-registration validation-and-approval workflow, and an AI Partner Health Score with incentive suggestions requiring human approval. `053`'s own Assumptions mention overlaps with `013` and `045` and defer reconciliation with a future `060`, but **never mention `046` anywhere**, despite `046-partner-relationship-management` already owning this exact scope in comprehensive depth: a 16-stage Partner Lifecycle, a Partner 360° workspace, Channel Sales Management with a 12-stage Channel Opportunity lifecycle, Deal Registration Management with structured Conflict Resolution, Channel Incentive Management with a Finance→Executive approval chain, and AI Channel/Partner Performance Intelligence — all built on a Partner Wallet ledger shared with `030` per Constitution Article V.

**Ownership decision**: `046` remains the canonical owner of the Partner/Channel Partner entity, Partner 360° profile, Deal Registration + Conflict Resolution workflow, Channel Incentive Management, and the AI Partner/Channel Health Score. `053`'s "Channel Partner" Key Entity is **not** a second independent Partner data model — it is `053`'s own Enterprise Sales Portal surfacing `046`'s existing Partner/Deal Registration/Incentive data through the "Partner Manager" portal role (FR-052) and `053`'s AI Sales Intelligence lens, not a redefinition. `053` MUST NOT build a second Partner entity, deal-registration workflow, or incentive-payment ledger where `046` (and, beneath it, `030`'s Partner Wallet) already own that ground. This is the seventh consecutive feature this session to surface a genuine, previously-uncaught cross-feature dependency during planning (after `041`/`042`, `042`/`043`, `044`/`030`, `046`/`045`, `048`/`047`+`040`, `050`/`004`, `051`/`050`, `052`/`040`+`047`).

### §3. AI Sales Assistant infrastructure vs. `008` — reuse decision made explicit

`053`'s own Assumptions do not name `008`, but consistent with the established, already-verified reuse chain for every AI-touching feature this session, the AI Sales Assistant's drafting (FR-009), AI Pipeline/Opportunity/Revenue/Risk Intelligence (FR-011–FR-014), and AI Sales Coaching (FR-021) all route through `008`'s AI gateway rather than a parallel provider-integration layer. `053` defines the sales-domain-specific outputs, explainability requirements, and human-review gating on top — not the underlying model routing.

### §4. Later-chapter overlap (`060`, not yet planned) — preserved as stated by `053`'s own Assumptions

`053`'s own Assumptions state a future `060-enterprise-crm-sales-customer-success` (Chapter 27) is flagged in the manifest as overlapping `013`/`045`/`053`, and that this spec does not attempt to pre-resolve that later overlap. This cannot be verified against an actual plan.md yet and is preserved as the working assumption, flagged for confirmation when `060` is reached.

### §5. Preserved NEEDS CLARIFICATION items (from spec.md's own explicit flags and Edge Cases — not resolved here)

- The 15-stage "Enterprise Sales Lifecycle" (FR-004) is textually distinct from `045`'s own 15-stage "Revenue Lifecycle" (Anonymous Visitor→Advocacy) — explicitly flagged by spec.md itself as a source-PRD inconsistency, not silently merged.
- Non-AI deterministic fallback UX (FR-022) is derived from Constitution Article II rather than stated verbatim in the source chapter — explicitly flagged by spec.md itself.
- Session-expiry-vs-queued-AI-draft auto-send guarantee (Edge Cases).
- Role-downgrade mid-session re-check timing for previously visible classified data (Edge Cases).
- Misclassification correction responsibility and whether the correction itself is audited (Edge Cases).
- Precedence rule when two classification labels (e.g., "Customer Sensitive" and "Legal Privileged") both apply to the same field (Edge Cases).
- Technical enforcement preventing an unapproved AI pricing recommendation from being pasted into an outbound customer communication (Edge Cases).
- Clawback/reversal workflow for a partner deal registration found fraudulent after incentive calculation but before payout (Edge Cases; also relevant to `046`'s incentive workflow per §2).
- Expiry behavior and logging for an AI territory-reassignment recommendation never acted on within a reasonable window (Edge Cases).

None of these are silently resolved; each remains an open gate for a future clarification pass.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–052.

**Primary Dependencies**: NestJS, Next.js; `013`'s base CRM Lead/Contact/Opportunity/Pipeline Stage entities and `045`'s RevOS-layer Opportunity/Pipeline/Territory/Forecast/Account entities as the systems of record this feature attaches AI scores/classification/pricing-security to (per §1); `046`'s Partner/Channel Partner/Deal Registration/Channel Incentive entities as the systems of record the Enterprise Sales Portal's Partner Manager role surfaces (per §2); `008`'s AI gateway for every AI Sales Assistant/Intelligence/Coaching module (per §3); `001`/`016`'s layered RBAC for the 8/10-tier Sales Data Classification and Pricing Security access controls.

**Storage**: PostgreSQL (5 new entities per Key Entities — Sales Data Classification Tier, AI Sales Suggestion, Pricing Record, Governance Alert/Security Alert, and Channel Partner as a **display/portal-integration reference into `046`'s canonical entity, not a new data model** per §2 — plus references to `013`/`045`'s Opportunity/Pipeline/Territory/Forecast/Account, which this feature reads and annotates but does not own).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: ai-assistant-output-zero-autonomous-transmission for SC-001, classification-tier-access-restriction for SC-002, and pricing-security-hidden-from-unauthorized-roles for SC-003), Playwright (web e2e — AI Sales Assistant draft review flow, classification-tier access-control testing across roles, discount-approval-threshold workflow, forecast override with documented reason).

**Target Platform**: Web (Enterprise Sales Portal, rendered inside `017`'s workspace shell; responsive mobile sales experience per FR-053).

**Performance Goals**: Per FR-001, the architecture must support millions of customer records/activities/opportunities/forecasts/AI recommendations [NEEDS CLARIFICATION: no numeric thresholds stated in source].

**Constraints**: Zero AI Sales Assistant output (email draft, call summary, meeting prep, objection handling) may transmit, save as an official activity record, or otherwise act until an authorized human explicitly reviews and approves it (FR-010, SC-001; Constitution Article II); zero field/record tagged above "Public" classification may be visible to a user whose role/clearance does not meet that tier (FR-024/FR-025, SC-002); zero internal margin/cost/AI-pricing-recommendation field may be visible to a user without pricing-approval permission (FR-029, SC-003); zero discount request exceeding the configured policy threshold may bypass the approval workflow before a quote is finalized (FR-030, SC-004); every manual forecast adjustment must carry a documented reason and remain distinguishable from the AI baseline (FR-045, SC-005); zero second Partner/Deal-Registration/Incentive data model may be built where `046` already owns that ground (§2).

**Scale/Scope**: 5 new entities plus references into `013`/`045`/`046`'s canonical entities, 56 FRs, 8 user stories, 15-stage Enterprise Sales Lifecycle (textually distinct from `045`'s, per preserved NEEDS CLARIFICATION), 12-phase Sales Operating Model, 10-label Sales Data Classification scheme, 9 preserved NEEDS CLARIFICATION items (2 explicitly self-flagged by spec.md, 7 from Edge Cases), no worsening of any of the 8 previously-accumulated Wave 2/3 architecture gaps, one confirmed-clean triple-verified reuse chain with `013`/`045` (§1, the rare case where the target features had already flagged `053` themselves), and one new cross-feature dependency surfaced and resolved with `046` (§2) — the seventh consecutive feature this session to surface a genuine, previously-uncaught overlap during planning.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Classification-tier access decisions, win probability, and deal risk scores are all server-computed/server-enforced, never client-asserted. |
| II. AI Is Assistive, Never Autonomous | PASS — **FR-text-verbatim cited 3×** | FR-010, FR-019, and FR-022 each explicitly cite "Constitution Article II" — the densest single-article FR-text citation density of any feature this session; SC-001 and SC-008 state zero-tolerance success criteria. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | AI pricing recommendations are visibly marked as advisory pending human review, never an applied price (FR-012, User Story 4 acceptance scenario 2). |
| IV. Historical Immutability | PASS | Both the AI-generated forecast baseline and any manual override remain separately, permanently visible rather than the override overwriting the baseline (FR-045). |
| V. Ledger-Based Internal Economies | N/A (deferred) | Partner incentive payouts reuse `046`'s (and beneath it, `030`'s) existing Partner Wallet ledger rather than a new balance field — this feature does not define its own ledger (per §2). |
| VI. Consent Is First-Class, Per-Channel, and Versioned | PASS (reused, not redefined) | FR-049 validates customer communication consent before any automated/sales-initiated outreach, reusing the platform-wide consent mechanism. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS — directly implements | The 10-label Sales Data Classification scheme and Pricing Security are the chapter's most distinctive, highest-governance-value contribution, directly implementing layered RBAC with automatic tier-based controls (FR-023–FR-027) on top of `001`'s/`016`'s engine. |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Win probability, deal risk, and Partner Health Score are all evidence/data-based (FR-008, FR-041) rather than vanity-metric-driven. |
| IX. Action Before Consumption | PASS | Every opportunity progresses through the 15-stage lifecycle with configurable governance/SLA/audit at each stage (FR-004), not passive tracking. |
| Localization & Language Requirements | PASS (not primary focus, inherited) | This is an internal sales-operations tool; broader Tamil/Tanglish handling is inherited from established patterns rather than redefined here. |
| Security & Compliance Baseline | PASS — directly names the full compliance list | FR-055 explicitly enumerates DPDP Act, GDPR, CCPA, ISO 27001, SOC 2, PCI DSS, Electronic Signature Regulations, Financial Reporting/Revenue Recognition/Contract Governance Policies. |

## Project Structure

### Documentation (this feature)

```
specs/053-enterprise-sales-management-v2/
├── spec.md
├── plan.md
├── research.md         # 9 NEEDS CLARIFICATION items from §5
├── data-model.md        # 5 new entities + references into 013/045/046
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── ai-assistant-output-zero-autonomous-transmission.contract.md
    ├── classification-tier-access-restriction.contract.md
    └── pricing-security-hidden-from-unauthorized-roles.contract.md
```

### Source Code (repository root)

```
backend/src/modules/sales-v2/
├── architecture-lifecycle/           # FR-001-007 — event-driven architecture, 15-stage lifecycle (distinct from 045's, per §5)
├── ai-sales-assistant/               # FR-008-010, FR-020 — human-review-gated drafting (canonical, new ground)
├── ai-pipeline-opportunity-revenue-risk-intelligence/ # FR-011-018, FR-021-022 — advisory layer over 013/045 data (per §1)
├── sales-data-classification/        # FR-023-027 — 10-tier scheme (canonical, new ground)
├── pricing-security/                 # FR-028-032 — distinct control surface (canonical, new ground)
├── territory-ai-layer/               # FR-033-036 — AI recommendations over 045's Territory entity (per §1)
├── partner-channel-sales-portal-view/ # FR-037-042 — surfaces 046's Partner/Deal-Registration/Incentive data (per §2)
├── sales-forecasting-ai-layer/       # FR-043-046 — confidence/override behavior over 045's Forecast entity (per §1)
├── sales-communication-center/       # FR-047-049
└── sales-governance-portal-compliance/ # FR-050-056
└── common/
    # reused from 013 (base CRM entities), 045 (RevOS Opportunity/Pipeline/Territory/Forecast/Account),
    # 046 (Partner/Deal Registration/Channel Incentive), 008 (AI gateway), 001/016 (RBAC)
    # NO new Partner data model, deal-registration workflow, or incentive ledger (confirmed reuse, per §2)

web/app/(admin)/enterprise-sales-portal/
├── ai-sales-assistant/
├── pipeline-intelligence/
├── data-classification-admin/
├── pricing-security/
├── territory-view/
├── partner-channel-view/
├── forecasting/
└── governance-compliance/
```

**Structure Decision**: `sales-data-classification` and `ai-sales-assistant` are built and contract-tested first — the 10-tier classification scheme is the chapter's most distinctive, highest-governance-value addition not already owned by `013`/`045`, and the AI Sales Assistant is the chapter's signature capability and the clearest expression of Constitution Article II in this chapter.

## Complexity Tracking

*No constitutional violations identified. This section intentionally left empty.*
