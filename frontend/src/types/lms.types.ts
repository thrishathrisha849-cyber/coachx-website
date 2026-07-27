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
  outcome: string | null;
  position: number;
  estimatedDurationMinutes: number | null;
  isMandatory: boolean;
  isPreview: boolean;
}

export interface Course {
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
  category: CourseCategory | null;
  durationMinutes: number | null;
  estimatedCompletionMinutes: number | null;
  weeklyCommitmentMinutes: number | null;
  certificateAvailable: boolean;
  priceType: string;
  priceAmountMinor: number;
  currency: string;
  isFeatured: boolean;
  /** Placeholder aggregate — see backend's Course schema doc comment. Null/0 until Part 2/3 populate it; never fabricated. */
  ratingAverage: number | null;
  ratingCount: number;
  learnerCount: number;
  instructors: CourseInstructor[];
  seo: { title: string; description: string | null; canonicalUrl: string | null };
  publishedAt: string | null;
  updatedAt: string;
}

export interface CourseWithModules extends Course {
  modules: CourseModule[];
}
