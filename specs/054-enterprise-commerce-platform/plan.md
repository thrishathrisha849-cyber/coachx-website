# Implementation Plan: Enterprise Commerce Platform: Catalog, Pricing & Order Management

**Branch**: `054-enterprise-commerce-platform` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/054-enterprise-commerce-platform/spec.md`

## Summary

This feature builds the Enterprise Commerce Platform described in Volume 14 Part 2 Chapter 21: a governed Product Catalog / PIM (Draft→Review→Approval→Scheduled→Published→Active→Promotion→Archived→Retired lifecycle) as the single source of truth for every commercial offering, with AI-assisted description/SEO/data-quality tooling; a Pricing Center supporting 12 pricing models with a mandatory human/executive approval workflow before any AI-recommended price takes effect; a Promotion Center and Discount/Coupon Management with fraud/abuse detection; AI Product & Commerce Intelligence (demand forecasting, personalized bundles, cross-sell/upsell); an Order Management System spanning a 12-stage order lifecycle across 11 order-source channels; Shopping Cart Management with cross-device persistence; a 10-step Checkout & Payment Orchestration flow with 11 payment methods; Payment Security & Compliance (PCI DSS, tokenization, fraud/chargeback detection); Subscription Commerce Management; Billing & Invoice Management; Commerce Workflow Automation; and an Enterprise Commerce Portal with Revenue/AI Commerce Intelligence Analytics.

This chapter self-cites Article II verbatim in FR text repeatedly (FR-016, FR-020, FR-021, FR-026, FR-030, FR-039, FR-045, FR-052, FR-056, FR-063, FR-067 all cite "Article II") and additionally cites Article IV (FR-022) and Article VII (FR-020) — the broadest multi-article FR-text-verbatim citation spread of any feature this session. Its own "Notes on scope granularity" section explicitly identifies and rejects a direct conflict between the source's later-roadmap "Autonomous Commerce Ecosystem" material and Article II, preserving it as `[NEEDS CLARIFICATION]` rather than silently adopting the autonomous framing.

**Spec.md performs a thorough self-resolution of its overlap with `011`** (canonical for marketplace Order/Payment/Commission/Payout) **and forward-declares `071`** (not yet planned). This plan verifies the `011` deferral against its actual plan.md and surfaces a substantial, previously-uncaught duplication `054`'s own Assumptions never address: its entire "Subscription Commerce Management" section re-specifies ground `009` already canonically owns.

## Ownership & Dependency Analysis

### §1. Order/Payment/Commission/Payout vs. `011` — confirmed clean, verified against `011`'s actual plan.md

Spec.md's own Assumptions state `011` is canonical for marketplace order, seller-commission, and payout entities, and that `054` should reuse `011`'s Order/Payment/Commission data model for marketplace transactions rather than defining a second, competing order schema — while `054` owns catalog, pricing rules, promotions, and subscriptions outright. Checked against `011`'s actual plan.md: `011` confirms it "defers, never duplicates: payment gateway integration, the core financial ledger/double-entry engine, GST calculation, and affiliate program mechanics to `009`," while owning its own Marketplace Order/Suborder, Earning, and Payout state machines — an exact match to `054`'s own claim. No contradiction found.

### §2. Subscription Commerce Management vs. `009` — new finding, substantial, not caught by `054`'s own Assumptions

`054`'s FR-053–FR-056 independently define a full "Subscription Commerce Management" section with its own Subscription lifecycle (Trial, Active, Renewal Reminder, Renewal Processing, Renewed, Upgrade, Downgrade, Suspended, Cancelled, Expired), auto/manual renewal, pause, plan changes, billing history, renewal notifications, invoice generation, usage tracking, license allocation, and enterprise seat management. `054`'s own Assumptions mention reusing `009`'s payment-gateway and tax infrastructure, but **never address the Subscription entity itself**.

Checked against `009`'s actual plan.md and spec.md: `009` explicitly claims "the full subscription lifecycle (trial, upgrade/downgrade with proration, pause/resume, cancellation, dunning/grace period)" as part of "the platform's entire financial backbone," building "its own independent state machines for Subscription, Order, Payment, Refund, Dunning..." and explicitly states other features "are all expected to consume this module's `Entitlement`, `Order`, and `Subscription` entities rather than maintaining parallel truth." `009`'s own Key Entities define `Subscription / Subscription Item / Subscription Schedule / Subscription Change` with a full billing-cycle state machine and upgrade/downgrade/pause/resume/migration tracking — materially overlapping `054`'s FR-054 lifecycle.

**Ownership decision**: `009` remains the canonical owner of the Subscription entity, its billing-cycle state machine, proration, dunning/grace-period mechanics, and renewal processing. `054`'s "Subscription Commerce Management" section does **not** build a second Subscription lifecycle — it is the commerce-catalog-layer orchestration on top of `009`'s existing entity: linking catalog-defined subscription products/plans to `009`'s Subscription/Billing Account records, enterprise seat management and usage tracking specific to commerce-catalog items, and the AI renewal-prediction/churn-detection/subscription-health-scoring intelligence layer. This is the eighth consecutive feature this session to surface a genuine, previously-uncaught cross-feature dependency during planning (after `041`/`042`, `042`/`043`, `044`/`030`, `046`/`045`, `048`/`047`+`040`, `050`/`004`, `051`/`050`, `052`/`040`+`047`, `053`/`046`).

### §3. Payment gateway integration & tax calculation vs. `009` — confirmed clean

Spec.md's own Assumptions state payment gateway integrations (Razorpay, Stripe, PayPal, PhonePe, Google Pay, Apple Pay, Paytm, Cashfree) and GST/CGST/SGST/IGST tax calculation reuse `009`'s existing infrastructure rather than being rebuilt. Checked against `011`'s plan.md (which independently confirms the identical deferral to `009` for the same infrastructure): consistent, no contradiction. `054`'s checkout/cart layers orchestrate on top of `009`'s payment/tax engine rather than reimplementing it.

### §4. RBAC vs. `001`/`016` — confirmed clean

Spec.md's own Assumptions state "Executive Approval," "Pricing Manager," "Catalog Manager," and "Commerce Operations Manager" roles map onto the platform's layered RBAC hierarchy (Constitution Article VII) rather than a commerce-specific role system. Standard, already-established reuse pattern.

### §5. Later-chapter overlap (`071`, not yet planned) — preserved as stated by `054`'s own Assumptions

Spec.md's own Assumptions state `071-enterprise-marketplace-partner-ecosystem` (Chapter 38, a later, more redundant chapter) should cross-reference `054`'s catalog/pricing/order-lifecycle definitions rather than duplicating them, with any partner-specific commission/payout structure belonging in `071` or `011`, not `054`. This cannot be verified yet since `071` has not been planned; preserved as the working assumption.

### §6. Inventory/Warehouse Management (likely `056`, not yet planned) — preserved as stated by `054`'s own Assumptions

Spec.md's own Assumptions state inventory/warehouse management for physical products is owned by a separate inventory/WMS feature referenced elsewhere in Volume 14's later chapters (per `CLAUDE.md`'s document map, this is `056-enterprise-inventory-warehouse-wms`), with `054` covering only the catalog's "Inventory Status" attribute and AI inventory *recommendations*. This cannot be verified yet since `056` has not been planned; preserved as the working assumption.

### §7. Preserved NEEDS CLARIFICATION items (from spec.md's own explicit flag and Edge Cases, plus §2's new finding — not resolved here)

- The direct conflict between the source's later-roadmap "Autonomous Commerce Ecosystem"/"Future AI Commerce Ecosystem" material (§28–29, configurable/optional human approval) and Constitution Article II — explicitly flagged by spec.md itself; this spec assumes Article II governs and autonomous execution without approval is out of scope.
- Whether a customer mid-checkout sees the cart-added price or a newly AI-recommended price, and how the change is communicated before payment authorization (Edge Cases).
- Subscription proration interaction with an active coupon/promotional discount during a mid-cycle upgrade/downgrade (Edge Cases; also relevant to `009`'s proration mechanics per §2).
- Escalation path for a Commerce Operations Manager to release a false-positive fraud hold without bypassing the audit trail (Edge Cases).
- Duplicate-charge prevention when a gateway authorization succeeds but the confirmation webhook to TBT fails or is delayed (Edge Cases).
- Coupon expiry/maximum-usage-limit handling between cart-add and checkout-completion (Edge Cases).
- Handling of a product Archived/Retired while still an active line item in an open subscription or Draft order (Edge Cases).
- Whether a refund uses the originally snapshotted price/tax or the current catalog configuration (Edge Cases; ties to FR-022's snapshot requirement).
- Conflict-resolution rule when two administrators simultaneously edit conflicting pricing rules or promotion eligibility for the same product (Edge Cases).
- Subscription-lapse-vs-pending-payment-terms handling for enterprise Purchase-Order/Invoice payment methods whose terms extend past a renewal date (Edge Cases; also relevant to `009`'s dunning/grace-period mechanics per §2).

None of these are silently resolved; each remains an open gate for a future clarification pass.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–053.

**Primary Dependencies**: NestJS, Next.js; `011`'s Marketplace Order/Suborder/Earning/Payout state machines as the systems of record for marketplace transactions (per §1); `009`'s Subscription/Billing Account entity and state machine, and its payment-gateway/tax-engine infrastructure, as the systems of record this feature orchestrates on top of (per §2, §3); `001`/`016`'s layered RBAC for Executive Approval and role-based commerce access (per §4); `008`'s AI gateway for every AI Pricing/Promotion/Commerce/Subscription-Intelligence module.

**Storage**: PostgreSQL (12 entities per Key Entities: Product Catalog Entry, Product Variant, Price Rule, Promotion, Discount/Coupon, Shopping Cart, Order, Payment Token, Subscription, Invoice, Commerce Workflow, AI Commerce Recommendation — with Order deferring to `011` for marketplace transactions and Subscription orchestrating on top of `009`'s canonical entity rather than redefining it).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: catalog-zero-publish-without-review-approval for SC-001, price-change-requires-human-approval-zero-autonomous-application for SC-002, and order-price-tax-coupon-immutable-snapshot for SC-003), Playwright (web e2e — PIM product-approval flow, pricing-recommendation review, checkout with tokenized payment, subscription renewal/upgrade/cancellation).

**Target Platform**: Web (Enterprise Commerce Portal, rendered inside `017`'s workspace shell; mobile commerce portal per FR-065).

**Performance Goals**: Per FR-002/SC-008, the platform must scale to millions of products/customers/orders across multi-region/multi-language/multi-currency deployment [NEEDS CLARIFICATION: no numeric thresholds stated in source beyond "near real time" qualitative language, per spec.md's own Assumptions].

**Constraints**: Zero product may reach Published status without passing through the Review/Approval stages (FR-011, SC-001); zero AI-recommended price change may apply to the live catalog without a specific human/executive approval record (FR-020/FR-021, SC-002; Constitution Article II); zero order may reflect a price/tax/coupon value different from what was snapshotted at purchase time even after later configuration changes (FR-022, SC-003; Constitution Article IV); zero raw card number may be stored in TBT-controlled systems — 100% tokenized (FR-046, SC-004; PCI DSS); zero coupon redemption may bypass real-time maximum-usage/eligibility/fraud-detection checks (FR-029, SC-005); zero second Subscription lifecycle/state-machine may be built where `009` already owns that ground (§2).

**Scale/Scope**: 12 entities (one — Subscription — explicitly orchestrating on `009`'s canonical entity rather than redefining it), 67 FRs, 8 user stories, 17-stage Enterprise Commerce lifecycle, 9-stage Product lifecycle, 12-stage Order lifecycle, 10-step Checkout flow, 10-stage Subscription lifecycle (via `009`), 10 preserved NEEDS CLARIFICATION items (1 explicitly self-flagged by spec.md as a direct Article-II conflict, 9 from Edge Cases), no worsening of any of the 8 previously-accumulated Wave 2/3 architecture gaps, one confirmed-clean reuse chain with `011` (§1, verified consistent on both sides), and one substantial new cross-feature dependency surfaced and resolved with `009` (§2) — the eighth consecutive feature this session to surface a genuine, previously-uncaught overlap during planning.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Order status, payment authorization, and pricing approval state are all server-computed/server-enforced, never client-asserted. |
| II. AI Is Assistive, Never Autonomous | PASS — **FR-text-verbatim cited 11×** | The broadest single-article citation density of any feature this session (FR-016, FR-020, FR-021, FR-026, FR-030, FR-039, FR-045, FR-052, FR-056, FR-063, FR-067); spec.md's own "Notes on scope granularity" explicitly rejects the source's later-roadmap autonomous-commerce-agent framing as conflicting with Article II. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | User Story 3 acceptance scenario 3 explicitly bars repeatedly re-surfacing a declined recommendation "in a way that constitutes a dark pattern." |
| IV. Historical Immutability | PASS — **FR-text-verbatim cited** | FR-022 explicitly cites Article IV: price/tax/discount are snapshotted at order placement and never retroactively altered by later catalog changes (SC-003). |
| V. Ledger-Based Internal Economies | PASS (reused, not redefined) | Payment/financial ledger mechanics reuse `009`'s existing double-entry-ready ledger rather than a new balance field (per §3). |
| VI. Consent Is First-Class, Per-Channel, and Versioned | PASS (inherited) | Customer/partner notifications (FR-060) are assumed to respect the platform-wide consent mechanism rather than defining a new one. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS — **FR-text-verbatim cited** | FR-020 explicitly cites Article VII: pricing changes require an Executive Approval workflow configured on `001`'s/`016`'s existing RBAC engine (per §4). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Product performance monitoring and AI recommendations are evidence/data-based (FR-032, FR-033) rather than vanity-metric-driven. |
| IX. Action Before Consumption | PASS | Every product and order progresses through governed lifecycle stages with audit history (FR-011, FR-037), not passive listing. |
| Localization & Language Requirements | PASS | FR-014 requires unlimited-language support with localized pricing/images/SEO and a human review workflow before localized content publishes — a strong, explicit self-application. |
| Security & Compliance Baseline | PASS — directly names the full compliance list | FR-051 explicitly enumerates DPDP Act, GDPR, CCPA, ISO 27001, SOC 2, PCI DSS, financial reporting standards, tax regulations, consumer protection regulations. |

## Project Structure

### Documentation (this feature)

```
specs/054-enterprise-commerce-platform/
├── spec.md
├── plan.md
├── research.md         # 10 NEEDS CLARIFICATION items from §7
├── data-model.md        # 12 entities (Subscription orchestrates on 009's canonical entity)
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── catalog-zero-publish-without-review-approval.contract.md
    ├── price-change-requires-human-approval-zero-autonomous-application.contract.md
    └── order-price-tax-coupon-immutable-snapshot.contract.md
```

### Source Code (repository root)

```
backend/src/modules/commerce/
├── commerce-lifecycle-architecture/  # FR-001-005 — unified ecosystem, 17-stage lifecycle
├── product-catalog-pim/              # FR-006-016 — governed catalog (canonical, new ground)
├── pricing-center/                   # FR-017-022 — 12 pricing models, human-approval gate (canonical)
├── promotion-coupon-management/      # FR-023-030 — campaigns, discounts, fraud detection (canonical)
├── ai-product-commerce-intelligence/ # FR-031-034
├── order-management-system/          # FR-035-039 — reuses 011's Order for marketplace txns (per §1)
├── shopping-cart-management/         # FR-040-042
├── checkout-payment-orchestration/   # FR-043-045 — orchestrates on 009's payment infra (per §3)
├── payment-security-compliance/      # FR-046-052 — PCI DSS, tokenization (extends 009, per §3)
├── subscription-commerce/            # FR-053-056 — orchestrates on 009's Subscription entity (per §2)
├── billing-invoice-management/       # FR-057-059
├── commerce-workflow-automation/     # FR-060-063
└── commerce-portal-analytics/        # FR-064-067
└── common/
    # reused from 011 (Marketplace Order/Commission/Payout), 009 (Subscription entity, payment gateway,
    # tax engine, financial ledger), 001/016 (RBAC), 008 (AI gateway)
    # NO second Subscription lifecycle, NO second marketplace Order schema (confirmed reuse, per §1-§2)

web/app/(admin)/commerce-portal/
├── catalog-pim/
├── pricing-center/
├── promotion-center/
├── order-management/
├── subscription-management/
├── billing-invoice/
├── revenue-analytics/
└── workflow-automation/
```

**Structure Decision**: `product-catalog-pim` and `pricing-center` are built and contract-tested first — the catalog is the foundation every other commerce capability depends on (per spec.md's own User Story 1 rationale), and pricing governance is a mission-critical, non-negotiable control per spec.md's own User Story 2 rationale, tied directly to Constitution Article II.

## Complexity Tracking

*No constitutional violations identified. This section intentionally left empty.*
