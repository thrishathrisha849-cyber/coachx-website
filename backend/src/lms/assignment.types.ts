/** 004 US4 Assignment System — DTO shapes. Mirrors quiz.types.ts's public/admin split. */

export interface PublicAssignment {
  id: string;
  lessonId: string;
  title: string;
  instructions: string | null;
  learningOutcome: string | null;
  submissionFormat: string;
  allowedFileTypes: string[];
  dueAt: Date | null;
  maxScore: number;
  passingScore: number;
  maxAttempts: number | null;
  /** FR-076 — lets the learner UI know a peer-review queue exists for this assignment. */
  peerReviewEnabled: boolean;
  peerReviewsRequired: number;
}

export interface AdminRubricCriterion {
  id: string;
  assignmentId: string;
  title: string;
  description: string | null;
  maxPoints: number;
  position: number;
}

export interface AdminAssignment {
  id: string;
  lessonId: string;
  title: string;
  instructions: string | null;
  learningOutcome: string | null;
  submissionFormat: string;
  allowedFileTypes: string[];
  dueAt: Date | null;
  maxScore: number;
  passingScore: number;
  latePolicy: string;
  maxAttempts: number | null;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  /** FR-076 Peer Review config (004 US9 batch). */
  peerReviewEnabled: boolean;
  peerReviewsRequired: number;
  peerReviewAnonymous: boolean;
  peerReviewDeadlineDays: number | null;
  peerReviewIncludeInGrade: boolean;
}

export interface AdminAssignmentWithRubric extends AdminAssignment {
  rubricCriteria: AdminRubricCriterion[];
}

export interface CriterionScoreInput {
  criterionId: string;
  pointsAwarded: number;
  comment?: string;
}

export interface SubmissionResult {
  id: string;
  assignmentId: string;
  attemptNumber: number;
  status: string;
  textBody: string | null;
  linkUrl: string | null;
  submittedAt: Date | null;
  isLate: boolean;
  score: number | null;
  passed: boolean | null;
  learnerFeedback: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CriterionScoreResult {
  criterionId: string;
  criterionTitle: string;
  maxPoints: number;
  pointsAwarded: number;
  comment: string | null;
}

export interface SubmissionWithScores extends SubmissionResult {
  criterionScores: CriterionScoreResult[];
}

export interface AdminSubmissionSummary extends SubmissionResult {
  enrollmentId: string;
  learnerUserId: string;
  learnerDisplayName: string | null;
}
