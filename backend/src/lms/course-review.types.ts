/** 004 Discovery & Recommendations batch (FR-087) — Course Review DTOs. */

export interface PublicCourseReview {
  id: string;
  /** Null when `isAnonymous` — the public serializer never leaks the reviewer's identity in that case. */
  reviewerName: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  outcome: string | null;
  wouldRecommend: boolean;
  createdAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCourseReview extends MyCourseReview {
  userId: string;
  reviewerName: string;
  hiddenBy: string | null;
  hiddenAt: Date | null;
  hiddenReason: string | null;
}

export interface ReviewEligibility {
  eligible: boolean;
  reason?: string;
}
