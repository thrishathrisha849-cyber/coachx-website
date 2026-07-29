import { AppError } from '../utils/app-error';
import { getPrismaClient } from '../database/prisma-client';

/**
 * 004 Discovery & Recommendations batch (FR-088) — the "deterministic
 * non-AI fallback" FR-088 itself requires ("MUST provide a deterministic
 * non-AI fallback when the AI-driven recommendation is unavailable"). No
 * AI wrapper of any kind exists anywhere in this codebase yet (008 AI
 * Assistant Platform is a later, not-yet-reached spec) — so this IS the
 * baseline engine, not a fallback bolted onto a real AI path. Every output
 * is computed from real, already-persisted signals (enrollment history,
 * quiz-attempt results, course popularity) — never fabricated.
 *
 * FR-088 names six output types: next course, revision lesson, practice
 * quiz, mentor support, related resource, and challenge. Three have a real
 * owning signal in this codebase and are implemented below; the other
 * three have no owning entity yet (no Mentor Marketplace — spec 007; no
 * standalone Resource entity; no Gamification Challenge — spec 006) and
 * are honestly reported via `notApplicable` rather than guessed at.
 */

export interface RecommendationItem {
  type: 'NEXT_COURSE' | 'REVISION_LESSON' | 'PRACTICE_QUIZ';
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  lessonId?: string;
  lessonTitle?: string;
  quizId?: string;
  reason: string;
}

export interface RecommendationResult {
  items: RecommendationItem[];
  notApplicable: string[];
}

async function recommendNextCourse(userId: string): Promise<RecommendationItem | null> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    orderBy: [{ lastAccessedAt: 'desc' }, { enrolledAt: 'desc' }],
    include: { course: { select: { id: true, categoryId: true } } },
  });
  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
  const preferredCategoryId = enrollments.find((e) => e.course.categoryId)?.course.categoryId ?? undefined;

  const candidate =
    (preferredCategoryId &&
      (await prisma.course.findFirst({
        where: { status: 'PUBLISHED', categoryId: preferredCategoryId, id: { notIn: [...enrolledCourseIds] } },
        orderBy: { learnerCount: 'desc' },
      }))) ||
    (await prisma.course.findFirst({
      where: { status: 'PUBLISHED', id: { notIn: [...enrolledCourseIds] } },
      orderBy: { learnerCount: 'desc' },
    }));

  if (!candidate) return null;
  return {
    type: 'NEXT_COURSE',
    courseId: candidate.id,
    courseTitle: candidate.title,
    courseSlug: candidate.slug,
    reason: preferredCategoryId ? 'Popular in a category you are already learning in' : 'One of our most popular courses',
  };
}

async function recommendFromFailedQuiz(userId: string): Promise<{ revision: RecommendationItem | null; practice: RecommendationItem | null }> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const failedAttempt = await prisma.quizAttempt.findFirst({
    where: { status: 'GRADED', passed: false, enrollment: { userId } },
    orderBy: { gradedAt: 'desc' },
    include: {
      quiz: {
        include: {
          lesson: { include: { module: { include: { course: { select: { id: true, title: true, slug: true } } } } } },
          attempts: { where: { enrollment: { userId } } },
        },
      },
    },
  });

  if (!failedAttempt) return { revision: null, practice: null };

  const course = failedAttempt.quiz.lesson.module.course;
  const revision: RecommendationItem = {
    type: 'REVISION_LESSON',
    courseId: course.id,
    courseTitle: course.title,
    courseSlug: course.slug,
    lessonId: failedAttempt.quiz.lesson.id,
    lessonTitle: failedAttempt.quiz.lesson.title,
    reason: `You didn't pass "${failedAttempt.quiz.title}" yet — review this lesson before trying again`,
  };

  const attemptsUsed = failedAttempt.quiz.attempts.length;
  const canRetake = failedAttempt.quiz.maxAttempts === null || attemptsUsed < failedAttempt.quiz.maxAttempts;
  const practice: RecommendationItem | null = canRetake
    ? {
        type: 'PRACTICE_QUIZ',
        courseId: course.id,
        courseTitle: course.title,
        courseSlug: course.slug,
        lessonId: failedAttempt.quiz.lesson.id,
        quizId: failedAttempt.quiz.id,
        reason: `Retake "${failedAttempt.quiz.title}" — you have attempts remaining`,
      }
    : null;

  return { revision, practice };
}

export async function getRecommendationsForLearner(userId: string): Promise<RecommendationResult> {
  const [nextCourse, fromFailedQuiz] = await Promise.all([recommendNextCourse(userId), recommendFromFailedQuiz(userId)]);

  const items = [nextCourse, fromFailedQuiz.revision, fromFailedQuiz.practice].filter((item): item is RecommendationItem => item !== null);

  return {
    items,
    notApplicable: ['mentorSupport', 'relatedResource', 'challenge'],
  };
}
