import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { requirePermission } from '../../middlewares/authorize.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  submitOnboardingSchema,
  selectNicheSchema,
  claimMilestoneSchema,
  paginationQuerySchema,
  milestoneIdParamSchema,
  rejectMilestoneSchema,
} from '../../lifecycle/lifecycle.validation';
import {
  postOnboarding,
  postSelectNiche,
  postClaimMilestone,
  getMilestonesForReview,
  postVerifyMilestone,
  postRejectMilestone,
} from '../../lifecycle/lifecycle.controller';

/** 001 FR-017 onboarding capture + FR-045 milestone claim (any authenticated user). */
const router = Router();
router.post('/onboarding', authenticate, validate(submitOnboardingSchema), postOnboarding);
router.post('/niche', authenticate, validate(selectNicheSchema), postSelectNiche);
router.post('/milestones', authenticate, validate(claimMilestoneSchema), postClaimMilestone);

export const lifecycleRouter = router;

/** 001 FR-045 milestone verification (`milestone.verify` — platform_admin/super_admin only). */
const adminRouter = Router();
adminRouter.get('/', authenticate, requirePermission('milestone.verify'), validate(paginationQuerySchema), getMilestonesForReview);
adminRouter.post('/:milestoneId/verify', authenticate, requirePermission('milestone.verify'), validate(milestoneIdParamSchema), postVerifyMilestone);
adminRouter.post('/:milestoneId/reject', authenticate, requirePermission('milestone.verify'), validate(rejectMilestoneSchema), postRejectMilestone);

export const milestoneAdminRouter = adminRouter;
