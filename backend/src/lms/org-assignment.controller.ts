import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  assignCourseToOrganizationMembers,
  listOrganizationCourseEnrollments,
  removeOrganizationMemberAccess,
  setOrganizationMemberDeadline,
} from './org-assignment.service';

/** POST /api/v1/lms/organization/courses/:courseId/assign — 004 FR-033 (`organization.manage_own`, own-org members only). */
export const postAssignCourseToOrgMembers = asyncHandler(async (req: Request, res: Response) => {
  const results = await assignCourseToOrganizationMembers(req.user!.id, req.params.courseId, req.body.userIds, {
    accessEndAt: req.body.accessEndAt ? new Date(req.body.accessEndAt) : undefined,
    reason: req.body.reason,
  });
  res.status(200).json(buildSuccessResponse(results));
});

/** GET /api/v1/lms/organization/enrollments?courseId=... */
export const getOrganizationEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const results = await listOrganizationCourseEnrollments(req.user!.id, req.query.courseId as string | undefined);
  res.status(200).json(buildSuccessResponse(results));
});

/** POST /api/v1/lms/organization/enrollments/:enrollmentId/revoke */
export const postRemoveOrgMemberAccess = asyncHandler(async (req: Request, res: Response) => {
  const enrollment = await removeOrganizationMemberAccess(req.user!.id, req.params.enrollmentId, req.body.reason);
  res.status(200).json(buildSuccessResponse(enrollment));
});

/** POST /api/v1/lms/organization/enrollments/:enrollmentId/deadline */
export const postSetOrgMemberDeadline = asyncHandler(async (req: Request, res: Response) => {
  const accessEndAt = req.body.accessEndAt ? new Date(req.body.accessEndAt) : null;
  const enrollment = await setOrganizationMemberDeadline(req.user!.id, req.params.enrollmentId, accessEndAt);
  res.status(200).json(buildSuccessResponse(enrollment));
});
