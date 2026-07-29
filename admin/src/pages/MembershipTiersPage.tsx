import { useEffect, useState } from 'react';
import { listMembershipTiers, type MembershipPlanSummary } from '@/api/membership.api';
import type { NormalizedApiError } from '@/api/client';

/** 001 FR-048–FR-053 — the 6-tier Membership catalog (read-only view; catalog editing is 009's admin surface). */
export function MembershipTiersPage() {
  const [tiers, setTiers] = useState<MembershipPlanSummary[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMembershipTiers()
      .then((rows) => {
        setTiers(rows);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load membership tiers.');
        setStatus('error');
      });
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Membership Tiers</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">001 FR-048–FR-053 — Free, Starter, Growth, Pro, Elite, Organization.</p>

      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {status === 'error' && <p className="mt-6 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {status === 'ready' && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div key={tier.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-white">{tier.currentVersion.name}</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tier.currentVersion.targetCustomer}</p>
              <ul className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                {tier.currentVersion.features.slice(0, 5).map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
