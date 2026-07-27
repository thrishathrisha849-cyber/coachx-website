import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { findCourseById } from './course.repository';
import {
  findModuleById,
  findModulesByCourse,
  countModulesByCourse,
  createModule,
  updateModule,
  reorderModulePositions,
} from './module.repository';
import { toAdminModule } from './lms.serializers';
import type { AdminCourseModule } from './lms.types';

export interface ModuleInput {
  title: string;
  description?: string;
  position?: number;
  isPreview?: boolean;
  metadata?: unknown;
}

export interface ModuleUpdateInput extends Partial<ModuleInput> {
  status?: string;
}

export async function createCourseModule(
  courseId: string,
  input: ModuleInput,
  actorId: string,
): Promise<AdminCourseModule> {
  return withTransaction(async (tx) => {
    const course = await findCourseById(courseId, tx);
    if (!course) throw AppError.notFound('Course not found');
    if (course.status === 'ARCHIVED') {
      throw AppError.badRequest('Cannot add a module to an archived course');
    }

    // Append at the end by default — explicit position is honored but
    // must be unique per (courseId, position); a supplied duplicate
    // position surfaces as a normalized 409 via the unique-constraint
    // catch below, rather than a confusing raw Prisma error.
    const nextPosition = input.position ?? (await countModulesByCourse(courseId, tx));

    const module_ = await createModule(
      {
        course: { connect: { id: courseId } },
        title: input.title,
        description: input.description,
        position: nextPosition,
        isPreview: input.isPreview ?? false,
        metadata: input.metadata as never,
        createdBy: actorId,
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
        action: 'lms.module.created',
        resourceType: 'course_module',
        resourceId: module_.id,
        metadata: { courseId },
      },
      tx,
    );

    return toAdminModule(module_);
  });
}

export async function updateCourseModule(
  moduleId: string,
  input: ModuleUpdateInput,
  actorId: string,
): Promise<AdminCourseModule> {
  return withTransaction(async (tx) => {
    const existing = await findModuleById(moduleId, tx);
    if (!existing) throw AppError.notFound('Module not found');

    const updated = await updateModule(
      moduleId,
      {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.isPreview !== undefined ? { isPreview: input.isPreview } : {}),
        ...(input.status !== undefined ? { status: input.status as never } : {}),
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
        action: 'lms.module.updated',
        resourceType: 'course_module',
        resourceId: moduleId,
        beforeState: { title: existing.title, status: existing.status },
        afterState: { title: updated.title, status: updated.status },
      },
      tx,
    );

    return toAdminModule(updated);
  });
}

export async function archiveCourseModule(moduleId: string, actorId: string): Promise<AdminCourseModule> {
  return withTransaction(async (tx) => {
    const existing = await findModuleById(moduleId, tx);
    if (!existing) throw AppError.notFound('Module not found');
    if (existing.status === 'ARCHIVED') throw AppError.conflict('Module is already archived');

    // Archive only — never hard-delete (brief: "Module lifecycle must not
    // silently delete future lesson data"; a future Lesson FK to this
    // module must never be silently orphaned by a Part-1-only action).
    const updated = await updateModule(moduleId, { status: 'ARCHIVED', updatedBy: actorId }, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.module.archived', resourceType: 'course_module', resourceId: moduleId },
      tx,
    );

    return toAdminModule(updated);
  });
}

export async function restoreCourseModule(moduleId: string, actorId: string): Promise<AdminCourseModule> {
  return withTransaction(async (tx) => {
    const existing = await findModuleById(moduleId, tx);
    if (!existing) throw AppError.notFound('Module not found');
    if (existing.status !== 'ARCHIVED') throw AppError.conflict('Module is not archived');

    const updated = await updateModule(moduleId, { status: 'DRAFT', updatedBy: actorId }, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.module.restored', resourceType: 'course_module', resourceId: moduleId },
      tx,
    );

    return toAdminModule(updated);
  });
}

/**
 * Transactional reorder — all `orderedIds` must belong to `courseId`
 * (rejects unknown IDs and cross-course mixing, the exact "Reorder
 * manipulation" / "Validate all IDs belong to the same parent scope"
 * security requirement from the brief) and must be exactly the course's
 * full current module set (no silent partial reorder).
 */
export async function reorderCourseModules(courseId: string, orderedIds: string[], actorId: string): Promise<void> {
  return withTransaction(async (tx) => {
    const course = await findCourseById(courseId, tx);
    if (!course) throw AppError.notFound('Course not found');

    const existing = await findModulesByCourse(courseId, tx);
    const existingIds = new Set(existing.map((m) => m.id));

    if (orderedIds.length !== existingIds.size || !orderedIds.every((id) => existingIds.has(id))) {
      throw AppError.badRequest('orderedIds must contain exactly this course\'s modules, no more and no fewer');
    }

    await reorderModulePositions(courseId, orderedIds, tx);

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.module.reordered',
        resourceType: 'course',
        resourceId: courseId,
        afterState: { orderedIds },
      },
      tx,
    );
  });
}

export async function listModulesForCourseAdmin(courseId: string): Promise<AdminCourseModule[]> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');
  const modules = await findModulesByCourse(courseId);
  return modules.map(toAdminModule);
}

export async function getModuleAdmin(moduleId: string): Promise<AdminCourseModule> {
  const module_ = await findModuleById(moduleId);
  if (!module_) throw AppError.notFound('Module not found');
  return toAdminModule(module_);
}
