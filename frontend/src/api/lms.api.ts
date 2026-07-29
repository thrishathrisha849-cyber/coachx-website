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

// --- 004 US1/US2 — enrollment + lesson consumption (member-authenticated) ---

export type AccessDenialReason =
  | 'AUTHENTICATION_REQUIRED'
  | 'ENROLLMENT_REQUIRED'
  | 'ENTITLEMENT_REQUIRED'
  | 'ENTITLEMENT_PENDING'
  | 'ACCESS_NOT_STARTED'
  | 'ACCESS_EXPIRED'
  | 'ENROLLMENT_SUSPENDED'
  | 'ENROLLMENT_CANCELLED'
  | 'ENROLLMENT_REVOKED'
  | 'COURSE_UNAVAILABLE'
  | 'COURSE_ARCHIVED'
  | 'COURSE_RETIRED'
  | 'MODULE_LOCKED'
  | 'PREREQUISITE_NOT_MET'
  | 'LESSON_NOT_RELEASED'
  | 'PERMISSION_DENIED';

export type CourseAccessDecision =
  | { allowed: true; viaPreview?: boolean }
  | { allowed: false; reason: AccessDenialReason; message: string; detail?: Record<string, unknown> };

export async function getMyCourseAccess(courseId: string): Promise<CourseAccessDecision> {
  const { data } = await apiClient.get<ApiSuccessResponse<CourseAccessDecision>>(`/lms/me/courses/${courseId}/access`);
  return data.data;
}

export interface MyEnrollment {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  source: string;
  status: string;
  enrolledAt: string;
  activatedAt: string | null;
  accessStartAt: string | null;
  accessEndAt: string | null;
  completedAt: string | null;
  lastAccessedAt: string | null;
}

export async function enrollInCourse(courseId: string): Promise<MyEnrollment> {
  const { data } = await apiClient.post<ApiSuccessResponse<MyEnrollment>>('/lms/me/enrollments', { courseId });
  return data.data;
}

export interface ContinueLearningResult {
  courseComplete: boolean;
  nextLesson: { id: string; moduleTitle: string; title: string; slug: string } | null;
  reason: 'RESUME_IN_PROGRESS' | 'START_NEXT' | 'COURSE_COMPLETE' | 'NO_ACCESSIBLE_CONTENT';
}

export async function getContinueLearning(courseId: string): Promise<ContinueLearningResult> {
  const { data } = await apiClient.get<ApiSuccessResponse<ContinueLearningResult>>(`/lms/me/courses/${courseId}/continue-learning`);
  return data.data;
}

export interface CurriculumLessonItem {
  id: string;
  title: string;
  slug: string;
  position: number;
  durationMinutes: number | null;
  isMandatory: boolean;
  isPreview: boolean;
  locked: boolean;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface CurriculumModuleItem {
  id: string;
  title: string;
  position: number;
  isMandatory: boolean;
  locked: boolean;
  lockReason?: string;
  unlockAt?: string;
  lessons: CurriculumLessonItem[];
}

export async function getCourseCurriculum(courseId: string): Promise<CurriculumModuleItem[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<CurriculumModuleItem[]>>(`/lms/me/courses/${courseId}/curriculum`);
  return data.data;
}

export interface PublicLearningActivity {
  id: string;
  type: string;
  title: string | null;
  position: number;
  mediaUrl: string | null;
  externalUrl: string | null;
  bodyText: string | null;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  embedProvider: string | null;
  embedResourceId: string | null;
}

export interface LessonDetail {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  summary: string | null;
  position: number;
  durationMinutes: number | null;
  isPreview: boolean;
  isMandatory: boolean;
  description: string | null;
  completionRuleType: string;
  completionRuleTypes: string[];
  activities: PublicLearningActivity[];
  /** 004 US3 — present only when this lesson has an attached, PUBLISHED quiz. */
  quiz: { id: string; title: string; quizType: string; passingScorePercent: number; maxAttempts: number | null; timeLimitMinutes: number | null } | null;
  /** 004 US4 — present only when this lesson has an attached, PUBLISHED assignment. */
  assignment: {
    id: string;
    title: string;
    instructions: string | null;
    submissionFormat: string;
    dueAt: string | null;
    maxScore: number;
    passingScore: number;
    maxAttempts: number | null;
  } | null;
}

export async function getLesson(lessonId: string): Promise<LessonDetail> {
  const { data } = await apiClient.get<ApiSuccessResponse<LessonDetail>>(`/lms/me/lessons/${lessonId}`);
  return data.data;
}

export type LastPosition =
  | { kind: 'video'; positionSeconds: number }
  | { kind: 'audio'; positionSeconds: number }
  | { kind: 'article'; scrollPercent: number }
  | { kind: 'pdf'; pageNumber: number };

export async function updateLessonProgress(
  lessonId: string,
  body: { timeSpentDeltaSeconds?: number; watchedPercent?: number; lastPosition?: LastPosition },
): Promise<{ percentage: number; status: string }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ percentage: number; status: string }>>(
    `/lms/me/lessons/${lessonId}/progress`,
    body,
  );
  return data.data;
}

export async function completeLessonManually(lessonId: string): Promise<{ alreadyCompleted: boolean }> {
  const { data } = await apiClient.post<ApiSuccessResponse<{ alreadyCompleted: boolean }>>(`/lms/me/lessons/${lessonId}/complete`);
  return data.data;
}

export async function markActivityViewed(activityId: string): Promise<void> {
  await apiClient.post(`/lms/me/activities/${activityId}/viewed`);
}
