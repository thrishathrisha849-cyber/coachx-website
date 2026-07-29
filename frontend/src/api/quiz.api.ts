import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export interface PublicQuiz {
  id: string;
  lessonId: string;
  title: string;
  instructions: string | null;
  quizType: string;
  passingScorePercent: number;
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
  questionCount: number;
}

export interface QuestionOption {
  id: string;
  text: string;
  position: number;
}

export interface PublicQuestion {
  id: string;
  type: string;
  prompt: string;
  points: number;
  position: number;
  options: QuestionOption[];
}

export interface GradedQuestionReview extends PublicQuestion {
  explanation: string | null;
  correctOptionIds: string[];
  yourSelectedOptionIds: string[];
  yourAnswerText: string | null;
  isCorrect: boolean | null;
  pointsAwarded: number | null;
}

export interface QuizAttemptResult {
  id: string;
  quizId: string;
  attemptNumber: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'EXPIRED';
  startedAt: string;
  expiresAt: string | null;
  submittedAt: string | null;
  gradedAt: string | null;
  pointsPossible: number | null;
  pointsEarned: number | null;
  scorePercent: number | null;
  passed: boolean | null;
}

export interface QuizAttemptWithQuestions extends QuizAttemptResult {
  questions: PublicQuestion[];
}

export interface QuizAttemptWithReview extends QuizAttemptResult {
  reviewVisible: boolean;
  questions: GradedQuestionReview[];
}

export async function getQuizOverview(quizId: string): Promise<PublicQuiz> {
  const { data } = await apiClient.get<ApiSuccessResponse<PublicQuiz>>(`/lms/me/quizzes/${quizId}`);
  return data.data;
}

export async function startOrResumeAttempt(quizId: string): Promise<QuizAttemptWithQuestions> {
  const { data } = await apiClient.post<ApiSuccessResponse<QuizAttemptWithQuestions>>(`/lms/me/quizzes/${quizId}/attempts`);
  return data.data;
}

export async function getAttempt(attemptId: string): Promise<QuizAttemptWithQuestions | QuizAttemptWithReview> {
  const { data } = await apiClient.get<ApiSuccessResponse<QuizAttemptWithQuestions | QuizAttemptWithReview>>(`/lms/me/quiz-attempts/${attemptId}`);
  return data.data;
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  body: { selectedOptionIds?: string[]; answerText?: string },
): Promise<void> {
  await apiClient.post(`/lms/me/quiz-attempts/${attemptId}/answers/${questionId}`, body);
}

export async function submitAttempt(attemptId: string): Promise<QuizAttemptResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<QuizAttemptResult>>(`/lms/me/quiz-attempts/${attemptId}/submit`);
  return data.data;
}
