import { useEffect, useState } from 'react';
import {
  listAcademicIntegrityCases,
  flagForInvestigation,
  resolveInvestigation,
  ACADEMIC_INTEGRITY_CASE_TYPES,
  ACADEMIC_INTEGRITY_TARGET_TYPES,
  type AdminAcademicIntegrityCase,
  type AcademicIntegrityCaseType,
  type AcademicIntegrityTargetType,
} from '@/api/academic-integrity.api';
import type { NormalizedApiError } from '@/api/client';

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Open',
  UNDER_REVIEW: 'Under review',
  ACTION_TAKEN: 'Confirmed — action taken',
  DISMISSED: 'Cleared',
};

/**
 * 004 Academic-integrity investigation batch (T120, FR-116). Reuses 001's
 * generic Trust & Safety case/appeal infrastructure under the hood — this
 * page is scoped to ONLY the 6 academic-integrity case types
 * (`course.academicIntegrity.manage`), a separate queue from
 * `ModerationQueuePage.tsx`'s community REPORT/BLOCK/MUTE cases.
 * Resolving an appeal (UPHELD/OVERTURNED) isn't in this page yet — an
 * appeal is submitted by the learner via the existing generic
 * `POST /trust-safety/cases/:caseId/appeal` endpoint; reviewing/resolving
 * it here is a reasonable near-term follow-up, not attempted this batch
 * given the case volume this feature is expected to see is low and no
 * appeal had been filed against any test case built during this batch's
 * live verification.
 */
export function AcademicIntegrityQueuePage() {
  const [cases, setCases] = useState<AdminAcademicIntegrityCase[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const [type, setType] = useState<AcademicIntegrityCaseType>('PLAGIARISM');
  const [targetType, setTargetType] = useState<AcademicIntegrityTargetType>('SUBMISSION');
  const [targetId, setTargetId] = useState('');
  const [reason, setReason] = useState('');
  const [flagging, setFlagging] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setStatus('loading');
    listAcademicIntegrityCases(statusFilter || undefined)
      .then((rows) => {
        setCases(rows);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load academic-integrity cases.');
        setStatus('error');
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [statusFilter]);

  async function handleFlag() {
    if (!targetId.trim() || reason.trim().length < 10) return;
    setFlagging(true);
    setError(null);
    try {
      await flagForInvestigation({ type, targetType, targetId: targetId.trim(), reason: reason.trim() });
      setTargetId('');
      setReason('');
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not file the flag.');
    } finally {
      setFlagging(false);
    }
  }

  async function handleResolve(caseId: string, outcome: 'CONFIRMED' | 'CLEARED') {
    setBusyId(caseId);
    setError(null);
    try {
      await resolveInvestigation(caseId, outcome, outcome === 'CONFIRMED' ? 'Confirmed via admin review' : 'Cleared — no violation found');
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not resolve the case.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Academic Integrity</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        FR-116 — plagiarism, unauthorized collaboration, identity fraud, quiz cheating, fabricated submission, and certificate fraud. Flagging a
        submission/quiz-attempt/certificate holds (or revokes, if already issued) that learner's certificate for the affected course until this case
        is resolved.
      </p>

      <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Flag for investigation</h2>
        <div className="mt-3 flex flex-col gap-3">
          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as AcademicIntegrityCaseType)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {ACADEMIC_INTEGRITY_CASE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={targetType}
              onChange={(e) => setTargetType(e.target.value as AcademicIntegrityTargetType)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {ACADEMIC_INTEGRITY_TARGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <input
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            placeholder={`${targetType === 'USER' ? 'User' : targetType === 'SUBMISSION' ? 'Submission' : targetType === 'QUIZ_ATTEMPT' ? 'Quiz attempt' : 'Certificate'} ID`}
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Reason (at least 10 characters) — what was observed and why it's suspected misconduct"
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            onClick={handleFlag}
            disabled={flagging || !targetId.trim() || reason.trim().length < 10}
            className="self-start rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {flagging ? 'Filing…' : 'File flag'}
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <label className="text-sm text-slate-600 dark:text-slate-300">Filter:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <option value="">All</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="ACTION_TAKEN">Confirmed</option>
          <option value="DISMISSED">Cleared</option>
        </select>
      </div>

      {status === 'loading' && <p className="mt-4 text-sm text-slate-500">Loading…</p>}
      {status === 'error' && <p className="mt-4 text-sm text-red-600 dark:text-red-400">Couldn't load cases.</p>}

      {status === 'ready' && (
        <div className="mt-4 flex flex-col gap-3">
          {cases.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {c.type} · {c.targetType}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{c.reason}</p>
              <p className="mt-1 text-xs text-slate-400">
                Target ID: {c.targetId} · Filed {new Date(c.createdAt).toLocaleString()}
              </p>
              {(c.status === 'OPEN' || c.status === 'UNDER_REVIEW') && (
                <div className="mt-3 flex gap-2">
                  <button
                    disabled={busyId === c.id}
                    onClick={() => handleResolve(c.id, 'CONFIRMED')}
                    className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 hover:border-red-400 dark:border-red-700 dark:text-red-400"
                  >
                    Confirm misconduct
                  </button>
                  <button
                    disabled={busyId === c.id}
                    onClick={() => handleResolve(c.id, 'CLEARED')}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium dark:border-slate-700"
                  >
                    Clear — no violation
                  </button>
                </div>
              )}
            </div>
          ))}
          {cases.length === 0 && <p className="text-sm text-slate-400">No cases.</p>}
        </div>
      )}
    </div>
  );
}
