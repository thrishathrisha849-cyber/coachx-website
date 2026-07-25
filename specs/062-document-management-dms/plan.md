---
description: "Implementation plan for Feature 062 — Enterprise Document Management System (DMS) & Records Management"
---

# Implementation Plan: Enterprise Document Management System (DMS) & Records Management

**Branch**: `062-document-management-dms` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/062-document-management-dms/spec.md`

## Summary

This feature (Volume 14, Chapter 29) is the third pass over KMS (`050`)/DAM (`051`) territory, and is unusually disciplined about it: spec.md's own FR-041/FR-042 explicitly cite `050` as canonical for Knowledge Base/AI Copilot and `051` as canonical for rich-media DAM/DRM, focusing this feature's genuinely distinctive contribution on **Records Management** — named Retention Tiers, Legal Hold overriding retention-expiry disposal, Immutable Storage, and Secure Disposal — plus the core document lifecycle/approval/e-Signature engine and a Digital Workspace productivity surface. Article II (AI Is Assistive, Never Autonomous) is FR-text-cited at FR-036, requiring human approval before any consequential AI-recommended action (disposal, reclassification, publication).

## Ownership & Dependency Analysis

### §1. Records Management/Retention/Legal Hold Canonicity vs. `050`/`051` — directionally CONFIRMED, with a factual refinement neither spec states

Spec.md's own Assumptions claim this feature is "the canonical spec for Records Management, Retention, and Legal Hold... not covered by Feature 050 or Feature 051." Verified against both features' actual spec.md text rather than trusted at face value: `050` FR-006 already lists "retention management, secure disposal" as stages in its knowledge lifecycle, and its FR-007 Knowledge Profile already includes a "retention policy" field; `051` FR-012 already lists "Secure Disposal" as a lifecycle stage, and its FR-007 references "retention policy" governing which prior asset versions remain accessible. Neither goes anywhere near this feature's depth (no named tiers, no Legal Hold, no immutable-storage mechanism, no disposal-batch exclusion, no compliance reporting) — but the claim that retention/disposal is "not covered" by either is not quite accurate; both have surface-level mentions.

**Ownership decision**: CONFIRMED, with refinement — `062` remains correctly canonical for the actual Retention Tier/Legal Hold/Secure Disposal *mechanics*, the same "basic mention in an earlier chapter, deep canonical treatment in a later one" pattern this session has repeatedly found (most recently `013`/`045` Territory in `060`). `050`'s and `051`'s existing "retention policy" fields and "retention management"/"Secure Disposal" lifecycle-stage mentions should now be understood as delegating to `062`'s canonical system, not as independent, competing mechanics. (See the note at the end of this plan regarding a clarifying addition to `050/plan.md` and `051/plan.md`.)

### §2. Knowledge Base/AI Copilot vs. `050` — confirmed clean, citation accuracy spot-verified

Spec.md's own FR-041 and Assumptions state `050` is canonical for Knowledge Base/Wiki/AI Copilot, and this feature's search (FR-029) and AI (FR-033/034) are scoped to the DMS/Records repository, cross-referencing `050`'s specific FR numbers. Spot-verified against `050`'s actual spec.md: FR-029 (Intelligent Enterprise Search), FR-004 (Document Intelligence), and FR-019 (AI Knowledge Copilot) all confirmed to exist and match the cited claims accurately. **Ownership decision**: CONFIRMED — this feature's search/AI capabilities are DMS/Records-repository-scoped layers, not a second knowledge platform, consistent with the citation discipline `060` also demonstrated against `013`/`045`.

### §3. Digital Asset Management/DRM vs. `051` — confirmed clean, clarifies but does not resolve the pre-existing `050`/`051` asset-type boundary

Spec.md's own FR-042 states `051` is canonical for rich-media DAM/DRM, and this feature's Records Management applies to "generic business documents and records rather than rich-media assets." This does not resolve `051/plan.md`'s own already-open NEEDS CLARIFICATION (the `050`/`051` asset-type-boundary ambiguity for "documents/presentations/training materials") — but it does clarify the shape of the problem: `062`'s Retention Tier/Legal Hold system is an **orthogonal compliance-lifecycle concern** that can apply on top of whichever system (`050` or `051`) governs a given piece of content's type/structure, not a third competing claim to the same content-type territory. **Ownership decision**: `062` does not need the `050`/`051` boundary resolved to function correctly — Records Management attaches to any Document Record regardless of whether that record is also a `050` Knowledge Asset or a `051` Digital Asset — but this plan explicitly notes the boundary question remains open for whoever resolves it.

### §4. Enterprise Integrations vs. `061` (Project Management) — confirmed bidirectionally

Spec.md's own FR-040 names "Project Management" among 14 integration targets. Verified against `061`'s actual plan.md: `061/plan.md` §7 already forward-declares this feature (`062`) as the deferred target for its Document Collaboration requirement (FR-025), naming it by feature number since `062` was next in the planning queue. **Ownership decision**: CONFIRMED, bidirectionally — `061`'s project-scoped document collaboration consumes this feature's DMS rather than building a parallel document store.

### §5. AI Knowledge Intelligence vs. `008` (AI Assistant Platform) — confirmed clean, gateway reused

Consistent with the reuse pattern established for `056`–`061`. **Ownership decision**: this feature's AI classification/metadata-generation and operational-query assistant (FR-033–FR-036) reuse `008`'s `ai-gateway`/`ai-guardrails` for provider access and governance, with the DMS/Records-metadata-grounded query logic as this feature's own scoped build — narrower in scope than `050`'s general-purpose AI Knowledge Copilot per §2.

### §6. Auth & RBAC vs. `001`/`016` — confirmed clean, standard layered-extension pattern

Not mentioned in spec.md's own Assumptions beyond a generic RBAC reference (FR-039). **Ownership decision**: Folder-Level and File-Level Permissions (FR-039) configure `001`'s/`016`'s existing layered RBAC engine per the established extension pattern, applied to document/records-management-specific roles (records manager, legal/compliance, document owner).

### §7. Approval Workflow Types vs. `063` (Workflow Automation, BPM & Low-Code Platform) — cross-reference added 2026-07-24, per `063/plan.md` §1

`063` has now been planned as the platform's general-purpose, dedicated BPM/Workflow/Approval-Automation chapter, and its own plan.md §1 identifies this feature's FR-026 (8 configurable approval workflow types: Single, Multi-Level, Sequential, Parallel, Conditional, Emergency, Department, Executive Approval) as a domain-specific application of the approval-chain mechanics `063` defines canonically. **Ownership decision**: this feature's Draft→Review→Corrections→Approval→e-Signature→Publication approval chain (FR-027) should be understood, at implementation time, as configuring `063`'s general-purpose Approval Automation engine for document-approval-specific workflow types, rather than as an independently built parallel approval implementation. This is a documentation-level cross-reference only; no functional requirement, entity, or task in this feature changes as a result.

## Technical Context

**Language/Version**: TypeScript 5.x (backend, web) — consistent with 001–061.

**Primary Dependencies**: `050`'s canonical Knowledge Base/AI Copilot, with its existing "retention policy" field now understood as delegating to this feature's deeper mechanics (per §1–§2); `051`'s canonical rich-media DAM/DRM, with the `050`/`051` asset-type boundary left open and this feature's Records Management applying orthogonally on top of either (per §1, §3); `061`'s Document Collaboration as a confirmed consumer (per §4); `008`'s AI gateway/guardrails for AI classification and the operational-query assistant (per §5); `001`/`016`'s layered RBAC for folder/file-level permissions (per §6).

**Storage**: PostgreSQL (10 entities per Key Entities: Document Record, Retention Tier, Legal Hold, Disposal Record, e-Signature, Version, Approval Workflow Instance, Governance Alert/Compliance Score, Audit Trail Entry, Digital Workspace).

**Testing**: Jest (backend — three Foundational contract tests matching this spec's own highest-stakes Success Criteria: secure-disposal-zero-execution-against-active-legal-hold for SC-002, published-document-100pct-completed-approval-workflow for SC-005, and ai-dms-recommendation-zero-autonomous-consequential-action for SC-009), Playwright (web e2e — retention-tier assignment, legal-hold placement/release, draft-to-publish approval/e-signature flow, secure disposal batch exclusion).

**Target Platform**: Web (DMS console, Governance Dashboard, Digital Workspace).

**Performance Goals**: Per SC-008, the Governance Dashboard must reflect current Compliance Score, Retention Status, and Security Violation counts without manual reconciliation, at a near-real-time cadence.

**Constraints**: Zero Secure Disposal action may execute against a record with an active Legal Hold, even past retention expiry (FR-012, SC-002); a "Permanent" Retention Tier record is permanently excluded from disposal eligibility (FR-009); a record under active Legal Hold or within its active retention period must not be alterable through version-update or collaborative-editing actions (FR-025); zero document may reach Published status with a skipped or bypassed approval stage (FR-027, SC-005); zero AI recommendation leading to a consequential action may execute without explicit human approval (FR-036, SC-009).

**Scale/Scope**: 10 entities, 42 FRs (2 of which — FR-041/042 — are explicit cross-reference citations to `050`/`051`, not re-implemented), 8 user stories, 12 supported document types, 10 record categories, 7 named retention tiers, 6 security levels, 8 approval workflow types, 10 AI/enterprise-search capability groupings, 9 preserved NEEDS CLARIFICATION items (3 explicitly self-flagged: immutable-storage technical mechanism, e-signature legal-validity framework, plus 6 from Edge Cases), one directionally-confirmed-with-refinement finding against both `050` and `051` (§1, neither is "not covered" — both have basic mentions this feature's mechanics now supersede), and one confirmed bidirectional integration with `061` (§4). This is the fifteenth consecutive feature this session to surface a genuine, previously-uncaught cross-feature nuance during planning.

## Constitution Check

| Article / Section | Status | Notes |
|---|---|---|
| I. Server-Authoritative State | PASS | Retention expiry calculation, legal-hold-vs-disposal-eligibility checks, and approval-stage gating are all server-enforced, never client-asserted (FR-008, FR-012). |
| II. AI Is Assistive, Never Autonomous | PASS — **FR-text-verbatim cited** | FR-036 explicitly requires human approval before any consequential AI-recommended action (disposal, reclassification, publication); the AI Assistant does not fabricate answers when no matching documents exist (FR-034, User Story 7 acceptance scenario 2). |
| III. No Dark Patterns, No Guaranteed-Outcome Claims | PASS | AI recommendations present Confidence Score and Risk Level transparently (FR-035), not as guaranteed outcomes. |
| IV. Historical Immutability | PASS — **FR-text-verbatim cited, a central control** | FR-013 (Immutable Storage during retention/hold) and FR-015 (immutable Audit Trail of every legal-hold action) directly implement Article IV; every status transition is recorded (FR-004). |
| V. Ledger-Based Internal Economies | N/A | No financial ledger surface in this feature's scope. |
| VI. Consent Is First-Class, Per-Channel, and Versioned | N/A | Internal enterprise document/records tool; no direct customer-communication-consent surface. |
| VII. Layered, Explicit RBAC With Approval Chains | PASS | FR-026 requires 8 configurable approval workflow types; FR-039 requires RBAC with folder/file-level permissions, configuring `001`'s/`016`'s existing engine (per §6). |
| VIII. No Pay-to-Win, No Vanity-Metric Optimization | PASS | Compliance Score and Governance Health are operational transparency metrics, not purchasable status. |
| IX. Action Before Consumption | PASS | Every document progresses through a governed Draft→Review→Approval→e-Signature→Publication lifecycle before being considered Published (FR-027). |
| Localization & Language Requirements | PASS (not primary focus, inherited) | Internal enterprise tool; Tamil/Tanglish/English assumed first-class for Workspace/Search/AI surfaces per spec.md's own Assumptions. |
| Security & Compliance Baseline | PASS | FR-039 directly enumerates Encryption at Rest/Transit, MFA, DLP, Backup & DR, Compliance Monitoring. |

## Project Structure

### Documentation (this feature)

```
specs/062-document-management-dms/
├── spec.md
├── plan.md
├── research.md         # 9 NEEDS CLARIFICATION items (3 self-flagged, 6 from Edge Cases)
├── data-model.md        # 10 entities (Records Management applies orthogonally to 050/051 content, per §1/§3)
├── quickstart.md         # 8 user-story validation walkthrough
└── contracts/
    ├── secure-disposal-zero-execution-against-active-legal-hold.contract.md
    ├── published-document-100pct-completed-approval-workflow.contract.md
    └── ai-dms-recommendation-zero-autonomous-consequential-action.contract.md
```

### Source Code (repository root)

```
backend/src/modules/dms-records/
├── document-core-foundation/         # FR-001-004 — document lifecycle, Document Profile
├── records-retention/                # FR-005-009 — Record Categories, named Retention Tiers
├── legal-hold/                       # FR-010-015 — hold placement/release, immutable storage during hold
├── secure-disposal-compliance/       # FR-016-018 — disposal workflow, compliance reporting
├── approval-workflows-esignature/    # FR-026-028 — 8 workflow types, e-Signature
├── version-control-collaboration/    # FR-022-025 — versioning, locking, conflict detection
├── enterprise-search-dms/            # FR-029-032 — DMS-scoped search, feeds unified search (per §2)
├── ai-dms-operational-assistant/     # FR-033-036 — DMS-scoped AI, narrower than 050's Copilot (per §5)
├── digital-workspace/                # FR-037-038 — personalized/team/project workspace
└── content-governance-remainder/     # FR-019-021, FR-039-040 — governance features, security, integrations
    # NOT redefined here: Knowledge Base/AI Copilot (050, per FR-041), rich-media DAM/DRM (051, per FR-042)
    # reused from 008 (AI gateway, per §5), 001/016 (RBAC, per §6); confirmed integration with 061 (per §4)

web/app/(admin)/dms-portal/
├── document-lifecycle/
├── records-retention-management/
├── legal-hold-admin/
├── governance-dashboard/
├── digital-workspace/
└── enterprise-search/
```

**Structure Decision**: `document-core-foundation` and `records-retention` are built and contract-tested first — spec.md's own User Story 1 rationale states nothing else in the chapter (legal hold, disposal, retention monitoring) can function until a record actually carries a retention assignment. `legal-hold` follows immediately given its explicit framing as inseparable from retention-tier assignment in practice (User Story 2 rationale).

## Complexity Tracking

*No constitution violations requiring justification. N/A.*

---

**Note on `050`/`051` plan.md updates**: §1 above finds spec.md's claim that retention/disposal is "not covered by Feature 050 or Feature 051" is not fully accurate — both already have basic "retention policy" field/lifecycle-stage mentions (`050` FR-006/FR-007, `051` FR-007/FR-012) that this feature's mechanics now supersede as the canonical deep implementation. This does not change either feature's ownership decisions, only refines the factual framing. Per this session's standing protocol, adding a brief clarifying note to `050/plan.md` and `051/plan.md` is recommended but not yet applied.
