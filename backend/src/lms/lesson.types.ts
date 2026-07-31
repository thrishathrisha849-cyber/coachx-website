/**
 * Phase 6 Part 2A — Lesson + LearningActivity DTOs. Same split as
 * `lms.types.ts`: DTO/serializer-output shapes here, request-body shapes
 * inferred from `lesson.validation.ts`'s Zod schemas.
 */

/** 004 Captions + Transcript Support batch (FR-044/FR-046) — one ordered segment of a VIDEO/AUDIO activity's transcript. */
export interface TranscriptSegment {
  startSeconds: number;
  text: string;
}

/** Public/learner-safe learning-activity shape — no internal audit fields. */
export interface PublicLearningActivity {
  id: string;
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
  captionsUrlEn: string | null;
  captionsUrlTa: string | null;
  transcriptSegments: TranscriptSegment[] | null;
}

/** Admin/instructor-facing activity shape — includes lifecycle/audit fields. */
export interface AdminLearningActivity extends PublicLearningActivity {
  lessonId: string;
  status: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Public/discovery-safe lesson shape — the "syllabus" view used for a
 * course's non-enrolled visitors and locked-lesson listings (FR-035: title/
 * summary/duration are shown even for locked content, but never the
 * description/activities of an inaccessible lesson). Deliberately excludes:
 * `description`, `activities`, `completionRuleValue`, and every
 * lifecycle/audit field — see `lesson.serializers.ts` for the three-tier
 * (locked / preview / full) serialization this type backs.
 */
export interface PublicLessonSummary {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  summary: string | null;
  position: number;
  durationMinutes: number | null;
  isPreview: boolean;
  isMandatory: boolean;
}

/**
 * Full lesson content — only ever returned once the access evaluator has
 * confirmed the caller may see it (enrolled + unlocked, or `isPreview`).
 * Never includes `completionRuleValue`'s admin-authoring detail beyond what
 * a learner needs, and never includes audit/lifecycle fields.
 */
export interface PublicLessonDetail extends PublicLessonSummary {
  description: string | null;
  completionRuleType: string;
  /** Non-empty only when this lesson combines multiple conditions (FR-052) — empty means `completionRuleType` alone applies. */
  completionRuleTypes: string[];
  activities: PublicLearningActivity[];
  /** 004 US3 (Quiz System batch) — present only when this lesson has an attached, PUBLISHED Quiz. Metadata only (id/title/attempt limits) — never questions/answers here; those are only ever served via the dedicated `/me/quizzes/:quizId`+attempt endpoints, gated by their own access check. */
  quiz: { id: string; title: string; quizType: string; passingScorePercent: number; maxAttempts: number | null; timeLimitMinutes: number | null } | null;
  /** 004 US4 (Assignment System batch) — present only when this lesson has an attached, PUBLISHED Assignment. Metadata only — never another learner's submissions/reviewer-only fields here. */
  assignment: {
    id: string;
    title: string;
    instructions: string | null;
    submissionFormat: string;
    dueAt: Date | null;
    maxScore: number;
    passingScore: number;
    maxAttempts: number | null;
  } | null;
}

/** Admin/instructor-facing lesson shape — the full editable record. */
export interface AdminLesson extends PublicLessonSummary {
  description: string | null;
  status: string;
  completionRuleType: string;
  completionRuleTypes: string[];
  completionRuleValue: unknown;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  deletedAt: Date | null;
}

export interface AdminLessonWithActivities extends AdminLesson {
  activities: AdminLearningActivity[];
}
