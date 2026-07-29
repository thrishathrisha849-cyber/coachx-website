---
description: "Task list for Feature 004 — Learning Management System: Courses, Assessments & Certification"
---

# Tasks: Learning Management System: Courses, Assessments & Certification

**Input**: Design documents from `/specs/004-learning-management-system/` (`spec.md`, `plan.md`)

**Prerequisites**: plan.md, spec.md, and **Features 001–003's Foundational phases complete** (User Account/RBAC/EntitlementGuard/Content Governance from 001, Consent from 002, Auth/Profile/Account-Status from 003).

**Tests**: Included throughout — this feature is the constitution's primary cited implementation of Article IX (Action Before Consumption) and directly implements Article I (server-authoritative completion/entitlement) and Article VIII (no vanity-metric completion); the no-vanity-completion and circular-prerequisite guarantees get dedicated contract tests in Foundational.

**Organization**: Tasks are grouped by user story (US1–US9 from spec.md), plus two supplementary cross-cutting phases (Discovery & Recommendations; Learning Analytics & At-Risk Detection) covering FR groups that don't map to a single story, following the same pattern established in 003's Profile Management phase.

## Format: `[ID] [P?] [Story] Description`

**Revision note (2026-07-28)**: First verification pass against real code. An extensive, pre-existing, separately-documented LMS implementation already lives in `backend/src/lms/` (built earlier, referred to in its own docs as "Phase 6 Part 1/2/2B/2C") — it does NOT use this file's `backend/src/modules/lms-*/` layout; it is a flat `backend/src/lms/` module, its own internally-consistent architecture. A dedicated audit (Explore agent, full file reads + grep, not guesswork) found: Foundational's content hierarchy/enrollment/drip/completion-engine are strongly built; US1 (Enrollment) and US2 (Lesson Consumption) are the closest to complete; **US3 (Quiz), US4 (Assignment), and US5 (Certificate) are entirely unbuilt — zero models, zero services** — despite spec.md marking all 5 as P1/MVP-critical. Given the user's explicit scope decision this session ("US1 completion gaps + US2 lesson-player UI only") this pass: (1) built FR-033 organization-admin course assignment (`backend/src/lms/org-assignment.service.ts` — now buildable since `001` added `Organization`, which didn't exist when Part 2's docs recorded this as "owned by another feature"); (2) built the real lesson-player frontend (`frontend/src/pages/LessonPlayerPage.tsx` + a new `backend/src/lms/curriculum.service.ts` sidebar endpoint) wired to the pre-existing, genuinely solid completion engine; (3) wired the enroll CTA into `CourseDetailPage.tsx`, absent since Part 1 predated Part 2's enrollment work. US3/US4/US5 remain **entirely deferred** — each is its own future specs-scale effort, not attempted here. Every task below is checked only where re-verified this pass or confidently evidenced by the audit; everything else is left unchecked with a reason (pre-existing gap / explicitly deferred this session / overlaps a future feature).

---

## Phase 1: Setup

- [x] T001 [P] Verified this pass — 001/002/003's Foundational work is deployed and actively consumed (e.g. `org-assignment.service.ts` reuses `001`'s `Organization`; the frontend's `RequireAuth`/`auth.context.tsx` from `003` gate the new `/learn/*` routes).
- [ ] T002 Not resolved — no video/CDN provider, live-class provider, or similarity-detection vendor is selected or needed for this pass's scope (no video/audio infrastructure or live-class integration was in scope). FR-041's watch-percentage default of 80% and FR-054's mandatory-only weighting are already implemented as defaults in the pre-existing `completion.service.ts`/`progress.service.ts` — the remaining open items (FR-081 certificate threshold, FR-099 version policy, FR-092 offline-submission approval) all belong to the still-unbuilt Certificate/Course-Versioning/Offline features.
- [~] T003 [P] No literal `backend/src/modules/{...}` path — this repo's real, established architecture is flat `backend/src/lms/` (same documented mismatch pattern as specs 001-003's own module-path notes). `curriculum.service.ts` and `org-assignment.{service,validation,controller}.ts` were added there this pass, following the existing convention, not the task-file's aspirational one.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [~] T004 `Course`/`CourseModule`/`Lesson`/`LearningActivity`/`CourseInstructor`/`CourseCategory`/`CourseVersion` all exist (`database/prisma/schema.prisma`). **`LearningPath`/`Program`/`Cohort`/`LearningPathCourse` do NOT exist** — confirmed via full-schema grep; `docs/lms/DECISION_GATES.md` gate #27 documents this as out of scope for all Feature 004 phases so far. Not addressed this pass (large, separate entities beyond "US1 gaps + US2 player" scope).
- [~] T005 `Enrollment` exists with access windows/status/capacity enforcement. **`Waitlist` does NOT exist** (`docs/lms/DECISION_GATES.md` gates #20/#41: "deferred to Part 3") — not addressed this pass.
- [x] T006 `LessonProgress`, and course/module aggregate progress (`progress.service.ts`'s `computeModuleProgress`/`computeCourseProgress`) exist. **No separate `PathProgress`/`VideoProgress` entities** (no LearningPath to aggregate against; no video-streaming infra to telemetry) — correctly absent, not a gap, given T004's LearningPath status.
- [ ] T007 [P] No `LearnerNote`/`Bookmark` entities exist. Not addressed this pass.
- [ ] T008 No `Quiz`/`Question`/`QuestionOption`/`QuizAttempt`/`QuizAnswer` entities exist anywhere in the schema — confirmed via grep. **Entirely unbuilt; explicitly deferred this session** (US3 is its own future effort per the user's scope decision).
- [ ] T009 No `Assignment`/`Submission`/`SubmissionFile`/`Rubric`/`RubricCriterion`/`Review` entities exist. **Entirely unbuilt; explicitly deferred this session** (US4).
- [ ] T010 [P] No `CertificateTemplate`/`Certificate` entities exist — only `Course.certificateAvailable`, a plain catalog boolean. **Entirely unbuilt; explicitly deferred this session** (US5).
- [ ] T011 [P] No `LiveSession`/`Attendance` entities exist. Not addressed this pass (no live-class provider integration in scope).
- [ ] T012 [P] No `CourseReview`/`Announcement`/`LearningEvent` entities exist. Not addressed this pass.
- [x] T013 `backend/src/lms/completion.service.ts`'s `getEffectiveCompletionRules`/`evaluateAutomaticRules` — pre-existing, re-verified this pass as genuinely solid: AND-combined multi-condition support, and `areAllRequiredActivitiesViewed` is always server-derived from real `ActivityProgress` rows, never a client-asserted boolean.
- [x] T014 `backend/src/lms/access-evaluator.service.ts`'s `isModuleReleased` (drip) + `module.service.ts`'s `assertNoModulePrerequisiteCycle` (circular-dependency detection at save time) — pre-existing, reused as-is by this pass's new `curriculum.service.ts`. **Module-level only** — no per-lesson drip (`docs/lms/DECISION_GATES.md` gate #22, a documented scope boundary, not an oversight).
- [x] T015 `backend/src/lms/course-lifecycle.policy.ts` — pre-existing, enforces the full Draft→Submitted→Changes-requested→Approved→Scheduled→Published chain with publish/edit permission separation (verified via `docs/lms/RBAC.md`).
- [ ] T016 No dedicated `lms-error-codes.ts` taxonomy file exists — errors use the generic shared `AppError`/`ERROR_CODES` (e.g. `COURSE_FULL`, `COURSE_UNAVAILABLE` as string literals inline, not a centralized enum). Not addressed this pass.
- [ ] T017 No dedicated contract test file at this path — the no-vanity-completion guarantee is covered indirectly by existing LMS integration tests (`lms.integration.test.ts`, `lms-part2.integration.test.ts`) rather than a standalone contract test. Not addressed this pass.
- [ ] T018 No dedicated contract test file at this path — circular-dependency rejection is covered by an existing integration test ("rejects a module prerequisite cycle" in `lms.integration.test.ts`). Not addressed this pass.
- [ ] T019 No dedicated contract test file at this path — per-request entitlement verification is covered throughout `lms-part2.integration.test.ts`'s access-control scenarios rather than a standalone contract test. Not addressed this pass.

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Enroll and Gain Access via an Entitlement Type (P1) 🎯 MVP

**Independent Test**: Enroll a test learner under each entitlement source (free, membership, purchase, org-assigned, coupon); confirm lesson content is served only after server-side entitlement verification, with correct failure reasons for unsupported cases.

- [x] T020 [US1] `backend/src/lms/enrollment.service.ts`'s `createEnrollmentInternal`/`selfEnroll` — pre-existing, full orchestration (entitlement→capacity→create→audit), tested end-to-end in `lms-part2.integration.test.ts`.
- [~] T021 [US1] Denial reasons exist for the sources that actually work (`COURSE_FULL`, `COURSE_UNAVAILABLE`, entitlement-`UNAVAILABLE`) — membership/payment/region/org-license-specific reasons don't apply since those entitlement sources are deliberately fail-closed (Volume 09 not built). Not a gap for the sources this codebase actually supports.
- [x] T022 [US1] `enrollment.policy.ts`'s `isEnrollmentAccessWindowOpen` + `access-evaluator.service.ts`'s `ACCESS_NOT_STARTED`/`ACCESS_EXPIRED` — pre-existing, server-side, timestamp-based (no background job dependency).
- [~] T023 [US1] Capacity rejection (`COURSE_FULL`) exists and is enforced. **Waitlist does NOT exist** (see T005) — join/time-limited-offer/next-priority-pass-through not addressed this pass.
- [ ] T024 [P] [US1] No Wishlist entity/service exists. Not addressed this pass.
- [ ] T025 [US1] No refund-driven access policy exists — correctly absent, since there is no Order/Payment/Refund system yet (Volume 09) to trigger it from.
- [ ] T026 [P] [US1] No bulk CSV import exists. Not addressed this pass.
- [x] T027 [US1] **(this session)** `backend/src/lms/org-assignment.service.ts` — `assignCourseToOrganizationMembers` (bulk assign + per-user result report), `listOrganizationCourseEnrollments` (tracking/reporting), `removeOrganizationMemberAccess` (remove access), `setOrganizationMemberDeadline` (deadlines). Cohort/invite are correctly out of scope (no Cohort entity — see T004). Every function re-verifies BOTH actor's and target's `organizationId` before acting — never reaches a learner's notes/unrelated data (no such endpoint exists here at all). Verified via `backend/tests/integration/org-assignment-lesson-player.integration.test.ts` (cross-org denial + same-org success) and a live curl walkthrough against the running dev server.
- [x] T028 [P] [US1] **(this session)** `frontend/src/pages/CourseDetailPage.tsx` — real enroll CTA calling `POST /lms/me/enrollments`, driven by the server's own `GET /lms/me/courses/:courseId/access` decision (not a client guess). No waitlist-join UI (see T023/T024).
- [ ] T029 [US1] No dedicated integration test file at this path — enrollment is covered across `lms-part2.integration.test.ts` (pre-existing) and this pass's new `org-assignment-lesson-player.integration.test.ts`. Not addressed as a single consolidated file this pass.

**Checkpoint**: Enrollment/entitlement gate independently functional — the P0 prerequisite for every other LMS capability.

---

## Phase 4: User Story 2 — Consume Lessons and Track Multi-Condition Completion (P1)

**Independent Test**: Configure a multi-condition lesson, consume it partially (remains incomplete), then satisfy all conditions and confirm completion syncs across a second device.

- [~] T030 [US2] **(this session)** `frontend/src/pages/LessonPlayerPage.tsx`'s `LessonActivity` renders a real HTML5 `<video>` with play/pause/seek/volume/speed/fullscreen (native browser controls) and resume (via `lastPosition` sent to the server). **No PiP toggle, no quality-selector UI, no per-video telemetry service** — `LearningActivity` has no video-specific telemetry table (see T004/T006); watch-percent is derived from `currentTime/duration` client-side and reported via the existing `updateLessonProgress` endpoint, not a dedicated video-progress service.
- [x] T031 [US2] `completion.service.ts`'s `evaluateAutomaticRules` (pre-existing) — `MINIMUM_WATCH_PERCENT` defaults to 80% (`lesson.completionRuleValue.minPercent ?? 80`), confirmed by reading the code this pass.
- [ ] T032 [US2] No signed-URL video delivery exists — `LearningActivity.mediaUrl` is a plain URL (`docs/lms/DECISION_GATES.md` gate #31: "no file-hosting/upload pipeline exists"). Not addressed this pass — would require a real media/CDN provider decision (T002).
- [ ] T033 [P] [US2] No captions/transcript exist. Not addressed this pass.
- [x] T034 [P] [US2] **(this session)** `LessonPlayerPage.tsx`'s `LessonActivity` renders a real `<audio>` element (play/pause/seek/speed/resume via native controls + `lastPosition`). No background-playback or sleep-timer (both are mobile-app concepts; no mobile app exists in this repo).
- [x] T035 [P] [US2] **(this session)** `LessonActivity`'s `ARTICLE` case renders sanitized rich-text (`sanitizeRichText`, the same DOMPurify allowlist the CMS/course-description paths already use) with a scroll/click-based "viewed" signal. No TOC/reading-time/translation-variant UI.
- [x] T036 [P] [US2] **(this session)** `LessonActivity`'s `PDF` case renders an in-app `<iframe>` viewer with a viewed-on-load signal. No page navigation/search/zoom/bookmark/resume-page (an iframe-embedded browser PDF viewer, not a custom in-app one), no watermarking, no access-logging beyond the existing generic `activities.viewed` signal.
- [ ] T037 [P] [US2] No dedicated downloadable-resource catalog service exists — `DOWNLOAD`-type activities (rendered this pass in `LessonActivity`) use the same generic `LearningActivity` fields as every other type, not a richer resource-catalog model (version/permission/language fields). Not addressed this pass.
- [ ] T038 [US2] No Live Class lesson state machine or Google Meet/Zoom integration exists. Not addressed this pass.
- [x] T039 [US2] **(this session)** `LessonPlayerPage.tsx` — curriculum sidebar (desktop), activity content area, prev/next navigation, mark-complete. Single responsive layout, not a distinct mobile content-first variant; no dedicated notes/resources/discussion panels (none of those features exist — see T007/T045).
- [ ] T040 [US2] No offline queue/conflict-resolution sync exists — correctly out of scope, since no mobile app exists in this repo to go offline from. Progress updates are synchronous and server-authoritative (`updateLessonProgress`), which satisfies the "server-authoritative" half of FR-056 but not the offline-queue half.
- [x] T041 [US2] `progress.service.ts`'s `computeModuleProgress`/`computeCourseProgress` (pre-existing) — mandatory-only weighting, optional lessons don't block completion; **extended this session** to also return a per-lesson `status` array, now powering the lesson-player sidebar's checkmarks.
- [ ] T042 [P] [US2] No Learning Streak exists. Not addressed this pass.
- [ ] T043 [P] [US2] No Learner Notes exist. Not addressed this pass.
- [ ] T044 [P] [US2] No Bookmarks exist. Not addressed this pass.
- [ ] T045 [P] [US2] No per-lesson discussion exists (no Community infrastructure from `005` exists yet to build it on). Not addressed this pass.
- [ ] T046 [US2] No mobile app exists in this repo at all. Not applicable/not attempted.
- [ ] T047 [US2] Same as T046 — not applicable (web-only monorepo).
- [ ] T048 [US2] Same as T046 — not applicable.
- [x] T049 [US2] **(this session)** `backend/tests/integration/org-assignment-lesson-player.integration.test.ts`'s "Course curriculum for the lesson player" suite — covers pre-enrollment 403, post-enrollment unlocked+`NOT_STARTED`, and post-completion `COMPLETED` status reflected in the curriculum endpoint. No offline-sync test (not applicable — see T040/T046).

**Checkpoint**: Core day-to-day learning loop independently functional.

---

## Phase 5: User Story 3 — Attempt a Quiz or Assessment (P1)

**Independent Test**: Configure a graded quiz with a passing score and two allowed attempts; take it once to fail and once to pass; confirm result screen, retake eligibility, and downstream unlocks reflect correct state.

**Revision note (2026-07-29, Quiz System batch)**: The prior revision note above marked US3 "entirely unbuilt, explicitly deferred" as one narrower implementation batch's scope decision — the user explicitly corrected that framing: a scope-limited batch is not spec completion, and Spec 004 continues in further batches (Assignment System, Certificate System, LMS Admin UI, remaining quality tasks are still outstanding — see the batch report). This batch implemented the Quiz System end-to-end: `Quiz`/`Question`/`QuestionOption`/`QuizAttempt`/`QuizAnswer` models (migration `20260728183309_spec004_quiz_system`), a `QUIZ_PASS` lesson-completion rule wired into the pre-existing `completion.service.ts` engine, full admin CRUD, the learner attempt flow with server-side grading across 5 question types, attempt-limit enforcement, timer-expiry auto-submit, historical-attempt integrity after question archival, idempotent submission, member-facing quiz-taking UI, and a minimal admin quiz-management UI. Deliberately narrower than spec.md's fullest FR-064 vision (see file header note): questions belong to one quiz directly, not a separate reusable cross-quiz Question Bank with tagging/randomized-set-generation — a genuine, real, future enhancement, not silently dropped.

- [x] T050 [US3] `backend/src/lms/quiz-attempt.service.ts`'s `startOrResumeAttempt`/`saveAnswer`/`submitAttempt` — instructions (quiz.instructions field) → eligibility check (attempt-limit) → timer (expiresAt) → autosave (per-answer upsert) → submit-confirm → server grades → result → pass/fail → progress update (QUIZ_PASS trigger) → retake rules (maxAttempts error detail). All verified via `backend/tests/integration/quiz-system.integration.test.ts` (11 tests) and a live curl walkthrough against the running dev server.
- [x] T051 [US3] `quiz-attempt.service.ts`'s `autoSubmitIfExpired`/`isExpired` — a timer-expired IN_PROGRESS attempt is auto-graded on the next read/write touch (verified by test "auto-submits and scores a timer-expired attempt rather than losing it").
- [x] T052 [US3] `startOrResumeAttempt`'s `maxAttempts` check throws `QUIZ_ATTEMPT_LIMIT_REACHED` (409) with `{maxAttempts, attemptsUsed}` detail once finalized attempts reach the configured limit (verified by test).
- [~] T053 [P] [US3] Questions belong directly to one quiz (`quiz.repository.ts`) — no separate, cross-quiz-reusable Question Bank with category/difficulty tagging or randomized-set generation by distribution rules. A deliberate, documented scope reduction (see revision note above), not an oversight.
- [x] T054 [US3] `gradeAndFinalizeAttempt`'s question set is the union of currently-PUBLISHED questions and whatever question each recorded `QuizAnswer` actually points at (via `findQuestionByIdIncludingDeleted`, since `Question.deletedAt` soft-delete, never hard-delete) — a question archived mid-attempt still grades correctly and still counts toward `pointsPossible`. This exact bug (the naive `findQuestionsByQuiz(id, true)` approach silently drops soft-deleted questions regardless of its `includeArchived` flag) was caught and fixed by the dedicated integration test for this scenario before this task was marked done.
- [x] T055 [US3] `submitAttempt` wraps `beginIdempotentOperation` (same shared idempotency infrastructure as lesson-completion/enrollment) — resubmitting an already-GRADED attempt replays the identical result, never re-grades (verified by test).
- [x] T056 [P] [US3] `frontend/src/pages/QuizAttemptPage.tsx`'s graded-review branch — score, pass/fail, points, per-question correct/incorrect, admin-controlled visibility via `quiz.showCorrectAnswers`/`reviewVisible`. No separate topic-level performance breakdown.
- [ ] T057 [P] [US3] No broader Assessment types (self-assessment/skill-rating/scenario-task/practical-project/viva/portfolio-review) — out of scope this batch, a real Quiz engine was the priority.
- [x] T058 [US3] `frontend/src/pages/QuizAttemptPage.tsx` — single-choice/multiple-choice/true-false/short-answer/fill-blank/numeric question rendering with autosave. No match/ordering/file-upload/scenario/audio/video-response types (explicitly future-ready, matching this codebase's established "don't preclude, don't fake" pattern for out-of-scope question types).
- [x] T059 [US3] `backend/tests/integration/quiz-system.integration.test.ts` — 11 tests covering: zero-question publish rejection, 1:1 lesson-quiz constraint, non-enrolled access denial, full-credit grading across all 5 question types with pre-grading answer-key concealment verified, zero-credit grading with unanswered questions counted incorrect, attempt resume, attempt-limit block, timer-expiry auto-submit, historical-attempt integrity after question archival, idempotent resubmission, and QUIZ_PASS lesson-completion integration. Plus 3 frontend tests (`QuizAttemptPage.test.tsx`). No dedicated network-interruption-dedup test beyond the idempotency test (same underlying mechanism).

**Checkpoint**: Assessment loop independently functional.

---

## Phase 6: User Story 4 — Submit an Assignment and Receive Rubric-Graded Feedback (P1)

**Independent Test**: Submit a file-upload assignment; instructor scores against rubric and requests changes; learner resubmits; instructor approves; learner is notified with rubric feedback visible.

**Revision note (2026-07-29, Assignment System batch)**: This batch implemented the Assignment System end-to-end: `Assignment`/`RubricCriterion`/`Submission`/`SubmissionCriterionScore` models (migration `20260729101324_spec004_assignment_system`), an `ASSIGNMENT_APPROVED` lesson-completion rule wired into the same `completion.service.ts` engine Quiz's `QUIZ_PASS` uses, full admin CRUD (assignment + rubric criteria), the learner submission flow (draft/save/submit with late-policy enforcement), attempt-limit-gated resubmission after CHANGES_REQUESTED that preserves every prior attempt's history, instructor rubric-scoring review with APPROVE/REQUEST_CHANGES/REJECT decisions, member-facing submission UI, and admin review UI. Rubric criteria belong directly to one assignment (no separate, cross-assignment-reusable Rubric template entity) and file-shaped submission formats are link-based (no upload/storage pipeline exists in this codebase) — both deliberate, documented scope reductions mirroring Quiz's own. Same historical-integrity class of bug Quiz's Question-archival test caught was found and fixed here too (a scored `RubricCriterion` archived after review must still resolve its title in the submission-review display) — caught by this batch's own dedicated integration test before being marked done.

- [x] T060 [US4] `backend/src/lms/assignment-submission.service.ts`'s `submitSubmission` — orchestrates open (assignment metadata surfaced on `GET /me/lessons/:id`) → instructions/rubric (`GET /admin/assignments/:id` for rubric, learner sees it via the lesson payload) → save draft (`saveDraft`) → required-fields check (at least `textBody` or `linkUrl`) → submit confirm → lock-or-edit (DRAFT-only editing) → status update. No separate "notify reviewer"/"notify learner" step — no notification system exists anywhere in this codebase yet (a pre-existing, cross-cutting gap, not unique to this batch).
- [x] T061 [US4] `assignment-submission.service.ts`'s `submitSubmission` late-policy check — `latePolicy: REJECT` blocks a past-due submission (400) at the assignment's `dueAt`; `ACCEPT` allows it with `isLate: true`. Verified via `backend/tests/integration/assignment-system.integration.test.ts`.
- [x] T062 [US4] `admin/src/pages/SubmissionReviewPage.tsx` + `reviewSubmission` service — learner details, submission content, rubric scoring per criterion with a private reviewer note vs. learner-facing feedback field, and approve/request-changes/reject actions. No "previous attempts" panel in the review UI itself (the learner-facing history exists via `getMySubmissionHistory`; the admin review screen shows the one submission being reviewed) — a real, minor gap, not a fabricated feature.
- [x] T063 [US4] `RubricCriterion` model + `assignment.service.ts`'s `addRubricCriterion`/`updateExistingCriterion`/`archiveRubricCriterion` — criteria, description, weight-as-`maxPoints`, per-criterion reviewer comment (`SubmissionCriterionScore.comment`). No separate "performance levels" (rubric levels like Excellent/Good/Needs-Work per criterion) — a numeric point award only, a real scope reduction.
- [x] T064 [US4] `SubmissionStatus` enum (DRAFT/SUBMITTED/UNDER_REVIEW/CHANGES_REQUESTED/APPROVED/REJECTED/EXCUSED) — "Not started" has no row by design (FR-072's own framing); "Overdue"/"Late submitted" are derived (`isLate` flag + `dueAt` comparison), not separate stored statuses. Resubmission after CHANGES_REQUESTED creates a NEW `Submission` row (never overwrites), verified by the dedicated "preserves the previous submission" integration test.
- [x] T065 [US4] Covered by the same `submitSubmission` late-policy logic as T061 (FR-070's "late policy" and FR-072's "Late submitted" flagging are the same mechanism in this implementation, not two separate systems).
- [x] T066 [US4] `completion.service.ts`'s `maybeAutoCompleteFromAssignmentApproval`, called from `reviewSubmission` only on an APPROVE decision — verified end-to-end (submit → approve → lesson `COMPLETED`) both in the integration test suite and a live curl walkthrough against the running dev server.
- [ ] T067 [P] [US4] No dedicated instructor-feedback-format service exists — feedback is a single `learnerFeedback` text field (+ per-criterion `comment`). No audio/video/annotated-file feedback, no "mark viewed"/"reply"/"request clarification" learner actions beyond re-reading the feedback text on the assignment page. Not addressed this pass (no media pipeline exists to build audio/video feedback on).
- [ ] T068 [P] [US4] No project-based "multiple required-artifact submissions" concept exists — one assignment has one submission stream. Not addressed this pass.
- [x] T069 [US4] **(this session)** `frontend/src/pages/AssignmentPage.tsx` — draft editor (text + optional link), save/submit actions, status display, reviewer feedback display, resubmit action after CHANGES_REQUESTED, and a visible attempt-history list. This is the frontend half of FR-071's submission flow.
- [x] T070 [US4] `backend/tests/integration/assignment-system.integration.test.ts` — 9 tests covering: 1:1 lesson-assignment constraint, non-enrolled access denial, full draft→submit→approve cycle with correct rubric-sum scoring and ASSIGNMENT_APPROVED completion, late-flagging under both late policies (ACCEPT/REJECT), resubmission-preserves-history + attempt-limit enforcement, historical-criterion integrity after archival, idempotent resubmission, and REJECT-decision handling. Plus 3 frontend tests (`AssignmentPage.test.tsx`). No dedicated "unsupported file type" rejection test — file-shaped submissions are link-based in this implementation (see revision note), so there is no file-type validation surface to test.

**Checkpoint**: The primary "action, not consumption" mechanism is independently functional.

---

## Phase 7: User Story 5 — Earn and Publicly Verify a Certificate (P1)

**Independent Test**: Bring a test learner to 100% eligibility; confirm certificate generation with a unique verification code; visit the public verification URL as an anonymous, logged-out user and confirm correct status and minimal data.

- [ ] T071–T077 **US5 Certificate — entirely unbuilt, explicitly deferred this session.** Only `Course.certificateAvailable` (a plain catalog boolean) exists; no `Certificate`/`CertificateTemplate` model, no eligibility evaluator, no generation flow, no public verification page, no revocation workflow. Its own future specs-scale effort per the user's scope decision — this is also the platform's core credibility deliverable per spec.md, so it should be prioritized whenever US3/US4/US5 are picked up. None of T071–T077 addressed.

**Checkpoint**: The platform's core credibility deliverable is independently functional — all 5 P1 stories complete.

---

## Phase 7b: Discovery & Recommendations (supports FR-087–FR-090; cross-cutting, no single owning story)

- [ ] T078–T081 **Discovery & Recommendations — not addressed this pass.** No Course Review model, no Recommendation Engine, no cross-content learning search (the pre-existing catalog search covers courses only — category/level/q/sort — a subset of FR-089). `continue-learning.service.ts` (pre-existing) implements the "continue learning" fragment of FR-090's catalog sections, but the full sectioned catalog view (recommended/paths/new/popular/wishlist) doesn't exist. None of T078–T081 addressed.

**Checkpoint**: Discovery and recommendation surfaces independently functional.

---

## Phase 8: User Story 6 — Progress Through Drip-Released, Prerequisite-Gated Content (P2)

**Independent Test**: Configure a module to unlock 3 days after enrollment and a second module gated on the first module's assessment; confirm a learner cannot access either early, sees the correct unlock condition/countdown, and gains access exactly on schedule.

- [x] T082 [US6] **(this session)** `LessonPlayerPage.tsx`'s curriculum sidebar shows a 🔒 lock indicator per locked module/lesson (from `curriculum.service.ts`'s `locked`/`lockReason`/`unlockAt` fields). No date/countdown rendering yet — the data (`unlockAt`) is returned but the UI only shows a lock icon, not a formatted date/countdown; a small, honest gap, not a fabricated display.
- [x] T083 [US6] `access-evaluator.service.ts`'s `evaluateModuleAccess`/`evaluateLessonAccess` (pre-existing) — server-side denial is independent of any UI state; reused as-is by this session's new curriculum/lesson-player endpoints.
- [ ] T084 [US6] No distinct Sequential/Flexible/Hybrid/Instructor-Controlled sequencing-mode concept exists — module-level drip rules (T014) implicitly provide sequencing, but not as a named, configurable mode. Not addressed this pass.
- [ ] T085 [US6] No Cohort entity exists (see T004) — cohort-scheduled simultaneous release not applicable until Cohort is built.
- [ ] T086 [US6] No admin prerequisite-configuration UI exists (admin frontend has no LMS course-management screens at all — see T098/T099). The circular-dependency guard itself is enforced server-side regardless (T014/T018).
- [ ] T087 [US6] No dedicated integration test file at this path — drip/prerequisite enforcement is covered by pre-existing `lms.integration.test.ts` cases plus this session's curriculum-lock test. Not addressed as a single consolidated file.

**Checkpoint**: Structured, non-random progression independently functional.

---

## Phase 9: User Story 7 — Build and Publish a Course via the Course Builder (P2)

**Independent Test**: An instructor without publish rights builds a complete course through all ten builder steps, submits for review, a reviewer requests changes, the instructor resolves them and gets approval, and only a publish-permission holder can move it to Published.

- [x] T090 [US7] `course-lifecycle.policy.ts`'s workflow enforcement (pre-existing, re-verified — see T015) — publish permission separate from edit permission, every transition audited.
- [x] T091 [US7] `isCourseVisibleByDirectLink`/`evaluateCourseAccess` (pre-existing) already restrict Draft content to admins/assigned instructors.
- [ ] T088–T089, T092–T103 **Course-builder UI, cloning-adjacent admin screens, translation, announcements, calendar, reminders, admin LMS navigation/course-list/enrollment-management/settings screens — not addressed this pass.** The backend admin API surface for course/module/lesson/activity/enrollment CRUD is complete (`admin-lms.controller.ts`) but has **no admin frontend at all** — no course-builder wizard, no block editor, no admin course list, no admin enrollment screen, no settings page. This is a pre-existing, cross-cutting gap (the admin app has no LMS section yet), not something this pass's "US1 gaps + US2 player" scope touched.

**Checkpoint**: Content operations can scale beyond hand-seeded launch courses.

---

## Phase 10: User Story 8 — Clone an Existing Course for Reuse (P2)

**Independent Test**: Clone a published course with existing enrollments/progress using "curriculum only"; confirm the new course has the same modules/lessons but zero enrollments, zero progress, no financial linkage.

- [ ] T104–T107 **US8 Course Cloning — not addressed this pass.** No cloning engine of any kind exists. Not attempted (P2, and depends on Course-Builder infrastructure that also doesn't exist yet — see T088-T103).

**Checkpoint**: Content-operations acceleration independently functional.

---

## Phase 10b: Learning Analytics & At-Risk Detection (supports FR-105–FR-109; cross-cutting, no single owning story)

- [ ] T108–T113 **Learning Analytics & At-Risk Detection — not addressed this pass.** No analytics collector, no admin analytics dashboards, no at-risk detection, no LMS event-taxonomy emission (`docs/lms/DECISION_GATES.md`: "deferred to Part 3"). Not attempted.

**Checkpoint**: Analytics and at-risk detection independently functional.

---

## Phase 11: User Story 9 — Use AI-Assisted Learning and Peer Review Within Integrity Bounds (P3)

**Independent Test**: (a) Request an AI lesson summary and confirm it's presented as advisory, not authoritative; (b) submit an assignment for peer review, collect the configured reviews, and confirm the instructor can view/weigh/override the peer score.

- [ ] T114–T120 **US9 AI-Assisted Learning, Peer Review & Academic Integrity (P3) — not addressed this pass.** No AI wrapper, no peer-review workflow (depends on Assignment — see T060–T070), no academic-integrity investigation workflow exists. Not attempted (lowest priority tier, P3).

**Checkpoint**: All 9 user stories independently functional.

---

## Phase 12: Polish & Cross-Cutting Concerns

- [~] T123 [P] Security: server-side entitlement checks (pre-existing `access-evaluator.service.ts`, reused by this session's new endpoints), audit logs (`recordAuditEvent` on every org-assignment action), rate limiting (shared middleware) all real. No signed media/malware-scan (no upload pipeline exists), no quiz/submission/certificate protections (those systems don't exist).
- [ ] T121–T122, T124–T127 **Notification/email wiring, accessibility pass, performance pass, error-taxonomy verification, and full-`quickstart.md` validation — not addressed this pass.** This session validated only the two stories actually built (US1 gaps + US2) via the automated test suite (7 new tests this pass — 3 backend, 4 frontend — plus the full pre-existing suite re-run clean: 462/468 backend, 99/99 frontend) and a live curl walkthrough against the running dev server (documented in the final report), not the full 9-story quickstart.

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
