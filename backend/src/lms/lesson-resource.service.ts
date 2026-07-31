import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { recordLearningEvent } from './learning-event.service';
import { findLessonById } from './lesson.repository';
import { assertLessonContentAccessible } from './access-evaluator.service';
import {
  findResourceById,
  findResourcesByLesson,
  findPublishedResourcesByLesson,
  countResourcesByLesson,
  createResource,
  updateResource,
  reorderResourcePositions,
} from './lesson-resource.repository';
import { toAdminLessonResource, toPublicLessonResource } from './lesson-resource.serializers';
import { findOrCreateLmsSettings } from './lms-settings.repository';
import type { AdminLessonResource, PublicLessonResource } from './lesson-resource.types';

/**
 * 004 Downloadable Resource Catalog batch (FR-049). A `LessonResource` is a
 * supplementary downloadable asset listed in the lesson player's own
 * "resources" area — distinct from a DOWNLOAD-type `LearningActivity` (a
 * step in the sequential content flow). See the model's own schema.prisma
 * doc comment for the full rationale.
 *
 * "Access rule" reuses the SAME real preview-vs-enrolled distinction
 * `evaluateLessonAccess` already computes for the lesson itself: a learner
 * who only has PREVIEW access to the lesson (not enrolled) sees only
 * PREVIEW-tagged resources; a genuinely enrolled learner sees every
 * PUBLISHED resource. "Download permission" gates which action is even
 * offered — a VIEW_ONLY resource has no real download action.
 *
 * FR-049's three named events (resource-viewed, download-started,
 * download-completed) are all real: `recordResourceViewed` fires
 * RESOURCE_VIEWED; `recordResourceDownload` fires RESOURCE_DOWNLOAD_STARTED
 * then RESOURCE_DOWNLOADED (the same FR-109-named "download completed"
 * event type Learning Analytics already aggregates) in the same call — the
 * server has no way to observe a native browser file-download actually
 * finishing, so "the learner's click triggers the real download AND is
 * treated as the completion signal" is the same honest convention already
 * established for DOWNLOAD-type `LearningActivity` (see
 * `LessonPlayerPage.tsx`'s `onClick={() => onViewed(activity.id)}`).
 */

export interface ResourceInput {
  title: string;
  type: string;
  description?: string;
  language?: string;
  fileUrl: string;
  fileSizeBytes?: number;
  downloadPermission?: string;
  accessRule?: string;
  position?: number;
}

export interface ResourceUpdateInput extends Partial<ResourceInput> {
  status?: string;
  /** Bumps `version` — set true when the admin is replacing the underlying file. */
  bumpVersion?: boolean;
}

// --- Admin -------------------------------------------------------------------

export async function createLessonResource(lessonId: string, input: ResourceInput, actorId: string): Promise<AdminLessonResource> {
  return withTransaction(async (tx) => {
    const lesson = await findLessonById(lessonId, tx);
    if (!lesson) throw AppError.notFound('Lesson not found');

    const nextPosition = input.position ?? (await countResourcesByLesson(lessonId, tx));

    // 004 LMS-wide Settings batch (FR-114 "download policy") —
    // `downloadPermission` falls back to the admin-configurable
    // `LmsSettings.defaultResourceDownloadPermission` rather than a fixed
    // `DOWNLOADABLE`. `accessRule`'s own `ENROLLED_ONLY` default is a
    // content-access rule, not a "download policy," so it stays as-is.
    const settings = await findOrCreateLmsSettings(tx);

    const resource = await createResource(
      {
        lesson: { connect: { id: lessonId } },
        title: input.title,
        type: input.type as never,
        description: input.description,
        language: input.language ?? 'EN',
        fileUrl: input.fileUrl,
        fileSizeBytes: input.fileSizeBytes,
        position: nextPosition,
        downloadPermission: (input.downloadPermission ?? settings.defaultResourceDownloadPermission) as never,
        accessRule: (input.accessRule ?? 'ENROLLED_ONLY') as never,
        createdBy: actorId,
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.resource.created', resourceType: 'lesson_resource', resourceId: resource.id, metadata: { lessonId, type: input.type } },
      tx,
    );

    return toAdminLessonResource(resource);
  });
}

export async function updateExistingResource(resourceId: string, input: ResourceUpdateInput, actorId: string): Promise<AdminLessonResource> {
  return withTransaction(async (tx) => {
    const existing = await findResourceById(resourceId, tx);
    if (!existing) throw AppError.notFound('Resource not found');

    const updated = await updateResource(
      resourceId,
      {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.type !== undefined ? { type: input.type as never } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.language !== undefined ? { language: input.language } : {}),
        ...(input.fileUrl !== undefined ? { fileUrl: input.fileUrl } : {}),
        ...(input.fileSizeBytes !== undefined ? { fileSizeBytes: input.fileSizeBytes } : {}),
        ...(input.downloadPermission !== undefined ? { downloadPermission: input.downloadPermission as never } : {}),
        ...(input.accessRule !== undefined ? { accessRule: input.accessRule as never } : {}),
        ...(input.status !== undefined ? { status: input.status as never } : {}),
        ...(input.bumpVersion ? { version: { increment: 1 } } : {}),
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.resource.updated', resourceType: 'lesson_resource', resourceId },
      tx,
    );

    return toAdminLessonResource(updated);
  });
}

export async function archiveLessonResource(resourceId: string, actorId: string): Promise<AdminLessonResource> {
  return withTransaction(async (tx) => {
    const existing = await findResourceById(resourceId, tx);
    if (!existing) throw AppError.notFound('Resource not found');

    const updated = await updateResource(resourceId, { status: 'ARCHIVED', updatedBy: actorId }, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.resource.archived', resourceType: 'lesson_resource', resourceId },
      tx,
    );

    return toAdminLessonResource(updated);
  });
}

export async function reorderLessonResources(lessonId: string, orderedIds: string[], actorId: string): Promise<void> {
  return withTransaction(async (tx) => {
    const lesson = await findLessonById(lessonId, tx);
    if (!lesson) throw AppError.notFound('Lesson not found');

    const existing = await findResourcesByLesson(lessonId, tx);
    const existingIds = new Set(existing.map((r) => r.id));

    if (orderedIds.length !== existingIds.size || !orderedIds.every((id) => existingIds.has(id))) {
      throw AppError.badRequest("orderedIds must contain exactly this lesson's resources, no more and no fewer");
    }

    await reorderResourcePositions(lessonId, orderedIds, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.resource.reordered', resourceType: 'lesson', resourceId: lessonId, afterState: { orderedIds } },
      tx,
    );
  });
}

export async function listResourcesForLessonAdmin(lessonId: string): Promise<AdminLessonResource[]> {
  const lesson = await findLessonById(lessonId);
  if (!lesson) throw AppError.notFound('Lesson not found');
  const resources = await findResourcesByLesson(lessonId);
  return resources.map(toAdminLessonResource);
}

// --- Learner-facing -----------------------------------------------------------

/** GET /me/lessons/:lessonId/resources — PREVIEW resources only for a preview-access viewer; every PUBLISHED resource for a genuinely enrolled learner. */
export async function listResourcesForLessonLearner(userId: string, lessonId: string): Promise<PublicLessonResource[]> {
  const { viaPreview } = await assertLessonContentAccessible(userId, lessonId);
  const resources = await findPublishedResourcesByLesson(lessonId);
  const visible = viaPreview ? resources.filter((r) => r.accessRule === 'PREVIEW') : resources;
  return visible.map(toPublicLessonResource);
}

async function assertResourceAccessible(userId: string, resourceId: string) {
  const resource = await findResourceById(resourceId);
  if (!resource || resource.status !== 'PUBLISHED') throw AppError.notFound('Resource not found');

  const { courseId, viaPreview } = await assertLessonContentAccessible(userId, resource.lessonId);
  if (viaPreview && resource.accessRule !== 'PREVIEW') {
    throw AppError.forbidden('Enroll in this course to access this resource');
  }
  return { resource, courseId };
}

/** POST /me/lesson-resources/:resourceId/viewed — FR-049 "resource-viewed" tracking. */
export async function recordResourceViewed(userId: string, resourceId: string): Promise<void> {
  const { resource, courseId } = await assertResourceAccessible(userId, resourceId);
  await recordLearningEvent({
    eventType: 'RESOURCE_VIEWED',
    userId,
    courseId,
    lessonId: resource.lessonId,
    metadata: { resourceId },
  });
}

/** POST /me/lesson-resources/:resourceId/download — FR-049 "download-started"/"download-completed" tracking; returns the real fileUrl for the client to actually download. Rejects a VIEW_ONLY resource (no real download action exists for it). */
export async function recordResourceDownload(userId: string, resourceId: string): Promise<{ fileUrl: string }> {
  const { resource, courseId } = await assertResourceAccessible(userId, resourceId);
  if (resource.downloadPermission !== 'DOWNLOADABLE') {
    throw AppError.badRequest('This resource is view-only and cannot be downloaded');
  }

  await recordLearningEvent({ eventType: 'RESOURCE_DOWNLOAD_STARTED', userId, courseId, lessonId: resource.lessonId, metadata: { resourceId } });
  // The server cannot observe a native browser download actually finishing —
  // the click-through IS the completion signal, the same honest convention
  // `LessonPlayerPage.tsx` already uses for DOWNLOAD-type LearningActivity.
  await recordLearningEvent({ eventType: 'RESOURCE_DOWNLOADED', userId, courseId, lessonId: resource.lessonId, metadata: { resourceId } });

  return { fileUrl: resource.fileUrl };
}
