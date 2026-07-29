import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { startGovernanceRecord, listGovernance, advanceGovernanceStage } from './governance-workflow.service';
import { evaluatePhaseGate, checkMvpScopeExclusion } from '../platform-registry/phase-gate.service';
import { PLATFORM_MODULES, PLATFORM_SURFACES } from '../platform-registry/platform-module.constants';
import type { ProductPhaseCode } from '../platform-registry/platform-module.constants';

/** POST /api/v1/admin/governance/records — 001 FR-083 (`governance.manage`). */
export const postStartGovernanceRecord = asyncHandler(async (req: Request, res: Response) => {
  const record = await startGovernanceRecord(req.body.featureName, req.body.phase, req.user!.id);
  res.status(201).json(buildSuccessResponse(record));
});

/** GET /api/v1/admin/governance/records */
export const getGovernanceRecords = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const result = await listGovernance(page, pageSize);
  res.status(200).json(buildSuccessResponse(result));
});

/** POST /api/v1/admin/governance/records/:recordId/advance */
export const postAdvanceGovernanceStage = asyncHandler(async (req: Request, res: Response) => {
  const record = await advanceGovernanceStage(req.params.recordId, req.user!.id);
  res.status(200).json(buildSuccessResponse(record));
});

/** GET /api/v1/admin/governance/phase-gate/:phase — 001 FR-078–FR-082 (US8 acceptance scenario 1). */
export const getPhaseGateStatus = asyncHandler(async (req: Request, res: Response) => {
  const result = await evaluatePhaseGate(req.params.phase as ProductPhaseCode);
  res.status(200).json(buildSuccessResponse(result));
});

/** POST /api/v1/admin/governance/mvp-scope-check — 001 FR-082 (US8 acceptance scenario 4). */
export const postMvpScopeCheck = asyncHandler(async (req: Request, res: Response) => {
  const result = checkMvpScopeExclusion(req.body.capabilityCode);
  res.status(200).json(buildSuccessResponse(result));
});

/** GET /api/v1/platform-registry — public, informational (FR-020–FR-038 catalog). */
export const getPlatformRegistry = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json(buildSuccessResponse({ modules: PLATFORM_MODULES, surfaces: PLATFORM_SURFACES }));
});
