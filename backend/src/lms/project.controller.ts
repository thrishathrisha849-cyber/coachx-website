import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  createProjectForModule,
  listProjectsForModuleAdmin,
  listCandidateAssignmentsForModuleAdmin,
  getProjectAdmin,
  updateExistingProject,
  changeProjectStatus,
  linkArtifactToProject,
  unlinkArtifactFromProject,
  getProjectStatusForLearner,
} from './project.service';

// --- Admin: Project + artifact linking (004 Project-based Learning batch, FR-077) -

export const postProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await createProjectForModule(req.params.moduleId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(project));
});

export const getProjectsForModuleAdmin = asyncHandler(async (req: Request, res: Response) => {
  const projects = await listProjectsForModuleAdmin(req.params.moduleId);
  res.status(200).json(buildSuccessResponse(projects));
});

export const getCandidateAssignmentsForModuleAdmin = asyncHandler(async (req: Request, res: Response) => {
  const assignments = await listCandidateAssignmentsForModuleAdmin(req.params.moduleId, req.query.excludeProjectId as string | undefined);
  res.status(200).json(buildSuccessResponse(assignments));
});

export const getProjectByIdAdmin = asyncHandler(async (req: Request, res: Response) => {
  const project = await getProjectAdmin(req.params.projectId);
  res.status(200).json(buildSuccessResponse(project));
});

export const patchProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await updateExistingProject(req.params.projectId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(project));
});

export const postProjectStatus = asyncHandler(async (req: Request, res: Response) => {
  const project = await changeProjectStatus(req.params.projectId, req.body.status, req.user!.id);
  res.status(200).json(buildSuccessResponse(project));
});

export const postLinkArtifact = asyncHandler(async (req: Request, res: Response) => {
  const project = await linkArtifactToProject(req.params.projectId, req.body.assignmentId, req.user!.id);
  res.status(200).json(buildSuccessResponse(project));
});

export const postUnlinkArtifact = asyncHandler(async (req: Request, res: Response) => {
  const project = await unlinkArtifactFromProject(req.params.projectId, req.params.assignmentId, req.user!.id);
  res.status(200).json(buildSuccessResponse(project));
});

// --- Learner-facing ---------------------------------------------------------

export const getMyProjectStatus = asyncHandler(async (req: Request, res: Response) => {
  const status = await getProjectStatusForLearner(req.user!.id, req.params.projectId);
  res.status(200).json(buildSuccessResponse(status));
});
