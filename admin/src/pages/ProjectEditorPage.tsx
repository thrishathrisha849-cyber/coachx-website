import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getProject,
  updateProject,
  changeProjectStatus,
  linkArtifact,
  unlinkArtifact,
  listCandidateAssignmentsForModule,
  type AdminProjectWithArtifacts,
  type CandidateAssignment,
} from '@/api/project.api';
import type { NormalizedApiError } from '@/api/client';

const VALID_TRANSITIONS: Record<string, string[]> = { DRAFT: ['PUBLISHED', 'ARCHIVED'], PUBLISHED: ['ARCHIVED', 'DRAFT'], ARCHIVED: ['DRAFT'] };

/** 004 Project-based Learning batch (FR-077) — links/unlinks existing assignments as required artifacts, and manages the project's own DRAFT/PUBLISHED/ARCHIVED lifecycle. Each artifact's OWN submission/review flow is managed on the existing assignment pages (`AssignmentEditorPage.tsx`/`SubmissionReviewPage.tsx`), unchanged. */
export function ProjectEditorPage() {
  const { projectId = '' } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<AdminProjectWithArtifacts | null>(null);
  const [candidates, setCandidates] = useState<CandidateAssignment[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    getProject(projectId)
      .then((p) => {
        setProject(p);
        setTitle(p.title);
        setDescription(p.description ?? '');
        setStatus('ready');
        listCandidateAssignmentsForModule(p.moduleId, p.id)
          .then((rows) => setCandidates(rows.filter((r) => !r.alreadyLinked)))
          .catch(() => undefined);
      })
      .catch(() => setStatus('error'));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [projectId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateProject(projectId, { title, description: description || null });
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not save project.');
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') {
    setError(null);
    try {
      await changeProjectStatus(projectId, newStatus);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not change project status.');
    }
  }

  async function handleLink() {
    if (!selectedCandidateId) return;
    setError(null);
    try {
      await linkArtifact(projectId, selectedCandidateId);
      setSelectedCandidateId('');
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not link this assignment.');
    }
  }

  async function handleUnlink(assignmentId: string) {
    setError(null);
    try {
      await unlinkArtifact(projectId, assignmentId);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not unlink this assignment.');
    }
  }

  if (status === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (status === 'error' || !project) return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load this project.</p>;

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate(`/lms-modules/${project.moduleId}`)} className="text-sm font-medium text-brand-600 hover:text-brand-700">
        ← Back to module
      </button>

      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{project.title}</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{project.status}</span>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Project details</h2>
        <div className="mt-3 flex flex-col gap-3">
          <label className="text-sm">
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="text-sm">
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !title.trim()} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            {(VALID_TRANSITIONS[project.status] ?? []).map((next) => (
              <button
                key={next}
                onClick={() => handleStatusChange(next as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200"
              >
                Move to {next}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Required artifacts ({project.artifacts.length})</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {project.artifacts.map((a) => (
            <li key={a.assignmentId} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
              <button onClick={() => navigate(`/assignments/${a.assignmentId}`)} className="text-left font-medium text-slate-800 hover:text-brand-600 dark:text-slate-100">
                {a.title}
              </button>
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{a.status}</span>
                <button onClick={() => handleUnlink(a.assignmentId)} className="text-red-600 hover:text-red-700 dark:text-red-400">
                  Unlink
                </button>
              </div>
            </li>
          ))}
          {project.artifacts.length === 0 && <p className="text-sm text-slate-400">No artifacts linked yet.</p>}
        </ul>

        <div className="mt-4 flex items-end gap-2">
          <label className="flex-1 text-sm">
            Link an existing assignment
            <select
              value={selectedCandidateId}
              onChange={(e) => setSelectedCandidateId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="">Select an assignment…</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.status})
                </option>
              ))}
            </select>
          </label>
          <button onClick={handleLink} disabled={!selectedCandidateId} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
            Link
          </button>
        </div>
        {candidates.length === 0 && (
          <p className="mt-2 text-xs text-slate-400">No unlinked assignments in this module — create one on a lesson first, then come back here to link it.</p>
        )}
      </section>
    </div>
  );
}
