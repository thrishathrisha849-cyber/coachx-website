import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getModuleAdminFull,
  updateModule,
  releaseModuleNow,
  listLessonsForModule,
  createLesson,
  reorderLessons,
  archiveLesson,
  restoreLesson,
  listModulesForCourse,
  type AdminCourseModuleFull,
  type AdminLessonFull,
} from '@/api/lms.api';
import { createProject, listProjectsForModule, type AdminProject } from '@/api/project.api';
import type { NormalizedApiError } from '@/api/client';

const RELEASE_RULE_TYPES = ['IMMEDIATE', 'DAYS_AFTER_ENROLLMENT', 'FIXED_DATE', 'AFTER_PREVIOUS_MODULE', 'INSTRUCTOR_RELEASE', 'COHORT_SCHEDULE'];

/** LMS Admin UI batch — module metadata + drip/release config + its lessons (T088-T103). */
export function ModuleEditorPage() {
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [module_, setModule] = useState<AdminCourseModuleFull | null>(null);
  const [siblingModules, setSiblingModules] = useState<AdminCourseModuleFull[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [releaseRuleType, setReleaseRuleType] = useState('IMMEDIATE');
  const [isMandatory, setIsMandatory] = useState(true);
  const [prerequisiteModuleId, setPrerequisiteModuleId] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    getModuleAdminFull(moduleId)
      .then((m) => {
        setModule(m);
        setTitle(m.title);
        setReleaseRuleType(m.releaseRuleType);
        setIsMandatory(m.isMandatory);
        setPrerequisiteModuleId(m.prerequisiteModuleId ?? '');
        setStatus('ready');
        listModulesForCourse(m.courseId).then(setSiblingModules).catch(() => undefined);
      })
      .catch(() => setStatus('error'));
  }

  useEffect(load, [moduleId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateModule(moduleId, { title, releaseRuleType, isMandatory, prerequisiteModuleId: prerequisiteModuleId || null });
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not save module.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setError(null);
    try {
      await updateModule(moduleId, { status: module_?.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' });
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not change module status.');
    }
  }

  async function handleReleaseNow() {
    setError(null);
    try {
      await releaseModuleNow(moduleId);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not release this module.');
    }
  }

  if (status === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (status === 'error' || !module_) return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load this module.</p>;

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate(`/lms-courses/${module_.courseId}`)} className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Back to course
      </button>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{module_.title}</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{module_.status}</span>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Module details</h2>
        <div className="mt-3 flex flex-col gap-3">
          <label className="text-sm">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="text-sm">
            Release rule
            <select value={releaseRuleType} onChange={(e) => setReleaseRuleType(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
              {RELEASE_RULE_TYPES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isMandatory} onChange={(e) => setIsMandatory(e.target.checked)} />
            Mandatory
          </label>
          <div>
            <label className="text-sm">
              Prerequisite module
              <select value={prerequisiteModuleId} onChange={(e) => setPrerequisiteModuleId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
                <option value="">None — no prerequisite</option>
                {siblingModules
                  .filter((m) => m.id !== module_.id && m.position < module_.position)
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
              </select>
            </label>
            <p className="mt-1 text-xs text-slate-400">Only modules earlier in the course sequence can be a prerequisite.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !title.trim()} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button onClick={handlePublish} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200">
              {module_.status === 'PUBLISHED' ? 'Unpublish (move to Draft)' : 'Publish'}
            </button>
            {module_.releaseRuleType !== 'IMMEDIATE' && module_.releaseRuleType !== 'COHORT_SCHEDULE' && (
              <button onClick={handleReleaseNow} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200">
                Release now
              </button>
            )}
            {module_.releaseRuleType === 'COHORT_SCHEDULE' && (
              <p className="self-center text-xs text-slate-400">Set each cohort's unlock date from the course's Cohorts page.</p>
            )}
          </div>
        </div>
      </section>

      <LessonsSection moduleId={moduleId} onError={setError} />
      <ProjectsSection moduleId={moduleId} onError={setError} />
    </div>
  );
}

/** 004 Project-based Learning batch (FR-077) — this module's final project(s). Artifact linking/status-management happens on the dedicated `ProjectEditorPage.tsx`, reached via "Manage". */
function ProjectsSection({ moduleId, onError }: { moduleId: string; onError: (e: string | null) => void }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    listProjectsForModule(moduleId)
      .then(setProjects)
      .catch(() => undefined);
  }

  useEffect(load, [moduleId]);

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    onError(null);
    try {
      await createProject(moduleId, { title: title.trim(), description: description.trim() || undefined });
      setTitle('');
      setDescription('');
      load();
    } catch (err) {
      onError((err as NormalizedApiError).message ?? 'Could not create project.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Projects (FR-077)</h2>
      <p className="mt-1 text-xs text-slate-400">A project combines multiple required-artifact assignments; a PUBLISHED project's artifacts must all be approved before this module can be completed.</p>
      <ul className="mt-3 flex flex-col gap-2">
        {projects.map((p) => (
          <li key={p.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
            <span className="font-medium text-slate-800 dark:text-slate-100">{p.title}</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{p.status}</span>
              <button onClick={() => navigate(`/projects/${p.id}`)} className="text-brand-600 hover:text-brand-700 dark:text-brand-400">
                Manage
              </button>
            </div>
          </li>
        ))}
        {projects.length === 0 && <p className="text-sm text-slate-400">No projects yet.</p>}
      </ul>
      <div className="mt-4 flex items-end gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <button onClick={handleCreate} disabled={creating || !title.trim()} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          + Add project
        </button>
      </div>
    </section>
  );
}

function LessonsSection({ moduleId, onError }: { moduleId: string; onError: (e: string | null) => void }) {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<AdminLessonFull[]>([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    listLessonsForModule(moduleId)
      .then((rows) => setLessons(rows.sort((a, b) => a.position - b.position)))
      .catch(() => undefined);
  }

  useEffect(load, [moduleId]);

  async function handleCreate() {
    if (!title.trim() || !slug.trim()) return;
    setCreating(true);
    onError(null);
    try {
      await createLesson(moduleId, { title: title.trim(), slug: slug.trim() });
      setTitle('');
      setSlug('');
      load();
    } catch (err) {
      onError((err as NormalizedApiError).message ?? 'Could not create lesson.');
    } finally {
      setCreating(false);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= lessons.length) return;
    const reordered = [...lessons];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setLessons(reordered);
    await reorderLessons(moduleId, reordered.map((l) => l.id));
  }

  async function handleArchive(lessonId: string) {
    await archiveLesson(lessonId);
    load();
  }

  async function handleRestore(lessonId: string) {
    await restoreLesson(lessonId);
    load();
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Lessons</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {lessons.map((l, index) => (
          <li key={l.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
            <button onClick={() => navigate(`/lms-lessons/${l.id}`)} className="text-left font-medium text-slate-800 hover:text-brand-600 dark:text-slate-100">
              {l.title}
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{l.status}</span>
              <button onClick={() => handleMove(index, -1)} disabled={index === 0} className="disabled:opacity-30">
                ↑
              </button>
              <button onClick={() => handleMove(index, 1)} disabled={index === lessons.length - 1} className="disabled:opacity-30">
                ↓
              </button>
              {l.status === 'ARCHIVED' ? (
                <button onClick={() => handleRestore(l.id)} className="text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  Restore
                </button>
              ) : (
                <button onClick={() => handleArchive(l.id)} className="text-red-600 hover:text-red-700 dark:text-red-400">
                  Archive
                </button>
              )}
            </div>
          </li>
        ))}
        {lessons.length === 0 && <p className="text-sm text-slate-400">No lessons yet.</p>}
      </ul>
      <div className="mt-4 flex items-end gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lesson title" className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="lesson-slug" className="w-48 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <button onClick={handleCreate} disabled={creating || !title.trim() || !slug.trim()} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          + Add lesson
        </button>
      </div>
    </section>
  );
}
