---
description: "Task list for Feature 018 — Campaign Management: Lifecycle, Creation, Scheduling & Publishing"
---

# Tasks: Campaign Management: Lifecycle, Creation, Scheduling & Publishing

**Input**: Design documents from `/specs/018-campaign-management/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature extends via `016`). This feature also assumes `019`'s audience/segment data, `008`'s AI gateway, and `016`'s RBAC/approval-chain model exist as integration points, though it does not require their full feature completion to build its own campaign engine.

**Tests**: Included throughout — pre-publish-validation-blocking, AI-content-never-publishes-without-human-review, and version-immutability get dedicated Foundational contract tests, matching this spec's own SC-002, SC-005, and SC-004.

**Organization**: Tasks are grouped by user story (US1–US7 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (Dashboard/Archiving/Collaboration remainder FR-050–FR-051, FR-056–FR-062).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor this feature extends via `016`), and that `019`'s audience data and `008`'s AI gateway exist
- [ ] T002 Resolve `research.md` open items before proceeding: the Article-II conflict flagged for "autonomous AI campaign execution," restore-vs-re-approval behavior on version restore, concurrent-multi-editor conflict resolution, and the numeric "budget exceeded" validation threshold/comparison basis
- [ ] T003 [P] Add `backend/src/modules/{campaign-core,campaign-wizard,campaign-scheduling,campaign-validation,campaign-versioning,campaign-ai-assistant,campaign-dashboard,campaign-collaboration}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Campaign` entity and the 6-category catalog (Acquisition, Engagement, Conversion, Retention, Referral, Promotional) in `backend/src/modules/campaign-core/campaign.entity.ts` (FR-001–FR-003)
- [ ] T005 Implement the 11-stage lifecycle state machine (Idea → Planning → Draft → Content Review → Approval → Scheduling → Ready → Published → Running → Completed → Archived) and the 11-status model (Draft…Cancelled) in `backend/src/modules/campaign-core/campaign-lifecycle.service.ts` (FR-004, FR-006)
- [ ] T006 Implement lifecycle-transition audit logging and permission validation at every stage transition, wired to `001`'s audit-log interceptor (FR-005, FR-007)
- [ ] T007 [P] Define the `Campaign Version` entity as an append-only, never-overwritten snapshot in `backend/src/modules/campaign-versioning/campaign-version.entity.ts` (FR-033, FR-038)
- [ ] T008 [P] Define the `Campaign Schedule` entity in `backend/src/modules/campaign-scheduling/campaign-schedule.entity.ts`
- [ ] T009 [P] Define `Audience Selection`/`Audience Snapshot` entities referencing `019`'s data in `backend/src/modules/campaign-wizard/audience-selection.entity.ts`
- [ ] T010 [P] Define the `Campaign Channel Configuration` entity in `backend/src/modules/campaign-wizard/channel-configuration.entity.ts`
- [ ] T011 [P] Define the `Campaign Content` entity in `backend/src/modules/campaign-wizard/campaign-content.entity.ts`
- [ ] T012 [P] Define the `Campaign Attachment` entity in `backend/src/modules/campaign-wizard/campaign-attachment.entity.ts`
- [ ] T013 [P] Define the `Tracking Configuration` entity in `backend/src/modules/campaign-wizard/tracking-configuration.entity.ts`
- [ ] T014 [P] Define the `Approval Record` entity in `backend/src/modules/campaign-core/approval-record.entity.ts`
- [ ] T015 [P] Define the `AI Suggestion` entity in `backend/src/modules/campaign-ai-assistant/ai-suggestion.entity.ts`
- [ ] T016 [P] Define the `Campaign Template` entity in `backend/src/modules/campaign-dashboard/campaign-template.entity.ts`
- [ ] T017 [P] Define the `Campaign Duplication Record` entity in `backend/src/modules/campaign-dashboard/duplication-record.entity.ts`
- [ ] T018 [P] Define the `Campaign Dashboard Metrics` entity in `backend/src/modules/campaign-dashboard/dashboard-metrics.entity.ts`
- [ ] T019 [P] Define the `Campaign Activity`/`Audit Log Entry` entity, extending `001`'s audit-log pattern, in `backend/src/modules/campaign-core/campaign-activity.entity.ts`
- [ ] T020 Implement omnichannel campaign execution support (Email, SMS, WhatsApp, Push, In-App, Landing Page, Social Media, Web Banner) from a single campaign record in `backend/src/modules/campaign-core/omnichannel-execution.service.ts` (FR-002)
- [ ] T021 Implement conversion/revenue tracking as part of the campaign lifecycle (FR-008)
- [ ] T022 Note: RBAC and the approval-chain hierarchy reuse `016`'s model directly — this feature applies it, it does not redefine roles or approval levels (Constitution Article VII)
- [ ] T023 Note: audience resolution reuses `019`'s CDP directly — this feature only references and snapshots segment data, it does not redefine segment computation
- [ ] T024 Contract test: every one of the 9 pre-publish validation conditions blocks publishing with an actionable error message, in `backend/tests/contract/campaign-prepublish-validation-blocking.contract.test.ts` (FR-027–FR-030, SC-002)
- [ ] T025 Contract test: zero AI-generated campaign content reaches Published status without a recorded, explicit human review action against that specific content, in `backend/tests/contract/campaign-ai-human-review-gate.contract.test.ts` (FR-048, SC-005)
- [ ] T026 Contract test: every campaign save creates a new version record and no prior version is ever overwritten, including on restore, in `backend/tests/contract/campaign-version-immutability.contract.test.ts` (FR-033, FR-038, SC-004)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Create a Campaign via the 9-Step Guided Wizard (P1) 🎯 MVP

**Independent Test**: Start a new campaign, complete all 9 steps with valid data, and confirm a Draft-status campaign record is created and persisted with every field captured.

- [ ] T027 [US1] Wizard orchestration (sequential 9-step flow with state retention across steps) in `backend/src/modules/campaign-wizard/wizard-orchestrator.service.ts` (FR-010, acceptance scenario 1)
- [ ] T028 [US1] Step 1 Basic Information (Name, Code, Type, Business Unit, Owner, Priority, Category, Tags, Description) in `web/src/app/(marketing-admin)/campaigns/create/step-1/page.tsx` (FR-011, acceptance scenario 1)
- [ ] T029 [US1] Step 2 Objectives (Primary/Secondary Goal, Expected ROI, Budget, KPI Targets, Success Metrics) (FR-012)
- [ ] T030 [US1] Step 3 Target Audience selection (Saved/Dynamic Segments, Custom Filters, Geography, Language, Interests, Membership Status, Purchase History, Engagement Score, Device Type), wired to T009/`019` (FR-013)
- [ ] T031 [US1] Step 3 audience preview (estimated size, reach estimate, overlap detection, duplicate removal) (FR-014, acceptance scenario 2)
- [ ] T032 [US1] Step 4 Communication Channels selection (8 channels) (FR-015, acceptance scenario 3)
- [ ] T033 [US1] Step 5 Campaign Content editor (rich text/HTML/Markdown, images, video embedding, personalization tokens, dynamic variables, AI-generated content), scoped to selected channels (FR-016, acceptance scenario 3)
- [ ] T034 [US1] Step 6 Attachments (Images, Videos, PDFs, Audio, GIFs, Documents, custom buttons) (FR-017)
- [ ] T035 [US1] Step 7 Tracking configuration (UTM, conversion events, Google Analytics, Meta Pixel, internal analytics, revenue tracking, custom events) (FR-018)
- [ ] T036 [US1] Step 8 Approval configuration (Reviewer, Approval Level, Approval Deadline, Required Comments) (FR-019)
- [ ] T037 [US1] Step 9 Schedule choice capture (FR-020)
- [ ] T038 [US1] Draft-save-under-2-seconds with version-1 generation, wired to T007 (acceptance scenario 4)
- [ ] T039 [P] [US1] 9-step wizard UI shell
- [ ] T040 [US1] Integration test: Step-1-to-Step-2 retention, Step-3 audience preview, Step-4-to-Step-5 channel-scoped content, full-wizard Draft creation under 2s — all 4 acceptance scenarios in `backend/tests/integration/us1-campaign-wizard.integration.test.ts`

**Checkpoint**: The single entry point for every campaign in the platform is independently functional.

---

## Phase 4: User Story 2 — Schedule a Campaign: Immediate, Future, Recurring, or Event-Triggered (P1)

**Independent Test**: Take a completed campaign draft to Step 9, select each of the four scheduling modes in turn, and confirm the resulting campaign record reflects the chosen schedule type and parameters.

- [ ] T041 [US2] Immediate scheduling mode in `backend/src/modules/campaign-scheduling/immediate-mode.service.ts` (FR-021, acceptance scenario 1)
- [ ] T042 [US2] Scheduled mode with future date/time plus time zone (FR-022, FR-025, acceptance scenario 2)
- [ ] T043 [US2] Recurring mode (Daily/Weekly/Monthly/Quarterly/Yearly/custom) with expiry date (FR-023, FR-026, acceptance scenario 3)
- [ ] T044 [US2] Event-Based mode (Registration, Purchase, Login, Referral, Premium upgrade, Course completion, Ebook download triggers) (FR-024, acceptance scenario 4)
- [ ] T045 [US2] Expiry-date enforcement for Recurring/Event-Based campaigns (FR-026, SC-009)
- [ ] T046 [P] [US2] Schedule configuration UI (Step 9)
- [ ] T047 [US2] Integration test: immediate queue on publish, scheduled runs only at future time in timezone, weekly recurring until expiry, event-based triggers per event — all 4 acceptance scenarios in `backend/tests/integration/us2-campaign-scheduling.integration.test.ts`

**Checkpoint**: Correct, predictable timing for every campaign type is independently functional.

---

## Phase 5: User Story 3 — Pre-Publish Validation Blocks Incomplete or Broken Campaigns (P1)

**Independent Test**: Attempt to publish a campaign with a deliberately broken link and confirm publish is blocked with a specific, actionable error, while an otherwise-identical campaign with a valid link publishes successfully.

- [ ] T048 [US3] Full validation-check suite (audience availability, required approvals, template completeness, broken links, missing images, personalization variables, tracking configuration, channel availability), wired to T024, in `backend/src/modules/campaign-validation/prepublish-validation.service.ts` (FR-027, acceptance scenario 1)
- [ ] T049 [US3] Publish-blocking plus detailed actionable error messages (FR-028, FR-030, acceptance scenario 2)
- [ ] T050 [US3] Validation-condition catalog (missing audience, invalid schedule, empty content, approval pending, missing tracking, expired template, channel unavailable, budget exceeded) (FR-029, acceptance scenario 3)
- [ ] T051 [US3] Validation performance under 3s plus publish performance under 10s once passed (FR-031, FR-032, acceptance scenario 4)
- [ ] T052 [P] [US3] Pre-publish validation results UI
- [ ] T053 [US3] Integration test: broken-link blocks with specific error, missing-approval blocks, unresolved-personalization-token reported, passing campaign publishes within targets — all 4 acceptance scenarios in `backend/tests/integration/us3-prepublish-validation.integration.test.ts`

**Checkpoint**: The platform's primary safeguard against sending broken, non-compliant, or unapproved campaigns is independently functional.

---

## Phase 6: User Story 4 — Route a Campaign Through Content Review and Approval (P2)

**Independent Test**: Submit a completed campaign for approval with a designated reviewer, confirm the campaign status becomes "Awaiting Approval," and confirm the campaign cannot progress to "Scheduled" until an "Approved" decision is recorded.

- [ ] T054 [US4] Draft-to-Awaiting-Review-to-Awaiting-Approval transition with reviewer notification, wired to T014, in `backend/src/modules/campaign-core/approval-workflow.service.ts` (FR-019, acceptance scenario 1)
- [ ] T055 [US4] Approval decision recording (approve/reject) with an audit record (reviewer, decision, timestamp) (acceptance scenario 2)
- [ ] T056 [US4] Scheduled-transition block absent an Approved decision, wired to T022 (acceptance scenario 3)
- [ ] T057 [US4] Approval-deadline-passed handling — the campaign remains blocked, its pending-state stays dashboard-visible (acceptance scenario 4)
- [ ] T058 [P] [US4] Approval workflow UI
- [ ] T059 [US4] Integration test: submit-for-review status progression, approval recorded with audit, direct-to-scheduled blocked without approval, deadline passed stays blocked — all 4 acceptance scenarios in `backend/tests/integration/us4-content-approval.integration.test.ts`

**Checkpoint**: The mandatory governance gate before unreviewed content can reach members is independently functional.

---

## Phase 7: User Story 5 — Compare and Restore Prior Campaign Versions (P2)

**Independent Test**: Save a campaign three times with different content edits, confirm three distinct version records exist, compare version 1 to version 3, and restore version 1 as the active content.

- [ ] T060 [US5] Version-record creation on every save (number, author, timestamp, change summary, approval status), wired to T007/T026 (FR-033, FR-034, acceptance scenario 1)
- [ ] T061 [US5] Version compare (side-by-side diff) in `backend/src/modules/campaign-versioning/version-compare.service.ts` (FR-035, acceptance scenario 2)
- [ ] T062 [US5] Version restore (prior version becomes active, a new version record is created for the restore action) (FR-036, acceptance scenario 3)
- [ ] T063 [US5] Version download (FR-037, acceptance scenario 4)
- [ ] T064 [P] [US5] Version history UI
- [ ] T065 [US5] Integration test: save creates a non-destructive version, compare shows the diff, restore creates a new version rather than overwriting, download exports the specific version — all 4 acceptance scenarios in `backend/tests/integration/us5-version-control.integration.test.ts`

**Checkpoint**: Safe undo and approval-integrity preservation across multi-collaborator editing is independently functional.

---

## Phase 8: User Story 6 — Use the AI Campaign Assistant With Mandatory Human Review (P2)

**Independent Test**: Request an AI-generated subject line for a draft campaign, confirm the suggestion is inserted as an editable, unpublished draft field, and confirm the campaign cannot be published with that suggestion in place until a human has explicitly accepted it.

- [ ] T066 [US6] AI campaign-name-suggestion generation consuming `008`'s gateway in `backend/src/modules/campaign-ai-assistant/name-suggestion.service.ts` (FR-039)
- [ ] T067 [US6] AI subject-line-suggestion generation, wired to T015 (FR-040, acceptance scenario 1)
- [ ] T068 [US6] AI campaign-content-suggestion generation (FR-041)
- [ ] T069 [US6] AI CTA-recommendation generation (FR-042)
- [ ] T070 [US6] AI audience-recommendation generation, applying to Step 3 with no different validation path (FR-043, acceptance scenario 4)
- [ ] T071 [US6] AI best-send-time prediction (FR-044)
- [ ] T072 [US6] AI predicted-open-rate and predicted-CTR generation (FR-045, FR-046, acceptance scenario 3)
- [ ] T073 [US6] AI campaign-score generation (FR-047)
- [ ] T074 [US6] Mandatory human-review-and-approval gate before any AI suggestion can be incorporated into a publishable campaign, wired to T025's contract test, in `backend/src/modules/campaign-ai-assistant/human-review-gate.service.ts` (FR-048, acceptance scenario 2)
- [ ] T075 [US6] Prediction estimate-not-guarantee labeling (FR-049, acceptance scenario 3)
- [ ] T076 [P] [US6] AI Campaign Assistant UI
- [ ] T077 [US6] Integration test: suggestions appear as editable drafts not live content, publish blocked without a recorded review, predictions labeled as estimates, accepted audience recommendation applies with standard validation — all 4 acceptance scenarios in `backend/tests/integration/us6-ai-campaign-assistant.integration.test.ts`

**Checkpoint**: Article II's safe-adoption gate for AI-accelerated campaign creation is independently functional.

---

## Phase 9: User Story 7 — Duplicate a Campaign or Start From a Template (P3)

**Independent Test**: Duplicate an existing, fully configured campaign, confirm the duplicate copies the source's audience/schedule/templates/automation/tracking, edit fields on the duplicate, and confirm the original is unchanged.

- [ ] T078 [US7] Campaign duplication (audience, schedule, templates, automation workflow, tracking copied), wired to T017 (FR-054, acceptance scenario 1)
- [ ] T079 [US7] Duplicate-field editing (name, schedule, audience, budget, objectives) without altering the source (FR-055, acceptance scenario 2)
- [ ] T080 [US7] Template library (Welcome Campaign, Premium Upgrade, Webinar Reminder, Festival Offer, Flash Sale, Product Launch, Birthday Wishes, Membership Renewal, Referral Invite, Abandoned Cart), wired to T016 (FR-052, acceptance scenario 3)
- [ ] T081 [US7] Template clone/edit/save/share/version/archive (FR-053, acceptance scenario 4)
- [ ] T082 [P] [US7] Duplication and template library UI
- [ ] T083 [US7] Integration test: duplicate copies full configuration, duplicate edits isolated from source, template selection pre-populates the wizard, template clone creates a new version without altering the original — all 4 acceptance scenarios in `backend/tests/integration/us7-duplication-templates.integration.test.ts`

**Checkpoint**: The efficiency layer reducing repetitive campaign setup is independently functional.

---

## Phase 10: Dashboard, Archiving & Collaboration remainder (supports FR-050–FR-051, FR-056–FR-062; cross-cutting, no single owning story)

- [ ] T084 Campaign Dashboard Metrics (status, reach, opens, clicks, conversions, revenue, ROI, delivery rate, bounce rate, unsubscribe count, complaint rate, last-modified timestamp), wired to T018 (FR-050)
- [ ] T085 Dashboard-refresh-under-2s plus search-under-500ms performance (FR-051)
- [ ] T086 Archived-campaign read-only marking, searchable, analytics/audit history preserved (FR-056)
- [ ] T087 Archived-campaign restoration (FR-057)
- [ ] T088 Archived-campaign exclusion from active dashboards unless explicitly requested (FR-058)
- [ ] T089 Multi-simultaneous-editor support in `backend/src/modules/campaign-collaboration/multi-editor.service.ts` (FR-059)
- [ ] T090 Comments, @mentions, approval notes, activity timeline, draft sharing, change requests (FR-060)
- [ ] T091 Real-time execution monitoring (deliveries, opens, clicks, conversions, revenue, failures, bounce rates, spam complaints, queue status, processing speed) (FR-061)
- [ ] T092 Auto-refreshing real-time metrics without manual reload (FR-062)

**Checkpoint**: The full dashboard, archiving, and multi-collaborator experience is independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T093 [P] Security hardening pass (RBAC enforcement, audit logging, version control, secure file uploads, encrypted API communication, session validation, rate limiting) (FR-063, FR-064)
- [ ] T094 Performance hardening pass toward all 6 numeric targets (campaign creation, draft save, publish validation, publish, dashboard refresh, campaign search) (FR-065)
- [ ] T095 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (autonomous-execution Article-II conflict, restore-vs-re-approval behavior, concurrent-edit conflict resolution, budget-exceeded threshold)
- [ ] T096 Final audit: cross-check every FR-001–FR-065 against an implementation or validation task; verify this feature defers per-channel delivery/AI-gateway/RBAC/attribution mechanics to `020`/`021`/`023`/`031`/`008`/`016`/`027`/`028` rather than duplicating them
- [ ] T097 Run `quickstart.md` validation end-to-end across all 7 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `019`'s audience data, `008`'s AI gateway, and `016`'s RBAC/approval model, and produces the lifecycle/entity infrastructure every subsequent phase depends on.
- **P1 stories (US1–US3)**: US1 (wizard) is the single entry point for every campaign and must ship first; US2 (scheduling) and US3 (pre-publish validation) both depend on US1 producing a completed draft, and can build in parallel with each other once US1 is stable.
- **P2 stories (US4–US6)**: US4 (approval) depends on US1's Step 8 configuration; US5 (version control) depends on Foundational's version entity and benefits from US1/US4 producing edits to version; US6 (AI assistant) depends on US1's content/audience steps existing to attach suggestions to — all three can build in parallel once US1 is stable.
- **P3 story (US7)** depends on US1–US3 producing a fully configured campaign to duplicate from — build last among the prioritized stories.
- **Phase 10 (Dashboard/Archiving/Collaboration remainder)** depends on Foundational's dashboard/activity entities and benefits from US1–US6 producing real campaign data; can build in parallel with US7.
- **Polish (Phase 11)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (lifecycle, entities, RBAC/audience integration) → **STOP and VALIDATE** the three Foundational contract tests (pre-publish-validation-blocking, AI-human-review-gate, version-immutability) pass → US1 (9-step wizard) → **STOP and VALIDATE** a complete campaign can be drafted end to end → US2 (scheduling) + US3 (pre-publish validation) in parallel → **STOP and VALIDATE** campaigns schedule correctly and never publish broken/unapproved → US4 (approval) + US5 (version control) + US6 (AI assistant) in parallel → US7 (duplication/templates) → Phase 10 (dashboard/archiving/collaboration) → Polish.
