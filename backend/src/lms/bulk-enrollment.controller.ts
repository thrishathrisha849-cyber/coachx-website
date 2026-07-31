import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { bulkImportEnrollments } from './bulk-enrollment.service';

// --- Admin (004 Bulk CSV Import batch, FR-032) -------------------------------

export const postBulkImportEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const result = await bulkImportEnrollments(req.params.id, req.body.csvContent, req.user!.id);
  res.status(200).json(buildSuccessResponse(result));
});
