import { useEffect, useState } from 'react';
import { getLmsSettingsAdmin, updateLmsSettingsAdmin, type AdminLmsSettings, type LmsSettingsUpdate } from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

const COMPLETION_RULE_TYPES = ['MANUAL', 'MINIMUM_WATCH_PERCENT', 'ALL_ACTIVITIES_VIEWED', 'INSTRUCTOR_APPROVAL', 'QUIZ_PASS', 'ASSIGNMENT_APPROVED'];
const DOWNLOAD_PERMISSIONS: AdminLmsSettings['defaultResourceDownloadPermission'][] = ['VIEW_ONLY', 'DOWNLOADABLE'];

/** Renders `null`/empty as an empty text input (meaning "unlimited"); anything else as its numeric string. */
function attemptsToText(value: number | null): string {
  return value === null ? '' : String(value);
}

function textToAttempts(text: string): number | null {
  const trimmed = text.trim();
  return trimmed === '' ? null : Number(trimmed);
}

/**
 * 004 LMS-wide Settings batch (T101-T103, FR-114, FR-110's "Settings" nav
 * entry). Every field here replaces a value that used to be a hardcoded
 * constant scattered across a specific backend service file — see
 * `LmsSettings`'s own schema.prisma doc comment for the full list and why
 * "offline policy"/"reminder frequency"/"discussion default"/"course
 * archival policy" are deliberately NOT included (no real consuming system
 * exists for any of them yet).
 */
export function LmsSettingsPage() {
  const [settings, setSettings] = useState<AdminLmsSettings | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function load() {
    setStatus('loading');
    getLmsSettingsAdmin()
      .then((data) => {
        setSettings(data);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load LMS settings.');
        setStatus('error');
      });
  }

  useEffect(load, []);

  function field<K extends keyof AdminLmsSettings>(key: K, value: AdminLmsSettings[K]) {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSavedAt(null);
    const patch: LmsSettingsUpdate = {
      defaultVideoWatchThresholdPercent: settings.defaultVideoWatchThresholdPercent,
      defaultQuizPassingScorePercent: settings.defaultQuizPassingScorePercent,
      defaultQuizMaxAttempts: settings.defaultQuizMaxAttempts,
      defaultAssignmentMaxAttempts: settings.defaultAssignmentMaxAttempts,
      defaultResourceDownloadPermission: settings.defaultResourceDownloadPermission,
      defaultLessonCompletionRuleType: settings.defaultLessonCompletionRuleType,
      courseReviewMinProgressPercent: settings.courseReviewMinProgressPercent,
      streakQualifyLessonComplete: settings.streakQualifyLessonComplete,
      streakQualifyQuizComplete: settings.streakQualifyQuizComplete,
      streakQualifyAssignmentActivity: settings.streakQualifyAssignmentActivity,
      streakQualifyMinLearningTime: settings.streakQualifyMinLearningTime,
      streakMinLearningTimeMinutes: settings.streakMinLearningTimeMinutes,
      streakTimezone: settings.streakTimezone,
      streakGraceDays: settings.streakGraceDays,
    };
    try {
      const updated = await updateLmsSettingsAdmin(patch);
      setSettings(updated);
      setSavedAt(Date.now());
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not save LMS settings.');
    } finally {
      setSaving(false);
    }
  }

  if (status === 'loading') return <p className="text-sm text-slate-500">Loading…</p>;
  if (status === 'error' || !settings) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error ?? "Couldn't load LMS settings."}</p>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">LMS Settings</h1>
      <p className="mt-1 text-xs text-slate-400">
        Platform-wide defaults (FR-114). Each value is a fallback applied only when a course, lesson, quiz, assignment, or resource doesn't set its
        own — an existing per-entity override always wins.
      </p>

      <div className="mt-6 flex flex-col gap-5 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">Default video watch threshold (%)</span>
          <span className="text-xs text-slate-400">Used by a MINIMUM_WATCH_PERCENT lesson that doesn't set its own threshold.</span>
          <input
            type="number"
            min={1}
            max={100}
            value={settings.defaultVideoWatchThresholdPercent}
            onChange={(e) => field('defaultVideoWatchThresholdPercent', Number(e.target.value))}
            className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">Default quiz passing score (%)</span>
          <input
            type="number"
            min={0}
            max={100}
            value={settings.defaultQuizPassingScorePercent}
            onChange={(e) => field('defaultQuizPassingScorePercent', Number(e.target.value))}
            className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">Default quiz max attempts</span>
          <span className="text-xs text-slate-400">Leave blank for unlimited.</span>
          <input
            type="number"
            min={1}
            max={100}
            value={attemptsToText(settings.defaultQuizMaxAttempts)}
            onChange={(e) => field('defaultQuizMaxAttempts', textToAttempts(e.target.value))}
            className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">Default assignment max attempts</span>
          <span className="text-xs text-slate-400">Leave blank for unlimited.</span>
          <input
            type="number"
            min={1}
            max={100}
            value={attemptsToText(settings.defaultAssignmentMaxAttempts)}
            onChange={(e) => field('defaultAssignmentMaxAttempts', textToAttempts(e.target.value))}
            className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">Default lesson resource download permission</span>
          <select
            value={settings.defaultResourceDownloadPermission}
            onChange={(e) => field('defaultResourceDownloadPermission', e.target.value as AdminLmsSettings['defaultResourceDownloadPermission'])}
            className="mt-1 w-48 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {DOWNLOAD_PERMISSIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">Default lesson completion rule</span>
          <select
            value={settings.defaultLessonCompletionRuleType}
            onChange={(e) => field('defaultLessonCompletionRuleType', e.target.value)}
            className="mt-1 w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            {COMPLETION_RULE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-200">Course rating eligibility — minimum progress (%)</span>
          <span className="text-xs text-slate-400">A learner who has fully completed the course is always eligible regardless of this value.</span>
          <input
            type="number"
            min={0}
            max={100}
            value={settings.courseReviewMinProgressPercent}
            onChange={(e) => field('courseReviewMinProgressPercent', Number(e.target.value))}
            className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </label>

        <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Learning Streak (FR-057)</h2>
          <p className="mt-1 text-xs text-slate-400">
            Which server-verified learner actions count toward a streak day, the timezone streak days are computed in, and how many consecutive
            missed days are forgiven before a streak resets.
          </p>

          <div className="mt-3 flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings.streakQualifyLessonComplete} onChange={(e) => field('streakQualifyLessonComplete', e.target.checked)} />
              Lesson complete counts
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings.streakQualifyQuizComplete} onChange={(e) => field('streakQualifyQuizComplete', e.target.checked)} />
              Quiz pass counts
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings.streakQualifyAssignmentActivity} onChange={(e) => field('streakQualifyAssignmentActivity', e.target.checked)} />
              Assignment submission counts
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={settings.streakQualifyMinLearningTime} onChange={(e) => field('streakQualifyMinLearningTime', e.target.checked)} />
              Minimum daily learning time counts
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Minimum daily learning time (minutes)</span>
              <span className="text-xs text-slate-400">Only applies when the toggle above is on.</span>
              <input
                type="number"
                min={1}
                max={1440}
                value={settings.streakMinLearningTimeMinutes}
                onChange={(e) => field('streakMinLearningTimeMinutes', Number(e.target.value))}
                className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Streak timezone</span>
              <span className="text-xs text-slate-400">
                IANA name (e.g. "Asia/Kolkata"). One installation-wide timezone — no per-learner timezone preference exists in this system yet.
              </span>
              <input
                value={settings.streakTimezone}
                onChange={(e) => field('streakTimezone', e.target.value)}
                className="mt-1 w-48 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Grace days</span>
              <span className="text-xs text-slate-400">Consecutive missed days forgiven before a streak resets to 1. 0 = no grace.</span>
              <input
                type="number"
                min={0}
                max={30}
                value={settings.streakGraceDays}
                onChange={(e) => field('streakGraceDays', Number(e.target.value))}
                className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {savedAt && !error && <p className="text-sm text-emerald-600 dark:text-emerald-400">Saved.</p>}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="self-start rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
          {settings.updatedAt && (
            <span className="text-xs text-slate-400">Last updated {new Date(settings.updatedAt).toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
