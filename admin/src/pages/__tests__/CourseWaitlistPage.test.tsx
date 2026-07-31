import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CourseWaitlistPage } from '../CourseWaitlistPage';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const waitingEntry: lmsApi.AdminWaitlistEntry = {
  id: 'wl-1',
  courseId: 'course-1',
  status: 'WAITING',
  priority: 1,
  joinedAt: '2026-01-01T00:00:00.000Z',
  offeredAt: null,
  offerExpiresAt: null,
  claimedAt: null,
  userId: 'user-1',
  userDisplayName: 'Jordan Lee',
  referralSource: 'newsletter',
  offerEmailSentAt: null,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/lms-courses/course-1/waitlist']}>
      <Routes>
        <Route path="/lms-courses/:id/waitlist" element={<CourseWaitlistPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CourseWaitlistPage (004 Waitlist batch, FR-028/029)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.listWaitlistAdmin).mockReset();
  });

  it('lists the waitlist roster for the course', async () => {
    vi.mocked(lmsApi.listWaitlistAdmin).mockResolvedValue([waitingEntry]);
    renderPage();

    expect(await screen.findByText(/Jordan Lee/)).toBeInTheDocument();
    expect(screen.getByText(/Source: newsletter/)).toBeInTheDocument();
    expect(lmsApi.listWaitlistAdmin).toHaveBeenCalledWith('course-1');
  });

  it('shows an OFFERED entry\'s expiry and email-sent state', async () => {
    vi.mocked(lmsApi.listWaitlistAdmin).mockResolvedValue([
      { ...waitingEntry, status: 'OFFERED', offerExpiresAt: '2026-02-01T00:00:00.000Z', offerEmailSentAt: '2026-01-31T00:00:00.000Z' },
    ]);
    renderPage();

    expect(await screen.findByText(/Offer expires/)).toBeInTheDocument();
    expect(screen.getByText(/Email sent/)).toBeInTheDocument();
  });

  it('shows an empty state when no one is waiting', async () => {
    vi.mocked(lmsApi.listWaitlistAdmin).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('No one is currently on the waitlist.')).toBeInTheDocument();
  });
});
