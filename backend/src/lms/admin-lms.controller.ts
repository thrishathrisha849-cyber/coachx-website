import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/app-error';
import { roleHasPermission } from '../auth/rbac.service';
import {
  createCourseCategory,
  updateCourseCategory,
  reorderCategories,
  archiveCourseCategory,
  restoreCourseCategory,
  listCategoriesAdmin,
  getCategoryAdmin,
} from './category.service';
import {
  createNewCourse,
  updateExistingCourse,
  changeCourseStatus,
  archiveCourse,
  restoreCourse,
  getCourseAdmin,
  listCoursesAdmin,
} from './course.service';
import { assignInstructor, removeInstructor, setPrimaryInstructor, listInstructorsForCourse } from './instructor.service';
import {
  createCourseModule,
  updateCourseModule,
  archiveCourseModule,
  restoreCourseModule,
  releaseModuleNow,
  reorderCourseModules,
  listModulesForCourseAdmin,
  getModuleAdmin,
} from './module.service';
import {
  createCourseLesson,
  updateCourseLesson,
  archiveCourseLesson,
  restoreCourseLesson,
  reorderCourseLessons,
  listLessonsForModuleAdmin,
  getLessonAdmin,
} from './lesson.service';
import {
  createLearningActivity,
  updateLearningActivity,
  archiveLearningActivity,
  reorderLessonActivities,
  listActivitiesForLessonAdmin,
} from './activity.service';
import {
  adminGrantEnrollment,
  suspendEnrollment,
  reactivateEnrollment,
  revokeEnrollment,
  extendEnrollmentAccess,
  listEnrollmentsAdmin,
  getEnrollmentAdmin,
} from './enrollment.service';
import { overrideMarkComplete, overrideReset } from './completion.service';

/**
 * Admin LMS write API (Phase 6 Part 1 brief's "Admin API Requirements").
 * Every route is gated by `authenticate` + `requirePermission(...)` at the
 * route layer (see routes/v1/lms.routes.ts) — controllers here trust
 * `req.user` is already populated and authorized; they never re-check
 * permissions themselves (single source of truth for authorization).
 */

// --- Categories -------------------------------------------------------

export const postCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await createCourseCategory(req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(category));
});

export const getCategoriesAdmin = asyncHandler(async (req: Request, res: Response) => {
  const result = await listCategoriesAdmin(
    { status: req.query.status as string | undefined, parentId: req.query.parentId as string | undefined },
    { page: req.query.page as string, pageSize: req.query.pageSize as string },
    (req.query.sort as 'sortOrder' | 'name') ?? 'sortOrder',
  );
  res.status(200).json(buildSuccessResponse(result.data, { ...result.meta }));
});

export const getCategoryByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const category = await getCategoryAdmin(req.params.id);
  res.status(200).json(buildSuccessResponse(category));
});

export const patchCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await updateCourseCategory(req.params.id, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(category));
});

export const postReorderCategories = asyncHandler(async (req: Request, res: Response) => {
  await reorderCategories(req.body.parentId ?? null, req.body.orderedIds, req.user!.id);
  res.status(200).json(buildSuccessResponse({ reordered: true }));
});

export const postArchiveCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await archiveCourseCategory(req.params.id, req.user!.id);
  res.status(200).json(buildSuccessResponse(category));
});

export const postRestoreCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await restoreCourseCategory(req.params.id, req.user!.id);
  res.status(200).json(buildSuccessResponse(category));
});

// --- Courses ------------------------------------------------------------

export const postCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await createNewCourse(req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(course));
});

export const getCoursesAdmin = asyncHandler(async (req: Request, res: Response) => {
  const result = await listCoursesAdmin(
    {
      q: req.query.q as string | undefined,
      status: req.query.status as string | undefined,
      categoryId: req.query.categoryId as string | undefined,
      instructorId: req.query.instructorId as string | undefined,
    },
    { page: req.query.page as string, pageSize: req.query.pageSize as string },
    (req.query.sort as string) ?? 'newest',
  );
  res.status(200).json(buildSuccessResponse(result.data, { ...result.meta }));
});

export const getCourseByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const course = await getCourseAdmin(req.params.id);
  res.status(200).json(buildSuccessResponse(course));
});

export const patchCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await updateExistingCourse(req.params.id, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(course));
});

// 004 FR-100's review-workflow states that require the reviewer/publisher
// permission (`course.publish`) — an instructor holding only
// `course.update` may never move a course into any of these directly.
const REVIEWER_OR_PUBLISHER_STATUSES = new Set(['CHANGES_REQUESTED', 'APPROVED', 'SCHEDULED', 'PUBLISHED']);
// Operational/archival states — gated the SAME way the dedicated
// `/archive` and `/restore` admin endpoints already are
// (`requirePermission('course.archive')` in lms.routes.ts), so the
// generic status endpoint can't be used to bypass that gate.
const ARCHIVE_TIER_STATUSES = new Set(['UNLISTED', 'ENROLLMENT_PAUSED', 'ARCHIVED', 'RETIRED']);

/**
 * "Instructor cannot publish unless explicitly permitted" (brief's
 * Instructor API Requirements; 004 FR-095: "final publish permission held
 * as a separate, distinct grant from content-editing permissions"). The
 * ROUTE only requires the baseline `course.update` permission (so a
 * `course_instructor` can submit DRAFT → SUBMITTED_FOR_REVIEW, or resubmit
 * from CHANGES_REQUESTED), but every reviewer/publisher/archival-tier
 * target status requires the corresponding elevated permission — checked
 * here, body-aware, since the route-level `requirePermission` middleware
 * can't see the request body's target status.
 */
export const postCourseStatus = asyncHandler(async (req: Request, res: Response) => {
  const targetStatus = req.body.status as string;

  if (REVIEWER_OR_PUBLISHER_STATUSES.has(targetStatus) && !roleHasPermission(req.user!.roles, 'course.publish')) {
    throw AppError.forbidden('You do not have permission to review or publish this course');
  }
  if (ARCHIVE_TIER_STATUSES.has(targetStatus) && !roleHasPermission(req.user!.roles, 'course.archive')) {
    throw AppError.forbidden('You do not have permission to change this course’s archival status');
  }

  const course = await changeCourseStatus(req.params.id, targetStatus, req.user!.id, req.body.reviewNote);
  res.status(200).json(buildSuccessResponse(course));
});

export const postArchiveCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await archiveCourse(req.params.id, req.user!.id);
  res.status(200).json(buildSuccessResponse(course));
});

export const postRestoreCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await restoreCourse(req.params.id, req.user!.id);
  res.status(200).json(buildSuccessResponse(course));
});

// --- Instructor assignment -----------------------------------------------

export const postInstructor = asyncHandler(async (req: Request, res: Response) => {
  const instructor = await assignInstructor(req.params.id, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(instructor));
});

export const getCourseInstructors = asyncHandler(async (req: Request, res: Response) => {
  const instructors = await listInstructorsForCourse(req.params.id);
  res.status(200).json(buildSuccessResponse(instructors));
});

export const deleteInstructor = asyncHandler(async (req: Request, res: Response) => {
  await removeInstructor(req.params.id, req.params.userId, req.user!.id);
  res.status(200).json(buildSuccessResponse({ removed: true }));
});

export const postInstructorPrimary = asyncHandler(async (req: Request, res: Response) => {
  await setPrimaryInstructor(req.params.id, req.params.userId, req.user!.id);
  res.status(200).json(buildSuccessResponse({ primary: true }));
});

// --- Modules --------------------------------------------------------------

export const postModule = asyncHandler(async (req: Request, res: Response) => {
  const module_ = await createCourseModule(req.params.courseId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(module_));
});

export const getCourseModules = asyncHandler(async (req: Request, res: Response) => {
  const modules = await listModulesForCourseAdmin(req.params.courseId);
  res.status(200).json(buildSuccessResponse(modules));
});

export const getModuleById = asyncHandler(async (req: Request, res: Response) => {
  const module_ = await getModuleAdmin(req.params.moduleId);
  res.status(200).json(buildSuccessResponse(module_));
});

export const patchModule = asyncHandler(async (req: Request, res: Response) => {
  const module_ = await updateCourseModule(req.params.moduleId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(module_));
});

export const postReorderModules = asyncHandler(async (req: Request, res: Response) => {
  await reorderCourseModules(req.params.courseId, req.body.orderedIds, req.user!.id);
  res.status(200).json(buildSuccessResponse({ reordered: true }));
});

export const postArchiveModule = asyncHandler(async (req: Request, res: Response) => {
  const module_ = await archiveCourseModule(req.params.moduleId, req.user!.id);
  res.status(200).json(buildSuccessResponse(module_));
});

export const postRestoreModule = asyncHandler(async (req: Request, res: Response) => {
  const module_ = await restoreCourseModule(req.params.moduleId, req.user!.id);
  res.status(200).json(buildSuccessResponse(module_));
});

/** FR-034/FR-038 instructor/admin manual release — added during the database-verification pass. See module.service.ts's `releaseModuleNow`. */
export const postReleaseModule = asyncHandler(async (req: Request, res: Response) => {
  const module_ = await releaseModuleNow(req.params.moduleId, req.user!.id, req.header('Idempotency-Key'));
  res.status(200).json(buildSuccessResponse(module_));
});

// --- Lessons (Phase 6 Part 2A) ---------------------------------------------

export const postLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await createCourseLesson(req.params.moduleId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(lesson));
});

export const getModuleLessons = asyncHandler(async (req: Request, res: Response) => {
  const lessons = await listLessonsForModuleAdmin(req.params.moduleId);
  res.status(200).json(buildSuccessResponse(lessons));
});

export const getLessonById = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await getLessonAdmin(req.params.lessonId);
  res.status(200).json(buildSuccessResponse(lesson));
});

export const patchLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await updateCourseLesson(req.params.lessonId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(lesson));
});

export const postReorderLessons = asyncHandler(async (req: Request, res: Response) => {
  await reorderCourseLessons(req.params.moduleId, req.body.orderedIds, req.user!.id);
  res.status(200).json(buildSuccessResponse({ reordered: true }));
});

export const postArchiveLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await archiveCourseLesson(req.params.lessonId, req.user!.id);
  res.status(200).json(buildSuccessResponse(lesson));
});

export const postRestoreLesson = asyncHandler(async (req: Request, res: Response) => {
  const lesson = await restoreCourseLesson(req.params.lessonId, req.user!.id);
  res.status(200).json(buildSuccessResponse(lesson));
});

// --- Learning Activities (Phase 6 Part 2A) ---------------------------------

export const postActivity = asyncHandler(async (req: Request, res: Response) => {
  const activity = await createLearningActivity(req.params.lessonId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(activity));
});

export const getLessonActivities = asyncHandler(async (req: Request, res: Response) => {
  const activities = await listActivitiesForLessonAdmin(req.params.lessonId);
  res.status(200).json(buildSuccessResponse(activities));
});

export const patchActivity = asyncHandler(async (req: Request, res: Response) => {
  const activity = await updateLearningActivity(req.params.activityId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(activity));
});

export const postReorderActivities = asyncHandler(async (req: Request, res: Response) => {
  await reorderLessonActivities(req.params.lessonId, req.body.orderedIds, req.user!.id);
  res.status(200).json(buildSuccessResponse({ reordered: true }));
});

export const postArchiveActivity = asyncHandler(async (req: Request, res: Response) => {
  const activity = await archiveLearningActivity(req.params.activityId, req.user!.id);
  res.status(200).json(buildSuccessResponse(activity));
});

// --- Enrollments (Phase 6 Part 2B) -----------------------------------------

export const postEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await adminGrantEnrollment(
    {
      userId: req.body.userId,
      courseId: req.body.courseId,
      source: req.body.source,
      accessStartAt: req.body.accessStartAt ? new Date(req.body.accessStartAt) : undefined,
      accessEndAt: req.body.accessEndAt ? new Date(req.body.accessEndAt) : undefined,
      reason: req.body.reason,
    },
    req.user!.id,
    req.header('Idempotency-Key'),
  );
  res.status(201).json(buildSuccessResponse(enrollment));
});

export const getEnrollmentsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const result = await listEnrollmentsAdmin(
    {
      courseId: req.query.courseId as string | undefined,
      userId: req.query.userId as string | undefined,
      status: req.query.status as string | undefined,
    },
    { page: req.query.page as string, pageSize: req.query.pageSize as string },
  );
  res.status(200).json(buildSuccessResponse(result.data, { ...result.meta }));
});

export const getEnrollmentByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await getEnrollmentAdmin(req.params.id);
  res.status(200).json(buildSuccessResponse(enrollment));
});

export const postSuspendEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await suspendEnrollment(req.params.id, req.user!.id, req.body.reason);
  res.status(200).json(buildSuccessResponse(enrollment));
});

export const postReactivateEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await reactivateEnrollment(req.params.id, req.user!.id, req.body.reason);
  res.status(200).json(buildSuccessResponse(enrollment));
});

export const postRevokeEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await revokeEnrollment(req.params.id, req.user!.id, req.body.reason);
  res.status(200).json(buildSuccessResponse(enrollment));
});

export const postExtendEnrollmentAccess = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await extendEnrollmentAccess(req.params.id, req.user!.id, req.body.accessEndAt ? new Date(req.body.accessEndAt) : null);
  res.status(200).json(buildSuccessResponse(enrollment));
});

export const postOverrideComplete = asyncHandler(async (req: Request, res: Response) => {
  await overrideMarkComplete(req.params.id, req.body.scope, req.body.targetId, req.body.reason, req.user!.id, 'ADMIN_OVERRIDE', req.header('Idempotency-Key'));
  res.status(200).json(buildSuccessResponse({ overridden: true }));
});

export const postResetProgress = asyncHandler(async (req: Request, res: Response) => {
  await overrideReset(req.params.id, req.body.scope, req.body.targetId, req.body.reason, req.user!.id, req.header('Idempotency-Key'));
  res.status(200).json(buildSuccessResponse({ reset: true }));
});
