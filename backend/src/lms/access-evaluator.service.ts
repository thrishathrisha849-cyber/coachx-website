import { AppError } from '../utils/app-error';
import { HttpStatus, ERROR_CODES } from '@coachx/shared';
import { findCourseById } from './course.repository';
import { isCourseVisibleByDirectLink } from './course-lifecycle.policy';
import { findModuleById, findModulesByCourse } from './module.repository';
import { findLessonById, findLessonsByModule } from './lesson.repository';
import { findEnrollmentForUserAndCourse } from './enrollment.repository';
import { isEnrollmentAccessWindowOpen } from './enrollment.policy';
import { findLessonProgressForLessons } from './progress.repository';
import { findCohortModuleScheduleForEnrollment } from './cohort.repository';
import { ALLOWED, denied, type AccessDecision } from './access.types';

/**
 * Optional pre-fetched `course`/`enrollment` rows, accepted by
 * `evaluateCourseAccess`/`evaluateModuleAccess` so a caller that already
 * has one or both loaded (e.g. `continue-learning.service.ts` evaluating
 * every module of the SAME course/enrollment in a loop) can skip the
 * otherwise-repeated queries. A key's PRESENCE (not its value) signals
 * "don't re-fetch this" — `{ course: null }` means "I already checked,
 * there is none," distinct from omitting the key entirely, which still
 * fetches as before. Every existing call site that doesn't pass this
 * parameter is byte-for-byte unaffected.
 */
export interface AccessPrefetch {
  course?: Awaited<ReturnType<typeof findCourseById>>;
  enrollment?: Awaited<ReturnType<typeof findEnrollmentForUserAndCourse>>;
}

/**
 * Phase 6 Part 2B/2C — the ONE centralized access-decision pipeline.
 * `evaluateCourseAccess` → `evaluateModuleAccess` → `evaluateLessonAccess`
 * each strictly reuse the layer below (never re-implement a parallel
 * check) — this is what Part 2C's "access-evaluator-consistency"
 * requirement means in practice: every route that needs to know "can this
 * user see this content" calls one of these three functions, never a
 * bespoke inline check.
 *
 * `evaluateCourseAccess`'s deterministic evaluation order (Part 2B's
 * "12-step" requirement — enumerated explicitly below so the order is
 * reviewable, not implicit in code layout):
 *   1. Caller must be authenticated (courseId alone is not enough).
 *   2. Course must exist.
 *   3. Course must not be RETIRED (terminal — FR-015).
 *   4. If Course is ARCHIVED, access requires a pre-existing enrollment
 *      (any status) — FR-015 "preserves existing learner progress while
 *      blocking new enrollment."
 *   5. If Course is not otherwise publicly reachable (Draft/Submitted/
 *      Changes-requested/Approved) AND the caller has no enrollment, deny.
 *   6. Look up the caller's enrollment for this course.
 *   7. No enrollment at all → ENROLLMENT_REQUIRED.
 *   8. Enrollment SUSPENDED → ENROLLMENT_SUSPENDED.
 *   9. Enrollment CANCELLED → ENROLLMENT_CANCELLED.
 *  10. Enrollment REVOKED → ENROLLMENT_REVOKED.
 *  11. Enrollment PENDING → ENTITLEMENT_PENDING.
 *  12. Access window (accessStartAt/accessEndAt) checked via
 *      `isEnrollmentAccessWindowOpen` — ACCESS_NOT_STARTED /
 *      ACCESS_EXPIRED even if the stored `status` column is stale (no
 *      background job exists to have flipped it yet — Part 2C's explicit
 *      "must still deny based on timestamps" requirement).
 *  Otherwise → ALLOWED.
 */
export async function evaluateCourseAccess(userId: string | null, courseId: string, prefetch?: AccessPrefetch): Promise<AccessDecision> {
  if (!userId) return denied('AUTHENTICATION_REQUIRED', 'Sign in to access this course');

  const course = prefetch && 'course' in prefetch ? prefetch.course : await findCourseById(courseId);
  if (!course) return denied('COURSE_UNAVAILABLE', 'Course not found');

  if (course.status === 'RETIRED') return denied('COURSE_RETIRED', 'This course has been retired');

  const enrollment = prefetch && 'enrollment' in prefetch ? prefetch.enrollment : await findEnrollmentForUserAndCourse(userId, courseId);

  if (course.status === 'ARCHIVED') {
    if (!enrollment) return denied('COURSE_ARCHIVED', 'This course is archived and no longer accepting new access');
    // Fall through — an existing enrollment record is required, but its
    // own status/window is still evaluated by the checks below.
  } else if (!['PUBLISHED', 'SCHEDULED', 'UNLISTED', 'ENROLLMENT_PAUSED'].includes(course.status) && !enrollment) {
    return denied('COURSE_UNAVAILABLE', 'Course not found');
  }

  if (!enrollment) return denied('ENROLLMENT_REQUIRED', 'Enroll in this course to access it');

  if (enrollment.status === 'SUSPENDED') return denied('ENROLLMENT_SUSPENDED', 'Your enrollment is currently suspended');
  if (enrollment.status === 'CANCELLED') return denied('ENROLLMENT_CANCELLED', 'Your enrollment was cancelled');
  if (enrollment.status === 'REVOKED') return denied('ENROLLMENT_REVOKED', 'Your access to this course was revoked');
  if (enrollment.status === 'PENDING') return denied('ENTITLEMENT_PENDING', 'Your enrollment is awaiting activation');

  if (!isEnrollmentAccessWindowOpen(enrollment)) {
    if (enrollment.accessStartAt && enrollment.accessStartAt > new Date()) {
      return denied('ACCESS_NOT_STARTED', 'Your access to this course has not started yet', {
        accessStartAt: enrollment.accessStartAt,
      });
    }
    return denied('ACCESS_EXPIRED', 'Your access to this course has expired', { accessEndAt: enrollment.accessEndAt });
  }

  return ALLOWED;
}

/** True if `module.prerequisiteModuleId` (if set) has all its mandatory, published lessons completed for this enrollment. Also backs the `AFTER_PREVIOUS_MODULE` release-rule type (see `isModuleReleased` below). */
async function isModulePrerequisiteSatisfied(enrollmentId: string, module: { prerequisiteModuleId: string | null }): Promise<boolean> {
  if (!module.prerequisiteModuleId) return true;

  const prereqLessons = (await findLessonsByModule(module.prerequisiteModuleId)).filter(
    (l) => l.isMandatory && l.status === 'PUBLISHED',
  );
  if (prereqLessons.length === 0) return true;

  const progress = await findLessonProgressForLessons(
    enrollmentId,
    prereqLessons.map((l) => l.id),
  );
  const completedIds = new Set(progress.filter((p) => p.status === 'COMPLETED').map((p) => p.lessonId));
  return prereqLessons.every((l) => completedIds.has(l.id));
}

/**
 * Runtime drip/release evaluation reusing Part 1's stored
 * `releaseRuleType`/`releaseRuleValue` (config) — this function is the
 * ENFORCEMENT half Part 1's docs explicitly deferred to Part 2. See
 * `docs/lms/PREREQUISITES_AND_RELEASE.md`.
 */
async function isModuleReleased(
  enrollment: { enrolledAt: Date },
  module: { id: string; releaseRuleType: string; releaseRuleValue: unknown; prerequisiteModuleId: string | null; manuallyReleasedAt: Date | null },
  enrollmentId: string,
): Promise<{ released: boolean; unlockAt?: Date }> {
  const now = new Date();

  switch (module.releaseRuleType) {
    case 'IMMEDIATE':
      return { released: true };

    case 'DAYS_AFTER_ENROLLMENT': {
      const days = Number((module.releaseRuleValue as { days?: unknown } | null)?.days ?? 0);
      const unlockAt = new Date(enrollment.enrolledAt.getTime() + days * 86_400_000);
      return { released: unlockAt <= now, unlockAt };
    }

    case 'FIXED_DATE': {
      const raw = (module.releaseRuleValue as { date?: unknown } | null)?.date;
      const unlockAt = typeof raw === 'string' ? new Date(raw) : null;
      if (!unlockAt || Number.isNaN(unlockAt.getTime())) return { released: true }; // misconfigured — fail open to IMMEDIATE rather than permanently lock content
      return { released: unlockAt <= now, unlockAt };
    }

    case 'AFTER_PREVIOUS_MODULE':
      return { released: await isModulePrerequisiteSatisfied(enrollmentId, module) };

    case 'INSTRUCTOR_RELEASE':
      return { released: module.manuallyReleasedAt !== null && module.manuallyReleasedAt <= now, unlockAt: module.manuallyReleasedAt ?? undefined };

    case 'COHORT_SCHEDULE': {
      // 004 Cohort entity batch (T085, FR-034) — the unlock date lives on
      // the learner's OWN cohort's `CohortModuleSchedule` row, not on the
      // module itself (every cohort attached to this course can schedule
      // the same module differently). No cohort membership, or a cohort
      // that hasn't scheduled this module yet, fails OPEN — the same
      // "misconfigured/unset never permanently locks content" precedent
      // `FIXED_DATE` above already established.
      const schedule = await findCohortModuleScheduleForEnrollment(enrollmentId, module.id);
      if (!schedule) return { released: true };
      return { released: schedule.unlockAt <= now, unlockAt: schedule.unlockAt };
    }

    default:
      return { released: true };
  }
}

export async function evaluateModuleAccess(userId: string | null, courseId: string, moduleId: string, prefetch?: AccessPrefetch): Promise<AccessDecision> {
  const courseAccess = await evaluateCourseAccess(userId, courseId, prefetch);
  if (!courseAccess.allowed) return courseAccess;

  const module_ = await findModuleById(moduleId);
  if (!module_ || module_.courseId !== courseId || module_.status !== 'PUBLISHED') {
    return denied('MODULE_LOCKED', 'This module is not available');
  }

  // `evaluateCourseAccess` above already resolved (and, when `prefetch`
  // was supplied, reused) the enrollment as part of confirming access is
  // ALLOWED — re-deriving it here via a second `findEnrollmentForUserAndCourse`
  // call was pure waste on every single call, prefetched or not.
  const enrollment = prefetch && 'enrollment' in prefetch ? prefetch.enrollment : await findEnrollmentForUserAndCourse(userId!, courseId);
  if (!enrollment) return denied('ENROLLMENT_REQUIRED', 'Enroll in this course to access it');

  const prerequisiteMet = await isModulePrerequisiteSatisfied(enrollment.id, module_);
  if (!prerequisiteMet) {
    return denied('PREREQUISITE_NOT_MET', 'Complete the prerequisite module first', {
      prerequisiteModuleId: module_.prerequisiteModuleId,
    });
  }

  const release = await isModuleReleased(enrollment, module_, enrollment.id);
  if (!release.released) {
    return denied('MODULE_LOCKED', 'This module is not yet available', { unlockAt: release.unlockAt });
  }

  return ALLOWED;
}

/**
 * Lesson-level access. A lesson with `isPreview: true` on a PUBLISHED
 * lesson bypasses enrollment entirely (FR-018 preview status) but is
 * STILL gated by the course being at least publicly reachable — a preview
 * flag on a Draft course's lesson does not leak Draft content. Preview
 * access never implies progress tracking (see `docs/lms/ACCESS_DECISION_ENGINE.md`
 * "Preview is not an entitlement" — Part 2C's explicit preview-safety
 * review item).
 *
 * Sequential per-lesson drip (FR-034's "after previous lesson completion")
 * is NOT enforced here — Part 2A's own Lesson field list has no
 * `releaseRuleType` field (only `completionRuleType`), so there is no
 * stored per-lesson release configuration to evaluate. Within an unlocked,
 * released MODULE, every PUBLISHED lesson is immediately accessible. This
 * is a documented scope boundary, not an oversight — see
 * docs/lms/DECISION_GATES.md.
 */
export async function evaluateLessonAccess(userId: string | null, courseId: string, lessonId: string): Promise<AccessDecision> {
  const lesson = await findLessonById(lessonId);
  if (!lesson) return denied('COURSE_UNAVAILABLE', 'Lesson not found');

  const module_ = await findModuleById(lesson.moduleId);
  if (!module_ || module_.courseId !== courseId) return denied('COURSE_UNAVAILABLE', 'Lesson not found');

  if (lesson.isPreview && lesson.status === 'PUBLISHED') {
    const course = await findCourseById(courseId);
    if (course && isCourseVisibleByDirectLink(course) && module_.status === 'PUBLISHED') {
      return { allowed: true, viaPreview: true };
    }
    // Not publicly reachable even as a preview — fall through to the full
    // enrollment-based check below (denies for the right underlying reason).
  }

  const moduleAccess = await evaluateModuleAccess(userId, courseId, lesson.moduleId);
  if (!moduleAccess.allowed) return moduleAccess;

  if (lesson.status !== 'PUBLISHED') {
    return denied('LESSON_NOT_RELEASED', 'This lesson is not yet available');
  }

  return ALLOWED;
}

/**
 * 004 Error-code taxonomy batch (FR-125) — the ONE shared "throw on denial"
 * wrapper around `evaluateLessonAccess`, consolidating what used to be
 * near-duplicate private helpers in `bookmark.service.ts`,
 * `learner-note.service.ts`, and `lesson-resource.service.ts`. One of those
 * duplicates (`lesson-resource.service.ts`'s `assertLessonAccessibleForResources`)
 * had drifted to `throw AppError.forbidden(access.message)`, silently
 * dropping `reason`/`detail` and defeating FR-125's own purpose for
 * resource-access denials. Centralizing here (the module that already owns
 * `evaluateLessonAccess`) prevents that class of drift from recurring.
 */
export async function assertLessonContentAccessible(
  userId: string | null,
  lessonId: string,
): Promise<{ courseId: string; viaPreview: boolean }> {
  const lesson = await findLessonById(lessonId);
  if (!lesson || lesson.status !== 'PUBLISHED') throw AppError.notFound('Lesson not found');

  const module_ = await findModuleById(lesson.moduleId);
  if (!module_) throw AppError.notFound('Lesson not found');

  const access = await evaluateLessonAccess(userId, module_.courseId, lesson.id);
  if (!access.allowed) {
    throw new AppError(access.message, HttpStatus.FORBIDDEN, ERROR_CODES.FORBIDDEN, { reason: access.reason, ...access.detail });
  }

  return { courseId: module_.courseId, viaPreview: !!access.viaPreview };
}

/** Exported for reuse by completion.service.ts (module-completion evaluation needs the same prerequisite check the access evaluator uses). */
export { isModulePrerequisiteSatisfied };

/** All published modules of a course, in position order — used by continue-learning.service.ts. */
export async function getPublishedModulesInOrder(courseId: string) {
  const modules = await findModulesByCourse(courseId);
  return modules.filter((m) => m.status === 'PUBLISHED').sort((a, b) => a.position - b.position);
}
