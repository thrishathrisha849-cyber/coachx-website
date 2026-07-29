import { AppError } from '../utils/app-error';
import { getPrismaClient } from '../database/prisma-client';
import { countEvents, countDistinctUsers } from './learning-event.service';

/**
 * 004 Learning Analytics & At-Risk Detection batch (FR-107) — per-lesson
 * analytics. FR-107 names eleven fields; five are built from real signals
 * (`LearningEvent`'s LESSON_VIEWED/RESOURCE_DOWNLOADED log,
 * `LessonProgress`'s start/complete/time-spent rows) — the remaining six
 * need infrastructure this codebase doesn't have (fine-grained video-
 * scrubbing telemetry for drop-off timestamp/replays, a Notes entity, a
 * Community/Discussion entity — spec 005 territory, and a client error-
 * telemetry pipeline) and are honestly reported via `notApplicable`
 * rather than guessed at.
 */

export interface LessonAnalytics {
  lessonId: string;
  lessonTitle: string;
  views: number;
  uniqueLearners: number;
  starts: number;
  completes: number;
  avgTimeSpentSeconds: number;
  resourceDownloads: number;
  dropOffTimestamp: null;
  replays: null;
  notesCreated: null;
  discussionActivity: null;
  errorRate: null;
  notApplicable: string[];
}

const NOT_APPLICABLE = ['dropOffTimestamp', 'replays', 'notesCreated', 'discussionActivity', 'errorRate'];

async function buildLessonAnalytics(lessonId: string, lessonTitle: string): Promise<LessonAnalytics> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const [views, uniqueLearners, progressRows, resourceDownloads] = await Promise.all([
    countEvents({ eventType: 'LESSON_VIEWED', lessonId }),
    countDistinctUsers({ eventType: 'LESSON_VIEWED', lessonId }),
    prisma.lessonProgress.findMany({ where: { lessonId }, select: { status: true, timeSpentSeconds: true } }),
    countEvents({ eventType: 'RESOURCE_DOWNLOADED', lessonId }),
  ]);

  const starts = progressRows.length;
  const completes = progressRows.filter((p) => p.status === 'COMPLETED').length;
  const avgTimeSpentSeconds = starts === 0 ? 0 : Math.round(progressRows.reduce((sum, p) => sum + p.timeSpentSeconds, 0) / starts);

  return {
    lessonId,
    lessonTitle,
    views,
    uniqueLearners,
    starts,
    completes,
    avgTimeSpentSeconds,
    resourceDownloads,
    dropOffTimestamp: null,
    replays: null,
    notesCreated: null,
    discussionActivity: null,
    errorRate: null,
    notApplicable: NOT_APPLICABLE,
  };
}

/** GET /admin/lessons/:lessonId/analytics */
export async function getLessonAnalytics(lessonId: string): Promise<LessonAnalytics> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { title: true } });
  if (!lesson) throw AppError.notFound('Lesson not found');

  return buildLessonAnalytics(lessonId, lesson.title);
}

/** Bulk variant — every PUBLISHED lesson in the course, used both by the admin per-course lessons-analytics view and by `course-analytics.service.ts`'s FR-106 "lesson drop-off" leaderboard. */
export async function getLessonAnalyticsForCourse(courseId: string): Promise<LessonAnalytics[]> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const lessons = await prisma.lesson.findMany({
    where: { status: 'PUBLISHED', module: { courseId } },
    select: { id: true, title: true },
    orderBy: [{ moduleId: 'asc' }, { position: 'asc' }],
  });

  return Promise.all(lessons.map((l) => buildLessonAnalytics(l.id, l.title)));
}
