import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findQuizById(id: string, tx?: TransactionClient) {
  return db(tx).quiz.findFirst({ where: { id, deletedAt: null } });
}

export function findQuizByLessonId(lessonId: string, tx?: TransactionClient) {
  return db(tx).quiz.findFirst({ where: { lessonId, deletedAt: null } });
}

export function createQuiz(data: Prisma.QuizCreateInput, tx?: TransactionClient) {
  return db(tx).quiz.create({ data });
}

export function updateQuiz(id: string, data: Prisma.QuizUpdateInput, tx?: TransactionClient) {
  return db(tx).quiz.update({ where: { id }, data });
}

export function findQuestionsByQuiz(quizId: string, includeArchived: boolean, tx?: TransactionClient) {
  return db(tx).question.findMany({
    where: { quizId, deletedAt: null, ...(includeArchived ? {} : { status: { not: 'ARCHIVED' } }) },
    orderBy: { position: 'asc' },
    include: { options: { orderBy: { position: 'asc' } } },
  });
}

/** Only PUBLISHED, non-deleted questions — the set a learner actually attempts. */
export function findPublishedQuestionsByQuiz(quizId: string, tx?: TransactionClient) {
  return db(tx).question.findMany({
    where: { quizId, deletedAt: null, status: 'PUBLISHED' },
    orderBy: { position: 'asc' },
    include: { options: { orderBy: { position: 'asc' } } },
  });
}

export function findQuestionById(id: string, tx?: TransactionClient) {
  return db(tx).question.findFirst({ where: { id, deletedAt: null }, include: { options: { orderBy: { position: 'asc' } } } });
}

/** Includes soft-deleted questions — historical-attempt review must still resolve the question's prompt/options even after archival. */
export function findQuestionByIdIncludingDeleted(id: string, tx?: TransactionClient) {
  return db(tx).question.findUnique({ where: { id }, include: { options: { orderBy: { position: 'asc' } } } });
}

export function createQuestion(data: Prisma.QuestionCreateInput, tx?: TransactionClient) {
  return db(tx).question.create({ data, include: { options: true } });
}

export function updateQuestion(id: string, data: Prisma.QuestionUpdateInput, tx?: TransactionClient) {
  return db(tx).question.update({ where: { id }, data, include: { options: { orderBy: { position: 'asc' } } } });
}

export function countQuestionsByQuiz(quizId: string, tx?: TransactionClient) {
  return db(tx).question.count({ where: { quizId, deletedAt: null } });
}

/** Same two-pass offset-then-final-position reorder pattern as lesson/module reordering. */
export async function reorderQuestionPositions(quizId: string, orderedIds: string[], tx: TransactionClient): Promise<void> {
  const OFFSET = 1_000_000;
  for (let i = 0; i < orderedIds.length; i++) {
    await tx.question.updateMany({ where: { id: orderedIds[i], quizId }, data: { position: OFFSET + i } });
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await tx.question.updateMany({ where: { id: orderedIds[i], quizId }, data: { position: i } });
  }
}

/** Caller runs this inside its own `withTransaction()` — both statements below already share that outer transaction, so this never opens a nested one. */
export async function replaceQuestionOptions(
  questionId: string,
  options: { text: string; isCorrect: boolean; position: number }[],
  tx: TransactionClient,
): Promise<void> {
  await tx.questionOption.deleteMany({ where: { questionId } });
  await tx.questionOption.createMany({ data: options.map((o) => ({ ...o, questionId })) });
}

// --- Quiz attempts -----------------------------------------------------

export function findAttemptsForEnrollmentQuiz(enrollmentId: string, quizId: string, tx?: TransactionClient) {
  return db(tx).quizAttempt.findMany({ where: { enrollmentId, quizId }, orderBy: { attemptNumber: 'desc' } });
}

export function findAttemptById(id: string, tx?: TransactionClient) {
  return db(tx).quizAttempt.findUnique({ where: { id }, include: { answers: true } });
}

export function createAttempt(data: Prisma.QuizAttemptCreateInput, tx: TransactionClient) {
  return tx.quizAttempt.create({ data, include: { answers: true } });
}

export function updateAttempt(id: string, data: Prisma.QuizAttemptUpdateInput, tx?: TransactionClient) {
  return db(tx).quizAttempt.update({ where: { id }, data, include: { answers: true } });
}

export function upsertAnswer(
  attemptId: string,
  questionId: string,
  data: { selectedOptionIds: string[]; answerText: string | null },
  tx?: TransactionClient,
) {
  return db(tx).quizAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, ...data },
    update: data,
  });
}

export function findAnswersForAttempt(attemptId: string, tx?: TransactionClient) {
  return db(tx).quizAnswer.findMany({ where: { attemptId } });
}

export function updateAnswerGrading(id: string, isCorrect: boolean, pointsAwarded: number, tx: TransactionClient) {
  return tx.quizAnswer.update({ where: { id }, data: { isCorrect, pointsAwarded } });
}

/** True if this enrollment has any GRADED, passed attempt at this quiz — the QUIZ_PASS completion-rule signal. */
export async function hasPassedQuiz(enrollmentId: string, quizId: string, tx?: TransactionClient): Promise<boolean> {
  const count = await db(tx).quizAttempt.count({ where: { enrollmentId, quizId, status: 'GRADED', passed: true } });
  return count > 0;
}
