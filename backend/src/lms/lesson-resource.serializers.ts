import type { AdminLessonResource, PublicLessonResource } from './lesson-resource.types';

interface ResourceRow {
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
  status: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toPublicLessonResource(row: ResourceRow): PublicLessonResource {
  return {
    id: row.id,
    lessonId: row.lessonId,
    title: row.title,
    type: row.type,
    description: row.description,
    language: row.language,
    fileUrl: row.fileUrl,
    fileSizeBytes: row.fileSizeBytes,
    version: row.version,
    downloadPermission: row.downloadPermission,
    accessRule: row.accessRule,
    position: row.position,
  };
}

export function toAdminLessonResource(row: ResourceRow): AdminLessonResource {
  return {
    ...toPublicLessonResource(row),
    status: row.status,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
