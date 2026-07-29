import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import { beginIdempotentOperation } from '../database/idempotency.service';
import { scopedIdempotencyKey } from './lms-idempotency.util';
import { findLessonById } from './lesson.repository';
import { findModuleById } from './module.repository';
import { evaluateLessonAccess } from './access-evaluator.service';
import { findEnrollmentForUserAndCourse, findEnrollmentById } from './enrollment.repository';
import { maybeAutoCompleteFromQuizPass } from './completion.service';
import { recordLearningEvent } from './learning-event.service';
import {
  findQuizById,
  findPublishedQuestionsByQuiz,
  findQuestionsByQuiz,
  findQuestionByIdIncludingDeleted,
  findAttemptsForEnrollmentQuiz,
  findAttemptById,
  createAttempt,
  updateAttempt,
  upsertAnswer,
  findAnswersForAttempt,
  updateAnswerGrading,
} from './quiz.repository';
import { toPublicQuestion, toPublicQuiz } from './quiz.serializers';
import type { GradedQuestionReview, PublicQuiz, QuizAttemptResult, QuizAttemptWithQuestions, QuizAttemptWithReview } from './quiz.types';

interface ResolvedQuizContext {
  quiz: Awaited<ReturnType<typeof findQuizById>>;
  courseId: string;
  enrollmentId: string;
}

/** Resolves + access-checks a quiz via its lesson, exactly like every other content path (`evaluateLessonAccess`) — never a bespoke check. */
async function resolveQuizContext(userId: string, quizId: string): Promise<ResolvedQuizContext> {
  const quiz = await findQuizById(quizId);
  if (!quiz || quiz.status !== 'PUBLISHED') throw AppError.notFound('Quiz not found');

  const lesson = await findLessonById(quiz.lessonId);
  if (!lesson) throw AppError.notFound('Quiz not found');
  const module_ = await findModuleById(lesson.moduleId);
  if (!module_) throw AppError.notFound('Quiz not found');

  const access = await evaluateLessonAccess(userId, module_.courseId, lesson.id);
  if (!access.allowed) throw AppError.forbidden(access.message);
  if (access.viaPreview) throw AppError.badRequest('Enroll in this course to take this quiz');

  const enrollment = await findEnrollmentForUserAndCourse(userId, module_.courseId);
  if (!enrollment) throw AppError.notFound('Enrollment not found');

  return { quiz, courseId: module_.courseId, enrollmentId: enrollment.id };
}

/** GET /me/quizzes/:quizId — metadata only, no questions/answers (FR-020-style overview before starting). */
export async function getQuizOverviewForLearner(userId: string, quizId: string): Promise<PublicQuiz> {
  const { quiz } = await resolveQuizContext(userId, quizId);
  const questions = await findPublishedQuestionsByQuiz(quiz!.id);
  return toPublicQuiz(quiz!, questions.length);
}

function isExpired(attempt: { expiresAt: Date | null; status: string }): boolean {
  return attempt.status === 'IN_PROGRESS' && attempt.expiresAt !== null && attempt.expiresAt <= new Date();
}

/**
 * FR-063 acceptance scenario 1 — a timer-expired IN_PROGRESS attempt is
 * auto-submitted and scored, never silently lost. Called defensively
 * whenever an IN_PROGRESS attempt is touched (start/answer/fetch/submit).
 */
async function autoSubmitIfExpired(attemptId: string, actorId: string): Promise<boolean> {
  const attempt = await findAttemptById(attemptId);
  if (!attempt || !isExpired(attempt)) return false;
  await gradeAndFinalizeAttempt(attemptId, actorId);
  return true;
}

/**
 * FR-065 attempt flow — eligibility check, then starts a new attempt or
 * resumes the existing IN_PROGRESS one (never a second concurrent attempt
 * for the same enrollment+quiz).
 */
export async function startOrResumeAttempt(userId: string, quizId: string): Promise<QuizAttemptWithQuestions> {
  const { quiz, courseId, enrollmentId } = await resolveQuizContext(userId, quizId);

  const existingAttempts = await findAttemptsForEnrollmentQuiz(enrollmentId, quizId);
  const inProgress = existingAttempts.find((a) => a.status === 'IN_PROGRESS');

  if (inProgress) {
    if (isExpired(inProgress)) {
      await gradeAndFinalizeAttempt(inProgress.id, userId);
    } else {
      return attachQuestions(inProgress, await findPublishedQuestionsByQuiz(quizId));
    }
  }

  const finalizedCount = (await findAttemptsForEnrollmentQuiz(enrollmentId, quizId)).filter((a) => a.status !== 'IN_PROGRESS').length;
  if (quiz!.maxAttempts !== null && finalizedCount >= quiz!.maxAttempts) {
    throw new AppError(
      'You have used all of your allowed attempts for this quiz',
      409 as never,
      'QUIZ_ATTEMPT_LIMIT_REACHED',
      { maxAttempts: quiz!.maxAttempts, attemptsUsed: finalizedCount },
    );
  }

  const questions = await findPublishedQuestionsByQuiz(quizId);
  if (questions.length === 0) throw AppError.badRequest('This quiz has no questions yet');

  const attempt = await withTransaction(async (tx) => {
    const created = await createAttempt(
      {
        quiz: { connect: { id: quizId } },
        enrollment: { connect: { id: enrollmentId } },
        attemptNumber: finalizedCount + 1,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        expiresAt: quiz!.timeLimitMinutes ? new Date(Date.now() + quiz!.timeLimitMinutes * 60_000) : null,
      },
      tx,
    );
    await recordAuditEvent(
      { actorType: 'USER', actorId: userId, action: 'lms.quiz_attempt.started', resourceType: 'quiz_attempt', resourceId: created.id, metadata: { quizId, attemptNumber: created.attemptNumber } },
      tx,
    );
    await recordLearningEvent(
      { eventType: 'QUIZ_STARTED', userId, courseId, lessonId: quiz!.lessonId, enrollmentId, metadata: { quizId, attemptNumber: created.attemptNumber } },
      tx,
    );
    return created;
  });

  return attachQuestions(attempt, questions);
}

function attachQuestions(attempt: AttemptCoreFields, questions: QuestionRow[]): QuizAttemptWithQuestions {
  return { ...toAttemptResult(attempt), questions: questions.map(toPublicQuestion) };
}

type QuestionRow = Awaited<ReturnType<typeof findPublishedQuestionsByQuiz>>[number];

/** The subset of `QuizAttempt` fields every result/summary shape needs — deliberately NOT derived from `findAttemptById`'s return type, since some call sites (e.g. `findAttemptsForEnrollmentQuiz`'s list) don't include the `answers` relation that function's shape requires. */
interface AttemptCoreFields {
  id: string;
  quizId: string;
  attemptNumber: number;
  status: string;
  startedAt: Date;
  expiresAt: Date | null;
  submittedAt: Date | null;
  gradedAt: Date | null;
  pointsPossible: number | null;
  pointsEarned: number | null;
  scorePercent: number | null;
  passed: boolean | null;
}

function toAttemptResult(attempt: AttemptCoreFields): QuizAttemptResult {
  return {
    id: attempt.id,
    quizId: attempt.quizId,
    attemptNumber: attempt.attemptNumber,
    status: attempt.status,
    startedAt: attempt.startedAt,
    expiresAt: attempt.expiresAt,
    submittedAt: attempt.submittedAt,
    gradedAt: attempt.gradedAt,
    pointsPossible: attempt.pointsPossible,
    pointsEarned: attempt.pointsEarned,
    scorePercent: attempt.scorePercent,
    passed: attempt.passed,
  };
}

async function assertOwnAttempt(userId: string, attemptId: string) {
  const attempt = await findAttemptById(attemptId);
  if (!attempt) throw AppError.notFound('Quiz attempt not found');

  const quiz = await findQuizById(attempt.quizId);
  if (!quiz) throw AppError.notFound('Quiz attempt not found');
  const enrollment = await findEnrollmentForUserAndCourse(userId, (await findModuleById((await findLessonById(quiz.lessonId))!.moduleId))!.courseId);
  if (!enrollment || enrollment.id !== attempt.enrollmentId) throw AppError.notFound('Quiz attempt not found');

  return attempt;
}

/** POST /me/quiz-attempts/:attemptId/answers/:questionId — autosave, per FR-065's "auto-save answers." */
export async function saveAnswer(
  userId: string,
  attemptId: string,
  questionId: string,
  input: { selectedOptionIds?: string[]; answerText?: string },
): Promise<void> {
  const attempt = await assertOwnAttempt(userId, attemptId);

  if (await autoSubmitIfExpired(attemptId, userId)) {
    throw AppError.conflict('This attempt\'s time limit has expired — it was automatically submitted and scored', { attemptId });
  }
  if (attempt.status !== 'IN_PROGRESS') {
    throw AppError.conflict('This attempt has already been submitted');
  }

  const question = await findQuestionByIdIncludingDeleted(questionId);
  if (!question || question.quizId !== attempt.quizId) throw AppError.badRequest('Question does not belong to this quiz attempt');

  await upsertAnswer(attemptId, questionId, {
    selectedOptionIds: input.selectedOptionIds ?? [],
    answerText: input.answerText ?? null,
  });
}

function gradeOneAnswer(
  question: NonNullable<Awaited<ReturnType<typeof findQuestionByIdIncludingDeleted>>>,
  answer: { selectedOptionIds: string[]; answerText: string | null } | undefined,
): { isCorrect: boolean; pointsAwarded: number } {
  if (!answer) return { isCorrect: false, pointsAwarded: 0 };

  switch (question.type) {
    case 'SINGLE_CHOICE':
    case 'TRUE_FALSE': {
      const correctId = question.options.find((o) => o.isCorrect)?.id;
      const isCorrect = answer.selectedOptionIds.length === 1 && answer.selectedOptionIds[0] === correctId;
      return { isCorrect, pointsAwarded: isCorrect ? question.points : 0 };
    }
    case 'MULTIPLE_CHOICE': {
      const correctIds = new Set(question.options.filter((o) => o.isCorrect).map((o) => o.id));
      const selectedIds = new Set(answer.selectedOptionIds);
      const isCorrect = correctIds.size === selectedIds.size && [...correctIds].every((id) => selectedIds.has(id));
      return { isCorrect, pointsAwarded: isCorrect ? question.points : 0 };
    }
    case 'NUMERIC': {
      const key = question.answerKey as { correctValue?: number; tolerance?: number } | null;
      const submitted = answer.answerText !== null ? Number(answer.answerText) : NaN;
      const tolerance = key?.tolerance ?? 0;
      const isCorrect = key?.correctValue !== undefined && !Number.isNaN(submitted) && Math.abs(submitted - key.correctValue) <= tolerance;
      return { isCorrect, pointsAwarded: isCorrect ? question.points : 0 };
    }
    case 'SHORT_ANSWER':
    case 'FILL_BLANK':
    default: {
      const key = question.answerKey as { acceptedAnswers?: string[] } | null;
      const normalized = (answer.answerText ?? '').trim().toLowerCase();
      const isCorrect = Boolean(normalized) && (key?.acceptedAnswers ?? []).some((a) => a.trim().toLowerCase() === normalized);
      return { isCorrect, pointsAwarded: isCorrect ? question.points : 0 };
    }
  }
}

/**
 * Server-side grading + finalization, shared by both the learner-initiated
 * submit path and the timer-expiry auto-submit path. Idempotent by
 * construction: re-grading an already-GRADED attempt is a no-op (returns
 * the existing result) — never re-scores or double-audits.
 *
 * FR-066 edge case (question deleted after an attempt): grading always
 * reads the question via `findQuestionByIdIncludingDeleted`, so a
 * since-archived question a learner already answered still grades
 * correctly; `pointsPossible` only counts a question that is either still
 * PUBLISHED (presented to everyone) or has a recorded answer on THIS
 * attempt (so archiving a question mid-attempt can't retroactively shrink
 * an attempt that already answered it).
 */
async function gradeAndFinalizeAttempt(attemptId: string, actorId: string): Promise<QuizAttemptResult> {
  const attempt = await findAttemptById(attemptId);
  if (!attempt) throw AppError.notFound('Quiz attempt not found');
  if (attempt.status === 'GRADED') return toAttemptResult(attempt);

  const quiz = await findQuizById(attempt.quizId);
  if (!quiz) throw AppError.notFound('Quiz not found');

  // Built from the UNION of (a) currently PUBLISHED questions (presented to
  // every attempt) and (b) whatever question each existing QuizAnswer
  // actually points at, fetched via `findQuestionByIdIncludingDeleted` —
  // NOT `findQuestionsByQuiz`, whose `includeArchived` flag only widens the
  // `status` filter and still unconditionally excludes soft-deleted rows
  // (an archived question always has `deletedAt` set — see
  // `quiz.service.ts`'s `archiveQuestion`). Without this union, a question
  // archived mid-attempt would silently vanish from grading entirely,
  // defeating the FR-066 historical-integrity guarantee this function
  // exists to provide.
  const publishedQuestions = await findQuestionsByQuiz(attempt.quizId, false);
  const answers = await findAnswersForAttempt(attemptId);
  const answersByQuestion = new Map(answers.map((a) => [a.questionId, a]));

  const questionsById = new Map(publishedQuestions.map((q) => [q.id, q]));
  for (const questionId of answersByQuestion.keys()) {
    if (!questionsById.has(questionId)) {
      const question = await findQuestionByIdIncludingDeleted(questionId);
      if (question) questionsById.set(questionId, question);
    }
  }

  return withTransaction(async (tx) => {
    let pointsPossible = 0;
    let pointsEarned = 0;

    for (const question of questionsById.values()) {
      const answer = answersByQuestion.get(question.id);

      pointsPossible += question.points;
      if (answer) {
        const graded = gradeOneAnswer(question, answer);
        pointsEarned += graded.pointsAwarded;
        await updateAnswerGrading(answer.id, graded.isCorrect, graded.pointsAwarded, tx);
      }
    }

    const scorePercent = pointsPossible > 0 ? Math.round((pointsEarned / pointsPossible) * 100) : 0;
    const passed = scorePercent >= quiz.passingScorePercent;
    const now = new Date();

    const updated = await updateAttempt(
      attemptId,
      {
        status: 'GRADED',
        submittedAt: attempt.submittedAt ?? now,
        gradedAt: now,
        pointsPossible,
        pointsEarned,
        scorePercent,
        passed,
      },
      tx,
    );

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.quiz_attempt.graded', resourceType: 'quiz_attempt', resourceId: attemptId, afterState: { scorePercent, passed } },
      tx,
    );

    // FR-109 — the owning enrollment is fetched fresh (not derived from
    // `actorId`) for the same reason `completion.service.ts`'s
    // `completeLessonForEnrollment` does: `actorId` can be an admin/
    // instructor override in principle, the enrollment's own `userId` is
    // the only reliable "whose learning event is this" source.
    const owningEnrollment = await findEnrollmentById(attempt.enrollmentId, tx);
    if (owningEnrollment) {
      await recordLearningEvent(
        {
          eventType: 'QUIZ_SUBMITTED',
          userId: owningEnrollment.userId,
          courseId: owningEnrollment.courseId,
          lessonId: quiz.lessonId,
          enrollmentId: attempt.enrollmentId,
          metadata: { attemptId, scorePercent, passed },
        },
        tx,
      );
      await recordLearningEvent(
        {
          eventType: passed ? 'QUIZ_PASSED' : 'QUIZ_FAILED',
          userId: owningEnrollment.userId,
          courseId: owningEnrollment.courseId,
          lessonId: quiz.lessonId,
          enrollmentId: attempt.enrollmentId,
          metadata: { attemptId, scorePercent },
        },
        tx,
      );
    }

    return toAttemptResult(updated);
  }).then(async (result) => {
    // FR-052 QUIZ_PASS completion-rule signal — fires regardless of
    // WHICH path triggered grading (explicit submit or timer-expiry
    // auto-submit), reusing the shared completion evaluator rather than a
    // bespoke quiz-only check.
    await maybeAutoCompleteFromQuizPass(actorId, quiz.lessonId);
    return result;
  });
}

/**
 * POST /me/quiz-attempts/:attemptId/submit — FR-065's "require submit
 * confirmation → server calculates or queues grading." Wrapped in the
 * shared idempotency infrastructure (same pattern as lesson completion/
 * enrollment) — a rapid double-click or a network-interruption retry
 * (FR-066 acceptance scenario 4) replays the SAME graded result rather
 * than re-grading or creating a second outcome.
 */
export async function submitAttempt(userId: string, attemptId: string, idempotencyKey?: string): Promise<QuizAttemptResult> {
  const attempt = await assertOwnAttempt(userId, attemptId);

  const key = scopedIdempotencyKey(userId, idempotencyKey, attemptId);
  const outcome = await beginIdempotentOperation<QuizAttemptResult>('lms.quiz_attempt.submit', key, { attemptId });

  if (outcome.status === 'replayed') {
    if (!outcome.response) throw AppError.internal('Idempotent quiz submission has no cached response');
    return outcome.response;
  }
  if (outcome.status === 'in-progress') {
    throw AppError.conflict('A submission for this attempt is already in progress');
  }

  try {
    if (attempt.status === 'GRADED') {
      const result = toAttemptResult(attempt);
      await outcome.complete(result);
      return result;
    }

    const result = await gradeAndFinalizeAttempt(attemptId, userId);
    await outcome.complete(result);
    return result;
  } catch (error) {
    await outcome.fail();
    throw error;
  }
}

/** GET /me/quiz-attempts/:attemptId — resumes an in-progress attempt, or shows the graded result/review. */
export async function getAttemptForLearner(userId: string, attemptId: string): Promise<QuizAttemptWithQuestions | QuizAttemptWithReview> {
  await assertOwnAttempt(userId, attemptId);
  await autoSubmitIfExpired(attemptId, userId);

  const attempt = await findAttemptById(attemptId);
  if (!attempt) throw AppError.notFound('Quiz attempt not found');

  const quiz = await findQuizById(attempt.quizId);
  if (!quiz) throw AppError.notFound('Quiz not found');

  if (attempt.status === 'IN_PROGRESS') {
    const questions = await findPublishedQuestionsByQuiz(attempt.quizId);
    return attachQuestions(attempt, questions);
  }

  const allQuestions = await findQuestionsByQuiz(attempt.quizId, true);
  const answersByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));

  const questions: GradedQuestionReview[] = allQuestions
    .filter((q) => q.status === 'PUBLISHED' || answersByQuestion.has(q.id))
    .map((q) => {
      const answer = answersByQuestion.get(q.id);
      return {
        ...toPublicQuestion(q),
        explanation: quiz.showCorrectAnswers ? q.explanation : null,
        correctOptionIds: quiz.showCorrectAnswers ? q.options.filter((o) => o.isCorrect).map((o) => o.id) : [],
        yourSelectedOptionIds: answer?.selectedOptionIds ?? [],
        yourAnswerText: answer?.answerText ?? null,
        isCorrect: quiz.showCorrectAnswers ? (answer?.isCorrect ?? false) : null,
        pointsAwarded: answer?.pointsAwarded ?? null,
      };
    });

  return { ...toAttemptResult(attempt), reviewVisible: quiz.showCorrectAnswers, questions };
}
