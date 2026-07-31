import type { LmsSettings } from '@prisma/client';
import type { AdminLmsSettings } from './lms-settings.types';

export function toAdminLmsSettings(row: LmsSettings): AdminLmsSettings {
  return {
    defaultVideoWatchThresholdPercent: row.defaultVideoWatchThresholdPercent,
    defaultQuizPassingScorePercent: row.defaultQuizPassingScorePercent,
    defaultQuizMaxAttempts: row.defaultQuizMaxAttempts,
    defaultAssignmentMaxAttempts: row.defaultAssignmentMaxAttempts,
    defaultResourceDownloadPermission: row.defaultResourceDownloadPermission,
    defaultLessonCompletionRuleType: row.defaultLessonCompletionRuleType,
    courseReviewMinProgressPercent: row.courseReviewMinProgressPercent,
    streakQualifyLessonComplete: row.streakQualifyLessonComplete,
    streakQualifyQuizComplete: row.streakQualifyQuizComplete,
    streakQualifyAssignmentActivity: row.streakQualifyAssignmentActivity,
    streakQualifyMinLearningTime: row.streakQualifyMinLearningTime,
    streakMinLearningTimeMinutes: row.streakMinLearningTimeMinutes,
    streakTimezone: row.streakTimezone,
    streakGraceDays: row.streakGraceDays,
    updatedBy: row.updatedBy,
    updatedAt: row.updatedAt,
  };
}
