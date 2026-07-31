import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { findCourseById } from './course.repository';
import { findQuizById } from './quiz.repository';
import { findLessonById } from './lesson.repository';
import { findModuleById } from './module.repository';
import { createQuestion as createQuestionRow, countQuestionsByQuiz } from './quiz.repository';
import {
  createBankItem,
  updateBankItem,
  findBankItemById,
  findBankItemsForCourse,
  findEligibleBankItemsForGeneration,
  incrementUsageCount,
} from './question-bank.repository';
import { toAdminQuestionBankItem } from './question-bank.serializers';
import type { AdminQuestionBankItem, GenerateQuestionsFromBankInput, GenerateQuestionsFromBankResult } from './question-bank.types';
import type { TransactionClient } from '../database/transaction';

/**
 * 004 Question Bank batch (T107, FR-064). See `schema.prisma`'s own
 * `QuestionBankItem` doc comment for the full scope rationale — a
 * course-scoped, reusable question TEMPLATE; generating a quiz's real
 * question set COPIES a bank item's content into a brand-new `Question`
 * row (never a live reference), so later bank edits/deletes never
 * retroactively change an already-generated quiz.
 */

export interface BankItemInput {
  type: string;
  prompt: string;
  explanation?: string;
  points?: number;
  category?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  learningObjective?: string;
  tags?: string[];
  language?: string;
  reviewStatus?: 'DRAFT' | 'APPROVED' | 'ARCHIVED';
  status?: string;
  options?: { text: string; isCorrect: boolean }[];
  answerKey?: Record<string, unknown>;
}

export async function createBankItemForCourse(courseId: string, input: BankItemInput, actorId: string): Promise<AdminQuestionBankItem> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');

  const item = await createBankItem({
    course: { connect: { id: courseId } },
    type: input.type as never,
    prompt: input.prompt,
    explanation: input.explanation ?? null,
    points: input.points ?? 1,
    category: input.category ?? null,
    difficulty: (input.difficulty ?? 'MEDIUM') as never,
    learningObjective: input.learningObjective ?? null,
    tags: input.tags ?? [],
    language: input.language ?? 'EN',
    reviewStatus: (input.reviewStatus ?? 'DRAFT') as never,
    status: (input.status ?? 'DRAFT') as never,
    answerKey: (input.answerKey as never) ?? undefined,
    options: input.options ? { create: input.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, position: i })) } : undefined,
    createdBy: actorId,
    updatedBy: actorId,
  }).catch((error: unknown) => {
    throw normalizeDatabaseError(error);
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.question_bank_item.created',
    resourceType: 'question_bank_item',
    resourceId: item.id,
    afterState: { courseId, type: input.type, category: input.category },
  });

  return toAdminQuestionBankItem(item);
}

export async function updateExistingBankItem(id: string, input: Partial<BankItemInput>, actorId: string): Promise<AdminQuestionBankItem> {
  const existing = await findBankItemById(id);
  if (!existing) throw AppError.notFound('Question bank item not found');

  const updated = await updateBankItem(id, {
    ...(input.prompt !== undefined ? { prompt: input.prompt } : {}),
    ...(input.explanation !== undefined ? { explanation: input.explanation } : {}),
    ...(input.points !== undefined ? { points: input.points } : {}),
    ...(input.category !== undefined ? { category: input.category } : {}),
    ...(input.difficulty !== undefined ? { difficulty: input.difficulty as never } : {}),
    ...(input.learningObjective !== undefined ? { learningObjective: input.learningObjective } : {}),
    ...(input.tags !== undefined ? { tags: input.tags } : {}),
    ...(input.language !== undefined ? { language: input.language } : {}),
    ...(input.reviewStatus !== undefined ? { reviewStatus: input.reviewStatus as never } : {}),
    ...(input.status !== undefined ? { status: input.status as never } : {}),
    ...(input.answerKey !== undefined ? { answerKey: input.answerKey as never } : {}),
    ...(input.options !== undefined
      ? { options: { deleteMany: {}, create: input.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, position: i })) } }
      : {}),
    version: { increment: 1 },
    updatedBy: actorId,
  }).catch((error: unknown) => {
    throw normalizeDatabaseError(error);
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.question_bank_item.updated',
    resourceType: 'question_bank_item',
    resourceId: id,
    beforeState: { reviewStatus: existing.reviewStatus, status: existing.status },
    afterState: { reviewStatus: updated.reviewStatus, status: updated.status },
  });

  return toAdminQuestionBankItem(updated);
}

export async function archiveBankItem(id: string, actorId: string): Promise<AdminQuestionBankItem> {
  const existing = await findBankItemById(id);
  if (!existing) throw AppError.notFound('Question bank item not found');
  if (existing.status === 'ARCHIVED') throw AppError.conflict('This bank item is already archived');

  const updated = await updateBankItem(id, { status: 'ARCHIVED', reviewStatus: 'ARCHIVED', updatedBy: actorId });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.question_bank_item.archived',
    resourceType: 'question_bank_item',
    resourceId: id,
  });

  return toAdminQuestionBankItem(updated);
}

export async function listBankItemsForCourseAdmin(
  courseId: string,
  filter: { category?: string; difficulty?: string; reviewStatus?: string; status?: string },
): Promise<AdminQuestionBankItem[]> {
  const rows = await findBankItemsForCourse(courseId, filter);
  return rows.map(toAdminQuestionBankItem);
}

export async function getBankItemAdmin(id: string): Promise<AdminQuestionBankItem> {
  const row = await findBankItemById(id);
  if (!row) throw AppError.notFound('Question bank item not found');
  return toAdminQuestionBankItem(row);
}

/** Shuffles a copy of `items` (Fisher-Yates) — never mutates the input array. */
function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

async function resolveCourseIdForQuiz(quizId: string) {
  const quiz = await findQuizById(quizId);
  if (!quiz) throw AppError.notFound('Quiz not found');
  const lesson = await findLessonById(quiz.lessonId);
  if (!lesson) throw AppError.notFound('Quiz not found');
  const module_ = await findModuleById(lesson.moduleId);
  if (!module_) throw AppError.notFound('Quiz not found');
  return { quizId: quiz.id, courseId: module_.courseId };
}

/**
 * FR-064: "generate randomized quiz sets by question count, difficulty
 * distribution, category distribution, and exclusion rules." Draws from
 * APPROVED, non-archived bank items only (a DRAFT item is never
 * generation-eligible, the same "draft never learner/generation-facing"
 * convention every other content type here uses), COPIES each drawn
 * item's content into a real `Question`+`QuestionOption` row attached to
 * the target quiz, and increments the source bank item's `usageCount`.
 * Never fabricates questions that don't exist — if fewer eligible items
 * exist than requested, it draws as many as it can and honestly reports
 * `drawn < requested` rather than erroring or duplicating.
 */
export async function generateQuestionsFromBank(
  quizId: string,
  input: GenerateQuestionsFromBankInput,
  actorId: string,
): Promise<GenerateQuestionsFromBankResult> {
  const { courseId } = await resolveCourseIdForQuiz(quizId);

  const excludeIds = [...(input.excludeIds ?? [])];
  const createdQuestionIds: string[] = [];
  let requested = 0;

  return withTransaction(async (tx: TransactionClient) => {
    let nextPosition = await countQuestionsByQuiz(quizId, tx);

    async function drawAndCopy(difficulty: string | undefined, count: number) {
      if (count <= 0) return;
      requested += count;
      const pool = shuffled(await findEligibleBankItemsForGeneration(courseId, { category: input.category, difficulty, excludeIds }, tx));
      const drawn = pool.slice(0, count);

      for (const item of drawn) {
        const question = await createQuestionRow(
          {
            quiz: { connect: { id: quizId } },
            type: item.type,
            prompt: item.prompt,
            explanation: item.explanation,
            points: item.points,
            position: nextPosition,
            answerKey: item.answerKey as never,
            options: item.options.length
              ? { create: item.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect, position: o.position })) }
              : undefined,
          },
          tx,
        );
        nextPosition += 1;
        createdQuestionIds.push(question.id);
        excludeIds.push(item.id);
        await incrementUsageCount(item.id, tx);
      }
    }

    if (input.difficultyDistribution) {
      for (const [difficulty, count] of Object.entries(input.difficultyDistribution)) {
        await drawAndCopy(difficulty, count ?? 0);
      }
    } else {
      await drawAndCopy(undefined, input.count ?? 0);
    }

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.quiz.questions_generated_from_bank',
        resourceType: 'quiz',
        resourceId: quizId,
        afterState: { requested, drawn: createdQuestionIds.length, category: input.category, difficultyDistribution: input.difficultyDistribution },
      },
      tx,
    );

    return { createdQuestionIds, requested, drawn: createdQuestionIds.length };
  });
}
