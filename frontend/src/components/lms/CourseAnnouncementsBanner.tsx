import { useEffect, useState } from 'react';
import { getMyCourseAnnouncements, type LearnerAnnouncement } from '@/api/lms.api';

const PRIORITY_STYLE: Record<LearnerAnnouncement['priority'], string> = {
  LOW: 'border-slate-200 dark:border-slate-800',
  NORMAL: 'border-slate-200 dark:border-slate-800',
  HIGH: 'border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950',
  URGENT: 'border-red-300 bg-red-50 dark:border-red-900 dark:bg-red-950',
};

/**
 * 004 Course Announcements batch (FR-102) — self-contained, so it can be
 * dropped into any enrolled-learner course view without threading a new
 * fetch through that page's own load sequence. Silently renders nothing
 * on error/empty (an announcements list is a supplementary surface, never
 * a blocking one).
 */
export function CourseAnnouncementsBanner({ courseId }: { courseId: string }) {
  const [announcements, setAnnouncements] = useState<LearnerAnnouncement[]>([]);

  useEffect(() => {
    getMyCourseAnnouncements(courseId)
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]));
  }, [courseId]);

  if (announcements.length === 0) return null;

  return (
    <div className="mb-4 flex flex-col gap-2" role="region" aria-label="Course announcements">
      {announcements.map((a) => (
        <div key={a.id} className={`rounded-lg border p-3 text-sm ${PRIORITY_STYLE[a.priority]}`}>
          <p className="font-semibold text-slate-900 dark:text-white">{a.title}</p>
          <p className="mt-1 whitespace-pre-wrap text-slate-700 dark:text-slate-200">{a.message}</p>
          {a.attachmentUrl && (
            <a href={a.attachmentUrl} target="_blank" rel="noreferrer noopener" className="mt-1 inline-block text-brand-600 hover:text-brand-700">
              View attachment
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
