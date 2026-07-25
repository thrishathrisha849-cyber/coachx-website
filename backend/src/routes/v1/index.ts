import { Router } from 'express';
import { healthRouter } from './health.routes';
import { readinessRouter } from './readiness.routes';
import { authRouter, meRouter, adminUsersRouter } from './auth.routes';

/**
 * All v1 API routes are mounted here. This is the ONLY place that should
 * ever change when a new v1 feature module is added — nothing else in the
 * app needs to know about individual route modules.
 *
 * Business-domain routers (courses, community, etc.) are added here in
 * later implementation phases. Phase 4 adds the auth/identity/RBAC
 * surface (`/auth/*`, `/me`, `/admin/users/*`) — see
 * docs/auth/API_REFERENCE.md for the full endpoint list.
 */
const router = Router();

router.use('/health', healthRouter);
router.use('/ready', readinessRouter);
router.use('/auth', authRouter);
router.use('/me', meRouter);
router.use('/admin/users', adminUsersRouter);

export const v1Router = router;
