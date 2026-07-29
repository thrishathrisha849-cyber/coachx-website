import { AppError } from '../utils/app-error';
import { evaluateCourseAccess, evaluateModuleAccess, getPublishedModulesInOrder } from './access-evaluator.service';
import { findEnrollmentForUserAndCourse } from './enrollment.repository';
import { findPublishedLessonsByModule } from './lesson.repository';
import { findLessonProgressForEnrollment } from './progress.repository';

export interface CurriculumLessonItem {
  id: string;
  title: string;
  slug: string;
  position: number;
  durationMinutes: number | null;
  isMandatory: boolean;
  isPreview: boolean;
  locked: boolean;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface CurriculumModuleItem {
  id: string;
  title: string;
  position: number;
  isMandatory: boolean;
  locked: boolean;
  lockReason?: string;
  unlockAt?: Date;
  lessons: CurriculumLessonItem[];
}

/**
 * 004 US2 lesson-player curriculum sidebar. No student-facing "list
 * lessons in a module" endpoint existed before this — the public catalog
 * (`getPublicCourseModulesBySlug`) only returns module metadata, and the
 * only per-lesson read was the admin/instructor list. This reuses the SAME
 * `access-evaluator.service.ts` pipeline every other content path uses
 * (never a bespoke lock check) so the sidebar's locked/unlocked state can
 * never drift from what `GET /me/lessons/:lessonId` itself would allow.
 */
export async function getCourseCurriculumForLearner(userId: string, courseId: string): Promise<CurriculumModuleItem[]> {
  const courseAccess = await evaluateCourseAccess(userId, courseId);
  if (!courseAccess.allowed) {
    throw AppError.forbidden(courseAccess.message);
  }

  const enrollment = await findEnrollmentForUserAndCourse(userId, courseId);
  const progressRows = enrollment ? await findLessonProgressForEnrollment(enrollment.id) : [];
  const progressByLesson = new Map(progressRows.map((p) => [p.lessonId, p]));

  const modules = await getPublishedModulesInOrder(courseId);
  const result: CurriculumModuleItem[] = [];

  for (const module_ of modules) {
    const moduleAccess = await evaluateModuleAccess(userId, courseId, module_.id);
    const lessons = (await findPublishedLessonsByModule(module_.id)).sort((a, b) => a.position - b.position);

    result.push({
      id: module_.id,
      title: module_.title,
      position: module_.position,
      isMandatory: module_.isMandatory,
      locked: !moduleAccess.allowed,
      lockReason: moduleAccess.allowed ? undefined : moduleAccess.reason,
      unlockAt: moduleAccess.allowed ? undefined : (moduleAccess.detail?.unlockAt as Date | undefined),
      lessons: lessons.map((l) => ({
        id: l.id,
        title: l.title,
        slug: l.slug,
        position: l.position,
        durationMinutes: l.durationMinutes,
        isMandatory: l.isMandatory,
        isPreview: l.isPreview,
        // A preview lesson stays clickable even while its module is otherwise locked (same rule `evaluateLessonAccess` itself applies).
        locked: !moduleAccess.allowed && !(l.isPreview && l.status === 'PUBLISHED'),
        status: (progressByLesson.get(l.id)?.status as CurriculumLessonItem['status'] | undefined) ?? 'NOT_STARTED',
      })),
    });
  }

  return result;
}
