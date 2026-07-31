import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findResourceById(id: string, tx?: TransactionClient) {
  return db(tx).lessonResource.findFirst({ where: { id, deletedAt: null } });
}

export function findResourcesByLesson(lessonId: string, tx?: TransactionClient) {
  return db(tx).lessonResource.findMany({ where: { lessonId, deletedAt: null }, orderBy: { position: 'asc' } });
}

/** Only PUBLISHED resources — the learner-facing read. */
export function findPublishedResourcesByLesson(lessonId: string, tx?: TransactionClient) {
  return db(tx).lessonResource.findMany({ where: { lessonId, status: 'PUBLISHED', deletedAt: null }, orderBy: { position: 'asc' } });
}

export function countResourcesByLesson(lessonId: string, tx?: TransactionClient) {
  return db(tx).lessonResource.count({ where: { lessonId, deletedAt: null } });
}

export function createResource(data: Prisma.LessonResourceCreateInput, tx?: TransactionClient) {
  return db(tx).lessonResource.create({ data });
}

export function updateResource(id: string, data: Prisma.LessonResourceUpdateInput, tx?: TransactionClient) {
  return db(tx).lessonResource.update({ where: { id }, data });
}

export async function reorderResourcePositions(lessonId: string, orderedIds: string[], tx: TransactionClient): Promise<void> {
  const OFFSET = 1_000_000;
  for (let i = 0; i < orderedIds.length; i++) {
    await tx.lessonResource.updateMany({ where: { id: orderedIds[i], lessonId }, data: { position: OFFSET + i } });
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await tx.lessonResource.updateMany({ where: { id: orderedIds[i], lessonId }, data: { position: i } });
  }
}
