import { useEffect, useState } from 'react';
import { listModerationQueue, actionCase, dismissCase, type TrustSafetyCase } from '@/api/moderation.api';
import type { NormalizedApiError } from '@/api/client';

/** 001 FR-090–FR-093 — Trust & Safety moderation queue (`community.moderate`). */
export function ModerationQueuePage() {
  const [cases, setCases] = useState<TrustSafetyCase[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  function load() {
    setStatus('loading');
    listModerationQueue()
      .then((result) => {
        setCases(result.rows);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load moderation queue.');
        setStatus('error');
      });
  }

  useEffect(load, []);

  async function handleAction(caseId: string, actionType: 'WARNING' | 'TEMPORARY_SUSPENSION' | 'PERMANENT_BAN') {
    try {
      await actionCase(caseId, actionType, `Action taken via admin console: ${actionType}`);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Failed to action case.');
    }
  }

  async function handleDismiss(caseId: string) {
    try {
      await dismissCase(caseId, 'Reviewed — no violation found');
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Failed to dismiss case.');
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Moderation Queue</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">001 FR-090–FR-093 — reported/blocked/muted content awaiting review.</p>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {status === 'ready' && (
        <div className="mt-6 flex flex-col gap-3">
          {cases.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.type} · {c.targetType}</span>
                <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{c.reason}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => handleAction(c.id, 'WARNING')} className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium dark:border-slate-700">Warn</button>
                <button onClick={() => handleAction(c.id, 'TEMPORARY_SUSPENSION')} className="rounded-md border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-700 dark:border-amber-700 dark:text-amber-400">Suspend</button>
                <button onClick={() => handleAction(c.id, 'PERMANENT_BAN')} className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 dark:border-red-700 dark:text-red-400">Ban</button>
                <button onClick={() => handleDismiss(c.id)} className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium dark:border-slate-700">Dismiss</button>
              </div>
            </div>
          ))}
          {cases.length === 0 && <p className="text-sm text-slate-400">Queue is empty.</p>}
        </div>
      )}
    </div>
  );
}
