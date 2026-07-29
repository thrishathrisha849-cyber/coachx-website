import { useEffect, useState } from 'react';
import { listGovernanceRecords, startGovernanceRecord, advanceGovernanceStage, type GovernanceRecord } from '@/api/governance.api';
import type { NormalizedApiError } from '@/api/client';

const PHASES = ['FOUNDATION_MVP', 'GROWTH_PLATFORM', 'BUSINESS_OPERATING_SYSTEM', 'ENTERPRISE_ECOSYSTEM'];

/** 001 FR-083/FR-078–FR-082 — governance sequence + phase-gated rollout (`governance.manage`). */
export function GovernancePage() {
  const [records, setRecords] = useState<GovernanceRecord[]>([]);
  const [featureName, setFeatureName] = useState('');
  const [phase, setPhase] = useState(PHASES[0]);
  const [error, setError] = useState<string | null>(null);

  function load() {
    listGovernanceRecords()
      .then((result) => setRecords(result.rows))
      .catch((err) => setError((err as NormalizedApiError).message ?? 'Failed to load governance records.'));
  }

  useEffect(load, []);

  async function handleStart() {
    try {
      await startGovernanceRecord(featureName, phase);
      setFeatureName('');
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Failed to start governance record.');
    }
  }

  async function handleAdvance(id: string) {
    try {
      await advanceGovernanceStage(id);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Failed to advance stage.');
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Governance & Release Phasing</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">001 FR-083 — 10-stage governance sequence; FR-078–FR-082 — phase-gated rollout.</p>

      <div className="mt-6 flex gap-2">
        <input
          value={featureName}
          onChange={(e) => setFeatureName(e.target.value)}
          placeholder="Feature/module name"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <select value={phase} onChange={(e) => setPhase(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
          {PHASES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button onClick={handleStart} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">Start</button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <table className="mt-6 w-full text-left text-sm">
        <thead className="text-slate-500 dark:text-slate-400">
          <tr>
            <th className="pb-2">Feature</th>
            <th className="pb-2">Phase</th>
            <th className="pb-2">Stage</th>
            <th className="pb-2" />
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-t border-slate-200 dark:border-slate-800">
              <td className="py-2">{r.featureName}</td>
              <td className="py-2 text-slate-500">{r.phase}</td>
              <td className="py-2">{r.currentStage}</td>
              <td className="py-2">
                {r.currentStage !== 'POST_RELEASE_REVIEW' && (
                  <button onClick={() => handleAdvance(r.id)} className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium dark:border-slate-700">
                    Advance
                  </button>
                )}
              </td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan={4} className="py-4 text-slate-400">No governance records yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
