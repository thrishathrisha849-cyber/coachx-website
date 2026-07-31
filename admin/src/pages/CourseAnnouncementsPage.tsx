import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  listAnnouncementsAdmin,
  createAnnouncementAdmin,
  publishAnnouncementAdmin,
  archiveAnnouncementAdmin,
  type AdminAnnouncement,
  type AnnouncementPriority,
} from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

const PRIORITIES: AnnouncementPriority[] = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

/** 004 Course Announcements batch (FR-102) — admin create/publish/archive, per course. */
export function CourseAnnouncementsPage() {
  const { id: courseId = '' } = useParams<{ id: string }>();
  const [announcements, setAnnouncements] = useState<AdminAnnouncement[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('NORMAL');
  const [sendEmail, setSendEmail] = useState(false);
  const [creating, setCreating] = useState(false);

  function load() {
    setStatus('loading');
    listAnnouncementsAdmin(courseId)
      .then((data) => {
        setAnnouncements(data);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load announcements.');
        setStatus('error');
      });
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [courseId]);

  async function handleCreate() {
    if (!title.trim() || !message.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await createAnnouncementAdmin(courseId, {
        title: title.trim(),
        message: message.trim(),
        priority,
        channels: sendEmail ? ['IN_APP', 'EMAIL'] : ['IN_APP'],
      });
      setTitle('');
      setMessage('');
      setPriority('NORMAL');
      setSendEmail(false);
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not create announcement.');
    } finally {
      setCreating(false);
    }
  }

  async function runAction(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    setError(null);
    try {
      await action();
      load();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Action failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Course Announcements</h1>
      <p className="mt-1 text-xs text-slate-400">Course ID: {courseId}</p>

      <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-4 dark:border-slate-700">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">New announcement</h2>
        <div className="mt-3 flex flex-col gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message"
            rows={3}
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <div className="flex items-center gap-3">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} />
              Also email enrolled learners on publish
            </label>
          </div>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={creating || !title.trim() || !message.trim()}
            className="self-start rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {creating ? 'Creating…' : 'Create draft'}
          </button>
        </div>
      </div>

      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {status === 'error' && <p className="mt-6 text-sm text-red-600 dark:text-red-400">Couldn't load announcements.</p>}

      {status === 'ready' && (
        <ul className="mt-6 flex flex-col gap-3">
          {announcements.map((a) => (
            <li key={a.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{a.title}</span>
                  <span className="ml-2 text-xs text-slate-400">{a.priority}</span>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {a.status}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{a.message}</p>
              <p className="mt-1 text-xs text-slate-400">
                Channels: {a.channels.join(', ')}
                {a.emailSentAt && ` · Email sent ${new Date(a.emailSentAt).toLocaleString()}`}
              </p>
              <div className="mt-2 flex gap-2">
                {a.status === 'DRAFT' && (
                  <button
                    disabled={busyId === a.id}
                    onClick={() => runAction(a.id, () => publishAnnouncementAdmin(a.id))}
                    className="rounded-md bg-brand-600 px-2 py-1 text-xs font-medium text-white hover:bg-brand-700"
                  >
                    Publish
                  </button>
                )}
                {a.status !== 'ARCHIVED' && (
                  <button
                    disabled={busyId === a.id}
                    onClick={() => runAction(a.id, () => archiveAnnouncementAdmin(a.id))}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-red-600 hover:border-red-400 dark:border-slate-700"
                  >
                    Archive
                  </button>
                )}
              </div>
            </li>
          ))}
          {announcements.length === 0 && <p className="text-sm text-slate-400">No announcements yet.</p>}
        </ul>
      )}
    </div>
  );
}
