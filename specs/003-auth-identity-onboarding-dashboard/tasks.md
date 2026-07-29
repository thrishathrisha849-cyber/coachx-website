---
description: "Task list for Feature 003 — Authentication, Identity, Onboarding, Personalization & Member Dashboard"
---

# Tasks: Authentication, Identity, Onboarding, Personalization & Member Dashboard

**Input**: Design documents from `/specs/003-auth-identity-onboarding-dashboard/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (User Account, RBAC engine with the 12 seeded roles, audit-log infrastructure). Dashboard tasks (Phase D) additionally assume at least minimal read APIs from features 004/005/006/007/008/009/010/011/013 — see plan.md's Complexity Tracking note on incremental widget delivery.

**Tests**: Included — this feature's enumeration-safety, session-revocation, and 2FA-mandatory requirements are direct security controls (Constitution Security & Compliance Baseline); contract tests are non-optional here.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus one supplementary phase (Profile Management) covering spec.md's Identity & Profile Requirements (FR-071–FR-076) that were never elevated to their own user story in the original 8.

**Revision note (2026-07-23)**: This file was corrected following a traceability review. Added to Foundational: the account-status state machine (T007, T008) and an explicit reuse note for role/permission (T009). Added a new Phase D2 (Profile Management, T063–T069) closing the FR-071–076 gap. Added 5 session-lifecycle tasks to Phase F (T082–T086) closing the FR-056/058/059 gap. Added a dashboard alert-catalog task and a generic dashboard error-state task to Phase D (T061, T062). Added an auth-analytics task to Polish (T106). Moved per-widget timeout handling into the widget-loader task (T043, formerly T040) instead of leaving it only in the Polish-phase performance pass. All subsequent task IDs shifted accordingly. No content in `spec.md` was changed.

**Revision note (2026-07-28)**: This was the first pass actually verifying every checkbox in this file against real code (previously all 106 tasks sat unchecked despite a pre-existing "Phase 4" effort having already built Foundational/US1(email+password only)/US3/US5/US6(2FA+session core)/US8(role-change only)). This pass: (1) checked those pre-existing items honestly, citing the real file each lives in; (2) built US2 (Onboarding sequencer + deterministic-fallback Roadmap generator) and US4 (Member Dashboard aggregation) completely from scratch — the two P1 stories the user selected via an explicit scope-calibration answer ("P1 only (US2 + US4), defer the rest"); (3) left every task in Phase D2 (Profile Management), US7 (Account Lifecycle), the Session/Device settings UI (T080), Admin user list/merge (T094/T096/T097), and OTP/social login (T018/T019/T029) unchecked with an explicit "deferred this session" reason, per the user's own scope answers — not silently skipped. `[~]` marks a task that's satisfied in spirit but via a different real structure than the literal path named (e.g. this repo's flat `backend/src/<feature>/` layout vs. plan.md's `backend/src/modules/...`).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [x] T001 [P] `001`'s Foundational phase and `002`'s Consent Record are deployed and in active use by this feature's code (verified this session — `backend/src/lifecycle/`, `database/prisma/schema.prisma`'s `ConsentRecord`).
- [x] T002 Resolved implicitly by what was actually built, not a separate research doc: bcrypt/argon-class hashing (`backend/src/auth/password.util.ts`), no SMS/OTP gateway selected (OTP/social deferred this pass per explicit user scope decision), email via the dev console adapter (`backend/src/auth/email.port.ts`) pending a real provider.
- [~] T003 [P] No literal `backend/src/modules/{...}` path exists — this repo's real, pre-existing architecture is flat `backend/src/<feature>/` (npm-workspaces monorepo, not the plan.md-described NestJS modules structure). `auth/`, `lifecycle/`, `onboarding/`, `dashboard/` all exist under that convention. This is a documented, accepted mismatch between plan.md (aspirational/non-normative) and the real codebase — see repo root `CLAUDE.md` and `specs/ENTERPRISE-ARCHITECTURE-AUDIT-REPORT.md`. No `risk/`, `roadmap/` (folded into `onboarding/`), or `account-lifecycle/` module exists — those areas are genuinely unbuilt (see Phase 8/9 below), not just differently-pathed.

---

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T004 `User`/`Credential` entities exist in `database/prisma/schema.prisma` and `backend/src/auth/` (email+password only this pass — no separate mobile-number identity).
- [x] T005 `Session` entity + rotation/revocation exist: `backend/src/auth/session.service.ts` (`issueSession`, `rotateSession`, `revokeCurrentSession`, `revokeSpecificSession`, `revokeAllSessions`, `getActiveSessions`). No separate `Device` entity/model — sessions carry device context inline, not a normalized Device table. `Two-Factor Method`/`Recovery Code` exist via `backend/src/auth/mfa.service.ts`.
- [ ] T006 No `UserProfile` entity distinct from `User` exists yet beyond a bare `username` column (see Phase D2 below) — deferred this pass per the user's explicit "P1 only (US2+US4)" scope decision.
- [ ] T007 Only `PENDING_VERIFICATION/ACTIVE/LOCKED/SUSPENDED/DEACTIVATED/DELETED` exist on `User.status` (`AccountStatus` enum) — the full 10-state machine (onboarding-incomplete as a status value, restricted sub-flags, merged) is not implemented. Deferred — overlaps Phase 9 (US7)/Phase 10 (US8), out of this pass's confirmed scope.
- [ ] T008 No suspension-display service exists. Deferred — depends on T007's fuller status model.
- [x] T009 Confirmed: FR-067/FR-068 reuse `001`'s RBAC directly — `backend/src/auth/rbac.constants.ts`, `backend/src/auth/rbac.service.ts`, no duplicate role/permission entity introduced here.
- [x] T010 **(this session)** `OnboardingStepResponse` entity defined in `database/prisma/schema.prisma`, migration `20260728112433_spec003_onboarding_roadmap` — see `backend/src/onboarding/onboarding.repository.ts`. `Assessment`/`Assessment Result` deliberately NOT a separate entity — folded into step 11's (`assessment`) `OnboardingStepResponse.answer` JSON payload, since no admin-configurable branching/scoring engine is in scope this pass (see T036).
- [x] T011 **(this session)** `Roadmap` entity + `RoadmapGenerationSource` enum defined in the same migration — see `backend/src/onboarding/roadmap-generator.service.ts`. No separate `Recommendation` entity — recommendations are flat fields on `Roadmap` (`recommendedLearningPath`, etc.), matching the "don't build a second competing construct" principle applied throughout this session.
- [ ] T012 No `Security Event`/`Account Recovery Request`/`Data Export Request`/`Account Deletion Request` entities exist. Deferred — overlaps Phase 8/9 (US6 risk engine, US7 lifecycle), out of scope this pass.
- [x] T013 `backend/src/auth/password.util.ts` (pre-existing).
- [x] T014 `backend/src/auth/auth-error-codes.ts` (pre-existing).
- [x] T015 Audit-event recording is wired throughout (`recordAuditEvent()` calls in `backend/src/auth/*`, and in this session's `backend/src/onboarding/onboarding.service.ts`); redaction of secrets is centralized in `backend/src/database/audit-event.repository.ts`'s `redact()` call, not a per-call responsibility.
- [ ] T016 No dedicated contract test file for this specific claim exists; redaction is unit-tested generically (`backend/tests/unit/redact.unit.test.ts`) but not as an auth-specific contract test. Not addressed this pass (pre-existing gap, not touched by this session's onboarding/dashboard work).

**Checkpoint**: Foundation ready.

---

## Phase 3: User Story 1 — New Member Signup Across Multiple Methods (P1) 🎯 MVP

**Independent Test**: Complete signup via each of email/mobile-OTP/Google/Apple on a clean environment; confirm exactly one account per unique identity.

- [x] T017 [P] [US1] `backend/src/auth/registration.service.ts` + `auth.controller.ts` (pre-existing, verified this session).
- [ ] T018 [P] [US1] No mobile-OTP signup path exists. **Explicitly deferred this session** per the user's own scope-calibration answer ("Defer OTP/social login (Recommended)") — email+password is the only supported signup/login method this pass.
- [ ] T019 [P] [US1] No Google/Apple OAuth flow exists (`LoginPage.tsx`'s "Continue with Google" is a clearly-disabled placeholder, never a fake button). **Explicitly deferred** — same scope decision as T018.
- [x] T020 [US1] `backend/src/auth/registration.service.ts` returns a generic conflict response; frontend surfaces it without revealing which method already exists (see `frontend/src/pages/JoinPage.tsx`).
- [x] T021 [US1] Idempotency handled via the unique email constraint + existing account-conflict path (pre-existing).
- [x] T022 [P] [US1] `frontend/src/pages/JoinPage.tsx` (email/password only — no method selector needed since OTP/social are deferred).
- [x] T023 [P] [US1] Verification is link-based (emailed token → `POST /auth/verify-email`), not a masked-email/resend/countdown screen — no dedicated verify-screen frontend page exists. Functionally covers the acceptance intent (account isn't usable until verified) but not the FR-025 UI spec in full; not addressed further this pass.
- [ ] T024 [US1] No dedicated resend-cooldown/daily-limit service exists beyond the general auth rate limiter (`backend/src/auth/auth-rate-limit.middleware.ts`). Not addressed this pass — pre-existing gap, not touched by this session's work.
- [ ] T025 [US1] No dedicated contract test file at this path; deduplication is covered indirectly by `backend/tests/integration/auth.integration.test.ts` for the email method only (OTP/social methods don't exist to test). Not addressed this pass.

**Checkpoint**: Signup independently functional across all methods.

---

## Phase 4: User Story 3 — Returning Member Login with Context-Aware Routing (P1)

**Independent Test**: Log in via deep link to a protected page; confirm redirect returns to that page, not the dashboard; repeat with pending-checkout/event context to confirm priority order.

- [x] T026 [P] [US3] `backend/src/auth/login.service.ts` (email only — no mobile identifier since OTP/mobile signup is deferred, so no auto-detection is needed this pass).
- [x] T027 [US3] `backend/src/auth/login.service.ts` returns a generic invalid-credentials error (verified via existing `auth.integration.test.ts` cases).
- [x] T028 [US3] **(this session)** Implemented as `frontend/src/pages/LoginPage.tsx`'s redirect resolver: protected-page bounce-back (`RequireAuth`'s `location.state.from`) takes priority, else defaults to `/onboarding` (which itself forwards to `/dashboard` once onboarding is complete). No pending-checkout/pending-event priority tiers — those systems (002 checkout, 010 events) have no "pending for this user" read API to route against yet; honestly narrower than the full FR-041 priority chain, not fabricated.
- [ ] T029 [P] [US3] No passwordless (magic-link/OTP) login path exists. Deferred — same scope decision as T018/T019 (this session treats it as part of the deferred OTP/social surface).
- [x] T030 [P] [US3] `frontend/src/pages/LoginPage.tsx` (pre-existing; extended this session to use the new `auth.context.tsx` session layer instead of raw localStorage writes).
- [ ] T031 [US3] No dedicated integration test file at this path. Not addressed this pass.

**Checkpoint**: Login and routing independently functional.

---

## Phase 5: User Story 2 — Guided 13-Step Onboarding to a Personalized Roadmap (P1)

**Independent Test**: Take a verified account through all 13 steps; confirm roadmap generation with fallback on AI failure; confirm resume-not-restart on exit.

- [x] T032 [US2] **(this session)** 11-step sequencer (steps 12–13 are system-generated, not user-answered — see T037) with save-before-advance in `backend/src/onboarding/onboarding.service.ts`'s `submitOnboardingStep()`; progress indicator data via `getOnboardingProgress()`, rendered by `frontend/src/pages/OnboardingPage.tsx`.
- [x] T033 [US2] **(this session)** `getOnboardingProgress()` resumes from the first step with no existing `OnboardingStepResponse` row (never re-presents a completed step) — verified by the integration test "resumes from the exact next incomplete step and never re-presents a completed one".
- [ ] T034 [US2] No local-draft/offline-save-preservation exists on the frontend (a network drop mid-step loses that step's unsaved input, though every prior step's answer is already persisted server-side). Not addressed this pass — no offline-queueing infrastructure exists anywhere else in this app either.
- [x] T035 [P] [US2] All 11 steps' UI in `frontend/src/pages/OnboardingPage.tsx` + `frontend/src/config/onboarding-steps.ts` (single dynamic page keyed by step number, not one route per step — simpler and equivalent for this step count).
- [ ] T036 [P] [US2] No admin-configurable branching/weighted-scoring assessment engine exists — step 11 ("assessment") is a single confidence-level question, its answer stored as opaque JSON in `OnboardingStepResponse`. **Explicitly out of scope this pass** (P1 = US2 core sequencer + roadmap, not an admin-configurable assessment builder) — documented as a deliberate design decision in `backend/src/onboarding/onboarding.types.ts`'s header comment.
- [x] T037 [US2] **(this session)** `backend/src/onboarding/roadmap-generator.service.ts`. No AI provider is integrated anywhere in this codebase (grepped — zero hits for any AI client/key), so per Constitution Article II ("must have a non-AI deterministic fallback if the AI call fails") this generator IS that deterministic fallback path, and `generatedBy` is always `DETERMINISTIC_FALLBACK` — honestly reported, not simulated as AI-generated. Structured so a future AI-drafting step can be inserted ahead of it without changing the persisted shape.
- [x] T038 [US2] **(this session)** `frontend/src/pages/RoadmapPage.tsx` — goal summary, stage, first milestone, and any of learning-path/community-group/challenge/event/AI-tool/weekly-commitment that are actually populated are shown; recommendations for not-yet-built features (community/challenge/event/AI) are honestly omitted from the roadmap fields (`null`), never fabricated.
- [ ] T039 [US2] No per-step mandatory/optional/skippable admin policy exists — all 11 steps are currently required. Deferred (admin-configurability is a P2-grade concern beyond this pass's core sequencer).
- [ ] T040 [US2] No onboarding analytics-event pipeline exists. Not addressed this pass.
- [x] T041 [US2] **(this session)** `backend/tests/integration/onboarding-dashboard.integration.test.ts` — covers: resume/never-re-presents-completed-step, lifecycle-state sync without premature completion, complete-before-all-steps rejected then succeeds once all 11 are done (with `DETERMINISTIC_FALLBACK` roadmap generation), 404-before-completion + restart-clears-steps-but-keeps-last-roadmap. No AI-failure-fallback scenario to test since no AI path exists at all yet (fallback is the only path, by design — see T037).

**Checkpoint**: All P1 flow stories (signup, login, onboarding) functional — proceed to dashboard.

---

## Phase 6 (Phase D): User Story 4 — Member Dashboard (P1)

**Independent Test**: Log in as members in different states (new, active learner, payment-failure, upcoming-session); confirm priority-ordered rendering and per-widget failure isolation.

- [x] T042 **(this session)** `backend/src/dashboard/dashboard.service.ts`'s `getDashboard()` — renders the exact FR-099 order (criticalAlerts → nextBestAction → continueLearning → upcomingLiveSession → currentChallenge → progressAndMilestones → recommendations → communityHighlights → savedItems → membership); order is fixed in the response object shape, and `frontend/src/pages/DashboardPage.tsx` renders it top-to-bottom unchanged.
- [x] T043 [P] **(this session)** `safeWidget()` in `dashboard.service.ts` wraps every real-data widget builder in try/catch — a thrown error becomes `{status:'error', reason:...}` for that widget only, verified by the "isolated per-widget from any other failure" integration test. No per-widget timeout budget (no widget in this pass is slow/external enough to need one — all query the local DB directly, no third-party calls).
- [x] T044 [P] **(this session)** `nextBestAction` widget reuses `001`'s `resolveNextBestAction()` directly (`backend/src/lifecycle/next-best-action.service.ts`) — already returns exactly one action by construction.
- [x] T045 [P] **(this session)** `continueLearning` widget in `dashboard.service.ts` reuses LMS's `getContinueLearning()` (`backend/src/lms/continue-learning.service.ts`) + a real per-enrollment progress-percent calculation; verified end-to-end (enroll → complete 1 of 2 lessons → 50% shown) both in the integration test and a live curl walkthrough against the dev server.
- [ ] T046 [P] No Daily Action Plan widget exists — FR-104 is a distinct, larger feature (task-level plan derived from the roadmap) not built this pass; the Roadmap's `firstMilestone` is the closest equivalent shipped. Deferred.
- [ ] T047 [P] Upcoming Events: honest `empty` widget, reason "Events are not available yet." — spec 010 (Events) doesn't exist yet.
- [ ] T048 [P] Current Challenge: honest `empty` widget, reason "Challenges are not available yet." — spec 006 (Gamification) doesn't exist yet.
- [x] T049 [P] **(this session)** `progressAndMilestones` widget: real `computeProfileCompletionPercent()` (001) — no fake precision, a genuine field-weighted calculation, not a hardcoded number.
- [x] T050 [P] **(this session)** Same widget lists the member's own milestones (any status) via a new `listMilestonesForUser()` repository query added to `backend/src/lifecycle/lifecycle.repository.ts`; each carries its real `status` (CLAIMED/VERIFIED/REJECTED) — the verification-source distinction (self/system/mentor/admin) itself is a `001` data-model gap (only a single `verifiedBy` actor field exists, no source-type enum), not introduced or worsened by this session.
- [ ] T051 [P] Recommendations: honest `empty` widget, reason "Personalized recommendations are not available yet." — no recommendation engine exists (would need a real content-matching system, not a hardcoded list).
- [ ] T052 [P] Community Highlights: honest `empty` widget, reason "Community is not available yet." — spec 005 doesn't exist yet.
- [ ] T053 [P] Quick Actions/AI Usage/Saved Items/Notifications: honest `empty` widgets for Saved Items and Membership (see T112); Quick Actions and Notification-badge are frontend chrome, not attempted this pass (no owning header/nav redesign in scope); AI Usage has no AI module to report on.
- [ ] T054 [US4] No role-tailored widget-set logic exists — every member sees the same widget set this pass (all P1 users are `registered_free_user`s in this repo's current data; Mentor/Instructor/Organization-Admin dashboards are a real gap). Deferred.
- [x] T055 [P] [US4] **(this session)** `isNewUser` flag (from `!onboardingProgress.isComplete`) drives a guided empty-state ("Welcome to CoachX" + Continue setup CTA) in `frontend/src/pages/DashboardPage.tsx`, instead of a blank/partial widget dump.
- [ ] T056 [P] [US4] No "welcome back" inactivity-aware simplified view exists. Deferred.
- [ ] T057 [US4] No mobile app exists in this repo at all (web-only monorepo) — offline dashboard behavior is not applicable/not attempted.
- [ ] T058 [P] [US4] No dedicated dashboard header/member-nav/global-search chrome was built this pass — the dashboard page is content-only, reachable via direct URL (`/dashboard`) and the post-onboarding/post-login redirect. Deferred (this is a site-chrome concern, not the aggregation-endpoint core of US4).
- [ ] T059 [US4] No dashboard analytics-event pipeline exists. Not addressed this pass.
- [x] T060 [US4] **(this session)** `backend/tests/integration/onboarding-dashboard.integration.test.ts` covers: new-user empty state, priority-ordered real+honest-empty widgets once onboarded, and isolated real Continue-Learning data — 3 dashboard-specific integration tests (no E2E/browser-automation tool was available this session; verified instead via a live curl walkthrough against the running dev server, documented in the final report).
- [ ] T061 No full alert-banner catalog exists. `criticalAlerts` covers 3 of 10 FR-101 categories from real account-state fields: `EMAIL_NOT_VERIFIED` (unreachable in practice — login blocks unverified accounts entirely — but correct/future-proof), and `ACCOUNT_LOCKED`/`ACCOUNT_SUSPENDED` (genuinely reachable — fixed this verification pass after finding `authenticate.middleware.ts` only checks the JWT, never re-reads DB status, so an admin locking/suspending an account mid-session is visible on the next dashboard load with an already-valid token; covered by a new integration test). The other 7 categories (verify-mobile, membership-expiring, payment-failed, account-security-issue, course-deadline, event-starting-soon, policy-update, organization-invitation) have no owning data source yet. Deferred.
- [ ] T062 No generic dashboard error/retry/support-reference UI exists beyond a plain "couldn't load" message in `DashboardPage.tsx`/`OnboardingPage.tsx`; no membership-entitlement-failure explanation (no membership/entitlement system to fail). Deferred.

**Checkpoint**: All 4 P1 stories functional — MVP complete (first-login-to-dashboard journey per SC-010).

---

## Phase D2: Profile Management (FR-071–FR-076) — supplementary phase

**Why this phase exists**: spec.md's Identity & Profile Requirements section (§22–27) fully specifies username management, photo upload, profile-completion scoring, and visibility controls as part of this feature's `User Profile` entity (defined in Foundational T006), but the original 8 user stories never elevated profile self-management to its own story. This phase closes that gap; it is derived entirely from FRs already present in spec.md, not from any new requirement.

**Independent Test**: Claim a username (confirm reserved/offensive-word rejection), upload and crop a profile photo, verify the completion percentage never appears in any public/ranked context, and confirm a field marked "private" is actually hidden from another member's view.

- [ ] T063–T069 **Profile Management (Phase D2) — explicitly deferred this session** per the user's own scope-calibration answer ("P1 only (US2 + US4), defer the rest (Recommended)"). Only a bare unique `username` column exists on `User` (`database/prisma/schema.prisma`) — no uniqueness-policy service, no photo upload, no completion-percentage calculator distinct from the lifecycle one reused in T049, no visibility controls, no settings UI. None of T063–T069 attempted this pass.

**Checkpoint**: Profile self-management independently functional.

---

## Phase 7 (Phase E): User Story 5 — Password Reset & Account Recovery (P2)

**Independent Test**: Submit forgot-password with registered vs. unregistered identifier; confirm identical response; complete reset with valid token; confirm session revocation.

- [x] T070 [P] [US5] `backend/src/auth/password-reset.service.ts` (pre-existing, enumeration-safe — verified via existing `auth.integration.test.ts`).
- [x] T071 [US5] `password-reset.service.ts` validates the reset token before allowing a password change (pre-existing).
- [x] T072 [US5] `revokeAllSessions()` exists in `session.service.ts` and is invoked on password reset (pre-existing).
- [ ] T073 [P] [US5] No support-assisted recovery ticket workflow exists (self-service reset only). Deferred — not part of this session's US2/US4 scope, and no support/ticketing system exists elsewhere in the repo to build it on.
- [ ] T074 [US5] No dedicated contract test file at this path. Not addressed this pass.

**Checkpoint**: Recovery independently functional and enumeration-safe.

---

## Phase 8 (Phase F): User Story 6 — 2FA and Session/Device Security (P2)

**Independent Test**: Attempt privileged access without 2FA (blocked); enable 2FA and confirm recovery codes; simulate new-country login and confirm notification; sign out of all devices and confirm every session is actually revoked.

- [x] T075 [P] [US6] `backend/src/auth/mfa.service.ts` — mandatory-2FA gate exists (pre-existing).
- [x] T076 [US6] `mfa.service.ts`'s `startMfaEnrollment`/`confirmMfaEnrollment` (password re-entry, TOTP via `backend/src/auth/totp.util.ts`, recovery codes) — pre-existing.
- [x] T077 [US6] `mfa.service.ts`'s `disableMfa` (password + code required) — pre-existing.
- [ ] T078 [P] [US6] No risk evaluator exists (new-country/impossible-travel/malicious-IP detection) — only repeated-failed-login lockout (`User.failedLoginCount`/`lockedUntil`). Not addressed this pass — pre-existing gap, no external IP-intelligence provider integrated.
- [ ] T079 [US6] No flagged-login notification exists (no risk evaluator to trigger it — see T078).
- [ ] T080 [P] [US6] No frontend "Devices and Sessions" settings screen exists (the backend `session.controller.ts`/`getActiveSessions()`/`revokeSpecificSession()` API is there, but nothing renders it). **Explicitly deferred this session** per the "P1 only" scope answer (Session/Device management UI was named as one of the deferred areas).
- [ ] T081 [US6] No dedicated integration test file at this path. Not addressed this pass.
- [x] T082 [P] [US6] `session.service.ts`'s `rotateSession()` — pre-existing.
- [ ] T083 [US6] No role-based configurable session-expiry policy exists (a single fixed expiry applies to all roles). Not addressed this pass.
- [ ] T084 [US6] No concurrent-session-limit enforcement exists. Not addressed this pass.
- [x] T085 [US6] `session.service.ts`'s `revokeCurrentSession`/`revokeSpecificSession`/`revokeAllSessions` cover current/selected/all-devices sign-out (pre-existing); no accompanying security notification email is sent on all-device sign-out.
- [ ] T086 [US6] No dedicated contract test file at this path. Not addressed this pass.

**Checkpoint**: Account-takeover defense layer independently functional, including full session lifecycle management.

---

## Phase 9 (Phase G): User Story 7 — Self-Service Account Lifecycle (P2)

**Independent Test**: Deactivate account (profile hidden, subscription untouched); run full deletion flow; request data export; withdraw consent.

- [ ] T087–T093 **US7 Account Lifecycle — explicitly deferred this session** per the "P1 only" scope answer. Only `User.status = DEACTIVATED` plus the login-block check for it exist; no deactivation side-effects (profile hiding, notification pausing), no deletion flow, no deletion-blocking-obligations check, no data-export request, no per-channel consent-withdrawal service, no notification-preference matrix. None of T087–T093 attempted this pass.

**Checkpoint**: Account lifecycle self-service independently functional.

---

## Phase 10 (Phase H): User Story 8 — Admin Identity Operations (P3)

**Independent Test**: Admin changes a role (reason required, audit entry, immediate permission refresh); run account merge on two verified duplicates.

- [ ] T094 [P] [US8] No admin user-list frontend page exists (admin app has no `/users` route yet). **Explicitly deferred this session** per the "P1 only" scope answer (admin user list/merge was named as a deferred area).
- [x] T095 [US8] `backend/src/auth/admin-identity.controller.ts`'s `patchUserRole` exists (pre-existing) — audited, though dual-approval-for-super-admin-grant was not independently re-verified this session.
- [ ] T096 [US8] No account-merge workflow exists. Deferred — same scope answer as T094.
- [ ] T097 [P] [US8] No admin user-detail view exists. Deferred — same scope answer as T094.
- [ ] T098 [US8] No dedicated integration test file at this path. Not addressed this pass.

**Checkpoint**: All 8 user stories independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T099–T106 **Polish & Cross-Cutting — not addressed this session.** Rate limiting exists per-endpoint (`backend/src/auth/auth-rate-limit.middleware.ts`, `backend/src/onboarding`'s routes reuse the shared `authenticate` gate) but no dedicated security-hardening/encryption-at-rest/accessibility/localization/performance/analytics pass was run specifically for this feature. `quickstart.md` end-to-end validation (T105) was not run across all 8 user stories — this session instead validated the two stories actually built (US2, US4) via the automated test suite plus a live curl walkthrough (see final report). None of T099–T106 attempted this pass.

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `001` and `002`'s prior work.
- **P1 stories**: US1 (signup) → US3 (login) → US2 (onboarding) → US4/Phase D (dashboard) is the natural user-journey sequence and is recommended even though US1/US2/US3 could technically build in parallel — US4 (dashboard) has a hard practical dependency on onboarding's roadmap output (FR-102's Next Best Action) and login's routing (FR-041 routes to dashboard as the final fallback).
- **Phase D2 (Profile Management)** depends on Foundational (T006's User Profile entity) and US1 (an account must exist) — no dependency on Dashboard, may run in parallel with Phase D once Foundational is done.
- **P2 stories (US5, US6, US7)** depend on Foundational + US1/US3 (they extend signup/login) — may run in parallel with each other and with Phase D2.
- **P3 story (US8)** depends on Foundational + US1 (needs real accounts to merge/role-change).
- **Dashboard widget tasks (T044–T053)** each independently depend on their owning feature's read API — per plan.md's Complexity Tracking, ship widgets incrementally as those APIs land, using T043's failure-and-timeout isolation to keep partial coverage safe.
- **Session-lifecycle tasks (T082–T086)** depend on T005's Session/Device entities (Foundational) and T075–T081's 2FA work being in place, since sign-out-all-devices and session limits interact with the same session records 2FA setup/disable touches.

## Implementation Strategy

**MVP First**: Setup → Foundational → US1 (signup) → US3 (login) → US2 (onboarding) → US4/Phase D (dashboard, incrementally per available widget APIs) → **STOP and VALIDATE** the full first-login-to-dashboard journey (SC-010) → then Phase D2 (Profile Management) + US5/US6 (security-critical, recommend immediately after P1) → US7 → US8 → Polish.
