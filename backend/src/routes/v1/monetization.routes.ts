import { Router } from 'express';
import { getRevenueStreams } from '../../monetization/monetization.controller';

const router = Router();
router.get('/revenue-streams', getRevenueStreams);

export const monetizationRouter = router;
