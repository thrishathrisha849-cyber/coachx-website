# Implementation Plan: Enterprise Knowledge Management System (KMS) & AI Knowledge Copilot

**Branch**: `050-enterprise-knowledge-management` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/050-enterprise-knowledge-management/spec.md`

## Summary

This feature builds the Enterprise Knowledge Management System (KMS) described in Volume 14 Part 2 Chapter 17 (opening Wave 4): an AI Knowledge Copilot using RAG-based retrieval, enterprise knowledge graphs, and contextual reasoning as "the primary interface for interacting with enterprise knowledge," with mandatory source attribution, confidence scoring, and human-verification framing; a Document Intelligence ingestion pipeline (OCR, metadata extraction, AI classification, duplicate detection, summarization, indexing) feeding a governed 12-stage knowledge-asset lifecycle; a Knowledge Base across 10 categories; an Enterprise Wiki with collaborative editing, version history, and AI Wiki Intelligence; Intelligent Enterprise Search across 14 connected repository types with semantic ranking and strict access-control enforcement; a Knowledge Collaboration Workspace with real-time co-authoring and AI Collaboration Intelligence; a Knowledge Governance framework (content ownership, review cycles, taxonomy, retention); Security & Compliance (RBAC/ABAC/MFA/SSO/Zero Trust); Organizational Learning tied to KMS knowledge assets; and a Knowledge Management Dashboard/Enterprise Knowledge Portal with 15 configurable executive report types.

This chapter self-cites Article II via FR-022 ("per constitutional Principle II — AI Is Assistive, Never Autonomous"), an FR-text-verbatim citation using the constitution's own "Principle" phrasing for its numbered Core Principles.

**Spec.md already identifies two overlaps in its own Assumptions** — `062` (Document Management/DMS, not yet planned) and `008` (AI Assistant Platform, already planned). This plan verifies the `008` deferral against its actual plan.md/spec.md and finds it is far more precise and directly applicable than spec.md's own general framing suggested, and surfaces one further overlap — `004` (LMS) — that spec.md's Assumptions never mention.

## Ownership & Dependency Analysis

### §1. AI Copilot / RAG infrastructure (`008`) — confirmed clean, and sharpened with a precise reuse target

Spec.md's own Assumptions state the Copilot's underlying AI/NLP/RAG infrastructure is built on `008`'s shared platform rather than a separate AI stack, but frame this generally. Checked against `008`'s actual plan.md and spec.md: `008` already implements a complete `ai-rag` module — **AI Knowledge Base/Source, AI Document Chunk/Embedding Reference, AI Citation, and a full retrieval pipeline (FR-074–FR-077)** — with a retrieval sequence (query normalization → language detection → query rewriting → permission filtering → hybrid retrieval → metadata filtering → reranking → context assembly → token-budget management → generation → citation validation → unsupported-claim check) that already explicitly lists "organization knowledge" and "admin-approved documents" among its named source categories, tracked with permission scope, version, language, status, index state, citation metadata, and expiry — and already handles reindexing on content change (deactivate old chunks, index new version, retain historical citations, alert on failed indexing).

**Ownership decision**: this is a far more precise match than a generic "shared AI platform" reuse. `050`'s AI Knowledge Copilot does not build a second RAG/retrieval/citation pipeline — it is the knowledge-domain consumer of `008`'s existing `ai-rag` pipeline. `050`'s Document Intelligence ingestion (OCR, classification, indexing) is the process that populates `008`'s already-named "organization knowledge" source category with new, governed content. `050`'s own **Source Citation** entity is a knowledge-domain view of `008`'s canonical **AI Citation** entity, not a redefinition. `050` defines the knowledge-specific governance layer on top (Knowledge Profile, lifecycle workflow, domain taxonomy, review/approval) and the Copilot's knowledge-specific UX (source-document preview, knowledge-asset confidence display), not the retrieval mechanics themselves.

### §2. Document Management (`062`) — CONFIRMED, with a refinement (updated 2026-07-24, per `062/plan.md` §1)

Spec.md's own Assumptions state `062-document-management-dms` should be treated as authoritative for general-purpose enterprise document storage/repository mechanics not specific to knowledge governance, while this chapter's Document Intelligence remains scoped to the KMS ingestion pipeline (classification, OCR, indexing for search/Copilot, knowledge-asset lifecycle). `062` has now been planned and confirms this boundary from its own side (`062/plan.md` §2, citation-accuracy spot-verified against this feature's actual FR-004/FR-019/FR-029). One refinement: this feature's own FR-006 ("retention management, secure disposal" lifecycle stage) and FR-007 (Knowledge Profile's "retention policy" field) are basic mentions of a concept `062` now owns in much greater depth (named Retention Tiers, Legal Hold, Immutable Storage, disposal-batch exclusion) — `062` was originally going to claim these were "not covered" by this feature at all, which `062/plan.md` §1 itself corrected to acknowledge this feature's existing basic mentions. This feature's retention-policy field and retention/disposal lifecycle stage should be understood as delegating to `062`'s canonical mechanics, not as an independent, competing implementation.

### §3. Organizational Learning (`004`) — new finding, not caught by spec.md's own Assumptions

`050`'s Organizational Learning section (FR-043–FR-046) defines Learning Paths, Courses, Assessments, Certifications, and learning analytics (completion, scores, certification status) tied to KMS knowledge assets — this is not mentioned anywhere in `050`'s own Assumptions, but it uses the identical entity vocabulary (Learning Path, Course, Assessment, Certification) already established by `004-learning-management-system`. Checked against `004`'s actual plan.md: its `lms-catalog` module already owns "Learning Path, Learning Path Course, Program, Cohort, Course, Course Version, Course Instructor, Module, Lesson" and its `lms-progress` module already owns completion/certification tracking.

**Ownership decision**: `004` remains the canonical owner of the Learning Path/Course/Assessment/Certification entity engine (the platform's member-facing LMS from Wave 1). `050`'s Organizational Learning reuses `004`'s existing course/learning-path/assessment engine for internal-employee-audience content tied to KMS knowledge assets (onboarding, compliance training, technical learning), rather than building a second, parallel course-catalog system. This is the fifth consecutive feature this session (after `041`/`042`, `042`/`043`, `044`/`030`, `046`/`045`, `048`/`047`+`040`) to surface an uncaught cross-feature dependency during planning.

### §4. RBAC/ABAC vs. `001`/`016` — confirmed clean

Spec.md's own Assumptions state the platform's layered permission hierarchy (Organization → Department/Team → Role → Permission Group → Permission → Resource → Action) is reused rather than a knowledge-specific access-control system. Standard, already-established reuse pattern for every feature this session.

### §5. Preserved NEEDS CLARIFICATION items (from spec.md's own FR text and Edge Cases, plus §3's new finding — not resolved here)

- Which specific named compliance frameworks (GDPR, DPDP Act, ISO 27001, SOC 2, etc.) from the platform-wide Security & Compliance Baseline apply to knowledge/document data specifically — explicitly flagged by spec.md itself (FR-042a).
- Reconciliation when a document is superseded by a newer approved version but the Copilot/Search index still surfaces the outdated version due to reindexing lag (Edge Cases).
- Presentation/reconciliation when two knowledge assets from different departments contain conflicting guidance on the same policy topic (Edge Cases).
- Prevention mechanism for a search-index or RAG-retrieval-layer access-control leak (preview/snippet/citation exposing unauthorized content) distinct from document-viewer-level access control (Edge Cases).
- OCR-failure handling — remains unindexed, flagged for reprocessing, or silently enters without searchable content (Edge Cases).
- Race-condition handling when duplicate documents are independently uploaded by two departments before duplicate detection runs (Edge Cases).
- Safeguard preventing an AI Copilot response from being used as the basis for a compliance-relevant decision without the required human-verification step (Edge Cases).
- Behavior when a knowledge asset's mandatory review date lapses — remains trusted/authoritative or is automatically flagged/demoted (Edge Cases).
- Enforcement mechanism preventing an external partner or role-restricted account from indirectly accessing an internal-only domain via Wiki/Search/Copilot (Edge Cases).

None of these are silently resolved; each remains an open gate for a future clarification pass.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–049.

**Primary Dependencies**: NestJS, Next.js; `008`'s `ai-rag` module (AI Knowledge Base/Source, AI Document Chunk/Embedding Reference, AI Citation, retrieval pipeline) as the RAG engine the Copilot consumes (per §1); `004`'s Learning Path/Course/Assessment/Certification engine as the foundation Organizational Learning extends (per §3); `001`/`016`'s layered RBAC/ABAC for knowledge access control (per §4); `008`'s AI gateway for every other advisory AI-intelligence module in this chapter.

**Storage**: PostgreSQL (13 entities per Key Entities: Knowledge Document/Asset, Wiki Page, Knowledge Base Article, AI Copilot Conversation/Query-Response, Source Citation, Knowledge Graph Node/Relationship, Access Policy, Knowledge Domain, Review/Approval Workflow Instance, Audit Record, Learning Path/Course/Assessment, Collaboration Workspace, Executive/Analytics Report).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: copilot-response-source-attribution-or-low-confidence for SC-001, zero-unauthorized-knowledge-exposure for SC-005, and immutable-audit-log-full-coverage for SC-006), Playwright (web e2e — AI Knowledge Copilot conversation, document upload/Document Intelligence pipeline, Wiki page editing, Intelligent Search with access-control filtering).

**Target Platform**: Web (Enterprise Knowledge Portal, rendered inside `017`'s workspace shell for internal users; mobile access per FR-011).

**Performance Goals**: Per FR-051/SC-002, median time to locate a policy/SOP answer should be under 60 seconds for a well-indexed query, with search/AI/analytics/document-processing scaling independently at enterprise scale (millions of assets/users/searches) [NEEDS CLARIFICATION: no further numeric thresholds stated in source beyond the 60-second SC-002 target].

**Constraints**: Zero AI Copilot response asserting a factual, organization-specific claim may omit a verifiable source citation and confidence score when an approved source exists, and responses lacking one must be visibly distinguished as unsourced/low-confidence rather than authoritative (FR-022, SC-001; Constitution Article II); zero role-restricted knowledge content (full text, preview/snippet, or AI citation) may be exposed to an unauthorized user through any surface — Search, Copilot, Wiki, or Collaboration Workspace (FR-039, SC-005); 100% of AI Copilot interactions, knowledge access events, and permission/administrative changes must be captured in the immutable audit log (FR-041, SC-006); 100% of published knowledge assets must carry a recorded owner, reviewer/approver, and review schedule at publication (SC-003).

**Scale/Scope**: 13 entities, 51 FRs (FR-001–FR-051, including FR-042a), 8 user stories, 12-stage governed knowledge-asset lifecycle, 10 Knowledge Base categories, 15 Knowledge Domains, 14 connected Search repository types, 9 preserved NEEDS CLARIFICATION items (1 explicitly self-flagged by spec.md, 8 from Edge Cases), no worsening of any of the 8 previously-accumulated Wave 2/3 architecture gaps, one sharpened reuse decision with `008` (§1, upgraded from a general assumption to a precise, verified module-level match), and one new cross-feature dependency surfaced and resolved with `004` (§3) — the fifth consecutive feature this session to surface an uncaught overlap during planning. This opens Wave 4.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Knowledge quality scores, AI confidence scores, and access-control decisions are all server-computed, never client-asserted. |
| II. AI Is Assistive, Never Autonomous | PASS — **FR-text-verbatim cited** ("Principle II") | FR-022 explicitly cites "constitutional Principle II"; every Copilot/Wiki/Search/Collaboration/Dashboard AI output remains advisory with confidence scoring and human-verification framing (FR-023, FR-024, FR-050). |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | FR-022 bars presenting an unsourced answer as authoritative (no fabricated confidence). |
| IV. Historical Immutability | PASS | FR-041 maintains immutable audit records for document creation/updates/version changes/approval actions never retroactively altered. |
| V. Ledger-Based Internal Economies | N/A | This chapter has no internal balance/points/wallet construct. |
| VI. Consent Is First-Class, Per-Channel, and Versioned | N/A | This is an internal enterprise-employee tool with no direct external customer-communication surface. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS (reused, not redefined) | FR-039's RBAC/ABAC configures `001`'s/`016`'s existing layered permission hierarchy (per §4). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Knowledge quality scores and search ranking are evidence/content-based (FR-009, FR-031) rather than purchasable or vanity-metric-driven. |
| IX. Action Before Consumption | PASS | Every knowledge asset progresses through a governed 12-stage lifecycle toward publication/review (FR-006), not passive storage. |
| Localization & Language Requirements | PASS — self-applied per Assumptions | Spec.md's own Assumptions treat Tamil/Tanglish/English as first-class languages for Wiki/Knowledge Base/Search/Copilot, consistent with the constitution, even though the source chapter itself does not enumerate specific languages. |
| Security & Compliance Baseline | PASS (one item explicitly deferred) | FR-040/FR-041 (encryption, immutable audit logs) align with the baseline; the specific named compliance-framework mapping remains an explicit NEEDS CLARIFICATION (FR-042a, §5). |

## Project Structure

### Documentation (this feature)

```
specs/050-enterprise-knowledge-management/
├── spec.md
├── plan.md
├── research.md         # 9 NEEDS CLARIFICATION items from §5
├── data-model.md        # 13 entities
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── copilot-response-source-attribution-or-low-confidence.contract.md
    ├── zero-unauthorized-knowledge-exposure.contract.md
    └── immutable-audit-log-full-coverage.contract.md
```

### Source Code (repository root)

```
backend/src/modules/kms/
├── knowledge-sources-processing/       # FR-001-008 — ingestion, Document Intelligence, Knowledge Profile, domains
├── knowledge-intelligence/             # FR-009-018 — knowledge graph, analytics, knowledge base
├── ai-knowledge-copilot/               # FR-019-024 — consumes 008's ai-rag pipeline (canonical reuse, per §1)
├── enterprise-wiki/                    # FR-025-028 — collaborative pages, AI Wiki Intelligence
├── intelligent-search/                 # FR-029-032 — semantic search, access-control enforcement
├── collaboration-workspace/            # FR-033-036 — co-authoring, AI Collaboration Intelligence
├── knowledge-governance/               # FR-037-038 — ownership, review cycles, taxonomy, retention
├── security-compliance/                # FR-039-042a — RBAC/ABAC/MFA/SSO, immutable audit, AI security governance
├── organizational-learning/            # FR-043-046 — reuses 004's Learning Path/Course engine (per §3)
└── dashboard-portal-reporting/         # FR-047-051 — Knowledge Management Dashboard, Enterprise Knowledge Portal
└── common/
    # reused from 008 (ai-rag pipeline, AI Citation, AI gateway), 004 (Learning Path/Course/Assessment/Certification),
    # 001/016 (RBAC/ABAC), 062 (general document storage — forward-declared, unverified)

web/app/(admin)/kms/
├── knowledge-copilot/
├── document-intelligence/
├── wiki/
├── search/
├── collaboration-workspace/
├── governance/
├── organizational-learning/
└── dashboard-portal/
```

**Structure Decision**: `ai-knowledge-copilot` and `knowledge-sources-processing` are built and contract-tested first — the Copilot is explicitly named the "primary interface for interacting with enterprise knowledge" and the highest-value, highest-risk capability (hallucination risk), while Document Intelligence is the ingestion foundation every other capability (Search, Wiki, Copilot, Knowledge Base) depends on to have governed, searchable content to operate over.

## Complexity Tracking

*No constitutional violations identified. This section intentionally left empty.*
