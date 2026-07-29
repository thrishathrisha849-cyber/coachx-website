import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export interface AdminQuiz {
  id: string;
  lessonId: string;
  title: string;
  instructions: string | null;
  quizType: string;
  passingScorePercent: number;
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  showCorrectAnswers: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
}

export interface AdminQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  position: number;
}

export interface AdminQuestion {
  id: string;
  quizId: string;
  type: string;
  prompt: string;
  explanation: string | null;
  points: number;
  position: number;
  answerKey: unknown;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  options: AdminQuestionOption[];
}

export interface AdminQuizWithQuestions extends AdminQuiz {
  questions: AdminQuestion[];
}

export async function getQuizByLessonId(lessonId: string): Promise<AdminQuiz | null> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<AdminQuiz>>(`/lms/admin/lessons/${lessonId}/quiz`);
    return data.data;
  } catch {
    return null;
  }
}

export interface CreateQuizInput {
  title: string;
  instructions?: string;
  quizType: string;
  passingScorePercent: number;
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  showCorrectAnswers: boolean;
}

export async function createQuiz(lessonId: string, input: CreateQuizInput): Promise<AdminQuiz> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminQuiz>>(`/lms/admin/lessons/${lessonId}/quiz`, input);
  return data.data;
}

export async function getQuiz(quizId: string): Promise<AdminQuizWithQuestions> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminQuizWithQuestions>>(`/lms/admin/quizzes/${quizId}`);
  return data.data;
}

export async function updateQuiz(quizId: string, input: Partial<CreateQuizInput>): Promise<AdminQuiz> {
  const { data } = await apiClient.patch<ApiSuccessResponse<AdminQuiz>>(`/lms/admin/quizzes/${quizId}`, input);
  return data.data;
}

export async function changeQuizStatus(quizId: string, status: string): Promise<AdminQuiz> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminQuiz>>(`/lms/admin/quizzes/${quizId}/status`, { status });
  return data.data;
}

export interface CreateQuestionInput {
  type: string;
  prompt: string;
  explanation?: string;
  points: number;
  options?: { text: string; isCorrect: boolean }[];
  answerKey?: Record<string, unknown>;
}

export async function createQuestion(quizId: string, input: CreateQuestionInput): Promise<AdminQuestion> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminQuestion>>(`/lms/admin/quizzes/${quizId}/questions`, input);
  return data.data;
}

export async function updateQuestion(questionId: string, input: Partial<CreateQuestionInput> & { status?: string }): Promise<AdminQuestion> {
  const { data } = await apiClient.patch<ApiSuccessResponse<AdminQuestion>>(`/lms/admin/questions/${questionId}`, input);
  return data.data;
}

export async function archiveQuestion(questionId: string): Promise<AdminQuestion> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminQuestion>>(`/lms/admin/questions/${questionId}/archive`);
  return data.data;
}
