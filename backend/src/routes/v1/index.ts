import { Router } from 'express';
import { healthRouter } from './health.routes';
import { readinessRouter } from './readiness.routes';
import { authRouter, meRouter, adminUsersRouter } from './auth.routes';
import { cmsRouter, contactRouter, newsletterRouter } from './cms.routes';
import { lmsRouter } from './lms.routes';
import { billingRouter } from './billing.routes';
import { organizationAdminRouter, organizationOwnScopeRouter } from './organization.routes';
import { lifecycleRouter, milestoneAdminRouter } from './lifecycle.routes';
import { trustSafetyRouter, moderationAdminRouter } from './trust-safety.routes';
import { monetizationRouter } from './monetization.routes';
import { kpiRouter } from './kpi.routes';
import { governanceAdminRouter, platformRegistryRouter } from './governance.routes';
import { funnelRouter, funnelAdminRouter } from './funnel.routes';
import { checkoutRouter, checkoutAdminRouter } from './checkout.routes';
import { onboardingRouter } from './onboarding.routes';
import { dashboardRouter } from './dashboard.routes';

/**
 * All v1 API routes are mounted here. This is the ONLY place that should
 * ever change when a new v1 feature module is added — nothing else in the
 * app needs to know about individual route modules.
 *
 * Business-domain routers (courses, community, etc.) are added here in
 * later implementation phases. Phase 4 added the auth/identity/RBAC
 * surface (`/auth/*`, `/me`, `/admin/users/*`) — see
 * docs/auth/API_REFERENCE.md. Phase 5 (Part 1) adds the public-site/CMS
 * surface (`/cms/*`, `/contact`, `/newsletter`) — see
 * docs/public-site/TRACEABILITY.md. Phase 6 Part 1 adds the LMS course-
 * engine surface (`/lms/*`, `/lms/admin/*`, `/lms/instructor/*`) — see
 * docs/lms/API_REFERENCE_PART1.md. Phase 7 Part 1 adds the billing
 * foundation surface (`/billing/*`, `/billing/admin/*` — Products, Product
 * Prices, Membership Plans, Plan Versions, Plan Entitlements only; no
 * checkout/orders/payments/subscriptions yet) — see
 * docs/billing/API_REFERENCE.md. Note: `/sitemap.xml` and `/robots.txt`
 * are mounted at the application ROOT in `app.ts`, not here, since they
 * must be served at the domain root per SEO convention, not under
 * `/api/v1`.
 */
const router = Router();

router.use('/health', healthRouter);
router.use('/ready', readinessRouter);
router.use('/auth', authRouter);
router.use('/me', meRouter);
router.use('/admin/users', adminUsersRouter);
router.use('/cms', cmsRouter);
router.use('/contact', contactRouter);
router.use('/newsletter', newsletterRouter);
router.use('/lms', lmsRouter);
router.use('/billing', billingRouter);
router.use('/admin/organizations', organizationAdminRouter);
router.use('/organization', organizationOwnScopeRouter);
router.use('/lifecycle', lifecycleRouter);
router.use('/admin/milestones', milestoneAdminRouter);
router.use('/trust-safety', trustSafetyRouter);
router.use('/admin/moderation', moderationAdminRouter);
router.use('/monetization', monetizationRouter);
router.use('/admin/kpi', kpiRouter);
router.use('/admin/governance', governanceAdminRouter);
router.use('/platform-registry', platformRegistryRouter);
router.use('/funnel', funnelRouter);
router.use('/funnel/admin', funnelAdminRouter);
router.use('/checkout', checkoutRouter);
router.use('/checkout/admin', checkoutAdminRouter);
router.use('/onboarding', onboardingRouter);
router.use('/dashboard', dashboardRouter);

export const v1Router = router;
