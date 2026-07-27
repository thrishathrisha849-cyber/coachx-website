import { z } from 'zod';

/**
 * Phase 6 Part 1 — LMS request validation. Built on the SAME Zod +
 * `validate()` middleware standard as every prior phase (no second
 * validation framework) — see `backend/src/cms/cms.validation.ts` for the
 * template this file follows structurally.
 */

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const uuid = () => z.string().uuid();

// Bounds a Json-typed field's serialized size so an unbounded metadata blob
// can never be stored (matches the CMS module's own metadata-size discipline
// — the CMS itself doesn't enforce this on Page but this phase's brief
// explicitly asks for "metadata size" validation, so it's enforced here).
const METADATA_MAX_BYTES = 8 * 1024;
const metadataSchema = z
  .record(z.unknown())
  .optional()
  .refine((value) => value === undefined || JSON.stringify(value).length <= METADATA_MAX_BYTES, {
    message: `metadata must serialize to at most ${METADATA_MAX_BYTES} bytes`,
  });

const paginationQuery = z.object({
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

// --- Sort whitelists (never accept an arbitrary caller-supplied column) ---
export const COURSE_SORT_VALUES = ['newest', 'title', 'featured'] as const;
export const CATEGORY_SORT_VALUES = ['sortOrder', 'name'] as const;

// ============================================================================
// Categories
// ============================================================================

const categoryBodyBase = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().regex(slugPattern, 'Invalid slug format').max(160),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(300).optional(),
  imageUrl: z.string().max(500).optional(),
  icon: z.string().max(60).optional(),
  parentId: uuid().optional(),
  sortOrder: z.number().int().min(0).max(100000).default(0),
  isFeatured: z.boolean().default(false),
  metadata: metadataSchema,
});

export const createCategorySchema = z.object({
  body: categoryBodyBase,
});

export const updateCategorySchema = z.object({
  params: z.object({ id: uuid() }),
  body: categoryBodyBase
    .partial()
    .extend({ parentId: uuid().nullable().optional() })
    .refine((body) => Object.keys(body).length > 0, { message: 'Request body must not be empty' }),
});

export const reorderCategoriesSchema = z.object({
  body: z.object({
    // All items must share the same parent scope (all-root or all-siblings
    // under one parentId) — enforced in the service layer, not here, since
    // it requires a database lookup.
    parentId: uuid().nullable().optional(),
    orderedIds: z.array(uuid()).min(1).max(500),
  }),
});

export const categoryIdParamSchema = z.object({ params: z.object({ id: uuid() }) });

export const publicCategoryQuerySchema = z.object({
  query: z.object({
    parentId: uuid().optional(),
  }),
});

export const adminCategoryQuerySchema = z.object({
  query: paginationQuery.extend({
    status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
    parentId: uuid().optional(),
    sort: z.enum(CATEGORY_SORT_VALUES).default('sortOrder'),
  }),
});

// ============================================================================
// Courses
// ============================================================================

const priceType = z.enum(['FREE', 'PAID']);

const courseBodyBase = z
  .object({
    title: z.string().trim().min(3).max(200),
    slug: z.string().regex(slugPattern, 'Invalid slug format').max(220),
    subtitle: z.string().max(300).optional(),
    shortDescription: z.string().max(300).optional(),
    description: z.string().max(20000).optional(),
    thumbnailUrl: z.string().max(500).optional(),
    coverImageUrl: z.string().max(500).optional(),
    trailerUrl: z.string().max(500).optional(),
    language: z.enum(['EN', 'TA', 'TANGLISH']).default('EN'),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']).default('ALL_LEVELS'),
    visibility: z.enum(['PUBLIC', 'UNLISTED']).default('PUBLIC'),
    categoryId: uuid().optional(),
    durationMinutes: z.number().int().min(0).max(100000).optional(),
    estimatedCompletionMinutes: z.number().int().min(0).max(100000).optional(),
    priceType: priceType.default('FREE'),
    priceAmountMinor: z.number().int().min(0).max(100_000_000).default(0),
    currency: z.string().length(3).default('INR'),
    isFeatured: z.boolean().default(false),
    enrollmentLimit: z.number().int().min(1).max(1_000_000).optional(),
    enrollmentStartAt: z.string().datetime().optional(),
    enrollmentEndAt: z.string().datetime().optional(),
    publishAt: z.string().datetime().optional(),
    expireAt: z.string().datetime().optional(),
    seoTitle: z.string().max(255).optional(),
    seoDescription: z.string().max(500).optional(),
    canonicalUrl: z.string().max(500).optional(),
    metadata: metadataSchema,
  })
  .refine((b) => b.priceType !== 'FREE' || b.priceAmountMinor === 0, {
    message: 'A FREE course must have priceAmountMinor = 0',
    path: ['priceAmountMinor'],
  })
  .refine((b) => !b.publishAt || !b.expireAt || new Date(b.publishAt) < new Date(b.expireAt), {
    message: 'publishAt must be before expireAt',
    path: ['expireAt'],
  })
  .refine(
    (b) => !b.enrollmentStartAt || !b.enrollmentEndAt || new Date(b.enrollmentStartAt) < new Date(b.enrollmentEndAt),
    { message: 'enrollmentStartAt must be before enrollmentEndAt', path: ['enrollmentEndAt'] },
  );

export const createCourseSchema = z.object({ body: courseBodyBase });

// `.partial()` isn't available after `.refine()`, so the update schema is
// built from the same fields independently rather than via
// `courseBodyBase.partial()` (Zod's ZodEffects wrapper has no `.partial()`).
export const updateCourseSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z
    .object({
      title: z.string().trim().min(3).max(200).optional(),
      subtitle: z.string().max(300).optional(),
      shortDescription: z.string().max(300).optional(),
      description: z.string().max(20000).optional(),
      thumbnailUrl: z.string().max(500).optional(),
      coverImageUrl: z.string().max(500).optional(),
      trailerUrl: z.string().max(500).optional(),
      language: z.enum(['EN', 'TA', 'TANGLISH']).optional(),
      level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']).optional(),
      visibility: z.enum(['PUBLIC', 'UNLISTED']).optional(),
      categoryId: uuid().nullable().optional(),
      durationMinutes: z.number().int().min(0).max(100000).optional(),
      estimatedCompletionMinutes: z.number().int().min(0).max(100000).optional(),
      priceType: priceType.optional(),
      priceAmountMinor: z.number().int().min(0).max(100_000_000).optional(),
      currency: z.string().length(3).optional(),
      isFeatured: z.boolean().optional(),
      enrollmentLimit: z.number().int().min(1).max(1_000_000).nullable().optional(),
      enrollmentStartAt: z.string().datetime().nullable().optional(),
      enrollmentEndAt: z.string().datetime().nullable().optional(),
      publishAt: z.string().datetime().nullable().optional(),
      expireAt: z.string().datetime().nullable().optional(),
      seoTitle: z.string().max(255).optional(),
      seoDescription: z.string().max(500).optional(),
      canonicalUrl: z.string().max(500).optional(),
      metadata: metadataSchema,
    })
    .refine((body) => Object.keys(body).length > 0, { message: 'Request body must not be empty' })
    .refine((b) => b.priceType !== 'FREE' || b.priceAmountMinor === undefined || b.priceAmountMinor === 0, {
      message: 'A FREE course must have priceAmountMinor = 0',
      path: ['priceAmountMinor'],
    }),
});

export const changeCourseStatusSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z.object({
    status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED']),
  }),
});

export const courseIdParamSchema = z.object({ params: z.object({ id: uuid() }) });

export const publicCourseQuerySchema = z.object({
  query: paginationQuery.extend({
    q: z.string().trim().max(100).optional(),
    categoryId: uuid().optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']).optional(),
    language: z.enum(['EN', 'TA', 'TANGLISH']).optional(),
    instructorId: uuid().optional(),
    featured: z.enum(['true', 'false']).optional(),
    priceType: priceType.optional(),
    sort: z.enum(COURSE_SORT_VALUES).default('newest'),
  }),
});

export const adminCourseQuerySchema = z.object({
  query: paginationQuery.extend({
    q: z.string().trim().max(100).optional(),
    status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED']).optional(),
    categoryId: uuid().optional(),
    instructorId: uuid().optional(),
    sort: z.enum(COURSE_SORT_VALUES).default('newest'),
  }),
});

export const courseSlugParamSchema = z.object({
  params: z.object({ slug: z.string().regex(slugPattern, 'Invalid slug format') }),
  query: z.object({ language: z.enum(['EN', 'TA', 'TANGLISH']).optional() }),
});

// ============================================================================
// Instructor assignment
// ============================================================================

export const assignInstructorSchema = z.object({
  params: z.object({ id: uuid() }),
  body: z.object({
    userId: uuid(),
    role: z.enum(['INSTRUCTOR', 'TEACHING_ASSISTANT']).default('INSTRUCTOR'),
    isPrimary: z.boolean().default(false),
  }),
});

export const removeInstructorSchema = z.object({
  params: z.object({ id: uuid(), userId: uuid() }),
});

export const setPrimaryInstructorSchema = z.object({
  params: z.object({ id: uuid(), userId: uuid() }),
});

// ============================================================================
// Modules
// ============================================================================

const moduleBodyBase = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().max(5000).optional(),
  position: z.number().int().min(0).max(100000).optional(),
  isPreview: z.boolean().default(false),
  metadata: metadataSchema,
});

export const createModuleSchema = z.object({
  params: z.object({ courseId: uuid() }),
  body: moduleBodyBase,
});

export const updateModuleSchema = z.object({
  params: z.object({ moduleId: uuid() }),
  body: moduleBodyBase
    .partial()
    .extend({ status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional() })
    .refine((body) => Object.keys(body).length > 0, { message: 'Request body must not be empty' }),
});

export const reorderModulesSchema = z.object({
  params: z.object({ courseId: uuid() }),
  body: z.object({
    orderedIds: z.array(uuid()).min(1).max(1000),
  }),
});

export const moduleIdParamSchema = z.object({ params: z.object({ moduleId: uuid() }) });

export const courseModulesParamSchema = z.object({ params: z.object({ courseId: uuid() }) });

export const publicCourseModulesParamSchema = z.object({
  params: z.object({ slug: z.string().regex(slugPattern, 'Invalid slug format') }),
});
