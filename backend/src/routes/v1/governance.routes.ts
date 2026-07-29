import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { requirePermission } from '../../middlewares/authorize.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  startGovernanceRecordSchema,
  governanceIdParamSchema,
  paginationQuerySchema,
  mvpScopeCheckSchema,
  phaseGateQuerySchema,
} from '../../governance/governance.validation';
import {
  postStartGovernanceRecord,
  getGovernanceRecords,
  postAdvanceGovernanceStage,
  getPhaseGateStatus,
  postMvpScopeCheck,
  getPlatformRegistry,
} from '../../governance/governance.controller';

/** 001 FR-083/FR-078–FR-082 — governance sequence + phase gating (`governance.manage`). */
const adminRouter = Router();
adminRouter.post('/records', authenticate, requirePermission('governance.manage'), validate(startGovernanceRecordSchema), postStartGovernanceRecord);
adminRouter.get('/records', authenticate, requirePermission('governance.manage'), validate(paginationQuerySchema), getGovernanceRecords);
adminRouter.post('/records/:recordId/advance', authenticate, requirePermission('governance.manage'), validate(governanceIdParamSchema), postAdvanceGovernanceStage);
adminRouter.get('/phase-gate/:phase', authenticate, requirePermission('governance.manage'), validate(phaseGateQuerySchema), getPhaseGateStatus);
adminRouter.post('/mvp-scope-check', authenticate, requirePermission('governance.manage'), validate(mvpScopeCheckSchema), postMvpScopeCheck);

export const governanceAdminRouter = adminRouter;

/** 001 FR-020–FR-038 — public platform-module/surface registry (informational). */
const registryRouter = Router();
registryRouter.get('/', getPlatformRegistry);

export const platformRegistryRouter = registryRouter;
