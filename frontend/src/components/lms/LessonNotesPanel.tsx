import { useEffect, useState } from 'react';
import { createLessonNote, updateLessonNote, deleteLessonNote, getMyLessonNotes, type MyLearnerNote } from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

/**
 * 004 Learner Notes & Bookmarks batch (FR-058) — self-contained, so it can
 * be dropped into the lesson player without threading a new fetch through
 * that page's own load sequence. Private to the learner (FR-033) — there
 * is no admin surface for this data anywhere.
 */
export function LessonNotesPanel({ lessonId }: { lessonId: string }) {
  const [notes, setNotes] = useState<MyLearnerNote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyLessonNotes(lessonId)
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoaded(true));
  }, [lessonId]);

  async function handleAdd() {
    if (!draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createLessonNote(lessonId, draft.trim());
      setNotes((prev) => [created, ...prev]);
      setDraft('');
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not save this note.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit(noteId: string) {
    if (!editDraft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await updateLessonNote(noteId, editDraft.trim());
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
      setEditingId(null);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not update this note.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(noteId: string) {
    setBusy(true);
    setError(null);
    try {
      await deleteLessonNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not remove this note.');
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;

  return (
    <section className="mt-8 rounded-lg border border-slate-200 p-4 dark:border-slate-800" aria-label="My notes">
      <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">My notes</h2>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Add a private note for this lesson…"
        rows={3}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="button"
        onClick={handleAdd}
        disabled={busy || !draft.trim()}
        className="mt-2 rounded-md bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? 'Saving…' : 'Add note'}
      </button>

      {notes.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No notes yet — only you can see what you write here.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-md border border-slate-200 p-3 text-sm dark:border-slate-800">
              {editingId === note.id ? (
                <>
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  />
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={() => handleSaveEdit(note.id)} disabled={busy} className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-slate-300 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">{note.content}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-400">{new Date(note.createdAt).toLocaleString()}</span>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(note.id);
                          setEditDraft(note.content);
                        }}
                        className="text-xs font-medium text-brand-600 hover:text-brand-700"
                      >
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(note.id)} className="text-xs font-medium text-red-600 hover:text-red-700">
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
