import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export type DashboardWidgetStatus = 'ok' | 'empty' | 'error';

export interface DashboardWidget<T> {
  status: DashboardWidgetStatus;
  data: T | null;
  reason?: string;
}

export interface CriticalAlert {
  code: string;
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  dismissible: boolean;
}

export interface NextBestAction {
  code: string;
  label: string;
}

export interface ContinueLearningItem {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  thumbnailUrl: string | null;
  progressPercent: number;
  nextLessonTitle: string | null;
  nextModuleTitle: string | null;
  lastAccessedAt: string | null;
}

export interface MilestoneSummary {
  type: string;
  status: string;
  claimedAt: string;
  verifiedAt: string | null;
}

export interface ProgressAndMilestones {
  profileCompletionPercent: number;
  milestones: MilestoneSummary[];
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
    recommendations: DashboardWidget<null>;
    communityHighlights: DashboardWidget<null>;
    savedItems: DashboardWidget<null>;
    membership: DashboardWidget<null>;
  };
}

export async function getMyDashboard(): Promise<DashboardResponse> {
  const { data } = await apiClient.get<ApiSuccessResponse<DashboardResponse>>('/dashboard');
  return data.data;
}
