import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

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
  peerReviewEnabled: boolean;
  peerReviewsRequired: number;
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
  learnerFeedback: string | null;
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

export async function startOrResumeSubmission(assignmentId: string): Promise<SubmissionResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<SubmissionResult>>(`/lms/me/assignments/${assignmentId}/submissions`);
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

export async function submitSubmission(submissionId: string): Promise<SubmissionResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<SubmissionResult>>(`/lms/me/submissions/${submissionId}/submit`);
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
