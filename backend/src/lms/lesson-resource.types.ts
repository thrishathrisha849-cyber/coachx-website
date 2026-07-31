/** 004 Downloadable Resource Catalog batch (FR-049) — DTO shapes. */

export interface PublicLessonResource {
  id: string;
  lessonId: string;
  title: string;
  type: string;
  description: string | null;
  language: string;
  fileUrl: string;
  fileSizeBytes: number | null;
  version: number;
  downloadPermission: string;
  accessRule: string;
  position: number;
}

/** Admin/instructor-facing shape — includes lifecycle/audit fields. */
export interface AdminLessonResource extends PublicLessonResource {
  status: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
