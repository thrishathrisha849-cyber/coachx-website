---
description: "Quickstart: Feature 004 — Learning Management System"
---

# Quickstart: Learning Management System

**Status**: Created in the Cross-cutting Polish batch (T127, 2026-07-30) — this file is referenced in `plan.md`'s own documentation-artifact list but was never produced during the original Phase 0/1 planning pass. Written retroactively against the REAL, already-built system rather than as a pre-implementation plan, so every step below reflects actual routes/behavior verified during this feature's implementation, not aspirational design.

This is a manual (curl-based) walkthrough of all 9 user stories' **Independent Test** criteria from `spec.md`, in priority order. Each section names the exact acceptance criterion it proves, the concrete steps to prove it, and its current, honest build status (every claim below is cross-referenced against a real batch's own live-verification record in `tasks.md`).

## Prerequisites

- Backend running (`npm run dev` in `backend/`) against a real Postgres database (`coachx_dev` or equivalent), migrated (`npx prisma migrate deploy`).
- An admin account (`platform_admin` role) and at least one learner account, both ACTIVE and email-verified. Every batch this session used a throwaway `scratch-live-*.ts` script (`connectDatabase`/`createUserWithPassword`/`assignDefaultRole` from `src/auth/*`) to create these directly against the DB, bypassing email-verification-link capture — the same approach works here.
- `$ADMIN_TOKEN` / `$LEARNER_TOKEN` — access tokens from `POST /api/v1/auth/login`.
- Base URL: `http://localhost:4000/api/v1` (adjust to your environment).

---

## US1 — Enroll and Gain Access via an Entitlement Type (P1)

**Proves**: "enrolling a test learner in a course under each entitlement source... confirming lesson content is served only after server-side entitlement verification, with each unsupported case producing the correct failure reason."

**Built by**: Foundational + US1 batches (pre-session) + this session's Waitlist/Wishlist batches for the capacity-related edge cases.

1. Create + publish a FREE course with one module/lesson as admin (`POST /admin/courses`, `.../modules`, `.../lessons`, then the 3-step `POST /admin/courses/:id/status` DRAFT→SUBMITTED_FOR_REVIEW→APPROVED→PUBLISHED chain).
2. As the learner: `POST /me/enrollments { courseId }` → expect `201`, `status: "ACTIVE"`.
3. `GET /me/lessons/:lessonId` → expect `200` with full lesson content (server-verified entitlement, not a client-trusted flag).
4. As a SECOND, non-enrolled learner: `GET /me/lessons/:lessonId` → expect `403` with `error.details.reason: "ENROLLMENT_REQUIRED"` (the real, centralized `AccessDenialReason` taxonomy — see `access-evaluator.service.ts`).
5. Capacity: set `enrollmentLimit: 1` on the course at creation, enroll one learner, then attempt a second → expect `409` with `error.details.code: "COURSE_FULL"` (Error-code taxonomy batch), and confirm `POST /me/waitlist` (Waitlist batch, FR-028/029) accepts a join instead.

**Status**: ✅ Fully built and independently tested across the Waitlist/Wishlist/Error-code-taxonomy batches' own integration suites.

---

## US2 — Consume Lessons and Track Multi-Condition Completion (P1)

**Proves**: "configuring a lesson with a multi-condition completion rule, consuming it partially..., confirming it remains incomplete, then satisfying all conditions and confirming completion is recorded."

1. Create a lesson with `completionRuleTypes: ["MINIMUM_WATCH_PERCENT", "ALL_ACTIVITIES_VIEWED"]` and one DOWNLOAD-type activity.
2. As the learner, update progress to 40% watched (`POST /me/lessons/:id/progress`) → `GET /me/courses/:id/curriculum` shows the lesson still NOT completed.
3. Mark the activity viewed (`POST /me/activities/:id/viewed`) but stay under the watch threshold → still not completed (proves the AND-combination, not an OR-shortcut).
4. Update progress to ≥ the configured `defaultVideoWatchThresholdPercent` (`LmsSettings` — LMS-wide Settings batch) → lesson flips to `COMPLETED`, `completion.service.ts`'s `maybeAutoCompleteFromProgress` fires server-side.
5. Offline/multi-device sync: `updateLessonProgress` accepts an `Idempotency-Key` header — replaying the same key returns the identical cached result rather than double-processing (same pattern quiz/assignment submission use).

**Status**: ✅ Fully built (Foundational + US2 batches). Offline QUEUE sync itself (mobile-side) is honestly out of scope — no mobile app exists in this repo (T040/T046-T048).

---

## US3 — Attempt a Quiz or Assessment (P1)

**Proves**: "taking it once to fail and once to pass, and confirming the result screen, retake eligibility, and downstream lesson/module unlock all reflect the correct state."

1. Admin creates a quiz (`POST /admin/lessons/:lessonId/quiz`) with `maxAttempts: 2`, `passingScorePercent: 70`, adds questions, publishes.
2. Learner: `POST /me/quizzes/:quizId/attempts` → answer below the passing threshold → `POST /me/quiz-attempts/:id/submit` → `status: "GRADED"`, `passed: false`.
3. Second attempt, answer correctly → `passed: true`; confirm the lesson/module now shows unlocked downstream content gated on `QUIZ_PASS`.
4. A third attempt request → `409` with `error.details.code: "QUIZ_ATTEMPT_LIMIT_REACHED"` (Error-code taxonomy batch).
5. Time-limit auto-submit and duplicate-submission idempotency are covered by `quiz-attempt.service.ts`'s own integration suite (11 backend tests, Quiz System batch).

**Status**: ✅ Fully built and tested (Quiz System batch).

---

## US4 — Submit an Assignment and Receive Rubric-Graded Feedback (P1)

**Proves**: "submitting a file-upload assignment, having an instructor score it against a rubric and request changes, resubmitting, and confirming the instructor approves it."

1. Admin creates an assignment + rubric criteria, publishes.
2. Learner: `POST /me/assignments/:id/submissions` → `PATCH /me/submissions/:id` (draft) → `POST /me/submissions/:id/submit` with `{ declaredOriginal: true }` — **required** since the Academic-integrity batch (a `false`/omitted value is rejected with `400`, not silently ignored).
3. Admin: `POST /admin/submissions/:id/review { decision: "REQUEST_CHANGES", criterionScores: [...] }` → submission status `CHANGES_REQUESTED`.
4. Learner starts a NEW attempt (`POST /me/assignments/:id/submissions` again — `startOrResumeSubmission` only allows this once the prior one is `CHANGES_REQUESTED`), resubmits.
5. Admin approves (`decision: "APPROVE"`) → `status: "APPROVED"`, contributes to completion.

**Status**: ✅ Fully built and tested (Assignment System batch + Academic-integrity batch's originality-declaration gate).

---

## US5 — Earn and Publicly Verify a Certificate (P1)

**Proves**: "bringing a test learner to 100% eligibility, confirming certificate generation..., then visiting the public verification URL as an anonymous, logged-out user."

1. Bring a learner to full eligibility (complete all mandatory lessons/quizzes/assignments on a `certificateAvailable: true` course).
2. `GET /me/courses/:id/certificate-eligibility` → `eligible: true`, every condition (including `noActiveMisconductInvestigation` — Academic-integrity batch) satisfied.
3. `POST /me/courses/:id/certificate` → `201`, `credentialId` matching `/^CX-/`, `status: "VALID"`. Confirm a real email was sent (Cross-cutting polish batch, T121: `getEmailAdapter().send(...)` in `generateCertificateForEnrollment`).
4. **No auth header**: `GET /certificates/verify/:credentialId` → `200` with `status: "VALID"`, learner name, course title, issue date — no login required.
5. Admin revokes it (`POST /admin/certificates/:id/revoke`) → re-check step 4 → `status: "REVOKED"` immediately.
6. Academic-integrity cross-check: flag the certificate (`POST /admin/academic-integrity/cases`, `targetType: "CERTIFICATE"`) on an ALREADY-issued certificate → confirm auto-revocation (Academic-integrity batch).

**Status**: ✅ Fully built and tested (Certificate System batch + this session's Error-code-taxonomy, Academic-integrity, and Cross-cutting-polish batches' additions).

---

## US6 — Progress Through Drip-Released, Prerequisite-Gated Content (P2)

**Proves**: "a module to unlock 3 days after enrollment and a second module to require passing the first module's assessment... gains access exactly when the condition is met."

1. Create Module A (`releaseRuleType: "DAYS_AFTER_ENROLLMENT"`, `releaseRuleValue: {"days": 3}`) and Module B (`prerequisiteModuleId: A`, gated on A's quiz via `QUIZ_PASS` completion rule on A's lesson).
2. Enroll a learner on day 0 → `GET /me/courses/:id/curriculum` shows Module A locked with `unlockAt` 3 days out; Module B locked with `PREREQUISITE_NOT_MET`.
3. Circular-dependency guard: attempt to also set A's prerequisite to B → `409` (`module.service.ts`'s `assertNoModulePrerequisiteCycle`).
4. **Cohort schedule** (Cohort entity batch, T085): create a module with `releaseRuleType: "COHORT_SCHEDULE"`, a `Cohort` with a `CohortModuleSchedule` unlock date — confirm every cohort MEMBER unlocks simultaneously at that instant, while a non-member (or a learner in no cohort) fails OPEN (never permanently locked by a schedule that isn't theirs).

**Status**: ✅ Fully built and tested (US6 polish batch + this session's Cohort entity batch, which closed the one real remaining gap here).

---

## US7 — Build and Publish a Course via the Course Builder (P2)

**Proves**: "an instructor... build[s] a complete course through all ten builder steps, submit[s] for review, ha[s] a reviewer request changes, resolve[s] them, get[s] approval, and confirm[s] that only a user holding the separate 'publish' permission can move it to Published."

1. As a `course_instructor` (content-edit only, no publish): build a course via `admin/src/pages/NewCourseWizardPage.tsx` (Cross-cutting-polish-adjacent Onboarding Wizard batch) or the flat `CourseEditorPage.tsx` — both call the same already-tested `/admin/*` endpoints.
2. `POST /admin/courses/:id/status { status: "SUBMITTED_FOR_REVIEW" }` — confirm the instructor's token CANNOT call `.../status` with `PUBLISHED` directly (`course-lifecycle.policy.ts` separates publish from edit permission).
3. As a reviewer: `{ status: "CHANGES_REQUESTED", reviewNote: "..." }` → instructor edits, resubmits.
4. Reviewer approves (`APPROVED`) → only a `platform_admin`/`content_manager`-tier actor can move to `PUBLISHED`.
5. As a plain learner: `GET /courses/:slug` on the still-Draft course → `404` (not just 403 — Draft content is unreachable, not merely permission-denied, per the established "no info leak" convention).
6. Real Course Calendar (T092-T095 batch): `GET /admin/courses/:id/calendar` shows assignment due dates / FIXED_DATE module unlocks / scheduled announcements in one sorted agenda.

**Status**: ✅ Functionally complete (LMS Admin UI batch + Onboarding Wizard & Course Calendar batch). Deliberately narrower than "ten distinct wizard STEPS" for ongoing editing — `CourseEditorPage.tsx` is a flat multi-section editor with full CRUD parity; the NEW `NewCourseWizardPage.tsx` provides the literal step-by-step chrome for course CREATION specifically.

---

## US8 — Clone an Existing Course for Reuse (P2)

**Proves**: "cloning a published course with existing enrollments and progress data using 'curriculum only,' then confirming the new course contains the same modules/lessons but zero enrollments, zero progress records."

1. `POST /admin/courses/:id/clone { mode: "CURRICULUM_ONLY" }` on a course with real enrollments/progress.
2. Confirm the new course has its own ID, the same modules/lessons (deep-copied), but `GET /admin/courses/:newId/enrollments` returns empty, and no `Enrollment`/`LessonProgress` rows reference the new course.
3. Repeat with `mode: "TRANSLATION_VARIANT"` — confirm `Course.translationOfCourseId` links back to the source (Course Translation batch).
4. `mode: "ASSESSMENT_BANK"` — confirmed honestly NOT built (T107): no cross-course-reusable Question/Assignment Bank entity exists; `CourseEditorPage.tsx`'s clone UI disables this option rather than silently no-op'ing it.

**Status**: ✅ FULL_CLONE / CURRICULUM_ONLY / CONTENT_WITHOUT_ENROLLMENTS / CERTIFICATE_SETTINGS / TRANSLATION_VARIANT built and tested (Course Cloning batch). ASSESSMENT_BANK mode remains a real, documented gap (T107).

---

## US9 — Use AI-Assisted Learning and Peer Review Within Integrity Bounds (P3)

**Proves**: "(a) requesting an AI lesson summary... presented as advisory rather than authoritative, and (b) submitting an assignment for peer review, collecting... anonymous rubric-scored reviews, and confirming the instructor can view, weigh, and override the peer score."

1. **(a) AI-assisted learning**: honestly NOT built (T119) — no dedicated FR exists for it (only named in this story's own narrative), and it depends on Feature 008's AI platform, which does not exist in this codebase. No endpoint to call.
2. **(b) Peer review**: `POST /admin/assignments/:id { peerReviewEnabled: true, peerReviewsRequired: 2, peerReviewAnonymous: true }`. Two reviewer-learners: `POST /me/submissions/:id/peer-review` (claim) → `POST /me/peer-reviews/:id/submit` (rubric-scored review).
3. Instructor's own review screen (`GET /admin/submissions/:id`) shows both peer scores/comments alongside the instructor's own scoring UI, with anonymity preserved on the submitter's own view (`GET /me/submissions/:id/peer-reviews` never reveals reviewer identity).
4. Instructor's final `POST /admin/submissions/:id/review` decision is authoritative regardless of peer scores (peer review informs, never auto-overrides).
5. Academic integrity: `POST /admin/academic-integrity/cases { type: "PLAGIARISM", targetType: "SUBMISSION", targetId, reason }` → confirm any not-yet-issued certificate for that course is blocked (`noActiveMisconductInvestigation`), or an already-issued one is auto-revoked; the flagged learner discovers it via `GET /me/academic-integrity/cases` and appeals via the existing generic `POST /trust-safety/cases/:caseId/appeal`.

**Status**: Peer review + academic-integrity investigation workflow ✅ fully built and tested (Peer Review batch + Academic-integrity batch). AI-assisted learning ❌ honestly out of scope, blocked on Feature 008.

---

## Summary

| Story | Priority | Status |
|---|---|---|
| US1 Enrollment/Entitlement | P1 | ✅ Complete |
| US2 Lesson Consumption | P1 | ✅ Complete |
| US3 Quiz | P1 | ✅ Complete |
| US4 Assignment | P1 | ✅ Complete |
| US5 Certificate | P1 | ✅ Complete |
| US6 Drip/Prerequisite/Cohort | P2 | ✅ Complete |
| US7 Course Builder | P2 | ✅ Functionally complete (wizard chrome added T092-T095) |
| US8 Course Cloning | P2 | ✅ Complete except ASSESSMENT_BANK mode (T107, real gap) |
| US9 AI + Peer Review | P3 | Peer review + academic integrity ✅; AI-assisted learning ❌ (blocked on Feature 008) |

**Genuinely open, cross-cutting gaps** (not story-specific): Program/LearningPath entity (T004), cross-course Question/Assignment Bank (T107), broader assessment types (T057), instructor feedback formats beyond text (T067-T068), video/CDN + Live Class provider (T002/T011/T032-T033/T038), mobile + offline sync (T040/T046-T048), reminder/notification scheduler and Google Calendar sync (T092-T095's honestly-out-of-scope items), refund-driven access policy (T025, needs Volume 09 Payments).
