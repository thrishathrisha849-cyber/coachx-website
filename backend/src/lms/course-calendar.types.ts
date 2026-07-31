/**
 * FR-103 names live classes, assignment deadlines, quiz windows, module
 * unlocks, program events, and mentor sessions as calendar entry sources,
 * plus month/week/agenda views, add-to-Google-Calendar, timezone
 * conversion, and reminder settings. This codebase can only genuinely
 * populate a subset — see `course-calendar.service.ts`'s own doc comment
 * for exactly which, and why the rest is honestly left out rather than
 * faked with placeholder dates.
 */
export type CourseCalendarEventType = 'ASSIGNMENT_DUE' | 'MODULE_UNLOCK' | 'ANNOUNCEMENT';

export interface CourseCalendarEvent {
  type: CourseCalendarEventType;
  date: Date;
  title: string;
  /** The assignment/module/announcement id this entry was derived from. */
  sourceId: string;
}
