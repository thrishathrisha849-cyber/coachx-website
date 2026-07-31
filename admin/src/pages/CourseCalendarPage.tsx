import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCourseCalendarAdmin, type CourseCalendarEvent } from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

const TYPE_LABEL: Record<CourseCalendarEvent['type'], string> = {
  ASSIGNMENT_DUE: 'Assignment due',
  MODULE_UNLOCK: 'Module unlocks',
  ANNOUNCEMENT: 'Announcement scheduled',
};

const TYPE_BADGE_CLASS: Record<CourseCalendarEvent['type'], string> = {
  ASSIGNMENT_DUE: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  MODULE_UNLOCK: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  ANNOUNCEMENT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

function groupByDay(events: CourseCalendarEvent[]): Map<string, CourseCalendarEvent[]> {
  const groups = new Map<string, CourseCalendarEvent[]>();
  for (const event of events) {
    const key = new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const existing = groups.get(key);
    if (existing) existing.push(event);
    else groups.set(key, [event]);
  }
  return groups;
}

/**
 * T092-T095 (FR-103). An agenda-style view — the one of FR-103's named
 * "month/week/agenda views" a flat, date-sorted event list directly is.
 * See `course-calendar.service.ts`'s own doc comment for exactly which
 * FR-103 event sources are real here (assignment due dates, FIXED_DATE
 * module unlocks, scheduled announcements) and which are honestly out of
 * scope (live classes, quiz windows, program events, mentor sessions,
 * Google Calendar sync, timezone conversion, reminder settings — none
 * have an owning entity or infrastructure in this codebase).
 */
export function CourseCalendarPage() {
  const { id: courseId = '' } = useParams<{ id: string }>();
  const [events, setEvents] = useState<CourseCalendarEvent[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setStatus('loading');
    getCourseCalendarAdmin(courseId)
      .then((rows) => {
        setEvents(rows);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load the course calendar.');
        setStatus('error');
      });
  }, [courseId]);

  const groups = groupByDay(events);

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Course Calendar</h1>
      <p className="mt-1 text-xs text-slate-400">
        Assignment due dates, fixed-date module unlocks, and scheduled announcements for this course, in date order.
      </p>

      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {status === 'error' && <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {status === 'ready' && (
        <div className="mt-6 flex flex-col gap-6">
          {[...groups.entries()].map(([day, dayEvents]) => (
            <div key={day}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{day}</h2>
              <ul className="mt-2 flex flex-col gap-2">
                {dayEvents.map((event) => (
                  <li key={`${event.type}-${event.sourceId}`} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE_CLASS[event.type]}`}>{TYPE_LABEL[event.type]}</span>
                    <span className="text-slate-700 dark:text-slate-200">{event.title}</span>
                    <span className="ml-auto text-xs text-slate-400">{new Date(event.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-slate-400">No upcoming dated events for this course.</p>}
        </div>
      )}
    </div>
  );
}
