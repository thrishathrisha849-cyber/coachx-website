---
description: "Implementation plan for Feature 070 — Enterprise CX Personalization & Loyalty (Third CX Re-Specification)"
---

# Implementation Plan: Enterprise CX Personalization & Loyalty (Third CX Re-Specification)

**Branch**: `070-enterprise-cx-personalization-loyalty` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/070-enterprise-cx-personalization-loyalty/spec.md`

## Summary

This is the third CX-themed chapter in Volume 14 (after Chapter 11/`044` and Chapter 19/`052`), and matches the discipline of this session's best compressed re-specifications (`057`, `060`): spec.md tags every FR `[DISTINCTIVE]`, `[DUPLICATE]`, or `[HEAVY DUPLICATE]` against `044`/`052` up front, scoping itself to exactly three genuinely new contributions — the "Community Participation" journey-funnel stage, the ten-surface/ten-method Personalization enumeration, and the Experience Governance & Service Quality metric list. This plan's job is to verify that self-citation discipline against `044`/`052`'s actual current content and surface anything neither caught.

## Ownership & Dependency Analysis

### §1. "Community Participation" Journey Stage vs. `044` — CONFIRMED, distinctiveness verified with specific evidence

Spec.md's own FR-004 marks the "Community Participation" journey-funnel stage `[DISTINCTIVE — not present as a named funnel stage in Feature 044's 15-stage lifecycle]`. Verified against `044`'s actual spec.md: its 15-stage lifecycle (FR-009: Visitor, Lead, Prospect, Trial User, New Customer, Onboarding, Activated User, Engaged Customer, Loyal Customer, Advocate, Renewal, Expansion, Win-Back, Alumni, Archived) does not name "Community Participation" as a stage — but `044` does use "Community Participation" extensively as a *signal/metric* elsewhere (its own Health Score category, FR-031; Product Adoption metric, FR-044; Retention strategy, FR-046; Segmentation input, FR-055; Engagement metric, FR-064 — five separate FRs). **Ownership decision**: CONFIRMED — this feature's contribution is genuinely distinctive: elevating "Community Participation" from a signal `044` already scores into an explicit, gated funnel *stage* in this chapter's own coarser 11-stage view, layered on top of (not replacing) `044`'s canonical 15-stage lifecycle, exactly as spec.md's own Edge Cases already frame it.

### §2. AI Customer Intelligence / Unified Customer Profile Citations vs. `052` — confirmed clean, citation accuracy spot-verified

Spec.md's own FR-026/FR-027 mark Omnichannel Features and AI Capabilities `[DUPLICATE]`/`[HEAVY DUPLICATE]` of `052`'s canonical Unified Customer Profile (FR-007–FR-009/FR-015) and AI Customer Intelligence (FR-020/FR-021). Spot-verified against `052`'s actual spec.md: FR-007 (360-degree customer profile), FR-015 (Unified Conversation History/Cross-Channel Context), FR-020 (AI Customer Intelligence continuous analysis), and FR-021 (Segmentation/Churn Prediction/CLV/Recommendation Engine/Next Best Action/Executive Insights) all confirmed to exist and match the cited claims exactly. **Ownership decision**: CONFIRMED — this feature's own citation discipline holds up under verification, consistent with `060`'s equally accurate citation record against `013`/`045`.

### §3. `052`'s Own Forward-Declaration — CONFIRMED, closing that feature's forward-declared item

`052/plan.md` §6 already forward-declared this feature by name: *"`070`... is expected to re-specify Personalization/Loyalty content this chapter and `044` both currently carry, and that `070`, when drafted, MUST cross-reference `044`/`052` rather than redefining Loyalty/Personalization requirements from scratch."* **Ownership decision**: CONFIRMED — this feature's own spec.md does exactly that, closing `052/plan.md` §6's forward-declared item.

### §4. Reward Points/Badge Ledger Mechanic vs. `006` (Gamification, Points, Levels, Badges, Streaks & Rewards) — clarified, not corrected

Spec.md's own Assumptions generically bundle "ledger-based internal-economy infrastructure (per Features 044/052/006/009)" as reused, without singling out which feature owns the actual points/badge *ledger mechanic* this chapter's FR-010–FR-013 (Reward Points, Achievement Badges, Digital Wallet) and FR-034 (append-only reward-ledger requirement) describe. Checked precisely: `006` is the constitution's **primary cited source** for both Article V (Ledger-Based Internal Economies — "Vol 06, 6 separate point ledgers") and Article VIII (No Pay-to-Win — "Vol 06 'No Pay-to-Win' hard rule"), the exact two articles this feature's own FR-013 and FR-034 invoke. Both `044/plan.md` and `052/plan.md` already explicitly resolved their own equivalent Loyalty sections this same way (`044/plan.md` Constitution Check: "Loyalty Benefits fulfillment... integrate with `006`/`009`'s existing append-only ledger"; `052/plan.md`: "Reward Points/AI Credits integrate with `006`/`052`'s existing ledger"). **Ownership decision**: CONFIRMED and made explicit — `006` is the specific, constitution-cited ledger mechanic this feature's Reward Points/Achievement Badges/Digital Wallet content (FR-010–FR-013) must integrate with, not `044` or `052` directly, consistent with the identical pattern both of those features already established for their own Loyalty content.

### §5. AI CX Assistant vs. `008`/`066` — confirmed clean, transitive reuse

Not separately verified by spec.md's own Assumptions. Consistent with the established transitive-reuse pattern: this feature's AI CX Assistant (FR-028/FR-029) reuses `008`'s `ai-gateway`/`ai-guardrails`, directly or transitively via `066`, consuming predictions from `052`'s canonical AI Customer Intelligence engine (per FR-035) rather than a fifth independent AI-prediction stack.

### §6. RBAC vs. `001`/`016` — confirmed clean, standard layered-extension pattern

Not mentioned in spec.md's own Assumptions beyond a generic reference (FR-030). **Ownership decision**: this feature's RBAC requirement configures `001`'s/`016`'s existing layered engine per the established extension pattern, applied to CX-governance and loyalty-administration roles.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web) — consistent with 001–069.

**Primary Dependencies**: `044`'s canonical 15-stage CX lifecycle as the system of record this feature's 11-stage funnel layers a coarser view on top of (per §1, confirmed distinctive); `052`'s canonical Unified Customer Profile and AI Customer Intelligence engine, citation-accuracy spot-verified (per §2); `052`'s own forward-declaration closed (per §3); `006`'s canonical Reward Points/Badge ledger as the specific mechanic this feature's Loyalty content integrates with, matching the identical pattern `044`/`052` already established (per §4, clarified); `008`'s AI gateway, directly or transitively via `066` (per §5); `001`/`016`'s layered RBAC (per §6).

**Storage**: PostgreSQL (6 net-new entities per Key Entities: Journey Stage [11-stage funnel view], Journey Trigger, Personalization Surface, Personalization Method, Experience Governance Standard, AI CX Recommendation — all other referenced entities are `044`'s or `052`'s own tables, or `006`'s ledger, not redefined here).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: journey-funnel-100pct-community-participation-non-skippable for SC-001, loyalty-zero-pay-to-win-purchasable-tier-badge-status for SC-003, and zero-duplicate-health-score-churn-profile-engines-vs-044-052 for SC-008), Playwright (web e2e — Community Participation stage gating, Personalization surface rendering, Journey Builder trigger/branch configuration, Loyalty Dashboard).

**Target Platform**: Web (CX admin console, Journey Builder, Loyalty Dashboard, Experience Governance dashboard, AI CX Assistant).

**Performance Goals**: Per SC-002, all ten Personalization Surfaces must render personalized content for any customer with at least one recorded Personalization Method signal, with zero surfaces defaulting to fully generic content when signal is available.

**Constraints**: Zero Membership Tier/VIP Membership/Achievement Badge/Loyalty Status may be directly purchasable with money (FR-013, SC-003); every Reward Point issuance must be an append-only, auditable ledger entry per distinct qualifying event via `006`'s ledger (FR-034, SC-004); this feature introduces zero duplicate Customer Health Score/Success Plan/Churn Prediction/AI Customer Intelligence/Unified Customer Profile engines beyond `044`/`052`'s canonical ones (FR-017/FR-026/FR-027/FR-035, SC-008); consent withdrawal for a specific channel must halt personalized sends on that channel immediately without disabling personalization on non-withdrawn surfaces (FR-033, SC-007).

**Scale/Scope**: 6 net-new entities, 35 FRs (of which spec.md itself tags roughly a third as duplicate/heavy-duplicate citations to `044`/`052`, not re-implemented), 7 user stories, an 11-stage journey funnel, 10 personalization surfaces/10 methods, 10 journey triggers, 10 loyalty reward activities, 10 service quality metrics, 10 governance features, no explicitly self-flagged NEEDS CLARIFICATION items in the FR text itself (flagged instead throughout Edge Cases — 7 items), one confirmed-distinctive finding with specific verified evidence (§1), citation-accuracy confirmed against `052` (§2), a closed forward-declaration (§3), and one clarified (not corrected) ledger-ownership finding explicitly naming `006` as the mechanic `044`/`052` already established this same pattern for (§4). This is the twenty-third consecutive feature this session to surface a genuine, previously-uncaught cross-feature nuance during planning.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Journey-stage advancement, personalization signal evaluation, and reward-point crediting are all server-computed, never client-asserted (FR-004, FR-034). |
| II. AI Is Assistive, Never Autonomous | PASS — **FR-text-verbatim cited** | FR-032 explicitly requires human/role-gated approval before any consequential AI-driven personalization/loyalty/retention/governance recommendation takes customer-facing effect. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | AI CX Recommendations present Confidence Score and Business Impact transparently (FR-029), not as guaranteed outcomes. |
| IV. Historical Immutability | PASS | FR-030 requires Audit Logging and Data Retention Policies; reward-point issuance is append-only per FR-034. |
| V. Ledger-Based Internal Economies | PASS — **FR-text-verbatim cited, explicitly clarified to `006`** | FR-034 explicitly invokes the constitution's Ledger-Based Internal Economies principle, integrating with `006`'s canonical ledger (per §4), consistent with `044`/`052`'s identical resolution. |
| VI. Consent Is First-Class, Per-Channel, and Versioned | PASS — **FR-text-verbatim cited** | FR-033 explicitly requires per-channel consent withdrawal to propagate immediately to personalization/loyalty/retention sends on that channel. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS | FR-030 requires RBAC, configuring `001`'s/`016`'s existing engine (per §6). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS — **FR-text-verbatim cited, primary reinforcement of `006`'s hard rule** | FR-013 explicitly invokes the constitution's Article VIII, prohibiting direct purchase of Membership Tier/VIP Membership/Achievement Badges/Loyalty Status. |
| IX. Action Before Consumption | PASS | Every customer progresses through the governed 11-stage funnel with Community Participation as a non-skippable evaluated stage (FR-004). |
| Localization & Language Requirements | PASS (not primary focus, inherited) | FR-008 names Language as one of ten Personalization Methods, consistent with the constitution's Tamil-first requirement. |
| Security & Compliance Baseline | PASS (reused, not redefined) | FR-030's compliance/security baseline consumes `052`'s canonical named-regulatory-framework model (GDPR/CCPA/DPDP/ISO 27001/SOC 2/PCI DSS) rather than an independent implementation. |

## Project Structure

### Documentation (this feature)

```
specs/070-enterprise-cx-personalization-loyalty/
├── spec.md
├── plan.md
├── research.md         # 2 NEEDS CLARIFICATION items (source-silent, self-flagged) + 7 from Edge Cases
├── data-model.md        # 6 net-new entities (Loyalty/Health-Score/Profile entities reference 044/052/006)
├── quickstart.md         # 7 user-story validation walkthrough
└── contracts/
    ├── journey-funnel-100pct-community-participation-non-skippable.contract.md
    ├── loyalty-zero-pay-to-win-purchasable-tier-badge-status.contract.md
    └── zero-duplicate-health-score-churn-profile-engines-vs-044-052.contract.md
```

### Source Code (repository root)

```
backend/src/modules/enterprise-cx-personalization-loyalty/
├── platform-foundation/              # FR-001-003 — CX principles, twelve touchpoints
├── community-participation-stage/    # FR-004 — distinctive 11-stage funnel view, layered on 044 (per §1)
├── personalization-engine/           # FR-007-009 — distinctive 10-surface/10-method enumeration
├── journey-builder-triggers/         # FR-005-006 — distinctive 10-trigger list, mechanics from 044
├── loyalty-rewards/                  # FR-010-013 — integrates with 006's ledger (per §4)
├── experience-governance-service-quality/ # FR-023-024 — distinctive governance/metric lists
├── voice-of-customer/                # FR-014-016 — subset consumed by 044/052's canonical VoC
├── ai-cx-assistant/                  # FR-028-029 — distinctive 9-field structure, reuses 008/066 (per §5)
└── customer-success-analytics-omnichannel-remainder/ # FR-017-022, FR-025-027, FR-030-035
    # NOT redefined here: Customer Health Score/Success Plan/Churn Prediction (044/052),
    # Unified Customer Profile (052), AI Customer Intelligence engine (052)

web/app/(admin)/cx-personalization-portal/
├── journey-funnel-config/
├── personalization-engine/
├── journey-builder/
├── loyalty-dashboard/
├── experience-governance/
└── ai-cx-assistant/
```

**Structure Decision**: `community-participation-stage` and `personalization-engine` are built and contract-tested first — spec.md's own User Story 1/2 priority framing states these are the two load-bearing, distinctive contributions this chapter exists to add, ahead of the loyalty/governance/VoC content already substantially covered by `044`/`052`.

## Complexity Tracking

*No constitution violations requiring justification. N/A.*

---

**Note on `052/plan.md` update**: §3 above closes `052/plan.md` §6's forward-declared item. Per this session's standing protocol, updating `052/plan.md` §6 to mark it CONFIRMED is recommended but not yet applied.
