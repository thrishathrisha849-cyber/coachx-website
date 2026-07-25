---
description: "Task list for Feature 016 — Marketing Platform User Roles, Permissions & Access Control"
---

# Tasks: Marketing Platform User Roles, Permissions & Access Control

**Input**: Design documents from `/specs/016-marketing-rbac-roles/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC engine and audit-log interceptor this feature extends). This feature also assumes `003`'s core identity/role model and `015`'s User Service exist as the platform-wide layer this module-specific role set sits on top of.

**Tests**: Included throughout — this feature is directly named in the constitution's citation for Article VII; approval-chain-blocking, access-grant-expiry, and External-Agency-restriction get dedicated Foundational contract tests, matching this spec's own SC-001, SC-002, and SC-003.

**Organization**: Tasks are grouped by user story (US1–US6 from spec.md), plus one supplementary cross-cutting phase for FR groups not owned by any single prioritized story (Authentication/Session/Security Policy remainder FR-034–FR-040, FR-046–FR-051).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC engine, audit-log interceptor this feature extends), and that `003`'s identity model and `015`'s User Service exist
- [ ] T002 Resolve `research.md` open items before proceeding: whether marketing-module "Sales Executive"/"Customer Support" roles are the same underlying role as `013`'s CRM roles or separately configured, the Super Admin peer-restriction question, expiry-revocation latency target, repeated-violation notification threshold, session idle-timeout duration, and concurrent-session limit count
- [ ] T003 [P] Add `backend/src/modules/{marketing-rbac-hierarchy,marketing-rbac-roles,marketing-rbac-permissions,marketing-rbac-approval,marketing-rbac-temporary,marketing-rbac-delegation,marketing-rbac-session,marketing-rbac-audit}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define `Role`, `Permission Group`, `Permission` entities in `backend/src/modules/marketing-rbac-hierarchy/rbac-entities.entity.ts` (FR-001)
- [ ] T005 [P] Define `Resource` and `Action` entities plus the resource-action matrix in `backend/src/modules/marketing-rbac-permissions/resource-action.entity.ts` (FR-024)
- [ ] T006 [P] Define/extend `Organization`/`Department` entities from `001` in `backend/src/modules/marketing-rbac-hierarchy/organization.entity.ts`
- [ ] T007 Implement the 7-level authorization hierarchy enforcement engine (Organization → Department → Role → Permission Group → Permission → Resource → Action) in `backend/src/modules/marketing-rbac-hierarchy/hierarchy-engine.service.ts` (FR-001)
- [ ] T008 Implement permission inheritance through the role hierarchy in `backend/src/modules/marketing-rbac-hierarchy/permission-inheritance.service.ts` (FR-005)
- [ ] T009 Implement custom role creation beyond the 10 standard roles, admin-portal-configurable, in `backend/src/modules/marketing-rbac-roles/custom-role.service.ts` (FR-004)
- [ ] T010 Implement dynamic RBAC configuration management from the Admin Portal, requiring zero code changes, in `backend/src/modules/marketing-rbac-hierarchy/rbac-config.service.ts` (FR-003)
- [ ] T011 [P] Define the 7 permission categories (User Management, Campaign Management, Audience Management, Communication, Analytics, AI Features, System Configuration) in `backend/src/modules/marketing-rbac-permissions/permission-category.entity.ts` (FR-016)
- [ ] T012 [P] Implement the User Management permission set (View, Create, Edit, Suspend, Delete Users, Assign Roles, Reset Password, Unlock Accounts) (FR-017)
- [ ] T013 [P] Implement the Campaign Management permission set (Create, Edit, Publish, Schedule, Pause, Resume, Archive, Delete, Duplicate, Export) (FR-018)
- [ ] T014 [P] Implement the Audience Management permission set (Create Segments, Import, Export, Delete, Merge, AI Segmentation) (FR-019)
- [ ] T015 [P] Implement the Communication permission set (Email, SMS, WhatsApp, Push, In-App, Test Sends, Broadcast) (FR-020)
- [ ] T016 [P] Implement the Analytics permission set (View Dashboard, Export Reports, Revenue Analytics, Attribution, Funnel, Cohort) (FR-021)
- [ ] T017 [P] Implement the AI Features permission set (Generate Email, Generate Subject Lines, Campaign Suggestions, Audience Prediction, AI Translation, AI Optimization) (FR-022)
- [ ] T018 [P] Implement the System Configuration permission set (Branding, Integrations, SMTP, SMS Gateway, API Keys, Feature Flags, Webhooks) (FR-023)
- [ ] T019 [P] Define the `Approval Chain`/`Approval Request` entity in `backend/src/modules/marketing-rbac-approval/approval-request.entity.ts` (Key Entities)
- [ ] T020 [P] Define the `Temporary Access Grant` entity in `backend/src/modules/marketing-rbac-temporary/temporary-access-grant.entity.ts`
- [ ] T021 [P] Define the `Delegated Access Grant` entity in `backend/src/modules/marketing-rbac-delegation/delegated-access-grant.entity.ts`
- [ ] T022 [P] Define the `Session` entity and privileged-session tracking in `backend/src/modules/marketing-rbac-session/session.entity.ts`
- [ ] T023 Define the `Audit Log Entry` entity, extending `001`'s audit-log pattern with the 12-field record (FR-042) in `backend/src/modules/marketing-rbac-audit/audit-log-entry.entity.ts`
- [ ] T024 Implement default-deny enforcement for any request not matching an explicit permission grant in `backend/src/modules/marketing-rbac-hierarchy/default-deny.service.ts` (FR-044)
- [ ] T025 Implement API-layer permission validation (never UI-only) in `backend/src/modules/marketing-rbac-hierarchy/api-permission-guard.service.ts` (FR-045)
- [ ] T026 Note: role/permission enforcement reuses `001`'s RBAC engine directly as the underlying authorization mechanism this module-specific role catalog is expressed through (Constitution Article VII)
- [ ] T027 Contract test: every high-blast-radius action is blocked from executing until every required approval-chain step has recorded approval, in `backend/tests/contract/marketing-approval-chain-blocking.contract.test.ts` (FR-025, FR-026, SC-001)
- [ ] T028 Contract test: expired temporary/delegated access grants are auto-revoked with zero residual access, in `backend/tests/contract/marketing-access-grant-expiry.contract.test.ts` (FR-028, SC-002)
- [ ] T029 Contract test: External Agency accounts have zero successful access to customer data, analytics export, or financial information across any screen/API path, in `backend/tests/contract/marketing-external-agency-restriction.contract.test.ts` (FR-015, SC-003)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Escalated Approval Blocks High-Blast-Radius Marketing Actions (P1) 🎯 MVP

**Independent Test**: Have a Campaign Manager submit a mass email/SMS/WhatsApp broadcast and confirm it is held in a pending-approval state, is not delivered to any recipient, and only proceeds once each required approver in the chain has explicitly approved it.

- [ ] T030 [US1] High-blast-radius action catalog (publish campaigns, bulk email, mass SMS, WhatsApp broadcast, audience deletion, template deletion, API key modification, system config changes) gated for approval, wired to T019, in `backend/src/modules/marketing-rbac-approval/high-blast-radius-catalog.service.ts` (FR-025, acceptance scenario 1)
- [ ] T031 [US1] Escalating approval-chain routing (Team Lead → Marketing Manager → Organization Admin → Super Admin) per action risk level, wired to T027's contract test, in `backend/src/modules/marketing-rbac-approval/approval-chain-routing.service.ts` (FR-026, acceptance scenario 2)
- [ ] T032 [US1] Rejection-at-any-step cancellation, submitter notification, and audit logging in `backend/src/modules/marketing-rbac-approval/approval-rejection.service.ts` (FR-026, acceptance scenario 3)
- [ ] T033 [US1] Audience/template deletion approval gate reusing the same mechanism as bulk sends (FR-025, acceptance scenario 4)
- [ ] T034 [P] [US1] Approval-queue admin UI in `web/src/app/(marketing-admin)/approvals/page.tsx`
- [ ] T035 [US1] Integration test: pending-approval state blocks dispatch, partial approval still blocks, rejection cancels and notifies, deletion requires approval — all 4 acceptance scenarios in `backend/tests/integration/us1-approval-chain.integration.test.ts`

**Checkpoint**: The direct implementation of Article VII's high-blast-radius approval-chain requirement is independently functional.

---

## Phase 4: User Story 2 — Standard Role Assignment Enforces Least-Privilege Boundaries (P1)

**Independent Test**: Assign each of the 10 standard roles to a test account in turn and confirm role-restricted actions are blocked with an authorization error, while permitted actions succeed.

- [ ] T036 [US2] Super Administrator role (full system control, no listed restrictions) in `backend/src/modules/marketing-rbac-roles/super-admin.role.ts` (FR-006, acceptance scenario 4)
- [ ] T037 [US2] Organization Administrator role (org-level marketing/campaigns/users/analytics/workflows/templates; restricted from infrastructure and Super Admin deletion) (FR-007)
- [ ] T038 [US2] Marketing Manager role (create/publish/approve/monitor/manage team/reports; restricted from system settings/security config) (FR-008)
- [ ] T039 [US2] Campaign Manager role (build/schedule/clone/pause/resume/archive; restricted from unapproved production deletion) (FR-009)
- [ ] T040 [US2] Content Creator role (content/landing pages/banners/images/templates/AI-assisted generation; restricted from direct publish) (FR-010, acceptance scenario 1)
- [ ] T041 [US2] Marketing Analyst role (dashboard/reports/KPI/funnel/export/ROI; read-only) (FR-011, acceptance scenario 2)
- [ ] T042 [US2] Customer Support role (view interactions/history, respond tickets, update preferences; restricted from editing campaigns) (FR-012)
- [ ] T043 [US2] Sales Executive role (lead management/pipeline/follow-up limited to own assigned prospects) (FR-013, acceptance scenario 3)
- [ ] T044 [US2] Community Manager role (community campaigns/push/engagement/moderation; restricted from financial analytics) (FR-014)
- [ ] T045 [US2] External Agency role definition (asset upload/assigned-campaign review; restricted from customer data/analytics export/financial info), wired to T029, in `backend/src/modules/marketing-rbac-roles/external-agency.role.ts` (FR-015)
- [ ] T046 [P] [US2] Role assignment admin UI in `web/src/app/(marketing-admin)/roles/page.tsx`
- [ ] T047 [US2] Integration test: Content-Creator publish blocked, Analyst edit blocked, Sales-Exec unassigned-prospect denied, Super-Admin unrestricted — all 4 acceptance scenarios in `backend/tests/integration/us2-standard-roles.integration.test.ts`

**Checkpoint**: The foundational MVP capability every other RBAC story assumes already works is independently functional.

---

## Phase 5: User Story 3 — Temporary, Time-Bound Access Expires Automatically (P2)

**Independent Test**: Grant a role with a defined expiry date/time to a test account, confirm the account can perform the granted actions before expiry, and confirm that immediately after expiry the same actions are denied without administrator intervention.

- [ ] T048 [US3] Time-bound access grant configuration (agency 14-day, consultant 1-month, QA testing-cycle, event-manager campaign-scoped), wired to T020, in `backend/src/modules/marketing-rbac-temporary/temporary-grant.service.ts` (FR-027, acceptance scenario 1)
- [ ] T049 [US3] Automatic expiry-triggered revocation with no manual admin action, validated by T028's contract test, in `backend/src/modules/marketing-rbac-temporary/auto-revocation.service.ts` (FR-028, acceptance scenario 2)
- [ ] T050 [US3] In-window action permission verification (FR-027, acceptance scenario 3)
- [ ] T051 [P] [US3] Temporary access grant admin UI in `web/src/app/(marketing-admin)/temporary-access/page.tsx`
- [ ] T052 [US3] Integration test: 14-day-expiry auto-revoke, testing-window-close removes permissions, in-window actions permitted — all 3 acceptance scenarios in `backend/tests/integration/us3-temporary-access.integration.test.ts`

**Checkpoint**: The primary control limiting the blast radius of external, non-employee access is independently functional.

---

## Phase 6: User Story 4 — Delegated Access Between Roles With Approval and Audit Trail (P2)

**Independent Test**: Have a Marketing Manager create a delegation to a Campaign Manager with a defined start/end date and permission set, confirm the delegate can perform only the delegated actions during the active window, and confirm an audit entry exists.

- [ ] T053 [US4] Delegation creation (start date, end date, discrete permission set, optional approval requirement), wired to T021, in `backend/src/modules/marketing-rbac-delegation/delegation-creation.service.ts` (FR-029, FR-030, FR-031, acceptance scenario 1)
- [ ] T054 [US4] Delegation approval gate when configured, wired to T031's approval-chain engine (FR-032, acceptance scenario 1)
- [ ] T055 [US4] Delegated-action execution within the delegated permission set plus audit recording as delegated authority in `backend/src/modules/marketing-rbac-delegation/delegated-execution.service.ts` (FR-033, acceptance scenario 2)
- [ ] T056 [US4] Out-of-scope delegated-action denial (FR-029, acceptance scenario 3)
- [ ] T057 [US4] Delegation-expiry denial (FR-030, acceptance scenario 4)
- [ ] T058 [P] [US4] Delegation management UI in `web/src/app/(marketing-admin)/delegations/page.tsx`
- [ ] T059 [US4] Integration test: delegation creation and approval hold, in-window delegated action permitted and audited, out-of-scope denied, expired delegation denied — all 4 acceptance scenarios in `backend/tests/integration/us4-delegated-access.integration.test.ts`

**Checkpoint**: The distinct business-continuity mechanism supporting temporary responsibility transfer without a permanent role change is independently functional.

---

## Phase 7: User Story 5 — External Agency Role Is Restricted From Customer, Analytics, and Financial Data (P2)

**Independent Test**: Log in as an External Agency user, confirm asset upload and assigned-campaign review succeed, and confirm any attempt to view customer records, export analytics, or view financial figures is denied regardless of the specific screen or API path used.

- [ ] T060 [US5] Agency asset-upload/creative-submission permitted actions, wired to T045 (FR-015, acceptance scenario 1)
- [ ] T061 [US5] Customer/audience data access denial regardless of assigned-campaign visibility in `backend/src/modules/marketing-rbac-roles/agency-data-restriction.service.ts` (FR-015, acceptance scenario 2)
- [ ] T062 [US5] Analytics export denial for agency accounts (FR-015, acceptance scenario 3)
- [ ] T063 [US5] Financial information (revenue, budget, commission) access denial (FR-015, acceptance scenario 4)
- [ ] T064 [P] [US5] Agency portal restricted-view UI
- [ ] T065 [US5] Integration test: asset upload permitted, customer data denied, analytics export denied, financial info denied — all 4 acceptance scenarios, validated by T029's contract test, in `backend/tests/integration/us5-external-agency.integration.test.ts`

**Checkpoint**: The platform's highest external-exposure risk surface is correctly restricted.

---

## Phase 8: User Story 6 — Audit Trail Review of Privileged Actions (P3)

**Independent Test**: Perform a mix of privileged actions under test accounts, then confirm an administrator can search the audit log by user, role, action, module, resource, and date range, and export the filtered results.

- [ ] T066 [US6] Immutable audit record generation for every privileged action, wired to T023 (FR-041, acceptance scenario 1)
- [ ] T067 [US6] 12-field audit record capture (user ID, role, action, module, resource, previous/new value, IP, device, browser, timestamp, status) (FR-042, acceptance scenario 1)
- [ ] T068 [US6] Audit log search (user, role, action, module, resource, date range) in `backend/src/modules/marketing-rbac-audit/audit-search.service.ts` (FR-043, acceptance scenario 1)
- [ ] T069 [US6] Audit log export (FR-043, acceptance scenario 2)
- [ ] T070 [US6] Denied (403) attempt visibility in audit search results (FR-050 tie, acceptance scenario 3)
- [ ] T071 [P] [US6] Audit log review admin UI in `web/src/app/(marketing-admin)/audit-log/page.tsx`
- [ ] T072 [US6] Integration test: search returns full-field records, export produces filtered file, denied attempt appears with outcome — all 3 acceptance scenarios in `backend/tests/integration/us6-audit-review.integration.test.ts`

**Checkpoint**: The governance/compliance capability recording every other story's activity is independently functional.

---

## Phase 9: Authentication, Session & Security Policy remainder (supports FR-034–FR-040, FR-046–FR-051; cross-cutting, no single owning story)

- [ ] T073 Privileged-user email-login under strong password policy in `backend/src/modules/marketing-rbac-session/privileged-auth.service.ts` (FR-034)
- [ ] T074 MFA enforcement for privileged users, reusing `003`'s MFA mechanism, wired to T022 (FR-035, SC-008)
- [ ] T075 Device verification, session timeout, IP monitoring for privileged sessions (FR-036)
- [ ] T076 Failed-login protection for privileged accounts (FR-037)
- [ ] T077 Concurrent session limits plus session revocation and remote logout (FR-038)
- [ ] T078 Idle timeout plus forced password reset and token refresh (FR-039)
- [ ] T079 Suspicious session-activity detection (FR-040)
- [ ] T080 Secure token verification for all authenticated requests, wired to T025 (FR-046)
- [ ] T081 [P] Encryption at rest and in transit for RBAC-governed data (FR-047)
- [ ] T082 [P] Password hashing for stored credentials (FR-048)
- [ ] T083 Regular permission review support (FR-049)
- [ ] T084 HTTP 403 handling with no permission-structure disclosure plus user-friendly error message, wired to T070 (FR-050)
- [ ] T085 Repeated-unauthorized-violation admin notification (FR-051)

**Checkpoint**: The privileged-session security baseline is independently functional.

---

## Phase 10: Polish & Cross-Cutting Concerns

- [ ] T086 [P] Role-or-permission-change-takes-effect-without-relogin verification pass (SC-006)
- [ ] T087 [P] Custom-role zero-code-deployment verification pass (SC-007)
- [ ] T088 Security hardening full pass re-auditing T024/T025/T080–T085 against the complete security-policy list
- [ ] T089 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (Super Admin peer-restriction, marketing-vs-CRM role relationship, revocation latency, repeated-violation threshold, idle timeout, concurrent-session limit)
- [ ] T090 Final audit: cross-check every FR-001–FR-051 against an implementation or validation task; verify the Constitution Article VII co-citation is concretely implemented, not just noted
- [ ] T091 Run `quickstart.md` validation end-to-end across all 6 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `001`'s RBAC engine, `003`'s identity model, and `015`'s User Service, and produces the hierarchy/permission/approval infrastructure every subsequent phase depends on.
- **P1 stories (US1–US2)**: US2 (standard roles) is the foundational MVP capability every other story assumes already works and should conceptually ship alongside US1; US1 (approval chain) is the most safety-critical capability and both should be validated together since they share the Foundational approval infrastructure.
- **P2 stories (US3–US5)**: US3 (temporary access) and US4 (delegated access) both depend on US2's role model and benefit from US1's approval mechanism existing; US5 (External Agency restriction) is a specialization of US2's role model — build after US2.
- **P3 story (US6)** depends on US1–US5 already producing audit records to review — build last among the prioritized stories.
- **Phase 9 (Authentication/Session/Security remainder)** depends on Foundational's Session entity (T022) and can build in parallel with US3–US6.
- **Polish (Phase 10)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (hierarchy, permissions, approval/temporary/delegation entities) → **STOP and VALIDATE** the three Foundational contract tests (approval-chain-blocking, access-grant-expiry, External-Agency-restriction) pass → US2 (standard roles) + US1 (approval chain) together, since they share the same safety-critical infrastructure → **STOP and VALIDATE** least-privilege enforcement and high-blast-radius gating both work end to end → US3 (temporary access) + US4 (delegated access) in parallel → US5 (External Agency restriction, extends US2) → US6 (audit review) → Phase 9 (authentication/session/security remainder) → Polish.
