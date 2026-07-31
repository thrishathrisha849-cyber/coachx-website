/** 004 Learner Notes & Bookmarks batch (FR-059) — DTO shapes. */

export interface MyBookmark {
  id: string;
  lessonId: string;
  lessonTitle?: string;
  lessonSlug?: string;
  courseId: string;
  type: string;
  videoTimestampSeconds: number | null;
  textSectionAnchor: string | null;
  activityId: string | null;
  note: string | null;
  folder: string | null;
  createdAt: Date;
}
