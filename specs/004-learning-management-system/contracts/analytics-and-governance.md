# Contracts: Analytics, Academic Integrity & Recommendations

See [README.md](./README.md) for conventions. Paths relative to `/api/v1/lms`. `LmsSettings` endpoints are documented in [catalog-and-content.md](./catalog-and-content.md#admin-lms-settings-adminsettingspermission--coursesettingsmanage).

## Analytics (`analyticsView` = `course.view`, admin only)

All analytics are computed live from the underlying `LessonProgress`/`ActivityProgress`/`QuizAttempt`/`Submission`/`Enrollment`/`LearningEvent` rows at request time — no separate materialized analytics table, no scheduled aggregation job.

| Method | Path | Notes |
|---|---|---|
| GET | `/admin/enrollments/:id/analytics` | Per-enrollment progress/time-spent/quiz-score detail |
| GET | `/admin/enrollments/:id/at-risk` | Single-enrollment at-risk signal (e.g. inactivity threshold, low quiz scores) — a computed flag, not a stored classification |
| GET | `/admin/courses/:id/analytics` | Course-level rollup: enrollment counts, completion rate, average progress, rating, **`deviceDistribution`** (derived from `ActivityProgress.lastUserAgent` — real, not placeholder, since the PiP/telemetry batch) |
| GET | `/admin/courses/:id/calendar` | Cohort/module schedule view — `CohortModuleSchedule.unlockAt` dates rendered as a calendar; `course.view`, not `analyticsView` |
| GET | `/admin/courses/:id/at-risk-learners` | Course-wide at-risk learner list |
| GET | `/admin/lessons/:lessonId/analytics` | Per-lesson completion rate, average time spent, drop-off signal |
| GET | `/admin/courses/:id/lessons/analytics` | All lessons in a course, same shape as above, batched |

## Academic integrity (`adminIntegrityPermission` = `course.academicIntegrity.manage`)

Reuses Spec 001's `TrustSafetyCase`/`Appeal` state machine — there is no dedicated LMS integrity-case model. `TrustSafetyCaseType` gained six LMS-specific values (`PLAGIARISM`, `UNAUTHORIZED_COLLABORATION`, `IDENTITY_FRAUD`, `QUIZ_CHEATING`, `FABRICATED_SUBMISSION`, `CERTIFICATE_FRAUD`); `TrustSafetyTargetType` gained three (`SUBMISSION`, `QUIZ_ATTEMPT`, `CERTIFICATE`).

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/admin/academic-integrity/cases` | `flagForInvestigationSchema`: `{ targetType, targetId, caseType, description }` | Creates a `TrustSafetyCase` scoped to one of the three LMS target types |
| GET | `/admin/academic-integrity/cases` | `listAcademicIntegrityCasesQuerySchema` | Filter by `caseType`/`status`/`targetType` |
| GET | `/admin/academic-integrity/cases/:caseId` | | |
| POST | `/admin/academic-integrity/cases/:caseId/resolve` | `resolveInvestigationSchema`: `{ outcome, notes }` | May trigger a downstream action depending on outcome (e.g. certificate revocation is a *separate* explicit call, not automatic) |
| POST | `/admin/academic-integrity/appeals/:appealId/resolve` | `resolveIntegrityAppealSchema` | Resolves a learner-filed `Appeal` against a case |

There is no vendor-backed similarity/plagiarism-detection integration — flagging is entirely manual (an admin/instructor opens a case), supplemented only by the learner's own `Submission.declaredOriginal` affirmation captured at submit time.

| Method | Path | Notes |
|---|---|---|
| GET | `/me/academic-integrity/cases` | `meBaseline` — the caller's own cases only (as the target's owning user), read-only; a learner cannot open or resolve a case |

## Recommendations & catalog (learner-personalized)

| Method | Path | Notes |
|---|---|---|
| GET | `/me/recommendations` | `meBaseline` — course suggestions derived from the caller's enrollment/completion history and category overlap; a deterministic rule-based ranking, not an ML/AI recommendation service (no AI platform dependency — Spec 008 territory, not built) |
| GET | `/me/catalog` | `meBaseline` — personalized catalog view (adds the caller's own enrollment/wishlist/waitlist status onto each course row); distinct from the public `GET /courses` |
