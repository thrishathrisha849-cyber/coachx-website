import { AppError } from '../utils/app-error';
import { findEnrollmentForUserAndCourse } from './enrollment.repository';
import { getPublishedModulesInOrder, evaluateModuleAccess } from './access-evaluator.service';
import { findPublishedLessonsByModule } from './lesson.repository';
import { findLessonProgressForEnrollment } from './progress.repository';
import { toPublicLessonSummary } from './lesson.serializers';
import type { PublicLessonSummary } from './lesson.types';

export interface ContinueLearningResult {
  courseComplete: boolean;
  nextLesson: (PublicLessonSummary & { moduleTitle: string }) | null;
  reason: 'RESUME_IN_PROGRESS' | 'START_NEXT' | 'COURSE_COMPLETE' | 'NO_ACCESSIBLE_CONTENT';
}

/**
 * Phase 6 Part 2B — server-derived "Continue Learning" (FR-020's primary
 * CTA). Deliberately has NO storage of its own (no `currentLessonId`
 * column anywhere) — it is recomputed from `LessonProgress` +
 * module/lesson structure on every call, so it can never drift out of
 * sync with the real progress data the way a cached "current lesson
 * pointer" field could (Part 2B: "not a second source of truth").
 *
 * Algorithm:
 *  1. If any lesson is IN_PROGRESS (not completed), resume the earliest
 *     such lesson by (module position, lesson position).
 *  2. Otherwise, walk modules/lessons in order and return the first
 *     lesson that is both accessible (via the SAME access evaluator every
 *     other read path uses) and not yet completed.
 *  3. If every accessible lesson is completed, report `COURSE_COMPLETE`.
 *  4. If no lesson is currently accessible at all (e.g. every remaining
 *     module is locked), report `NO_ACCESSIBLE_CONTENT` rather than
 *     silently returning a locked lesson as though it were actionable.
 */
export async function getContinueLearning(userId: string, courseId: string): Promise<ContinueLearningResult> {
  const enrollment = await findEnrollmentForUserAndCourse(userId, courseId);
  if (!enrollment) throw AppError.notFound('Enrollment not found');

  const modules = await getPublishedModulesInOrder(courseId);
  const progressRows = await findLessonProgressForEnrollment(enrollment.id);
  const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));

  // Pass 1 — resume an in-progress lesson, if any (earliest by module/lesson order).
  for (const module_ of modules) {
    const lessons = await findPublishedLessonsByModule(module_.id);
    for (const lesson of lessons.sort((a, b) => a.position - b.position)) {
      if (progressByLesson.get(lesson.id)?.status === 'IN_PROGRESS') {
        return { courseComplete: false, nextLesson: { ...toPublicLessonSummary(lesson), moduleTitle: module_.title }, reason: 'RESUME_IN_PROGRESS' };
      }
    }
  }

  // Pass 2 — first NOT-yet-completed, ACCESSIBLE lesson in course order.
  let sawAnyIncomplete = false;
  for (const module_ of modules) {
    const moduleAccess = await evaluateModuleAccess(userId, courseId, module_.id);
    const lessons = (await findPublishedLessonsByModule(module_.id)).sort((a, b) => a.position - b.position);

    for (const lesson of lessons) {
      const isCompleted = progressByLesson.get(lesson.id)?.status === 'COMPLETED';
      if (isCompleted) continue;
      sawAnyIncomplete = true;
      if (moduleAccess.allowed) {
        return { courseComplete: false, nextLesson: { ...toPublicLessonSummary(lesson), moduleTitle: module_.title }, reason: 'START_NEXT' };
      }
    }
  }

  if (!sawAnyIncomplete) {
    return { courseComplete: true, nextLesson: null, reason: 'COURSE_COMPLETE' };
  }

  return { courseComplete: false, nextLesson: null, reason: 'NO_ACCESSIBLE_CONTENT' };
}
