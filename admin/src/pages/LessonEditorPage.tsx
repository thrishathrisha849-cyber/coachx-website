import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getLessonAdminFull,
  updateLesson,
  listActivitiesForLesson,
  createActivity,
  reorderActivities,
  archiveActivity,
  type AdminLessonFull,
  type AdminActivity,
} from '@/api/lms.api';
import { getQuizByLessonId } from '@/api/quiz.api';
import { getAssignmentByLessonId } from '@/api/assignment.api';
import type { NormalizedApiError } from '@/api/client';

const COMPLETION_RULE_TYPES = ['MANUAL', 'MINIMUM_WATCH_PERCENT', 'ALL_ACTIVITIES_VIEWED', 'INSTRUCTOR_APPROVAL', 'QUIZ_PASS', 'ASSIGNMENT_APPROVED'];
const ACTIVITY_TYPES = ['VIDEO', 'AUDIO', 'ARTICLE', 'PDF', 'DOWNLOAD', 'EXTERNAL_LINK', 'EMBED'];

/** LMS Admin UI batch — lesson metadata, activities, and links to this lesson's Quiz/Assignment (T088-T103). */
export function LessonEditorPage() {
  const { lessonId = '' } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<AdminLessonFull | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [completionRuleType, setCompletionRuleType] = useState('MANUAL');
  const [saving, setSaving] = useState(false);

  const [quizId, setQuizId] = useState<string | null | undefined>(undefined);
  const [assignmentId, setAssignmentId] = useState<string | null | undefined>(undefined);

  function load() {
    getLessonAdminFull(lessonId)
      .then((l) => {
        setLesson(l);
        setTitle(l.title);
        setCompletionRuleType(l.completionRuleType);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
    getQuizByLessonId(lessonId).then((q) => setQuizId(q?.id ?? null));
    getAssignmentByLessonId(lessonId).then((a) => setAssignmentId(a?.id ?? null));
  }

  useEffect(load, [lessonId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateLesson(lessonId, { title, completionRuleType });
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not save lesson.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setError(null);
    try {
      await updateLesson(lessonId, { status: lesson?.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' });
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not change lesson status.');
    }
  }

  if (status === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (status === 'error' || !lesson) return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load this lesson.</p>;

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate(`/lms-modules/${lesson.moduleId}`)} className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Back to module
      </button>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{lesson.title}</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{lesson.status}</span>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Lesson details</h2>
        <div className="mt-3 flex flex-col gap-3">
          <label className="text-sm">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="text-sm">
            Completion rule
            <select value={completionRuleType} onChange={(e) => setCompletionRuleType(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
              {COMPLETION_RULE_TYPES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !title.trim()} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button onClick={handlePublish} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200">
              {lesson.status === 'PUBLISHED' ? 'Unpublish (move to Draft)' : 'Publish'}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Assessment</h2>
        <div className="mt-3 flex gap-2">
          {quizId === undefined ? null : quizId ? (
            <button onClick={() => navigate(`/quizzes/${quizId}`)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200">
              Manage quiz
            </button>
          ) : (
            <button onClick={() => navigate(`/quizzes/new?lessonId=${lessonId}`)} className="rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:border-brand-400 dark:border-slate-700">
              + Attach a quiz
            </button>
          )}
          {assignmentId === undefined ? null : assignmentId ? (
            <button onClick={() => navigate(`/assignments/${assignmentId}`)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200">
              Manage assignment
            </button>
          ) : (
            <button onClick={() => navigate(`/assignments/new?lessonId=${lessonId}`)} className="rounded-md border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 hover:border-brand-400 dark:border-slate-700">
              + Attach an assignment
            </button>
          )}
        </div>
      </section>

      <ActivitiesSection lessonId={lessonId} onError={setError} />
    </div>
  );
}

function ActivitiesSection({ lessonId, onError }: { lessonId: string; onError: (e: string | null) => void }) {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [type, setType] = useState('VIDEO');
  const [mediaUrl, setMediaUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    listActivitiesForLesson(lessonId)
      .then((rows) => setActivities(rows.sort((a, b) => a.position - b.position)))
      .catch(() => undefined);
  }

  useEffect(load, [lessonId]);

  async function handleCreate() {
    setCreating(true);
    onError(null);
    try {
      await createActivity(lessonId, {
        type,
        mediaUrl: ['VIDEO', 'AUDIO', 'DOWNLOAD', 'PDF'].includes(type) ? mediaUrl : undefined,
        externalUrl: type === 'EXTERNAL_LINK' ? externalUrl : undefined,
        bodyText: type === 'ARTICLE' ? bodyText : undefined,
      });
      setMediaUrl('');
      setExternalUrl('');
      setBodyText('');
      load();
    } catch (err) {
      onError((err as NormalizedApiError).message ?? 'Could not create activity.');
    } finally {
      setCreating(false);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= activities.length) return;
    const reordered = [...activities];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setActivities(reordered);
    await reorderActivities(lessonId, reordered.map((a) => a.id));
  }

  async function handleArchive(activityId: string) {
    await archiveActivity(activityId);
    load();
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Activities</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {activities.map((a, index) => (
          <li key={a.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
            <div>
              <span className="font-medium text-slate-800 dark:text-slate-100">{a.type}</span>
              {a.title && <span className="ml-2 text-xs text-slate-400">{a.title}</span>}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{a.status}</span>
              <button onClick={() => handleMove(index, -1)} disabled={index === 0} className="disabled:opacity-30">
                ↑
              </button>
              <button onClick={() => handleMove(index, 1)} disabled={index === activities.length - 1} className="disabled:opacity-30">
                ↓
              </button>
              {a.status !== 'ARCHIVED' && (
                <button onClick={() => handleArchive(a.id)} className="text-red-600 hover:text-red-700 dark:text-red-400">
                  Archive
                </button>
              )}
            </div>
          </li>
        ))}
        {activities.length === 0 && <p className="text-sm text-slate-400">No activities yet.</p>}
      </ul>

      <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Add activity</h3>
        <div className="mt-3 flex flex-col gap-3">
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-48 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
            {ACTIVITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {['VIDEO', 'AUDIO', 'DOWNLOAD', 'PDF'].includes(type) && (
            <input value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="https://media URL" className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          )}
          {type === 'EXTERNAL_LINK' && (
            <input value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://external URL" className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          )}
          {type === 'ARTICLE' && (
            <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} placeholder="Article body" rows={3} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          )}
          <button onClick={handleCreate} disabled={creating} className="self-start rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            {creating ? 'Adding…' : '+ Add activity'}
          </button>
        </div>
      </div>
    </section>
  );
}
