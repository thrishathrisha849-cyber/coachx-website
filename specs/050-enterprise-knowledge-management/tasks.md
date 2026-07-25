---
description: "Task list for Feature 050 — Enterprise Knowledge Management System (KMS) & AI Knowledge Copilot"
---

# Tasks: Enterprise Knowledge Management System (KMS) & AI Knowledge Copilot

**Input**: Design documents from `/specs/050-enterprise-knowledge-management/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis against Features 008, 062, 004, and 001/016), spec.md, and **Feature 001's Foundational phase complete** (layered RBAC reused via `016`). This feature also assumes `008`'s `ai-rag` module (AI Knowledge Base/Source, AI Document Chunk/Embedding Reference, AI Citation, retrieval pipeline) and `004`'s Learning Path/Course/Assessment/Certification engine exist as consumption points.

**Tests**: Included throughout — Copilot source-attribution-or-low-confidence, zero-unauthorized-knowledge-exposure, and immutable-audit-log full coverage each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-005, and SC-006.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (knowledge intelligence/graph/analytics/knowledge-base remainder; knowledge-governance remainder).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (layered RBAC reused via `016`), and that `008`'s `ai-rag` module and `004`'s Learning Path/Course/Assessment/Certification engine exist as consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: named compliance-framework mapping for knowledge/document data (FR-042a), stale-index-vs-approval-lag reconciliation, cross-department conflicting-guidance presentation, search/RAG-layer access-control-leak prevention, OCR-failure handling, duplicate-upload race-condition handling, compliance-decision-without-verification safeguard, lapsed-review-date demotion behavior, external-partner domain-restriction enforcement
- [ ] T003 [P] Add `backend/src/modules/kms/{knowledge-sources-processing,knowledge-intelligence,ai-knowledge-copilot,enterprise-wiki,intelligent-search,collaboration-workspace,knowledge-governance,security-compliance,organizational-learning,dashboard-portal-reporting}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Knowledge Document / Knowledge Asset` entity in `backend/src/modules/kms/knowledge-sources-processing/knowledge-asset.entity.ts`
- [ ] T005 [P] Define the `Wiki Page` entity in `backend/src/modules/kms/enterprise-wiki/wiki-page.entity.ts`
- [ ] T006 [P] Define the `Knowledge Base Article` entity in `backend/src/modules/kms/knowledge-intelligence/knowledge-base-article.entity.ts`
- [ ] T007 [P] Define the `AI Copilot Conversation / Query-Response` entity in `backend/src/modules/kms/ai-knowledge-copilot/copilot-conversation.entity.ts`
- [ ] T008 [P] Define the `Source Citation` entity in `backend/src/modules/kms/ai-knowledge-copilot/source-citation.entity.ts`
- [ ] T009 [P] Define the `Knowledge Graph Node / Relationship` entity in `backend/src/modules/kms/knowledge-intelligence/knowledge-graph-node.entity.ts`
- [ ] T010 [P] Define the `Access Policy (RBAC/ABAC Rule)` entity in `backend/src/modules/kms/security-compliance/access-policy.entity.ts`
- [ ] T011 [P] Define the `Knowledge Domain` entity in `backend/src/modules/kms/knowledge-sources-processing/knowledge-domain.entity.ts`
- [ ] T012 [P] Define the `Review/Approval Workflow Instance` entity in `backend/src/modules/kms/knowledge-governance/review-approval-workflow-instance.entity.ts`
- [ ] T013 [P] Define the `Audit Record` entity in `backend/src/modules/kms/security-compliance/audit-record.entity.ts`
- [ ] T014 [P] Define the `Learning Path / Course / Assessment` entity in `backend/src/modules/kms/organizational-learning/learning-path-course.entity.ts`
- [ ] T015 [P] Define the `Collaboration Workspace` entity in `backend/src/modules/kms/collaboration-workspace/collaboration-workspace.entity.ts`
- [ ] T016 [P] Define the `Executive/Analytics Report` entity in `backend/src/modules/kms/dashboard-portal-reporting/executive-analytics-report.entity.ts`
- [ ] T017 Note: the AI Knowledge Copilot consumes `008`'s existing `ai-rag` pipeline (AI Knowledge Base/Source, AI Document Chunk/Embedding Reference, AI Citation) rather than building a parallel RAG/retrieval/citation stack; `050`'s Document Intelligence ingestion populates `008`'s "organization knowledge" source category (per plan.md §1)
- [ ] T018 Note: Organizational Learning reuses `004`'s existing Learning Path/Course/Assessment/Certification engine for internal-employee-audience content tied to KMS knowledge assets, rather than a second parallel course-catalog system (per plan.md §3)
- [ ] T019 Note: general-purpose document storage/repository mechanics not specific to knowledge governance are deferred to `062` (not yet planned); this chapter's Document Intelligence remains scoped to the KMS ingestion pipeline (per plan.md §2)
- [ ] T020 Note: knowledge access RBAC/ABAC configures `001`'s/`016`'s existing layered permission hierarchy rather than a knowledge-specific access-control system (per plan.md §4)
- [ ] T021 Contract test: every AI Copilot response asserting a factual, organization-specific claim includes a verifiable source citation and confidence score when an approved source exists, and unsourced responses are visibly distinguished as low-confidence, in `backend/tests/contract/copilot-response-source-attribution-or-low-confidence.contract.test.ts` (FR-022, SC-001)
- [ ] T022 Contract test: zero role-restricted knowledge content (full text, preview/snippet, or AI citation) is exposed to an unauthorized user through Search, Copilot, Wiki, or Collaboration Workspace, in `backend/tests/contract/zero-unauthorized-knowledge-exposure.contract.test.ts` (FR-039, SC-005)
- [ ] T023 Contract test: 100% of AI Copilot interactions, knowledge access events, and permission/administrative changes are captured in the immutable audit log with no data loss, in `backend/tests/contract/immutable-audit-log-full-coverage.contract.test.ts` (FR-041, SC-006)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Ask the AI Knowledge Copilot a Policy Question (Priority: P1) 🎯 MVP

**Independent Test**: Submit a natural-language policy question to the Copilot and verify a generated response, a source citation, a confidence score, and a "verify with a human/owner" affordance.

- [ ] T024 [US1] AI Knowledge Copilot using RAG/NLP/semantic understanding/enterprise knowledge graphs/contextual reasoning as the primary knowledge interface, wired to T007 and T017's `008`-reuse note (FR-019)
- [ ] T025 [US1] 15 Copilot capability types (natural language conversations, enterprise QA, document summaries, policy explanations, SOP assistance, etc.) (FR-020)
- [ ] T026 [US1] Multi-turn conversation support (history, context retention, session continuity, role-based responses, department context, multi-language, voice, file uploads, citations), wired to acceptance scenario 3 (FR-021)
- [ ] T027 [US1] Mandatory source attribution, confidence score, explainability, and human-verification requirement, wired to T008, acceptance scenarios 1, 2, and 4 (FR-022)
- [ ] T028 [US1] Prompt/response logging, access validation, data-privacy controls, and advisory-only-until-validated enforcement (FR-023)
- [ ] T029 [US1] AI governance controls (explainable AI, human approval, confidence scoring, model version tracking, prompt auditing, content validation, bias monitoring, security monitoring) (FR-024)
- [ ] T030 [P] [US1] AI Knowledge Copilot Conversation UI
- [ ] T031 [US1] Integration test: an SOP-answering question returns an answer with citation/confidence/source-view option, a no-matching-source question shows low/no confidence without fabrication, a multi-turn follow-up retains context, a compliance-sensitive response is shown as advisory requiring verification with full audit logging — all 4 acceptance scenarios in `backend/tests/integration/us1-ai-knowledge-copilot.integration.test.ts`

**Checkpoint**: The highest-value, highest-risk capability in the chapter — the primary interface for interacting with enterprise knowledge — is independently functional.

---

## Phase 4: User Story 2 — Upload a Document for OCR, Classification, and Indexing (Priority: P1)

**Independent Test**: Upload a single scanned PDF and verify the system produces extracted text (OCR), suggested metadata/tags, a proposed classification, a duplicate-detection result, and an AI-generated summary attached to a Knowledge Profile record.

- [ ] T032 [US2] Knowledge integration from 12 named source types, wired to T004 (FR-001)
- [ ] T033 [US2] 10-capability document processing (import, OCR, metadata extraction, AI classification, version management, duplicate detection, content validation, tagging, indexing, language processing) (FR-002)
- [ ] T034 [US2] 15 supported document types (policies, SOPs, contracts, reports, etc.) (FR-003)
- [ ] T035 [US2] 10 Document Intelligence capabilities (OCR, metadata extraction, classification, summarization, duplicate detection, entity recognition, keyword extraction, translation, similarity, quality analysis), wired to acceptance scenario 1 (FR-004)
- [ ] T036 [US2] Governed document lifecycle workflow (10 stages: creation→archival), wired to acceptance scenario 4 (FR-005)
- [ ] T037 [US2] Governed enterprise knowledge lifecycle (12 stages: creation→secure disposal) with configurable workflows/automation/approvals/AI recommendations/notifications/audit/governance (FR-006)
- [ ] T038 [US2] Knowledge Profile full field set (17 fields), wired to T004 (FR-007)
- [ ] T039 [US2] 15 configurable Knowledge Domains + admin-definable additional, wired to T011 (FR-008)
- [ ] T040 [P] [US2] Document Upload & Document Intelligence Pipeline UI
- [ ] T041 [US2] Integration test: a scanned document produces OCR-extracted, indexed text, a near-duplicate upload raises a duplicate-detection alert before publication, AI classification/summary is shown as an editable, reviewer-confirmable suggestion rather than an auto-published fact, a published document becomes searchable with full lifecycle-stage audit history — all 4 acceptance scenarios in `backend/tests/integration/us2-document-intelligence-pipeline.integration.test.ts`

**Checkpoint**: The ingestion foundation every other capability (Search, Wiki, Copilot, Knowledge Base) depends on is independently functional.

---

## Phase 5: User Story 3 — Collaboratively Author and Govern an Enterprise Wiki Page (Priority: P2)

**Independent Test**: Create a wiki page, edit it as a second authorized user, submit it for review, approve it, and confirm version history correctly shows both edits and supports rollback.

- [ ] T042 [US3] 10 Wiki category types, wired to T005 (FR-025)
- [ ] T043 [US3] 11-capability Wiki collaborative features (editing, version history, rich content editor, embedded media, hyperlinks, categories, tags, templates, page relationships, discussion threads, review/publishing workflow) (FR-026)
- [ ] T044 [US3] 8-capability authorized-user actions (create, edit, suggest, review, approve, restore, track history, monitor analytics), wired to acceptance scenarios 1 and 2 (FR-027)
- [ ] T045 [US3] AI Wiki Intelligence (automatic summaries, related pages, knowledge linking, suggested improvements, content quality scoring, duplicate detection, missing documentation detection, knowledge expansion recommendations), wired to acceptance scenarios 3 and 4 (FR-028)
- [ ] T046 [P] [US3] Enterprise Wiki Editor UI
- [ ] T047 [US3] Integration test: a saved draft is versioned and enters the review workflow, revision history lists author/timestamp/diff/restore for every edit, an overlapping-content page is flagged as a likely duplicate with a consolidation suggestion, a published page shows related pages and an AI-generated summary — all 4 acceptance scenarios in `backend/tests/integration/us3-enterprise-wiki.integration.test.ts`

**Checkpoint**: The chapter's designated "collaborative encyclopedia" is independently functional.

---

## Phase 6: User Story 4 — Discover Knowledge via Intelligent Enterprise Search (Priority: P1)

**Independent Test**: Issue a query that matches content across at least two different source types and confirm results are ranked, filterable, and previewable.

- [ ] T048 [US4] Intelligent Enterprise Search across 14 connected repository types, wired to T004-T006, acceptance scenario 1 (FR-029)
- [ ] T049 [US4] 14-capability search features (semantic search, full-text, auto suggestions, query expansion, typo tolerance, voice search, OCR search, metadata/tag/department/date/version/language filters, saved searches), wired to acceptance scenario 2 (FR-030)
- [ ] T050 [US4] AI Search Intelligence (intent recognition, context awareness, personalized ranking, related knowledge, search summaries, missing knowledge suggestions, search quality improvements, frequently requested topics) (FR-031)
- [ ] T051 [US4] 8-capability result interaction (ask naturally, preview, view AI summaries, open related, bookmark, share, download, continue as AI Copilot), wired to T010's access-policy enforcement, acceptance scenarios 3 and 4 (FR-032)
- [ ] T052 [P] [US4] Intelligent Search UI
- [ ] T053 [US4] Integration test: a multi-repository query returns semantically ranked, previewable, filterable results, a misspelled query still surfaces relevant results via typo tolerance/expansion, a role-restricted result and its preview never render for an unauthorized user, "continue with AI Copilot" carries search context into a grounded conversation — all 4 acceptance scenarios in `backend/tests/integration/us4-intelligent-search.integration.test.ts`

**Checkpoint**: The other primary discovery surface alongside the Copilot is independently functional.

---

## Phase 7: User Story 5 — Collaborate on a Knowledge Document in the Collaboration Workspace (Priority: P2)

**Independent Test**: Have two role-appropriate users co-edit a document in a shared workspace, add inline comments and a mention, submit it for approval, and verify the approval workflow, activity timeline, and audit history all reflect the collaboration accurately.

- [ ] T054 [US5] Knowledge Collaboration Workspace for 5 participant types to jointly create/review/improve/approve/maintain knowledge, wired to T015 (FR-033)
- [ ] T055 [US5] 15-capability collaboration features (real-time co-authoring, inline comments, review requests, approval workflows, mentions, discussion threads, version comparison, file attachments, task assignment, activity timeline, etc.), wired to acceptance scenarios 1 and 2 (FR-034)
- [ ] T056 [US5] Role-based visibility/editing permissions across 14 participant types (FR-035)
- [ ] T057 [US5] AI Collaboration Intelligence (document improvement suggestions, automatic summaries, duplicate detection, related knowledge recommendations, action item extraction, meeting summaries, content quality analysis, collaboration effectiveness insights, missing documentation detection, expert recommendations) explainable/configurable/traceable, wired to acceptance scenario 4 (FR-036)
- [ ] T058 [P] [US5] Knowledge Collaboration Workspace UI
- [ ] T059 [US5] Integration test: concurrent edits from two participants are preserved and attributed, a mention notifies the mentioned user, a review request routes through the configured approval workflow with a recorded outcome, AI extracts action items and a summary traceable back to the source discussion — all 4 acceptance scenarios in `backend/tests/integration/us5-collaboration-workspace.integration.test.ts`

**Checkpoint**: The structured collaboration preventing duplicate-documentation and information-silo problems is independently functional.

---

## Phase 8: User Story 6 — Enforce Role- and Attribute-Based Access to Sensitive Knowledge (Priority: P1)

**Independent Test**: Create a restricted-access knowledge asset, confirm an authorized role can retrieve/search/cite it, and confirm an unauthorized role gets neither the document nor any leaked preview/snippet/citation through any surface.

- [ ] T060 [US6] RBAC/ABAC/MFA/SSO/identity federation/device trust/session monitoring/conditional access/secure API auth/Zero Trust support, wired to T010 and T020's `001`/`016`-reuse note, acceptance scenarios 1 and 2 (FR-039)
- [ ] T061 [US6] Encryption at rest/in transit, secure key management, digital watermarking, information classification, data masking, secure file sharing, backup/DR/BCP support (FR-040)
- [ ] T062 [US6] Immutable audit records across 10 event categories (document creation, content updates, version changes, approval actions, knowledge access, search activities, AI Copilot interactions, permission changes, administrative actions, security events), wired to T013 and T023's contract test, acceptance scenario 3 (FR-041)
- [ ] T063 [US6] AI security governance (prompt logging, model version tracking, confidence scoring, explainable AI, human approval controls, sensitive information detection, data leakage prevention, bias monitoring, security analytics, regulatory reporting) (FR-042)
- [ ] T064 [US6] Named-compliance-framework mapping for knowledge/document data — preserved NEEDS CLARIFICATION per FR-042a (FR-042a)
- [ ] T065 [P] [US6] Access Control & Security Governance UI
- [ ] T066 [US6] Integration test: a restricted asset is invisible in results/previews/citations to an unauthorized role, an authorized role receives the content/citation normally, a blocked unauthorized access attempt is captured in the immutable audit log with user/resource/timestamp/outcome, a permission change is itself logged and takes effect across all surfaces without a restart — all 4 acceptance scenarios in `backend/tests/integration/us6-access-control-governance.integration.test.ts`

**Checkpoint**: The cross-cutting gate every other user story (Copilot, Search, Wiki, Collaboration) depends on being correct is independently functional.

---

## Phase 9: User Story 7 — Monitor Organizational Knowledge Health via the Knowledge Management Dashboard (Priority: P2)

**Independent Test**: With even a small set of knowledge assets and usage events, load the dashboard and confirm metrics render correctly, support drill-down and filters, and can be exported to PDF/Excel.

- [ ] T067 [US7] Knowledge Management Dashboard (12 metric categories) with real-time analytics, interactive charts, department/date filters, drill-down reports, PDF/Excel export, scheduled reports, executive scorecards, personalized views, wired to T016, acceptance scenario 1 (FR-047)
- [ ] T068 [US7] Enterprise Knowledge Portal (12 integrated modules: Knowledge Home, Copilot, Knowledge Base, Wiki, Search, Learning Center, Analytics, Governance Center, personal workspace, saved collections, notifications, admin/settings) (FR-048)
- [ ] T069 [US7] 15 configurable executive report types with scheduling, PDF/Excel export, drill-down, historical comparisons, benchmarking, RBAC, version history, audit logging, retention policies (FR-049)
- [ ] T070 [US7] Transparent/explainable/configurable/governed/role-aware/fully-auditable requirement on every Dashboard/Portal AI insight (FR-050)
- [ ] T071 [US7] Enterprise-scale architecture with independent search/AI/analytics/document-processing scaling and multilingual/multi-region/multi-tenant/HA deployment support (FR-051)
- [ ] T072 [P] [US7] Knowledge Management Dashboard & Enterprise Knowledge Portal UI
- [ ] T073 [US7] Integration test: the dashboard renders real-time asset/quality/review-status/search-effectiveness metrics, a department filter scopes all displayed metrics, an asset with a lapsed mandatory review date is flagged as a governance gap, a scheduled executive report generates and delivers in the requested format — all 4 acceptance scenarios in `backend/tests/integration/us7-knowledge-management-dashboard.integration.test.ts`

**Checkpoint**: The governance visibility leadership needs is independently functional.

---

## Phase 10: User Story 8 — Receive Personalized Organizational Learning Recommendations (Priority: P3)

**Independent Test**: Assign a learning category to a test employee profile and verify the system surfaces a personalized learning path/course recommendation and records completion/assessment analytics.

- [ ] T074 [US8] Organizational Learning across 10 program categories (onboarding, compliance training, leadership development, technical learning, etc.), wired to T014 and T018's `004`-reuse note (FR-043)
- [ ] T075 [US8] 10 learning component types (learning paths, courses, assessments, certifications, resources, articles, exercises, case studies, videos, AI recommendations) (FR-044)
- [ ] T076 [US8] 8-metric learning analytics (completion, scores, progress, certification status, department readiness, retention, skill development, effectiveness), wired to acceptance scenario 2 (FR-045)
- [ ] T077 [US8] AI learning outputs (personalized paths, recommended courses, skill gap analysis, learning forecasts, career development suggestions, knowledge reinforcement recommendations), wired to acceptance scenarios 1 and 3 (FR-046)
- [ ] T078 [P] [US8] Organizational Learning Recommendations UI
- [ ] T079 [US8] Integration test: an identified skill gap surfaces personalized learning paths/course recommendations, a completed course/assessment updates employee and department analytics, a department showing low knowledge retention surfaces a reinforcement recommendation — all 3 acceptance scenarios in `backend/tests/integration/us8-organizational-learning.integration.test.ts`

**Checkpoint**: The value-add layer connecting enterprise knowledge with employee growth is independently functional.

---

## Phase 11: Knowledge Intelligence/Graph/Analytics/Knowledge Base remainder, Knowledge Governance remainder (supports FR-009–FR-018, FR-037–FR-038; cross-cutting, no single owning story)

- [ ] T080 8 Knowledge Intelligence outputs (smart search results, knowledge relationships, recommended documents, knowledge maps, content similarity, usage analytics, quality scores, AI summaries), wired to T009 (FR-009)
- [ ] T081 AI knowledge outputs (automatic summaries, recommendations, contextual answers, related document suggestions, gap identification, improvement suggestions, expert identification, learning recommendations) (FR-010)
- [ ] T082 8-surface knowledge delivery (Portal, mobile, web, AI chat, API, browser search, embedded widgets, personalized dashboards) (FR-011)
- [ ] T083 Knowledge Base across 10 categories, wired to T006 (FR-012)
- [ ] T084 10 Knowledge Base content types + 12-capability features (rich text, media, version control, approval workflow, categories, tags, full-text search, ratings, comments, related articles, bookmarking, offline access) (FR-013)
- [ ] T085 AI Knowledge Base recommendations (related articles, personalized recommendations, trending knowledge, frequently accessed resources, missing content suggestions, knowledge gap analysis) (FR-014)
- [ ] T086 Knowledge Discovery across 12 sources with mapping, expert identification, topic clustering, content relationships, duplicate detection, emerging trends, organizational knowledge graphs, gap detection, cross-department insights, best-practice identification, wired to T009 (FR-015)
- [ ] T087 AI relationship/risk/opportunity identification (hidden relationships, frequently used knowledge, missing documentation, subject matter experts, org knowledge risks, future knowledge needs, learning opportunities, innovation opportunities) (FR-016)
- [ ] T088 Knowledge Analytics across 10 domains (usage, search, learning, contribution, content quality, governance, collaboration, department, AI usage, executive) (FR-017)
- [ ] T089 AI health-score/trend/decay/optimization outputs (knowledge health scores, engagement trends, emerging topics, decay alerts, search optimization, learning improvement, content performance, organizational readiness) (FR-018)
- [ ] T090 10 Knowledge Governance components (content ownership, approval workflows, review cycles, version governance, metadata standards, taxonomy management, classification policies, security policies, retention policies, compliance controls), wired to T012 (FR-037)
- [ ] T091 10 governance policy enforcements (mandatory review dates, content approval, duplicate prevention, document expiration, knowledge ownership, RBAC, sensitive content controls, AI usage policies, audit logging, regulatory compliance) (FR-038)
- [ ] T092 [P] Knowledge Intelligence & Knowledge Governance Dashboards UI

---

## Phase 12: Polish — Final Validation

- [ ] T093 Resolve and document the 9 preserved NEEDS CLARIFICATION items from plan.md §5 not already closed by `research.md`
- [ ] T094 Final audit: cross-check every FR-001–FR-051 (including FR-042a) against an implementation or validation task; re-verify the `008` ai-rag reuse, `004` LMS-engine reuse, `062` forward-declared deferral, and `001`/`016` RBAC/ABAC reuse decisions are respected
- [ ] T095 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `008`'s `ai-rag` module and `004`'s Learning Path/Course engine, and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2, US4, US6)**: US2 (Document Intelligence ingestion) is the foundation every other capability depends on to have governed, searchable content and should land first in practice even though US1 shares top priority; US1 (AI Copilot) is the highest-value, highest-risk capability and can be built in parallel with US2 since it can operate over any indexed subset; US4 (Search) and US6 (Access Control) are cross-cutting gates that should be validated continuously alongside US1/US2.
- **P2 stories (US3, US5, US7)**: US3 (Wiki) and US5 (Collaboration Workspace) both depend on the document lifecycle and RBAC foundation (US2, US6); US7 (Dashboard) depends on US1–US6 already producing data to report on.
- **P3 story (US8)** depends on the knowledge/learning content catalog and analytics already existing, and should land last among the numbered stories.
- **Phase 11 (Knowledge Intelligence/Governance remainder)** depends on Foundational and US2; should land alongside US3/US5.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, reuse notes) → **STOP and VALIDATE** the three Foundational contract tests (copilot-response-source-attribution-or-low-confidence, zero-unauthorized-knowledge-exposure, immutable-audit-log-full-coverage) pass → US2 (Document Intelligence ingestion) → US1 (AI Copilot) in parallel → **STOP and VALIDATE** the Copilot never fabricates unsourced answers and every response carries a confidence score → US4 (Search) + US6 (Access Control) → **STOP and VALIDATE** zero unauthorized knowledge exposure across every surface → US3 (Wiki) + US5 (Collaboration Workspace) + Phase 11 (Knowledge Intelligence/Governance remainder) → US7 (Dashboard) → US8 (Organizational Learning) → Polish. This opens Wave 4.
