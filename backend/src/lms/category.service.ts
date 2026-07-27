import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { parsePaginationParams, buildPaginationMeta } from '../database/pagination';
import type { PaginationMeta } from '@coachx/shared';
import {
  findCategoryBySlug,
  findCategoryById,
  findActiveCategories,
  findCategoriesAdmin,
  createCategory,
  updateCategory,
  findDescendantCategoryIds,
  countCoursesInCategory,
  countChildCategories,
  type AdminCategoryFilter,
} from './category.repository';
import { toAdminCategory, toPublicCategory } from './lms.serializers';
import type { AdminCourseCategory, PublicCourseCategory } from './lms.types';

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  imageUrl?: string;
  icon?: string;
  parentId?: string;
  sortOrder?: number;
  isFeatured?: boolean;
  metadata?: unknown;
}

/** Update-only variant: `parentId` may be explicitly `null` to clear it (move to root). */
export type CategoryUpdateInput = Omit<Partial<CategoryInput>, 'parentId'> & { parentId?: string | null };

/**
 * 004 FR-014 names exactly "category, subcategory" — a 2-level model.
 * `CourseCategory`'s self-referencing structure is a valid, documented
 * superset (docs/lms/DATA_MODEL.md / DECISION_GATES.md), but capped at
 * MAX_CATEGORY_DEPTH so it can never silently grow into an arbitrary-depth
 * tree the spec never asked for. Depth is measured as: a root category has
 * depth 0 ("Category"); a category whose parent is a root has depth 1
 * ("Subcategory") — the maximum allowed parent chain length.
 */
export const MAX_CATEGORY_DEPTH = 2;

async function assertParentValid(parentId: string | undefined, selfId: string | undefined, tx: Parameters<typeof findCategoryById>[1]) {
  if (!parentId) return;

  if (parentId === selfId) {
    throw AppError.badRequest('A category cannot be its own parent');
  }

  const parent = await findCategoryById(parentId, tx);
  if (!parent) {
    throw AppError.badRequest('Invalid parent category');
  }

  // Depth cap: the chosen parent must itself be a ROOT category (depth 0)
  // — i.e. it must not already have a parent — otherwise this category
  // would land at depth 2+, beyond FR-014's category/subcategory model.
  if (parent.parentId) {
    throw AppError.badRequest(
      `Category hierarchy is limited to ${MAX_CATEGORY_DEPTH} levels (category/subcategory) — the chosen parent is already a subcategory`,
    );
  }

  if (selfId) {
    // Prevent ancestor cycles: the new parent must not be a descendant of self.
    const descendants = await findDescendantCategoryIds(selfId, tx);
    if (descendants.has(parentId)) {
      throw AppError.conflict('Cannot set parent: this would create a category hierarchy cycle');
    }

    // Depth cap, other direction: if `self` already has children (it is
    // currently a root/depth-0 category), giving it a parent would push
    // those existing children to depth 2 — also rejected.
    if (descendants.size > 0) {
      throw AppError.badRequest(
        `Cannot assign a parent to this category — it already has subcategories, and the hierarchy is limited to ${MAX_CATEGORY_DEPTH} levels`,
      );
    }
  }
}

export async function createCourseCategory(input: CategoryInput, actorId: string): Promise<AdminCourseCategory> {
  const existing = await findCategoryBySlug(input.slug);
  if (existing) throw AppError.conflict('A category with this slug already exists');

  return withTransaction(async (tx) => {
    await assertParentValid(input.parentId, undefined, tx);

    const category = await createCategory(
      {
        name: input.name,
        slug: input.slug,
        description: input.description,
        shortDescription: input.shortDescription,
        imageUrl: input.imageUrl,
        icon: input.icon,
        ...(input.parentId ? { parent: { connect: { id: input.parentId } } } : {}),
        sortOrder: input.sortOrder ?? 0,
        isFeatured: input.isFeatured ?? false,
        metadata: input.metadata as never,
        createdBy: actorId,
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.category.created', resourceType: 'course_category', resourceId: category.id },
      tx,
    );

    return toAdminCategory(category);
  });
}

export async function updateCourseCategory(
  id: string,
  input: CategoryUpdateInput,
  actorId: string,
): Promise<AdminCourseCategory> {
  return withTransaction(async (tx) => {
    const existing = await findCategoryById(id, tx);
    if (!existing) throw AppError.notFound('Category not found');

    if (input.parentId !== undefined && input.parentId !== null) {
      await assertParentValid(input.parentId, id, tx);
    }

    const updated = await updateCategory(
      id,
      {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.shortDescription !== undefined ? { shortDescription: input.shortDescription } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.icon !== undefined ? { icon: input.icon } : {}),
        ...(input.parentId !== undefined
          ? input.parentId === null
            ? { parent: { disconnect: true } }
            : { parent: { connect: { id: input.parentId } } }
          : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.isFeatured !== undefined ? { isFeatured: input.isFeatured } : {}),
        ...(input.metadata !== undefined ? { metadata: input.metadata as never } : {}),
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.category.updated',
        resourceType: 'course_category',
        resourceId: id,
        beforeState: { name: existing.name, slug: existing.slug, parentId: existing.parentId },
        afterState: { name: updated.name, slug: updated.slug, parentId: updated.parentId },
      },
      tx,
    );

    return toAdminCategory(updated);
  });
}

/**
 * Transactional sibling reorder. All `orderedIds` must currently share the
 * same `parentId` (validated before any write) — rejects unknown IDs and
 * cross-scope mixing rather than silently reordering a partial/wrong set.
 */
export async function reorderCategories(
  parentId: string | null | undefined,
  orderedIds: string[],
  actorId: string,
): Promise<void> {
  return withTransaction(async (tx) => {
    const siblings = await tx.courseCategory.findMany({
      where: { parentId: parentId ?? null },
      select: { id: true },
    });
    const siblingIds = new Set(siblings.map((s) => s.id));

    if (orderedIds.length !== siblingIds.size || !orderedIds.every((id) => siblingIds.has(id))) {
      throw AppError.badRequest('orderedIds must contain exactly the categories under the given parent, no more and no fewer');
    }

    const OFFSET = 1_000_000;
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.courseCategory.update({ where: { id: orderedIds[i] }, data: { sortOrder: OFFSET + i } });
    }
    for (let i = 0; i < orderedIds.length; i++) {
      await tx.courseCategory.update({ where: { id: orderedIds[i] }, data: { sortOrder: i } });
    }

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.category.reordered',
        resourceType: 'course_category',
        resourceId: parentId ?? 'root',
        afterState: { orderedIds },
      },
      tx,
    );
  });
}

export async function archiveCourseCategory(id: string, actorId: string): Promise<AdminCourseCategory> {
  return withTransaction(async (tx) => {
    const existing = await findCategoryById(id, tx);
    if (!existing) throw AppError.notFound('Category not found');
    if (existing.status === 'ARCHIVED') throw AppError.conflict('Category is already archived');

    // Do NOT hard-delete or block archiving a category that has courses —
    // archiving only hides it from active discovery/admin-create dropdowns;
    // existing courses keep their categoryId (never orphaned). Child
    // categories are also unaffected (their own status is independent).
    const updated = await updateCategory(id, { status: 'ARCHIVED', updatedBy: actorId }, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.category.archived', resourceType: 'course_category', resourceId: id },
      tx,
    );

    return toAdminCategory(updated);
  });
}

export async function restoreCourseCategory(id: string, actorId: string): Promise<AdminCourseCategory> {
  return withTransaction(async (tx) => {
    const existing = await findCategoryById(id, tx);
    if (!existing) throw AppError.notFound('Category not found');
    if (existing.status === 'ACTIVE') throw AppError.conflict('Category is already active');

    const updated = await updateCategory(id, { status: 'ACTIVE', updatedBy: actorId }, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.category.restored', resourceType: 'course_category', resourceId: id },
      tx,
    );

    return toAdminCategory(updated);
  });
}

export async function listPublicCategories(parentId: string | undefined): Promise<PublicCourseCategory[]> {
  const rows = await findActiveCategories(parentId);
  return rows.map(toPublicCategory);
}

export async function listCategoriesAdmin(
  filter: AdminCategoryFilter,
  pagination: { page?: string; pageSize?: string },
  sort: 'sortOrder' | 'name',
): Promise<{ data: AdminCourseCategory[]; meta: PaginationMeta }> {
  const { page, pageSize, skip, take } = parsePaginationParams(pagination);
  const [rows, total] = await findCategoriesAdmin(filter, { skip, take }, sort);
  return { data: rows.map(toAdminCategory), meta: buildPaginationMeta(page, pageSize, total) };
}

export async function getCategoryAdmin(id: string): Promise<AdminCourseCategory> {
  const row = await findCategoryById(id);
  if (!row) throw AppError.notFound('Category not found');
  return toAdminCategory(row);
}

/** Exposed for tests and for the archive-with-courses decision documented in docs/lms/DECISION_GATES.md. */
export async function categoryUsage(id: string): Promise<{ courseCount: number; childCount: number }> {
  const [courseCount, childCount] = await Promise.all([countCoursesInCategory(id), countChildCategories(id)]);
  return { courseCount, childCount };
}
