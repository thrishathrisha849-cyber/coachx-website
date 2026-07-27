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
  position: number;
  isPreview: boolean;
  courseId: string;
  status: string;
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
    position: row.position,
    isPreview: row.isPreview,
  };
}

export function toAdminModule(row: ModuleRow): AdminCourseModule {
  return {
    ...toPublicModule(row),
    courseId: row.courseId,
    status: row.status,
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
  thumbnailUrl: string | null;
  coverImageUrl: string | null;
  trailerUrl: string | null;
  language: string;
  level: string;
  status: string;
  visibility: string;
  categoryId: string | null;
  category: CategoryRow | null;
  durationMinutes: number | null;
  estimatedCompletionMinutes: number | null;
  priceType: string;
  priceAmountMinor: number;
  currency: string;
  isFeatured: boolean;
  enrollmentLimit: number | null;
  enrollmentStartAt: Date | null;
  enrollmentEndAt: Date | null;
  publishAt: Date | null;
  expireAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  metadata: unknown;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
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
    thumbnailUrl: row.thumbnailUrl,
    coverImageUrl: row.coverImageUrl,
    trailerUrl: row.trailerUrl,
    language: row.language,
    level: row.level,
    category: row.category ? toPublicCategory(row.category) : null,
    durationMinutes: row.durationMinutes,
    estimatedCompletionMinutes: row.estimatedCompletionMinutes,
    priceType: row.priceType,
    priceAmountMinor: row.priceAmountMinor,
    currency: row.currency,
    isFeatured: row.isFeatured,
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
    thumbnailUrl: row.thumbnailUrl,
    coverImageUrl: row.coverImageUrl,
    trailerUrl: row.trailerUrl,
    language: row.language,
    level: row.level,
    status: row.status,
    visibility: row.visibility,
    categoryId: row.categoryId,
    durationMinutes: row.durationMinutes,
    estimatedCompletionMinutes: row.estimatedCompletionMinutes,
    priceType: row.priceType,
    priceAmountMinor: row.priceAmountMinor,
    currency: row.currency,
    isFeatured: row.isFeatured,
    enrollmentLimit: row.enrollmentLimit,
    enrollmentStartAt: row.enrollmentStartAt,
    enrollmentEndAt: row.enrollmentEndAt,
    publishAt: row.publishAt,
    expireAt: row.expireAt,
    seo: {
      title: row.seoTitle ?? row.title,
      description: row.seoDescription ?? row.shortDescription,
      canonicalUrl: row.canonicalUrl,
    },
    metadata: row.metadata,
    version: row.version,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    archivedAt: row.archivedAt,
    instructors: row.instructors.map(toPublicInstructor),
  };
}
