# Implementation Plan: Audience Management, Segmentation & Customer Data Platform

**Branch**: `019-audience-segmentation-cdp` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/019-audience-segmentation-cdp/spec.md`

## Summary

This feature builds the Customer Data Platform every other Volume 14 marketing feature depends on: a single Unified Customer Profile per person aggregating Identity/Account/Engagement/Transaction/Communication-Preference data from 16 connected TBT modules in near real time; a chronological customer timeline; a visual Audience Builder supporting static and self-maintaining dynamic segments with nested AND/OR/NOT rule groups across demographic/behavioral/transactional/marketing-engagement/custom attributes; manual/rule-based/AI-generated tags; consent-safe, RBAC-governed audience import/export; continuous data-quality deduplication and validation; an AI segmentation engine proposing candidate segments that require mandatory human review before activation; four dynamically computed customer scores (Engagement, Purchase, Loyalty, Churn Risk); per-channel consent records with full audit history; and audience analytics dashboards.

This chapter is not cited by name in the constitution, but two of its requirements closely mirror constitutional articles without being their named source: **Article II** (AI-proposed segments require mandatory human review, edit, and explicit save before becoming active — FR-029, User Story 4) and **Article VI** (per-channel, versioned Consent Records that must propagate to in-flight automation/exports without delay — FR-035–FR-037, SC-008 — the CDP's consent-propagation behavior is a direct, near-verbatim instance of Article VI's platform-wide requirement).

Per spec.md's own Assumptions, this feature is the **CDP foundation nearly every other Volume 14 Part 1 feature consumes rather than redefines**: `020`–`032` (Email, SMS/WhatsApp/Push, Automation, Landing Pages, Lead Scoring, AI Marketing Assistant, A/B Testing, Analytics/Attribution, Lifecycle/Retention, Referral/Affiliate, Social, Omnichannel Orchestration) all reference this chapter's Unified Customer Profile, Segment, Customer Score, and Consent Record entities directly. It explicitly does **not** define consent-*collection* mechanics (opt-in UI, double opt-in, policy-version prompts) — those belong to the modules that capture consent (`002` Website, `003` Onboarding); this chapter owns only the CDP's storage, retrieval, and propagation of consent state. It **reuses `016`'s RBAC model** directly for export governance and field-level access control (FR-024, FR-043) rather than defining a CDP-specific role system. Identity resolution/deduplication in this version is deterministic exact-match on fields like email/phone — the source explicitly places probabilistic/cross-device matching under Future Enhancements, so this spec does not build that here.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–018.

**Primary Dependencies**: NestJS, Next.js; an event-ingestion pipeline consuming the platform event spine established in `015` (16 connected source modules feeding profile enrichment); AI segmentation engine consuming `008`'s shared AI gateway (FR-028); RBAC/export governance consuming `016`'s permission model directly (FR-024, FR-043); a rule-evaluation engine for the visual Audience Builder (FR-017–FR-019, nested AND/OR/NOT groups).

**Storage**: PostgreSQL (~11 entities per spec.md's Key Entities — Unified Customer Profile, Timeline Event, Segment/Rule/Rule Group, Custom Attribute, Tag, AI-Generated Segment Proposal, Customer Score, Consent Record, Data Quality Flag/Duplicate Merge Record, Import/Export Job domains), with the profile store architected to sustain millions of concurrent records without degrading segmentation/scoring/search performance (FR-004, SC-007); Redis or equivalent for dynamic-segment membership caching and near-real-time score recalculation triggers.

**Testing**: Jest (backend — unified-profile-no-duplicate-creation, dynamic-segment-auto-refresh, and consent-withdrawal-propagation-before-send contract tests are the highest-stakes tests here, matching this spec's own User Story 1 acceptance scenario 3, SC-002, and SC-008), Playwright (web e2e — Audience Builder, profile timeline, export flow).

**Target Platform**: Web (Admin Portal, rendered inside `017`'s workspace shell); this is the shared data foundation every other Volume 14 feature's audience-facing functionality reads from.

**Performance Goals**: Profile updates within 5s of a triggering interaction; dynamic segment refresh within 30s; AI score recalculation within 2 minutes; profile search under 500ms; segment creation under 2s; customer lookup under 300ms; audience export of 100,000 records under 30s (FR-038–FR-040, SC-001–SC-006).

**Constraints**: Exactly one master profile exists per customer — two interaction records referencing the same customer from different source modules never create a duplicate (FR-006, User Story 1 acceptance scenario 3); dynamic segment membership refreshes automatically as underlying data changes, with no manual re-run required (FR-014, SC-002); AI-proposed segments never become active without explicit human review, edit-option, and save (FR-029, Constitution Article II alignment); consent withdrawals propagate to segment membership, export data, and automation eligibility before any subsequent send on the withdrawn channel — zero sends against stale consent state (FR-035, SC-008, Constitution Article VI alignment); export access is RBAC-governed with sensitive fields masked for roles lacking visibility (FR-024, FR-045); duplicate/invalid/orphaned records are continuously flagged or auto-merged with administrator notification (FR-025–FR-027, SC-009).

**Scale/Scope**: ~11 data entities, 45 functional requirements (FR-001–FR-045), 7 user stories, 16 connected source modules, 4 customer score types, and 6 NEEDS CLARIFICATION items in spec.md's Assumptions/Edge Cases (field-level merge-conflict precedence, consent-merge precedence on duplicate-profile merge, consent-history retention duration, missed-recalculation-target degradation behavior, custom-attribute-deletion segment-invalidation behavior, and bulk-import partial-validity handling).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Article | Gate | Status | Notes |
|---|---|---|---|
| I. Server-Authoritative State | Profile aggregation, deduplication, scoring, and segment membership are all server-computed from ingested events, never client-asserted | **PASS — direct implementation (not the constitution's named source for this article)** | FR-006, FR-034 |
| II. AI Is Assistive, Never Autonomous | AI-proposed segments require mandatory human review, optional edit, and explicit save before becoming active or usable by any campaign tool | **PASS — direct implementation (aligns; not the constitution's named source for this article)** | FR-029, User Story 4 |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | N/A — this is an internal data-platform chapter with no customer-facing claim surface | **PASS (N/A)** | — |
| IV. Historical Immutability | Consent change history is retained for audit; data-quality merges and score recalculations do not silently rewrite prior state without a traceable record | **PASS (aligns; not the constitution's named source for this article)** | FR-037, FR-026 |
| V. Ledger-Based Internal Economies | N/A — Wallet Balance/Reward Points are surfaced as profile attributes, not computed or ledgered here; the ledger of record is owned by `006`/`009` | **PASS (N/A / deferred)** | FR-010 |
| VI. Consent Is First-Class | Per-channel, versioned Consent Records (status, source, timestamp, IP, policy version) that must propagate to segment membership, exports, and automation eligibility before any subsequent send — a direct, near-verbatim instance of this article's platform-wide requirement | **PASS — direct implementation (aligns closely; not the constitution's named source for this article)** | FR-035–FR-037, SC-008 |
| VII. Layered, Explicit RBAC | Export governance and field-level access control reuse `016`'s RBAC model directly | **PASS (extends 016)** | FR-024, FR-043 |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | N/A | **PASS (N/A)** | — |
| IX. Action Before Consumption | N/A | **PASS (N/A)** | — |
| Localization & Language Requirements | Preferred Language and Language Preference are captured profile/communication-preference fields, but this chapter does not itself localize any UI | **PASS (N/A for this feature's own surface)** | FR-007, FR-011 |
| Security & Compliance Baseline | Encryption at rest/in transit, audit logging of access/changes, secure export mechanisms, data masking on sensitive fields, rate limiting on bulk operations | **PASS (aligns; not directly named for this chapter in the Baseline's source citation list)** | FR-044, FR-045 |

No constitutional violations. No Complexity Tracking entries required for principle compliance.

## Project Structure

### Documentation (this feature)

```text
specs/019-audience-segmentation-cdp/
├── plan.md
├── research.md      # Phase 0 — MUST resolve: field-level merge-conflict precedence for automatic duplicate merges, consent-merge precedence when duplicate profiles with conflicting consent are merged, consent-history retention duration, degradation behavior when score recalculation misses its 2-minute target, custom-attribute-deletion segment-invalidation behavior, and bulk-import partial-validity handling
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md          # Phase 2 (/speckit.tasks)
```

### Source Code (repository root)

Extends `001`–`018`'s structure — no new top-level projects; this feature is the CDP data foundation `020`–`032` all read from, consuming `015`'s event spine, `016`'s RBAC, and `008`'s AI gateway.

```text
backend/
├── src/
│   ├── modules/
│   │   ├── cdp-profile/            # Unified Customer Profile, ingestion/enrichment pipeline, dedup-on-ingest (FR-001–FR-011)
│   │   ├── cdp-timeline/           # Customer Timeline Event, filter/search/export (FR-012–FR-013)
│   │   ├── cdp-segmentation/       # Segment, Segment Rule/Rule Group, Custom Attribute, visual Audience Builder (FR-014–FR-019)
│   │   ├── cdp-tags/               # Tag/Label, manual/rule-based/AI-generated assignment (FR-020–FR-021)
│   │   ├── cdp-import-export/      # Audience Import Job/Export Job (FR-022–FR-024)
│   │   ├── cdp-data-quality/       # continuous validation, dedup merge, orphan/invalid flagging (FR-025–FR-027)
│   │   ├── cdp-ai-segmentation/    # AI-Generated Segment Proposal, human-review gate (FR-028–FR-029)
│   │   ├── cdp-scoring/            # Customer Score (Engagement/Purchase/Loyalty/Churn Risk) (FR-030–FR-034)
│   │   ├── cdp-consent/            # Consent Record, propagation to segments/exports/automation (FR-035–FR-037)
│   │   └── cdp-analytics/          # audience dashboards, filtering/export/scheduled reporting (FR-041–FR-042)
│   └── common/                     # reused from 001: RbacGuard, audit-log interceptor; reused from 015: event-bus ingestion; reused from 016: RBAC/export governance; reused from 008: AI gateway
└── tests/{contract,integration,unit}/

web/
└── src/app/
    └── (marketing-admin)/
        └── audience/{profiles,segments,builder,tags,imports-exports,data-quality,scores,consent,analytics}/
```

**Structure Decision**: 10 new backend modules under `cdp-*`, each mapping to one of spec.md's FR groupings. `cdp-profile` (unified-profile deduplication integrity) and `cdp-consent` (consent-propagation safety) are built and contract-tested first given their status as the foundation every other module and every downstream Volume 14 feature depends on. No new top-level projects.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| N/A — no constitutional violations | — | — |
