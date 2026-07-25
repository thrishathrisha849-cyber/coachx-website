# Implementation Plan: Enterprise Retention Intelligence & Churn Prediction

**Branch**: `040-retention-intelligence-churn-prediction` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/040-retention-intelligence-churn-prediction/spec.md`

## Summary

This feature builds the platform's deepest churn-modeling and retention-economics authority: 7 distinct churn-type classifications with independent detection; a Voluntary/Involuntary churn-category split routing payment failures to recovery (not promotions) and a full churn-reason taxonomy; a 0–100 Customer Health Score with 7 component scores, 5 named status bands, and velocity-sensitive rapid-decline alerting; an Early Warning Detection Engine across dozens of behavioral/financial/experience signals; a Churn Prediction Engine (7 configurable windows, 6 risk levels, explainable plain-language drivers, an approved-input allowlist); retention segmentation/lifecycle/journeys/renewal intelligence; a Payment Recovery Service with classified failure routing and smart retry timing; cancellation/pause/downgrade/retention-offer flows with anti-dark-pattern guarantees; a Retention Decision Engine treating "No Contact" as a first-class outcome, gated by Discount Governance; Retention Holdout Groups measuring true incremental retention; customer reactivation; a 6-dimension Loyalty system with points, tiers, rewards, and fraud detection; a 7-type Customer Lifetime Value framework with a High-Potential-Customer category; Customer Success prioritization/workbench; communication-fatigue/contact-policy governance; an AI Retention Assistant (advisory-only, fully overridable); retention economics/forecasting/reporting; cohort/survival/funnel analytics; and governance/RBAC/privacy/model-quality/security/performance requirements.

**This chapter is directly named in the constitution's own citation list for two separate articles — the first feature this session cited twice.** Article III: *"Vol 14 Part 2 Ch 5 & Ch 7 (experimentation and retention ethics sections)"* — co-naming `038` (Ch 5), already noted when that feature was planned. Article V: *"Vol 14 Part 2 Ch 7 (loyalty points ledger, Reward Liability as a finance line item)."* FR-110 additionally cites "Constitution Article III" verbatim, FR-111 cites "Constitution Article IV" verbatim, and FR-089 cites "Constitution Article II" verbatim — making this the most constitutionally cross-referenced feature planned this session, combining direct constitution naming (III, V) with FR-text self-citation (II, III, IV).

## Ownership & Dependency Analysis (Feature 040 vs. Feature 029, and the Customer Health Score entity cluster)

### 1. Confirmed clean, explicitly resolved by spec.md itself: `040` is authoritative over `029` for churn/retention depth

Spec.md's own Assumptions state this directly and unambiguously: *"This chapter is the authoritative churn-modeling and retention-economics source; feature 029 defers to it."* This matches and confirms what `029`'s own plan.md already stated when planned earlier this session (`029` explicitly deferred deep churn-modeling depth to `040`) — **no contradiction, a rare case of both sides of a cross-chapter relationship agreeing from the start.** The seven churn types, churn-category split, explainable risk-driver model, Discount Governance, Retention Holdout Groups, and the Historical/Current/Predicted/High-Potential CLV framework are canonical here. `029` retains ownership of the customer-lifecycle-stage state machine and its own loyalty-points/tier mechanics at the lifecycle-consumption level, and is expected to consume this feature's Churn Prediction Engine/Retention Decision Engine outputs rather than maintaining a competing, shallower model.

### 2. Confirmed clean: the loyalty-points ledger is reused, not redefined

Spec.md's own Assumptions state "TBT Points" is the same points system referenced in the gamification chapter (`006`) and `029`'s loyalty mechanics — this chapter does not redefine point-issuance mechanics for non-retention contexts, only layers retention/loyalty-specific rules (point rules, expiration, reward catalog, fraud detection) on top of that shared ledger, explicitly **per Constitution Article V** (matching the constitution's own direct citation of this chapter for exactly this reason). **Ownership decision**: this feature's `Loyalty Transaction` entity extends the shared append-only ledger `006`/`029` already established rather than creating a second, parallel points ledger.

### 3. New finding, not addressed by spec.md: a fourth/fifth "Customer Health Score"-named entity

Not addressed by spec.md's own Assumptions. This feature's own `Customer Health Score` (0–100, 7 component scores: Engagement, Learning, Community, Product Adoption, Satisfaction, Financial Health, Loyalty) joins an already-escalating cluster: `029`'s own `Customer Health Score` (8-input Engagement Score feeding its own retention journeys), `035`'s `Customer Health Score` (6 sub-scores: Engagement, Loyalty, Satisfaction, Growth, Risk, Revenue), and `034`'s 7-score `AI-Computed Score` (which includes its own "Engagement Score"). This is now the **fourth independently-specified "Health Score"/"Engagement Score"-labeled scoring construct** on the platform. **Critically, spec.md's own authority statement (§1 above) covers "churn-probability, risk-level, or retention-recommendation data" specifically — it does not explicitly extend that authority to the Customer Health Score construct itself.** This plan does not silently assume the Health Score is covered by the same deference statement. **Ownership decision**: this feature implements its own 7-component Customer Health Score as specified, since it is load-bearing for this chapter's own P1 User Story 3 and cannot be omitted — but this is flagged as a fourth/fifth instance of the scoring-collision pattern first identified in `036`'s ownership analysis (`019`/`034`/`035`), now also touching `029` and `040`, and escalated as its own NEEDS CLARIFICATION for a future consolidation pass rather than resolved here.

### 4. Confirmed clean: no new "Customer Journey"-named entity

Checked against this feature's own Key Entities list — no competing `Journey`/`Customer Journey` entity is introduced here (the closest concept, "Customer Success Queue Item / Workbench Profile," references a journey timeline as a display field, not a new reconstruction engine). The five-way `022`/`027`/`032`/`037`/`039` collision is not touched or worsened by this feature.

### 5. Preserved NEEDS CLARIFICATION items (from spec.md's own Edge Cases, not resolved here)

- No stated precedence rule when multiple churn types/categories apply simultaneously to one customer.
- No stated policy for balancing false-positive vs. false-negative cost trade-offs during threshold calibration.
- Relationship between rapid-decline alerts (fire regardless of band) and journey-trigger enrollment (described generically) is not fully specified.
- No stated precedence between communication-fatigue suppression and critical-risk-SLA outreach.
- No stated resolution when a customer simultaneously qualifies for a negative current-value band and the High-Potential future-value category.
- Plus the newly-flagged fourth/fifth "Customer Health Score" naming instance (§3 above).

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–039.

**Primary Dependencies**: NestJS, Next.js; extends `006`'s/`029`'s shared loyalty-points ledger rather than redefining it; Churn Prediction Engine, AI Retention Assistant, and root-cause analysis consuming `008`'s AI gateway; `029` consumes this feature's Churn Prediction Engine/Retention Decision Engine outputs per the established authority relationship; upstream profile/event/segmentation data consumed from `019`/`034`/`035`, not originated here.

**Storage**: PostgreSQL (~19 entities per spec.md's Key Entities — Churn Type, Churn Category, Churn Reason, Customer Health Score, Churn Prediction, Risk Driver, Retention Segment, Retention Case, Retention Decision/Intervention, Discount Governance Rule, Retention Holdout Group, Membership Renewal, Loyalty Account, Loyalty Tier, Loyalty Transaction, Reward, CLV Category, Lifetime Value Record, Retention Model domains), with Loyalty Transaction append-only per Constitution Article V and model version/deployment date recorded on every prediction per Constitution Article IV (FR-111).

**Testing**: Jest (backend — involuntary-churn-routes-to-payment-recovery-not-promotion, discount-governance-blocks-unauthorized-issuance, and incremental-retention-computed-as-treatment-minus-holdout contract tests are the highest-stakes tests here, matching this spec's own SC-003, SC-005, and SC-006), Playwright (web e2e — Customer Success Workbench, Discount Governance approval queue, loyalty tier/reward redemption).

**Target Platform**: Web (Customer Success/Retention Portal, rendered inside `017`'s workspace shell); this is the deepest churn/retention-economics layer, consumed by `029`'s lifecycle automation.

**Performance Goals**: Health retrieval under 500ms; real-time risk update under 5s after a critical event; retention recommendation under 1s; dashboard under 3s; loyalty balance retrieval under 500ms; reward redemption under 2s; renewal processing under 5s excluding payment-provider delay; 99.9% monthly availability (FR-113).

**Constraints**: Every active customer has a current Health Score retrievable under 500ms (FR-007, SC-001); 100% of churn predictions include probability/risk-level/window/confidence/model-version/explainable drivers (FR-018, SC-002); 100% of involuntary-churn events route to payment recovery, never a promotional journey (FR-003, SC-003); 100% of automated retention offers pass Discount Governance before delivery, zero automated discounts to lifetime-exhausted or reason-irrelevant customers (FR-045–FR-046, SC-005); every holdout-measured experiment reports treatment-minus-holdout incremental retention with full guardrails (FR-051, SC-006); Retention ROI uses the finance-approved formula (FR-092, SC-007); 100% of loyalty-fraud matches are reviewed before reward finalization (FR-067, SC-008); 100% of AI recommendations carry reasoning/confidence/model-version, and every human override is audit logged (FR-089, SC-009, Constitution Article II); High-Potential customers are never misclassified as Low/Negative Value due to limited transaction history alone (FR-074, SC-010).

**Scale/Scope**: ~19 data entities, 115 functional requirements (FR-001–FR-115), 8 user stories, 7 churn types, 12 churn categories, 5 Health Score bands, 6 churn-risk levels, and multiple NEEDS CLARIFICATION items in spec.md's own Edge Cases — most significantly the newly-flagged fourth/fifth "Customer Health Score" naming instance alongside `029`/`034`/`035`, and the already-thoroughly-resolved `029` authority relationship.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Churn classification, health scoring, and discount-governance checks are entirely server-side; no client-asserted risk level or discount approval | **PASS — direct implementation (not the constitution's named source for this article)** | FR-007, FR-045 |
| II. AI Is Assistive, Never Autonomous | **FR-089 cites "Constitution Article II" verbatim** — every AI retention recommendation is overridable, with reason and audit entry required | **PASS — direct implementation, spec.md explicitly applies this article** | FR-089, SC-009 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | **This chapter is directly named in the constitution's own Article III source citation** — "Vol 14 Part 2 Ch 5 & Ch 7" — and **FR-110 additionally cites "Constitution Article III" verbatim** for the cancellation-flow/dark-pattern prohibitions | **PASS — direct implementation, co-cited by the constitution itself and self-cited in FR text** | FR-035, FR-110 |
| IV. Historical Immutability | **FR-111 cites "Constitution Article IV" verbatim** — model version/deployment date recorded on every prediction so its origin remains attributable after retraining/retirement | **PASS — direct implementation, spec.md explicitly applies this article** | FR-111 |
| V. Ledger-Based Internal Economies | **This chapter is directly named in the constitution's own Article V source citation** — "Vol 14 Part 2 Ch 7 (loyalty points ledger, Reward Liability as a finance line item)" — Loyalty Transaction is append-only, extending `006`'s/`029`'s shared ledger | **PASS — direct implementation, co-cited by the constitution itself** | FR-064–FR-066, FR-093 |
| VI. Consent Is First-Class | Consent verified before every retention action; no-contact requests respected | **PASS (aligns; consent capture owned elsewhere, enforcement is this feature's own)** | FR-043, FR-104 |
| VII. Layered, Explicit RBAC | 14 named roles with granular financial/model/offer/case-assignment permission controls | **PASS (extends 001/016)** | FR-103 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | Loyalty explicitly requires 6-dimension measurement so repeat-purchase-but-dissatisfied customers are never automatically classified highly loyal — an anti-vanity-metric guarantee | **PASS (aligns; explicit anti-single-metric framing)** | FR-058 |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Multilingual retention content (Tamil/English/Thanglish+) with regional/tone adaptation | **PASS (aligns; not the constitution's named source for this article)** | FR-083 |
| Security & Compliance Baseline | Encryption, RBAC, MFA, audit logging, consent, data minimization, retention policies | **PASS (aligns; not directly named for this chapter's remaining requirements in the Baseline's source citation list)** | FR-104, FR-112 |

No constitutional violations. No Complexity Tracking entries required for principle compliance. The fourth/fifth "Customer Health Score" naming instance is a documented open ownership item (see analysis above), not a constitutional violation.

## Project Structure

### Documentation (this feature)

```text
specs/040-retention-intelligence-churn-prediction/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: multi-churn-type simultaneous-precedence rule, false-positive/false-negative cost-tradeoff policy, rapid-decline-alert-vs-journey-trigger relationship, fatigue-suppression-vs-critical-SLA precedence, negative-current-value-vs-High-Potential classification resolution, and the fourth/fifth "Customer Health Score" naming instance across 029/034/035/040
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`039`'s structure — no new top-level projects; `029` is expected to consume this feature's churn/retention outputs rather than maintaining a competing model, and the loyalty ledger extends `006`'s/`029`'s existing one.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── churn-classification/        # Churn Type, Churn Category, Churn Reason (FR-001–FR-006)
│   │   ├── customer-health-score/       # Customer Health Score — flagged 4th/5th instance (FR-007–FR-011)
│   │   ├── early-warning-detection/     # signal tracking, churn risk alerts (FR-012–FR-016)
│   │   ├── churn-prediction-engine/     # Churn Prediction, Risk Driver (FR-017–FR-021)
│   │   ├── retention-segmentation-journeys/ # Retention Segment, lifecycle, journeys, renewal intelligence (FR-022–FR-030)
│   │   ├── payment-recovery-service/    # involuntary-churn routing, smart retry (FR-031–FR-034)
│   │   ├── cancellation-pause-offers/   # cancellation flow, pause, downgrade, offers (FR-035–FR-039)
│   │   ├── retention-decision-engine/   # Retention Decision/Intervention, Discount Governance Rule (FR-040–FR-048)
│   │   ├── retention-holdout-experiments/ # Retention Holdout Group, incremental retention (FR-049–FR-053)
│   │   ├── customer-reactivation/       # reactivation eligibility, segments, journey (FR-054–FR-057)
│   │   ├── loyalty-system/              # Loyalty Account/Tier/Transaction (extends 006/029), Reward, fraud detection (FR-058–FR-068)
│   │   ├── customer-lifetime-value/     # CLV Category, Lifetime Value Record (FR-069–FR-075)
│   │   ├── customer-success-prioritization/ # Retention Case, Workbench Profile (FR-076–FR-080)
│   │   ├── communication-fatigue-contact-policy/ # fatigue score, contact policy, multilingual (FR-081–FR-083)
│   │   ├── ai-retention-assistant/      # advisory AI assistant, root-cause analysis (FR-084–FR-089)
│   │   ├── retention-economics-reporting/ # forecasting, ROI, dashboards, metrics catalog (FR-090–FR-096)
│   │   ├── cohort-survival-analytics/   # cohort, survival, funnel analytics (FR-097–FR-101)
│   │   └── retention-governance-model-quality/ # RBAC/privacy, model governance/bias/ethics, security/performance (FR-102–FR-115)
│   └── common/                          # reused from 006/029: loyalty-points ledger; reused from 008: AI gateway; reused from 019/034/035: profile/segment data; reused from 001/016: RbacGuard; consumed by 029's lifecycle automation
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── retention-intelligence/{health-scores, churn-predictions, retention-cases, discount-governance, holdouts, loyalty, clv, executive}/
```

**Structure Decision**: 17 new backend modules under `churn-*`/`retention-*`/`loyalty-*`/`customer-lifetime-value`/etc., explicitly wired to extend `006`'s/`029`'s loyalty ledger rather than redefining it, and positioned as the authoritative source `029` consumes for churn/retention depth. `churn-prediction-engine` (explainability requirement) and `retention-decision-engine` (Discount Governance, the margin-protection safety mechanism) are built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations; the fourth/fifth Customer Health Score naming instance is a documented open ownership item, not an approved exception | — | — |
