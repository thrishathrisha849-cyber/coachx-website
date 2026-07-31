import { withTransaction } from '../database/transaction';
import { recordAuditEvent } from '../database/audit-event.repository';
import { findOrCreateLmsSettings, updateLmsSettingsRow } from './lms-settings.repository';
import { toAdminLmsSettings } from './lms-settings.serializers';
import type { AdminLmsSettings } from './lms-settings.types';

export interface LmsSettingsUpdateInput {
  defaultVideoWatchThresholdPercent?: number;
  defaultQuizPassingScorePercent?: number;
  defaultQuizMaxAttempts?: number | null;
  defaultAssignmentMaxAttempts?: number | null;
  defaultResourceDownloadPermission?: 'VIEW_ONLY' | 'DOWNLOADABLE';
  defaultLessonCompletionRuleType?: string;
  courseReviewMinProgressPercent?: number;
  streakQualifyLessonComplete?: boolean;
  streakQualifyQuizComplete?: boolean;
  streakQualifyAssignmentActivity?: boolean;
  streakQualifyMinLearningTime?: boolean;
  streakMinLearningTimeMinutes?: number;
  streakTimezone?: string;
  streakGraceDays?: number;
}

export async function getLmsSettingsAdmin(): Promise<AdminLmsSettings> {
  const row = await findOrCreateLmsSettings();
  return toAdminLmsSettings(row);
}

export async function updateLmsSettingsAdmin(input: LmsSettingsUpdateInput, actorId: string): Promise<AdminLmsSettings> {
  return withTransaction(async (tx) => {
    const existing = await findOrCreateLmsSettings(tx);

    const updated = await updateLmsSettingsRow(
      {
        ...(input.defaultVideoWatchThresholdPercent !== undefined ? { defaultVideoWatchThresholdPercent: input.defaultVideoWatchThresholdPercent } : {}),
        ...(input.defaultQuizPassingScorePercent !== undefined ? { defaultQuizPassingScorePercent: input.defaultQuizPassingScorePercent } : {}),
        ...(input.defaultQuizMaxAttempts !== undefined ? { defaultQuizMaxAttempts: input.defaultQuizMaxAttempts } : {}),
        ...(input.defaultAssignmentMaxAttempts !== undefined ? { defaultAssignmentMaxAttempts: input.defaultAssignmentMaxAttempts } : {}),
        ...(input.defaultResourceDownloadPermission !== undefined ? { defaultResourceDownloadPermission: input.defaultResourceDownloadPermission as never } : {}),
        ...(input.defaultLessonCompletionRuleType !== undefined ? { defaultLessonCompletionRuleType: input.defaultLessonCompletionRuleType as never } : {}),
        ...(input.courseReviewMinProgressPercent !== undefined ? { courseReviewMinProgressPercent: input.courseReviewMinProgressPercent } : {}),
        ...(input.streakQualifyLessonComplete !== undefined ? { streakQualifyLessonComplete: input.streakQualifyLessonComplete } : {}),
        ...(input.streakQualifyQuizComplete !== undefined ? { streakQualifyQuizComplete: input.streakQualifyQuizComplete } : {}),
        ...(input.streakQualifyAssignmentActivity !== undefined ? { streakQualifyAssignmentActivity: input.streakQualifyAssignmentActivity } : {}),
        ...(input.streakQualifyMinLearningTime !== undefined ? { streakQualifyMinLearningTime: input.streakQualifyMinLearningTime } : {}),
        ...(input.streakMinLearningTimeMinutes !== undefined ? { streakMinLearningTimeMinutes: input.streakMinLearningTimeMinutes } : {}),
        ...(input.streakTimezone !== undefined ? { streakTimezone: input.streakTimezone } : {}),
        ...(input.streakGraceDays !== undefined ? { streakGraceDays: input.streakGraceDays } : {}),
        updatedBy: actorId,
      },
      tx,
    );

    await recordAuditEvent(
      {
        actorType: 'USER',
        actorId,
        action: 'lms.settings.updated',
        resourceType: 'lms_settings',
        resourceId: 'global',
        beforeState: toAdminLmsSettings(existing),
        afterState: toAdminLmsSettings(updated),
      },
      tx,
    );

    return toAdminLmsSettings(updated);
  });
}
