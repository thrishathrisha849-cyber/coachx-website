import { useEffect, useState } from 'react';
import { listOrganizations, createOrganization, type Organization } from '@/api/organizations.api';
import type { NormalizedApiError } from '@/api/client';

/** 001 FR-053/FR-086 — Organization catalog management (platform_admin/super_admin, `organization.create`). */
export function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  function load() {
    setStatus('loading');
    listOrganizations()
      .then((result) => {
        setOrgs(result.rows);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load organizations.');
        setStatus('error');
      });
  }

  useEffect(load, []);

  async function handleCreate() {
    try {
      await createOrganization({ name, slug });
      setName('');
      setSlug('');
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Failed to create organization.');
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Organizations</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">001 FR-053/FR-086 — Organization-tier accounts and their own-org data scope.</p>

      <div className="mt-6 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Organization name"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button onClick={handleCreate} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          Create
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {status === 'ready' && (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="text-slate-500 dark:text-slate-400">
            <tr>
              <th className="pb-2">Name</th>
              <th className="pb-2">Slug</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id} className="border-t border-slate-200 dark:border-slate-800">
                <td className="py-2">{org.name}</td>
                <td className="py-2 text-slate-500">{org.slug}</td>
                <td className="py-2">{org.status}</td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr>
                <td colSpan={3} className="py-4 text-slate-400">No organizations yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
