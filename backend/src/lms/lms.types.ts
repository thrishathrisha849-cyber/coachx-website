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

/** Public/discovery-safe module shape — no internal metadata/audit fields. FR-016. */
export interface PublicCourseModule {
  id: string;
  title: string;
  description: string | null;
  outcome: string | null;
  position: number;
  estimatedDurationMinutes: number | null;
  isMandatory: boolean;
  isPreview: boolean;
}

/**
 * Admin/instructor-facing module shape — includes lifecycle/audit fields
 * and the Part-1 configuration-only release/completion-rule fields (FR-034,
 * FR-052 — see schema.prisma's `CourseModule` doc comment: stored, not yet
 * enforced).
 */
export interface AdminCourseModule extends PublicCourseModule {
  courseId: string;
  status: string;
  prerequisiteModuleId: string | null;
  releaseRuleType: string;
  releaseRuleValue: unknown;
  completionRuleType: string;
  metadata: unknown;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Public/discovery-safe course shape. Deliberately excludes: internal
 * metadata, review notes, createdBy/updatedBy/reviewedBy/publishedBy,
 * version, and any field an unauthenticated caller must never see (matches
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
  learningOutcomes: string[];
  tags: string[];
  targetAudience: string | null;
  toolsRequired: string[];
  thumbnailUrl: string | null;
  coverImageUrl: string | null;
  trailerUrl: string | null;
  language: string;
  level: string;
  category: PublicCourseCategory | null;
  durationMinutes: number | null;
  estimatedCompletionMinutes: number | null;
  weeklyCommitmentMinutes: number | null;
  certificateAvailable: boolean;
  priceType: string;
  priceAmountMinor: number;
  currency: string;
  isFeatured: boolean;
  /** Placeholder aggregate — see schema.prisma's Course doc comment. Never fabricated; null/0 until Part 2 (learnerCount) / Part 3 (rating) populate it. */
  ratingAverage: number | null;
  ratingCount: number;
  learnerCount: number;
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
  categoryId: string | null;
  enrollmentLimit: number | null;
  enrollmentStartAt: Date | null;
  enrollmentEndAt: Date | null;
  publishAt: Date | null;
  expireAt: Date | null;
  reviewNotes: string | null;
  metadata: unknown;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  reviewedBy: string | null;
  publishedBy: string | null;
  createdAt: Date;
  archivedAt: Date | null;
  instructors: PublicCourseInstructor[];
  /** 004 US6 polish batch (FR-034) — see schema.prisma's Course.sequencingMode doc comment. Admin-only; not exposed on PublicCourse. */
  sequencingMode: string;
  /** 004 Course Translation Management batch (FR-101) — null on every ordinary, non-variant course. */
  translationOfCourseId: string | null;
  translationStatus: string | null;
}
