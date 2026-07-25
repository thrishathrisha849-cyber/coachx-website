import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  createCmsPage,
  updateCmsPage,
  updatePageStatus,
  generatePreviewLink,
  listVersionHistory,
} from './page.service';

/**
 * Admin CMS write API (002 FR-084; backend foundation only, per the
 * Phase 5 (Part 1) brief's explicit "Do not implement admin CMS editor"
 * — this is the API a future editor UI would call, not the editor
 * itself). Every route is gated by `requirePermission('content.manage')`
 * at the route layer (see routes/v1/cms.routes.ts).
 */

export const postPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await createCmsPage({ ...req.body, actorId: req.user!.id });
  res.status(201).json(buildSuccessResponse(page));
});

export const patchPage = asyncHandler(async (req: Request, res: Response) => {
  const page = await updateCmsPage(req.params.id, { ...req.body, actorId: req.user!.id });
  res.status(200).json(buildSuccessResponse(page));
});

export const patchPageStatus = asyncHandler(async (req: Request, res: Response) => {
  const page = await updatePageStatus(req.params.id, req.body.status, req.user!.id);
  res.status(200).json(buildSuccessResponse(page));
});

export const postPagePreviewLink = asyncHandler(async (req: Request, res: Response) => {
  const result = await generatePreviewLink(req.params.id, req.user!.id);
  res.status(200).json(buildSuccessResponse(result));
});

export const getPageVersions = asyncHandler(async (req: Request, res: Response) => {
  const versions = await listVersionHistory(req.params.id);
  res.status(200).json(buildSuccessResponse(versions));
});
