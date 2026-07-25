import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { getReadiness } from '../../controllers/readiness.controller';

const router = Router();

router.get('/', asyncHandler(getReadiness));

export const readinessRouter = router;
