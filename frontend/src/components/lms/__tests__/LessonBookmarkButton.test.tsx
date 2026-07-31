import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LessonBookmarkButton } from '../LessonBookmarkButton';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const sampleBookmark: lmsApi.MyBookmark = {
  id: 'bookmark-1',
  lessonId: 'lesson-1',
  courseId: 'course-1',
  type: 'LESSON',
  videoTimestampSeconds: null,
  textSectionAnchor: null,
  activityId: null,
  note: null,
  folder: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('LessonBookmarkButton (004 Learner Notes & Bookmarks batch, FR-059)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getMyLessonBookmarks).mockReset();
    vi.mocked(lmsApi.createLessonBookmark).mockReset();
    vi.mocked(lmsApi.deleteBookmark).mockReset();
  });

  it('offers to bookmark when not yet bookmarked, and calls the real create endpoint', async () => {
    vi.mocked(lmsApi.getMyLessonBookmarks).mockResolvedValue([]);
    vi.mocked(lmsApi.createLessonBookmark).mockResolvedValue(sampleBookmark);

    const user = userEvent.setup();
    render(<LessonBookmarkButton lessonId="lesson-1" />);

    const button = await screen.findByRole('button', { name: /Bookmark this lesson/ });
    await user.click(button);

    await waitFor(() => expect(lmsApi.createLessonBookmark).toHaveBeenCalledWith('lesson-1'));
    expect(await screen.findByRole('button', { name: /Bookmarked/ })).toBeInTheDocument();
  });

  it('shows Bookmarked when already bookmarked, and calls the real delete endpoint on toggle-off', async () => {
    vi.mocked(lmsApi.getMyLessonBookmarks).mockResolvedValue([sampleBookmark]);
    vi.mocked(lmsApi.deleteBookmark).mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<LessonBookmarkButton lessonId="lesson-1" />);

    const button = await screen.findByRole('button', { name: /Bookmarked/ });
    await user.click(button);

    await waitFor(() => expect(lmsApi.deleteBookmark).toHaveBeenCalledWith('bookmark-1'));
    expect(await screen.findByRole('button', { name: /Bookmark this lesson/ })).toBeInTheDocument();
  });
});
