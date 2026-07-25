# Implementation Plan: Enterprise Customer Experience Management (CXM)

**Branch**: `052-enterprise-cxm` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/052-enterprise-cxm/spec.md`

## Summary

This feature builds the Enterprise Customer Experience Management (CXM) platform described in Volume 14 Part 2 Chapter 19: a 5-layer architecture and 15-stage Customer Lifecycle organizing a Unified Customer Profile; Customer Journey Intelligence and Omnichannel Engagement across 14 channels with Unified Conversation History and Cross-Channel Context; a Customer Success Platform layer; an AI Customer Intelligence Platform (Churn/Purchase/CLV/Health/Next-Best-Action predictions) and AI Risk Detection (10 risk signal types); an AI Governance layer enforcing explainability, bias monitoring, PII detection, and mandatory human oversight for compliance-critical decisions; a named Compliance Framework (GDPR, CCPA, DPDP Act, ISO 27001, SOC 2, PCI DSS, WCAG) with a full Data Subject Request workflow (Right to Access/Rectification/Erasure); Customer Feedback Management across 19 sources; Customer Loyalty Management and Engagement Automation; a Customer Communication Center; Experience Governance (SLA/policy/compliance monitoring); Customer Analytics & Performance Intelligence; and the Enterprise Customer Experience Portal.

This chapter is not directly named by the constitution, but its Assumptions section self-applies "AI Is Assistive, Never Autonomous," "Ledger-Based Internal Economies," and "No Pay-to-Win" — an Assumptions-paragraph inferred citation pattern across three separate articles.

**Spec.md already performs an unusually thorough self-resolution of its overlap with `044`**, correctly identifying it as the third feature in a "044 → 052 → 070" CX-themed chapter sequence and deferring CXOS journey/lifecycle mechanics to `044`. This plan verifies that deferral against `044`'s *current* (already-corrected) plan.md — which itself now defers Customer Success Platform depth to `047` — and follows that chain one level further than `052`'s own Assumptions do. It also surfaces a new finding `052`'s own Assumptions miss entirely: its AI Customer Intelligence section (Churn/CLV/Health Forecast) independently re-specifies ground `040` and `047` already canonically own.

## Ownership & Dependency Analysis

### §1. CXOS Journey/Lifecycle framing vs. `044` — confirmed clean at the framing level, verified against `044`'s current plan.md

Spec.md's own Assumptions state `044` is canonical for the CXOS journey-mapping/lifecycle/workflow-mechanics data model, and that `052` must not build a second journey-mapping or Success Playbook engine. Checked against `044`'s **current** plan.md (already corrected in a prior planning pass): `044` remains canonical for Journey Mapping, Touchpoint management, and CX Governance framework mechanics — this part of `052`'s deferral holds. No contradiction at this level.

### §2. Customer Success Platform depth — the deferral chain runs one level further than `052`'s own Assumptions state

`052`'s Assumptions stop at "Feature 044 is treated as the canonical home" for Success Plan/Customer Health Score mechanics. But `044`'s plan.md was corrected in the immediately preceding planning pass to state the opposite for that specific ground: *"`047` is now the canonical, authoritative source for Customer Success Management depth... This chapter's own 'Customer Success Platform' section... should be read as a lighter CXOS-level integration surface that consumes `047`'s Health Score, Playbook-trigger, and Renewal/Expansion pipeline outputs."*

**Ownership decision**: `052`'s Customer Success Platform section (FR-016–FR-019) and its "At-Risk Customers"/Customer Success Dashboard content trace through `044` to `047` as the ultimate canonical source — not `044` directly. `052` does not redefine Customer Health Score computation, Success Playbooks, Onboarding programs, or Renewal/Expansion mechanics; it consumes `047`'s (via `044`'s integration surface) outputs into its own AI-governance-and-compliance-focused presentation layer.

### §3. AI Customer Intelligence (Churn/CLV/Health Forecast) vs. `040`/`047` — new finding, not caught by `052`'s own Assumptions

`052`'s FR-021 states "AI engine MUST provide... Churn Prediction... Customer Lifetime Value Prediction... Customer Health Forecasting... Next Best Action" as part of its own AI Customer Intelligence Platform — without mentioning `040` (`retention-intelligence-churn-prediction`, already established as "the platform's deepest churn-modeling and retention-economics authority" with its own 7-type churn classification, 7-component Health Score, and 7-type CLV framework) or `047` (the now-canonical Customer Success Management authority) anywhere in its Assumptions. Verified against `040`'s and `047`'s actual plan.md files: both remain the correct, already-established canonical owners; neither has been superseded.

**Ownership decision**: `052`'s AI Customer Intelligence Platform (User Stories 1–2) does not compute a fourth independent Churn/CLV/Health-Score model. It **consumes** `040`'s Churn Prediction Engine and CLV framework, and `047`'s (via `044`) Customer Health Score, as inputs — `052`'s genuinely new, deep contribution is the **AI Governance & Compliance layer wrapped around those consumed outputs**: confidence scoring, explainability traces, bias monitoring, PII detection, and mandatory human oversight for compliance-critical AI decisions (§24, User Stories 3–4), which none of `040`/`044`/`047` define at this depth. This is the fifth consecutive... in fact the seventh instance overall this session of the Customer/Health Score naming cluster being touched (`019`, `034`, `035`, `040`, the `029`-referenced instance, `044`'s CX variant, `047`'s now-canonical CSM variant) — `052`'s own "Customer Health Score" entity is explicitly scoped here as a **consumer**, not an eighth independent instance, closing this particular thread rather than extending it.

### §4. Loyalty Referral Programs vs. `030` — reuse decision made explicit

`052`'s FR-045 lists "Referral Programs" as a Loyalty Program type, not mentioned in `052`'s own Assumptions relative to `030`. Consistent with the established reuse chain already verified for `041`, `044`, and `047` (all of which correctly defer referral-link/reward/fraud execution to `030`'s canonical engine), `052`'s Loyalty Management consumes `030`'s referral execution engine for the Referral Programs benefit type rather than rebuilding it.

### §5. Data Subject Request / Privacy Rights workflow — confirmed as genuinely new ground

`052`'s User Story 3 (Right to Access/Rectification/Erasure under GDPR/CCPA/DPDP) was checked against `003` (Auth/Identity/Onboarding) — no existing feature defines a Data Subject Request workflow, retention-hold conflict handling, or Privacy Audit Log. **Ownership decision**: `052` is the canonical, first-appearance owner of the platform's Data Subject Request workflow. This is new ground, not a duplication, and other features requiring GDPR/CCPA/DPDP data-subject-rights handling should defer to `052`'s implementation going forward — though no such feature has been planned yet to formally record that deferral.

### §6. Personalization/Loyalty (`070`) — CONFIRMED (updated 2026-07-24, per `070/plan.md` §3)

`052`'s own Assumptions already stated `070-enterprise-cx-personalization-loyalty` was expected to re-specify Personalization/Loyalty content this chapter and `044` both currently carry, and that `070`, when drafted, MUST cross-reference `044`/`052` rather than redefining Loyalty/Personalization requirements from scratch. `070` has now been planned and confirms this exactly: its own spec.md tags every FR `[DISTINCTIVE]`/`[DUPLICATE]`/`[HEAVY DUPLICATE]` against `044`/`052`, scoping itself to only the "Community Participation" journey-funnel stage, the ten-surface/ten-method Personalization enumeration, and the Experience Governance/Service Quality metric list — verified accurate against this chapter's actual FR-007/FR-015/FR-020/FR-021 (`070/plan.md` §2). **CONFIRMED, no longer forward-declared.**

### §7. RBAC, Consent, Ledger — reuse decisions confirmed

Spec.md's own Assumptions already state platform-wide RBAC (`001`/`016`), consent management, and the Reward Points/AI Credits ledger (`006`/`009`) are reused rather than rebuilt, and that Loyalty Tier/Badge status must never be directly purchasable (No Pay-to-Win). These are the standard, already-established reuse patterns for every feature this session; no contradiction found.

### §8. Preserved NEEDS CLARIFICATION items (from spec.md's own explicit flags and Edge Cases — not resolved here)

- Precedence rule when two applicable compliance regimes (e.g., GDPR vs. DPDP Act) diverge for the same customer/record — explicitly flagged by spec.md itself.
- Whether an open, critical Support Escalation forces a floor/cap on the Customer Health Score/Forecast, or is purely additive — explicitly flagged by spec.md itself.
- Reconciliation when AI Risk Detection and the AI Recommendation Engine surface conflicting signals (e.g., Churn Risk vs. Upsell Opportunity) for the same customer in the same window (Edge Cases).
- Whether a flagged model under AI Bias Monitoring is automatically suspended pending review or continues serving while under review (Edge Cases).
- Multi-category Feedback classification interacting with AI Duplicate Feedback Detection on the same item (Edge Cases).
- Whether the entire customer automation pauses or only the high-impact step pauses when an AI-recommended action sits in a mandatory human-approval queue (Edge Cases).

None of these are silently resolved; each remains an open gate for a future clarification pass.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–051.

**Primary Dependencies**: NestJS, Next.js; `044`'s Journey Mapping/Touchpoint/CX Governance framework as the consumed CXOS mechanics layer (per §1); `047`'s Customer Health Score/Success Playbook/Renewal/Expansion engine, consumed via `044`'s integration surface (per §2); `040`'s Churn Prediction Engine/CLV framework as a consumed input (per §3); `030`'s referral execution engine for Loyalty Referral Programs (per §4); `001`/`016`'s RBAC, `006`/`009`'s ledger, and platform-wide consent infrastructure (per §7); `008`'s AI gateway for every AI Customer Intelligence/Governance module.

**Storage**: PostgreSQL (14 entities per Key Entities: Customer Intelligence Profile, Unified Customer Profile, Risk Signal, Customer Journey/Journey Touchpoint, Customer Health Score, Consent Record, Data Subject Request, AI Governance Record, Engagement Automation Rule, Feedback Record, Loyalty Profile/Reward Event, Communication Record, Experience Governance Policy/Governance Record, Customer Segment).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: ai-risk-flag-human-review-before-action for SC-002, data-subject-request-retention-hold-no-silent-deletion for SC-003, and compliance-critical-ai-zero-autonomous-execution for SC-005), Playwright (web e2e — Unified Customer Profile view, AI Risk Detection review queue, Data Subject Request submission/tracking, Enterprise Experience Portal self-service flows).

**Target Platform**: Web (CXM Admin/Governance Portal + customer-facing Enterprise Experience Portal, rendered inside `017`'s workspace shell for internal users).

**Performance Goals**: Per FR-055/SC-009, the platform must support millions of customer profiles with near-real-time journey processing and enterprise-scale reporting across multi-region/multilingual/multi-tenant deployments [NEEDS CLARIFICATION: no numeric thresholds stated in source].

**Constraints**: Zero AI Risk Detection flag may trigger a customer-facing retention action without routing to a human-reviewable queue first (FR-026, SC-002; Constitution Article II); zero Data Subject Request may result in a silent deletion of records under an active retention hold (FR-039, SC-003); zero AI-generated recommendation classified as compliance-critical or security-sensitive may execute without mandatory human review (FR-032, SC-005; Constitution Article II); 100% of consent withdrawals must propagate to in-flight engagement automation without delay (FR-041, SC-006; Constitution Article VI); zero fourth independent Churn/CLV/Health-Score computation may be built where `040`/`047` already own that ground (§3).

**Scale/Scope**: 14 entities, 55 FRs, 8 user stories, 5-layer architecture, 15-stage Customer Lifecycle, 12-phase CX Operating Model, 6 preserved NEEDS CLARIFICATION items, no worsening of any of the 8 previously-accumulated Wave 2/3 architecture gaps, one deferral chain extended one level further than spec.md's own Assumptions state (§2, `044`→`047`), one new AI-model-duplication finding resolved in favor of `040`/`047` (§3), one new referral-engine reuse decision made explicit (§4), and confirmation that the Data Subject Request workflow is genuinely new, first-appearance ground for the platform (§5).

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Customer Health Score, Risk Signals, and AI predictions are all server-computed, never client-asserted. |
| II. AI Is Assistive, Never Autonomous | PASS — Assumptions-cited | FR-026, FR-028, FR-030, FR-032 all require human review/approval before an AI output (risk-triggered action, high-impact engagement step, compliance-critical decision) takes effect; SC-002 and SC-005 state zero-tolerance success criteria. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | AI Recommendation outputs remain advisory (FR-021–FR-025) rather than guaranteed outcomes. |
| IV. Historical Immutability | PASS | Privacy Audit Log and AI Governance Record capture immutable, timestamped entries (FR-039, FR-031) never retroactively altered. |
| V. Ledger-Based Internal Economies | PASS (reused, not redefined) | Reward Points/AI Credits integrate with `006`/`009`'s existing ledger rather than a new mutable balance field (per §7). |
| VI. Consent Is First-Class, Per-Channel, and Versioned | PASS (reused, not redefined) | FR-041 requires consent validation before behavioral tracking/personalization and immediate withdrawal propagation to in-flight automation, reusing the platform-wide consent mechanism. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS (reused, not redefined) | CX Governance, AI Governance review, and Data Subject Request approval roles configure `001`'s/`016`'s existing layered RBAC (per §7). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS — Assumptions-cited | Loyalty Tier/Badge status earned through the Reward Engine's qualifying activities must never be directly purchasable (Assumptions; Edge Cases). |
| IX. Action Before Consumption | PASS | Every customer progresses through a governed 15-stage lifecycle with measurable outcomes (FR-005), not passive tracking. |
| Localization & Language Requirements | PASS (inherited) | FR-049 requires multi-language messaging; broader Tamil/Tanglish handling is inherited from `020`/`021`'s established patterns. |
| Security & Compliance Baseline | PASS — directly names the full compliance list | FR-034 explicitly enumerates GDPR, CCPA, DPDP Act, ISO 27001, SOC 2, PCI DSS, WCAG — the most complete named compliance list of any CX-themed feature this session. |

## Project Structure

### Documentation (this feature)

```
specs/052-enterprise-cxm/
├── spec.md
├── plan.md
├── research.md         # 6 NEEDS CLARIFICATION items from §8
├── data-model.md        # 14 entities
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── ai-risk-flag-human-review-before-action.contract.md
    ├── data-subject-request-retention-hold-no-silent-deletion.contract.md
    └── compliance-critical-ai-zero-autonomous-execution.contract.md
```

### Source Code (repository root)

```
backend/src/modules/cxm/
├── platform-scope-lifecycle/           # FR-001-006 — 5-layer architecture, 15-stage lifecycle, 12-phase model
├── unified-profile-journey-omnichannel/ # FR-007-015 — consumes 044's Journey/Touchpoint mechanics (per §1)
├── customer-success-platform/          # FR-016-019 — consumes 047's Health Score/Playbooks via 044 (per §2)
├── ai-customer-intelligence/           # FR-020-025 — consumes 040's Churn/CLV, 047's Health Score (per §3)
├── ai-risk-detection/                  # FR-026 — consumes 040's churn signals (per §3)
├── ai-governance/                      # FR-027-033 — canonical, genuinely deep new ground (per §3)
├── compliance-framework/               # FR-034-038 — named GDPR/CCPA/DPDP/ISO/SOC2/PCI/WCAG framework
├── consent-data-rights/                # FR-039-041 — canonical Data Subject Request workflow (per §5)
├── customer-feedback-management/       # FR-042-044
├── loyalty-engagement-automation/      # FR-045-048 — Referral Programs consume 030 (per §4)
├── customer-communication-center/      # FR-049
└── experience-governance-analytics-portal/ # FR-050-055
└── common/
    # reused from 044 (Journey/Touchpoint/CX Governance mechanics), 047 (Health Score/Playbooks, via 044),
    # 040 (Churn Prediction Engine/CLV), 030 (referral execution), 001/016 (RBAC), 006/009 (ledger), 008 (AI gateway)

web/app/(admin)/cxm/
├── ai-intelligence-risk/
├── ai-governance-compliance/
├── data-subject-requests/
├── feedback-loyalty/
└── experience-governance/

web/app/(customer)/experience-portal/
├── home-dashboard/
├── subscription-center/
├── loyalty-center/
├── support-communication/
└── privacy-consent/
```

**Structure Decision**: `ai-governance` and `consent-data-rights` are built and contract-tested first alongside `platform-scope-lifecycle` — these are `052`'s genuinely new, deep contribution (per §3, §5) and the chapter's own explicit, non-negotiable compliance requirements ("Human oversight shall remain mandatory for all security-sensitive and compliance-critical AI decisions," §24), rather than the journey/lifecycle mechanics already owned by `044`/`047`/`040`.

## Complexity Tracking

*No constitutional violations identified. This section intentionally left empty.*
