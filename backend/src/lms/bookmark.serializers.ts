import type { MyBookmark } from './bookmark.types';

interface BookmarkRow {
  id: string;
  lessonId: string;
  courseId: string;
  type: string;
  videoTimestampSeconds: number | null;
  textSectionAnchor: string | null;
  activityId: string | null;
  note: string | null;
  folder: string | null;
  createdAt: Date;
  lesson?: { title: string; slug: string };
}

export function toMyBookmark(row: BookmarkRow): MyBookmark {
  return {
    id: row.id,
    lessonId: row.lessonId,
    lessonTitle: row.lesson?.title,
    lessonSlug: row.lesson?.slug,
    courseId: row.courseId,
    type: row.type,
    videoTimestampSeconds: row.videoTimestampSeconds,
    textSectionAnchor: row.textSectionAnchor,
    activityId: row.activityId,
    note: row.note,
    folder: row.folder,
    createdAt: row.createdAt,
  };
}
