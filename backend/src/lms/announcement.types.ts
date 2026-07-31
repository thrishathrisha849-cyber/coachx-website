/** 004 Course Announcements batch (FR-102) — DTO shapes. */

export interface AdminAnnouncement {
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

export interface LearnerAnnouncement {
  id: string;
  courseId: string;
  moduleId: string | null;
  title: string;
  message: string;
  priority: string;
  attachmentUrl: string | null;
  publishAt: Date | null;
  createdAt: Date;
}
