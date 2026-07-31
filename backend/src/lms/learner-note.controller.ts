import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import {
  createNoteForLesson,
  updateMyNote,
  deleteMyNote,
  listMyNotesForLesson,
  listMyNotesForCourse,
  searchMyNotes,
  exportMyNotes,
} from './learner-note.service';

// --- Learner-facing (004 Learner Notes & Bookmarks batch, FR-058) ----------
// STRICTLY private — no admin-facing controller exists for this entity at all (FR-033).

export const postLessonNote = asyncHandler(async (req: Request, res: Response) => {
  const note = await createNoteForLesson(req.user!.id, req.params.lessonId, req.body.content, req.body.videoTimestampSeconds);
  res.status(201).json(buildSuccessResponse(note));
});

export const patchMyNote = asyncHandler(async (req: Request, res: Response) => {
  const note = await updateMyNote(req.user!.id, req.params.noteId, req.body.content, req.body.videoTimestampSeconds);
  res.status(200).json(buildSuccessResponse(note));
});

export const deleteMyNoteHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteMyNote(req.user!.id, req.params.noteId);
  res.status(204).send();
});

export const getMyLessonNotes = asyncHandler(async (req: Request, res: Response) => {
  const notes = await listMyNotesForLesson(req.user!.id, req.params.lessonId);
  res.status(200).json(buildSuccessResponse(notes));
});

export const getMyCourseNotes = asyncHandler(async (req: Request, res: Response) => {
  const notes = await listMyNotesForCourse(req.user!.id, req.params.courseId);
  res.status(200).json(buildSuccessResponse(notes));
});

export const getMyNotesSearch = asyncHandler(async (req: Request, res: Response) => {
  const notes = await searchMyNotes(req.user!.id, req.query.q as string, req.query.courseId as string | undefined);
  res.status(200).json(buildSuccessResponse(notes));
});

export const getMyNotesExport = asyncHandler(async (req: Request, res: Response) => {
  const text = await exportMyNotes(req.user!.id, req.query.courseId as string | undefined);
  res.status(200).type('text/plain').send(text);
});
