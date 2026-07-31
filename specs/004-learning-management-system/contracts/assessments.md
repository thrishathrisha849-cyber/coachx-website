# Contracts: Assessments (Quizzes & Question Bank)

See [README.md](./README.md) for conventions. Paths relative to `/api/v1/lms`.

## Admin: Quiz authoring (`manageModules` = `course.module.manage`, reads = `course.view`)

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/admin/lessons/:lessonId/quiz` | `createQuizSchema`: `title`, `passingScorePercent`, `maxAttempts?`, `timeLimitMinutes?` | One quiz per lesson (1:1) |
| GET | `/admin/lessons/:lessonId/quiz` | | |
| GET | `/admin/quizzes/:quizId` | | |
| PATCH | `/admin/quizzes/:quizId` | `updateQuizSchema` | |
| POST | `/admin/quizzes/:quizId/status` | `changeQuizStatusSchema` | `DRAFT ↔ PUBLISHED ↔ ARCHIVED` |
| POST | `/admin/quizzes/:quizId/questions` | `createQuestionSchema` | Body varies by `type`; choice types (`MULTIPLE_CHOICE`/`MULTIPLE_SELECT`/`TRUE_FALSE`) include nested `options[]` with `isCorrect`; `SHORT_ANSWER`/`FILL_BLANK`/`NUMERIC` require `answerKey` (`{acceptedAnswers}` or `{correctValue, tolerance}`) |
| PATCH | `/admin/questions/:questionId` | `updateQuestionSchema` | |
| POST | `/admin/questions/:questionId/archive` | | Soft delete — historical `QuizAnswer` rows referencing this question remain interpretable |
| POST | `/admin/quizzes/:quizId/questions/reorder` | `reorderQuestionsSchema` | |

## Admin: Question Bank (course-scoped, reusable question templates)

| Method | Path | Request | Notes |
|---|---|---|---|
| POST | `/admin/courses/:courseId/question-bank` | `createBankItemSchema` | `category`, `difficulty`, `learningObjective`, `tags[]`; created with `reviewStatus = PENDING` by default |
| GET | `/admin/courses/:courseId/question-bank` | `listBankItemsQuerySchema` | Filter by `category`/`difficulty`/`reviewStatus` |
| GET | `/admin/question-bank/:itemId` | | |
| PATCH | `/admin/question-bank/:itemId` | `updateBankItemSchema` | Can change `reviewStatus` to `APPROVED` — only `APPROVED` items are eligible for generation |
| POST | `/admin/question-bank/:itemId/archive` | | |
| POST | `/admin/quizzes/:quizId/generate-from-bank` | `generateQuestionsFromBankSchema`: `{ count, category?, difficulty? }` | Randomly draws `count` `APPROVED` bank items matching the filter and **copies** each into a new `Question`/`QuestionOption` pair on the target quiz — a one-time copy, not a live reference; increments each drawn item's `usageCount`. `409 CONFLICT` if fewer than `count` matching approved items exist |

## Instructor self-service

Instructors have **no** quiz/question/question-bank authoring endpoints under `/instructor/*` — quiz authoring remains admin-`manageModules`-only in the implemented API, unlike module/lesson/activity authoring which instructors can do for their own courses.

## Learner: taking a quiz

| Method | Path | Request | Notes |
|---|---|---|---|
| GET | `/me/quizzes/:quizId` | | Quiz metadata + the caller's attempt history (`attemptNumber`s, scores, `passed`) — never leaks `answerKey`/`isCorrect` for un-submitted attempts |
| POST | `/me/quizzes/:quizId/attempts` | optional `Idempotency-Key` | Creates a new `QuizAttempt` with server-assigned `attemptNumber` (1-based, per enrollment+quiz); `403` with `details.code = QUIZ_ATTEMPT_LIMIT_REACHED` once `maxAttempts` exhausted; if `timeLimitMinutes` set, `expiresAt` is computed and returned |
| GET | `/me/quiz-attempts/:attemptId` | | Ownership-checked; while `IN_PROGRESS`, returns questions without `isCorrect`/`explanation`; once `GRADED`, includes correct-answer review data only if `Quiz.showCorrectAnswers = true` |
| POST | `/me/quiz-attempts/:attemptId/answers/:questionId` | `submitAnswerSchema`: `{ selectedOptionIds? }` or `{ answerText? }` depending on question type | Upserts one `QuizAnswer` row per question; rejected (`409`) if the attempt has expired (`expiresAt` passed) or is not `IN_PROGRESS` |
| POST | `/me/quiz-attempts/:attemptId/submit` | | Transitions `IN_PROGRESS → SUBMITTED → GRADED` in one call — grading is synchronous (auto-scored for choice/numeric/short-answer types against `answerKey`), computes `pointsEarned`/`scorePercent`/`passed`, and feeds `LearningStreak` if this is a qualifying pass |

An expired, un-submitted attempt is not proactively closed by a background job — its `status` is corrected to `EXPIRED` the next time it's read or acted on (read-time evaluation, same pattern as waitlist offers).
