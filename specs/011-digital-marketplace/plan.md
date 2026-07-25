# Implementation Plan: Digital & Services Marketplace: Vendors, Orders & Commission Engine

**Branch**: `011-digital-marketplace` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-digital-marketplace/spec.md`

## Summary

This feature builds the platform's multi-vendor commerce engine: a controlled seller-onboarding/verification pipeline with granular team roles; digital-product listings with signed, watermarked, download-limited file delivery; Fiverr-style service packages with buyer requirements, delivery/revision/milestone workflows, and escrow-style payment holding; multi-seller cart checkout that splits into independently-allocated seller suborders; a freelancer project/proposal marketplace; mentor-offer listings that wrap `007`'s mentor infrastructure; physical-product inventory and shipping; an IP-complaint/takedown pipeline; seller reputation/leveling; a full commission engine and seller wallet/payout system with negative-balance recovery; and the complete marketplace administration console.

This feature is **co-cited by the constitution** for **Article V (Ledger-Based Internal Economies)** — "Vol 11: seller earning statements itemizing every deduction" (FR-105, FR-109) — alongside `006` and `009`, and is **directly named** in the constitution's Security & Compliance Baseline — "Vol 11: signed URLs, watermarking" (FR-034, FR-036). It is not the constitution's named source for any other single article, but its own requirements independently implement the same principles throughout: server-authoritative pricing/commission/entitlement (FR-003, aligning with Article I), historical order snapshotting (FR-004, aligning with Article IV), audit-trailed seller-level calculation with no manual inflation (FR-016, aligning with Article VIII), and AI-assisted-never-autonomous seller/buyer tools (FR-125, FR-126, aligning with Article II).

Per spec.md's own Assumptions, this feature **defers, never duplicates**: payment gateway integration, the core financial ledger/double-entry engine, GST calculation, and affiliate program mechanics to `009` (this spec references them only at marketplace-specific integration points — commission, refund reversal, affiliate attribution on marketplace sales); mentor session scheduling/video mechanics to `007` (this spec covers only the commerce wrapper — mentor offer as a sellable listing, purchase → entitlement → fulfilment → earning); the future recruiter/hiring-pipeline system to `012` (the freelancer project/proposal mechanism here is a distinct, marketplace-internal contract-work flow, not a hiring pipeline); and the underlying points-ledger implementation to `006` (this spec defines only which marketplace events trigger points/badges, never the ledger itself, and preserves `006`'s rule that rewards never depend on a positive rating). It **reuses `001`'s layered RBAC** for the granular seller-team role hierarchy and admin permission checks, and its audit-log pattern for the `Marketplace Audit Log Entry`. It builds its **own** independent state machines for Seller Application, Listing, Marketplace Order/Suborder, Delivery, Dispute, Earning, and Payout — none reused from a prior feature, since marketplace commerce semantics are domain-specific here (continuing the discipline established since `004`).

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–010.

**Primary Dependencies**: NestJS, Next.js, Flutter; malware scanning and file-processing pipeline shared with `002`/`004`/`005`/`007`/`008`'s established pattern; a signed-URL/watermarking service for digital file delivery (FR-034, FR-036); a job scheduler for cart-reservation expiry, order auto-completion, earning release, payout generation, and seller-level recalculation (FR-152 — no vendor named, consistent with the same gap in prior features); AI-assisted listing/buyer-tool integration consuming `008`'s shared AI gateway (FR-125, FR-126) rather than a parallel AI stack; courier/shipping-provider integration for physical fulfilment (FR-099 — no vendor named).

**Storage**: PostgreSQL (~40 entities per spec.md's Key Entities — seller/store/team, listing/file/licence, service/freelancer/mentor-offer, bundle/physical-product/inventory, cart/order/suborder, delivery/revision/milestone, dispute/refund, review/Q&A, commission/earning/wallet/payout, promotion/coupon, IP-complaint, fraud domains), object storage with encrypted-at-rest, signed/time-limited URLs for digital files and order attachments (FR-034, FR-067), Redis (inventory-reservation locks, cart/checkout idempotency, real-time stock counters).

**Testing**: Jest (backend — multi-seller order-splitting-allocation, signed-download-no-public-URL, and append-only-ledger-no-direct-write contract tests are the highest-stakes tests in this feature, matching SC-001, SC-002, and SC-004), Playwright (web e2e — seller onboarding, checkout, order workspace), Flutter test (mobile — offline cart/draft persistence per FR-155).

**Target Platform**: Web + mobile; seller dashboard and buyer marketplace surfaces are both first-class.

**Performance Goals**: Inventory reservation and release operate under concurrency without overselling; multi-seller checkout completes as a single atomic parent-order-plus-suborder creation; background jobs (earning release, payout generation, seller-level recalculation, signed-link cleanup) run on a defined cadence without blocking user-facing flows.

**Constraints**: Final price, commission, seller earning, download permission, order completion, refund amount, payout balance, inventory availability, and service-milestone release are always server-computed, never trusted from the client (FR-003, Constitution Article I alignment); every order preserves an immutable historical snapshot of product/price/seller/licence/commission/tax/delivery terms, unaffected by later configuration changes (FR-004, SC-003, Constitution Article IV alignment); a purchased digital file is served only via signed, time-limited, user/order/version-scoped URLs — never a public permanent URL (FR-034, SC-002); seller earnings are always a derived sum over an append-only ledger, never a directly mutable balance field (FR-109, SC-004, Constitution Article V); high-risk seller actions (bank change, payout-method change, withdrawal, ownership change, bulk price change) require recent re-authentication/MFA and produce an audit record before taking effect (FR-134, SC-005); a service order's fulfilment clock starts only after mandatory buyer requirements are submitted (FR-065); an open dispute always blocks auto-completion regardless of an expired review-window timer (FR-076, edge case); a negative seller balance is resolved only through the defined recovery paths, never a silent unaudited rewrite (FR-116, SC-010).

**Scale/Scope**: ~40 data entities, 161 functional requirements (FR-001–FR-161, including 4 NEEDS CLARIFICATION items FR-158–FR-161), 9 user stories, and a marketplace admin console spanning 25+ navigation areas (FR-137).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Price, commission, seller earning, download permission, order completion, refund amount, payout balance, inventory, and milestone release are all server-computed; client values are untrusted | **PASS — direct implementation (not the constitution's named source for this article)** | FR-003 |
| II. AI Is Assistive, Never Autonomous | Seller/buyer AI tools are advisory-only, never fabricate seller guarantees, and the seller remains fully responsible for published accuracy; consumes `008`'s shared AI gateway rather than a parallel stack | **PASS (aligns; extends 008)** | FR-125, FR-126 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | Sponsored listings clearly labelled, never misrepresented as organic; guaranteed-income scams and unsupported claims are prohibited listing content; achievement badges must not misrepresent professional certification | **PASS (aligns; not the constitution's named source for this article)** | FR-007, FR-120, FR-124, FR-127 |
| IV. Historical Immutability | Every order snapshots product/price/seller/licence/commission/tax/delivery terms at purchase time; later configuration changes never retroactively alter existing orders | **PASS (aligns; not the constitution's named source for this article)** | FR-004, SC-003 |
| V. Ledger-Based Internal Economies | **Constitution-cited co-source** ("Vol 11: seller earning statements itemizing every deduction") — seller wallet balance is always derived from an append-only earning ledger, never directly writable | **PASS — cited source** | FR-105, FR-109, SC-004 |
| VI. Consent Is First-Class | Seller agreement consent recorded with timestamp and version; private seller contact details never shown without explicit consent; marketing respects consent | **PASS** | FR-013, FR-015, FR-150 |
| VII. Layered, Explicit RBAC With Approval Chains | Granular seller-team roles (Owner, Manager, Listing Manager, Order Manager, Support, Fulfilment, Finance Viewer, Analyst) reuse `001`'s RBAC directly; dual approval required for high-value payouts, large refunds, negative-balance write-offs, and other high-risk finance actions | **PASS — extends 001** | FR-019, FR-134, FR-143 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | Seller level/reputation calculated only from documented inputs, never manually inflatable without an audited justification; sponsored placement never overrides relevance/safety rules | **PASS (aligns; not the constitution's named source for this article)** | FR-016, FR-108, FR-120 |
| IX. Action Before Consumption | N/A — this is a commerce feature, not a learning or growth-mechanic module | **PASS (N/A)** | — |
| Localization & Language Requirements | Full marketplace surface (navigation, checkout, orders, disputes, reviews, notifications) localized in Tamil, Tanglish, and English; legal/licence terms always require human verification regardless of translation mode | **PASS (aligns; not the constitution's named source for this article)** | FR-157 |
| Security & Compliance Baseline | **Directly named** ("Vol 11: signed URLs, watermarking") — every digital download signed and time-limited; watermarking with buyer identity; malware scanning; encrypted bank/tax data; MFA for high-risk seller actions | **PASS — directly named source** | FR-034, FR-036, FR-134, FR-148 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/011-digital-marketplace/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: exact numeric defaults for refund/dispute/revision-request windows per product type, payout minimum-balance threshold and default schedule, the dual-approval monetary threshold, the legal structure for escrow-style payment holding under India-regulated payment flows, and the repeat-infringer strike threshold
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`010`'s structure — no new top-level projects; commission/refund/affiliate integration calls into `009`, mentor-offer fulfilment reads `007`'s session infrastructure, AI tools call `008`'s gateway, and reward/badge triggers emit to `006`.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── marketplace-seller/       # Seller Application/Profile, Store Profile, Seller Team Member, onboarding pipeline (FR-008–FR-021)
│   │   ├── marketplace-listing/      # Listing/Listing Version, Marketplace Category, listing moderation pipeline (FR-022–FR-029)
│   │   ├── marketplace-digital/      # Digital File/File Version, Licence Type, Download Grant/Signed URL, file-processing pipeline (FR-030–FR-039)
│   │   ├── marketplace-service/      # Service Package/Add-on, Custom Service Request/Offer (FR-040–FR-044)
│   │   ├── marketplace-freelance/    # Freelancer Profile, Project Posting, Proposal (FR-045–FR-048)
│   │   ├── marketplace-mentor-offer/ # Mentor Listing/Offer — commerce wrapper over `007` (FR-049–FR-050)
│   │   ├── marketplace-bundle/       # Product Bundle, multi-seller consent/allocation (FR-051–FR-052)
│   │   ├── marketplace-physical/     # Physical Product/SKU/Variant, Inventory Record (FR-053–FR-056)
│   │   ├── marketplace-cart-order/   # Cart/Cart Item, Marketplace Order (Parent), Seller Suborder (FR-057–FR-067)
│   │   ├── marketplace-fulfilment/   # Buyer Requirement Submission, Delivery Submission/Version, Revision Request, Service Milestone (FR-068–FR-073)
│   │   ├── marketplace-escrow/       # Escrow Hold/Pending Earning Record, order completion, cancellation (FR-074–FR-079)
│   │   ├── marketplace-dispute/      # Refund/Partial Refund, Return (Physical), Dispute/Dispute Evidence (FR-080–FR-086)
│   │   ├── marketplace-messaging/    # buyer-seller messaging, pre-purchase Q&A to sellers (FR-087–FR-088)
│   │   ├── marketplace-review/       # Review, Q&A Entry, seller reputation inputs (FR-089–FR-095)
│   │   ├── marketplace-discovery/    # Wishlist/Saved Item, Seller Follow (FR-096–FR-098)
│   │   ├── marketplace-shipping/     # Shipment/Tracking Record, physical return flow (FR-099–FR-101)
│   │   ├── marketplace-commission/   # Commission Rule, Seller Earning Statement/Ledger Entry (FR-102–FR-108)
│   │   ├── marketplace-wallet/       # Seller Wallet, Payout Method/Record/Statement, Negative Balance Adjustment (FR-109–FR-116)
│   │   ├── marketplace-promotion/    # Marketplace Coupon, Flash Sale, Sponsored Listing, Affiliate Attribution (FR-117–FR-124)
│   │   ├── marketplace-ip/           # IP Complaint/Takedown Record, prohibited-items enforcement (FR-127–FR-131)
│   │   ├── marketplace-fraud/        # Fraud Signal/Fraud Hold, graduated fraud actions, high-risk-action gating (FR-132–FR-136)
│   │   └── marketplace-admin/        # admin console, reporting, security/reliability/observability (FR-137–FR-157)
│   └── common/                       # reused from 001: RbacGuard, audit-log interceptor; reused from 002/004/005/007/008: malware scanner; calls into 007/008/009 as integration points
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (public)/
        └── marketplace/{page.tsx, [listingSlug]/page.tsx, sellers/[sellerSlug]/page.tsx, projects/page.tsx}
    └── (member)/
        └── marketplace/{cart,checkout,orders,downloads,wishlist,following}/
    └── (seller)/
        └── dashboard/{overview,listings,orders,deliveries,messages,reviews,analytics,earnings,wallet,payouts,coupons,team,store-settings}/
    └── (admin)/
        └── marketplace-admin/{overview,sellers,listings,categories,orders,disputes,reviews,copyright,commissions,payouts,promotions,fraud-review,reports,settings}/

mobile/
└── lib/features/
    └── marketplace/                  # browse, checkout, seller dashboard, offline cart/draft persistence, download management
```

**Structure Decision**: 20 new backend modules under `marketplace-*`, each mapping to one of spec.md's FR groupings. `marketplace-cart-order` (order-splitting) and `marketplace-digital` (signed-download security) are the two modules with the strictest correctness/security requirements and are built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
