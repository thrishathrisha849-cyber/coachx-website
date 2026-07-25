# Feature Specification: Membership, Subscriptions, Payments & Revenue Operations

**Feature Branch**: `009-membership-payments-revenue`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description: "Volume 09 — Membership Plans, Subscriptions, Payments, Orders, Invoices, Coupons, Referrals, Affiliate Programs, Revenue Operations and Financial Administration (source: `document 1/Document 1 (8).md`)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Purchase a Membership via an India Payment Method (Priority: P1)

A visitor compares TBT Free, Member, Premium, Business, and Enterprise plans, picks a monthly or annual price, and pays using UPI, a card, or net banking at checkout. Every fee (base amount, discount, tax, final payable amount, renewal amount/date) is shown before payment. On confirmed payment, the subscription activates and entitlements are granted immediately — never from a client-side "success" screen alone, only after trusted server-side/webhook verification.

**Why this priority**: This is the core monetization loop of the entire platform. Every other capability (dunning, refunds, invoicing, affiliates) exists only in service of this transaction succeeding correctly and safely. Without this, TBT has no revenue.

**Independent Test**: Can be fully tested by selecting a plan and price on the pricing page, completing checkout with a UPI or card payment in a sandboxed provider environment, and confirming that (a) the checkout summary matched what was later charged, (b) entitlement appears only after webhook/server verification (not immediately after the client redirect), and (c) an order, payment record, and invoice are all created and mutually consistent.

**Acceptance Scenarios**:

1. **Given** a visitor on the plan comparison page, **When** they select "TBT Premium, Annual", **Then** the system shows base amount, any discount, taxes, credits/points applied, final payable amount, renewal amount, and renewal date before payment is collected.
2. **Given** a valid checkout with UPI selected, **When** the user completes the UPI authorization, **Then** the system does not grant entitlement until a trusted provider webhook confirms payment status, order match, amount match, currency match, and idempotency validation succeed.
3. **Given** an identical checkout request is submitted twice (double-click or client retry) with the same idempotency key, **When** the second request arrives, **Then** the system reuses the existing order and returns the existing payment result instead of creating a duplicate charge or duplicate provider order.
4. **Given** a successful, server-verified payment, **When** the confirmation page loads, **Then** it shows order number, amount, product, an access CTA, invoice, receipt, and next-renewal date (for subscriptions).

---

### User Story 2 - Upgrade/Downgrade a Subscription with Correct Proration (Priority: P1)

An active paid member changes their plan (e.g., Member → Premium, or Monthly → Annual) or adds seats. The system previews the current plan, new plan, effective date, credit, amount charged today, and next billing amount/date before the change is confirmed, then applies the correct proration or defers the change to the next cycle per configured policy.

**Why this priority**: Upgrade/downgrade is a top revenue-expansion and churn-prevention lever, and getting proration wrong either overcharges customers (trust/legal risk) or silently loses revenue. It is exercised on nearly every paid account's lifecycle.

**Independent Test**: Can be fully tested by taking an active monthly subscription mid-period, triggering an upgrade to a higher-tier plan, verifying the proration preview matches the final provider-confirmed charge (within defined rounding rules), and confirming the new entitlement and next renewal amount are correct without an extra full-price charge.

**Acceptance Scenarios**:

1. **Given** an active subscriber mid-billing-period, **When** they request an upgrade with "immediate upgrade with prorated charge" policy, **Then** the system shows current plan, new plan, effective date, credit for unused time, amount charged today, and next billing amount/date, and only charges the previewed amount (within controlled rounding tolerance).
2. **Given** an active paid subscriber, **When** they request a downgrade of a paid feature, **Then** by default the downgrade becomes effective at the end of the current billing period, and the system explains features lost, limits reduced, stored-data impact, and the new renewal price before confirming.
3. **Given** a downgrade that reduces a usage limit (e.g., team seats, storage), **When** the downgrade takes effect, **Then** the system does not immediately delete the user's data — it applies read-only state, a grace period, and/or an export option with a communicated retention timeline instead.
4. **Given** a proration preview was shown at time T, **When** the final provider-confirmed charge is calculated moments later, **Then** it may differ from the preview only within explicitly defined rounding rules, never arbitrarily.

---

### User Story 3 - Recover a Failed Renewal via Dunning (Priority: P1)

When a recurring charge fails, the subscription enters "past due," the system categorizes the failure reason, notifies the user with an actionable (non-technical) message, retries payment on a configured schedule, offers a payment-method-update CTA, and — if recovery fails through the grace period — downgrades, suspends, or cancels the subscription rather than silently keeping access active forever or silently cutting it off with no warning.

**Why this priority**: Failed recurring payments are routine at scale (expired cards, insufficient funds) and directly determine involuntary churn and recovered MRR. Handling this correctly is essential to sustainable recurring revenue, ranked P0 in the source MVP tiers ("Basic dunning").

**Independent Test**: Can be fully tested by forcing a renewal charge to fail in a sandbox, verifying the subscription transitions to "past due," a retry occurs on the configured schedule (e.g., day 1, 3, 5, 7), the user receives a grace-period warning, and — if all retries fail — the subscription is downgraded/suspended/cancelled per policy with entitlement changes matching the final state.

**Acceptance Scenarios**:

1. **Given** an active auto-renewing subscription, **When** the renewal charge fails, **Then** the system categorizes the failure reason (insufficient funds, card expired, bank declined, etc.), marks the subscription "past due," and shows the user a secure, actionable message without exposing raw provider error detail.
2. **Given** a subscription in "past due" state, **When** the configured retry schedule elapses, **Then** the system retries payment at each scheduled interval without issuing excessive repeated charge attempts, and a duplicate webhook for any retry does not duplicate the entitlement extension.
3. **Given** a subscription that reaches the end of its grace period without a successful payment, **When** the grace period expires, **Then** the system applies the configured downgrade or suspension (or marks the subscription cancelled/uncollectible), and this transition is server-controlled, not client-triggered.
4. **Given** a user in dunning updates their payment method and a retry subsequently succeeds, **When** the successful payment is verified, **Then** the subscription returns to "active" state and the user receives a "renewal succeeded" / recovery notification.

---

### User Story 4 - GST-Compliant Invoice, Receipt, and Credit Note Generation (Priority: P1)

For every applicable paid transaction, the system generates a legally structured tax invoice (seller legal details, customer billing details, GSTIN, place of supply, HSN/SAC where applicable, taxable value, tax rates/amounts, total) with a unique, sequential, financial-year-aware invoice number, plus a separate receipt for payment confirmation. Corrections to an issued invoice happen only via credit note and/or a revised invoice, never a direct overwrite.

**Why this priority**: This is a hard compliance requirement (GST/CGST/SGST/IGST per the Constitution's Security & Compliance Baseline) — incorrect or non-compliant invoicing is a legal and financial-audit risk, not just a UX nicety, and it blocks every enterprise/organization sale.

**Independent Test**: Can be fully tested by completing a paid order with a customer-supplied GSTIN and billing state, verifying the generated invoice number is unique/sequential/financial-year-aware (e.g., `TBT/INV/2026-27/000001`), contains all required fields, is immutable once issued, and that a subsequent refund produces a correctly linked credit note rather than an edited invoice.

**Acceptance Scenarios**:

1. **Given** a completed paid order with a valid customer tax profile, **When** the invoice is generated, **Then** it includes invoice number, invoice date, seller legal details, customer billing details, GSTIN, place of supply, order reference, line items, tax rates and amounts, total, amount paid, currency, and payment reference.
2. **Given** an already-issued invoice, **When** a billing detail correction or refund is required, **Then** the system does not directly overwrite the invoice — it issues a credit note (and a revised invoice where legally allowed) with full audit trail and finance approval where required.
3. **Given** two invoices generated in sequence for the same legal entity, **When** their invoice numbers are compared, **Then** they are unique, sequential, and not reusable even if one transaction is later cancelled or refunded.
4. **Given** a customer requests their tax invoice, **When** they access it via billing history, email, or download, **Then** the receipt (payment confirmation) and the tax invoice are available as distinguishable documents via secure, access-controlled links.

---

### User Story 5 - Referral Reward and Affiliate Commission Attribution & Payout (Priority: P2)

An existing user shares a referral link; a new user registers and completes a qualifying paid action, and — after the refund window passes and fraud checks clear — the referrer receives a reward (wallet credit, membership days, coupon, etc.). Separately, an approved affiliate partner shares a tracked link/coupon; an attributed sale generates a commission calculated on a clearly defined base, which becomes payable only after the refund/dispute window and fraud checks, and is paid out on a defined schedule with a statement.

**Why this priority**: Referral and affiliate programs are explicit P0/P1 growth channels in the source MVP tiers, but they are secondary to the core purchase and billing correctness stories — a broken referral/affiliate system loses growth efficiency, not core revenue integrity.

**Independent Test**: Can be fully tested end-to-end by generating a referral link, having a new test user register and complete a qualifying purchase through it, confirming the reward stays "pending" through the refund window and only becomes "approved"/"issued" afterward; and separately by having an approved affiliate's tracked link drive a sale, confirming the commission is calculated on the configured base, held through the hold period, and reflected correctly in the affiliate dashboard and eventual payout.

**Acceptance Scenarios**:

1. **Given** a new user registers through a referral link, **When** they complete the qualifying paid action, **Then** the referral status progresses from "clicked" → "registered" → "qualified action pending" → "qualified," and the reward is only issued after the refund window passes and fraud checks clear.
2. **Given** an approved affiliate's tracked link or coupon drives an attributed order, **When** the order is paid, **Then** the commission is calculated using the affiliate's configured commission base (gross, net of tax/discount/refunds/fees, etc.) as stated in their agreement, snapshotted at that time.
3. **Given** a commission is in "pending" or "approved" state, **When** the attributed order is later refunded or charged back, **Then** the commission is reversed or held according to the affiliate's terms, and this reversal is reflected in the affiliate's dashboard and ledger.
4. **Given** two eligible attribution sources exist for the same conversion (e.g., a referral and an affiliate code), **When** attribution is resolved, **Then** the system applies a defined precedence/conflict rule rather than double-crediting both.

---

### User Story 6 - Full or Partial Refund with Entitlement Adjustment (Priority: P1)

A customer requests a refund for an order or a specific item; the system evaluates eligibility (policy, purchase date, consumption/progress, previous refunds, fraud signals), computes a refund amount that cannot exceed the refundable balance, routes it for auto-approval or manual review, processes it through the provider, generates a credit note, and adjusts (revokes/reduces) the corresponding entitlement only after the refund is verified.

**Why this priority**: Refund correctness directly protects customer trust and financial integrity (Constitution Article IV, Historical Immutability) and is legally/operationally unavoidable at scale; getting it wrong causes double-loss (refunded money + retained access) or customer harm (revoked access without refund).

**Independent Test**: Can be fully tested by requesting a refund on a completed order, verifying the eligibility check and computed refundable amount, approving it (auto or manual), confirming the provider refund and webhook verification occur before any entitlement is revoked, and confirming a credit note is generated and linked to the original invoice.

**Acceptance Scenarios**:

1. **Given** a completed paid order within its refund policy window, **When** a refund is requested, **Then** the system previews eligibility (eligible / partially eligible / ineligible / manual review required) before the user submits the request.
2. **Given** an approved refund, **When** it is processed, **Then** the refunded amount cannot exceed the order's refundable balance (accounting for allocated discount, tax, non-refundable fees, prior refunds, and rounding).
3. **Given** a refund has been submitted to the payment provider, **When** the provider confirms the refund via webhook, **Then** the system adjusts the entitlement (revokes membership access, disables downloads, reverses AI credits/reward points as applicable) and generates a credit note — not before provider confirmation.
4. **Given** a refund is still "processing" at the provider, **When** the customer checks status, **Then** the system distinguishes "refund initiated," "refund processed by provider," and "refund completed" rather than prematurely declaring the refund received by the customer.

---

### User Story 7 - Offline/Enterprise Payment with Dual Approval (Priority: P2)

An authorized admin records an offline payment (cash, cheque, POS, manual bank transfer) for an enterprise or approved high-value order, capturing amount, currency, date, method, reference, collector, evidence, and notes. High-risk or high-value offline/manual payment entries require a second, different approver before the order is marked paid and entitlement is activated.

**Why this priority**: Enterprise/organization sales and bank-transfer-based high-value orders are an explicit revenue channel (per Organization Billing / Purchase Orders / Credit Terms) that cannot rely on card/UPI checkout, but the manual nature of cash handling creates fraud/error risk that the dual-approval control specifically mitigates.

**Independent Test**: Can be fully tested by having one authorized user record an offline cash/cheque payment against an enterprise order, confirming entitlement is NOT activated until a second, distinct approver confirms it (where dual approval is configured), and that the same user cannot both record and approve the same transaction.

**Acceptance Scenarios**:

1. **Given** an authorized admin records an offline payment, **When** they submit amount, currency, date, method, reference, collector, evidence, and approver fields, **Then** the system stores the record but does not activate entitlement until any configured dual-approval step is completed.
2. **Given** dual approval is enabled for offline payments above a threshold, **When** the same user who recorded the payment attempts to approve it, **Then** the system blocks the self-approval (separation of duties).
3. **Given** a bank-transfer order awaiting funds, **When** a partial payment or an overpayment is received, **Then** the system handles it explicitly (partial-payment tracking or overpayment reconciliation) rather than silently treating it as a full/mismatched payment.
4. **Given** an offline payment is approved, **When** entitlement activates, **Then** an invoice is generated and the transaction is reconciled the same as any other completed order.

---

### User Story 8 - Webhook-Driven, Idempotent Entitlement Grant Across Out-of-Order Events (Priority: P1)

The payment webhook endpoint receives provider events (success, refund, dispute, subscription cancellation, etc.) that may arrive duplicated, delayed, or out of order. The system verifies the webhook signature, deduplicates by event ID, applies a state-machine-validated transition using provider event time, and only then updates the order/subscription and grants/revokes entitlement — regardless of the order events physically arrive in.

**Why this priority**: This is the structural backbone that every other financial guarantee (Server-Authoritative State, Historical Immutability) depends on. If webhook handling is wrong, every other story (purchase, dunning, refund) is unreliable regardless of how correct its own logic is.

**Independent Test**: Can be fully tested by replaying the same webhook event twice, sending a refund event before the corresponding success event has finished local processing, and sending a subscription-cancelled event after a renewal event — in each case confirming the final state and entitlement match what a correctly time-ordered sequence would produce, with no duplicate entitlement grants or lost state transitions.

**Acceptance Scenarios**:

1. **Given** a webhook event was already processed (recorded by its event ID), **When** the same event is delivered again, **Then** the system recognizes the duplicate and does not reapply the financial transaction or re-grant entitlement.
2. **Given** a "payment succeeded" webhook and a "refund" webhook for the same order arrive out of order, **When** both are eventually processed, **Then** the system uses provider event time and a validated state machine to reach the same final state regardless of arrival order.
3. **Given** an incoming webhook payload, **When** it is received, **Then** the system verifies its signature and timestamp tolerance before processing, storing the raw payload for audit, and rejects/queues events that fail verification rather than applying them.
4. **Given** webhook processing fails transiently, **When** the provider retries delivery, **Then** the system's retry/dead-letter handling ensures the event is eventually processed or explicitly alerted on, without silently dropping it.

---

### User Story 9 - Financial Period Close and Provider Settlement Reconciliation (Priority: P2)

Finance staff import a payment provider's settlement report, the system auto-matches it against internal successful payments, refunds, and fees by transaction reference, flags mismatches (missing internally, missing at provider, amount/currency/fee mismatch, duplicates) for review, and — once resolved — locks the financial period, after which changes require a controlled reopening process.

**Why this priority**: Reconciliation and period close are what make the platform's revenue numbers trustworthy to finance/tax authorities and are required before any GST/accounting reporting can be considered final; they are P0/P1 in the source MVP tiers ("Settlement import," "Reconciliation," "Period close").

**Independent Test**: Can be fully tested by importing a sample provider settlement file, confirming auto-matching against known internal payment records, deliberately introducing one amount mismatch and one missing-at-provider record, confirming both are flagged with the correct mismatch category, and confirming that locking the period prevents silent edits afterward.

**Acceptance Scenarios**:

1. **Given** a provider settlement report is imported, **When** reconciliation runs, **Then** internal successful payments, refunds, chargebacks, and fees are auto-matched to it by transaction reference, and any unmatched or mismatched record is flagged with a specific mismatch category (missing internally, missing at provider, amount mismatch, currency mismatch, duplicate, refund mismatch, fee mismatch, bank mismatch).
2. **Given** a flagged mismatch, **When** finance reviews it, **Then** they can create an approved adjustment with a ledger entry, reason, creator, and approver captured for audit.
3. **Given** all reconciliation items for a period are resolved, **When** the period is locked, **Then** subsequent changes to that period's financial records require a controlled reopening process rather than a direct edit.
4. **Given** a locked period, **When** reports are exported (sales, tax/GST summary, revenue recognition, reconciliation), **Then** the exported figures match the locked period's ledger state exactly.

---

### Edge Cases

- What happens when a payment succeeds at the provider but the confirming webhook is lost or never delivered (network/provider failure)? The system must reconcile via provider settlement/status polling rather than leaving the order permanently "pending" with no entitlement.
- What happens when the same webhook event is delivered twice (provider retry behavior)? Entitlement must not be granted or extended twice; event-ID deduplication must catch this.
- How does the system handle a "refund" webhook arriving before the corresponding "success" webhook has finished local processing (out-of-order delivery)?
- How does the system handle a "subscription cancelled" event arriving after a "renewal succeeded" event for the same subscription?
- What happens when a coupon, wallet credit, and reward points are all applied to the same checkout — what is the defined stacking/priority order, and can policy forbid stacking entirely for a given coupon?
- What happens when the recurring price for a plan changes while a customer has an active subscription — is the existing customer grandfathered, and is the required notice/consent given before the new amount is charged? Historical invoices for that customer must remain unchanged regardless.
- What happens when a customer's proration preview amount differs from the final provider-confirmed charge — how large a rounding difference is tolerated before it is treated as an error?
- What happens when an affiliate-attributed order and a referral-attributed order both target the same conversion (attribution conflict)?
- What happens when a self-referral or affiliate self-purchase is detected (referrer/affiliate buying through their own link)?
- What happens when a customer with an active subscription requests a downgrade that would reduce team seats currently occupied by more members than the new limit allows?
- What happens when a GSTIN fails format/state-code validation, or the customer claims an exemption that cannot be automatically verified?
- What happens when a refund is requested for an order that already had a partial refund — does the system correctly track cumulative refunded amount against the refundable balance?
- What happens when a chargeback is filed on an order whose affiliate commission has already been paid out — is the commission reversed, and how is that reconciled against a payout that already occurred?
- What happens when an installment plan customer misses a due installment — does the system apply the configured suspension/default consequence, and how does that interact with an "immediate access after first payment" entitlement policy already granted?
- What happens when a trial user has already exhausted a free trial on a previous account (same device/payment fingerprint) and attempts to start a new trial with a new account?
- What happens when an organization billing owner removes a member's seat — does that delete the member's personal TBT account, or only revoke the organization-granted entitlement?
- What happens when a customer attempts checkout with a coupon that is valid but the campaign's total budget/redemption cap has just been exhausted by a concurrent transaction (race condition)?
- What happens when cross-border/export customers (outside India) purchase — how is place of supply and applicable tax treatment determined, given the primary market and tax logic are India/GST-focused?

## Requirements *(mandatory)*

### Plan, Product & Price Requirements

- **FR-001**: System MUST model every sellable item as a Product with product ID, code, name, slug, type, description, media, category, seller/revenue owner, pricing model, currency, tax category, fulfilment method, entitlement definition, availability window, maximum quantity, refund policy, and terms version.
- **FR-002**: System MUST support the defined sellable product types, including individual/team/organization memberships, courses, course bundles, cohort programs, workshops, event tickets, mentor sessions/packages, ebooks, templates, digital toolkits, podcast premium access, AI credits, AI subscription add-ons, certification fees, challenge entries, merchandise, gift memberships, and admin-created custom products.
- **FR-003**: System MUST enforce a product status model (Draft, Review pending, Approved, Scheduled, Active, Paused, Sold out, Expired, Archived, Rejected) and MUST make only Approved and Active products available at public checkout.
- **FR-004**: System MUST support the defined pricing models: free, one-time fixed, recurring fixed, usage-based, per-seat, tiered, package, pay-what-you-want (where approved), custom quote, installment, deposit-plus-balance, add-on, credit-based redemption, points-plus-cash, and promotional temporary price.
- **FR-005**: System MUST represent every price as a distinct Price entity (price ID, product ID, billing model, currency, unit amount, tax inclusion type, billing interval, interval count, trial period, setup fee, min/max quantity, effective start/end, region, user segment, status, provider price reference, version).
- **FR-006**: System MUST NOT allow direct editing of a published price; changing a price MUST create a new price version.
- **FR-007**: System MUST allow one Plan to have multiple Prices (e.g., monthly INR, annual INR, promotional annual, per-seat organization price).
- **FR-008**: System MUST model membership as separate concepts: Plan, Price, Subscription, Entitlement, Usage limit, Benefit, Add-on, Subscription item, and Billing account.
- **FR-009**: System MUST support an admin-configurable plan tier structure (e.g., Free, Member, Premium, Business, Enterprise) with final names/features fully admin-configurable rather than hardcoded.
- **FR-010**: System MUST store every Plan with plan ID, name, code, public/internal descriptions, target customer, features, entitlements, limits, supported billing periods, trial eligibility, upgrade/downgrade paths, cancellation policy, grace-period policy, refund policy, display order, badge text, recommended status, active status, and version.
- **FR-011**: System MUST provide a centralized entitlement backend service that is the sole source of truth for entitlement grants; frontend code MUST use entitlement data only for feature hiding/UX and MUST NOT perform access control decisions itself.
- **FR-012**: System MUST support entitlement types: boolean access, numeric quota, currency credit, percentage discount, content scope, role grant, time-limited access, usage reset, seat-based access, and region-restricted access.
- **FR-013**: System MUST render a plan comparison page showing plan name, target user, monthly-equivalent amount, actual billing amount, billing frequency, main benefits, detailed feature comparison, limits, trial information, cancellation terms, a taxes note, and a call to action; any "recommended" plan label MUST be driven by a truthful, server-evaluated business rule.
- **FR-014**: System MUST support monthly, quarterly, half-yearly, annual, multi-year, and custom-contract billing frequencies, and MUST display the exact amount charged today, billing interval, next charge date, and an accurate, date-aware annual-savings comparison against the currently active monthly list price.

### Trial Requirements

- **FR-015**: System MUST support free trials with configurable eligible plans, duration, whether a payment method is required, trial features/limits, trial start/end dates, conversion date, reminder schedule, cancellation behavior, and repeat-trial policy.
- **FR-016**: System MUST show trial-to-paid conversion terms on the confirmation page before the trial begins.
- **FR-017**: System MUST check trial eligibility using signals including user identity, prior trial history, prior paid subscription, organization membership, device-abuse signals, payment fingerprint (where legally permitted), promotional campaign, region, and account status, and MUST do so in a privacy-safe manner (no single overreaching signal alone disqualifying a user without policy basis).
- **FR-018**: System MUST send configurable trial lifecycle notifications: trial started, trial halfway, three days before expiry, one day before expiry, conversion successful, conversion payment failed, and trial expired.

### Subscription Lifecycle Requirements

- **FR-019**: System MUST store every Subscription with subscription ID, billing account, customer, plan, price, provider subscription reference, status, start date, current period start/end, trial start/end, renewal mode, next billing date, cancellation requested/effective dates, grace-period end, collection method, currency, tax profile, and created/updated timestamps.
- **FR-020**: System MUST enforce a server-controlled subscription status model: Incomplete, Trialing, Active, Past due, Grace period, Payment action required, Paused, Cancellation scheduled, Cancelled, Expired, Suspended, Uncollectible, Migrated, Archived — with all status transitions server-controlled, never client-set.
- **FR-021**: System MUST execute subscription creation through the full flow: plan selection, price/billing-period selection, eligibility check, existing-subscription conflict check, billing profile collection, coupon/referral application, tax calculation, checkout summary display, terms consent capture, payment mandate/collection, provider response receipt, webhook verification, subscription record create/update, entitlement activation, invoice generation, receipt send, analytics recording, and notification send.
- **FR-022**: System MUST prevent conflicting subscription states: duplicate active subscription to the same plan, overlapping incompatible plans, duplicate provider subscription creation, undisclosed duplicate access from organization-paid plus individual-paid combinations, and multiple-trial abuse.
- **FR-023**: System MUST support valid combined-subscription scenarios such as base membership plus AI add-on, base membership plus event ticket, base membership plus course purchase, and organization plan plus individual add-on.
- **FR-024**: For auto-renewing subscriptions, system MUST require a valid payment mandate, show the renewal amount/date, send upcoming-renewal reminders per law/policy, monitor provider billing events, extend entitlement only on successful payment, trigger dunning on failed payment, ensure a duplicate webhook does not duplicate the entitlement extension, and never renew a cancelled subscription.
- **FR-025**: For manual-renewal plans, system MUST provide an expiry reminder, a renew CTA, optional grace period, price-change notice, payment checkout, entitlement extension, and invoice generation, and MUST NOT silently create auto-debit from a manual-renewal plan.
- **FR-026**: When a recurring price changes, system MUST apply a defined grandfathering policy, effective date, required notice, user consent where required, display of the new renewal amount, a cancellation option, an audit record, and a provider subscription update — and MUST keep historical invoices unchanged regardless of the price change.
- **FR-027**: System MUST support subscription upgrades (e.g., Free→Member, Member→Premium, Individual→Business, Monthly→Annual, add seats, add AI package) under a configurable policy: immediate upgrade with prorated charge, immediate upgrade without proration, next-cycle upgrade, or credit of unused amount — and MUST show current plan, new plan, effective date, credit, charge today, next billing amount, and next billing date before confirming.
- **FR-028**: System MUST run a proration engine using current subscription period, current paid amount, remaining period, new price, tax, discounts, currency precision, provider calculation, and platform policy as inputs, and MUST ensure the proration preview and final provider-confirmed amount differ, if at all, only within explicitly controlled rounding rules.
- **FR-029**: System MUST support subscription downgrades effective immediately, at end of current billing period, or at contract renewal date, with paid-feature downgrades defaulting to end-of-period, and MUST explain features lost, limits reduced, stored-data impact, team-seat impact, unused credits, effective date, and new renewal price.
- **FR-030**: When a downgrade reduces a limit, system MUST NOT immediately delete user data; it MUST offer read-only state and/or a grace period and/or an export option, with a clearly communicated retention timeline, for cases including AI history retention, team members, storage, saved templates, and premium courses.
- **FR-031**: System MUST support plan-configurable subscription pause with minimum active duration, maximum pause duration, number of pauses per year, effective date, billing behavior, entitlement behavior, auto-resume date, and credit treatment; pause MUST be treated as distinct from cancellation.
- **FR-032**: System MUST support subscription resume that verifies pause state, shows any charge, shows the new billing date, requires confirmation, updates the provider, restores entitlement, sends notification, and creates an audit record.
- **FR-033**: System MUST execute cancellation through the full flow: user opens subscription, selects cancel, sees effective date, sees benefits-until date, sees refund implications, optionally/mandatorily provides a reason, may be shown at most one ethical retention offer, confirms, provider is updated, subscription is marked cancellation-scheduled or cancelled, entitlement expires on the correct date, and confirmation is sent.
- **FR-034**: System MUST support cancellation options: cancel at period end, cancel immediately without refund, cancel immediately with prorated refund where policy allows, contract cancellation requiring support, and organization cancellation requiring the billing owner — and MUST NOT require a phone call to cancel unless legally/operationally unavoidable and clearly disclosed.
- **FR-035**: System MUST capture a cancellation reason (from a defined set: too expensive, not using enough, missing features, technical issues, content not relevant, switching plan, business closed, temporary break, payment problem, other) usable for product-improvement analysis.
- **FR-036**: System MUST restrict retention offers shown during cancellation to ethical options (pause plan, downgrade, reduced-price period, support assistance, plan education), MUST show at most one clear offer, MUST NOT block the cancel action, MUST NOT use fake discounts, MUST evaluate eligibility server-side, MUST audit offer acceptance, and MUST validate against existing coupon conflicts.
- **FR-037**: System MUST support a plan-configurable grace period on payment failure during which features may remain fully or partially accessible, the user receives notices, payment retry occurs, the grace end date is clearly shown, successful recovery restores active state, and failure after grace applies the configured downgrade or suspension.
- **FR-038**: System MUST run dunning management for failed recurring payments through the defined workflow: renewal charge fails, failure reason categorized, subscription becomes past due, user notified, payment-update CTA shown, retries scheduled, optional alternative-method request, grace-period management, final warning, entitlement suspend/downgrade, and subscription cancel or mark-uncollectible.
- **FR-039**: System MUST use a configurable payment retry schedule (e.g., same day, day 1, day 3, day 5, day 7), MAY use provider smart-retry support, and MUST avoid excessive repeated charge attempts.
- **FR-040**: System MUST categorize failed-payment reasons (insufficient funds, card expired, bank declined, mandate inactive, authentication required, limit exceeded, invalid payment method, network failure, provider failure, risk block, unknown), MUST present a secure and actionable user-facing message, and MUST NOT expose internal/raw provider error detail to the user.
- **FR-041**: System MUST provide plan migration workflows (no migration, automatic at renewal, immediate migration, opt-in migration, forced migration with notice) that define new plan, new price, credits, effective date, entitlements, user notice, cancellation option, provider update, and rollback.

### Payment Method Requirements

- **FR-042**: System MUST let users add a payment method, set a default, remove an unused method, update billing details, complete authentication, and view only limited masked details — and MUST NOT store raw card data unless a fully compliant architecture is specifically approved; provider tokenization MUST be preferred.
- **FR-043**: System MUST support India-focused payment methods: UPI, credit card, debit card, net banking, supported wallets, EMI (where provider/product allow), bank transfer, payment link, and cash/offline collection through an authorized admin process only — with availability dynamically determined by provider, currency, amount, and product.
- **FR-044**: System MUST support UPI intent, UPI collect (where permitted), QR, and recurring UPI mandate (where available) with payment-status polling plus webhook, expiry, deep-link fallback, duplicate prevention, user-cancellation handling, pending-state handling, and server-side verification.
- **FR-045**: System MUST use provider-hosted secure collection and tokenization for card payments, support strong customer authentication where required, capture saved-card consent, display masked card details, support expiry updates, support failed-authentication recovery, and MUST NOT log raw card data.
- **FR-046**: System MUST support net banking and wallet payments via provider redirect with a return URL, webhook verification, pending-status handling, user-abandonment handling, and retry, and MUST NOT grant entitlement before confirmation.
- **FR-047**: System MUST support bank transfer for enterprise/approved high-value orders with a unique payment reference, bank instructions, expiry, optional proof upload, finance verification, partial-payment handling, overpayment handling, reconciliation, invoice status tracking, and entitlement activation only after approval.
- **FR-048**: System MUST restrict offline payment recording (cash, cheque, POS, manual bank receipt) to authorized roles, and MUST require the admin to record amount, currency, date, method, reference, collector, evidence, approver, and notes, with dual approval configurable.
- **FR-049**: System MUST implement a payment-provider abstraction interface supporting customer creation, order creation, payment intent, checkout, payment verification, subscription, mandate, refund, payment link, webhook verification, settlement data, dispute data, and tokenized payment method, with provider adapters isolated in a separate module.
- **FR-050**: System MUST support routing across multiple payment providers using inputs including country, currency, payment method, product type, amount, provider health, cost, success rate, recurring capability, and risk rules, and any fallback routing MUST NOT cause a duplicate charge; retry MUST be either explicit user-initiated or deterministic safe orchestration.
- **FR-051**: System MUST support installment payments for eligible products with total amount, deposit, number of installments, due dates, amount per installment, payment method, grace period, late-payment policy, entitlement schedule, cancellation terms, and default consequences, tracked through statuses (Scheduled, Due, Paid, Partially paid, Past due, Failed, Waived, Cancelled, Defaulted), with the entitlement policy (full access after first payment, progressive access, full access after full payment, suspension when overdue) clearly disclosed at checkout.
- **FR-052**: System MUST allow admins to create payment links for a product, custom order, enterprise invoice, event, course, approved donation, or outstanding balance, with fields for amount, currency, customer restriction, expiry, maximum uses, product mapping, tax treatment, redirect, and status.

### Order & Checkout Requirements

- **FR-053**: System MUST execute the payment order flow: product selection, cart validation, price snapshot, discount calculation, tax calculation, total calculation, internal order creation, provider order creation, payment collection, provider callback, webhook verification, payment record, order confirmation, entitlement/fulfilment, invoice, receipt, notification, analytics.
- **FR-054**: System MUST store every Order with order ID, user-facing order number, customer, billing account, status, currency, subtotal, discount, tax, fees, credit applied, reward points applied, total, amount paid, amount refunded, source, affiliate attribution, referral attribution, billing address, tax identity, terms version, and created/completed/cancelled dates.
- **FR-055**: System MUST generate a unique, sufficiently non-guessable, searchable, user-facing order number (e.g., `TBT-ORD-2026-000001`) distinct from the internal database ID, with configurable financial-year formatting.
- **FR-056**: System MUST enforce an order status model: Draft, Pending, Awaiting payment, Payment processing, Paid, Partially paid, Fulfilment pending, Fulfilled, Partially fulfilled, Cancelled, Refunded, Partially refunded, Payment failed, Expired, Disputed, Chargeback, Archived.
- **FR-057**: System MUST store every Order Item with product, product snapshot, price, quantity, unit amount, discount allocation, tax allocation, net amount, seller/revenue owner, entitlement, fulfilment status, refundable amount, and commission configuration.
- **FR-058**: System MUST support a Cart with add item, remove item, update quantity, apply coupon, apply credits, price refresh, tax estimate, save cart, expiry, and checkout, and MUST show a clear reason for any invalid combination.
- **FR-059**: System MUST validate the cart against: product active status, sales period, quantity, inventory/capacity, user eligibility, duplicate ownership, membership requirement, region, current price, coupon validity, bundle conflicts, currency, and seat limits.
- **FR-060**: System MUST render a checkout page with order summary, customer information, billing address, optional GST details, coupon entry, credits/points entry, payment method selection, a recurring-payment notice, terms and refund policy, final amount, a pay CTA, and a security notice.
- **FR-061**: System MUST require a mandatory idempotency key on checkout requests, and on a repeated click or network retry MUST reuse the same order, avoid duplicate provider order creation, prevent duplicate charge, and return the existing completed payment result where applicable.

### Payment Status & Webhook Requirements

- **FR-062**: System MUST enforce a normalized payment status model (Created, Pending, Requires action, Authorized, Captured, Successful, Failed, Cancelled, Expired, Partially refunded, Refunded, Disputed, Chargeback, Reversed) with provider-specific statuses mapped into it.
- **FR-063**: System MUST present a pending-payment screen for methods without instant confirmation, showing "payment being verified," order reference, status refresh, a safe exit path, notification only where actually supported, retry only after expiry or confirmed failure, and a support option — and MUST NOT display false success while in this pending state.
- **FR-064**: System MUST display payment success only after trusted server-side verification, showing order number, amount, product, access CTA, invoice, receipt, subscription next-renewal date (if applicable), and email-confirmation status.
- **FR-065**: System MUST display payment failure with a clear "payment unsuccessful, no entitlement granted" message, a safe retry option, an alternative-method suggestion, the order reference, and support access — without exposing sensitive decline detail.
- **FR-066**: System MUST implement a webhook endpoint with signature verification, timestamp tolerance, raw-body verification where required, event-ID deduplication, idempotent processing, raw event storage, retry handling, a dead-letter queue, alerting, provider response handling, and audit logging.
- **FR-067**: System MUST process webhook events through the defined pipeline: receive, verify source, store raw protected payload, check duplicate event, map provider event, lock target record, validate transition, apply financial transaction, update order/subscription, grant or revoke entitlement, trigger invoice/refund, send notification, mark event processed.
- **FR-068**: System MUST correctly handle out-of-order webhook scenarios — success arriving before pending, refund before local success processing completes, subscription-cancelled after a renewal event, duplicate settlement, and delayed failure — using provider event time, a status state machine, and reconciliation.
- **FR-069**: System MUST treat all client-provided checkout values (amount, discount, tax, product name, entitlement, commission, refund amount, subscription status) as untrusted and MUST always recalculate them server-side from trusted configuration.

### Tax & Invoicing Requirements

- **FR-070**: System MUST provide a tax architecture configurable for GST, CGST, SGST, IGST, tax-inclusive pricing, tax-exclusive pricing, tax exemptions, reverse-charge scenarios, export/international customer treatment, product tax categories, and place of supply, with final tax logic requiring qualified finance/tax professional approval.
- **FR-071**: System MUST maintain a customer Tax Profile with legal name, billing name, billing address, state, country, postal code, optional GSTIN, business type, place of supply, tax exemption status, and verification status.
- **FR-072**: System MUST validate GSTIN format and state-code consistency, support optional external validation integration, track verification status and user confirmation, lock the invoice after issue, and require correction through a credit note and revised-invoice process — and MUST NOT claim government validation unless actually completed.
- **FR-073**: System MUST calculate tax using seller registration state, customer place of supply, product tax category, tax rate effective date, tax inclusion setting, customer exemption status, currency, and transaction date, and MUST store the resulting tax snapshot with the transaction.
- **FR-074**: System MUST apply centralized, consistent rounding rules for currency decimal precision, tax-line rounding, invoice-total rounding, discount allocation, refund allocation, commission calculation, and settlement comparison, using the same rounding library/contract on frontend and backend.
- **FR-075**: System MUST generate an invoice for applicable transactions containing invoice number, invoice date, seller legal details, customer billing details, GSTIN, place of supply, order reference, line items, HSN/SAC where applicable, taxable value, tax rates, tax amounts, total, amount paid, currency, payment reference, terms, and a digital signature/declaration where required.
- **FR-076**: System MUST assign invoice numbers that are unique, sequential per configured legal entity, financial-year-aware, optionally separated by entity/document type where approved, never reusable, and never silently editable (e.g., `TBT/INV/2026-27/000001`), subject to finance approval of the final numbering scheme.
- **FR-077**: System MUST support proforma invoices for enterprise/bank-transfer orders with proforma number, validity, quotation terms, tax estimate, and payment instructions, and MUST NOT treat a proforma invoice as a final tax invoice unless applicable.
- **FR-078**: System MUST generate a payment receipt (receipt number, payment date, amount, payment method, transaction reference, order, customer, status) as a document potentially separate from the tax invoice.
- **FR-079**: System MUST generate a credit note for refunds, invoice reductions, cancellations, tax corrections, or discount corrections, containing credit-note number, original invoice reference, reason, line adjustments, tax reversal, amount, and date.
- **FR-080**: System MUST make invoices available through billing history, email, PDF download, organization billing portal, and admin portal, via secure, access-controlled links.
- **FR-081**: System MUST NOT allow direct overwrite of an issued invoice; correction MUST follow a defined process (billing-detail correction rules, credit note, revised invoice if legally allowed, audit trail, finance approval where required).

### Refund, Wallet & Coupon Requirements

- **FR-082**: System MUST support refund types: full, partial, line-item, quantity, tax-inclusive, platform credit, mixed, reward-point restoration, and session-credit restoration.
- **FR-083**: System MUST evaluate refund eligibility using product policy, purchase date, consumption, download status, course progress, event date, mentor session state, subscription period, previous refunds, dispute status, fraud signals, and legal requirements, producing a result of eligible, partially eligible, ineligible, or manual review required.
- **FR-084**: System MUST execute the refund request flow: user selects order and item, provides reason and requested resolution, optional evidence, sees an eligibility preview, submits, is auto-approved or sent to manual review, provider refund is issued, webhook verification occurs, entitlement is adjusted, a credit note is generated, notification is sent, and the action is audited.
- **FR-085**: System MUST enforce a refund status model: Requested, Under review, Approved, Rejected, Processing, Completed, Partially completed, Failed, Cancelled, Reversed.
- **FR-086**: System MUST calculate refund amount considering item amount, allocated discount, tax, non-refundable fees, usage, proration, previous refunds, credits, reward points, and currency rounding, and MUST NOT allow a refund to exceed the refundable balance.
- **FR-087**: System MUST support refund destinations of original payment method, platform wallet credit, bank transfer (exceptional cases), session credit, or membership credit — restricted to policy-permitted options for that transaction.
- **FR-088**: System MUST display a realistic expected refund timeline based on payment provider, payment method, bank, internal review, and weekends/holidays, and MUST distinguish "refund initiated," "refund processed by provider," "refund credited status unknown," and "refund completed" rather than marking a refund as customer-received merely because the provider accepted it.
- **FR-089**: System MUST apply product-specific entitlement-revocation rules on refund: membership access ends, course access revoked, certificate status reviewed, download access disabled, mentor session credit removed, AI credits reversed, reward points reversed, community badge adjusted if required — while historical learning/transaction records need not be deleted.
- **FR-090**: System MUST support a Platform Wallet holding promotional credits, refund credits, mentor-session credits, gift credits, and adjustment credits, and MUST clearly communicate that wallet balance is not necessarily withdrawable money.
- **FR-091**: System MUST record every wallet transaction (credit issued, purchase debit, refund, expiry, reversal, admin adjustment, promotional grant, gift redemption) as an immutable, individually referenceable ledger entry, and MUST track wallet balance types: available, reserved, pending, expiring, expired, reversed.
- **FR-092**: System MUST define wallet credit rules with credit amount, currency, source, eligible products, minimum spend, maximum usage, expiry, transferability, refundability, and combination rules.
- **FR-093**: System MUST support optional Reward Point payment integration (per Volume 06) with a versioned conversion rate, maximum redeemable percentage, eligible products, minimum points, expiry, refund restoration, fraud check, tax-treatment review, and a cash-equivalent disclaimer; XP MUST NOT be redeemable for payment.
- **FR-094**: System MUST support coupon types: percentage discount, fixed discount, free trial extension, free product, buy-one-get-one, shipping discount (physical products), membership upgrade discount, first-order discount, renewal discount, category discount, referral coupon, affiliate coupon, and organization coupon.
- **FR-095**: System MUST store every Coupon with coupon ID, code, name, description, discount type/value, currency, applicable products/plans/billing periods, minimum amount, maximum discount, start/end dates, global usage limit, per-user limit, new-user-only flag, first-purchase-only flag, auto-apply flag, stackable flag, status, campaign, and funding owner.
- **FR-096**: System MUST enforce coupon code hygiene: configurable case-insensitive normalization, whitespace trimming, unique active code, secure unguessable bulk codes where needed, no offensive words, expiry, redemption logging, and rate limiting.
- **FR-097**: System MUST validate coupon eligibility against customer, product, plan, billing period, country, currency, date, order amount, previous use, user segment, referral, affiliate, campaign budget, subscription state, and payment method where applicable.
- **FR-098**: System MUST enforce a centrally defined coupon-stacking policy (no stacking, coupon plus wallet, coupon plus reward points, platform plus affiliate discount, or multiple discounts with priority) with a centrally defined discount calculation order.
- **FR-099**: System MUST support auto-applied promotions (e.g., seasonal sale, member upgrade offer, annual plan discount, organization bulk discount) and MUST explain the applied promotion and its expiry at checkout.
- **FR-100**: System MUST enforce promotion budget controls: maximum total discount, maximum redemptions, daily budget, per-user value, affiliate allocation, funding source, alert threshold, and auto-disable when exhausted.
- **FR-101**: System MUST support gift memberships through the flow: purchaser selects plan and duration, enters recipient email/mobile, adds message, chooses delivery date, pays, a gift code/invitation is generated, the recipient accepts, existing-account conflicts are handled, and membership starts per policy — tracked through statuses Purchased, Scheduled, Delivered, Viewed, Accepted, Expired, Cancelled, Refunded, and subject to restrictions on region, currency, plan, existing subscription, transfer, expiry, pre-redemption refund, post-redemption non-refundability (per policy), and fraud monitoring.

### Referral Program Requirements

- **FR-102**: System MUST reward existing users for eligible new-user actions (registration, email verification, first paid purchase, subscription active after refund window, course completion, organization signup), with financial rewards normally depending on a verified paid action rather than registration alone.
- **FR-103**: System MUST execute the referral flow: link/code delivered, new user opens it, attribution stored, new user registers, eligibility checked, qualified purchase occurs, refund window passes, reward becomes approved, referrer and referred-user benefits issued, analytics recorded.
- **FR-104**: System MUST store a Referral record with program, referrer, referral code, referred user, click, signup, qualified action, reward, status, attribution dates, fraud status, and expiry, tracked through status values: Clicked, Registered, Verification pending, Qualified action pending, Qualified, Reward pending, Reward approved, Reward issued, Rejected, Reversed, Fraud review.
- **FR-105**: System MUST apply referral attribution rules covering attribution window, first-click vs. last-click, existing-user exclusion, self-referral prevention, device/account signals, cookie and server-side tracking, referral-code precedence, affiliate-conflict resolution, and consent/privacy compliance.
- **FR-106**: System MUST restrict referral rewards to wallet credit, reward points, membership days, course access, discount coupon, mentor credit, or event ticket — cash payout MUST be limited to the approved affiliate-type program only.
- **FR-107**: System MUST evaluate referral fraud signals (same person multiple accounts, same payment method, same bank account, same device cluster, disposable email, refund-after-reward, circular referrals, automated registrations, suspicious IP pattern, organization-internal abuse) and MUST NOT let any single privacy-sensitive signal alone drive a final fraud decision.

### Affiliate Program Requirements

- **FR-108**: System MUST support an affiliate program for external creators, mentors, instructors, community/corporate partners, agencies, media partners, campus ambassadors, regional partners, and strategic partners.
- **FR-109**: System MUST capture an affiliate application with legal/individual name, public name, email, mobile, website, social profiles, audience, promotion methods, expected traffic, country, tax details, payout details, agreement acceptance, identity verification, and content-category disclosure.
- **FR-110**: System MUST track affiliate application status through Draft, Submitted, Under review, Verification required, Changes requested, Approved, Rejected, Suspended, Terminated, Archived.
- **FR-111**: System MUST maintain an Affiliate Profile with affiliate ID, code, type, status, commission plan, attribution window, approved products, approved channels, coupon codes, links, payout account, tax profile, manager, and risk level.
- **FR-112**: System MUST let affiliates generate homepage, plan, course, event, campaign, and custom approved deep links containing signed or validated attribution parameters, and MUST prevent open-redirect vulnerabilities in link handling.
- **FR-113**: System MUST apply affiliate attribution rules covering cookie window, server-side attribution, first-click, last-click, coupon attribution, cross-device limitations, direct-user override, existing-customer rules, recurring-commission eligibility, and affiliate/referral conflict — and MUST snapshot the attribution rule version at transaction time.
- **FR-114**: System MUST support affiliate commission types: percentage of net sale, fixed amount, tiered commission, product-specific commission, first-payment-only, recurring commission, lifetime-customer commission (where approved), performance bonus, and campaign bonus.
- **FR-115**: System MUST support configurable commission calculation bases (gross amount, net of tax, net of discount, net of refunds, net of payment fee, collected revenue) with the exact basis clearly stated in configuration and the affiliate agreement.
- **FR-116**: System MUST run the affiliate commission lifecycle: attributed order paid, commission calculated, commission pending, refund/dispute window, fraud checks, commission approved, payout eligible, payout processed, commission paid, reversal on later chargeback per terms — tracked through status values Estimated, Pending, Approved, On hold, Payable, Scheduled, Paid, Rejected, Reversed, Disputed.
- **FR-117**: System MUST provide an affiliate dashboard showing clicks, signups, customers, orders, conversion rate, gross sales, refunds, commission pending/approved/paid, payout date, top products, links, coupons, creative assets, reports, and support access.
- **FR-118**: System MUST provide an affiliate creative library (logos, banners, social posts, videos, email templates, product descriptions, campaign guides, brand rules), and affiliates MUST NOT be able to modify provided claims into misleading guarantees.
- **FR-119**: System MUST enforce affiliate payout requirements: minimum threshold, approval, KYC where required, tax information, bank details, payout schedule, statement, failure handling, and reconciliation — and MUST keep affiliate payouts in a separate ledger category from mentor payouts even if sharing infrastructure.
- **FR-120**: System MUST prohibit and be able to detect affiliate policy violations: unauthorized self-referrals, trademark bidding without permission, misleading claims, fake scarcity, spam, cookie stuffing, forced redirects, unapproved incentivized traffic, false reviews, impersonation, unauthorized coupon sites, and fraudulent transactions.
- **FR-121**: System MUST support affiliate suspension that blocks new attribution, disables or unattributes links, holds pending commission, triggers payout review, allows appeal, is audited, and handles existing-customer commission per the affiliate's agreement.

### Organization & Enterprise Billing Requirements

- **FR-122**: System MUST support an Organization Billing account with legal entity, billing contacts, tax profile, billing owner, payment method, contract, seats, subscription, purchase orders, invoices, credit limit, and payment terms.
- **FR-123**: System MUST support per-seat billing models (fixed seat count, active-seat billing, minimum commitment, tiered volume, annual true-up, monthly adjustment) and MUST produce clear proration and an audit record for any seat-count change.
- **FR-124**: System MUST let the organization billing owner view purchased/assigned seats, invite a member, remove a member, transfer a seat, buy additional seats, schedule a reduction, and view usage — and removing a seat MUST NOT delete the member's personal account.
- **FR-125**: System MUST support Purchase Orders with PO number, PO document, customer approval, invoice matching, payment terms, partial payment, outstanding balance, and collection status.
- **FR-126**: System MUST support approved-organization credit terms (Net 7, Net 15, Net 30, custom) with credit approval, credit limit, aging tracking, collection reminders, account hold, finance override, and audit.
- **FR-127**: System MUST track Accounts Receivable status (invoice issued, due, partially paid, paid, overdue, disputed, written off) with aging buckets: current, 1–30, 31–60, 61–90, and 90+ days.
- **FR-128**: System MUST support Custom Orders for enterprise/negotiated sales with customer, products, custom price, discount, tax, contract reference, payment schedule, sales owner, approval, quote, invoice, entitlements, and notes, requiring approval for custom discounts above a defined threshold.
- **FR-129**: System MUST support Quotations with quote number, customer, validity, products, quantity, price, discount, tax estimate, payment terms, delivery terms, contract conditions, and status (Draft, Sent, Viewed, Accepted, Rejected, Expired, Converted to order).

### Financial Ledger & Revenue Requirements

- **FR-130**: System MUST represent every financial balance (charges, payments, refunds, credits, debits, commissions, taxes, settlements, adjustments, payouts, reversals) as append-only ledger entities rather than a single mutable balance field.
- **FR-131**: System MUST store every Financial Ledger Entry with entry ID, account, transaction type, debit, credit, currency, amount, reference entity, effective date, created date, source, reversal reference, metadata, and audit actor, using a double-entry-ready design.
- **FR-132**: System MUST maintain a finance-approved chart of ledger accounts including cash clearing, payment provider receivable, customer payments, sales revenue, deferred revenue, taxes payable, refund liability, wallet liability, reward liability, mentor payable, affiliate payable, instructor payable, payment fees, discounts, chargeback loss, bad debt, and adjustments.
- **FR-133**: System MUST snapshot price, tax rate, coupon, product description, plan terms, commission rate, and currency into the order/transaction record at the time of the transaction, and future configuration changes MUST NOT retroactively modify historical transactions.
- **FR-134**: System MUST store enough data to support revenue recognition schedules (immediate for delivered one-time digital items, over subscription period, on event completion, on mentor-session completion, over course-access period where required, milestone-based for enterprise delivery), with final accounting treatment subject to qualified-accountant approval.
- **FR-135**: System MUST track deferred revenue for prepaid services (collected cash, tax, deferred revenue, recognized-revenue schedule, refund adjustment, cancellation adjustment) and MAY export schedules to accounting software.
- **FR-136**: System MUST support revenue allocation across bundle items using stated price, relative standalone selling price, fixed internal allocation, or a finance-approved method, with the allocation snapshot stored on the order.
- **FR-137**: System MUST support multi-party revenue splitting for mentor sessions, instructor-led courses, partner events, and marketplace products into seller earning, platform commission, taxes, payment fees, affiliate commission, refund reserve, and withholding tax where applicable.
- **FR-138**: System MUST import and store payment-provider settlement data (settlement ID, period, gross collections, refunds, chargebacks, fees, tax on fees, adjustments, net settlement, bank reference, settlement date, status).
- **FR-139**: System MUST reconcile internal successful payments, provider payments, refunds, provider fees, chargebacks, and bank deposits against settlement amounts, and MUST classify mismatches as missing internally, missing at provider, amount mismatch, currency mismatch, duplicate, refund mismatch, fee mismatch, or bank mismatch.
- **FR-140**: System MUST run the reconciliation workflow: import provider report, match by transaction reference, auto-match, flag mismatch, finance review, create adjustment if approved, resolve, lock period, export report.
- **FR-141**: System MUST support a financial period-close workflow: reconciliation complete, pending mismatches reviewed, refunds captured, payouts recorded, tax report generated, revenue schedule generated, adjustments approved, period locked, reports exported — and changes to a locked period MUST require a controlled reopening process.
- **FR-142**: System MUST generate the defined finance/growth reports (sales, order, payment, refund, tax, GST summary, invoice register, credit-note register, subscription, MRR, churn, deferred revenue, revenue recognition, settlement, reconciliation, chargeback, wallet liability, coupon usage, referral, affiliate commission, affiliate payout, mentor payable, instructor payable, accounts receivable, aging) with export to CSV, XLSX, PDF summary, and accounting-system integration, generating large reports asynchronously with status.

### Refund/Chargeback/Dispute Requirements

- **FR-143**: System MUST run the chargeback lifecycle: notification received, evidence deadline tracked, order identified, entitlement reviewed, evidence collected, response submitted, outcome recorded (won/lost), fee recorded, and commission reversed where applicable.
- **FR-144**: System MUST assemble chargeback evidence from payment authentication, terms acceptance, login records, course usage, session attendance, delivery confirmation, communication, refund policy, and invoice data, sharing only the minimum necessary data.
- **FR-145**: System MUST support a customer payment-dispute workflow (duplicate charge, wrong amount, unauthorized payment, product not received, refund not received, unexpected renewal, invoice issue, other) that enables resolution before escalation to a provider chargeback.
- **FR-146**: System MUST evaluate fraud signals (payment velocity, multiple failed payments, device mismatch, account age, high-value first order, coupon abuse, referral abuse, affiliate self-purchase, payment-country mismatch, repeated refunds, chargeback history, bot activity) and apply corresponding actions: allow, require additional verification, hold fulfilment, manual review, block payment method, block coupon, reject transaction, or suspend account.
- **FR-147**: System MUST provide a fraud-review interface showing order, customer history, payment attempts, device signals, coupon/referral, affiliate, risk reason, previous refunds, and access activity, with sensitive payment data masked.

### Dark-Pattern Prevention Requirements

- **FR-148**: System MUST show, before checkout payment is collected, product/plan name, billing period, base amount, discount, coupon discount, taxes, processing/platform fee if applicable, credits applied, reward points applied, final payable amount, renewal amount, renewal date, cancellation conditions, and refund eligibility, with no hidden fees.
- **FR-149**: System MUST grant entitlement only after trusted provider webhook, server-to-server verification, valid order match, correct amount, correct currency, idempotency validation, fraud validation, and payment-status confirmation — a client-rendered payment-success screen alone MUST NOT grant entitlement.
- **FR-150**: System MUST let users independently view their plan, download invoices, manage payment methods, view renewal status, upgrade, downgrade, cancel, request a refund, and contact support without undue friction.
- **FR-151**: System MUST NOT hide the cancellation path, preselect paid add-ons, create fake countdowns, conceal renewal terms, misleadingly display discounts, or activate a subscription without explicit user consent.
- **FR-152**: System MUST enforce dual approval on configurable high-risk finance actions (large refund, manual payment, payout, commission adjustment, invoice void, credit-note issue, write-off, plan-price migration, tax-rate change, settlement override), and a requester MUST NOT be able to approve their own action where separation-of-duty applies.

## Key Entities *(include if feature involves data)*

- **Product**: Any sellable item (membership, course, event ticket, mentor session, ebook, AI credits, etc.) with catalog metadata, pricing model, tax category, fulfilment method, and lifecycle status; owned by a seller/revenue owner.
- **Product Price**: A versioned price record tied to a product (currency, unit amount, billing interval, trial period, effective window); immutable once published — changes create a new version.
- **Plan / Plan Version**: A membership tier bundling features, entitlements, limits, billing periods, and policies (trial, upgrade/downgrade, cancellation, grace period); versioned for migration control.
- **Plan Entitlement**: A specific capability or limit granted by a plan (community access, AI quota, mentor discount, seats, storage, etc.), typed as boolean/numeric/credit/percentage/content-scope/role/time-limited/usage-reset/seat/region.
- **Subscription / Subscription Item / Subscription Schedule / Subscription Change**: The customer's active relationship to a plan/price, its billing cycle state machine, and the record of any upgrade/downgrade/pause/resume/migration applied to it.
- **Trial**: A time-boxed, eligibility-checked pre-paid-conversion state attached to a subscription.
- **Billing Account / Billing Profile**: The paying entity (individual or organization) and its billing details, tax profile, and payment terms.
- **Payment Method Token**: A tokenized, provider-issued reference to a saved payment instrument; never raw card data.
- **Cart / Cart Item**: The pre-checkout selection of products/prices/quantities/coupons, subject to validation before order creation.
- **Order / Order Item**: The immutable-once-finalized record of what was purchased, at what price/tax/discount, and its fulfilment/refund state; the unit of financial truth for a transaction.
- **Payment / Payment Attempt / Payment Provider Event / Payment Mandate**: The record of money movement attempts, their normalized status, the raw provider webhook events that drove state transitions, and any recurring-debit authorization.
- **Invoice / Invoice Item**: The legal GST-compliant tax document for a transaction, sequentially numbered and immutable once issued.
- **Receipt**: The payment-confirmation document, distinct from the tax invoice.
- **Credit Note**: The only mechanism for reducing/correcting an issued invoice's value (refund, correction, cancellation).
- **Tax Profile / Tax Rule / Tax Calculation**: Customer tax identity (GSTIN, place of supply, exemption) and the computed/snapshotted tax applied to a transaction.
- **Refund / Refund Item**: A request/record of money or credit returned to a customer, bounded by the order's refundable balance.
- **Wallet / Wallet Ledger Entry**: The platform's non-withdrawable internal credit balance and its append-only transaction history.
- **Coupon / Promotion / Coupon Redemption**: A discount rule, its eligibility/stacking/budget configuration, and each individual usage record.
- **Gift**: A purchased membership intended for a recipient, with its own delivery/acceptance lifecycle.
- **Referral Program / Referral Attribution / Referral Reward**: The non-cash, existing-user-facing growth-reward mechanism and its fraud-checked attribution chain.
- **Affiliate / Affiliate Link / Affiliate Attribution / Affiliate Commission / Affiliate Payout**: The external-partner commission-based promotion mechanism, its tracked links, attributed conversions, calculated/approved commissions, and scheduled payouts.
- **Quote / Custom Order**: Enterprise/negotiated-sale pre-order artifacts that convert into an Order.
- **Installment Plan / Installment**: A structured multi-payment schedule against a single purchase.
- **Settlement / Reconciliation Record**: Provider-reported payout batches and the matching/mismatch record against internal transactions.
- **Chargeback**: A customer-bank-initiated payment reversal with its own evidence/response lifecycle, distinct from a platform refund.
- **Financial Ledger Entry**: The atomic, append-only, double-entry-ready unit of all financial bookkeeping (charges, refunds, commissions, taxes, adjustments, payouts, reversals).
- **Revenue Schedule**: The recognition timeline for revenue collected but not yet fully earned (deferred revenue).
- **Adjustment**: A manually created, reason-and-approver-tracked correction to a financial record.
- **Approval Request**: The dual-approval workflow instance for a high-risk finance action.
- **Finance Audit Log**: The immutable record of all administrative and financial actions taken in the module.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of checkout summaries shown to a user (base amount, discount, tax, final payable amount, renewal amount/date) match the amount actually charged and the amount recorded on the resulting order, with zero tolerance for undisclosed fees.
- **SC-002**: 0% of entitlement grants occur without a corresponding trusted, verified payment/webhook record — every entitlement grant is traceable to a specific verified payment event.
- **SC-003**: Duplicate checkout submissions (double-click, network retry) using the same idempotency key result in exactly one order and one charge, 100% of the time.
- **SC-004**: 100% of applicable completed orders produce a GST-compliant invoice with a unique, sequential, financial-year-aware invoice number, and 0% of issued invoices are directly overwritten (all corrections trace to a credit note and/or revised invoice).
- **SC-005**: 100% of refunds processed are less than or equal to the order's remaining refundable balance, with entitlement adjustment occurring only after provider-confirmed refund verification.
- **SC-006**: Dunning recovery brings a defined percentage of "past due" subscriptions back to "active" within the configured grace period before suspension/cancellation (baseline target to be set by finance/growth once retry-schedule data exists) — tracked continuously via the dunning-recovery metric.
- **SC-007**: 100% of duplicate webhook event deliveries (same event ID) are detected and produce no additional entitlement grant, extension, or ledger entry beyond the first successful processing.
- **SC-008**: Every financial period reconciliation identifies and categorizes 100% of settlement mismatches (amount, currency, missing, duplicate, fee, bank) prior to period lock; no period is locked with unresolved, uncategorized mismatches.
- **SC-009**: 100% of high-risk finance actions in the configured dual-approval list (large refund, manual payment, payout, commission adjustment, invoice void, credit-note issue, write-off, plan-price migration, tax-rate change, settlement override) are blocked from same-user self-approval.
- **SC-010**: 100% of referral rewards and affiliate commissions with a "cash-equivalent or wallet" payout are held until their configured refund/dispute window has passed and fraud checks clear before being marked approved/payable.

## Assumptions

- This feature (Volume 09) is the **entitlement source of truth** for the whole platform: the LMS (Volume 04, course/plan-gated access), Events (Volume 07/10, mentor session credits and event ticket purchases), Marketplace (Volume 11, digital-product purchases and vendor commissions), and Jobs (Volume 12, paid job-posting/features where applicable) are all expected to consume entitlement and payment state from this module rather than maintaining their own parallel truth. Those volumes' specs should reference this module's Entitlement, Order, and Subscription entities rather than re-defining them.
- Per Volume 06 (Gamification), gamification XP is explicitly **not** redeemable for cash or payment; only Reward Points (a separate ledger from XP) may optionally be used toward payment per FR-093, subject to conversion-rate, percentage-cap, and fraud rules. This spec does not redefine the points/XP ledger itself, which is owned by Volume 06.
- Mentor and instructor payout infrastructure may be shared with affiliate payout infrastructure, but per FR-119 they are kept in separate ledger categories; the detailed mentor/instructor payout business rules belong to Volume 07 (Mentor Marketplace), and this spec only defines the shared multi-party revenue-split and ledger mechanics that Volume 07 must plug into.
- The primary market and initial currency is India/INR with GST-based tax logic; multi-currency and international tax engines are explicitly out of scope for the initial release (P2 in source MVP tiers) and are called out in the source as requiring future, finance-approved architecture.
- Final tax logic, chart of accounts, invoice numbering scheme, and revenue-recognition treatment all explicitly require sign-off from qualified finance/tax professionals per the source text; this spec defines the required data/workflow shape but does not itself constitute approved tax/accounting policy.
- The specific payment gateway/provider(s) to integrate against are not named in the source (architecture is described as "payment-provider-independent"); provider selection is a plan.md/implementation decision, not a spec-level one. [NEEDS CLARIFICATION: which specific payment provider(s) — e.g., Razorpay, Cashfree, PayU — are targeted for the India launch, since provider-specific webhook/mandate/EMI capabilities affect what is actually implementable]
- The source describes retention offers, dunning schedules, grace-period durations, and pause limits as "configurable" / "policy-defined" without specifying exact default values (e.g., exact retry days, exact grace-period length, exact dual-approval monetary threshold). [NEEDS CLARIFICATION: what are the actual default numeric values for grace-period length, dunning retry schedule, pause limits, and dual-approval thresholds — these are described only as "configurable" in the source]
- The source does not specify which specific field(s) constitute the "high-value order" or "large refund" threshold that triggers dual approval. [NEEDS CLARIFICATION: exact monetary threshold(s) for dual-approval triggers]
- App-store (iOS/Android) in-app-purchase billing rules are noted in the source as needing review "before implementation" for applicable digital products; this spec treats mobile purchase flows as needing that review but does not resolve app-store billing policy conflicts itself. [NEEDS CLARIFICATION: for which specific product types (subscriptions vs. one-time digital goods vs. physical/service products) will app-store billing rules force a different payment path on mobile vs. web]
- Cross-border/export customer tax treatment is mentioned only at the level of "export or international customer treatment" and "reverse-charge scenarios where applicable" without further detail, consistent with the India-first initial scope; full international tax handling is deferred to the P2 multi-currency/international-payments expansion.
- Volume 14 (Enterprise Marketing Platform) is expected to consume this module's referral/affiliate/coupon/attribution data for its own broader marketing-attribution and revenue-operations chapters (e.g., planned features 030 referral-affiliate-partner-marketing, 048 revenue-operations); this spec defines the transactional/financial source of truth, while cross-cutting marketing-attribution analytics belong to those later specs.
