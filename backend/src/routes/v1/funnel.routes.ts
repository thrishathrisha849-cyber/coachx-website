import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { requirePermission } from '../../middlewares/authorize.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { leadCaptureRateLimiter, masterclassRegistrationRateLimiter } from '../../funnel/funnel-rate-limit.middleware';
import {
  captureLeadSchema,
  registerMasterclassSchema,
  masterclassStatusQuerySchema,
  createMasterclassConfigSchema,
  consentWithdrawalSchema,
} from '../../funnel/funnel.validation';
import {
  postCaptureLead,
  postWithdrawConsent,
  getMasterclassStatusHandler,
  postRegisterForMasterclass,
  postCreateMasterclassConfig,
  getFunnelCoverage,
} from '../../funnel/funnel.controller';

/** 002 US2/US3/FR-102 — public lead-magnet + masterclass funnel endpoints (no authentication required, rate-limited). */
const router = Router();
router.post('/leads', leadCaptureRateLimiter, validate(captureLeadSchema), postCaptureLead);
router.post('/consent/withdraw', validate(consentWithdrawalSchema), postWithdrawConsent);
router.get('/masterclass/status', validate(masterclassStatusQuerySchema), getMasterclassStatusHandler);
router.post('/masterclass/register', masterclassRegistrationRateLimiter, validate(registerMasterclassSchema), postRegisterForMasterclass);

export const funnelRouter = router;

/** 002 US3 admin — attach masterclass config to a CMS Page (`content.manage`). */
const adminRouter = Router();
adminRouter.post('/masterclass-configs', authenticate, requirePermission('content.manage'), validate(createMasterclassConfigSchema), postCreateMasterclassConfig);
adminRouter.get('/coverage', authenticate, requirePermission('kpi.view'), getFunnelCoverage);

export const funnelAdminRouter = adminRouter;
