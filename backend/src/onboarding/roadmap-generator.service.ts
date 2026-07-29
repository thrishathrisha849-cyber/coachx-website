import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import { config } from '../config';
import { findStepResponses, upsertRoadmap } from './onboarding.repository';

/**
 * FR-095 / Constitution Article II ("AI is assistive, never autonomous —
 * every AI-generated output must have a non-AI deterministic fallback if
 * the AI call fails"): no AI provider is wired into this codebase yet (no
 * client, no key, no prior integration anywhere in `backend/src`), so this
 * generator IS the deterministic fallback path — it always runs and always
 * produces a complete, valid Roadmap. `generatedBy` is therefore always
 * recorded as `DETERMINISTIC_FALLBACK`. The function is structured as a
 * single entry point so a future AI-drafting step can be inserted ahead of
 * this logic (try AI, catch, fall through to this) without changing the
 * public signature or the persisted shape.
 */
export async function generateRoadmap(userId: string) {
  const responses = await findStepResponses(userId);
  const answerByStepKey = new Map(responses.map((r) => [r.stepKey, r.answer as Record<string, unknown>]));

  const goal = (answerByStepKey.get('goal')?.value as string | undefined) ?? 'Grow your business';
  const businessStage = (answerByStepKey.get('business_stage')?.value as string | undefined) ?? 'Just starting out';
  const interests = (answerByStepKey.get('interests')?.value as string[] | undefined) ?? [];
  const timeAvailability = (answerByStepKey.get('time_availability')?.value as string | undefined) ?? undefined;
  const experienceLevel = (answerByStepKey.get('experience')?.value as string | undefined) ?? undefined;

  const recommendedFirstCourseSlug = await findMatchingCourseSlug(interests);

  const data = {
    goalSummary: goal,
    currentStage: businessStage,
    recommendedLearningPath: interests.length > 0 ? `${interests[0]} Learning Path` : null,
    recommendedFirstCourseSlug,
    recommendedCommunityGroup: null, // Community (Volume 05 / spec 005) not built yet — honest null, not a fabricated group.
    recommendedChallenge: null, // Gamification challenges (spec 006) not built yet.
    recommendedEvent: null, // Events (spec 010) not built yet.
    recommendedAiTool: null, // AI Business Workspace (spec 008) not built yet.
    expectedWeeklyCommitment: timeAvailability ?? null,
    firstMilestone: buildFirstMilestone(experienceLevel, recommendedFirstCourseSlug),
    generatedBy: 'DETERMINISTIC_FALLBACK' as const,
  };

  return upsertRoadmap(userId, data);
}

function buildFirstMilestone(experienceLevel: string | undefined, courseSlug: string | null): string {
  if (courseSlug) return `Complete the first lesson of your recommended course`;
  if (experienceLevel === 'beginner') return 'Complete your profile and explore the course catalog';
  return 'Enroll in a course that matches your goal';
}

async function findMatchingCourseSlug(interests: string[]): Promise<string | null> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  if (interests.length > 0) {
    const matched = await prisma.course.findFirst({
      where: { status: 'PUBLISHED', tags: { hasSome: interests } },
      orderBy: { createdAt: 'asc' },
      select: { slug: true },
    });
    if (matched) return matched.slug;
  }

  const foundation = await prisma.course.findFirst({
    where: { status: 'PUBLISHED', slug: config.lifecycle.foundationCourseSlug },
    select: { slug: true },
  });
  return foundation?.slug ?? null;
}
