import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  createCourseCohort,
  updateCourseCohort,
  listCohortsForCourseAdmin,
  getCohortAdmin,
  addCohortMember,
  removeCohortMember,
  listCohortMembersAdmin,
  setCohortModuleSchedule,
  removeCohortModuleSchedule,
  listCohortModuleSchedulesAdmin,
} from './cohort.service';

/** POST /admin/courses/:courseId/cohorts */
export const postCohort = asyncHandler(async (req: Request, res: Response) => {
  const cohort = await createCourseCohort(req.params.courseId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(cohort));
});

/** GET /admin/courses/:courseId/cohorts */
export const getCohortsForCourse = asyncHandler(async (req: Request, res: Response) => {
  const cohorts = await listCohortsForCourseAdmin(req.params.courseId);
  res.status(200).json(buildSuccessResponse(cohorts));
});

/** GET /admin/cohorts/:cohortId */
export const getCohortByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const cohort = await getCohortAdmin(req.params.cohortId);
  res.status(200).json(buildSuccessResponse(cohort));
});

/** PATCH /admin/cohorts/:cohortId */
export const patchCohort = asyncHandler(async (req: Request, res: Response) => {
  const cohort = await updateCourseCohort(req.params.cohortId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(cohort));
});

/** POST /admin/cohorts/:cohortId/members */
export const postCohortMember = asyncHandler(async (req: Request, res: Response) => {
  const member = await addCohortMember(req.params.cohortId, req.body.userId, req.user!.id);
  res.status(201).json(buildSuccessResponse(member));
});

/** GET /admin/cohorts/:cohortId/members */
export const getCohortMembers = asyncHandler(async (req: Request, res: Response) => {
  const members = await listCohortMembersAdmin(req.params.cohortId);
  res.status(200).json(buildSuccessResponse(members));
});

/** DELETE /admin/cohorts/:cohortId/members/:memberId */
export const deleteCohortMemberAdmin = asyncHandler(async (req: Request, res: Response) => {
  await removeCohortMember(req.params.cohortId, req.params.memberId, req.user!.id);
  res.status(200).json(buildSuccessResponse({ removed: true }));
});

/** PUT /admin/cohorts/:cohortId/schedule/:moduleId */
export const putCohortModuleSchedule = asyncHandler(async (req: Request, res: Response) => {
  const schedule = await setCohortModuleSchedule(req.params.cohortId, req.params.moduleId, req.body.unlockAt, req.user!.id);
  res.status(200).json(buildSuccessResponse(schedule));
});

/** DELETE /admin/cohorts/:cohortId/schedule/:moduleId */
export const deleteCohortModuleScheduleAdmin = asyncHandler(async (req: Request, res: Response) => {
  await removeCohortModuleSchedule(req.params.cohortId, req.params.moduleId, req.user!.id);
  res.status(200).json(buildSuccessResponse({ removed: true }));
});

/** GET /admin/cohorts/:cohortId/schedule */
export const getCohortModuleSchedules = asyncHandler(async (req: Request, res: Response) => {
  const schedules = await listCohortModuleSchedulesAdmin(req.params.cohortId);
  res.status(200).json(buildSuccessResponse(schedules));
});
