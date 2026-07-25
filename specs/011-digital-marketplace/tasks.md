---
description: "Task list for Feature 011 — Digital & Services Marketplace: Vendors, Orders & Commission Engine"
---

# Tasks: Digital & Services Marketplace: Vendors, Orders & Commission Engine

**Input**: Design documents from `/specs/011-digital-marketplace/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses for seller-team roles, admin permission checks, and the Marketplace Audit Log). This feature integrates with, but does not require full completion of, `006` (reward/badge triggers), `007` (mentor-offer fulfilment), `008` (AI-assisted seller/buyer tools), and `009` (payment gateway, core ledger, GST, affiliate mechanics) — those integration points are called out explicitly where used.

**Tests**: Included throughout — this feature is co-cited by the constitution for Article V and directly named in the Security & Compliance Baseline; multi-seller order-splitting-allocation, signed-download-no-public-URL, and append-only-ledger-no-direct-write get dedicated Foundational contract tests, matching this spec's own SC-001, SC-002, and SC-004.

**Organization**: Tasks are grouped by user story (US1–US9 from spec.md), plus six supplementary cross-cutting phases whose FR groups are not owned by any single prioritized story (Mentor Offers/Bundles/Physical Fulfilment FR-049–FR-056, FR-099–FR-101; Cancellation/Refund/Dispute remainder FR-077–FR-086; Messaging/Review/Discovery FR-087–FR-098; Commission/Promotion/AI Tools remainder FR-105–FR-107, FR-110–FR-115, FR-117–FR-126; Fraud/Security/Marketplace Admin Console FR-132–FR-143).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor this feature reuses)
- [ ] T002 Resolve `research.md` open items before proceeding: exact numeric defaults for refund/dispute/revision-request windows per product type, payout minimum-balance threshold and default schedule, the dual-approval monetary threshold, the legal structure for escrow-style payment holding under India-regulated payment flows, and the repeat-infringer strike threshold
- [ ] T003 [P] Add `backend/src/modules/{marketplace-seller,marketplace-listing,marketplace-digital,marketplace-service,marketplace-freelance,marketplace-mentor-offer,marketplace-bundle,marketplace-physical,marketplace-cart-order,marketplace-fulfilment,marketplace-escrow,marketplace-dispute,marketplace-messaging,marketplace-review,marketplace-discovery,marketplace-shipping,marketplace-commission,marketplace-wallet,marketplace-promotion,marketplace-ip,marketplace-fraud,marketplace-admin}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define `Seller Profile`/`Seller Account` entity in `backend/src/modules/marketplace-seller/seller-profile.entity.ts` (spec.md Key Entities)
- [ ] T005 Define the `Seller Application` entity and its verification-status state machine (Draft…Archived) in `backend/src/modules/marketplace-seller/seller-application.entity.ts` (FR-010)
- [ ] T006 [P] Define the `Store Profile` entity with its status lifecycle in `backend/src/modules/marketplace-seller/store-profile.entity.ts` (FR-020)
- [ ] T007 [P] Define the `Seller Team Member` entity in `backend/src/modules/marketplace-seller/seller-team-member.entity.ts` (FR-019)
- [ ] T008 [P] Define the `Marketplace Category` entity (hierarchical taxonomy) in `backend/src/modules/marketplace-listing/marketplace-category.entity.ts` (spec.md Key Entities)
- [ ] T009 Define `Listing`/`Listing Version` entities and the listing status state machine in `backend/src/modules/marketplace-listing/listing.entity.ts` (FR-023, FR-024)
- [ ] T010 [P] Define `Digital File`/`File Version` entities in `backend/src/modules/marketplace-digital/digital-file.entity.ts` (FR-030)
- [ ] T011 [P] Define the `Licence Type` entity in `backend/src/modules/marketplace-digital/licence-type.entity.ts` (FR-033)
- [ ] T012 [P] Define `Download Grant`/`Signed Download URL` entities in `backend/src/modules/marketplace-digital/download-grant.entity.ts` (FR-034)
- [ ] T013 [P] Define `Service Package`/`Service Add-on` entities in `backend/src/modules/marketplace-service/` (FR-041, FR-042)
- [ ] T014 [P] Define `Custom Service Request`/`Custom Offer` entities in `backend/src/modules/marketplace-service/` (FR-043, FR-044)
- [ ] T015 [P] Define the `Freelancer Profile` entity in `backend/src/modules/marketplace-freelance/freelancer-profile.entity.ts` (FR-045)
- [ ] T016 [P] Define the `Project Posting` entity in `backend/src/modules/marketplace-freelance/project-posting.entity.ts` (FR-046)
- [ ] T017 [P] Define the `Proposal` entity in `backend/src/modules/marketplace-freelance/proposal.entity.ts` (FR-047)
- [ ] T018 [P] Define `Mentor Listing`/`Mentor Offer` entities in `backend/src/modules/marketplace-mentor-offer/mentor-offer.entity.ts` (FR-049)
- [ ] T019 [P] Define the `Product Bundle` entity in `backend/src/modules/marketplace-bundle/product-bundle.entity.ts` (FR-051)
- [ ] T020 [P] Define `Physical Product`/`SKU`/`Variant` entities in `backend/src/modules/marketplace-physical/physical-product.entity.ts` (FR-053)
- [ ] T021 [P] Define the `Inventory Record` entity in `backend/src/modules/marketplace-physical/inventory-record.entity.ts` (FR-054)
- [ ] T022 [P] Define `Cart`/`Cart Item` entities in `backend/src/modules/marketplace-cart-order/cart.entity.ts` (FR-057)
- [ ] T023 Define `Marketplace Order (Parent)`/`Seller Suborder` entities and their status state machines in `backend/src/modules/marketplace-cart-order/order.entity.ts` (FR-060, FR-061)
- [ ] T024 [P] Define the `Buyer Requirement Submission` entity in `backend/src/modules/marketplace-fulfilment/buyer-requirement.entity.ts` (FR-065)
- [ ] T025 [P] Define `Delivery Submission`/`Delivery Version` entities in `backend/src/modules/marketplace-fulfilment/delivery.entity.ts` (FR-068)
- [ ] T026 [P] Define the `Revision Request` entity in `backend/src/modules/marketplace-fulfilment/revision-request.entity.ts` (FR-071)
- [ ] T027 [P] Define the `Service Milestone` entity in `backend/src/modules/marketplace-fulfilment/service-milestone.entity.ts` (FR-072)
- [ ] T028 [P] Define the `Escrow Hold`/`Pending Earning Record` entity in `backend/src/modules/marketplace-escrow/escrow-hold.entity.ts` (FR-074)
- [ ] T029 [P] Define the `Order Cancellation Record` entity in `backend/src/modules/marketplace-escrow/cancellation-record.entity.ts` (FR-077)
- [ ] T030 [P] Define `Refund`/`Partial Refund` and `Return (Physical)` entities in `backend/src/modules/marketplace-dispute/` (FR-082, FR-101)
- [ ] T031 [P] Define `Dispute`/`Dispute Evidence` entities in `backend/src/modules/marketplace-dispute/dispute.entity.ts` (FR-083, FR-085)
- [ ] T032 [P] Define `Review`/`Q&A Entry` entities in `backend/src/modules/marketplace-review/` (FR-090, FR-095)
- [ ] T033 [P] Define `Wishlist`/`Saved Item` and `Seller Follow` entities in `backend/src/modules/marketplace-discovery/` (FR-096, FR-097)
- [ ] T034 [P] Define the `Shipment`/`Tracking Record` entity in `backend/src/modules/marketplace-shipping/shipment.entity.ts` (FR-100)
- [ ] T035 [P] Define the `Commission Rule` entity (versioned) in `backend/src/modules/marketplace-commission/commission-rule.entity.ts` (FR-103)
- [ ] T036 Define the `Seller Earning Statement`/`Earning Ledger Entry` entity as append-only in `backend/src/modules/marketplace-commission/earning-ledger.entity.ts` (FR-105, Constitution Article V)
- [ ] T037 [P] Define the `Seller Wallet` derived-balance view and `Payout Method`/`Payout Record`/`Payout Statement` entities in `backend/src/modules/marketplace-wallet/` (FR-109, FR-113)
- [ ] T038 [P] Define the `Negative Balance Adjustment` entity in `backend/src/modules/marketplace-wallet/negative-balance-adjustment.entity.ts` (FR-116)
- [ ] T039 [P] Define `Marketplace Coupon`, `Flash Sale`, `Sponsored Listing` entities in `backend/src/modules/marketplace-promotion/` (FR-117, FR-119, FR-120)
- [ ] T040 [P] Define the `Affiliate Attribution (Marketplace)` entity in `backend/src/modules/marketplace-promotion/affiliate-attribution.entity.ts` (FR-121)
- [ ] T041 [P] Define the `IP Complaint`/`Takedown Record` entity in `backend/src/modules/marketplace-ip/ip-complaint.entity.ts` (FR-129)
- [ ] T042 [P] Define `Fraud Signal`/`Fraud Hold` entities in `backend/src/modules/marketplace-fraud/fraud-signal.entity.ts` (FR-132, FR-133)
- [ ] T043 Note: `Marketplace Audit Log Entry` reuses `001`'s audit-log interceptor pattern directly for every administrative, financial, and moderation action — no new logging engine is created (spec.md Key Entities)
- [ ] T044 Implement server-side recalculation of every client-provided value (final price, commission, seller earning, download permission, order completion, refund amount, payout balance, inventory availability, service-milestone release) — client values are always untrusted, in `backend/src/modules/marketplace-cart-order/server-recalculation.service.ts` (FR-003, Constitution Article I)
- [ ] T045 Implement the historical order-snapshot preservation service (product title, description, price, seller details, licence terms, refund policy, deliverables, commission rate, tax rate, delivery timeline at purchase time; later config changes never alter existing orders) in `backend/src/modules/marketplace-cart-order/order-snapshot.service.ts` (FR-004, Constitution Article IV)
- [ ] T046 Implement the listing publication pipeline (automated validation → manual moderation → legal review → copyright review → category-eligibility check → quality review as distinct trackable stages) in `backend/src/modules/marketplace-listing/publication-pipeline.service.ts` (FR-002, FR-028)
- [ ] T047 Implement the listing status state machine (Draft…Archived) in `backend/src/modules/marketplace-listing/listing-status.service.ts` (FR-023)
- [ ] T048 Implement the commission calculation engine (percentage, fixed-fee, tiered, category-based, product-based, seller-level-based, campaign-based, subscription-based, hybrid) with versioned rules in `backend/src/modules/marketplace-commission/commission-engine.service.ts` (FR-102, FR-103)
- [ ] T049 Implement the configurable commission-basis service (gross, net-of-tax, net-of-discount, net-of-seller-funded-discount, net-of-refund, collected-revenue, released-milestone-amount) with the applicable basis visible to the seller, in `backend/src/modules/marketplace-commission/commission-basis.service.ts` (FR-104)
- [ ] T050 Implement the per-product-type earning-release eligibility engine (digital: payment + download fulfilment + refund-window-passed + no dispute; services: buyer acceptance/auto-completion + dispute-window-passed; physical: delivery confirmation + return-window-passed; mentor sessions: attendance/completion + cancellation checks) in `backend/src/modules/marketplace-commission/earning-release.service.ts` (FR-107)
- [ ] T051 Note: role/permission enforcement for seller-team and admin actions reuses `001`'s layered RBAC directly (FR-019, Constitution Article VII)
- [ ] T052 Contract test: a cart with items from 2+ sellers always splits into one parent order plus correctly, independently allocated seller suborders (each with its own tax, discount, and commission allocation) in `backend/tests/contract/marketplace-order-splitting.contract.test.ts` (FR-060, FR-061, SC-001)
- [ ] T053 Contract test: every digital file download is served exclusively via a signed, time-limited, user/order/version-scoped URL — zero permanent public URLs are ever exposed for a purchased digital product — in `backend/tests/contract/marketplace-signed-download-no-public-url.contract.test.ts` (FR-034, SC-002)
- [ ] T054 Contract test: seller earnings are always reconstructable as the sum of an append-only ledger of issuance, reversal, and adjustment entries, with zero direct writes to a mutable balance field, in `backend/tests/contract/marketplace-earning-ledger-append-only.contract.test.ts` (FR-109, SC-004)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Seller Onboarding, Verification & Store Activation (P1) 🎯 MVP

**Independent Test**: Submit a complete seller application through automated and manual review to an Approved decision and confirm the seller dashboard activates — independent of any listing or order functionality existing yet.

- [ ] T055 [US1] Seller onboarding flow orchestration (seller-type selection → personal/business details → identity verification → business verification → tax info → payout info → skill/category selection → portfolio → agreement acceptance → policy training → submission → automated risk check → manual review → decision → dashboard activation) in `backend/src/modules/marketplace-seller/onboarding-flow.service.ts` (FR-008, acceptance scenario 1)
- [ ] T056 [US1] Seller application data capture (full field set per FR-009) with sensitive-field encryption in `backend/src/modules/marketplace-seller/seller-application.service.ts` (FR-009)
- [ ] T057 [US1] Seller verification-status tracking, wired to T005's state machine (FR-010)
- [ ] T058 [US1] Approval-decision recording (reason, reviewer, date, evidence, conditions, appeal availability) in `backend/src/modules/marketplace-seller/approval-decision.service.ts` (FR-011, acceptance scenario 2)
- [ ] T059 [US1] Seller approval evaluation against identity validity, business validity, portfolio quality, skill relevance, category eligibility, policy history, fraud signals, copyright risk, product safety, tax details, bank ownership, previous platform history in `backend/src/modules/marketplace-seller/approval-evaluation.service.ts` (FR-012)
- [ ] T060 [US1] Seller agreement presentation and versioned consent recording, blocking store activation until accepted in `backend/src/modules/marketplace-seller/seller-agreement.service.ts` (FR-013, acceptance scenario 3)
- [ ] T061 [US1] Ten-seller-type support (Individual, Freelancer, Mentor, Instructor, Agency, Business Vendor, Digital Creator, Physical Product Vendor, TBT Internal Seller, Strategic Partner) with type-appropriate onboarding/eligibility rules in `backend/src/modules/marketplace-seller/seller-type.service.ts` (FR-014)
- [ ] T062 [US1] Public seller profile (display name, photo/logo, verification badge, level, about, skills, categories, languages, location, member-since, response time, completion rate, on-time delivery, rating, review count, orders, portfolio, products, services, FAQ, policies, approved links) without private-contact exposure absent consent, in `web/src/app/(public)/marketplace/sellers/[sellerSlug]/page.tsx` (FR-015)
- [ ] T063 [US1] Seller dashboard shell (overview, products, services, listings, orders, projects, deliveries, messages, reviews, questions, analytics, earnings, wallet, payouts, coupons, promotions, customers, portfolio, store settings, team, support/policy center) in `web/src/app/(seller)/dashboard/overview/page.tsx` (FR-018)
- [ ] T064 [US1] Agency/vendor staff invitation with granular roles (Owner, Manager, Listing Manager, Order Manager, Support, Fulfilment, Finance Viewer, Analyst), restricting payout-detail updates, tax-data viewing, withdrawal requests, ownership changes, and agreement acceptance to authorized roles, in `backend/src/modules/marketplace-seller/team-invitation.service.ts` (FR-019, acceptance scenario 4)
- [ ] T065 [US1] Store profile configuration and status lifecycle (Draft, Active, Vacation Mode, Temporarily Paused, Suspended, Closed, Archived) in `backend/src/modules/marketplace-seller/store-profile.service.ts` (FR-020)
- [ ] T066 [US1] Vacation Mode behavior (stop new service orders if configured, display return date, continue existing-order obligations, digital sales only if explicitly enabled) in `backend/src/modules/marketplace-seller/vacation-mode.service.ts` (FR-021)
- [ ] T067 [P] [US1] Seller onboarding wizard and dashboard UI in `web/src/app/(seller)/onboarding/[stage]/page.tsx`
- [ ] T068 [US1] Integration test: application submission triggers automated risk check, manual-review decision recording, agreement blocks activation, staff-role action restriction — all 4 acceptance scenarios in `backend/tests/integration/us1-seller-onboarding.integration.test.ts`

**Checkpoint**: The foundational gate every other marketplace capability depends on is independently functional.

---

## Phase 4: User Story 2 — Buyer Purchases a Protected Digital Download (P1)

**Independent Test**: Complete a digital-product checkout, verify payment, and confirm a signed download URL is issued, watermarked, logged, and rejected once expired or once the download limit is reached.

- [ ] T069 [US2] Digital-product-specific listing fields (file types, size, version, compatibility, software requirements, installation instructions, download-count limit, download expiry, update policy, licence type, commercial/personal use flags, source-file inclusion, support duration) in `backend/src/modules/marketplace-digital/digital-listing-fields.service.ts` (FR-030)
- [ ] T070 [US2] Digital file type allow-list enforcement with stricter security review for executable files in `backend/src/modules/marketplace-digital/file-type-allowlist.service.ts` (FR-031)
- [ ] T071 [US2] Immutable version record per digital-product update (version number, release date, changelog, file set, compatibility, mandatory-update flag, existing-buyer access rule, seller notes, moderation status) in `backend/src/modules/marketplace-digital/product-version.service.ts` (FR-032)
- [ ] T072 [US2] Configurable digital-product licence types displayed before purchase, wired to T011, in `web/src/components/marketplace/licence-display.tsx` (FR-033)
- [ ] T073 [US2] Signed, time-limited, user/order/version-scoped download URL issuance — never a public permanent URL — wired to T053's contract test, in `backend/src/modules/marketplace-digital/signed-download.service.ts` (FR-034, acceptance scenario 1)
- [ ] T074 [US2] Per-order/per-buyer download-limit enforcement plus download-attempt logging in `backend/src/modules/marketplace-digital/download-limit.service.ts` (FR-035, acceptance scenario 3)
- [ ] T075 [US2] File watermarking (buyer name, buyer email, order number, download date, invisible identifier, seller/TBT branding) without materially damaging file usability, in `backend/src/modules/marketplace-digital/watermarking.service.ts` (FR-036, acceptance scenario 2)
- [ ] T076 [US2] Malware scanning on every uploaded file before it becomes downloadable, plus abusive-download-pattern detection, in `backend/src/modules/marketplace-digital/file-security-scan.service.ts` (FR-037, edge case: shared-URL redistribution abuse)
- [ ] T077 [US2] Restricted digital-product previews (limited pages, low-resolution/watermarked images, short video, audio sample, interactive demo, sample download) distinct from the full purchasable file, in `backend/src/modules/marketplace-digital/preview.service.ts` (FR-038)
- [ ] T078 [US2] File-processing pipeline (upload to quarantine → file-type verification → malware scan → size/compression validation → metadata extraction → preview generation → watermark generation → moderation → approved storage → signed-access configuration) in `backend/src/modules/marketplace-digital/file-processing-pipeline.service.ts` (FR-039)
- [ ] T079 [US2] `DOWNLOAD_LIMIT_REACHED` and `DOWNLOAD_LINK_EXPIRED` error handling, in `backend/src/modules/marketplace-digital/download-error-handling.service.ts` (FR-034/FR-035, acceptance scenarios 3–4)
- [ ] T080 [P] [US2] Digital-download purchase and download-management UI in `web/src/app/(member)/marketplace/downloads/page.tsx`
- [ ] T081 [US2] Integration test: payment-verified download-entitlement creation, watermarked-and-logged download, download-limit-reached rejection, expired-link rejection — all 4 acceptance scenarios in `backend/tests/integration/us2-digital-download.integration.test.ts`

**Checkpoint**: The marketplace's simplest, highest-volume, security-critical transaction type is independently functional.

---

## Phase 5: User Story 3 — Buyer Purchases a Fiverr-Style Service Package and Seller Delivers (P1)

**Independent Test**: Purchase a package, submit requirements, have a seller submit a delivery, and confirm the order auto-completes and earnings release after the review window with no dispute.

- [ ] T082 [US3] Service listing fields (title, category, description, deliverables, packages, delivery days, revision count, required buyer info, tools used, language, availability, max concurrent orders, communication method, meeting support, source-file inclusion, commercial rights, support period) in `backend/src/modules/marketplace-service/service-listing-fields.service.ts` (FR-040)
- [ ] T083 [US3] Configurable service packages (Basic/Standard/Premium/Custom) with seller/admin-configurable names in `backend/src/modules/marketplace-service/service-package.service.ts` (FR-041)
- [ ] T084 [US3] Server-validated service add-ons (faster delivery, additional revision, extra page, additional design, source file, commercial licence, extra consultation, priority support, additional language, video meeting, extended support) in `backend/src/modules/marketplace-service/service-addon.service.ts` (FR-042)
- [ ] T085 [US3] Custom service request and seller-response flow (ask questions, accept, decline, custom offer, suggest scope changes) in `backend/src/modules/marketplace-service/custom-request.service.ts` (FR-043)
- [ ] T086 [US3] Custom offer capture with immutable order-snapshot-on-acceptance in `backend/src/modules/marketplace-service/custom-offer.service.ts` (FR-044)
- [ ] T087 [US3] Service order flow orchestration (payment verified → seller notified → accept/auto-accept → requirements collected → work starts → status updates posted → delivery submitted → buyer reviews → revision requested or completion confirmed → auto-completion after review window if no dispute → earnings released) in `backend/src/modules/marketplace-fulfilment/service-order-flow.service.ts` (FR-063)
- [ ] T088 [US3] Automatic/manual/scheduled/availability-based seller acceptance modes with acceptance-time-limit enforcement — auto-cancel on timeout, buyer refund, seller-performance impact, admin notification after repeated failures, in `backend/src/modules/marketplace-fulfilment/order-acceptance.service.ts` (FR-064, acceptance scenario 1)
- [ ] T089 [US3] Buyer-requirement collection gate — the fulfilment clock starts only after mandatory requirements are submitted, in `backend/src/modules/marketplace-fulfilment/requirement-gate.service.ts` (FR-065, acceptance scenario 2)
- [ ] T090 [US3] Order workspace (messages, attachments, questions, delivery submissions, revision requests, status timeline, meeting links, milestones, support escalation), prohibiting off-platform payment solicitation within it, in `web/src/app/(member)/marketplace/orders/[orderId]/page.tsx` (FR-066)
- [ ] T091 [US3] Order-attachment security (malware scan, file-type validation, size limit, access control, download logging, expiry enforcement, sensitive-content flagging, never-public-links, retention policy) in `backend/src/modules/marketplace-fulfilment/order-attachment-security.service.ts` (FR-067)
- [ ] T092 [US3] Seller delivery submission (message, files, links, instructions, version, milestone reference, completion notes, support details) as an immutable version record, wired to T025, in `backend/src/modules/marketplace-fulfilment/delivery-submission.service.ts` (FR-068)
- [ ] T093 [US3] Delivery-status tracking (Not Started, In Progress, Submitted, Viewed, Revision Requested, Resubmitted, Accepted, Auto-Accepted, Disputed) in `backend/src/modules/marketplace-fulfilment/delivery-status.service.ts` (FR-069)
- [ ] T094 [US3] Revision policy (included count, meaning, request period, additional-revision price, delivery time, scope-change handling) preventing free scope-creep, in `backend/src/modules/marketplace-fulfilment/revision-policy.service.ts` (FR-070, edge case: repeated out-of-scope requests)
- [ ] T095 [US3] Revision-request handling (accept, ask for clarification, mark out-of-scope, send additional offer, escalate a dispute) in `backend/src/modules/marketplace-fulfilment/revision-request.service.ts` (FR-071, acceptance scenario 3)
- [ ] T096 [US3] Service milestones (name, description, deliverable, amount, due date, status, approval, revision, payment release, evidence) tracked Draft…Refunded, wired to T027, in `backend/src/modules/marketplace-fulfilment/service-milestone.service.ts` (FR-072)
- [ ] T097 [US3] Delivery-deadline-passed handling (notify both parties, seller extension request with buyer approve/reject/counter-propose, cancellation-eligibility evaluation, seller-performance impact, admin escalation past a defined threshold) in `backend/src/modules/marketplace-fulfilment/deadline-handling.service.ts` (FR-073)
- [ ] T098 [US3] Auto-completion after review window with no dispute, releasing earnings, wired to T028's escrow entity, in `backend/src/modules/marketplace-fulfilment/auto-completion.service.ts` (FR-063, acceptance scenario 4)
- [ ] T099 [P] [US3] Service package purchase and order-workspace UI
- [ ] T100 [US3] Integration test: acceptance-window-expiry auto-cancel-and-refund, requirement-gated fulfilment-clock start, out-of-scope revision handling, auto-completion releases earnings — all 4 acceptance scenarios in `backend/tests/integration/us3-service-fulfilment.integration.test.ts`

**Checkpoint**: The marketplace's core services transaction — the primary driver of the escrow/dispute/revision machinery — is independently functional.

---

## Phase 6: User Story 4 — Multi-Seller Cart Checkout Splits into Seller Suborders (P1)

**Independent Test**: Check out a cart containing items from 2+ distinct sellers and verify one parent order and multiple correctly-allocated seller suborders are created.

- [ ] T101 [US4] Multi-seller, multi-product-type cart (digital, physical, service, add-ons, TBT-owned products) with fulfilment and seller earnings kept separated by seller, wired to T022, in `backend/src/modules/marketplace-cart-order/multi-seller-cart.service.ts` (FR-057)
- [ ] T102 [US4] Cart validation (listing active status, seller active status, current price, stock, capacity, buyer eligibility, delivery region, product ownership, download-licence conflict, service availability, coupon eligibility, currency, tax, quantity, max concurrent service orders) — blocking or flagging a single line item without invalidating the rest of the cart, in `backend/src/modules/marketplace-cart-order/cart-validation.service.ts` (FR-058, acceptance scenario 2)
- [ ] T103 [US4] Multi-vendor checkout display (grouped by seller, delivery methods, seller-specific policies, taxes, platform fees, coupons, credits, final total) in `web/src/app/(member)/marketplace/checkout/page.tsx` (FR-059)
- [ ] T104 [US4] Parent marketplace order and seller-suborder creation with proportionally allocated discount, tax, and commission per seller, wired to T023 and validated by T052's contract test, in `backend/src/modules/marketplace-cart-order/order-splitting.service.ts` (FR-060, FR-061, acceptance scenario 1)
- [ ] T105 [US4] Payment-webhook idempotency preventing duplicate inventory decrement or duplicate suborder creation on a retried delivery, in `backend/src/modules/marketplace-cart-order/checkout-idempotency.service.ts` (FR-055 tie, acceptance scenario 3)
- [ ] T106 [US4] Multi-seller bundle publication gate requiring every participating seller's consent before the bundle becomes purchasable, wired to T019, in `backend/src/modules/marketplace-bundle/bundle-consent.service.ts` (FR-052, acceptance scenario 4)
- [ ] T107 [P] [US4] Multi-seller cart and checkout UI in `web/src/app/(member)/marketplace/cart/page.tsx`
- [ ] T108 [US4] Integration test: coupon-plus-multi-seller correct allocation, price-or-suspension-change line-item flagging, duplicate-webhook idempotency, bundle-consent-gated publication — all 4 acceptance scenarios in `backend/tests/integration/us4-multi-seller-checkout.integration.test.ts`

**Checkpoint**: The architectural backbone every financial and fulfilment feature builds on is independently functional.

---

## Phase 7: User Story 5 — Escrow-Style Payment Holding Until Buyer Acceptance or Auto-Completion (P2)

**Independent Test**: Complete a service order, confirm the seller's earning sits in "Pending"/"On Hold" status immediately after delivery, and only transitions to "Approved"/"Available" once the dispute/refund window has closed with no open dispute.

- [ ] T109 [US5] Pending-seller-earnings holding from payment through seller fulfilment, buyer acceptance, and the close of the refund/dispute window, wired to T028's `Escrow Hold` entity, in `backend/src/modules/marketplace-escrow/escrow-holding.service.ts` (FR-074, acceptance scenario 1)
- [ ] T110 [US5] Open-dispute-blocks-release enforcement — held funds remain non-payable while a dispute is open, regardless of an otherwise-expired review-window timer, in `backend/src/modules/marketplace-escrow/dispute-block.service.ts` (FR-074, acceptance scenario 2, edge case)
- [ ] T111 [US5] Window-close-with-no-dispute transition to payable/available balance in `backend/src/modules/marketplace-escrow/escrow-release.service.ts` (FR-074, acceptance scenario 3)
- [ ] T112 [US5] "Not a regulated escrow provider" compliance-copy guard unless that status has been separately legally approved, in `backend/src/modules/marketplace-escrow/escrow-copy-guard.service.ts` (FR-075, acceptance scenario 4)
- [ ] T113 [US5] Order-completion path support (buyer manual acceptance, milestone approval, attendance confirmation, download fulfilment, admin decision, auto-completion) in `backend/src/modules/marketplace-escrow/completion-paths.service.ts` (FR-076)
- [ ] T114 [P] [US5] Escrow-status display UI (seller earnings pending/held state) in `web/src/app/(seller)/dashboard/earnings/page.tsx`
- [ ] T115 [US5] Integration test: payment becomes pending not payable, dispute blocks release, window-close releases funds, no-regulated-escrow-claim in user-facing copy — all 4 acceptance scenarios in `backend/tests/integration/us5-escrow-holding.integration.test.ts`

**Checkpoint**: The trust mechanism underlying buyer/seller protection is independently functional.

---

## Phase 8: User Story 6 — Freelance Project Posting and Proposal Bidding (P2)

**Independent Test**: Post a project, receive and shortlist multiple proposals, and award one — the awarded proposal ultimately feeds into the same order/suborder machinery as US3.

- [ ] T116 [US6] Freelancer discovery (skill, category, experience, hourly/fixed rate, location, language, availability, rating, verified status, completed projects, portfolio, industry experience, response time) plus a freelancer profile, in `backend/src/modules/marketplace-freelance/freelancer-discovery.service.ts` (FR-045)
- [ ] T117 [US6] Project posting (title, category, description, skills, budget type/range, deadline, duration, experience level, location requirement, language, attachments, confidentiality, proposal deadline, visibility) tracked Draft…Archived, wired to T016, in `backend/src/modules/marketplace-freelance/project-posting.service.ts` (FR-046)
- [ ] T118 [US6] Proposal submission (cover letter, price, timeline, milestones, questions, portfolio, availability, revisions, terms, expiry) with buyer review/shortlist/message/reject/accept actions, in `backend/src/modules/marketplace-freelance/proposal-submission.service.ts` (FR-047, acceptance scenario 2)
- [ ] T119 [US6] Proposal-eligibility gating restricted to verified/category-eligible freelancers, in `backend/src/modules/marketplace-freelance/proposal-eligibility.service.ts` (FR-048, acceptance scenario 1)
- [ ] T120 [US6] Proposal-spam protections (proposal limits, rate limiting, duplicate detection, copy-paste spam detection, minimum quality checks, restricted contact sharing, abuse reporting) in `backend/src/modules/marketplace-freelance/proposal-spam-protection.service.ts` (FR-048, acceptance scenario 4)
- [ ] T121 [US6] Proposal acceptance transitioning the project to "Awarded," locking the proposal's price/timeline/milestones into an order snapshot and moving the project to "In Progress," feeding US3's order machinery, in `backend/src/modules/marketplace-freelance/proposal-award.service.ts` (FR-047, acceptance scenario 3)
- [ ] T122 [P] [US6] Project posting and proposal UI in `web/src/app/(member)/marketplace/projects/page.tsx`
- [ ] T123 [US6] Integration test: ineligible-freelancer submission blocked, shortlist/reject/message flow, award locks snapshot and creates an order, spam-pattern flagging — all 4 acceptance scenarios in `backend/tests/integration/us6-freelance-proposals.integration.test.ts`

**Checkpoint**: The buyer-initiated-request commerce model is independently functional.

---

## Phase 9: User Story 7 — IP Rights Holder Takedown Complaint and Seller Counter-Notice (P2)

**Independent Test**: Submit an IP complaint against a live listing and confirm the listing enters review, the seller is notified, evidence is requested, and a final removal/restoration decision with an audit trail and strike record is produced.

- [ ] T124 [US7] IP complaint submission with identity/claim validation, wired to T041, in `backend/src/modules/marketplace-ip/complaint-submission.service.ts` (FR-129, acceptance scenario 1)
- [ ] T125 [US7] Temporary listing review, seller notification where appropriate, and evidence request in `backend/src/modules/marketplace-ip/complaint-review.service.ts` (FR-129, acceptance scenario 1)
- [ ] T126 [US7] Seller counter-notice recording and consideration before a final decision in `backend/src/modules/marketplace-ip/counter-notice.service.ts` (FR-129, acceptance scenario 2)
- [ ] T127 [US7] Final removal/restoration/restriction decision plus affected-order/buyer assessment, refund evaluation, and seller-strike recording in `backend/src/modules/marketplace-ip/complaint-decision.service.ts` (FR-129, acceptance scenario 3)
- [ ] T128 [US7] Appeal process tracked as a distinct, auditable step separate from the original complaint resolution, in `backend/src/modules/marketplace-ip/complaint-appeal.service.ts` (FR-129, acceptance scenario 4)
- [ ] T129 [US7] Repeat-infringer policy and IP-evidence retention for the legally required period in `backend/src/modules/marketplace-ip/repeat-infringer.service.ts` (FR-130)
- [ ] T130 [US7] Ownership/licence/right-to-sell confirmation requirement for images, fonts, music, source code, and trademarks used in a listing, in `backend/src/modules/marketplace-ip/ownership-confirmation.service.ts` (FR-128)
- [ ] T131 [US7] Prohibited-item enforcement (illegal goods, stolen content, pirated software, malware, credential-theft tools, fake documents, fraud services, unauthorized financial schemes, weapons, hazardous products, adult content, hate merchandise, controlled substances, spyware, guaranteed-income scams, academic-cheating services, personal-data lists, unauthorized account sales, fake reviews, counterfeits), subject to final legal review, in `backend/src/modules/marketplace-ip/prohibited-items.service.ts` (FR-127)
- [ ] T132 [US7] Regulated physical-product/service certification requirements (manufacturer info, safety instructions, warranty, legal disclaimer, restricted-region rules, age restrictions, additional verification) in `backend/src/modules/marketplace-ip/regulated-product-compliance.service.ts` (FR-131)
- [ ] T133 [P] [US7] IP complaint submission and seller counter-notice UI
- [ ] T134 [US7] Integration test: complaint validation triggers review and notification, counter-notice considered, infringement decision with strike, distinct appeal tracking — all 4 acceptance scenarios in `backend/tests/integration/us7-ip-takedown.integration.test.ts`

**Checkpoint**: The named legal-exposure risk category is independently functional.

---

## Phase 10: User Story 8 — Seller Reputation and Level Progression (P2)

**Independent Test**: Simulate a seller's order-completion, rating, and dispute history over time and confirm the computed level changes only through the documented inputs — never through direct manual edit without an audit trail.

- [ ] T135 [US8] Seller-level calculation (New Seller, Verified Seller, Rising Seller, Professional Seller, Top Seller, TBT Certified Seller, TBT Partner) from completed orders, revenue, rating, response rate, cancellation rate, on-time delivery, dispute rate, policy compliance, customer satisfaction, in `backend/src/modules/marketplace-review/seller-level.service.ts` (FR-016, acceptance scenario 1)
- [ ] T136 [US8] Internal reputation-score computation (order completion, delivery quality, review rating, refund rate, dispute rate, response time, repeat customers, policy violations, verification status, content quality) — formula stays internal, seller receives understandable improvement guidance rather than the raw score, in `backend/src/modules/marketplace-review/reputation-score.service.ts` (FR-017, acceptance scenario 3)
- [ ] T137 [US8] Scheduled/background recalculation from documented inputs only, never a directly editable field, with every recalculation logged for audit, in `backend/src/modules/marketplace-review/level-recalculation.service.ts` (FR-108, acceptance scenario 1)
- [ ] T138 [US8] Manual admin level-override requiring an audit-logged justification — no silent inflation, in `backend/src/modules/marketplace-review/level-override.service.ts` (FR-016, acceptance scenario 2)
- [ ] T139 [US8] Public seller-profile reputation display (level, rating, response time, completion rate, on-time delivery rate) without exposing raw internal fraud/reputation signals, wired to T062, in `web/src/app/(public)/marketplace/sellers/[sellerSlug]/page.tsx` (FR-015 tie, acceptance scenario 4)
- [ ] T140 [P] [US8] Seller reputation/level display UI (dashboard + public profile)
- [ ] T141 [US8] Integration test: scheduled level recalculation from documented inputs, admin override requires audit-logged justification, understandable improvement guidance without raw score exposure, public-profile safe disclosure — all 4 acceptance scenarios in `backend/tests/integration/us8-seller-reputation.integration.test.ts`

**Checkpoint**: The Article VIII-protected marketplace-quality mechanism is independently functional.

---

## Phase 11: User Story 9 — Negative Seller Balance Recovery After Chargeback (P3)

**Independent Test**: Simulate a payout followed by a chargeback on the same order and confirm the wallet ledger shows a negative derived balance, future earnings are automatically applied against it, and no direct balance field is overwritten outside an audited adjustment entry.

- [ ] T142 [US9] Reversal ledger entry on a post-payout chargeback/dispute loss, deriving a negative available balance, wired to T036's ledger and validated by T054's contract test, in `backend/src/modules/marketplace-wallet/balance-reversal.service.ts` (FR-116, acceptance scenario 1)
- [ ] T143 [US9] Automatic future-earning application against a negative balance before releasing any positive payout in `backend/src/modules/marketplace-wallet/negative-balance-offset.service.ts` (FR-116, acceptance scenario 2)
- [ ] T144 [US9] Negative-balance recovery workflow (payout hold, direct repayment request, account restriction, legal escalation for serious cases) triggered past a configured persistence threshold, in `backend/src/modules/marketplace-wallet/negative-balance-recovery.service.ts` (FR-116, acceptance scenario 3)
- [ ] T145 [US9] Dual-approval-gated negative-balance write-off producing an audit record before adjustment, wired to T038, in `backend/src/modules/marketplace-wallet/negative-balance-writeoff.service.ts` (FR-116, acceptance scenario 4)
- [ ] T146 [P] [US9] Negative-balance admin review UI in `web/src/app/(admin)/marketplace-admin/sellers/[sellerId]/balance/page.tsx`
- [ ] T147 [US9] Integration test: chargeback creates a negative derived balance, future earnings auto-applied, threshold triggers hold-or-repayment-request, write-off requires dual approval — all 4 acceptance scenarios in `backend/tests/integration/us9-negative-balance-recovery.integration.test.ts`

**Checkpoint**: The Article V ledger-integrity guarantee under an exception path is independently functional.

---

## Phase 11b: Mentor Offers, Bundles & Physical Fulfilment (supports FR-049–FR-056, FR-099–FR-101; cross-cutting, no single owning story)

- [ ] T148 Mentor-sellable-offer integration with `007` (offer name, mentor, expertise, audience, outcomes, duration, session count, price, availability, preparation requirements, deliverables, follow-up support, cancellation/reschedule/recording policy, confidentiality, rating), wired to T018, in `backend/src/modules/marketplace-mentor-offer/mentor-offer.service.ts` (FR-049)
- [ ] T149 Mentor service fulfilment flow (purchase creates session entitlement/credit → buyer selects slot → mentor confirms if required → reminder sent → session conducted → attendance verified → deliverables uploaded → buyer confirms completion → earnings eligible → review request sent) in `backend/src/modules/marketplace-mentor-offer/mentor-fulfilment.service.ts` (FR-050)
- [ ] T150 Product bundle support (multiple digital products, product+course, product+mentor-session, service+template, event+resource-pack, business-starter, marketing, AI-toolkit) with per-item values, bundle price, licence, allocation, wired to T019, in `backend/src/modules/marketplace-bundle/bundle-config.service.ts` (FR-051)
- [ ] T151 Multi-seller bundle consent plus per-seller revenue/refund/tax/commission allocation under a versioned agreement in `backend/src/modules/marketplace-bundle/multi-seller-allocation.service.ts` (FR-052)
- [ ] T152 Physical product listings (SKU, name, description, brand, category, images, variants, weight, dimensions, stock, warehouse, shipping class, delivery locations/timeline, return policy, warranty, HSN, tax rate, country of origin) with per-variant records, wired to T020, in `backend/src/modules/marketplace-physical/physical-listing.service.ts` (FR-053)
- [ ] T153 Inventory tracking per product/variant (available, reserved, damaged, returned, incoming, reorder level, warehouse, last updated) plus stock status, wired to T021, in `backend/src/modules/marketplace-physical/inventory-tracking.service.ts` (FR-054)
- [ ] T154 Stock reservation on checkout start with configurable expiry on payment failure, sold-on-success conversion, and a no-double-decrement guarantee in `backend/src/modules/marketplace-physical/stock-reservation.service.ts` (FR-055)
- [ ] T155 [P] Seller inventory alerts (low stock, out-of-stock, reservation spikes, overselling risk, inventory mismatch, returns added, damaged stock, approaching preorder deadlines) in `backend/src/modules/marketplace-physical/inventory-alerts.service.ts` (FR-056)
- [ ] T156 Shipping computation (seller shipping, future TBT-fulfilment option, courier integration, manual tracking, local delivery, store pickup; rate from location, weight, dimensions, shipping class, courier, delivery speed, free-shipping rules, quantity, insurance) in `backend/src/modules/marketplace-shipping/shipping-rate.service.ts` (FR-099)
- [ ] T157 Shipment-status tracking (Preparing…Cancelled) with buyer-facing courier, tracking number, shipment date, estimated delivery, status timeline, delivery attempts, support contact, wired to T034, in `backend/src/modules/marketplace-shipping/shipment-tracking.service.ts` (FR-100)
- [ ] T158 Physical return flow (request → eligibility check → reason selection → evidence upload → seller/admin review → return method selection → pickup/label creation → product received → condition inspection → refund/replacement) tracked Requested…Closed, in `backend/src/modules/marketplace-shipping/return-flow.service.ts` (FR-101, edge case: return-inspection mismatch)

**Checkpoint**: Mentor-offer commerce, bundling, and physical fulfilment are independently functional.

---

## Phase 12: Cancellation, Refund & Dispute remainder (supports FR-077–FR-086; cross-cutting, no single owning story)

- [ ] T159 Multi-actor cancellation (buyer, seller, admin, automated system) with rules dependent on order type, payment state, fulfilment progress, download activity, service work completed, event date, mentor session state, physical shipment state, seller acceptance, policy, in `backend/src/modules/marketplace-dispute/cancellation.service.ts` (FR-077)
- [ ] T160 Buyer-cancellation outcome rules (before payment, before seller acceptance, before download, before work begins, during cooling period, after seller failure, after missed deadline, mutual agreement → full refund, partial refund, platform credit, no refund, or manual review) in `backend/src/modules/marketplace-dispute/buyer-cancellation.service.ts` (FR-078)
- [ ] T161 Seller-cancellation consequences (reason required, buyer notification and refund, seller-performance impact, admin monitoring, capacity/inventory/coupon-usage restoration; repeated cancellations trigger suspension) in `backend/src/modules/marketplace-dispute/seller-cancellation.service.ts` (FR-079, edge case: repeated acceptance failures escalate)
- [ ] T162 Digital-product refund restriction after download (corrupted file, material description mismatch, duplicate purchase, technical access failure, copyright issue, legal requirement only) in `backend/src/modules/marketplace-dispute/digital-refund-policy.service.ts` (FR-080)
- [ ] T163 Refund evaluation by order type (service: work started/milestones/delivery/revision/seller-failure/cooperation/evidence; physical: shipment/delivery/return-condition/damage/wrong-product/window; mentor: cancellation-timing/attendance/no-show/reschedule) in `backend/src/modules/marketplace-dispute/refund-evaluation.service.ts` (FR-081)
- [ ] T164 Partial refunds with correct tax/discount/commission/seller-earnings/affiliate-commission/platform-fee re-allocation for completed milestones, partially delivered work, bundle-item cancellation, quantity returns, missing items, scope reduction, shipping adjustment, in `backend/src/modules/marketplace-dispute/partial-refund.service.ts` (FR-082)
- [ ] T165 Marketplace dispute type catalog plus dispute-form capture (order, item/milestone, issue type, description, desired resolution, evidence, communication reference, disputed amount, urgency), wired to T031, in `backend/src/modules/marketplace-dispute/dispute-submission.service.ts` (FR-083)
- [ ] T166 Dispute status lifecycle (Submitted…Appealed) plus resolution-option set (full/partial refund, seller payment release, additional delivery, revision, replacement, store credit, mutual cancellation, account warning, listing suspension, seller suspension, buyer restriction) in `backend/src/modules/marketplace-dispute/dispute-lifecycle.service.ts` (FR-084)
- [ ] T167 Dispute-evidence acceptance plus access restriction to involved parties and authorized staff only in `backend/src/modules/marketplace-dispute/dispute-evidence.service.ts` (FR-085)
- [ ] T168 Refund financial cascade (buyer credit note, seller-earning reversal, commission reversal, tax adjustment, affiliate reversal, wallet adjustment, payout recovery) in `backend/src/modules/marketplace-dispute/refund-cascade.service.ts` (FR-086, edge case: affiliate-commission reversal on refund)
- [ ] T169 [P] Refund/dispute submission and tracking UI in `web/src/app/(member)/marketplace/orders/[orderId]/dispute/page.tsx`

**Checkpoint**: The general-purpose cancellation/refund/dispute machinery underlying every order type is independently functional.

---

## Phase 13: Messaging, Review, Q&A & Discovery (supports FR-087–FR-098; cross-cutting, no single owning story)

- [ ] T170 Buyer-seller messaging (text, attachments, images, audio, video snippets, structured requirements, quotes, offers, order links, translation assistance, reporting, blocking) with off-platform-payment/contact-sharing detection using context-aware warnings before punitive action, in `backend/src/modules/marketplace-messaging/order-messaging.service.ts` (FR-087, edge case: off-platform payment move)
- [ ] T171 Pre-purchase buyer questions to sellers (seller-configurable FAQ, response hours, auto-response, availability status, linked to the listing) in `backend/src/modules/marketplace-messaging/pre-purchase-questions.service.ts` (FR-088)
- [ ] T172 Multi-dimension review submission (overall rating, quality, communication, delivery time, accuracy, value, support) with strict eligibility gating (verified payment, delivered/completed status, active review window, not fully refunded, no prior final review), wired to T032, in `backend/src/modules/marketplace-review/review-submission.service.ts` (FR-089)
- [ ] T173 Review record and moderation (abuse, hate speech, personal information, spam, extortion, irrelevance, fake reviews, review manipulation, copyright violation) — never removed merely for being negative, in `backend/src/modules/marketplace-review/review-moderation.service.ts` (FR-090)
- [ ] T174 Seller review response (thank, clarify, explain resolution, apologize, direct to support) without exposing private buyer information in `backend/src/modules/marketplace-review/review-response.service.ts` (FR-091)
- [ ] T175 Private seller-to-buyer rating for service projects (communication, requirement clarity, cooperation, payment/approval timeliness, professional conduct) — any public buyer-rating feature gated on separate legal/product review, in `backend/src/modules/marketplace-review/buyer-rating.service.ts` (FR-092)
- [ ] T176 Review edit window with internal edit-history retention and mandatory moderation review of post-dispute-resolution edits in `backend/src/modules/marketplace-review/review-edit.service.ts` (FR-093)
- [ ] T177 Review-incentive granting (reward points, badge progress, coupon) for submitting an honest, eligible review independent of rating positivity, in `backend/src/modules/marketplace-review/review-incentive.service.ts` (FR-094)
- [ ] T178 Public product Q&A (ask question, seller answer, optional community answer, helpful votes, verified-buyer badge, moderation, search, duplicate-question detection), wired to T032, in `backend/src/modules/marketplace-review/product-qa.service.ts` (FR-095)
- [ ] T179 [P] Wishlist/saved items (list creation, sharing, price-drop alerts, back-in-stock alerts, seller-update alerts, configurable privacy) and recently-viewed tracking, wired to T033, in `backend/src/modules/marketplace-discovery/wishlist.service.ts` (FR-096)
- [ ] T180 [P] Seller-follow with configurable-frequency notifications for new products/services/discounts/availability changes/portfolio items/live events in `backend/src/modules/marketplace-discovery/seller-follow.service.ts` (FR-097)
- [ ] T181 Buyer and seller notification wiring (order lifecycle, delivery, revision, refund, dispute, review, earnings, payout, listing status, policy warning) in `backend/src/modules/marketplace-discovery/marketplace-notifications.service.ts` (FR-098)

**Checkpoint**: The communication, trust-signal, and engagement surfaces are independently functional.

---

## Phase 14: Commission, Promotion & AI Tools remainder (supports FR-105–FR-107, FR-110–FR-115, FR-117–FR-126; cross-cutting, no single owning story)

- [ ] T182 Seller earning statement generation (item sale amount, seller-funded discount, TBT-funded discount, taxes, shipping collected, platform commission, payment processing fee, affiliate fee, refund reserve, withholding tax, adjustments, net seller earning), wired to T036, in `backend/src/modules/marketplace-commission/earning-statement.service.ts` (FR-105)
- [ ] T183 Earning-status tracking (Estimated, Pending, On Hold, Approved, Available, Scheduled for Payout, Paid, Reversed, Disputed, Withheld) in `backend/src/modules/marketplace-commission/earning-status.service.ts` (FR-106)
- [ ] T184 Seller wallet balance display (pending, on-hold, available, scheduled-payout, paid, reversed, tax withheld, lifetime earnings), derived from the ledger, wired to T037, in `web/src/app/(seller)/dashboard/wallet/page.tsx` (FR-109)
- [ ] T185 Payout methods (bank transfer, UPI, other approved providers, future international) with encrypted raw bank details in `backend/src/modules/marketplace-wallet/payout-method.service.ts` (FR-110)
- [ ] T186 Payout schedules (weekly, biweekly, monthly, threshold-based, manual-withdrawal, custom-contract) with eligibility gates (minimum balance, verified bank, verified tax profile, no active hold, no unresolved fraud review, no overdue obligations) in `backend/src/modules/marketplace-wallet/payout-schedule.service.ts` (FR-111)
- [ ] T187 Payout-status tracking (Draft…On Hold) with failure handling (return funds to available/hold balance, notify seller, prompt bank-detail review, require authorization for retry, create an audit record) in `backend/src/modules/marketplace-wallet/payout-status.service.ts` (FR-112)
- [ ] T188 Payout statement generation (payout ID, period, seller, orders, gross sales, refunds, commission, fees, tax withholding, adjustments, net payout, bank reference, date, status) in `backend/src/modules/marketplace-wallet/payout-statement.service.ts` (FR-113)
- [ ] T189 Seller tax profile (legal name, business name, address, GSTIN, PAN/approved identifier, tax residency, entity type, tax status, verification, withholding configuration) subject to qualified tax-professional approval, in `backend/src/modules/marketplace-wallet/seller-tax-profile.service.ts` (FR-114)
- [ ] T190 Configurable marketplace invoicing models (TBT invoices buyer directly; seller invoices buyer and TBT invoices seller for commission; another legally approved model) configurable by legal entity and seller type, in `backend/src/modules/marketplace-wallet/invoicing-model.service.ts` (FR-115)
- [ ] T191 Marketplace coupons with a defined funding type (TBT-funded, seller-funded, shared, affiliate-funded, category campaign) that always identifies who bears the discount, wired to T039, in `backend/src/modules/marketplace-promotion/coupon.service.ts` (FR-117)
- [ ] T192 Seller-created coupon constraints (minimum price, maximum discount, validity, usage limits, product eligibility, admin approval, funding confirmation) that never reduce platform commission below the contractual minimum unless explicitly allowed, in `backend/src/modules/marketplace-promotion/seller-coupon.service.ts` (FR-118, edge case: coupon-below-contractual-minimum)
- [ ] T193 Flash sales (start/end time, sale price, quantity limit, per-user limit, countdown timer, seller consent, campaign budget, auto-revert, analytics) with the countdown always reflecting real campaign timing, in `backend/src/modules/marketplace-promotion/flash-sale.service.ts` (FR-119)
- [ ] T194 Sponsored listings clearly labelled "Sponsored" (budget, bid/fixed fee, category relevance, quality threshold, policy compliance, impression/click tracking, billing, fraud filtering) that never override user safety or relevance rules, in `backend/src/modules/marketplace-promotion/sponsored-listing.service.ts` (FR-120)
- [ ] T195 Marketplace affiliate-earning calculation per `009` program rules (product eligibility, seller agreement, commission funding source, refund, cancellation, chargeback, attribution window, existing-customer policy), with reversal on refund, in `backend/src/modules/marketplace-promotion/affiliate-earning.service.ts` (FR-121, edge case: affiliate reversal on full refund)
- [ ] T196 Entitlement-driven paid-membership marketplace benefits (discounts, free downloads, premium seller access, lower service fee, early access, exclusive products, priority support, mentor discounts) in `backend/src/modules/marketplace-promotion/membership-benefits.service.ts` (FR-122)
- [ ] T197 Reward Point issuance triggers for eligible marketplace events per `006`/`009` rules in `backend/src/modules/marketplace-promotion/reward-point-trigger.service.ts` (FR-123)
- [ ] T198 Seller and buyer achievement badges (First Sale, Ten Orders, One Hundred Orders, Five-Star Seller, Fast Responder, On-Time Expert, Customer Favourite, Top Tamil Creator, TBT Certified / First Purchase, Support Local Seller, Learning Collector, Business Toolkit Builder, Trusted Reviewer) without misrepresenting professional certification, in `backend/src/modules/marketplace-promotion/achievement-badge.service.ts` (FR-124)
- [ ] T199 [P] AI-assisted seller tools (listing titles, description improvement, Tamil/Tanglish/English translation, tag suggestions, FAQ suggestions, response drafts, product summaries, marketing captions, listing-quality analysis, price-range suggestions, prohibited-claim detection, delivery checklists) consuming `008`'s shared AI gateway, with the seller remaining fully responsible for factual accuracy, in `backend/src/modules/marketplace-listing/ai-seller-tools.service.ts` (FR-125)
- [ ] T200 [P] AI-assisted buyer tools (listing comparison, review summarization, deliverable clarification, requirement drafting, service discovery, seller-question generation, plain-language licence explanation) that never fabricate seller guarantees or commitments, in `backend/src/modules/marketplace-discovery/ai-buyer-tools.service.ts` (FR-126)

**Checkpoint**: The financial-detail, promotion, and AI-augmentation surfaces are independently functional.

---

## Phase 15: Fraud, Security & Marketplace Admin Console (supports FR-132–FR-143; cross-cutting, no single owning story)

- [ ] T201 Buyer and seller fraud-signal monitoring (buyer: payment abuse, repeated refund claims, download-then-refund pattern, chargeback history, multiple accounts, coupon abuse, review extortion, seller harassment; seller: fake products, duplicate listings, fake reviews, delivery manipulation, off-platform payment requests, copyright violations, sudden payout changes, account takeover, high cancellation rate, suspicious sales spikes), wired to T042, in `backend/src/modules/marketplace-fraud/fraud-monitoring.service.ts` (FR-132)
- [ ] T202 Graduated fraud-action set (allow, warn, request verification, hold order, hold earnings, hold payout, restrict listing, remove listing, suspend account, terminate account, escalate to legal review) in `backend/src/modules/marketplace-fraud/fraud-action.service.ts` (FR-133)
- [ ] T203 High-risk seller-action gating (recent authentication, OTP/MFA, device verification, email notification, cooling period) for bank-account change, legal-name change, tax-information change, payout-method addition, fund withdrawal, account-owner change, bulk price change, in `backend/src/modules/marketplace-fraud/high-risk-action-gate.service.ts` (FR-134, edge case: compromised-session bank-change attempt)
- [ ] T204 Buyer and seller protection-surface documentation and enforcement (accurate snapshots, secure payments, download access, delivery tracking, refund/dispute process, verified reviews, seller verification, support escalation, fraud monitoring / clear requirements, delivery evidence, download logs, milestone approval, dispute evidence, review moderation, chargeback support, fraudulent-buyer detection, payout statements, transparent commission) in `backend/src/modules/marketplace-fraud/protection-surfaces.service.ts` (FR-135, FR-136)
- [ ] T205 Marketplace admin navigation and overview dashboard (25+ areas; active sellers, new applications, active/pending/rejected listings, total buyers, orders, GMV, net revenue, commission, seller earnings, refund/dispute rates, AOV, conversion, digital downloads, active service orders, physical shipments, payout due, fraud holds) in `web/src/app/(admin)/marketplace-admin/overview/page.tsx` (FR-137)
- [ ] T206 Admin seller-management view and actions (approve, request changes, restrict category, pause store, suspend/reinstate, hold/release payout, add warning, adjust commission plan, request verification, terminate) — each requiring a reason and generating an audit record, in `web/src/app/(admin)/marketplace-admin/sellers/[sellerId]/page.tsx` (FR-138)
- [ ] T207 Admin listing-management view and actions (approve, reject, request changes, pause, suspend, archive, feature, mark TBT-exclusive, warn, change category, request licence evidence, remove a prohibited file) in `web/src/app/(admin)/marketplace-admin/listings/[listingId]/page.tsx` (FR-139)
- [ ] T208 Admin order-management view and actions (cancel, refund, partially refund, extend deadline, mark delivery, approve completion, reopen order, hold/release earnings, open/resolve dispute, add internal note) with dual approval on high-impact actions, in `web/src/app/(admin)/marketplace-admin/orders/[orderId]/page.tsx` (FR-140)
- [ ] T209 Admin commission configuration (global, category, seller-level, seller-specific contract, product-specific, promotional, subscription) with minimum/maximum fee, effective dates, tax treatment, and versioned publication, wired to T035, in `web/src/app/(admin)/marketplace-admin/commissions/page.tsx` (FR-141)
- [ ] T210 Payout administration (seller, available/on-hold balance, verification, bank status, tax status, payout amount/schedule, risk flags, previous failures; approve, hold, reject, retry, cancel, export, add-note actions) in `web/src/app/(admin)/marketplace-admin/payouts/page.tsx` (FR-142)
- [ ] T211 Dual-approval requirement for high-value seller payout, manual earning adjustment, large refund, negative-balance write-off, payout bank override, seller termination with outstanding balance, commission contract change, fraud-hold release, and dispute settlement above a defined threshold, wired to `001`'s RBAC, in `backend/src/modules/marketplace-fraud/dual-approval.service.ts` (FR-143)
- [ ] T212 [P] Marketplace admin console UI shell (remaining sections: stores, categories, digital/physical products, services, projects, proposals, deliveries, milestones, returns, disputes, reviews, copyright, sponsored listings, fraud review, reports, settings, audit logs)

**Checkpoint**: The full fraud-defense and marketplace-operations console is independently functional.

---

## Phase 16: Polish & Cross-Cutting Concerns

- [ ] T213 [P] Marketplace reporting suite (seller, seller verification, listing, product sales, service order, project, proposal, marketplace order, digital download, physical shipping, return, refund, dispute, review, commission, seller earnings, payout, tax, affiliate sales, coupon, category performance, search, conversion, fraud, copyright complaint) plus the defined analytics event taxonomy (FR-144)
- [ ] T214 [P] Business-metrics tracking (GMV, net marketplace revenue, total orders, AOV, buyer conversion, repeat purchase rate, active buyers/sellers, seller activation rate, listing approval rate, time to first sale, digital download rate, service completion rate, on-time delivery rate, refund/dispute/chargeback rate, seller/buyer retention, commission revenue, payout success rate) (FR-145)
- [ ] T215 [P] Seller-facing analytics (listing views, search impressions, CTR, conversion rate, orders, revenue, earnings, refunds, AOV, customer locations, traffic sources, saved count, repeat buyers, rating, response time, delivery performance, product/package performance) without unnecessary buyer-PII exposure (FR-146)
- [ ] T216 [P] Admin search analytics (top/zero-result searches, search conversion, category demand, unmet service demand, Tamil/Tanglish search terms, trending skills, price sensitivity, location demand) (FR-147)
- [ ] T217 Security hardening pass against the full marketplace security test suite (price/commission tampering, seller-ID replacement, unauthorized download, signed-URL reuse, download-limit bypass, cross-order/cross-seller file access, payout privilege escalation, bank-detail exposure, listing script injection, malicious file upload, ZIP bomb, CSV injection, review manipulation, fake-order creation, coupon abuse, inventory oversell, duplicate fulfilment, refund abuse, webhook replay, proposal spam, open redirect, off-platform payment-link abuse) (FR-149)
- [ ] T218 Privacy and data-retention pass (buyer-contact only-when-necessary sharing, seller-contact protected by default, order-message participant restriction, role-controlled financial data, encrypted bank data, restricted tax data, download-log retention, sensitive-project-file retention, aggregate-only buyer data in seller analytics, marketing consent, legally-required-record preservation on account deletion) plus configurable retention periods per category (FR-150, FR-151)
- [ ] T219 Reliability pass: background jobs (file scanning, preview generation, watermarking, search indexing, expired-cart cleanup, inventory-reservation release, order auto-completion, delivery/review reminders, earning release, payout generation, seller-level calculation, fraud scanning, report generation, expired signed-link cleanup, product-update notifications) and monitoring alerts (listing-approval backlog, malware-scan failures, digital-download failures, order-creation failures, payment-success drop, inventory mismatch, seller-cancellation spike, late-delivery spike, refund/dispute spikes, review manipulation, copyright complaints, commission-calculation mismatch, payout failure, negative seller balance, fraud-hold backlog, message-abuse spike, search failure, marketplace-conversion drop) (FR-152, FR-153)
- [ ] T220 Observability pass: structured action logging (request/user/seller/listing/order/payment/delivery/payout ID, actor role, action, previous/new state, amount, currency, timestamp, device/source, error code, risk signal) with sensitive-information masking (FR-154)
- [ ] T221 [P] Low-network resilience pass (preserved cart, resumable file upload, retried failed image upload, locally-and-server-saved listing drafts, preserved buyer requirements, safe payment-status recovery, resumable downloads where storage supports it, duplicate-order-submission prevention, offline access to purchased-product licences/QR where appropriate) (FR-155)
- [ ] T222 [P] Accessibility pass (keyboard navigation, screen-reader labels, accessible product gallery, alt text, clear prices/licence info, form-error association, accessible rating controls, non-colour order-status indication, accessible file upload/messaging, high contrast, large touch targets, preview-video captions, audio transcripts where provided, focus management, reduced motion) (FR-156)
- [ ] T223 [P] Localization pass (navigation, categories, descriptions, checkout, orders, delivery, refunds, disputes, reviews, seller dashboard, notifications, errors in Tamil/Tanglish/English; seller multi-language listings supporting seller-provided/AI-assisted-marked-for-review/professional/admin-approved translation modes, with legal/licence terms always requiring human verification) (FR-157)
- [ ] T224 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (refund/dispute/revision-window defaults, payout threshold/schedule/dual-approval-threshold defaults, escrow legal structure, repeat-infringer strike threshold)
- [ ] T225 Final audit: cross-check every FR-001–FR-161 against an implementation or validation task; verify the Constitution Article V co-citation and the Security & Compliance Baseline's signed-URL/watermarking citation are concretely implemented, not just noted
- [ ] T226 Run `quickstart.md` validation end-to-end across all 9 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends only on `001`'s RBAC/audit-log and produces the listing/order/commission/ledger infrastructure every subsequent phase depends on.
- **P1 stories (US1–US4)**: US1 (seller onboarding) is the foundational gate and must ship first; US2 (digital download) and US3 (service fulfilment) both depend on US1 producing an approved seller with an active store, and can build in parallel with each other; US4 (multi-seller cart splitting) depends on Foundational's order/suborder entities and benefits from US2/US3 existing to have real listing types to check out, but its core splitting logic can be validated independently.
- **P2 stories (US5–US8)**: US5 (escrow holding) is a refinement of US3's order-completion flow and depends on it directly; US6 (freelance proposals) depends on Foundational plus US3's order machinery (an awarded proposal becomes an order); US7 (IP takedown) depends only on Foundational's listing/moderation infrastructure and can build in parallel with US5/US6; US8 (seller reputation) depends on US1–US4 producing enough order/review history to compute meaningful levels.
- **P3 story (US9)** depends on US1's seller wallet and `009`'s payout infrastructure having processed at least one payout — build last among the prioritized stories.
- **Phase 11b (Mentor Offers/Bundles/Physical Fulfilment)** depends on Foundational's listing entities and `007`'s mentor infrastructure for the mentor-offer path; can build in parallel with US5–US8.
- **Phase 12 (Cancellation/Refund/Dispute remainder)** depends on US2/US3/US4's order infrastructure; can build in parallel with Phase 11b.
- **Phase 13 (Messaging/Review/Discovery)** depends on Foundational's review/messaging entities and US1's seller profiles; can build in parallel with Phase 12.
- **Phase 14 (Commission/Promotion/AI Tools remainder)** depends on Foundational's commission engine (T048–T050) and US1's seller wallet; can build in parallel with Phase 13.
- **Phase 15 (Fraud/Security/Admin Console)** depends on every module it surfaces (sellers from US1, listings from Foundational, orders from US2–US4, disputes from Phase 12, payouts from Phase 14) — build after those phases are stable.
- **Polish (Phase 16)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (listing lifecycle, order/suborder entities, commission engine, ledger) → **STOP and VALIDATE** the three Foundational contract tests (order-splitting, signed-download-no-public-URL, ledger-append-only) pass → US1 (seller onboarding) → **STOP and VALIDATE** an approved seller can activate a store → US2 (digital download) + US3 (service fulfilment) in parallel → US4 (multi-seller cart splitting) → **STOP and VALIDATE** the core buy-and-fulfil paths across digital, service, and multi-seller checkout are trustworthy end-to-end → US5 (escrow holding, extends US3) → US6 (freelance proposals) → US7 (IP takedown) → Phase 11b (mentor offers/bundles/physical) + Phase 12 (cancellation/refund/dispute) in parallel → US8 (seller reputation) → Phase 13 (messaging/review/discovery) + Phase 14 (commission/promotion/AI) in parallel → US9 (negative-balance recovery) → Phase 15 (fraud/security/admin console) → Polish.
