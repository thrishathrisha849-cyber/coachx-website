import { AppError } from '../utils/app-error';
import { withTransaction } from '../database/transaction';
import { normalizeDatabaseError } from '../database/db-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { findLessonById } from './lesson.repository';
import { findModuleById } from './module.repository';
import { evaluateLessonAccess } from './access-evaluator.service';
import {
  findActivityById,
  findActivitiesByLesson,
  countActivitiesByLesson,
  createActivity,
  updateActivity,
  reorderActivityPositions,
} from './activity.repository';
import { toAdminActivity } from './lesson.serializers';
import type { AdminLearningActivity, TranscriptSegment } from './lesson.types';

export interface ActivityInput {
  type: string;
  title?: string;
  position?: number;
  mediaUrl?: string;
  externalUrl?: string;
  bodyText?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  embedProvider?: string;
  embedResourceId?: string;
  captionsUrlEn?: string;
  captionsUrlTa?: string;
  transcriptSegments?: TranscriptSegment[];
}

export interface ActivityUpdateInput extends Partial<ActivityInput> {
  status?: string;
}

export async function createLearningActivity(lessonId: string, input: ActivityInput, actorId: string): Promise<AdminLearningActivity> {
  return withTransaction(async (tx) => {
    const lesson = await findLessonById(lessonId, tx);
    if (!lesson) throw AppError.notFound('Lesson not found');

    const nextPosition = input.position ?? (await countActivitiesByLesson(lessonId, tx));

    const activity = await createActivity(
      {
        lesson: { connect: { id: lessonId } },
        type: input.type as never,
        title: input.title,
        position: nextPosition,
        mediaUrl: input.mediaUrl,
        externalUrl: input.externalUrl,
        bodyText: input.bodyText,
        durationSeconds: input.durationSeconds,
        fileSizeBytes: input.fileSizeBytes,
        embedProvider: input.embedProvider,
        embedResourceId: input.embedResourceId,
        captionsUrlEn: input.captionsUrlEn,
        captionsUrlTa: input.captionsUrlTa,
        transcriptSegments: input.transcriptSegments as never,
        createdBy: actorId,
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.activity.created', resourceType: 'learning_activity', resourceId: activity.id, metadata: { lessonId, type: input.type } },
      tx,
    );

    return toAdminActivity(activity);
  });
}

export async function updateLearningActivity(activityId: string, input: ActivityUpdateInput, actorId: string): Promise<AdminLearningActivity> {
  return withTransaction(async (tx) => {
    const existing = await findActivityById(activityId, tx);
    if (!existing) throw AppError.notFound('Learning activity not found');

    // Merge-then-validate: an EMBED must never end up persisted with a null
    // provider/resourceId, an EXTERNAL_LINK must never end up with a null
    // externalUrl, etc. — re-check the SAME per-type invariants
    // `lesson.validation.ts`'s create-schema enforces, using the
    // post-merge shape (covers a partial PATCH that changes `type` without
    // resupplying every type-specific field).
    const merged = {
      type: input.type ?? existing.type,
      mediaUrl: input.mediaUrl !== undefined ? input.mediaUrl : existing.mediaUrl,
      externalUrl: input.externalUrl !== undefined ? input.externalUrl : existing.externalUrl,
      bodyText: input.bodyText !== undefined ? input.bodyText : existing.bodyText,
      embedProvider: input.embedProvider !== undefined ? input.embedProvider : existing.embedProvider,
      embedResourceId: input.embedResourceId !== undefined ? input.embedResourceId : existing.embedResourceId,
      captionsUrlEn: input.captionsUrlEn !== undefined ? input.captionsUrlEn : existing.captionsUrlEn,
      captionsUrlTa: input.captionsUrlTa !== undefined ? input.captionsUrlTa : existing.captionsUrlTa,
      transcriptSegments:
        input.transcriptSegments !== undefined ? input.transcriptSegments : (existing.transcriptSegments as TranscriptSegment[] | null),
    };
    assertActivityTypeInvariants(merged);

    const updated = await updateActivity(
      activityId,
      {
        ...(input.type !== undefined ? { type: input.type as never } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.mediaUrl !== undefined ? { mediaUrl: input.mediaUrl } : {}),
        ...(input.externalUrl !== undefined ? { externalUrl: input.externalUrl } : {}),
        ...(input.bodyText !== undefined ? { bodyText: input.bodyText } : {}),
        ...(input.durationSeconds !== undefined ? { durationSeconds: input.durationSeconds } : {}),
        ...(input.fileSizeBytes !== undefined ? { fileSizeBytes: input.fileSizeBytes } : {}),
        ...(input.embedProvider !== undefined ? { embedProvider: input.embedProvider } : {}),
        ...(input.embedResourceId !== undefined ? { embedResourceId: input.embedResourceId } : {}),
        ...(input.captionsUrlEn !== undefined ? { captionsUrlEn: input.captionsUrlEn } : {}),
        ...(input.captionsUrlTa !== undefined ? { captionsUrlTa: input.captionsUrlTa } : {}),
        ...(input.transcriptSegments !== undefined ? { transcriptSegments: input.transcriptSegments as never } : {}),
        ...(input.status !== undefined ? { status: input.status as never } : {}),
        updatedBy: actorId,
      },
      tx,
    ).catch((error: unknown) => {
      throw normalizeDatabaseError(error);
    });

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.activity.updated', resourceType: 'learning_activity', resourceId: activityId },
      tx,
    );

    return toAdminActivity(updated);
  });
}

function assertActivityTypeInvariants(activity: {
  type: string;
  mediaUrl: string | null;
  externalUrl: string | null;
  bodyText: string | null;
  embedProvider: string | null;
  embedResourceId: string | null;
  captionsUrlEn?: string | null;
  captionsUrlTa?: string | null;
  transcriptSegments?: TranscriptSegment[] | null;
}): void {
  switch (activity.type) {
    case 'VIDEO':
    case 'AUDIO':
    case 'DOWNLOAD':
    case 'PDF':
      if (!activity.mediaUrl) throw AppError.badRequest(`${activity.type} activities require mediaUrl`);
      break;
    case 'EXTERNAL_LINK':
      if (!activity.externalUrl) throw AppError.badRequest('EXTERNAL_LINK activities require externalUrl');
      break;
    case 'ARTICLE':
      if (!activity.bodyText) throw AppError.badRequest('ARTICLE activities require bodyText');
      break;
    case 'EMBED':
      if (!activity.embedProvider || !activity.embedResourceId) {
        throw AppError.badRequest('EMBED activities require embedProvider and embedResourceId');
      }
      break;
  }

  const hasCaptionsOrTranscript = !!activity.captionsUrlEn || !!activity.captionsUrlTa || !!activity.transcriptSegments;
  if (hasCaptionsOrTranscript && activity.type !== 'VIDEO' && activity.type !== 'AUDIO') {
    throw AppError.badRequest('Captions and transcripts are only supported for VIDEO and AUDIO activities');
  }
}

export async function archiveLearningActivity(activityId: string, actorId: string): Promise<AdminLearningActivity> {
  return withTransaction(async (tx) => {
    const existing = await findActivityById(activityId, tx);
    if (!existing) throw AppError.notFound('Learning activity not found');

    const updated = await updateActivity(activityId, { status: 'ARCHIVED', updatedBy: actorId }, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.activity.archived', resourceType: 'learning_activity', resourceId: activityId },
      tx,
    );

    return toAdminActivity(updated);
  });
}

export async function reorderLessonActivities(lessonId: string, orderedIds: string[], actorId: string): Promise<void> {
  return withTransaction(async (tx) => {
    const lesson = await findLessonById(lessonId, tx);
    if (!lesson) throw AppError.notFound('Lesson not found');

    const existing = await findActivitiesByLesson(lessonId, tx);
    const existingIds = new Set(existing.map((a) => a.id));

    if (orderedIds.length !== existingIds.size || !orderedIds.every((id) => existingIds.has(id))) {
      throw AppError.badRequest("orderedIds must contain exactly this lesson's activities, no more and no fewer");
    }

    await reorderActivityPositions(lessonId, orderedIds, tx);

    await recordAuditEvent(
      { actorType: 'USER', actorId, action: 'lms.activity.reordered', resourceType: 'lesson', resourceId: lessonId, afterState: { orderedIds } },
      tx,
    );
  });
}

export async function listActivitiesForLessonAdmin(lessonId: string): Promise<AdminLearningActivity[]> {
  const lesson = await findLessonById(lessonId);
  if (!lesson) throw AppError.notFound('Lesson not found');
  const activities = await findActivitiesByLesson(lessonId);
  return activities.map(toAdminActivity);
}

function formatTimestamp(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * 004 Captions + Transcript Support batch (FR-044/FR-046) — the
 * "downloadable transcript" requirement. Generated at request time by
 * joining `transcriptSegments`' text — never separately stored, so there is
 * nothing to keep in sync. Same access check `recordActivityViewed` uses,
 * except preview viewers ARE allowed here (reading a transcript is not a
 * progress-tracking action, so it doesn't need the enrollment `viaPreview`
 * rejection that action does).
 */
export async function getMyActivityTranscriptDownload(userId: string, activityId: string): Promise<{ filename: string; content: string }> {
  const activity = await findActivityById(activityId);
  if (!activity || activity.status !== 'PUBLISHED') throw AppError.notFound('Learning activity not found');

  const segments = activity.transcriptSegments as TranscriptSegment[] | null;
  if (!segments || segments.length === 0) throw AppError.notFound('This activity has no transcript');

  const lesson = await findLessonById(activity.lessonId);
  if (!lesson) throw AppError.notFound('Learning activity not found');

  const module_ = await findModuleById(lesson.moduleId);
  if (!module_) throw AppError.notFound('Learning activity not found');

  const access = await evaluateLessonAccess(userId, module_.courseId, lesson.id);
  if (!access.allowed) throw AppError.forbidden(access.message);

  const content = segments.map((segment) => `[${formatTimestamp(segment.startSeconds)}] ${segment.text}`).join('\n');
  const filename = `${(activity.title ?? 'transcript').replace(/[^a-z0-9-_]+/gi, '-').toLowerCase()}.txt`;

  return { filename, content };
}
