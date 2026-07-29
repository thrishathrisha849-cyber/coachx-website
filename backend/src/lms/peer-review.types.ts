/** 004 US9 Peer Review batch (FR-076) — DTO shapes. Mirrors assignment.types.ts's split. */

import type { CriterionScoreResult } from './assignment.types';

/** One open review-queue item — a submission this learner is eligible to peer-review. */
export interface PeerReviewQueueItem {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  submittedAt: Date | null;
  /** The submitted work itself — a reviewer must see what they're scoring. */
  textBody: string | null;
  linkUrl: string | null;
  criteria: { id: string; title: string; description: string | null; maxPoints: number }[];
  slotsRemaining: number;
}

export interface PeerReviewCriterionScoreInput {
  criterionId: string;
  pointsAwarded: number;
  comment?: string;
}

export interface PeerReviewResult {
  id: string;
  submissionId: string;
  status: string;
  comment: string | null;
  totalScore: number | null;
  claimedAt: Date;
  submittedAt: Date | null;
  criterionScores: CriterionScoreResult[];
}

/** Learner-facing view of a review left on THEIR OWN submission — reviewer identity is
 *  present only when the assignment's `peerReviewAnonymous` is false. */
export interface PeerReviewForSubmitter {
  id: string;
  reviewerDisplayName: string | null;
  comment: string | null;
  totalScore: number | null;
  submittedAt: Date | null;
  criterionScores: CriterionScoreResult[];
}

/** Admin/instructor-facing view — reviewer identity is ALWAYS present (accountability/moderation), plus moderation state. */
export interface PeerReviewForInstructor {
  id: string;
  reviewerEnrollmentId: string;
  reviewerUserId: string;
  reviewerDisplayName: string | null;
  status: string;
  comment: string | null;
  totalScore: number | null;
  submittedAt: Date | null;
  moderationStatus: string;
  moderationReason: string | null;
  criterionScores: CriterionScoreResult[];
}
