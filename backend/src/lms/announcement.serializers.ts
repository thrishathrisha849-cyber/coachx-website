import type { AdminAnnouncement, LearnerAnnouncement } from './announcement.types';

interface AnnouncementRow {
  id: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  message: string;
  priority: string;
  channels: string[];
  attachmentUrl: string | null;
  status: string;
  publishAt: Date | null;
  expireAt: Date | null;
  emailSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toAdminAnnouncement(row: AnnouncementRow): AdminAnnouncement {
  return {
    id: row.id,
    courseId: row.courseId,
    moduleId: row.moduleId,
    title: row.title,
    message: row.message,
    priority: row.priority,
    channels: row.channels,
    attachmentUrl: row.attachmentUrl,
    status: row.status,
    publishAt: row.publishAt,
    expireAt: row.expireAt,
    emailSentAt: row.emailSentAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toLearnerAnnouncement(row: AnnouncementRow): LearnerAnnouncement {
  return {
    id: row.id,
    courseId: row.courseId,
    moduleId: row.moduleId,
    title: row.title,
    message: row.message,
    priority: row.priority,
    attachmentUrl: row.attachmentUrl,
    publishAt: row.publishAt,
    createdAt: row.createdAt,
  };
}
