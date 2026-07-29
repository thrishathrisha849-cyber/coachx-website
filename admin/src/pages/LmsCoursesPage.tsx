import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCoursesAdmin, createCourse, listCategoriesAdmin, type AdminCourseFull, type AdminCourseCategory } from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

const STATUS_OPTIONS = [
  'DRAFT',
  'SUBMITTED_FOR_REVIEW',
  'CHANGES_REQUESTED',
  'APPROVED',
  'SCHEDULED',
  'PUBLISHED',
  'UNLISTED',
  'ENROLLMENT_PAUSED',
  'ARCHIVED',
  'RETIRED',
];

/** LMS Admin UI batch — the admin course list + create-course entry point into the course builder (T088-T103). */
export function LmsCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<AdminCourseFull[]>([]);
  const [categories, setCategories] = useState<AdminCourseCategory[]>([]);
  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    setLoadStatus('loading');
    listCoursesAdmin({ q: q.trim() || undefined, status: statusFilter || undefined, pageSize: 100 })
      .then((res) => {
        setCourses(res.data);
        setLoadStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load courses.');
        setLoadStatus('error');
      });
  }

  useEffect(() => {
    listCategoriesAdmin({ status: 'ACTIVE' }).then(setCategories).catch(() => undefined);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [statusFilter]);

  async function handleCreate() {
    if (!title.trim() || !slug.trim() || !categoryId) return;
    setCreating(true);
    setError(null);
    try {
      const course = await createCourse({ title: title.trim(), slug: slug.trim(), categoryId });
      navigate(`/lms-courses/${course.id}`);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not create course.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Courses</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Course builder — create, edit, and publish courses.</p>
        </div>
        <button onClick={() => setShowCreate((v) => !v)} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          + New course
        </button>
      </div>

      {showCreate && (
        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              Title
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900" />
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              Slug
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className="mt-1 w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900" />
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
              Category
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="mt-1 w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900">
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !title.trim() || !slug.trim() || !categoryId}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {creating ? 'Creating…' : 'Create'}
          </button>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Search title…"
          className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button onClick={load} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200">
          Search
        </button>
      </div>

      {loadStatus === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loadStatus === 'ready' && (
        <ul className="mt-6 flex flex-col gap-2">
          {courses.map((course) => (
            <li key={course.id}>
              <button
                onClick={() => navigate(`/lms-courses/${course.id}`)}
                className="flex w-full items-center justify-between rounded-md border border-slate-200 p-3 text-left text-sm hover:border-brand-400 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <span className="font-medium text-slate-800 dark:text-slate-100">{course.title}</span>
                  <span className="ml-2 text-xs text-slate-400">/{course.slug}</span>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{course.status}</span>
              </button>
            </li>
          ))}
          {courses.length === 0 && <p className="text-sm text-slate-400">No courses found.</p>}
        </ul>
      )}
    </div>
  );
}
