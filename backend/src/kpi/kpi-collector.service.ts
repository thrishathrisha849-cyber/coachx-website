import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';

/**
 * 001 FR-064–FR-068: the 7-category Business KPI instrumentation
 * contract. Computes real metrics from data that actually exists today;
 * metrics whose owning feature isn't built yet (page-view analytics,
 * subscriptions/orders, community, certificates, events) are reported as
 * `null` with an explanatory note rather than a fabricated number —
 * matching this codebase's existing `[NEEDS CLARIFICATION]`/fail-closed
 * discipline instead of inventing data that would silently mislead an
 * admin dashboard.
 */
export interface KpiReport {
  acquisition: {
    totalRegisteredUsers: number;
    signupsLast30Days: number;
    monthlyUniqueVisitors: null;
    leadConversionRate: null;
    costPerLead: null;
    costPerAcquisition: null;
    note: string;
  };
  activationEngagement: {
    averageProfileCompletionPercent: number;
    activatedMemberOrAboveCount: number;
    sevenDayActivationRate: number;
    totalLessonsCompleted: number;
    dailyActiveUsers: null;
    monthlyActiveUsers: null;
    averageSessionDuration: null;
    communityInteractions: null;
    eventAttendance: null;
    note: string;
  };
  learning: {
    courseStartRate: number;
    courseCompletionRate: number;
    quizPassRate: null;
    assignmentSubmissionRate: null;
    certificateCompletionRate: null;
    note: string;
  };
  revenueRetention: {
    activeMembershipPlanCount: number;
    payingMemberOrAboveCount: number;
    monthlyRecurringRevenue: null;
    annualRecurringRevenue: null;
    refundRate: null;
    renewalRate: null;
    retention7_30_90Day: null;
    membershipChurn: null;
    note: string;
  };
  transformation: {
    usersWithNicheSelected: number;
    usersWithFirstOfferCreated: number;
    verifiedMilestonesByType: Record<string, number>;
    note: string;
  };
  generatedAt: string;
}

export async function collectKpiReport(): Promise<KpiReport> {
  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalRegisteredUsers,
    signupsLast30Days,
    lifecycleStates,
    totalLessonsCompleted,
    totalEnrollments,
    completedEnrollments,
    activeMembershipPlanCount,
    payingMemberOrAboveCount,
    usersWithNicheSelected,
    usersWithFirstOfferCreated,
    verifiedMilestones,
    recentRegistrations,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.userLifecycleState.findMany({
      select: {
        languageSelected: true,
        goalSelected: true,
        experienceLevel: true,
        skillSelected: true,
        businessStage: true,
        timeAvailability: true,
        interests: true,
        nicheSelected: true,
        stage: true,
      },
    }),
    prisma.lessonProgress.count({ where: { status: 'COMPLETED' } }),
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { completedAt: { not: null } } }),
    prisma.membershipPlan.count({ where: { status: 'ACTIVE' } }),
    prisma.userLifecycleState.count({
      where: { stage: { in: ['PAYING_MEMBER', 'ACHIEVER', 'ADVOCATE'] } },
    }),
    prisma.userLifecycleState.count({ where: { nicheSelected: { not: null } } }),
    prisma.userLifecycleState.count({ where: { firstOfferCreatedAt: { not: null } } }),
    prisma.businessMilestone.groupBy({ by: ['type'], where: { status: 'VERIFIED' }, _count: true }),
    prisma.user.findMany({ where: { createdAt: { lte: sevenDaysAgo } }, select: { id: true } }),
  ]);

  const profileFieldCounts = lifecycleStates.map((s) => {
    const fields = [
      s.languageSelected,
      s.goalSelected,
      s.experienceLevel,
      s.skillSelected,
      s.businessStage,
      s.timeAvailability,
      s.interests.length > 0 ? 'x' : null,
      s.nicheSelected,
    ];
    return fields.filter((f) => f !== null && f !== undefined).length / fields.length;
  });
  const averageProfileCompletionPercent =
    profileFieldCounts.length > 0
      ? Math.round((profileFieldCounts.reduce((a, b) => a + b, 0) / profileFieldCounts.length) * 100)
      : 0;

  const activatedMemberOrAboveCount = lifecycleStates.filter((s) => s.stage !== 'REGISTERED_USER').length;

  const activatedAmongOldEnough = recentRegistrations.length > 0
    ? await prisma.userLifecycleState.count({
        where: {
          userId: { in: recentRegistrations.map((u) => u.id) },
          stage: { not: 'REGISTERED_USER' },
        },
      })
    : 0;
  const sevenDayActivationRate =
    recentRegistrations.length > 0 ? Math.round((activatedAmongOldEnough / recentRegistrations.length) * 100) : 0;

  const verifiedMilestonesByType: Record<string, number> = {};
  for (const row of verifiedMilestones) {
    verifiedMilestonesByType[row.type] = row._count;
  }

  return {
    acquisition: {
      totalRegisteredUsers,
      signupsLast30Days,
      monthlyUniqueVisitors: null,
      leadConversionRate: null,
      costPerLead: null,
      costPerAcquisition: null,
      note: 'Visitor/lead-funnel metrics require the page-view/CRM-lead tracking owned by a future marketing/CRM feature (013/024) — not yet instrumented.',
    },
    activationEngagement: {
      averageProfileCompletionPercent,
      activatedMemberOrAboveCount,
      sevenDayActivationRate,
      totalLessonsCompleted,
      dailyActiveUsers: null,
      monthlyActiveUsers: null,
      averageSessionDuration: null,
      communityInteractions: null,
      eventAttendance: null,
      note: 'DAU/MAU/session-duration require session-analytics instrumentation; community/event metrics require features 005/010 (not yet built).',
    },
    learning: {
      courseStartRate: totalRegisteredUsers > 0 ? Math.round((totalEnrollments / totalRegisteredUsers) * 100) : 0,
      courseCompletionRate: totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0,
      quizPassRate: null,
      assignmentSubmissionRate: null,
      certificateCompletionRate: null,
      note: 'Quiz/assignment/certificate metrics require LMS assessment/certificate models not yet built (004 scope).',
    },
    revenueRetention: {
      activeMembershipPlanCount,
      payingMemberOrAboveCount,
      monthlyRecurringRevenue: null,
      annualRecurringRevenue: null,
      refundRate: null,
      renewalRate: null,
      retention7_30_90Day: null,
      membershipChurn: null,
      note: 'MRR/ARR/refund/renewal/retention/churn require the Subscription/Order data owned by 009 Part 2+ (catalog-only today, no live billing yet).',
    },
    transformation: {
      usersWithNicheSelected,
      usersWithFirstOfferCreated,
      verifiedMilestonesByType,
      note: 'Content/lead/client-acquisition transformation metrics beyond niche/offer/milestones require features 004/008/013 write-through — verified milestones are the real, server-verified signal (Constitution Article VIII).',
    },
    generatedAt: new Date().toISOString(),
  };
}
