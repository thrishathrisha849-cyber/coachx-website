import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

/**
 * 004 Quiz System batch — minimal course/module/lesson browsing so an
 * admin can navigate to the lesson they want to attach a quiz to. This is
 * NOT the full course-builder/admin-course-list surface (that's a
 * separate, larger "LMS Admin UI" effort) — just enough reads, reusing the
 * existing backend admin endpoints, to make the Quizzes page usable.
 */

export interface AdminCourseSummary {
  id: string;
  title: string;
  slug: string;
}

export async function getCourseAdmin(courseId: string): Promise<AdminCourseSummary> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCourseSummary>>(`/lms/admin/courses/${courseId}`);
  return data.data;
}

export interface AdminModuleSummary {
  id: string;
  title: string;
  position: number;
}

export async function getCourseModulesAdmin(courseId: string): Promise<AdminModuleSummary[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminModuleSummary[]>>(`/lms/admin/courses/${courseId}/modules`);
  return data.data;
}

export interface AdminLessonSummary {
  id: string;
  title: string;
  position: number;
}

export async function getModuleLessonsAdmin(moduleId: string): Promise<AdminLessonSummary[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminLessonSummary[]>>(`/lms/admin/modules/${moduleId}/lessons`);
  return data.data;
}
