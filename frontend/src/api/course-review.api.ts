import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export interface PublicCourseReview {
  id: string;
  reviewerName: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  outcome: string | null;
  wouldRecommend: boolean;
  createdAt: string;
}

export interface MyCourseReview {
  id: string;
  courseId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  outcome: string | null;
  wouldRecommend: boolean;
  isAnonymous: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewEligibility {
  eligible: boolean;
  reason?: string;
}

export async function getCourseReviews(courseId: string): Promise<PublicCourseReview[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<PublicCourseReview[]>>(`/lms/courses/${courseId}/reviews`);
  return data.data;
}

export async function getMyCourseReview(courseId: string): Promise<MyCourseReview | null> {
  const { data } = await apiClient.get<ApiSuccessResponse<MyCourseReview | null>>(`/lms/me/courses/${courseId}/review`);
  return data.data;
}

export async function getMyReviewEligibility(courseId: string): Promise<ReviewEligibility> {
  const { data } = await apiClient.get<ApiSuccessResponse<ReviewEligibility>>(`/lms/me/courses/${courseId}/review-eligibility`);
  return data.data;
}

export interface SubmitReviewInput {
  rating: number;
  title?: string;
  comment?: string;
  outcome?: string;
  wouldRecommend: boolean;
  isAnonymous: boolean;
}

export async function submitCourseReview(courseId: string, input: SubmitReviewInput): Promise<MyCourseReview> {
  const { data } = await apiClient.post<ApiSuccessResponse<MyCourseReview>>(`/lms/me/courses/${courseId}/review`, input);
  return data.data;
}
