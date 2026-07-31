import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { listWaitlistAdmin, type AdminWaitlistEntry } from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

const STATUS_STYLE: Record<AdminWaitlistEntry['status'], string> = {
  WAITING: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  OFFERED: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  CLAIMED: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  EXPIRED: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
  CANCELLED: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
};

/** 004 Waitlist batch (FR-028/029) — read-only roster, per course. Reading it also sweeps/advances the queue server-side (see `waitlist.service.ts`'s `sweepAndAdvanceWaitlist`), so this view is always current. */
export function CourseWaitlistPage() {
  const { id: courseId = '' } = useParams<{ id: string }>();
  const [entries, setEntries] = useState<AdminWaitlistEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  function load() {
    setStatus('loading');
    listWaitlistAdmin(courseId)
      .then((data) => {
        setEntries(data);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load the waitlist.');
        setStatus('error');
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [courseId]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Course Waitlist</h1>
      <p className="mt-1 text-xs text-slate-400">Course ID: {courseId}</p>

      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {status === 'error' && <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {status === 'ready' && (
        <ul className="mt-6 flex flex-col gap-3">
          {entries.map((e) => (
            <li key={e.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-100">#{e.priority} · {e.userDisplayName ?? e.userId}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[e.status]}`}>{e.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Joined {new Date(e.joinedAt).toLocaleString()}
                {e.referralSource && ` · Source: ${e.referralSource}`}
              </p>
              {e.status === 'OFFERED' && e.offerExpiresAt && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  Offer expires {new Date(e.offerExpiresAt).toLocaleString()}
                  {e.offerEmailSentAt ? ` · Email sent ${new Date(e.offerEmailSentAt).toLocaleString()}` : ' · Email not yet sent'}
                </p>
              )}
              {e.claimedAt && <p className="mt-1 text-xs text-green-600 dark:text-green-400">Claimed {new Date(e.claimedAt).toLocaleString()}</p>}
            </li>
          ))}
          {entries.length === 0 && <p className="text-sm text-slate-400">No one is currently on the waitlist.</p>}
        </ul>
      )}
    </div>
  );
}
