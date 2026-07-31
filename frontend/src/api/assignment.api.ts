import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

/** 004 Broader Assessment Types batch (FR-068). */
export type AssessmentType = 'STANDARD' | 'SELF_ASSESSMENT' | 'SKILL_RATING' | 'SCENARIO_TASK' | 'PORTFOLIO_REVIEW';

export interface PublicAssignment {
  id: string;
  lessonId: string;
  title: string;
  instructions: string | null;
  learningOutcome: string | null;
  submissionFormat: string;
  allowedFileTypes: string[];
  dueAt: string | null;
  maxScore: number;
  passingScore: number;
  maxAttempts: number | null;
  assessmentType: AssessmentType;
  peerReviewEnabled: boolean;
  peerReviewsRequired: number;
}

export interface PublicRubricCriterion {
  id: string;
  title: string;
  description: string | null;
  maxPoints: number;
}

export interface PublicAssignmentWithRubric extends PublicAssignment {
  rubricCriteria: PublicRubricCriterion[];
}

export interface SubmissionResult {
  id: string;
  assignmentId: string;
  attemptNumber: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'APPROVED' | 'REJECTED' | 'EXCUSED';
  textBody: string | null;
  linkUrl: string | null;
  submittedAt: string | null;
  isLate: boolean;
  score: number | null;
  passed: boolean | null;
  /** 004 Broader Assessment Types batch (FR-068) — server-derived. */
  outcomeLevel: string | null;
  isSelfAssessed: boolean;
  learnerFeedback: string | null;
  feedbackViewedAt: string | null;
  createdAt: string;
  updatedAt: string;
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

/** GET /me/assignments/:assignmentId — 004 Broader Assessment Types batch (FR-068): the learner's pre-submission overview, including rubric criteria. */
export async function getAssignmentOverview(assignmentId: string): Promise<PublicAssignmentWithRubric> {
  const { data } = await apiClient.get<ApiSuccessResponse<PublicAssignmentWithRubric>>(`/lms/me/assignments/${assignmentId}`);
  return data.data;
}

export async function startOrResumeSubmission(assignmentId: string): Promise<SubmissionResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<SubmissionResult>>(`/lms/me/assignments/${assignmentId}/submissions`);
  return data.data;
}

/** POST /me/submissions/:submissionId/self-assess — 004 Broader Assessment Types batch (FR-068): SELF_ASSESSMENT/SKILL_RATING's own submit+outcome path. */
export async function submitSelfAssessment(
  submissionId: string,
  criterionScores: { criterionId: string; pointsAwarded: number; comment?: string }[],
): Promise<SubmissionWithScores> {
  const { data } = await apiClient.post<ApiSuccessResponse<SubmissionWithScores>>(`/lms/me/submissions/${submissionId}/self-assess`, { criterionScores });
  return data.data;
}

export async function getMySubmissions(assignmentId: string): Promise<SubmissionResult[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<SubmissionResult[]>>(`/lms/me/assignments/${assignmentId}/submissions`);
  return data.data;
}

export async function getMySubmissionDetail(submissionId: string): Promise<SubmissionWithScores> {
  const { data } = await apiClient.get<ApiSuccessResponse<SubmissionWithScores>>(`/lms/me/submissions/${submissionId}`);
  return data.data;
}

export async function saveDraft(submissionId: string, body: { textBody?: string; linkUrl?: string }): Promise<SubmissionResult> {
  const { data } = await apiClient.patch<ApiSuccessResponse<SubmissionResult>>(`/lms/me/submissions/${submissionId}`, body);
  return data.data;
}

/** `declaredOriginal` — FR-116's "originality declaration": the learner's own affirmation this submission is their own work, enforced server-side (a `false` value is rejected, not silently ignored). */
export async function submitSubmission(submissionId: string, declaredOriginal: true): Promise<SubmissionResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<SubmissionResult>>(`/lms/me/submissions/${submissionId}/submit`, {
    declaredOriginal,
  });
  return data.data;
}

// ============================================================================
// Assignment Feedback Interaction (004, FR-078, T067)
// ============================================================================

export interface SubmissionFeedbackMessage {
  id: string;
  submissionId: string;
  authorId: string;
  authorRole: 'LEARNER' | 'INSTRUCTOR';
  type: 'REPLY' | 'CLARIFICATION_REQUEST';
  body: string;
  createdAt: string;
}

export async function markFeedbackViewed(submissionId: string): Promise<SubmissionResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<SubmissionResult>>(`/lms/me/submissions/${submissionId}/feedback/viewed`);
  return data.data;
}

export async function replyToFeedback(submissionId: string, body: string): Promise<SubmissionFeedbackMessage> {
  const { data } = await apiClient.post<ApiSuccessResponse<SubmissionFeedbackMessage>>(`/lms/me/submissions/${submissionId}/feedback/reply`, { body });
  return data.data;
}

export async function requestClarification(submissionId: string, body: string): Promise<SubmissionFeedbackMessage> {
  const { data } = await apiClient.post<ApiSuccessResponse<SubmissionFeedbackMessage>>(`/lms/me/submissions/${submissionId}/feedback/clarify`, { body });
  return data.data;
}

export async function getMyFeedbackMessages(submissionId: string): Promise<SubmissionFeedbackMessage[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<SubmissionFeedbackMessage[]>>(`/lms/me/submissions/${submissionId}/feedback/messages`);
  return data.data;
}

// ============================================================================
// Peer Review (004 US9 batch, FR-076)
// ============================================================================

export interface PeerReviewQueueItem {
  submissionId: string;
  assignmentId: string;
  assignmentTitle: string;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  submittedAt: string | null;
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
  status: 'PENDING' | 'SUBMITTED' | 'EXCUSED';
  comment: string | null;
  totalScore: number | null;
  claimedAt: string;
  submittedAt: string | null;
  criterionScores: CriterionScoreResult[];
}

export interface PeerReviewForSubmitter {
  id: string;
  reviewerDisplayName: string | null;
  comment: string | null;
  totalScore: number | null;
  submittedAt: string | null;
  criterionScores: CriterionScoreResult[];
}

export async function getPeerReviewQueue(): Promise<PeerReviewQueueItem[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<PeerReviewQueueItem[]>>('/lms/me/peer-review-queue');
  return data.data;
}

export async function claimPeerReview(submissionId: string): Promise<PeerReviewResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<PeerReviewResult>>(`/lms/me/submissions/${submissionId}/peer-review`);
  return data.data;
}

export async function submitPeerReview(peerReviewId: string, body: { criterionScores: PeerReviewCriterionScoreInput[]; comment?: string }): Promise<PeerReviewResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<PeerReviewResult>>(`/lms/me/peer-reviews/${peerReviewId}/submit`, body);
  return data.data;
}

export async function getMyPeerReviewsReceived(submissionId: string): Promise<PeerReviewForSubmitter[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<PeerReviewForSubmitter[]>>(`/lms/me/submissions/${submissionId}/peer-reviews`);
  return data.data;
}
