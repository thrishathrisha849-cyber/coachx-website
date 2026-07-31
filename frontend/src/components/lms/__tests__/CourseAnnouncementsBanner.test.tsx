import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CourseAnnouncementsBanner } from '../CourseAnnouncementsBanner';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

describe('CourseAnnouncementsBanner (004 Course Announcements batch, FR-102)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getMyCourseAnnouncements).mockReset();
  });

  it('renders visible announcements with priority styling', async () => {
    vi.mocked(lmsApi.getMyCourseAnnouncements).mockResolvedValue([
      {
        id: 'ann-1',
        courseId: 'course-1',
        moduleId: null,
        title: 'Live Q&A this Friday',
        message: 'Join us for a live Q&A session.',
        priority: 'URGENT',
        attachmentUrl: 'https://example.com/slides.pdf',
        publishAt: '2026-01-01T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    render(<CourseAnnouncementsBanner courseId="course-1" />);

    expect(await screen.findByText('Live Q&A this Friday')).toBeInTheDocument();
    expect(screen.getByText('Join us for a live Q&A session.')).toBeInTheDocument();
    expect(screen.getByText('View attachment')).toBeInTheDocument();
  });

  it('renders nothing when there are no visible announcements', async () => {
    vi.mocked(lmsApi.getMyCourseAnnouncements).mockResolvedValue([]);

    const { container } = render(<CourseAnnouncementsBanner courseId="course-1" />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('renders nothing on a fetch error rather than breaking the page', async () => {
    vi.mocked(lmsApi.getMyCourseAnnouncements).mockRejectedValue(new Error('network error'));

    const { container } = render(<CourseAnnouncementsBanner courseId="course-1" />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });
});
