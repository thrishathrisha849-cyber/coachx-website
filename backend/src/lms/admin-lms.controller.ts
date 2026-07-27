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
  reorderCourseModules,
  listModulesForCourseAdmin,
  getModuleAdmin,
} from './module.service';

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
