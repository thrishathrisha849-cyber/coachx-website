import { AppError } from '../utils/app-error';
import { getPrismaClient } from '../database/prisma-client';

/**
 * 004 Learning Analytics & At-Risk Detection batch (FR-108). Every signal
 * below is computed from a real, already-persisted table — no fabricated
 * heuristic. FR-108 names six signals; "low attendance" has no owning
 * signal in this codebase (no Live Session/attendance entity — Volume 10
 * Events territory, not yet built here) and is honestly reported via
 * `notApplicableSignals` rather than guessed at. FR-108 also names six
 * triggered actions; only two have a real mechanism to realize them in
 * this codebase — see `notApplicableActions` below for the rest.
 */

export type AtRiskSignalType =
  | 'NO_ACTIVITY_SINCE_ENROLLMENT'
  | 'LONG_INACTIVITY'
  | 'REPEATED_QUIZ_FAILURE'
  | 'MISSED_ASSIGNMENT'
  | 'ACCESS_NEARING_EXPIRY';

export interface AtRiskSignal {
  type: AtRiskSignalType;
  detail: string;
}

export interface RecommendedRevision {
  lessonId: string;
  lessonTitle: string;
  quizTitle: string;
}

export interface AtRiskAssessment {
  enrollmentId: string;
  userId: string;
  courseId: string;
  atRiskScore: number; // 0–100, sum of triggered signal weights, clamped
  signals: AtRiskSignal[];
  recommendedRevision: RecommendedRevision | null;
  instructorAlertRaised: boolean; // real — this assessment appearing in the admin at-risk list IS the instructor alert
  notApplicableSignals: string[];
  notApplicableActions: string[];
}

const NO_ACTIVITY_GRACE_DAYS = 3;
const LONG_INACTIVITY_DAYS = 14;
const ACCESS_EXPIRY_WARNING_DAYS = 7;
const REPEATED_FAILURE_THRESHOLD = 2;

const SIGNAL_WEIGHT: Record<AtRiskSignalType, number> = {
  NO_ACTIVITY_SINCE_ENROLLMENT: 30,
  LONG_INACTIVITY: 25,
  REPEATED_QUIZ_FAILURE: 20,
  MISSED_ASSIGNMENT: 15,
  ACCESS_NEARING_EXPIRY: 20,
};

const NOT_APPLICABLE_SIGNALS = ['lowAttendance'];
const NOT_APPLICABLE_ACTIONS = ['reminder', 'mentorSuggestion', 'supportOutreach', 'simplifiedRestartPlan'];

const ONGOING_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED'];

interface PublishedAssignmentDue {
  id: string;
  lessonId: string;
  title: string;
  dueAt: Date;
}

/** Every PUBLISHED, past-due assignment in the course — fetched once per course-level call, reused across every enrollment's assessment rather than refetched per learner. */
async function findPastDuePublishedAssignments(courseId: string): Promise<PublishedAssignmentDue[]> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const rows = await prisma.assignment.findMany({
    where: { status: 'PUBLISHED', deletedAt: null, dueAt: { lt: new Date() }, lesson: { module: { courseId } } },
    select: { id: true, lessonId: true, title: true, dueAt: true },
  });
  return rows.filter((r): r is PublishedAssignmentDue => r.dueAt !== null);
}

/** A "missed" assignment: past its due date, and this enrollment's latest submission (if any) never reached a submitted-or-later state. */
async function findMissedAssignmentTitles(enrollmentId: string, pastDueAssignments: PublishedAssignmentDue[]): Promise<string[]> {
  if (pastDueAssignments.length === 0) return [];
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const submissions = await prisma.submission.findMany({
    where: { enrollmentId, assignmentId: { in: pastDueAssignments.map((a) => a.id) } },
    orderBy: { attemptNumber: 'desc' },
    select: { assignmentId: true, status: true },
  });
  const latestStatusByAssignment = new Map<string, string>();
  for (const s of submissions) {
    if (!latestStatusByAssignment.has(s.assignmentId)) latestStatusByAssignment.set(s.assignmentId, s.status);
  }

  return pastDueAssignments
    .filter((a) => {
      const latest = latestStatusByAssignment.get(a.id);
      return latest === undefined || latest === 'DRAFT';
    })
    .map((a) => a.title);
}

/** Same "last failed GRADED attempt → revise its lesson" signal `recommendation.service.ts`'s `recommendFromFailedQuiz` already established, scoped to this one enrollment rather than a user's every enrollment. */
async function findRevisionForRepeatedFailure(enrollmentId: string): Promise<RecommendedRevision | null> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const failedAttempt = await prisma.quizAttempt.findFirst({
    where: { enrollmentId, status: 'GRADED', passed: false },
    orderBy: { gradedAt: 'desc' },
    include: { quiz: { include: { lesson: true } } },
  });
  if (!failedAttempt) return null;

  return {
    lessonId: failedAttempt.quiz.lesson.id,
    lessonTitle: failedAttempt.quiz.lesson.title,
    quizTitle: failedAttempt.quiz.title,
  };
}

interface EnrollmentCore {
  id: string;
  userId: string;
  courseId: string;
  status: string;
  enrolledAt: Date;
  lastAccessedAt: Date | null;
  accessEndAt: Date | null;
  completedAt: Date | null;
}

async function assessEnrollmentCore(
  enrollment: EnrollmentCore,
  pastDueAssignments: PublishedAssignmentDue[],
): Promise<AtRiskAssessment | null> {
  if (!ONGOING_STATUSES.includes(enrollment.status)) return null;

  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const signals: AtRiskSignal[] = [];

  if (enrollment.lastAccessedAt === null && now.getTime() - enrollment.enrolledAt.getTime() > NO_ACTIVITY_GRACE_DAYS * msPerDay) {
    signals.push({
      type: 'NO_ACTIVITY_SINCE_ENROLLMENT',
      detail: `No activity recorded since enrolling on ${enrollment.enrolledAt.toISOString().slice(0, 10)}`,
    });
  }

  if (
    enrollment.lastAccessedAt !== null &&
    now.getTime() - enrollment.lastAccessedAt.getTime() > LONG_INACTIVITY_DAYS * msPerDay
  ) {
    const idleDays = Math.floor((now.getTime() - enrollment.lastAccessedAt.getTime()) / msPerDay);
    signals.push({ type: 'LONG_INACTIVITY', detail: `No activity for ${idleDays} days after starting this course` });
  }

  const failedGradedCount = await prisma.quizAttempt.count({
    where: { enrollmentId: enrollment.id, status: 'GRADED', passed: false },
  });
  if (failedGradedCount >= REPEATED_FAILURE_THRESHOLD) {
    signals.push({ type: 'REPEATED_QUIZ_FAILURE', detail: `${failedGradedCount} failed quiz attempts` });
  }

  const missedTitles = await findMissedAssignmentTitles(enrollment.id, pastDueAssignments);
  if (missedTitles.length > 0) {
    signals.push({ type: 'MISSED_ASSIGNMENT', detail: `${missedTitles.length} assignment(s) past due and not submitted: ${missedTitles.join(', ')}` });
  }

  if (
    enrollment.completedAt === null &&
    enrollment.accessEndAt !== null &&
    enrollment.accessEndAt.getTime() > now.getTime() &&
    enrollment.accessEndAt.getTime() - now.getTime() < ACCESS_EXPIRY_WARNING_DAYS * msPerDay
  ) {
    const daysLeft = Math.ceil((enrollment.accessEndAt.getTime() - now.getTime()) / msPerDay);
    signals.push({ type: 'ACCESS_NEARING_EXPIRY', detail: `Course access expires in ${daysLeft} day(s)` });
  }

  const atRiskScore = Math.min(100, signals.reduce((sum, s) => sum + SIGNAL_WEIGHT[s.type], 0));

  const recommendedRevision = signals.some((s) => s.type === 'REPEATED_QUIZ_FAILURE')
    ? await findRevisionForRepeatedFailure(enrollment.id)
    : null;

  return {
    enrollmentId: enrollment.id,
    userId: enrollment.userId,
    courseId: enrollment.courseId,
    atRiskScore,
    signals,
    recommendedRevision,
    instructorAlertRaised: atRiskScore > 0,
    notApplicableSignals: NOT_APPLICABLE_SIGNALS,
    notApplicableActions: NOT_APPLICABLE_ACTIONS,
  };
}

/** GET /admin/enrollments/:id/at-risk — single-learner assessment (also feeds `learner-analytics.service.ts`'s `atRiskScore` field). Returns null for an enrollment that is not in an ongoing state (COMPLETED/CANCELLED/REVOKED/EXPIRED are never "at risk"). */
export async function assessAtRiskForEnrollment(enrollmentId: string): Promise<AtRiskAssessment | null> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) throw AppError.notFound('Enrollment not found');

  const pastDueAssignments = await findPastDuePublishedAssignments(enrollment.courseId);
  return assessEnrollmentCore(enrollment, pastDueAssignments);
}

/** GET /admin/courses/:courseId/at-risk-learners — FR-108's "instructor alert" surface: every ongoing enrollment in the course with atRiskScore > 0, sorted worst-first. Same "the admin UI surface itself is the deferred-infra substitute" pattern `certificate.service.ts`'s browser-printable page already established for its own deferred infra. */
export async function listAtRiskLearnersForCourse(courseId: string): Promise<AtRiskAssessment[]> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const enrollments = await prisma.enrollment.findMany({ where: { courseId, status: { in: ONGOING_STATUSES as never } } });
  const pastDueAssignments = await findPastDuePublishedAssignments(courseId);

  const assessments = await Promise.all(enrollments.map((e) => assessEnrollmentCore(e, pastDueAssignments)));
  return assessments
    .filter((a): a is AtRiskAssessment => a !== null && a.atRiskScore > 0)
    .sort((a, b) => b.atRiskScore - a.atRiskScore);
}
