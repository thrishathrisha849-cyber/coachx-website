import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/app-error';
import { assertInstructorOwnsCourse, listCoursesForInstructorUser, updateExistingCourse, getCourseAdmin } from './course.service';
import { createCourseModule, updateCourseModule, reorderCourseModules, listModulesForCourseAdmin } from './module.service';
import { findModuleById } from './module.repository';

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
