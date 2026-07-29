import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedStepNumbers: number[];
  isComplete: boolean;
}

export async function getOnboardingProgress(): Promise<OnboardingProgress> {
  const { data } = await apiClient.get<ApiSuccessResponse<OnboardingProgress>>('/onboarding/progress');
  return data.data;
}

export async function submitOnboardingStep(stepNumber: number, value: unknown): Promise<void> {
  await apiClient.post(`/onboarding/steps/${stepNumber}`, { answer: { value } });
}

export interface Roadmap {
  id: string;
  goalSummary: string;
  currentStage: string;
  recommendedLearningPath: string | null;
  recommendedFirstCourseSlug: string | null;
  recommendedCommunityGroup: string | null;
  recommendedChallenge: string | null;
  recommendedEvent: string | null;
  recommendedAiTool: string | null;
  expectedWeeklyCommitment: string | null;
  firstMilestone: string;
  generatedBy: 'AI' | 'DETERMINISTIC_FALLBACK';
}

export async function completeOnboarding(): Promise<Roadmap> {
  const { data } = await apiClient.post<ApiSuccessResponse<Roadmap>>('/onboarding/complete');
  return data.data;
}

export async function getMyRoadmap(): Promise<Roadmap> {
  const { data } = await apiClient.get<ApiSuccessResponse<Roadmap>>('/onboarding/roadmap');
  return data.data;
}

export async function restartOnboarding(): Promise<void> {
  await apiClient.post('/onboarding/restart');
}
