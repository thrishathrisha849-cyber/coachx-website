# Implementation Plan: Enterprise Digital Asset Management (DAM) & Digital Rights Management

**Branch**: `051-digital-asset-management` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/051-digital-asset-management/spec.md`

## Summary

This feature builds the Enterprise Digital Asset Management (DAM) platform described in Volume 14 Part 2 Chapter 18: an ingestion pipeline (virus scan, integrity validation, metadata extraction, thumbnail generation, duplicate detection, AI classification, security classification, copyright capture, brand-compliance pre-check) producing a governed Digital Asset with a standardized profile and configurable repository/collection structure; Media Intelligence across images/video/audio (object detection, scene/shot/logo/text recognition, transcription, quality/accessibility analysis); AI Media Management (auto-tagging, summarization, creative-assistance, content adaptation) with mandatory human review before publication; Creative Operations Management (request-to-delivery workflow with a Creative Project Workspace); Digital Rights Management (per-asset Rights Profile with geo/language/channel scope, expiration monitoring, and AI Rights Intelligence that is advisory-only pending human legal approval); Brand Governance (Brand Asset Library, Brand Guidelines Center, automated Brand Approval Workflow, Enterprise Brand Score); Asset Distribution & CDN (secure/time-limited/watermarked delivery); Intelligent Asset Search (semantic, visual, reverse-image); the Digital Asset Portal; Asset Analytics/Dashboard/Reporting; and Security & Compliance (RBAC/ABAC, encryption, immutable audit).

This chapter is not directly named by the constitution, but its Assumptions self-apply "AI Is Assistive, Never Autonomous" across every AI capability (tagging, risk detection, brand compliance, distribution recommendations, executive insights), and its own FR text repeatedly states human-approval requirements verbatim ("Human approval shall remain mandatory for all legal enforcement decisions," FR-036; "AI-generated creative recommendations MUST NOT be published automatically," FR-021).

**Per explicit instruction, this plan performs a formal ownership and dependency analysis against Features 001, 004, 008, 016, and 050 before any Project Structure decisions are made**, in addition to the two overlaps spec.md's own Assumptions already flag (`011`, `062`).

## Ownership & Dependency Analysis

### §1. RBAC/ABAC vs. `001` (canonical engine) and `016` (layered-extension pattern) — reuse decision made explicit

Verified against `001`'s actual plan.md/spec.md: `001` is the canonical source of the platform's core RBAC model — its `rbac/` module owns `Role`, `Permission`, and the `Access Control Decision` engine (FR-084–FR-089), with backend enforcement and a denial-reason taxonomy, not merely a constitutional reference. Verified against `016`'s actual plan.md/spec.md: `016` does not rebuild a parallel authorization model — it is explicitly described as "layered on top of, not a replacement for" `001`'s core engine, defining its own module-specific roles, permission groups, and approval chains (10 marketing roles, 4-step approval chains, temporary/delegated access) as a **configuration** of `001`'s engine.

**Ownership decision**: `051` follows the identical pattern `016` already establishes. FR-064's RBAC/ABAC/MFA/SSO requirements are implemented as DAM-specific roles, permission groups, and approval chains (e.g., Brand Team, Legal Reviewer, Creative Lead, External Agency Collaborator) configured on top of `001`'s `Role`/`Permission`/`Access Control Decision` engine — not a new authorization model, and not a hard dependency on `016`'s marketing-specific role set. Attribute-Based Access Control (department, project membership, security classification) extends the same engine's attribute-matching rather than introducing a second access-control system, per the user's Rule 4.

### §2. AI infrastructure vs. `008` — partially clean, partially an explicit architecture gap (Rule 2, Rule 5)

Verified against `008`'s actual plan.md/spec.md: `008` owns an `ai-gateway` (provider routing, secrets, streaming), an `ai-voice` module (speech-to-text/TTS, FR-057–FR-059), and an `ai-vision-document` module (image describe/caption/design-analysis, document text-extraction/chunking/embedding, FR-060–FR-064). These directly cover three pieces of this chapter's needs: (a) all AI provider routing for this feature MUST go through `008`'s gateway rather than a new provider-integration layer; (b) audio transcription (FR-015's speech-to-text) reuses `008`'s `ai-voice` module; (c) basic image captioning (part of FR-013) and document text-extraction/OCR-for-text-documents (part of FR-013/FR-020) reuse `008`'s `ai-vision-document` module.

However, `008`'s own spec.md **explicitly prohibits** face-identity confirmation and "invasive profiling" (FR-060/FR-061) and defines no primitive for object detection, scene recognition, logo detection, video shot/keyframe detection, or speaker identification — the computer-vision/video-analysis primitives this chapter's Media Intelligence (FR-013, FR-014) actually requires. `008`'s own Assumptions explicitly defer "deeper enterprise AI/ML infrastructure" beyond assistant-facing use to **`066-ai-ml-platform-autonomous-agents`** (Wave 5, not yet planned).

**Ownership decision (Rule 5 applied)**: this plan does **not** invent a new, parallel computer-vision/video-analysis provider architecture to fill this gap. Per the user's explicit instruction to preserve a NEEDS CLARIFICATION gate rather than invent a new architecture when ownership is unclear, this is recorded as an open dependency on `066` (§6) rather than resolved here. `051`'s Media Intelligence design MUST route every AI call it can (transcription, basic captioning, document text extraction) through `008`'s existing gateway/voice/vision-document modules, and MUST NOT build a duplicate provider-integration layer for those covered capabilities — but object detection, scene/logo recognition, and video-specific analysis remain an explicit, unresolved infrastructure dependency pending `066`.

### §3. Knowledge Management (`050`) — new finding: overlapping asset-type claims, not caught by either spec

`050`'s Knowledge Document/Asset governs 15 document types including "presentations," "training manuals," and "multimedia documents," feeding the AI Knowledge Copilot, Enterprise Search, and Wiki. `051`'s Digital Asset governs 26 asset types including "presentations," "documents," "PDF files," and "training materials," feeding Brand Governance, Rights Management, and CDN Distribution. Both lists independently include "presentations" and document/training-material content, and neither `050`'s nor `051`'s spec.md Assumptions cross-reference the other at all — despite `051` immediately following `050` in the chapter sequence and despite `050`'s own Assumptions extensively cross-referencing `008`, `004`, and `062` (but never `051` or forward to Chapter 18).

**Ownership decision (Rule 5 applied — preserved as NEEDS CLARIFICATION, not invented)**: the source PRD does not state a boundary between these two chapters' overlapping asset-type claims, so this plan does not invent one. A **recommended, unconfirmed** purpose-based distinction is documented for future reconciliation: `050` (KMS) owns text-content knowledge assets whose purpose is answering employee questions (policies, SOPs, internal knowledge documents indexed for the AI Knowledge Copilot and enterprise knowledge search); `051` (DAM) owns rich-media and creative/brand assets whose purpose is brand governance, licensing/rights compliance, and external/partner distribution (marketing creatives, campaign assets, brand templates, licensed stock media, and customer-facing presentation/training collateral). Where a specific file (e.g., an internal all-hands slide deck vs. a customer-facing sales deck) could plausibly belong to either system, this plan does not pick a side — it is logged as an open reconciliation item (§6) for a dedicated cross-feature consolidation pass, consistent with how the `013`/`024`/`045` lead-scoring-scale ambiguity was preserved earlier this session rather than resolved by assumption.

### §4. LMS (`004`) — confirmed no overlap

Verified against `004`'s actual plan.md/spec.md: `004` owns `Lesson Content` and `Lesson Resource` entities (including video/PDF delivery) that are narrowly scoped to the LMS course-consumption experience — not a general-purpose asset library, and no generic "digital asset" or cross-feature media entity exists in `004`. Per Rule 3 (do not duplicate LMS entities already owned by `004`), `051` does not redefine or absorb `004`'s Lesson Content/Resource entities. **Ownership decision**: no reuse dependency exists in either direction; `004`'s lesson media is a potential *future* downstream consumer of the DAM (e.g., a course video eventually managed as a governed Digital Asset) but this spec does not require or assume that integration — it is out of scope for this planning pass.

### §5. Secure delivery/watermarking (`011`) and Document Management (`062`) — confirmed / CONFIRMED with a refinement (updated 2026-07-24, per `062/plan.md` §1)

Spec.md's own Assumptions state `051`'s Asset Distribution & CDN and Digital Rights Management reuse `011`'s buyer-facing secure-delivery/watermarking infrastructure for the enterprise-internal/B2B equivalent, rather than duplicating it. Verified against `011`'s actual plan.md: `011` is directly named in the constitution's Security & Compliance Baseline ("Vol 11: signed URLs, watermarking") with signed, time-limited, watermarked digital downloads as an existing, confirmed capability. **Ownership decision**: `051`'s FR-048–FR-050 (secure/time-limited/password-protected/watermarked share links, tokenized URLs) extend `011`'s existing signed-URL/watermarking mechanism rather than reimplementing it.

Spec.md's own Assumptions also state general-purpose business-document lifecycle management (contracts, policies, records-retention-driven office documents) is deferred to `062-document-management-dms`, with rich media/brand/creative assets remaining DAM-governed. `062` has now been planned and confirms this boundary from its own side (`062/plan.md` §3), while noting the `050`/`051` asset-type-boundary NEEDS CLARIFICATION (§3 of this plan) remains open — `062`'s Retention Tier/Legal Hold system applies orthogonally on top of whichever of `050`/`051` governs a given asset's type, not a resolution of that boundary. A related refinement: this feature's own FR-007 ("retention policy" governing prior-version accessibility) and FR-012 ("Secure Disposal" lifecycle stage) are basic mentions of a concept `062` now owns in much greater depth (named Retention Tiers, Legal Hold, Immutable Storage, disposal-batch exclusion) — this feature's retention/disposal references should be understood as delegating to `062`'s canonical mechanics, not as an independent, competing implementation.

### §6. Preserved NEEDS CLARIFICATION items (from spec.md's own explicit flags and Edge Cases, plus §2 and §3's new findings — not resolved here)

- Media Quality Score and Enterprise Brand Score weighting formula — explicitly flagged by spec.md itself as not specified in source.
- Numeric SLA thresholds (search response time, CDN delivery latency, storage capacity limits) — explicitly flagged by spec.md itself.
- The `008`/`066` computer-vision/video-analysis infrastructure gap (§2) — object detection, scene/logo recognition, speaker identification, and video-specific analysis have no owning feature yet; `066` is the source-implied future home, not yet planned.
- The `050`/`051` overlapping asset-type boundary (§3) — no source-stated resolution; a purpose-based distinction is recommended but unconfirmed.
- Handling of an asset whose Rights Profile expires mid-campaign — flag and alert without silently pulling the asset, per Edge Cases.
- False-positive AI copyright-risk dismissal path without requiring re-upload or losing audit history (Edge Cases).
- Near-duplicate (cropped/resized/recompressed/watermarked) brand-asset coexistence prevention (Edge Cases).
- Region-mismatched CDN edge-node delivery blocking for geo-restricted assets (Edge Cases).
- Detection of protected-brand-zone bypass occurring outside the standard submission workflow (Edge Cases).
- Duplicate-license conflict detection across two independently uploaded assets referencing the same license (Edge Cases).
- Per-jurisdiction kill switch for facial recognition/speaker identification where not legally permitted (Edge Cases, Assumptions).
- Single source-of-truth resolution when an asset is simultaneously eligible under this DAM, `062` (DMS), and `011` (Marketplace licensed downloads) (Edge Cases).

None of these are silently resolved; each remains an open gate for a future clarification pass.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web), Dart 3.x (mobile) — consistent with 001–050.

**Primary Dependencies**: NestJS, Next.js; `001`'s `Role`/`Permission`/`Access Control Decision` RBAC engine, configured per `016`'s layered-extension pattern (per §1); `008`'s `ai-gateway`/`ai-voice`/`ai-vision-document` modules for provider routing, transcription, and basic captioning/document-text-extraction (per §2); `011`'s signed-URL/watermarking infrastructure for secure distribution (per §5); `066` (not yet planned) as the open dependency for computer-vision/video-analysis primitives (per §2, §6).

**Storage**: PostgreSQL (12 entities per Key Entities: Digital Asset, Asset Version, Rights Profile, Copyright Risk Flag, Brand Asset/Brand Guideline, Asset Tag/Metadata Record, Brand Compliance Alert, Distribution Channel/Distribution Record, Creative Request/Creative Project, Asset Collection, Media Quality Score/Enterprise Brand Score, Audit Log Entry).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: asset-gated-until-scan-and-classification for SC-001, rights-scope-blocks-out-of-scope-distribution for SC-002, and ai-risk-flag-zero-auto-enforcement for SC-003), Playwright (web e2e — asset upload/AI processing, Brand Approval Workflow, Rights Profile creation/validation, Creative Project Workspace, secure share-link distribution).

**Target Platform**: Web (Enterprise Digital Asset Portal, rendered inside `017`'s workspace shell for internal users; external agency/partner access is project-scoped per FR-031).

**Performance Goals**: Per spec.md's own preserved NEEDS CLARIFICATION, no numeric SLA thresholds (search response time, CDN latency, storage capacity) are stated in source.

**Constraints**: Zero newly uploaded asset becomes visible outside the uploader's private workspace before virus scan/format-integrity validation/metadata extraction/AI classification complete (FR-006, SC-001); zero asset with an attached Rights Profile may be downloaded/distributed outside its licensed geographic/language/channel scope without an explicit, audited override (FR-037, SC-002); zero AI-generated copyright-risk or unauthorized-usage flag may trigger automatic enforcement without human reviewer approval (FR-036, SC-003; Constitution Article II); zero expired/archived/deprecated brand asset may be used in an active campaign or Brand Kit (FR-045, SC-004); zero external agency/partner/freelancer user may see assets or information outside their assigned project/distribution channel (FR-031, SC-008).

**Scale/Scope**: 12 entities, 69 FRs, 8 user stories, 12-stage governed asset lifecycle, 10-status Brand Approval Workflow's parent asset-status lifecycle, 12 preserved NEEDS CLARIFICATION items (2 explicitly self-flagged by spec.md, 8 from Edge Cases, 2 newly surfaced by this plan's §2/§3), no worsening of any of the 8 previously-accumulated Wave 2/3 architecture gaps, one confirmed-clean reuse chain with `001`/`016` (RBAC), `008` (partial — gateway/voice/document-text), and `011` (secure delivery), one confirmed-no-overlap with `004`, and two explicit new NEEDS CLARIFICATION gates opened rather than silently resolved (`008`/`066` computer-vision gap; `050`/`051` asset-type boundary) — the sixth consecutive feature this session to surface a genuine, previously-uncaught cross-feature dependency question during planning.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Asset lifecycle status, brand/rights compliance status, and quality scores are all server-computed, never client-asserted. |
| II. AI Is Assistive, Never Autonomous | PASS | FR-021, FR-025, FR-036, FR-044, FR-063, FR-068 all require human review/approval before an AI output (creative recommendation, risk enforcement, brand decision, executive insight) takes effect; SC-003 states a zero-tolerance success criterion for automatic enforcement. |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | FR-021 bars automatic publication of AI-generated creative recommendations without approved governance workflows. |
| IV. Historical Immutability | PASS | Asset Version maintains immutable, timestamped revisions (FR-007); Audit Log Entry captures before/after state for every material change (FR-066). |
| V. Ledger-Based Internal Economies | N/A | This chapter has no internal balance/points/wallet construct. |
| VI. Consent Is First-Class, Per-Channel, and Versioned | PASS (partial, jurisdiction-gated) | Facial recognition/speaker identification are assumed to require a configurable per-region legal-basis kill switch (Assumptions; Edge Cases), consistent with consent-and-legal-basis principles, though not the standard marketing-consent model. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS — reuse decision made explicit (§1) | FR-064's RBAC/ABAC configures `001`'s engine per `016`'s layered-extension pattern rather than a new authorization model. |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Media Quality Score and Enterprise Brand Score are evidence/factor-based (FR-017, FR-044) rather than purchasable or vanity-metric-driven. |
| IX. Action Before Consumption | PASS | Every asset progresses through a governed 12-stage lifecycle toward publication/distribution (FR-012), not passive storage. |
| Localization & Language Requirements | PASS (inherited) | FR-022 requires language-variant content adaptation; broader Tamil/Tanglish handling is inherited from `020`/`021`/`050`'s established patterns rather than redefined here. |
| Security & Compliance Baseline | PASS | FR-064–FR-069 (RBAC/ABAC/MFA/SSO, encryption, immutable audit, risk management, AI security governance, configurable compliance) align with the baseline. |

## Project Structure

### Documentation (this feature)

```
specs/051-digital-asset-management/
├── spec.md
├── plan.md
├── research.md         # 12 NEEDS CLARIFICATION items from §6
├── data-model.md        # 12 entities
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── asset-gated-until-scan-and-classification.contract.md
    ├── rights-scope-blocks-out-of-scope-distribution.contract.md
    └── ai-risk-flag-zero-auto-enforcement.contract.md
```

### Source Code (repository root)

```
backend/src/modules/dam/
├── asset-sources-processing/       # FR-001-012 — ingestion, Digital Asset profile, lifecycle (canonical)
├── media-intelligence/             # FR-013-019 — routes text/voice/basic-image AI through 008; CV/video gap flagged (per §2)
├── ai-media-management/            # FR-020-026 — auto-tagging, creative assistance, human-review gated
├── creative-operations/            # FR-027-031 — request-to-delivery workflow, Creative Project Workspace
├── digital-rights-management/      # FR-032-037 — Rights Profile, AI Rights Intelligence (advisory-only)
├── brand-governance/                # FR-038-046 — Brand Asset Library, Brand Approval Workflow, Enterprise Brand Score
├── asset-distribution-cdn/         # FR-047-051 — extends 011's signed-URL/watermarking (per §5)
├── intelligent-asset-search/       # FR-052-054
├── digital-asset-portal/           # FR-055-058
├── asset-analytics-dashboard/      # FR-059-063
└── security-compliance/            # FR-064-069 — RBAC/ABAC on 001's engine per 016's pattern (per §1)
└── common/
    # reused from 001 (RBAC engine), 016 (layered-RBAC-extension pattern), 008 (AI gateway/voice/vision-document,
    # partial — CV/video gap open per §2/§6), 011 (signed-URL/watermarking), 062 (general document storage — forward-declared, unverified)
    # NO reuse claimed from 004 (confirmed no overlap, per §4)

web/app/(admin)/dam/
├── asset-repository/
├── brand-asset-library/
├── creative-workspace/
├── rights-compliance/
├── distribution-center/
├── search/
├── analytics-dashboard/
└── governance-admin/
```

**Structure Decision**: `asset-sources-processing` is built and contract-tested first — ingestion and AI-assisted classification is the foundation the entire DAM depends on, per spec.md's own User Story 1 rationale. `digital-rights-management` and `brand-governance` follow immediately given they are named hard governance requirements (not optional enhancements) gating legal distribution and brand-integrity protection respectively.

## Complexity Tracking

*No constitutional violations identified. This section intentionally left empty.*
