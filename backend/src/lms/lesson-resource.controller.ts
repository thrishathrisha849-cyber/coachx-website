import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  createLessonResource,
  updateExistingResource,
  archiveLessonResource,
  reorderLessonResources,
  listResourcesForLessonAdmin,
  listResourcesForLessonLearner,
  recordResourceViewed,
  recordResourceDownload,
} from './lesson-resource.service';

// --- Admin (004 Downloadable Resource Catalog batch, FR-049) ----------------

export const postResource = asyncHandler(async (req: Request, res: Response) => {
  const resource = await createLessonResource(req.params.lessonId, req.body, req.user!.id);
  res.status(201).json(buildSuccessResponse(resource));
});

export const getLessonResourcesAdmin = asyncHandler(async (req: Request, res: Response) => {
  const resources = await listResourcesForLessonAdmin(req.params.lessonId);
  res.status(200).json(buildSuccessResponse(resources));
});

export const patchResource = asyncHandler(async (req: Request, res: Response) => {
  const resource = await updateExistingResource(req.params.resourceId, req.body, req.user!.id);
  res.status(200).json(buildSuccessResponse(resource));
});

export const postArchiveResource = asyncHandler(async (req: Request, res: Response) => {
  const resource = await archiveLessonResource(req.params.resourceId, req.user!.id);
  res.status(200).json(buildSuccessResponse(resource));
});

export const postReorderResources = asyncHandler(async (req: Request, res: Response) => {
  await reorderLessonResources(req.params.lessonId, req.body.orderedIds, req.user!.id);
  res.status(200).json(buildSuccessResponse({ reordered: true }));
});

// --- Learner-facing ----------------------------------------------------------

export const getMyLessonResources = asyncHandler(async (req: Request, res: Response) => {
  const resources = await listResourcesForLessonLearner(req.user!.id, req.params.lessonId);
  res.status(200).json(buildSuccessResponse(resources));
});

export const postMyResourceViewed = asyncHandler(async (req: Request, res: Response) => {
  await recordResourceViewed(req.user!.id, req.params.resourceId);
  res.status(200).json(buildSuccessResponse({ viewed: true }));
});

export const postMyResourceDownload = asyncHandler(async (req: Request, res: Response) => {
  const result = await recordResourceDownload(req.user!.id, req.params.resourceId);
  res.status(200).json(buildSuccessResponse(result));
});
