import { useEffect, useState } from 'react';
import { saveToWishlist, removeFromWishlist, getMyWishlist, type MyWishlistEntry } from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

/**
 * 004 Wishlist batch (FR-027) — shown in place of the "Enroll now" CTA once
 * an enroll attempt comes back `COURSE_UNAVAILABLE` for an
 * ENROLLMENT_PAUSED course. Reflects the server's own wishlist state only.
 */
export function CourseWishlistPanel({ courseId }: { courseId: string }) {
  const [entry, setEntry] = useState<MyWishlistEntry | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyWishlist()
      .then((entries) => setEntry(entries.find((e) => e.courseId === courseId) ?? null))
      .catch(() => setEntry(null))
      .finally(() => setLoaded(true));
  }, [courseId]);

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      const saved = await saveToWishlist(courseId);
      setEntry(saved);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not save this course. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    setError(null);
    try {
      await removeFromWishlist(courseId);
      setEntry(null);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not remove this course. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
      <p className="mb-2">This course isn't open for enrollment right now.</p>

      {entry ? (
        <>
          {entry.priceDropped && <p className="mb-2 text-green-700 dark:text-green-400">Good news — the price has dropped since you saved this course.</p>}
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            className="w-full rounded-md border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900"
          >
            {busy ? 'Removing…' : 'Saved — remove from wishlist'}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handleSave}
          disabled={busy}
          className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {busy ? 'Saving…' : "Save to wishlist — we'll email you when it opens"}
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
