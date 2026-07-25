---
description: "Implementation plan for Feature 057 — Procurement & Supplier Management (Compressed Re-Specification)"
---

# Implementation Plan: Procurement & Supplier Management (Compressed Re-Specification)

**Branch**: `057-procurement-supplier-management` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/057-procurement-supplier-management/spec.md`

## Summary

Unlike every prior Wave 4 feature, this spec.md has already performed its own exhaustive ownership analysis in a dedicated "Relationship to Feature 055" section, marking 20 of its 26 FRs `[SAME AS 055 FR-XXX]` and building its User Stories/Success Criteria only around the handful of genuinely distinctive contributions Chapter 24 makes over Chapter 22: the conversational **AI Procurement Assistant**, the explicit **Price Prediction / Duplicate Purchase Detection / Fraud Detection** AI capability naming, the **self-service Vendor Portal** enumeration and **Quotation Comparison Matrix**, the **Contract Alerts** list, the named **Integrations** list, and — most consequentially — the explicit **Segregation of Duties (SoD)** terminology that resolves a `[NEEDS CLARIFICATION]` `055/plan.md` left open. This plan's job is narrower than usual: verify spec.md's own extensive self-resolution against `055`'s actual current spec.md/plan.md rather than trusting it at face value, and surface anything spec.md's own Assumptions did not catch.

## Ownership & Dependency Analysis

### §1. Canonicity of `055` Over `057` — CONFIRMED, resolving `055/plan.md` §1's flagged concern

`055/plan.md` §1 flagged spec.md's claim that `055` is canonical over the later-numbered `057` as running *against* this session's own repeatedly-verified pattern (later Volume 14 chapters usually proving deeper — `047`>`044`, `040`>`029`), and explicitly declined to trust it, instead preserving it as an unverified working assumption pending mandatory re-verification once `057` was actually planned. Having now read `057`'s full spec.md, that re-verification is complete: `057`'s own spec.md independently and explicitly agrees — its "Relationship to Feature 055" section states outright that `055` "is the canonical, detailed procurement specification" and that Chapter 24 "re-covers the same ground in a visibly compressed, list-heavy style with no new data model depth." This is the rare case where the later chapter is *not* deeper, verified from both sides rather than assumed from one. **Ownership decision**: `055`'s claimed canonicity over `057` is now CONFIRMED, not merely preserved. (See the note at the end of this plan regarding updating `055/plan.md` and `056/plan.md`'s now-resolved flags.)

### §2. Segregation of Duties (SoD) Terminology — resolves the open item from `055/plan.md` §5 and `056/plan.md` §4

`055/plan.md` §5 (and `055/tasks.md` T026, and `056/plan.md` §4/`056/tasks.md` T031) preserved an open item: `055`'s Chapter 22 content never uses the explicit term "Segregation of Duties," deferring to `057`'s "fuller SoD specification." Having read `057` in full, its own Assumptions are candid that Chapter 24 does **not** actually provide SoD mechanics beyond naming the term in its Security & Governance list (FR-025) — it does not describe the requester-cannot-approve-own-request rule in any more depth than `055`'s Approval Matrix/RBAC/ABAC (`055` FR-044, FR-055) already does. **Ownership decision**: `057` is the canonical source for the "Segregation of Duties (SoD)" *terminology* going forward across the platform's documentation; `055`'s Approval Matrix/RBAC/ABAC machinery remains the canonical *enforcement mechanism* SoD is implemented through. No new mechanism is built by either feature — this is a naming resolution, not a functional one.

### §3. Citation-Accuracy Check on `[SAME AS 055 FR-XXX]` Claims — NEW finding, not caught by spec.md's own Assumptions

Per this session's standing discipline, every `[SAME AS 055 FR-XXX]` citation was checked against `055`'s actual spec.md text rather than trusted at face value. Most citations hold up (e.g., FR-004's Supplier Master Profile field set genuinely matches `055` FR-007's Vendor Master Record field set almost one-to-one). But three do not fully hold up at the claimed granularity:

- **FR-015** (Purchase Requisition field set: PR Number, Requestor, Department, Business Unit, Cost Center, Category, Required Date, Priority, Budget, Quantity, Item Details, Justification, Attachments, Approval Workflow, plus an 8-value status enum) cites `055` FR-002 — but `055` FR-002 is the platform's 17-item high-level *system-scope* list, not a field definition. `055`'s own Key Entities section defines "Purchase Request" in a single descriptive sentence with no field list or status enum at all.
- **FR-011** (RFQ record field set: RFQ Number, Title, Category, Description, Business Unit, Budget, Required Quantity, Delivery Location, Delivery Date, Terms & Conditions, Evaluation Criteria, Closing Date, Selected Suppliers, Attachments) cites `055` FR-023 — but `055` FR-023 is a *capability* list (RFQ creation, invitations, pricing templates, deadlines, bid comparison, clarification, evaluation workflow, vendor selection, approval workflow, award notifications), not a field enumeration.
- **FR-017** (Contract field set including Confidentiality, Penalties, Insurance, Digital Signatures) cites `055` FR-046/FR-047 — `055` FR-047 lists governance *capabilities* (Clause Library, version control, renewal alerts, obligation tracking, compliance monitoring, digital signatures, audit logs) that overlap substantially but do not explicitly enumerate a Contract field set at this granularity.

**Ownership decision**: `055` remains canonical for the *lifecycle, workflow, and AI-governance depth* around Purchase Requisition, RFQ, and Contract. But `057`'s FR-011, FR-015, and FR-017 are the more implementation-ready, genuinely value-adding source for those three entities' concrete *field enumerations and status vocabularies* specifically — they are not pure redundant no-op citations despite being labeled `[SAME AS 055 FR-XXX]`. Both specs are used together during implementation: `055` for process/lifecycle/RBAC, `057` for these three field sets. This nuance is recorded here because neither spec's own text states it.

### §4. AI Procurement Assistant vs. `008` (AI Assistant Platform) — confirmed clean, gateway reused, new structured-data grounding pattern

Not mentioned in spec.md's own Assumptions (which discuss the Assistant only relative to `055`'s existing AI outputs), so checked independently, consistent with the reuse pattern established for `056`'s AI Warehouse Assistant. `008`'s `ai-gateway`/`ai-guardrails` modules remain the correct reuse target for provider routing, fallback, and the human-review/override/confidence-threshold discipline every AI feature this session has routed through. Distinct from `050`'s KMS reuse of `008`'s `ai-rag` module (semantic retrieval over unstructured document/knowledge-base content): the AI Procurement Assistant answers questions grounded in live, *structured* transactional records (contracts, budgets, POs) — a different retrieval pattern (structured query/aggregation, not document-chunk semantic search). **Ownership decision**: this feature reuses `008`'s `ai-gateway`/`ai-guardrails` for provider access and governance, but builds its own structured-data query/grounding layer rather than repurposing `050`'s document-RAG pipeline — the same "shared gateway, new domain logic" pattern already established for `042`, `049`, `052`, and `056`. Also confirmed independently (§5 below): `055`'s own FR-052 already lists "AI Procurement Assistant" by name as one of its Enterprise Procurement Portal's 18 modules, without detailing its behavior — `057`'s User Story 1 fills a gap `055` already named but left undefined, which is consistent with, not contradictory to, `055`'s overall canonicity.

### §5. Auth & RBAC vs. `003`/`001`/`016`, and Vendor Portal vs. `055`'s Enterprise Procurement Portal — confirmed clean

Spec.md's own Assumptions state Vendor Portal authentication and RBAC reuse `003`'s auth/identity foundation and `055`'s Enterprise Procurement Portal (`055` FR-052–FR-054). Verified against `055`'s actual spec.md and plan.md: `055` FR-052 explicitly lists 16 Portal user roles including "Approved Suppliers," and `055/plan.md` §4 already states Portal authentication reuses `003`. **Ownership decision**: `057`'s Vendor Portal/Vendor Dashboard is the supplier-facing self-service extension of `055`'s already-role-inclusive Portal, not a second identity or portal system.

### §7. Budget Data Grounding vs. `058` (Finance, Accounting & Treasury) — RESOLVED (added 2026-07-23, per `058/plan.md` §2)

This feature's User Story 1 example question "Which purchases exceed budget?" (FR-023) and its budget-variance framing depend on a "budget" concept that, at the time this plan was originally written, was never resolved to an owning feature — `055` (whose Purchase Requests/POs this data joins against) also never defined a Budget entity. `058/plan.md` §2 independently identified and resolved this three-feature-spanning gap. **Ownership decision**: `058`'s Budget entity (FR-027–FR-030) is the canonical, single source of truth for department/project/organizational budgets. This feature's AI Procurement Assistant's budget-variance queries draw from `058`'s Budget data joined against `055`'s PO/PR spend, rather than an undefined external concept.

### §6. Integration Point vs. `056` (Enterprise Inventory & Warehouse Management / WMS) — confirmed consistent

Not mentioned by name in spec.md's own Assumptions (FR-026 names "Inventory & Warehouse" generically among 15 integrations). Checked against `056`'s actual plan.md: `056/plan.md` §3 confirms a boundary independently agreed from both `055` and `056`'s own plan.md files — `055` (and by extension `057`, sharing `055`'s procurement data model) owns the Purchase Order/procurement-triggering side, `056` owns Goods Receipt execution and the physical Stock Ledger. **Ownership decision**: FR-026's "Inventory & Warehouse" integration point is this already-confirmed `055`/`056` boundary; `057` does not introduce a new or competing warehouse integration.

### §8. Workflow Engine / Approval Matrix vs. `063` (Workflow Automation, BPM & Low-Code Platform) — cross-reference added 2026-07-24, per `063/plan.md` §1

`063` has now been planned as the platform's general-purpose, dedicated BPM/Workflow/Approval-Automation chapter. This feature does not itself define a Workflow Engine — per §2, this feature's SoD enforcement runs through `055`'s Approval Matrix/RBAC/ABAC — and `055/plan.md` §8 now documents that `055`'s Workflow Engine/Approval Matrix (FR-042–FR-045) should itself be understood as configuring `063`'s general-purpose engine at implementation time. **Ownership decision**: no change to this feature's own FRs; this is a documentation-level cross-reference confirming the SoD-enforcement chain this feature depends on (this feature → `055`'s Approval Matrix → `063`'s Workflow Designer/Business Rules Engine) rather than three independent layers.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web) — consistent with 001–056.

**Primary Dependencies**: `055`'s canonical Vendor Lifecycle, PO Lifecycle, Approval Matrix/RBAC/ABAC, Three-Way Matching, Evaluation Framework, and Executive Dashboard (per §1, confirmed canonical); `008`'s AI gateway/guardrails for the AI Procurement Assistant and AI Procurement Intelligence (per §4); `003`'s auth foundation and `055`'s Enterprise Procurement Portal for Vendor Portal access (per §5); `056`'s confirmed procurement/warehouse boundary for the Inventory & Warehouse integration point (per §6); `058`'s canonical Budget entity for the AI Procurement Assistant's budget-variance queries (per §7).

**Storage**: PostgreSQL (4 net-new entities per Key Entities: Vendor Dashboard, Quotation Comparison Matrix, Contract Alert, AI Procurement Assistant Query — all other referenced entities, Supplier/Vendor, Purchase Requisition, Purchase Order, Procurement Contract, Approval Workflow Step, are `055`'s own tables, not redefined here, with `057`'s FR-011/FR-015/FR-017 field enumerations informing `055`'s Purchase Request/RFQ/Contract schemas per §3).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: ai-procurement-assistant-grounded-answer-or-disclosed-limitation for SC-001, ai-procurement-intelligence-zero-autonomous-status-approval-change for SC-002, and segregation-of-duties-zero-same-actor-submit-and-approve for SC-007), Playwright (web e2e — AI Procurement Assistant query flow, Vendor Portal self-service workflow, Quotation Comparison Matrix generation).

**Target Platform**: Web (Vendor Portal as a supplier-facing extension of `055`'s Enterprise Procurement Portal; AI Procurement Assistant surfaced inside the same portal shell).

**Performance Goals**: Per SC-001, the AI Procurement Assistant must return a grounded, data-backed answer (not a generic non-answer) for each of the ten documented example question categories using live procurement data — this governs the structured-data grounding layer established in §4.

**Constraints**: Zero AI Procurement Assistant response or AI Procurement Intelligence output (Price Prediction, Fraud Detection, Duplicate Purchase Detection, Vendor Risk Prediction, Contract Risk Analysis) may result in an automatic status, approval, or payment change without a recorded human action (FR-024, SC-002); zero Purchase Requisition/Order may be both submitted and approved by the same unauthorized single actor (FR-025, SC-007); zero AI-recommended Blacklisting/Suspension Supplier Action may be applied without explicit human/role-gated approval (FR-020); the AI Procurement Assistant MUST disclose its own limitation rather than fabricate an answer when it lacks sufficient data or confidence (User Story 1 acceptance scenario 3).

**Scale/Scope**: 4 net-new entities, 26 FRs (14 of which are pure or near-pure citations to `055`, not re-implemented; 3 of which — FR-011/FR-015/FR-017 — are citations that also contribute genuinely new field-set detail per §3), 5 user stories, 8 preserved NEEDS CLARIFICATION items (from spec.md's own Edge Cases: AI-Assistant data-gap disclosure, Duplicate-Detection recurring-purchase tolerance, Vendor-Portal-vs-internal-team write-conflict, Supplier-Status mutual-exclusivity, AI-recommended-Blacklisting approval-gate ambiguity, Reverse-Auction-vs-standard-approval-workflow interaction, Contract-Alerts-vs-AI-Contract-Risk-Analysis merge-or-separate), one CONFIRMED (not merely preserved) canonicity relationship with `055` (§1) — the first feature this session where a "later chapter deeper" pattern check resolved in favor of the *earlier* chapter, verified from both sides — and one new citation-accuracy nuance (§3) not caught by either spec's own text.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | AI Procurement Assistant answers and Duplicate Purchase Detection are computed server-side against live procurement records, never client-asserted (FR-023, FR-022). |
| II. AI Is Assistive, Never Autonomous | PASS — **FR-text-verbatim cited repeatedly** | FR-020, FR-022, FR-024, and FR-051 (via `055` cross-reference) all explicitly cite Article II; FR-024 explicitly prohibits the Assistant from finalizing any strategic/financial/regulatory action itself. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | Price Prediction is explicitly framed as "an advisory estimate, not an auto-applied contract price" (User Story 2 acceptance scenario 2). |
| IV. Historical Immutability | PASS (reused, not redefined) | Audit logging reuses `055`'s existing immutable audit infrastructure (FR-025's "Audit Logs" and "Complete Activity Tracking"). |
| V. Ledger-Based Internal Economies | N/A (reused) | No new financial ledger; reuses `055`'s payment-execution chain, itself reusing `009`. |
| VI. Consent Is First-Class, Per-Channel, and Versioned | N/A | Internal B2B procurement/vendor-portal tool with no direct customer-communication-consent surface. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS — **FR-text-verbatim cited, terminology resolved** | FR-025 names Segregation of Duties (SoD) explicitly; enforced through `055`'s existing Approval Matrix/RBAC/ABAC per §2. |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Supplier Scorecard/KPIs remain performance-evidence-based (FR-019), not purchasable status. |
| IX. Action Before Consumption | PASS (reused) | Vendor/PO/Contract lifecycle gating is `055`'s own governed progression, not re-specified here. |
| Localization & Language Requirements | PASS (not primary focus, inherited) | Internal enterprise procurement tool; no new localization surface introduced. |
| Security & Compliance Baseline | PASS | FR-025 explicitly enumerates RBAC, SoD, Digital Signatures, Audit Logs, Encryption, Compliance Monitoring, Document Version Control. |

## Project Structure

### Documentation (this feature)

```
specs/057-procurement-supplier-management/
├── spec.md
├── plan.md
├── research.md         # 8 NEEDS CLARIFICATION items from Edge Cases
├── data-model.md        # 4 net-new entities; 055's field enumerations enriched per §3
├── quickstart.md         # 5 user-story validation walkthrough
└── contracts/
    ├── ai-procurement-assistant-grounded-answer-or-disclosed-limitation.contract.md
    ├── ai-procurement-intelligence-zero-autonomous-status-approval-change.contract.md
    └── segregation-of-duties-zero-same-actor-submit-and-approve.contract.md
```

### Source Code (repository root)

```
backend/src/modules/procurement/
├── ai-procurement-assistant/         # FR-022-024 — conversational NL interface (new structured-data grounding, per §4)
├── vendor-portal/                    # FR-007-008 — supplier self-service, extends 055's Portal (per §5)
├── quotation-comparison/             # FR-011-012 — RFQ field enrichment + comparison matrix (per §3)
├── contract-alerts/                  # FR-018 — 6 distinguishable alert types, on top of 055's Contract Lifecycle
├── procurement-integrations/         # FR-026 — 15 named integration points
├── sourcing-methods-dashboard/       # FR-009, FR-014 — Reverse Auction/Competitive Bidding, Strategic Sourcing Dashboard
└── common/
    # reused from 055 (canonical process/lifecycle/RBAC — confirmed per §1),
    # 008 (AI gateway/guardrails, per §4), 003 (auth, per §5), 056 (confirmed integration boundary, per §6)
    # NOT redefined: Supplier/Vendor, Purchase Requisition, Purchase Order, Procurement Contract, Approval Workflow Step — all 055's own tables

web/app/(admin)/procurement-portal/
├── ai-procurement-assistant/
├── vendor-portal/
├── quotation-comparison/
└── contract-alerts/
```

**Structure Decision**: `ai-procurement-assistant` is built and contract-tested first, per spec.md's own explicit User Story 1 priority framing ("this chapter's single most distinctive addition over Feature 055"). `vendor-portal` and `quotation-comparison` follow together since the Independent Test for User Story 3 exercises both in the same supplier/RFQ workflow.

## Complexity Tracking

*No constitution violations requiring justification. N/A.*

---

**Note on `055`/`056` plan.md updates**: §1 and §2 above resolve two items `055/plan.md` (§1, §5, §6) and `056/plan.md` (§4) explicitly flagged as pending mandatory re-verification or forward-declared/unverified. Per this session's standing protocol of only editing already-written plan.md files after explicit user confirmation, these updates are **recommended but not yet applied**: `055/plan.md` §1/§6 and `research.md`'s 12th NEEDS CLARIFICATION item should be updated from "flagged for mandatory re-verification" to "confirmed by `057`," and `055/plan.md` §5 and `056/plan.md` §4 should be updated from "pending"/"forward-declared" to "resolved — `057` is the canonical SoD terminology source, `055`'s Approval Matrix/RBAC/ABAC is the enforcement mechanism."
