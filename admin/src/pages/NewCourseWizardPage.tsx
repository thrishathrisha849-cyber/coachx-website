import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCategoriesAdmin, createCourse, createModule, createLesson, type AdminCourseCategory } from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

const STEPS = ['Basics', 'Details', 'First module', 'First lesson', 'Review & create'] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * T092-T095 — the "distinct step-by-step wizard chrome" US7's Independent
 * Test names, deliberately scoped to the CREATION path only. The existing
 * `CourseEditorPage.tsx` (LMS Admin UI batch) already has full parity for
 * ONGOING editing — a flat multi-section editor, not a wizard — and stays
 * exactly as it is; this page hands off to it once the new course/module/
 * lesson are created. No backend changes were needed: every step reuses
 * an already-built, already-tested `/lms/admin/*` endpoint.
 */
export function NewCourseWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [categories, setCategories] = useState<AdminCourseCategory[]>([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [categoryId, setCategoryId] = useState('');

  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  const [moduleTitle, setModuleTitle] = useState('Module 1');

  const [lessonTitle, setLessonTitle] = useState('Lesson 1');
  const [lessonSlug, setLessonSlug] = useState('lesson-1');
  const [lessonSlugTouched, setLessonSlugTouched] = useState(false);

  useEffect(() => {
    listCategoriesAdmin().then(setCategories).catch(() => setCategories([]));
  }, []);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleLessonTitleChange(value: string) {
    setLessonTitle(value);
    if (!lessonSlugTouched) setLessonSlug(slugify(value));
  }

  const canProceed =
    step === 0 ? Boolean(title.trim() && slug.trim() && categoryId) : step === 2 ? Boolean(moduleTitle.trim()) : step === 3 ? Boolean(lessonTitle.trim() && lessonSlug.trim()) : true;

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const course = await createCourse({
        title: title.trim(),
        slug: slug.trim(),
        categoryId,
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim() || undefined,
        thumbnailUrl: thumbnailUrl.trim() || undefined,
      });
      const module_ = await createModule(course.id, { title: moduleTitle.trim() });
      await createLesson(module_.id, { title: lessonTitle.trim(), slug: lessonSlug.trim() });
      navigate(`/lms-courses/${course.id}`);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not create the course.');
      setCreating(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">New Course</h1>

      <ol className="mt-4 flex items-center gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full font-semibold ${
                i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              {i + 1}
            </span>
            <span className={i === step ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-400'}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 text-slate-300">→</span>}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        {step === 0 && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Title</span>
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Slug</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Category</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Short description</span>
              <input
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Full description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Thumbnail URL</span>
              <input
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://…"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <p className="text-xs text-slate-400">All optional — every field here can also be filled in later from the course editor.</p>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">Every course needs at least one module to start. You can add more, reorder, and edit this one later.</p>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Module title</span>
              <input
                value={moduleTitle}
                onChange={(e) => setModuleTitle(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">And at least one lesson inside that module.</p>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Lesson title</span>
              <input
                value={lessonTitle}
                onChange={(e) => handleLessonTitleChange(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700 dark:text-slate-200">Lesson slug</span>
              <input
                value={lessonSlug}
                onChange={(e) => {
                  setLessonSlug(e.target.value);
                  setLessonSlugTouched(true);
                }}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
              />
            </label>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-2 text-sm">
            <p>
              <span className="font-medium text-slate-700 dark:text-slate-200">Course:</span> {title} (/{slug})
            </p>
            <p>
              <span className="font-medium text-slate-700 dark:text-slate-200">Category:</span> {categories.find((c) => c.id === categoryId)?.name ?? '—'}
            </p>
            <p>
              <span className="font-medium text-slate-700 dark:text-slate-200">Module:</span> {moduleTitle}
            </p>
            <p>
              <span className="font-medium text-slate-700 dark:text-slate-200">Lesson:</span> {lessonTitle} (/{lessonSlug})
            </p>
            <p className="mt-2 text-xs text-slate-400">
              The course is created as a DRAFT — everything else (pricing, more modules/lessons, publish workflow) is done from the course editor
              after this wizard finishes.
            </p>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-4 flex justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || creating}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
          >
            Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!canProceed}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {creating ? 'Creating…' : 'Create course'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
