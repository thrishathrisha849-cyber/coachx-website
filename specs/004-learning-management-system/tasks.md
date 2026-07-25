---
description: "Task list for Feature 004 — Learning Management System: Courses, Assessments & Certification"
---

# Tasks: Learning Management System: Courses, Assessments & Certification

**Input**: Design documents from `/specs/004-learning-management-system/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Features 001–003's Foundational phases complete** (User Account/RBAC/EntitlementGuard/Content Governance from 001, Consent from 002, Auth/Profile/Account-Status from 003).

**Tests**: Included throughout — this feature is the constitution's primary cited implementation of Article IX (Action Before Consumption) and directly implements Article I (server-authoritative completion/entitlement) and Article VIII (no vanity-metric completion); the no-vanity-completion and circular-prerequisite guarantees get dedicated contract tests in Foundational.

**Organization**: Tasks are grouped by user story (US1–US9 from spec.md), plus two supplementary cross-cutting phases (Discovery & Recommendations; Learning Analytics & At-Risk Detection) covering FR groups that don't map to a single story, following the same pattern established in 003's Profile Management phase.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 [P] Confirm `001`/`002`/`003`'s Foundational phases are deployed (User Account, RBAC, EntitlementGuard, Content Governance, Consent Record, Auth/Profile/Account-Status)
- [ ] T002 Resolve `research.md` open items before proceeding: video/CDN provider, live-class provider client library (Google Meet/Zoom), similarity-detection vendor, default video-completion watch percentage (FR-041), default certificate attendance threshold (FR-081), default course-version existing-learner policy (FR-099), offline-assignment-submission approval mechanism (FR-092)
- [ ] T003 [P] Add `backend/src/modules/{lms-catalog,lms-entitlement,lms-drip,lms-progress,lms-assessment,lms-assignment,lms-certificate,lms-live-session,lms-discovery,lms-course-builder,lms-analytics,lms-integrity,lms-ai}/` module skeletons

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Define content-hierarchy entities — Learning Path, Learning Path Course, Program, Cohort, Course, Course Version, Course Instructor, Module, Lesson, Lesson Content, Lesson Resource — in `backend/src/modules/lms-catalog/` (FR-001–FR-020, FR-096 field set)
- [ ] T005 Define `Enrollment`, `Waitlist` entities in `backend/src/modules/lms-entitlement/` (FR-021–FR-033 field sets)
- [ ] T006 Define `Lesson Progress`, `Course Progress`, `Path Progress`, `Video Progress` entities in `backend/src/modules/lms-progress/` (FR-052–FR-057 field references)
- [ ] T007 [P] Define `Learner Note`, `Bookmark` entities in `backend/src/modules/lms-progress/` (FR-058, FR-059)
- [ ] T008 Define `Quiz`, `Question`, `Question Option`, `Quiz Attempt`, `Quiz Answer` entities in `backend/src/modules/lms-assessment/` (FR-061–FR-064 field sets)
- [ ] T009 Define `Assignment`, `Submission`, `Submission File`, `Rubric`, `Rubric Criterion`, `Review` entities in `backend/src/modules/lms-assignment/` (FR-069, FR-070, FR-075 field sets)
- [ ] T010 [P] Define `Certificate Template`, `Certificate` entities in `backend/src/modules/lms-certificate/` (FR-082, FR-084 field sets)
- [ ] T011 [P] Define `Live Session`, `Attendance` entities in `backend/src/modules/lms-live-session/` (FR-050, FR-079 field sets)
- [ ] T012 [P] Define `Course Review`, `Announcement`, `Learning Event` entities in `backend/src/modules/lms-discovery/` (FR-087, FR-102, FR-109)
- [ ] T013 Implement the multi-condition Completion-Rule evaluator: a lesson combines multiple required conditions and MUST NEVER grant completion from a passive view/open event alone in `backend/src/modules/lms-progress/completion-rule.service.ts` (FR-052, FR-053, Constitution Articles VIII/IX)
- [ ] T014 Implement the Drip Release + Prerequisite evaluator, including circular-dependency detection at configuration-save time — not at learner-access time — in `backend/src/modules/lms-drip/drip-prerequisite.service.ts` (FR-034–FR-038, edge case)
- [ ] T015 Implement the Course review-workflow state machine (Draft → Submitted for review → Changes requested → Approved → Scheduled → Published) with Author/Reviewer/Compliance-reviewer/Publisher role separation — this is a **distinct state machine from `001`'s Content Item lifecycle**, per plan.md's Summary (different states, different role model) — in `backend/src/modules/lms-course-builder/course-workflow.service.ts` (FR-100)
- [ ] T016 Implement the LMS error-code taxonomy (course-, lesson-, quiz-, assignment-, certificate-family codes) in `backend/src/common/errors/lms-error-codes.ts` (FR-125)
- [ ] T017 Contract test: lesson completion is never grantable by a passive view/open event alone, across every lesson type, in `backend/tests/contract/lms-no-vanity-completion.contract.test.ts` (FR-053, SC-001)
- [ ] T018 Contract test: a circular prerequisite dependency is rejected at configuration-save time, never reaching a learner in `backend/tests/contract/lms-circular-prerequisite.contract.test.ts` (FR-037, SC-005)
- [ ] T019 Contract test: entitlement is verified server-side on every lesson content request, independent of any cached client "enrolled" state in `backend/tests/contract/lms-entitlement-per-request.contract.test.ts` (FR-022, SC-003)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Enroll and Gain Access via an Entitlement Type (P1) 🎯 MVP

**Independent Test**: Enroll a test learner under each entitlement source (free, membership, purchase, org-assigned, coupon); confirm lesson content is served only after server-side entitlement verification, with correct failure reasons for unsupported cases.

- [ ] T020 [US1] Course Enrollment Flow orchestrator (entitlement check → prerequisite check → capacity check → terms capture → enrollment record → progress init → welcome screen → notification) in `backend/src/modules/lms-entitlement/enrollment-flow.service.ts` (FR-025, acceptance scenario 1)
- [ ] T021 [US1] Entitlement-denial reason resolver (membership/payment required, course full, enrollment closed, prerequisite incomplete, region restricted, org license unavailable, account restricted) in `backend/src/modules/lms-entitlement/entitlement-denial.service.ts` (FR-026, acceptance scenario 2)
- [ ] T022 [US1] Access-expiry model + state transition (lifetime/fixed-days/until-membership-active/until-program-end/until-org-license-ends), server-side denial on lapse even against cached client content in `backend/src/modules/lms-entitlement/access-expiry.service.ts` (FR-023, FR-024, acceptance scenario 3)
- [ ] T023 [US1] Capacity control + Waitlist join with time-limited seat-offer expiry and next-priority pass-through in `backend/src/modules/lms-entitlement/capacity-waitlist.service.ts` (FR-028, FR-029, acceptance scenario 4, edge cases: concurrent last-seat claim, unclaimed offer)
- [ ] T024 [P] [US1] Wishlist (save eligible-but-locked course; notify-when-available, price-drop, enrollment-open alerts) in `backend/src/modules/lms-entitlement/wishlist.service.ts` (FR-027)
- [ ] T025 [US1] On-refund access-policy application (immediate revoke / revoke at period end / manual review / retain free) + certificate-policy application, preserving progress unless legal deletion applies in `backend/src/modules/lms-entitlement/refund-access-policy.service.ts` (FR-030, edge case: refund after certificate issued)
- [ ] T026 [P] [US1] Bulk CSV enrollment import with error report and safe duplicate-enrollment handling in `backend/src/modules/lms-entitlement/bulk-enrollment.service.ts` (FR-032, edge case)
- [ ] T027 [US1] Organization-admin course assignment (assign, cohort, invite, track completion, deadlines, reports, certificate view, remove access) with explicit denial of access to a learner's private notes/unrelated activity in `backend/src/modules/lms-entitlement/org-admin-assignment.service.ts` (FR-033)
- [ ] T028 [P] [US1] Web: course-page enroll CTA and waitlist-join UI in `web/src/app/(member)/learn/[courseId]/page.tsx` (FR-020)
- [ ] T029 [US1] Integration test: enrollment across all entitlement sources, denial-reason correctness, expiry transition, waitlist offer/expiry in `backend/tests/integration/us1-enrollment.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: Enrollment/entitlement gate independently functional — the P0 prerequisite for every other LMS capability.

---

## Phase 4: User Story 2 — Consume Lessons and Track Multi-Condition Completion (P1)

**Independent Test**: Configure a multi-condition lesson, consume it partially (remains incomplete), then satisfy all conditions and confirm completion syncs across a second device.

- [ ] T030 [US2] Video lesson player (play/pause/seek/volume/speed/captions/quality/fullscreen/PiP/resume) with per-video telemetry tracking in `web/src/components/lesson-player/video-player.tsx` + `backend/src/modules/lms-progress/video-progress.service.ts` (FR-039, FR-040, FR-042, FR-043)
- [ ] T031 [US2] Video completion-rule configuration (manual/min-watch-%/full-watch/attached-activity/instructor-approval) using T002's resolved default watch percentage in `backend/src/modules/lms-progress/completion-rule.service.ts` (FR-041)
- [ ] T032 [US2] Signed-URL video delivery with token expiry, domain restriction, and best-effort download prevention in `backend/src/modules/lms-catalog/signed-media.service.ts` (FR-045)
- [ ] T033 [P] [US2] Tamil/English captions, searchable transcript, timestamp navigation in `web/src/components/lesson-player/transcript.tsx` (FR-044)
- [ ] T034 [P] [US2] Audio lesson player (play/pause/seek/speed/background-playback/resume/sleep-timer) in `web/src/components/lesson-player/audio-player.tsx` (FR-046)
- [ ] T035 [P] [US2] Text lesson renderer (rich content blocks, TOC, reading time, mobile tables, translation variants, accessible markup) with scroll/checklist/embedded-activity completion options in `web/src/components/lesson-player/text-lesson.tsx` (FR-047)
- [ ] T036 [P] [US2] PDF/document in-app viewer (page nav/search/zoom/bookmark/resume-page) with signed delivery, optional watermarking, access logging in `web/src/components/lesson-player/pdf-viewer.tsx` + `backend/src/modules/lms-catalog/pdf-delivery.service.ts` (FR-048)
- [ ] T037 [P] [US2] Downloadable resource catalog (type/size/version/permission fields) with viewed/download-started/completed event tracking in `backend/src/modules/lms-catalog/lesson-resource.service.ts` (FR-049)
- [ ] T038 [US2] Live Class lesson state management (Upcoming/Starting soon/Live/Completed/Cancelled/Rescheduled/Replay available) with Google Meet/Zoom integration per `research.md`'s provider choice in `backend/src/modules/lms-live-session/live-session-state.service.ts` (FR-050)
- [ ] T039 [US2] Desktop + mobile lesson-player layout (curriculum sidebar / content-first mobile layout, notes, resources, discussion, prev/next, mark-complete) in `web/src/app/(member)/learn/[courseId]/[lessonId]/page.tsx` (FR-019)
- [ ] T040 [US2] Cross-device progress sync (idempotent updates, offline queue, conflict resolution, server-authoritative, timestamp+device-tagged audit) in `backend/src/modules/lms-progress/progress-sync.service.ts` (FR-056, acceptance scenario 3, edge case: offline-completion conflicting with an admin reset)
- [ ] T041 [US2] Module/course/path progress aggregation with the optional-lesson-does-not-block-completion rule in `backend/src/modules/lms-progress/progress-aggregation.service.ts` (FR-054, FR-055, acceptance scenario 4)
- [ ] T042 [P] [US2] Learning Streak (admin-defined qualifying actions, timezone-aware, no artificial-manipulation) in `backend/src/modules/lms-progress/learning-streak.service.ts` (FR-057)
- [ ] T043 [P] [US2] Learner private notes (rich/plain text, video-timestamp linking, edit/delete/search/export, cross-device sync, private-by-default) in `backend/src/modules/lms-progress/learner-note.service.ts` (FR-058)
- [ ] T044 [P] [US2] Bookmarks (lesson/video-timestamp/text-section/resource/discussion, folder/tag, cross-device sync) in `backend/src/modules/lms-progress/bookmark.service.ts` (FR-059)
- [ ] T045 [P] [US2] Per-lesson discussion (enable/disable, ask/comment/reply/mention/react/instructor-answer/accepted-answer/report/pin, enrollment-scoped permissions) built on `005`'s community infrastructure per plan.md in `backend/src/modules/lms-progress/lesson-discussion.service.ts` (FR-060)
- [ ] T046 [US2] Mobile offline learning: download eligible lessons + quality selection, audio/PDF download, offline notes, auto-syncing completion queue, storage manager, download expiry in `mobile/lib/features/learn/offline_download.dart` (FR-091)
- [ ] T047 [US2] Offline restriction enforcement: block final-quiz-submission/certificate-issuance/payment/live-session while offline; allow final assignment submission offline only under T002's resolved approved queued-submission policy in `mobile/lib/features/learn/offline_restrictions.dart` (FR-092, edge case)
- [ ] T048 [US2] Download-rights governance (content setting/membership/device limit/expiry/region/org policy) + encrypted local storage where feasible in `mobile/lib/features/learn/download_rights.dart` (FR-093)
- [ ] T049 [US2] Integration test: multi-condition completion (watch + download), offline completion sync with idempotency, optional-lesson-does-not-block-module-completion in `backend/tests/integration/us2-lesson-completion.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: Core day-to-day learning loop independently functional.

---

## Phase 5: User Story 3 — Attempt a Quiz or Assessment (P1)

**Independent Test**: Configure a graded quiz with a passing score and two allowed attempts; take it once to fail and once to pass; confirm result screen, retake eligibility, and downstream unlocks reflect correct state.

- [ ] T050 [US3] Quiz-attempt flow orchestrator (instructions → eligibility check → timer → autosave → submit-confirm → grade → result → pass/fail action → progress update → retake rules) in `backend/src/modules/lms-assessment/quiz-attempt-flow.service.ts` (FR-065)
- [ ] T051 [US3] Timer-expiry auto-submit — scores in-progress answers rather than losing the attempt — in `backend/src/modules/lms-assessment/quiz-timer.service.ts` (FR-063, acceptance scenario 1)
- [ ] T052 [US3] Attempt-limit enforcement with `QUIZ_ATTEMPT_LIMIT_REACHED` and retake-delay rules in `backend/src/modules/lms-assessment/quiz-attempt-flow.service.ts` (FR-063, acceptance scenario 2)
- [ ] T053 [P] [US3] Question Bank with tagging and randomized-set generation (question count, difficulty distribution, category distribution, exclusions) in `backend/src/modules/lms-assessment/question-bank.service.ts` (FR-064)
- [ ] T054 [US3] Historical-attempt integrity: a quiz attempt's recorded score/answers remain valid and interpretable even after its source question is later deleted from the bank in `backend/src/modules/lms-assessment/quiz-attempt-flow.service.ts` (FR-066, acceptance scenario 3, edge case)
- [ ] T055 [US3] Duplicate-submission prevention and single-authoritative-attempt reconciliation on network interruption in `backend/src/modules/lms-assessment/quiz-attempt-flow.service.ts` (FR-066, acceptance scenario 4)
- [ ] T056 [P] [US3] Quiz result screen (score, pass/fail, correct/incorrect counts, time taken, topic-level performance, admin-controlled answer-review visibility) in `web/src/app/(member)/learn/[courseId]/quiz/[quizId]/result/page.tsx` (FR-067)
- [ ] T057 [P] [US3] Broader Assessment types (self-assessment, skill rating, scenario task, practical project, viva/mentor review, portfolio review) producing score/level/recommendation/badge/eligibility outcomes in `backend/src/modules/lms-assessment/broad-assessment.service.ts` (FR-068)
- [ ] T058 [US3] Web: quiz-taking UI for every question type (single/multi-choice, true/false, fill-blank, match, ordering, short/long answer, numeric, file-upload) in `web/src/app/(member)/learn/[courseId]/quiz/[quizId]/page.tsx` (FR-062)
- [ ] T059 [US3] Integration test: timer auto-submit, attempt-limit block, historical-attempt integrity after question deletion, network-interruption dedup in `backend/tests/integration/us3-quiz-assessment.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: Assessment loop independently functional.

---

## Phase 6: User Story 4 — Submit an Assignment and Receive Rubric-Graded Feedback (P1)

**Independent Test**: Submit a file-upload assignment; instructor scores against rubric and requests changes; learner resubmits; instructor approves; learner is notified with rubric feedback visible.

- [ ] T060 [US4] Assignment submission-flow orchestrator (open → instructions/rubric → draft → required fields → upload → submit confirm → lock-or-edit → notify reviewer → status update → notify learner) in `backend/src/modules/lms-assignment/submission-flow.service.ts` (FR-071)
- [ ] T061 [US4] File-upload validation (allowed types, max size, multi-file, progress, retry, virus scan, MIME validation, secure/signed storage, preview, pre-submit delete) with user-friendly rejection in `backend/src/modules/lms-assignment/file-upload.service.ts` (FR-073, acceptance scenario 1)
- [ ] T062 [US4] Instructor assignment-review screen (learner details, submission, previous attempts, rubric, score, private reviewer note, learner-facing feedback, annotated file, approve/reject/request-changes actions) in `web/src/app/(admin)/lms/assignments/[submissionId]/review/page.tsx` (FR-074)
- [ ] T063 [US4] Rubric scoring engine (criteria, weight, performance levels, score range, per-criterion comments) in `backend/src/modules/lms-assignment/rubric.service.ts` (FR-075)
- [ ] T064 [US4] Assignment status lifecycle (Not started → Draft → Submitted → Late submitted → Under review → Changes requested → Resubmitted → Approved/Rejected/Graded → Overdue/Excused), preserving the prior submission alongside a resubmission in `backend/src/modules/lms-assignment/submission-status.service.ts` (FR-072, acceptance scenario 2)
- [ ] T065 [US4] Late-submission detection and configured late-policy application in `backend/src/modules/lms-assignment/late-policy.service.ts` (FR-070, acceptance scenario 3)
- [ ] T066 [US4] Approved-assignment completion-eligibility contribution (module/course/certificate) in `backend/src/modules/lms-assignment/submission-status.service.ts` (FR-072, acceptance scenario 4)
- [ ] T067 [P] [US4] Instructor feedback in text/rubric/audio/video/annotated-file/live-review-note formats, with learner mark-viewed/reply/resubmit/request-clarification in `backend/src/modules/lms-assignment/feedback.service.ts` (FR-078)
- [ ] T068 [P] [US4] Project-based learning: a final project composed of multiple required-artifact submissions, connected to module completion and certificate eligibility in `backend/src/modules/lms-assignment/project.service.ts` (FR-077)
- [ ] T069 [US4] Attendance recording (live-class join logs, QR check-in, instructor manual mark, org import) with manual override/verification for unreliable records in `backend/src/modules/lms-live-session/attendance.service.ts` (FR-051, FR-079, edge case: unreliable attendance log)
- [ ] T070 [US4] Integration test: unsupported-file rejection, changes-requested→resubmit→approve cycle with feedback visibility, late-submission flagging, approved-status completion contribution in `backend/tests/integration/us4-assignment.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: The primary "action, not consumption" mechanism is independently functional.

---

## Phase 7: User Story 5 — Earn and Publicly Verify a Certificate (P1)

**Independent Test**: Bring a test learner to 100% eligibility; confirm certificate generation with a unique verification code; visit the public verification URL as an anonymous, logged-out user and confirm correct status and minimal data.

- [ ] T071 [US5] Certificate eligibility evaluator — server-side, against the full configured condition set (mandatory lessons, passing assessment, assignment approved, attendance threshold, final project, payment settled, identity verified, no misconduct restriction) — using T002's resolved attendance-threshold default in `backend/src/modules/lms-certificate/eligibility.service.ts` (FR-081, acceptance scenario 1)
- [ ] T072 [US5] Certificate generation flow (evaluate → confirm name → select template → unique credential ID → PDF → verification record → notify → dashboard update → enable sharing) in `backend/src/modules/lms-certificate/generation.service.ts` (FR-083, acceptance scenario 2)
- [ ] T073 [P] [US5] Admin Certificate Template Manager (background/logo/signature/seal/text positions/font/color/language/course mapping/org mapping, mandatory sample-data preview) in `web/src/app/(admin)/lms/certificates/templates/page.tsx` (FR-084)
- [ ] T074 [US5] Public certificate verification page (credential-ID or QR entry, no login required; Valid/Expired/Revoked/Replaced/Not-found statuses; minimal exposed learner data) in `web/src/app/(public)/verify-certificate/[credentialId]/page.tsx` + `backend/src/modules/lms-certificate/verification.controller.ts` (FR-085, acceptance scenario 3, SC-004)
- [ ] T075 [US5] Certificate revocation workflow (authorized role, stated reason, approval, audit log, learner notification, immediate public-status update — including post-issuance plagiarism-flag holds) in `backend/src/modules/lms-certificate/revocation.service.ts` (FR-086, acceptance scenario 4, edge cases: post-issuance plagiarism flag, refund after certificate issued)
- [ ] T076 [US5] Contract test: a certificate is never issued without a full, server-evaluated eligibility snapshot in `backend/tests/contract/certificate-eligibility-snapshot.contract.test.ts` (SC-002)
- [ ] T077 [US5] Integration test: eligibility-blocked issuance, full-eligibility → generation, anonymous public verification, revocation → immediate status change in `backend/tests/integration/us5-certificate.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: The platform's core credibility deliverable is independently functional — all 5 P1 stories complete.

---

## Phase 7b: Discovery & Recommendations (supports FR-087–FR-090; cross-cutting, no single owning story)

- [ ] T078 [P] Course review eligibility and moderation (enrolled + minimum-progress-threshold gate, one active review per user, instructors cannot delete negative reviews — only admin moderation policy) in `backend/src/modules/lms-discovery/course-review.service.ts` (FR-087)
- [ ] T079 Learning Recommendation Engine (goal/path/progress/performance/interests/time/language/membership/completions/feedback inputs → next-course/revision/practice-quiz/mentor/resource/challenge outputs) with a mandatory deterministic non-AI fallback, consuming `008`'s platform per plan.md in `backend/src/modules/lms-discovery/recommendation-engine.service.ts` (FR-088, Constitution Article II)
- [ ] T080 [P] Learning search across courses/programs/modules/lessons/instructors/transcripts/resources with access-permission-respecting filters in `backend/src/modules/lms-discovery/learning-search.service.ts` (FR-089)
- [ ] T081 [P] Member course catalog view (continue-learning/recommended/paths/new/popular/free/included/completed/wishlist sections, card states) in `web/src/app/(member)/learn/page.tsx` (FR-090)

**Checkpoint**: Discovery and recommendation surfaces independently functional.

---

## Phase 8: User Story 6 — Progress Through Drip-Released, Prerequisite-Gated Content (P2)

**Independent Test**: Configure a module to unlock 3 days after enrollment and a second module gated on the first module's assessment; confirm a learner cannot access either early, sees the correct unlock condition/countdown, and gains access exactly on schedule.

- [ ] T082 [US6] Locked-content display (unlock condition/date/countdown, prerequisite CTA) in `web/src/components/lesson-player/locked-content.tsx` (FR-035, acceptance scenarios 1–2)
- [ ] T083 [US6] Server-side denial of direct locked-content requests, independent of what the UI shows, wired to T014's evaluator in `backend/src/modules/lms-drip/drip-prerequisite.service.ts` (FR-034, acceptance scenario 1, edge case)
- [ ] T084 [US6] Course sequencing modes (Sequential/Flexible/Hybrid/Instructor-Controlled) in `backend/src/modules/lms-drip/sequencing.service.ts` (FR-038)
- [ ] T085 [US6] Cohort-scheduled simultaneous release: all cohort learners gain access together regardless of individual enrollment date in `backend/src/modules/lms-catalog/cohort.service.ts` (FR-034, acceptance scenario 4)
- [ ] T086 [US6] Admin UI: circular-dependency-blocked prerequisite configuration with an explanatory error, wired to T014/T018 in `web/src/app/(admin)/lms/courses/[id]/prerequisites/page.tsx` (FR-037, acceptance scenario 3)
- [ ] T087 [US6] Integration test: drip-lock-with-countdown, prerequisite-CTA, circular-dependency-block, cohort-simultaneous-release in `backend/tests/integration/us6-drip-prerequisite.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: Structured, non-random progression independently functional.

---

## Phase 9: User Story 7 — Build and Publish a Course via the Course Builder (P2)

**Independent Test**: An instructor without publish rights builds a complete course through all ten builder steps, submits for review, a reviewer requests changes, the instructor resolves them and gets approval, and only a publish-permission holder can move it to Published.

- [ ] T088 [US7] Guided course-builder wizard (basic info → outcomes → audience/prerequisites → curriculum → content → assessments → access/pricing → certificate → SEO → review & publish) with autosave/version-history/preview-per-step and a progress checklist in `web/src/app/(admin)/lms/courses/builder/[step]/page.tsx` (FR-097)
- [ ] T089 [US7] Block-based content authoring editor (text/heading/image/video/audio/file/quote/callout/table/checklist/code/embed/quiz/assignment/CTA/divider blocks) with autosave/version-history/preview/duplicate/reorder/translation/accessibility fields in `web/src/components/course-builder/block-editor.tsx` (FR-096)
- [ ] T090 [US7] Content-review-workflow enforcement (Submit-for-review blocks Publish for non-publish-permission users; every transition audit-logged with role attribution), wired to T015's state machine in `backend/src/modules/lms-course-builder/review-enforcement.service.ts` (FR-095, FR-100, acceptance scenarios 1–2)
- [ ] T091 [US7] Draft-content visibility restriction (only admins + assigned instructors) in `backend/src/modules/lms-catalog/course-visibility.service.ts` (FR-015, acceptance scenario 3)
- [ ] T092 [US7] Scheduled-publish auto-activation on release date, no manual step required in `backend/src/modules/lms-course-builder/scheduled-publish.service.ts` (FR-100, acceptance scenario 4)
- [ ] T093 [P] [US7] Instructor dashboard (assigned courses, active learners, pending assignments, learner questions, upcoming live sessions, completion rate, rating, at-risk learners, announcements) in `web/src/app/(admin)/lms/instructor-dashboard/page.tsx` (FR-094)
- [ ] T094 [P] [US7] Course translation management (per-language variant status, automatic Outdated flagging when the source lesson is updated) in `backend/src/modules/lms-course-builder/translation.service.ts` (FR-101, edge case)
- [ ] T095 [P] [US7] Course announcements (title/message/priority/audience/scope/publish-expiry/channels/attachment; in-app/push/email delivery) in `backend/src/modules/lms-course-builder/announcement.service.ts` (FR-102)
- [ ] T096 [P] [US7] Course calendar (live classes/deadlines/quiz windows/unlocks/program events/mentor sessions; month/week/agenda views, Google Calendar add, timezone conversion, reminders) in `web/src/app/(member)/learn/[courseId]/calendar/page.tsx` (FR-103)
- [ ] T097 [US7] Learning reminders (course-not-started/lesson-incomplete/assignment-due/quiz-deadline/live-upcoming/streak-at-risk/access-expiring), respecting frequency preferences and anti-spam rules in `backend/src/modules/lms-course-builder/learning-reminders.service.ts` (FR-104)
- [ ] T098 [P] [US7] Admin LMS navigation shell (Learning Dashboard, Paths, Programs, Courses, Modules, Lessons, Assessments, Question Bank, Assignments, Certificates, Instructors, Cohorts, Enrollments, Reviews, Reports, Settings) in `web/src/app/(admin)/lms/layout.tsx` (FR-110)
- [ ] T099 [P] [US7] Admin course-list screen (columns, filters, actions: view/edit/duplicate/preview/publish/unpublish/archive/analytics/manage-learners) in `web/src/app/(admin)/lms/courses/page.tsx` (FR-111)
- [ ] T100 [P] [US7] Admin enrollment-management screen (grant/extend/revoke/reset-progress/mark-complete-with-reason/resend-welcome/export, every action audit-logged) in `web/src/app/(admin)/lms/enrollments/page.tsx` (FR-112)
- [ ] T101 [US7] Progress-override actions (mark-complete/reset/mark-approved/extend-deadline/mark-course-complete), each requiring reason + permission + audit + conditional learner notification in `backend/src/modules/lms-course-builder/progress-override.service.ts` (FR-113)
- [ ] T102 [US7] Global LMS settings (default completion rule, video threshold, quiz attempts, passing score, rating eligibility, certificate rules, download/offline policy, reminder frequency, discussion default, file limits, enrollment defaults, archival policy) in `web/src/app/(admin)/lms/settings/page.tsx` (FR-114)
- [ ] T103 [US7] Integration + E2E test: full builder-wizard-to-published journey with role-separated publish permission and a complete audit trail in `web/tests/e2e/us7-course-builder.spec.ts` (all 4 acceptance scenarios)

**Checkpoint**: Content operations can scale beyond hand-seeded launch courses.

---

## Phase 10: User Story 8 — Clone an Existing Course for Reuse (P2)

**Independent Test**: Clone a published course with existing enrollments/progress using "curriculum only"; confirm the new course has the same modules/lessons but zero enrollments, zero progress, no financial linkage.

- [ ] T104 [US8] Course cloning engine (full / curriculum-only / content-without-enrollments / assessment-bank / certificate-settings / translation-variant modes), guaranteeing zero carry-over of enrollments, progress, or financial data in `backend/src/modules/lms-course-builder/course-clone.service.ts` (FR-098, acceptance scenario 1)
- [ ] T105 [US8] Translation-variant clone linkage (source-language relationship, inherited structure for translation) in `backend/src/modules/lms-course-builder/course-clone.service.ts` (FR-098, acceptance scenario 2)
- [ ] T106 [US8] Assessment-bank-only clone scope enforcement (quizzes/question-bank only — no curriculum, lessons, or certificate settings) in `backend/src/modules/lms-course-builder/course-clone.service.ts` (FR-098, acceptance scenario 3)
- [ ] T107 [US8] Integration test: full-clone zero-carryover, translation-variant linkage, assessment-bank-only scope in `backend/tests/integration/us8-course-clone.integration.test.ts` (all 3 acceptance scenarios, SC-008)

**Checkpoint**: Content-operations acceleration independently functional.

---

## Phase 10b: Learning Analytics & At-Risk Detection (supports FR-105–FR-109; cross-cutting, no single owning story)

- [ ] T108 User-level learning analytics collector (enrollment, activity, progress, time, lessons, quizzes, scores, assignments, attendance, certificate, drop-off, at-risk score) in `backend/src/modules/lms-analytics/user-analytics.service.ts` (FR-105)
- [ ] T109 [P] Admin course analytics (enrollments/active-learners/completion-rate/avg-time/drop-off/video-engagement/quiz-pass-rate/assignment-approval-rate/rating/refund-correlation/certificate-rate/device+language distribution) in `web/src/app/(admin)/lms/reports/course-analytics/page.tsx` (FR-106)
- [ ] T110 [P] Per-lesson analytics (views/unique-learners/starts/completes/avg-watch-read-time/drop-off-timestamp/replays/notes/discussion/downloads/error-rate) in `web/src/app/(admin)/lms/reports/lesson-analytics/page.tsx` (FR-107)
- [ ] T111 At-risk learner detection (no-activity, repeated quiz failure, missed assignments, low attendance, access nearing expiry, long inactivity) triggering reminder/revision/mentor-suggestion/instructor-alert/support-outreach/simplified-restart actions in `backend/src/modules/lms-analytics/at-risk-detection.service.ts` (FR-108, SC-009)
- [ ] T112 LMS analytics event taxonomy emission (`course_viewed` through `learning_path_completed`) in `backend/src/modules/lms-analytics/lms-event-emitter.service.ts` (FR-109)
- [ ] T113 Integration test: at-risk learners are surfaced to instructors/support before their course access expires, across all monitored active courses in `backend/tests/integration/lms-at-risk-detection.integration.test.ts` (SC-009)

**Checkpoint**: Analytics and at-risk detection independently functional.

---

## Phase 11: User Story 9 — Use AI-Assisted Learning and Peer Review Within Integrity Bounds (P3)

**Independent Test**: (a) Request an AI lesson summary and confirm it's presented as advisory, not authoritative; (b) submit an assignment for peer review, collect the configured reviews, and confirm the instructor can view/weigh/override the peer score.

- [ ] T114 [US9] AI-in-learning capability wrapper (lesson summary, quiz explanation, study plan, translation assistance, practice-question generation, assignment brainstorming, feedback support, transcript search) consuming `008`'s platform, with a deterministic non-AI fallback on failure in `backend/src/modules/lms-ai/ai-learning.service.ts` (FR-117, acceptance scenario 1, Constitution Article II)
- [ ] T115 [US9] AI-cheating-prevention guardrail: AI must not present output as always-correct, and must not directly produce a submittable graded answer on the learner's behalf in `backend/src/modules/lms-ai/ai-integrity-guard.service.ts` (FR-118, acceptance scenario 2)
- [ ] T116 [US9] Course-level AI usage policy configuration and a learner AI-use disclosure option on submissions in `backend/src/modules/lms-ai/ai-usage-policy.service.ts` (FR-119)
- [ ] T117 [US9] Peer review workflow (configurable review count, anonymous-or-visible identity, review rubric, deadline, reviewer eligibility, moderation, instructor override, admin-controlled inclusion-in-final-grade policy) in `backend/src/modules/lms-assignment/peer-review.service.ts` (FR-076, acceptance scenario 3)
- [ ] T118 [US9] Content ownership/copyright declaration, plagiarism-review, and takedown process for uploaded instructor content in `backend/src/modules/lms-integrity/content-ownership.service.ts` (FR-115)
- [ ] T119 [US9] Academic integrity investigation workflow (plagiarism, unauthorized collaboration, identity fraud, quiz cheating, fabricated submission, certificate fraud) with originality declaration, similarity-detection integration, review flag, investigation, appeal, and certificate hold in `backend/src/modules/lms-integrity/academic-integrity.service.ts` (FR-116, acceptance scenario 4, edge case: post-issuance flag)
- [ ] T120 [US9] Integration test: AI-fallback-on-failure, AI-refuses-to-write-submission, peer-review instructor-override, plagiarism-flag → investigation → certificate-hold in `backend/tests/integration/us9-ai-integrity-peer-review.integration.test.ts` (all 4 acceptance scenarios)

**Checkpoint**: All 9 user stories independently functional.

---

## Phase 12: Polish & Cross-Cutting Concerns

- [ ] T121 [P] LMS notification wiring (enrollment-confirmed through instructor-announcement events) consolidated across all stories in `backend/src/modules/lms-course-builder/lms-notifications.service.ts` (FR-120)
- [ ] T122 [P] Transactional email wiring (enrollment/welcome/deadline/reminder/feedback/completion/certificate/expiry/course-update), respecting preferences except critical transactional mail in `backend/src/modules/lms-course-builder/lms-transactional-email.service.ts` (FR-121)
- [ ] T123 [P] Security pass: server-side entitlement checks, signed media, secure upload, malware scan, input sanitization, quiz-answer protection, submission authorization, certificate-verification integrity, audit logs, rate limits, anti-enumeration, instructor-permission isolation (FR-122)
- [ ] T124 [P] Accessibility pass: keyboard-operable player, captions/transcript, screen-reader lesson structure, accessible quiz controls, time-limit announcements, assignment error summaries, focus management, color-independent status, reduced motion, accessible certificate verification (FR-123)
- [ ] T125 Performance pass: paginated catalog, lazy-loaded curriculum, adaptive streaming, fast player start, async-but-reliable progress updates, auto-saved notes, background upload, cached analytics, partial-failure isolation (FR-124)
- [ ] T126 Verify the full LMS error-code taxonomy (T016) is actually surfaced to clients across every course/lesson/quiz/assignment/certificate error path (FR-125)
- [ ] T127 Run `quickstart.md` validation end-to-end across all 9 user stories

---

## Dependencies & Execution Order

- **Setup → Foundational** blocks all stories; Foundational depends on `001`/`002`/`003`'s prior work.
- **P1 stories**: US1 (enrollment) is the hard P0 gate for everything else — no lesson, quiz, assignment, or certificate work is meaningful without a verified entitlement path. Recommended order: US1 → US2 (lesson consumption) → US3 (quiz) and US4 (assignment) in parallel (both depend on US2's completion-rule infrastructure but not on each other) → US5 (certificate, depends on US2/US3/US4's eligibility signals).
- **Phase 7b (Discovery & Recommendations)** depends on Foundational + US2 (needs progress data to recommend against) — may run in parallel with US3–US5.
- **P2 stories (US6, US7, US8)** depend on Foundational; US6 (drip/prerequisite) mostly hardens Foundational's T014 evaluator and can run early; US7 (course builder) and US8 (cloning) both depend on US7's T015 workflow state machine, so sequence US7 before US8.
- **Phase 10b (Learning Analytics)** depends on US2/US3/US4's event emission — sequence after the P1 slice.
- **P3 story (US9)** depends on Foundational, US4 (peer review extends assignment review), and `008`'s AI platform being available.
- **Polish (Phase 12)** depends on all desired stories being complete.

## Implementation Strategy

**MVP First**: Setup → Foundational → US1 (enrollment) → **STOP and VALIDATE** entitlement gate works across every source → US2 (lessons) → US3 + US4 in parallel → US5 (certificate) → **STOP and VALIDATE** the full enroll-to-certificate journey (the platform's core credibility deliverable) → then Phase 7b (discovery) → US6/US7/US8 (P2 growth capabilities) → Phase 10b (analytics) → US9 (P3 AI/integrity) → Polish.
