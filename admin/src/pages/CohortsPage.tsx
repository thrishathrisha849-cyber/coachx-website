import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listCohortsForCourse, createCohort, type AdminCohort } from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

const STATUS_STYLE: Record<AdminCohort['status'], string> = {
  OPEN: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  COMPLETED: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  ARCHIVED: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
};

/** 004 Cohort entity batch (T085, FR-012) — list/create cohorts for one course. */
export function CohortsPage() {
  const { id: courseId = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cohorts, setCohorts] = useState<AdminCohort[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [capacity, setCapacity] = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    setStatus('loading');
    listCohortsForCourse(courseId)
      .then((rows) => {
        setCohorts(rows);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load cohorts.');
        setStatus('error');
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [courseId]);

  async function handleCreate() {
    if (!name.trim() || !startDate || !timezone.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createCohort(courseId, {
        name: name.trim(),
        startDate: new Date(startDate).toISOString(),
        timezone: timezone.trim(),
        capacity: capacity.trim() ? Number(capacity) : null,
      });
      setName('');
      setStartDate('');
      setCapacity('');
      setShowCreate(false);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not create the cohort.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Cohorts</h1>
          <p className="mt-1 text-xs text-slate-400">Course ID: {courseId}</p>
        </div>
        <button onClick={() => setShowCreate((v) => !v)} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          + New cohort
        </button>
      </div>

      {showCreate && (
        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-48 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-40 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Timezone
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="Asia/Kolkata"
              className="mt-1 w-36 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
            Capacity
            <input
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Uncapped"
              className="mt-1 w-24 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim() || !startDate || !timezone.trim()}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {status === 'error' && <p className="mt-6 text-sm text-red-600 dark:text-red-400">Couldn't load cohorts.</p>}

      {status === 'ready' && (
        <ul className="mt-6 flex flex-col gap-3">
          {cohorts.map((c) => (
            <li
              key={c.id}
              onClick={() => navigate(`/cohorts/${c.id}`)}
              className="cursor-pointer rounded-lg border border-slate-200 p-3 text-sm hover:border-brand-400 dark:border-slate-800"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-800 dark:text-slate-100">{c.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[c.status]}`}>{c.status}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Starts {new Date(c.startDate).toLocaleDateString()} · {c.timezone} · {c.memberCount ?? 0}
                {c.capacity ? `/${c.capacity}` : ''} learners
              </p>
            </li>
          ))}
          {cohorts.length === 0 && <p className="text-sm text-slate-400">No cohorts yet.</p>}
        </ul>
      )}
    </div>
  );
}
