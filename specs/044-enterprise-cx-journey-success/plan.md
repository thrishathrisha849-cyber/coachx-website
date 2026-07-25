# Implementation Plan: Enterprise Customer Experience Operating System (CXOS)

**Branch**: `044-enterprise-cx-journey-success` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/044-enterprise-cx-journey-success/spec.md`

## Summary

This feature builds the Customer Experience Operating System (CXOS) described in Volume 14 Part 2 Chapter 11: a 5-layer CX architecture and 14-phase Operating Model organizing customer relationships around a standardized 15-stage CX Lifecycle (Visitor→Archived); enterprise Journey Mapping (14 journey types, 9-stage journey lifecycle, 8 visualization modes) with AI-driven Journey Analytics identifying bottlenecks/friction/drop-off; a Touchpoint repository spanning 17 channels with Omnichannel unification; a Journey Intelligence Dashboard and Journey Governance workflow; a Customer Success Platform with a blended, 14-category, 6-tier Customer Health Score, Success Playbooks (11 categories) auto-triggered on configurable conditions, Success Plans (8 reusable templates), Onboarding/Adoption/Retention management, and a Customer Success Dashboard; a broader 17-stage Customer Lifecycle Management (CLM) model with dynamic Customer Segmentation (12 criteria) and research-based Customer Personas; Engagement, Loyalty (10 program types), and Advocacy management with a 7-step Referral workflow; a Voice of Customer platform consolidating up to 20 feedback sources through a 10-step feedback workflow, structured Survey Management, and AI Sentiment Analysis; unified Experience Analytics across 7 dashboards; and a CX Governance Framework (11 roles, 9 governance activities) with an immutable audit trail.

This chapter is not directly named by the constitution, but its Assumptions section explicitly invokes the "AI Is Assistive, Never Autonomous" principle (Article II) governing every AI-generated CX/health/journey/lifecycle recommendation, and the platform-wide consent-propagation principle (Article VI) for all Engagement/Success Plan/Playbook/Journey communications — an Assumptions-paragraph inferred citation rather than an FR-text-verbatim or direct-naming one.

**This is the most extensively self-cross-referenced spec.md of the session.** Its own Assumptions section already identifies and resolves four overlaps before this plan was written: `040` (retention/churn — 044 defers the canonical churn model to it), `041` (VoC — 044 defers the canonical VoC/NLP/survey engine to it), `047` (not-yet-drafted Customer Success Management chapter — 044 originally claimed first-appearance canonicity), and `052` (not-yet-drafted Enterprise CXM chapter — 044 claims canonical CXOS framing). This plan verifies the two resolvable overlaps (040, 041) against their actual `plan.md` files rather than trusting spec.md's self-assessment alone, and surfaces one overlap spec.md's own Assumptions did not catch (`030`).

**Correction (2026-07-23, applied following a formal ownership/overlap analysis performed while planning `047`, confirmed by explicit user instruction)**: `044`'s original claim to "first-appearance canonicity" over Customer Success Platform content (§4 below, as originally written) has been superseded. `047-enterprise-customer-success-management`'s actual content — once planned — proved dramatically deeper than the thin re-specification `044`'s spec.md anticipated: a 15-metric/7-tier Customer Health Score (vs. this chapter's 14-metric/6-tier "CX variant"), 10 differentiated onboarding programs including explicit White-Glove vs. Self-Service tracks (vs. this chapter's single generic onboarding structure), and entire domains this chapter does not cover at all — Activation Milestones, a full 9-stage Renewal Management lifecycle, an 8-step Expansion Management workflow, and a Customer Success AI Copilot. `047` is now the canonical, authoritative source for Customer Success Management depth; this chapter's "Customer Success Platform" section (FR-028–FR-050) should be read as a lighter CXOS-level integration surface that consumes `047`'s Health Score, Playbook-trigger, and Renewal/Expansion pipeline outputs into this chapter's own Journey/Touchpoint/CX Governance framework, rather than this chapter independently computing a competing Health Score or maintaining a rival Playbook catalog. See `047/plan.md` §1–§3 for the full analysis. This correction updates this Summary and §4 below; it does NOT extend to this feature's `tasks.md`, which still frames FR-028–FR-050 in the original, uncorrected terms — reconciling `tasks.md` is a separate, not-yet-requested follow-up.

## Ownership & Dependency Analysis

### §1. Retention/Churn (`040`) — confirmed clean, plus a new Health Score cluster addition surfaced

Spec.md's own Assumptions state `044` defers the canonical churn-prediction model, scoring methodology, and churn dashboards to `040`, covering only how retention operationally executes inside the CXOS (Retention Management as an Operating Model phase, retention strategies feeding Success Playbooks, elevated-churn-risk routing to the CS queue). Checked against `040`'s actual plan.md Summary: `040` is confirmed as "the platform's deepest churn-modeling and retention-economics authority," with its own 7-component, 5-band Customer Health Score (0–100) and Churn Prediction Engine — no contradiction with `044`'s deferral.

However, `044`'s own Key Entities define a separate **"Customer Health Score (CX variant)"** — 14 weighted categories, 6 health tiers — which is structurally distinct from `040`'s 7-component/5-band score, `035`'s 6-sub-score Customer Health Score, `034`'s 7-score AI-Computed Score, and `019`'s 4-score Customer Score. Spec.md's own "(CX variant)" naming shows partial awareness of the collision but does not state which score is authoritative for the "elevated churn risk → CS queue" trigger described in both FR-047 (referencing `040`'s churn signals) and User Story 3/SC-010 (referencing `044`'s own 14-category tier crossing "At Risk"/"Critical"). **This plan does not silently pick one**: it is preserved as a new NEEDS CLARIFICATION item (§6) — whether the CS review queue is fed by one canonical score or by two independently-triggering scores. This was originally logged as a **sixth** independently-specified "Customer/Health Score"-named construct across the session's Wave 2/3 features; **per §4's correction, `047`'s own 15-category/7-tier Customer Health Score is now the recommended canonical Customer-Success-specific score, and this chapter's "CX variant" should be understood as consuming it rather than standing as an independent seventh entry** — but the underlying "one score or two" question for the CS queue trigger remains open and is not resolved by this correction alone.

### §2. Voice of Customer (`041`) — confirmed clean

Spec.md's own Assumptions state `044` retains VoC-to-CX integration content (feedback driving journey stages, health scores, and CX governance) but defers the canonical VoC data model, NLP/sentiment pipeline, and survey-engine implementation to `041`. Checked against `041`'s actual plan.md: `041` independently defines a 12-stage NLP pipeline, 7 sentiment categories, 14-emotion Emotion Intelligence, and a no-code Survey Engine — no contradiction found; `044` is correctly scoped to consume `041`'s Sentiment Score/Feedback outputs for journey-stage and health-score inputs rather than rebuilding sentiment analysis or a second survey engine. `044`'s FR-074's 20-source VoC list and `041`'s FR-009's 11-channel omnichannel consolidation list overlap substantially — both are treated as the same underlying feedback-ingestion surface, owned by `041`.

### §3. Referral & Advocacy (`030`) — new finding, not caught by spec.md's own Assumptions

`044`'s FR-071–FR-072 define a 7-step Referral workflow (Invitation→Registration→Qualification→Conversion→Reward Approval→Reward Distribution→Performance Tracking) with configurable reward models and fraud detection — this is not mentioned anywhere in `044`'s own Assumptions, but it substantially overlaps `030-referral-affiliate-partner-marketing`'s FR-033/034 (customer-referral rewards distinct from partner commissions, two-sided rewards, reward qualification conditions, fraud validation before issuance). This is the same class of finding already correctly resolved once this session (`041`'s Advocacy/Referral scoring reuses `030`'s execution engine rather than rebuilding it).

**Ownership decision**: `030` remains the canonical owner of referral-link generation, tracking, reward issuance, and fraud-detection execution mechanics. `044`'s User Story 6 (Advocate identification and nurturing) consumes `030`'s referral execution engine for the Referral component of Advocacy — `044` does not define a second, parallel referral workflow engine. `044`'s unique contribution here is the AI Advocate-identification signal layer (NPS, usage, community leadership) and the Loyalty Program/Benefits structure, not referral execution itself.

### §4. Customer Success Management (`047`) — CORRECTED: `044`'s original first-appearance claim is reversed; `052` remains an open forward-declared claim

Spec.md's own Assumptions originally claimed `044` was the canonical first appearance (Chapter 11) of the Customer Success Management content that `047` (not planned at the time this plan was first written) was expected to re-specify. `047` has since been planned, and its actual content does not support that claim:

- `047`'s Customer Health Score uses 15 weighted metric categories and 7 Health Categories (adding "Recovery Required"), against this chapter's 14 categories and 6 tiers — plus a materially deeper monitoring/forecasting model (Daily/Weekly/Monthly trend monitoring, AI Health Forecasts, Root Cause Analysis).
- `047`'s Onboarding Lifecycle defines 10 differentiated configurable programs — explicitly including White-Glove vs. Self-Service tracks segmented by customer tier — against this chapter's single generic 9-element onboarding structure.
- `047` defines entire capability domains this chapter does not cover at all: Activation Milestones tracked independently of onboarding, a full 9-stage Renewal Management lifecycle with AI discount-optimization governance, an 8-step Expansion Management workflow across 10 opportunity types, and a Customer Success AI Copilot under full enterprise AI governance.

**Ownership decision (corrected)**: `047` is the canonical, authoritative source for Customer Success Management depth — the Health Score model and tier taxonomy, the Success Playbook catalog, Success Plan workflow, Onboarding Program differentiation, Activation Milestones, Churn Prevention Playbooks, Renewal Management, Expansion Management, and the Customer Success AI Copilot. This chapter's own "Customer Success Platform" section (FR-028–FR-050) is downgraded from a claimed first-appearance-canonical implementation to a lighter CXOS-level integration surface that consumes `047`'s outputs (Health Score, Playbook triggers, Renewal/Expansion pipeline data) into this chapter's Journey/Touchpoint/CX Governance framework. This chapter does not independently compute a competing Health Score or maintain a rival Playbook catalog; where `data-model.md`/`tasks.md` currently describe FR-028–FR-050 as original builds, they should be read as configuring/consuming `047`'s engine rather than an independent implementation — full reconciliation of `tasks.md` to this framing is a separate, not-yet-requested follow-up (see Summary correction note above).

`052` (Enterprise CXM, `document 2/Document 2.md` Chapter 19, not yet planned) remains an unverified forward-declared claim: spec.md still asserts `044` is the canonical CXOS/Journey/Lifecycle/Loyalty/Advocacy/VoC-for-CX framing that `052` is expected to re-specify. This cannot be checked against an actual plan.md yet and is preserved as the working assumption, flagged for confirmation when `052` is reached — the same caution that turned out to be warranted for `047` applies here too.

### §5. RBAC, Consent, and Audit infrastructure — reuse decisions made explicit

Spec.md's own Assumptions already state that platform-wide RBAC, consent management, and authentication/audit infrastructure are reused rather than rebuilt. This plan makes the specific reuse target explicit, consistent with the session's established reuse chain: CX Governance roles (FR-092) configure `016`'s layered RBAC model; Engagement/Success Plan/Playbook/Journey communication consent reuses the platform-wide, per-channel consent mechanism established via `019`/`002`/`003`; CX Governance and Feedback Workflow audit trails reuse `003`'s authentication/identity infrastructure and the platform-wide immutable audit log rather than a CXOS-specific implementation.

### §6. Preserved NEEDS CLARIFICATION items (from spec.md's own Edge Cases, Success Criteria, and this plan's §1 finding — not resolved here)

- Whether the Customer Success review queue is fed by one canonical health/churn score or by two independently-triggering scores (`040`'s churn model vs. `047`'s now-canonical 15-category Health Score, which this chapter's "CX variant" is expected to consume per §4's correction) — new item surfaced in §1, not stated by spec.md itself, and not fully closed by the §4 correction.
- Whether any single critical sub-score (e.g., Payment Status, Subscription Status) forces a floor/cap on the overall Health Score tier regardless of weighted average, or is purely additive (Edge Cases).
- Deduplication/precedence rule when two Success Playbooks trigger simultaneously for the same account and issue (Edge Cases).
- Reconciliation behavior when a VoC signal directly contradicts a structured survey response for the same customer in the same period (Edge Cases).
- Whether a CX Governance rejection can block/roll back an in-flight change a downstream team already began implementing from an unapproved AI recommendation (Edge Cases).
- Precedence rule when a customer is simultaneously eligible for two conflicting journeys (e.g., Renewal vs. Win-back) (Edge Cases).
- Whether in-flight automation continues to completion or halts/re-evaluates when Dynamic Segment membership changes mid-flight (Edge Cases).
- Multi-category classification/routing support when a single feedback item legitimately spans multiple Voice Categories (Edge Cases).
- Reconciliation surfacing when Journey Optimization AI and the Customer Success Playbook recommend conflicting next-best-actions for the same customer (Edge Cases).
- Whether unresolved, high-priority, "In Progress" feedback should block or flag an otherwise-qualifying advance to "Advocate"/"Renewal" lifecycle stage (Edge Cases).
- Maximum Health Score recalculation latency after underlying data changes (SC-003).
- Target time-to-queue SLA and target churn/retention-rate improvement percentage for the "elevated risk → CS queue" trigger (SC-010).

None of these are silently resolved; each remains an open gate for a future clarification pass.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–043.

**Primary Dependencies**: NestJS, Next.js; `040`'s Churn Prediction Engine/Customer Health Score as a consumed input (per §1); `041`'s NLP/sentiment pipeline and Survey Engine as consumed inputs (per §2); `047`'s canonical Customer Success Management engine (Health Score, Success Playbooks, Success Plans, Onboarding Programs, Renewal/Expansion pipeline) as a consumed input, superseding this chapter's own FR-028–FR-050 build (per §4, corrected); `030`'s referral execution engine as a consumed input for Advocacy (per §3); `016`'s layered RBAC for CX Governance roles (per §5); `003`'s auth/identity and the platform-wide immutable audit log (per §5); `006`/`009`'s ledger infrastructure for Loyalty Benefits fulfillment (per spec.md's own Assumptions).

**Storage**: PostgreSQL (21 entities per Key Entities: CX Lifecycle Stage, CX Operating Model Phase, Customer Journey, Journey Map, Journey Stage/Element, Touchpoint, Customer Health Score (CX variant), Success Plan, Success Playbook, Customer Success Lifecycle Stage, Customer Lifecycle Stage (17-stage CLM), Customer Segment, Customer Persona, Loyalty Program/Benefit, Advocacy Signal/Advocate, Referral, VoC Data Source, Feedback Record, Survey, Sentiment Record, CX Governance Record).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: cx-lifecycle-stage-always-current for SC-001, playbook-actions-require-human-review-gate for SC-004, and feedback-workflow-full-audit-trail for SC-005), Playwright (web e2e — CX Lifecycle Dashboard, Journey Canvas with all 8 visualization modes, Customer Success Dashboard, VoC/Sentiment Dashboard, Governance Dashboard).

**Target Platform**: Web (CX/CS Admin Portal, rendered inside `017`'s workspace shell).

**Performance Goals**: Per FR-096 and SC-009, the platform must support millions of customer records/interactions/feedback events with dashboards remaining responsive and background analytics not degrading transactional performance [NEEDS CLARIFICATION: no numeric thresholds stated in source, consistent with SC-003's and SC-010's own preserved latency/SLA gaps].

**Constraints**: Zero customers with an account record may lack a current, correct CX Lifecycle stage (FR-009, SC-001); zero AI-recommended journey/playbook/health/lifecycle actions may reach a customer without a configurable human review gate (FR-005, FR-022, FR-037, SC-004; Constitution Article II); zero feedback-workflow transitions may occur without an immutable audit log entry (FR-079, SC-005); every High/Critical health-tier crossing must automatically surface the account in the Customer Success review queue without manual cross-referencing (SC-010); zero duplicate churn-prediction or referral-execution engines may be built where `040`/`030` already own that ground (§1, §3).

**Scale/Scope**: 21 entities, 96 FRs, 8 user stories, 5-layer CX architecture, 14-phase Operating Model, 15-stage CX Lifecycle, 9-stage Journey lifecycle, 12-stage CS Lifecycle, 17-stage CLM, 10-step Feedback workflow, 7-step Referral workflow, 12 preserved NEEDS CLARIFICATION items (including one newly surfaced by this plan), no worsening of any of the 8 previously-accumulated Wave 2/3 architecture gaps, one new cross-feature reuse relationship established with `030` (§3), and a new sixth entry in the ongoing Customer/Health Score naming cluster (§1).

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | CX Lifecycle stage, Health Score tier, and playbook trigger evaluation are all server-computed, never client-asserted. |
| II. AI Is Assistive, Never Autonomous | PASS — Assumptions-paragraph inferred citation | FR-005, FR-022, FR-027, FR-033, FR-037, FR-045, FR-049, FR-059, FR-061, FR-065, FR-069, FR-085, FR-089, FR-095 all require configurable human review before an AI-generated recommendation reaches a customer-facing action; SC-004 states this as a zero-tolerance success criterion. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | FR-007 bars unauthorized account modification and overriding customer privacy preferences. |
| IV. Historical Immutability | PASS | Journey Maps maintain complete version history on revision (FR-013); Feedback Records generate an immutable audit log for every one of the 10 workflow transitions (FR-079). |
| V. Ledger-Based Internal Economies | PASS (reused, not redefined) | Loyalty Benefits fulfillment (Digital Certificates, AI Credits, etc.) is assumed to integrate with `006`/`009`'s existing append-only ledger rather than introduce a new mutable balance field, per spec.md's own Assumptions. |
| VI. Consent Is First-Class, Per-Channel, and Versioned | PASS (reused, not redefined) | Engagement/Success Plan/Playbook/Journey communications reuse the platform-wide, per-channel, immediately-propagating consent mechanism (per §5); withdrawal-mid-lifecycle propagation is preserved as an Edge Case, not silently assumed solved. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS (reused, not redefined) | CX Governance roles (FR-092) configure `016`'s layered RBAC model rather than a new engine (per §5). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Health Score, Playbook triggers, and Advocacy identification are all evidence/data-based (FR-031, FR-069) rather than vanity-metric-driven. |
| IX. Action Before Consumption | PASS | Every journey, success plan, and feedback item progresses through defined stages toward a measurable outcome (FR-013, FR-039, FR-079), not passive tracking. |
| Localization & Language Requirements | PASS (not primary focus, inherited) | FR-082's survey designer requires multi-language support; broader Tamil/Tanglish handling is inherited from `020`/`021`/`041`'s established patterns rather than redefined here. |
| Security & Compliance Baseline | PASS | FR-095 (immutable audit logs, RBAC-governed customer-information access, encryption at rest/in transit) aligns with the baseline; assumed to sit within, not replace, the constitution's compliance baseline. |

## Project Structure

### Documentation (this feature)

```
specs/044-enterprise-cx-journey-success/
├── spec.md
├── plan.md
├── research.md         # 12 NEEDS CLARIFICATION items from §6
├── data-model.md        # 21 entities
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── cx-lifecycle-stage-always-current.contract.md
    ├── playbook-actions-require-human-review-gate.contract.md
    └── feedback-workflow-full-audit-trail.contract.md
```

### Source Code (repository root)

```
backend/src/modules/cxos/
├── lifecycle-operating-model/          # FR-001-010 — 5-layer architecture, 14-phase model, 15-stage lifecycle
├── journey-mapping-analytics/          # FR-011-022 — journey types, maps, 8 visualizations, AI analytics
├── touchpoint-omnichannel/             # FR-019-020, FR-023-024 — touchpoint repository, unified profile
├── journey-governance-intelligence/    # FR-025-027 — governance workflow, Journey Intelligence Dashboard
├── customer-success-health-playbooks/  # FR-028-037 — CS lifecycle, Health Score (CX variant), playbooks
├── success-plans-onboarding-adoption/  # FR-038-045 — plans, templates, onboarding, adoption intelligence
├── retention-cs-dashboard/             # FR-046-050 — retention strategies (defers churn model to 040), CS Dashboard
├── customer-lifecycle-clm/             # FR-051-053 — 17-stage CLM
├── segmentation-persona/               # FR-054-062 — segmentation, dynamic segments, personas, CLM dashboard
├── engagement-loyalty/                 # FR-063-067 — engagement, loyalty programs/benefits (reuses 006/009 ledger)
├── advocacy-referral/                  # FR-068-072 — advocate identification (referral execution reuses 030)
├── voc-feedback-workflow/              # FR-073-080 — feedback sources (reuses 041), 10-step workflow
├── survey-management/                  # FR-081-083 — survey design/distribution (reuses 041's survey engine)
├── sentiment-experience-analytics/     # FR-084-089 — sentiment dashboard (reuses 041's NLP), experience analytics
└── cx-governance/                      # FR-090-096 — governance roles/workflows, Governance Dashboard
└── common/
    # reused from 040 (Churn Prediction Engine/Health Score input), 041 (NLP/sentiment/survey engine),
    # 030 (referral execution engine), 016 (RBAC), 003 (auth/audit), 006/009 (ledger)

web/app/(admin)/cxos/
├── lifecycle-dashboard/
├── journey-canvas/
├── customer-success/
├── clm-segmentation-persona/
├── engagement-loyalty-advocacy/
├── voc-sentiment/
└── governance/
```

**Structure Decision**: `lifecycle-operating-model` and `journey-mapping-analytics` are built and contract-tested first — the 15-stage CX Lifecycle is the foundational data model every other CXOS capability is built on top of (per spec.md's own User Story 1 rationale), and Journey Mapping is the second most foundational, independently valuable capability. `customer-success-health-playbooks` follows immediately, since Health Scoring and Playbooks are the operational core translating raw signal into proactive human action.

## Complexity Tracking

*No constitutional violations identified. This section intentionally left empty.*
