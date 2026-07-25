import { useEffect, useState } from 'react';
import { fetchAnnouncements } from '@/api/cms.api';
import type { Announcement } from '@/types/cms.types';

const DISMISS_STORAGE_KEY = 'coachx-dismissed-announcements';

function getDismissedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.sessionStorage.getItem(DISMISS_STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/**
 * 002 FR-005/FR-006: admin-configured, date-ranged, prioritized,
 * dismissible announcement bar. Dismissal is remembered at the
 * browser/session level (sessionStorage), and — when several
 * announcements are simultaneously active — only the highest-priority
 * one (the API already sorts by priority) is shown.
 */
export function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(getDismissedIds);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchAnnouncements()
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  const visible = announcements.find((a) => !dismissedIds.has(a.id));
  if (!visible) return null;

  const dismiss = () => {
    const next = new Set(dismissedIds).add(visible.id);
    setDismissedIds(next);
    window.sessionStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify(Array.from(next)));
  };

  return (
    <div className="relative flex items-center justify-center gap-3 bg-brand-600 px-4 py-2 text-center text-sm text-white">
      {visible.icon && <span aria-hidden="true">{visible.icon}</span>}
      <span>{visible.text}</span>
      {visible.ctaLabel && visible.ctaUrl && (
        <a href={visible.ctaUrl} className="font-semibold underline underline-offset-2">
          {visible.ctaLabel}
        </a>
      )}
      {visible.dismissible && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-white/80 hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
      )}
    </div>
  );
}
