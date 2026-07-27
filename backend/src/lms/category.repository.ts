import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

export function findCategoryBySlug(slug: string, tx?: TransactionClient) {
  return db(tx).courseCategory.findUnique({ where: { slug } });
}

export function findCategoryById(id: string, tx?: TransactionClient) {
  return db(tx).courseCategory.findUnique({ where: { id } });
}

export function findActiveCategories(parentId: string | undefined, tx?: TransactionClient) {
  return db(tx).courseCategory.findMany({
    where: { status: 'ACTIVE', parentId: parentId ?? null },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });
}

export interface AdminCategoryFilter {
  status?: string;
  parentId?: string;
}

export function findCategoriesAdmin(
  filter: AdminCategoryFilter,
  pagination: { skip: number; take: number },
  sort: 'sortOrder' | 'name',
  tx?: TransactionClient,
) {
  const where: Prisma.CourseCategoryWhereInput = {
    ...(filter.status ? { status: filter.status as never } : {}),
    ...(filter.parentId ? { parentId: filter.parentId } : {}),
  };
  const orderBy: Prisma.CourseCategoryOrderByWithRelationInput =
    sort === 'name' ? { name: 'asc' } : { sortOrder: 'asc' };

  return Promise.all([
    db(tx).courseCategory.findMany({ where, orderBy, skip: pagination.skip, take: pagination.take }),
    db(tx).courseCategory.count({ where }),
  ]);
}

export function createCategory(data: Prisma.CourseCategoryCreateInput, tx?: TransactionClient) {
  return db(tx).courseCategory.create({ data });
}

export function updateCategory(id: string, data: Prisma.CourseCategoryUpdateInput, tx?: TransactionClient) {
  return db(tx).courseCategory.update({ where: { id }, data });
}

/** Returns every descendant category (for cycle detection) — walks the whole subtree. */
export async function findDescendantCategoryIds(rootId: string, tx?: TransactionClient): Promise<Set<string>> {
  const client = db(tx);
  const descendants = new Set<string>();
  let frontier = [rootId];

  while (frontier.length > 0) {
    const children = await client.courseCategory.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    });
    const childIds = children.map((c) => c.id).filter((id) => !descendants.has(id));
    childIds.forEach((id) => descendants.add(id));
    frontier = childIds;
  }

  return descendants;
}

export function countCoursesInCategory(categoryId: string, tx?: TransactionClient) {
  return db(tx).course.count({ where: { categoryId } });
}

export function countChildCategories(categoryId: string, tx?: TransactionClient) {
  return db(tx).courseCategory.count({ where: { parentId: categoryId } });
}
