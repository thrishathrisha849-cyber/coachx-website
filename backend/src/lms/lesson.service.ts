import { AppError } from '../utils/app-error';
import { withTransaction, type TransactionClient } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { findModuleById } from './module.repository';
import {
  findLessonById,
  findLessonsByModule,
  countLessonsByModule,
  createLesson,
  updateLesson,
  reorderLessonPositions,
} from './lesson.repository';
import { findActivitiesByLesson } from './activity.repository';
import { toAdminLesson, toAdminLessonWithActivities } from './lesson.serializers';
import type { AdminLesson, AdminLessonWithActivities } from './lesson.types';

export interface LessonInput {
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  position?: number;
  durationMinutes?: number;
  isPreview?: boolean;
  isMandatory?: boolean;
  completionRuleType?: string;
  /** CORRECTION (Part 2 correction pass) — FR-052 multi-condition support. See schema.prisma's `Lesson.completionRuleTypes` doc comment. */
  completionRuleTypes?: string[];
  completionRuleValue?: unknown;
}

export interface LessonUpdateInput extends Partial<LessonInput> {
  status?: string;
}

async function assertModuleEditable(moduleId: string, tx: TransactionClient) {
  const module_ = await findModuleById(moduleId, tx);
  if (!module_) throw AppError.notFound('Module not found');
  if (module_.status === 'ARCHIVED') {
    throw AppError.badRequest('Cannot modify lessons on an archived module');
  }
  return module_;
}

export async function createCourseLesson(moduleId: string, input: LessonInput, actorId: string): Promise<AdminLesson> {
  return withTransaction(async (tx) => {
    await assertModuleEditable(moduleId, tx);

    const nextPosition = input.position ?? (await countLessonsByModule(moduleId, tx));

    const lesson = await createLesson(
      {
        module: { connect: { id: moduleId } },
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        description: input.description,
        position: nextPosition,
        durationMinutes: input.durationMinutes,
        isPreview: input.isPreview ?? false,
        isMandatory: input.isMandatory ?? true,
        completionRuleType: (input.completionRuleType ?? 'MANUAL') as never,
        completionRuleTypes: (input.completionRuleTypes ?? []) as never,
        completionRuleValue: input.completionRuleValue as never,
        createdBy: actorId,
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.lesson.created', resourceType: 'lesson', resourceId: lesson.id, metadata: { moduleId } },
      tx,
    );

    return toAdminLesson(lesson);
  });
}

export async function updateCourseLesson(lessonId: string, input: LessonUpdateInput, actorId: string): Promise<AdminLesson> {
  return withTransaction(async (tx) => {
    const existing = await findLessonById(lessonId, tx);
    if (!existing) throw AppError.notFound('Lesson not found');

    const isFirstPublish = input.status === 'PUBLISHED' && existing.status !== 'PUBLISHED';

    const updated = await updateLesson(
      lessonId,
      {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.durationMinutes !== undefined ? { durationMinutes: input.durationMinutes } : {}),
        ...(input.isPreview !== undefined ? { isPreview: input.isPreview } : {}),
        ...(input.isMandatory !== undefined ? { isMandatory: input.isMandatory } : {}),
        ...(input.completionRuleType !== undefined ? { completionRuleType: input.completionRuleType as never } : {}),
        ...(input.completionRuleTypes !== undefined ? { completionRuleTypes: input.completionRuleTypes as never } : {}),
        ...(input.completionRuleValue !== undefined ? { completionRuleValue: input.completionRuleValue as never } : {}),
        ...(input.status !== undefined ? { status: input.status as never } : {}),
        ...(isFirstPublish ? { publishedAt: new Date() } : {}),
        version: { increment: 1 },
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
        action: 'lms.lesson.updated',
        resourceType: 'lesson',
        resourceId: lessonId,
        beforeState: { title: existing.title, status: existing.status },
        afterState: { title: updated.title, status: updated.status },
      },
      tx,
    );

    return toAdminLesson(updated);
  });
}

export async function archiveCourseLesson(lessonId: string, actorId: string): Promise<AdminLesson> {
  return withTransaction(async (tx) => {
    const existing = await findLessonById(lessonId, tx);
    if (!existing) throw AppError.notFound('Lesson not found');
    if (existing.status === 'ARCHIVED') throw AppError.conflict('Lesson is already archived');

    // Soft-archive only — never hard-delete (Part 2A brief: "soft delete").
    // A hard `deletedAt` set is reserved for a distinct future admin-only
    // purge action, not exercised by this status transition.
    const updated = await updateLesson(lessonId, { status: 'ARCHIVED', updatedBy: actorId }, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.lesson.archived', resourceType: 'lesson', resourceId: lessonId },
      tx,
    );

    return toAdminLesson(updated);
  });
}

export async function restoreCourseLesson(lessonId: string, actorId: string): Promise<AdminLesson> {
  return withTransaction(async (tx) => {
    const existing = await findLessonById(lessonId, tx);
    if (!existing) throw AppError.notFound('Lesson not found');
    if (existing.status !== 'ARCHIVED') throw AppError.conflict('Lesson is not archived');

    const updated = await updateLesson(lessonId, { status: 'DRAFT', updatedBy: actorId }, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.lesson.restored', resourceType: 'lesson', resourceId: lessonId },
      tx,
    );

    return toAdminLesson(updated);
  });
}

/**
 * Reorder validation mirrors `module.service.ts`'s `reorderCourseModules`
 * exactly: `orderedIds` must be precisely this module's full current
 * lesson set (rejects unknown IDs, cross-module mixing, and partial
 * reorders).
 */
export async function reorderCourseLessons(moduleId: string, orderedIds: string[], actorId: string): Promise<void> {
  return withTransaction(async (tx) => {
    await assertModuleEditable(moduleId, tx);

    const existing = await findLessonsByModule(moduleId, tx);
    const existingIds = new Set(existing.map((l) => l.id));

    if (orderedIds.length !== existingIds.size || !orderedIds.every((id) => existingIds.has(id))) {
      throw AppError.badRequest("orderedIds must contain exactly this module's lessons, no more and no fewer");
    }

    await reorderLessonPositions(moduleId, orderedIds, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.lesson.reordered', resourceType: 'course_module', resourceId: moduleId, afterState: { orderedIds } },
      tx,
    );
  });
}

export async function listLessonsForModuleAdmin(moduleId: string): Promise<AdminLesson[]> {
  const module_ = await findModuleById(moduleId);
  if (!module_) throw AppError.notFound('Module not found');
  const lessons = await findLessonsByModule(moduleId);
  return lessons.map(toAdminLesson);
}

export async function getLessonAdmin(lessonId: string): Promise<AdminLessonWithActivities> {
  const lesson = await findLessonById(lessonId);
  if (!lesson) throw AppError.notFound('Lesson not found');
  const activities = await findActivitiesByLesson(lessonId);
  return toAdminLessonWithActivities(lesson, activities);
}
