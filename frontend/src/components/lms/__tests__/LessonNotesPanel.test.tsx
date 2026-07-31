import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LessonNotesPanel } from '../LessonNotesPanel';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const sampleNote: lmsApi.MyLearnerNote = {
  id: 'note-1',
  lessonId: 'lesson-1',
  courseId: 'course-1',
  content: 'Remember to review this section.',
  videoTimestampSeconds: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('LessonNotesPanel (004 Learner Notes & Bookmarks batch, FR-058)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getMyLessonNotes).mockReset();
    vi.mocked(lmsApi.createLessonNote).mockReset();
    vi.mocked(lmsApi.updateLessonNote).mockReset();
    vi.mocked(lmsApi.deleteLessonNote).mockReset();
  });

  it('shows an empty state and creates a new note via the real endpoint', async () => {
    vi.mocked(lmsApi.getMyLessonNotes).mockResolvedValue([]);
    vi.mocked(lmsApi.createLessonNote).mockResolvedValue(sampleNote);

    const user = userEvent.setup();
    render(<LessonNotesPanel lessonId="lesson-1" />);

    expect(await screen.findByText(/No notes yet/)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText('Add a private note for this lesson…'), 'Remember to review this section.');
    await user.click(screen.getByRole('button', { name: 'Add note' }));

    await waitFor(() => expect(lmsApi.createLessonNote).toHaveBeenCalledWith('lesson-1', 'Remember to review this section.'));
    expect(await screen.findByText('Remember to review this section.')).toBeInTheDocument();
  });

  it('lists existing notes and edits one', async () => {
    vi.mocked(lmsApi.getMyLessonNotes).mockResolvedValue([sampleNote]);
    vi.mocked(lmsApi.updateLessonNote).mockResolvedValue({ ...sampleNote, content: 'Updated note text.' });

    const user = userEvent.setup();
    render(<LessonNotesPanel lessonId="lesson-1" />);

    await screen.findByText('Remember to review this section.');
    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const textarea = screen.getAllByRole('textbox')[1];
    await user.clear(textarea);
    await user.type(textarea, 'Updated note text.');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(lmsApi.updateLessonNote).toHaveBeenCalledWith('note-1', 'Updated note text.'));
    expect(await screen.findByText('Updated note text.')).toBeInTheDocument();
  });

  it('deletes a note', async () => {
    vi.mocked(lmsApi.getMyLessonNotes).mockResolvedValue([sampleNote]);
    vi.mocked(lmsApi.deleteLessonNote).mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<LessonNotesPanel lessonId="lesson-1" />);

    await screen.findByText('Remember to review this section.');
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(lmsApi.deleteLessonNote).toHaveBeenCalledWith('note-1'));
    expect(screen.queryByText('Remember to review this section.')).not.toBeInTheDocument();
  });
});
