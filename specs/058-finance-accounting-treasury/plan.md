---
description: "Implementation plan for Feature 058 — Enterprise Finance, Accounting & Treasury Management"
---

# Implementation Plan: Enterprise Finance, Accounting & Treasury Management

**Branch**: `058-finance-accounting-treasury` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/058-finance-accounting-treasury/spec.md`

## Summary

This feature (Volume 14, Chapter 25) builds the enterprise's back-office General Ledger, Accounts Payable, Accounts Receivable, Cash & Bank Management, Budgeting & Forecasting, Fixed Assets Accounting, Tax Management, Financial Reporting, Treasury Management, AI Financial Intelligence, and Financial Security/Compliance (period locking, SoD) capabilities. Article IV (Historical Immutability) is the single most-repeated citation pattern in this spec — it is the explicit rationale for User Story 4's period-locking control, is FR-text-cited at FR-011 (reversing-entry-only correction) and FR-054/FR-055, and governs SC-001/SC-009's byte-for-byte report reproducibility guarantee. Article II is the second most-repeated pattern, governing the entire AI Financial Intelligence section (FR-046–FR-050) and both AI-focused user stories (US6, US7).

## Ownership & Dependency Analysis

### §1. Relationship to `009` (Membership, Payments & Revenue Operations) — confirmed clean, with specific verified evidence

Spec.md's own Assumptions perform an unusually thorough self-resolution: this feature "sits above, and is architecturally distinct from" `009`, which owns the customer-facing membership/subscription billing engine, and the two are assumed to "reconcile," not duplicate. This was verified against `009`'s actual spec.md and plan.md rather than trusted at face value:

- `009`'s own `billing-ledger` module (`009/plan.md` line 86) does maintain "chart of accounts" and "period close" concepts — a claim worth checking closely given the potential for genuine GL duplication. Verified: `009` FR-132's "finance-approved chart of ledger accounts" is a 16-item list scoped entirely to platform-transactional concerns (cash clearing, payment provider receivable, customer payments, sales revenue, deferred revenue, taxes payable, refund/wallet/reward liability, mentor/affiliate/instructor payable, payment fees, discounts, chargeback loss, bad debt, adjustments) — no Equity accounts, no general enterprise Asset/Liability categories, no Fixed Asset/Depreciation/COGS/OpEx categories. This is a platform transactional sub-ledger, not a full enterprise double-entry GL.
- `009`'s own User Story 9 ("Financial Period Close and Provider Settlement Reconciliation") is scoped specifically to closing the platform's own settlement/transaction period and reconciling against payment-provider statements — not an enterprise-wide, multi-module (GL/AP/AR/Fixed-Assets/Tax) fiscal period lock as `058`'s FR-055/User Story 4 defines.
- `009` FR-135 explicitly states ledger data "MAY export schedules to accounting software" — an explicit outbound integration point consistent with `058` being the downstream system `009` posts summarized entries into.

**Ownership decision**: CONFIRMED as spec.md states — `009` owns the customer-facing transactional sub-ledger and its own settlement-period close; `058` owns the enterprise's full multi-entity Chart of Accounts (Assets/Liabilities/Equity/Revenue/Expenses/COGS/OpEx/Taxes/Depreciation/Misc) and the enterprise-wide fiscal period lock spanning GL/AP/AR/Fixed Assets/Tax. `009`'s settlement-period-closed, summarized transactions post into `058`'s GL as batched journal entries; `058` does not re-implement `009`'s order/payment/invoice/wallet ledgers.

### §2. Budget Entity Ownership vs. `055` (Procurement) and `057` (Procurement, Compressed Re-Spec) — NEW finding, not caught by any of the three specs' own Assumptions

Not mentioned by any of `055`, `057`, or `058`'s own Assumptions, so checked independently given `058`'s FR-027–FR-030 define a full Budget entity (types: Annual, Quarterly, Monthly, Department, Project, Marketing, HR, IT, Capital, Operational; workflow: Creation → Department Review → Finance Review → Executive Approval → Budget Lock → Monitoring → Variance Analysis). `055`'s Purchase Request/PO workflow depends heavily on "Budget Validation" and a "Budget Reference" field as a hard gating control (`055` FR-004, FR-062, User Story 2, and its own Constraints section) — but `055`'s own 13-entity Key Entities list never includes a "Budget" entity, and `055/plan.md`'s Ownership & Dependency Analysis never identifies who owns the Budget records being validated against. `057`'s User Story 1 example question "Which purchases exceed budget?" has the identical gap. This is a genuine, three-feature-spanning ownership omission that predates `058`'s existence (both `055` and `057` were planned before `058`), now resolvable.

**Ownership decision**: `058`'s Budget entity (FR-027–FR-030) is the canonical, single source of truth for all department/project/organizational budgets across the platform. `055`'s "Budget Reference" on Purchase Requests/Purchase Orders and its "Budget Validation" gate now formally consume `058`'s Budget records (specifically the locked, approved budget and its remaining available amount per department/cost-center) rather than referencing an undefined external concept; `057`'s AI Procurement Assistant's budget-variance queries (FR-023 "which purchases exceed budget?") draw from the same `058` Budget data joined against `055`'s PO/PR spend. This is analogous to the `056`/`011` Inventory Record finding and the `057`/`055` SoD terminology resolution — a genuine cross-feature dependency neither side's own Assumptions caught, now closed. (See the note at the end of this plan regarding updating `055/plan.md` and `057/plan.md` to record this dependency.)

### §3. AI Financial Intelligence vs. `008` (AI Assistant Platform) — confirmed clean, gateway reused, new structured-financial-data grounding pattern

Not mentioned in spec.md's own Assumptions beyond a general "AI Platform integration" reference (FR-058). Consistent with the reuse pattern established for `056`'s AI Warehouse Assistant and `057`'s AI Procurement Assistant, `008`'s `ai-gateway`/`ai-guardrails` modules are the correct reuse target for provider routing, fallback, and the human-review/override/confidence-threshold discipline. **Ownership decision**: this feature's AI Financial Intelligence (FR-046–FR-050) and AI Assistant (FR-047) reuse `008`'s `ai-gateway`/`ai-guardrails` for provider access and governance, but build their own structured-financial-data query/grounding layer (GL, AP/AR, Treasury, Budget data) — the same "shared gateway, new domain logic" pattern already established for `042`, `049`, `052`, `056`, and `057`, and again distinct from `050`'s document-RAG pipeline.

### §4. Auth, RBAC & Segregation of Duties vs. `001`/`003`/`016`, and terminological consistency with `057`

Not mentioned in spec.md's own Assumptions. `058` FR-051 requires "Role-Based Access Control (RBAC) and Segregation of Duties (SoD) across all finance modules" — checked against `057/plan.md` §2, which established `057` as the canonical source for the "Segregation of Duties (SoD)" *terminology* on this platform, with `055`'s Approval Matrix/RBAC/ABAC as the enforcement mechanism. **Ownership decision**: `058`'s use of "SoD" is terminologically consistent with `057`'s established usage (SoD is standard financial-controls vocabulary, not a `057`-exclusive concept), and is enforced the same way — through `001`'s/`016`'s layered RBAC engine, applied to finance-specific roles (accountant, approver, controller, treasury manager) rather than a new authorization system. No conflict; this is the term's natural reappearance in its own home domain (financial controls), not a competing definition.

### §5. Enterprise Integrations vs. `055`/`056`/`057`/`059`/`061` (confirmed) and `060` (not yet planned)

Spec.md's own Assumptions state the Enterprise Integrations section (FR-057–FR-058) is "interface/dependency requirements on this feature's boundary," with detailed behavior specified in each named integration's own feature spec, naming `057` (Procurement), `059` (HRMS Payroll), and `056` (Inventory & Warehouse) explicitly. Verified: `056/plan.md` §2 and `057/plan.md` §6 both already confirm the `055`/`056` procurement/warehouse boundary this feature's "Inventory & Warehouse" integration point connects to; `057`'s AI Procurement Assistant and this feature's AI Financial Assistant both independently reuse `008` (per §3), so the "AI Platform" integration point is consistent across both. **`059` (HRMS Payroll) has now been planned and independently confirms this exact dependency from its own side (`059/plan.md` §3): Payroll's accounting-entry step posts into this feature's General Ledger as the confirmed destination — CONFIRMED, no longer forward-declared.** `059/plan.md` §4 also clarifies that its operational AI payroll forecast/Payroll Cost report feed into this feature's budget-cycle "Workforce Cost Forecast" (FR-029) as an input signal, not a competing definition. **`061` (Project Management & Collaboration) has now been planned and closes a previously-unmapped item: FR-057's "Project Management" integration target — listed generically here since `061` did not yet exist — is CONFIRMED as `061`'s Project Financial Management module, whose Budget/Cost/Revenue/Billing data posts into this feature's General Ledger the same way `009`'s and `059`'s do (`061/plan.md` §1).** FR-057 also names "CRM," which per `specs/FEATURE-MANIFEST.md` maps to not-yet-planned `060` — preserved as forward-declared.

### §6. Multi-Level Approvals vs. `063` (Workflow Automation, BPM & Low-Code Platform) — cross-reference added 2026-07-24, per `063/plan.md` §1

`063` has now been planned as the platform's general-purpose, dedicated BPM/Workflow/Approval-Automation chapter, and its own plan.md §1 identifies this feature's FR-052 (Multi-Level Approvals and Digital Signatures for financial transactions and journal entries) as a domain-specific application of the approval-chain mechanics `063` defines canonically. **Ownership decision**: this feature's journal-entry/payroll/period-reopening approval chains should be understood, at implementation time, as configuring `063`'s general-purpose Approval Automation engine (Dynamic Approval Matrix, Delegation, Escalation) for finance-specific approval types — the same layered-configuration pattern already established for `001`'s RBAC engine — rather than as an independently built parallel approval implementation. This is a documentation-level cross-reference only; no functional requirement, entity, or task in this feature changes as a result.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web) — consistent with 001–057.

**Primary Dependencies**: `009`'s customer-facing transactional sub-ledger as the upstream source of summarized/batched journal entries into this feature's GL (per §1, confirmed); `055`'s Purchase Order/Purchase Request now formally consuming this feature's canonical Budget entity for Budget Validation (per §2, new finding); `008`'s AI gateway/guardrails for AI Financial Intelligence and the AI Assistant (per §3); `001`/`016`'s layered RBAC for Segregation of Duties enforcement, terminologically consistent with `057` (per §4); `056`/`057` for the Inventory & Warehouse and Procurement integration points (per §5, confirmed); `059`/`060` (not yet planned) for HRMS Payroll and CRM integration points (per §5, forward-declared).

**Storage**: PostgreSQL (16 entities per Key Entities: GL Journal Entry, Chart of Accounts, Fiscal Period, Vendor (AP) Invoice, Customer (AR) Invoice, Bank Account, Bank Reconciliation, Budget, Fixed Asset, Depreciation Schedule, Tax Record, Treasury Position, Payment Factory Transaction, Borrowing/Loan, AI Financial Recommendation, Audit Log Entry — with Budget now the confirmed canonical source `055`/`057` consume, per §2).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: period-lock-100pct-rejection-of-closed-period-transactions for SC-001, gl-journal-entry-100pct-balanced-with-audit-trail for SC-002, and ai-financial-recommendation-zero-autonomous-consequential-action for SC-006), Playwright (web e2e — journal entry approval flow, AP three-way match to payment, AR collection/aging, period close/reopen).

**Target Platform**: Web (Finance & Treasury Portal, executive financial dashboard).

**Performance Goals**: Per SC-004, AR aging reports and outstanding receivable balances must reflect posted receipts/invoices within the platform's standard data-refresh interval; per SC-009, closed-period standard reports must be byte-for-byte reproducible on every regeneration.

**Constraints**: Zero unbalanced journal entry may advance past Draft/validation (FR-010, SC-002); zero posting/edit/deletion of a transaction dated within a Closed fiscal period may succeed outside the audited reopening flow, for any role (FR-055, SC-001); zero vendor invoice above the defined threshold may reach payment approval without a completed three-way match (SC-003); zero AI Financial Intelligence recommendation or fraud/duplicate flag may auto-apply to a budget, payment, or ledger posting without recorded human approval (FR-049, SC-006); the Fixed Asset Register's aggregate net book value must reconcile exactly to its GL account balance at every period close (SC-007).

**Scale/Scope**: 16 entities, 58 FRs, 8 user stories, a 10-category enterprise Chart of Accounts, a 7-step journal-entry workflow, a 7-step AP workflow, a 7-step AR workflow, a 7-step budget workflow, an 8-stage fixed-asset lifecycle, 8 Treasury KPIs, 10 AI Financial Intelligence outputs, 2 explicitly self-flagged NEEDS CLARIFICATION items (Financial Health Score/Compliance Score methodology, Treasury KPI formulas/edge cases) plus 9 from Edge Cases, one confirmed-clean reuse chain with `009` backed by specific verified FR evidence (§1), and one substantial new cross-feature finding — the canonical ownership of the "Budget" entity `055` and `057` both already depend on but never resolved (§2) — the eleventh consecutive feature this session to surface a genuine, previously-uncaught cross-feature dependency during planning (after `041`/`042` through `056`/`011`, with `057` itself being the one confirmation-not-reversal exception).

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Journal-entry balance validation, three-way match results, and aging-bucket assignment are all server-computed, never client-asserted (FR-010, FR-021). |
| II. AI Is Assistive, Never Autonomous | PASS — **FR-text-verbatim cited repeatedly** | FR-049 explicitly requires human approval before any AI-recommended budget, vendor-payment, or account-adjustment action; FR-050 requires a deterministic non-AI fallback for every AI capability. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | AI recommendations present Confidence Score and Risk Level transparently (FR-048), not as guaranteed outcomes. |
| IV. Historical Immutability | PASS — **FR-text-verbatim cited, the spec's central control** | FR-011 (reversing-entry-only correction), FR-054 (immutable audit logs), and FR-055 (period locking) directly implement Article IV; User Story 4's entire rationale names Article IV explicitly. |
| V. Ledger-Based Internal Economies | PASS — **primary implementer for the enterprise GL** | This feature's GL Journal Entry (append-only, reversal-only correction) is itself a ledger-based system in the spirit of Article V, extending rather than duplicating `009`'s existing ledger discipline (per §1). |
| VI. Consent Is First-Class, Per-Channel, and Versioned | N/A | Internal back-office finance tool; AR payment reminders are operational notifications, not marketing consent. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS — **FR-text-verbatim cited, terminology consistent with 057** | FR-051 explicitly names RBAC and Segregation of Duties; enforced through `001`'s/`016`'s layered RBAC engine (per §4). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Financial Health Score and Compliance Score are operational transparency metrics, not purchasable status (flagged for methodology definition, not scope concern). |
| IX. Action Before Consumption | PASS | Every journal entry, invoice, and budget progresses through a governed workflow with audit history before being considered Posted/Approved. |
| Localization & Language Requirements | PASS (not primary focus, inherited) | Internal enterprise finance tool; FR-002's multi-company/multi-currency/multi-branch support is the relevant platform-architecture requirement. |
| Security & Compliance Baseline | PASS | FR-053 (encryption at rest/in transit), FR-054 (immutable audit logs), FR-056 (compliance monitoring) directly implement the baseline. |

## Project Structure

### Documentation (this feature)

```
specs/058-finance-accounting-treasury/
├── spec.md
├── plan.md
├── research.md         # 11 NEEDS CLARIFICATION items (2 self-flagged, 9 from Edge Cases)
├── data-model.md        # 16 entities (Budget now the confirmed canonical source for 055/057, per §2)
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── period-lock-100pct-rejection-of-closed-period-transactions.contract.md
    ├── gl-journal-entry-100pct-balanced-with-audit-trail.contract.md
    └── ai-financial-recommendation-zero-autonomous-consequential-action.contract.md
```

### Source Code (repository root)

```
backend/src/modules/finance/
├── platform-foundation/              # FR-001-002 — platform scope
├── general-ledger/                   # FR-003-011 — Chart of Accounts, journal workflow, period-locking hooks
├── accounts-payable/                 # FR-012-017 — vendor invoice, three-way match, payment
├── accounts-receivable/              # FR-018-022 — customer invoice, collections, aging
├── period-locking-compliance/        # FR-055 — enterprise-wide fiscal period lock (Article IV)
├── cash-bank-treasury/               # FR-023-026, FR-041-045 — bank accounts, Treasury Dashboard, Payment Factory
├── ai-financial-forecasting-assistant/ # FR-046-047, FR-050 — cash-flow/revenue forecast, NL assistant
├── ai-fraud-duplicate-detection/      # FR-048-049 — advisory fraud/duplicate flags (per §3)
├── fixed-assets/                     # FR-031-034 — capitalization through disposal
├── budgeting-forecasting/            # FR-027-030 — canonical Budget entity, consumed by 055/057 (per §2)
├── tax-management/                   # FR-035-038
├── financial-reporting/              # FR-039-040
├── security-compliance-remainder/    # FR-051-054, FR-056
└── enterprise-integrations/          # FR-057-058 — 055/056/057 confirmed, 059/060 forward-declared (per §5)
    # reused from 009 (customer-facing sub-ledger, summarized entries posted in, per §1),
    # 008 (AI gateway/guardrails, per §3), 001/016 (RBAC/SoD, per §4)

web/app/(admin)/finance-portal/
├── general-ledger/
├── accounts-payable/
├── accounts-receivable/
├── treasury-dashboard/
├── budgeting/
├── fixed-assets/
├── tax-management/
├── ai-financial-assistant/
└── executive-financial-dashboard/
```

**Structure Decision**: `general-ledger` and `period-locking-compliance` are built and contract-tested first — spec.md's own User Story 1 rationale states the GL is "the central financial repository" every other module posts into, and User Story 4's period lock is the platform's core historical-integrity control (Article IV) gating every other module's edit/delete behavior. `accounts-payable` and `accounts-receivable` follow immediately as the two highest-volume day-to-day transactional flows.

## Complexity Tracking

*No constitution violations requiring justification. N/A.*

---

**Note on `055`/`057` plan.md updates**: §2 above surfaces a genuine dependency neither `055/plan.md` nor `057/plan.md` recorded — both features' "Budget Validation"/"budget" references were left pointing at an undefined external concept because `058` (the feature that actually owns Budget) had not yet been planned. Per this session's standing protocol of only editing already-written plan.md files after explicit user confirmation, this update is **recommended but not yet applied**: `055/plan.md` should gain a new §7 (or an addition to §3) recording that its "Budget Reference"/"Budget Validation" now formally consumes `058`'s canonical Budget entity, and `057/plan.md` should note the same for its AI Procurement Assistant's budget-variance queries.
