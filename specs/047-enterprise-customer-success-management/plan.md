# Implementation Plan: Enterprise Customer Success Management (CSOS)

**Branch**: `047-enterprise-customer-success-management` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/047-enterprise-customer-success-management/spec.md`

## Summary

This feature builds the Customer Success Operating System (CSOS) described in Volume 14 Part 2 Chapter 14: a unified Customer 360° Workspace as the authoritative source of truth; configurable customer registration/segmentation/journey tracking through a 14-stage Customer Lifecycle; collaborative Customer Success Plans and a full Customer Success Operations toolkit (tasks, SLAs, playbooks, EBRs/QBRs, escalation); a differentiated Onboarding Lifecycle (10 configurable programs including White-Glove vs. Self-Service tracks, a 10-stage lifecycle); Activation Milestones tracked independently of onboarding-stage completion; Product Adoption Management and a Success Playbook catalog (10 categories); Customer Engagement Management; a dynamic Customer Health Score (15 weighted metrics, 7 Health Categories); Churn Prediction (12 indicators, 5 Risk Levels) and Prevention Playbooks; Renewal Management (9-stage lifecycle) with AI discount optimization gated behind human approval; Expansion Management (10 opportunity types, 8-step workflow); Customer Advocacy Management; a unified Customer Success Portal (15 modules) with Learning, Self-Service, Community, and Executive sub-portals; and a Customer Success AI Copilot operating under enterprise AI governance (human approval, explainability, confidence scores, prompt logging, full audit history).

This chapter self-cites **Constitution Article II verbatim in FR text three times** (FR-057, FR-078, FR-081) — an FR-text-verbatim citation pattern — covering renewal/discount recommendations, AI Copilot outputs, and every AI-generated recommendation across the CSOS respectively.

**Spec.md performs a thorough self-resolution of its overlap with `013` and `040`**, explicitly treating this chapter as the enterprise-scale orchestration/intelligence layer built on the base entities `013` already defines, and `040` as the canonical churn-scoring-model authority this chapter's Churn Prediction Management operationally consumes. This plan verifies both against their actual plan.md files and — critically — surfaces a **major, unresolved reversal**: `044`'s own plan.md (written the previous turn, before this feature existed as a plan) explicitly claimed "first-appearance canonicity" over the Customer Success Platform content this chapter now demonstrates it owns far more deeply.

## Ownership & Dependency Analysis

### §1. Base CRM Health Score/Success Plan/Onboarding (`013`) — confirmed clean, verified against `013`'s actual plan.md

Spec.md's own Assumptions state this chapter is "the enterprise-scale orchestration and intelligence layer built on top of the base customer/account and customer-success entities already defined in feature 013," which already has "a 'Customer Health Score / Health Score Factor' (0–100 scale; Healthy/Neutral/At Risk/Critical)... and a 10-stage onboarding process." Checked against `013`'s actual plan.md Project Structure: its `crm-customer-success` module owns exactly "Customer Health Score, Success Plan, Customer Risk, Renewal, upsell/cross-sell, Business Review (FR-083–FR-092)" and its `crm-onboarding` module owns "Onboarding Template/Project/Task, onboarding portal (FR-080–FR-082)" — an exact match to spec.md's own claim. `047`'s Customer 360° Profile is confirmed to extend `013`'s Account/Customer entity rather than replace it, per spec.md's own preserved NEEDS CLARIFICATION on whether the two Health Scores are the same score recalculated with enterprise inputs or a genuinely separate parallel score (not resolved here — see §6).

### §2. Churn Prediction model (`040`) — confirmed clean

Spec.md's own Assumptions state `040` owns the canonical churn-prediction model/scoring engine, and this chapter's Churn Prediction Management (§25) is the Customer-Success operational consumption layer on top of it (CS-specific Risk Levels, Prevention Playbook triggering, CSM/renewal workflow linkage). Checked against `040`'s actual plan.md: confirmed as "the platform's deepest churn-modeling and retention-economics authority" with its own Churn Prediction Engine — no contradiction. This is the identical resolution `044` already independently reached for its own Retention Management section, confirming consistency across both chapters that touch churn.

### §3. Customer Success Platform (`044`) — major finding: reverses `044`'s own premature ownership claim

`044-enterprise-cx-journey-success`'s own plan.md (written the previous turn) states: *"047 (not-yet-drafted Customer Success Management chapter — 044 claims first-appearance canonicity)"* over its own Customer Success Platform section (Health Scoring, Playbooks, Success Plans, Onboarding, Retention, CS Dashboard — `044` FR-028–FR-050). That claim was necessarily provisional, since `047` did not yet exist as a plan. Now that this chapter's full content is available for direct comparison, the claim does not hold:

- `044`'s "Customer Health Score (CX variant)" uses 14 categories and 6 tiers (Excellent→Critical). `047`'s Customer Health Score uses **15** categories and **7** tiers (adding "Recovery Required"), with a materially more detailed weighting/monitoring model (FR-045–FR-049: Daily/Weekly/Monthly trend monitoring, Health Forecasts, Root Cause Analysis).
- `044`'s onboarding (FR-042) is a single generic 9-element structure with a 10-item checklist. `047`'s Onboarding Lifecycle (FR-025–FR-027) defines **10 differentiated configurable programs** — explicitly including White-Glove vs. Self-Service tracks segmented by customer tier — progressing through its own 10-stage lifecycle with per-stage SLA tracking.
- `047` defines entire capability domains `044` does not cover **at all**: Activation Milestones tracked independently of onboarding (FR-028–FR-031), Renewal Management with a full 9-stage lifecycle and AI discount-optimization governance (FR-054–FR-057), Expansion Management with a 8-step workflow across 10 opportunity types (FR-058–FR-061), and a Customer Success AI Copilot under full enterprise AI governance (FR-077–FR-079).
- `044`'s Success Playbook catalog has 11 categories; `047`'s has 10 named categories plus custom, but is embedded in a materially deeper operational toolkit (Task Management, SLA Management, Escalation Management — FR-019).

**Ownership decision**: this plan reverses `044`'s premature claim. `047` (this chapter) is the canonical, authoritative source for Customer Success Management depth: the Health Score model and tier taxonomy, the Success Playbook catalog, Success Plan workflow, Onboarding Program differentiation, Activation Milestones, Churn Prevention Playbooks, Renewal Management, Expansion Management, and the Customer Success AI Copilot. `044`'s own "Customer Success Platform" section should be understood as a lighter CXOS-level integration surface that consumes `047`'s outputs (Health Score, Playbook triggers, Renewal/Expansion pipeline data) into its Journey/Touchpoint/CX Governance framework, rather than `044` independently computing a competing 14-category Health Score or maintaining a rival Playbook catalog.

**This correction is NOT silently applied to `044`'s already-written plan.md.** Per the same protocol followed when the equivalent `027`/`028` overclaim was found and corrected earlier this session, this finding is flagged here for explicit user confirmation before `044`'s plan.md Summary and §1 are edited. Until that confirmation, `044`'s plan.md text remains as originally written, and this note is the authoritative record of the discrepancy.

`047`'s own "Customer Health Score (CSM variant)" is now the **seventh** independently-specified "Customer/Health Score"-named construct across the session's Wave 2/3 features (joining `019`, `034`, `035`, `040`, the `029`-referenced instance, and `044`'s CX variant) — and, per this section's ownership decision, the recommended canonical one for Customer-Success-specific health scoring going forward.

### §4. Advocacy vs. `030` — confirmed clean

`047`'s Customer Advocacy Management (FR-062–065) is lighter-touch (Reference Customers, Case Studies, Testimonials, Advisory Boards, configurable rewards) and does not redefine referral link/reward/fraud-execution mechanics. Consistent with the established reuse chain (`041`, `044`), `030` remains canonical for referral execution; `047`'s "refer new customers" advocacy action (FR-063) is assumed to route through `030`'s existing referral engine rather than a parallel one.

### §5. AI Copilot vs. `008` — confirmed clean

Spec.md's own Assumptions state AI outputs across all CSOS modules run through the platform-wide AI Assistant and governance infrastructure (Volume 08 / `008`) rather than a CSOS-specific model-routing layer. This is the standard, already-established reuse pattern for every AI-touching feature this session.

### §6. Preserved NEEDS CLARIFICATION items (from spec.md's own FR text and Edge Cases, plus §1/§3's findings — not resolved here)

- Whether `047`'s Customer Health Score is the same underlying score as `013`'s recalculated with enterprise-tier inputs, or a genuinely separate parallel score (§1; spec.md's own Assumptions).
- Default weightage values for the 15 Health Score metrics (FR-046).
- Numeric score boundaries for each of the 7 Health Categories (FR-047).
- Maximum AI-recommended discount percentage and approval-escalation threshold during Renewal Commercial Assessment (FR-057).
- Whether the `044`/`047` Customer Success Platform ownership reversal (§3) should be applied as a correction to `044`'s plan.md — pending explicit user confirmation.
- Mid-journey onboarding-track correction mechanics without losing completed-stage history or SLA clocks (Edge Cases).
- Reconciliation rule when Health Score sub-signals conflict (e.g., delinquent payment vs. high product usage) — which Health Category results (Edge Cases).
- Which signal (Health Score vs. Churn Risk Level) drives Prevention Playbook triggering when the two disagree for the same account (Edge Cases).
- Reconciliation of a single customer-level Health Score/Lifecycle Stage when the customer holds multiple products independently at different lifecycle stages (Edge Cases).
- Continuity of an in-progress Onboarding Workspace/Success Plan/audit trail when the assigned CSM is reassigned or leaves (Edge Cases).
- Whether an AI Copilot draft referencing an unauthorized pricing/contractual commitment is blocked, flagged, or only caught at human review (Edge Cases).
- Escalation behavior for a renewal that lapses past its Renewal Timeline date without progressing beyond "Renewal Identification" (Edge Cases).

None of these are silently resolved; each remains an open gate for a future clarification pass.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–046.

**Primary Dependencies**: NestJS, Next.js; `013`'s base Account/Customer/Health-Score/Success-Plan/Onboarding entities as the foundation this CSOS layer extends (per §1); `040`'s Churn Prediction Engine as a consumed input (per §2); `030`'s referral execution engine for Advocacy referral actions (per §4); `008`'s AI gateway for every AI Copilot and advisory-intelligence module (per §5); `004`/`005`/`013`'s existing LMS/Community/Support Desk content as the reused substrate for the Learning/Community/Self-Service sub-portals (per spec.md's own Assumptions).

**Storage**: PostgreSQL (16 entities per Key Entities: Customer 360° Profile, Customer Segment, Customer Journey, Customer Success Plan, Onboarding Program/Track, Activation Milestone, Success Playbook, Customer Health Score (CSM variant), Churn Risk Assessment, Prevention Playbook, Renewal Record, Expansion Opportunity, Advocacy Program Enrollment, CS AI Copilot Session, EBR/QBR, Customer Success Task).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: customer-360-single-workspace-view for SC-001, renewal-discount-requires-human-approval for SC-005, and ai-copilot-output-requires-human-approval-before-customer-facing-action for SC-007), Playwright (web e2e — Customer 360° Workspace, Onboarding track assignment, Health Score dashboard, Renewal 9-stage tracker, AI Copilot session).

**Target Platform**: Web (Customer Success Admin Portal + Customer-facing Success Portal, rendered inside `017`'s workspace shell for internal users).

**Performance Goals**: Per FR-083/SC-009, the platform must support millions of customers/interactions/learning activities/community discussions/renewals/AI recommendations across multi-region/multi-language/multi-currency/multi-tenant deployments with analytics/AI processing independent from transactional workloads [NEEDS CLARIFICATION: no numeric thresholds stated in source].

**Constraints**: Zero renewal discounts may be applied to a contract without passing through the configured human Approval stage (FR-057, SC-005; Constitution Article II); zero AI Copilot outputs may reach a customer-facing action without human review/approval (FR-078, SC-007; Constitution Article II); every Expansion Opportunity is counted exactly once in Expansion Pipeline/Revenue analytics regardless of how many signals contributed to its detection (FR-060, SC-006); zero customer operations (onboarding, health scoring, renewal, expansion) may lack an audit-trail entry (FR-080, SC-008); every engagement/playbook automation respects current per-channel communication consent with immediate withdrawal propagation (SC-010; Constitution Article VI).

**Scale/Scope**: 16 entities, 83 FRs, 8 user stories, 14-stage Customer Lifecycle, 10-stage Onboarding lifecycle, 9-stage Renewal lifecycle, 8-step Expansion workflow, 12 preserved NEEDS CLARIFICATION items (including the major `044` ownership-reversal finding), no worsening of any of the 8 previously-accumulated Wave 2/3 architecture gaps beyond the now-corrected Customer Success Platform ownership direction, and a seventh entry in the ongoing Customer/Health Score naming cluster (§3) — this time identified as the likely canonical one.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Customer Health Score, Churn Probability, and Renewal/Expansion stage progression are all server-computed, never client-asserted. |
| II. AI Is Assistive, Never Autonomous | PASS — **FR-text-verbatim cited 3×** | FR-057 (renewal/discount recommendations), FR-078 (AI Copilot outputs), and FR-081 (every AI recommendation across the CSOS) each explicitly cite "Constitution Article II"; SC-005 and SC-007 state zero-tolerance success criteria. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | AI Copilot outputs remain drafts requiring human review before any customer-facing communication (FR-078). |
| IV. Historical Immutability | PASS | Every customer operation (onboarding, health scoring, renewal, expansion) generates immutable audit history (FR-080); historically computed Health Scores remain unchanged when weighting configuration later changes (User Story 4 acceptance scenario 2). |
| V. Ledger-Based Internal Economies | PASS (reused, not redefined) | Advocacy Rewards (Loyalty Points, Digital Certificates, Product Discounts) are assumed to integrate with `006`/`009`'s existing ledger rather than a new mutable balance field, consistent with the established pattern from `029`/`040`/`044`. |
| VI. Consent Is First-Class, Per-Channel, and Versioned | PASS (reused, not redefined) | Engagement/playbook automation respects per-channel consent with immediate withdrawal propagation (SC-010); consent mechanics themselves are inherited from `002`/`003`/`019`'s existing infrastructure. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS (reused, not redefined) | Renewal Approval stage and Customer Success Portal RBAC/MFA/SSO (FR-069, FR-082) configure `003`'s/`016`'s existing infrastructure. |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Health Score, Churn Risk, and Expansion prioritization are all evidence/data-based (FR-045, FR-050) rather than vanity-metric-driven. |
| IX. Action Before Consumption | PASS | Every onboarding, renewal, and expansion progresses through defined stages with SLA tracking toward a measurable outcome (FR-027, FR-054, FR-059), not passive tracking. |
| Localization & Language Requirements | PASS (not primary focus, inherited) | Customer Profile carries Preferred Language (FR-003); broader Tamil/Tanglish handling is inherited from `020`/`021`'s established patterns rather than redefined here. |
| Security & Compliance Baseline | PASS | FR-082 (immutable audit logs, encryption at rest/in transit, RBAC/MFA/SSO) aligns with the baseline. |

## Project Structure

### Documentation (this feature)

```
specs/047-enterprise-customer-success-management/
├── spec.md
├── plan.md
├── research.md         # 12 NEEDS CLARIFICATION items from §6
├── data-model.md        # 16 entities
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── customer-360-single-workspace-view.contract.md
    ├── renewal-discount-requires-human-approval.contract.md
    └── ai-copilot-output-requires-human-approval-before-customer-facing-action.contract.md
```

### Source Code (repository root)

```
backend/src/modules/csos/
├── customer-360-workspace/              # FR-001-015 — Customer 360° Profile, registration, segmentation, journey, lifecycle (extends 013, per §1)
├── success-planning-operations/         # FR-016-024 — Success Plans, CS Operations, Customer Intelligence Dashboard
├── onboarding-lifecycle/                # FR-025-027 — 10 programs, 10-stage lifecycle (canonical, per §3)
├── activation-milestones/               # FR-028-031
├── product-adoption-playbooks/          # FR-032-039 — adoption metrics/categories/campaigns, Success Playbook catalog (canonical, per §3)
├── customer-engagement/                 # FR-040-044
├── customer-health-score/               # FR-045-049 — 15-metric, 7-tier score (canonical, per §3)
├── churn-prediction-prevention/         # FR-050-053 — consumes 040's model (per §2), Prevention Playbooks (canonical, per §3)
├── renewal-management/                  # FR-054-057 — 9-stage lifecycle, AI discount gate (canonical, per §3)
├── expansion-management/                # FR-058-061 — 8-step workflow, 10 types (canonical, per §3)
├── customer-advocacy/                   # FR-062-066 — advocacy programs (referral execution reuses 030, per §4)
├── customer-success-portal-core/        # FR-067-069
├── customer-learning-portal/            # FR-070-072 — reuses 004's LMS content, per spec.md's own Assumptions
├── customer-self-service-portal/        # FR-073-074
├── customer-community-portal/           # FR-075 — reuses 005's Community content
├── customer-success-executive-portal/   # FR-076
└── customer-success-ai-copilot/         # FR-077-079 — reuses 008's AI gateway (canonical, per §3 and §5)
└── common/
    # reused from 013 (base Customer/Health Score/Success Plan/Onboarding), 040 (Churn Prediction Engine),
    # 030 (referral execution), 008 (AI gateway), 004/005 (LMS/Community content), 003/016 (auth/RBAC)

web/app/(customer-success-portal)/
├── dashboard/
├── success-plan/
├── product-adoption-center/
├── learning-center/
├── renewal-center/
├── expansion-center/
├── ai-copilot/
└── community/

web/app/(admin)/csos/
├── customer-360-workspace/
├── health-churn-intelligence/
├── renewal-expansion-pipeline/
└── executive-portal/
```

**Structure Decision**: `customer-360-workspace` and `onboarding-lifecycle` are built and contract-tested first — the Customer 360° Workspace is the explicitly named authoritative single source of truth every other CSOS capability reads from and writes to, and Onboarding is Phase 4 of the Operating Model directly determining time-to-value and early churn. `customer-health-score` and `renewal-management` follow immediately given their mission-critical status and Constitution Article II gating requirements.

## Complexity Tracking

*No constitutional violations identified. This section intentionally left empty.*
