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
 * `docs/lms/COMPLETION_ENGINE.md`). Deliberately a thin, single-purpose
 * repository — this table has exactly one write path
 * (`upsertActivityViewed`) and exactly one read shape callers need
 * (`findActivityProgressForLesson`, used to answer "are all of this
 * lesson's activities viewed").
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
