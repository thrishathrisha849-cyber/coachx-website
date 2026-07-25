---
description: "Task list for Feature 003 — Authentication, Identity, Onboarding, Personalization & Member Dashboard"
---

# Tasks: Authentication, Identity, Onboarding, Personalization & Member Dashboard

**Input**: Design documents from `/specs/003-auth-identity-onboarding-dashboard/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (User Account, RBAC engine with the 12 seeded roles, audit-log infrastructure). Dashboard tasks (Phase D) additionally assume at least minimal read APIs from features 004/005/006/007/008/009/010/011/013 — see plan.md's Complexity Tracking note on incremental widget delivery.

**Tests**: Included — this feature's enumeration-safety, session-revocation, and 2FA-mandatory requirements are direct security controls (Constitution Security & Compliance Baseline); contract tests are non-optional here.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus one supplementary phase (Profile Management) covering spec.md's Identity & Profile Requirements (FR-071–FR-076) that were never elevated to their own user story in the original 8.

**Revision note (2026-07-23)**: This file was corrected following a traceability review. Added to Foundational: the account-status state machine (T007, T008) and an explicit reuse note for role/permission (T009). Added a new Phase D2 (Profile Management, T063–T069) closing the FR-071–076 gap. Added 5 session-lifecycle tasks to Phase F (T082–T086) closing the FR-056/058/059 gap. Added a dashboard alert-catalog task and a generic dashboard error-state task to Phase D (T061, T062). Added an auth-analytics task to Polish (T106). Moved per-widget timeout handling into the widget-loader task (T043, formerly T040) instead of leaving it only in the Polish-phase performance pass. All subsequent task IDs shifted accordingly. No content in `spec.md` was changed.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (User Account, RbacGuard, 12 seeded roles) and `002`'s Consent Record entity exists
- [ ] T002 Resolve `research.md` open items: password-hashing library, SMS/OTP gateway + email provider selection, default values for configurable timeouts (session idle, resend cooldown, inactivity "welcome back" threshold, deletion cooling-off period)
- [ ] T003 [P] Add `backend/src/modules/{auth,risk,onboarding,roadmap,dashboard,account-lifecycle,admin-identity}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T004 Define `User Identity`/`Login Provider`, `Email Address`, `Mobile Number`, `Password Credential` entities/migrations in `backend/src/modules/auth/` (FR-001, FR-002, FR-155) — separate from `001`'s User Account per FR-002.
- [ ] T005 Define `Session`, `Device`, `Two-Factor Method`, `Recovery Code` entities/migrations in `backend/src/modules/auth/session.entity.ts` etc. (FR-055, FR-155)
- [ ] T006 Define `User Profile` entity (public-facing, distinct from private identity) in `backend/src/modules/identity/user-profile.entity.ts` (FR-069, FR-070)
- [ ] T007 **[NEW]** Define the `Account Status` entity and the 10-state machine (pending verification, active, onboarding incomplete, restricted, temporarily locked, suspended, deactivated, scheduled for deletion, deleted, merged) plus the independent restricted-substate flags (posting/commenting/purchasing/withdrawing/mentor-booking disabled, or read-only) in `backend/src/modules/identity/account-status.service.ts` (FR-064, FR-065)
- [ ] T008 **[NEW]** Implement the suspension-display service (suspension reason category, duration, appeal option, support link — never exposing internal moderation notes) in `backend/src/modules/identity/suspension-display.service.ts` (FR-066)
- [ ] T009 **[NEW]** Note: FR-067 (the 12-role set) and FR-068 (permission definitions bundled into roles) reuse `001`'s RBAC module directly (`Role`/`Permission` entities, `RbacGuard`, the 12 seeded roles) — no new entity is created here; this feature's account-status model (T007) is explicitly a separate concept from role, per FR-067.
- [ ] T010 [P] Define `Onboarding Response`, `Assessment`/`Assessment Result` entities/migrations in `backend/src/modules/onboarding/` (FR-155)
- [ ] T011 [P] Define `Roadmap`, `Recommendation` entities/migrations in `backend/src/modules/roadmap/` (FR-155)
- [ ] T012 [P] Define `Security Event`, `Account Recovery Request`, `Data Export Request`, `Account Deletion Request` entities/migrations in `backend/src/modules/{risk,account-lifecycle}/` (FR-155)
- [ ] T013 Implement password hashing service (adaptive algorithm per T002's resolution) in `backend/src/modules/auth/password-hash.service.ts` (FR-138)
- [ ] T014 Implement the auth error-code set (`AUTH_INVALID_CREDENTIALS`, `AUTH_EMAIL_UNVERIFIED`, `AUTH_ACCOUNT_LOCKED`, etc.) in `backend/src/common/errors/auth-error-codes.ts` (FR-156)
- [ ] T015 Implement audit-log entries for identity events (email/mobile/password/2FA changed, session revoked, role changed, status changed, merged, deleted, consent changed) extending `001`'s audit-log interceptor, with mandatory password/token/OTP exclusion in `backend/src/modules/auth/identity-audit.service.ts` (FR-143, FR-144)
- [ ] T016 Contract test: no password/token/OTP ever appears in audit logs or analytics payloads in `backend/tests/contract/no-secrets-in-logs.contract.test.ts` (FR-144)

**Checkpoint**: Foundation ready.

---

## Phase 3: User Story 1 — New Member Signup Across Multiple Methods (P1) 🎯 MVP

**Independent Test**: Complete signup via each of email/mobile-OTP/Google/Apple on a clean environment; confirm exactly one account per unique identity.

- [ ] T017 [P] [US1] Email+password signup endpoint (validation, terms/privacy consent, verification email trigger) in `backend/src/modules/auth/signup.controller.ts` (FR-011, FR-017, FR-019, FR-020, FR-024)
- [ ] T018 [P] [US1] Mobile OTP signup endpoint (rate-limited OTP send, verify-in-one-step) in `backend/src/modules/auth/otp.service.ts` (FR-012, FR-018, FR-028, FR-029)
- [ ] T019 [P] [US1] Google/Apple OAuth signup flow with existing-account-match detection and secure account-link confirmation (not auto-merge) in `backend/src/modules/auth/social-auth.service.ts` (FR-033, FR-034, edge case)
- [ ] T020 [US1] Duplicate-signup detection with generic, non-enumerating message (Login/Forgot Password/Continue-with-provider) in `backend/src/modules/auth/duplicate-check.service.ts` (FR-021, acceptance scenario 3)
- [ ] T021 [US1] Idempotent signup-submission handling (rapid double-click protection) in `backend/src/modules/auth/signup.controller.ts` (FR-022, acceptance scenario 4)
- [ ] T022 [P] [US1] Web: signup page with method selection, form states (default/disabled/loading/success/error/rate-limited) in `web/src/app/(public)/signup/page.tsx` (FR-010, FR-022)
- [ ] T023 [P] [US1] Web: verification screen (masked email, resend, change-email, countdown) in `web/src/app/(public)/verify/page.tsx` (FR-025)
- [ ] T024 [US1] Verification-email resend protections (cooldown, daily limit, IP/device limits, audit) in `backend/src/modules/auth/verification-resend.service.ts` (FR-026)
- [ ] T025 [US1] Contract test: exactly-one-account-per-identity across all 4 methods + rapid-resubmit + provider-email-collision in `backend/tests/contract/signup-dedup.contract.test.ts` (all 5 acceptance scenarios)

**Checkpoint**: Signup independently functional across all methods.

---

## Phase 4: User Story 3 — Returning Member Login with Context-Aware Routing (P1)

**Independent Test**: Log in via deep link to a protected page; confirm redirect returns to that page, not the dashboard; repeat with pending-checkout/event context to confirm priority order.

- [ ] T026 [P] [US3] Login endpoint with single identifier auto-detection (email vs. mobile) in `backend/src/modules/auth/login.controller.ts` (FR-037, FR-038, FR-039)
- [ ] T027 [US3] Generic, non-field-revealing login-failure response with next-step actions in `backend/src/modules/auth/login.controller.ts` (FR-040, acceptance scenario 4)
- [ ] T028 [US3] Post-login routing priority resolver (protected URL → pending checkout → pending event → incomplete onboarding → dashboard) in `backend/src/modules/auth/post-login-router.service.ts` (FR-041, acceptance scenarios 1–3) — calls into `002`'s checkout-tracking and an events-registration read API
- [ ] T029 [P] [US3] Optional passwordless login (magic link + OTP) with short-lived single-use tokens in `backend/src/modules/auth/passwordless.service.ts` (FR-042)
- [ ] T030 [P] [US3] Web: login page in `web/src/app/(public)/login/page.tsx` (FR-037)
- [ ] T031 [US3] Integration test: identifier auto-detect, redirect-priority-order (all 4 priority levels), generic error message in `backend/tests/integration/us3-login-routing.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: Login and routing independently functional.

---

## Phase 5: User Story 2 — Guided 13-Step Onboarding to a Personalized Roadmap (P1)

**Independent Test**: Take a verified account through all 13 steps; confirm roadmap generation with fallback on AI failure; confirm resume-not-restart on exit.

- [ ] T032 [US2] 13-step onboarding sequencer with persistent progress indicator and per-step save-before-advance in `backend/src/modules/onboarding/onboarding-flow.service.ts` (FR-078, acceptance scenario 1)
- [ ] T033 [US2] Auto-save + resume-from-exact-step (not restart) in `backend/src/modules/onboarding/onboarding-resume.service.ts` (FR-090, acceptance scenario 2)
- [ ] T034 [US2] Local answer preservation on save-failure (network drop) in `web/src/lib/onboarding/local-draft.ts` + matching mobile implementation (FR-149, edge case)
- [ ] T035 [P] [US2] Steps 1–10 UI (Welcome, Language, Goal, User Type, Experience, Business Stage, Interests, Time Availability, Format, Challenge) in `web/src/app/(member)/onboarding/[step]/page.tsx` (FR-079–FR-088)
- [ ] T036 [P] [US2] Optional/goal-specific assessment engine (branching, weighted scoring, result categories, versioning) in `backend/src/modules/onboarding/assessment.service.ts` (FR-089)
- [ ] T037 [US2] Roadmap generator: AI-based primary path with deterministic rule-based fallback that activates automatically on AI failure in `backend/src/modules/roadmap/roadmap-generator.service.ts` (FR-093–FR-095, acceptance scenario 4, Constitution Article II)
- [ ] T038 [US2] Roadmap display (goal summary, stage, path, first course, community group, challenge, event, AI tool, weekly commitment, first milestone) in `web/src/app/(member)/onboarding/roadmap/page.tsx` (FR-093, acceptance scenario 3)
- [ ] T039 [US2] Admin per-step policy configuration (mandatory/optional/skippable/conditional) in `backend/src/modules/onboarding/step-policy.service.ts` (FR-091)
- [ ] T040 [US2] Onboarding analytics events (`started` through `onboarding_abandoned`) with no sensitive free-text sent in `backend/src/modules/onboarding/onboarding-analytics.service.ts` (FR-092)
- [ ] T041 [US2] Integration test: full 13-step sequence, mid-flow exit/resume at step 6, roadmap generation, AI-failure fallback in `backend/tests/integration/us2-onboarding.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: All P1 flow stories (signup, login, onboarding) functional — proceed to dashboard.

---

## Phase 6 (Phase D): User Story 4 — Member Dashboard (P1)

**Independent Test**: Log in as members in different states (new, active learner, payment-failure, upcoming-session); confirm priority-ordered rendering and per-widget failure isolation.

- [ ] T042 Dashboard composition service enforcing the 10-tier priority order in `backend/src/modules/dashboard/dashboard-composer.service.ts` (FR-099, acceptance scenario 1)
- [ ] T043 [P] Per-widget failure-isolated **and timeout-isolated** loader (skeleton states, independent retry, no single-widget-failure-or-timeout cascading, per-widget timeout budget with automatic fallback to a cached/default state) in `backend/src/modules/dashboard/widget-loader.service.ts` (FR-120, FR-148, acceptance scenario 3) — **this is the task that makes incremental dependency delivery (plan.md Complexity Tracking) safe; timeout handling was moved here from the Polish phase (see T103) since a slow widget needs the same isolation guarantee as a failing one**
- [ ] T044 [P] Next Best Action widget (exactly one primary card) in `backend/src/modules/dashboard/widgets/next-best-action.service.ts` (FR-102, acceptance scenario 2)
- [ ] T045 [P] Continue Learning widget querying `004`'s course-progress API in `backend/src/modules/dashboard/widgets/continue-learning.service.ts` (FR-103)
- [ ] T046 [P] Daily Action Plan widget (derived from roadmap + time availability) in `backend/src/modules/dashboard/widgets/daily-actions.service.ts` (FR-104)
- [ ] T047 [P] Upcoming Events widget querying `010`'s events API in `backend/src/modules/dashboard/widgets/upcoming-events.service.ts` (FR-105)
- [ ] T048 [P] Current Challenge widget querying `006`'s gamification API in `backend/src/modules/dashboard/widgets/current-challenge.service.ts` (FR-106)
- [ ] T049 [P] Progress Overview widget (role/membership-scoped, no fake precision) querying `006`/`009` in `backend/src/modules/dashboard/widgets/progress-overview.service.ts` (FR-107)
- [ ] T050 [P] Business Milestone tracker with verification-source badges (self/system/mentor/admin) in `backend/src/modules/dashboard/widgets/milestones.service.ts` (FR-108, Constitution Article VIII)
- [ ] T051 [P] Personalized Recommendations widget with "why recommended" reason and feedback capture in `backend/src/modules/dashboard/widgets/recommendations.service.ts` (FR-109, FR-097)
- [ ] T052 [P] Community Highlights widget querying `005`'s API, respecting permissions, not replacing the full feed in `backend/src/modules/dashboard/widgets/community-highlights.service.ts` (FR-110)
- [ ] T053 [P] Quick Actions, Membership, AI Usage, Saved Items, Notification-badge widgets in `backend/src/modules/dashboard/widgets/{quick-actions,membership,ai-usage,saved-items,notifications}.service.ts` (FR-111–FR-115) — querying `009`/`008` respectively
- [ ] T054 [US4] Role-tailored widget sets (Free/Paid Member, Mentor, Instructor, Organization Admin) in `backend/src/modules/dashboard/role-layout.service.ts` (FR-117)
- [ ] T055 [P] [US4] New-user empty-state dashboard in `web/src/app/(member)/dashboard/empty-state.tsx` (FR-118, acceptance scenario 4)
- [ ] T056 [P] [US4] "Welcome back" simplified restart view for returning-inactive users in `web/src/app/(member)/dashboard/welcome-back.tsx` (FR-119, edge case)
- [ ] T057 [US4] Offline/low-network dashboard behavior on mobile (cached summary, safe action queueing, no offline payment/booking finalization) in `mobile/lib/features/dashboard/offline_dashboard.dart` (FR-123)
- [ ] T058 [P] [US4] Dashboard header, member navigation (sidebar/bottom-nav), global member search in `web/src/app/(member)/dashboard/{header,nav}.tsx` + `web/src/components/member-search.tsx` (FR-100, FR-124, FR-125)
- [ ] T059 [US4] Dashboard analytics events in `backend/src/modules/dashboard/dashboard-analytics.service.ts` (FR-146)
- [ ] T060 [US4] Integration + E2E test: priority-order rendering across 4 member states, single-primary-NBA-card, isolated-widget-failure, new-user empty state in `web/tests/e2e/us4-dashboard.spec.ts` (all 4 acceptance scenarios)
- [ ] T061 **[NEW]** Dashboard alert-banner catalog (verify-email, verify-mobile, complete-profile, membership-expiring, payment-failed, account-security-issue, course-deadline, event-starting-soon, policy-update, organization-invitation), each with severity/title/description/CTA/dismissibility/expiry/audience, and a hard rule that critical/security alerts CANNOT be dismissed, in `backend/src/modules/dashboard/alert-banner.service.ts` (FR-101)
- [ ] T062 **[NEW]** Generic dashboard error/empty states: no-active-course, no-upcoming-event, no-active-challenge empty states with clear CTAs; a human-readable error state with retry action and support reference (no technical details); redirect-to-secure-login on authentication failure; membership-explanation on entitlement failure — in `backend/src/modules/dashboard/dashboard-error-states.service.ts` (FR-121, FR-122)

**Checkpoint**: All 4 P1 stories functional — MVP complete (first-login-to-dashboard journey per SC-010).

---

## Phase D2: Profile Management (FR-071–FR-076) — supplementary phase

**Why this phase exists**: spec.md's Identity & Profile Requirements section (§22–27) fully specifies username management, photo upload, profile-completion scoring, and visibility controls as part of this feature's `User Profile` entity (defined in Foundational T006), but the original 8 user stories never elevated profile self-management to its own story. This phase closes that gap; it is derived entirely from FRs already present in spec.md, not from any new requirement.

**Independent Test**: Claim a username (confirm reserved/offensive-word rejection), upload and crop a profile photo, verify the completion percentage never appears in any public/ranked context, and confirm a field marked "private" is actually hidden from another member's view.

- [ ] T063 [P] Username system: case-insensitive uniqueness, allowed character set, min/max length, reserved-word and offensive-word blocking, impersonation protection, public URL at `/members/username` in `backend/src/modules/identity/username.service.ts` (FR-071)
- [ ] T064 Username change policy: limited-frequency changes, optional redirect from the previous URL, audit history, reserved period on the old username in `backend/src/modules/identity/username-change.service.ts` (FR-072)
- [ ] T065 [P] Profile photo/cover image upload: format/size limits, minimum dimensions, crop/rotate/compress/remove, default avatar, MIME validation, malware scanning, metadata stripping, signed uploads, moderation hook, responsive thumbnail generation (small/medium/large) in `backend/src/modules/identity/profile-media.service.ts` (FR-073)
- [ ] T066 [P] Profile completion percentage calculator (configurable weighted fields) used only to encourage the user — explicitly never surfaced for shaming or public/ranked comparison — in `backend/src/modules/identity/profile-completion.service.ts` (FR-074, Constitution Article VIII)
- [ ] T067 Profile visibility controls (Public/Members-only/Connections-only/Private) with field-specific privacy toggles (location, email, mobile, activity, followers, following, achievements, revenue milestones, course completion); email and mobile MUST NOT default to public in `backend/src/modules/identity/profile-visibility.service.ts` (FR-075)
- [ ] T068 Web: Profile settings page (photo/bio/headline/skills/interests/social-links editors, visibility controls) as part of the full 15-category settings navigation (Profile, Account, Security, Language, Appearance, Notifications, Privacy, Connected accounts, Devices, Membership, Billing, Data and privacy, Blocked users, Organization, Support) in `web/src/app/(member)/settings/profile/page.tsx` (FR-076)
- [ ] T069 Integration test: username uniqueness/reserved-word rejection, photo-upload pipeline (including malware-scan rejection), completion-percentage never appears in a public/ranked view, visibility enforcement across each field-specific privacy toggle in `backend/tests/integration/profile-management.integration.test.ts` (FR-071–FR-076)

**Checkpoint**: Profile self-management independently functional.

---

## Phase 7 (Phase E): User Story 5 — Password Reset & Account Recovery (P2)

**Independent Test**: Submit forgot-password with registered vs. unregistered identifier; confirm identical response; complete reset with valid token; confirm session revocation.

- [ ] T070 [P] [US5] Forgot-password endpoint with identical response regardless of match (enumeration-safe) in `backend/src/modules/auth/password-reset.controller.ts` (FR-043, acceptance scenario 1, SC-003)
- [ ] T071 [US5] Reset-token validation (valid/unused/unexpired) + policy enforcement + configurable session revocation in `backend/src/modules/auth/password-reset.controller.ts` (FR-045, FR-046, acceptance scenario 2)
- [ ] T072 [US5] Unconditional all-session revocation on staff password reset in `backend/src/modules/auth/session.service.ts` (FR-047, acceptance scenario 3 — overrides the general-user configurable policy)
- [ ] T073 [P] [US5] Support-assisted recovery workflow (ticket → identity evidence → risk review → approval → recovery link, dual approval for high-risk) in `backend/src/modules/account-lifecycle/recovery-request.service.ts` (FR-048, FR-049, acceptance scenario 4) — support agents structurally cannot view/set passwords
- [ ] T074 [US5] Contract test: identical forgot-password response, staff-forced-full-revocation, support-cannot-view-password in `backend/tests/contract/us5-recovery.contract.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: Recovery independently functional and enumeration-safe.

---

## Phase 8 (Phase F): User Story 6 — 2FA and Session/Device Security (P2)

**Independent Test**: Attempt privileged access without 2FA (blocked); enable 2FA and confirm recovery codes; simulate new-country login and confirm notification; sign out of all devices and confirm every session is actually revoked.

- [ ] T075 [P] [US6] Mandatory-2FA enforcement gate for admin/finance/super-admin/high-risk roles in `backend/src/modules/auth/two-factor.service.ts` (FR-050, acceptance scenario 1)
- [ ] T076 [US6] 2FA setup flow (password re-entry, QR/secret, verification code, recovery-code generation) in `backend/src/modules/auth/two-factor.service.ts` (FR-051, FR-052)
- [ ] T077 [US6] 2FA disable flow (password + current-2FA-or-recovery-code required, security notification) in `backend/src/modules/auth/two-factor.service.ts` (FR-054, acceptance scenario 2)
- [ ] T078 [P] [US6] Login risk evaluator (new country, impossible travel, new device, repeated failures, malicious IP, token reuse) with graduated response in `backend/src/modules/risk/risk-evaluator.service.ts` (FR-062, acceptance scenario 3)
- [ ] T079 [US6] Flagged-login notification with "This was me"/"Secure my account" actions in `backend/src/modules/risk/login-notification.service.ts` (FR-063)
- [ ] T080 [P] [US6] "Devices and Sessions" settings screen with per-device remove-access in `web/src/app/(member)/settings/devices/page.tsx` (FR-060, FR-061, acceptance scenario 4)
- [ ] T081 [US6] Integration test: 2FA-mandatory-block, disable-requires-reverification, risk-graduated-response, device-removal-revokes-session in `backend/tests/integration/us6-2fa-session-security.integration.test.ts` (all 4 acceptance scenarios)
- [ ] T082 **[NEW]** [P] [US6] Session token rotation, secure cookie flags (web) / secure storage (mobile), refresh-token reuse detection in `backend/src/modules/auth/session.service.ts` (FR-056)
- [ ] T083 **[NEW]** [US6] Role-based configurable session expiry: persistent session for standard users, shorter idle timeout with strong re-authentication for admins, using T002's resolved default values in `backend/src/modules/auth/session-expiry.service.ts` (FR-057)
- [ ] T084 **[NEW]** [US6] Concurrent-session limits: standard users allow multiple devices; admin-configurable maximum by role and organization policy in `backend/src/modules/auth/session-limits.service.ts` (FR-058)
- [ ] T085 **[NEW]** [US6] Sign-out current device / selected device / all devices endpoint; all-device sign-out revokes refresh tokens, invalidates active sessions, and sends a security notification in `backend/src/modules/auth/sign-out.controller.ts` (FR-059)
- [ ] T086 **[NEW]** [US6] Contract test: concurrent-session-limit enforcement and sign-out-all-devices fully revokes every session and triggers the security notification in `backend/tests/contract/session-lifecycle.contract.test.ts` (FR-056–FR-059)

**Checkpoint**: Account-takeover defense layer independently functional, including full session lifecycle management.

---

## Phase 9 (Phase G): User Story 7 — Self-Service Account Lifecycle (P2)

**Independent Test**: Deactivate account (profile hidden, subscription untouched); run full deletion flow; request data export; withdraw consent.

- [ ] T087 [P] [US7] Account deactivation (hide profile, pause notifications, explicit subscription-not-cancelled explanation) in `backend/src/modules/account-lifecycle/deactivation.service.ts` (FR-132, acceptance scenario 1)
- [ ] T088 [US7] Account deletion flow (consequences → re-auth → optional reason → confirm → cooling-off → delete/anonymize → confirmation) in `backend/src/modules/account-lifecycle/deletion.service.ts` (FR-133, acceptance scenario 2)
- [ ] T089 [US7] Deletion-blocking considerations check (active subscription, pending refund, mentor payout, org ownership, legal retention) in `backend/src/modules/account-lifecycle/deletion-considerations.service.ts` (FR-134, acceptance scenario 3)
- [ ] T090 [P] [US7] Data export request (secure, time-limited, identity-verified) in `backend/src/modules/account-lifecycle/data-export.service.ts` (FR-135)
- [ ] T091 [P] [US7] Per-channel consent withdrawal (marketing email/push/SMS/WhatsApp/product-updates/partner/personalization) extending `002`'s Consent Record in `backend/src/modules/account-lifecycle/consent-withdrawal.service.ts` (FR-136, acceptance scenario 4)
- [ ] T092 [US7] Category × channel notification preference matrix (security notifications non-disableable) in `web/src/app/(member)/settings/notifications/page.tsx` (FR-137)
- [ ] T093 [US7] Integration test: deactivation-preserves-subscription, full deletion flow, deletion-blocked-by-active-obligations, consent-withdrawal-stops-sends in `backend/tests/integration/us7-account-lifecycle.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: Account lifecycle self-service independently functional.

---

## Phase 10 (Phase H): User Story 8 — Admin Identity Operations (P3)

**Independent Test**: Admin changes a role (reason required, audit entry, immediate permission refresh); run account merge on two verified duplicates.

- [ ] T094 [P] [US8] Admin user list with filters (role/membership/status/verification/source/date/language/country/org/last-active) in `web/src/app/(admin)/users/page.tsx` (FR-127)
- [ ] T095 [US8] Role-change workflow (reason required, audit entry, immediate permission refresh, dual approval for super-admin grant) in `backend/src/modules/admin-identity/role-change.service.ts` (FR-130, acceptance scenarios 1–2)
- [ ] T096 [US8] Account-merge workflow (ownership verification, primary selection, purchase/progress/membership migration, session revocation, audit preservation, financial-conflict routes to manual review) in `backend/src/modules/admin-identity/account-merge.service.ts` (FR-131, acceptance scenarios 3–4)
- [ ] T097 [P] [US8] Admin user detail view (13 tabs, mandatory sensitive-data masking) in `web/src/app/(admin)/users/[id]/page.tsx` (FR-129)
- [ ] T098 [US8] Integration test: role-change-with-audit-and-refresh, super-admin-dual-approval, merge-consolidation, merge-financial-conflict-routes-to-review in `backend/tests/integration/us8-admin-identity.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: All 8 user stories independently functional.

---

## Phase 11: Polish & Cross-Cutting Concerns

- [ ] T099 [P] Security hardening pass: refresh-token rotation, CSRF/XSS protection, rate limiting, bot/credential-stuffing defense, secret rotation across all auth endpoints (FR-139–FR-141)
- [ ] T100 [P] Encryption verification: data in transit and at rest where appropriate (FR-142)
- [ ] T101 [P] Accessibility pass across auth flows and dashboard (labels, screen-reader OTP support, focus management, landmarks, reduced-motion, chart text alternatives) (FR-150, FR-151)
- [ ] T102 [P] Localization pass: translation-key-only strings, Tamil/Tanglish/English, no auto-transliteration of names, localized date/time/number/currency (FR-152, FR-153)
- [ ] T103 Performance pass: immediate auth-action loading states, per-page performance budgets (FR-147) — **note: the per-widget timeout-fallback mechanism itself now lives in T043, not here; this task covers broader page-level performance verification only**
- [ ] T104 Full audit-trail coverage verification across all identity/security/admin event types, confirming zero secrets ever appear (SC-008)
- [ ] T105 Run `quickstart.md` validation end-to-end across all 8 user stories, confirming the full first-login-to-dashboard journey (SC-010)
- [ ] T106 **[NEW]** Auth analytics events (`signup_started`, `signup_method_selected`, `signup_completed`, `signup_failed`, `verification_sent`, `verification_completed`, `verification_failed`, `login_started`, `login_succeeded`, `login_failed`, `password_reset_requested`, `password_reset_completed`, `social_account_linked`, `session_revoked`, `two_factor_enabled`, `two_factor_disabled`, `account_recovery_started`, `account_deleted`) wired across the signup/login/reset/2FA/recovery/deletion flows built in Phases 3, 4, 7, 8, 9 in `backend/src/modules/auth/auth-analytics.service.ts` (FR-145) — placed in Polish since, unlike onboarding analytics (T040) or dashboard analytics (T059) which are single-story concerns, this spans five separate stories that must all exist first

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
