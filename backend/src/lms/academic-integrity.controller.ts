import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  flagForInvestigation,
  resolveInvestigation,
  resolveIntegrityAppeal,
  listAcademicIntegrityCasesAdmin,
  getAcademicIntegrityCaseAdmin,
  listMyAcademicIntegrityCases,
} from './academic-integrity.service';

/** POST /admin/academic-integrity/cases — FR-116 "review flag." */
export const postFlagForInvestigation = asyncHandler(async (req: Request, res: Response) => {
  const trustSafetyCase = await flagForInvestigation({
    type: req.body.type,
    targetType: req.body.targetType,
    targetId: req.body.targetId,
    reason: req.body.reason,
    evidence: req.body.evidence,
    reporterId: req.user!.id,
  });
  res.status(201).json(buildSuccessResponse(trustSafetyCase));
});

/** GET /admin/academic-integrity/cases */
export const getAcademicIntegrityCases = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 20);
  const result = await listAcademicIntegrityCasesAdmin({ status: req.query.status as string | undefined }, { page, pageSize });
  res.status(200).json(buildSuccessResponse(result.data, { total: result.total, page, pageSize }));
});

/** GET /admin/academic-integrity/cases/:caseId */
export const getAcademicIntegrityCaseDetail = asyncHandler(async (req: Request, res: Response) => {
  const trustSafetyCase = await getAcademicIntegrityCaseAdmin(req.params.caseId);
  res.status(200).json(buildSuccessResponse(trustSafetyCase));
});

/** POST /admin/academic-integrity/cases/:caseId/resolve — CONFIRMED or CLEARED. */
export const postResolveInvestigation = asyncHandler(async (req: Request, res: Response) => {
  const trustSafetyCase = await resolveInvestigation(req.params.caseId, req.body.outcome, req.user!.id, req.body.reason);
  res.status(200).json(buildSuccessResponse(trustSafetyCase));
});

/** POST /admin/academic-integrity/appeals/:appealId/resolve */
export const postResolveIntegrityAppeal = asyncHandler(async (req: Request, res: Response) => {
  const appeal = await resolveIntegrityAppeal(req.params.appealId, req.user!.id, req.body.decision, req.body.resolutionNote);
  res.status(200).json(buildSuccessResponse(appeal));
});

/** GET /me/academic-integrity/cases — the learner's own cases, so a flag can actually be discovered and appealed (see `submitAppeal`'s existing generic endpoint). */
export const getMyAcademicIntegrityCases = asyncHandler(async (req: Request, res: Response) => {
  const cases = await listMyAcademicIntegrityCases(req.user!.id);
  res.status(200).json(buildSuccessResponse(cases));
});
