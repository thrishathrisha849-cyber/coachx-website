---
description: "Task list for Feature 009 — Membership, Subscriptions, Payments & Revenue Operations"
---

# Tasks: Membership, Subscriptions, Payments & Revenue Operations

**Input**: Design documents from `/specs/009-membership-payments-revenue/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses for finance-role checks, dual-approval separation-of-duty, and the Finance Audit Log). This feature does not require 002–008 to be built first — it defines the shared entitlement/order/subscription contract those and future features (004, 007, 011, 012) consume.

**Tests**: Included throughout — this feature is the constitution's **primary cited source for four articles** (I, IV, V, VII); no-entitlement-without-verified-payment, idempotent-duplicate-checkout, and duplicate-webhook-dedup get dedicated Foundational contract tests, matching this spec's own SC-002, SC-003, and SC-007.

**Organization**: Tasks are grouped by user story (US1–US9 from spec.md), plus four supplementary cross-cutting phases whose FR groups are not owned by any single prioritized story (Trials/Subscription Self-Service/Revenue Recognition remainder FR-015–FR-018, FR-021–FR-026, FR-031–FR-036, FR-134–FR-137; Chargeback/Dispute/Fraud FR-143–FR-147; Wallet/Coupons/Promotions/Gifting remainder FR-090–FR-101).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor this feature reuses)
- [ ] T002 Resolve `research.md` open items before proceeding: payment provider(s) for India launch, exact numeric defaults for grace-period length/dunning retry schedule/pause limits/dual-approval monetary thresholds, and which product types force a different mobile-vs-web payment path under app-store in-app-purchase rules
- [ ] T003 [P] Add `backend/src/modules/{billing-catalog,billing-trial,billing-subscription,billing-payment-method,billing-order,billing-webhook,billing-tax-invoice,billing-refund-wallet,billing-referral,billing-affiliate,billing-enterprise,billing-ledger,billing-risk}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Product` entity + status model (Draft…Archived, only Approved/Active at checkout) in `backend/src/modules/billing-catalog/product.entity.ts` (FR-001, FR-002, FR-003)
- [ ] T005 [P] Define the `Product Price` entity with never-edit-published, new-version-on-change rule in `backend/src/modules/billing-catalog/product-price.entity.ts` (FR-005, FR-006, FR-007)
- [ ] T006 [P] Define `Plan`/`Plan Version` entities with admin-configurable tier structure in `backend/src/modules/billing-catalog/plan.entity.ts` (FR-008, FR-009, FR-010)
- [ ] T007 Define the `Plan Entitlement` entity and the centralized entitlement backend service — the sole source of truth; frontend uses entitlement data only for UX, never for access-control decisions — in `backend/src/modules/billing-catalog/entitlement.service.ts` (FR-011, FR-012)
- [ ] T008 [P] Define the `Trial` entity in `backend/src/modules/billing-trial/trial.entity.ts` (FR-015)
- [ ] T009 Define `Subscription`/`Subscription Item`/`Subscription Schedule`/`Subscription Change` and `Billing Account` entities in `backend/src/modules/billing-subscription/` (FR-008, FR-019)
- [ ] T010 [P] Define the `Payment Method Token` entity — tokenized reference only, never raw card data — in `backend/src/modules/billing-payment-method/payment-method-token.entity.ts` (FR-042)
- [ ] T011 [P] Define `Cart`/`Cart Item` entities in `backend/src/modules/billing-order/cart.entity.ts` (FR-058)
- [ ] T012 Define `Order`/`Order Item` entities with the unique user-facing order-number generator (e.g., `TBT-ORD-2026-000001`) in `backend/src/modules/billing-order/order.entity.ts` (FR-054, FR-055, FR-057)
- [ ] T013 Define `Payment`/`Payment Attempt`/`Payment Provider Event`/`Payment Mandate` entities in `backend/src/modules/billing-webhook/` (FR-062)
- [ ] T014 [P] Define `Invoice`/`Invoice Item` entities in `backend/src/modules/billing-tax-invoice/invoice.entity.ts` (FR-075)
- [ ] T015 [P] Define the `Receipt` entity, distinct from the tax invoice, in `backend/src/modules/billing-tax-invoice/receipt.entity.ts` (FR-078)
- [ ] T016 [P] Define the `Credit Note` entity in `backend/src/modules/billing-tax-invoice/credit-note.entity.ts` (FR-079)
- [ ] T017 [P] Define `Tax Profile`/`Tax Rule`/`Tax Calculation` entities in `backend/src/modules/billing-tax-invoice/tax-profile.entity.ts` (FR-071)
- [ ] T018 [P] Define `Refund`/`Refund Item` entities in `backend/src/modules/billing-refund-wallet/refund.entity.ts` (FR-082)
- [ ] T019 [P] Define `Wallet`/`Wallet Ledger Entry` entities in `backend/src/modules/billing-refund-wallet/wallet.entity.ts` (FR-090, FR-091)
- [ ] T020 [P] Define `Coupon`/`Promotion`/`Coupon Redemption` entities in `backend/src/modules/billing-refund-wallet/coupon.entity.ts` (FR-095)
- [ ] T021 [P] Define the `Gift` entity in `backend/src/modules/billing-refund-wallet/gift.entity.ts` (FR-101)
- [ ] T022 [P] Define `Referral Program`/`Referral Attribution`/`Referral Reward` entities in `backend/src/modules/billing-referral/referral.entity.ts` (FR-104)
- [ ] T023 [P] Define `Affiliate`/`Affiliate Link`/`Affiliate Attribution`/`Affiliate Commission`/`Affiliate Payout` entities in `backend/src/modules/billing-affiliate/affiliate.entity.ts` (FR-111)
- [ ] T024 [P] Define `Organization Billing Account`, `Purchase Order`, `Quote`/`Custom Order` entities in `backend/src/modules/billing-enterprise/` (FR-122, FR-125, FR-128, FR-129)
- [ ] T025 Define the `Financial Ledger Entry` entity (double-entry-ready) and the finance-approved chart of ledger accounts in `backend/src/modules/billing-ledger/ledger-entry.entity.ts` (FR-131, FR-132, Constitution Article V)
- [ ] T026 [P] Define `Settlement`/`Reconciliation Record` entities in `backend/src/modules/billing-ledger/settlement.entity.ts` (FR-138)
- [ ] T027 [P] Define the `Chargeback` entity in `backend/src/modules/billing-risk/chargeback.entity.ts` (FR-143)
- [ ] T028 [P] Define `Revenue Schedule` and `Adjustment` entities in `backend/src/modules/billing-ledger/` (FR-134, FR-135)
- [ ] T029 [P] Define the `Approval Request` entity for the dual-approval workflow in `backend/src/modules/billing-risk/approval-request.entity.ts` (FR-152)
- [ ] T030 Note: `Finance Audit Log` reuses `001`'s audit-log interceptor pattern directly for every administrative and financial action — no new logging engine is created (FR-152)
- [ ] T031 Implement the payment-provider abstraction interface (customer creation, order creation, payment intent, checkout, verification, subscription, mandate, refund, payment link, webhook verification, settlement data, dispute data, tokenized payment method), with provider adapters isolated in a separate module, in `backend/src/modules/billing-payment-method/provider-adapter.service.ts` (FR-049)
- [ ] T032 Implement multi-provider routing (country, currency, method, product type, amount, provider health, cost, success rate, recurring capability, risk rules) with a no-duplicate-charge-on-fallback guarantee in `backend/src/modules/billing-payment-method/provider-routing.service.ts` (FR-050)
- [ ] T033 Implement the webhook processing pipeline (receive → verify source → store raw protected payload → check duplicate event → map provider event → lock target record → validate transition → apply financial transaction → update order/subscription → grant/revoke entitlement → trigger invoice/refund → notify → mark processed) in `backend/src/modules/billing-webhook/webhook-pipeline.service.ts` (FR-067)
- [ ] T034 Implement webhook signature/timestamp verification, event-ID deduplication, retry/dead-letter handling, and alerting in `backend/src/modules/billing-webhook/webhook-verification.service.ts` (FR-066)
- [ ] T035 Implement out-of-order webhook handling using provider event time and a validated state machine (success-before-pending, refund-before-local-success-completes, cancel-after-renewal, delayed failure, duplicate settlement) in `backend/src/modules/billing-webhook/out-of-order-resolution.service.ts` (FR-068)
- [ ] T036 Implement server-side recalculation of every client-provided checkout value (amount, discount, tax, product name, entitlement, commission, refund amount, subscription status) — client values are always untrusted, in `backend/src/modules/billing-order/server-recalculation.service.ts` (FR-069)
- [ ] T037 Implement the normalized payment-status state machine (Created…Reversed) with provider-specific status mapping in `backend/src/modules/billing-webhook/payment-status.service.ts` (FR-062)
- [ ] T038 Implement the server-controlled order status state machine (Draft…Archived) in `backend/src/modules/billing-order/order-status.service.ts` (FR-056)
- [ ] T039 Implement the server-controlled subscription status state machine (Incomplete…Archived), never client-set, in `backend/src/modules/billing-subscription/subscription-status.service.ts` (FR-020)
- [ ] T040 Implement mandatory checkout idempotency-key enforcement — a repeated request reuses the same order, avoids duplicate provider order creation, and returns the existing result, in `backend/src/modules/billing-order/idempotency.service.ts` (FR-061)
- [ ] T041 Implement a centralized rounding-rule library shared between frontend and backend for currency precision, tax-line rounding, invoice-total rounding, discount/refund allocation, commission calculation, and settlement comparison in `backend/src/modules/billing-ledger/rounding.service.ts` (FR-074)
- [ ] T042 Implement the pre-payment full-fee-disclosure checkout summary (product/plan, billing period, base amount, discount, coupon, taxes, fees, credits, points, final amount, renewal amount/date, cancellation conditions, refund eligibility) — no hidden fees, in `backend/src/modules/billing-order/checkout-summary.service.ts` (FR-148)
- [ ] T043 Note: role/permission enforcement for finance actions reuses `001`'s layered RBAC directly (Constitution Article VII)
- [ ] T044 Contract test: entitlement is never granted from a client-rendered success screen alone — only after trusted webhook/server verification with order/amount/currency match and idempotency validation, in `backend/tests/contract/billing-no-entitlement-without-verified-payment.contract.test.ts` (FR-149, SC-002)
- [ ] T045 Contract test: an identical checkout request submitted twice with the same idempotency key produces exactly one order and one charge, in `backend/tests/contract/billing-idempotent-checkout.contract.test.ts` (FR-061, SC-003)
- [ ] T046 Contract test: a duplicate webhook event ID produces no additional entitlement grant, extension, or ledger entry beyond the first successful processing, in `backend/tests/contract/billing-duplicate-webhook-dedup.contract.test.ts` (FR-066, SC-007)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Purchase a Membership via an India Payment Method (P1) 🎯 MVP

**Independent Test**: Select a plan and price on the pricing page, complete checkout with a UPI or card payment in a sandboxed provider environment, and confirm (a) the checkout summary matched what was later charged, (b) entitlement appears only after webhook/server verification, and (c) an order, payment record, and invoice are all created and mutually consistent.

- [ ] T047 [US1] Plan comparison page (plan name, target user, monthly-equivalent amount, actual billing amount, frequency, benefits, feature comparison, limits, trial info, cancellation terms, taxes note, CTA; truthful server-evaluated "recommended" label) in `web/src/app/pricing/page.tsx` (FR-013, acceptance scenario 1)
- [ ] T048 [US1] Billing-frequency display (monthly/quarterly/half-yearly/annual/multi-year/custom, exact amount today, interval, next charge date, accurate date-aware annual-savings comparison) in `backend/src/modules/billing-catalog/billing-frequency.service.ts` (FR-014)
- [ ] T049 [US1] UPI payment flow (intent, collect, QR, recurring mandate where available) with status polling plus webhook, expiry, deep-link fallback, duplicate prevention, cancellation handling, pending-state handling, server-side verification in `backend/src/modules/billing-payment-method/upi.service.ts` (FR-044, acceptance scenario 2)
- [ ] T050 [US1] Card payment flow via provider-hosted secure collection/tokenization, strong customer authentication, saved-card consent, masked display, expiry update, failed-auth recovery — no raw card data logged, in `backend/src/modules/billing-payment-method/card.service.ts` (FR-045)
- [ ] T051 [US1] Net banking / wallet payment flow via provider redirect with return URL, webhook verification, pending-status handling, abandonment handling, retry in `backend/src/modules/billing-payment-method/netbanking-wallet.service.ts` (FR-046)
- [ ] T052 [US1] Payment-method management (add, set default, remove unused, update billing details, complete authentication, masked-detail view only) in `web/src/app/(member)/account/billing/payment-methods/page.tsx` (FR-042)
- [ ] T053 [US1] Checkout page (order summary, customer info, billing address, optional GST details, coupon entry, credits/points entry, payment-method selection, recurring-payment notice, terms/refund policy, final amount, pay CTA, security notice) in `web/src/app/checkout/[productId]/page.tsx` (FR-060)
- [ ] T054 [US1] Cart validation (product active status, sales period, quantity, inventory/capacity, eligibility, duplicate ownership, membership requirement, region, current price, coupon validity, bundle conflicts, currency, seat limits) with clear invalid-combination reasons in `backend/src/modules/billing-order/cart-validation.service.ts` (FR-059)
- [ ] T055 [US1] Full checkout order-flow orchestration (product selection → cart validation → price snapshot → discount → tax → total → internal order → provider order → payment collection → callback → webhook verification → payment record → confirmation → entitlement/fulfilment → invoice → receipt → notification → analytics), wired to T040's idempotency enforcement, in `backend/src/modules/billing-order/checkout-orchestrator.service.ts` (FR-053)
- [ ] T056 [US1] Pending-payment screen for non-instant-confirmation methods ("payment being verified," order reference, status refresh, safe exit, retry-only-after-expiry-or-failure, support option) — no false success, in `web/src/app/checkout/pending/page.tsx` (FR-063)
- [ ] T057 [US1] Payment success screen shown only after server-side verification (order number, amount, product, access CTA, invoice, receipt, next-renewal date, email-confirmation status) in `web/src/app/checkout/confirmation/page.tsx` (FR-064, acceptance scenario 4)
- [ ] T058 [US1] Payment failure screen (clear "no entitlement granted" message, safe retry, alternative-method suggestion, order reference, support access, no sensitive decline detail) in `web/src/app/checkout/failed/page.tsx` (FR-065)
- [ ] T059 [P] [US1] Pricing/checkout mobile UI in `mobile/lib/features/billing/checkout/`
- [ ] T060 [US1] Integration test: pre-payment fee disclosure accuracy, webhook-gated entitlement (not client-redirect-gated), idempotent duplicate-click handling, full confirmation-screen field set — all 4 acceptance scenarios in `backend/tests/integration/us1-india-checkout.integration.test.ts`

**Checkpoint**: The core monetization loop of the entire platform is independently functional.

---

## Phase 4: User Story 2 — Upgrade/Downgrade a Subscription with Correct Proration (P1)

**Independent Test**: Take an active monthly subscription mid-period, trigger an upgrade to a higher-tier plan, verify the proration preview matches the final provider-confirmed charge within defined rounding rules, and confirm the new entitlement and next renewal amount are correct.

- [ ] T061 [US2] Upgrade flow (policy: immediate-prorated, immediate-no-proration, next-cycle, credit-unused) showing current plan/new plan/effective date/credit/charge-today/next-billing before confirming in `backend/src/modules/billing-subscription/upgrade.service.ts` (FR-027, acceptance scenario 1)
- [ ] T062 [US2] Proration engine (current period, current paid amount, remaining period, new price, tax, discounts, currency precision, provider calculation, platform policy) with preview-vs-final divergence bounded to explicit rounding rules only, wired to T041's rounding library, in `backend/src/modules/billing-subscription/proration.service.ts` (FR-028, acceptance scenario 4)
- [ ] T063 [US2] Downgrade flow — paid-feature downgrades default to end-of-period, explaining features lost/limits reduced/stored-data impact/new renewal price in `backend/src/modules/billing-subscription/downgrade.service.ts` (FR-029, acceptance scenario 2)
- [ ] T064 [US2] Downgrade data-preservation guarantee — no immediate deletion on limit reduction; read-only state and/or grace period and/or export option with communicated retention timeline (AI history, team members, storage, templates, courses) in `backend/src/modules/billing-subscription/downgrade-data-preservation.service.ts` (FR-030, acceptance scenario 3)
- [ ] T065 [US2] Seat-count-reduction-below-occupied-seats handling in `backend/src/modules/billing-enterprise/seat-reduction.service.ts` (edge case)
- [ ] T066 [P] [US2] Upgrade/downgrade preview UI in `web/src/app/(member)/account/billing/plan/change/page.tsx`
- [ ] T067 [US2] Integration test: prorated-upgrade-charge-matches-preview, end-of-period downgrade with full disclosure, no-immediate-data-deletion, preview-vs-final rounding-bounded divergence — all 4 acceptance scenarios in `backend/tests/integration/us2-upgrade-downgrade-proration.integration.test.ts`

**Checkpoint**: The top revenue-expansion and churn-prevention lever is independently functional.

---

## Phase 5: User Story 3 — Recover a Failed Renewal via Dunning (P1)

**Independent Test**: Force a renewal charge to fail in a sandbox, verify the subscription transitions to "past due," a retry occurs on the configured schedule, the user receives a grace-period warning, and — if all retries fail — the subscription is downgraded/suspended/cancelled per policy.

- [ ] T068 [US3] Failed-payment-reason categorization (insufficient funds, card expired, bank declined, mandate inactive, auth required, limit exceeded, invalid method, network failure, provider failure, risk block, unknown) plus a secure actionable user message with no raw provider detail exposed, in `backend/src/modules/billing-subscription/failure-categorization.service.ts` (FR-040, acceptance scenario 1)
- [ ] T069 [US3] Past-due state transition and dunning workflow orchestrator (failure categorized → past due → notify → payment-update CTA → retries scheduled → optional alt-method request → grace-period management → final warning → suspend/downgrade → cancel/uncollectible) in `backend/src/modules/billing-subscription/dunning.service.ts` (FR-038)
- [ ] T070 [US3] Configurable payment-retry schedule (e.g., day 1/3/5/7), optional provider smart-retry, no excessive repeated attempts, duplicate-webhook-safe entitlement extension in `backend/src/modules/billing-subscription/retry-schedule.service.ts` (FR-039, acceptance scenario 2)
- [ ] T071 [US3] Grace-period management (feature access level during grace, notices, retry, clearly shown end date, recovery restores active state, post-grace-failure applies configured downgrade/suspension) in `backend/src/modules/billing-subscription/grace-period.service.ts` (FR-037, acceptance scenario 3)
- [ ] T072 [US3] Recovery-success handling — a successful retry after a payment-method update returns the subscription to active with a recovery notification, in `backend/src/modules/billing-subscription/dunning.service.ts` (FR-038, acceptance scenario 4)
- [ ] T073 [US3] Plan migration workflows (no-migration, automatic-at-renewal, immediate, opt-in, forced-with-notice) with new plan/price/credits/effective-date/entitlements/notice/cancellation-option/provider-update/rollback in `backend/src/modules/billing-subscription/plan-migration.service.ts` (FR-041)
- [ ] T074 [P] [US3] Dunning notification templates and payment-method-update CTA UI in `web/src/components/billing/dunning-banner.tsx`
- [ ] T075 [US3] Integration test: failure categorization plus past-due transition, scheduled retries without duplicate entitlement extension, grace-period-expiry consequence, successful-retry recovery — all 4 acceptance scenarios in `backend/tests/integration/us3-dunning-recovery.integration.test.ts`

**Checkpoint**: Involuntary-churn recovery, ranked P0 in the source MVP tiers, is independently functional.

---

## Phase 6: User Story 4 — GST-Compliant Invoice, Receipt, and Credit Note Generation (P1)

**Independent Test**: Complete a paid order with a customer-supplied GSTIN and billing state, verify the generated invoice number is unique/sequential/financial-year-aware, contains all required fields, is immutable once issued, and that a subsequent refund produces a correctly linked credit note.

- [ ] T076 [US4] Tax architecture configuration (GST/CGST/SGST/IGST, inclusive/exclusive pricing, exemptions, reverse-charge, export/international treatment, product tax categories, place of supply) requiring finance/tax sign-off, in `backend/src/modules/billing-tax-invoice/tax-architecture.service.ts` (FR-070)
- [ ] T077 [US4] Tax Profile capture plus GSTIN format/state-code validation, optional external verification, and verification-status tracking, in `backend/src/modules/billing-tax-invoice/tax-profile.service.ts` (FR-071, FR-072, edge case: invalid GSTIN)
- [ ] T078 [US4] Tax calculation engine (seller registration state, place of supply, product tax category, rate effective date, inclusion setting, exemption status, currency, transaction date) with a stored tax snapshot, in `backend/src/modules/billing-tax-invoice/tax-calculation.service.ts` (FR-073)
- [ ] T079 [US4] Invoice generation (number, date, seller/customer details, GSTIN, place of supply, order reference, line items, HSN/SAC, taxable value, tax rates/amounts, total, amount paid, currency, payment reference, terms, signature/declaration) in `backend/src/modules/billing-tax-invoice/invoice-generation.service.ts` (FR-075, acceptance scenario 1)
- [ ] T080 [US4] Sequential, financial-year-aware, non-reusable invoice numbering per legal entity (e.g., `TBT/INV/2026-27/000001`), subject to finance approval of the scheme, in `backend/src/modules/billing-tax-invoice/invoice-numbering.service.ts` (FR-076, acceptance scenario 3)
- [ ] T081 [US4] Invoice immutability plus correction-only-via-credit-note-and-revised-invoice workflow with audit trail and finance approval, in `backend/src/modules/billing-tax-invoice/invoice-correction.service.ts` (FR-081, FR-072, acceptance scenario 2)
- [ ] T082 [US4] Proforma invoice support for enterprise/bank-transfer orders — never treated as a final tax invoice, in `backend/src/modules/billing-tax-invoice/proforma-invoice.service.ts` (FR-077)
- [ ] T083 [US4] Payment receipt generation, distinguishable from the tax invoice, in `backend/src/modules/billing-tax-invoice/receipt-generation.service.ts` (FR-078, acceptance scenario 4)
- [ ] T084 [US4] Credit note generation (number, original invoice reference, reason, line adjustments, tax reversal, amount, date) for refunds/reductions/cancellations/corrections in `backend/src/modules/billing-tax-invoice/credit-note-generation.service.ts` (FR-079, acceptance scenario 2)
- [ ] T085 [US4] Secure, access-controlled invoice/receipt access (billing history, email, PDF download, org portal, admin portal) in `web/src/app/(member)/account/billing/invoices/page.tsx` (FR-080, acceptance scenario 4)
- [ ] T086 [P] [US4] Billing-history invoice/receipt UI polish (download, view distinctions)
- [ ] T087 [US4] Integration test: full-field invoice generation, credit-note-not-overwrite correction flow, sequential non-reusable numbering, distinguishable receipt-vs-invoice access — all 4 acceptance scenarios in `backend/tests/integration/us4-gst-invoicing.integration.test.ts`

**Checkpoint**: The hard GST compliance requirement that blocks every enterprise sale is independently functional.

---

## Phase 7: User Story 5 — Referral Reward and Affiliate Commission Attribution & Payout (P2)

**Independent Test**: Generate a referral link, have a new test user register and complete a qualifying purchase through it, confirm the reward stays "pending" through the refund window; separately, have an approved affiliate's tracked link drive a sale and confirm the commission calculation, hold period, and payout.

- [ ] T088 [US5] Referral flow orchestration (link delivered → opened → attribution stored → registered → eligibility checked → qualified purchase → refund window → reward approved → benefits issued → analytics) in `backend/src/modules/billing-referral/referral-flow.service.ts` (FR-103, acceptance scenario 1)
- [ ] T089 [US5] Referral reward eligibility (registration, email verification, first paid purchase, subscription-active-after-refund-window, course completion, org signup) — financial rewards depend on a verified paid action, in `backend/src/modules/billing-referral/reward-eligibility.service.ts` (FR-102)
- [ ] T090 [US5] Referral attribution rules (window, first/last-click, existing-user exclusion, self-referral prevention, device/account signals, cookie plus server-side tracking, code precedence, affiliate-conflict resolution, consent/privacy) in `backend/src/modules/billing-referral/attribution.service.ts` (FR-105, acceptance scenario 4)
- [ ] T091 [US5] Referral reward-type restriction (wallet credit, reward points, membership days, course access, coupon, mentor credit, event ticket — cash only for the approved affiliate-type program) in `backend/src/modules/billing-referral/reward-issuance.service.ts` (FR-106)
- [ ] T092 [US5] Referral fraud-signal evaluation (multi-account, shared payment method/bank/device, disposable email, refund-after-reward, circular referrals, automated registration, suspicious IP, org-internal abuse) — no single privacy-sensitive signal alone decides, in `backend/src/modules/billing-referral/fraud-evaluation.service.ts` (FR-107)
- [ ] T093 [US5] Affiliate application plus approval workflow (Draft…Archived) with legal/tax/payout/identity/content-category capture in `backend/src/modules/billing-affiliate/application.service.ts` (FR-109, FR-110)
- [ ] T094 [US5] Affiliate Profile plus deep-link generation (signed/validated attribution parameters, open-redirect prevention) in `backend/src/modules/billing-affiliate/deep-link.service.ts` (FR-111, FR-112)
- [ ] T095 [US5] Affiliate attribution rules (cookie window, server-side, first/last-click, coupon attribution, cross-device limits, direct-user override, existing-customer rules, recurring-commission eligibility, affiliate/referral conflict) with an attribution-rule-version snapshot, in `backend/src/modules/billing-affiliate/attribution.service.ts` (FR-113, acceptance scenario 4)
- [ ] T096 [US5] Affiliate commission calculation (configured base: gross/net-of-tax/net-of-discount/net-of-refunds/net-of-fee/collected-revenue) snapshotted at attribution time, in `backend/src/modules/billing-affiliate/commission-calculation.service.ts` (FR-114, FR-115, acceptance scenario 2)
- [ ] T097 [US5] Affiliate commission lifecycle (Estimated…Reversed) — attributed order paid → calculated → pending → refund/dispute window → fraud checks → approved → payable → scheduled → paid; reversal on a later chargeback, in `backend/src/modules/billing-affiliate/commission-lifecycle.service.ts` (FR-116, acceptance scenario 3)
- [ ] T098 [P] [US5] Affiliate dashboard (clicks, signups, customers, orders, conversion, gross sales, refunds, commission states, payout date, top products, links, coupons, creative assets, reports, support) in `web/src/app/(affiliate)/dashboard/page.tsx` (FR-117)
- [ ] T099 [US5] Affiliate creative library plus misleading-claim-modification prevention in `backend/src/modules/billing-affiliate/creative-library.service.ts` (FR-118)
- [ ] T100 [US5] Affiliate payout (minimum threshold, approval, KYC, tax info, bank details, schedule, statement, failure handling, reconciliation) kept in a separate ledger category from mentor payouts, in `backend/src/modules/billing-affiliate/payout.service.ts` (FR-119)
- [ ] T101 [US5] Affiliate policy-violation detection (self-referrals, trademark bidding, misleading claims, fake scarcity, spam, cookie stuffing, forced redirects, unapproved incentivized traffic, false reviews, impersonation, unauthorized coupon sites, fraud) plus suspension workflow in `backend/src/modules/billing-affiliate/policy-enforcement.service.ts` (FR-120, FR-121)
- [ ] T102 [US5] Same-conversion attribution-conflict precedence rule (referral vs. affiliate) in `backend/src/modules/billing-affiliate/attribution.service.ts` (FR-105/FR-113, edge case)
- [ ] T103 [P] [US5] Referral share UI in `web/src/app/(member)/account/billing/referrals/page.tsx`
- [ ] T104 [US5] Integration test: referral status progression gated on refund-window/fraud-clear, affiliate commission base calculation and snapshot, refund-triggered commission reversal, attribution-conflict precedence — all 4 acceptance scenarios in `backend/tests/integration/us5-referral-affiliate.integration.test.ts`

**Checkpoint**: The explicit P0/P1 growth channels are independently functional.

---

## Phase 8: User Story 6 — Full or Partial Refund with Entitlement Adjustment (P1)

**Independent Test**: Request a refund on a completed order, verify the eligibility check and computed refundable amount, approve it, confirm the provider refund and webhook verification occur before any entitlement is revoked, and confirm a credit note is generated and linked to the original invoice.

- [ ] T105 [US6] Refund eligibility evaluation (product policy, purchase date, consumption, download status, course progress, event date, mentor session state, subscription period, previous refunds, dispute status, fraud signals, legal requirements) → eligible/partially-eligible/ineligible/manual-review, in `backend/src/modules/billing-refund-wallet/refund-eligibility.service.ts` (FR-083, acceptance scenario 1)
- [ ] T106 [US6] Refund request flow (select order/item → reason/resolution → evidence → eligibility preview → submit → auto-approve-or-manual-review → provider refund → webhook verification → entitlement adjustment → credit note → notification → audit) in `backend/src/modules/billing-refund-wallet/refund-flow.service.ts` (FR-084)
- [ ] T107 [US6] Refund status state machine (Requested…Reversed) in `backend/src/modules/billing-refund-wallet/refund-status.service.ts` (FR-085)
- [ ] T108 [US6] Refund-amount calculation bounded by refundable balance (item amount, allocated discount, tax, non-refundable fees, usage, proration, previous refunds, credits, points, rounding) — never exceeds refundable balance, wired to T041's rounding library, in `backend/src/modules/billing-refund-wallet/refund-calculation.service.ts` (FR-086, acceptance scenario 2)
- [ ] T109 [US6] Refund destination handling (original method, wallet credit, bank transfer exceptional, session credit, membership credit) restricted to policy-permitted options in `backend/src/modules/billing-refund-wallet/refund-destination.service.ts` (FR-087)
- [ ] T110 [US6] Refund-timeline display distinguishing initiated / processed-by-provider / credited-status-unknown / completed, in `web/src/components/billing/refund-status-tracker.tsx` (FR-088, acceptance scenario 4)
- [ ] T111 [US6] Product-specific entitlement-revocation-on-refund rules (membership ends, course access revoked, certificate reviewed, downloads disabled, mentor credit removed, AI credits reversed, reward points reversed, badge adjusted) — applied only after provider confirmation, historical records retained, in `backend/src/modules/billing-refund-wallet/entitlement-revocation.service.ts` (FR-089, acceptance scenario 3)
- [ ] T112 [US6] Cumulative-refund tracking against refundable balance across multiple partial refunds in `backend/src/modules/billing-refund-wallet/refund-calculation.service.ts` (edge case)
- [ ] T113 [P] [US6] Refund request and status UI in `web/src/app/(member)/orders/[orderId]/refund/page.tsx`
- [ ] T114 [US6] Integration test: eligibility-preview-before-submit, refund-never-exceeds-refundable-balance, entitlement-adjustment-only-after-webhook-confirmation, refund-status distinction — all 4 acceptance scenarios in `backend/tests/integration/us6-refund-entitlement.integration.test.ts`

**Checkpoint**: Financial integrity protecting both customer trust and the platform's books is independently functional.

---

## Phase 9: User Story 7 — Offline/Enterprise Payment with Dual Approval (P2)

**Independent Test**: Have one authorized user record an offline cash/cheque payment against an enterprise order, confirm entitlement is NOT activated until a second, distinct approver confirms it, and that the same user cannot both record and approve the same transaction.

- [ ] T115 [US7] Bank-transfer flow for enterprise/high-value orders (unique payment reference, bank instructions, expiry, optional proof upload, finance verification, partial-payment handling, overpayment handling, reconciliation, invoice-status tracking, entitlement-after-approval-only) in `backend/src/modules/billing-payment-method/bank-transfer.service.ts` (FR-047, acceptance scenario 3)
- [ ] T116 [US7] Offline-payment recording (cash/cheque/POS/manual bank receipt) restricted to authorized roles, capturing amount/currency/date/method/reference/collector/evidence/approver/notes, in `backend/src/modules/billing-payment-method/offline-payment.service.ts` (FR-048, acceptance scenario 1)
- [ ] T117 [US7] Dual-approval separation-of-duty enforcement for offline/high-risk payments — the same user cannot record and approve, in `backend/src/modules/billing-risk/dual-approval.service.ts` (FR-048, FR-152, acceptance scenario 2)
- [ ] T118 [US7] Organization Billing account (legal entity, billing contacts, tax profile, billing owner, payment method, contract, seats, subscription, POs, invoices, credit limit, payment terms) in `backend/src/modules/billing-enterprise/org-billing-account.service.ts` (FR-122)
- [ ] T119 [US7] Per-seat billing models (fixed count, active-seat, minimum commitment, tiered volume, annual true-up, monthly adjustment) with proration and an audit record on seat-count change in `backend/src/modules/billing-enterprise/seat-billing.service.ts` (FR-123)
- [ ] T120 [US7] Billing-owner seat management (view, invite, remove, transfer, buy additional, schedule reduction, view usage) — seat removal never deletes the personal account, in `web/src/app/(org-admin)/billing/seats/page.tsx` (FR-124, edge case)
- [ ] T121 [US7] Purchase Order support (PO number, document, customer approval, invoice matching, payment terms, partial payment, outstanding balance, collection status) in `backend/src/modules/billing-enterprise/purchase-order.service.ts` (FR-125)
- [ ] T122 [US7] Approved-organization credit terms (Net 7/15/30/custom) with credit approval, limit, aging, collection reminders, account hold, finance override, audit, in `backend/src/modules/billing-enterprise/credit-terms.service.ts` (FR-126)
- [ ] T123 [US7] Accounts Receivable tracking (issued/due/partially-paid/paid/overdue/disputed/written-off) with aging buckets (current, 1–30, 31–60, 61–90, 90+) in `backend/src/modules/billing-enterprise/accounts-receivable.service.ts` (FR-127)
- [ ] T124 [US7] Custom Order support for enterprise/negotiated sales with an approval-above-threshold gate for custom discounts in `backend/src/modules/billing-enterprise/custom-order.service.ts` (FR-128)
- [ ] T125 [US7] Quotation support (quote number, customer, validity, products, quantity, price, discount, tax estimate, payment terms, delivery terms, contract conditions, status Draft…Converted) in `backend/src/modules/billing-enterprise/quotation.service.ts` (FR-129)
- [ ] T126 [US7] Approval Request workflow wired to T029's entity — high-risk finance action list (large refund, manual payment, payout, commission adjustment, invoice void, credit-note issue, write-off, plan-price migration, tax-rate change, settlement override) in `backend/src/modules/billing-risk/approval-request.service.ts` (FR-152)
- [ ] T127 [P] [US7] Enterprise billing admin UI and offline-payment recording UI in `web/src/app/(admin)/finance/offline-payments/page.tsx`
- [ ] T128 [US7] Integration test: entitlement withheld until dual approval completes, self-approval blocked, partial/overpayment handled explicitly, post-approval invoice generation and reconciliation — all 4 acceptance scenarios in `backend/tests/integration/us7-offline-enterprise-payment.integration.test.ts`

**Checkpoint**: The enterprise/organization revenue channel with fraud/error-mitigating controls is independently functional.

---

## Phase 10: User Story 8 — Webhook-Driven, Idempotent Entitlement Grant Across Out-of-Order Events (P1)

**Independent Test**: Replay the same webhook event twice, send a refund event before the corresponding success event finishes local processing, and send a subscription-cancelled event after a renewal event — confirming the final state and entitlement match a correctly time-ordered sequence in each case.

- [ ] T129 [US8] Duplicate-event-ID recognition returning no financial reapplication or re-grant, validated against T046's contract test, in `backend/src/modules/billing-webhook/webhook-verification.service.ts` (FR-066, acceptance scenario 1)
- [ ] T130 [US8] Out-of-order success/refund resolution using provider event time plus a validated state machine, reaching the same final state regardless of arrival order, in `backend/src/modules/billing-webhook/out-of-order-resolution.service.ts` (FR-068, acceptance scenario 2)
- [ ] T131 [US8] Webhook signature plus timestamp-tolerance verification before processing, with raw-payload storage for audit and reject-or-queue on verification failure, in `backend/src/modules/billing-webhook/webhook-verification.service.ts` (FR-066, acceptance scenario 3)
- [ ] T132 [US8] Webhook retry/dead-letter handling ensuring eventual processing or explicit alerting on transient failure, never a silent drop, in `backend/src/modules/billing-webhook/dead-letter.service.ts` (FR-066, acceptance scenario 4)
- [ ] T133 [US8] Provider-settlement/status-polling reconciliation for a lost/never-delivered webhook after a successful provider-side payment in `backend/src/modules/billing-webhook/settlement-fallback.service.ts` (edge case)
- [ ] T134 [US8] Subscription-cancelled-after-renewal-event resolution in `backend/src/modules/billing-webhook/out-of-order-resolution.service.ts` (edge case)
- [ ] T135 [US8] Integration test: duplicate-event replay produces no reapplication, out-of-order success/refund reaches the correct final state, signature/timestamp verification gate, retry/dead-letter never-silently-drops — all 4 acceptance scenarios in `backend/tests/integration/us8-webhook-idempotency.integration.test.ts`

**Checkpoint**: The structural backbone every other financial guarantee depends on is independently functional.

---

## Phase 11: User Story 9 — Financial Period Close and Provider Settlement Reconciliation (P2)

**Independent Test**: Import a sample provider settlement file, confirm auto-matching against known internal payment records, deliberately introduce one amount mismatch and one missing-at-provider record, confirm both are flagged correctly, and confirm locking the period prevents silent edits afterward.

- [ ] T136 [US9] Settlement-report import plus storage (settlement ID, period, gross collections, refunds, chargebacks, fees, tax on fees, adjustments, net settlement, bank reference, date, status) in `backend/src/modules/billing-ledger/settlement-import.service.ts` (FR-138)
- [ ] T137 [US9] Auto-matching by transaction reference against internal payments/refunds/fees in `backend/src/modules/billing-ledger/reconciliation-matching.service.ts` (FR-140, acceptance scenario 1)
- [ ] T138 [US9] Mismatch classification (missing internally, missing at provider, amount mismatch, currency mismatch, duplicate, refund mismatch, fee mismatch, bank mismatch) in `backend/src/modules/billing-ledger/mismatch-classification.service.ts` (FR-139, acceptance scenario 1)
- [ ] T139 [US9] Finance-review adjustment creation (ledger entry, reason, creator, approver captured for audit), wired to T028's `Adjustment` entity, in `backend/src/modules/billing-ledger/reconciliation-adjustment.service.ts` (FR-140, acceptance scenario 2)
- [ ] T140 [US9] Period-close workflow (reconciliation complete → mismatches reviewed → refunds captured → payouts recorded → tax report generated → revenue schedule generated → adjustments approved → period locked → reports exported) in `backend/src/modules/billing-ledger/period-close.service.ts` (FR-141, acceptance scenario 3)
- [ ] T141 [US9] Controlled period-reopening process for post-lock changes in `backend/src/modules/billing-ledger/period-reopen.service.ts` (FR-141)
- [ ] T142 [US9] Finance/growth report generation (sales, order, payment, refund, tax/GST summary, invoice register, credit-note register, subscription, MRR, churn, deferred revenue, revenue recognition, settlement, reconciliation, chargeback, wallet liability, coupon usage, referral, affiliate commission/payout, mentor/instructor payable, AR/aging) with CSV/XLSX/PDF/accounting-system export, generated asynchronously with status, in `backend/src/modules/billing-ledger/report-generation.service.ts` (FR-142, acceptance scenario 4)
- [ ] T143 [P] [US9] Reconciliation and period-close admin UI in `web/src/app/(admin)/finance/reconciliation/page.tsx`
- [ ] T144 [US9] Integration test: settlement import plus auto-match plus mismatch flagging with correct category, finance-approved adjustment audit trail, period lock blocking silent edits, locked-period export exactness — all 4 acceptance scenarios in `backend/tests/integration/us9-reconciliation-period-close.integration.test.ts`

**Checkpoint**: The platform's revenue numbers become trustworthy to finance/tax authorities.

---

## Phase 11b: Trials, Subscription Self-Service & Revenue Recognition remainder (supports FR-015–FR-018, FR-021–FR-026, FR-031–FR-036, FR-134–FR-137; cross-cutting, no single owning story)

- [ ] T145 Trial configuration and lifecycle (eligible plans, duration, payment-method requirement, features/limits, start/end, conversion date, reminder schedule, cancellation behavior, repeat-trial policy) in `backend/src/modules/billing-trial/trial-config.service.ts` (FR-015)
- [ ] T146 Trial-to-paid conversion-terms disclosure before trial start in `web/src/components/billing/trial-terms.tsx` (FR-016)
- [ ] T147 Trial-eligibility signal evaluation (identity, prior trial history, prior paid subscription, org membership, device-abuse signals, payment fingerprint where legally permitted, campaign, region, account status) — privacy-safe, no single overreaching signal alone disqualifying, in `backend/src/modules/billing-trial/trial-eligibility.service.ts` (FR-017, edge case: prior-account trial abuse)
- [ ] T148 [P] Trial lifecycle notifications (started, halfway, 3-days-before, 1-day-before, conversion successful, conversion failed, expired) in `backend/src/modules/billing-trial/trial-notifications.service.ts` (FR-018)
- [ ] T149 Full subscription-creation flow (plan selection → price/period → eligibility → conflict check → billing profile → coupon/referral → tax → checkout summary → consent → mandate → provider response → webhook → record create/update → entitlement → invoice → receipt → analytics → notification), wired to Foundational T039's status state machine, in `backend/src/modules/billing-subscription/subscription-creation.service.ts` (FR-021)
- [ ] T150 Conflicting-subscription-state prevention (duplicate active same-plan, overlapping incompatible plans, duplicate provider subscription, undisclosed org-plus-individual duplicate access, multi-trial abuse) in `backend/src/modules/billing-subscription/conflict-prevention.service.ts` (FR-022)
- [ ] T151 Valid combined-subscription support (base+AI add-on, base+event ticket, base+course, org plan+individual add-on) in `backend/src/modules/billing-subscription/combined-subscription.service.ts` (FR-023)
- [ ] T152 Auto-renewal enforcement (valid mandate required, renewal amount/date shown, law/policy-compliant reminders, provider billing-event monitoring, extend-only-on-success, dunning-trigger-on-failure, duplicate-webhook-safe, never-renew-cancelled) in `backend/src/modules/billing-subscription/auto-renewal.service.ts` (FR-024)
- [ ] T153 Manual-renewal flow (expiry reminder, renew CTA, optional grace period, price-change notice, checkout, entitlement extension, invoice) — no silent auto-debit creation, in `backend/src/modules/billing-subscription/manual-renewal.service.ts` (FR-025)
- [ ] T154 Recurring price-change grandfathering (policy, effective date, required notice, consent where required, new-amount display, cancellation option, audit record, provider update) — historical invoices unchanged, in `backend/src/modules/billing-subscription/price-change.service.ts` (FR-026, edge case)
- [ ] T155 Subscription pause (minimum active duration, maximum pause duration, pauses-per-year limit, effective date, billing behavior, entitlement behavior, auto-resume date, credit treatment) — distinct from cancellation, in `backend/src/modules/billing-subscription/pause.service.ts` (FR-031)
- [ ] T156 Subscription resume (pause-state verification, charge display, new billing date, confirmation, provider update, entitlement restoration, notification, audit) in `backend/src/modules/billing-subscription/resume.service.ts` (FR-032)
- [ ] T157 Cancellation flow (open subscription → select cancel → effective date → benefits-until date → refund implications → optional/mandatory reason → at-most-one ethical retention offer → confirm → provider update → status update → entitlement expiry → confirmation) — no forced phone call unless legally unavoidable, in `backend/src/modules/billing-subscription/cancellation.service.ts` (FR-033, FR-034)
- [ ] T158 [P] Cancellation-reason capture (too expensive, not using enough, missing features, technical issues, content not relevant, switching plan, business closed, temporary break, payment problem, other) for product-improvement analysis in `backend/src/modules/billing-subscription/cancellation-reason.service.ts` (FR-035)
- [ ] T159 Ethical retention-offer restriction (pause, downgrade, reduced-price period, support, plan education; at most one; never blocks cancel; no fake discounts; server-side eligibility; audited acceptance; coupon-conflict validation) in `backend/src/modules/billing-subscription/retention-offer.service.ts` (FR-036)
- [ ] T160 Revenue-recognition schedule support (immediate, over subscription period, on event completion, on mentor-session completion, over course-access period, milestone-based enterprise) subject to accountant approval, in `backend/src/modules/billing-ledger/revenue-recognition.service.ts` (FR-134)
- [ ] T161 Deferred-revenue tracking (collected cash, tax, deferred revenue, recognized-revenue schedule, refund adjustment, cancellation adjustment) with optional accounting-software export in `backend/src/modules/billing-ledger/deferred-revenue.service.ts` (FR-135)
- [ ] T162 Bundle revenue-allocation (stated price, relative standalone selling price, fixed internal allocation, finance-approved method) with allocation snapshot on the order in `backend/src/modules/billing-ledger/revenue-allocation.service.ts` (FR-136)
- [ ] T163 Multi-party revenue split (mentor sessions, instructor-led courses, partner events, marketplace products → seller earning, platform commission, taxes, payment fees, affiliate commission, refund reserve, withholding tax) — the shared mechanic `007` plugs into, in `backend/src/modules/billing-ledger/revenue-split.service.ts` (FR-137)

**Checkpoint**: The full subscription self-service surface and revenue-recognition mechanics are independently functional.

---

## Phase 12: Chargeback, Dispute & Fraud (supports FR-143–FR-147; cross-cutting, no single owning story)

- [ ] T164 Chargeback lifecycle (notification received → evidence deadline tracked → order identified → entitlement reviewed → evidence collected → response submitted → outcome recorded → fee recorded → commission reversed where applicable) in `backend/src/modules/billing-risk/chargeback-lifecycle.service.ts` (FR-143)
- [ ] T165 Chargeback evidence assembly (payment authentication, terms acceptance, login records, course usage, session attendance, delivery confirmation, communication, refund policy, invoice data) — minimum necessary data shared, in `backend/src/modules/billing-risk/chargeback-evidence.service.ts` (FR-144)
- [ ] T166 Customer payment-dispute workflow (duplicate charge, wrong amount, unauthorized payment, product not received, refund not received, unexpected renewal, invoice issue, other) enabling resolution before provider-chargeback escalation in `backend/src/modules/billing-risk/payment-dispute.service.ts` (FR-145)
- [ ] T167 Fraud-signal evaluation (payment velocity, multiple failed payments, device mismatch, account age, high-value first order, coupon abuse, referral abuse, affiliate self-purchase, payment-country mismatch, repeated refunds, chargeback history, bot activity) with graduated actions (allow, verify, hold fulfilment, manual review, block method, block coupon, reject, suspend account) in `backend/src/modules/billing-risk/fraud-evaluation.service.ts` (FR-146)
- [ ] T168 [P] Fraud-review interface (order, customer history, payment attempts, device signals, coupon/referral, affiliate, risk reason, previous refunds, access activity; sensitive payment data masked) in `web/src/app/(admin)/finance/fraud-review/page.tsx` (FR-147)

**Checkpoint**: Risk controls protecting revenue integrity are independently functional.

---

## Phase 13: Wallet, Coupons, Promotions & Gifting remainder (supports FR-090–FR-101 beyond US6's refund-destination coverage; cross-cutting, no single owning story)

- [ ] T169 Wallet-transaction ledger (credit issued, purchase debit, refund, expiry, reversal, admin adjustment, promotional grant, gift redemption) as immutable individually-referenceable entries; balance types available/reserved/pending/expiring/expired/reversed, in `backend/src/modules/billing-refund-wallet/wallet-ledger.service.ts` (FR-091)
- [ ] T170 Wallet credit-rule configuration (amount, currency, source, eligible products, minimum spend, maximum usage, expiry, transferability, refundability, combination rules) — wallet is not necessarily withdrawable money, in `backend/src/modules/billing-refund-wallet/wallet-credit-rules.service.ts` (FR-090, FR-092)
- [ ] T171 Reward Point payment integration per `006` (versioned conversion rate, max redeemable percentage, eligible products, minimum points, expiry, refund restoration, fraud check, tax-treatment review, cash-equivalent disclaimer) — XP never redeemable, in `backend/src/modules/billing-refund-wallet/reward-point-payment.service.ts` (FR-093)
- [ ] T172 Coupon type support (percentage, fixed, free-trial-extension, free-product, BOGO, shipping, membership-upgrade, first-order, renewal, category, referral, affiliate, organization) in `backend/src/modules/billing-refund-wallet/coupon-types.service.ts` (FR-094)
- [ ] T173 Coupon code hygiene (case-insensitive normalization, whitespace trimming, unique active code, secure unguessable bulk codes, no offensive words, expiry, redemption logging, rate limiting) in `backend/src/modules/billing-refund-wallet/coupon-hygiene.service.ts` (FR-096)
- [ ] T174 Coupon eligibility validation (customer, product, plan, billing period, country, currency, date, order amount, previous use, segment, referral, affiliate, campaign budget, subscription state, payment method) — race-condition-safe against concurrent budget exhaustion, in `backend/src/modules/billing-refund-wallet/coupon-eligibility.service.ts` (FR-097, edge case)
- [ ] T175 Coupon-stacking policy plus centrally defined discount-calculation order (no-stacking, coupon+wallet, coupon+points, platform+affiliate, multi-discount-with-priority) in `backend/src/modules/billing-refund-wallet/coupon-stacking.service.ts` (FR-098, edge case: coupon+wallet+points combination)
- [ ] T176 Auto-applied promotion support with applied-promotion-and-expiry explanation at checkout in `backend/src/modules/billing-refund-wallet/auto-promotion.service.ts` (FR-099)
- [ ] T177 Promotion budget controls (max total discount, max redemptions, daily budget, per-user value, affiliate allocation, funding source, alert threshold, auto-disable when exhausted) in `backend/src/modules/billing-refund-wallet/promotion-budget.service.ts` (FR-100)
- [ ] T178 Gift-membership flow (plan/duration selection → recipient email/mobile → message → delivery date → payment → gift code/invitation → recipient acceptance → existing-account conflict handling → membership start) tracked through Purchased…Refunded statuses, with region/currency/plan/transfer/expiry/refund restrictions and fraud monitoring, in `backend/src/modules/billing-refund-wallet/gift.service.ts` (FR-101)
- [ ] T179 [P] Wallet, coupon-entry, and gift-purchase UI in `web/src/app/(member)/account/billing/wallet/page.tsx` and `web/src/app/gifts/page.tsx`

**Checkpoint**: The full discount/credit/gifting surface is independently functional.

---

## Phase 14: Polish & Cross-Cutting Concerns

- [ ] T180 [P] Dark-pattern prevention full audit — no hidden cancellation path, no preselected paid add-ons, no fake countdowns, no concealed renewal terms, no misleading discount display, no subscription activation without explicit consent (FR-151), cross-checked against T042's checkout-summary guarantee
- [ ] T181 [P] Independent self-service audit — plan view, invoice download, payment-method management, renewal status, upgrade, downgrade, cancel, refund request, and support contact are all reachable without undue friction (FR-150)
- [ ] T182 Security hardening pass: re-audit T031's provider-adapter isolation, T034's webhook signature verification, T036's server-side recalculation, T117's dual-approval separation-of-duty enforcement, and payment-method token handling (no raw card data) against FR-042, FR-045, FR-066, FR-069, FR-152
- [ ] T183 Analytics event wiring across checkout, subscription lifecycle, referral, and affiliate flows (FR-021, FR-053, FR-103)
- [ ] T184 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (payment provider selection, exact numeric defaults for grace-period/dunning/pause/dual-approval thresholds, app-store in-app-purchase billing-path conflicts by product type)
- [ ] T185 Final audit: cross-check every FR-001–FR-152 against an implementation or validation task; verify the Constitution Article I/IV/V/VII co-citations and the Security & Compliance Baseline's GST-architecture citation are concretely implemented, not just noted
- [ ] T186 Run `quickstart.md` validation end-to-end across all 9 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends only on `001`'s RBAC/audit-log and produces the catalog/entitlement/webhook/ledger infrastructure every subsequent phase and every other paid feature depends on.
- **P1 stories (US1, US2, US3, US4, US6, US8)**: US1 (India checkout) is the core monetization loop and should ship first as the MVP; US8 (webhook idempotency) should be validated immediately alongside US1 since US1's own acceptance scenarios depend on it, and both build on Foundational's webhook pipeline (T033–T035); US2 (upgrade/downgrade proration) and US3 (dunning) both depend on US1's subscription being created and can build in parallel with each other; US4 (GST invoicing) depends only on Foundational's order/tax entities and can build in parallel with US1–US3; US6 (refunds) depends on US1 producing a completed order and on US4's credit-note generation.
- **P2 stories (US5, US7, US9)**: US5 (referral/affiliate) depends on US1's order/payment infrastructure and can build in parallel with US2/US3; US7 (offline/enterprise) depends on Foundational's dual-approval entity (T029) and can build in parallel with US5; US9 (reconciliation/period close) depends on US1's payment records existing and Foundational's ledger (T025) — it should land after enough transaction volume exists to reconcile meaningfully.
- **Phase 11b (Trials/Subscription Self-Service/Revenue Recognition)** depends on Foundational's subscription entities (T009) and US1's checkout flow; can build in parallel with US2–US9.
- **Phase 12 (Chargeback/Dispute/Fraud)** depends on US1's payment records and US6's refund infrastructure; can build in parallel with US7–US9.
- **Phase 13 (Wallet/Coupons/Gifting)** depends on Foundational's wallet/coupon entities (T019, T020) and US1's checkout flow (coupon/credit application is part of checkout); can build in parallel with the P2 stories.
- **Polish (Phase 14)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (catalog, entitlement service, provider adapter, webhook pipeline, idempotency, ledger) → **STOP and VALIDATE** the three Foundational contract tests (no-entitlement-without-verified-payment, idempotent-checkout, duplicate-webhook-dedup) pass → US1 (India checkout) + US8 (webhook idempotency, validated jointly with US1) → **STOP and VALIDATE** the core monetization loop is trustworthy end-to-end → US4 (GST invoicing, can build in parallel with US1) → US2 (upgrade/downgrade proration) + US3 (dunning) in parallel → US6 (refunds, depends on US1 + US4) → **STOP and VALIDATE** the full purchase-to-refund lifecycle is financially sound → Phase 11b (trials/subscription self-service/revenue recognition) + Phase 13 (wallet/coupons/gifting) in parallel → US5 (referral/affiliate) → US7 (offline/enterprise) → Phase 12 (chargeback/fraud) → US9 (reconciliation/period close) → Polish.
