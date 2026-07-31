import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CourseWaitlistPanel } from '../CourseWaitlistPanel';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

describe('CourseWaitlistPanel (004 Waitlist batch, FR-028/029)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getMyWaitlistEntry).mockReset();
    vi.mocked(lmsApi.joinWaitlist).mockReset();
    vi.mocked(lmsApi.claimWaitlistOffer).mockReset();
  });

  it('offers to join the waitlist when the learner has no entry yet, and calls the real join endpoint', async () => {
    vi.mocked(lmsApi.getMyWaitlistEntry).mockResolvedValue(null);
    vi.mocked(lmsApi.joinWaitlist).mockResolvedValue({
      id: 'wl-1',
      courseId: 'course-1',
      status: 'WAITING',
      priority: 3,
      joinedAt: '2026-01-01T00:00:00.000Z',
      offeredAt: null,
      offerExpiresAt: null,
      claimedAt: null,
    });

    const user = userEvent.setup();
    render(<CourseWaitlistPanel courseId="course-1" onClaimed={() => {}} />);

    const joinButton = await screen.findByRole('button', { name: 'Join the waitlist' });
    await user.click(joinButton);

    await waitFor(() => expect(lmsApi.joinWaitlist).toHaveBeenCalledWith('course-1'));
    expect(await screen.findByText(/You're #3 on the waitlist/)).toBeInTheDocument();
  });

  it('shows the queue position for a WAITING entry without offering to join again', async () => {
    vi.mocked(lmsApi.getMyWaitlistEntry).mockResolvedValue({
      id: 'wl-1',
      courseId: 'course-1',
      status: 'WAITING',
      priority: 2,
      joinedAt: '2026-01-01T00:00:00.000Z',
      offeredAt: null,
      offerExpiresAt: null,
      claimedAt: null,
    });

    render(<CourseWaitlistPanel courseId="course-1" onClaimed={() => {}} />);

    expect(await screen.findByText(/You're #2 on the waitlist/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Join the waitlist' })).not.toBeInTheDocument();
  });

  it('shows a claim button for an OFFERED entry, and calls onClaimed after a successful claim', async () => {
    vi.mocked(lmsApi.getMyWaitlistEntry).mockResolvedValue({
      id: 'wl-1',
      courseId: 'course-1',
      status: 'OFFERED',
      priority: 1,
      joinedAt: '2026-01-01T00:00:00.000Z',
      offeredAt: '2026-01-01T00:00:00.000Z',
      offerExpiresAt: '2026-01-03T00:00:00.000Z',
      claimedAt: null,
    });
    vi.mocked(lmsApi.claimWaitlistOffer).mockResolvedValue({
      id: 'wl-1',
      courseId: 'course-1',
      status: 'CLAIMED',
      priority: 1,
      joinedAt: '2026-01-01T00:00:00.000Z',
      offeredAt: '2026-01-01T00:00:00.000Z',
      offerExpiresAt: '2026-01-03T00:00:00.000Z',
      claimedAt: '2026-01-02T00:00:00.000Z',
    });
    const onClaimed = vi.fn();

    const user = userEvent.setup();
    render(<CourseWaitlistPanel courseId="course-1" onClaimed={onClaimed} />);

    const claimButton = await screen.findByRole('button', { name: 'Claim your seat' });
    await user.click(claimButton);

    await waitFor(() => expect(lmsApi.claimWaitlistOffer).toHaveBeenCalledWith('wl-1'));
    await waitFor(() => expect(onClaimed).toHaveBeenCalled());
  });

  it('offers to rejoin once a prior entry has EXPIRED', async () => {
    vi.mocked(lmsApi.getMyWaitlistEntry).mockResolvedValue({
      id: 'wl-1',
      courseId: 'course-1',
      status: 'EXPIRED',
      priority: 1,
      joinedAt: '2026-01-01T00:00:00.000Z',
      offeredAt: '2026-01-01T00:00:00.000Z',
      offerExpiresAt: '2026-01-03T00:00:00.000Z',
      claimedAt: null,
    });

    render(<CourseWaitlistPanel courseId="course-1" onClaimed={() => {}} />);

    expect(await screen.findByRole('button', { name: 'Join the waitlist' })).toBeInTheDocument();
  });

  it('shows an error message when joining fails', async () => {
    vi.mocked(lmsApi.getMyWaitlistEntry).mockResolvedValue(null);
    vi.mocked(lmsApi.joinWaitlist).mockRejectedValue({ message: 'You are already on the waitlist for this course' });

    const user = userEvent.setup();
    render(<CourseWaitlistPanel courseId="course-1" onClaimed={() => {}} />);

    await user.click(await screen.findByRole('button', { name: 'Join the waitlist' }));

    expect(await screen.findByText('You are already on the waitlist for this course')).toBeInTheDocument();
  });
});
