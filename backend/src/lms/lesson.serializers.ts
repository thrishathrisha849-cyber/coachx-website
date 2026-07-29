import type {
  AdminLearningActivity,
  AdminLesson,
  AdminLessonWithActivities,
  PublicLearningActivity,
  PublicLessonDetail,
  PublicLessonSummary,
} from './lesson.types';

/**
 * Explicit serializers (same discipline as `lms.serializers.ts`). Lessons
 * have a THREE-TIER exposure model the serializer split reflects directly:
 *
 *  1. `toPublicLessonSummary` — safe for a LOCKED lesson (FR-035: locked
 *     content still shows title/duration/unlock condition). Never includes
 *     `description` or `activities`.
 *  2. `toPublicLessonDetail` — only called by the service layer AFTER the
 *     access evaluator confirms the caller may see full content (enrolled +
 *     unlocked, or `isPreview`). Includes `activities`.
 *  3. `toAdminLesson(WithActivities)` — full editable record, admin/
 *     instructor-only.
 *
 * This mirrors the "never serialize Prisma directly" and "never expose
 * draft lessons/internal notes/audit data/instructor-only metadata to a
 * public/learner caller" requirements verbatim.
 */

type ActivityRow = {
  id: string;
  lessonId: string;
  type: string;
  title: string | null;
  position: number;
  mediaUrl: string | null;
  externalUrl: string | null;
  bodyText: string | null;
  durationSeconds: number | null;
  fileSizeBytes: number | null;
  embedProvider: string | null;
  embedResourceId: string | null;
  status: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function toPublicActivity(row: ActivityRow): PublicLearningActivity {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    position: row.position,
    mediaUrl: row.mediaUrl,
    externalUrl: row.externalUrl,
    bodyText: row.bodyText,
    durationSeconds: row.durationSeconds,
    fileSizeBytes: row.fileSizeBytes,
    embedProvider: row.embedProvider,
    embedResourceId: row.embedResourceId,
  };
}

export function toAdminActivity(row: ActivityRow): AdminLearningActivity {
  return {
    ...toPublicActivity(row),
    lessonId: row.lessonId,
    status: row.status,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type LessonRow = {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  position: number;
  durationMinutes: number | null;
  isPreview: boolean;
  isMandatory: boolean;
  completionRuleType: string;
  completionRuleTypes: string[];
  completionRuleValue: unknown;
  status: string;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  deletedAt: Date | null;
};

export function toPublicLessonSummary(row: LessonRow): PublicLessonSummary {
  return {
    id: row.id,
    moduleId: row.moduleId,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    position: row.position,
    durationMinutes: row.durationMinutes,
    isPreview: row.isPreview,
    isMandatory: row.isMandatory,
  };
}

type QuizSummaryRow = {
  id: string;
  title: string;
  quizType: string;
  passingScorePercent: number;
  maxAttempts: number | null;
  timeLimitMinutes: number | null;
} | null;

type AssignmentSummaryRow = {
  id: string;
  title: string;
  instructions: string | null;
  submissionFormat: string;
  dueAt: Date | null;
  maxScore: number;
  passingScore: number;
  maxAttempts: number | null;
} | null;

export function toPublicLessonDetail(
  row: LessonRow,
  activities: ActivityRow[],
  quiz: QuizSummaryRow = null,
  assignment: AssignmentSummaryRow = null,
): PublicLessonDetail {
  return {
    ...toPublicLessonSummary(row),
    description: row.description,
    completionRuleType: row.completionRuleType,
    completionRuleTypes: row.completionRuleTypes,
    activities: activities
      .filter((a) => a.status === 'PUBLISHED')
      .sort((a, b) => a.position - b.position)
      .map(toPublicActivity),
    quiz: quiz
      ? {
          id: quiz.id,
          title: quiz.title,
          quizType: quiz.quizType,
          passingScorePercent: quiz.passingScorePercent,
          maxAttempts: quiz.maxAttempts,
          timeLimitMinutes: quiz.timeLimitMinutes,
        }
      : null,
    assignment: assignment
      ? {
          id: assignment.id,
          title: assignment.title,
          instructions: assignment.instructions,
          submissionFormat: assignment.submissionFormat,
          dueAt: assignment.dueAt,
          maxScore: assignment.maxScore,
          passingScore: assignment.passingScore,
          maxAttempts: assignment.maxAttempts,
        }
      : null,
  };
}

export function toAdminLesson(row: LessonRow): AdminLesson {
  return {
    ...toPublicLessonSummary(row),
    description: row.description,
    status: row.status,
    completionRuleType: row.completionRuleType,
    completionRuleTypes: row.completionRuleTypes,
    completionRuleValue: row.completionRuleValue,
    version: row.version,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    deletedAt: row.deletedAt,
  };
}

export function toAdminLessonWithActivities(row: LessonRow, activities: ActivityRow[]): AdminLessonWithActivities {
  return {
    ...toAdminLesson(row),
    activities: activities.sort((a, b) => a.position - b.position).map(toAdminActivity),
  };
}
