# Contracts: Assignments, Projects, Submissions & Peer Review

See [README.md](./README.md) for conventions. Paths relative to `/api/v1/lms`.

## Admin: Assignment authoring (`manageModules`)

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/admin/lessons/:lessonId/assignment` | `createAssignmentSchema`: `title`, `instructions`, `submissionFormat`, `maxScore`, `passingScore`, `assessmentType?` (default `STANDARD`) | One assignment per lesson (1:1) |
| GET | `/admin/lessons/:lessonId/assignment` | | |
| GET | `/admin/assignments/:assignmentId` | | |
| PATCH | `/admin/assignments/:assignmentId` | `updateAssignmentSchema` — includes `assessmentType`, `peerReviewEnabled`/`peerReviewsRequired`/`peerReviewAnonymous`/`peerReviewDeadlineDays`/`peerReviewIncludeInGrade` | Changing `assessmentType` after submissions exist does not retroactively alter already-graded `Submission.isSelfAssessed` values |
| POST | `/admin/assignments/:assignmentId/status` | `changeAssignmentStatusSchema` | `DRAFT ↔ PUBLISHED ↔ ARCHIVED` |
| POST | `/admin/assignments/:assignmentId/criteria` | `createCriterionSchema`: `title`, `maxPoints` | |
| PATCH | `/admin/criteria/:criterionId` | `updateCriterionSchema` | |
| POST | `/admin/criteria/:criterionId/archive` | | Soft delete — historical `SubmissionCriterionScore` rows remain interpretable |

## Admin: Projects (multi-artifact grouping — FR-077)

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/admin/modules/:moduleId/projects` | `createProjectSchema`: `title`, `description` | Created `DRAFT`, scoped to a `CourseModule` |
| GET | `/admin/modules/:moduleId/projects` | | `course.view` |
| GET | `/admin/modules/:moduleId/assignments` | | `course.view` — lists candidate standalone assignments in the module eligible to link as project artifacts (i.e. `projectId = null`) |
| GET | `/admin/projects/:projectId` | | `course.view` |
| PATCH | `/admin/projects/:projectId` | `updateProjectSchema` | |
| POST | `/admin/projects/:projectId/status` | `changeProjectStatusSchema` | `DRAFT → PUBLISHED` blocked (`409 CONFLICT`) if the project has zero linked artifacts |
| POST | `/admin/projects/:projectId/artifacts` | `linkArtifactSchema`: `{ assignmentId, position }` | Sets `Assignment.projectId`/`projectPosition`; `409` if the assignment is already linked to a different project, or `position` collides |
| POST | `/admin/projects/:projectId/artifacts/:assignmentId/unlink` | `unlinkArtifactSchema` | Clears `projectId`/`projectPosition`, returning the assignment to standalone status |

## Learner: project status

| Method | Path | Notes |
|---|---|---|
| GET | `/me/projects/:projectId` | Aggregate status across all linked artifact `Submission`s for the caller's enrollment — "N of M required artifacts submitted/passed" |

## Learner: assignments & submissions

| Method | Path | Request | Notes |
|---|---|---|---|
| GET | `/me/assignments/:assignmentId` | | Assignment detail + the caller's submission history |
| POST | `/me/assignments/:assignmentId/submissions` | optional `Idempotency-Key` | Creates a new `Submission` row with server-assigned `attemptNumber`; `403` with `details.code = ASSIGNMENT_ATTEMPT_LIMIT_REACHED` once `maxAttempts` exhausted (unlimited if `maxAttempts` is null, only re-openable after a prior attempt's status is `CHANGES_REQUESTED`) |
| GET | `/me/assignments/:assignmentId/submissions` | | Caller's own submission history only |
| GET | `/me/submissions/:submissionId` | | Ownership-checked |
| PATCH | `/me/submissions/:submissionId` | `saveDraftSchema`: `{ textBody?, linkUrl? }` | Only while `status = DRAFT` |
| POST | `/me/submissions/:submissionId/submit` | `submitSubmissionSchema`: `{ declaredOriginal }` | Only for `assessmentType ∈ {STANDARD, SCENARIO_TASK, PORTFOLIO_REVIEW}` — **rejected** (`409`) for `SELF_ASSESSMENT`/`SKILL_RATING` assignments, which must use `self-assess` instead. Sets `isLate` by comparing against `Assignment.dueAt`. `declaredOriginal` is the FR-116 originality affirmation, captured at this transition |
| POST | `/me/submissions/:submissionId/self-assess` | `submitSelfAssessmentSchema`: `{ criterionScores: [{criterionId, score}], learnerFeedback? }` | Only for `assessmentType ∈ {SELF_ASSESSMENT, SKILL_RATING}` — **rejected** for the other three types. Computes `score`/`passed`/`outcomeLevel` immediately (no instructor review step); sets `isSelfAssessed = true`, `reviewerId = null` |

## Admin/Instructor: reviewing submissions (`manageModules`)

| Method | Path | Request | Notes |
|---|---|---|---|
| GET | `/admin/assignments/:assignmentId/submissions` | `listSubmissionsQuerySchema` | Filter by `status` |
| GET | `/admin/submissions/:submissionId` | | |
| POST | `/admin/submissions/:submissionId/review` | `reviewSubmissionSchema`: `{ status, criterionScores?, reviewerNote?, learnerFeedback? }` | **Rejected** (`409`) if the assignment's `assessmentType ∈ {SELF_ASSESSMENT, SKILL_RATING}` — those are self-scored only. `status` transitions to `APPROVED`/`CHANGES_REQUESTED`/`REJECTED`; computes `outcomeLevel` from `criterionScores` the same way the self-assessment path does |

## Submission feedback thread (flat, chronological — not nested)

| Method | Path | Actor | Notes |
|---|---|---|---|
| POST | `/me/submissions/:submissionId/feedback/viewed` | Learner | Idempotent, sets `feedbackViewedAt` once |
| POST | `/me/submissions/:submissionId/feedback/reply` | Learner | `replyToFeedbackSchema` — creates a `SubmissionFeedbackMessage(type=REPLY)` |
| POST | `/me/submissions/:submissionId/feedback/clarify` | Learner | `requestClarificationSchema` — creates a `SubmissionFeedbackMessage(type=CLARIFICATION_REQUEST)` |
| GET | `/me/submissions/:submissionId/feedback/messages` | Learner | Full thread, ownership-checked |
| POST | `/admin/submissions/:submissionId/feedback/respond` | Instructor/admin | `respondToFeedbackAdminSchema` — always creates `type=REPLY` (instructors don't request clarification) |
| GET | `/admin/submissions/:submissionId/feedback/messages` | Instructor/admin | |

## Peer review (FR-076)

Reviewer self-selects from an open queue — there is no automatic reviewer-matching algorithm.

| Method | Path | Actor | Request | Notes |
|---|---|---|---|---|
| GET | `/me/peer-review-queue` | Learner | | Submissions open for review across the caller's enrolled courses, excluding the caller's own submissions |
| POST | `/me/submissions/:submissionId/peer-review` | Learner | | Claims a review slot — capped at `Assignment.peerReviewsRequired` concurrent claims per submission; self-review rejected |
| POST | `/me/peer-reviews/:peerReviewId/submit` | Learner | `submitPeerReviewSchema`: `{ criterionScores, comment? }` | Scores against the same `RubricCriterion` set as the instructor grade — informational only, never auto-overrides `Submission.score` |
| GET | `/me/submissions/:submissionId/peer-reviews` | Learner | | Submission owner's view of reviews received; anonymized if `peerReviewAnonymous = true` |
| POST | `/admin/peer-reviews/:peerReviewId/moderate` | `manageInstructors` | `moderatePeerReviewSchema`: `{ action: HIDE\|RESTORE, reason }` | Never a hard delete — same moderation pattern as `CourseReview` |
