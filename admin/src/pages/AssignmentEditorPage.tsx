import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  getAssignment,
  createAssignment,
  changeAssignmentStatus,
  createCriterion,
  archiveCriterion,
  type AdminAssignmentWithRubric,
  type AdminRubricCriterion,
} from '@/api/assignment.api';
import type { NormalizedApiError } from '@/api/client';

const SUBMISSION_FORMATS = ['TEXT', 'LINK', 'FILE_URL', 'IMAGE_URL', 'AUDIO_URL', 'VIDEO_URL'];
const LATE_POLICIES = ['ACCEPT', 'REJECT'];
const VALID_TRANSITIONS: Record<string, string[]> = { DRAFT: ['PUBLISHED', 'ARCHIVED'], PUBLISHED: ['ARCHIVED', 'DRAFT'], ARCHIVED: ['DRAFT'] };

/** 004 US4 Assignment System batch — create-assignment form (when no assignmentId yet) and the settings + rubric editor once one exists. */
export function AssignmentEditorPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = assignmentId === 'new';
  const lessonId = searchParams.get('lessonId') ?? '';

  if (isNew) return <CreateAssignmentForm lessonId={lessonId} onCreated={(id) => navigate(`/assignments/${id}`, { replace: true })} />;
  return <AssignmentManager assignmentId={assignmentId!} />;
}

function CreateAssignmentForm({ lessonId, onCreated }: { lessonId: string; onCreated: (assignmentId: string) => void }) {
  const [title, setTitle] = useState('');
  const [submissionFormat, setSubmissionFormat] = useState('TEXT');
  const [maxScore, setMaxScore] = useState(100);
  const [passingScore, setPassingScore] = useState(70);
  const [latePolicy, setLatePolicy] = useState('ACCEPT');
  const [dueAt, setDueAt] = useState('');
  const [peerReviewEnabled, setPeerReviewEnabled] = useState(false);
  const [peerReviewsRequired, setPeerReviewsRequired] = useState(2);
  const [peerReviewAnonymous, setPeerReviewAnonymous] = useState(true);
  const [peerReviewIncludeInGrade, setPeerReviewIncludeInGrade] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const assignment = await createAssignment(lessonId, {
        title,
        submissionFormat,
        allowedFileTypes: [],
        dueAt: dueAt ? new Date(dueAt).toISOString() : null,
        maxScore,
        passingScore,
        latePolicy,
        maxAttempts: null,
        peerReviewEnabled,
        peerReviewsRequired: peerReviewEnabled ? peerReviewsRequired : 0,
        peerReviewAnonymous,
        peerReviewIncludeInGrade,
      });
      onCreated(assignment.id);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not create assignment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!lessonId) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">No lessonId provided — go back to the Assignments page and pick a lesson.</p>;
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Create assignment</h1>
      <div className="mt-4 flex flex-col gap-3">
        <label className="text-sm">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </label>
        <label className="text-sm">
          Submission format
          <select value={submissionFormat} onChange={(e) => setSubmissionFormat(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
            {SUBMISSION_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <div className="flex gap-3">
          <label className="flex-1 text-sm">
            Max score
            <input type="number" value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <label className="flex-1 text-sm">
            Passing score
            <input type="number" value={passingScore} onChange={(e) => setPassingScore(Number(e.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </label>
        </div>
        <label className="text-sm">
          Late policy
          <select value={latePolicy} onChange={(e) => setLatePolicy(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900">
            {LATE_POLICIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Due date (optional)
          <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </label>

        <div className="rounded-md border border-dashed border-slate-300 p-3 dark:border-slate-700">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={peerReviewEnabled} onChange={(e) => setPeerReviewEnabled(e.target.checked)} />
            Enable peer review (FR-076)
          </label>
          {peerReviewEnabled && (
            <div className="mt-3 flex flex-col gap-3">
              <label className="text-sm">
                Reviews required per submission
                <input
                  type="number"
                  min={1}
                  value={peerReviewsRequired}
                  onChange={(e) => setPeerReviewsRequired(Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={peerReviewAnonymous} onChange={(e) => setPeerReviewAnonymous(e.target.checked)} />
                Anonymous to the submitter
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={peerReviewIncludeInGrade} onChange={(e) => setPeerReviewIncludeInGrade(e.target.checked)} />
                Surface peer score to the instructor as informing the grade
              </label>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button onClick={handleSubmit} disabled={submitting || !title} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {submitting ? 'Creating…' : 'Create assignment'}
        </button>
      </div>
    </div>
  );
}

function AssignmentManager({ assignmentId }: { assignmentId: string }) {
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<AdminAssignmentWithRubric | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  function load() {
    getAssignment(assignmentId)
      .then((a) => {
        setAssignment(a);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }

  useEffect(load, [assignmentId]);

  async function handleStatusChange(newStatus: string) {
    try {
      await changeAssignmentStatus(assignmentId, newStatus);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not change status.');
    }
  }

  if (status === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (status === 'error' || !assignment) return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load this assignment.</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{assignment.title}</h1>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">{assignment.status}</span>
      </div>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {assignment.submissionFormat} · Max {assignment.maxScore} pts, passing {assignment.passingScore} · Late policy: {assignment.latePolicy}
        {assignment.dueAt && ` · Due ${new Date(assignment.dueAt).toLocaleString()}`}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {assignment.peerReviewEnabled
          ? `Peer review: ${assignment.peerReviewsRequired} required, ${assignment.peerReviewAnonymous ? 'anonymous' : 'identity visible'}${assignment.peerReviewIncludeInGrade ? ', informs grade' : ''}`
          : 'Peer review: disabled'}
      </p>

      <div className="mt-3 flex gap-2">
        {(VALID_TRANSITIONS[assignment.status] ?? []).map((next) => (
          <button key={next} onClick={() => handleStatusChange(next)} className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200">
            Move to {next}
          </button>
        ))}
        <button onClick={() => navigate(`/assignments/${assignmentId}/submissions`)} className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700">
          View submissions
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Rubric ({assignment.rubricCriteria.length} criteria)</h2>
      <div className="mt-3 flex flex-col gap-2">
        {assignment.rubricCriteria.map((c) => (
          <CriterionRow key={c.id} criterion={c} onChanged={load} />
        ))}
      </div>

      <AddCriterionForm assignmentId={assignmentId} onAdded={load} />
    </div>
  );
}

function CriterionRow({ criterion, onChanged }: { criterion: AdminRubricCriterion; onChanged: () => void }) {
  async function handleArchive() {
    await archiveCriterion(criterion.id);
    onChanged();
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-white">{criterion.title}</p>
        {criterion.description && <p className="text-xs text-slate-500 dark:text-slate-400">{criterion.description}</p>}
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400">{criterion.maxPoints} pts</span>
        <button onClick={handleArchive} className="text-red-600 hover:text-red-700 dark:text-red-400">Archive</button>
      </div>
    </div>
  );
}

function AddCriterionForm({ assignmentId, onAdded }: { assignmentId: string; onAdded: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [maxPoints, setMaxPoints] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await createCriterion(assignmentId, { title, description: description || undefined, maxPoints });
      setTitle('');
      setDescription('');
      onAdded();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not add criterion.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Add rubric criterion</h3>
      <div className="mt-3 flex flex-col gap-3">
        <div className="flex gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Criterion title" className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input type="number" value={maxPoints} onChange={(e) => setMaxPoints(Number(e.target.value))} placeholder="Max points" className="w-28 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        </div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900" />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button onClick={handleSubmit} disabled={submitting || !title} className="self-start rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
          {submitting ? 'Adding…' : 'Add criterion'}
        </button>
      </div>
    </div>
  );
}
