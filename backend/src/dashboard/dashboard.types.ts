/** FR-120: every widget reports its own status so one failure never fails the whole dashboard response. */
export type DashboardWidgetStatus = 'ok' | 'empty' | 'error';

export interface DashboardWidget<T> {
  status: DashboardWidgetStatus;
  data: T | null;
  /** Present when status is 'empty' (no data yet) or 'error' (widget-local failure) — never shown as a raw stack trace to the member. */
  reason?: string;
}

export interface CriticalAlert {
  code: 'EMAIL_NOT_VERIFIED' | 'ACCOUNT_LOCKED' | 'ACCOUNT_SUSPENDED';
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  dismissible: boolean;
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
