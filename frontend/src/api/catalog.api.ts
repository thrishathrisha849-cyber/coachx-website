import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export type CatalogSectionStatus = 'ok' | 'empty';

export interface CatalogSection<T> {
  status: CatalogSectionStatus;
  data: T | null;
  reason?: string;
}

export interface CatalogCourseCard {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  thumbnailUrl: string | null;
  priceType: string;
  certificateAvailable: boolean;
  cardState: 'START' | 'CONTINUE' | 'COMPLETED' | 'LOCKED' | 'COMING_SOON';
}

export interface RecommendationItem {
  type: 'NEXT_COURSE' | 'REVISION_LESSON' | 'PRACTICE_QUIZ';
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  lessonId?: string;
  lessonTitle?: string;
  quizId?: string;
  reason: string;
}

export interface MemberCatalog {
  continueLearning: CatalogSection<CatalogCourseCard[]>;
  recommended: CatalogSection<RecommendationItem[]>;
  newCourses: CatalogSection<CatalogCourseCard[]>;
  popular: CatalogSection<CatalogCourseCard[]>;
  free: CatalogSection<CatalogCourseCard[]>;
  completed: CatalogSection<CatalogCourseCard[]>;
  learningPaths: CatalogSection<never>;
  wishlist: CatalogSection<never>;
  includedInMembership: CatalogSection<never>;
}

export async function getMyCatalog(): Promise<MemberCatalog> {
  const { data } = await apiClient.get<ApiSuccessResponse<MemberCatalog>>('/lms/me/catalog');
  return data.data;
}
