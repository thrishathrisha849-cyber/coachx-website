# Implementation Plan: Enterprise Competitive Intelligence & Market Research

**Branch**: `042-competitive-intelligence-market-research` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/042-competitive-intelligence-market-research/spec.md`

## Summary

This feature builds the enterprise Competitive Intelligence, Market Research, Industry Benchmarking, Customer Research & Strategic Insights Platform described in Volume 14 Part 2 Chapter 9: a six-layer intelligence architecture (Intelligence Sources → Data Collection & Validation → Intelligence Processing → Strategic Analysis → Business Action → Dashboards & Reporting) and a 13-stage intelligence lifecycle converting raw signals into tracked business action; a Competitor Profile Repository with Direct/Indirect/Replacement/Aspirational classification and a configurable 10-factor Competitor Priority Score; Competitor Product Intelligence tracking each offering through an 8-stage lifecycle (Rumored→Replaced) with a full Product Timeline; competitor Pricing Intelligence (pricing records, Pricing History, Pricing Comparison Dashboard, pricing trend insights) and Competitor Offers/promotions tracking; a Feature Comparison Matrix (TBT vs. up to 4 named competitors) driving an automated Gap Analysis; Change Monitoring across 15 change categories feeding a 9-step Competitive Alerts workflow; enterprise Market Research management across 12 research types with a standardized 12-stage lifecycle, Primary Research (interviews, focus groups, surveys) and Secondary Research (14 source types), a Research Repository, and Research Governance (consent, approval, version control, retention, audit, 8 research roles); AI-assisted Customer Persona management and 10-model Market Segmentation including AI-Based Dynamic Segmentation; Industry Benchmarking with a 5-tier Benchmark Scorecard; Trend/Opportunity/Threat Intelligence; a Strategic Insights Dashboard; the Executive Decision Support System (EDSS); an AI Market Intelligence Platform with Predictive Analytics and Strategic Scenario Planning; and Executive Reporting/Intelligence Briefings.

This chapter is **directly named in the constitution's own Article II citation**: `<!-- Source: ... Vol 14 Part 2 Ch 9 ("AI shall never execute strategic business actions automatically") -->`. This is the **second** feature this session directly named by the constitution for Article II — the first was `025-ai-marketing-assistant` (Vol 14 Part 1 Ch 12, human review before AI campaign publish). Here the citation maps to User Story 8 and FR-069–FR-070: every EDSS recommendation carries Supporting Evidence, AI Explanation, Confidence Score, and Human Review Status, sits in a pending state, and the EDSS "MUST NOT execute strategic business actions automatically." The same non-autonomy discipline is then restated per-module for pricing suggestions (FR-028), opportunity recommendations (FR-063), threat mitigation, scenario recommendations (FR-076), and AI Market Intelligence recommendations (FR-071) — this chapter applies Article II more times, across more distinct AI-output types, than any prior feature this session. The chapter's Ethical Boundaries section (FR-001–FR-008) also directly instantiates Constitution Article VI (no customer research without consent) and, via FR-012/FR-080, Article VII (layered RBAC restricting sensitive research/strategy data to authorized users).

## Ownership & Dependency Analysis

Per this session's established practice of checking every new Wave 3 feature's Key Entities against previously-planned features' actual `plan.md`/`spec.md` files (not just this spec's own Assumptions) before writing Project Structure, four relationships were examined.

### §1. Persona & Market Segmentation vs. `019` (CDP) and `035` (Enterprise Segmentation) — partial duplication found, resolved as extension

Spec.md's own Assumptions state only that AI-Based Dynamic Segmentation (§30) and the AI Market Intelligence Platform (§37) "consume customer/behavioral data already modeled by" `019-audience-segmentation-cdp` and `035-enterprise-segmentation-audience-intelligence` "rather than re-implementing a separate customer data store" — implying only data reuse, not entity reuse. Checking `035`'s actual Key Entities against `042`'s FR-055 and Key Entities shows a much closer overlap than that assumption discloses:

- `035`'s **Segmentation Category** taxonomy (Demographic, Geographic, Behavioral, Psychographic, Technographic, Transactional, Value-Based, Loyalty, Lifecycle, AI Predictive) and `042`'s FR-055 **segmentation models** (Demographic, Geographic, Behavioral, Psychographic, Firmographic, Revenue, Membership, Lifecycle, Engagement, AI-Based Dynamic) are the same list in substance — 6 of 10 categories are verbatim matches (Demographic, Geographic, Behavioral, Psychographic, Lifecycle, plus an AI-driven variant).
- `035`'s **Segment Analytics Snapshot** entity (Audience Size, Growth, Revenue, Engagement, Conversion, Retention, Churn, Campaign Performance) and `042`'s **Market Segment** entity (Population Size, Growth Rate, Revenue Contribution, Engagement Score, Customer Lifetime Value, Retention Rate, Satisfaction Score, Churn Risk, Strategic Priority) are near-1:1 field matches (Population Size≈Audience Size, Revenue Contribution≈Revenue, Engagement Score≈Engagement, Retention Rate≈Retention, Churn Risk≈Churn).
- `042`'s FR-056 AI-Based Dynamic Segmentation auto-update behavior (segments re-evaluate automatically on significant behavioral change) is the same mechanism as `035`'s AI Predictive Segmentation / dynamic audience refresh (`035` FR-043, "audience refresh under 5 seconds"), not a second independent engine.

**Ownership decision**: `035` — the dedicated Wave 3 segmentation chapter (Ch2, chronologically and architecturally prior to Ch9) — is the canonical owner of the Segment / Segmentation Category / Segment Analytics Snapshot engine and its dynamic-update mechanism. `042`'s "Market Segment" is **not** an independent tenth segmentation model; it is `042`'s competitive-intelligence-specific *view* over `035`'s existing Segment and Segment Analytics Snapshot records, adding only the Strategic Priority / market-research rollup dimension this chapter needs on top. No new segment rule engine, dynamic-refresh engine, or segmentation-category taxonomy is built in `042`.

`042`'s **Customer Persona** entity (FR-053–054) was checked against `008`, `019`, `035`, and `036` (Personalization/NBA) — none of those features' plan.md/spec.md defines a "Persona" entity, so this remains a genuinely new construct owned by `042`, not a collision.

### §2. AI infrastructure vs. `008` — clean

Confirmed per spec.md's own Assumptions and consistent with the reuse chain established since `025`: Customer Persona generation, the AI Market Intelligence Platform, pricing/opportunity/threat/scenario/EDSS recommendation generation, and secondary-research AI assistance all consume `008`'s shared AI gateway, model layer, and prompt governance rather than this feature standing up parallel AI infrastructure.

### §3. CRM and Membership/Revenue data vs. `013` and `009` — clean

Confirmed per spec.md's own Assumptions: Sales Data, CRM Data, and Membership/Course Performance data referenced as Intelligence Sources (§8 Layer 1, §37) are sourced from `013-crm-sales-support` and `009-membership-payments-revenue` rather than duplicated. No entity in `042`'s Key Entities redefines a CRM or membership/revenue record.

### §4. Customer Feedback / Brand Sentiment vs. `041` (Voice of Customer) — new finding, made explicit here

`041-voice-of-customer-feedback-intelligence`'s own spec.md (Assumptions) forward-declares this exact boundary: "Feature 042 ... is the next chapter in sequence and may consume this chapter's Reputation Analytics (competitor comparison) and Predictive Feedback Analytics outputs; this spec does not duplicate competitive/market-research capabilities." `042`'s own spec.md does not reciprocally state this, but its FR text needs it: FR-071 (AI Market Intelligence Platform) lists "Customer Feedback" among its processing inputs, and FR-064 (Threat Detection) names "Negative Brand Sentiment" as a monitored threat category — both correspond directly to outputs `041` already computes (Sentiment Score, Reputation Score, Reputation Risk Alert, Predictive Forecast).

**Ownership decision**: `041` remains the canonical owner of customer-feedback NLP, sentiment classification, and reputation scoring. `042` consumes `041`'s Sentiment Score / Reputation Score / Reputation Risk Alert / Predictive Feedback Analytics outputs as Intelligence Source inputs into its own Trend/Threat/AI Market Intelligence modules; `042` does not re-implement sentiment analysis, emotion detection, or reputation monitoring. This closes the one-directional forward reference `041` left open and is recorded on both sides now.

### §5. Preserved NEEDS CLARIFICATION items (from spec.md's own FR text and Edge Cases — not resolved here)

- Competitor Priority Score weighting formula and the numeric thresholds separating its five priority tiers (FR-021).
- Technical enforcement/detection mechanism for blocking unauthorized-collection data entry (Edge Cases; FR-001–004 state the prohibition, not an enforcement mechanism).
- Reconciling participant consent withdrawal with the "no approved research document shall be permanently deleted" rule (Edge Cases; tension between Constitution Article VI and FR-052).
- Automatic scenario-invalidation/re-run trigger tied to the Competitive Alerts Platform (Edge Cases).
- Duplicate/conflict-resolution rule for competitor profiles and same-day conflicting pricing records from different sources (Edge Cases).
- State-carry-forward vs. reset behavior when an Indirect Competitor is reclassified as Direct mid-cycle (Edge Cases).
- Timeout/escalation rule for an unacted-upon AI recommendation (pricing, opportunity, EDSS) (Edge Cases).
- Re-review trigger for dependent scorecards/reports when a benchmark source later proves unreliable (Edge Cases).
- Handling of informally-collected data when a Research Project is rejected at the Approval stage (Edge Cases).
- Additional confidentiality/redaction control for AI-flagged sensitive disclosures in interview/focus-group recordings, beyond the standard Consent Status/access-permission model (Edge Cases).
- Staleness threshold for a competitor Pricing record's Last Verified Date (Edge Cases).

None of these are silently resolved; each remains an open gate for a future clarification pass.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–041.

**Primary Dependencies**: NestJS, Next.js; `008`'s AI gateway for persona generation, dynamic segmentation, pricing/opportunity/threat/scenario/EDSS recommendation generation, and AI Market Intelligence processing; `035`'s Segment / Segmentation Category / Segment Analytics Snapshot engine (consumed and extended, not rebuilt, per §1); `013` (CRM/Sales) and `009` (Membership/Payments/Revenue) as read-only Intelligence Source data; `041`'s Sentiment Score / Reputation Score / Reputation Risk Alert / Predictive Feedback Analytics outputs as Intelligence Source inputs (per §4); `016`'s RBAC model for the layered, role-gated access control this chapter requires (§12; Constitution Article VII).

**Storage**: PostgreSQL (19 entities per Key Entities: Competitor, Competitor Product, Pricing Record/Pricing History Entry, Competitor Offer, Feature Comparison Matrix Entry, Competitor Change/Competitive Alert, Research Project/Study, Research Participant, Customer Interview/Focus Group/Survey, Research Repository Document, Customer Persona, Market Segment, Benchmark Scorecard Entry, Trend, Opportunity, Threat, Executive Decision/EDSS Recommendation, Scenario Plan, Executive Report/Intelligence Briefing).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: edss-never-auto-executes for SC-005/FR-070, research-consent-and-approval-gate for SC-003, and approved-research-document-immutability for SC-004), Playwright (web e2e — Competitor Profile Repository, Feature Comparison Matrix, EDSS Decision Dashboard, Strategic Insights Dashboard).

**Target Platform**: Web (Admin/Executive Portal, rendered inside `017`'s workspace shell).

**Performance Goals**: Per FR-082/SC-010, intelligence dashboards and reports must render within the platform's approved performance thresholds under enterprise-scale data volumes, with zero measurable degradation to operational (customer-facing) systems from background intelligence processing [NEEDS CLARIFICATION: no numeric thresholds stated in source].

**Constraints**: Ethical-boundary FRs (FR-001–FR-008) are hard rejections, not advisory flags — any implementation path requiring unauthorized competitor-system access, illegal private-data collection, security-control bypass, confidential-data purchase, unconsented customer-research data, or automatic public publication of a strategic report must be rejected outright (per spec.md's own Assumptions and Constitution Articles II/III/VI); zero EDSS/pricing/opportunity/threat/scenario/AI-Market-Intelligence recommendations may modify a live business system without a recorded human approval action (FR-006, FR-028, FR-063, FR-070, FR-076, SC-005; Constitution Article II); zero research participant data is used in any research output without a recorded Consent Status, and zero research projects reach Data Collection without passing the Approval lifecycle stage (FR-044, SC-003; Constitution Article VI); zero approved research documents are ever permanently deleted (FR-052, SC-004).

**Scale/Scope**: 19 entities, 82 FRs, 8 user stories, six-layer intelligence architecture, 13-stage intelligence lifecycle, 8-stage competitor-product lifecycle, 9-step competitive-alert workflow, 12-stage research-project lifecycle, 11 preserved NEEDS CLARIFICATION items, no worsening of any of the 8 previously-accumulated Wave 2/3 architecture gaps, and one new cross-feature reuse relationship established with `041` (§4) plus one new partial-duplication finding resolved with `035` (§1).

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | No client-trusted state; Competitor Priority Score, Benchmark classifications, and EDSS approval status are all server-computed/server-recorded. |
| II. AI Is Assistive, Never Autonomous | PASS — **directly cited by name** for this chapter | FR-006, FR-028, FR-046, FR-048, FR-063, FR-069–FR-071, FR-076, FR-081 all require human review/approval before an AI output takes effect; deterministic fallback for AI-Based Dynamic Segmentation unavailability is explicit (US5 acceptance scenario 4). |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | FR-005 (no automatic public publication of strategic reports) and FR-007 (platform is not a replacement for legal/financial/professional advisors) align. |
| IV. Historical Immutability | PASS | Pricing History records preserve Previous/New Price with Effective/Detected Date rather than overwriting (FR-029); attribution/finalization states from Article IV's named source (037) are untouched by this chapter. |
| V. Ledger-Based Internal Economies | N/A | This chapter has no internal balance/points/wallet construct. |
| VI. Consent Is First-Class, Per-Channel, and Versioned | PASS | FR-008, FR-044 require recorded Consent Status before any participant data is used in a research output; consent-withdrawal-vs-immutability tension explicitly preserved as NEEDS CLARIFICATION (§5) rather than silently resolved. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS | FR-012, FR-016 (High Priority competitor record modification restricted), FR-051 (8 configurable Research Roles), FR-080 reuse `016`'s layered RBAC model. |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Benchmark Scorecard and Gap Analysis are evidence-based (FR-009) rather than vanity-metric-driven; no purchasable status in this chapter. |
| IX. Action Before Consumption | PASS | Every intelligence record must progress through the 13-stage lifecycle to Recommendation/Action/Outcome Measured (FR-014), not remain passively collected data. |
| Localization & Language Requirements | PASS (not a focus of this chapter) | No Tamil/Tanglish-specific FR in this chapter; research/survey tooling inherits localization requirements from `020`/`021`/`031`'s established patterns where applicable, not redefined here. |
| Security & Compliance Baseline | PASS | FR-080 (RBAC, encryption, immutable audit logs, configurable retention) and FR-052 (immutable version history) align with the baseline; Privacy/Regulatory Compliance in Research Governance (§28) assumed to sit alongside, not replace, the constitution's compliance baseline (per spec.md's own Assumptions). |

## Project Structure

### Documentation (this feature)

```
specs/042-competitive-intelligence-market-research/
├── spec.md
├── plan.md
├── research.md         # 11 NEEDS CLARIFICATION items from §5
├── data-model.md        # 19 entities
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── edss-never-auto-executes.contract.md
    ├── research-consent-and-approval-gate.contract.md
    └── approved-research-document-immutability.contract.md
```

### Source Code (repository root)

```
backend/src/modules/
├── competitive-intelligence/
│   ├── ethical-boundaries-guardrails/     # FR-001-008 — hard-reject enforcement, not advisory
│   ├── intelligence-architecture-lifecycle/ # FR-009-014 — 6-layer architecture, 13-stage lifecycle
│   ├── competitor-profile-classification/  # FR-015-022 — Competitor Profile Repository, Priority Score
│   ├── competitor-product-lifecycle/       # FR-023-025 — Product Timeline, 8-stage lifecycle
│   ├── competitor-pricing-intelligence/    # FR-026-029 — Pricing Record/History, Pricing Comparison Dashboard
│   ├── competitor-offers/                  # FR-030-031 — promotional offer tracking
│   ├── feature-comparison-gap-analysis/    # FR-032-036 — Feature Comparison Matrix, Gap Analysis
│   ├── change-monitoring-competitive-alerts/ # FR-037-041 — Change Timeline, 9-step Alert workflow
│   ├── research-project-governance/        # FR-042-044, FR-051-052 — lifecycle, consent, retention, audit
│   ├── research-secondary-sources/         # FR-045-046 — Secondary Research + AI assistance
│   ├── research-methods-interview-focus-survey/ # FR-047-049 — Interview/Focus Group/Survey Builder
│   ├── research-repository/                # FR-050 — search, version control, reuse
│   ├── persona-market-segmentation/        # FR-053-057 — Persona (new); Market Segment extends 035
│   ├── industry-benchmarking/              # FR-058-060 — Benchmark Dashboard, Scorecard
│   ├── trend-opportunity-threat-intelligence/ # FR-061-065
│   ├── strategic-insights-dashboard/       # FR-066
│   ├── executive-decision-support-edss/    # FR-067-070 — non-autonomy guarantee (Article II)
│   ├── ai-market-intelligence-predictive-scenario/ # FR-071-076
│   └── executive-reporting-briefings/      # FR-077-079
└── common/
    # reused from 008 (AI gateway), 009 (membership/revenue data), 013 (CRM data),
    # 016 (RBAC), 035 (Segment/Segmentation Category/Segment Analytics — extended not rebuilt),
    # 041 (Sentiment Score/Reputation Score/Predictive Feedback Analytics — consumed not recomputed)

web/app/(admin)/competitive-intelligence/
├── competitors/
├── feature-comparison/
├── research/
├── personas-segments/
├── benchmarking/
├── strategic-insights/
├── edss/
└── executive-reports/
```

**Structure Decision**: `ethical-boundaries-guardrails` and `executive-decision-support-edss` are built and contract-tested first — the former because FR-001–FR-008 are hard rejections gating every collection path, the latter because it is this chapter's direct constitutional citation (Article II) and every other AI-output module in this chapter (pricing, opportunity, threat, scenario, AI Market Intelligence) follows the same non-autonomy contract EDSS establishes.

## Complexity Tracking

*No constitutional violations identified. This section intentionally left empty.*
