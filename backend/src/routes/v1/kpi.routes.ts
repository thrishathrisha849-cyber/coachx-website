import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate.middleware';
import { requirePermission } from '../../middlewares/authorize.middleware';
import { getKpiReport } from '../../kpi/kpi.controller';

const router = Router();
router.get('/', authenticate, requirePermission('kpi.view'), getKpiReport);

export const kpiRouter = router;
