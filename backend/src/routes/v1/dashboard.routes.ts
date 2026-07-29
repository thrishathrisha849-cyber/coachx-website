import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { getMyDashboard } from '../../dashboard/dashboard.controller';

/** 003 US4 member dashboard aggregation (any authenticated user, own data only). */
const router = Router();
router.get('/', authenticate, getMyDashboard);

export const dashboardRouter = router;
