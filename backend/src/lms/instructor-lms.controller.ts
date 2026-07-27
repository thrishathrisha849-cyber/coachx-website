import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/app-error';
import { assertInstructorOwnsCourse, listCoursesForInstructorUser, updateExistingCourse, getCourseAdmin } from './course.service';
import { createCourseModule, updateCourseModule, reorderCourseModules, listModulesForCourseAdmin, releaseModuleNow } from './module.service';
import { findModuleById } from './module.repository';
import {
  createCourseLesson,
  updateCourseLesson,
  reorderCourseLessons,
  listLessonsForModuleAdmin,
  getLessonAdmin,
} from './lesson.service';
import { findLessonById } from './lesson.repository';
import { createLearningActivity, updateLearningActivity, listActivitiesForLessonAdmin } from './activity.service';
import { findActivityById } from './activity.repository';
import { listEnrollmentsForCourseInstructor } from './enrollment.service';
import { overrideMarkComplete } from './completion.service';

/**
 * Instructor-scoped course management (Phase 6 Part 1 brief's "Instructor
 * API Requirements"). Every write here calls `assertInstructorOwnsCourse`
 * FIRST — the broken-object-level-authorization guard that stops an
 * instructor from touching a course they aren't assigned to. This is a
 * REAL backend check, not a frontend-only restriction (brief: "Do not use
 * frontend-only authorization").
 *
 * Deliberately does NOT expose a status/publish endpoint here — Part 1's
 * RBAC decision (docs/lms/RBAC.md) is that `course_instructor` does not
 * hold `course.publish`, so publishing is an admin/content_manager action
 * even for the course's own instructor. This route surface only lets an
 * instructor prepare content (DRAFT/REVIEW-stage edits + modules).
 */

export const getMyInstructorCourses = asyncHandler(async (req: Request, res: Response) => {
  const result = await listCoursesForInstructorUser(req.user!.id, {
    page: req.query.page as string,
    pageSize: req.query.pageSize as string,
  });
  res.status(200).json(buildSuccessResponse(result.data, { ...result.meta }));
});

export const getMyInstructorCourseById = asyncHandler(async (req: Request, res: Response) => {
  await assertInstructorOwnsCourse(req.params.id, req.user!.id);
  const course = await getCourseAdmin(req.params.id);
  res.status(200).json(buildSuccessResponse(course));
});

export const patchMyInstructorCourse = asyncHandler(async (req: Request, res: Response) => {
  await assertInstructorOwnsCourse(req.params.id, req.user!.id);
  const course = await updateExistingCourse(req.params.id, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(course));
});

export const postMyInstructorModule = asyncHandler(async (req: Request, res: Response) => {
  await assertInstructorOwnsCourse(req.params.id, req.user!.id);
  const module_ = await createCourseModule(req.params.id, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(module_));
});

export const getMyInstructorCourseModules = asyncHandler(async (req: Request, res: Response) => {
  await assertInstructorOwnsCourse(req.params.id, req.user!.id);
  const modules = await listModulesForCourseAdmin(req.params.id);
  res.status(200).json(buildSuccessResponse(modules));
});

export const patchMyInstructorModule = asyncHandler(async (req: Request, res: Response) => {
  // The module's OWNING COURSE must be ownership-checked, not the module ID
  // directly — look up the module's courseId first so a malicious caller
  // can't bypass ownership by guessing another instructor's moduleId.
  const target = await findModuleById(req.params.moduleId);
  if (!target) throw AppError.notFound('Module not found');

  await assertInstructorOwnsCourse(target.courseId, req.user!.id);
  const updated = await updateCourseModule(req.params.moduleId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(updated));
});

export const postMyInstructorModuleReorder = asyncHandler(async (req: Request, res: Response) => {
  await assertInstructorOwnsCourse(req.params.id, req.user!.id);
  await reorderCourseModules(req.params.id, req.body.orderedIds, req.user!.id);
  res.status(200).json(buildSuccessResponse({ reordered: true }));
});

/** FR-034/FR-038 "instructor manually releases content" — course-scoped ownership enforced via `assertInstructorOwnsModule` (defined below; hoisted). Added during the database-verification pass. */
export const postMyInstructorReleaseModule = asyncHandler(async (req: Request, res: Response) => {
  await assertInstructorOwnsModule(req.params.moduleId, req.user!.id);
  const module_ = await releaseModuleNow(req.params.moduleId, req.user!.id, req.header('Idempotency-Key'));
  res.status(200).json(buildSuccessResponse(module_));
});

// --- Lessons (Phase 6 Part 2A, instructor-scoped) --------------------------
// Every handler resolves ownership via the MODULE's own courseId — never
// trusts a client-supplied courseId — same broken-object-level-
// authorization discipline `patchMyInstructorModule` above established.

async function assertInstructorOwnsModule(moduleId: string, userId: string) {
  const module_ = await findModuleById(moduleId);
  if (!module_) throw AppError.notFound('Module not found');
  await assertInstructorOwnsCourse(module_.courseId, userId);
  return module_;
}

async function assertInstructorOwnsLesson(lessonId: string, userId: string) {
  const lesson = await findLessonById(lessonId);
  if (!lesson) throw AppError.notFound('Lesson not found');
  const module_ = await assertInstructorOwnsModule(lesson.moduleId, userId);
  return { lesson, module: module_ };
}

export const postMyInstructorLesson = asyncHandler(async (req: Request, res: Response) => {
  await assertInstructorOwnsModule(req.params.moduleId, req.user!.id);
  const lesson = await createCourseLesson(req.params.moduleId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(lesson));
});

export const getMyInstructorModuleLessons = asyncHandler(async (req: Request, res: Response) => {
  await assertInstructorOwnsModule(req.params.moduleId, req.user!.id);
  const lessons = await listLessonsForModuleAdmin(req.params.moduleId);
  res.status(200).json(buildSuccessResponse(lessons));
});

export const getMyInstructorLesson = asyncHandler(async (req: Request, res: Response) => {
  await assertInstructorOwnsLesson(req.params.lessonId, req.user!.id);
  const lesson = await getLessonAdmin(req.params.lessonId);
  res.status(200).json(buildSuccessResponse(lesson));
});

export const patchMyInstructorLesson = asyncHandler(async (req: Request, res: Response) => {
  await assertInstructorOwnsLesson(req.params.lessonId, req.user!.id);
  const lesson = await updateCourseLesson(req.params.lessonId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(lesson));
});

export const postMyInstructorLessonReorder = asyncHandler(async (req: Request, res: Response) => {
  await assertInstructorOwnsModule(req.params.moduleId, req.user!.id);
  await reorderCourseLessons(req.params.moduleId, req.body.orderedIds, req.user!.id);
  res.status(200).json(buildSuccessResponse({ reordered: true }));
});

// --- Learning Activities (Phase 6 Part 2A, instructor-scoped) -------------

export const postMyInstructorActivity = asyncHandler(async (req: Request, res: Response) => {
  await assertInstructorOwnsLesson(req.params.lessonId, req.user!.id);
  const activity = await createLearningActivity(req.params.lessonId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(activity));
});

export const getMyInstructorLessonActivities = asyncHandler(async (req: Request, res: Response) => {
  await assertInstructorOwnsLesson(req.params.lessonId, req.user!.id);
  const activities = await listActivitiesForLessonAdmin(req.params.lessonId);
  res.status(200).json(buildSuccessResponse(activities));
});

export const patchMyInstructorActivity = asyncHandler(async (req: Request, res: Response) => {
  const activity = await findActivityById(req.params.activityId);
  if (!activity) throw AppError.notFound('Learning activity not found');
  await assertInstructorOwnsLesson(activity.lessonId, req.user!.id);
  const updated = await updateLearningActivity(req.params.activityId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(updated));
});

// --- Enrollments / progress (Phase 6 Part 2B, instructor-scoped, read-only + approval override) ---

export const getMyInstructorCourseEnrollments = asyncHandler(async (req: Request, res: Response) => {
  await assertInstructorOwnsCourse(req.params.id, req.user!.id);
  const result = await listEnrollmentsForCourseInstructor(req.params.id, {
    page: req.query.page as string,
    pageSize: req.query.pageSize as string,
  });
  res.status(200).json(buildSuccessResponse(result.data, { ...result.meta }));
});

/**
 * Instructor-initiated MARK_COMPLETE override — course-scoped to the
 * instructor's own course (FR-113). Deliberately restricted to
 * LESSON/MODULE scope only (never COURSE) — a whole-course manual
 * completion override remains an admin-only action
 * (`admin-lms.controller.ts`'s `postOverrideComplete`).
 */
export const postMyInstructorOverrideComplete = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.scope === 'COURSE') {
    throw AppError.forbidden('Course-level completion override requires an admin role');
  }
  await assertInstructorOwnsCourse(req.params.id, req.user!.id);
  await overrideMarkComplete(req.body.enrollmentId, req.body.scope, req.body.targetId, req.body.reason, req.user!.id, 'INSTRUCTOR_OVERRIDE', req.header('Idempotency-Key'));
  res.status(200).json(buildSuccessResponse({ overridden: true }));
});
