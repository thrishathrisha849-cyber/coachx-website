import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import { config } from '../config';
import { findLifecycleState } from './lifecycle.repository';
import { computeProfileCompletionPercent } from './stage-transition.service';

export type NextBestActionCode =
  | 'COMPLETE_PROFILE'
  | 'NICHE_DISCOVERY_ASSESSMENT'
  | 'START_FOUNDATION_COURSE'
  | 'AI_OFFER_BUILDER';

export interface NextBestAction {
  code: NextBestActionCode;
  label: string;
}

const ACTIONS: Record<NextBestActionCode, string> = {
  COMPLETE_PROFILE: 'Complete your profile',
  NICHE_DISCOVERY_ASSESSMENT: 'Take the Niche Discovery Assessment',
  START_FOUNDATION_COURSE: 'Start Business Foundation Module',
  AI_OFFER_BUILDER: 'Use AI Offer Builder',
};

/**
 * 001 FR-014, US1 acceptance scenarios 1–4: evaluates profile/progress
 * state and returns exactly ONE next-best-action, in priority order —
 * never a static checklist. "Create an offer" (scenario 4's terminal
 * step) depends on the AI Business Workspace's Offer Builder (008, not
 * built yet) — `firstOfferCreatedAt` is the integration point that
 * future feature sets; until then, a user who has completed the
 * foundation course simply always sees AI_OFFER_BUILDER as their next
 * action (there is no stage beyond it defined by this feature).
 */
export async function resolveNextBestAction(userId: string): Promise<NextBestAction> {
  const state = await findLifecycleState(userId);

  if (!state || computeProfileCompletionPercent(state) < 80) {
    return { code: 'COMPLETE_PROFILE', label: ACTIONS.COMPLETE_PROFILE };
  }

  if (!state.nicheSelected) {
    return { code: 'NICHE_DISCOVERY_ASSESSMENT', label: ACTIONS.NICHE_DISCOVERY_ASSESSMENT };
  }

  const foundationCourseCompleted = await hasCompletedFoundationCourse(userId);
  if (!foundationCourseCompleted) {
    return { code: 'START_FOUNDATION_COURSE', label: ACTIONS.START_FOUNDATION_COURSE };
  }

  return { code: 'AI_OFFER_BUILDER', label: ACTIONS.AI_OFFER_BUILDER };
}

async function hasCompletedFoundationCourse(userId: string): Promise<boolean> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      userId,
      completedAt: { not: null },
      course: { slug: config.lifecycle.foundationCourseSlug },
    },
  });

  return Boolean(enrollment);
}
