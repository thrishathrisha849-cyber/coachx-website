---
description: "Task list for Feature 007 — Mentor Marketplace: Discovery, Booking, Sessions & Payouts"
---

# Tasks: Mentor Marketplace: Discovery, Booking, Sessions & Payouts

**Input**: Design documents from `/specs/007-mentor-marketplace/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Features 001, 003, and 005's Foundational phases complete** (layered RBAC and audit-log interceptor from 001, Auth/User Profile from 003, messaging infrastructure and safety rules from 005).

**Tests**: Included throughout — this feature is the constitution's co-cited source for Article III (no guaranteed-outcome claims) and Article IV (commission-snapshot immutability); slot-hold/no-double-booking, commission-snapshot-immutability, and session-note data-level-visibility get dedicated Foundational contract tests, matching this spec's own SC-001, SC-002, and SC-005.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md — this spec defines **8**, not 9, user stories), plus five supplementary cross-cutting phases whose FR groups are not owned by any single prioritized story (Discovery & Search FR-045–FR-054; Messaging & Professional Boundaries remainder FR-087, FR-090–FR-093; Payment & Pricing remainder FR-107, FR-109–FR-110; Review & Quality Score FR-122–FR-139; Suspension/Deactivation/Safety/Content-Interop FR-140–FR-145), and one dedicated Admin Mentorship Operations Console phase (FR-146–FR-155).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`/`003`/`005`'s Foundational phases are deployed (RBAC, audit-log interceptor, Auth/User Profile, messaging infrastructure and self-promotion moderation limits this feature consumes)
- [ ] T002 Resolve `research.md` open items before proceeding: video-provider selection, job-scheduler choice, off-platform-payment/review-manipulation detection technique, and every numeric default the source leaves unstated (no-show grace period, slot-hold expiry duration, dispute window length, regulated-category compliance frameworks per jurisdiction, commission fee schedule, minimum payout threshold/settlement delay — FR-184–FR-189)
- [ ] T003 [P] Add `backend/src/modules/{mentor-application,mentor-profile,mentor-discovery,mentor-availability,mentor-booking,mentor-session,mentor-messaging,mentor-lifecycle,mentor-dispute,mentor-payment,mentor-payout,mentor-review,mentor-safety,mentor-content,mentor-admin}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define `Mentor Application` entity + onboarding-stage progress tracking in `backend/src/modules/mentor-application/mentor-application.entity.ts` (FR-006–FR-011)
- [ ] T005 [P] Define `Mentor Verification` and `Credential` entities in `backend/src/modules/mentor-application/{mentor-verification,credential}.entity.ts` (FR-012–FR-016, FR-018–FR-024)
- [ ] T006 [P] Define `Mentor Profile`, `Mentor Expertise`, `Mentor Language` entities in `backend/src/modules/mentor-profile/` (FR-025, FR-030, spec.md Key Entities)
- [ ] T007 [P] Define `Mentor Service` and `Service Policy` entities in `backend/src/modules/mentor-profile/{mentor-service,service-policy}.entity.ts` (FR-033, FR-097)
- [ ] T008 [P] Define `Availability Rule`, `Availability Exception`, `Calendar Integration`, `Calendar Busy Block` entities in `backend/src/modules/mentor-availability/` (FR-044–FR-046 field refs)
- [ ] T009 Define `Booking` and `Booking Slot Hold` entities in `backend/src/modules/mentor-booking/{booking,booking-slot-hold}.entity.ts` (FR-066, FR-067)
- [ ] T010 [P] Define `Booking Intake` and `Booking Attachment` entities in `backend/src/modules/mentor-booking/{booking-intake,booking-attachment}.entity.ts` (FR-068, FR-069)
- [ ] T011 [P] Define `Session`, `Session Participant`, `Session Attendance`, `Session Technical Log` entities in `backend/src/modules/mentor-session/` (FR-074, FR-076, FR-082)
- [ ] T012 [P] Define `Session Note`, `Action Plan`, `Action Item`, `Deliverable` entities in `backend/src/modules/mentor-session/` (FR-083–FR-085)
- [ ] T013 [P] Define `Mentor Message Context` entity in `backend/src/modules/mentor-messaging/mentor-message-context.entity.ts` (FR-087)
- [ ] T014 [P] Define `Cancellation`, `Reschedule Request`, `No-show Record` entities in `backend/src/modules/mentor-lifecycle/` (FR-094, FR-095, FR-098, FR-099)
- [ ] T015 [P] Define `Review`, `Review Response`, `Review Report` entities in `backend/src/modules/mentor-review/` (FR-122, FR-127, FR-129)
- [ ] T016 [P] Define `Dispute`, `Dispute Evidence`, `Refund` entities in `backend/src/modules/mentor-dispute/` (FR-102, FR-103, FR-104)
- [ ] T017 [P] Define `Session Credit` entity in `backend/src/modules/mentor-payment/session-credit.entity.ts` (FR-110)
- [ ] T018 [P] Define `Mentor Earning` and `Commission` entities in `backend/src/modules/mentor-payout/{mentor-earning,commission}.entity.ts` (FR-112, FR-113, FR-115)
- [ ] T019 [P] Define `Payout Account`, `Payout`, `Tax Document` entities in `backend/src/modules/mentor-payout/` (FR-116–FR-120)
- [ ] T020 [P] Define `Quality Score` and `Quality Review` entities in `backend/src/modules/mentor-review/{quality-score,quality-review}.entity.ts` (FR-131, FR-138)
- [ ] T021 [P] Define `Mentor Restriction` and `Safety Incident` entities in `backend/src/modules/mentor-safety/` (FR-140, FR-143 field refs)
- [ ] T022 Note: `Audit Log` reuses `001`'s audit-log interceptor directly for administrative, financial, and staff-access actions across every module above — no new entity or logging engine is created (FR-169, Constitution Article VII)
- [ ] T023 Implement the atomic slot-lock service (Redis-based lock + DB availability recheck) that the full booking transaction wires into, in `backend/src/modules/mentor-booking/slot-lock.service.ts` (FR-060, FR-164)
- [ ] T024 Implement the commission-snapshot service: the applicable commission rate is resolved and stored immutably on the `Booking`/`Commission` record at confirmation time, never recomputed from later config in `backend/src/modules/mentor-payout/commission-snapshot.service.ts` (FR-113, Constitution Article IV)
- [ ] T025 Implement the multi-signal attendance-corroboration service (join logs, join duration, provider webhook, manual confirmation, both-party completion, chat activity, support incident — no single signal ever conclusive alone) in `backend/src/modules/mentor-session/attendance-corroboration.service.ts` (FR-100)
- [ ] T026 Note: role/permission enforcement for the 18-role mentorship hierarchy (Visitor…Super admin) reuses `001`'s layered RBAC directly — no separate mentorship permission engine is created here (FR-001, FR-002, Constitution Article VII)
- [ ] T027 Note: `mentor-messaging` is layered on top of `005`'s Direct Conversation/Message entities and safety rules rather than reimplemented — `Mentor Message Context` (T013) only adds mentorship-specific context gating and boundary rules (FR-087)
- [ ] T028 Contract test: concurrent slot-hold booking attempts on the identical mentor time slot — exactly one succeeds, the rest see the slot as unavailable, no double-booking under load in `backend/tests/contract/mentor-booking-no-double-booking.contract.test.ts` (FR-060, FR-067, SC-001)
- [ ] T029 Contract test: a booking's snapshotted commission rate is unaffected by any subsequent platform commission-rate change, verified by re-checking historical bookings after a rate change in `backend/tests/contract/mentor-commission-snapshot-immutable.contract.test.ts` (FR-113, SC-002)
- [ ] T030 Contract test: private mentor notes are never returned to a member-scoped API call, and admin safety notes are always returned to both mentor- and member-scoped calls, at the data layer regardless of client UI in `backend/tests/contract/mentor-session-note-visibility.contract.test.ts` (FR-083, SC-005)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Mentor Applies and Completes the Onboarding Pipeline (P1) 🎯 MVP

**Independent Test**: Submit a mentor application through all 21 onboarding stages with a test identity document and portfolio, and confirm the application reaches "Approved" status and the profile becomes publishable — without any booking or payment functionality existing yet.

- [ ] T031 [US1] Onboarding pipeline stage sequencer implementing the ordered 21-stage flow in `backend/src/modules/mentor-application/onboarding-pipeline.service.ts` (FR-006)
- [ ] T032 [US1] Progress-save/resume service persisting partial answers at every stage, restoring them exactly as left in `backend/src/modules/mentor-application/onboarding-progress.service.ts` (FR-007, acceptance scenario 4)
- [ ] T033 [US1] Mentor application field-capture forms covering the full Section 8 field set in `web/src/app/(mentor-onboarding)/apply/[stage]/page.tsx` (FR-008)
- [ ] T034 [US1] Public-profile document redaction — identity documents and other sensitive application evidence are never exposed on the public profile in `backend/src/modules/mentor-application/document-redaction.service.ts` (FR-009)
- [ ] T035 [US1] Application status state machine (Draft…Archived) with an accessible applicant status tracker in `backend/src/modules/mentor-application/application-status.service.ts` (FR-010, FR-011, acceptance scenario 1)
- [ ] T036 [US1] Admin "request changes" flow that preserves all prior answers on resubmission and notifies the applicant with the specific gap in `backend/src/modules/mentor-application/change-request.service.ts` (FR-010, acceptance scenario 2)
- [ ] T037 [US1] Identity verification flow (ID document, selfie/liveness, email, mobile OTP, address, tax identity) in `backend/src/modules/mentor-application/identity-verification.service.ts` (FR-012)
- [ ] T038 [US1] Identity-document encryption at rest, restricted staff access, expiry/re-verification triggers, audit trail, retention policy in `backend/src/modules/mentor-application/identity-document-storage.service.ts` (FR-013)
- [ ] T039 [P] [US1] "Identity Verified" badge display without exposing underlying document details in `web/src/components/mentor/identity-verified-badge.tsx` (FR-014)
- [ ] T040 [US1] Professional verification evidence capture + status tracking (Self-declared → Evidence submitted → Under review → Verified/Partially verified/Rejected/Expired) in `backend/src/modules/mentor-application/professional-verification.service.ts` (FR-015, FR-016)
- [ ] T041 [US1] Mandatory orientation module with completion quiz/acknowledgment, blocking profile publish until recorded in `backend/src/modules/mentor-application/orientation.service.ts` (FR-017, acceptance scenario 3)
- [ ] T042 [P] [US1] Applicant status tracker UI in `web/src/app/(mentor-onboarding)/status/page.tsx` (FR-011)
- [ ] T043 [P] [US1] Admin mentor-application review screen shell (approve/conditional-approve/request-changes/schedule-interview/reject/escalate/note) in `web/src/app/(admin)/mentorship/applications/[applicationId]/page.tsx` (FR-148 preview, wired fully in Phase 13)
- [ ] T044 [US1] Integration test: full submission → changes-requested-with-preserved-answers → identity/professional verification → orientation-gate → approved-and-publishable, covering all 4 acceptance scenarios in `backend/tests/integration/us1-mentor-onboarding.integration.test.ts`

**Checkpoint**: The mentor supply pipeline — the true foundation of the marketplace — is independently functional.

---

## Phase 4: User Story 2 — Regulated-Expert-Category Mentor Passes Extra Credential Checks (P1)

**Independent Test**: Submit a "Legal advice" category application without a credential, confirm the system blocks the applicant from listing services, then submit a valid credential and confirm the restriction lifts and a jurisdiction disclaimer appears on the resulting profile.

- [ ] T045 [US2] Regulated-category identification and category-specific credential requirement mapping (legal, tax, investment, medical/mental-health, accounting, immigration) in `backend/src/modules/mentor-application/regulated-category.service.ts` (FR-018)
- [ ] T046 [US2] Credential submission requirement + verification-gated service-listing restriction until verified in `backend/src/modules/mentor-application/credential-gate.service.ts` (FR-019, acceptance scenario 1)
- [ ] T047 [US2] Credential expiry tracking + automatic re-verification trigger + new-booking restriction in the affected category on expiry in `backend/src/modules/mentor-application/credential-expiry.service.ts` (FR-022, acceptance scenario 2)
- [ ] T048 [US2] Jurisdiction disclaimer + educational-vs-professional-advice notice display on regulated-category profiles and service pages in `web/src/components/mentor/jurisdiction-disclaimer.tsx` (FR-020, FR-024, acceptance scenario 3)
- [ ] T049 [US2] Misleading regulated-title detection blocking publish in `backend/src/modules/mentor-application/misleading-title-check.service.ts` (FR-021, acceptance scenario 4)
- [ ] T050 [US2] Emergency/professional-boundary notice display for relevant regulated categories in `web/src/components/mentor/regulated-boundary-notice.tsx` (FR-023)
- [ ] T051 [US2] Integration test: credential-missing block, expiry-triggered re-verification and restriction, disclaimer display, misleading-title block — all 4 acceptance scenarios in `backend/tests/integration/us2-regulated-credentials.integration.test.ts`

**Checkpoint**: Regulated-category legal-risk and Constitution Article III professional-boundary controls are independently functional.

---

## Phase 5: User Story 3 — Member Discovers and Books a Mentor Session with Slot-Hold Protection (P1)

**Independent Test**: Search for a mentor by expertise filter, select a paid one-to-one service, hold a slot, complete checkout, and confirm a unique booking reference is generated and the slot is no longer offered to a second concurrent user.

- [ ] T052 [US3] Mentor timezone configuration + member-local-timezone slot display + preserved-historical-booking-time handling across DST/travel in `backend/src/modules/mentor-availability/timezone.service.ts` (FR-056)
- [ ] T053 [US3] Recurring availability rule builder with overlap validation in `backend/src/modules/mentor-availability/recurring-availability.service.ts` (FR-057)
- [ ] T054 [US3] Date-specific availability exceptions with a conflict-resolution workflow (never silent auto-cancel) when a block hits existing confirmed bookings in `backend/src/modules/mentor-availability/availability-exception.service.ts` (FR-058, edge case)
- [ ] T055 [US3] Calendar integration (Google Calendar, Microsoft Outlook, internal) with privacy-minimized busy/free sync in `backend/src/modules/mentor-availability/calendar-integration.service.ts` (FR-059)
- [ ] T056 [US3] Atomic booking-transaction orchestrator (slot lock → recheck → external busy recheck → capacity check → payment → confirm → calendar event → release-or-commit), wired to T023's slot-lock service and validated by T028's contract test in `backend/src/modules/mentor-booking/booking-transaction.orchestrator.ts` (FR-060, acceptance scenario 1)
- [ ] T057 [US3] Configurable minimum booking-notice period + a separately configured emergency/last-minute booking bypass in `backend/src/modules/mentor-availability/booking-notice.service.ts` (FR-061)
- [ ] T058 [US3] Maximum future-booking-window enforcement in `backend/src/modules/mentor-availability/booking-window.service.ts` (FR-062)
- [ ] T059 [US3] Buffer time / daily-maximum / consecutive-maximum / break-period enforcement in `backend/src/modules/mentor-availability/session-limits.service.ts` (FR-063)
- [ ] T060 [US3] Member booking-flow UI (profile → service → date → slot → timezone-confirm → intake → upload → coupon → price-summary → policy-ack → payment → confirmation → calendar-event → reminders → session-workspace) in `web/src/app/(member)/mentors/book/[serviceId]/page.tsx` (FR-064)
- [ ] T061 [US3] Free/membership-included booking path (eligibility, quota, hold, confirm, quota consumption, cancellation-restoration rule) in `backend/src/modules/mentor-booking/free-booking.service.ts` (FR-065)
- [ ] T062 [US3] Booking status state machine (Draft…Expired) in `backend/src/modules/mentor-booking/booking-status.service.ts` (FR-066)
- [ ] T063 [US3] Slot-hold auto-release on configurable expiry, wired to the job scheduler resolved in T002 in `backend/src/modules/mentor-booking/slot-hold-expiry.service.ts` (FR-067, acceptance scenario 2)
- [ ] T064 [US3] Pre-session intake form with mentor-configurable service-specific questions in `backend/src/modules/mentor-booking/intake-form.service.ts` (FR-068)
- [ ] T065 [US3] Member document upload with malware scanning, access restriction, expiry, and mentor access granted only after a confirmed booking in `backend/src/modules/mentor-booking/booking-attachment.service.ts` (FR-069)
- [ ] T066 [US3] Booking confirmation screen with the full required detail set in `web/src/app/(member)/mentors/book/confirmation/page.tsx` (FR-070, acceptance scenario 4)
- [ ] T067 [US3] Booking-reference generator (`TBT-MNT-YYYY-NNNNNN` format, internal database ID never exposed) in `backend/src/modules/mentor-booking/booking-reference.service.ts` (FR-071, acceptance scenario 4)
- [ ] T068 [US3] Session reminder scheduler (confirmation, 24h, 1h, 10min, start, missed-session follow-up) in `backend/src/modules/mentor-booking/reminder-scheduler.service.ts` (FR-072)
- [ ] T069 [US3] Pre-session checklist for member and mentor in `web/src/components/mentor/pre-session-checklist.tsx` (FR-073)
- [ ] T070 [US3] Checkout price-breakdown display (base price, discount, coupon, taxes, platform fee, credits, reward points, total, currency — no hidden charges) in `web/src/components/mentor/price-breakdown.tsx` (FR-108, acceptance scenario 3)
- [ ] T071 [P] [US3] Mentor profile page entry point + service selection UI in `web/src/app/(member)/mentors/[mentorSlug]/page.tsx` (FR-064 support)
- [ ] T072 [US3] Integration test: end-to-end booking flow including concurrent slot-hold contention, hold-expiry release, full price-summary display, and confirmation-reference generation — all 4 acceptance scenarios in `backend/tests/integration/us3-booking-slot-hold.integration.test.ts`

**Checkpoint**: The core transaction of the entire marketplace is independently functional.

---

## Phase 5b: Discovery, Search & Recommendation (supports FR-045–FR-054; cross-cutting, no single owning story)

- [ ] T073 [P] Mentor discovery page composition (recommended-for-you, available-today, top-rated, Tamil mentors, beginner-friendly, business-stage, popular categories, new verified mentors, free discovery calls, upcoming group sessions, saved mentors) in `web/src/app/(member)/mentors/page.tsx` (FR-045)
- [ ] T074 Mentor search across name, headline, biography, expertise, skill, industry, service, language, location, credential, organization in `backend/src/modules/mentor-discovery/mentor-search.service.ts` (FR-046)
- [ ] T075 Search-result status filtering — suspended/unpublished mentors excluded from every result set in `backend/src/modules/mentor-discovery/mentor-search.service.ts` (FR-047, SC-008)
- [ ] T076 [P] Filter set (expertise, industry, language, price range, rating, availability, session type, duration, target audience, experience, verified status, free-discovery-call availability, location, mode, membership eligibility) in `web/src/components/mentor/discovery-filters.tsx` (FR-048)
- [ ] T077 Sort options with an explainable "Recommended" ranking logic in `backend/src/modules/mentor-discovery/mentor-sort.service.ts` (FR-049)
- [ ] T078 Recommendation engine (goal, challenge, business stage, skills, course enrollment, previous sessions, language, price range, mentor outcome history, capacity, negative-signal weighting) in `backend/src/modules/mentor-discovery/recommendation-engine.service.ts` (FR-050)
- [ ] T079 Human-readable recommendation explanations (matched goal, matched language, budget fit, availability fit) in `web/src/components/mentor/recommendation-explanation.tsx` (FR-051)
- [ ] T080 [P] Mentor card component (photo, name, headline, primary expertise, verified badge, languages, rating, review count, completed-session count, starting price, next available slot, save, view-profile, book CTA) in `web/src/components/mentor/mentor-card.tsx` (FR-052)
- [ ] T081 Save/unsave, shortlists, compare-saved, availability-update notification preferences in `backend/src/modules/mentor-discovery/saved-mentors.service.ts` (FR-053)
- [ ] T082 Mentor comparison (configurable max count) that never declares a universal "best mentor" in the UI in `web/src/app/(member)/mentors/compare/page.tsx` (FR-054, Constitution Article III)

**Checkpoint**: Discovery, search, and fair-recommendation surfaces are independently functional.

---

## Phase 6: User Story 4 — Session Workspace with Role-Separated Notes and Action Plan (P2)

**Independent Test**: Take a confirmed test booking, open the session workspace as both mentor and member roles, verify private mentor notes are hidden from the member view, and confirm an action plan with owner/due-date/status fields is visible to both.

- [ ] T083 [US4] Session workspace composition (booking summary, member objective, intake responses, uploaded files, notes, action items, shared resources, video-call entry, timer, technical support access, report/safety action, completion control) in `backend/src/modules/mentor-session/session-workspace.service.ts` (FR-074)
- [ ] T084 [US4] Pre-session waiting room (check-in state, device test, start time, connection status, support link, privacy reminder, recording status, join button, configurable early-joining) in `web/src/app/(member)/sessions/[sessionId]/waiting-room/page.tsx` (FR-075)
- [ ] T085 [US4] Platform video session (secure meeting room, token-based access, role authorization, camera/mic/device selection, screen sharing, chat, network-quality indicator, reconnect, participant controls, technical event logging, unauthorized-access prevention) in `backend/src/modules/mentor-session/video-session.service.ts` (FR-076)
- [ ] T086 [US4] External video integration with unique booking-specific links, link protection, link update on reschedule, deletion on cancellation, provider-failure fallback, optional personal-link discouragement/block in `backend/src/modules/mentor-session/external-video.service.ts` (FR-077)
- [ ] T087 [US4] Recording consent gate — off by default, requires explicit dual mentor+member consent, visible recording indicator, disclosed storage duration, access control, download/delete-request handling; secret recording prohibited in `backend/src/modules/mentor-session/recording-consent.service.ts` (FR-078, edge case: secret recording)
- [ ] T088 [US4] In-session chat with a defined retention period and participant access rules in `backend/src/modules/mentor-session/session-chat.service.ts` (FR-079)
- [ ] T089 [US4] Session timer (scheduled start, elapsed time, remaining time, extension eligibility, overtime warning, no forced auto-disconnect absent explicit policy) in `web/src/components/mentor/session-timer.tsx` (FR-080)
- [ ] T090 [US4] Technical-failure handling (reconnect, switch to audio, backup link, reschedule, support ticket, partial/full refund eligibility) with technical-log retention for dispute review in `backend/src/modules/mentor-session/technical-failure.service.ts` (FR-081, edge case)
- [ ] T091 [US4] Session completion sequence orchestrator (mark complete → verify attendance → save notes → finalize action plan → attach follow-up resources → update settlement eligibility → request feedback → create review eligibility → schedule follow-up reminder → record analytics) in `backend/src/modules/mentor-session/session-completion.orchestrator.ts` (FR-082)
- [ ] T092 [US4] Session Note data-level visibility enforcement (private-mentor, shared-member, admin-safety), wired to and validated by T030's contract test in `backend/src/modules/mentor-session/session-note.service.ts` (FR-083, acceptance scenarios 1–2)
- [ ] T093 [US4] Action plan with member-updatable status (Not started, In progress, Completed, Blocked) in `backend/src/modules/mentor-session/action-plan.service.ts` (FR-084, acceptance scenario 3)
- [ ] T094 [US4] Session deliverables + promised-vs-delivered tracking against the service listing in `backend/src/modules/mentor-session/deliverable.service.ts` (FR-085, acceptance scenario 4)
- [ ] T095 [US4] Mentor-configurable follow-up window (no follow-up, 24h, 3-day, 7-day, until-next-package-session) with fair-use limits clearly displayed in `backend/src/modules/mentor-session/follow-up-window.service.ts` (FR-086)
- [ ] T096 [P] [US4] Session workspace UI (web + mobile) in `web/src/app/(member)/sessions/[sessionId]/page.tsx` (FR-074)
- [ ] T097 [US4] Integration test: private-note hiding from member, admin-safety-note dual visibility, action-plan status update, deliverable-fulfillment tracking — all 4 acceptance scenarios in `backend/tests/integration/us4-session-workspace.integration.test.ts`

**Checkpoint**: The mentoring-value delivery layer, not just calendar-slot selling, is independently functional.

---

## Phase 7: User Story 5 — Member Disputes a Mentor No-Show and Receives a Refund (P2)

**Independent Test**: Simulate a booking where only the member attendance signal fires (mentor never joins), open a dispute with "Mentor did not attend" as the reason, and confirm the system produces a full refund to the member and a payout hold against the mentor.

- [ ] T098 [US5] Reschedule-request flow (minimum notice, maximum count, eligible slot range, price-difference handling, package-expiry interaction, approval requirement, reason capture, notification) updating calendar/reminders/meeting link in `backend/src/modules/mentor-lifecycle/reschedule.service.ts` (FR-094)
- [ ] T099 [US5] Member-cancellation outcome determination (full refund, partial refund, credit, no refund, reschedule-only) by notice-vs-policy, displayed before booking confirmation in `backend/src/modules/mentor-lifecycle/member-cancellation.service.ts` (FR-095)
- [ ] T100 [US5] Mentor-cancellation consequence handling (member refund/credit, priority rescheduling, alternative-mentor suggestion, reliability impact, repeated-cancellation review, emergency exception, optional compensation) — never classified as member fault in `backend/src/modules/mentor-lifecycle/mentor-cancellation.service.ts` (FR-096, edge case)
- [ ] T101 [US5] Per-service cancellation-policy model (platform-default or approved custom) in `backend/src/modules/mentor-profile/service-policy.service.ts` (FR-097)
- [ ] T102 [US5] Member no-show classification (available session, mentor attended, member missed grace period, evidence exists, no valid technical incident) with outcome, reliability tracking, and appeal option in `backend/src/modules/mentor-lifecycle/member-no-show.service.ts` (FR-098)
- [ ] T103 [US5] Mentor no-show outcome (member full refund + optional credit, mentor payout block, reliability-score impact, incident review, repeated-issue suspension consideration, alternative-mentor recommendation) in `backend/src/modules/mentor-lifecycle/mentor-no-show.service.ts` (FR-099, acceptance scenario 2)
- [ ] T104 [US5] Multi-signal attendance determination wired to T025's corroboration service, resolving conflicting signals via cross-check rather than a single-signal verdict in `backend/src/modules/mentor-session/attendance-corroboration.service.ts` (FR-100, edge case: conflicting signals)
- [ ] T105 [US5] Dispute submission (reason taxonomy, description, requested resolution, evidence, communication history, submission date) + status state machine (Submitted…Appealed) in `backend/src/modules/mentor-dispute/dispute-submission.service.ts` (FR-101, FR-102, acceptance scenario 1)
- [ ] T106 [US5] Dispute-reviewer minimum-necessary-access console with the full reviewer action set (no action, full/partial refund, credit, payout release/hold, warning, quality review, safety escalation) in `web/src/app/(admin)/mentorship/disputes/[disputeId]/page.tsx` (FR-103, acceptance scenario 3)
- [ ] T107 [US5] Refund-type processing (full, partial, platform credit, package-session restoration, coupon restoration, reward-point restoration) referencing the original payment with tax/fee recalculation — never a disconnected new charge in `backend/src/modules/mentor-dispute/refund.service.ts` (FR-104, acceptance scenario 4)
- [ ] T108 [US5] Admin dispute-queue prioritization (safety, mentor no-show, member no-show, service-not-delivered, payment, technical, quality complaint) with SLA/escalation rules in `backend/src/modules/mentor-dispute/dispute-queue.service.ts` (FR-105)
- [ ] T109 [US5] Review-dispute arbitration restriction — no pure rating-disagreement override absent a policy violation or objective evidence in `backend/src/modules/mentor-dispute/review-dispute.service.ts` (FR-106)
- [ ] T110 [P] [US5] Member dispute-submission + status UI in `web/src/app/(member)/sessions/[sessionId]/dispute/page.tsx` (FR-101)
- [ ] T111 [US5] Integration test: mentor no-show classification → full refund + payout hold, reviewer minimum-necessary access and full action set, refund-transaction integrity — all 4 acceptance scenarios in `backend/tests/integration/us5-dispute-refund.integration.test.ts`

**Checkpoint**: The trust-in-payment loop that makes members willing to pay upfront is independently functional.

---

## Phase 8: User Story 6 — Mentor Views Earnings and Receives Payout with Snapshotted Commission (P2)

**Independent Test**: Confirm a booking at a known commission rate, later change the platform's default commission rate, complete the session and its dispute window, and verify the mentor's earning for that specific booking still uses the original snapshotted rate — then run it through a full payout cycle to "Paid" status.

- [ ] T112 [US6] Payment-settlement lifecycle orchestrator (customer payment received → platform holds funds → session completed → dispute window starts → deductions calculated → earning available → payout schedule processes) in `backend/src/modules/mentor-payout/settlement-lifecycle.service.ts` (FR-111)
- [ ] T113 [US6] Commission model support (percentage, fixed fee, tiered, membership-based, category-specific, promotional, mentor-plan-subscription-plus-lower-commission) in `backend/src/modules/mentor-payout/commission-model.service.ts` (FR-112)
- [ ] T114 [US6] Commission-snapshot-at-confirmation enforcement, wired to and validated by T024's snapshot service and T029's contract test in `backend/src/modules/mentor-payout/commission-snapshot.service.ts` (FR-113, acceptance scenario 1)
- [ ] T115 [P] [US6] Mentor earnings dashboard (gross bookings, mentor-funded discounts, platform commission, taxes withheld, refunds, adjustments, net earnings, pending earnings, available balance, paid amount) in `web/src/app/(mentor-dashboard)/earnings/page.tsx` (FR-114)
- [ ] T116 [US6] Earning status state machine (Pending session → Session completed → Dispute hold → Available → Scheduled for payout → Paid, plus Reversed/Failed/Adjusted) including the dispute-hold-to-available transition in `backend/src/modules/mentor-payout/earning-status.service.ts` (FR-115, acceptance scenario 2)
- [ ] T117 [US6] Payout onboarding capture (legal name, bank account, holder name, bank code, tax identifier, address, entity type, invoice preference, compliance declaration) with encrypted, access-restricted sensitive fields, gating payout with a `MENTOR_PAYOUT_ACCOUNT_REQUIRED` instruction until complete in `backend/src/modules/mentor-payout/payout-onboarding.service.ts` (FR-116, acceptance scenario 3)
- [ ] T118 [US6] Payout schedule configuration (weekly, biweekly, monthly, threshold-based, manual-approved) with minimum threshold, settlement delay, holiday handling, currency, processing fee, failed-payout retry in `backend/src/modules/mentor-payout/payout-schedule.service.ts` (FR-117)
- [ ] T119 [US6] Payout status state machine (Pending → Approved → Processing → Paid, plus Failed/Returned/On hold/Cancelled) with a payout reference and downloadable statement in `backend/src/modules/mentor-payout/payout-status.service.ts` (FR-118, acceptance scenario 4)
- [ ] T120 [US6] Payout-failure instruction surfacing per failure reason (invalid bank details, name mismatch, closed account, compliance hold, provider failure, unsupported account, missing tax details) in `backend/src/modules/mentor-payout/payout-failure.service.ts` (FR-119)
- [ ] T121 [US6] Earnings statement, commission invoice, tax-deduction statement, annual summary, and payout receipt generation, exact requirements per jurisdiction deferred to legal/finance in `backend/src/modules/mentor-payout/tax-document.service.ts` (FR-120)
- [ ] T122 [US6] Dual-approval gate for high-value payout batches, reusing `001`'s approval-chain pattern in `backend/src/modules/mentor-payout/payout-approval.service.ts` (FR-121, Constitution Article VII)
- [ ] T123 [US6] Integration test: commission snapshot survives a later platform rate change, dispute-hold-to-available transition, payout-account-required gate, full payout-status cycle to "Paid" — all 4 acceptance scenarios in `backend/tests/integration/us6-payout-commission.integration.test.ts`

**Checkpoint**: Sustainable, auditable, correctly-calculated mentor earning is independently functional.

---

## Phase 9: User Story 7 — New Mentor Gets Fair Discovery Exposure (P3)

**Independent Test**: Create a newly-approved mentor with zero reviews and confirm they appear in a "New verified mentors" or equivalent discovery section and are not excluded from general search/filter results purely for having no reviews.

- [ ] T124 [US7] New-mentor discovery section with verification-weight boost and introductory-session support in `backend/src/modules/mentor-discovery/new-mentor-exposure.service.ts` (FR-133, acceptance scenario 1)
- [ ] T125 [US7] Ranking-fairness enforcement — review count is one weighted input among many, never a sole permanent-suppression factor for newer mentors in `backend/src/modules/mentor-discovery/mentor-ranking.service.ts` (FR-135, acceptance scenario 2)
- [ ] T126 [US7] Increased quality-monitoring cadence applied to new mentors relative to established ones, wired to T020's `Quality Review` entity in `backend/src/modules/mentor-review/new-mentor-monitoring.service.ts` (FR-133, acceptance scenario 3)
- [ ] T127 [US7] Fake-initial-review / linked-duplicate-account detection flagging for a new mentor's earliest reviews in `backend/src/modules/mentor-review/fake-review-detection.service.ts` (FR-133, acceptance scenario 4)
- [ ] T128 [US7] Integration test: new-mentor discoverability, non-suppression ranking with identical inputs except review count, increased early monitoring, fake-review flagging — all 4 acceptance scenarios in `backend/tests/integration/us7-new-mentor-exposure.integration.test.ts`

**Checkpoint**: Marketplace health and long-term mentor-supply diversity are independently functional.

---

## Phase 10: User Story 8 — Off-Platform Payment Request Is Detected and Warned (P3)

**Independent Test**: Send a test message through mentor-member messaging containing an off-platform payment request pattern and confirm the system surfaces a warning to the recipient and logs the incident for trust-and-safety review, without needing the full booking flow to be complete.

- [ ] T129 [US8] Off-platform-payment-request pattern detection + warning surfacing within mentor-member messaging in `backend/src/modules/mentor-messaging/off-platform-payment-detection.service.ts` (FR-089, acceptance scenario 1)
- [ ] T130 [US8] Repeated-pattern trust-and-safety review flow feeding suspension consideration across multiple affected members in `backend/src/modules/mentor-messaging/off-platform-pattern-review.service.ts` (FR-089, FR-140 cross-ref, acceptance scenario 2)
- [ ] T131 [US8] Off-platform-payment-request reporting routed through the member safety-controls reporting flow in `backend/src/modules/mentor-safety/member-safety-controls.service.ts` (FR-142, acceptance scenario 3)
- [ ] T132 [US8] Mutual-consent post-booking contact-sharing exception, designed to avoid false-positive fraud warnings in `backend/src/modules/mentor-messaging/contact-sharing-consent.service.ts` (FR-088, acceptance scenario 4)
- [ ] T133 [US8] Integration test: detection-and-warning, repeated-pattern escalation to suspension consideration, report routing through safety controls, consent-exception no-false-positive — all 4 acceptance scenarios in `backend/tests/integration/us8-off-platform-payment-detection.integration.test.ts`

**Checkpoint**: The defense-in-depth fraud-prevention layer protecting platform revenue integrity and member safety is independently functional.

---

## Phase 10b: Messaging, Contact Protection & Professional Boundaries remainder (supports FR-087, FR-090–FR-093; cross-cutting, no single owning story)

- [ ] T134 Messaging-context gating (pre-booking question mentor-setting-gated, booking preparation, session follow-up, active package, support resolution) applying `005`'s messaging safety rules, with a mentor promotional-spam prohibition in `backend/src/modules/mentor-messaging/message-context.service.ts` (FR-087)
- [ ] T135 Professional-boundary violation prohibitions (relationship pressure, unrelated sensitive-info requests, financial-access-credential requests, password requests, secret off-platform payment requests, unlicensed regulated advice, discriminatory behavior) in `backend/src/modules/mentor-messaging/professional-boundaries.service.ts` (FR-090)
- [ ] T136 [P] Conflict-of-interest disclosure display (own-product recommendation, affiliate relationship, financial interest, employer conflict, competitor access, paid partnership) on the relevant session/service page in `web/src/components/mentor/conflict-of-interest-disclosure.tsx` (FR-091)
- [ ] T137 Session confidentiality policy definition (exceptions for safety/legal, recording policy, notes policy, data access, retention, group-session limitations) with no implied mentor-client legal privilege absent a genuine professional relationship in `backend/src/modules/mentor-messaging/confidentiality-policy.service.ts` (FR-092)
- [ ] T138 Emergency/high-risk crisis workflow (safety guidance, session escalation option, local emergency-resource workflow, internal trust-and-safety escalation, minimal necessary logging) triggered on crisis-indicating session content, with a clear not-an-emergency-service disclaimer in `backend/src/modules/mentor-safety/emergency-workflow.service.ts` (FR-093, edge case: crisis content)

**Checkpoint**: Professional-boundary and confidentiality controls are independently functional.

---

## Phase 10c: Payment & Pricing remainder (supports FR-107, FR-109–FR-110; cross-cutting, no single owning story)

- [ ] T139 Payment-case support matrix (one-time, package, subscription, group, workshop, add-on, credit-based, coupon-discounted, membership-included booking), execution deferred to `009`'s payment/tax engine in `backend/src/modules/mentor-payment/payment-cases.service.ts` (FR-107)
- [ ] T140 Coupon-type support (platform, mentor-campaign, first-booking, membership, category, referral) with mentor-created coupons subject to admin margin-protection constraints in `backend/src/modules/mentor-payment/coupon.service.ts` (FR-109)
- [ ] T141 Session Credit issuance/usage (refund alternative, membership benefit, promotional campaign, mentor-cancellation compensation, package allocation) in `backend/src/modules/mentor-payment/session-credit.service.ts` (FR-110)

**Checkpoint**: Marketplace-specific checkout touchpoints beyond the core booking price breakdown are independently functional.

---

## Phase 11: Review & Quality Score (supports FR-122–FR-139 except FR-133/FR-135 already covered in Phase 9; cross-cutting, no single owning story)

- [ ] T142 Review eligibility restriction (confirmed completed sessions, eligible dispute state, review window, one review per booking) with duplicate-account abuse detection in `backend/src/modules/mentor-review/review-eligibility.service.ts` (FR-122)
- [ ] T143 Review component capture (overall rating, communication, knowledge, practical usefulness, preparation, professionalism, written review, private platform feedback, outcome tags) in `backend/src/modules/mentor-review/review-submission.service.ts` (FR-123)
- [ ] T144 [P] Five-point rating scale with accessible text labels (Poor, Below expectations, Satisfactory, Very good, Excellent), never emoji/star-only in `web/src/components/mentor/rating-scale.tsx` (FR-124)
- [ ] T145 Review lifecycle state machine (Draft → Submitted → Automated moderation → Published, plus Hidden/Under review/Removed/Edited/Responded) — truthful negative reviews never removed solely for criticism in `backend/src/modules/mentor-review/review-lifecycle.service.ts` (FR-125)
- [ ] T146 Review edit window with an edited label, retained previous version for internal audit, and a defined mentor-response retention-vs-reset rule after a material edit in `backend/src/modules/mentor-review/review-edit.service.ts` (FR-126)
- [ ] T147 Single professional mentor response per review — respectful, privacy-safe, retaliation-free, rating-pressure-free — with admin moderation in `backend/src/modules/mentor-review/review-response.service.ts` (FR-127)
- [ ] T148 Review removal/hiding restricted to specific grounds (spam, abuse, threats, personal data, irrelevant content, fake transaction, extortion, conflict of interest, policy violation) — never for a poor rating alone in `backend/src/modules/mentor-review/review-moderation.service.ts` (FR-128)
- [ ] T149 Mentor review-reporting reasons (not a real session, contains private information, abusive, extortion, conflict of interest, factually impossible claim, other) in `backend/src/modules/mentor-review/review-report.service.ts` (FR-129)
- [ ] T150 Mentor rating calculation algorithm (verified-reviews-only filtering, optional time weighting, minimum review threshold, optional Bayesian adjustment, fraudulent-review exclusion) in `backend/src/modules/mentor-review/rating-calculation.service.ts` (FR-130)
- [ ] T151 Internal mentor Quality Score computation (session rating, review sentiment, completion rate, cancellations, no-shows, response time, disputes, refund rate, repeat bookings, deliverable completion, safety incidents, policy compliance, member outcome feedback), not required to be shown publicly in `backend/src/modules/mentor-review/quality-score.service.ts` (FR-131)
- [ ] T152 Quality-level state tracking (New, Good standing, High quality, Featured eligible, Improvement required, Under review, Restricted, Suspended) in `backend/src/modules/mentor-review/quality-level.service.ts` (FR-132)
- [ ] T153 Featured-mentor eligibility criteria (verified profile, strong quality score, low cancellation, good reviews, availability, policy compliance, category demand) with mandatory "Sponsored"/"Promoted" labeling, never presented as an organic quality badge in `backend/src/modules/mentor-review/featured-eligibility.service.ts` (FR-134, Constitution Article III)
- [ ] T154 [P] Mentor performance dashboard (profile/service views, booking conversion, session counts, cancellation/no-show rate, average rating, repeat booking, response time, earnings, top services, member outcomes, suggested improvements) in `web/src/app/(mentor-dashboard)/performance/page.tsx` (FR-136)
- [ ] T155 Performance alert generation (repeated late response, high cancellation rate, missing deliverables, outdated profile, expiring credential, rating decline, dispute increase, calendar conflicts, low availability) with a corrective action included in `backend/src/modules/mentor-review/performance-alerts.service.ts` (FR-137)
- [ ] T156 Quality improvement plan workflow (identify issue → notify mentor → assign training/resource → define target → set review period → monitor → clear/restrict/suspend), with immediate action possible for severe safety violations in `backend/src/modules/mentor-review/quality-improvement-plan.service.ts` (FR-138)
- [ ] T157 Private post-session member outcome feedback capture (goal achieved, problem clearer, action plan useful, confidence improved, next step identified, would book again, safety concern), internal-only and separate from the public review in `backend/src/modules/mentor-session/outcome-feedback.service.ts` (FR-139)
- [ ] T158 [P] Review submission and mentor-response UI in `web/src/app/(member)/sessions/[sessionId]/review/page.tsx` (FR-123, FR-127)
- [ ] T159 Integration test: full review lifecycle, rating-calculation consistency, quality-score-driven quality-level transition, featured-labeling compliance in `backend/tests/integration/review-quality-score.integration.test.ts`

**Checkpoint**: Trust, reputation, and quality-governance surfaces are independently functional.

---

## Phase 12: Mentor Suspension, Deactivation, Safety & Content Interop (supports FR-140–FR-145; cross-cutting, no single owning story)

- [ ] T160 Mentor suspension workflow (identity fraud, fake credentials, harassment, scam, off-platform payment pressure, repeated no-shows, severe quality failure, privacy breach, illegal advice, review manipulation, policy violations) with profile unpublish, new-booking disablement, existing-booking review, legally-permitted payout hold, member notification, appeal option, audit trail in `backend/src/modules/mentor-safety/mentor-suspension.service.ts` (FR-140)
- [ ] T161 Voluntary mentor deactivation workflow (stop future slots, resolve active bookings, complete deliverables, handle subscriptions/packages, pay out remaining balance, archive profile, data-retention notice) in `backend/src/modules/mentor-safety/mentor-deactivation.service.ts` (FR-141)
- [ ] T162 [P] Member safety controls (report mentor, block mentor, cancel booking, open dispute, contact support, control messages, hide documents, revoke shared-file access, report off-platform payment requests) in `web/src/components/mentor/member-safety-controls.tsx` (FR-142)
- [ ] T163 [P] Mentor safety controls (report member, block future bookings, restrict messages, report harassment, report inappropriate material, end an unsafe session, contact emergency support, request platform review) in `web/src/components/mentor/mentor-safety-controls.tsx` (FR-143)
- [ ] T164 Instructor-role summary capability listing (course association, cohort management, live-class hosting, assignment review, office hours, announcements, discussions, analytics, learner progress, permission-gated certificates), full mechanics deferred to `004` in `backend/src/modules/mentor-content/instructor-capabilities.service.ts` (FR-144)
- [ ] T165 Mentor community-content creation (public posts, educational resources, workshops, group sessions, articles, short videos, community answers, approved lead magnets), moderation deferred to `005`'s self-promotion limits in `backend/src/modules/mentor-content/mentor-content.service.ts` (FR-145)

**Checkpoint**: Mentor-side safety, exit, and content-interop pathways are independently functional.

---

## Phase 13: Admin Mentorship Operations Console (supports FR-146–FR-155; cross-cutting, no single owning story)

- [ ] T166 [P] Admin mentorship module navigation (overview, applications, verification, mentors, experts, instructors, services, availability, bookings, sessions, reviews, disputes, refunds, earnings, payouts, quality, safety, categories, settings, reports) in `web/src/app/(admin)/mentorship/layout.tsx` (FR-146)
- [ ] T167 [P] Admin overview dashboard (active mentors, pending applications, published services, session volumes, booking conversion, gross booking value, platform revenue, mentor earnings, refund/cancellation/no-show rate, average rating, open disputes, payout backlog, supply/demand by category) in `web/src/app/(admin)/mentorship/overview/page.tsx` (FR-147)
- [ ] T168 Mentor application review screen (applicant profile, identity status, professional details, evidence, references, interview notes, risk flags, proposed services, availability, pricing, policy acknowledgements, review history) with the full action set in `web/src/app/(admin)/mentorship/applications/[applicationId]/page.tsx` (FR-148, completes T043's shell)
- [ ] T169 Admin mentor list (columns + filters per Section 132) in `web/src/app/(admin)/mentorship/mentors/page.tsx` (FR-149)
- [ ] T170 Admin service management (view, approve category-restricted services, edit policy labels, pause, remove misleading claims, check pricing, review cancellation policy, view bookings, audit changes) retaining version history on commercial-detail edits in `backend/src/modules/mentor-admin/service-management.service.ts` (FR-150)
- [ ] T171 Admin booking management (columns + actions per Section 134) in `web/src/app/(admin)/mentorship/bookings/page.tsx` (FR-151)
- [ ] T172 Admin live-session content-access restriction — routine operational monitoring limited to status/join events/technical health/duration/support requests/safety escalation, with content access authorized only for policy-based incident review in `backend/src/modules/mentor-admin/session-monitoring.service.ts` (FR-152)
- [ ] T173 Admin review management (search, filter, moderate, restore, remove, handle mentor dispute, detect manipulation, view reviewer history) in `web/src/app/(admin)/mentorship/reviews/page.tsx` (FR-153)
- [ ] T174 Admin payout management for finance operators (view available balances, approve batch, hold, release, retry failure, add adjustment, download report, reconcile provider statement, generate mentor statement) in `web/src/app/(admin)/mentorship/payouts/page.tsx` (FR-154)
- [ ] T175 Admin category management (create category/subcategory, translations, regulated status, required credentials, service restrictions, search synonyms, display order, activate/archive) in `web/src/app/(admin)/mentorship/categories/page.tsx` (FR-155)

**Checkpoint**: The full admin mentorship operations console is independently functional.

---

## Phase 14: Polish & Cross-Cutting Concerns

- [ ] T176 [P] Mentor notification wiring (new booking, payment confirmed, cancelled, reschedule request, upcoming session, intake completed, new message, deliverable due, review received, dispute opened, payout available/completed, credential expiring, quality alert, policy update) in `backend/src/modules/mentor-admin/mentor-notifications.service.ts` (FR-156)
- [ ] T177 [P] Member notification wiring (booking confirmation, payment confirmation, mentor message, session reminder, reschedule, mentor cancellation, deliverable ready, follow-up due, review request, refund, credit issued, dispute update, mentor availability update) in `backend/src/modules/mentor-admin/member-notifications.service.ts` (FR-157)
- [ ] T178 [P] Transactional email template set (application received through suspension notice), marketing-email consent kept separate from transactional notifications in `backend/src/modules/mentor-admin/email-templates.service.ts` (FR-158)
- [ ] T179 [P] Notification deep links (mentor profile, service detail, booking detail, waiting room, message thread, action plan, review form, dispute, earnings, payout) with a safe fallback page when the target is unavailable (FR-159)
- [ ] T180 [P] Analytics event taxonomy emission (`mentor_directory_viewed` through `mentor_application_approved`, 20 named events) in `backend/src/modules/mentor-admin/mentor-analytics.service.ts` (FR-160)
- [ ] T181 [P] Marketplace conversion/operational metrics tracking (search-to-profile through mentor earnings) in `backend/src/modules/mentor-admin/marketplace-metrics.service.ts` (FR-161)
- [ ] T182 [P] Mentor supply metrics tracking (approved/active mentors, availability, utilization, category/language/location coverage, churn, time-to-first-booking, earnings distribution) in `backend/src/modules/mentor-admin/supply-metrics.service.ts` (FR-162)
- [ ] T183 Security hardening pass: server-side role verification on every mentorship action, atomic slot-locking audit, payment-webhook/calendar-callback signature verification, short-lived scoped meeting-room tokens, rate limiting, anti-CSRF, XSS prevention, audit-log completeness, review-manipulation and off-platform-scam monitoring (FR-163–FR-170)
- [ ] T184 Privacy hardening pass: identity/payout/personal-contact data hidden by default, session-note visibility re-audit against T030, recording-consent re-audit against T087, document booking-scoping re-audit, calendar-data minimization, group-participant-visibility disclosure re-audit, mentor member-data-export restriction, jurisdiction data-retention policy on deleted accounts (FR-171–FR-178)
- [ ] T185 [P] Localization pass: Tamil/Tanglish/English across mentor bios, expertise taxonomy, service descriptions, booking flow, dates/timezone/currency, cancellation policies, notifications, reviews, support content, disputes — original mentor-authored content always accessible in its original language (FR-179)
- [ ] T186 [P] Accessibility pass: keyboard-operable mentor search, screen-reader-friendly mentor cards, accessible date/timezone picker, non-color-only booking-state indicators, price narration, video captions, accessible chat, visible recording indicator, form-error association, large touch targets, reduced motion, text-labeled ratings, accessible calendar navigation, high-contrast session controls (FR-180)
- [ ] T187 Loading-state correctness pass — no false zero-slot, zero-rating, or free-price placeholders during load (FR-181)
- [ ] T188 Backend-confirmation-gated success-state audit — booking/payment success is never rendered client-side without backend confirmation, wired to Constitution Article I (FR-182)
- [ ] T189 Mobile offline-support pass: cached booking details/mentor profile, intake-draft persistence, offline action-plan viewing, mentor session-note drafts, deliverable-upload retry, message retry in `mobile/lib/features/mentorship/offline_queue.dart` (FR-183)
- [ ] T190 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (no-show grace period, slot-hold expiry duration, dispute window length, regulated-category compliance frameworks per jurisdiction, commission fee schedule, minimum payout threshold/settlement delay — FR-184–FR-189)
- [ ] T191 Final audit: cross-check every FR-001–FR-189 against an implementation or validation task; confirm the Constitution Article III/IV co-citations and the Security & Compliance Baseline's regulated-credential requirement are concretely implemented, not merely noted
- [ ] T192 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `001`'s RBAC/audit-log, `003`'s Auth/Profile, and `005`'s messaging infrastructure.
- **P1 stories**: US1 (onboarding) is the true foundation of mentor supply and should ship first; US2 (regulated credentials) extends US1's application pipeline directly and should follow it; US3 (discovery + booking with slot-hold) depends on Foundational's slot-lock/commission-snapshot services (T023, T024) and on at least one approved, published mentor from US1/US2 to book against.
- **Phase 5b (Discovery & Search)** depends on Foundational and benefits from US1/US2 producing real mentor data, but its own tasks (search, filters, ranking, cards) can be built in parallel with US3's booking-transaction internals.
- **P2 stories (US4–US6)**: US4 (session workspace) depends on US3 producing a confirmed booking; US5 (dispute/no-show/refund) depends on US3 and US4 (a real booking and session to dispute); US6 (earnings/payout) depends on US3–US5's completed, disputable bookings existing, since a booking's earning only becomes available after its dispute window closes.
- **Phase 10b/10c (Messaging remainder, Payment/Pricing remainder)** depend on Foundational plus US3's core booking flow; both can run in parallel with US4–US6.
- **P3 stories (US7, US8)**: US7 (new-mentor fair exposure) depends on Phase 5b's ranking engine; US8 (off-platform payment detection) depends on Phase 10b's messaging-context layer — both can run in parallel with each other and with the P2 stories.
- **Phase 11 (Review & Quality Score)** depends on US4 (completed sessions) and US6 (earnings, for the quality-score's refund/dispute inputs) — it also feeds US7's ranking-fairness tasks, so should land no later than US7.
- **Phase 12 (Suspension/Safety/Content Interop)** depends on Foundational and benefits from US5/US8's incident data existing, but its own workflows can be built once Foundational is stable.
- **Phase 13 (Admin Console)** depends on every module it surfaces (applications from US1/US2, bookings from US3, sessions from US4, disputes from US5, payouts from US6, reviews from Phase 11, safety from Phase 12) — build last among the functional phases.
- **Polish (Phase 14)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational → US1 (onboarding pipeline) → US2 (regulated credentials, extends US1) → **STOP and VALIDATE** a real, trustworthy mentor supply pipeline exists → US3 (discovery + slot-hold booking) + Phase 5b (discovery/search) in parallel → **STOP and VALIDATE** the core transaction is double-booking-safe and price-transparent end-to-end → US4 (session workspace) → US5 (dispute/no-show/refund) → US6 (earnings/payout with commission snapshot) → Phase 10b/10c (messaging and payment remainders) in parallel with US4–US6 → **STOP and VALIDATE** the full booking-to-payout lifecycle is auditable → Phase 11 (review & quality score) → US7 (new-mentor fairness) → US8 (off-platform payment detection) → Phase 12 (suspension/safety/content interop) → Phase 13 (admin console) → Polish.
