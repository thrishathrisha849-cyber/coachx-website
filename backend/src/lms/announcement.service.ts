import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { getEmailAdapter } from '../auth/email.port';
import { logger } from '../utils/logger';
import { findCourseById } from './course.repository';
import { findModuleById } from './module.repository';
import { findEnrollmentForUserAndCourse, findSeatOccupyingEnrollmentEmails } from './enrollment.repository';
import {
  findAnnouncementById,
  createAnnouncement as createAnnouncementRow,
  updateAnnouncement as updateAnnouncementRow,
  findAnnouncementsForCourseAdmin,
  findVisibleAnnouncementsForCourse,
} from './announcement.repository';
import { toAdminAnnouncement, toLearnerAnnouncement } from './announcement.serializers';
import type { AdminAnnouncement, LearnerAnnouncement } from './announcement.types';

/**
 * 004 Course Announcements batch (FR-102). Of the three named channels,
 * IN_APP (this batch's `getVisibleAnnouncementsForLearner`) and EMAIL
 * (below, via the existing `EmailPort` — the same infra verification/
 * reset emails already use) are real. PUSH has no owning delivery
 * mechanism anywhere in this codebase (no push-notification service, no
 * service worker) — it remains a selectable `channels` value so the gap
 * stays discoverable in the data model, but `publishAnnouncement` below
 * only ever acts on IN_APP (always, implicitly — publishing makes it
 * visible) and EMAIL; a PUSH-only announcement is published exactly like
 * any other and is simply never pushed anywhere.
 *
 * "Audience" targeting beyond "everyone with a real seat in this course"
 * is not modeled — see the `CourseAnnouncement` schema doc comment.
 */

type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
type AnnouncementChannel = 'IN_APP' | 'EMAIL' | 'PUSH';

export interface CreateAnnouncementInput {
  moduleId?: string | null;
  title: string;
  message: string;
  priority?: AnnouncementPriority;
  channels?: AnnouncementChannel[];
  attachmentUrl?: string | null;
  publishAt?: string | null;
  expireAt?: string | null;
}

async function assertModuleBelongsToCourse(courseId: string, moduleId: string | null | undefined): Promise<void> {
  if (!moduleId) return;
  const module_ = await findModuleById(moduleId);
  if (!module_ || module_.courseId !== courseId) {
    throw AppError.badRequest('moduleId does not belong to this course');
  }
}

export async function createAnnouncementForCourse(courseId: string, input: CreateAnnouncementInput, actorId: string): Promise<AdminAnnouncement> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');
  await assertModuleBelongsToCourse(courseId, input.moduleId);

  const announcement = await createAnnouncementRow({
    course: { connect: { id: courseId } },
    ...(input.moduleId ? { module: { connect: { id: input.moduleId } } } : {}),
    title: input.title,
    message: input.message,
    priority: (input.priority ?? 'NORMAL') as never,
    channels: (input.channels ?? ['IN_APP']) as never,
    attachmentUrl: input.attachmentUrl ?? null,
    publishAt: input.publishAt ? new Date(input.publishAt) : null,
    expireAt: input.expireAt ? new Date(input.expireAt) : null,
    createdBy: actorId,
    updatedBy: actorId,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.announcement.created',
    resourceType: 'course_announcement',
    resourceId: announcement.id,
    afterState: { courseId, title: input.title },
  });

  return toAdminAnnouncement(announcement);
}

export async function getAnnouncementAdmin(id: string): Promise<AdminAnnouncement> {
  const announcement = await findAnnouncementById(id);
  if (!announcement) throw AppError.notFound('Announcement not found');
  return toAdminAnnouncement(announcement);
}

export async function listAnnouncementsForCourseAdmin(courseId: string): Promise<AdminAnnouncement[]> {
  const rows = await findAnnouncementsForCourseAdmin(courseId);
  return rows.map(toAdminAnnouncement);
}

export interface UpdateAnnouncementInput {
  moduleId?: string | null;
  title?: string;
  message?: string;
  priority?: AnnouncementPriority;
  channels?: AnnouncementChannel[];
  attachmentUrl?: string | null;
  publishAt?: string | null;
  expireAt?: string | null;
}

export async function updateExistingAnnouncement(id: string, input: UpdateAnnouncementInput, actorId: string): Promise<AdminAnnouncement> {
  const existing = await findAnnouncementById(id);
  if (!existing) throw AppError.notFound('Announcement not found');
  if (existing.status !== 'DRAFT') {
    throw AppError.conflict('Only a DRAFT announcement can be edited — archive it and create a new one instead');
  }
  if (input.moduleId !== undefined) await assertModuleBelongsToCourse(existing.courseId, input.moduleId);

  const updated = await updateAnnouncementRow(id, {
    ...(input.moduleId !== undefined ? (input.moduleId ? { module: { connect: { id: input.moduleId } } } : { module: { disconnect: true } }) : {}),
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.message !== undefined ? { message: input.message } : {}),
    ...(input.priority !== undefined ? { priority: input.priority as never } : {}),
    ...(input.channels !== undefined ? { channels: input.channels as never } : {}),
    ...(input.attachmentUrl !== undefined ? { attachmentUrl: input.attachmentUrl } : {}),
    ...(input.publishAt !== undefined ? { publishAt: input.publishAt ? new Date(input.publishAt) : null } : {}),
    ...(input.expireAt !== undefined ? { expireAt: input.expireAt ? new Date(input.expireAt) : null } : {}),
    updatedBy: actorId,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.announcement.updated',
    resourceType: 'course_announcement',
    resourceId: id,
    afterState: input,
  });

  return toAdminAnnouncement(updated);
}

/**
 * Fire-and-forget, best-effort — same never-throw discipline
 * `recordLearningEvent`/`recordAuditEvent` already established. A failed
 * or partially-failed email batch must never fail the publish action
 * itself; the announcement is already real and visible in-app regardless.
 */
async function sendAnnouncementEmails(courseId: string, title: string, message: string): Promise<void> {
  try {
    const emails = await findSeatOccupyingEnrollmentEmails(courseId);
    const adapter = getEmailAdapter();
    for (const to of emails) {
      await adapter.send({ to, subject: `Course announcement: ${title}`, text: message });
    }
  } catch (err) {
    logger.warn('Announcement email delivery failed', { courseId, error: err instanceof Error ? err.message : err });
  }
}

/** Publishing is a one-way, one-time transition (DRAFT -> PUBLISHED) — re-publishing an already-published announcement is rejected, so the EMAIL channel's best-effort send never fires twice for the same announcement. */
export async function publishAnnouncement(id: string, actorId: string): Promise<AdminAnnouncement> {
  const existing = await findAnnouncementById(id);
  if (!existing) throw AppError.notFound('Announcement not found');
  if (existing.status !== 'DRAFT') {
    throw AppError.conflict('Only a DRAFT announcement can be published');
  }

  const updated = await updateAnnouncementRow(id, { status: 'PUBLISHED', updatedBy: actorId });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.announcement.published',
    resourceType: 'course_announcement',
    resourceId: id,
  });

  if (existing.channels.includes('EMAIL' as never)) {
    await sendAnnouncementEmails(existing.courseId, existing.title, existing.message);
    const withEmailStamp = await updateAnnouncementRow(id, { emailSentAt: new Date() });
    return toAdminAnnouncement(withEmailStamp);
  }

  return toAdminAnnouncement(updated);
}

/** Non-destructive — same HIDE/RESTORE-style status flip every other moderation surface in this codebase uses, never a delete. */
export async function archiveAnnouncement(id: string, actorId: string): Promise<AdminAnnouncement> {
  const existing = await findAnnouncementById(id);
  if (!existing) throw AppError.notFound('Announcement not found');

  const updated = await updateAnnouncementRow(id, { status: 'ARCHIVED', updatedBy: actorId });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.announcement.archived',
    resourceType: 'course_announcement',
    resourceId: id,
  });

  return toAdminAnnouncement(updated);
}

/** GET /me/courses/:courseId/announcements — every PUBLISHED, in-window announcement, gated on the learner holding a real (seat-occupying) enrollment in the course. */
export async function getVisibleAnnouncementsForLearner(userId: string, courseId: string): Promise<LearnerAnnouncement[]> {
  const enrollment = await findEnrollmentForUserAndCourse(userId, courseId);
  const seatOccupying = enrollment && ['PENDING', 'ACTIVE', 'SUSPENDED', 'COMPLETED'].includes(enrollment.status);
  if (!seatOccupying) throw AppError.notFound('Enrollment not found');

  const rows = await findVisibleAnnouncementsForCourse(courseId);
  return rows.map(toLearnerAnnouncement);
}
