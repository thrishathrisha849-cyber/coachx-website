import type { AdminCourseReview, MyCourseReview, PublicCourseReview } from './course-review.types';

type ReviewRow = {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  outcome: string | null;
  wouldRecommend: boolean;
  isAnonymous: boolean;
  status: string;
  hiddenBy: string | null;
  hiddenAt: Date | null;
  hiddenReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ReviewRowWithUser = ReviewRow & { user: { profile: { displayName: string } | null } };

export function toPublicCourseReview(row: ReviewRowWithUser): PublicCourseReview {
  return {
    id: row.id,
    reviewerName: row.isAnonymous ? null : (row.user.profile?.displayName ?? 'CoachX Learner'),
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    outcome: row.outcome,
    wouldRecommend: row.wouldRecommend,
    createdAt: row.createdAt,
  };
}

export function toMyCourseReview(row: ReviewRow): MyCourseReview {
  return {
    id: row.id,
    courseId: row.courseId,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    outcome: row.outcome,
    wouldRecommend: row.wouldRecommend,
    isAnonymous: row.isAnonymous,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toAdminCourseReview(row: ReviewRowWithUser): AdminCourseReview {
  return {
    ...toMyCourseReview(row),
    userId: row.userId,
    reviewerName: row.user.profile?.displayName ?? 'CoachX Learner',
    hiddenBy: row.hiddenBy,
    hiddenAt: row.hiddenAt,
    hiddenReason: row.hiddenReason,
  };
}
