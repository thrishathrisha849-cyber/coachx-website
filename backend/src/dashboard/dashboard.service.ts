import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';
import { findLifecycleState, listMilestonesForUser } from '../lifecycle/lifecycle.repository';
import { computeProfileCompletionPercent } from '../lifecycle/stage-transition.service';
import { resolveNextBestAction, type NextBestAction } from '../lifecycle/next-best-action.service';
import { getContinueLearning } from '../lms/continue-learning.service';
import { getPublishedModulesInOrder } from '../lms/access-evaluator.service';
import { findPublishedLessonsByModule } from '../lms/lesson.repository';
import { findLessonProgressForEnrollment } from '../lms/progress.repository';
import { getOnboardingProgress } from '../onboarding/onboarding.service';
import { getRecommendationsForLearner, type RecommendationItem } from '../lms/recommendation.service';
import type {
  DashboardWidget,
  CriticalAlert,
  ContinueLearningItem,
  ProgressAndMilestones,
} from './dashboard.types';

/** Wraps a widget builder so one widget's failure never fails the rest of the dashboard response (FR-120). */
async function safeWidget<T>(label: string, build: () => Promise<DashboardWidget<T>>): Promise<DashboardWidget<T>> {
  try {
    return await build();
  } catch (err) {
    logger.warn(`Dashboard widget failed: ${label}`, { error: err instanceof Error ? err.message : err });
    return { status: 'error', data: null, reason: 'This section could not be loaded right now.' };
  }
}

function emptyWidget<T>(reason: string): DashboardWidget<T> {
  return { status: 'empty', data: null, reason };
}

/** FR-101: derived only from real, already-existing account-state fields — no fabricated alert categories. */
async function buildCriticalAlertsWidget(userId: string): Promise<DashboardWidget<CriticalAlert[]>> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true, status: true } });
  if (!user) throw AppError.notFound('User not found');

  const alerts: CriticalAlert[] = [];
  if (!user.emailVerifiedAt) {
    alerts.push({
      code: 'EMAIL_NOT_VERIFIED',
      severity: 'critical',
      title: 'Verify your email address',
      description: 'Confirm your email to secure your account and unlock all features.',
      dismissible: false,
    });
  }

  // `authenticate` only verifies the JWT, not current DB status (see
  // authenticate.middleware.ts) — so an already-issued access token can
  // still reach this endpoint after an admin locks/suspends the account
  // mid-session. These alerts are therefore reachable in practice, not
  // dead branches, and must never be dismissible (FR-101).
  if (user.status === 'LOCKED') {
    alerts.push({
      code: 'ACCOUNT_LOCKED',
      severity: 'critical',
      title: 'Your account is temporarily locked',
      description: 'Reset your password or try again later to regain access.',
      dismissible: false,
    });
  }
  if (user.status === 'SUSPENDED') {
    alerts.push({
      code: 'ACCOUNT_SUSPENDED',
      severity: 'critical',
      title: 'Your account is suspended',
      description: 'Contact support for assistance restoring your account.',
      dismissible: false,
    });
  }

  return alerts.length > 0 ? { status: 'ok', data: alerts } : emptyWidget('No active alerts.');
}

async function buildNextBestActionWidget(userId: string): Promise<DashboardWidget<NextBestAction>> {
  const action = await resolveNextBestAction(userId);
  return { status: 'ok', data: action };
}

async function computeCourseProgressPercent(courseId: string, enrollmentId: string): Promise<number> {
  const modules = await getPublishedModulesInOrder(courseId);
  let totalLessons = 0;
  for (const module_ of modules) {
    totalLessons += (await findPublishedLessonsByModule(module_.id)).length;
  }
  if (totalLessons === 0) return 0;

  const progressRows = await findLessonProgressForEnrollment(enrollmentId);
  const completed = progressRows.filter((p) => p.status === 'COMPLETED').length;
  return Math.round((completed / totalLessons) * 100);
}

/** FR-103: up to 3 courses, most-recently-active first; reuses `continue-learning.service.ts`'s server-derived next-lesson logic (no separate "current lesson" pointer). */
async function buildContinueLearningWidget(userId: string): Promise<DashboardWidget<ContinueLearningItem[]>> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: 'ACTIVE', completedAt: null },
    orderBy: [{ lastAccessedAt: 'desc' }, { enrolledAt: 'desc' }],
    take: 3,
    include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } } },
  });

  if (enrollments.length === 0) {
    return emptyWidget('No course in progress yet.');
  }

  const items: ContinueLearningItem[] = [];
  for (const enrollment of enrollments) {
    const [continueLearning, progressPercent] = await Promise.all([
      getContinueLearning(userId, enrollment.courseId),
      computeCourseProgressPercent(enrollment.courseId, enrollment.id),
    ]);

    items.push({
      courseId: enrollment.course.id,
      courseTitle: enrollment.course.title,
      courseSlug: enrollment.course.slug,
      thumbnailUrl: enrollment.course.thumbnailUrl,
      progressPercent,
      nextLessonTitle: continueLearning.nextLesson?.title ?? null,
      nextModuleTitle: continueLearning.nextLesson?.moduleTitle ?? null,
      lastAccessedAt: enrollment.lastAccessedAt?.toISOString() ?? null,
    });
  }

  return { status: 'ok', data: items };
}

/** FR-107/FR-108: real profile-completion % (001) and the member's own milestones (any status, so self-declared/pending ones are visible too, each carrying its own verification state). */
async function buildProgressAndMilestonesWidget(userId: string): Promise<DashboardWidget<ProgressAndMilestones>> {
  const state = await findLifecycleState(userId);
  const profileCompletionPercent = state ? computeProfileCompletionPercent(state) : 0;
  const milestoneRows = await listMilestonesForUser(userId);

  return {
    status: 'ok',
    data: {
      profileCompletionPercent,
      milestones: milestoneRows.map((m) => ({
        type: m.type,
        status: m.status,
        claimedAt: m.claimedAt.toISOString(),
        verifiedAt: m.verifiedAt?.toISOString() ?? null,
      })),
    },
  };
}

/** 004 Discovery & Recommendations batch (FR-088) — real, deterministic recommendations now populate this widget; see `recommendation.service.ts`'s file header for why there is no AI-driven layer yet. */
async function buildRecommendationsWidget(userId: string): Promise<DashboardWidget<RecommendationItem[]>> {
  const result = await getRecommendationsForLearner(userId);
  return result.items.length > 0 ? { status: 'ok', data: result.items } : emptyWidget('No recommendations yet — keep learning to unlock personalized suggestions.');
}

export interface DashboardResponse {
  isNewUser: boolean;
  widgets: {
    criticalAlerts: DashboardWidget<CriticalAlert[]>;
    nextBestAction: DashboardWidget<NextBestAction>;
    continueLearning: DashboardWidget<ContinueLearningItem[]>;
    upcomingLiveSession: DashboardWidget<null>;
    currentChallenge: DashboardWidget<null>;
    progressAndMilestones: DashboardWidget<ProgressAndMilestones>;
    recommendations: DashboardWidget<RecommendationItem[]>;
    communityHighlights: DashboardWidget<null>;
    savedItems: DashboardWidget<null>;
    membership: DashboardWidget<null>;
  };
}

/**
 * FR-099: renders widgets in the mandated top-to-bottom priority order.
 * FR-118: a member who hasn't finished onboarding (US2) gets a guided
 * empty-state instead of the full widget set — `isNewUser` tells the
 * frontend to render that state; the widgets are still computed (so
 * switching to the full view later needs no second request) but most will
 * legitimately be empty for a brand-new account anyway.
 *
 * Widgets 4/5/7/8/9/10 (live sessions, challenges, recommendations,
 * community, saved items, membership/subscription) have no owning feature
 * built yet in this codebase (Events/Gamification/Community/Recommendation-
 * engine/Subscription-billing are all later, not-yet-reached specs) — they
 * are honestly reported as 'empty' with a reason, never fabricated data.
 */
export async function getDashboard(userId: string): Promise<DashboardResponse> {
  const onboardingProgress = await getOnboardingProgress(userId);

  const [criticalAlerts, nextBestAction, continueLearning, progressAndMilestones, recommendations] = await Promise.all([
    safeWidget('criticalAlerts', () => buildCriticalAlertsWidget(userId)),
    safeWidget('nextBestAction', () => buildNextBestActionWidget(userId)),
    safeWidget('continueLearning', () => buildContinueLearningWidget(userId)),
    safeWidget('progressAndMilestones', () => buildProgressAndMilestonesWidget(userId)),
    safeWidget('recommendations', () => buildRecommendationsWidget(userId)),
  ]);

  return {
    isNewUser: !onboardingProgress.isComplete,
    widgets: {
      criticalAlerts,
      nextBestAction,
      continueLearning,
      upcomingLiveSession: emptyWidget('Events are not available yet.'),
      currentChallenge: emptyWidget('Challenges are not available yet.'),
      progressAndMilestones,
      recommendations,
      communityHighlights: emptyWidget('Community is not available yet.'),
      savedItems: emptyWidget('Saved items are not available yet.'),
      membership: emptyWidget('Membership/subscription tracking is not available yet.'),
    },
  };
}
