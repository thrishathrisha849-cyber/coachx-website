import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findLessonById(id: string, tx?: TransactionClient) {
  return db(tx).lesson.findFirst({ where: { id, deletedAt: null } });
}

/** Includes soft-deleted rows — used only by ownership/ID-resolution checks that must not silently 404 on a just-deleted row mid-request. */
export function findLessonByIdIncludingDeleted(id: string, tx?: TransactionClient) {
  return db(tx).lesson.findUnique({ where: { id } });
}

export function findLessonsByModule(moduleId: string, tx?: TransactionClient) {
  return db(tx).lesson.findMany({ where: { moduleId, deletedAt: null }, orderBy: { position: 'asc' } });
}

export function findPublishedLessonsByModule(moduleId: string, tx?: TransactionClient) {
  return db(tx).lesson.findMany({
    where: { moduleId, status: 'PUBLISHED', deletedAt: null },
    orderBy: { position: 'asc' },
  });
}

/**
 * Cross-cutting polish batch (T124, performance) — the batched sibling of
 * `findPublishedLessonsByModule`, for callers that need every published
 * lesson across MULTIPLE modules (e.g. `continue-learning.service.ts`'s
 * `getContinueLearning`, which previously called the single-module
 * version once per module in a loop — an N+1 query pattern on a
 * "Continue Learning" CTA rendered on every course page load).
 */
export function findPublishedLessonsByModules(moduleIds: string[], tx?: TransactionClient) {
  return db(tx).lesson.findMany({
    where: { moduleId: { in: moduleIds }, status: 'PUBLISHED', deletedAt: null },
    orderBy: [{ moduleId: 'asc' }, { position: 'asc' }],
  });
}

export function countLessonsByModule(moduleId: string, tx?: TransactionClient) {
  return db(tx).lesson.count({ where: { moduleId, deletedAt: null } });
}

export function createLesson(data: Prisma.LessonCreateInput, tx?: TransactionClient) {
  return db(tx).lesson.create({ data });
}

export function updateLesson(id: string, data: Prisma.LessonUpdateInput, tx?: TransactionClient) {
  return db(tx).lesson.update({ where: { id }, data });
}

/**
 * Transactional reorder — same two-pass offset-then-final-position pattern
 * as `module.repository.ts`'s `reorderModulePositions`, scoped to
 * `moduleId` in every `updateMany` `where` clause as the same defense-in-
 * depth guard against cross-module corruption.
 */
export async function reorderLessonPositions(moduleId: string, orderedIds: string[], tx: TransactionClient): Promise<void> {
  const OFFSET = 1_000_000;
  for (let i = 0; i < orderedIds.length; i++) {
    await tx.lesson.updateMany({ where: { id: orderedIds[i], moduleId }, data: { position: OFFSET + i } });
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await tx.lesson.updateMany({ where: { id: orderedIds[i], moduleId }, data: { position: i } });
  }
}
