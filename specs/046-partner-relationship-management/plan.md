# Implementation Plan: Enterprise Partner Relationship Management (PRM/PEOS)

**Branch**: `046-partner-relationship-management` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/046-partner-relationship-management/spec.md`

## Summary

This feature builds the Partner Ecosystem Operating System (PEOS) described in Volume 14 Part 2 Chapter 13: a 16-stage enterprise Partner Lifecycle (Prospect Partner→Alumni/Offboarded) and a 14-phase Partner Operating Model, organized around a unified Partner 360° workspace; Partner Registration through a 9-step workflow; Verification & Due Diligence (10 verification components, 10 due diligence categories) with AI risk intelligence that is advisory-only ahead of every approve/reject decision; structured Onboarding with a 10-item checklist; Partner Certification (7 configurable tiers) moving through Enrollment→Recertification with AI learning intelligence; Partner Success Management with a configurable Partner Health Score; an executive Partner Intelligence Dashboard; enterprise Channel Sales Management (12 channel categories, a 12-stage Channel Opportunity lifecycle, opportunity collaboration); Channel Lead Distribution (10 assignment models); Deal Registration Management with structured Conflict Resolution (duplicate detection, territory validation, partner priority, executive arbitration); Channel Incentive Management (10 program types) gated by a Finance→Executive approval chain; Channel Performance Management and a Channel Intelligence Dashboard; enterprise Affiliate Management (13 classifications) with a 9-step registration workflow; Affiliate Tracking with 6 attribution models and AI fraud detection; Commission Management (10 configurable models) through an 8-step workflow ending in Settlement Confirmation; Affiliate Performance Management and an Affiliate Intelligence Dashboard; and the unified Enterprise Partner Portal (16 modules) bundling Learning/Certification, Marketing Resources, Support, Community, and a partner-facing Intelligence Portal, secured by RBAC/MFA/SSO.

This chapter is not directly named by the constitution, but its own "Why this priority" rationale (User Story 4) explicitly names **Article VII** for the Finance→Executive incentive approval chain, and its Assumptions explicitly invoke **Article V** (Ledger-Based Internal Economies) for the proposed shared Partner Wallet — a mixed User-story-rationale and Assumptions-paragraph citation pattern.

**Spec.md performs the most thorough self-resolution of any overlap this session**: it identifies the redundancy with `030`, proposes an ownership split (030 = individually-recruited partners; 046 = enterprise channel/reseller/distributor partners), proposes a shared Partner Wallet ledger per Article V, and explicitly documents a nine-vs-ten commission-model naming mismatch it deliberately does not reconcile. This plan verifies that proposal against `030`'s actual plan.md and surfaces one further overlap neither spec caught: a Channel Opportunity vs. Opportunity entity collision with `045`.

## Ownership & Dependency Analysis

### §1. Partner/Affiliate/Commission overlap with `030` — spec.md's self-resolution verified against `030`'s actual plan.md

Spec.md's own Assumptions propose: `030` owns the canonical Partner entity for individually recruited, marketing-funnel-originated partners; `046` owns the canonical Partner entity for enterprise channel/reseller/distributor/strategic-alliance partners going through the 16-stage formal lifecycle; both share a single **Partner Wallet** ledger per Constitution Article V, so a dual-role partner has one reconciled financial history. Checked against `030`'s actual plan.md: `030` already implements exactly this — a `partner-wallet-payout` module with "Partner Wallet ledger, Payout, tax/invoicing, reconciliation," explicitly built as "an append-only, immutable ledger (Article V)," plus its own `Fraud Risk Score`/`Fraud Case` and `Commission Rule`/`Commission` entities. **This confirms spec.md's proposed resolution is not just aspirational but directly implementable**: `046`'s Channel Incentive/MDF payments and Commission Records extend `030`'s existing Partner Wallet ledger and reuse its fraud-detection entity shape, rather than standing up a second, parallel ledger or fraud engine.

Spec.md's own Assumptions also explicitly flag — and deliberately do not reconcile — a nine-vs-ten commission-model naming mismatch between this chapter's ten models (Percentage-Based, Fixed, Tiered, Recurring, Lifetime, Milestone, Team, Performance Bonus, Campaign Incentives, Hybrid) and `030`'s nine (fixed, percentage, tiered, product-based, customer-type, recurring, hybrid, performance bonus, non-monetary reward). This plan preserves that non-resolution: implementations MUST treat the union of both lists as the full supported set and flag any conflicting calculation logic during a future reconciliation pass, per spec.md's own explicit instruction.

### §2. Channel Opportunity vs. `045`'s Opportunity — new finding, not caught by either spec

`046`'s Channel Opportunity (FR-039: Opportunity ID, customer account, assigned partner, internal sales owner, products/services, opportunity value, expected revenue, probability score, forecast category, current stage, expected close date, AI opportunity score, risk level, competitor information) carries a near-identical field set to `045`'s Opportunity entity (Opportunity ID, Account, Primary Contact, Owner, Products, Expected Revenue, Sales Stage, Win Probability, Health Score, AI Confidence Score, Risk Level, Competitors). `046` progresses its Channel Opportunity through its own 12-stage lifecycle (FR-038, Lead Assigned→Expansion) distinct from `045`'s 16-stage Opportunity lifecycle. Neither `045`'s nor `046`'s spec.md cross-references the other — this is the same class of one-directional, uncaught overlap already found between `041`/`042`, `042`/`043`, and `044`/`030` earlier this session.

**Ownership decision**: `045` (Chapter 12, the general enterprise sales/RevOS layer, planned immediately prior to this chapter) remains canonical owner of the core Opportunity entity and its lifecycle mechanics. `046`'s Channel Opportunity is treated as a channel-collaboration extension over `045`'s Opportunity record — adding partner-specific collaboration fields (assigned partner, partner-facing SLA, channel audit timeline) — rather than a fully independent, competing Opportunity entity with its own parallel 12-stage lifecycle. Implementations MUST link every Channel Opportunity to an underlying `045` Opportunity record rather than duplicating opportunity data entry.

### §3. Lead entity vs. `013`/`045` — reuse decision made explicit

`046`'s Channel Lead Distribution (FR-042–045) distributes leads to channel partners using 10 assignment models, but does not define its own `Lead` entity in its Key Entities list. Consistent with `045`'s own established finding (verified last turn) that `013` owns the canonical Lead entity, `046`'s Channel Lead Distribution is confirmed to consume that same shared Lead pool — assigning existing `013`-owned Lead records to partner organizations — rather than defining a parallel Lead entity.

### §4. Partner Portal auth (RBAC/MFA/SSO) vs. `003` — reuse decision made explicit

Spec.md's own Assumptions already state MFA/SSO/RBAC for the Partner Portal reuse `003`'s shared authentication/identity system rather than a partner-specific auth stack. This plan confirms this as the standard, already-established reuse pattern (consistent with every other portal-fronting feature this session).

### §5. Payment/tax execution vs. `009` — reuse decision made explicit

Spec.md's own Assumptions already state payment rails, banking/tax execution, and legal contract execution are out of scope (FR-006) and deferred to `009`'s existing infrastructure, consistent with `030`'s and `045`'s equivalent deferrals.

### §7. Marketplace Integration vs. `071` (Enterprise Marketplace, Partner Ecosystem & API Marketplace) — cross-reference added 2026-07-24, per `071/plan.md` §1

`071` has now been planned as Volume 14 Chapter 38's enterprise marketplace/API platform, and its own plan.md §1 identifies this feature as canonical for the Partner entity, its lifecycle, certification, dashboard, and revenue-share/incentive mechanics — `071`'s own "Partner Ecosystem Management" section (10 partner categories, a simple sequential lifecycle, a Partner Dashboard) was found to be a shallower re-description of this feature's already-comprehensive 16-stage PEOS, not a genuinely competing system. **Ownership decision**: `071`'s Partner Ecosystem section is the marketplace-specific integration point over this feature's already-certified/verified partners — which partners have marketplace-listing access, and how a partner's marketplace-sold-product revenue reconciles with this feature's Partner Contract/revenue-share record — rather than a second Partner lifecycle/dashboard/certification system. This feature's own 10-category enterprise-channel-partner scope (vs. `030`'s individually-recruited scope, per §1 above) is confirmed as the correct match for `071`'s own 10 partner categories.

### §6. Preserved NEEDS CLARIFICATION items (from spec.md's own Edge Cases and Assumptions — not resolved here)

- Merge/reject/arbitration rule and territory precedence when two partners independently register the same customer opportunity (Edge Cases).
- Default behavior when a deal registration's protection period expires while still actively negotiating — auto-renew, explicit renewal request, or unprotected (Edge Cases).
- Whether an MDF/incentive request exceeding program budget is blocked outright by Finance Review or routed to Executive Approval with a budget-overrun flag (Edge Cases).
- Review/reinstatement path when AI fraud detection flags a legitimate affiliate's conversions as a false positive (Edge Cases).
- Effect of a lapsed certification on in-flight deal registrations/incentive tiers that require it as an eligibility condition — grandfathered, held, or forfeited (Edge Cases).
- Reassignment timing and future lead-distribution-priority effect when a partner rejects or misses the SLA on an assigned lead (Edge Cases).
- Whether a duplicate partner-registration application (matching a prior registered/rejected/offboarded organization) is blocked outright or routed to a reviewer with prior history attached (Edge Cases).
- Whether a sharp Partner Health Score decline applies retroactively to already-granted elevated commission tiers and protected deal registrations (Edge Cases).
- Whether AI content monitoring may auto-remove a reported community post or always requires human moderator action (Edge Cases; Constitution Article II tension explicitly noted by spec.md itself).
- The dual-role partner identity/wallet/commission-authority question (§1's shared-Partner-Wallet proposal) — spec.md's own recommendation, not a stated PRD requirement, so it remains flagged rather than treated as settled.

None of these are silently resolved; each remains an open gate for a future clarification pass.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–045.

**Primary Dependencies**: NestJS, Next.js; `030`'s Partner Wallet ledger, Fraud Risk Score/Fraud Case, and Commission Rule/Commission entities as the shared financial substrate (per §1); `045`'s Opportunity entity as the underlying record Channel Opportunity extends (per §2); `013`'s canonical Lead entity as the source pool for Channel Lead Distribution (per §3); `003`'s auth/identity infrastructure for Partner Portal RBAC/MFA/SSO (per §4); `009`'s payment/tax execution (per §5); `008`'s AI gateway for every advisory AI-intelligence module in this chapter.

**Storage**: PostgreSQL (17 entities per Key Entities: Partner, Partner Application/Registration, Verification & Due Diligence Record, Onboarding Checklist, Certification, Channel Opportunity, Deal Registration, Lead Assignment, Channel Incentive/MDF Program, Commission Model/Commission Record, Affiliate Profile, Tracking/Attribution Record, Partner Portal Resource, Support Ticket, Community Post/Contribution, Executive Dashboard/Report, Audit Record).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: partner-lifecycle-full-audit-trail for SC-001, verification-never-auto-approves-or-rejects for SC-002, and incentive-commission-requires-finance-and-executive-approval for SC-004), Playwright (web e2e — Partner 360° workspace, Verification Dashboard, Deal Registration/Conflict flow, Certification Center, Partner Portal dashboard).

**Target Platform**: Web (Enterprise Partner Portal + Internal Channel/Affiliate Admin Portal, rendered inside `017`'s workspace shell for internal users).

**Performance Goals**: Per FR-094/SC-010, the platform must support millions of partner organizations/affiliates/referrals/opportunities/transactions across multi-region/multi-language/multi-currency/multi-tenant deployments with analytics/AI/reporting operating independently from transactional workloads [NEEDS CLARIFICATION: no numeric thresholds stated in source].

**Constraints**: Zero partner reaches "Approved" without completing all 10 verification components and 10 due diligence categories with an attached AI risk assessment, and zero AI score alone may trigger approval/rejection without a recorded human decision (FR-019, SC-002; Constitution Article II); zero deal-registration conflict may leave two partners simultaneously holding an unresolved protected claim on the same opportunity (FR-048, SC-003); zero incentive or commission payment may reach Payment Processing without passing both Finance Review and Executive Approval in sequence (FR-052, FR-070, SC-004; Constitution Article VII); zero commission may reach Payment Processing while an unresolved fraud flag is open against the same conversion (FR-067, SC-007); every commission/incentive payment posts as an append-only ledger entry against `030`'s shared Partner Wallet, never a directly mutable balance field (§1; Constitution Article V).

**Scale/Scope**: 17 entities, 94 FRs, 8 user stories, 16-stage Partner Lifecycle, 14-phase Partner Operating Model, 12-stage Channel Opportunity lifecycle, 9-step Deal Registration workflow, 8-step Commission workflow, 7-step Incentive workflow, 10 preserved NEEDS CLARIFICATION items, no worsening of any of the 8 previously-accumulated Wave 2/3 architecture gaps, one new cross-feature entity collision surfaced and resolved with `045` (§2), and confirmation that spec.md's own proposed `030` ownership split and shared-ledger design is directly implementable against `030`'s actual plan.md (§1).

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Partner Health Score, verification outcomes, and incentive/commission calculations are all server-computed, never client-asserted. |
| II. AI Is Assistive, Never Autonomous | PASS | FR-002, FR-019, FR-028, FR-032, FR-034, FR-053, FR-057, FR-059, FR-067, FR-071, FR-073, FR-080, FR-088, FR-092 all require human review before an AI output takes effect; SC-002 and SC-007 state zero-tolerance success criteria for autonomous approval/payment. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | FR-006 bars automatic commercial-agreement approval and overriding enterprise compliance processes. |
| IV. Historical Immutability | PASS | Registration, verification, onboarding, certification, deal-registration, incentive, and commission events all generate immutable audit log entries (FR-089, FR-093) rather than overwriting prior state. |
| V. Ledger-Based Internal Economies | PASS — Assumptions-cited, verified against `030` | Every commission/incentive/MDF payment posts as an append-only entry against `030`'s existing Partner Wallet ledger rather than a mutable balance field (per §1). |
| VI. Consent Is First-Class, Per-Channel, and Versioned | N/A | This chapter's registration/communication flows are assumed to inherit consent handling from `002`/`003`/`019`'s existing infrastructure rather than defining a new one. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS — User-story-rationale cited (US4) | FR-052/FR-070's Finance→Executive incentive/commission approval chain and FR-093's RBAC/MFA/SSO across the Partner Portal configure `003`'s/`016`'s existing infrastructure. |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Partner Health Score, certification tiers, and territory/lead-distribution rules are all evidence/data-based (FR-030, FR-043) rather than purchasable or vanity-metric-driven. |
| IX. Action Before Consumption | PASS | Every partner, certification, deal registration, and commission progresses through defined stages toward a measurable outcome (FR-007, FR-027, FR-047), not passive tracking. |
| Localization & Language Requirements | PASS (not primary focus, inherited) | FR-094 requires multi-language support at the platform-architecture level; broader Tamil/Tanglish handling is inherited from `020`/`021`'s established patterns rather than redefined here. |
| Security & Compliance Baseline | PASS | FR-093 (immutable audit logs, encryption at rest/in transit, RBAC/MFA/SSO) aligns with the baseline. |

## Project Structure

### Documentation (this feature)

```
specs/046-partner-relationship-management/
├── spec.md
├── plan.md
├── research.md         # 10 NEEDS CLARIFICATION items from §6
├── data-model.md        # 17 entities
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── partner-lifecycle-full-audit-trail.contract.md
    ├── verification-never-auto-approves-or-rejects.contract.md
    └── incentive-commission-requires-finance-and-executive-approval.contract.md
```

### Source Code (repository root)

```
backend/src/modules/prm/
├── partner-lifecycle-operating-model/      # FR-001-012 — 16-stage lifecycle, 14-phase model, Partner 360°
├── partner-registration/                   # FR-013-016 — 9-step registration workflow
├── partner-verification-due-diligence/     # FR-017-020 — verification, AI risk intelligence (advisory)
├── partner-onboarding/                     # FR-021-024 — onboarding checklist, automation
├── partner-certification/                  # FR-025-028 — 7-tier certification, AI learning intelligence
├── partner-success-management/             # FR-029-032 — Partner Health Score, Success Plans
├── partner-intelligence-dashboard/         # FR-033-035 — executive dashboard
├── channel-sales-opportunity/              # FR-036-041 — channel categories, Channel Opportunity (extends 045, per §2)
├── channel-lead-distribution/              # FR-042-045 — 10 assignment models (consumes 013's Lead, per §3)
├── deal-registration-conflict-resolution/  # FR-046-049 — protection, conflict resolution
├── channel-incentive-management/           # FR-050-053 — 10 program types, Finance→Executive chain
├── channel-performance-intelligence/       # FR-054-059 — scorecards, Channel Intelligence Dashboard
├── affiliate-registration/                 # FR-060-063 — 13 classifications, 9-step registration
├── affiliate-tracking-attribution-fraud/   # FR-064-067 — 6 attribution models, AI fraud detection
├── commission-management/                  # FR-068-071 — 10 models, 8-step workflow (extends 030's ledger, per §1)
├── affiliate-performance-intelligence/     # FR-072-075
├── partner-portal-core/                    # FR-076-078 — 16 modules, RBAC/MFA/SSO (reuses 003, per §4)
├── partner-learning-certification-portal/  # FR-079-080
├── partner-marketing-resource-center/      # FR-081-082
├── partner-support-center/                 # FR-083-084
├── partner-community-platform/             # FR-085-086
└── partner-intelligence-portal/            # FR-087-088
└── common/
    # reused from 030 (Partner Wallet ledger, Fraud Risk Score/Fraud Case, Commission Rule/Commission),
    # 045 (Opportunity entity), 013 (Lead entity), 003 (auth/RBAC/MFA/SSO), 009 (payment/tax), 008 (AI gateway)

web/app/(partner-portal)/
├── dashboard/
├── sales-workspace/
├── deal-registration/
├── learning-certification/
├── marketing-resources/
├── commission-center/
├── support-center/
└── community/

web/app/(admin)/prm/
├── partner-lifecycle/
├── verification-due-diligence/
├── channel-management/
├── affiliate-management/
└── executive-intelligence/
```

**Structure Decision**: `partner-lifecycle-operating-model` and `partner-verification-due-diligence` are built and contract-tested first — the 16-stage lifecycle is the foundational operating model every other capability attaches to, and verification/due diligence is the trust gate every downstream capability (contracting, onboarding, portal access, incentives) depends on, directly implementing Article II for a high-stakes approval decision.

## Complexity Tracking

*No constitutional violations identified. This section intentionally left empty.*
