import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export interface AdminCourseReview {
  id: string;
  courseId: string;
  userId: string;
  reviewerName: string;
  rating: number;
  title: string | null;
  comment: string | null;
  outcome: string | null;
  wouldRecommend: boolean;
  isAnonymous: boolean;
  status: string;
  hiddenBy: string | null;
  hiddenAt: string | null;
  hiddenReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listCourseReviewsAdmin(courseId: string): Promise<AdminCourseReview[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminCourseReview[]>>(`/lms/admin/courses/${courseId}/reviews`);
  return data.data;
}

export async function moderateReview(reviewId: string, action: 'HIDE' | 'RESTORE', reason?: string): Promise<AdminCourseReview> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminCourseReview>>(`/lms/admin/reviews/${reviewId}/moderate`, { action, reason });
  return data.data;
}
