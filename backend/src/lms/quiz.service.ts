import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import { findLessonById } from './lesson.repository';
import {
  findQuizById,
  findQuizByLessonId,
  createQuiz as createQuizRow,
  updateQuiz as updateQuizRow,
  findQuestionsByQuiz,
  findQuestionById,
  createQuestion as createQuestionRow,
  updateQuestion as updateQuestionRow,
  countQuestionsByQuiz,
  reorderQuestionPositions,
  replaceQuestionOptions,
} from './quiz.repository';
import { toAdminQuiz, toAdminQuizWithQuestions, toAdminQuestion } from './quiz.serializers';
import type { AdminQuiz, AdminQuizWithQuestions, AdminQuestion } from './quiz.types';

// --- Quiz CRUD (admin, reuses `course.module.manage` at the route layer —
// same tier as lesson/activity authoring; no per-instructor ownership
// check at the /admin/* surface, matching the existing lesson/activity
// admin endpoints this batch does not change) -------------------------------

export interface CreateQuizInput {
  title: string;
  instructions?: string;
  quizType: string;
  passingScorePercent: number;
  maxAttempts?: number | null;
  timeLimitMinutes?: number | null;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  showCorrectAnswers: boolean;
}

export async function createQuizForLesson(lessonId: string, input: CreateQuizInput, actorId: string): Promise<AdminQuiz> {
  const lesson = await findLessonById(lessonId);
  if (!lesson) throw AppError.notFound('Lesson not found');

  const existing = await findQuizByLessonId(lessonId);
  if (existing) throw AppError.conflict('This lesson already has a quiz attached');

  const quiz = await createQuizRow({
    lesson: { connect: { id: lessonId } },
    title: input.title,
    instructions: input.instructions ?? null,
    quizType: input.quizType as never,
    passingScorePercent: input.passingScorePercent,
    maxAttempts: input.maxAttempts ?? null,
    timeLimitMinutes: input.timeLimitMinutes ?? null,
    randomizeQuestions: input.randomizeQuestions,
    randomizeAnswers: input.randomizeAnswers,
    showCorrectAnswers: input.showCorrectAnswers,
    createdBy: actorId,
    updatedBy: actorId,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.quiz.created',
    resourceType: 'quiz',
    resourceId: quiz.id,
    afterState: { lessonId, title: input.title },
  });

  return toAdminQuiz(quiz);
}

export async function getQuizAdmin(id: string): Promise<AdminQuizWithQuestions> {
  const quiz = await findQuizById(id);
  if (!quiz) throw AppError.notFound('Quiz not found');
  const questions = await findQuestionsByQuiz(id, true);
  return toAdminQuizWithQuestions(quiz, questions);
}

/** Admin UI lookup: does this lesson already have a quiz attached? (404 if not — lets the admin UI branch between "create" and "manage".) */
export async function getQuizByLessonIdAdmin(lessonId: string): Promise<AdminQuiz> {
  const quiz = await findQuizByLessonId(lessonId);
  if (!quiz) throw AppError.notFound('This lesson has no quiz attached yet');
  return toAdminQuiz(quiz);
}

export async function updateExistingQuiz(id: string, input: Partial<CreateQuizInput>, actorId: string): Promise<AdminQuiz> {
  const existing = await findQuizById(id);
  if (!existing) throw AppError.notFound('Quiz not found');

  const updated = await updateQuizRow(id, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
    ...(input.quizType !== undefined ? { quizType: input.quizType as never } : {}),
    ...(input.passingScorePercent !== undefined ? { passingScorePercent: input.passingScorePercent } : {}),
    ...(input.maxAttempts !== undefined ? { maxAttempts: input.maxAttempts } : {}),
    ...(input.timeLimitMinutes !== undefined ? { timeLimitMinutes: input.timeLimitMinutes } : {}),
    ...(input.randomizeQuestions !== undefined ? { randomizeQuestions: input.randomizeQuestions } : {}),
    ...(input.randomizeAnswers !== undefined ? { randomizeAnswers: input.randomizeAnswers } : {}),
    ...(input.showCorrectAnswers !== undefined ? { showCorrectAnswers: input.showCorrectAnswers } : {}),
    version: { increment: 1 },
    updatedBy: actorId,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.quiz.updated',
    resourceType: 'quiz',
    resourceId: id,
    afterState: input,
  });

  return toAdminQuiz(updated);
}

const VALID_QUIZ_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['ARCHIVED', 'DRAFT'],
  ARCHIVED: ['DRAFT'],
};

export async function changeQuizStatus(id: string, status: string, actorId: string): Promise<AdminQuiz> {
  const existing = await findQuizById(id);
  if (!existing) throw AppError.notFound('Quiz not found');

  if (!VALID_QUIZ_STATUS_TRANSITIONS[existing.status]?.includes(status)) {
    throw AppError.badRequest(`Cannot transition quiz from ${existing.status} to ${status}`);
  }

  if (status === 'PUBLISHED') {
    const questionCount = await countQuestionsByQuiz(id);
    if (questionCount === 0) throw AppError.badRequest('A quiz must have at least one question before it can be published');
  }

  const updated = await updateQuizRow(id, { status: status as never, updatedBy: actorId });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.quiz.status_changed',
    resourceType: 'quiz',
    resourceId: id,
    beforeState: { status: existing.status },
    afterState: { status },
  });

  return toAdminQuiz(updated);
}

// --- Question + option CRUD -------------------------------------------------

export interface CreateQuestionInput {
  type: string;
  prompt: string;
  explanation?: string;
  points: number;
  options?: { text: string; isCorrect: boolean }[];
  answerKey?: Record<string, unknown>;
}

export async function addQuestionToQuiz(quizId: string, input: CreateQuestionInput, actorId: string): Promise<AdminQuestion> {
  const quiz = await findQuizById(quizId);
  if (!quiz) throw AppError.notFound('Quiz not found');

  const position = await countQuestionsByQuiz(quizId);

  const question = await createQuestionRow({
    quiz: { connect: { id: quizId } },
    type: input.type as never,
    prompt: input.prompt,
    explanation: input.explanation ?? null,
    points: input.points,
    position,
    answerKey: (input.answerKey as never) ?? undefined,
    options: input.options
      ? { create: input.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, position: i })) }
      : undefined,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.quiz_question.created',
    resourceType: 'question',
    resourceId: question.id,
    afterState: { quizId, type: input.type },
  });

  return toAdminQuestion(question);
}

export interface UpdateQuestionInput {
  prompt?: string;
  explanation?: string | null;
  points?: number;
  status?: string;
  options?: { text: string; isCorrect: boolean }[];
  answerKey?: Record<string, unknown>;
}

export async function updateExistingQuestion(id: string, input: UpdateQuestionInput, actorId: string): Promise<AdminQuestion> {
  const existing = await findQuestionById(id);
  if (!existing) throw AppError.notFound('Question not found');

  return withTransaction(async (tx) => {
    if (input.options) {
      await replaceQuestionOptions(id, input.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, position: i })), tx);
    }

    const updated = await updateQuestionRow(
      id,
      {
        ...(input.prompt !== undefined ? { prompt: input.prompt } : {}),
        ...(input.explanation !== undefined ? { explanation: input.explanation } : {}),
        ...(input.points !== undefined ? { points: input.points } : {}),
        ...(input.status !== undefined ? { status: input.status as never } : {}),
        ...(input.answerKey !== undefined ? { answerKey: input.answerKey as never } : {}),
      },
      tx,
    );

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.quiz_question.updated', resourceType: 'question', resourceId: id, afterState: input },
      tx,
    );

    return toAdminQuestion(updated);
  });
}

/** Soft-delete only — preserves historical QuizAnswer interpretability (FR-066 edge case). */
export async function archiveQuestion(id: string, actorId: string): Promise<AdminQuestion> {
  const existing = await findQuestionById(id);
  if (!existing) throw AppError.notFound('Question not found');

  const updated = await updateQuestionRow(id, { status: 'ARCHIVED', deletedAt: new Date() });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.quiz_question.archived',
    resourceType: 'question',
    resourceId: id,
  });

  return toAdminQuestion(updated);
}

export async function reorderQuizQuestions(quizId: string, orderedIds: string[], actorId: string): Promise<void> {
  const quiz = await findQuizById(quizId);
  if (!quiz) throw AppError.notFound('Quiz not found');

  await withTransaction(async (tx) => {
    await reorderQuestionPositions(quizId, orderedIds, tx);
    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.quiz_question.reordered', resourceType: 'quiz', resourceId: quizId, afterState: { orderedIds } },
      tx,
    );
  });
}
