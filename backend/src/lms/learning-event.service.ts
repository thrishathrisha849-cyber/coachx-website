import { getPrismaClient } from '../database/prisma-client';
import { logger } from '../utils/logger';
import type { TransactionClient } from '../database/transaction';

/**
 * 004 Learning Analytics & At-Risk Detection batch (FR-109) — the event
 * taxonomy every FR-105/106/107/108 aggregate reads from. Same
 * never-throws, silently-drops-on-disconnect discipline `audit-event.
 * repository.ts`'s `recordAuditEvent` already established — an analytics
 * event failing to write must never be the reason a real learner action
 * (enrolling, submitting a quiz, etc.) fails.
 *
 * FR-109 names 19 event types; `learning_path_started`/`learning_path_
 * completed` are deliberately not modeled — no LearningPath entity exists
 * in this codebase (see schema.prisma's `LearningEvent` doc comment).
 */
export type LearningEventType =
  | 'COURSE_VIEWED'
  | 'COURSE_ENROLLED'
  | 'COURSE_STARTED'
  | 'LESSON_VIEWED'
  | 'VIDEO_STARTED'
  | 'VIDEO_PROGRESSED'
  | 'LESSON_COMPLETED'
  | 'QUIZ_STARTED'
  | 'QUIZ_SUBMITTED'
  | 'QUIZ_PASSED'
  | 'QUIZ_FAILED'
  | 'ASSIGNMENT_STARTED'
  | 'ASSIGNMENT_SUBMITTED'
  | 'ASSIGNMENT_REVIEWED'
  | 'COURSE_COMPLETED'
  | 'CERTIFICATE_ISSUED'
  | 'RESOURCE_DOWNLOADED';

export interface RecordLearningEventInput {
  eventType: LearningEventType;
  userId?: string | null;
  courseId?: string | null;
  lessonId?: string | null;
  enrollmentId?: string | null;
  metadata?: unknown;
}

export async function recordLearningEvent(input: RecordLearningEventInput, tx?: TransactionClient): Promise<void> {
  const db = tx ?? getPrismaClient();
  if (!db) {
    logger.warn('Learning event dropped — database not connected', { eventType: input.eventType });
    return;
  }

  try {
    await db.learningEvent.create({
      data: {
        eventType: input.eventType as never,
        userId: input.userId ?? null,
        courseId: input.courseId ?? null,
        lessonId: input.lessonId ?? null,
        enrollmentId: input.enrollmentId ?? null,
        metadata: (input.metadata ?? undefined) as never,
      },
    });
  } catch (err) {
    // Never let an analytics-logging failure fail the real learner action
    // that triggered it (same rationale as recordAuditEvent's own no-op).
    logger.warn('Learning event write failed', { eventType: input.eventType, error: err instanceof Error ? err.message : err });
  }
}

// --- Read helpers used by the analytics aggregation services ---------------

export async function countEvents(filter: { eventType: LearningEventType; courseId?: string; lessonId?: string; userId?: string }): Promise<number> {
  const db = getPrismaClient();
  if (!db) return 0;
  return db.learningEvent.count({
    where: {
      eventType: filter.eventType as never,
      ...(filter.courseId ? { courseId: filter.courseId } : {}),
      ...(filter.lessonId ? { lessonId: filter.lessonId } : {}),
      ...(filter.userId ? { userId: filter.userId } : {}),
    },
  });
}

export async function countDistinctUsers(filter: { eventType: LearningEventType; lessonId?: string; courseId?: string }): Promise<number> {
  const db = getPrismaClient();
  if (!db) return 0;
  const rows = await db.learningEvent.findMany({
    where: {
      eventType: filter.eventType as never,
      ...(filter.lessonId ? { lessonId: filter.lessonId } : {}),
      ...(filter.courseId ? { courseId: filter.courseId } : {}),
      userId: { not: null },
    },
    distinct: ['userId'],
    select: { userId: true },
  });
  return rows.length;
}
