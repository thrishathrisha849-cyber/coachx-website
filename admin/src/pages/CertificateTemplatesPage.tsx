import { useEffect, useState } from 'react';
import {
  listTemplates,
  createTemplate,
  updateTemplate,
  mapCourseTemplate,
  type AdminCertificateTemplate,
} from '@/api/certificate.api';
import type { NormalizedApiError } from '@/api/client';

/** 004 US5 Certificate System batch — admin CRUD for certificate templates (FR-082) plus per-course template mapping (FR-084). Reuses `course.module.manage`, same authoring tier as quiz/assignment content. */
export function CertificateTemplatesPage() {
  const [templates, setTemplates] = useState<AdminCertificateTemplate[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [creating, setCreating] = useState(false);

  const [mapCourseId, setMapCourseId] = useState('');
  const [mapTemplateId, setMapTemplateId] = useState('');
  const [mapping, setMapping] = useState(false);
  const [mapResult, setMapResult] = useState<string | null>(null);

  function load() {
    listTemplates()
      .then((rows) => {
        setTemplates(rows);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load certificate templates.');
        setStatus('error');
      });
  }

  useEffect(load, []);

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createTemplate({ name: name.trim(), primaryColor: primaryColor.trim() || undefined, language: 'EN' });
      setName('');
      setPrimaryColor('');
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not create template.');
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(template: AdminCertificateTemplate) {
    await updateTemplate(template.id, { isActive: !template.isActive });
    load();
  }

  async function handleMapCourse() {
    if (!mapCourseId.trim()) return;
    setMapping(true);
    setMapResult(null);
    try {
      await mapCourseTemplate(mapCourseId.trim(), mapTemplateId || null);
      setMapResult('Mapped successfully.');
    } catch (err) {
      setMapResult((err as NormalizedApiError).message ?? 'Could not map this course.');
    } finally {
      setMapping(false);
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Certificate Templates</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">FR-082/FR-084 — manage certificate templates and map them to courses.</p>

      <div className="mt-6 flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Default Certificate"
            className="mt-1 w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Primary color (optional)</label>
          <input
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            placeholder="#1d4ed8"
            className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={creating || !name.trim()}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {creating ? 'Creating…' : 'Create template'}
        </button>
      </div>

      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {status === 'ready' && (
        <ul className="mt-6 flex flex-col gap-2">
          {templates.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
              <div>
                <span className="font-medium text-slate-800 dark:text-slate-100">{t.name}</span>
                <span className="ml-2 text-xs text-slate-400">{t.id}</span>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    t.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {t.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => handleToggleActive(t)} className="text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  {t.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </li>
          ))}
          {templates.length === 0 && <p className="text-sm text-slate-400">No certificate templates yet.</p>}
        </ul>
      )}

      <div className="mt-8 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Map a course to a template</h2>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Course ID</label>
            <input
              value={mapCourseId}
              onChange={(e) => setMapCourseId(e.target.value)}
              className="mt-1 w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Template</label>
            <select
              value={mapTemplateId}
              onChange={(e) => setMapTemplateId(e.target.value)}
              className="mt-1 w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">— None (unstyled) —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleMapCourse}
            disabled={mapping || !mapCourseId.trim()}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {mapping ? 'Mapping…' : 'Map'}
          </button>
        </div>
        {mapResult && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{mapResult}</p>}
      </div>
    </div>
  );
}
