import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CourseAnnouncementsPage } from '../CourseAnnouncementsPage';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const draftAnnouncement: lmsApi.AdminAnnouncement = {
  id: 'ann-1',
  courseId: 'course-1',
  moduleId: null,
  title: 'Welcome to the course',
  message: 'Glad to have you here.',
  priority: 'NORMAL',
  channels: ['IN_APP'],
  attachmentUrl: null,
  status: 'DRAFT',
  publishAt: null,
  expireAt: null,
  emailSentAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/lms-courses/course-1/announcements']}>
      <Routes>
        <Route path="/lms-courses/:id/announcements" element={<CourseAnnouncementsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CourseAnnouncementsPage (004 Course Announcements batch, FR-102)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.listAnnouncementsAdmin).mockReset();
    vi.mocked(lmsApi.createAnnouncementAdmin).mockReset();
    vi.mocked(lmsApi.publishAnnouncementAdmin).mockReset();
    vi.mocked(lmsApi.archiveAnnouncementAdmin).mockReset();
  });

  it('lists announcements for the course', async () => {
    vi.mocked(lmsApi.listAnnouncementsAdmin).mockResolvedValue([draftAnnouncement]);
    renderPage();

    expect(await screen.findByText('Welcome to the course')).toBeInTheDocument();
    expect(lmsApi.listAnnouncementsAdmin).toHaveBeenCalledWith('course-1');
  });

  it('creates a new draft announcement, optionally including the EMAIL channel', async () => {
    vi.mocked(lmsApi.listAnnouncementsAdmin).mockResolvedValue([]);
    vi.mocked(lmsApi.createAnnouncementAdmin).mockResolvedValue(draftAnnouncement);

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('No announcements yet.');
    await user.type(screen.getByPlaceholderText('Title'), 'Welcome to the course');
    await user.type(screen.getByPlaceholderText('Message'), 'Glad to have you here.');
    await user.click(screen.getByLabelText('Also email enrolled learners on publish'));
    await user.click(screen.getByRole('button', { name: 'Create draft' }));

    expect(lmsApi.createAnnouncementAdmin).toHaveBeenCalledWith('course-1', {
      title: 'Welcome to the course',
      message: 'Glad to have you here.',
      priority: 'NORMAL',
      channels: ['IN_APP', 'EMAIL'],
    });
  });

  it('publishes a draft announcement', async () => {
    vi.mocked(lmsApi.listAnnouncementsAdmin).mockResolvedValue([draftAnnouncement]);
    vi.mocked(lmsApi.publishAnnouncementAdmin).mockResolvedValue({ ...draftAnnouncement, status: 'PUBLISHED' });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Welcome to the course');
    await user.click(screen.getByRole('button', { name: 'Publish' }));

    expect(lmsApi.publishAnnouncementAdmin).toHaveBeenCalledWith('ann-1');
  });
});
