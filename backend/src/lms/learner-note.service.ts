import { AppError } from '../utils/app-error';
import { assertLessonContentAccessible } from './access-evaluator.service';
import {
  createLearnerNote,
  findLearnerNoteById,
  updateLearnerNote,
  deleteLearnerNote,
  findLearnerNotesForLesson,
  findLearnerNotesForCourse,
  findAllLearnerNotesForUser,
  searchLearnerNotes,
} from './learner-note.repository';
import { toMyLearnerNote } from './learner-note.serializers';
import type { MyLearnerNote } from './learner-note.types';

/**
 * 004 Learner Notes & Bookmarks batch (FR-058). A learner's private,
 * lesson-scoped note — STRICTLY private: FR-033 explicitly bars even an
 * organization admin from reading a learner's notes, so unlike every other
 * LMS entity, there is deliberately NO admin-facing read endpoint anywhere
 * (enforced by omission from the route table, not just an RBAC check).
 *
 * "Rich or plain text" content is stored as-is and sanitized only at
 * RENDER time on the frontend (the same DOMPurify allowlist course
 * descriptions already use) — this codebase has no backend-side HTML
 * sanitization anywhere (course descriptions/announcement messages follow
 * the identical convention), so this is consistent, not a shortcut.
 * "Cross-device sync" is trivially satisfied by being server-stored rather
 * than device-local — no separate sync mechanism exists or is needed.
 * Creating a note requires REAL lesson access (the same
 * `evaluateLessonAccess` gate every other content-consumption endpoint
 * uses) — a learner cannot note-take on a lesson they cannot access.
 * Reading/editing/deleting an already-created note is ownership-scoped
 * only (matching Certificates' own "ownership persists even if current
 * access changes" precedent), not re-checked against current access.
 */

/** POST /me/lessons/:lessonId/notes */
export async function createNoteForLesson(
  userId: string,
  lessonId: string,
  content: string,
  videoTimestampSeconds?: number,
): Promise<MyLearnerNote> {
  const { courseId } = await assertLessonContentAccessible(userId, lessonId);
  const note = await createLearnerNote({
    userId,
    lessonId,
    courseId,
    content,
    videoTimestampSeconds: videoTimestampSeconds ?? null,
  });
  return toMyLearnerNote(note);
}

async function assertOwnedNote(userId: string, noteId: string) {
  const note = await findLearnerNoteById(noteId);
  if (!note || note.userId !== userId) throw AppError.notFound('Note not found');
  return note;
}

/** PATCH /me/notes/:noteId */
export async function updateMyNote(
  userId: string,
  noteId: string,
  content?: string,
  videoTimestampSeconds?: number | null,
): Promise<MyLearnerNote> {
  await assertOwnedNote(userId, noteId);
  const updated = await updateLearnerNote(noteId, {
    ...(content !== undefined ? { content } : {}),
    ...(videoTimestampSeconds !== undefined ? { videoTimestampSeconds } : {}),
  });
  return toMyLearnerNote(updated);
}

/** DELETE /me/notes/:noteId — idempotent (deleting an already-gone/not-owned note is a no-op, never an error). */
export async function deleteMyNote(userId: string, noteId: string): Promise<void> {
  await deleteLearnerNote(noteId, userId);
}

/** GET /me/lessons/:lessonId/notes */
export async function listMyNotesForLesson(userId: string, lessonId: string): Promise<MyLearnerNote[]> {
  const rows = await findLearnerNotesForLesson(userId, lessonId);
  return rows.map((r) => toMyLearnerNote(r));
}

/** GET /me/courses/:courseId/notes */
export async function listMyNotesForCourse(userId: string, courseId: string): Promise<MyLearnerNote[]> {
  const rows = await findLearnerNotesForCourse(userId, courseId);
  return rows.map((r) => toMyLearnerNote(r));
}

/** GET /me/notes/search?q=...&courseId=... */
export async function searchMyNotes(userId: string, query: string, courseId?: string): Promise<MyLearnerNote[]> {
  const rows = await searchLearnerNotes(userId, query, courseId);
  return rows.map((r) => toMyLearnerNote(r));
}

/** GET /me/notes/export?courseId=... — FR-058 "export": a plain-text formatted dump of the learner's own notes, downloadable client-side (no PDF/file-storage pipeline exists or is needed for this). */
export async function exportMyNotes(userId: string, courseId?: string): Promise<string> {
  const rows = courseId ? await findLearnerNotesForCourse(userId, courseId) : await findAllLearnerNotesForUser(userId);
  if (rows.length === 0) return 'You have no saved notes yet.';

  return rows
    .map((n) => {
      const header = `${n.lesson?.title ?? 'Lesson'}${n.videoTimestampSeconds !== null ? ` @ ${n.videoTimestampSeconds}s` : ''} — ${n.createdAt.toISOString()}`;
      return `${header}\n${n.content}\n`;
    })
    .join('\n---\n\n');
}
