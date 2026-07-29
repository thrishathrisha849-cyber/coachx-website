import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { submitOnboardingStepSchema } from '../../onboarding/onboarding.validation';
import {
  getProgress,
  postStep,
  postComplete,
  getMyRoadmap,
  postRestart,
} from '../../onboarding/onboarding.controller';

/** 003 US2 onboarding sequencer + roadmap (any authenticated user, own data only). */
const router = Router();
router.get('/progress', authenticate, getProgress);
router.post('/steps/:stepNumber', authenticate, validate(submitOnboardingStepSchema), postStep);
router.post('/complete', authenticate, postComplete);
router.get('/roadmap', authenticate, getMyRoadmap);
router.post('/restart', authenticate, postRestart);

export const onboardingRouter = router;
