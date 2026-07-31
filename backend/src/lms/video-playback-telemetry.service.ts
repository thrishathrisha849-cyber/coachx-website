import { AppError } from '../utils/app-error';
import { getPrismaClient } from '../database/prisma-client';
import { findLessonById } from './lesson.repository';
import { findModuleById } from './module.repository';
import { evaluateLessonAccess } from './access-evaluator.service';
import { findEnrollmentForUserAndCourse } from './enrollment.repository';
import { findActivityProgress, upsertActivityPlaybackStarted, upsertActivityPlaybackProgress } from './activity-progress.repository';
import { findOrCreateLmsSettings } from './lms-settings.repository';
import type { ActivityProgress } from '@prisma/client';

/**
 * 004 PiP + Video Playback Telemetry batch (FR-039/FR-040) — VIDEO
 * activities only (both FRs are explicitly scoped to "video lessons"; the
 * Captions + Transcript batch's VIDEO+AUDIO scoping does not apply here).
 * Picture-in-Picture itself (FR-039) needs no backend at all — it is the
 * browser's native `HTMLVideoElement.requestPictureInPicture()` API,
 * wired entirely in `LessonPlayerPage.tsx`.
 */

const MAX_WATCHED_DELTA_SECONDS = 60;

async function resolveVideoActivityContext(userId: string, activityId: string) {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const activity = await prisma.learningActivity.findFirst({ where: { id: activityId, deletedAt: null } });
  if (!activity || activity.status !== 'PUBLISHED') throw AppError.notFound('Learning activity not found');
  if (activity.type !== 'VIDEO') throw AppError.badRequest('Playback telemetry is only tracked for VIDEO activities');

  const lesson = await findLessonById(activity.lessonId);
  if (!lesson) throw AppError.notFound('Learning activity not found');

  const module_ = await findModuleById(lesson.moduleId);
  if (!module_) throw AppError.notFound('Learning activity not found');

  const access = await evaluateLessonAccess(userId, module_.courseId, lesson.id);
  if (!access.allowed) throw AppError.forbidden(access.message);
  if (access.viaPreview) throw AppError.badRequest('Enroll in this course to track playback');

  const enrollment = await findEnrollmentForUserAndCourse(userId, module_.courseId);
  if (!enrollment) throw AppError.notFound('Enrollment not found');

  return { activity, lesson, enrollment };
}

export interface PlaybackTelemetrySnapshot {
  watchedSeconds: number;
  furthestPositionSeconds: number;
  lastPositionSeconds: number | null;
  playbackStartCount: number;
  rewatchCount: number;
  lastPlaybackSpeed: number | null;
  completedPlaybackAt: string | null;
}

function toSnapshot(row: ActivityProgress): PlaybackTelemetrySnapshot {
  return {
    watchedSeconds: row.watchedSeconds,
    furthestPositionSeconds: row.furthestPositionSeconds,
    lastPositionSeconds: row.lastPositionSeconds,
    playbackStartCount: row.playbackStartCount,
    rewatchCount: row.rewatchCount,
    lastPlaybackSpeed: row.lastPlaybackSpeed,
    completedPlaybackAt: row.completedPlaybackAt ? row.completedPlaybackAt.toISOString() : null,
  };
}

/** POST /me/activities/:id/playback/started — a real "playback started" event, not a heartbeat. Detects rewatch by checking whether this activity was ALREADY marked complete before this start. */
export async function recordPlaybackStarted(
  userId: string,
  activityId: string,
  userAgent: string | null,
): Promise<PlaybackTelemetrySnapshot & { isRewatch: boolean }> {
  const { lesson, enrollment } = await resolveVideoActivityContext(userId, activityId);
  const existing = await findActivityProgress(enrollment.id, activityId);
  const isRewatch = !!existing?.completedPlaybackAt;

  const updated = await upsertActivityPlaybackStarted(
    enrollment.id,
    activityId,
    lesson.id,
    userAgent ? userAgent.slice(0, 512) : null,
    isRewatch,
  );

  return { ...toSnapshot(updated), isRewatch };
}

export interface PlaybackProgressInput {
  positionSeconds: number;
  watchedDeltaSeconds?: number;
  playbackSpeed?: number;
}

/** POST /me/activities/:id/playback/progress — a bounded, periodic heartbeat (same "do not audit every heartbeat" discipline as `progress.service.ts`'s own video-position reporting). */
export async function recordPlaybackProgress(userId: string, activityId: string, input: PlaybackProgressInput): Promise<PlaybackTelemetrySnapshot> {
  const { activity, lesson, enrollment } = await resolveVideoActivityContext(userId, activityId);
  const existing = await findActivityProgress(enrollment.id, activityId);

  const boundedDelta = Math.max(0, Math.min(input.watchedDeltaSeconds ?? 0, MAX_WATCHED_DELTA_SECONDS));
  const nextWatchedSeconds = (existing?.watchedSeconds ?? 0) + boundedDelta;
  const reportedPosition = Math.max(0, Math.round(input.positionSeconds));
  const nextFurthest = Math.max(existing?.furthestPositionSeconds ?? 0, reportedPosition);

  let completedPlaybackAt = existing?.completedPlaybackAt ?? null;
  if (!completedPlaybackAt && activity.durationSeconds) {
    const settings = await findOrCreateLmsSettings();
    const watchedPercent = (nextFurthest / activity.durationSeconds) * 100;
    if (watchedPercent >= settings.defaultVideoWatchThresholdPercent) completedPlaybackAt = new Date();
  }

  const updated = await upsertActivityPlaybackProgress(enrollment.id, activityId, lesson.id, {
    watchedSeconds: nextWatchedSeconds,
    furthestPositionSeconds: nextFurthest,
    lastPositionSeconds: reportedPosition,
    lastPlaybackSpeed: input.playbackSpeed ?? existing?.lastPlaybackSpeed ?? null,
    completedPlaybackAt,
  });

  return toSnapshot(updated);
}

/** GET /me/activities/:id/playback — the learner's own telemetry snapshot, used to restore resume position (FR-039) on load. `null` when this activity has never been played. */
export async function getMyPlaybackTelemetry(userId: string, activityId: string): Promise<PlaybackTelemetrySnapshot | null> {
  const { enrollment } = await resolveVideoActivityContext(userId, activityId);
  const existing = await findActivityProgress(enrollment.id, activityId);
  return existing ? toSnapshot(existing) : null;
}
