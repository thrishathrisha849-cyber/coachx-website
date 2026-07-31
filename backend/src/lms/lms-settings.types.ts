export interface AdminLmsSettings {
  defaultVideoWatchThresholdPercent: number;
  defaultQuizPassingScorePercent: number;
  defaultQuizMaxAttempts: number | null;
  defaultAssignmentMaxAttempts: number | null;
  defaultResourceDownloadPermission: 'VIEW_ONLY' | 'DOWNLOADABLE';
  defaultLessonCompletionRuleType: string;
  courseReviewMinProgressPercent: number;
  streakQualifyLessonComplete: boolean;
  streakQualifyQuizComplete: boolean;
  streakQualifyAssignmentActivity: boolean;
  streakQualifyMinLearningTime: boolean;
  streakMinLearningTimeMinutes: number;
  streakTimezone: string;
  streakGraceDays: number;
  updatedBy: string | null;
  updatedAt: Date;
}
