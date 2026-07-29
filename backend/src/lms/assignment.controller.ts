import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  createAssignmentForLesson,
  getAssignmentAdmin,
  getAssignmentByLessonIdAdmin,
  updateExistingAssignment,
  changeAssignmentStatus,
  addRubricCriterion,
  updateExistingCriterion,
  archiveRubricCriterion,
} from './assignment.service';

// --- Admin: Assignment ---------------------------------------------------

export const postAssignment = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await createAssignmentForLesson(req.params.lessonId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(assignment));
});

export const getAssignmentByLessonId = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await getAssignmentByLessonIdAdmin(req.params.lessonId);
  res.status(200).json(buildSuccessResponse(assignment));
});

export const getAssignmentByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await getAssignmentAdmin(req.params.assignmentId);
  res.status(200).json(buildSuccessResponse(assignment));
});

export const patchAssignment = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await updateExistingAssignment(req.params.assignmentId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(assignment));
});

export const postAssignmentStatus = asyncHandler(async (req: Request, res: Response) => {
  const assignment = await changeAssignmentStatus(req.params.assignmentId, req.body.status, req.user!.id);
  res.status(200).json(buildSuccessResponse(assignment));
});

// --- Admin: Rubric criteria ------------------------------------------------

export const postCriterion = asyncHandler(async (req: Request, res: Response) => {
  const criterion = await addRubricCriterion(req.params.assignmentId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(criterion));
});

export const patchCriterion = asyncHandler(async (req: Request, res: Response) => {
  const criterion = await updateExistingCriterion(req.params.criterionId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(criterion));
});

export const postArchiveCriterion = asyncHandler(async (req: Request, res: Response) => {
  await archiveRubricCriterion(req.params.criterionId, req.user!.id);
  res.status(200).json(buildSuccessResponse({ archived: true }));
});
