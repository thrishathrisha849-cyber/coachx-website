---
description: "Implementation plan for Feature 060 — Enterprise CRM Territory-Based Security & Record-Level Permissions (Third Re-Specification)"
---

# Implementation Plan: Enterprise CRM Territory-Based Security & Record-Level Permissions

**Branch**: `060-enterprise-crm-sales-customer-success` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/060-enterprise-crm-sales-customer-success/spec.md`

## Summary

This is the third CRM/sales specification in the manifest (after `013` and `045`), and by far the most self-disciplined about it: spec.md marks 21 of its 36 FRs (FR-010–FR-017, FR-026–FR-036) as explicit restatements cross-referenced to `013`/`045` FR numbers rather than re-derived, and focuses its User Stories and net-new FRs on exactly three genuinely distinctive contributions: **Territory-Based Security** (record-visibility enforcement, distinct from `045`'s territory *structure*), **Record-Level Permissions** (whole-record access control, distinct from `013`'s field-level RBAC), and the **AI CRM Assistant's** specific named query capabilities plus its nine-field AI Recommendation object shape. This plan's job, as with `057`, is to verify spec.md's extensive self-citation against `013`/`045`'s actual current content rather than trust it, and surface anything neither catches.

## Ownership & Dependency Analysis

### §1. Base CRM Entities vs. `013` — confirmed clean, citation accuracy spot-verified

Spec.md's own Assumptions state `013` owns the canonical base CRM entities (Lead, Contact, Account, Opportunity, Pipeline, Quote, Contract, Ticket, SLA Policy, Knowledge Base, Workflow Automation, field-level RBAC) and is not redefined here. Per this session's standing discipline, a sample of this spec's most load-bearing FR-level citations was checked against `013`'s actual spec.md text rather than trusted at face value: FR-002 ("View Territory" access level) — confirmed verbatim; FR-003 (field-level restrictions on sensitive fields) — confirmed verbatim; FR-133 ("AI requests... respect record-level permissions") — confirmed verbatim, this exact phrase already exists in `013`; FR-179 (audit log entry structure) — confirmed verbatim; FR-163 (lead-source attribution fields) — confirmed verbatim. **Ownership decision**: CONFIRMED — this spec's citation discipline is notably more accurate than `057`'s was (which had three citations pointing to mismatched-granularity FRs); no citation-accuracy correction is needed here.

### §2. Territory Structural Model vs. `045` — confirmed clean for this feature's purposes, but surfaces a NEW correction to `045/plan.md`'s own claim

Spec.md's own Assumptions state `045` owns the Revenue Operating System layer including Territory Management's *structural* model, and this feature only adds the security-enforcement layer on top. Verified against `045`'s actual spec.md (FR-082–086: territory models, assignment rules, performance monitoring, AI territory intelligence) — confirms `045` as the deep, canonical structural source `060` should build territory-based visibility enforcement on top of.

However, checking `045/plan.md` itself surfaced something neither `045` nor `060`'s own text catches: `045/plan.md`'s Ownership & Dependency Analysis (§3) states "`045`'s genuinely new AI-intelligence ground is at the Opportunity, Deal, **Territory**, Account, and Revenue level... none of which `013`/`024` define." This is inaccurate for Territory specifically — `013` FR-073 already defines a basic Territory entity ("sales territories defined by country, state, district, city, postal code, industry, product, customer size, language, or revenue band, each containing a territory manager, sales users, accounts, leads, opportunities, and targets"), predating `045`. `045`'s Territory (8 named models, assignment-rule dimensions, performance monitoring, AI rebalancing) is a genuine, much deeper elaboration of `013`'s basic entity — consistent with this session's repeatedly-verified pattern of a later chapter proving deeper — but `045/plan.md` incorrectly framed it as entirely novel ground rather than an extension of `013`'s existing (thinner) Territory.

**Ownership decision**: The correct three-level chain is `013` (basic Territory entity, FR-073) → `045` (deep structural/coverage model extending it, FR-082–086) → `060` (security-enforcement layer on top of `045`'s model, this feature's FR-001–005). This does not change `060`'s own citations — `045` remains the correct feature to build on — but `045/plan.md`'s "novel ground" framing for Territory specifically should be corrected. (See the note at the end of this plan regarding updating `045/plan.md`.)

### §3. AI CRM Assistant & AI Capabilities vs. `008` (AI Assistant Platform) — confirmed clean, consistent with `013`'s own prior assumption

Spec.md's own Assumptions state the AI CRM Assistant, AI Capabilities list, and AI Recommendations are feature-specific applications of the platform-wide AI Assistant defined in `008`, "consistent with the same assumption already stated in feature 013's spec." Consistent with the reuse pattern established for `056`, `057`, `058`, and `059`. **Ownership decision**: this feature's AI CRM Assistant (FR-018) and AI Recommendation object shape (FR-024) reuse `008`'s `ai-gateway`/`ai-guardrails` for provider access and governance, but the pipeline-bottleneck and campaign-effectiveness query logic — grounded in `045`'s Pipeline Health metrics and `013`/`045`'s attribution data respectively (per FR-019–020) — is this feature's own new, structured-CRM-data query layer, the same "shared gateway, new domain logic" pattern established throughout Wave 4/5.

### §4. Auth & RBAC vs. `001`/`016` — confirmed clean, additive-layer pattern

Spec.md's own FR-010 explicitly states Territory-Based Security and Record-Level Permissions are "additive layers on top of" RBAC (already fully specified by `013` FR-001–003, itself extending `001`). **Ownership decision**: CONFIRMED — this is the cleanest possible instance of the layered-RBAC-extension pattern established since `016`: no new authorization system, two new visibility-filtering layers composed on top of the existing one.

### §5. "Compliance Monitoring" (FR-017) vs. `072` (GRC/Risk/Compliance/Audit/ESG) — CONFIRMED (updated 2026-07-24, per `072/plan.md` §2)

Spec.md's own FR-017 was self-flagged `[NEEDS CLARIFICATION: source (§12) names "Compliance Monitoring" only as a bullet with no further detail on which frameworks, monitored conditions, or reporting cadence apply specifically within the CRM]`, with this plan's Assumptions stating it was "assumed to reuse the Constitution's Security & Compliance Baseline... rather than introducing a CRM-specific compliance engine, pending clarification." At the time this feature was planned, no enterprise-wide compliance system existed to resolve that question against.

`072` has now been planned and answers it: `072`'s Compliance Register, Compliance Calendar, and Compliance Areas (including Data Privacy and Employment Regulations — both directly relevant to CRM-held customer/employee data) are the enterprise-wide obligation-tracking system this feature's Compliance Monitoring flag reports into. **Ownership decision**: CONFIRMED — this feature's FR-017 remains a CRM-domain enforcement/flagging surface (record visibility restricted per §12's own territory/record-level rules per Acceptance Scenario 4); it does not independently define compliance frameworks, obligation calendars, or scorecards, both of which are `072`'s canonical responsibility. No functional requirement or entity in this feature changes as a result — the previously open NEEDS CLARIFICATION is now resolved, not the requirement itself.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web) — consistent with 001–059.

**Primary Dependencies**: `013`'s canonical Lead/Contact/Account/Opportunity/Pipeline/Ticket entities and field-level RBAC (per §1, citation-accuracy confirmed); `045`'s canonical Territory structural model, itself extending `013`'s basic Territory entity (per §2, new three-level chain documented); `008`'s AI gateway/guardrails for the AI CRM Assistant (per §3); `001`/`016`'s layered RBAC as the base layer Territory-Based Security and Record-Level Permissions compose on top of (per §4); `072`'s canonical enterprise-wide Compliance Register, now resolving this feature's own previously-open "Compliance Monitoring" NEEDS CLARIFICATION (per §5).

**Storage**: PostgreSQL (4 net-new entities per Key Entities: Territory [Security Boundary — the enforcement relationship, not the structural entity], Record-Level Permission, AI CRM Recommendation, AI CRM Assistant Query — all other referenced entities are `013`'s or `045`'s own tables, not redefined here).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: multi-layer-permission-combination-zero-unauthorized-visibility for SC-001, ai-crm-recommendation-100pct-nine-field-display for SC-004, and ai-crm-zero-autonomous-record-mutation for SC-005), Playwright (web e2e — territory-scoped list views, record-level permission grant/restrict admin flow, AI CRM Assistant query scoping).

**Target Platform**: Web (CRM admin console, territory/record-permission management UI, AI CRM Assistant panel).

**Performance Goals**: Per SC-006, territory reassignments (user or record) must result in correctly updated visibility without requiring manual cache-clear or administrator intervention.

**Constraints**: Zero record may be visible to a user excluded by role-based, territory-based, or record-level permission layers combined (FR-021, SC-001); zero AI CRM Recommendation or Assistant answer may autonomously change a record's owner, status, or score (FR-022, FR-025, SC-005); zero territory-based visibility grant may itself confer edit/delete/export/assign rights (FR-004); every record-level permission grant/restriction must be logged with acting user, affected user/team, record, permission type, and timestamp (FR-007, SC-002).

**Scale/Scope**: 4 net-new entities, 36 FRs (21 of which are citation-only restatements of `013`/`045`, not re-implemented), 6 user stories, 8 preserved NEEDS CLARIFICATION items (4 explicitly self-flagged: territory-overlap precedence, territory-vs-record-level-permission conflict precedence, territory re-evaluation timing, Compliance Monitoring scope; 4 from Edge Cases), one confirmed-clean, citation-accuracy-spot-verified reuse chain with `013` (§1) — notably more precise than `057`'s equivalent citations were — and one new correction surfaced against `045/plan.md`'s own "novel ground" claim for Territory (§2), establishing the correct three-level `013`→`045`→`060` ownership chain. This is the thirteenth consecutive feature this session to surface a genuine, previously-uncaught cross-feature nuance during planning.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Territory-based visibility and record-level permission checks are server-evaluated on every list/query/export, never client-filtered (FR-001, FR-021). |
| II. AI Is Assistive, Never Autonomous | PASS — **FR-text-verbatim cited repeatedly** | FR-022 and FR-025 explicitly prohibit AI CRM Assistant/Recommendation outputs from autonomously changing record status, ownership, or score; FR-009 requires AI requests to respect record-level permissions exactly as a direct user request would. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | AI Recommendations present Confidence Score and Risk Level transparently (FR-024), not as guaranteed outcomes. |
| IV. Historical Immutability | PASS (reused, not redefined) | Territory reassignment and record-level permission changes are captured in `013`'s existing immutable audit-log structure (FR-014, per FR-179). |
| V. Ledger-Based Internal Economies | N/A | No financial ledger surface in this feature's scope. |
| VI. Consent Is First-Class, Per-Channel, and Versioned | N/A (reused) | Data Privacy Controls reuse `013`'s existing consent/privacy requirements (FR-015). |
| VII. Layered, Explicit RBAC With Approval Chains | PASS — **primary implementer of two new additive layers** | FR-010 explicitly frames Territory-Based Security and Record-Level Permissions as additive layers on top of `013`'s/`001`'s RBAC (per §4). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Territory and record-level access are governance controls, not purchasable status. |
| IX. Action Before Consumption | PASS | Every record-level permission change and territory reassignment is logged before taking effect, not silently applied. |
| Localization & Language Requirements | PASS (not primary focus, inherited) | Internal enterprise CRM tool; Language-Based territory model (per `045`) is the relevant localization touchpoint. |
| Security & Compliance Baseline | PASS | FR-013 (encryption, per `013` FR-184) and FR-014 (immutable audit logs, per `013` FR-179) directly implement the baseline. |

## Project Structure

### Documentation (this feature)

```
specs/060-enterprise-crm-sales-customer-success/
├── spec.md
├── plan.md
├── research.md         # 8 NEEDS CLARIFICATION items (4 self-flagged, 4 from Edge Cases)
├── data-model.md        # 4 net-new entities (Territory relationship, Record-Level Permission, AI CRM Recommendation, AI CRM Assistant Query)
├── quickstart.md         # 6 user-story validation walkthrough
└── contracts/
    ├── multi-layer-permission-combination-zero-unauthorized-visibility.contract.md
    ├── ai-crm-recommendation-100pct-nine-field-display.contract.md
    └── ai-crm-zero-autonomous-record-mutation.contract.md
```

### Source Code (repository root)

```
backend/src/modules/crm-governance/
├── territory-based-security/         # FR-001-005 — visibility enforcement on 045's territory model
├── record-level-permissions/         # FR-006-009 — whole-record grant/restrict, distinct from 013's field-level RBAC
├── ai-crm-assistant/                 # FR-018-022 — bottleneck/campaign queries, scoped to combined permission layers
├── ai-crm-recommendation/            # FR-023-025 — nine-field advisory object
└── governance-composition/           # FR-010-017 — composition checks over 013/045's existing approvals/signatures/encryption/audit/privacy/duplicate-detection/compliance
    # NOT redefined here, cited only: Customer Lifecycle/Lead/Opportunity/Account/Success/Support/Forecasting/Analytics/Integrations (FR-026-036) — all 013/045's own modules

web/app/(admin)/crm-portal/
├── territory-security/
├── record-permissions/
└── ai-crm-assistant/
```

**Structure Decision**: `territory-based-security` and `record-level-permissions` are built and contract-tested first — spec.md's own User Story 1/2 priority framing names these as the chapter's two genuinely new access-control mechanisms every other capability (including the AI Assistant's permission-scoping requirement, FR-021) depends on.

## Complexity Tracking

*No constitution violations requiring justification. N/A.*

---

**Note on `045/plan.md` update**: §2 above finds `045/plan.md`'s own Ownership & Dependency Analysis incorrectly claims Territory as entirely novel AI-intelligence ground, when `013` FR-073 already defines a basic Territory entity `045` extends rather than originates. Per this session's standing protocol, updating `045/plan.md` to correct this framing (Territory extends `013`'s existing entity, consistent with how `045`'s other "novel ground" claims — Opportunity, Deal, Account, Revenue — were not part of this check and remain as stated) is recommended but not yet applied.
