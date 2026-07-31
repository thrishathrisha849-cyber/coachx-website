import { useEffect, useState } from 'react';
import { createLessonBookmark, deleteBookmark, getMyLessonBookmarks, type MyBookmark } from '@/api/lms.api';

/**
 * 004 Learner Notes & Bookmarks batch (FR-059) — a simple LESSON-type
 * bookmark toggle. The API also supports VIDEO_TIMESTAMP/TEXT_SECTION/
 * RESOURCE bookmarks, but this UI only exposes the whole-lesson case — the
 * most common and simplest interaction; the richer types remain real,
 * tested API surface without a dedicated UI control yet.
 */
export function LessonBookmarkButton({ lessonId }: { lessonId: string }) {
  const [bookmark, setBookmark] = useState<MyBookmark | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMyLessonBookmarks(lessonId)
      .then((bookmarks) => setBookmark(bookmarks.find((b) => b.type === 'LESSON') ?? null))
      .catch(() => setBookmark(null))
      .finally(() => setLoaded(true));
  }, [lessonId]);

  async function toggle() {
    setBusy(true);
    try {
      if (bookmark) {
        await deleteBookmark(bookmark.id);
        setBookmark(null);
      } else {
        const created = await createLessonBookmark(lessonId);
        setBookmark(created);
      }
    } catch {
      // Best-effort UI toggle — a failed bookmark action is not disruptive enough to block the lesson.
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={!!bookmark}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium disabled:opacity-60 ${
        bookmark
          ? 'border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-950 dark:text-brand-300'
          : 'border-slate-300 text-slate-600 hover:border-brand-400 dark:border-slate-700 dark:text-slate-300'
      }`}
    >
      🔖 {bookmark ? 'Bookmarked' : 'Bookmark this lesson'}
    </button>
  );
}
