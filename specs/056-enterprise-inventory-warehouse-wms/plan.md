---
description: "Implementation plan for Feature 056 — Enterprise Inventory & Warehouse Management (WMS)"
---

# Implementation Plan: Enterprise Inventory & Warehouse Management (WMS)

**Branch**: `056-enterprise-inventory-warehouse-wms` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/056-enterprise-inventory-warehouse-wms/spec.md`

## Summary

This feature (Volume 14 Part 2, Chapter 23) builds the enterprise-grade multi-warehouse System of Record: an Organization → Business Unit → Warehouse → Building → Floor → Zone → Aisle → Rack → Shelf → Bin → Storage Position location hierarchy; a 14-stage inventory lifecycle (Item Registration → Archival) with an immutable, real-time Stock Ledger; barcode/QR/RFID-driven inbound (14-step) and outbound (14-step) workflows plus offline-capable mobile scanning; an AI Warehouse Assistant answering natural-language operational questions; AI-driven dynamic slotting and picking-route optimization; a Warehouse Digital Twin for pre-commit simulation; a full inter-warehouse Transfer lifecycle; AI-assisted replenishment/demand planning; asset tracking and lifecycle management for warehouse equipment; reverse logistics (returns/damage/expiry/obsolescence/disposal); workforce task assignment and productivity monitoring; and an explicitly scoped-out "Future Automation" roadmap section (FR-080, autonomous robotics/ASRS/computer-vision counting) governed by Constitution Article II. Article II is the single most-repeated citation pattern in this spec — appearing as an FR-text-verbatim requirement (FR-043, FR-044) and again as the governing constraint on the entire AI Warehouse Intelligence section (FR-036–FR-046) and the Future Automation roadmap (FR-080), the same "reinterpret 'configurable' as mandatory/non-bypassable" pattern this session established with `055`.

## Ownership & Dependency Analysis

Per this session's standing discipline, every cross-feature reuse claim in spec.md's own Assumptions was checked against the *actual, current* plan.md of the referenced feature rather than trusted at face value, and the feature was checked for overlaps its own Assumptions did not mention.

### §1. Customer Sales-Order Demand Signal vs. `011` (Digital Marketplace) — NEW finding, only partially caught by spec.md

Spec.md's own Assumptions state this feature "depends on Feature 011 ... for physical-product order/fulfillment demand signals that drive outbound picking, packing, dispatch, and stock reservation — the marketplace is the assumed source of customer sales orders consumed by this WMS, not re-specified here." This was verified against `011`'s actual plan.md: `011` does own a canonical `marketplace-cart-order` module (Cart/Cart Item, Marketplace Order (Parent), Seller Suborder, FR-057–FR-067) — the sales-order source claim is confirmed correct.

However, `011`'s plan.md also revealed something spec.md's own Assumptions do **not** mention: `011` already implements its own `marketplace-physical` module (FR-053–FR-056) containing a seller-facing **Inventory Record** — "available, reserved, damaged, returned, incoming stock, reorder level, warehouse, last updated" quantities per product/variant, plus its own stock-reservation-on-checkout mechanic (reserve on checkout start, expire on payment failure, convert to sold on payment success, guard against double-decrement). This is a genuine, independently-specified inventory-tracking surface covering nearly the same fields (available/reserved/damaged/returned stock, warehouse reference) that `056`'s Stock Ledger and Inventory Item Master govern at enterprise depth.

**Ownership decision**: `011`'s lightweight, per-listing Inventory Record is **not** redundant for sellers who fulfill from their own stock outside any `056`-governed warehouse (dropship, personal inventory, small sellers) — it remains `011`'s own independent, appropriately-scoped tracking for that population. But for physical-product listings fulfilled from a TBT-operated, `056`-governed warehouse, `011` MUST consume `056`'s real-time Stock Ledger and Warehouse entity as the source of truth for available/reserved/damaged/returned quantities rather than maintaining an independently-computed second truth for the same physical stock — mirroring the reuse-vs-independent-build pattern already established for `054`'s Subscription orchestration over `009`'s canonical Subscription state machine. The checkout-time reservation *trigger* (initiating the hold, starting the expiry timer) remains `011`'s UX responsibility; the actual Stock Ledger entry and stock-status transition for warehouse-governed items is written by `056`, not duplicated by `011`. This boundary is new — surfaced by this plan, not stated by either feature's own spec.md — and is the tenth consecutive feature this session to surface a genuine, previously-uncaught cross-feature dependency during planning (after `041`/`042` through `055`/`009`).

### §2. Financial Reconciliation vs. `009` (Membership, Payments & Revenue Operations) — confirmed clean

Spec.md's own Assumptions state this feature depends on `009` "for the financial reconciliation of inventory-related monetary events (damaged-goods write-offs, disposal losses, stock adjustment financial impact, transfer financial updates)," defining only the inventory-side trigger and audit record while `009` handles general-ledger posting. Verified against `009`'s actual plan.md: `009` maintains "a finance-approved chart of ledger accounts spanning 16+ account types" and is the constitution's primary cited source for Article V (Ledger-Based Internal Economies). This confirms `009` as the correct, canonical GL-posting destination. **Ownership decision**: `056` emits inventory-side financial-impact events (write-off amount, disposal loss, adjustment value, transfer cost) as inputs to `009`'s ledger; `056` does not implement its own general ledger.

### §3. Procurement Boundary vs. `055` (Enterprise Procurement Platform) — confirmed clean, mutual

Spec.md's own Assumptions state this feature depends on `055` "as the upstream source of Purchase Orders validated during goods receipt," with `056` not duplicating procurement/vendor requirements. This was verified against `055`'s actual, already-written plan.md (§2): `055`'s own Ownership & Dependency Analysis independently states the identical boundary from the other direction — "physical warehouse operations referenced by Inventory Procurement Automation are the responsibility of `056` ... with `055` owning only the procurement-triggering (reorder rule → Purchase Request/Order) side." Both features' plans now confirm this boundary from opposite sides before either was fully built — a rare mutual-agreement case matching the `045`/`053` precedent. **Ownership decision**: `055` remains canonical for Purchase Request/Purchase Order/Approval/Three-Way-Match; `056` owns Goods Receipt execution, putaway, and the physical Stock Ledger update that follows a `055`-issued PO's arrival at the dock (FR-013). The `009`-vs-`055`-vs-`056` "Purchase Order" entity referenced during Goods Receipt validation (FR-013, FR-023) is `055`'s vendor-side/AP Purchase Order per `055/plan.md` §3's disambiguation, not a fourth independent PO entity.

### §4. Supplier-Side Purchase Recommendation Follow-Through vs. `057` — CONFIRMED (updated 2026-07-23, per `057/plan.md`)

Spec.md's own Assumptions state this feature depends on `057` (Chapter 24, Procurement & Supplier Management) "for supplier-side purchase recommendation follow-through." `057` has now been planned: its own spec.md confirms `055` (not `057`) remains the canonical, detailed procurement specification, with `057` contributing only the AI Procurement Assistant, AI Duplicate/Price/Fraud Detection, Vendor Portal, Contract Alerts, and named Integrations on top of `055`'s data model — `057`'s FR-022 AI Procurement Intelligence (Supplier Recommendations, Demand Forecast, Procurement Planning support) is the supplier-side purchase-recommendation layer this feature's replenishment/purchase-recommendation outputs (FR-054–FR-056) feed into. `057/plan.md` §6 independently confirms this same `055`/`056` procurement/warehouse boundary from its own side. Both this feature's dependency on `057` and `055`'s claimed canonicity over `057` are now confirmed, not forward-declared.

### §5. AI Infrastructure vs. `008` (AI Assistant Platform) — confirmed clean, gateway reused, domain logic new

Not mentioned in spec.md's own Assumptions, so checked independently. `008`'s plan.md confirms a dedicated `ai-gateway`/`ai-guardrails` module pair (provider routing, fallback orchestration, human-review/override enforcement) that every other feature's AI touchpoints are expected to route through. `008`'s own `ai-business-assistant` mode (FR-030–FR-039) is scoped to entrepreneurial idea generation/validation for individual TBT members — not an enterprise operational-data Q&A assistant against live warehouse metrics — so it is not a reusable behavioral template for the AI Warehouse Assistant. **Ownership decision**: `056`'s AI Warehouse Assistant, dynamic slotting engine, digital twin, and all other AI Warehouse Intelligence outputs (FR-036–FR-046, FR-062, FR-067) route through `008`'s `ai-gateway`/`ai-guardrails` for provider access and the human-review/override/confidence-threshold discipline, but the domain-specific NLP query grounding, warehouse-metrics retrieval, and recommendation-generation logic is `056`'s own new, original build — the same pattern already established for `042`'s EDSS, `049`'s KPI intelligence, and `052`'s AI Customer Intelligence.

### §6. Auth & RBAC vs. `001`/`003`/`016` — confirmed clean, standard layered-extension pattern

Not mentioned in spec.md's own Assumptions. `056`'s 14 Workforce Roles (Warehouse Manager, Shift Supervisor, Inventory Controller, Receiving Operator, etc., FR-070) and its warehouse-scoped access controls (FR-002, security levels on Warehouse/Location) configure `001`'s existing RBAC engine and follow `016`'s established layered-extension pattern rather than building a new authorization system. Worker mobile app login (FR-073) reuses `003`'s auth/identity foundation.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile — worker handheld/scanning app) — consistent with 001–055.

**Primary Dependencies**: `011`'s marketplace order/fulfillment demand signal as the trigger for outbound workflows, with `011`'s per-listing Inventory Record reframed to consume `056`'s Stock Ledger for warehouse-governed items (per §1); `009`'s general-ledger infrastructure as the system of record for inventory-related financial postings (per §2); `055`'s Purchase Order as the upstream trigger validated during Goods Receipt (per §3, mutually confirmed); `057` (not yet planned) as the deferred supplier-side purchase-recommendation follow-through (per §4); `008`'s AI gateway/guardrails for every AI Warehouse Intelligence, slotting, digital-twin, and asset-prediction capability (per §5); `001`/`016`'s layered RBAC and `003`'s auth foundation for workforce/portal access (per §6).

**Storage**: PostgreSQL (13 entities per Key Entities: Warehouse, Warehouse Zone, Storage Location, Inventory Item (Item Master), Stock Ledger Entry, Warehouse Task, Transfer Record, Asset (Asset Tag), Warehouse Digital Twin Simulation, AI Recommendation, Warehouse Worker Profile, WMS Exception, Return/Disposal Record — with the location hierarchy, Stock Ledger, and Inventory Item Master forming the enterprise system of record `011`'s per-listing Inventory Record consumes for warehouse-fulfilled products, per §1).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: cycle-count-variance-reconciliation-99pct-accuracy for SC-001, real-time-stock-ledger-zero-double-counting-across-warehouses for SC-002 — directly exercising the §1 boundary between `011`'s reservation trigger and `056`'s ledger write — and ai-warehouse-recommendation-human-approval-workforce-gate for FR-042/043/044 and SC-008), Playwright (web/mobile e2e — barcode/RFID goods receipt, AI Warehouse Assistant query flow, digital twin simulation, inter-warehouse transfer lifecycle).

**Target Platform**: Web (Warehouse Management Portal, rendered inside `017`'s workspace shell; executive inventory dashboard) and mobile/handheld (worker scanning app, offline-capable, per FR-073/FR-033).

**Performance Goals**: Per SC-002, stock-ledger updates must propagate across all connected systems within seconds of the triggering transaction, with zero unresolved double-counting incidents — this directly governs the `011`/`056` reservation-and-ledger boundary established in §1. Per FR-047, cross-warehouse synchronization of quantity/status/location data must be real-time.

**Constraints**: Zero disposal action may execute without prior approval and an audit record (FR-068, SC-007); zero AI-driven workforce recommendation may make a final disciplinary/employment decision without authorized human review (FR-044); zero high-value stock adjustment may bypass multi-level approval (FR-025); zero warehouse digital twin simulation output may be applied to the live warehouse configuration without an explicit human approval step (FR-045, User Story 4 acceptance scenario 3); zero physical stock quantity for a `056`-governed warehouse may be independently recomputed by `011` rather than consumed from `056`'s Stock Ledger (per §1).

**Scale/Scope**: 13 entities, 80 FRs (FR-001–FR-080, including the roadmap FR-080), 8 user stories, unlimited warehouses across 19 warehouse types, a 10-level location hierarchy, a 14-stage inventory lifecycle, 14-step inbound and outbound workflows, 9 preserved NEEDS CLARIFICATION items (2 explicitly self-flagged by spec.md's own Assumptions re: numeric SLA defaults and the digital-twin/offline-sync/dispute-reversal gaps, 6 from Edge Cases, plus this plan's own §1 finding requiring the `011` reconciliation to be built rather than assumed), no worsening of any previously-accumulated Wave 2/3 architecture gaps, one confirmed-clean *mutual* boundary with `055` (§3), and one new, substantial cross-feature dependency surfaced with `011` (§1) — the tenth consecutive feature this session to surface a genuine, previously-uncaught cross-feature dependency during planning.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS — **FR-text-verbatim cited** | Stock Ledger entries, cycle-count reconciliation, and Three-Way-Match-adjacent Goods Receipt validation are all server-computed and server-enforced (FR-022, FR-034); client scan events never directly mutate stock without server validation. |
| II. AI Is Assistive, Never Autonomous | PASS — **FR-text-verbatim cited repeatedly, including a dedicated roadmap-scoping FR** | FR-043 and FR-044 explicitly require human review/override/audit for all AI Warehouse Intelligence outputs and prohibit autonomous disciplinary decisions; FR-080's roadmap automation (AMR, robotic picking, ASRS, drone counting) is explicitly required to "remain configurable, safety-controlled, continuously monitored, and subject to authorized human oversight when implemented" — the same reinterpretation discipline established in `055`. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | AI slotting/transfer/replenishment recommendations are explicitly advisory pending human approval (FR-042, User Story 3 acceptance scenario 3); no guaranteed-benefit claims attached to AI outputs. |
| IV. Historical Immutability | PASS — **FR-text-verbatim cited** | FR-077 explicitly requires immutable audit logs for every inventory operation, capturing before/after value, retained per organization retention policy. |
| V. Ledger-Based Internal Economies | PASS (reused, not redefined) | The Stock Ledger is `056`'s own append-only, auditable ledger for physical inventory; monetary posting reuses `009`'s financial ledger rather than a new one (per §2). |
| VI. Consent Is First-Class, Per-Channel, and Versioned | N/A | Internal B2B/operations tool; FR-076's multi-channel alerting is operational notification, not marketing consent. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS | Multi-level approval required for high-value adjustments (FR-025) and disposals (FR-068); workforce roles and warehouse security levels configure `001`'s/`016`'s existing engine (per §6). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Worker productivity/accuracy scoring (FR-074) is transparent and configurable, not a purchasable status; AI health scores are operational, not monetized. |
| IX. Action Before Consumption | PASS | Every inventory item, task, transfer, and asset progresses through a governed lifecycle with audit history (FR-012, FR-049, FR-060) before being considered "available" or "complete." |
| Localization & Language Requirements | PASS (not primary focus, inherited) | Internal enterprise operations tool; no direct end-customer-facing localization surface beyond the platform's general multi-language requirement. |
| Security & Compliance Baseline | PASS | FR-035 (anti-tampering: duplicate barcode, RFID cloning, label tampering protections) and FR-077 (searchable, exportable, retention-governed audit logs) directly implement the baseline. |

## Project Structure

### Documentation (this feature)

```
specs/056-enterprise-inventory-warehouse-wms/
├── spec.md
├── plan.md
├── research.md         # 9 NEEDS CLARIFICATION items from Assumptions/Edge Cases + this plan's §1 finding
├── data-model.md        # 13 entities (Stock Ledger/Inventory Item Master as the §1 source of truth for 011)
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── cycle-count-variance-reconciliation-99pct-accuracy.contract.md
    ├── real-time-stock-ledger-zero-double-counting-across-warehouses.contract.md
    └── ai-warehouse-recommendation-human-approval-workforce-gate.contract.md
```

### Source Code (repository root)

```
backend/src/modules/wms/
├── warehouse-location-hierarchy/     # FR-001-011 — Warehouse/Zone/Storage Location, dynamic slotting inputs
├── inventory-stock-control/          # FR-012-027 — inventory lifecycle, Stock Ledger, classification, adjustments
├── barcode-qr-rfid-ingestion/        # FR-028-035 — scanning, labels, offline sync (§1's reservation-trigger boundary)
├── ai-warehouse-intelligence/        # FR-036-044 — AI Warehouse Assistant, human-approval gate (per §5)
├── warehouse-digital-twin/           # FR-045-046 — simulation, pre-commit approval gate
├── multi-warehouse-transfers/        # FR-047-053 — global search, inter-warehouse Transfer lifecycle
├── replenishment-demand-planning/    # FR-054-057 — AI purchase recommendations (consumed by 055, per §3)
├── asset-tracking-lifecycle/         # FR-058-062 — Asset Profile, AI maintenance/failure prediction
├── returns-damaged-expired-obsolete/ # FR-063-068 — reverse logistics, disposal approval gate
├── workforce-task-management/        # FR-069-075 — worker profile, task assignment, productivity
└── common/
    # reused from 011 (Order/Suborder demand signal — Inventory Record reconciled per §1),
    # 009 (financial-ledger posting, per §2), 055 (Purchase Order upstream trigger, per §3),
    # 003/001/016 (auth/RBAC, per §6), 008 (AI gateway, per §5), 057 (supplier-side follow-through — forward-declared, per §4)

web/app/(admin)/wms-portal/
├── warehouse-map/
├── goods-receipt-cycle-count/
├── ai-warehouse-assistant/
├── slotting-picking-optimization/
├── digital-twin-simulation/
├── inter-warehouse-transfers/
├── returns-disposal/
├── asset-management/
├── workforce-dashboard/
└── executive-inventory-dashboard/
```

**Structure Decision**: `warehouse-location-hierarchy` and `inventory-stock-control` are built and contract-tested first — every downstream capability (fulfillment, transfers, AI forecasting) depends on a trustworthy location hierarchy and Stock Ledger established at receipt and validated by cycle counts, per spec.md's own User Story 1 rationale ("single source of truth" cannot exist without this). `barcode-qr-rfid-ingestion` follows immediately since it is the mechanism by which both receipt and cycle-count events actually enter the Stock Ledger, and is where the §1 `011` reservation-boundary contract test is exercised.

## Complexity Tracking

*No constitution violations requiring justification. N/A.*
