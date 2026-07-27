import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findActivityById(id: string, tx?: TransactionClient) {
  return db(tx).learningActivity.findFirst({ where: { id, deletedAt: null } });
}

export function findActivitiesByLesson(lessonId: string, tx?: TransactionClient) {
  return db(tx).learningActivity.findMany({ where: { lessonId, deletedAt: null }, orderBy: { position: 'asc' } });
}

export function countActivitiesByLesson(lessonId: string, tx?: TransactionClient) {
  return db(tx).learningActivity.count({ where: { lessonId, deletedAt: null } });
}

export function createActivity(data: Prisma.LearningActivityCreateInput, tx?: TransactionClient) {
  return db(tx).learningActivity.create({ data });
}

export function updateActivity(id: string, data: Prisma.LearningActivityUpdateInput, tx?: TransactionClient) {
  return db(tx).learningActivity.update({ where: { id }, data });
}

export async function reorderActivityPositions(lessonId: string, orderedIds: string[], tx: TransactionClient): Promise<void> {
  const OFFSET = 1_000_000;
  for (let i = 0; i < orderedIds.length; i++) {
    await tx.learningActivity.updateMany({ where: { id: orderedIds[i], lessonId }, data: { position: OFFSET + i } });
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await tx.learningActivity.updateMany({ where: { id: orderedIds[i], lessonId }, data: { position: i } });
  }
}
