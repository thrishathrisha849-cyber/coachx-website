/** Frontend mirror of backend/src/lms/lms.types.ts's public-safe shapes. */

export interface CourseCategory {
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

export interface CourseInstructor {
  userId: string;
  displayName: string;
  role: string;
  isPrimary: boolean;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string | null;
  position: number;
  isPreview: boolean;
}

export interface Course {
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
  category: CourseCategory | null;
  durationMinutes: number | null;
  estimatedCompletionMinutes: number | null;
  priceType: string;
  priceAmountMinor: number;
  currency: string;
  isFeatured: boolean;
  instructors: CourseInstructor[];
  seo: { title: string; description: string | null; canonicalUrl: string | null };
  publishedAt: string | null;
  updatedAt: string;
}

export interface CourseWithModules extends Course {
  modules: CourseModule[];
}
