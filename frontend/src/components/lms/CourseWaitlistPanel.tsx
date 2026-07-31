import { useEffect, useState } from 'react';
import { joinWaitlist, getMyWaitlistEntry, claimWaitlistOffer, type MyWaitlistEntry } from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

/**
 * 004 Waitlist batch (FR-028/029) — shown in place of the "Enroll now" CTA
 * once an enroll attempt comes back `COURSE_FULL` (409). Reflects the
 * server's own waitlist entry state only; never guesses queue position or
 * offer status client-side.
 */
export function CourseWaitlistPanel({ courseId, onClaimed }: { courseId: string; onClaimed: () => void }) {
  const [entry, setEntry] = useState<MyWaitlistEntry | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyWaitlistEntry(courseId)
      .then(setEntry)
      .catch(() => setEntry(null))
      .finally(() => setLoaded(true));
  }, [courseId]);

  async function handleJoin() {
    setBusy(true);
    setError(null);
    try {
      const created = await joinWaitlist(courseId);
      setEntry(created);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not join the waitlist. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleClaim() {
    if (!entry) return;
    setBusy(true);
    setError(null);
    try {
      await claimWaitlistOffer(entry.id);
      onClaimed();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not claim your seat. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
      {(!entry || entry.status === 'EXPIRED' || entry.status === 'CANCELLED') && (
        <>
          <p className="mb-2">This course has reached its enrollment capacity.</p>
          <button
            type="button"
            onClick={handleJoin}
            disabled={busy}
            className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? 'Joining…' : 'Join the waitlist'}
          </button>
        </>
      )}

      {entry?.status === 'WAITING' && (
        <p>You're #{entry.priority} on the waitlist. We'll email you when a seat opens up.</p>
      )}

      {entry?.status === 'OFFERED' && (
        <>
          <p className="mb-2">
            A seat opened up for you! Claim it before{' '}
            {entry.offerExpiresAt ? new Date(entry.offerExpiresAt).toLocaleString() : 'it expires'}.
          </p>
          <button
            type="button"
            onClick={handleClaim}
            disabled={busy}
            className="w-full rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? 'Claiming…' : 'Claim your seat'}
          </button>
        </>
      )}

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
