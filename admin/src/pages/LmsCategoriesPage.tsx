import { useEffect, useState } from 'react';
import {
  listCategoriesAdmin,
  createCategory,
  archiveCategory,
  restoreCategory,
  type AdminCourseCategory,
} from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

/** LMS Admin UI batch — course category CRUD (FR-002-adjacent catalog taxonomy). */
export function LmsCategoriesPage() {
  const [categories, setCategories] = useState<AdminCourseCategory[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'ARCHIVED' | ''>('');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [creating, setCreating] = useState(false);

  function load() {
    setStatus('loading');
    listCategoriesAdmin(statusFilter ? { status: statusFilter } : undefined)
      .then((rows) => {
        setCategories(rows);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load categories.');
        setStatus('error');
      });
  }

  useEffect(load, [statusFilter]);

  async function handleCreate() {
    if (!name.trim() || !slug.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createCategory({ name: name.trim(), slug: slug.trim() });
      setName('');
      setSlug('');
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not create category.');
    } finally {
      setCreating(false);
    }
  }

  async function handleArchive(id: string) {
    await archiveCategory(id);
    load();
  }

  async function handleRestore(id: string) {
    await restoreCategory(id);
    load();
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Course Categories</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Catalog taxonomy used by course discovery and the course builder.</p>

      <div className="mt-6 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
            Slug
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. business-fundamentals"
              className="mt-1 w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-normal normal-case dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating || !name.trim() || !slug.trim()}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {creating ? 'Creating…' : 'Create category'}
        </button>
      </div>

      <div className="mt-4 flex gap-2 text-sm">
        {(['', 'ACTIVE', 'ARCHIVED'] as const).map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`rounded-md px-3 py-1 ${statusFilter === s ? 'bg-brand-600 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {status === 'ready' && (
        <ul className="mt-6 flex flex-col gap-2">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
              <div>
                <span className="font-medium text-slate-800 dark:text-slate-100">{c.name}</span>
                <span className="ml-2 text-xs text-slate-400">/{c.slug}</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {c.status}
                </span>
                {c.status === 'ACTIVE' ? (
                  <button onClick={() => handleArchive(c.id)} className="text-red-600 hover:text-red-700 dark:text-red-400">
                    Archive
                  </button>
                ) : (
                  <button onClick={() => handleRestore(c.id)} className="text-brand-600 hover:text-brand-700 dark:text-brand-400">
                    Restore
                  </button>
                )}
              </div>
            </li>
          ))}
          {categories.length === 0 && <p className="text-sm text-slate-400">No categories yet.</p>}
        </ul>
      )}
    </div>
  );
}
