import type { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import type { TransactionClient } from '../database/transaction';

function db(tx?: TransactionClient): PrismaClient | TransactionClient {
  const client = tx ?? getPrismaClient();
  if (!client) throw AppError.internal('Database is not connected');
  return client;
}

/**
 * Phase 6 Part 2 correction pass — real, server-derived activity-viewed
 * tracking backing `ALL_ACTIVITIES_VIEWED` lesson completion (see
 * `docs/lms/COMPLETION_ENGINE.md`). Originally a thin, single-purpose
 * repository with exactly one write path (`upsertActivityViewed`); the 004
 * PiP + Video Playback Telemetry batch (FR-040) added two more
 * (`upsertActivityPlaybackStarted`/`upsertActivityPlaybackProgress`),
 * writing to the SAME row via the SAME `(enrollmentId, activityId)` unique
 * key rather than a separate telemetry table — a "viewed" row and a
 * "playback telemetry" row for the same activity are the same underlying
 * fact (this learner's engagement with this activity).
 */

export function findActivityProgress(enrollmentId: string, activityId: string, tx?: TransactionClient) {
  return db(tx).activityProgress.findUnique({ where: { enrollmentId_activityId: { enrollmentId, activityId } } });
}

export function findActivityProgressForLesson(enrollmentId: string, lessonId: string, tx?: TransactionClient) {
  return db(tx).activityProgress.findMany({ where: { enrollmentId, lessonId } });
}

/**
 * Idempotent upsert — a repeat "viewed" event for the same
 * (enrollment, activity) pair is a safe no-op (the `@@unique` constraint
 * plus `upsert` guarantee exactly one row, `viewedAt` only ever set once
 * on first view, never overwritten to a later timestamp on a replay).
 */
export function upsertActivityViewed(enrollmentId: string, activityId: string, lessonId: string, tx?: TransactionClient) {
  const now = new Date();
  return db(tx).activityProgress.upsert({
    where: { enrollmentId_activityId: { enrollmentId, activityId } },
    create: { enrollmentId, activityId, lessonId, viewedAt: now },
    update: {}, // already viewed — do not overwrite viewedAt on a replay
  });
}

/**
 * 004 PiP + Video Playback Telemetry batch (FR-040) — "playback started."
 * `isRewatch` is decided by the SERVICE layer (it already fetched the
 * existing row to check `completedPlaybackAt`) — this repository function
 * only persists the resulting counts, never re-derives them.
 */
export function upsertActivityPlaybackStarted(
  enrollmentId: string,
  activityId: string,
  lessonId: string,
  userAgent: string | null,
  isRewatch: boolean,
  tx?: TransactionClient,
) {
  return db(tx).activityProgress.upsert({
    where: { enrollmentId_activityId: { enrollmentId, activityId } },
    create: { enrollmentId, activityId, lessonId, playbackStartCount: 1, rewatchCount: isRewatch ? 1 : 0, lastUserAgent: userAgent },
    update: {
      playbackStartCount: { increment: 1 },
      ...(isRewatch ? { rewatchCount: { increment: 1 } } : {}),
      lastUserAgent: userAgent,
    },
  });
}

/**
 * 004 PiP + Video Playback Telemetry batch (FR-040) — "watched
 * duration"/"furthest position"/"current position"/"playback speed." The
 * service layer computes every field's FINAL absolute value (merging
 * against the existing row, clamping/bounding) before calling this —
 * matching `activity.service.ts`'s own "merge-then-persist" convention —
 * so this function is a plain upsert, not a place where anti-rollback
 * logic lives.
 */
export function upsertActivityPlaybackProgress(
  enrollmentId: string,
  activityId: string,
  lessonId: string,
  data: {
    watchedSeconds: number;
    furthestPositionSeconds: number;
    lastPositionSeconds: number;
    lastPlaybackSpeed: number | null;
    completedPlaybackAt: Date | null;
  },
  tx?: TransactionClient,
) {
  return db(tx).activityProgress.upsert({
    where: { enrollmentId_activityId: { enrollmentId, activityId } },
    create: { enrollmentId, activityId, lessonId, ...data },
    update: { ...data },
  });
}
