import { recordAuditEvent } from '../database/audit-event.repository';
import {
  findLifecycleState,
  createLifecycleState,
  updateLifecycleState,
  hasAnyEnrollment,
  hasCompletedAnyLesson,
  hasAnyPaidEnrollment,
  hasAnyVerifiedMilestone,
  countRecentEvents,
} from './lifecycle.repository';

/**
 * 001 FR-039–FR-046: the 8-stage lifecycle. VISITOR and LEAD precede
 * User-row existence (anonymous page views / a pre-registration CRM Lead
 * record) — out of this module's scope per spec.md Assumptions, owned by
 * a future CRM/marketing feature. This tracker starts at REGISTERED_USER,
 * the first stage a `User` row exists to represent.
 */
const STAGE_ORDER = [
  'REGISTERED_USER',
  'ACTIVATED_MEMBER',
  'ENGAGED_MEMBER',
  'PAYING_MEMBER',
  'ACHIEVER',
  'ADVOCATE',
] as const;

type Stage = (typeof STAGE_ORDER)[number];

/** FR-042: 8 profile-completion fields tracked by this feature; ≥80% (7/8) counts as complete. */
function computeProfileCompletionPercent(state: {
  languageSelected: string | null;
  goalSelected: string | null;
  experienceLevel: string | null;
  skillSelected: string | null;
  businessStage: string | null;
  timeAvailability: string | null;
  interests: string[];
  nicheSelected: string | null;
}): number {
  const fields = [
    state.languageSelected,
    state.goalSelected,
    state.experienceLevel,
    state.skillSelected,
    state.businessStage,
    state.timeAvailability,
    state.interests.length > 0 ? 'x' : null,
    state.nicheSelected,
  ];
  const filled = fields.filter((f) => f !== null && f !== undefined).length;
  return Math.round((filled / fields.length) * 100);
}

/**
 * Each stage's criterion is evaluated independently (not nested/gated on
 * the previous stage also currently holding) — the result is the HIGHEST
 * stage whose own criterion is satisfied. FR-042 is the one stage the
 * spec explicitly describes as a hard JOINT gate (5 criteria together);
 * FR-043/FR-044/FR-045/FR-046 each describe their OWN independent
 * triggering event (a recurring-engagement signal; a purchase; a
 * VERIFIED milestone; an advocate action) rather than a chained
 * requirement on the stage before it — e.g. an already-experienced coach
 * who verifies a real "first client" milestone (FR-045, Constitution
 * Article VIII's authoritative verification step) should reach Achiever
 * on that verified signal alone, without first being required to
 * separately re-prove Engaged/Paying-Member activity in-platform.
 */
async function evaluateHighestSatisfiedStage(userId: string): Promise<Stage> {
  const state = await findLifecycleState(userId);
  if (!state) return 'REGISTERED_USER';

  // FR-042: Activated Member — ALL FIVE criteria must be jointly true,
  // never just profile% alone (spec.md edge case: 80%-complete profile
  // with no goal/path/lesson/community-action must NOT be marked).
  const profileComplete = computeProfileCompletionPercent(state) >= 80;
  const [learningPathStarted, lessonCompleted] = await Promise.all([
    hasAnyEnrollment(userId),
    hasCompletedAnyLesson(userId),
  ]);
  const activated =
    profileComplete && Boolean(state.goalSelected) && learningPathStarted && lessonCompleted && Boolean(state.firstCommunityActionAt);

  // FR-043: Engaged Member — at least one recurring-engagement signal
  // within the last 7 days.
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentEngagementCount = await countRecentEvents(
    userId,
    ['POST_INTERACTION', 'EVENT_ATTENDANCE', 'CHALLENGE_SUBMISSION'],
    since,
  );
  const engaged = recentEngagementCount > 0;

  // FR-044: Paying Member — subscription or product purchase.
  const paying = Boolean(state.firstPurchaseAt) || (await hasAnyPaidEnrollment(userId));

  // FR-045: Achiever — at least one VERIFIED (never self-reported) milestone.
  const achieved = await hasAnyVerifiedMilestone(userId);

  // FR-046: Advocate — referral/testimonial/case-study/mentor-application/community-leadership.
  const advocateCount = await countRecentEvents(
    userId,
    ['REFERRAL', 'TESTIMONIAL_SUBMISSION', 'CASE_STUDY_SUBMISSION', 'MENTOR_APPLICATION', 'COMMUNITY_LEADERSHIP'],
    new Date(0),
  );
  const advocate = advocateCount > 0;

  let highest: Stage = 'REGISTERED_USER';
  if (activated) highest = 'ACTIVATED_MEMBER';
  if (engaged) highest = 'ENGAGED_MEMBER';
  if (paying) highest = 'PAYING_MEMBER';
  if (achieved) highest = 'ACHIEVER';
  if (advocate) highest = 'ADVOCATE';
  return highest;
}

/**
 * Re-evaluates a user's lifecycle stage and advances it if a higher
 * stage's criteria are now satisfied. Monotonic — a stage is NEVER
 * downgraded once reached (spec.md doesn't describe a regression path,
 * and the acceptance scenarios only test forward transitions).
 */
export async function evaluateAndAdvanceStage(userId: string) {
  let state = await findLifecycleState(userId);
  if (!state) state = await createLifecycleState(userId);

  const satisfiedStage = await evaluateHighestSatisfiedStage(userId);
  const currentIndex = STAGE_ORDER.indexOf(state.stage as Stage);
  const satisfiedIndex = STAGE_ORDER.indexOf(satisfiedStage);

  if (satisfiedIndex <= currentIndex) return state;

  const updated = await updateLifecycleState(userId, { stage: satisfiedStage });

  await recordAuditEvent({
    actorType: 'SYSTEM',
    actorId: userId,
    action: 'lifecycle.stage_transitioned',
    resourceType: 'user_lifecycle_state',
    resourceId: userId,
    beforeState: { stage: state.stage },
    afterState: { stage: satisfiedStage },
  });

  return updated;
}

export { computeProfileCompletionPercent, STAGE_ORDER };
export type { Stage };
