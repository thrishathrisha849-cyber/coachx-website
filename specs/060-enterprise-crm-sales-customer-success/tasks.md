---
description: "Task list for Feature 060 — Enterprise CRM Territory-Based Security & Record-Level Permissions"
---

# Tasks: Enterprise CRM Territory-Based Security & Record-Level Permissions

**Input**: Design documents from `/specs/060-enterprise-crm-sales-customer-success/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md (including its Ownership & Dependency Analysis confirming citation accuracy against `013` with specific spot-verified FR text, and surfacing a correction to `045/plan.md`'s own "novel ground" claim for Territory — establishing the correct `013`→`045`→`060` three-level ownership chain), spec.md, **Feature 013's Foundational phase complete** (base CRM entities, field-level RBAC), and **Feature 045's Foundational phase complete** (Territory structural model, Pipeline Health). This feature also assumes `001`'s layered RBAC and `008`'s `ai-gateway`/`ai-guardrails` exist as consumption points.

**Tests**: Included throughout — the multi-layer permission combination, the AI CRM Recommendation's nine-field completeness, and the AI-CRM zero-autonomous-mutation gate each get a dedicated Foundational contract test, matching this spec's own SC-001, SC-004, and SC-005.

**Organization**: Because 21 of this feature's 36 FRs are pure or near-pure citations to `013`/`045` (not re-implemented here), tasks are organized around only the genuinely net-new or composition-verification FRs, grouped by user story (US1–US6 from spec.md).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `013`'s Foundational phase is deployed (Lead/Contact/Account/Opportunity/Pipeline entities, field-level RBAC, audit-log structure) and `045`'s Foundational phase is deployed (Territory structural model, Pipeline Health metrics), and that `001`'s layered RBAC and `008`'s `ai-gateway`/`ai-guardrails` exist as consumption points
- [ ] T002 Resolve `research.md` open items before proceeding: precedence between overlapping territory definitions (e.g., Geographic vs. Industry territory both claiming a record), layer precedence between territory-based security and record-level permissions when they conflict, territory-based-visibility re-evaluation timing (real-time vs. batch), the scope of "Compliance Monitoring" (frameworks/conditions/cadence), territory-following-user-vs-account on mid-quarter reassignment, record-level-grant persistence across a territory reassignment, partial-dataset disclosure on scoped AI Assistant answers, and multi-level-approval routing when the approver lacks territory/record-level visibility into the record being approved
- [ ] T003 [P] Add `backend/src/modules/crm-governance/{territory-based-security,record-level-permissions,ai-crm-assistant,ai-crm-recommendation,governance-composition}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Territory (Security Boundary)` relationship entity in `backend/src/modules/crm-governance/territory-based-security/territory-security-boundary.entity.ts`
- [ ] T005 [P] Define the `Record-Level Permission` entity in `backend/src/modules/crm-governance/record-level-permissions/record-level-permission.entity.ts`
- [ ] T006 [P] Define the `AI CRM Recommendation` entity in `backend/src/modules/crm-governance/ai-crm-recommendation/ai-crm-recommendation.entity.ts`
- [ ] T007 [P] Define the `AI CRM Assistant Query` entity in `backend/src/modules/crm-governance/ai-crm-assistant/ai-crm-assistant-query.entity.ts`
- [ ] T008 Reference, do not redefine: 18-stage Customer Lifecycle (Visitor→Win-back) — maps onto `045`'s 15-stage Revenue Lifecycle and `013`'s 12-step lead lifecycle, no new mechanics (FR-026)
- [ ] T009 Reference, do not redefine: Customer Master Profile fields and Segmentation factors — subsets of `013`'s Account/Contact fields and `045`'s account fields (FR-027)
- [ ] T010 Reference, do not redefine: lead capture/scoring/workflow sequence — restatement of `013`'s lead-management requirements (FR-028)
- [ ] T011 Reference, do not redefine: pipeline stages and Pipeline Dashboard — restatement of `013`'s and `045`'s pipeline/dashboard mechanics (FR-029)
- [ ] T012 Reference, do not redefine: Sales Automation features and Sales Activities — already defined by `013`'s Sales Activity and Workflow Automation requirements (FR-030)
- [ ] T013 Reference, do not redefine: Account & Contact Management, Relationship Mapping — already defined by `013` and `045` (FR-031)
- [ ] T014 Reference, do not redefine: Customer Success & Retention (Health Score, Success Activities, Retention Dashboard) — already defined by `013` (FR-032)
- [ ] T015 Reference, do not redefine: Customer Support integration (ticket history, SLA status, escalations, unified timeline) — already defined by `013` (FR-033)
- [ ] T016 Reference, do not redefine: AI-assisted Revenue Forecasting and Revenue Dashboard — already defined by `013` and `045`'s Sales Forecasting Platform (FR-034)
- [ ] T017 Reference, do not redefine: Sales Analytics (Executive KPIs, Reports, Territory Performance) — already defined by `013`'s Reporting & Analytics and `045`'s Pipeline Intelligence Dashboard, with Territory Performance corresponding to `045` FR-085 (FR-035)
- [ ] T018 Reference, do not redefine: 18-system Enterprise Integrations list — restates integration points already required by `013` FR-186–193 (FR-036)
- [ ] T019 Note: this feature's citation discipline against `013` was spot-verified accurate (FR-002/FR-003/FR-133/FR-179/FR-163 all confirmed verbatim) — notably more precise than `057`'s equivalent citations against `055` (per plan.md §1)
- [ ] T020 Note: `045`'s Territory structural model (FR-082–086) is the correct citation target for territory-security enforcement to build on, but `045/plan.md`'s own claim that Territory is entirely novel ground is inaccurate — `013` FR-073 already defines a basic Territory entity `045` extends; the correct chain is `013`(basic)→`045`(deep structural model)→`060`(security-enforcement layer), per plan.md §2 — recommended correction to `045/plan.md` pending user confirmation
- [ ] T021 Note: the AI CRM Assistant and AI Recommendation object reuse `008`'s `ai-gateway`/`ai-guardrails` for provider access/governance, with the bottleneck/campaign query logic as this feature's own new structured-CRM-data layer, consistent with `013`'s own prior 008-reuse assumption (per plan.md §3)
- [ ] T022 Note: Territory-Based Security and Record-Level Permissions are additive layers on top of `013`'s/`001`'s existing RBAC (FR-010) — no new authorization system, the cleanest instance of the layered-RBAC-extension pattern this session has found (per plan.md §4)
- [ ] T023 Contract test: 100% of record-visibility checks correctly combine role-based, territory-based, and record-level permission layers, with zero records visible to a user excluded by any one layer, in `backend/tests/contract/multi-layer-permission-combination-zero-unauthorized-visibility.contract.test.ts` (SC-001)
- [ ] T024 Contract test: 100% of AI CRM Recommendations display all nine required fields (Recommendation, Business Reason, Supporting Data, Confidence Score, Expected Revenue Impact, Risk Level, Suggested Action, Responsible Owner, Estimated Completion Time) before being shown to a user, in `backend/tests/contract/ai-crm-recommendation-100pct-nine-field-display.contract.test.ts` (SC-004)
- [ ] T025 Contract test: zero AI CRM Recommendations or AI CRM Assistant answers autonomously change a record's owner, status, or score without explicit human action, in `backend/tests/contract/ai-crm-zero-autonomous-record-mutation.contract.test.ts` (SC-005)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Territory-Based Record Visibility for Leads, Accounts & Opportunities (Priority: P1) 🎯 MVP

**Independent Test**: Assign two sales reps to two different, non-overlapping territories, create a lead/account/opportunity in each territory, and confirm each rep sees only the record(s) in their own territory while a manager assigned to both sees both.

- [ ] T026 [US1] Territory-Based Security as a distinct CRM access-control layer restricting visibility of leads/accounts/contacts/opportunities to a record's assigned territory, applied additively to RBAC and built on `045`'s territory structure, wired to T004, T020's ownership-chain note (FR-001)
- [ ] T027 [US1] "View Territory" access-level enforcement mechanics binding `013`'s named access level (FR-002) to a record's actual territory assignment (FR-002)
- [ ] T028 [US1] Territory-membership determination from `045`'s territory model with re-evaluation whenever territory-determining fields or a territory's own definition change, wired to acceptance scenario 3 (FR-003)
- [ ] T029 [US1] Territory-based visibility governs visibility only — edit/delete/export/assign rights continue to follow role-based access level, wired to acceptance scenario 4 (FR-004)
- [ ] T030 [US1] Aggregated territory-based visibility across every territory a multi-territory user or territory manager is assigned to, wired to acceptance scenario 2 (FR-005)
- [ ] T031 [P] [US1] Territory-Scoped List View UI
- [ ] T032 [US1] Integration test: a rep assigned to Territory A only sees only Territory A records regardless of role-based access level, a manager assigned to both Territory A and B sees a combined view, changing a record's territory-determining field re-evaluates visibility so outside users lose access and inside users gain it, a "View Organization" role-holder not assigned to a record's territory is still restricted by territory-based security absent an explicit record-level grant — all 4 acceptance scenarios in `backend/tests/integration/us1-territory-based-visibility.integration.test.ts`

**Checkpoint**: The first of the chapter's two genuinely new access-control mechanisms is independently functional.

---

## Phase 4: User Story 2 — Record-Level Permission Override Independent of Territory and Role (Priority: P1)

**Independent Test**: Grant a specific user explicit access to one record outside their territory and confirm they can see it while identical-role/territory users cannot; separately restrict a specific record from a user who would otherwise see it, and confirm it disappears from their views while remaining visible to others.

- [ ] T033 [US2] Record-Level Permissions granting/restricting access to an individual record independent of role/territory/field-level permissions, distinct from `013`'s field-level RBAC, wired to T005 (FR-006)
- [ ] T034 [US2] Explicit grant and explicit restriction support, each logged (user, record, permission type, granted/restricted-by, timestamp) per `013` FR-179's audit structure, wired to acceptance scenarios 1–3 (FR-007)
- [ ] T035 [US2] Record's active record-level permission state visible to authorized administrators directly on the record, wired to acceptance scenario 4 (FR-008)
- [ ] T036 [US2] AI requests respect record-level permissions exactly as a direct user request would, consistent with `013` FR-133, wired to T025's contract test (FR-009)
- [ ] T037 [P] [US2] Record-Level Permission Admin UI
- [ ] T038 [US2] Integration test: an out-of-territory record-level grant makes the record visible despite territory-based security otherwise excluding it, an in-territory record-level restriction removes the record from the user's views/lists/search/exports, every grant/restriction change logs acting administrator/affected user/record/type/timestamp, an administrator's permission-detail view shows every explicit grant and restriction on a record — all 4 acceptance scenarios in `backend/tests/integration/us2-record-level-permissions.integration.test.ts`

**Checkpoint**: The second of the chapter's two genuinely new access-control mechanisms is independently functional.

---

## Phase 5: User Story 3 — AI CRM Assistant Identifies the Pipeline's Biggest Bottleneck (Priority: P2)

**Independent Test**: Seed a pipeline where one stage has unusually high average time-in-stage and low conversion rate, ask the AI CRM Assistant the bottleneck question, and confirm the answer names that stage and cites the supporting metric, using only permitted data.

- [ ] T039 [US3] AI CRM Assistant natural-language Q&A across the 10 documented example questions, wired to T007, T021's structured-data-grounding note (FR-018)
- [ ] T040 [US3] Pipeline-bottleneck query deriving its answer from `045`'s stage-level Pipeline Health metrics (time-in-stage, conversion rate, aging) rather than an independent bottleneck model, wired to acceptance scenarios 1, 3 (FR-019)
- [ ] T041 [US3] Every AI CRM Assistant response scoped to only role-based/territory-based/record-level-permitted records, fields, and aggregates, wired to T026/T033's permission layers, acceptance scenario 2 (FR-021)
- [ ] T042 [P] [US3] AI CRM Assistant Pipeline Bottleneck UI
- [ ] T043 [US3] Integration test: a pipeline with one clearly bottlenecked stage produces an answer naming that stage with supporting metrics, a territory/record-level-restricted user's bottleneck answer computes only from permitted opportunities, insufficient sample size produces an explicit "data insufficient" response rather than a false-confidence answer, answering the question does not itself change any opportunity's stage/status/ownership — all 4 acceptance scenarios in `backend/tests/integration/us3-ai-pipeline-bottleneck.integration.test.ts`

**Checkpoint**: The chapter's clearest AI CRM Assistant contribution beyond `013`/`045`'s scoring/forecasting mechanics is independently functional.

---

## Phase 6: User Story 4 — AI CRM Assistant Identifies Which Campaigns Generated the Best Leads (Priority: P2)

**Independent Test**: Seed leads from multiple campaigns with differing conversion outcomes, ask the campaign-effectiveness question, and confirm the answer ranks campaigns using actual conversion/revenue attribution rather than lead volume alone.

- [ ] T044 [US4] Campaign-effectiveness query deriving its answer from `013`'s lead-source-attribution data (FR-163) and `045`'s marketing-attribution/revenue-by-lead-source data (FR-018, FR-035), wired to acceptance scenarios 1, 3 (FR-020)
- [ ] T045 [US4] Advisory-only presentation: the campaign-effectiveness answer is informational, never an automated marketing-budget reallocation or campaign-status change, wired to T025's contract test, acceptance scenario 4 (FR-022)
- [ ] T046 [P] [US4] AI CRM Assistant Campaign Effectiveness UI
- [ ] T047 [US4] Integration test: leads from campaigns with varying conversion/revenue outcomes produce a ranking using attribution data (not raw lead count) with the underlying metric named, a territory/record-level-restricted user's ranking reflects only permitted data, the Assistant does not compute an independent attribution model conflicting with `013`/`045`'s recorded attribution, the displayed answer is presented as informational rather than an automatic budget/status change — all 4 acceptance scenarios in `backend/tests/integration/us4-ai-campaign-effectiveness.integration.test.ts`

**Checkpoint**: The second named AI CRM Assistant distinctive query is independently functional.

---

## Phase 7: User Story 5 — Explainable AI CRM Recommendation With Owner, Risk Level & Timeline (Priority: P2)

**Independent Test**: Trigger any AI CRM recommendation and confirm all nine required fields are present and populated before display, and confirm assigning a "Responsible Owner" does not itself change the record's actual owner.

- [ ] T048 [US5] AI capabilities covering Lead Scoring, Opportunity Scoring, Customer Segmentation, Churn Prediction, Upsell/Cross-Sell Recommendations, Sales Forecasting, Sentiment Analysis, Customer Health Prediction, Sales Coaching, Next Best Action, Intelligent Workflow Automation — restating `013`/`045`'s existing mechanics without new logic (FR-023)
- [ ] T049 [US5] AI CRM Recommendation nine-field object shape (Recommendation, Business Reason, Supporting Data, Confidence Score, Expected Revenue Impact, Risk Level, Suggested Action, Responsible Owner, Estimated Completion Time), wired to T006, T024's contract test, acceptance scenario 1 (FR-024)
- [ ] T050 [US5] Responsible Owner field remains a suggestion only — actual ownership change requires the standard record ownership-change process (`013` FR-020), wired to acceptance scenario 2 (FR-025)
- [ ] T051 [P] [US5] AI CRM Recommendation Detail UI
- [ ] T052 [US5] Integration test: any recommendation type (upsell, churn-risk, coaching, next-best-action) displays all nine required fields, a named Responsible Owner does not change the record's actual owner field until explicit human reassignment, a Suggested Action that would change record data makes no changes until the user explicitly accepts it, an AI-service-unavailable scenario continues CRM function using existing rule-based data without blocking the core workflow — all 4 acceptance scenarios in `backend/tests/integration/us5-ai-recommendation-explainability.integration.test.ts`

**Checkpoint**: This chapter's own distinctive recommendation-object structure is independently functional.

---

## Phase 8: User Story 6 — CRM Governance Stack Enforced Consistently Across Territory, Record, and Compliance Layers (Priority: P3)

**Independent Test**: Route an approval request for a record the approver cannot see under territory/record-level rules, and confirm the system either grants temporary scoped visibility or blocks the approval with a clear reason — never silently approving a record the approver cannot inspect.

- [ ] T053 [US6] RBAC as the CRM's foundational access-control layer with Territory-Based Security and Record-Level Permissions as additive layers on top, wired to T022's additive-layer note (FR-010)
- [ ] T054 [US6] Multi-Level Approval routing composes correctly with territory-based/record-level visibility — scoped access grant or explicit block, never silent proceed, wired to acceptance scenario 1 (FR-011)
- [ ] T055 [US6] Digital Signatures for CRM documents, consistent with `013` FR-068 (FR-012)
- [ ] T056 [US6] Encryption of CRM data in transit and at rest, consistent with `013` FR-184 (FR-013)
- [ ] T057 [US6] Immutable Audit Logs of territory reassignment and record-level permission changes using `013` FR-179's audit-entry structure, wired to acceptance scenario 2 (FR-014)
- [ ] T058 [US6] Data Privacy Controls consistent with `013` FR-181–185 (FR-015)
- [ ] T059 [US6] Duplicate Detection (`013` FR-022) applying territory/record-level permission rules when presenting or merging cross-territory duplicates, wired to acceptance scenario 3 (FR-016)
- [ ] T060 [US6] Compliance Monitoring visible only to users whose role/territory/record-level permissions already entitle them to the underlying record, wired to acceptance scenario 4 (FR-017)
- [ ] T061 [P] [US6] Governance Composition Admin UI
- [ ] T062 [US6] Integration test: a multi-level approval routed to a visibility-lacking approver either grants scoped logged access or blocks with a clear reason, a territory/record-level permission-change audit-log entry carries the same fields as `013` FR-179 entries, cross-territory duplicate detection respects both records' territory/record-level settings during merge, a Compliance Monitoring flag is visible only to already-entitled users — all 4 acceptance scenarios in `backend/tests/integration/us6-governance-composition.integration.test.ts`

**Checkpoint**: Confirmation that the new territory/record-level layers compose correctly with every existing governance mechanism is independently functional.

---

## Phase 9: Polish — Final Validation

- [ ] T063 Resolve and document the 8 preserved NEEDS CLARIFICATION items (4 self-flagged, 4 from Edge Cases) not already closed by `research.md`
- [ ] T064 Final audit: cross-check every FR-001–FR-036 against an implementation, reference-note, or validation task; re-verify the `013` citation-accuracy findings and the `045` Territory-ownership-chain correction (§2) are respected
- [ ] T065 Run `quickstart.md` validation end-to-end across all 6 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `013`'s and `045`'s Foundational phases, and produces the entity/reuse-note infrastructure every subsequent phase depends on.
- **P1 stories (US1, US2)**: US1 (Territory-Based Security) and US2 (Record-Level Permissions) are the chapter's two genuinely new, independent access-control layers and can be built in parallel once Foundational is complete.
- **P2 stories (US3, US4, US5)**: US3 (Pipeline Bottleneck) and US4 (Campaign Effectiveness) both depend on US1/US2's permission-scoping layers existing to filter their answers, and can be built in parallel with each other; US5 (Explainable AI Recommendation) is independent of US3/US4 and can be built in parallel with them.
- **P3 story (US6)** depends on US1 and US2 existing to verify composition against, and should land last among the numbered stories.
- **Polish (Phase 9)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (entities, citation-reference notes, ownership notes) → **STOP and VALIDATE** the three Foundational contract tests (multi-layer-permission-combination-zero-unauthorized-visibility, ai-crm-recommendation-100pct-nine-field-display, ai-crm-zero-autonomous-record-mutation) pass → US1 (Territory-Based Security) → US2 (Record-Level Permissions) → **STOP and VALIDATE** the two new access-control layers combine correctly with RBAC → US3 (Pipeline Bottleneck) + US4 (Campaign Effectiveness) + US5 (Explainable AI Recommendation) → US6 (Governance Composition) → Polish.
