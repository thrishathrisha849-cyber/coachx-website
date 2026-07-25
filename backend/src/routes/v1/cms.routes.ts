import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware';
import { authenticateOptional, authenticate } from '../../middlewares/authenticate.middleware';
import { requirePermission } from '../../middlewares/authorize.middleware';
import {
  contactFormRateLimiter,
  newsletterRateLimiter,
  searchRateLimiter,
} from '../../cms/cms-rate-limit.middleware';
import { cacheControl } from '../../cms/cache-control.middleware';
import {
  getPageBySlugSchema,
  createPageSchema,
  updatePageSchema,
  updatePageStatusSchema,
  contactSubmitSchema,
  newsletterSubscribeSchema,
  newsletterUnsubscribeSchema,
  searchSchema,
  blogListSchema,
} from '../../cms/cms.validation';
import {
  getPageBySlug,
  listBlogPosts,
  getNavigation,
  listAnnouncements,
  listFaqs,
  search,
} from '../../cms/cms.controller';
import {
  postPage,
  patchPage,
  patchPageStatus,
  postPagePreviewLink,
  getPageVersions,
} from '../../cms/admin-cms.controller';
import { postContact, postNewsletterSubscribe, postNewsletterUnsubscribe } from '../../cms/contact.controller';

/**
 * Phase 5 — Public Website & CMS routes. Public reads use
 * `authenticateOptional` (FR-007's nav permission-awareness is
 * structurally supported even though no frontend session exists yet —
 * see docs/public-site/TRACEABILITY.md). Admin writes require
 * `content.manage` (002 FR-084) and are backend-only, no editor UI.
 *
 * Cache-Control (Phase 5 Part 2 performance): every public GET route
 * gets a short, safe cache header — see cms/cache-control.middleware.ts.
 */
const router = Router();

// --- Public reads -----------------------------------------------------
router.get('/pages/:slug', cacheControl, authenticateOptional, validate(getPageBySlugSchema), getPageBySlug);
router.get('/blog', cacheControl, validate(blogListSchema), listBlogPosts);
router.get('/navigation/:location', cacheControl, authenticateOptional, getNavigation);
router.get('/announcements', cacheControl, listAnnouncements);
router.get('/faqs', cacheControl, listFaqs);
router.get('/search', searchRateLimiter, validate(searchSchema), search);

// --- Admin writes (backend foundation only, no editor UI) --------------
router.post('/admin/pages', authenticate, requirePermission('content.manage'), validate(createPageSchema), postPage);
router.patch('/admin/pages/:id', authenticate, requirePermission('content.manage'), validate(updatePageSchema), patchPage);
router.patch(
  '/admin/pages/:id/status',
  authenticate,
  requirePermission('content.manage'),
  validate(updatePageStatusSchema),
  patchPageStatus,
);
router.post('/admin/pages/:id/preview-link', authenticate, requirePermission('content.manage'), postPagePreviewLink);
router.get('/admin/pages/:id/versions', authenticate, requirePermission('content.manage'), getPageVersions);

export const cmsRouter = router;

/** Contact + Newsletter — mounted separately at /contact and /newsletter (not nested under /cms). */
export const contactRouter = Router();
contactRouter.post('/', contactFormRateLimiter, validate(contactSubmitSchema), postContact);

export const newsletterRouter = Router();
newsletterRouter.post('/subscribe', newsletterRateLimiter, validate(newsletterSubscribeSchema), postNewsletterSubscribe);
newsletterRouter.post(
  '/unsubscribe',
  newsletterRateLimiter,
  validate(newsletterUnsubscribeSchema),
  postNewsletterUnsubscribe,
);
