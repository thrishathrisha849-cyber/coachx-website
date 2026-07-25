# Implementation Plan: Enterprise Business Intelligence & KPI Management

**Branch**: `049-business-intelligence-kpi-management` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/049-business-intelligence-kpi-management/spec.md`

## Summary

This feature builds the enterprise BI/KPI/Decision-Intelligence capstone described in Volume 14 Part 2 Chapter 16 (synthesized across `document 1/Document 1 (80).md` and `document 2/Document 2.md` lines 1–873, per spec.md's own Source Note): a unified BI 360° Workspace spanning 15 configurable Intelligence Domains as the authoritative enterprise analytics source of truth; Executive Analytics Management as a real-time command center running an 8-stage workflow across 12 Executive Analytics Categories; KPI Management enforcing one standardized calculation formula, owner, and threshold set per KPI across 14 categories — explicitly forbidding "duplicate or divergent calculation logic for the same KPI name"; Enterprise Reporting (14 report categories) with drag-and-drop building, Digital Sign-Off gating distribution, versioning, and 8 delivery channels; AI Reporting Intelligence generating narrative Executive Highlights; Business Performance Management tying 10 Performance Domains to Objectives/KPIs/Variance/AI Recommendations; a BI Dashboard with explainable, auditable AI Business Rankings; and the chapter's "outer ring" — Decision Intelligence (10-stage workflow), AI/Predictive/Prescriptive Analytics, an Executive Decision Support Platform, Enterprise Intelligence Portal, Executive Intelligence Workspace, Enterprise BI Collaboration, and a Governance & Compliance framework with immutable audit records across 10 categories.

This chapter is not directly named by the constitution, but its Assumptions section explicitly invokes Constitution "Principle II" ("AI is assistive, never autonomous, applied throughout") governing every AI capability in the chapter — an Assumptions-paragraph inferred citation.

**As the closing chapter of Wave 3, this feature's core governing principle — one standardized KPI definition per name, no divergent calculation logic permitted — directly names the exact problem this session has repeatedly found left unresolved elsewhere.** This plan does not attempt to retroactively resolve those prior gaps (doing so would require picking winners among already-planned features, which is out of scope for a single feature's ownership analysis), but it documents the connection explicitly rather than treating this feature as unrelated to that accumulated history.

## Ownership & Dependency Analysis

### §1. Predictive/Prescriptive Analytics vs. `040`/`037` — confirmed clean, per spec.md's own Assumptions

Spec.md's own Assumptions state this chapter's Predictive/Prescriptive Analytics (FR-049–FR-052) describe the enterprise-wide, BI-anchored decision layer specific to Chapter 16, related to but distinct from `040`'s dedicated retention/churn model and `037`'s dedicated attribution/MMM model — both of which remain canonical for their specific deeper models and are not restated here. This plan confirms this framing is consistent with both `040`'s and `037`'s own plan.md Summaries (both already established as "deepest ... authority" for their respective domains earlier this session) — no contradiction found.

### §2. Auth/RBAC/Identity vs. `003` — confirmed clean

Spec.md's own Assumptions state Workspace Security (FR-061: RBAC, MFA, SSO, Conditional Access, Device Trust) integrates with `003`'s existing authentication/identity system rather than a separate identity provider. Standard, already-established reuse pattern for every portal-fronting feature this session.

### §3. KPI Governance vs. the session's accumulated metric-duplication clusters — named, not resolved

This chapter's own governing principle is explicit and forceful: "Every KPI MUST maintain a single standardized definition, ownership, calculation logic, and threshold set — duplicate or divergent calculation logic for the same KPI name is not permitted as a matter of governance policy" (FR-019). This is precisely the discipline that, if applied retroactively across Wave 2/3, would speak directly to three clusters this session has already found and left open:

- The **Customer/Health Score cluster** (seven independently-specified instances across `019`, `034`, `035`, `040`, the `029`-referenced instance, `044`'s CX variant, and `047`'s now-canonical CSM variant).
- **ARR/MRR/CAC/CLV/GRR/NRR** appearing as independently-monitored metrics in `009` (the financial system of record), `045` (Revenue Intelligence outputs), and `048` (Revenue Performance Metrics) without a single named canonical calculation owner across all three.
- The **Lead Score scale collision** across `013` (0–100), `024` (0–1000), and `045` (Platinum–Cold tiers), already explicitly preserved as an open NEEDS CLARIFICATION gate extending across three features.

**This plan does not resolve any of these here.** Retroactively declaring a winner for each cluster is outside the scope of planning a single new feature, and spec.md itself gives no instruction to do so. Instead, this is documented as the **intended future function of this chapter's KPI Definition registry**: when those clusters are eventually reconciled (a task for a dedicated cross-feature consolidation pass, not this plan), `049`'s KPI Definition/KPI Governance framework is the source-implied enterprise mechanism the reconciliation should register through. Until then, this feature's own KPI Definitions for any already-owned metric name (Revenue, ARR, MRR, Customer Health Score, Lead Score, etc.) MUST be understood as *governing/registering* the existing canonical calculation already established by the owning feature (`009` for ARR/MRR, `047` for the now-canonical Customer Health Score, etc.) rather than this feature defining a new, competing formula of its own. This is preserved as a NEEDS CLARIFICATION item (§5) rather than silently declared solved.

### §4. Executive Dashboard aggregation vs. every prior feature's own dashboards — confirmed as intentional capstone role

`049`'s Enterprise Intelligence Portal and Executive Intelligence Workspace (FR-056–FR-061) explicitly integrate "Business Intelligence, Decision Intelligence, AI Analytics, Predictive Analytics, Executive Reporting, KPI Management, and Strategic Decision Support into a single enterprise experience." This is the eighth-plus feature this session to define an "Executive Dashboard"-shaped surface (after `018`, `027`, `028`, `032`, `033`, `037`, `040`, `043`, `044`, `045`, `046`, `047`, `048`), but unlike those prior collisions, this one is structurally intentional: `049` is the explicitly-named capstone aggregator sitting above every domain-specific dashboard, not a peer redefining the same ground. No ownership conflict — `049` consumes and consolidates rather than rebuilds.

### §5. Preserved NEEDS CLARIFICATION items (from spec.md's own Edge Cases and FR text, plus §3's new finding — not resolved here)

- Cross-department (and, per §3, potentially cross-feature) same-name KPI divergent-definition detection/reconciliation mechanism (FR-019, Edge Cases).
- Digital Sign-Off approver assignment, escalation policy, and interaction with Scheduled Distribution timing (FR-026, Edge Cases).
- Formal dispute/override/re-ranking-request workflow for an AI Business Ranking an executive disagrees with (Edge Cases).
- Cross-domain variance reconciliation when one Performance Domain shows positive variance while a related domain shows negative variance for the same strategic initiative (Edge Cases).
- Whether a "do not suggest again" governance control exists for an AI KPI Target Adjustment a Business Owner has already explicitly rejected (Edge Cases).
- Staleness-indicator behavior for a dashboard widget whose Intelligence Domain's Data Refresh Schedule has lapsed (Edge Cases).
- Technical enforcement mechanism (e.g., a separate execution API) preventing a Prescriptive Analytics recommendation from being wired directly into automated execution (Edge Cases).
- Cold-start policy for Predictive Analytics or the Decision Intelligence Workflow on a newly configured KPI/domain/business unit with little historical data (Edge Cases).
- Cross-workflow conflict detection/reconciliation when two Decision Intelligence Workflow instances reach contradictory recommendations for overlapping business questions (Edge Cases).
- The KPI-governance-vs-accumulated-metric-duplication-clusters question (§3) — new item surfaced by this plan.

None of these are silently resolved; each remains an open gate for a future clarification pass.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–048.

**Primary Dependencies**: NestJS, Next.js; `037`'s attribution/MMM model and `040`'s churn model as distinct, non-duplicated deeper analytics this chapter's Predictive/Prescriptive layer coexists with (per §1); `003`'s auth/identity for Workspace Security (per §2); every Wave 1–3 feature's own dashboards/reports/KPIs as the aggregated input to the Enterprise Intelligence Portal and Executive Intelligence Workspace (per §4); `008`'s AI gateway for every advisory AI-intelligence module in this chapter.

**Storage**: PostgreSQL (15 entities per Key Entities: Intelligence Domain, KPI Definition, KPI Threshold, KPI Alert, Report, Report Sign-off Record, AI Executive Highlight, Business Performance Objective, Business Ranking, Executive Analytics Workflow Instance, Decision Record, AI Model (Registry Entry), Governance Policy, Audit Log Entry, Collaboration Meeting Record).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: single-kpi-definition-no-divergent-formula for SC-001, report-signoff-blocks-distribution-until-complete for SC-004, and ai-recommendation-zero-autonomous-execution for SC-007), Playwright (web e2e — BI 360° Workspace, Executive Analytics 8-stage workflow, KPI Library, Report Builder with sign-off, Executive Intelligence Workspace).

**Target Platform**: Web (Enterprise Intelligence Portal + Executive Intelligence Workspace, rendered inside `017`'s workspace shell for internal users; board-facing surfaces may extend beyond it).

**Performance Goals**: Per FR-069/SC-009, the platform must support enterprise scale (millions of data records/KPIs/dashboards/reports/AI models/executive interactions) with analytics/AI/reporting/dashboard-rendering operating independently across multi-language/multi-currency/multi-region/multi-tenant/high-availability deployments [NEEDS CLARIFICATION: no numeric thresholds stated in source].

**Constraints**: Zero same-name KPI may carry divergent calculation logic in production (FR-019, SC-001); zero report configured for Digital Sign-Off may be distributed through any channel before sign-off completes (FR-026, SC-004); zero AI-generated insight/recommendation/forecast/Business Ranking may lack an explainability trace and confidence score (FR-039/FR-045/FR-050, SC-003); zero AI-generated recommendation across Decision Intelligence/Prescriptive Analytics/AI KPI Intelligence/the AI Executive Advisor may execute automatically without recorded human/role-gated approval (FR-052/FR-068, SC-007); 100% of dashboard changes/KPI modifications/report generations/executive decisions/forecast updates/AI recommendations must be captured in the immutable Governance & Compliance audit log (FR-067, SC-005).

**Scale/Scope**: 15 entities, 69 FRs, 8 user stories, 15 Intelligence Domains, 8-stage Executive Analytics Workflow, 14 KPI Categories, 14 Report Categories, 10 Performance Domains, 10-stage Decision Intelligence Workflow, 10 preserved NEEDS CLARIFICATION items (including one newly surfaced connecting this chapter's KPI-governance principle to the session's accumulated metric-duplication clusters), no worsening of any of the 8 previously-accumulated Wave 2/3 architecture gaps, and confirmation that this feature's Executive Dashboard aggregation role is intentional rather than a ninth uncaught collision (§4). This closes Wave 3 (034–049).

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | KPI values, Business Rankings, and Executive Analytics outputs are all server-computed, never client-asserted. |
| II. AI Is Assistive, Never Autonomous | PASS — Assumptions-cited ("Principle II") | FR-013, FR-018, FR-027, FR-034, FR-038–039, FR-045, FR-052, FR-055, FR-065, FR-068 all require human/role-gated approval before an AI output executes; SC-007 states a zero-tolerance success criterion. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | Prescriptive Analytics recommendations remain advisory (FR-052) rather than guaranteed business outcomes. |
| IV. Historical Immutability | PASS | Governance & Compliance maintains immutable audit records across 10 categories (FR-067) that are never retroactively altered. |
| V. Ledger-Based Internal Economies | N/A | This chapter has no internal balance/points/wallet construct of its own. |
| VI. Consent Is First-Class, Per-Channel, and Versioned | N/A | This is an internal executive/BI tool with no direct customer-communication surface. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS (reused, not redefined) | Workspace Security (FR-061) and Report Digital Sign-Off (FR-026) configure `003`'s/`016`'s existing infrastructure (per §2). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | KPI Governance explicitly bars metric drift/divergent definitions (FR-019) — the platform's strongest anti-vanity-metric mechanism this session. |
| IX. Action Before Consumption | PASS | Every Executive Analytics/Decision Intelligence run progresses through defined workflow stages toward a recorded decision (FR-011, FR-044), not passive dashboard viewing alone. |
| Localization & Language Requirements | PASS (not primary focus, inherited) | FR-069 requires multi-language platform-architecture support; this is an internal executive tool, not a customer-facing localized surface. |
| Security & Compliance Baseline | PASS | FR-061/FR-067 (RBAC/MFA/SSO/immutable audit logs) align with the baseline. |

## Project Structure

### Documentation (this feature)

```
specs/049-business-intelligence-kpi-management/
├── spec.md
├── plan.md
├── research.md         # 10 NEEDS CLARIFICATION items from §5
├── data-model.md        # 15 entities
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── single-kpi-definition-no-divergent-formula.contract.md
    ├── report-signoff-blocks-distribution-until-complete.contract.md
    └── ai-recommendation-zero-autonomous-execution.contract.md
```

### Source Code (repository root)

```
backend/src/modules/bi-kpi/
├── bi-workspace-intelligence-domains/   # FR-001-007 — BI 360° Workspace, 15 domains (canonical)
├── executive-analytics-management/      # FR-008-013 — 8-stage command-center workflow
├── kpi-management-governance/           # FR-014-020 — single-definition governance (canonical, per §3)
├── enterprise-reporting/                # FR-021-026 — builder, sign-off, versioning, delivery
├── ai-reporting-intelligence/           # FR-027-029 — narrative summaries, highlights
├── business-performance-management/     # FR-030-035 — 10 domains, variance, AI recommendations
├── bi-dashboard-business-rankings/      # FR-036-041 — explainable AI rankings
├── decision-intelligence/               # FR-042-045 — 10-stage workflow
├── ai-predictive-prescriptive-analytics/ # FR-046-052 — distinct from 037/040 (per §1)
├── executive-decision-support/          # FR-053-055
├── enterprise-intelligence-portal/      # FR-056-057 — aggregates all prior dashboards (per §4)
├── executive-intelligence-workspace/    # FR-058-061 — reuses 003 auth (per §2)
├── bi-collaboration/                    # FR-062-065
└── bi-governance-compliance/            # FR-066-069 — governance framework, immutable audit
└── common/
    # reused from 037/040 (predictive/prescriptive deeper models, not duplicated), 003 (auth/RBAC),
    # 008 (AI gateway), every Wave 1-3 feature's own dashboards/reports (aggregated, not rebuilt)

web/app/(admin)/bi-kpi/
├── bi-workspace/
├── executive-analytics/
├── kpi-library/
├── report-builder/
├── performance-management/
├── dashboard/
├── decision-intelligence/
└── executive-intelligence-workspace/
```

**Structure Decision**: `bi-workspace-intelligence-domains` and `kpi-management-governance` are built and contract-tested first — spec.md's own User Story 1/3 rationale states the Workspace is the foundational, must-ship-first capability every other capability in this chapter is built on top of, and KPI Governance is "the governance backbone every other analytics surface reads from," with metric drift directly undermining every downstream number.

## Complexity Tracking

*No constitutional violations identified. This section intentionally left empty.*
