import { AppError } from '../utils/app-error';
import { getPrismaClient } from '../database/prisma-client';
import { computeCourseProgress } from './progress.service';
import { findLessonProgressForEnrollment } from './progress.repository';
import { assessAtRiskForEnrollment, type AtRiskSignal } from './at-risk.service';

/**
 * 004 Learning Analytics & At-Risk Detection batch (FR-105) — single-
 * enrollment ("user-level") analytics. FR-105 names eleven fields; ten are
 * built from real, already-persisted data (`LessonProgress`, `QuizAttempt`,
 * `Submission`, `Certificate`, `at-risk.service.ts`'s own signals) — only
 * `attendance` has no owning entity in this codebase (no Live Session
 * model) and is honestly reported as `null` via `notApplicable` rather
 * than fabricated.
 */

export interface LearnerQuizAttemptSummary {
  quizId: string;
  quizTitle: string;
  attemptNumber: number;
  status: string;
  scorePercent: number | null;
  passed: boolean | null;
}

export interface LearnerAssignmentSubmissionSummary {
  assignmentId: string;
  assignmentTitle: string;
  attemptNumber: number;
  status: string;
  score: number | null;
  passed: boolean | null;
  isLate: boolean;
}

export interface LearnerAnalytics {
  enrollmentId: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: Date;
  lastActivityAt: Date | null;
  progressPercent: number;
  timeSpentSeconds: number;
  lessonsCompleted: number;
  totalMandatoryLessons: number;
  quizAttempts: LearnerQuizAttemptSummary[];
  assignmentSubmissions: LearnerAssignmentSubmissionSummary[];
  certificateIssued: boolean;
  certificateCredentialId: string | null;
  dropOffLessonId: string | null;
  dropOffLessonTitle: string | null;
  atRiskScore: number;
  atRiskSignals: AtRiskSignal[];
  attendance: null;
  notApplicable: string[];
}

/** GET /admin/enrollments/:id/analytics — the FR-105 per-learner view. */
export async function getLearnerAnalyticsForEnrollment(enrollmentId: string): Promise<LearnerAnalytics> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: { select: { title: true } }, certificate: { select: { credentialId: true } } },
  });
  if (!enrollment) throw AppError.notFound('Enrollment not found');

  const [courseProgress, lessonProgressRows, quizAttempts, submissions, atRisk] = await Promise.all([
    computeCourseProgress(enrollment.id, enrollment.courseId),
    findLessonProgressForEnrollment(enrollment.id),
    prisma.quizAttempt.findMany({
      where: { enrollmentId: enrollment.id },
      orderBy: [{ startedAt: 'asc' }],
      include: { quiz: { select: { title: true } } },
    }),
    prisma.submission.findMany({
      where: { enrollmentId: enrollment.id },
      orderBy: [{ createdAt: 'asc' }],
      include: { assignment: { select: { title: true } } },
    }),
    assessAtRiskForEnrollment(enrollment.id),
  ]);

  const timeSpentSeconds = lessonProgressRows.reduce((sum, p) => sum + p.timeSpentSeconds, 0);
  const lessonsCompleted = lessonProgressRows.filter((p) => p.status === 'COMPLETED').length;
  const totalMandatoryLessons = courseProgress.modules.reduce((sum, m) => sum + m.totalMandatoryLessons, 0);

  const dropOffCandidate = lessonProgressRows
    .filter((p) => p.status === 'IN_PROGRESS')
    .sort((a, b) => (b.lastAccessedAt?.getTime() ?? 0) - (a.lastAccessedAt?.getTime() ?? 0))[0];
  let dropOffLessonTitle: string | null = null;
  if (dropOffCandidate) {
    const lesson = await prisma.lesson.findUnique({ where: { id: dropOffCandidate.lessonId }, select: { title: true } });
    dropOffLessonTitle = lesson?.title ?? null;
  }

  return {
    enrollmentId: enrollment.id,
    userId: enrollment.userId,
    courseId: enrollment.courseId,
    courseTitle: enrollment.course.title,
    enrolledAt: enrollment.enrolledAt,
    lastActivityAt: enrollment.lastAccessedAt,
    progressPercent: courseProgress.percentage,
    timeSpentSeconds,
    lessonsCompleted,
    totalMandatoryLessons,
    quizAttempts: quizAttempts.map((a) => ({
      quizId: a.quizId,
      quizTitle: a.quiz.title,
      attemptNumber: a.attemptNumber,
      status: a.status,
      scorePercent: a.scorePercent,
      passed: a.passed,
    })),
    assignmentSubmissions: submissions.map((s) => ({
      assignmentId: s.assignmentId,
      assignmentTitle: s.assignment.title,
      attemptNumber: s.attemptNumber,
      status: s.status,
      score: s.score,
      passed: s.passed,
      isLate: s.isLate,
    })),
    certificateIssued: enrollment.certificate !== null,
    certificateCredentialId: enrollment.certificate?.credentialId ?? null,
    dropOffLessonId: dropOffCandidate?.lessonId ?? null,
    dropOffLessonTitle,
    atRiskScore: atRisk?.atRiskScore ?? 0,
    atRiskSignals: atRisk?.signals ?? [],
    attendance: null,
    notApplicable: ['attendance'],
  };
}
