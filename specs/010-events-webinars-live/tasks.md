---
description: "Task list for Feature 010 — Events, Webinars & Live Platform"
---

# Tasks: Events, Webinars & Live Platform

**Input**: Design documents from `/specs/010-events-webinars-live/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Feature 001's Foundational phase complete** (layered RBAC and audit-log interceptor this feature reuses for admin/check-in permission checks and lifecycle/check-in audit trails). This feature integrates with, but does not require full completion of, `005` (community moderation primitives), `006` (gamification signal consumption), `007` (mentor availability data), and `009` (payment/ticket-price gate) — those integration points are called out explicitly where used.

**Tests**: Included throughout — real-time capacity-concurrency, offline-QR-check-in-with-no-duplicate-on-sync, and zero-manual-certificate-issuance get dedicated Foundational contract tests, matching this spec's SC-001-adjacent capacity guarantee, SC-003, and SC-004.

**Organization**: Tasks are grouped by user story (US1–US8 from spec.md), plus four supplementary cross-cutting phases whose FR groups are not owned by any single prioritized story (Speaker/Session/Venue Management FR-031–FR-036; Event Community/Resources/Volunteers FR-040–FR-041, FR-054; Analytics/Reporting/Admin Panel FR-046–FR-051, FR-058).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`'s Foundational phase is deployed (RBAC, audit-log interceptor this feature reuses)
- [ ] T002 Resolve `research.md` open items before proceeding: live-streaming provider integration priority, real-time chat/poll/Q&A transport choice, job-scheduler choice, mandatory-vs-optional registration consent fields, waitlist claim-window default length, per-checkpoint-to-overall-attendance rollup rule, mid-playback recording-access-expiry behavior, meeting-scheduler reschedule/cancellation/reminder rules
- [ ] T003 [P] Add `backend/src/modules/{events-catalog,events-registration,events-capacity,events-checkin,events-live,events-venue,events-networking,events-community,events-certificate,events-sponsor,events-admin}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 [P] Define the `Event` entity with the full data model (ID, code, slug, name, subtitle, description, summary, banner, thumbnail, trailer, organizer, category, tags, language, type, mode, venue, timezone, capacity, registration limit, dates, price, currency, ticket types, visibility, status, SEO metadata, created/updated by) in `backend/src/modules/events-catalog/event.entity.ts` (FR-005)
- [ ] T005 Implement the event lifecycle state machine (Draft → Pending Approval → Scheduled → Published → Registration Open → Registration Closed → Live → Completed → Certificate Issued → Archived) with every transition logged (actor, timestamp, from-state, to-state) in `backend/src/modules/events-catalog/event-lifecycle.service.ts` (FR-003, FR-004)
- [ ] T006 [P] Define `Session` and `Track` entities in `backend/src/modules/events-catalog/{session,track}.entity.ts` (FR-033, FR-034)
- [ ] T007 [P] Define the `Ticket Type` entity in `backend/src/modules/events-registration/ticket-type.entity.ts` (FR-014, FR-015)
- [ ] T008 [P] Define the `Registration` entity in `backend/src/modules/events-registration/registration.entity.ts` (spec.md Key Entities)
- [ ] T009 Define the `QR Ticket` entity and its generation service (Encrypted Token, Ticket ID, Attendee ID, Security Hash) in `backend/src/modules/events-checkin/qr-ticket.service.ts` (FR-019)
- [ ] T010 [P] Define the `Waitlist Entry` entity in `backend/src/modules/events-capacity/waitlist-entry.entity.ts` (FR-016–FR-018)
- [ ] T011 [P] Define the `Check-in Record` entity (per-checkpoint) in `backend/src/modules/events-checkin/check-in-record.entity.ts` (FR-023)
- [ ] T012 [P] Define the `Speaker` entity in `backend/src/modules/events-catalog/speaker.entity.ts` (FR-031)
- [ ] T013 [P] Define the `Venue` entity in `backend/src/modules/events-venue/venue.entity.ts` (FR-035)
- [ ] T014 [P] Define `Sponsor` and `Exhibitor Booth` entities in `backend/src/modules/events-sponsor/{sponsor,exhibitor-booth}.entity.ts` (FR-052, FR-053)
- [ ] T015 [P] Define the `Volunteer` entity in `backend/src/modules/events-sponsor/volunteer.entity.ts` (FR-054)
- [ ] T016 [P] Define `Digital Business Card` and `Meeting` entities in `backend/src/modules/events-networking/` (FR-038, FR-039)
- [ ] T017 [P] Define `Live Chat Message`, `Live Poll`, `Live Question` entities in `backend/src/modules/events-live/` (FR-028, FR-029, FR-030)
- [ ] T018 [P] Define the `Certificate` entity in `backend/src/modules/events-certificate/certificate.entity.ts` (FR-043)
- [ ] T019 [P] Define `Feedback Response`, `Resource`, `Event Community Post` entities in `backend/src/modules/events-certificate/feedback-response.entity.ts` and `backend/src/modules/events-community/` (FR-044, FR-041, FR-040)
- [ ] T020 [P] Define the `Report` entity in `backend/src/modules/events-admin/report.entity.ts` (FR-051)
- [ ] T021 Implement the attendance-status state machine (Registered, Checked In, Present, Absent, Late, Cancelled, No Show, Completed, Certificate Eligible) in `backend/src/modules/events-checkin/attendance-status.service.ts` (FR-022)
- [ ] T022 Implement the registration validation engine (duplicate registration, invalid email/phone format, expired/registration-closed event, sold-out capacity, unmet age restriction, unmet membership-tier restriction, payment-amount mismatch) in `backend/src/modules/events-registration/registration-validation.service.ts` (FR-013)
- [ ] T023 Implement offline QR validation (encrypted token + security hash checked locally with no network dependency, check-in record queued for sync once connectivity restores) in `backend/src/modules/events-checkin/offline-validation.service.ts` (FR-020)
- [ ] T024 Implement duplicate-scan prevention per checkpoint (same QR at the same checkpoint rejected as a second check-in) in `backend/src/modules/events-checkin/duplicate-scan-guard.service.ts` (FR-024, FR-055)
- [ ] T025 Note: role/permission enforcement for admin/check-in/event-management functions reuses `001`'s layered RBAC directly, and administrative/check-in audit logs reuse `001`'s audit-log interceptor — no separate engine is created here (FR-056)
- [ ] T026 Implement event-API security (JWT-based authentication, role-based permissions, rate limiting, QR encryption, attendance validation, webhook security) in `backend/src/modules/events-catalog/api-security.service.ts` (FR-057)
- [ ] T027 Contract test: registrations never exceed the configured Maximum attendees under simultaneous concurrent payment completion, with real-time capacity updates blocking or redirecting the losing request to the waitlist, in `backend/tests/contract/events-capacity-concurrency.contract.test.ts` (FR-016, edge case)
- [ ] T028 Contract test: a QR ticket validates and records check-in correctly while the scanning device is fully offline, and produces no duplicate check-in once connectivity is restored and the queued record syncs, in `backend/tests/contract/events-offline-checkin-no-duplicate.contract.test.ts` (FR-020, FR-024, SC-003)
- [ ] T029 Contract test: a certificate is issued automatically the instant its configured conditions are met, with zero manual per-attendee action required by the organizer, in `backend/tests/contract/events-zero-manual-certificate.contract.test.ts` (FR-042, SC-004)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Organizer Creates and Publishes an Event (P1) 🎯 MVP

**Independent Test**: Have an organizer create an event, fill in the required data-model fields, submit it through Draft → Pending Approval → Scheduled → Published, and verify the event appears on the public Event Home / Event Details page with correct data.

- [ ] T030 [US1] Event-mode support (Online, Offline, Hybrid) in `backend/src/modules/events-catalog/event-mode.service.ts` (FR-001)
- [ ] T031 [US1] Predefined event-type catalog (25 named types) plus unlimited admin-defined custom types in `backend/src/modules/events-catalog/event-type.service.ts` (FR-002)
- [ ] T032 [US1] Event creation form and Draft save, wired to T004's entity and T005's lifecycle, in `web/src/app/(organizer)/events/create/page.tsx` (FR-005, acceptance scenario 1)
- [ ] T033 [US1] Event visibility levels (Public, Members Only, Premium Only, Invite Only, Organization Only, Hidden, Password Protected) in `backend/src/modules/events-catalog/event-visibility.service.ts` (FR-006)
- [ ] T034 [US1] Approval → Scheduled → Published transition workflow in `backend/src/modules/events-catalog/event-lifecycle.service.ts` (FR-003, acceptance scenario 2)
- [ ] T035 [US1] Scheduled auto-transition to Registration Closed when the Registration Close date passes, wired to the job scheduler resolved in T002, in `backend/src/modules/events-catalog/event-lifecycle.service.ts` (FR-003, acceptance scenario 4)
- [ ] T036 [US1] Event discovery filters (Search, Category, Trending, Upcoming, Featured, Free, Paid, Near Me, Online, Offline, City, State, Language, Mentor, Speaker, Topic, Industry) in `backend/src/modules/events-catalog/event-discovery.service.ts` (FR-007)
- [ ] T037 [US1] Event Home page (Hero Banner, Upcoming, Featured, Live Now, Ending Soon, Business Workshops, Free, Premium, Nearby, Recommended, Past Recordings, Popular Speakers, Trending Topics) in `web/src/app/(public)/events/page.tsx` (FR-008)
- [ ] T038 [US1] Event Details page (Banner, Title, Description, Agenda, Date/Time/Duration, Venue/Map/Live Link, Price, Organizer, Speakers, Sponsors, Available Seats, Registration CTA, Share, Bookmark, Add-to-Calendar, FAQ, Terms, Refund Policy) in `web/src/app/(public)/events/[eventSlug]/page.tsx` (FR-009, acceptance scenario 3)
- [ ] T039 [P] [US1] Organizer event-creation UI polish (mode/type/visibility selectors, agenda builder)
- [ ] T040 [US1] Integration test: draft-creation with audit log, approval-to-published visibility per configured setting, full details-page field set, auto-registration-close transition — all 4 acceptance scenarios in `backend/tests/integration/us1-event-lifecycle.integration.test.ts`

**Checkpoint**: The foundational, non-negotiable first slice every other capability attaches to is independently functional.

---

## Phase 4: User Story 2 — Attendee Registers and Purchases a Ticket (P1)

**Independent Test**: Register for a paid event with a single ticket type and verify a confirmed registration record, a generated QR ticket, a confirmation email, and a calendar invite are produced.

- [ ] T041 [US2] Full registration-flow orchestration (open event → select ticket → fill details → payment → confirmation → QR generated → email sent → calendar invite → reminder scheduling), with payment success gated per `009`, in `backend/src/modules/events-registration/registration-flow.service.ts` (FR-010, acceptance scenario 1)
- [ ] T042 [US2] Dynamic registration form (Name, Email, Phone, Company, Designation, Experience, Industry, City, State, LinkedIn, Website, Startup Name, free-text Questions, Consent, admin-defined Custom Fields) in `web/src/app/(public)/events/[eventSlug]/register/page.tsx` (FR-011)
- [ ] T043 [US2] Admin field visibility/required configuration per event in `backend/src/modules/events-registration/registration-form-config.service.ts` (FR-012)
- [ ] T044 [US2] Registration validation gate wired to T022, including the consent-blocks-submission case, in `backend/src/modules/events-registration/registration-flow.service.ts` (FR-013, acceptance scenarios 2 and 4, edge cases)
- [ ] T045 [US2] Ticket-type configuration (Free, Standard, Premium, VIP, Student, Sponsor, Media, Speaker, Organizer, Volunteer, Early Bird, Last Minute, Group, Corporate) with per-event admin selection in `backend/src/modules/events-registration/ticket-type-config.service.ts` (FR-014)
- [ ] T046 [US2] Per-ticket-type benefit configuration (Price, Benefits, Seat Type, Meal, Networking Access, Workshop Access, Certificate eligibility, Recording Access, Community Access, VIP Lounge, Goodie Bag, Parking) in `backend/src/modules/events-registration/ticket-type-config.service.ts` (FR-015)
- [ ] T047 [US2] Sold-out-ticket-type rejection with waitlist offer, wired to Phase 6's waitlist join, in `backend/src/modules/events-registration/registration-flow.service.ts` (FR-013, acceptance scenario 3)
- [ ] T048 [P] [US2] Registration + checkout mobile UI in `mobile/lib/features/events/registration/`
- [ ] T049 [US2] Integration test: confirmed registration with QR/email/calendar-invite, duplicate-registration rejection, sold-out-to-waitlist offer, consent-blocks-incomplete-submission — all 4 acceptance scenarios in `backend/tests/integration/us2-registration-ticketing.integration.test.ts`

**Checkpoint**: The primary monetization and attendance-intake mechanism is independently functional.

---

## Phase 5: User Story 3 — Attendee Checks In via QR at a Specific Checkpoint (P1)

**Independent Test**: Generate a QR ticket for a confirmed registration, scan it at a named checkpoint with the scanning device offline, and verify the attendance status changes to `Checked In` for that checkpoint and the scan is rejected on a second attempt.

- [ ] T050 [US3] QR ticket generation per registration, wired to T009 (FR-019)
- [ ] T051 [US3] Multi-checkpoint check-in (Entrance, Workshop Hall, Lunch, Networking Zone, VIP Area, Session Entry, Exit) with independent per-checkpoint attendance recording in `backend/src/modules/events-checkin/checkpoint.service.ts` (FR-023, acceptance scenario 1)
- [ ] T052 [US3] Real-time capacity/attendance-count update on check-in, wired to T027's contract test, in `backend/src/modules/events-checkin/checkpoint.service.ts` (FR-016 tie, acceptance scenario 1)
- [ ] T053 [US3] Duplicate-scan rejection at the same checkpoint, wired to T024, in `backend/src/modules/events-checkin/duplicate-scan-guard.service.ts` (FR-024, acceptance scenario 2)
- [ ] T054 [US3] Offline check-in validation and sync-on-reconnect queue, wired to T023 and validated by T028's contract test, in `backend/src/modules/events-checkin/offline-validation.service.ts` (FR-020, acceptance scenario 3)
- [ ] T055 [US3] Alternate check-in methods (Manual Search, Phone Number lookup, Email lookup, Admin Override) in `backend/src/modules/events-checkin/alternate-checkin.service.ts` (FR-021, acceptance scenario 4)
- [ ] T056 [US3] Attendance-status tracking wired to T021's state machine (FR-022)
- [ ] T057 [P] [US3] Staff check-in scanner mobile UI (offline-capable) in `mobile/lib/features/events/checkin_scanner/`
- [ ] T058 [US3] Integration test: checkpoint check-in updates status and count, duplicate-scan rejection, offline-validate-and-sync with no duplicate, alternate-method check-in — all 4 acceptance scenarios in `backend/tests/integration/us3-qr-checkin.integration.test.ts`

**Checkpoint**: The gating condition for certificates and the platform's core attendance guarantee is independently functional.

---

## Phase 6: User Story 4 — Attendee Watches a Live-Streamed Session with Chat, Polls, and Q&A (P1)

**Independent Test**: Join a live session as a registered virtual attendee, send a chat message, vote in an open poll, and submit a question.

- [ ] T059 [US4] Live-stream ingestion (RTMP, YouTube Live, Vimeo, Custom CDN, OBS, Zoom, Teams, Meet) with a modular integration architecture in `backend/src/modules/events-live/stream-ingestion.service.ts` (FR-025)
- [ ] T060 [US4] Live player (adaptive streaming, quality selector, fullscreen, picture-in-picture, live chat, live Q&A, reactions, bookmarks, resume-playback, captions) in `web/src/app/(member)/events/[eventId]/live/page.tsx` (FR-026, acceptance scenario 1)
- [ ] T061 [US4] On-demand recording playback after session end, gated by recording-access rights, with resume-from-last-position, wired to Phase 9's access-duration gate, in `backend/src/modules/events-live/recording-playback.service.ts` (FR-027, acceptance scenario 4)
- [ ] T062 [US4] Live chat (text, emoji, GIF, mentions, pinned messages) plus moderation controls (slow mode, delete, mute, block) in `backend/src/modules/events-live/live-chat.service.ts` (FR-028)
- [ ] T063 [US4] Live polls (single-choice, multiple-choice, anonymous) with real-time result charts and anonymous-vote identity protection in `backend/src/modules/events-live/live-poll.service.ts` (FR-029, acceptance scenario 2)
- [ ] T064 [US4] Live Q&A (submit, upvote, moderator filter, speaker approve/answer, "Answered" badge, pin) in `backend/src/modules/events-live/live-qa.service.ts` (FR-030, acceptance scenario 3)
- [ ] T065 [P] [US4] Live-session viewer mobile UI in `mobile/lib/features/events/live_viewer/`
- [ ] T066 [US4] Integration test: live-player feature set, anonymous-poll-vote privacy with real-time results, Q&A moderation/approval/pin flow, resume-from-position on recording — all 4 acceptance scenarios in `backend/tests/integration/us4-live-streaming.integration.test.ts`

**Checkpoint**: The primary value-delivery mechanism for Online and Hybrid events is independently functional.

---

## Phase 7: User Story 5 — Waitlisted User Claims a Newly Available Seat (P2)

**Independent Test**: Fill an event to capacity, join the waitlist as a new user, free one seat via a cancellation, and verify the waitlisted user is notified and has a bounded window to claim it.

- [ ] T067 [US5] Capacity configuration (Maximum/Minimum attendees, Waiting-list size, Reserved/Speaker/Sponsor/VIP/Volunteer seats) with real-time remaining-capacity updates in `backend/src/modules/events-capacity/capacity-config.service.ts` (FR-016)
- [ ] T068 [US5] Waitlist join flow when an event or ticket type is at full capacity in `backend/src/modules/events-capacity/waitlist-join.service.ts` (FR-017, acceptance scenario 1)
- [ ] T069 [US5] Seat-availability detection and next-eligible-waitlisted-user notification in `backend/src/modules/events-capacity/waitlist-notify.service.ts` (FR-017, acceptance scenario 2)
- [ ] T070 [US5] Bounded claim window with automatic release-and-reoffer to the next waitlisted user on expiry, wired to the job scheduler resolved in T002, in `backend/src/modules/events-capacity/waitlist-claim.service.ts` (FR-018, acceptance scenario 3, edge case)
- [ ] T071 [P] [US5] Waitlist status UI in `web/src/components/events/waitlist-status.tsx`
- [ ] T072 [US5] Integration test: full-capacity waitlist offer, seat-freed notification, claim-window-expiry release-and-reoffer — all 3 acceptance scenarios in `backend/tests/integration/us5-waitlist.integration.test.ts`

**Checkpoint**: Realized revenue/attendance recovery on popular events is independently functional.

---

## Phase 8: User Story 6 — Attendee Networks via Digital Business Card and Meeting Scheduler (P2)

**Independent Test**: Have two registered attendees view each other's profile, exchange digital business cards, and have one book a meeting slot with the other that requires approval.

- [ ] T073 [US6] Participant directory (view other participants registered for the same event) in `backend/src/modules/events-networking/participant-directory.service.ts` (FR-037)
- [ ] T074 [US6] Connect/follow/message between attendees, layered on `005`'s social/messaging primitives where applicable, in `backend/src/modules/events-networking/attendee-connect.service.ts` (FR-037, acceptance scenario 1)
- [ ] T075 [US6] Digital Business Card (photo, company, role, LinkedIn, website, email, optional phone, QR) exchange in `backend/src/modules/events-networking/digital-business-card.service.ts` (FR-038, acceptance scenario 1)
- [ ] T076 [US6] Meeting scheduler with approval-gated booking for Mentor/Investor/Founder/Speaker/Sponsor/Admin, wired to `007`'s mentor availability data for the mentor path, in `backend/src/modules/events-networking/meeting-scheduler.service.ts` (FR-039, acceptance scenario 2)
- [ ] T077 [US6] Confirmed-meeting schedule visibility for both parties in `backend/src/modules/events-networking/meeting-scheduler.service.ts` (FR-039, acceptance scenario 3)
- [ ] T078 [P] [US6] Networking and meeting-scheduler UI in `web/src/app/(member)/events/[eventId]/networking/page.tsx`
- [ ] T079 [US6] Integration test: connect/message/card-exchange, approval-gated meeting request, confirmed-meeting visibility — all 3 acceptance scenarios in `backend/tests/integration/us6-networking.integration.test.ts`

**Checkpoint**: The explicit "network... meet mentors" core user outcome is independently functional.

---

## Phase 9: User Story 7 — Attendee Earns a Certificate Gated on Attendance and Quiz (P2)

**Independent Test**: Mark a registration's attendance status as `Certificate Eligible` (having met the configured conditions) and verify a certificate with a unique ID, verification URL, QR code, and digital signature is generated without manual admin action.

- [ ] T080 [US7] Certificate auto-generation engine evaluating configured conditions (Attendance, Completion, Quiz score, Minimum session duration, Feedback submission, Admin approval), validated against T029's contract test, in `backend/src/modules/events-certificate/certificate-generation.service.ts` (FR-042, acceptance scenario 1)
- [ ] T081 [US7] Certificate content (Certificate ID, Participant name, Event name, Date, Verification URL, QR Code, Digital Signature) in `backend/src/modules/events-certificate/certificate-generation.service.ts` (FR-043, acceptance scenario 1)
- [ ] T082 [US7] Minimum-duration-not-met exclusion from Certificate Eligible status in `backend/src/modules/events-checkin/attendance-status.service.ts` (FR-042, acceptance scenario 2)
- [ ] T083 [US7] Admin-approval-required certificate hold state in `backend/src/modules/events-certificate/certificate-generation.service.ts` (FR-042, acceptance scenario 3)
- [ ] T084 [US7] Post-event feedback collection (Overall Rating, Speaker Rating, Venue, Content, Networking, Food, Suggestions, Recommend Score) in `backend/src/modules/events-certificate/feedback.service.ts` (FR-044)
- [ ] T085 [US7] Recording-access gating (Ticket type, Membership tier, direct Purchase, admin-configured Recording Access Duration) in `backend/src/modules/events-certificate/recording-access.service.ts` (FR-045)
- [ ] T086 [P] [US7] Certificate display/verification UI and feedback-survey UI in `web/src/app/(member)/events/[eventId]/certificate/page.tsx`
- [ ] T087 [US7] Integration test: condition-met auto-certificate issuance, duration-not-met exclusion, admin-approval-pending hold — all 3 acceptance scenarios in `backend/tests/integration/us7-certificate.integration.test.ts`

**Checkpoint**: The distinct `Certificate Issued` lifecycle stage is independently functional.

---

## Phase 10: User Story 8 — Sponsor Receives Tier-Based Benefits and Collects Leads (P3)

**Independent Test**: Assign a sponsor a tier on a published event, verify the tier's configured benefits are applied, and confirm the sponsor's exhibitor booth can collect a lead from an attendee interaction.

- [ ] T088 [US8] Sponsor tier configuration (Platinum, Gold, Silver, Bronze, Community, Startup, Media) with benefit assignment (Booth, Logo placement, Website listing, Announcements, Stage Time, Lead Collection, Banner placement, Email Promotion, Push Notification) in `backend/src/modules/events-sponsor/sponsor-tier.service.ts` (FR-052, acceptance scenario 1)
- [ ] T089 [US8] Sponsor benefit rendering on the event page (logo, website link, stage time/announcement) per tier in `web/src/app/(public)/events/[eventSlug]/page.tsx` (FR-052, acceptance scenario 1)
- [ ] T090 [US8] Exhibitor booth (Virtual/Offline, Products, Videos, Lead Collection, Downloads, Appointments, Chat) in `backend/src/modules/events-sponsor/exhibitor-booth.service.ts` (FR-053, acceptance scenario 2)
- [ ] T091 [US8] Lead capture from attendee-booth interaction into the sponsor's lead list in `backend/src/modules/events-sponsor/lead-capture.service.ts` (FR-053, acceptance scenario 2)
- [ ] T092 [US8] Sponsors panel on the Organizer Dashboard, wired to Phase 11's dashboard, in `backend/src/modules/events-admin/organizer-dashboard.service.ts` (FR-050 tie, acceptance scenario 3)
- [ ] T093 [P] [US8] Sponsor/exhibitor admin and booth UI in `web/src/app/(organizer)/events/[eventId]/sponsors/page.tsx`
- [ ] T094 [US8] Integration test: tier-benefit rendering, booth lead capture, dashboard sponsor-activity summary — all 3 acceptance scenarios in `backend/tests/integration/us8-sponsors.integration.test.ts`

**Checkpoint**: The revenue and partnership layer for larger conferences/summits is independently functional.

---

## Phase 10b: Speaker, Session & Venue Management (supports FR-031–FR-036; cross-cutting, no single owning story)

- [ ] T095 Speaker profile (Photo, Bio, Company, Designation, Social Links, Sessions, Achievements, Website, LinkedIn) in `backend/src/modules/events-catalog/speaker-profile.service.ts` (FR-031)
- [ ] T096 Speaker management workflow (Invite, Approve, Assign Sessions, Upload Slides, Announcements, Travel Details, Accommodation, Honorarium tracking) in `backend/src/modules/events-catalog/speaker-management.service.ts` (FR-032)
- [ ] T097 Unlimited per-event sessions (Session Name, Description, Speaker, Start/End time, Room, Capacity, Track, Resources, Recording) in `backend/src/modules/events-catalog/session-management.service.ts` (FR-033)
- [ ] T098 [P] Track organization (AI, Business, Marketing, Sales, Leadership, Startup, Finance, Technology, Personal Growth) in `backend/src/modules/events-catalog/track.service.ts` (FR-034)
- [ ] T099 Venue records (Name, Address, Coordinates, Parking, Floor Map, Emergency Contacts, WiFi, Capacity, Accessibility) in `backend/src/modules/events-venue/venue-management.service.ts` (FR-035)
- [ ] T100 [P] Interactive floor map (Session Rooms, Food Court, Help Desk, Networking Zone, Washrooms, Emergency Exit, Parking) in `web/src/components/events/floor-map.tsx` (FR-036)

**Checkpoint**: The agenda-organization and offline-venue substrate is independently functional.

---

## Phase 10c: Event Community, Resources & Volunteers (supports FR-040–FR-041, FR-054; cross-cutting, no single owning story)

- [ ] T101 Per-event community feed (Posts, Photos, Videos, Questions, Discussions, Announcements, Resources) reusing `005`'s moderation primitives (mute, block, delete, report) in `backend/src/modules/events-community/event-feed.service.ts` (FR-040)
- [ ] T102 [P] Resource Center (Slides, PDFs, Templates, Worksheets, Videos, Source Code, Tools, Links) in `backend/src/modules/events-community/resource-center.service.ts` (FR-041)
- [ ] T103 [P] Volunteer management (Assignment, Attendance tracking, Task assignment, Communication, Shift scheduling, Emergency Contacts, Performance tracking) in `backend/src/modules/events-sponsor/volunteer-management.service.ts` (FR-054)

**Checkpoint**: The community/resource/staffing substrate is independently functional.

---

## Phase 11: Analytics, Reporting & Admin Panel (supports FR-046–FR-051, FR-058; cross-cutting, no single owning story)

- [ ] T104 Reminder notification scheduling (Registration Success, One Week Before, One Day Before, One Hour Before, Live Started, Session Started, Recording Available, Certificate Ready) in `backend/src/modules/events-admin/reminder-scheduler.service.ts` (FR-046)
- [ ] T105 [P] Notification delivery channels (Push, Email, In-App; SMS/WhatsApp marked future) in `backend/src/modules/events-admin/notification-delivery.service.ts` (FR-047)
- [ ] T106 Event-level analytics tracking (Views, Registrations, Conversions, Revenue, Attendance, No Shows, Live Watch Time, Questions, Polls, Connections, Certificates, Feedback) in `backend/src/modules/events-admin/event-analytics.service.ts` (FR-048)
- [ ] T107 Speaker-level analytics tracking (Sessions, Attendance, Ratings, Average Watch Time, Questions, Poll Engagement, Follower Growth) in `backend/src/modules/events-admin/speaker-analytics.service.ts` (FR-049)
- [ ] T108 Organizer Dashboard (Revenue, Registrations, Attendance, Sales, Sponsors, Volunteers, Feedback, Live Status, Tasks) in `web/src/app/(organizer)/events/[eventId]/dashboard/page.tsx` (FR-050)
- [ ] T109 Report generation (Registration, Revenue, Attendance, Feedback, Certificate, Sponsor, Volunteer, Networking, Live Analytics) in `backend/src/modules/events-admin/report-generation.service.ts` (FR-051)
- [ ] T110 Admin Panel (Events, Sessions, Speakers, Sponsors, Tickets, Registrations, Attendance, Volunteers, Certificates, Feedback, Analytics, Reports, Settings modules) in `web/src/app/(admin)/events-admin/layout.tsx` (FR-058)
- [ ] T111 [P] Organizer Dashboard and Admin Panel UI polish

**Checkpoint**: Organizers can view every dimension of an event from a single dashboard without consulting separate systems.

---

## Phase 12: Polish & Cross-Cutting Concerns

- [ ] T112 [P] Mobile experience pass (Browse Events, Register, QR Ticket display, Check-in, Live Watch, Chat, Polls, Networking, Feedback, Certificate access, Recording access) in `mobile/lib/features/events/` (FR-059)
- [ ] T113 Performance/scale hardening pass (100,000+ registrations per event, 10,000+ concurrent live viewers, instant QR validation, low-latency chat, fast analytics) against SC-001/SC-002, wired to T027's contract test (FR-060)
- [ ] T114 Security hardening pass: re-audit T009's QR encryption, T023/T054's offline-validation integrity, and T026's API security (JWT, RBAC, rate limiting, webhook security) against FR-055–FR-057
- [ ] T115 Resolve and document any NEEDS CLARIFICATION items not already closed by T002's `research.md` pass (mandatory-vs-optional consent fields, waitlist claim-window length/configurability, per-checkpoint-to-overall-attendance rollup for multi-day events, mid-playback recording-access-expiry behavior, meeting-scheduler reschedule/cancellation/reminder rules)
- [ ] T116 Final audit: cross-check every FR-001–FR-060 against an implementation or validation task; verify the `009`/`006`/`005`/`007` integration boundaries (payment gate, gamification signal emission, community moderation reuse, mentor data reuse) are respected, not duplicated
- [ ] T117 Run `quickstart.md` validation end-to-end across all 8 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends only on `001`'s RBAC/audit-log and produces the event lifecycle, QR/check-in, and registration-validation infrastructure every subsequent phase depends on.
- **P1 stories (US1–US4)**: US1 (event creation/publishing) is the non-negotiable first slice and must ship first; US2 (registration/ticketing) depends on US1's published event existing; US3 (QR check-in) depends on US2 producing a confirmed registration and QR ticket; US4 (live streaming) depends only on Foundational plus US1's published event and can build in parallel with US2/US3.
- **P2 stories (US5–US7)**: US5 (waitlist) depends on US2's registration/capacity infrastructure; US6 (networking) depends on US2/US3 (registered, checked-in attendees to network with) and on `007`'s mentor data for the mentor-booking path; US7 (certificates) depends on US3's attendance data and can build in parallel with US5/US6.
- **P3 story (US8)** depends only on US1's published event and can build in parallel with the P2 stories.
- **Phase 10b (Speaker/Session/Venue)** depends on Foundational's `Session`/`Track`/`Speaker`/`Venue` entities and supports US1's agenda display and US4's live sessions — build alongside US1/US4.
- **Phase 10c (Community/Resources/Volunteers)** depends on Foundational and `005`'s moderation stack; can build in parallel with the P2/P3 stories.
- **Phase 11 (Analytics/Admin Panel)** depends on every module it surfaces (registrations from US2, attendance from US3, live metrics from US4, sponsors from US8) — build after those phases are stable.
- **Polish (Phase 12)** depends on all desired stories and phases being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational (event lifecycle, QR/check-in, registration validation) → **STOP and VALIDATE** the three Foundational contract tests (capacity concurrency, offline-checkin-no-duplicate, zero-manual-certificate) pass → US1 (event creation/publishing) → **STOP and VALIDATE** a published event is fully discoverable and correct → US2 (registration/ticketing) → US3 (QR check-in) → **STOP and VALIDATE** the register-to-attend core path works reliably across Online/Offline/Hybrid → US4 (live streaming) + Phase 10b (speaker/session/venue) in parallel → US5 (waitlist) → US7 (certificates, depends on US3) → US6 (networking) → US8 (sponsors) → Phase 10c (community/resources/volunteers) → Phase 11 (analytics/admin panel) → Polish.
