# Implementation Plan: Enterprise Voice of Customer, Feedback Intelligence & Advocacy Platform

**Branch**: `041-voice-of-customer-feedback-intelligence` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/041-voice-of-customer-feedback-intelligence/spec.md`

## Summary

This feature builds the platform's enterprise Voice-of-Customer engine across a five-layer architecture (Feedback Sources → Collection → Intelligence → Action → Reporting): omnichannel feedback collection with a 10-stage feedback lifecycle; a no-code Survey Engine/Builder (13 question types, branching/skip/piping/multi-language/anonymous logic, 10 distribution channels) driving event-triggered CSAT/NPS/CES capture; a 12-stage enterprise NLP pipeline (Tamil/Tanglish/Hindi/English) producing sentiment (7 categories), 14-emotion Emotion Intelligence with a per-customer Emotion Timeline, Theme/Keyword Intelligence, Intent Detection, and Smart Categorization; Complaint Intelligence with severity-based auto-escalation; Experience Insights and Trend Analysis; Root Cause Intelligence; Predictive Feedback Analytics; an AI Recommendation Engine and Executive Insight Dashboard; a Customer Advocacy Platform (10-factor Advocacy Readiness Score, an 8-stage advocacy lifecycle) and Referral Intelligence (Referral Propensity Score, a 9-step referral workflow, fraud detection); a tiered Brand Ambassador Program with governance controls; Reputation Analytics with an 8-step Reputation Recovery Workflow; Customer Success Integration with a mandatory 8-step closed-loop feedback-resolution process; and security/governance/performance/reporting requirements.

## Ownership & Dependency Analysis (Feature 041 vs. Features 030, 008, and the Complaint/Support-Case boundary with 013)

Spec.md's own Assumptions explicitly address the two most consequential dependencies; a third (the Complaint-escalation/support-case boundary with `013`) is implicit in FR-041's own wording and is made explicit here.

### 1. Confirmed clean: `030` owns referral/ambassador execution mechanics, this feature owns advocacy scoring and identification

Spec.md's own Assumptions state this feature "depends on Feature 030... for the underlying referral-link generation, click/conversion tracking, commission/reward issuance mechanics, and fraud-detection engine that the Advocacy Platform and Referral Intelligence capabilities in this chapter target and score against; this spec defines *who* is identified/scored for advocacy and referral outreach and the resulting advocacy/ambassador lifecycle, not the referral execution engine itself." Verified against `030`'s own plan.md: `030` already owns a `fraud-prevention` module (`Fraud Risk Score`, `Fraud Case`, self-referral/duplicate-account detection) with no competing "Advocacy Readiness Score" or "Referral Propensity Score" claim — **no contradiction found**. **Ownership decision**: this feature's referral-fraud detection (FR-068: self-referrals, duplicate accounts, suspicious devices, repeated IPs, fake registrations, reward abuse, referral loops) is implemented by **reusing `030`'s existing Fraud Risk Score/Fraud Case engine** rather than building a second, parallel fraud-detection system — the same pattern, applied to the same underlying signal types `030` already screens for. This feature's `Referral` entity (tracked referral instance) and `030`'s existing referral-link/tracking-link mechanics are likewise treated as one workflow: this feature identifies and scores the customer, `030` executes the link generation, tracking, and reward issuance.

### 2. Confirmed clean: `008` supplies AI infrastructure, not redefined here

Spec.md's own Assumptions state the 12-stage NLP pipeline, Sentiment Analytics, Emotion Intelligence, and AI Recommendation Engine run on `008`'s shared model-serving infrastructure (LLM/NLP inference, model versioning, confidence scoring); this feature defines only the VoC-specific pipeline stages, outputs, and business rules layered on top — consistent with the established platform-wide pattern.

### 3. New finding, made explicit: Critical-complaint escalation creates cases in `013`'s existing support system, not a new ticketing system

Not addressed explicitly by spec.md's own Assumptions, though implied by FR-041's own wording ("Critical complaints MUST automatically create a support case"). **Ownership decision**: this feature's Complaint Intelligence classifies and scores complaints and, on Critical severity, triggers case creation in `013`'s existing CRM/Support Desk system — it does not implement a second, parallel ticketing/case-management system. The `Complaint` entity tracks VoC-specific classification (category, severity, severity inputs) and references the resulting support case by ID rather than duplicating `013`'s Support Ticket entity.

### 4. Confirmed clean: no new "Customer Journey" or "Customer Health Score" entity introduced

Checked against this feature's own Key Entities list. This feature introduces its own `Experience Score` (a per-lifecycle-dimension scorecard: Registration, Onboarding, Learning, Community, Membership, Event, AI Assistant, Support, Renewal, Overall Brand) — a distinct construct from the `Customer Health Score` cluster (`029`/`034`/`035`/`040`) and the `Customer Journey` cluster (`022`/`027`/`032`/`037`/`039`), with no naming collision against either. This feature does not worsen either existing cluster.

### 5. Preserved NEEDS CLARIFICATION items (from spec.md's own FR text and Assumptions, not resolved here)

- Exact sentiment-confidence review threshold (FR-024).
- Numeric performance thresholds for "noticeable delay," "approved enterprise performance threshold," and "near real time" (FR-086).
- Specific data-retention period(s) for feedback/PII (FR-085).
- Survey-fatigue throttling/prioritization rule when a customer is eligible for multiple triggers in a short window (Edge Cases).
- Whether elevated Advocate/Ambassador status bypasses or still receives full referral-fraud screening (Edge Cases).
- Reopen path for a closed-loop case the customer disputes after "final outcome recorded" (Edge Cases).

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–040.

**Primary Dependencies**: NestJS, Next.js; NLP/sentiment/emotion/recommendation pipelines consuming `008`'s AI gateway; referral-link generation, tracking, and reward issuance delegated to `030`; Critical-complaint case creation delegated to `013`'s support system; profile/event data consumed from `019`/`034`/`035`, not originated here.

**Storage**: PostgreSQL (~22 entities per spec.md's Key Entities — Survey, Survey Question, Feedback Response, NLP Processing Result, Sentiment Score, Emotion Detection, Emotion Timeline Entry, Theme, Keyword/Keyword Alert, Complaint, Root Cause, Experience Score, Trend Record, Predictive Forecast, AI Recommendation, Advocacy Readiness Score, Advocacy Status, Referral, Brand Ambassador, Reputation Score, Reputation Risk Alert, Closed-Loop Case, Executive Report domains), with every NLP pipeline stage logged for audit (FR-028) and Closed-Loop Case immutable-history per step.

**Testing**: Jest (backend — twelve-stage-pipeline-completeness, critical-complaint-auto-escalation, and no-critical-close-without-resolution-or-exception contract tests are the highest-stakes tests here, matching this spec's own SC-003, SC-004, and SC-005), Playwright (web e2e — Survey Builder branching/piping, Complaint escalation view, Closed-Loop Case tracker, Ambassador Dashboard).

**Target Platform**: Web (Admin/Customer-Success Portal, rendered inside `017`'s workspace shell) plus survey distribution across mobile/web/community/email/WhatsApp channels.

**Performance Goals**: Standard feedback submission without noticeable delay; dashboard load within the enterprise performance threshold; high-priority alerts near real time; bulk analytics non-blocking (FR-086, numeric values NEEDS CLARIFICATION per spec.md).

**Constraints**: 100% of feedback captured with source/timestamp/customer-reference, zero loss (FR-020, SC-001); administrators build/publish surveys with zero engineering involvement (FR-019, SC-002); 100% of processed feedback receives sentiment classification/confidence/model-version after the 12-stage pipeline (FR-027, SC-003); 100% of Critical complaints auto-escalate with full audit trail (FR-041, SC-004); zero Critical complaints closed without documented resolution or approved exception (FR-084, SC-005); Advocacy Readiness Scores recalculate on a defined cadence reflecting all 10 factors (FR-062, SC-006); reputation risk alerts fire for 100% of threshold-breach conditions (FR-078, SC-007); executive KPIs reconcile exactly with source records (FR-060, SC-008); 100% of reward-eligible referral conversions pass fraud screening before reward issuance (FR-068, SC-010).

**Scale/Scope**: ~22 data entities, 87 functional requirements (FR-001–FR-087), 9 user stories, a 5-layer VoC architecture, a 12-stage NLP pipeline, 7 sentiment categories, 14 emotions, and 3 NEEDS CLARIFICATION items in spec.md's own FR text (confidence threshold, performance thresholds, retention period) plus several Edge-Cases items — none of which collide with the already-escalating "Customer Journey" or "Customer Health Score" entity clusters found in prior Wave 3 features.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Sentiment/emotion classification, severity scoring, and advocacy-score calculation are entirely server-side; no client-asserted classification | **PASS — direct implementation (not the constitution's named source for this article)** | FR-022, FR-040 |
| II. AI Is Assistive, Never Autonomous | Spec.md's own Assumptions apply this article to AI-generated severity/root-cause/forecasts/recommendations as advisory inputs requiring human/role-gated approval for consequential actions (ambassador approval, testimonial publication, public response publication); auto-escalation creates cases but never resolves/closes them | **PASS (aligns; spec.md explicitly applies this article per its own Assumptions)** | FR-041, FR-074, FR-079 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A for this chapter's own surface — feedback/advocacy tooling, no customer-facing claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | NLP pipeline stages are logged per-item for audit; Closed-Loop Case and Ambassador Governance actions form an append-style audit history | **PASS (aligns; not the constitution's named source for this article)** | FR-028, FR-072 |
| V. Ledger-Based Internal Economies | N/A directly — referral/ambassador rewards are issued through `030`'s existing wallet/ledger mechanics, not redefined here | **PASS (N/A here; enforced downstream by 030)** | FR-067 |
| VI. Consent Is First-Class | Advocate consent recorded before testimonial/case-study publication; external reputation-data collection complies with privacy requirements | **PASS (aligns; not the constitution's named source for this article)** | FR-074–FR-075 |
| VII. Layered, Explicit RBAC | Role-based permissions over VoC data/functions; administrator approval required for ambassador assignment and public response publication | **PASS (extends 001/016)** | FR-085 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Spec.md's own Assumptions treat native Tamil/Tanglish/transliterated handling as "a hard cross-cutting constraint on FR-021 through FR-031, not an optional enhancement" — the strongest explicit self-application of this principle seen this session | **PASS — direct implementation, spec.md explicitly applies this article as a hard constraint** | FR-026, spec.md Assumptions |
| Security & Compliance Baseline | RBAC, consent enforcement, configurable data retention, administrative action logging | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-085 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/041-voice-of-customer-feedback-intelligence/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: sentiment-confidence review threshold, numeric performance thresholds ("noticeable delay"/"near real time"/dashboard threshold), feedback/PII data-retention period, survey-fatigue throttling rule, elevated-Advocate fraud-screening applicability, and the closed-loop-case reopen path
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`040`'s structure — no new top-level projects; this feature delegates referral execution to `030`, support-case creation to `013`, and AI infrastructure to `008`.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── voc-architecture-collection/  # 5-layer architecture, Collection Layer, feedback lifecycle (FR-001–FR-009)
│   │   ├── survey-engine-builder/        # Survey, Survey Question, no-code builder, distribution, APIs (FR-010–FR-020)
│   │   ├── nlp-pipeline-sentiment/       # 12-stage pipeline, Sentiment Score, NLP Processing Result (FR-021–FR-028)
│   │   ├── emotion-intelligence/         # Emotion Detection, Emotion Timeline Entry (FR-029–FR-031)
│   │   ├── theme-keyword-intelligence/   # Theme, Keyword/Keyword Alert (FR-032–FR-036)
│   │   ├── intent-categorization/        # intent detection, smart categorization (FR-037–FR-038)
│   │   ├── complaint-intelligence/       # Complaint, severity/escalation, delegates case creation to 013 (FR-039–FR-042)
│   │   ├── experience-trend-analysis/    # Experience Score, Trend Record (FR-043–FR-047)
│   │   ├── root-cause-intelligence/      # Root Cause (FR-048–FR-050)
│   │   ├── predictive-feedback-analytics/ # Predictive Forecast (FR-051–FR-054)
│   │   ├── ai-recommendation-executive/  # AI Recommendation, Executive Insight Dashboard (FR-055–FR-060)
│   │   ├── customer-advocacy-referral/   # Advocacy Readiness Score, Advocacy Status, Referral — scores against 030's engine (FR-061–FR-068)
│   │   ├── brand-ambassador-program/     # Brand Ambassador, governance (FR-069–FR-074)
│   │   ├── reputation-analytics/         # Reputation Score, Reputation Risk Alert, Recovery Workflow (FR-075–FR-079)
│   │   └── cs-integration-closed-loop/   # unified profile fields, CS actions/workbench, Closed-Loop Case (FR-080–FR-087)
│   └── common/                           # reused from 008: AI gateway; reused from 030: referral-link/tracking/reward/fraud engine; reused from 013: support-case creation; reused from 019/034/035: profile data; reused from 001/016: RbacGuard
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── voice-of-customer/{surveys, feedback-repository, complaints, root-cause, advocacy, ambassadors, reputation, closed-loop, executive}/
```

**Structure Decision**: 14 new backend modules under `voc-*`/`survey-*`/`nlp-*`/`complaint-*`/`advocacy-*`/etc., explicitly wired to delegate referral execution to `030`, case creation to `013`, and AI infrastructure to `008` rather than redefining them. `nlp-pipeline-sentiment` (the intelligence layer everything downstream depends on) and `complaint-intelligence` (the auto-escalation safety mechanism) are built and contract-tested first. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
