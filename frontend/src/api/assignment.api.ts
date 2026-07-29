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
