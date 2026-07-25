import { Router } from 'express';
import { healthRouter } from './health.routes';
import { readinessRouter } from './readiness.routes';

/**
 * All v1 API routes are mounted here. This is the ONLY place that should
 * ever change when a new v1 feature module is added — nothing else in the
 * app needs to know about individual route modules.
 *
 * Business-domain routers (auth, courses, community, etc.) are added here
 * in later implementation phases. Phase 1/2 intentionally wire up only
 * the infrastructure health/readiness checks.
 */
const router = Router();

router.use('/health', healthRouter);
router.use('/ready', readinessRouter);

export const v1Router = router;
