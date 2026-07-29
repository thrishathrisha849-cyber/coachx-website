import { useEffect, useState } from 'react';
import { getKpiReport, type KpiReport } from '@/api/kpi.api';
import type { NormalizedApiError } from '@/api/client';

function Section({ title, data }: { title: string; data: Record<string, unknown> }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 className="font-semibold text-slate-900 dark:text-white">{title}</h2>
      <dl className="mt-2 space-y-1 text-sm">
        {Object.entries(data)
          .filter(([key]) => key !== 'note')
          .map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{key}</dt>
              <dd className="text-slate-800 dark:text-slate-200">{value === null ? '—' : String(value)}</dd>
            </div>
          ))}
      </dl>
      {typeof data.note === 'string' && <p className="mt-3 text-xs italic text-slate-400">{data.note}</p>}
    </div>
  );
}

/** 001 FR-064–FR-068 — Business KPI dashboard (`kpi.view`). */
export function KpiDashboardPage() {
  const [report, setReport] = useState<KpiReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getKpiReport()
      .then(setReport)
      .catch((err) => setError((err as NormalizedApiError).message ?? 'Failed to load KPI report.'));
  }, []);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Business KPIs</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">001 FR-064–FR-068 — 7-category instrumentation contract.</p>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {report && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Section title="Acquisition" data={report.acquisition} />
          <Section title="Activation & Engagement" data={report.activationEngagement} />
          <Section title="Learning" data={report.learning} />
          <Section title="Revenue & Retention" data={report.revenueRetention} />
          <Section title="Transformation" data={report.transformation} />
        </div>
      )}
    </div>
  );
}
