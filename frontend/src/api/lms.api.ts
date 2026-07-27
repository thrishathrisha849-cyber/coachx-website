import type { ApiSuccessResponse, PaginatedResponse, PaginationMeta } from '@coachx/shared';
import { apiClient } from './client';
import type { Course, CourseCategory, CourseWithModules } from '@/types/lms.types';

export interface CourseDiscoveryFilters {
  q?: string;
  categoryId?: string;
  level?: string;
  language?: string;
  featured?: boolean;
  sort?: 'newest' | 'title' | 'featured';
}

/** Phase 6 Part 1 — public course discovery (pagination, filtering, sorting). */
export async function fetchCourses(
  filters: CourseDiscoveryFilters,
  page = 1,
  pageSize = 12,
): Promise<{ items: Course[]; meta: PaginationMeta }> {
  const { data } = await apiClient.get<PaginatedResponse<Course>>('/lms/courses', {
    params: { ...filters, page, pageSize },
  });
  return { items: data.data, meta: data.meta };
}

export async function fetchCourseBySlug(slug: string): Promise<CourseWithModules> {
  const { data } = await apiClient.get<ApiSuccessResponse<CourseWithModules>>(`/lms/courses/${slug}`);
  return data.data;
}

export async function fetchCourseCategories(parentId?: string): Promise<CourseCategory[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<CourseCategory[]>>('/lms/categories', {
    params: parentId ? { parentId } : undefined,
  });
  return data.data;
}
