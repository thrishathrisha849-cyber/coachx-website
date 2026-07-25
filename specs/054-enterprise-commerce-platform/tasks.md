---
description: "Task list for Feature 054 — Enterprise Commerce Platform: Catalog, Pricing & Order Management"
---

# Tasks: Enterprise Commerce Platform: Catalog, Pricing & Order Management

**Input**: Design documents from `/specs/054-enterprise-commerce-platform/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 011, 009, 001/016, and the not-yet-planned 071/056), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC). This feature also assumes `011`'s Marketplace Order/Suborder/Earning/Payout state machines and `009`'s Subscription entity/payment-gateway/tax-engine infrastructure exist as consumption points.

**Tests**: Included throughout — catalog publish-gating, price-change human-approval, and order price/tax/coupon immutable snapshotting each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-002, and SC-003.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (Promotion Center remainder; Cart core; Payment Security remainder; Billing/Invoice; Workflow Automation; Portal core).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC), and that `011`'s Marketplace Order/Commission/Payout state machines and `009`'s Subscription/payment-gateway/tax-engine infrastructure exist as consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: the Article-II-vs-autonomous-commerce-agents conflict (plan.md §7), mid-checkout price-change communication, proration-vs-active-coupon interaction (also relevant to `009`), fraud-hold false-positive escalation path, webhook-delay duplicate-charge prevention, coupon-expiry-mid-checkout handling, archived-product-in-open-subscription/draft-order handling, refund price/tax snapshot-vs-current-config, concurrent-pricing-rule-edit conflict resolution, PO-payment-terms-past-renewal-date handling (also relevant to `009`)
- [ ] T003 [P] Add `backend/src/modules/commerce/{commerce-lifecycle-architecture,product-catalog-pim,pricing-center,promotion-coupon-management,ai-product-commerce-intelligence,order-management-system,shopping-cart-management,checkout-payment-orchestration,payment-security-compliance,subscription-commerce,billing-invoice-management,commerce-workflow-automation,commerce-portal-analytics}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Product Catalog Entry` entity in `backend/src/modules/commerce/product-catalog-pim/product-catalog-entry.entity.ts`
- [ ] T005 [P] Define the `Product Variant` entity in `backend/src/modules/commerce/product-catalog-pim/product-variant.entity.ts`
- [ ] T006 [P] Define the `Price Rule` entity in `backend/src/modules/commerce/pricing-center/price-rule.entity.ts`
- [ ] T007 [P] Define the `Promotion` entity in `backend/src/modules/commerce/promotion-coupon-management/promotion.entity.ts`
- [ ] T008 [P] Define the `Discount / Coupon` entity in `backend/src/modules/commerce/promotion-coupon-management/discount-coupon.entity.ts`
- [ ] T009 [P] Define the `Shopping Cart` entity in `backend/src/modules/commerce/shopping-cart-management/shopping-cart.entity.ts`
- [ ] T010 [P] Define the `Order` entity (deferring to `011`'s canonical schema for marketplace transactions) in `backend/src/modules/commerce/order-management-system/order.entity.ts`
- [ ] T011 [P] Define the `Payment Token` entity in `backend/src/modules/commerce/checkout-payment-orchestration/payment-token.entity.ts`
- [ ] T012 [P] Define the `Subscription` reference entity (orchestration layer over `009`'s canonical entity, not a new model) in `backend/src/modules/commerce/subscription-commerce/subscription-reference.entity.ts`
- [ ] T013 [P] Define the `Invoice` entity in `backend/src/modules/commerce/billing-invoice-management/invoice.entity.ts`
- [ ] T014 [P] Define the `Commerce Workflow` entity in `backend/src/modules/commerce/commerce-workflow-automation/commerce-workflow.entity.ts`
- [ ] T015 [P] Define the `AI Commerce Recommendation` entity in `backend/src/modules/commerce/ai-product-commerce-intelligence/ai-commerce-recommendation.entity.ts`
- [ ] T016 Unified digital commerce ecosystem for products/services/pricing/promotions/subscriptions/orders/invoices/revenue/fulfillment/renewals/AI intelligence (FR-001)
- [ ] T017 B2B and B2C commerce support through scalable, cloud-native architecture (FR-002)
- [ ] T018 Implement the standardized 17-stage Enterprise Commerce lifecycle (Product Creation→Revenue Recognition) (FR-003)
- [ ] T019 Configurable workflows/approvals/automation/AI recommendations/SLA monitoring/audit history at every lifecycle stage (FR-004)
- [ ] T020 Integration with external ERP/accounting/manufacturing/inventory-ERP/tax-engine/logistics systems via secure APIs rather than replacement (FR-005)
- [ ] T021 Note: Order/Payment/Commission/Payout for marketplace transactions remain owned by `011`; this feature reuses that data model rather than defining a second, competing order schema (per plan.md §1)
- [ ] T022 Note: the Subscription entity, billing-cycle state machine, proration, and dunning/grace-period mechanics remain owned by `009`; this feature's Subscription Commerce Management section orchestrates on top of `009`'s existing entity (catalog linkage, enterprise seat management, AI intelligence) rather than building a second lifecycle (per plan.md §2)
- [ ] T023 Note: payment gateway integration and GST/tax calculation reuse `009`'s existing infrastructure; commerce-specific role names (Pricing Manager, Catalog Manager, Commerce Operations Manager) configure `001`'s/`016`'s layered RBAC rather than a separate role system (per plan.md §3-§4)
- [ ] T024 Note: reconciliation with not-yet-planned `071` (partner/marketplace commerce) is deferred until `071` is authored (per plan.md §5)
- [ ] T025 Note: inventory/warehouse management for physical products is deferred to a separate, not-yet-planned inventory/WMS feature (likely `056`); this feature covers only the catalog's Inventory Status attribute and AI inventory recommendations (per plan.md §6)
- [ ] T026 Note: the source's later-roadmap "Autonomous Commerce Ecosystem" material conflicts with Constitution Article II and is treated as out of scope pending a future constitutional amendment (per plan.md §7)
- [ ] T027 Contract test: 100% of published products pass through the Review/Approval stages with zero products reaching Published without them, in `backend/tests/contract/catalog-zero-publish-without-review-approval.contract.test.ts` (FR-011, SC-001)
- [ ] T028 Contract test: 100% of live price changes above the configured approval threshold are traceable to a specific human/executive approval record with zero unapproved AI-recommended price changes applied, in `backend/tests/contract/price-change-requires-human-approval-zero-autonomous-application.contract.test.ts` (FR-020/FR-021, SC-002)
- [ ] T029 Contract test: 0% of orders reflect a price/tax/coupon value different from what was snapshotted at purchase time, even after later catalog/pricing configuration changes, in `backend/tests/contract/order-price-tax-coupon-immutable-snapshot.contract.test.ts` (FR-022, SC-003)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Catalog Manager Publishes a Product Through PIM (Priority: P1) 🎯 MVP

**Independent Test**: Create a product in PIM, run it through the approval lifecycle, and confirm it appears correctly (with full attribute/version history) in the published catalog.

- [ ] T030 [US1] Centralized, AI-powered product catalog as single source of truth across 10 offering types, wired to T004 (FR-006)
- [ ] T031 [US1] Unlimited, configurable hierarchical categorization without software updates (FR-007)
- [ ] T032 [US1] Product full field set (Product ID, SKU, name, description, category, brand, pricing, inventory status, tax category, SEO metadata, AI metadata, audit history, etc.) (FR-008)
- [ ] T033 [US1] Unlimited product variants (size, color, language, duration, tier, license type, region, bundle/enterprise version) with independent pricing/availability/inventory/analytics, wired to T005 (FR-009)
- [ ] T034 [US1] 10 defined product-relationship types (parent/child, related, recommended, FBT, upgrade, downgrade, cross-sell, upsell, replacement, accessory, bundle-component) (FR-010)
- [ ] T035 [US1] 9-stage governed product lifecycle (Draft→Retired) with approval workflows, audit logs, timestamps, version history, wired to acceptance scenarios 1–2 (FR-011)
- [ ] T036 [US1] PIM layer centralizing product data, digital assets, technical specifications, pricing attributes, multilingual content, compliance information, distribution-channel data (FR-012)
- [ ] T037 [US1] PIM capabilities (attribute/category/media/translation management, version control, data validation, workflow/approval, bulk updates, import/export, API distribution) (FR-013)
- [ ] T038 [US1] Unlimited-language support with localized pricing/images/descriptions/SEO/regulatory content, AI translation suggestions, and a human review workflow before publication, wired to acceptance scenario 4 (FR-014)
- [ ] T039 [US1] Continuous product data-quality monitoring with a Publishing Readiness Score, wired to acceptance scenario 3 (FR-015)
- [ ] T040 [US1] AI-assisted description generation, SEO optimization, image tagging, missing-attribute detection, classification, and duplicate detection as advisory PIM tooling, not automatic publication (FR-016)
- [ ] T041 [P] [US1] Product Catalog & PIM UI
- [ ] T042 [US1] Integration test: a submitted-for-review product enters the Review stage with an audit entry, an approved product transitions to Scheduled/Published with an audit trail, an incomplete published product is flagged with a Publishing Readiness Score and specific warnings, a multilingual product update tracks per-language translation completeness without silently overwriting other variants — all 4 acceptance scenarios in `backend/tests/integration/us1-catalog-pim-publish.integration.test.ts`

**Checkpoint**: The foundation every other commerce capability (pricing, promotions, cart, orders, subscriptions) depends on is independently functional.

---

## Phase 4: User Story 2 — AI Dynamic Pricing Recommendation Requires Human Approval (Priority: P1)

**Independent Test**: Trigger an AI pricing recommendation on a test product, verify it is held in a pending-approval state with a visible confidence score, and confirm the price only changes in the live catalog after an authorized human approves it.

- [ ] T043 [US2] 12 pricing models (fixed, variable, dynamic, subscription, usage-based, tiered, volume, bundle, geographic, enterprise, promotional, personalized), wired to T006 (FR-017)
- [ ] T044 [US2] Pricing-rule evaluation against 11 condition types plus AI recommendations as an additional input (FR-018)
- [ ] T045 [US2] Per-product full pricing field set (base, discount, promotional, wholesale, retail, partner, enterprise price, tax, shipping, platform fees, service charges, currency conversion) (FR-019)
- [ ] T046 [US2] Price-approval workflow including Executive Approval, plus audit trail, version history, effective/expiration dates, pricing simulation, and rollback, wired to T028's contract test, acceptance scenarios 2–3 (FR-020)
- [ ] T047 [US2] AI dynamic pricing suggestions (revenue optimization, price elasticity, competitor insights, discount optimization, margin analysis, customer value prediction, personalized pricing) as advisory requiring human/role-gated approval, wired to acceptance scenario 1 (FR-021)
- [ ] T048 [US2] Price/tax/discount snapshot at order placement, immune to later catalog/pricing configuration changes, wired to T029's contract test (FR-022)
- [ ] T049 [P] [US2] Pricing Center & Approval UI
- [ ] T050 [US2] Integration test: an AI pricing suggestion is displayed advisory-only with confidence score and rationale and no automatic price change, a threshold-exceeding change requires Executive Approval before taking effect, a scheduled approved price update applies automatically with the prior price in version history, a rejected change is logged for AI-quality monitoring while the live price remains unchanged — all 4 acceptance scenarios in `backend/tests/integration/us2-ai-dynamic-pricing.integration.test.ts`

**Checkpoint**: The mission-critical, non-negotiable control tied directly to Constitution Article II is independently functional.

---

## Phase 5: User Story 3 — AI Recommends a Personalized Bundle or Subscription Upgrade (Priority: P2)

**Independent Test**: Place a product with defined bundle/cross-sell relationships or an active subscription into a test scenario, confirm a relevant AI recommendation is generated and surfaced with an explainable rationale, and confirm the customer's cart/subscription updates correctly if they accept it.

- [ ] T051 [US3] AI-driven product classification, personalized catalogs, demand forecasting, sales prediction, dynamic-pricing input, popularity analysis, preference detection, inventory recommendations, wired to T015 (FR-031)
- [ ] T052 [US3] Product performance monitoring (best-sellers, low performers, growth, ratings/reviews, revenue contribution, conversion rate, return rate, subscription growth, market demand) (FR-032)
- [ ] T053 [US3] AI recommendation types (similar, complementary, upsell, cross-sell, premium alternatives, personalized bundles, subscription upgrades, loyalty offers, seasonal, trending), wired to acceptance scenarios 1–2 (FR-033)
- [ ] T054 [US3] Explainable/configurable/role-aware/continuously-monitored/fully-auditable requirement on every AI-generated commerce recommendation, wired to acceptance scenario 3 (FR-034)
- [ ] T055 [US3] Cart intelligence (frequently bought together, recently viewed, related products, personalized recommendations, availability, subscription suggestions, loyalty benefits, delivery estimates, promotion suggestions, cross-sell opportunities), wired to T009 (FR-042)
- [ ] T056 [P] [US3] AI Bundle/Subscription-Upgrade Recommendation UI
- [ ] T057 [US3] Integration test: an item with "Frequently Bought Together" relationships surfaces a bundle recommendation with an AI rationale, a high-engagement subscription health score generates an upgrade recommendation presented rather than auto-applied, a declined recommendation is not repeatedly re-surfaced in a way that constitutes a dark pattern — all 3 acceptance scenarios in `backend/tests/integration/us3-ai-bundle-subscription-recommendation.integration.test.ts`

**Checkpoint**: The layer driving average order value and recurring revenue is independently functional.

---

## Phase 6: User Story 4 — Order Management System Processes an Order End-to-End (Priority: P1)

**Independent Test**: Place a single test order from checkout through to Delivered status, confirming each lifecycle-stage transition is recorded with a timestamp and audit entry, and that an invoice is generated referencing the order.

- [ ] T058 [US4] Complete order-lifecycle management across 7 product types accepting orders from 11 channels, wired to T010 and T021's `011`-reuse note (FR-035)
- [ ] T059 [US4] 13 order types (digital, physical, subscription, membership, bundle, enterprise, renewal, upgrade, cross-sell, upsell, trial, gift, partner, bulk) (FR-036)
- [ ] T060 [US4] 12-stage configurable order lifecycle (Draft→Archived) with timestamps, responsible users, approval history, event logs, audit records, wired to acceptance scenarios 1–2 (FR-037)
- [ ] T061 [US4] Order Record full field set (customer, billing/shipping, products, quantities, pricing, discounts, coupons, taxes, shipping charges, payment method, transaction ID, subscription details, status, delivery status, invoice reference, refund history, audit trail), wired to acceptance scenario 4 (FR-038)
- [ ] T062 [P] [US4] Order Management Timeline UI
- [ ] T063 [US4] Integration test: payment authorization transitions Payment Pending→Payment Authorized→Order Confirmed each audit-logged, a multi-line-item partial shipment reflects Partially Fulfilled status, a post-authorization cancellation moves to Cancelled/Refunded with a linked refund audit trail, a queried order displays the full Order Record field set — all 4 acceptance scenarios in `backend/tests/integration/us4-order-management-e2e.integration.test.ts`

**Checkpoint**: The operational backbone of all commerce transactions is independently functional.

---

## Phase 7: User Story 5 — PCI DSS-Compliant Tokenized Checkout (Priority: P1)

**Independent Test**: Complete checkout with a test card, confirming the raw card number is never persisted or logged, confirming 3D Secure/fraud verification runs before authorization, and confirming a payment audit log entry is created.

- [ ] T064 [US5] 10-step checkout sequence (authentication, address selection, shipping method, order review, promotion validation, tax calculation, payment selection, payment authorization, fraud verification, order confirmation) (FR-043)
- [ ] T065 [US5] 11 payment methods integrating 9 named gateways, extending `009`'s payment infrastructure per T023's note (FR-044)
- [ ] T066 [US5] AI payment intelligence (fraud detection, failure prediction, preferred payment suggestions, retry optimization, checkout personalization, customer risk analysis) with a deterministic non-AI checkout fallback, wired to acceptance scenario 2 (FR-045)
- [ ] T067 [US5] PCI DSS compliance, tokenization, adaptive/risk-based authentication, 3D Secure, encryption, fraud detection, chargeback protection, payment monitoring, secure audit logs, payment risk analysis, wired to T011, T029's contract test, acceptance scenarios 1, 3, and 4 (FR-046)
- [ ] T068 [P] [US5] Tokenized Checkout Flow UI
- [ ] T069 [US5] Integration test: entered card details are tokenized via the gateway with zero raw card number stored, a submitted payment runs fraud-verification scoring before confirmation with high-risk transactions held for review, a timed-out/failed-mid-authorization retry produces zero duplicate charge via idempotent linkage, a completed payment is captured in a secure, immutable payment audit log — all 4 acceptance scenarios in `backend/tests/integration/us5-pci-tokenized-checkout.integration.test.ts`

**Checkpoint**: The hard compliance requirement that halts commerce entirely if breached is independently functional.

---

## Phase 8: User Story 6 — Fraud and Chargeback Prevention Blocks a Suspicious Transaction (Priority: P2)

**Independent Test**: Submit a transaction matching a known fraud-signal pattern and confirm the system flags/holds it with a documented reason rather than allowing silent auto-approval or auto-rejection.

- [ ] T070 [US6] Coupon-abuse, duplicate-redemption, fake-account, suspicious-purchase, automated-redemption, partner-abuse, refund-abuse, referral-fraud, account-sharing, and promotion-exploitation detection, wired to T008, acceptance scenario 2 (FR-029)
- [ ] T071 [US6] AI-driven order fraud detection, order risk analysis, delivery predictions, fulfillment optimization, order prioritization, cancellation-risk detection, upsell opportunities as advisory intelligence, wired to acceptance scenario 1 (FR-039)
- [ ] T072 [US6] Payment fraud, fake orders, account takeovers, suspicious discounts, promotion abuse, coupon fraud, data leakage, API abuse, unauthorized access, AI misuse detection (FR-050)
- [ ] T073 [P] [US6] Fraud Review Queue & Chargeback UI
- [ ] T074 [US6] Integration test: a multi-fraud-signal transaction routes to manual review with contributing factors displayed rather than auto-declined, an abnormal-redemption-pattern coupon holds further redemptions pending investigation with an audit event logged, a bank-initiated chargeback is captured against the original order/payment audit trail for dispute handling — all 3 acceptance scenarios in `backend/tests/integration/us6-fraud-chargeback-prevention.integration.test.ts`

**Checkpoint**: The enhancement layer protecting revenue and reducing chargeback exposure on top of the base checkout flow is independently functional.

---

## Phase 9: User Story 7 — Subscription Renewal, Upgrade, Pause & Cancellation (Priority: P2)

**Independent Test**: Create a test subscription, advance it through a renewal cycle, and separately trigger an upgrade and a cancellation, confirming billing history and invoices are generated correctly at each transition.

- [ ] T075 [US7] 10 subscription plan types, orchestrating on `009`'s canonical Subscription entity per T022's note, wired to T012 (FR-053)
- [ ] T076 [US7] 10-stage subscription lifecycle (Trial→Expired) via `009`'s existing state machine, wired to acceptance scenarios 1–3 (FR-054)
- [ ] T077 [US7] Auto/manual renewal, pause, plan changes, billing history, renewal notifications, invoice generation, usage tracking, license allocation, enterprise seat management, wired to acceptance scenario 4 (FR-055)
- [ ] T078 [US7] AI subscription intelligence (renewal predictions, churn detection, upgrade recommendations, CLV estimation, subscription health scoring, personalized offers, retention campaigns) subject to human review before customer-facing action, wired to acceptance scenario 2 tie-in (FR-056)
- [ ] T079 [P] [US7] Subscription Lifecycle Management UI
- [ ] T080 [US7] Integration test: an approaching-renewal subscription sends a notification before Renewal Processing begins, a mid-cycle upgrade moves to the Upgrade stage with billing history reflecting the change, a cancellation confirmation moves to Cancelled with no further auto-renewal charge, enterprise seat allocation/reclamation reflects current usage against the licensed count — all 4 acceptance scenarios in `backend/tests/integration/us7-subscription-lifecycle.integration.test.ts`

**Checkpoint**: The recurring-revenue commerce model layered on top of the core catalog/order/payment capabilities is independently functional.

---

## Phase 10: User Story 8 — Commerce Executive Reviews Revenue & AI Commerce Intelligence Dashboard (Priority: P3)

**Independent Test**: Generate a set of test orders, subscriptions, and payments, then confirm the executive dashboard reflects the resulting revenue metrics and that at least one AI-generated forecast/insight is shown with a rationale/confidence indicator.

- [ ] T081 [US8] Commerce analytics reporting (product, revenue, order, customer, subscription, pricing, promotion, payment, refund, executive domains) with near-real-time Gross/Net Revenue, MRR, ARR, AOV, CLV, conversion rate, refund rate, gross margin, plus export/scheduled reports, wired to acceptance scenarios 1 and 3 (FR-066)
- [ ] T082 [US8] AI revenue forecasts, product demand predictions, promotion optimization, dynamic pricing recommendations, CLV predictions, subscription churn detection, growth-opportunity insights, all explainable/auditable/configurable/monitored, wired to acceptance scenario 2 (FR-067)
- [ ] T083 [P] [US8] Commerce Executive Revenue Dashboard UI
- [ ] T084 [US8] Integration test: reporting-period transactions display Gross/Net Revenue/MRR/ARR/AOV/CLV updating near real time, an AI churn-detection signal surfaces with an explainable rationale marked as a recommendation rather than an automatically executed action, a scheduled-report configuration exports Commerce KPIs on the defined schedule — all 3 acceptance scenarios in `backend/tests/integration/us8-executive-revenue-dashboard.integration.test.ts`

**Checkpoint**: The read-only, downstream reporting capability depending on all other commerce data is independently functional.

---

## Phase 11: Promotion Center remainder, Cart core, Payment Security remainder, Billing/Invoice, Workflow Automation, Portal core (supports FR-023–FR-028, FR-030, FR-040–FR-041, FR-047–FR-049, FR-051–FR-052, FR-057–FR-059, FR-060–FR-063, FR-064–FR-065; cross-cutting, no single owning story)

- [ ] T085 12 promotion campaign types (flash sales, seasonal, festival, launch, referral, loyalty, student, partner, bundle, free trial, limited-time, anniversary), wired to T007 (FR-023)
- [ ] T086 9-factor promotion eligibility evaluation (FR-024)
- [ ] T087 10-metric promotion effectiveness measurement (FR-025)
- [ ] T088 AI promotion recommendations (timing, targeting, optimization, budget, personalization, revenue prediction, offer optimization) as advisory, not autonomous execution (FR-026)
- [ ] T089 12 discount types (FR-027)
- [ ] T090 10 coupon types with full field set (code, type, dates, max usage, eligibility, restrictions, revenue limits), wired to T008 (FR-028)
- [ ] T091 AI discount/coupon intelligence (recommendations, fraud detection, optimization, revenue-impact prediction, retention strategies) as advisory to Pricing/Promotion Managers (FR-030)
- [ ] T092 Shopping cart core (variants, bundles, saved items, wishlist, subscription products, gifts, quantity updates, price recalculation, coupon validation, tax/shipping estimation, currency conversion, sharing, recovery), wired to T009 (FR-040)
- [ ] T093 Cross-device cart persistence with abandoned-cart resumption and guest/authenticated cart merging (FR-041)
- [ ] T094 10-label commerce data classification with automatic security-control adjustment (FR-047)
- [ ] T095 RBAC/ABAC/MFA/SSO/passwordless/adaptive authentication/device trust/session management/API authentication/privileged access management across the commerce platform, wired to T023's note (FR-048)
- [ ] T096 Immutable audit logs across 12 commerce event categories (product changes, price updates, promotion changes, order processing, payment events, etc.) (FR-049)
- [ ] T097 8 named compliance frameworks with configurable extensibility (FR-051)
- [ ] T098 AI governance controls (explainable recommendations, confidence scores, prompt logging, model monitoring, human review, sensitive-data protection, hallucination detection, bias monitoring, compliance validation, AI audit reports) for all commerce AI (FR-052)
- [ ] T099 Automated/manual/subscription/usage/enterprise billing plus invoice adjustments, credit/debit notes, refund processing, payment reconciliation, wired to T013 (FR-057)
- [ ] T100 Invoice full field set (invoice number, customer/tax/product details, pricing breakdown, discounts, coupon info, payment details, billing address, status, due date, digital signature, QR code, audit history) (FR-058)
- [ ] T101 9-metric billing/payment monitoring (outstanding payments, invoice aging, payment delays, revenue collection, tax liability, billing errors, refund trends, subscription billing status, payment history) (FR-059)
- [ ] T102 8 automated commerce workflow types (product publishing, price updates, promotion activation, order processing, payment confirmation, invoice generation, subscription renewal, refund processing, notifications) via configurable event-driven workflows, wired to T014 (FR-060)
- [ ] T103 Workflow engine (rule builder, conditional logic, multi-step workflows, parallel processing, scheduled jobs, event-based automation, API integrations, human approvals, escalations, retry policies) (FR-061)
- [ ] T104 9-metric workflow monitoring including business/revenue impact, all recorded to audit logs (FR-062)
- [ ] T105 Explainable/configurable/role-aware/continuously-monitored/fully-auditable requirement on every AI-driven commerce automation decision (FR-063)
- [ ] T106 Role-based Enterprise Commerce Portal (19 modules: dashboard, catalog, PIM, pricing center, promotion center, cart, order management, subscription management, billing, invoice, refund center, revenue dashboard, customer management, partner commerce, AI assistant, analytics, notifications, workflow center, admin) (FR-064)
- [ ] T107 Mobile commerce portal (browsing, order processing, subscription monitoring, invoice access, notifications, customer management, analytics, approval actions, AI assistant) with offline synchronization (FR-065)
- [ ] T108 [P] Promotion/Coupon, Cart, Payment-Security-remainder, Billing, Workflow-Automation & Portal UI

---

## Phase 12: Polish — Final Validation

- [ ] T109 Resolve and document the 10 preserved NEEDS CLARIFICATION items from plan.md §7 not already closed by `research.md`
- [ ] T110 Final audit: cross-check every FR-001–FR-067 against an implementation or validation task; re-verify the `011`, `009` (Subscription + payment/tax), and `001`/`016` reuse decisions are respected, and confirm no second Subscription lifecycle or marketplace Order schema was introduced
- [ ] T111 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `011`'s Order/Commission/Payout entities and `009`'s Subscription/payment-gateway/tax-engine infrastructure, and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US4, US5)**: US1 (Catalog/PIM) is the foundation every other commerce capability depends on and must land first; US2 (AI Dynamic Pricing) depends on US1's catalog existing; US4 (Order Management) and US5 (Tokenized Checkout) are independent of US1/US2's depth and can build in parallel once Foundational is complete.
- **P2 stories (US3, US6, US7)**: US3 (Bundle/Subscription Recommendations) depends on US1's product relationships and `009`'s Subscription health data; US6 (Fraud/Chargeback Prevention) depends on US5's checkout flow already existing; US7 (Subscription Lifecycle) depends on `009`'s canonical Subscription entity and US1's catalog-linked subscription products.
- **P3 story (US8)** depends on US1–US7 already producing commerce data to aggregate, making it the natural capstone.
- **Phase 11 (Promotion/Cart/Payment-Security/Billing/Workflow/Portal remainder)** depends on Foundational, US2, and US5; should land alongside US6/US7.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (catalog-zero-publish-without-review-approval, price-change-requires-human-approval-zero-autonomous-application, order-price-tax-coupon-immutable-snapshot) pass → US1 (Catalog/PIM) → **STOP and VALIDATE** the catalog foundation is sound → US2 (AI Dynamic Pricing) + US4 (Order Management) + US5 (Tokenized Checkout) → **STOP and VALIDATE** every pricing/payment control gate enforces human approval and PCI DSS correctly → US3 (Bundle/Subscription Recommendations) + US6 (Fraud/Chargeback Prevention) + Phase 11 (Promotion/Cart/Payment-Security/Billing/Workflow/Portal remainder) → US7 (Subscription Lifecycle) → US8 (Executive Revenue Dashboard) → Polish.
