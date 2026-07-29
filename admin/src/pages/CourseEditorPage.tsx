import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getCourseAdminFull,
  updateCourse,
  changeCourseStatus,
  listCourseInstructors,
  assignCourseInstructor,
  removeCourseInstructor,
  setPrimaryCourseInstructor,
  listModulesForCourse,
  createModule,
  reorderModules,
  archiveModule,
  restoreModule,
  listCategoriesAdmin,
  cloneCourse,
  COURSE_CLONE_MODES,
  type AdminCourseFull,
  type AdminCourseInstructor,
  type AdminCourseModuleFull,
  type AdminCourseCategory,
  type CourseCloneMode,
} from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

/** 004 FR-100/COURSE_LIFECYCLE.md's exact state machine — mirrors `course-lifecycle.policy.ts` so the UI never offers a transition the server would reject. */
const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SUBMITTED_FOR_REVIEW'],
  SUBMITTED_FOR_REVIEW: ['CHANGES_REQUESTED', 'APPROVED'],
  CHANGES_REQUESTED: ['SUBMITTED_FOR_REVIEW', 'DRAFT'],
  APPROVED: ['SCHEDULED', 'PUBLISHED'],
  SCHEDULED: ['PUBLISHED', 'APPROVED'],
  PUBLISHED: ['UNLISTED', 'ENROLLMENT_PAUSED', 'ARCHIVED'],
  UNLISTED: ['PUBLISHED', 'ARCHIVED'],
  ENROLLMENT_PAUSED: ['PUBLISHED', 'ARCHIVED'],
  ARCHIVED: ['DRAFT', 'RETIRED'],
  RETIRED: [],
};

/** LMS Admin UI batch — course-builder core: metadata, status workflow, instructors, and modules (T088-T103). */
export function CourseEditorPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<AdminCourseFull | null>(null);
  const [categories, setCategories] = useState<AdminCourseCategory[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  function load() {
    getCourseAdminFull(id)
      .then((c) => {
        setCourse(c);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  useEffect(load, [id]);
  useEffect(() => {
    listCategoriesAdmin({ status: 'ACTIVE' }).then(setCategories).catch(() => undefined);
  }, []);

  if (status === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (status === 'error' || !course) return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load this course.</p>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{course.title}</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{course.status}</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">/{course.slug}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => navigate(`/lms-courses/${id}/enrollments`)} className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200">
          Manage enrollments
        </button>
        <button onClick={() => navigate(`/lms-courses/${id}/analytics`)} className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200">
          Analytics &amp; at-risk learners
        </button>
        <button onClick={() => navigate('/course-certificates')} className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200">
          View certificates
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <StatusSection course={course} onChanged={load} onError={setError} />
      <MetadataSection course={course} categories={categories} onChanged={load} onError={setError} />
      <InstructorsSection courseId={id} onError={setError} />
      <ModulesSection courseId={id} onError={setError} />
      <CloneSection courseId={id} onError={setError} />
    </div>
  );
}

const CLONE_MODE_LABELS: Record<CourseCloneMode, string> = {
  FULL: 'Full clone (everything except enrollments/progress/financial data)',
  CURRICULUM_ONLY: 'Curriculum only (modules/lessons structure, no activities/assessments)',
  CONTENT_WITHOUT_ENROLLMENTS: 'Content without enrollments (everything except instructors)',
  ASSESSMENT_BANK: 'Assessment bank (not yet supported — see below)',
  CERTIFICATE_SETTINGS: 'Certificate settings only (empty course pre-configured with the source certificate)',
  TRANSLATION_VARIANT: 'Translation variant (linked to the source as a language variant)',
};

/** 004 US8 (Course Cloning batch) — FR-098's six named modes, produces an independent draft course via `POST /admin/courses/:id/clone`. */
function CloneSection({ courseId, onError }: { courseId: string; onError: (e: string | null) => void }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CourseCloneMode>('FULL');
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState('');
  const [cloning, setCloning] = useState(false);

  async function handleClone() {
    if (!slug.trim()) return;
    setCloning(true);
    onError(null);
    try {
      const cloned = await cloneCourse(courseId, {
        mode,
        slug: slug.trim(),
        title: title.trim() || undefined,
        language: mode === 'TRANSLATION_VARIANT' && language ? language : undefined,
      });
      navigate(`/lms-courses/${cloned.id}`);
    } catch (err) {
      onError((err as NormalizedApiError).message ?? 'Could not clone this course.');
    } finally {
      setCloning(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Clone this course</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Produces a brand-new, independent draft course — never copies enrollments, learner progress, or financial data.
      </p>
      <div className="mt-3 flex flex-col gap-3">
        <label className="text-sm">
          Mode
          <select value={mode} onChange={(e) => setMode(e.target.value as CourseCloneMode)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900">
            {COURSE_CLONE_MODES.map((m) => (
              <option key={m} value={m}>
                {CLONE_MODE_LABELS[m]}
              </option>
            ))}
          </select>
        </label>
        {mode === 'ASSESSMENT_BANK' && (
          <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
            Not yet supported — quizzes/assignments in this codebase belong to a specific lesson, not a reusable cross-course question bank.
          </p>
        )}
        <div className="flex gap-3">
          <label className="flex-1 text-sm">
            New slug
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="flex-1 text-sm">
            New title (optional)
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900" />
          </label>
        </div>
        {mode === 'TRANSLATION_VARIANT' && (
          <label className="text-sm">
            Target language
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900">
              <option value="">Same as source</option>
              <option value="EN">EN</option>
              <option value="TA">TA</option>
              <option value="TANGLISH">TANGLISH</option>
            </select>
          </label>
        )}
        <button
          onClick={handleClone}
          disabled={cloning || !slug.trim() || mode === 'ASSESSMENT_BANK'}
          className="self-start rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {cloning ? 'Cloning…' : 'Clone course'}
        </button>
      </div>
    </section>
  );
}

function StatusSection({ course, onChanged, onError }: { course: AdminCourseFull; onChanged: () => void; onError: (e: string | null) => void }) {
  const [reviewNote, setReviewNote] = useState('');
  const transitions = VALID_TRANSITIONS[course.status] ?? [];

  async function handleTransition(next: string) {
    if (next === 'CHANGES_REQUESTED' && !reviewNote.trim()) {
      onError('A review note is required when requesting changes.');
      return;
    }
    onError(null);
    try {
      await changeCourseStatus(course.id, next, reviewNote.trim() || undefined);
      setReviewNote('');
      onChanged();
    } catch (err) {
      onError((err as NormalizedApiError).message ?? 'Could not change course status.');
    }
  }

  if (transitions.length === 0) return null;

  return (
    <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status workflow</h2>
      {transitions.includes('CHANGES_REQUESTED') && (
        <textarea
          value={reviewNote}
          onChange={(e) => setReviewNote(e.target.value)}
          placeholder="Review note (required only for 'Request changes')"
          rows={2}
          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {transitions.map((next) => (
          <button
            key={next}
            onClick={() => handleTransition(next)}
            className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200"
          >
            {next === 'CHANGES_REQUESTED' ? 'Request changes' : `Move to ${next}`}
          </button>
        ))}
      </div>
    </section>
  );
}

function MetadataSection({
  course,
  categories,
  onChanged,
  onError,
}: {
  course: AdminCourseFull;
  categories: AdminCourseCategory[];
  onChanged: () => void;
  onError: (e: string | null) => void;
}) {
  const [title, setTitle] = useState(course.title);
  const [shortDescription, setShortDescription] = useState(course.shortDescription ?? '');
  const [description, setDescription] = useState(course.description ?? '');
  const [categoryId, setCategoryId] = useState(course.categoryId ?? '');
  const [level, setLevel] = useState(course.level);
  const [priceType, setPriceType] = useState(course.priceType);
  const [priceAmountMinor, setPriceAmountMinor] = useState(course.priceAmountMinor);
  const [certificateAvailable, setCertificateAvailable] = useState(course.certificateAvailable);
  const [isFeatured, setIsFeatured] = useState(course.isFeatured);
  const [sequencingMode, setSequencingMode] = useState(course.sequencingMode);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    onError(null);
    try {
      await updateCourse(course.id, {
        title,
        shortDescription: shortDescription || undefined,
        description: description || undefined,
        categoryId: categoryId || null,
        level,
        priceType,
        priceAmountMinor: priceType === 'FREE' ? 0 : priceAmountMinor,
        certificateAvailable,
        isFeatured,
        sequencingMode,
      });
      onChanged();
    } catch (err) {
      onError((err as NormalizedApiError).message ?? 'Could not save course.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Course details</h2>
      <div className="mt-3 flex flex-col gap-3">
        <label className="text-sm">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="text-sm">
          Short description
          <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="text-sm">
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <div className="flex gap-3">
          <label className="flex-1 text-sm">
            Category
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 text-sm">
            Level
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
              {['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex gap-3">
          <label className="flex-1 text-sm">
            Price type
            <select value={priceType} onChange={(e) => setPriceType(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
              <option value="FREE">FREE</option>
              <option value="PAID">PAID</option>
            </select>
          </label>
          {priceType === 'PAID' && (
            <label className="flex-1 text-sm">
              Price (minor units, e.g. paise)
              <input
                type="number"
                value={priceAmountMinor}
                onChange={(e) => setPriceAmountMinor(Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
          )}
        </div>
        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={certificateAvailable} onChange={(e) => setCertificateAvailable(e.target.checked)} />
            Certificate available
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
            Featured
          </label>
        </div>
        <div>
          <label className="text-sm">
            Sequencing mode
            <select value={sequencingMode} onChange={(e) => setSequencingMode(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900">
              <option value="SEQUENTIAL">Sequential — each new module unlocks after the previous one</option>
              <option value="FLEXIBLE">Flexible — new modules are unlocked immediately</option>
              <option value="HYBRID">Hybrid — configure each module's release rule individually</option>
              <option value="INSTRUCTOR_CONTROLLED">Instructor-controlled — new modules require manual release</option>
            </select>
          </label>
          <p className="mt-1 text-xs text-slate-400">Applies to newly-created modules only — does not change any existing module.</p>
        </div>
        <button onClick={handleSave} disabled={saving || !title.trim()} className="self-start rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </section>
  );
}

function InstructorsSection({ courseId, onError }: { courseId: string; onError: (e: string | null) => void }) {
  const [instructors, setInstructors] = useState<AdminCourseInstructor[]>([]);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<'INSTRUCTOR' | 'TEACHING_ASSISTANT'>('INSTRUCTOR');
  const [adding, setAdding] = useState(false);

  function load() {
    listCourseInstructors(courseId).then(setInstructors).catch(() => undefined);
  }

  useEffect(load, [courseId]);

  async function handleAdd() {
    if (!userId.trim()) return;
    setAdding(true);
    onError(null);
    try {
      await assignCourseInstructor(courseId, { userId: userId.trim(), role });
      setUserId('');
      load();
    } catch (err) {
      onError((err as NormalizedApiError).message ?? 'Could not add instructor.');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(instructorUserId: string) {
    await removeCourseInstructor(courseId, instructorUserId);
    load();
  }

  async function handleSetPrimary(instructorUserId: string) {
    await setPrimaryCourseInstructor(courseId, instructorUserId);
    load();
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Instructors</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {instructors.map((i) => (
          <li key={i.userId} className="flex items-center justify-between text-sm">
            <span className="text-slate-700 dark:text-slate-200">
              {i.displayName} <span className="text-xs text-slate-400">({i.role}{i.isPrimary ? ', primary' : ''})</span>
            </span>
            <div className="flex gap-2 text-xs">
              {!i.isPrimary && (
                <button onClick={() => handleSetPrimary(i.userId)} className="text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  Set primary
                </button>
              )}
              <button onClick={() => handleRemove(i.userId)} className="text-red-600 hover:text-red-700 dark:text-red-400">
                Remove
              </button>
            </div>
          </li>
        ))}
        {instructors.length === 0 && <p className="text-sm text-slate-400">No instructors assigned yet.</p>}
      </ul>
      <div className="mt-4 flex items-end gap-2">
        <label className="text-sm">
          User ID
          <input value={userId} onChange={(e) => setUserId(e.target.value)} className="mt-1 w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="INSTRUCTOR">Instructor</option>
          <option value="TEACHING_ASSISTANT">Teaching Assistant</option>
        </select>
        <button onClick={handleAdd} disabled={adding || !userId.trim()} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          Add
        </button>
      </div>
    </section>
  );
}

function ModulesSection({ courseId, onError }: { courseId: string; onError: (e: string | null) => void }) {
  const navigate = useNavigate();
  const [modules, setModules] = useState<AdminCourseModuleFull[]>([]);
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    listModulesForCourse(courseId)
      .then((rows) => setModules(rows.sort((a, b) => a.position - b.position)))
      .catch(() => undefined);
  }

  useEffect(load, [courseId]);

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    onError(null);
    try {
      await createModule(courseId, { title: title.trim() });
      setTitle('');
      load();
    } catch (err) {
      onError((err as NormalizedApiError).message ?? 'Could not create module.');
    } finally {
      setCreating(false);
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= modules.length) return;
    const reordered = [...modules];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setModules(reordered);
    await reorderModules(courseId, reordered.map((m) => m.id));
  }

  async function handleArchive(moduleId: string) {
    await archiveModule(moduleId);
    load();
  }

  async function handleRestore(moduleId: string) {
    await restoreModule(moduleId);
    load();
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Modules</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {modules.map((m, index) => (
          <li key={m.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
            <button onClick={() => navigate(`/lms-modules/${m.id}`)} className="text-left font-medium text-slate-800 hover:text-brand-600 dark:text-slate-100">
              {m.title}
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{m.status}</span>
              <button onClick={() => handleMove(index, -1)} disabled={index === 0} className="disabled:opacity-30">
                ↑
              </button>
              <button onClick={() => handleMove(index, 1)} disabled={index === modules.length - 1} className="disabled:opacity-30">
                ↓
              </button>
              {m.status === 'ARCHIVED' ? (
                <button onClick={() => handleRestore(m.id)} className="text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  Restore
                </button>
              ) : (
                <button onClick={() => handleArchive(m.id)} className="text-red-600 hover:text-red-700 dark:text-red-400">
                  Archive
                </button>
              )}
            </div>
          </li>
        ))}
        {modules.length === 0 && <p className="text-sm text-slate-400">No modules yet.</p>}
      </ul>
      <div className="mt-4 flex items-end gap-2">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New module title" className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        <button onClick={handleCreate} disabled={creating || !title.trim()} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          + Add module
        </button>
      </div>
    </section>
  );
}
