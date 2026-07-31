import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function createBankItem(data: Prisma.QuestionBankItemCreateInput, tx?: TransactionClient) {
  return db(tx).questionBankItem.create({ data, include: { options: { orderBy: { position: 'asc' } } } });
}

export function updateBankItem(id: string, data: Prisma.QuestionBankItemUpdateInput, tx?: TransactionClient) {
  return db(tx).questionBankItem.update({ where: { id }, data, include: { options: { orderBy: { position: 'asc' } } } });
}

export function findBankItemById(id: string, tx?: TransactionClient) {
  return db(tx).questionBankItem.findUnique({ where: { id }, include: { options: { orderBy: { position: 'asc' } } } });
}

export function findBankItemsForCourse(
  courseId: string,
  filter: { category?: string; difficulty?: string; reviewStatus?: string; status?: string },
  tx?: TransactionClient,
) {
  return db(tx).questionBankItem.findMany({
    where: {
      courseId,
      deletedAt: null,
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.difficulty ? { difficulty: filter.difficulty as never } : {}),
      ...(filter.reviewStatus ? { reviewStatus: filter.reviewStatus as never } : {}),
      ...(filter.status ? { status: filter.status as never } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: { options: { orderBy: { position: 'asc' } } },
  });
}

/**
 * `generateQuestionsFromBank`'s own candidate pool — only APPROVED,
 * non-archived items, optionally narrowed by category and/or a specific
 * difficulty, excluding any id already used this generation.
 */
export function findEligibleBankItemsForGeneration(
  courseId: string,
  filter: { category?: string; difficulty?: string; excludeIds: string[] },
  tx?: TransactionClient,
) {
  return db(tx).questionBankItem.findMany({
    where: {
      courseId,
      deletedAt: null,
      status: 'PUBLISHED',
      reviewStatus: 'APPROVED',
      ...(filter.category ? { category: filter.category } : {}),
      ...(filter.difficulty ? { difficulty: filter.difficulty as never } : {}),
      ...(filter.excludeIds.length ? { id: { notIn: filter.excludeIds } } : {}),
    },
    include: { options: { orderBy: { position: 'asc' } } },
  });
}

export function incrementUsageCount(id: string, tx?: TransactionClient) {
  return db(tx).questionBankItem.update({ where: { id }, data: { usageCount: { increment: 1 } } });
}

export function countBankItemsForCourse(courseId: string, tx?: TransactionClient) {
  return db(tx).questionBankItem.count({ where: { courseId, deletedAt: null } });
}
