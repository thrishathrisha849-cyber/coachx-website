import type {
  AdminCourse,
  AdminCourseCategory,
  AdminCourseModule,
  PublicCourse,
  PublicCourseCategory,
  PublicCourseInstructor,
  PublicCourseModule,
  PublicCourseWithModules,
} from './lms.types';

/**
 * Explicit serializers — Phase 6 Part 1 brief's "Use explicit serializers"
 * / "Do not... leak... raw database models." Every public/instructor-facing
 * API response is built by one of these, never by returning a Prisma row
 * (or its `include`d relations) directly. Same discipline as the CMS
 * module's `toRenderedPage()` in `backend/src/cms/page.service.ts`.
 */

type CategoryRow = {
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
  status: string;
  metadata: unknown;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toPublicCategory(row: CategoryRow): PublicCourseCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    shortDescription: row.shortDescription,
    imageUrl: row.imageUrl,
    icon: row.icon,
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    isFeatured: row.isFeatured,
  };
}

export function toAdminCategory(row: CategoryRow): AdminCourseCategory {
  return {
    ...toPublicCategory(row),
    status: row.status,
    metadata: row.metadata,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type InstructorRow = {
  userId: string;
  role: string;
  isPrimary: boolean;
  user: { profile: { displayName: string } | null };
};

export function toPublicInstructor(row: InstructorRow): PublicCourseInstructor {
  return {
    userId: row.userId,
    // Falls back to a neutral label rather than leaking an email/internal
    // ID if a profile is somehow missing — never expose private user
    // fields (brief: "Do not expose... private instructor data").
    displayName: row.user.profile?.displayName ?? 'Instructor',
    role: row.role,
    isPrimary: row.isPrimary,
  };
}

type ModuleRow = {
  id: string;
  title: string;
  description: string | null;
  outcome: string | null;
  position: number;
  estimatedDurationMinutes: number | null;
  isMandatory: boolean;
  isPreview: boolean;
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
};

export function toPublicModule(row: ModuleRow): PublicCourseModule {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    outcome: row.outcome,
    position: row.position,
    estimatedDurationMinutes: row.estimatedDurationMinutes,
    isMandatory: row.isMandatory,
    isPreview: row.isPreview,
  };
}

export function toAdminModule(row: ModuleRow): AdminCourseModule {
  return {
    ...toPublicModule(row),
    courseId: row.courseId,
    status: row.status,
    prerequisiteModuleId: row.prerequisiteModuleId,
    releaseRuleType: row.releaseRuleType,
    releaseRuleValue: row.releaseRuleValue,
    completionRuleType: row.completionRuleType,
    metadata: row.metadata,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type CourseRow = {
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
  status: string;
  categoryId: string | null;
  category: CategoryRow | null;
  durationMinutes: number | null;
  estimatedCompletionMinutes: number | null;
  weeklyCommitmentMinutes: number | null;
  certificateAvailable: boolean;
  priceType: string;
  priceAmountMinor: number;
  currency: string;
  isFeatured: boolean;
  ratingAverage: number | null;
  ratingCount: number;
  learnerCount: number;
  enrollmentLimit: number | null;
  enrollmentStartAt: Date | null;
  enrollmentEndAt: Date | null;
  publishAt: Date | null;
  expireAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  reviewNotes: string | null;
  metadata: unknown;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  reviewedBy: string | null;
  publishedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  archivedAt: Date | null;
  instructors: InstructorRow[];
};

export function toPublicCourse(row: CourseRow): PublicCourse {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    shortDescription: row.shortDescription,
    description: row.description,
    learningOutcomes: row.learningOutcomes,
    tags: row.tags,
    targetAudience: row.targetAudience,
    toolsRequired: row.toolsRequired,
    thumbnailUrl: row.thumbnailUrl,
    coverImageUrl: row.coverImageUrl,
    trailerUrl: row.trailerUrl,
    language: row.language,
    level: row.level,
    category: row.category ? toPublicCategory(row.category) : null,
    durationMinutes: row.durationMinutes,
    estimatedCompletionMinutes: row.estimatedCompletionMinutes,
    weeklyCommitmentMinutes: row.weeklyCommitmentMinutes,
    certificateAvailable: row.certificateAvailable,
    priceType: row.priceType,
    priceAmountMinor: row.priceAmountMinor,
    currency: row.currency,
    isFeatured: row.isFeatured,
    ratingAverage: row.ratingAverage,
    ratingCount: row.ratingCount,
    learnerCount: row.learnerCount,
    instructors: row.instructors.map(toPublicInstructor),
    seo: {
      title: row.seoTitle ?? row.title,
      description: row.seoDescription ?? row.shortDescription,
      canonicalUrl: row.canonicalUrl,
    },
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
  };
}

export function toPublicCourseWithModules(
  row: CourseRow,
  modules: ModuleRow[],
): PublicCourseWithModules {
  return {
    ...toPublicCourse(row),
    modules: modules.map(toPublicModule),
  };
}

export function toAdminCourse(row: CourseRow): AdminCourse {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    subtitle: row.subtitle,
    shortDescription: row.shortDescription,
    description: row.description,
    learningOutcomes: row.learningOutcomes,
    tags: row.tags,
    targetAudience: row.targetAudience,
    toolsRequired: row.toolsRequired,
    thumbnailUrl: row.thumbnailUrl,
    coverImageUrl: row.coverImageUrl,
    trailerUrl: row.trailerUrl,
    language: row.language,
    level: row.level,
    status: row.status,
    categoryId: row.categoryId,
    durationMinutes: row.durationMinutes,
    estimatedCompletionMinutes: row.estimatedCompletionMinutes,
    weeklyCommitmentMinutes: row.weeklyCommitmentMinutes,
    certificateAvailable: row.certificateAvailable,
    priceType: row.priceType,
    priceAmountMinor: row.priceAmountMinor,
    currency: row.currency,
    isFeatured: row.isFeatured,
    ratingAverage: row.ratingAverage,
    ratingCount: row.ratingCount,
    learnerCount: row.learnerCount,
    enrollmentLimit: row.enrollmentLimit,
    enrollmentStartAt: row.enrollmentStartAt,
    enrollmentEndAt: row.enrollmentEndAt,
    publishAt: row.publishAt,
    expireAt: row.expireAt,
    reviewNotes: row.reviewNotes,
    seo: {
      title: row.seoTitle ?? row.title,
      description: row.seoDescription ?? row.shortDescription,
      canonicalUrl: row.canonicalUrl,
    },
    metadata: row.metadata,
    version: row.version,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    reviewedBy: row.reviewedBy,
    publishedBy: row.publishedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    archivedAt: row.archivedAt,
    instructors: row.instructors.map(toPublicInstructor),
  };
}
