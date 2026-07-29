import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { findLifecycleState, createLifecycleState, updateLifecycleState } from './lifecycle.repository';

export interface OnboardingInput {
  languageSelected?: string;
  goalSelected?: string;
  experienceLevel?: string;
  skillSelected?: string;
  businessStage?: string;
  timeAvailability?: string;
  interests?: string[];
}

/**
 * 001 FR-017: captures welcome-flow/language/goal/experience-level/skill/
 * business-stage/time-availability/interest selection. Creates the
 * `UserLifecycleState` row on first call (lazily — not every existing
 * user has one yet since this feature is added after registration
 * already exists) rather than requiring registration.service.ts to
 * change, keeping this feature additive to 003's auth flow.
 */
export async function submitOnboarding(userId: string, input: OnboardingInput) {
  let state = await findLifecycleState(userId);
  if (!state) state = await createLifecycleState(userId);

  const updated = await updateLifecycleState(userId, {
    ...(input.languageSelected !== undefined ? { languageSelected: input.languageSelected } : {}),
    ...(input.goalSelected !== undefined ? { goalSelected: input.goalSelected } : {}),
    ...(input.experienceLevel !== undefined ? { experienceLevel: input.experienceLevel } : {}),
    ...(input.skillSelected !== undefined ? { skillSelected: input.skillSelected } : {}),
    ...(input.businessStage !== undefined ? { businessStage: input.businessStage } : {}),
    ...(input.timeAvailability !== undefined ? { timeAvailability: input.timeAvailability } : {}),
    ...(input.interests !== undefined ? { interests: input.interests } : {}),
    onboardingCompletedAt: new Date(),
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId: userId,
    action: 'lifecycle.onboarding_completed',
    resourceType: 'user_lifecycle_state',
    resourceId: userId,
  });

  return updated;
}

/** 001 FR-017: records a niche selection separately from the initial onboarding submit — a user may complete onboarding before choosing a niche (see next-best-action.service.ts sequencing). */
export async function selectNiche(userId: string, niche: string) {
  const state = await findLifecycleState(userId);
  if (!state) throw AppError.badRequest('Complete onboarding before selecting a niche');

  return updateLifecycleState(userId, { nicheSelected: niche });
}

export async function getLifecycleState(userId: string) {
  const state = await findLifecycleState(userId);
  if (!state) throw AppError.notFound('Lifecycle state not found — complete onboarding first');
  return state;
}
