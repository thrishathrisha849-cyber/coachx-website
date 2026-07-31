import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function createLearnerNote(
  data: { userId: string; lessonId: string; courseId: string; content: string; videoTimestampSeconds: number | null },
  tx?: TransactionClient,
) {
  return db(tx).learnerNote.create({ data });
}

export function findLearnerNoteById(id: string, tx?: TransactionClient) {
  return db(tx).learnerNote.findUnique({ where: { id } });
}

export function updateLearnerNote(
  id: string,
  data: { content?: string; videoTimestampSeconds?: number | null },
  tx?: TransactionClient,
) {
  return db(tx).learnerNote.update({ where: { id }, data });
}

/** Ownership-scoped delete — deleting an already-gone/not-owned note is a no-op (0 rows affected), never a 500. */
export async function deleteLearnerNote(id: string, userId: string, tx?: TransactionClient): Promise<number> {
  const result = await db(tx).learnerNote.deleteMany({ where: { id, userId } });
  return result.count;
}

export function findLearnerNotesForLesson(userId: string, lessonId: string, tx?: TransactionClient) {
  return db(tx).learnerNote.findMany({ where: { userId, lessonId }, orderBy: { createdAt: 'desc' } });
}

export function findLearnerNotesForCourse(userId: string, courseId: string, tx?: TransactionClient) {
  return db(tx).learnerNote.findMany({
    where: { userId, courseId },
    orderBy: { createdAt: 'desc' },
    include: { lesson: { select: { title: true, slug: true } } },
  });
}

/** Every note the learner has ever taken, across every course — FR-058 "export" with no course filter. */
export function findAllLearnerNotesForUser(userId: string, tx?: TransactionClient) {
  return db(tx).learnerNote.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { lesson: { select: { title: true, slug: true } } },
  });
}

/** FR-058 "search" — a plain case-insensitive substring match over the learner's OWN notes only, optionally scoped to one course. */
export function searchLearnerNotes(userId: string, query: string, courseId: string | undefined, tx?: TransactionClient) {
  return db(tx).learnerNote.findMany({
    where: { userId, ...(courseId ? { courseId } : {}), content: { contains: query, mode: 'insensitive' } },
    orderBy: { createdAt: 'desc' },
    include: { lesson: { select: { title: true, slug: true } } },
  });
}
