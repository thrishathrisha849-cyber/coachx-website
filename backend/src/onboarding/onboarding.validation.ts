import { z } from 'zod';
import { TOTAL_ANSWERED_STEPS } from './onboarding.types';

/**
 * The `answer` payload shape is intentionally loose (`{ value: unknown }`) —
 * each step's own semantics (string vs. string[]) are validated by the
 * frontend step form; the backend's job here is only to persist the step
 * and, for the subset of steps that sync into 001's `UserLifecycleState`,
 * that sync (`onboarding.service.ts`) revalidates the specific shape it
 * needs before writing.
 */
export const submitOnboardingStepSchema = z.object({
  params: z.object({
    stepNumber: z.coerce.number().int().min(1).max(TOTAL_ANSWERED_STEPS),
  }),
  body: z.object({
    answer: z.object({ value: z.unknown() }).passthrough(),
  }),
});
