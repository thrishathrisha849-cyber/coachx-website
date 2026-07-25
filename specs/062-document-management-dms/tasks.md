---
description: "Task list for Feature 062 — Enterprise Document Management System (DMS) & Records Management"
---

# Tasks: Enterprise Document Management System (DMS) & Records Management

**Input**: Design documents from `/specs/062-document-management-dms/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis refining the "not covered by 050/051" claim with specific verified evidence, clarifying the orthogonal relationship between Records Management and the pre-existing 050/051 asset-type boundary, and confirming bidirectional integration with 061), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC). This feature also assumes `050`'s Knowledge Base, `051`'s DAM/DRM, and `008`'s `ai-gateway`/`ai-guardrails` exist as consumption/coordination points.

**Tests**: Included throughout — the legal-hold-overrides-disposal gate, the completed-approval-workflow gate, and the AI-consequential-action human-approval gate each get a dedicated Foundational contract test, matching this spec's own SC-002, SC-005, and SC-009.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single story (Content Governance remainder, Security & Governance, Enterprise Integrations).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC), and that `050`'s Knowledge Base, `051`'s DAM/DRM, and `008`'s `ai-gateway`/`ai-guardrails` exist as consumption/coordination points
- [ ] T002 Resolve `research.md` open items before proceeding: the Immutable Storage technical mechanism (WORM/blockchain-anchored hash/cryptographic sealing, explicitly self-flagged), the applicable e-signature legal-validity framework (India IT Act 2000/eIDAS/ESIGN Act, explicitly self-flagged), the specific role(s) authorized to place/release Legal Holds, race conditions between concurrent legal-hold placement and in-flight disposal, overlapping-legal-hold release ordering, retroactive retention-tier-change auditing, merge-conflict resolution when automatic merge fails, immutability enforcement against workflow (not just direct-deletion) actions, and multi-signer e-signature failure/replacement handling
- [ ] T003 [P] Add `backend/src/modules/dms-records/{document-core-foundation,records-retention,legal-hold,secure-disposal-compliance,approval-workflows-esignature,version-control-collaboration,enterprise-search-dms,ai-dms-operational-assistant,digital-workspace,content-governance-remainder}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Document Record` entity in `backend/src/modules/dms-records/document-core-foundation/document-record.entity.ts`
- [ ] T005 [P] Define the `Retention Tier` entity in `backend/src/modules/dms-records/records-retention/retention-tier.entity.ts`
- [ ] T006 [P] Define the `Legal Hold` entity in `backend/src/modules/dms-records/legal-hold/legal-hold.entity.ts`
- [ ] T007 [P] Define the `Disposal Record` entity in `backend/src/modules/dms-records/secure-disposal-compliance/disposal-record.entity.ts`
- [ ] T008 [P] Define the `e-Signature` entity in `backend/src/modules/dms-records/approval-workflows-esignature/e-signature.entity.ts`
- [ ] T009 [P] Define the `Version` entity in `backend/src/modules/dms-records/version-control-collaboration/version.entity.ts`
- [ ] T010 [P] Define the `Approval Workflow Instance` entity in `backend/src/modules/dms-records/approval-workflows-esignature/approval-workflow-instance.entity.ts`
- [ ] T011 [P] Define the `Governance Alert / Compliance Score` entity in `backend/src/modules/dms-records/content-governance-remainder/governance-alert-compliance-score.entity.ts`
- [ ] T012 [P] Define the `Audit Trail Entry` entity in `backend/src/modules/dms-records/document-core-foundation/audit-trail-entry.entity.ts`
- [ ] T013 [P] Define the `Digital Workspace` entity in `backend/src/modules/dms-records/digital-workspace/digital-workspace.entity.ts`
- [ ] T014 Complete document lifecycle (Creation, Import, Classification, Metadata Assignment, Review, Approval, Publication, Distribution, Version Updates, Archive, Retention, Disposal) (FR-001)
- [ ] T015 20 supported document types (Word, PDF, Excel, PowerPoint, Images, Videos, Audio, CAD, Contracts, Policies, SOPs, Reports, Invoices, POs, HR Documents, Legal Documents, Technical Documents, Marketing Materials, Project Files, AI Generated Content) (FR-002)
- [ ] T016 Document Profile full field set (Document ID, Title, Description, Category, Department, Owner, Author, Tags, Keywords, Version Number, Status, Approval Status, Security Classification, Created/Modified Date, Expiry Date, Retention Policy, File Size/Type, Related Documents, Linked Projects), wired to T004 (FR-003)
- [ ] T017 Document Status lifecycle (Draft, Under Review, Pending Approval, Approved, Published, Archived, Expired, Deleted) with every transition recorded in audit history, wired to T012 (FR-004)
- [ ] T018 Reference, do not redefine: Knowledge Base Management (Knowledge Categories, Article Structure, Knowledge Features) — `050` is canonical, this feature's Document Records interoperate with `050`'s Knowledge Assets rather than duplicating their structure (FR-041)
- [ ] T019 Reference, do not redefine: Digital Asset Management (Supported Assets, Asset Metadata, Asset Features) — `051` is canonical for rich-media asset governance; this feature's Records Management applies to generic business documents and records, not rich-media assets (FR-042)
- [ ] T020 Note: retention/disposal is directionally correctly canonical to this feature, but `050` (FR-006/FR-007: "retention management, secure disposal" lifecycle stage, "retention policy" field) and `051` (FR-007/FR-012: "retention policy" reference, "Secure Disposal" lifecycle stage) both already have basic mentions that now delegate to this feature's deeper Retention Tier/Legal Hold mechanics — not entirely absent concepts as originally framed (per plan.md §1)
- [ ] T021 Note: this feature's search (FR-029) and AI (FR-033/034) citations against `050`'s FR-029/FR-004/FR-019 were spot-verified accurate, confirming DMS-repository-scoped search/AI as layers over `050`'s canonical Knowledge Base/AI Copilot, not a second platform (per plan.md §2)
- [ ] T022 Note: this feature's Retention Tier/Legal Hold system is an orthogonal compliance-lifecycle concern applying on top of whichever system (`050` or `051`) governs a given content's type/structure — it does not resolve, and does not need to resolve, the pre-existing `050`/`051` asset-type-boundary NEEDS CLARIFICATION (per plan.md §3)
- [ ] T023 Note: `061`'s Document Collaboration requirement (its own FR-025) already forward-declares this feature as its deferred target — confirmed bidirectionally, `061` consumes this feature's DMS rather than building a parallel document store (per plan.md §4)
- [ ] T024 Note: AI classification/metadata-generation and the operational-query assistant reuse `008`'s `ai-gateway`/`ai-guardrails`, with DMS/Records-metadata-grounded query logic as this feature's own scoped build, narrower than `050`'s general-purpose AI Knowledge Copilot (per plan.md §5)
- [ ] T025 Note: Folder-Level and File-Level Permissions configure `001`'s/`016`'s existing layered RBAC engine per the established extension pattern (per plan.md §6)
- [ ] T026 Contract test: zero Secure Disposal action executes against a record with an active Legal Hold, even past retention expiry, in `backend/tests/contract/secure-disposal-zero-execution-against-active-legal-hold.contract.test.ts` (SC-002)
- [ ] T027 Contract test: 100% of documents reaching Published status have passed through their fully configured approval workflow with no stage skipped or bypassed, in `backend/tests/contract/published-document-100pct-completed-approval-workflow.contract.test.ts` (SC-005)
- [ ] T028 Contract test: 100% of AI-generated recommendations that could lead to a consequential action (disposal, reclassification, publication) remain advisory/pending until explicit human approval is recorded, in `backend/tests/contract/ai-dms-recommendation-zero-autonomous-consequential-action.contract.test.ts` (SC-009)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Apply a Named Retention Tier to a Record (Priority: P1) 🎯 MVP

**Independent Test**: Classify a single document into a Record Category, apply one of the named Retention Tiers, and confirm the system persists the tier, calculates an expiry date, and surfaces the record's retention status on the Governance Dashboard.

- [ ] T029 [US1] Records Management across 10 Record Categories (Financial, HR, Legal, Procurement, Contracts, Audit Reports, Compliance Reports, Tax Documents, Project Records, Customer Records) (FR-005)
- [ ] T030 [US1] 7 named Retention Tiers (1/3/5/7/10 Year, Permanent, Custom Policies) assignable to any record, wired to T005, acceptance scenarios 1–2 (FR-006)
- [ ] T031 [US1] Retention Monitoring continuously tracking retention status and flagging records approaching/past expiry, wired to acceptance scenario 3 (FR-007)
- [ ] T032 [US1] Policy Enforcement: the assigned Retention Tier — not the Expiry Date field alone — governs Secure Disposal eligibility (FR-008)
- [ ] T033 [US1] Permanent Retention Tier records permanently excluded from Secure Disposal eligibility, wired to acceptance scenario 4 (FR-009)
- [ ] T034 [P] [US1] Retention Tier Assignment UI
- [ ] T035 [US1] Integration test: assigning a Record Category and named Retention Tier persists the assignment, calculates expiry, and reflects Retention Status on the Governance Dashboard, a Custom Policy retention period is accepted and stored distinctly from fixed tiers, an approaching expiry date flags the record for review via Retention Monitoring, a Permanent-tier record is excluded from disposal regardless of elapsed time — all 4 acceptance scenarios in `backend/tests/integration/us1-retention-tier-assignment.integration.test.ts`

**Checkpoint**: The foundational P1 every other Records Management capability depends on is independently functional.

---

## Phase 4: User Story 2 — Place a Legal Hold That Blocks Deletion Even Past Retention Expiry (Priority: P1)

**Independent Test**: Place a Legal Hold on a record whose retention tier has already expired, attempt to run Secure Disposal against it, and confirm the disposal is blocked and logged.

- [ ] T036 [US2] Legal Hold as a distinct compliance state, independent of and able to override the record's Retention Tier status, wired to T006 (FR-010)
- [ ] T037 [US2] Record Locking blocking modification/deletion of any record under active Legal Hold or within active retention, wired to acceptance scenario 1 (FR-011)
- [ ] T038 [US2] Records under active Legal Hold excluded from Secure Disposal even past Retention Tier expiry, until explicitly released, wired to T026's contract test, acceptance scenario 2 (FR-012)
- [ ] T039 [US2] Immutable Storage for records under active retention or Legal Hold, preventing content/metadata alteration (FR-013)
- [ ] T040 [US2] "Legal Hold" as a distinct Security Level/classification value alongside Public/Internal/Confidential/Restricted/Executive, surfaced consistently, wired to acceptance scenario 3 (FR-014)
- [ ] T041 [US2] Immutable Audit Trail logging of every Legal Hold placement/release (record, matter reference, authorizing user, timestamp), wired to acceptance scenario 4 (FR-015)
- [ ] T042 [P] [US2] Legal Hold Placement & Release UI
- [ ] T043 [US2] Integration test: an active-Legal-Hold record blocks delete/modify/dispose attempts via Record Locking with the block captured in the Audit Trail, a Legal Hold placed before disposal execution excludes the record from the disposal batch, a held record's Security Level reflects "Legal Hold" wherever displayed, a released hold reverts to retention-tier-driven eligibility with the release itself audited — all 4 acceptance scenarios in `backend/tests/integration/us2-legal-hold.integration.test.ts`

**Checkpoint**: The highest-risk, non-negotiable compliance safeguard is independently functional.

---

## Phase 5: User Story 3 — Route a Document Through Draft-to-Publish Lifecycle with Multi-Level Approval and e-Signature (Priority: P1)

**Independent Test**: Create a draft document, route it through a configured multi-level approval chain, capture an e-signature at the signature stage, and confirm the document reaches "Published" status with a complete audit trail.

- [ ] T044 [US3] 8 configurable approval workflow types (Single, Multi-Level, Sequential, Parallel, Conditional, Emergency, Department, Executive Approval), wired to T010, acceptance scenario 2 (FR-026)
- [ ] T045 [US3] Approval workflow stage sequence (Draft→Review→Corrections→Approval→e-Signature→Publication→Archive), wired to T027's contract test, acceptance scenarios 1, 4 (FR-027)
- [ ] T046 [US3] e-Signature features (Digital Signature, Electronic Signature, Identity Verification, Timestamp, Audit Trail, Signature Validation, Multi-Signer Support, Certificate Integration), wired to T008, acceptance scenario 3 (FR-028)
- [ ] T047 [P] [US3] Draft-to-Publish Approval & e-Signature UI
- [ ] T048 [US3] Integration test: a Draft document submitted for review moves through Review and, if needed, Corrections before re-entering Approval, a Sequential Approval across two departments blocks the second approver until the first is recorded with both logged, a designated signer's e-Signature captures identity verification/timestamp/validation and supports multi-signer configuration, a completed e-Signature advances the document to Published then Archived with every transition recorded — all 4 acceptance scenarios in `backend/tests/integration/us3-approval-esignature-lifecycle.integration.test.ts`

**Checkpoint**: The core operational engine every other governance capability assumes documents already flow through is independently functional.

---

## Phase 6: User Story 4 — Collaborate on a Document with Version Control, Locking, and Conflict Detection (Priority: P2)

**Independent Test**: Have two authorized users attempt to edit the same document concurrently, confirm the system enforces a lock or detects and surfaces the conflict with merge assistance, and confirm version history/rollback works.

- [ ] T049 [US4] Major/Minor/Draft Versions with Version Comparison, Rollback, Version History, Change Tracking, Audit History, wired to T009, acceptance scenarios 2–3 (FR-022)
- [ ] T050 [US4] Collaboration features (Multi-User Editing, Comments, Mentions, Inline Reviews, Approval Requests, Task Assignment, Activity Feed, Notifications, Shared Workspaces, Live Presence Indicators) (FR-023)
- [ ] T051 [US4] Document Locking (Manual Lock, Automatic Lock, Conflict Detection, Merge Assistance, Offline Editing, Sync Management), wired to acceptance scenarios 1, 4 (FR-024)
- [ ] T052 [US4] A document under active Legal Hold or within active retention MUST NOT be alterable through version-update or collaborative-editing actions (FR-025)
- [ ] T053 [P] [US4] Version Control & Collaboration UI
- [ ] T054 [US4] Integration test: a second concurrent edit attempt triggers Manual/Automatic Locking or Conflict Detection with Merge Assistance rather than silent overwrite, a Version Comparison request displays differences between selected Major/Minor/Draft versions, a Rollback trigger makes the prior version current with the action captured in Change Tracking/Audit History, an offline edit synchronizes on reconnect and surfaces a conflict if the server version changed — all 4 acceptance scenarios in `backend/tests/integration/us4-version-control-collaboration.integration.test.ts`

**Checkpoint**: Day-to-day multi-user document work layered on top of the core lifecycle is independently functional.

---

## Phase 7: User Story 5 — Execute Secure Disposal of an Expired, Non-Held Record (Priority: P2)

**Independent Test**: Create a record with an expired retention tier and no active hold, run Secure Disposal against it, and confirm the record is irreversibly disposed of with a corresponding Audit Trail entry and updated Compliance Reporting.

- [ ] T055 [US5] Secure Disposal workflow irreversibly and verifiably destroying a record (including immutable-storage copies) only when Retention Tier has expired and no active Legal Hold exists, wired to T007, acceptance scenario 1 (FR-016)
- [ ] T056 [US5] Automatic exclusion of any active-Legal-Hold record from a Secure Disposal batch, wired to acceptance scenario 2 (FR-017)
- [ ] T057 [US5] Compliance Reporting covering retention status, legal hold status, and disposal history, wired to acceptance scenario 3 (FR-018)
- [ ] T058 [P] [US5] Secure Disposal & Compliance Reporting UI
- [ ] T059 [US5] Integration test: an expired-tier, non-held record's Secure Disposal irreversibly destroys it and removes it from active/immutable storage, an active-Legal-Hold record in a disposal batch is automatically excluded rather than requiring manual removal, a completed disposal is reflected in Compliance Reporting with record ID/category/tier/date/authorizing user, a disposal attempt against a still-active-retention record is blocked as a Policy Enforcement violation — all 4 acceptance scenarios in `backend/tests/integration/us5-secure-disposal.integration.test.ts`

**Checkpoint**: The closing step of the Records Management lifecycle is independently functional.

---

## Phase 8: User Story 6 — Discover Content via Enterprise Search Across the DMS Repository (Priority: P2)

**Independent Test**: Issue a search query that matches at least two document types, confirm results are filterable and ranked, and confirm a security-restricted or Legal-Hold-classified record does not appear to a user lacking the required access.

- [ ] T060 [US6] Enterprise Search across Documents, Knowledge Articles, Digital Assets, Projects, CRM Records, HR Documents, Contracts, Tasks, Emails, Notes, Policies, Reports, Videos, Images — scoped to the DMS/Records repository, feeding a unified search layer rather than duplicating one, wired to T021's citation-accuracy note, acceptance scenario 1 (FR-029)
- [ ] T061 [US6] Search filters (File Type, Category, Department, Owner, Date, Tags, Keywords, Project, Status, Security Level) (FR-030)
- [ ] T062 [US6] Search modes (Full Text, OCR, Semantic, AI, Voice, Image Search, Auto Suggestions, Saved Searches, Search History, Search Analytics), wired to acceptance scenarios 2, 4 (FR-031)
- [ ] T063 [US6] Search results respect requester access permissions and Security Classification (including Legal Hold) — unauthorized results and previews MUST NOT surface, wired to acceptance scenario 3 (FR-032)
- [ ] T064 [P] [US6] Enterprise Search UI
- [ ] T065 [US6] Integration test: a full-text/semantic query across mixed document types returns filterable, ranked results, an OCR-indexed scanned document is returned for text appearing only in the image, a Legal-Hold-classified or security-restricted record and its preview do not appear to an unauthorized user, a voice or image query returns results consistent with an equivalent text query — all 4 acceptance scenarios in `backend/tests/integration/us6-enterprise-search.integration.test.ts`

**Checkpoint**: The productivity layer over the governed repository is independently functional.

---

## Phase 9: User Story 7 — Ask the AI Assistant a Document/Records-Specific Operational Question (Priority: P3)

**Independent Test**: Ask a metadata-driven question against a small populated set of documents with expiry dates and confirm the assistant returns a grounded, explainable answer with supporting data, confidence score, and no fabricated results when no matches exist.

- [ ] T066 [US7] AI Knowledge Intelligence (Intelligent Document Classification, Auto Metadata Generation, OCR & Text Extraction, Semantic Search, AI Summarization, Duplicate Detection, Knowledge Recommendations, Related Document Suggestions, Auto Translation, Smart Tagging, Content Quality Analysis, Knowledge Gap Detection) — scoped to DMS/Records classification, per T024's `008`-reuse note (FR-033)
- [ ] T067 [US7] AI assistant answering document/records-operational questions grounded in DMS metadata without fabricating results when no matches exist, wired to acceptance scenarios 1–2 (FR-034)
- [ ] T068 [US7] AI recommendation full field set (Recommendation, Supporting Data, Confidence Score, Business Impact, Risk Level, Suggested Action, Responsible Owner, Expected Benefit), wired to acceptance scenario 3 (FR-035)
- [ ] T069 [US7] Advisory-only governance for every AI-generated recommendation/classification with consequential-action potential, wired to T028's contract test, acceptance scenario 4 (FR-036)
- [ ] T070 [P] [US7] AI DMS Operational Assistant UI
- [ ] T071 [US7] Integration test: a "show all contracts expiring this month" query returns a grounded, non-fabricated matching set from document metadata, a no-match query indicates no results rather than inventing an answer, a generated AI recommendation (e.g., duplicate-document alert) displays all 8 required fields, a consequential-action recommendation (disposal, reclassification) is presented as advisory only requiring explicit human approval — all 4 acceptance scenarios in `backend/tests/integration/us7-ai-dms-operational-assistant.integration.test.ts`

**Checkpoint**: The operational query layer over document/records metadata is independently functional.

---

## Phase 10: User Story 8 — Use the Personalized Digital Workspace (Priority: P3)

**Independent Test**: Populate a test user's account with recent/favorite/shared documents and a team workspace, then confirm the Digital Workspace dashboard correctly surfaces these items, quick search functions, and a discussion-board post with a file request is created successfully.

- [ ] T072 [US8] Personalized Dashboard (Recent Documents, Favorite Files, Shared Files, Team/Department/Project Workspaces, Notes, Bookmarks, Calendar, Tasks, Announcements, Activity Feed, Quick Search), wired to T013, acceptance scenario 1 (FR-037)
- [ ] T073 [US8] Workspace Collaboration (Team Spaces, Discussion Boards, Shared Libraries, File Requests, Quick Sharing, Workspace Templates, Notifications, Meeting Notes, Action Items, Integration Widgets), wired to acceptance scenarios 2–4 (FR-038)
- [ ] T074 [P] [US8] Digital Workspace UI
- [ ] T075 [US8] Integration test: a user's Digital Workspace accurately reflects Recent Documents/Favorite Files activity, a Team Workspace Discussion Board post appears in other members' Activity Feed, a File Request within a Shared Library notifies the requester and surfaces the fulfilled file, a Workspace Template applied to a new Project Workspace inherits its configured structure — all 4 acceptance scenarios in `backend/tests/integration/us8-digital-workspace.integration.test.ts`

**Checkpoint**: The unified productivity surface aggregating capabilities from the other stories is independently functional.

---

## Phase 11: Content Governance Remainder, Security & Governance, Enterprise Integrations (supports FR-019–FR-021, FR-039–FR-040; cross-cutting, no single owning story)

- [ ] T076 Content Governance features (Content Classification, Approval Policies, Security Labels, Retention Rules, Ownership Management, Metadata Standards, Content Quality Reviews, Duplicate Detection, Expiry Monitoring, Publishing Controls) (FR-019)
- [ ] T077 6 Security Levels (Public, Internal, Confidential, Restricted, Executive, Legal Hold) applied consistently across documents and records, wired to T040 (FR-020)
- [ ] T078 Governance Dashboard (Total Documents, Published Content, Pending Approvals, Expired Documents, Compliance Score, Duplicate Content, Retention Status, Security Violations, Review Queue, Governance Health), wired to T011 (FR-021)
- [ ] T079 RBAC, Folder/File-Level Permissions, Encryption at Rest/Transit, MFA, Audit Trails, Version Audit Logs, Digital Watermarking, DLP, Backup & DR, Compliance Monitoring, wired to T025's `001`/`016`-reuse note (FR-039)
- [ ] T080 Integration with HRMS (`059`), CRM (`013`), Finance (`058`), Procurement (`055`), Inventory & Warehouse (`056`), Project Management (`061`, confirmed per T023), Customer Support, LMS (`004`), Workflow Engine (`063`, forward-declared), Notification Service, Email Services, Cloud Storage Providers, Business Intelligence, AI Platform (`008`), API Gateway (FR-040)
- [ ] T081 [P] Content Governance, Security & Integrations UI

---

## Phase 12: Polish — Final Validation

- [ ] T082 Resolve and document the 9 preserved NEEDS CLARIFICATION items (3 self-flagged, 6 from Edge Cases) not already closed by `research.md`
- [ ] T083 Final audit: cross-check every FR-001–FR-042 against an implementation, reference-note, or validation task; re-verify the `050`, `051`, `061`, `008`, `001`/`016` reuse decisions are respected, and confirm `063` remains explicitly forward-declared rather than silently assumed
- [ ] T084 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `050`'s Knowledge Base, `051`'s DAM/DRM, and `008`'s `ai-gateway`/`ai-guardrails`, and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US3)**: US1 (Retention Tier) is foundational to every other Records Management capability and must land first; US2 (Legal Hold) is described as inseparable from US1 in practice and should land immediately after; US3 (Draft-to-Publish Lifecycle) is independent of US1/US2 and can be built in parallel, though Records Management (US1/US2) has nothing to classify without documents already flowing through US3's lifecycle.
- **P2 stories (US4, US5, US6)**: US4 (Version Control/Collaboration) depends on US3's core lifecycle existing; US5 (Secure Disposal) depends on US1's retention-tier expiry and US2's Legal Hold exclusion both being correctly enforced; US6 (Enterprise Search) depends on US1–US3's documents/records already existing to index.
- **P3 stories (US7, US8)**: US7 (AI Assistant) depends on US1–US6's metadata existing to query; US8 (Digital Workspace) depends on documents/collaboration from the other stories existing to aggregate. Both are independent of each other.
- **Phase 11 (Content Governance remainder, Security, Integrations)** depends on Foundational and US1–US3; can land alongside US4–US8.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (secure-disposal-zero-execution-against-active-legal-hold, published-document-100pct-completed-approval-workflow, ai-dms-recommendation-zero-autonomous-consequential-action) pass → US1 (Retention Tier) → US2 (Legal Hold) → **STOP and VALIDATE** the non-negotiable compliance safeguard holds → US3 (Draft-to-Publish Lifecycle) → **STOP and VALIDATE** the core operational engine is sound → US4 (Version Control) + US5 (Secure Disposal) + US6 (Enterprise Search) + Phase 11 (Governance/Security/Integrations) → US7 (AI Assistant) + US8 (Digital Workspace) → Polish.
