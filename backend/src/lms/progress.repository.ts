import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findLessonProgress(enrollmentId: string, lessonId: string, tx?: TransactionClient) {
  return db(tx).lessonProgress.findUnique({ where: { enrollmentId_lessonId: { enrollmentId, lessonId } } });
}

export function findLessonProgressForEnrollment(enrollmentId: string, tx?: TransactionClient) {
  return db(tx).lessonProgress.findMany({ where: { enrollmentId } });
}

export function findLessonProgressForLessons(enrollmentId: string, lessonIds: string[], tx?: TransactionClient) {
  if (lessonIds.length === 0) return Promise.resolve([]);
  return db(tx).lessonProgress.findMany({ where: { enrollmentId, lessonId: { in: lessonIds } } });
}

export function upsertLessonProgress(
  enrollmentId: string,
  lessonId: string,
  create: Prisma.LessonProgressUncheckedCreateInput,
  update: Prisma.LessonProgressUpdateInput,
  tx?: TransactionClient,
) {
  return db(tx).lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
    create,
    update,
  });
}
