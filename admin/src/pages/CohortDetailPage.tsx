import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getCohortAdmin,
  updateCohort,
  listCohortMembers,
  addCohortMember,
  removeCohortMember,
  listModulesForCourse,
  setCohortModuleSchedule,
  listCohortModuleSchedules,
  type AdminCohort,
  type AdminCohortMember,
  type AdminCourseModuleFull,
  type AdminCohortModuleSchedule,
} from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

const STATUSES: AdminCohort['status'][] = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'];

/**
 * 004 Cohort entity batch (T085, FR-012/FR-034) — roster management and
 * the per-module unlock-date schedule that `access-evaluator.service.ts`'s
 * `COHORT_SCHEDULE` release rule reads (US7 acceptance scenario 4: "all
 * learners in that cohort gain access simultaneously").
 */
export function CohortDetailPage() {
  const { cohortId = '' } = useParams<{ cohortId: string }>();
  const [cohort, setCohort] = useState<AdminCohort | null>(null);
  const [members, setMembers] = useState<AdminCohortMember[]>([]);
  const [modules, setModules] = useState<AdminCourseModuleFull[]>([]);
  const [schedules, setSchedules] = useState<AdminCohortModuleSchedule[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [scheduleDrafts, setScheduleDrafts] = useState<Record<string, string>>({});

  function load() {
    setStatus('loading');
    getCohortAdmin(cohortId)
      .then(async (c) => {
        setCohort(c);
        const [memberRows, moduleRows, scheduleRows] = await Promise.all([
          listCohortMembers(cohortId),
          listModulesForCourse(c.courseId),
          listCohortModuleSchedules(cohortId),
        ]);
        setMembers(memberRows);
        setModules(moduleRows);
        setSchedules(scheduleRows);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load this cohort.');
        setStatus('error');
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [cohortId]);

  async function handleStatusChange(newStatus: AdminCohort['status']) {
    if (!cohort) return;
    setError(null);
    try {
      const updated = await updateCohort(cohortId, { status: newStatus });
      setCohort(updated);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not update cohort status.');
    }
  }

  async function handleAddMember() {
    if (!newMemberUserId.trim()) return;
    setAddingMember(true);
    setError(null);
    try {
      await addCohortMember(cohortId, newMemberUserId.trim());
      setNewMemberUserId('');
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not add this learner — they must already be enrolled in the course.');
    } finally {
      setAddingMember(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    setError(null);
    try {
      await removeCohortMember(cohortId, memberId);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not remove this member.');
    }
  }

  async function handleSetSchedule(moduleId: string) {
    const draft = scheduleDrafts[moduleId];
    if (!draft) return;
    setError(null);
    try {
      await setCohortModuleSchedule(cohortId, moduleId, new Date(draft).toISOString());
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not set the module schedule.');
    }
  }

  if (status === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (status === 'error' || !cohort) return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load this cohort.</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{cohort.name}</h1>
        <select
          value={cohort.status}
          onChange={(e) => handleStatusChange(e.target.value as AdminCohort['status'])}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Starts {new Date(cohort.startDate).toLocaleDateString()} · {cohort.timezone} · {members.length}
        {cohort.capacity ? `/${cohort.capacity}` : ''} learners
      </p>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Roster</h2>
        <div className="mt-2 flex gap-2">
          <input
            value={newMemberUserId}
            onChange={(e) => setNewMemberUserId(e.target.value)}
            placeholder="User ID (must already be enrolled)"
            className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <button
            onClick={handleAddMember}
            disabled={addingMember || !newMemberUserId.trim()}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Add
          </button>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-800">
              <span>{m.userId}</span>
              <button onClick={() => handleRemoveMember(m.id)} className="text-xs font-medium text-red-600 hover:underline dark:text-red-400">
                Remove
              </button>
            </li>
          ))}
          {members.length === 0 && <p className="text-sm text-slate-400">No learners assigned yet.</p>}
        </ul>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Module unlock schedule</h2>
        <p className="mt-1 text-xs text-slate-400">
          Only takes effect for a module whose release rule is set to COHORT_SCHEDULE (in the module editor).
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {modules.map((m) => {
            const existing = schedules.find((s) => s.moduleId === m.id);
            return (
              <li key={m.id} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-800">
                <span className="flex-1">{m.title}</span>
                {existing && <span className="text-xs text-slate-400">Unlocks {new Date(existing.unlockAt).toLocaleString()}</span>}
                <input
                  type="datetime-local"
                  value={scheduleDrafts[m.id] ?? ''}
                  onChange={(e) => setScheduleDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
                <button
                  onClick={() => handleSetSchedule(m.id)}
                  disabled={!scheduleDrafts[m.id]}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium disabled:opacity-40 dark:border-slate-700"
                >
                  Set
                </button>
              </li>
            );
          })}
          {modules.length === 0 && <p className="text-sm text-slate-400">This course has no modules yet.</p>}
        </ul>
      </div>
    </div>
  );
}
