/**
 * 003 FR-078: the 13-step onboarding sequence. Steps 12-13 (Roadmap,
 * Recommended First Action) are system-GENERATED, not user-answered —
 * they are produced by `roadmap-generator.service.ts` once steps 1-11
 * are complete, not submitted via `postSubmitStep`.
 */
export const ONBOARDING_STEPS = [
  { stepNumber: 1, stepKey: 'welcome' },
  { stepNumber: 2, stepKey: 'language' },
  { stepNumber: 3, stepKey: 'goal' },
  { stepNumber: 4, stepKey: 'user_type' },
  { stepNumber: 5, stepKey: 'experience' },
  { stepNumber: 6, stepKey: 'business_stage' },
  { stepNumber: 7, stepKey: 'interests' },
  { stepNumber: 8, stepKey: 'time_availability' },
  { stepNumber: 9, stepKey: 'format' },
  { stepNumber: 10, stepKey: 'challenge' },
  { stepNumber: 11, stepKey: 'assessment' },
] as const;

export const TOTAL_ANSWERED_STEPS = ONBOARDING_STEPS.length;
export const TOTAL_ONBOARDING_STEPS = 13; // includes generated steps 12 (Roadmap) and 13 (Recommended First Action)

export type OnboardingStepKey = (typeof ONBOARDING_STEPS)[number]['stepKey'];
