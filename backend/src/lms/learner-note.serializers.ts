import type { MyLearnerNote } from './learner-note.types';

interface NoteRow {
  id: string;
  lessonId: string;
  courseId: string;
  content: string;
  videoTimestampSeconds: number | null;
  createdAt: Date;
  updatedAt: Date;
  lesson?: { title: string; slug: string };
}

export function toMyLearnerNote(row: NoteRow): MyLearnerNote {
  return {
    id: row.id,
    lessonId: row.lessonId,
    lessonTitle: row.lesson?.title,
    lessonSlug: row.lesson?.slug,
    courseId: row.courseId,
    content: row.content,
    videoTimestampSeconds: row.videoTimestampSeconds,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
