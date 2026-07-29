import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { findStepResponses, findRoadmap, upsertStepResponse } from './onboarding.repository';
import { findLifecycleState, createLifecycleState, updateLifecycleState } from '../lifecycle/lifecycle.repository';
import { generateRoadmap } from './roadmap-generator.service';
import { ONBOARDING_STEPS, TOTAL_ANSWERED_STEPS, type OnboardingStepKey } from './onboarding.types';

/** Maps a step's answer onto 001's `UserLifecycleState` flat fields (reused by its Next-Best-Action engine) — kept in sync as a side effect, never duplicated as a second source of truth for these specific fields. */
const LIFECYCLE_FIELD_BY_STEP: Partial<Record<OnboardingStepKey, string>> = {
  language: 'languageSelected',
  goal: 'goalSelected',
  experience: 'experienceLevel',
  business_stage: 'businessStage',
  interests: 'interests',
  time_availability: 'timeAvailability',
};

async function syncToLifecycleState(userId: string, stepKey: OnboardingStepKey, value: unknown) {
  const field = LIFECYCLE_FIELD_BY_STEP[stepKey];
  if (!field) return;

  let state = await findLifecycleState(userId);
  if (!state) state = await createLifecycleState(userId);
  await updateLifecycleState(userId, { [field]: value } as never);
}

export interface OnboardingProgress {
  currentStep: number;
  totalSteps: number;
  completedStepNumbers: number[];
  isComplete: boolean;
}

/** FR-090: resume from the exact next incomplete step — never re-presenting an already-completed one. */
export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress> {
  const responses = await findStepResponses(userId);
  const completedStepNumbers = responses.map((r) => r.stepNumber);
  const highestCompleted = completedStepNumbers.length > 0 ? Math.max(...completedStepNumbers) : 0;

  return {
    currentStep: Math.min(highestCompleted + 1, TOTAL_ANSWERED_STEPS),
    totalSteps: TOTAL_ANSWERED_STEPS,
    completedStepNumbers,
    isComplete: completedStepNumbers.length >= TOTAL_ANSWERED_STEPS,
  };
}

export interface SubmitStepInput {
  userId: string;
  stepNumber: number;
  answer: Record<string, unknown>;
}

/** FR-078 acceptance scenario 1: each step's answer is saved before advancing. Idempotent — re-submitting the same step (e.g. going back to edit) overwrites, never duplicates. */
export async function submitOnboardingStep(input: SubmitStepInput) {
  const stepDef = ONBOARDING_STEPS.find((s) => s.stepNumber === input.stepNumber);
  if (!stepDef) throw AppError.badRequest('Invalid onboarding step number');

  const response = await upsertStepResponse(input.userId, input.stepNumber, stepDef.stepKey, input.answer as never);

  await syncToLifecycleState(input.userId, stepDef.stepKey, input.answer.value);

  await recordAuditEvent({
    actorType: 'USER',
    actorId: input.userId,
    action: 'onboarding.step_completed',
    resourceType: 'onboarding_step_response',
    resourceId: response.id,
    afterState: { stepNumber: input.stepNumber, stepKey: stepDef.stepKey },
  });

  return response;
}

/**
 * FR-095 acceptance scenario: once all 11 answered steps exist, generates
 * (or regenerates, if already present) the Roadmap and marks 001's
 * `onboardingCompletedAt` — the ONE place in this module allowed to set
 * that flag, so a mid-flow partial save (`submitOnboardingStep`) never
 * prematurely flips it.
 */
export async function completeOnboarding(userId: string) {
  const progress = await getOnboardingProgress(userId);
  if (!progress.isComplete) {
    throw AppError.badRequest('All onboarding steps must be completed before generating a roadmap');
  }

  const roadmap = await generateRoadmap(userId);

  let state = await findLifecycleState(userId);
  if (!state) state = await createLifecycleState(userId);
  if (!state.onboardingCompletedAt) {
    await updateLifecycleState(userId, { onboardingCompletedAt: new Date() });
  }

  await recordAuditEvent({
    actorType: 'USER',
    actorId: userId,
    action: 'onboarding.completed',
    resourceType: 'roadmap',
    resourceId: roadmap.id,
  });

  return roadmap;
}

export async function getRoadmap(userId: string) {
  const roadmap = await findRoadmap(userId);
  if (!roadmap) throw AppError.notFound('Roadmap has not been generated yet');
  return roadmap;
}

/** Settings option to restart onboarding (FR-090) — clears step responses so the sequence begins fresh; the Roadmap is regenerated on next completion, not deleted immediately (avoids leaving the user without any recommendation in the interim). */
export async function restartOnboarding(userId: string) {
  const { getPrismaClient } = await import('../database/prisma-client');
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  await prisma.onboardingStepResponse.deleteMany({ where: { userId } });

  await recordAuditEvent({
    actorType: 'USER',
    actorId: userId,
    action: 'onboarding.restarted',
    resourceType: 'user',
    resourceId: userId,
  });
}
