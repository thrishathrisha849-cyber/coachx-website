---
description: "Task list for Feature 013 — CRM, Sales Pipeline, Customer Success & Support Desk"
---

# Tasks: CRM, Sales Pipeline, Customer Success & Support Desk

**Input**: Design documents from `/specs/013-crm-sales-support/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature extends for field-level access control and the full business/security audit trail). This feature integrates with, but does not require full completion of, `004`/`005`/`007`/`010`/`011`/`012` (event sources) and `008`/`009` (AI gateway, payment reference) — those integration points are called out explicitly where used.

**Tests**: Included throughout — this feature is the constitution's most-cited feature across four distinct citation points (Articles II, VI, VII, and the Security Baseline); duplicate-lead-detection, AI-never-autonomous, and cross-organization-isolation get dedicated Foundational contract tests, matching this spec's own SC-001, SC-002, and SC-008.

**Organization**: Tasks are grouped by user story (US1–US9 from spec.md), plus six supplementary cross-cutting phases whose FR groups are not owned by any single prioritized story (Contact/Account 360 & Sales Activity/Quotation/Contract FR-031–FR-037, FR-051–FR-069; Sales Targets/Forecasting/Territory & Data Platform FR-070–FR-079; Customer Onboarding/Portal/Feedback FR-080–FR-082, FR-141–FR-150; Support Desk remainder & Incident Management FR-100–FR-113; AI Guardrails remainder/Reporting/Integration FR-129–FR-133, FR-161–FR-170, FR-186–FR-193).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor this feature extends)
- [ ] T002 Resolve `research.md` open items before proceeding: AI confidence-threshold defaults and fallback-when-AI-unavailable behavior, maximum export record limit, record-restoration recovery-period length, the full enumerated SLA-pause status/condition list, and the chatbot handover message-count/elapsed-time limit
- [ ] T003 [P] Add `backend/src/modules/{crm-org-rbac,crm-lead,crm-contact-account,crm-opportunity,crm-sales-activity,crm-targets-territory,crm-data-platform,crm-onboarding,crm-customer-success,crm-support-ticket,crm-sla,crm-live-chat,crm-ai-guardrails,crm-knowledge-base,crm-portal-feedback,crm-workflow,crm-reporting,crm-data-ops,crm-privacy,crm-integration}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define `Organization` and `Business Unit` entities in `backend/src/modules/crm-org-rbac/organization.entity.ts` (FR-004, FR-006)
- [ ] T005 [P] Define `Department`/`Team` entities in `backend/src/modules/crm-org-rbac/team.entity.ts` (FR-012)
- [ ] T006 Define `Role`/`Permission`/`Permission Group` entities with the field-level access-level model (No Access…Administer) in `backend/src/modules/crm-org-rbac/rbac.entity.ts` (FR-002, FR-003)
- [ ] T007 [P] Define the CRM `User` entity extending `001`'s identity in `backend/src/modules/crm-org-rbac/crm-user.entity.ts` (FR-010)
- [ ] T008 [P] Define working-hours and holiday-calendar configuration in `backend/src/modules/crm-org-rbac/working-hours.entity.ts` (FR-007, FR-008)
- [ ] T009 Define the `Lead` entity and its status state machine (New…Spam) in `backend/src/modules/crm-lead/lead.entity.ts` (FR-013, FR-017)
- [ ] T010 [P] Define `Lead Source`, `Lead Score`, `Lead Assignment` entities in `backend/src/modules/crm-lead/` (FR-014, FR-026, FR-019)
- [ ] T011 [P] Define the `Contact` entity in `backend/src/modules/crm-contact-account/contact.entity.ts` (FR-031)
- [ ] T012 [P] Define `Account`/`Account Relationship` entities in `backend/src/modules/crm-contact-account/account.entity.ts` (FR-033, FR-035)
- [ ] T013 Define `Opportunity` and `Pipeline`/`Pipeline Stage` entities in `backend/src/modules/crm-opportunity/opportunity.entity.ts` (FR-038, FR-039, FR-040)
- [ ] T014 [P] Define the `Opportunity Product` entity in `backend/src/modules/crm-opportunity/opportunity-product.entity.ts` (FR-045)
- [ ] T015 [P] Define `Activity` (Task/Call/Meeting/Note) entities in `backend/src/modules/crm-sales-activity/activity.entity.ts` (FR-051)
- [ ] T016 [P] Define `Product` and `Price Book`/`Price Book Item` entities in `backend/src/modules/crm-sales-activity/product.entity.ts` (FR-061)
- [ ] T017 [P] Define `Quote`/`Quote Item` entities with a version lifecycle in `backend/src/modules/crm-sales-activity/quote.entity.ts` (FR-062, FR-063)
- [ ] T018 [P] Define the `Sales Order` entity in `backend/src/modules/crm-sales-activity/sales-order.entity.ts` (FR-066)
- [ ] T019 [P] Define the `Contract` entity with its status lifecycle in `backend/src/modules/crm-sales-activity/contract.entity.ts` (FR-067)
- [ ] T020 [P] Define the `Payment` (CRM reference view) entity in `backend/src/modules/crm-sales-activity/payment-view.entity.ts` (FR-069)
- [ ] T021 [P] Define `Sales Target`/`Forecast` entities in `backend/src/modules/crm-targets-territory/` (FR-070, FR-071)
- [ ] T022 [P] Define the `Territory` entity in `backend/src/modules/crm-targets-territory/territory.entity.ts` (FR-073)
- [ ] T023 [P] Define `Tag`/`Custom Field`/`Custom Field Value`/`Custom Layout` entities in `backend/src/modules/crm-data-platform/` (FR-075, FR-076, FR-077)
- [ ] T024 [P] Define `Onboarding Template`/`Project`/`Task` entities in `backend/src/modules/crm-onboarding/` (FR-080, FR-081)
- [ ] T025 [P] Define `Customer Health Score`/`Health Score Factor` entities in `backend/src/modules/crm-customer-success/health-score.entity.ts` (FR-084, FR-085)
- [ ] T026 [P] Define `Customer Success Plan`/`Customer Goal` and `Customer Risk` entities in `backend/src/modules/crm-customer-success/` (FR-086, FR-087)
- [ ] T027 [P] Define the `Customer Review` (Business Review) entity in `backend/src/modules/crm-customer-success/business-review.entity.ts` (FR-092)
- [ ] T028 [P] Define the `Renewal`/`Expansion Opportunity` entity in `backend/src/modules/crm-customer-success/renewal.entity.ts` (FR-089)
- [ ] T029 [P] Define the `Support Entitlement` entity in `backend/src/modules/crm-support-ticket/support-entitlement.entity.ts` (FR-113)
- [ ] T030 Define `Ticket`/`Ticket Category`/`Ticket Message`/`Ticket Note` entities and the ticket status state machine (New…Spam) in `backend/src/modules/crm-support-ticket/ticket.entity.ts` (FR-095, FR-099)
- [ ] T031 [P] Define the `Support Queue` entity in `backend/src/modules/crm-support-ticket/support-queue.entity.ts` (FR-100)
- [ ] T032 [P] Define `SLA Policy`/`SLA Event` entities in `backend/src/modules/crm-sla/sla-policy.entity.ts` (FR-114, FR-115)
- [ ] T033 [P] Define the `Escalation` entity in `backend/src/modules/crm-sla/escalation.entity.ts` (FR-117)
- [ ] T034 [P] Define `Chat Session`/`Chat Message`/`Chat Agent` and `Chatbot Session` entities in `backend/src/modules/crm-live-chat/` (FR-118, FR-126)
- [ ] T035 [P] Define `Knowledge Category`/`Knowledge Article`/`Article Version`/`Article Feedback` entities in `backend/src/modules/crm-knowledge-base/` (FR-134, FR-135, FR-139)
- [ ] T036 [P] Define `Incident`/`Problem`/`Root Cause Report` entities in `backend/src/modules/crm-support-ticket/incident.entity.ts` (FR-107)
- [ ] T037 [P] Define `Customer Feedback`/`Survey`/`Survey Question`/`Survey Response` entities in `backend/src/modules/crm-portal-feedback/` (FR-145)
- [ ] T038 [P] Define `Workflow Definition`/`Version`/`Run`/`Run Step` entities in `backend/src/modules/crm-workflow/workflow.entity.ts` (FR-151, FR-157)
- [ ] T039 [P] Define `Approval Definition`/`Request`/`Action` entities in `backend/src/modules/crm-workflow/approval.entity.ts` (FR-158)
- [ ] T040 [P] Define `Notification Template`/`Notification Event` entities in `backend/src/modules/crm-workflow/notification.entity.ts` (FR-159)
- [ ] T041 [P] Define `Webhook`/`Webhook Delivery` entities in `backend/src/modules/crm-integration/webhook.entity.ts` (FR-188)
- [ ] T042 [P] Define the `Consent Record` entity in `backend/src/modules/crm-privacy/consent-record.entity.ts` (FR-181, FR-182, Constitution Article VI)
- [ ] T043 Note: `Audit Log Entry` reuses `001`'s audit-log interceptor directly, extended with the CRM-specific field set (user, action, module, record, previous/new value, timestamp, IP, device, source, reason) (FR-179)
- [ ] T044 Implement cross-organization tenant-isolation enforcement across every access path (UI, API, export, search) in `backend/src/modules/crm-org-rbac/tenant-isolation.service.ts` (FR-005)
- [ ] T045 Implement the field-level RBAC enforcement layer extending `001`'s `RbacGuard`, applied to every record read/write/export path, in `backend/src/modules/crm-org-rbac/field-level-rbac.service.ts` (FR-001–FR-003, Constitution Article VII)
- [ ] T046 Implement the duplicate-lead-detection engine (email, phone, WhatsApp number, company, website domain, tax number, external ID matching) with warn/block/merge/link/allow-with-justification actions, run before every lead creation, in `backend/src/modules/crm-lead/duplicate-detection.service.ts` (FR-015, FR-022)
- [ ] T047 Implement the sensitive-field masking and authorized-reveal-with-logging service in `backend/src/modules/crm-privacy/field-masking.service.ts` (FR-183, Constitution Article VI/VII)
- [ ] T048 Note: role/permission enforcement reuses `001`'s layered RBAC directly as the base for the field-level extension built in T045 (Constitution Article VII)
- [ ] T049 Contract test: duplicate detection runs before every lead creation across every configured lead source, with zero silent duplicate creation, in `backend/tests/contract/crm-duplicate-lead-detection.contract.test.ts` (FR-015, SC-001)
- [ ] T050 Contract test: no AI-driven lead disqualification or AI-drafted customer commitment/pricing/binding term ever takes effect without a human-reviewable step, in `backend/tests/contract/crm-ai-never-autonomous.contract.test.ts` (FR-030, FR-132, SC-002)
- [ ] T051 Contract test: zero cross-organization data exposure across leads/contacts/accounts/tickets/knowledge-articles/reports under every access path, in `backend/tests/contract/crm-tenant-isolation.contract.test.ts` (FR-005, SC-008)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Multi-Channel Lead Capture With Duplicate Detection (P1) 🎯 MVP

**Independent Test**: Submit the same contact's details through two different configured lead sources and confirm the system surfaces a duplicate warning/merge/link decision rather than silently creating two lead records, while a genuinely new contact is captured cleanly with full source attribution.

- [ ] T052 [US1] Lead record data model (full field set), wired to T009 (FR-013)
- [ ] T053 [US1] Configurable lead-source catalog (24+ sources) in `backend/src/modules/crm-lead/lead-source.service.ts` (FR-014)
- [ ] T054 [US1] Multi-channel lead capture (website forms, mobile forms, landing pages, public APIs, CRM integrations, email inboxes, chat, WhatsApp, event registrations, course/marketplace/membership enquiries, employer forms, manual entry, bulk imports), wired to T046's duplicate-detection engine, in `backend/src/modules/crm-lead/lead-capture.service.ts` (FR-015, acceptance scenario 1)
- [ ] T055 [US1] Dynamic lead form builder (14 field types, conditional fields, consent checkbox) generating public URL/embeddable code/QR/API endpoint/submission analytics, in `backend/src/modules/crm-lead/lead-form-builder.service.ts` (FR-016, acceptance scenario 3)
- [ ] T056 [US1] Lead qualification evaluation plus conversion to Account/Contact/Opportunity in `backend/src/modules/crm-lead/lead-qualification.service.ts` (FR-018)
- [ ] T057 [US1] Lead assignment methods (manual, round-robin, territory, product, language, source, availability, workload, priority, AI-assisted) with assignment/reassignment logging in `backend/src/modules/crm-lead/lead-assignment.service.ts` (FR-019)
- [ ] T058 [US1] Lead ownership tracking (primary/supporting owner, team, department, territory) with change history in `backend/src/modules/crm-lead/lead-ownership.service.ts` (FR-020)
- [ ] T059 [US1] Lead distribution rule configuration (conditions, priority, strategy, fallback, working hours, daily limits, geography, expertise) with pre-activation testing in `backend/src/modules/crm-lead/distribution-rules.service.ts` (FR-021)
- [ ] T060 [US1] Duplicate-detection warn/block/merge/link/allow-with-justification decision surfacing at the point of second submission, wired to T046, in `backend/src/modules/crm-lead/duplicate-decision.service.ts` (FR-022, acceptance scenario 2)
- [ ] T061 [US1] Lead merge workflow (master selection, field-by-field comparison, activity/attachment/note merge, audit preservation, traceable archive not delete) in `backend/src/modules/crm-lead/lead-merge.service.ts` (FR-023, acceptance scenario 4)
- [ ] T062 [US1] Lead conversion transaction (Account/Contact create-or-link, Opportunity create, activity/note/file transfer, source-attribution preservation, mark-converted, prevent repeated conversion) in `backend/src/modules/crm-lead/lead-conversion.service.ts` (FR-024, edge case: double conversion)
- [ ] T063 [US1] Round-robin assignment engine (active-user tracking, schedule check, capacity respect, skip-unavailable, fair distribution, priority users, decision logging, fallback rules) in `backend/src/modules/crm-lead/round-robin.service.ts` (FR-025)
- [ ] T064 [P] [US1] Lead capture/inbox UI in `web/src/app/(crm)/leads/page.tsx`
- [ ] T065 [US1] Integration test: form submission with source attribution, duplicate warning on second channel, dynamic form publish with duplicate check, merge workflow traceable archive — all 4 acceptance scenarios in `backend/tests/integration/us1-lead-capture.integration.test.ts`

**Checkpoint**: The foundational data-integrity guarantee every other CRM capability depends on is independently functional.

---

## Phase 4: User Story 2 — AI-Assisted Lead Scoring With Explainable Recommendations (P1)

**Independent Test**: Trigger a scoring run on a lead with known engagement history and confirm the resulting score/category is accompanied by a human-readable explanation, and a very low AI-predicted score does not auto-change the lead's status without a human-reviewable step.

- [ ] T066 [US2] Rule-based scoring engine (configurable positive/negative conditions, 0–100 scale, Cold/Warm/Hot/Sales Ready categorization) in `backend/src/modules/crm-lead/rule-based-scoring.service.ts` (FR-026, FR-027, acceptance scenario 1)
- [ ] T067 [US2] AI-assisted scoring analysis (historical conversions, profile, interaction history, sentiment, email engagement, purchase behavior, usage, source performance, cycle patterns) consuming `008`'s gateway, in `backend/src/modules/crm-lead/ai-scoring.service.ts` (FR-028, acceptance scenario 2)
- [ ] T068 [US2] Score-explanation generation (human-readable contributing-factor string) in `backend/src/modules/crm-lead/score-explanation.service.ts` (FR-029, acceptance scenario 2)
- [ ] T069 [US2] AI-disqualification human-review gate, wired to T050's contract test, in `backend/src/modules/crm-lead/ai-disqualification-gate.service.ts` (FR-030, acceptance scenario 3)
- [ ] T070 [US2] Score-detail breakdown UI showing every contributing rule/AI factor and point value in `web/src/components/crm/score-breakdown.tsx` (FR-029, acceptance scenario 4)
- [ ] T071 [P] [US2] Lead scoring display UI
- [ ] T072 [US2] Integration test: rule-based score/category computation, AI explanation display, disqualification routes to human review, factor-detail visibility — all 4 acceptance scenarios in `backend/tests/integration/us2-lead-scoring.integration.test.ts`

**Checkpoint**: Article II's most explicit invocation in this volume — AI never silently disqualifies — is independently functional.

---

## Phase 5: User Story 3 — Opportunity Management Through a Configurable Sales Pipeline (P1)

**Independent Test**: Create an opportunity in a specific pipeline, drag its Kanban card through two stages, and confirm the stage change updates automatically, probability recalculates, an audit record is created, and mandatory fields for the destination stage are enforced.

- [ ] T073 [US3] Opportunity record data model, wired to T013 (FR-038)
- [ ] T074 [US3] Multiple independent sales pipelines with per-pipeline configuration in `backend/src/modules/crm-opportunity/pipeline-config.service.ts` (FR-039)
- [ ] T075 [US3] Default 11-stage pipeline (New Opportunity…Closed Lost), organization-customizable, in `backend/src/modules/crm-opportunity/default-pipeline.service.ts` (FR-040)
- [ ] T076 [US3] Per-stage configuration (name, description, order, default probability, mandatory fields, max duration, entry/exit conditions, automated tasks, notifications, approval requirement) in `backend/src/modules/crm-opportunity/stage-config.service.ts` (FR-041)
- [ ] T077 [US3] Drag-and-drop Kanban pipeline view in `web/src/app/(crm)/pipeline/page.tsx` (FR-042)
- [ ] T078 [US3] Kanban card-move transaction (stage update, probability recalculation, audit record, stage automation trigger, mandatory-field validation blocking incomplete moves) in `backend/src/modules/crm-opportunity/kanban-move.service.ts` (FR-043, acceptance scenarios 1, 2)
- [ ] T079 [US3] Table/list/grouped/calendar/forecast opportunity views with saved views, export, bulk actions in `web/src/app/(crm)/opportunities/page.tsx` (FR-044)
- [ ] T080 [US3] Opportunity product line items with automatic total calculation, wired to T014 (FR-045)
- [ ] T081 [US3] Weighted-pipeline-value calculation (Value × Probability) with system/user-adjusted/AI-predicted probability and manual-change logging in `backend/src/modules/crm-opportunity/weighted-value.service.ts` (FR-046)
- [ ] T082 [US3] Deal-health classification (Healthy/At Risk/Stalled/Critical/Won/Lost) from configurable factors in `backend/src/modules/crm-opportunity/deal-health.service.ts` (FR-047)
- [ ] T083 [US3] Stalled-opportunity detection job with owner-plus-manager notification in `backend/src/modules/crm-opportunity/stalled-detection.service.ts` (FR-048, acceptance scenario 3)
- [ ] T084 [US3] Closed Won/Closed Lost data capture (final value/products/terms/win-reason / loss-reason/competitor/feedback/reopen-plan) in `backend/src/modules/crm-opportunity/closed-outcome.service.ts` (FR-049)
- [ ] T085 [US3] Opportunity reopen workflow preserving previous closed-date/loss-reason alongside reopen metadata, never silently becoming Won, in `backend/src/modules/crm-opportunity/reopen.service.ts` (FR-050, acceptance scenario 4)
- [ ] T086 [P] [US3] Kanban pipeline UI polish
- [ ] T087 [US3] Integration test: stage-move recalculates and audits, mandatory field blocks incomplete move, stalled-deal detection and notification, reopen preserves history — all 4 acceptance scenarios in `backend/tests/integration/us3-opportunity-pipeline.integration.test.ts`

**Checkpoint**: The core sales-execution surface and forecast/revenue-reporting driver is independently functional.

---

## Phase 6: User Story 4 — Support Agent Resolving a Ticket Within SLA With Escalation (P1)

**Independent Test**: Create a ticket against an SLA policy with a short first-response target, let the timer approach breach, and confirm the pre-breach warning fires before the deadline and the post-breach escalation fires exactly at breach.

- [ ] T088 [US4] Centralized ticket system across all TBT modules and channels, wired to T030 (FR-093, FR-094)
- [ ] T089 [US4] Ticket record data model (full field set) plus configurable numbering format in `backend/src/modules/crm-support-ticket/ticket-creation.service.ts` (FR-095, FR-096)
- [ ] T090 [US4] Dynamic ticket categories/subcategories in `backend/src/modules/crm-support-ticket/ticket-category.service.ts` (FR-097)
- [ ] T091 [US4] Priority (customer/agent/rule/AI) distinct from severity in `backend/src/modules/crm-support-ticket/ticket-priority.service.ts` (FR-098, FR-099, FR-100)
- [ ] T092 [US4] Ticket status lifecycle (New…Spam) with the full workflow sequence in `backend/src/modules/crm-support-ticket/ticket-status.service.ts` (FR-101, FR-102)
- [ ] T093 [US4] SLA policy configuration (first response, next response, resolution, business hours, holidays, priority conditions, tier, escalation rules) in `backend/src/modules/crm-sla/sla-policy-config.service.ts` (FR-114)
- [ ] T094 [US4] SLA timer display (time remaining per target, paused time, breach status) respecting business-hours/holiday pause, wired to T032 (FR-115, acceptance scenarios 1, 2)
- [ ] T095 [US4] Pre-breach warning sequence (agent warning, team-lead notification, dashboard warning, priority increase) in `backend/src/modules/crm-sla/pre-breach-warning.service.ts` (FR-116, acceptance scenario 3)
- [ ] T096 [US4] Post-breach escalation sequence (breach flag, manager notification, escalation trigger, breach-duration record, reporting inclusion), wired to T033, in `backend/src/modules/crm-sla/post-breach-escalation.service.ts` (FR-116, acceptance scenario 4)
- [ ] T097 [US4] Escalation chain (Agent → Team Lead → Support Manager → Department Head → Org Admin) triggerable by SLA risk/breach/critical priority/negative sentiment/VIP/repeated reopens/complaints/payment impact/security/outage in `backend/src/modules/crm-sla/escalation-chain.service.ts` (FR-117)
- [ ] T098 [P] [US4] Agent ticket-console UI with SLA countdown in `web/src/app/(support)/tickets/[ticketId]/page.tsx`
- [ ] T099 [US4] Integration test: SLA display with paused time, business-hours/holiday pause correctness, pre-breach warning sequence timing, post-breach escalation sequence — all 4 acceptance scenarios in `backend/tests/integration/us4-sla-escalation.integration.test.ts`

**Checkpoint**: The support desk's core promise to customers is independently functional.

---

## Phase 7: User Story 5 — Customer Success Manager Tracking a Health-Score-Triggered Renewal (P2)

**Independent Test**: Configure health score factors and thresholds, artificially lower an account's inputs until the score crosses into "At Risk," and confirm a customer-success task is auto-created; separately confirm a renewal record 120 days from its date triggers the first reminder automatically.

- [ ] T100 [US5] Health-score-factor configuration (weights, thresholds, refresh frequency) in `backend/src/modules/crm-customer-success/health-score-config.service.ts` (FR-085, acceptance scenario 1)
- [ ] T101 [US5] Health-score computation (0–100, Healthy/Neutral/At Risk/Critical) from login/usage/course/membership/tickets/payment/feedback/response/contract/community/event/milestone factors, with retained history, wired to T025, in `backend/src/modules/crm-customer-success/health-score.service.ts` (FR-084, acceptance scenario 1)
- [ ] T102 [US5] Automatic customer-success-task creation on health-score drop/contract-expiry/critical-ticket/usage-decline/negative-feedback/overdue-payment/inactive-contact/renewal-probability-decrease in `backend/src/modules/crm-customer-success/auto-task.service.ts` (FR-088, acceptance scenario 2)
- [ ] T103 [US5] Customer success plan (goal, outcome, metrics, milestones, tasks, owners, dates, risks, progress, review schedule) in `backend/src/modules/crm-customer-success/success-plan.service.ts` (FR-086)
- [ ] T104 [US5] Customer risk tracking (type, severity, probability, impact, owner, mitigation, due date, status) in `backend/src/modules/crm-customer-success/customer-risk.service.ts` (FR-087)
- [ ] T105 [US5] Renewal record plus pipeline (Upcoming…Not Renewed), wired to T028, in `backend/src/modules/crm-customer-success/renewal.service.ts` (FR-089)
- [ ] T106 [US5] Renewal automation (120/90/60/30-day reminders, renewal-opportunity creation, owner/CSM notification, customer communication, high-value escalation) in `backend/src/modules/crm-customer-success/renewal-automation.service.ts` (FR-090, acceptance scenario 3)
- [ ] T107 [US5] At-risk high-value renewal escalation with account-owner-plus-CSM notification in `backend/src/modules/crm-customer-success/renewal-escalation.service.ts` (FR-090 tie, acceptance scenario 4)
- [ ] T108 [US5] Upsell/cross-sell recommendation engine in `backend/src/modules/crm-customer-success/upsell-recommendation.service.ts` (FR-091)
- [ ] T109 [US5] Business review recording (Monthly/Quarterly/Annual), wired to T027, in `backend/src/modules/crm-customer-success/business-review.service.ts` (FR-092)
- [ ] T110 [P] [US5] CSM portfolio dashboard UI in `web/src/app/(crm)/customer-success/page.tsx`
- [ ] T111 [US5] Integration test: health-score recalculation and reclassification, auto-task creation on at-risk, 120-day reminder firing and pipeline progression, high-value-renewal escalation — all 4 acceptance scenarios in `backend/tests/integration/us5-health-renewal.integration.test.ts`

**Checkpoint**: The top business objective of retention/renewal protection is independently functional.

---

## Phase 8: User Story 6 — Live Chat Handing Over From Chatbot to Human Agent on Negative Sentiment (P2)

**Independent Test**: Start a chatbot conversation, send a message with clearly negative sentiment or report a payment issue, and confirm the conversation transfers to a live agent queue with the full prior transcript visible.

- [ ] T112 [US6] Live chat infrastructure (website/mobile/portal chat, agent console, queue management, routing, file sharing, canned responses, typing/read indicators, transfer, history, offline forms), wired to T034, in `backend/src/modules/crm-live-chat/live-chat.service.ts` (FR-118)
- [ ] T113 [US6] Configurable chat widget plus dynamic pre-chat form in `backend/src/modules/crm-live-chat/chat-widget-config.service.ts` (FR-119)
- [ ] T114 [US6] Chat routing (round robin, availability, skill, language, category, product, tier, previous agent, workload) in `backend/src/modules/crm-live-chat/chat-routing.service.ts` (FR-120)
- [ ] T115 [US6] Chat queue experience (position, wait estimate, business hours, leave-message/create-ticket/knowledge-search options) in `web/src/components/crm/chat-queue.tsx` (FR-121, acceptance scenario 4)
- [ ] T116 [US6] Agent chat console context panel (CRM profile, previous chats, tickets, purchases, membership, course activity, current page, transcript, suggested responses, knowledge suggestions, internal notes) in `web/src/app/(support)/chat/agent-console/page.tsx` (FR-122, acceptance scenario 3)
- [ ] T117 [US6] Chat transfer (agent/queue/technical/sales/billing/success) with retained history in `backend/src/modules/crm-live-chat/chat-transfer.service.ts` (FR-123)
- [ ] T118 [US6] Chat-to-ticket conversion carrying transcript/customer-info/attachments/category/agent in `backend/src/modules/crm-live-chat/chat-to-ticket.service.ts` (FR-124)
- [ ] T119 [US6] Post-chat rating (helpfulness, resolution quality, response speed, overall satisfaction) in `backend/src/modules/crm-live-chat/chat-rating.service.ts` (FR-125)
- [ ] T120 [US6] Chatbot core capability (greeting, intent detection, FAQ answers, KB search, ticket/order/membership status, course guidance, event info, lead capture) consuming `008`'s gateway, in `backend/src/modules/crm-live-chat/chatbot.service.ts` (FR-126)
- [ ] T121 [US6] Mandatory chatbot-to-human handover triggers (explicit request, unrecognized intent, negative sentiment, payment issue, security issue, low confidence, exceeded limits) with full-context transfer in `backend/src/modules/crm-live-chat/handover.service.ts` (FR-127, acceptance scenarios 1, 2, 3)
- [ ] T122 [P] [US6] Chat widget and agent console UI polish
- [ ] T123 [US6] Integration test: explicit-request immediate handover, sentiment/payment/security/confidence/length-triggered handover, full context at receiving agent, queue experience when unavailable — all 4 acceptance scenarios in `backend/tests/integration/us6-chatbot-handover.integration.test.ts`

**Checkpoint**: The clearest deterministic AI-to-human handover rule in the volume is independently functional.

---

## Phase 9: User Story 7 — No-Code Workflow Automation Triggering a Multi-Step Action (P2)

**Independent Test**: Build a workflow with a trigger, a condition, and two chained actions; run it in test/draft mode against a sample record to preview effects, then activate it and confirm a live matching record executes all actions and logs the run.

- [ ] T124 [US7] No-code workflow builder (trigger, conditions, actions, delays, branches, approvals, error handling, stop conditions), wired to T038, in `backend/src/modules/crm-workflow/workflow-builder.service.ts` (FR-151, acceptance scenario 1)
- [ ] T125 [US7] Trigger catalog (19 trigger types) in `backend/src/modules/crm-workflow/trigger-catalog.service.ts` (FR-152)
- [ ] T126 [US7] Condition evaluation engine (field values, owner, role, segment, score, value, priority, product, date/time, previous value, related-record values, formula) in `backend/src/modules/crm-workflow/condition-engine.service.ts` (FR-153)
- [ ] T127 [US7] Action catalog (20 action types) in `backend/src/modules/crm-workflow/action-catalog.service.ts` (FR-154)
- [ ] T128 [US7] Delayed-action engine (fixed/until-date/until-business-time/before-field/after-field/until-condition) with cancel-or-recalculate on governing-condition change in `backend/src/modules/crm-workflow/delayed-action.service.ts` (FR-155, acceptance scenario 3)
- [ ] T129 [US7] Branching (If/Else If/Else, multiple conditions, parallel actions, approval paths, success/failure paths) in `backend/src/modules/crm-workflow/branching.service.ts` (FR-156)
- [ ] T130 [US7] Workflow run logging (workflow, trigger, record, timing, actions, status, errors, retry count) with admin inspection in `backend/src/modules/crm-workflow/run-logging.service.ts` (FR-157, acceptance scenario 4)
- [ ] T131 [US7] Draft/Test/Active workflow lifecycle with safe preview-without-execution in Test mode, wired to T038 (FR-151, acceptance scenarios 1, 2)
- [ ] T132 [US7] Approval workflow configuration (discounts, quotes, refunds, contracts, high-value opportunities, ticket closure, SLA exceptions, exports, credits) with approve/reject/request-changes/delegate/comment and sequential/parallel/any-one/all/conditional/escalated structures, wired to T039, in `backend/src/modules/crm-workflow/approval-config.service.ts` (FR-158)
- [ ] T133 [P] [US7] Workflow builder UI in `web/src/app/(crm-admin)/workflows/builder/page.tsx`
- [ ] T134 [US7] Integration test: draft mode has no live effect, test mode previews without execution, delayed action cancels on invalid state, failed run logged and inspectable — all 4 acceptance scenarios in `backend/tests/integration/us7-workflow-automation.integration.test.ts`

**Checkpoint**: The mechanism that operationalizes nearly every other rule in this volume is independently functional.

---

## Phase 10: User Story 8 — Field-Level RBAC and Sensitive Data Protection (P2)

**Independent Test**: Compare the same account record's rendered fields under two different roles and confirm sensitive fields are hidden or masked for the lower-privilege role, and that a "reveal" action by an authorized role produces an audit log entry.

- [ ] T135 [US8] Field-level restriction configuration on sensitive fields (contract value, discount %, payment info, internal notes, escalation comments), wired to T045/T006, in `backend/src/modules/crm-org-rbac/field-restriction-config.service.ts` (FR-003, acceptance scenario 1)
- [ ] T136 [US8] Masked-field display (partial masking, e.g., phone) for standard users in `backend/src/modules/crm-privacy/field-masking-display.service.ts` (FR-183, acceptance scenario 2)
- [ ] T137 [US8] Authorized-role reveal action with logging when configured, wired to T047 (FR-183, acceptance scenario 3)
- [ ] T138 [US8] Export-time field-level masking/exclusion consistent with viewer permissions, wired to T230's export service (FR-003 tie, acceptance scenario 4)
- [ ] T139 [P] [US8] Field-permission admin configuration UI in `web/src/app/(crm-admin)/roles/field-permissions/page.tsx`
- [ ] T140 [US8] Integration test: sensitive field hidden for lower role, masked phone display, authorized reveal logged, export respects field permissions — all 4 acceptance scenarios in `backend/tests/integration/us8-field-level-rbac.integration.test.ts`

**Checkpoint**: The constitution-cited concrete implementation of Article VII for this module is independently functional.

---

## Phase 11: User Story 9 — Knowledge Base Self-Service With Article Feedback and Gap Detection (P3)

**Independent Test**: Search the knowledge base with typo tolerance, open a published article, submit "Not Helpful" with a reason, and confirm that after a threshold of similar negative signals accumulates, the system surfaces a recommended new-article topic.

- [ ] T141 [US9] Knowledge content types plus dynamic category/subcategory hierarchy, wired to T035, in `backend/src/modules/crm-knowledge-base/kb-taxonomy.service.ts` (FR-134)
- [ ] T142 [US9] Article record plus status lifecycle (Draft…Expired) with optional approval-gated publishing in `backend/src/modules/crm-knowledge-base/article-lifecycle.service.ts` (FR-135)
- [ ] T143 [US9] Rich article editor (headings, lists, tables, code, images, video, attachments, callouts, links, related articles, SEO) in `web/src/app/(crm-admin)/knowledge-base/[articleId]/edit/page.tsx` (FR-136)
- [ ] T144 [US9] Article versioning (new version on update, previous preserved, author/reviewer/date recorded, change history visible) in `backend/src/modules/crm-knowledge-base/article-versioning.service.ts` (FR-137, acceptance scenario 3)
- [ ] T145 [US9] Knowledge search (title/keyword/content/tag/product/category/language, semantic, typo-tolerant, suggested queries, permission-aware) in `backend/src/modules/crm-knowledge-base/kb-search.service.ts` (FR-138, acceptance scenario 1)
- [ ] T146 [US9] Article helpfulness feedback (Helpful/Not Helpful plus reason) in `backend/src/modules/crm-knowledge-base/article-feedback.service.ts` (FR-139, acceptance scenario 2)
- [ ] T147 [US9] Knowledge-gap detection (repeated ticket topics, failed searches, chatbot failures, low ratings, no-result agent searches, repeated manual responses) surfacing recommended topics in `backend/src/modules/crm-knowledge-base/gap-detection.service.ts` (FR-140, acceptance scenario 4)
- [ ] T148 [P] [US9] Knowledge base browse/search UI in `web/src/app/(customer-portal)/knowledge-base/page.tsx`
- [ ] T149 [US9] Integration test: typo-tolerant permission-aware search, not-helpful feedback recorded, republish creates new version, gap detection surfaces topic — all 4 acceptance scenarios in `backend/tests/integration/us9-knowledge-base.integration.test.ts`

**Checkpoint**: The self-service deflection layer on top of the P1 support desk is independently functional.

---

## Phase 11b: Contact/Account 360 & Sales Activity/Quotation/Contract (supports FR-031–FR-037, FR-051–FR-069; cross-cutting, no single owning story)

- [ ] T150 Contact record (full field set), wired to T011 (FR-031)
- [ ] T151 Contact cross-links to accounts/opportunities/orders/memberships/courses/events/marketplace/mentor/tickets/jobs/projects with relationship roles (FR-032)
- [ ] T152 Account record (full field set), wired to T012 (FR-033)
- [ ] T153 [P] Account type catalog (13 types) (FR-034)
- [ ] T154 Account hierarchy (parent/subsidiary/branch/department/regional/franchise) with visual navigation (FR-035)
- [ ] T155 Account 360-degree detail page in `web/src/app/(crm)/accounts/[accountId]/page.tsx` (FR-036)
- [ ] T156 Chronological customer timeline, filterable by type/user/date (FR-037)
- [ ] T157 Sales activity types (Task/Call/Meeting/Email/WhatsApp/SMS/Note/Site Visit/Demo/Follow-Up/Proposal/Contract Review), wired to T015 (FR-051)
- [ ] T158 Task management with recurrence rules (FR-052)
- [ ] T159 Call logging (manual/integration, outcome taxonomy, consent-gated recording reference) (FR-053)
- [ ] T160 Meeting management with calendar sync (FR-054)
- [ ] T161 Email integration (send, link, template, tracking, threading, bulk) (FR-055)
- [ ] T162 [P] Email template management (FR-056)
- [ ] T163 Consent-gated bulk/marketing email send, wired to T042 (FR-057)
- [ ] T164 [P] Notes (visibility scoping, rich text, mentions, pinning, edit history) (FR-058)
- [ ] T165 Internal comments (mentions, replies, reactions, resolved status, never customer-visible unless explicitly copied) (FR-059)
- [ ] T166 File/document upload security (size/type validation, malware scan, access control, versioning, download logging, preview, retention) (FR-060)
- [ ] T167 Product catalog plus multi-price-book support, wired to T016 (FR-061)
- [ ] T168 Quotation lifecycle (Draft…Revised), wired to T017 (FR-062)
- [ ] T169 Quote revision workflow (version preservation, supersession, latest-approved-only acceptance) (FR-063, edge case: expired/superseded quote acceptance)
- [ ] T170 Discount approval rule configuration by percentage/value/product/opportunity-value/role/segment/margin (FR-064)
- [ ] T171 Proposal templates with digital acceptance and status tracking (FR-065)
- [ ] T172 Quote-to-sales-order conversion, wired to T018 (FR-066)
- [ ] T173 Contract record plus status lifecycle, wired to T019 (FR-067)
- [ ] T174 Digital contract acceptance methods (typed/checkbox/signature/OTP/audit certificate) (FR-068)
- [ ] T175 CRM payment-tracking reference view (invoice/amount/status/method), reading from `009`, wired to T020 (FR-069)

**Checkpoint**: The full 360-degree customer view and sales-execution documentation surface is independently functional.

---

## Phase 11c: Sales Targets/Forecasting/Territory & Data Platform (supports FR-070–FR-079; cross-cutting, no single owning story)

- [ ] T176 Sales target configuration (revenue/deals/customers/products/renewals/upsells/calls/meetings/leads) with real-time progress, wired to T021 (FR-070)
- [ ] T177 Forecast categorization (Pipeline/Best Case/Commit/Closed/Omitted) (FR-071)
- [ ] T178 Forecast override with mandatory audit trail (FR-072)
- [ ] T179 Sales territory definition (geography/industry/product/size/language/revenue) with manager/users/accounts/leads/opportunities/targets, wired to T022 (FR-073)
- [ ] T180 [P] Customer segment catalog (14 segments), rule or manual assignment (FR-074)
- [ ] T181 [P] Tag system with admin-controlled creation permission (FR-075)
- [ ] T182 Custom field builder (17 field types) with visibility/validation/conditional-display, wired to T023 (FR-076)
- [ ] T183 Custom page layouts assignable by role/department/BU/type/pipeline (FR-077)
- [ ] T184 [P] Saved views (filters, columns, sorting, grouping, visibility) (FR-078)
- [ ] T185 Global/advanced search across all searchable dimensions, permission-respecting (FR-079)

**Checkpoint**: Sales-management and platform-customization capabilities are independently functional.

---

## Phase 11d: Customer Onboarding, Portal & Feedback (supports FR-080–FR-082, FR-141–FR-150; cross-cutting, no single owning story)

- [ ] T186 Onboarding process (10-stage configurable) triggered by a won opportunity, wired to T024 (FR-080)
- [ ] T187 Onboarding templates (tasks/owners/dates/documents/actions/milestones/emails/approvals) selectable by product/segment/value/BU/region (FR-081)
- [ ] T188 Onboarding customer portal (progress view, action completion, document upload, training access, meeting scheduling, contact, deadlines, completion confirmation) in `web/src/app/(customer-portal)/onboarding/page.tsx` (FR-082)
- [ ] T189 Customer portal core (profile, purchases, memberships, courses, events, orders, tickets, chat history, KB search, contract/invoice view, payments, feedback, comm preferences) in `web/src/app/(customer-portal)/dashboard/page.tsx` (FR-141)
- [ ] T190 Portal authentication (email/password, mobile OTP, email OTP, social, enterprise SSO, existing TBT account) linked to the CRM contact (FR-142)
- [ ] T191 Portal contact/role management by authorized account admins (billing/technical/support/primary contact designation) (FR-143)
- [ ] T192 Portal record-visibility scoping — own/authorized-account records only, internal notes/risk/private comments never exposed (FR-144)
- [ ] T193 Customer feedback type catalog plus survey builder (12 question types), wired to T037 (FR-145)
- [ ] T194 CSAT survey triggers (post-ticket/chat/onboarding/course/event/purchase/session/renewal) (FR-146)
- [ ] T195 Automatic NPS calculation and Promoter/Passive/Detractor grouping, validated against SC-006 (FR-147)
- [ ] T196 [P] CES breakdown reporting (product/team/channel/agent/segment/period) (FR-148)
- [ ] T197 Low-score-triggered recovery workflow (task/escalation/notification/follow-up/apology) (FR-149)
- [ ] T198 Feature request tracking (Submitted…Declined) with voting (FR-150)

**Checkpoint**: Post-sale onboarding, customer self-service, and feedback loops are independently functional.

---

## Phase 11e: Support Desk remainder & Incident Management (supports FR-100–FR-113; cross-cutting, no single owning story)

- [ ] T199 Ticket assignment methods plus agent-capacity-respecting engine in `backend/src/modules/crm-support-ticket/ticket-assignment.service.ts` (FR-101)
- [ ] T200 Support queue scoping (product/department/category/language/region/segment/plan), wired to T031 (FR-100)
- [ ] T201 Agent response types (public reply, internal note, email, chat, predefined, attachment, resolution summary) with public/internal separation (FR-102)
- [ ] T202 [P] Canned response library (searchable, insertable, approval-gated) (FR-103)
- [ ] T203 Concurrent-agent collision detection (currently-viewing, currently-editing, draft warning, duplicate-prevention) (FR-104)
- [ ] T204 Ticket merge (master selection, conversation/attachment move, source-ID preservation, audit) and split (child ticket, traceability) (FR-105)
- [ ] T205 Parent-child ticket closure independence unless explicitly configured (FR-106)
- [ ] T206 Incident/Problem/Root-Cause-Report records (RCA, known errors, workarounds, corrective/preventive actions), wired to T036 (FR-107)
- [ ] T207 Major-incident communication (internal updates, customer notifications, status page, email broadcast, in-app, resolution announcement), all logged (FR-108)
- [ ] T208 Root cause report structure (FR-109)
- [ ] T209 Ticket reopen workflow (status change, previous-owner notification, SLA recalculation, reopen-count increment, reason capture) (FR-110)
- [ ] T210 Ticket closure requirements (resolution summary/category/root-cause/confirmation/mandatory-fields/KB-link/time-spent) with manual/auto-inactivity/auto-confirmation close paths (FR-111)
- [ ] T211 Agent time tracking (investigation/communication/coordination/technical/documentation) feeding reporting and billing (FR-112)
- [ ] T212 Support entitlement model (membership/plan/product/contract/tier/warranty/order-based channel/hours/SLA/ticket-count/contacts/manager), wired to T029 (FR-113)

**Checkpoint**: The full support-agent operational toolkit and major-incident process is independently functional.

---

## Phase 11f: AI Guardrails remainder, Reporting, Integration & API (supports FR-129–FR-133, FR-161–FR-170, FR-186–FR-193; cross-cutting, no single owning story)

- [ ] T213 AI next-best-action recommendations with supporting reasons for sales users, wired to `008` (FR-129)
- [ ] T214 AI-generated summary inspectability against original source content (FR-130)
- [ ] T215 AI-drafted email tone options remaining user-editable before send (FR-131)
- [ ] T216 AI request data-minimization plus record-level-permission respect plus approved-provider-only plus usage logging plus retention plus opt-out (FR-133)
- [ ] T217 [P] CRM/sales/support/customer-success analytics suite (FR-161, FR-164, FR-165, FR-166)
- [ ] T218 Sales funnel plus lead-source-attribution reporting (FR-162, FR-163)
- [ ] T219 [P] Executive dashboard in `web/src/app/(crm-admin)/executive-dashboard/page.tsx` (FR-167)
- [ ] T220 Custom report builder (module selection, fields, filters, grouping, calculations, 11 chart types, date ranges, sorting, scheduled delivery, export) (FR-168)
- [ ] T221 Scheduled report delivery (FR-169)
- [ ] T222 [P] Configurable CRM dashboard with widget management (FR-170)
- [ ] T223 API groups for all 19 domains with standardized envelopes/pagination (FR-187)
- [ ] T224 Webhook event catalog with signed payloads, retry/backoff, delivery logs, failure alerts, secret rotation, test delivery, auto-disable, wired to T041 (FR-188)
- [ ] T225 Email/telephony integration (FR-189)
- [ ] T226 WhatsApp integration (FR-190)
- [ ] T227 Website/mobile-app integration plus cross-module event ingestion from `004`/`005`/`007`/`009`/`010`/`011`/`012` (FR-191, FR-192)
- [ ] T228 Finance reference integration (invoices/payments/refunds/credits/taxes/balances/revenue-recognition references, never becoming the accounting source) (FR-193)

**Checkpoint**: The reporting, integration, and remaining AI-guardrail surface is independently functional.

---

## Phase 12: Polish & Cross-Cutting Concerns

- [ ] T229 [P] Data import/export pipeline (CSV/XLSX/API/migration-source workflow, validation, duplicate detection, preview, results) with permission/limit/masking/watermark/audit/expiring-link controls (FR-171–FR-173)
- [ ] T230 Bulk actions with confirmation plus audit records (FR-174)
- [ ] T231 Configurable data retention per category (FR-175)
- [ ] T232 Archive/restore lifecycle (searchable-for-authorized, excluded-from-default-views, reportable-when-selected, audit-preserved, restorable) plus soft-deletion with elevated-permission hard-delete (FR-176, FR-177, FR-178)
- [ ] T233 Invalid-status-transition prevention across all state machines, wired to Foundational (FR-180)
- [ ] T234 [P] Multi-currency support (base/record currency, exchange rates, converted values, historical rate, currency price books, permissions) (FR-194)
- [ ] T235 [P] Timezone consistency (storage, display, event preservation, DST handling) (FR-195)
- [ ] T236 [P] Localization pass (interface, emails, notifications, forms, KB articles, chatbot responses in English/Tamil/Tanglish) (FR-196)
- [ ] T237 [P] Accessibility pass (keyboard navigation, screen-reader labels, focus states, contrast, scalable text, accessible forms, error announcements, video captions, alt text) (FR-197)
- [ ] T238 [P] Responsive/mobile-critical-workflow pass (FR-198)
- [ ] T239 Performance hardening toward the defined enterprise thresholds (page load, search response, Kanban responsiveness, non-duplicating replies, dashboard aggregation, async exports, non-blocking automation) (FR-199)
- [ ] T240 Scale hardening (millions of contacts/activities, large ticket volumes, multi-org, chat concurrency, large KB, automation throughput, search indexing, partitioned audit logs, queued notifications) (FR-200)
- [ ] T241 Background job processing for all named batch/async workloads (FR-201)
- [ ] T242 Structured error handling (user-facing recovery guidance plus support reference ID, standardized error codes) (FR-202)
- [ ] T243 Operational monitoring plus alerting across all named health signals (FR-203)
- [ ] T244 Backup/DR (scheduled encrypted monitored backups, restore testing, point-in-time recovery, RTO/RPO, DR documentation) (FR-204)
- [ ] T245 Data-entry validation across all named rules (FR-205)
- [ ] T246 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (AI confidence-threshold defaults, export record limit, restoration recovery period, full SLA-pause status list, chatbot handover limit)
- [ ] T247 Final audit: cross-check every FR-001–FR-210 against an implementation or validation task; verify the Constitution Article II/VI/VII co-citations and the Security & Compliance Baseline's consent/legal-basis citation are concretely implemented, not just noted
- [ ] T248 Run `quickstart.md` validation end-to-end across all 9 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends only on `001`'s RBAC/audit-log and produces the org/RBAC, lead, and core-entity infrastructure every subsequent phase depends on.
- **P1 stories (US1–US4)**: US1 (lead capture/dedup) is the foundational data-integrity guarantee and must ship first; US2 (lead scoring) depends on US1's lead data existing; US3 (opportunity pipeline) depends on US1's lead-conversion path producing opportunities; US4 (SLA/ticket) is independent of US1–US3 and can build in parallel since support and sales are separate actor paths.
- **P2 stories (US5–US8)**: US5 (health/renewal) depends on US3's account/opportunity data and cross-module event ingestion (Phase 11f); US6 (chat handover) depends on Foundational's chat entities and can build in parallel with US5; US7 (workflow automation) depends on Foundational's workflow entities and benefits from US1–US4 existing (it automates their events) but its own builder can be validated independently; US8 (field-level RBAC) depends on Foundational's RBAC extension (T045) and can build in parallel with US5–US7.
- **P3 story (US9)** depends on Foundational's knowledge-base entities and US4's ticket data (for gap detection) — build after US4.
- **Phase 11b (Contact/Account 360/Sales Activity)** depends on Foundational's contact/account/quote/contract entities and supports US3 — build alongside or after US3.
- **Phase 11c (Targets/Forecasting/Data Platform)** depends on Foundational plus US3's opportunity data; can build in parallel with Phase 11b.
- **Phase 11d (Onboarding/Portal/Feedback)** depends on US3 (won opportunities trigger onboarding) and US4 (portal ticket integration); can build in parallel with Phase 11c.
- **Phase 11e (Support Desk remainder)** depends on US4's ticket/SLA infrastructure — build alongside or after US4.
- **Phase 11f (AI Guardrails/Reporting/Integration)** depends on every module it surfaces (leads from US1/US2, opportunities from US3, tickets from US4, chat from US6) — build after those phases are stable.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (org/RBAC, lead entities, duplicate detection, field-level RBAC) → **STOP and VALIDATE** the three Foundational contract tests (duplicate-lead-detection, AI-never-autonomous, tenant-isolation) pass → US1 (lead capture/dedup) → **STOP and VALIDATE** clean lead data is flowing in → US2 (lead scoring) + US4 (SLA/ticket, independent of sales flow) in parallel → US3 (opportunity pipeline) → **STOP and VALIDATE** the core lead-to-opportunity-to-support loop works end to end → Phase 11b (contact/account 360/sales activity) + Phase 11c (targets/forecasting/data platform) in parallel → US5 (health/renewal) → US6 (chat handover) + US8 (field-level RBAC) in parallel → US7 (workflow automation) → Phase 11d (onboarding/portal/feedback) → Phase 11e (support desk remainder) → US9 (knowledge base) → Phase 11f (AI guardrails/reporting/integration) → Polish.
