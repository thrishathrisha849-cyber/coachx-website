import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { listPublicCategories } from './category.service';
import { getPublicCourseBySlug, listPublicCoursesForDiscovery, getPublicCourseModulesBySlug } from './course.service';

/**
 * Public, read-only LMS discovery API (Phase 6 Part 1 brief's "Public
 * Course APIs"). Every handler here returns ONLY publicly-safe serialized
 * data (see lms.serializers.ts) — never a raw Prisma row.
 */

/** GET /api/v1/lms/categories?parentId=... */
export const getPublicCategories = asyncHandler(async (req: Request, res: Response) => {
  const parentId = req.query.parentId as string | undefined;
  const categories = await listPublicCategories(parentId);
  res.status(200).json(buildSuccessResponse(categories));
});

/** GET /api/v1/lms/courses — search/filter/sort/paginate. */
export const getPublicCourses = asyncHandler(async (req: Request, res: Response) => {
  const q = req.query.q as string | undefined;
  const result = await listPublicCoursesForDiscovery(
    {
      q,
      categoryId: req.query.categoryId as string | undefined,
      level: req.query.level as string | undefined,
      language: req.query.language as string | undefined,
      instructorId: req.query.instructorId as string | undefined,
      featured: req.query.featured === undefined ? undefined : req.query.featured === 'true',
      priceType: req.query.priceType as string | undefined,
    },
    { page: req.query.page as string, pageSize: req.query.pageSize as string },
    (req.query.sort as string) ?? 'newest',
  );
  res.status(200).json(buildSuccessResponse(result.data, { ...result.meta }));
});

/** GET /api/v1/lms/courses/:slug */
export const getPublicCourseDetail = asyncHandler(async (req: Request, res: Response) => {
  const course = await getPublicCourseBySlug(req.params.slug);
  res.status(200).json(buildSuccessResponse(course));
});

/** GET /api/v1/lms/courses/:slug/modules */
export const getPublicCourseModules = asyncHandler(async (req: Request, res: Response) => {
  const modules = await getPublicCourseModulesBySlug(req.params.slug);
  res.status(200).json(buildSuccessResponse(modules));
});
