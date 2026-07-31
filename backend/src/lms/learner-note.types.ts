/** 004 Learner Notes & Bookmarks batch (FR-058) — DTO shapes. */

export interface MyLearnerNote {
  id: string;
  lessonId: string;
  lessonTitle?: string;
  lessonSlug?: string;
  courseId: string;
  content: string;
  videoTimestampSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
}
