import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import type { TransactionClient } from '../database/transaction';
import { findCourseById, updateCourse as updateCourseRow, findTranslationVariantsForCourse, flagTranslationVariantsOutdated } from './course.repository';
import { toAdminCourse } from './lms.serializers';
import type { AdminCourse } from './lms.types';

/**
 * 004 Course Translation Management batch (FR-101) — the six named
 * status states for a course that is itself a translation variant
 * (`Course.translationOfCourseId` set by `course-clone.service.ts`'s
 * TRANSLATION_VARIANT clone mode). OUTDATED is deliberately NOT a manually
 * selectable target here — FR-101 states the system MUST auto-flag it
 * when the source course's lesson content changes (see
 * `flagTranslationsForSourceLessonUpdate`, called from
 * `lesson.service.ts`'s `updateCourseLesson`); an admin can only resume
 * OUT of it (OUTDATED -> IN_PROGRESS), never manually set it.
 */
const VALID_MANUAL_TRANSITIONS: Record<string, string[]> = {
  NOT_STARTED: ['IN_PROGRESS'],
  IN_PROGRESS: ['REVIEW'],
  REVIEW: ['APPROVED', 'IN_PROGRESS'],
  APPROVED: ['PUBLISHED', 'IN_PROGRESS'],
  PUBLISHED: ['IN_PROGRESS'],
  OUTDATED: ['IN_PROGRESS'],
};

/** POST /admin/courses/:id/translation-status */
export async function setTranslationStatus(courseId: string, status: string, actorId: string): Promise<AdminCourse> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');
  if (!course.translationOfCourseId || !course.translationStatus) {
    throw AppError.badRequest('This course is not a translation variant');
  }
  if (status === 'OUTDATED') {
    throw AppError.badRequest('OUTDATED is only ever set automatically when the source course changes, never manually');
  }
  if (!VALID_MANUAL_TRANSITIONS[course.translationStatus]?.includes(status)) {
    throw AppError.badRequest(`Cannot transition translation status from ${course.translationStatus} to ${status}`);
  }

  const updated = await updateCourseRow(courseId, { translationStatus: status as never, updatedBy: actorId });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.course.translation_status_changed',
    resourceType: 'course',
    resourceId: courseId,
    beforeState: { translationStatus: course.translationStatus },
    afterState: { translationStatus: status },
  });

  return toAdminCourse(updated);
}

/** GET /admin/courses/:id/translations — every variant of this source course, for the admin UI's "Translations" list. */
export async function listTranslationVariants(courseId: string): Promise<AdminCourse[]> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');
  const variants = await findTranslationVariantsForCourse(courseId);
  return variants.map(toAdminCourse);
}

/**
 * Called from `lesson.service.ts`'s `updateCourseLesson` — the genuine
 * integration point FR-101 itself names ("when its source lesson is
 * updated"). Deliberately runs INSIDE the same transaction as the lesson
 * update (unlike `recordAuditEvent`/`recordLearningEvent`'s best-effort,
 * never-throw discipline) — a translation left un-flagged after its
 * source changed would be a real data-consistency gap, not a
 * supplementary log entry, so a failure here rolls back the whole edit.
 */
export async function flagTranslationsForSourceLessonUpdate(sourceCourseId: string, tx?: TransactionClient): Promise<void> {
  await flagTranslationVariantsOutdated(sourceCourseId, tx);
}
