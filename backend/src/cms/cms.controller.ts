import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { getPublicPage, listPagesByTemplate } from './page.service';
import { getNavigationTree } from './navigation.service';
import { getActiveAnnouncements } from './announcement.service';
import { getFaqsByCategory } from './faq.service';
import { searchSite } from './search.service';

/** GET /api/v1/cms/pages/:slug — 002 FR-086/FR-087/FR-105. */
export const getPageBySlug = asyncHandler(async (req: Request, res: Response) => {
  const language = (req.query.language as string) ?? 'EN';
  const preview = req.query.preview as string | undefined;
  const page = await getPublicPage(req.params.slug, language, preview);
  res.status(200).json(buildSuccessResponse(page));
});

/** GET /api/v1/cms/blog?page=1&pageSize=10&tag=Business — 002 FR-049 (category/tag filter, pagination). */
export const listBlogPosts = asyncHandler(async (req: Request, res: Response) => {
  const language = (req.query.language as string) ?? 'EN';
  const tag = req.query.tag as string | undefined;
  const result = await listPagesByTemplate('BLOG_POST', language, { page: req.query.page as string, pageSize: req.query.pageSize as string }, tag);
  res.status(200).json(buildSuccessResponse(result.data, { ...result.meta }));
});

/** GET /api/v1/cms/navigation/:location — 002 FR-001–FR-003, FR-008. */
export const getNavigation = asyncHandler(async (req: Request, res: Response) => {
  const location = req.params.location.toUpperCase();
  const roles = req.user?.roles ?? [];
  const tree = await getNavigationTree(location, roles);
  res.status(200).json(buildSuccessResponse(tree));
});

/** GET /api/v1/cms/announcements — 002 FR-005/FR-006. */
export const listAnnouncements = asyncHandler(async (_req: Request, res: Response) => {
  const announcements = await getActiveAnnouncements();
  res.status(200).json(buildSuccessResponse(announcements));
});

/** GET /api/v1/cms/faqs — 002 FR-028. */
export const listFaqs = asyncHandler(async (_req: Request, res: Response) => {
  const faqs = await getFaqsByCategory();
  res.status(200).json(buildSuccessResponse(faqs));
});

/** GET /api/v1/cms/search?q=...&page=1&pageSize=10 — 002 FR-009 (pagination, ranking, highlighting). */
export const search = asyncHandler(async (req: Request, res: Response) => {
  const result = await searchSite(req.query.q as string, { page: req.query.page as string, pageSize: req.query.pageSize as string });
  res.status(200).json(buildSuccessResponse(result.data, { ...result.meta }));
});
