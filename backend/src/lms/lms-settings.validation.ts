import { z } from 'zod';
import { LESSON_COMPLETION_RULE_TYPES } from './lesson.validation';
import { RESOURCE_DOWNLOAD_PERMISSIONS } from './lesson-resource.validation';

/**
 * Every field optional (partial update) — a PATCH-style admin settings
 * screen edits one or two values at a time, never a full replace. All
 * bounds mirror the field's PRE-EXISTING hardcoded-constant bounds this
 * batch centralizes (e.g. `passingScorePercent`'s own 0-100 range in
 * `quiz.validation.ts`, `maxAttempts`'s own 1-100 range) so a settings-
 * sourced default can never produce a value the per-entity schema would
 * itself have rejected.
 */
export const updateLmsSettingsSchema = z.object({
  body: z
    .object({
      defaultVideoWatchThresholdPercent: z.number().int().min(1).max(100).optional(),
      defaultQuizPassingScorePercent: z.number().int().min(0).max(100).optional(),
      defaultQuizMaxAttempts: z.number().int().min(1).max(100).nullable().optional(),
      defaultAssignmentMaxAttempts: z.number().int().min(1).max(100).nullable().optional(),
      defaultResourceDownloadPermission: z.enum(RESOURCE_DOWNLOAD_PERMISSIONS).optional(),
      defaultLessonCompletionRuleType: z.enum(LESSON_COMPLETION_RULE_TYPES).optional(),
      courseReviewMinProgressPercent: z.number().int().min(0).max(100).optional(),
      streakQualifyLessonComplete: z.boolean().optional(),
      streakQualifyQuizComplete: z.boolean().optional(),
      streakQualifyAssignmentActivity: z.boolean().optional(),
      streakQualifyMinLearningTime: z.boolean().optional(),
      streakMinLearningTimeMinutes: z.number().int().min(1).max(1440).optional(),
      streakTimezone: z.string().trim().min(1).max(64).optional(),
      streakGraceDays: z.number().int().min(0).max(30).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, { message: 'At least one setting must be provided' }),
});
