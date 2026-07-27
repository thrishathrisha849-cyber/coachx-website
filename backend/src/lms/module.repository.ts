import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findModuleById(id: string, tx?: TransactionClient) {
  return db(tx).courseModule.findUnique({ where: { id } });
}

export function findModulesByCourse(courseId: string, tx?: TransactionClient) {
  return db(tx).courseModule.findMany({ where: { courseId }, orderBy: { position: 'asc' } });
}

/** Non-archived modules only, ordered — the public course-detail "syllabus" view. */
export function findVisibleModulesByCourse(courseId: string, tx?: TransactionClient) {
  return db(tx).courseModule.findMany({
    where: { courseId, status: 'PUBLISHED' },
    orderBy: { position: 'asc' },
  });
}

export function countModulesByCourse(courseId: string, tx?: TransactionClient) {
  return db(tx).courseModule.count({ where: { courseId } });
}

export function createModule(data: Prisma.CourseModuleCreateInput, tx?: TransactionClient) {
  return db(tx).courseModule.create({ data });
}

export function updateModule(id: string, data: Prisma.CourseModuleUpdateInput, tx?: TransactionClient) {
  return db(tx).courseModule.update({ where: { id }, data });
}

/**
 * Transactional reorder: rewrites the `position` of every module in
 * `orderedIds` to its index, using a two-pass write (first push every row
 * to a disjoint temporary-position range, then to its final position) so
 * the `@@unique([courseId, position])` constraint is never violated
 * mid-transaction by two rows momentarily sharing a position. Must be
 * called from within an existing `withTransaction()` (same non-nested-
 * transaction discipline as `cms.repository.ts`'s `replacePageBlocks`).
 */
export async function reorderModulePositions(
  courseId: string,
  orderedIds: string[],
  tx: TransactionClient,
): Promise<void> {
  const OFFSET = 1_000_000; // Well above any realistic module count.
  for (let i = 0; i < orderedIds.length; i++) {
    await tx.courseModule.update({
      where: { id: orderedIds[i] },
      data: { position: OFFSET + i },
    });
  }
  for (let i = 0; i < orderedIds.length; i++) {
    await tx.courseModule.update({
      where: { id: orderedIds[i] },
      data: { position: i },
    });
  }
}
