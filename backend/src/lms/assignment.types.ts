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
  /** 004 Broader Assessment Types batch (FR-068). */
  assessmentType: string;
  /** FR-076 — lets the learner UI know a peer-review queue exists for this assignment. */
  peerReviewEnabled: boolean;
  peerReviewsRequired: number;
}

/** 004 Broader Assessment Types batch (FR-068) — learner-safe rubric criterion (no submission-specific data). */
export interface PublicRubricCriterion {
  id: string;
  title: string;
  description: string | null;
  maxPoints: number;
}

/** GET /me/assignments/:assignmentId — the learner's own pre-submission overview, including the rubric a SELF_ASSESSMENT/SKILL_RATING assignment asks them to rate themselves against. */
export interface PublicAssignmentWithRubric extends PublicAssignment {
  rubricCriteria: PublicRubricCriterion[];
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
  /** 004 Broader Assessment Types batch (FR-068). */
  assessmentType: string;
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
  /** 004 Broader Assessment Types batch (FR-068) — server-derived, see `Assignment.assessmentType`'s schema doc comment. */
  outcomeLevel: string | null;
  /** True when scored via `submitSelfAssessment`, not an instructor review. */
  isSelfAssessed: boolean;
  learnerFeedback: string | null;
  feedbackViewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** 004 Assignment Feedback Interaction batch (FR-078, T067). */
export interface SubmissionFeedbackMessageResult {
  id: string;
  submissionId: string;
  authorId: string;
  authorRole: 'LEARNER' | 'INSTRUCTOR';
  type: 'REPLY' | 'CLARIFICATION_REQUEST';
  body: string;
  createdAt: Date;
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
