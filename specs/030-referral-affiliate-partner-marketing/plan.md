# Implementation Plan: Referral, Affiliate, Ambassador & Partner Marketing Management

**Branch**: `030-referral-affiliate-partner-marketing` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/030-referral-affiliate-partner-marketing/spec.md`

## Summary

This feature builds the platform's enterprise partner-program engine spanning 9 program categories (Customer Referral, Affiliate, Ambassador, Influencer/Creator, Business Partner, Reseller, Agency, Educational Institution, Community Partner): recruitment/application/verification through a 12-status review workflow; a structured onboarding journey gating referral-link generation on agreement/tax/payment completion; digital agreements with e-signature and version control; links/codes/QR/deep-links with configurable attribution windows and models; click/lead/conversion tracking with an 11-factor conversion-validation gate; a Commission Calculation Engine across 9 commission models with a rule-priority engine, tier multipliers, campaign bonuses, and caps; controlled multi-level commission cascades with anti-pyramid safeguards; an append-only Partner Wallet ledger moving through pending→locked→approved→payable→paid states; multi-method, multi-schedule payouts with compliance/finance-review gating, tax/invoicing, and reconciliation; a Fraud Prevention Engine (self-referral, coupon leakage, cookie stuffing, collusion) computing a 0–100 risk score with mandatory human review on high-risk holds; a Marketing Asset Library and partner-campaign system; enterprise partner hierarchy/territory management with conflict detection; a responsive Partner Portal with disputes and support; partner performance/lifecycle/retention automation; 5 program-type-specific management surfaces (ambassador, creator, reseller, agency, institutional); AI Partner Assistant and AI Partner Manager (both strictly advisory); predictive partner analytics; and reporting, compliance, RBAC, privacy, and audit governance.

**This chapter is not cited by name in the constitution's own source list, but it self-applies Constitution Article V by name in two distinct places — an FR-text citation and a user-story-rationale citation, the same dual pattern seen once before (`027`'s Article II/IV rationale citations, `029`'s Article V/VI FR citations) but here concentrated entirely on one article**: FR-039 requires every Partner Wallet balance to be "a derived sum over an append-only, auditable, immutable ledger... never a directly writable balance field, **per the Ledger-Based Internal Economies principle**" (Article V's own title, quoted); User Story 3's "Why this priority" independently states, "Per the Constitution's **Article V (Ledger-Based Internal Economies)**, partner commissions must be an auditable ledger, not a mutable balance — this is a non-negotiable architectural constraint." Article II alignment is present throughout (FR-008, FR-013, FR-048, FR-062, FR-079 all require AI outputs to remain advisory with mandatory human review before consequential action) but is expressed as paraphrase ("consistent with the AI-assistive-never-autonomous principle," "requires human review before any resulting action") rather than the verbatim "Constitution Article II" quotation seen in `025`/`026`/`029`'s FR text — still a clear, deliberate self-application, just a softer citation form.

Per spec.md's own Assumptions, this feature explicitly does not redefine two adjacent systems, and cross-references rather than duplicates them: (1) **Feature `009` (membership-payments-revenue)** already owns the transactional/financial source of truth for referral/affiliate mechanics occurring at the point of purchase — order-level affiliate/referral attribution fields, coupon types, checkout-time fraud signals, the affiliate commission lifecycle tied to Order/Payment records, and the ledger accounts for affiliate/referral payable. Where this spec and `009` describe overlapping mechanics (commission calculation basis, wallet ledger entries, self-referral detection), `009`'s transactional definitions are authoritative for the purchase/order layer; this feature adds the program-management, multi-program (9 categories), hierarchy/territory, partner-lifecycle, marketing-asset, and AI-partner-intelligence orchestration layer on top, without redefining `009`'s order/payment/ledger entities. (2) **Feature `046` (partner-relationship-management, Volume 14 Part 2 Ch 13)** is the later, enterprise-PRM-scale extension — deeper account-based relationship workflows, enterprise deal registration, channel-partner CRM — that is expected to consume and extend this feature's Partner and Partner Organization entities rather than redefine them; any enterprise-PRM requirement not present in this chapter's source text is out of scope here and deferred to `046`.

**Confirmed canonical against `071` (updated 2026-07-24)**: `071` (Enterprise Marketplace, Partner Ecosystem & API Marketplace, Volume 14 Chapter 38) independently claimed its own Affiliate & Referral Ecosystem content should reuse "Feature 011 and Volume 09," never mentioning this feature. Checked against this feature's actual plan.md and corrected in `071/plan.md` §3 rather than here: this feature's Commission Calculation Engine (9 models, nearly identical to `071`'s own 8-model list), append-only Partner Wallet ledger, and Fraud Prevention Engine remain the canonical affiliate/referral orchestration layer — `011` is itself a downstream consumer of `009`'s transactional layer for its own marketplace-attribution purposes, not a co-equal source. `071`'s marketplace-context affiliate/referral programs should consume this feature's engine rather than citing `011` as an independent affiliate-mechanics owner.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–029.

**Primary Dependencies**: NestJS, Next.js; consumes `009`'s transactional/order-level affiliate attribution and ledger accounts as the purchase-layer source of truth rather than re-deriving them; AI Partner Assistant/Manager consuming `008`'s AI gateway (FR-078–FR-080); identity verification, electronic signature, and fraud-detection services provided by external/shared platform services per spec.md's own Assumptions; an integration framework touching `013`/`019`/`020`/`021`/`022`/`025` for communication and workflow dispatch.

**Storage**: PostgreSQL (~22 entities per spec.md's Key Entities — Program, Partner, Partner Application, Partner Organization, Agreement, Tracking Link/Referral Code, Campaign, Marketing Asset, Click, Lead, Conversion, Commission Rule, Commission, Partner Wallet, Payout, Fraud Risk Score, Fraud Case, Partner Hierarchy Level, Territory, Partner Tier, Dispute, Audit Record domains), with Partner Wallet as an append-only, immutable ledger (Article V) and Audit Record immutable.

**Testing**: Jest (backend — wallet-ledger-immutability-with-derived-balance, fraud-hold-blocks-payout-before-paid, and commission-breakdown-reconciles-with-configured-rule contract tests are the highest-stakes tests here, matching this spec's own SC-003/Constitution Article V, SC-005, and SC-002), Playwright (web e2e — partner application/onboarding flow, commission dashboard breakdown view, dispute submission/resolution).

**Target Platform**: Web (Admin/Partner Portal, rendered inside `017`'s workspace shell) plus a public partner-application landing page and a responsive Partner Portal (desktop/tablet/mobile); this is the partner-economics layer sitting alongside `009`'s transactional affiliate mechanics.

**Performance Goals**: Referral link/code generation under 1s; referral code validation under 500ms; click tracking under 300ms; commission calculation under 5s (FR unstated section reference, SC-004).

**Constraints**: 100% of onboarding tasks (agreement, tax, payment method) are enforced before referral-link activation (FR-014, SC-001); every supported commission model's breakdown reconciles exactly with its configured rule (FR-035, SC-002); every wallet balance is fully reconstructable as the exact derived sum of ledger transactions, with zero directly-edited balance fields (FR-039, SC-003); at least 95% of self-referral/coupon-leakage fraud cases are held before payout, and no commission reaches "Paid" while an open Critical-band fraud case exists against the same conversion (FR-047–FR-049, SC-005); multi-level cascades never exceed the configured maximum hierarchy depth, with 100% of override commissions traceable to a revenue-generating conversion and zero recruitment-only payouts where not permitted (FR-031, SC-006); territory conflicts surface to an administrator before any lead is auto-assigned under the conflicting configuration (FR-075, SC-007); zero consequential AI Partner Manager actions are taken without a human decision recorded in the audit log (FR-079, SC-010, Constitution Article II).

**Scale/Scope**: ~22 data entities, 85 functional requirements (FR-001–FR-085), 7 user stories, 9 partner-program categories, 17 partner types, 9 commission models, 15 RBAC roles, and multiple NEEDS CLARIFICATION-adjacent open items in spec.md's Edge Cases (coupon-leakage retroactive exclusion, fraud false-positive appeal path, mid-cascade partner suspension handling, overlapping-territory double-conversion resolution, post-payout refund offset when no future commissions exist, simultaneous tier-upgrade/downgrade precedence, cross-program attribution conflict, partial payout-batch failure isolation, indefinite-onboarding expiry/escalation) plus the jurisdiction-dependent legal gating on multi-level commission (§33) that this spec treats as program-configurable rather than resolving to specific jurisdictions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Commission calculation, fraud scoring, wallet-balance derivation, and payout-state transitions are entirely server-side; no client-asserted commission or balance | **PASS — direct implementation (not the constitution's named source for this article)** | FR-035, FR-039, FR-048 |
| II. AI Is Assistive, Never Autonomous | AI-assisted partner identification, approval scoring, executive summaries, and the AI Partner Manager all require human review before any consequential action; expressed via paraphrase rather than a verbatim "Article II" FR quote, but explicit and repeated | **PASS (aligns; spec.md explicitly applies this principle by description across 5 FRs)** | FR-008, FR-013, FR-062, FR-078–FR-079, SC-010 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | Promotional compliance rules explicitly prohibit misleading claims, unauthorized trademark bidding, and non-disclosed affiliate content | **PASS (aligns; not the constitution's named source for this article)** | FR-051 |
| IV. Historical Immutability | Audit Record is immutable; original transaction history is preserved through refund/reversal rather than edited in place | **PASS (aligns; not the constitution's named source for this article)** | FR-037, FR-085 |
| V. Ledger-Based Internal Economies | **FR-039 cites "the Ledger-Based Internal Economies principle" verbatim, and User Story 3's rationale independently cites "the Constitution's Article V (Ledger-Based Internal Economies)" verbatim** — the Partner Wallet is an append-only ledger with derived, never-directly-writable balances | **PASS — direct implementation, spec.md explicitly applies this article twice, in both FR text and user-story rationale** | FR-039, SC-003 |
| VI. Consent Is First-Class | Click tracking captures consent status; data-privacy controls require consent-aware tracking | **PASS (aligns; not the constitution's named source for this article)** | FR-024, FR-084 |
| VII. Layered, Explicit RBAC | 15 named roles configurable at program/partner/organization/data-field levels | **PASS (extends 001/016)** | FR-083 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A — partner tiers are performance/compliance-based, not directly purchasable; leaderboard opt-out is supported | **PASS (N/A; aligns)** | FR-067–FR-068 |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Program supported-language configuration; partner preferred language in profile | **PASS (aligns; not the constitution's named source for this article)** | FR-002, FR-005 |
| Security & Compliance Baseline | RBAC, consent-aware tracking, data masking, pseudonymized analytics, retention/deletion workflows, immutable audit log, sanctions/compliance screening | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-012, FR-083–FR-085 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/030-referral-affiliate-partner-marketing/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: jurisdiction-specific legal thresholds for enabling multi-level commission per program (§33), fraud-score numeric thresholds beyond the stated bands, dispute/onboarding SLA durations, coupon-leakage retroactive-exclusion policy, fraud false-positive appeal path, mid-cascade partner-suspension handling, overlapping-territory conflict resolution, post-payout refund-offset-with-no-future-commissions policy, and simultaneous tier-upgrade/downgrade precedence
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`029`'s structure — no new top-level projects; this feature consumes `009`'s transactional affiliate/order layer and is expected to be extended by `046`'s enterprise PRM layer.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── partner-program-management/  # Program, Partner, partner-type classification (FR-001–FR-005)
│   │   ├── partner-recruitment/         # Partner Application, review workflow, verification, approval scoring (FR-006–FR-013)
│   │   ├── partner-onboarding/          # onboarding journey, training, Agreement (FR-014–FR-017)
│   │   ├── tracking-attribution/        # Tracking Link/Referral Code, QR, deep links, Click, Lead, Conversion (FR-018–FR-027)
│   │   ├── commission-engine/           # Commission Rule, Commission, calculation engine (FR-028–FR-030, FR-032–FR-038)
│   │   ├── multi-level-commission/      # hierarchy cascade, anti-pyramid safeguards (FR-031)
│   │   ├── partner-wallet-payout/       # Partner Wallet ledger, Payout, tax/invoicing, reconciliation (FR-039–FR-046)
│   │   ├── fraud-prevention/            # Fraud Risk Score, Fraud Case, self-referral/coupon-leakage detection (FR-047–FR-051)
│   │   ├── marketing-assets-campaigns/  # Marketing Asset, Campaign (FR-052–FR-055)
│   │   ├── partner-communication-support/ # Communication Center, Support System, Dispute (FR-056–FR-058)
│   │   ├── partner-portal-dashboards/   # Partner Portal, partner/admin/executive dashboards (FR-059–FR-062)
│   │   ├── partner-performance-lifecycle/ # performance score, health, lifecycle, retention, tier (FR-063–FR-068)
│   │   ├── program-type-specific/       # ambassador/creator/reseller/agency/institutional management (FR-069–FR-073)
│   │   ├── partner-hierarchy-territory/ # Partner Hierarchy Level, Territory, lead distribution, revenue categorization (FR-074–FR-077)
│   │   ├── ai-partner-intelligence/     # AI Partner Assistant, AI Partner Manager, predictive analytics (FR-078–FR-080)
│   │   └── partner-governance/          # liability reporting, budget, RBAC, privacy, Audit Record (FR-081–FR-085)
│   └── common/                          # reused from 009: order/payment/ledger source of truth; reused from 008: AI gateway; reused from 001/016: RbacGuard; reused from 013/019/020/021/022/025: integration targets
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── partners/{programs, applications, commissions, wallets, payouts, fraud, hierarchy, dashboards}/
    └── (public)/
        └── partner-apply/[programSlug]/page.tsx
    └── (partner-portal)/
        └── portal/{dashboard, links, campaigns, assets, wallet, disputes, support, profile}/
```

**Structure Decision**: 15 new backend modules under `partner-*`/`commission-*`/`tracking-*`/`fraud-*`/`ai-partner-*`, each mapping to one of spec.md's FR groupings. `partner-wallet-payout` (Article V ledger integrity) and `commission-engine` (calculation correctness) are built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
