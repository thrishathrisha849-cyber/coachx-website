import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export interface AdminAssignment {
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
  latePolicy: string;
  maxAttempts: number | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
  peerReviewEnabled: boolean;
  peerReviewsRequired: number;
  peerReviewAnonymous: boolean;
  peerReviewDeadlineDays: number | null;
  peerReviewIncludeInGrade: boolean;
}

export interface AdminRubricCriterion {
  id: string;
  assignmentId: string;
  title: string;
  description: string | null;
  maxPoints: number;
  position: number;
}

export interface AdminAssignmentWithRubric extends AdminAssignment {
  rubricCriteria: AdminRubricCriterion[];
}

export async function getAssignmentByLessonId(lessonId: string): Promise<AdminAssignment | null> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<AdminAssignment>>(`/lms/admin/lessons/${lessonId}/assignment`);
    return data.data;
  } catch {
    return null;
  }
}

export interface CreateAssignmentInput {
  title: string;
  instructions?: string;
  learningOutcome?: string;
  submissionFormat: string;
  allowedFileTypes: string[];
  dueAt: string | null;
  maxScore: number;
  passingScore: number;
  latePolicy: string;
  maxAttempts: number | null;
  peerReviewEnabled?: boolean;
  peerReviewsRequired?: number;
  peerReviewAnonymous?: boolean;
  peerReviewDeadlineDays?: number | null;
  peerReviewIncludeInGrade?: boolean;
}

export async function createAssignment(lessonId: string, input: CreateAssignmentInput): Promise<AdminAssignment> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminAssignment>>(`/lms/admin/lessons/${lessonId}/assignment`, input);
  return data.data;
}

export async function getAssignment(assignmentId: string): Promise<AdminAssignmentWithRubric> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminAssignmentWithRubric>>(`/lms/admin/assignments/${assignmentId}`);
  return data.data;
}

export async function changeAssignmentStatus(assignmentId: string, status: string): Promise<AdminAssignment> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminAssignment>>(`/lms/admin/assignments/${assignmentId}/status`, { status });
  return data.data;
}

export interface CreateCriterionInput {
  title: string;
  description?: string;
  maxPoints: number;
}

export async function createCriterion(assignmentId: string, input: CreateCriterionInput): Promise<AdminRubricCriterion> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminRubricCriterion>>(`/lms/admin/assignments/${assignmentId}/criteria`, input);
  return data.data;
}

export async function archiveCriterion(criterionId: string): Promise<void> {
  await apiClient.post(`/lms/admin/criteria/${criterionId}/archive`);
}

// --- Reviewer-facing ---------------------------------------------------

export interface AdminSubmissionSummary {
  id: string;
  assignmentId: string;
  enrollmentId: string;
  learnerUserId: string;
  learnerDisplayName: string | null;
  attemptNumber: number;
  status: string;
  textBody: string | null;
  linkUrl: string | null;
  submittedAt: string | null;
  isLate: boolean;
  score: number | null;
  passed: boolean | null;
  learnerFeedback: string | null;
}

export async function listSubmissionsForReview(assignmentId: string, status?: string): Promise<AdminSubmissionSummary[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminSubmissionSummary[]>>(`/lms/admin/assignments/${assignmentId}/submissions`, {
    params: status ? { status } : undefined,
  });
  return data.data;
}

export interface CriterionScoreResult {
  criterionId: string;
  criterionTitle: string;
  maxPoints: number;
  pointsAwarded: number;
  comment: string | null;
}

export interface PeerReviewForInstructor {
  id: string;
  reviewerEnrollmentId: string;
  reviewerUserId: string;
  reviewerDisplayName: string | null;
  status: string;
  comment: string | null;
  totalScore: number | null;
  submittedAt: string | null;
  moderationStatus: 'VISIBLE' | 'HIDDEN';
  moderationReason: string | null;
  criterionScores: CriterionScoreResult[];
}

export interface AdminSubmissionDetail extends AdminSubmissionSummary {
  criterionScores: CriterionScoreResult[];
  peerReviews: PeerReviewForInstructor[];
}

export async function getSubmission(submissionId: string): Promise<AdminSubmissionDetail> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminSubmissionDetail>>(`/lms/admin/submissions/${submissionId}`);
  return data.data;
}

export async function moderatePeerReview(peerReviewId: string, action: 'HIDE' | 'RESTORE', reason?: string): Promise<void> {
  await apiClient.post(`/lms/admin/peer-reviews/${peerReviewId}/moderate`, { action, reason });
}

export interface ReviewInput {
  decision: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT';
  criterionScores: { criterionId: string; pointsAwarded: number; comment?: string }[];
  reviewerNote?: string;
  learnerFeedback?: string;
}

export async function reviewSubmission(submissionId: string, input: ReviewInput): Promise<AdminSubmissionDetail> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminSubmissionDetail>>(`/lms/admin/submissions/${submissionId}/review`, input);
  return data.data;
}
