import { AppError } from '../utils/app-error';
import { getPrismaClient } from '../database/prisma-client';
import { getLessonAnalyticsForCourse } from './lesson-analytics.service';

/**
 * 004 Learning Analytics & At-Risk Detection batch (FR-106) — admin-facing
 * course-level analytics. FR-106 names thirteen fields; nine are built
 * from real, already-persisted data (`Enrollment`, `QuizAttempt`,
 * `Submission`, `Certificate`, `Course.ratingAverage`/`ratingCount` from
 * the Discovery batch, and this batch's own `LearningEvent` log for video
 * engagement) — `refundCorrelation` (no payment/refund system — spec 009
 * territory), `deviceDistribution`, and `languageDistribution` (no
 * device/session-language telemetry) have no owning signal in this
 * codebase and are honestly reported via `notApplicable` rather than
 * fabricated.
 */

export interface LessonDropOffEntry {
  lessonId: string;
  lessonTitle: string;
  starts: number;
  completes: number;
  dropOff: number;
}

export interface VideoEngagementSummary {
  learnersWithVideoActivity: number;
  avgWatchedPercent: number;
}

export interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  enrollments: number;
  activeLearners: number;
  completionRate: number;
  avgCompletionTimeDays: number;
  lessonDropOff: LessonDropOffEntry[];
  videoEngagement: VideoEngagementSummary;
  quizPassRate: number;
  assignmentApprovalRate: number;
  ratingAverage: number | null;
  ratingCount: number;
  refundCorrelation: null;
  certificateRate: number;
  deviceDistribution: null;
  languageDistribution: null;
  notApplicable: string[];
}

const NOT_APPLICABLE = ['refundCorrelation', 'deviceDistribution', 'languageDistribution'];

async function computeVideoEngagement(courseId: string): Promise<VideoEngagementSummary> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const events = await prisma.learningEvent.findMany({
    where: { courseId, eventType: { in: ['VIDEO_STARTED', 'VIDEO_PROGRESSED'] as never } },
    select: { userId: true, lessonId: true, metadata: true },
  });

  const maxWatchedByLearnerLesson = new Map<string, number>();
  for (const e of events) {
    if (!e.userId || !e.lessonId) continue;
    const watchedPercent = (e.metadata as { watchedPercent?: number } | null)?.watchedPercent;
    if (typeof watchedPercent !== 'number') continue;
    const key = `${e.userId}:${e.lessonId}`;
    maxWatchedByLearnerLesson.set(key, Math.max(maxWatchedByLearnerLesson.get(key) ?? 0, watchedPercent));
  }

  const values = [...maxWatchedByLearnerLesson.values()];
  return {
    learnersWithVideoActivity: new Set(events.filter((e) => e.userId).map((e) => e.userId)).size,
    avgWatchedPercent: values.length === 0 ? 0 : Math.round(values.reduce((sum, v) => sum + v, 0) / values.length),
  };
}

/** GET /admin/courses/:courseId/analytics */
export async function getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true, ratingAverage: true, ratingCount: true } });
  if (!course) throw AppError.notFound('Course not found');

  const [
    enrollments,
    activeLearners,
    completedEnrollments,
    lessonAnalytics,
    videoEngagement,
    gradedAttempts,
    reviewedSubmissions,
    certificatesIssued,
  ] = await Promise.all([
    prisma.enrollment.count({ where: { courseId } }),
    prisma.enrollment.count({ where: { courseId, status: 'ACTIVE' } }),
    prisma.enrollment.findMany({ where: { courseId, status: 'COMPLETED' }, select: { enrolledAt: true, completedAt: true } }),
    getLessonAnalyticsForCourse(courseId),
    computeVideoEngagement(courseId),
    prisma.quizAttempt.count({ where: { status: 'GRADED', passed: true, quiz: { lesson: { module: { courseId } } } } }).then(async (passedCount) => {
      const totalGraded = await prisma.quizAttempt.count({ where: { status: 'GRADED', quiz: { lesson: { module: { courseId } } } } });
      return { passedCount, totalGraded };
    }),
    prisma.submission.count({ where: { status: 'APPROVED', assignment: { lesson: { module: { courseId } } } } }).then(async (approvedCount) => {
      const totalReviewed = await prisma.submission.count({
        where: { status: { in: ['APPROVED', 'REJECTED'] }, assignment: { lesson: { module: { courseId } } } },
      });
      return { approvedCount, totalReviewed };
    }),
    prisma.certificate.count({ where: { courseId } }),
  ]);

  const completionRate = enrollments === 0 ? 0 : Math.round((completedEnrollments.length / enrollments) * 100);

  const completionDurationsMs = completedEnrollments
    .filter((e) => e.completedAt !== null)
    .map((e) => e.completedAt!.getTime() - e.enrolledAt.getTime());
  const avgCompletionTimeDays =
    completionDurationsMs.length === 0
      ? 0
      : Math.round((completionDurationsMs.reduce((sum, ms) => sum + ms, 0) / completionDurationsMs.length / 86_400_000) * 10) / 10;

  const lessonDropOff: LessonDropOffEntry[] = lessonAnalytics
    .map((l) => ({ lessonId: l.lessonId, lessonTitle: l.lessonTitle, starts: l.starts, completes: l.completes, dropOff: l.starts - l.completes }))
    .filter((l) => l.dropOff > 0)
    .sort((a, b) => b.dropOff - a.dropOff)
    .slice(0, 5);

  const quizPassRate = gradedAttempts.totalGraded === 0 ? 0 : Math.round((gradedAttempts.passedCount / gradedAttempts.totalGraded) * 100);
  const assignmentApprovalRate =
    reviewedSubmissions.totalReviewed === 0 ? 0 : Math.round((reviewedSubmissions.approvedCount / reviewedSubmissions.totalReviewed) * 100);
  const certificateRate = completedEnrollments.length === 0 ? 0 : Math.round((certificatesIssued / completedEnrollments.length) * 100);

  return {
    courseId,
    courseTitle: course.title,
    enrollments,
    activeLearners,
    completionRate,
    avgCompletionTimeDays,
    lessonDropOff,
    videoEngagement,
    quizPassRate,
    assignmentApprovalRate,
    ratingAverage: course.ratingAverage,
    ratingCount: course.ratingCount,
    refundCorrelation: null,
    certificateRate,
    deviceDistribution: null,
    languageDistribution: null,
    notApplicable: NOT_APPLICABLE,
  };
}
