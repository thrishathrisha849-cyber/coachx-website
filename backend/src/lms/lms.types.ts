/**
 * Phase 6 Part 1 — LMS foundation shared types. Mirrors the CMS module's
 * own `cms.types.ts` split: DTOs/serializer-output shapes live here,
 * request-body shapes live in `lms.validation.ts` (inferred from the Zod
 * schemas so the two can never drift).
 */

/** Public/discovery-safe course category shape — no internal audit fields. */
export interface PublicCourseCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  imageUrl: string | null;
  icon: string | null;
  parentId: string | null;
  sortOrder: number;
  isFeatured: boolean;
}

/** Admin-facing category shape — includes lifecycle/audit fields. */
export interface AdminCourseCategory extends PublicCourseCategory {
  status: string;
  metadata: unknown;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Public/discovery-safe instructor shape — display name only, no PII. */
export interface PublicCourseInstructor {
  userId: string;
  displayName: string;
  role: string;
  isPrimary: boolean;
}

/** Public/discovery-safe module shape — no internal metadata/audit fields. */
export interface PublicCourseModule {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPreview: boolean;
}

/** Admin/instructor-facing module shape — includes lifecycle/audit fields. */
export interface AdminCourseModule extends PublicCourseModule {
  courseId: string;
  status: string;
  metadata: unknown;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Public/discovery-safe course shape. Deliberately excludes: internal
 * metadata, review notes, createdBy/updatedBy, version, exact enrollment
 * counts, and any field an unauthenticated caller must never see (matches
 * the same explicit-serializer discipline `cms.types.ts`'s `RenderedPage`
 * already established — never return a raw Prisma row from a public route).
 */
export interface PublicCourse {
  id: string;
  title: string;
  slug: string;
  subtitle: string | null;
  shortDescription: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  coverImageUrl: string | null;
  trailerUrl: string | null;
  language: string;
  level: string;
  category: PublicCourseCategory | null;
  durationMinutes: number | null;
  estimatedCompletionMinutes: number | null;
  priceType: string;
  priceAmountMinor: number;
  currency: string;
  isFeatured: boolean;
  instructors: PublicCourseInstructor[];
  seo: {
    title: string;
    description: string | null;
    canonicalUrl: string | null;
  };
  publishedAt: Date | null;
  updatedAt: Date;
}

/** Public course + its publicly-visible modules (course detail page). */
export interface PublicCourseWithModules extends PublicCourse {
  modules: PublicCourseModule[];
}

/**
 * Admin/instructor-facing course shape — the full editable record. Still
 * not a raw Prisma row (no relation-loading internals leak through), but
 * includes lifecycle/audit/internal fields a public caller must never see.
 */
export interface AdminCourse extends Omit<PublicCourse, 'category' | 'instructors'> {
  status: string;
  visibility: string;
  categoryId: string | null;
  enrollmentLimit: number | null;
  enrollmentStartAt: Date | null;
  enrollmentEndAt: Date | null;
  publishAt: Date | null;
  expireAt: Date | null;
  metadata: unknown;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  archivedAt: Date | null;
  instructors: PublicCourseInstructor[];
}
