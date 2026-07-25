# Implementation Plan: Membership, Subscriptions, Payments & Revenue Operations

**Branch**: `009-membership-payments-revenue` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-membership-payments-revenue/spec.md`

## Summary

This feature builds the platform's entire **financial backbone**: the product/price/plan catalog and entitlement engine; India-focused checkout across UPI/card/net-banking/wallet/EMI/bank-transfer/offline; a provider-agnostic payment gateway abstraction with signature-verified, idempotent, out-of-order-safe webhook processing; the full subscription lifecycle (trial, upgrade/downgrade with proration, pause/resume, cancellation, dunning/grace period); GST-compliant invoicing, receipts, and credit notes; refunds bounded by refundable balance; a platform wallet and coupon/promotion engine; referral and affiliate programs with fraud-gated, hold-period-respecting payout; enterprise/organization billing with purchase orders, credit terms, and dual-approval offline payments; a double-entry-ready financial ledger; and settlement reconciliation with period close.

This feature is the constitution's **primary cited source for four separate articles** — more than any prior feature: **Article I (Server-Authoritative State)** — "Vol 09: Server-Authoritative Payments principle" (FR-149, FR-069, SC-002); **Article IV (Historical Immutability)** — "Vol 09: order snapshots price/tax/coupon/commission at purchase time" (FR-133, FR-026); **Article V (Ledger-Based Internal Economies)** — "Vol 09: financial ledger, double-entry-ready design" (FR-130–FR-132); and **Article VII (Layered, Explicit RBAC With Approval Chains)** — "Vol 09: dual-approval for high-risk finance actions" (FR-152). It is also **directly named** in the constitution's Security & Compliance Baseline ("Vol 09: GST architecture," FR-070–FR-081).

Per spec.md's own Assumptions, this feature is the **entitlement source of truth for the whole platform**: `004` (LMS course/plan-gated access), `007` (mentor session credits and event-adjacent purchases), and future `011`/`012` (marketplace/jobs commerce) are all expected to consume this module's `Entitlement`, `Order`, and `Subscription` entities rather than maintaining parallel truth — this spec does not redefine their business logic, only the shared financial contract they plug into. It **reuses `001`'s layered RBAC** for finance-role permission checks and dual-approval separation-of-duty enforcement, and its audit-log pattern for the `Finance Audit Log`. It explicitly **does not redefine** `006`'s Reward Point/XP ledger (only integrates with it per FR-093, preserving `006`'s hard rule that XP is never redeemable for payment) nor `007`'s mentor payout business rules (only defines the shared multi-party revenue-split and ledger mechanics `007` must plug into, per FR-119 and FR-137). It builds its **own** independent state machines for Subscription, Order, Payment, Refund, Dunning, Referral, Affiliate Commission, and Chargeback — none reused from a prior feature, since payment/financial semantics are genuinely domain-specific to this feature.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–008.

**Primary Dependencies**: NestJS, Next.js, Flutter; a payment-provider abstraction layer with India-focused initial integration (FR-049, FR-050 — **RESOLVED 2026-07-24, per `064/plan.md` §1**: `064` (Enterprise Integration Platform, iPaaS & API Management) now provides the named candidate connector list — Stripe, Razorpay, PayPal, PhonePe, Cashfree — this feature's provider-independent abstraction should select from and integrate against; the specific India-launch provider choice among that list remains an implementation decision, but the previously-open "which provider" question is now answered by `064`'s concrete connector catalog rather than left fully undefined); a job scheduler for dunning retries, trial-expiry reminders, subscription renewals, and payout runs (no vendor named, consistent with the same gap in `006`/`007`); a GST/tax-calculation and invoice-numbering engine requiring finance/tax-professional sign-off before go-live (FR-070, FR-076); accounting-system export integration (FR-142 — no vendor named).

**Storage**: PostgreSQL (~28 entities per spec.md's Key Entities — catalog/entitlement, subscription/billing, order/cart, payment/webhook, invoice/tax, refund/wallet/coupon, referral/affiliate, enterprise-billing, ledger/reconciliation domains), with the `Financial Ledger Entry` table designed double-entry-ready and append-only per Constitution Article V; Redis (idempotency-key locks, coupon-budget concurrency locks, webhook-processing locks, rate limiting).

**Testing**: Jest (backend — no-entitlement-without-verified-payment, idempotent-duplicate-checkout, and duplicate-webhook-dedup contract tests are the highest-stakes tests in this entire feature, directly matching SC-002, SC-003, and SC-007), Playwright (web e2e — checkout flow, billing self-service), Flutter test (mobile — offline cart/checkout-draft persistence).

**Target Platform**: Web + mobile; this module's entitlement/order/subscription state is also consumed as a backend contract by every other feature's paid-access checks.

**Performance Goals**: Checkout requests process synchronously through order-creation and provider-order-creation with idempotency-key deduplication; webhook events process through a locked, state-machine-validated pipeline tolerant of duplication and out-of-order delivery; large finance reports (settlement, reconciliation, tax) generate asynchronously with status tracking (FR-142).

**Constraints**: Entitlement is granted only after trusted provider webhook/server-to-server verification — never from a client-rendered success screen alone (FR-149, SC-002, Constitution Article I); every checkout financial value (amount, discount, tax, entitlement, commission, refund) is always recalculated server-side from trusted configuration, never trusted from the client (FR-069); a duplicate idempotency-key checkout produces exactly one order and one charge (FR-061, SC-003); a duplicate webhook event ID produces no additional entitlement grant or ledger entry (FR-066, SC-007); a refund can never exceed the order's refundable balance (FR-086, SC-005); an issued invoice is never directly overwritten — only corrected via credit note and/or revised invoice (FR-081, SC-004); price/tax/coupon/commission are snapshotted at transaction time and never retroactively altered by later config changes (FR-133, Constitution Article IV); dual-approval-listed high-risk finance actions block same-user self-approval (FR-152, SC-009); referral rewards and affiliate commissions with cash-equivalent/wallet payout are held until their refund/dispute window passes and fraud checks clear (FR-102, FR-116, SC-010); a locked financial period requires a controlled reopening process for any change (FR-141).

**Scale/Scope**: ~28 data entities, 152 functional requirements (FR-001–FR-152), 9 user stories, a finance-approved chart of ledger accounts spanning 16+ account types, and 3 NEEDS CLARIFICATION items in spec.md's Assumptions (payment provider selection, exact numeric defaults for grace-period/dunning/dual-approval thresholds, app-store in-app-purchase billing-path conflicts).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | **Constitution-cited primary source** ("Vol 09: Server-Authoritative Payments principle") — entitlement only follows verified webhook/server confirmation, never a client success screen | **PASS — primary implementer** | FR-149, FR-069, SC-002 |
| II. AI Is Assistive, Never Autonomous | N/A — this feature has no AI-generated surfaces; fraud-signal evaluation (FR-146) is deterministic rule-based, not AI-driven per the source text | **PASS (N/A)** | FR-146 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | Full pre-payment fee disclosure, no hidden fees, no fake countdowns, no hidden cancellation path, no auto-activation without consent | **PASS (aligns; not the constitution's named source for this article)** | FR-148, FR-151 |
| IV. Historical Immutability | **Constitution-cited primary source** ("Vol 09: order snapshots price/tax/coupon/commission at purchase time") — every transaction snapshots price/tax/coupon/commission; later config changes never retroactively alter historical records | **PASS — primary implementer** | FR-133, FR-026, FR-076 |
| V. Ledger-Based Internal Economies | **Constitution-cited primary source** ("Vol 09: financial ledger, double-entry-ready design") — every financial balance is an append-only ledger entity, never a mutable balance field | **PASS — primary implementer** | FR-130–FR-132 |
| VI. Consent Is First-Class | Auto-renewal requires explicit consent and a valid mandate; recurring-price changes require notice/consent per policy before the new amount is charged | **PASS** | FR-024, FR-026, FR-151 |
| VII. Layered, Explicit RBAC With Approval Chains | **Constitution-cited primary source** ("Vol 09: dual-approval for high-risk finance actions") — reuses `001`'s RBAC for role checks; dual approval blocks same-user self-approval on the configured high-risk action list | **PASS — primary implementer (extends 001)** | FR-152, SC-009 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A for this feature's own surfaces; where it integrates `006`'s Reward Points toward payment (FR-093), it explicitly preserves `006`'s hard rule that XP is never redeemable for payment | **PASS (N/A / respects 006's boundary)** | FR-093 |
| IX. Action Before Consumption | N/A — this is a commerce/billing feature, not a learning or growth-mechanic module | **PASS (N/A)** | — |
| Localization & Language Requirements | Not addressed in this volume's source text (India/GST-focused financial and legal-document requirements); not a named source in the constitution's Localization citation list | **PASS (N/A for this feature)** | spec.md Assumptions |
| Security & Compliance Baseline | **Directly named** ("Vol 09: GST architecture") — GST/CGST/SGST/IGST tax logic, sequential financial-year-aware invoice numbering, encrypted tax/payment data | **PASS — directly named source** | FR-070–FR-081 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/009-membership-payments-revenue/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: payment provider(s) for India launch (UPI/mandate/EMI capability depends on this), exact numeric defaults for grace-period length/dunning retry schedule/pause limits/dual-approval monetary thresholds, and which product types force a different mobile-vs-web payment path under app-store in-app-purchase rules
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`008`'s structure — no new top-level projects; this feature's `Entitlement`/`Order`/`Subscription` entities become a shared backend contract other features query, not a module they extend.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── billing-catalog/        # Product, Product Price, Plan/Plan Version, Plan Entitlement (FR-001–FR-014)
│   │   ├── billing-trial/          # Trial (FR-015–FR-018)
│   │   ├── billing-subscription/   # Subscription/Item/Schedule/Change, Billing Account, upgrade/downgrade/proration, pause/resume, cancellation, dunning (FR-019–FR-041)
│   │   ├── billing-payment-method/ # Payment Method Token, provider adapter layer, routing, installments, payment links (FR-042–FR-052)
│   │   ├── billing-order/          # Cart/Cart Item, Order/Order Item, checkout orchestration, idempotency (FR-053–FR-061)
│   │   ├── billing-webhook/        # Payment/Payment Attempt/Provider Event/Mandate, webhook pipeline, status state machines (FR-062–FR-069)
│   │   ├── billing-tax-invoice/    # Tax Profile/Rule/Calculation, Invoice/Invoice Item, Receipt, Credit Note (FR-070–FR-081)
│   │   ├── billing-refund-wallet/  # Refund/Refund Item, Wallet/Wallet Ledger Entry, Coupon/Promotion/Redemption, Gift (FR-082–FR-101)
│   │   ├── billing-referral/       # Referral Program/Attribution/Reward (FR-102–FR-107)
│   │   ├── billing-affiliate/      # Affiliate/Link/Attribution/Commission/Payout (FR-108–FR-121)
│   │   ├── billing-enterprise/     # Organization Billing Account, Purchase Order, Quote/Custom Order, credit terms, AR (FR-122–FR-129)
│   │   ├── billing-ledger/         # Financial Ledger Entry, chart of accounts, revenue schedule/allocation/multi-party split, settlement, reconciliation, period close (FR-130–FR-142)
│   │   └── billing-risk/           # Chargeback, payment-dispute workflow, fraud-signal evaluation, dual-approval Approval Request (FR-143–FR-152)
│   └── common/                     # reused from 001: RbacGuard, audit-log interceptor
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (member)/
        ├── pricing/page.tsx
        ├── checkout/{[productId]/page.tsx, confirmation/page.tsx}
        └── account/billing/{plan,payment-methods,invoices,wallet,referrals,affiliate}/
    └── (org-admin)/
        └── billing/{seats,invoices,purchase-orders,credit-terms}/
    └── (admin)/
        └── finance/{products,plans,coupons,orders,payments,refunds,invoices,disputes,affiliate-applications,referral-programs,ledger,reconciliation,reports,settings}/

mobile/
└── lib/features/
    └── billing/                     # pricing, checkout, subscription self-service, offline cart-draft persistence
```

**Structure Decision**: 12 new backend modules under `billing-*`, each mapping to one of spec.md's FR groupings. `billing-webhook` and `billing-ledger` are the two modules every financial guarantee in this feature (and, transitively, every paid feature in the platform) depends on — built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
