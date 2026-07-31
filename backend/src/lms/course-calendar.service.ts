import { AppError } from '../utils/app-error';
import { getPrismaClient } from '../database/prisma-client';
import { findCourseById } from './course.repository';
import type { CourseCalendarEvent } from './course-calendar.types';

/**
 * T092–T095 (FR-103 "course calendar"). FR-103 names live classes,
 * assignment deadlines, quiz windows, module unlocks, program events, and
 * mentor sessions, plus month/week/agenda views, add-to-Google-Calendar,
 * timezone conversion, and reminder settings. Only THREE of those sources
 * are real, dated data this codebase actually has:
 *
 *   - ASSIGNMENT_DUE — `Assignment.dueAt`, where set.
 *   - MODULE_UNLOCK — a `CourseModule` with `releaseRuleType: FIXED_DATE`
 *     has one absolute unlock date in `releaseRuleValue.date`.
 *     `DAYS_AFTER_ENROLLMENT` is deliberately excluded — it is relative
 *     to each LEARNER's own enrollment date, not one course-wide date,
 *     so it has no single calendar entry to show an admin.
 *   - ANNOUNCEMENT — `CourseAnnouncement.publishAt`, where set (an
 *     announcement scheduled to go live at a future date).
 *
 * Deliberately NOT modeled, honestly, rather than faked: live classes (no
 * `LiveSession` entity — T011), quiz windows (`Quiz` has no scheduled
 * open/close field, only a post-start `timeLimitMinutes` duration),
 * program events (no `Program` entity — T004), mentor sessions (no
 * mentor-booking system — Feature 007), add-to-Google-Calendar (no
 * calendar-provider integration), timezone conversion (no per-user
 * timezone preference stored anywhere in this codebase), and reminder
 * settings (no reminder/notification scheduler exists — the same gap
 * `LmsSettings`'s own doc comment already documents for "reminder
 * frequency"). Returned as a flat, date-sorted list — a real
 * month/week/agenda VIEW is a frontend concern
 * (`CourseCalendarPage.tsx` renders this as an agenda list, the one view
 * of the three FR-103 names that a flat sorted list directly is).
 */
export async function getCourseCalendarAdmin(courseId: string): Promise<CourseCalendarEvent[]> {
  const course = await findCourseById(courseId);
  if (!course) throw AppError.notFound('Course not found');

  const prisma = getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const events: CourseCalendarEvent[] = [];

  const assignments = await prisma.assignment.findMany({
    where: { lesson: { module: { courseId } }, dueAt: { not: null }, deletedAt: null },
    select: { id: true, title: true, dueAt: true },
  });
  for (const a of assignments) {
    if (a.dueAt) events.push({ type: 'ASSIGNMENT_DUE', date: a.dueAt, title: a.title, sourceId: a.id });
  }

  const modules = await prisma.courseModule.findMany({
    where: { courseId, releaseRuleType: 'FIXED_DATE' },
    select: { id: true, title: true, releaseRuleValue: true },
  });
  for (const m of modules) {
    const value = m.releaseRuleValue as { date?: string } | null;
    if (value?.date) {
      const date = new Date(value.date);
      if (!Number.isNaN(date.getTime())) events.push({ type: 'MODULE_UNLOCK', date, title: `${m.title} unlocks`, sourceId: m.id });
    }
  }

  const announcements = await prisma.courseAnnouncement.findMany({
    where: { courseId, publishAt: { not: null }, status: { not: 'ARCHIVED' } },
    select: { id: true, title: true, publishAt: true },
  });
  for (const a of announcements) {
    if (a.publishAt) events.push({ type: 'ANNOUNCEMENT', date: a.publishAt, title: a.title, sourceId: a.id });
  }

  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events;
}
