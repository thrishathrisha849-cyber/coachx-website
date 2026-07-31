import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CourseWishlistPanel } from '../CourseWishlistPanel';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const sampleEntry: lmsApi.MyWishlistEntry = {
  id: 'wish-1',
  courseId: 'course-1',
  courseTitle: 'Intro to Tamil Business',
  courseSlug: 'intro-to-tamil-business',
  courseThumbnailUrl: null,
  courseStatus: 'ENROLLMENT_PAUSED',
  priceAtSaveAmountMinor: 10000,
  priceAtSaveCurrency: 'INR',
  currentPriceAmountMinor: 10000,
  priceDropped: false,
  enrollmentOpen: false,
  savedAt: '2026-01-01T00:00:00.000Z',
};

describe('CourseWishlistPanel (004 Wishlist batch, FR-027)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getMyWishlist).mockReset();
    vi.mocked(lmsApi.saveToWishlist).mockReset();
    vi.mocked(lmsApi.removeFromWishlist).mockReset();
  });

  it('offers to save when the learner has not saved this course yet, and calls the real save endpoint', async () => {
    vi.mocked(lmsApi.getMyWishlist).mockResolvedValue([]);
    vi.mocked(lmsApi.saveToWishlist).mockResolvedValue(sampleEntry);

    const user = userEvent.setup();
    render(<CourseWishlistPanel courseId="course-1" />);

    const saveButton = await screen.findByRole('button', { name: /Save to wishlist/ });
    await user.click(saveButton);

    await waitFor(() => expect(lmsApi.saveToWishlist).toHaveBeenCalledWith('course-1'));
    expect(await screen.findByRole('button', { name: 'Saved — remove from wishlist' })).toBeInTheDocument();
  });

  it('shows a remove option when already saved, and calls the real remove endpoint', async () => {
    vi.mocked(lmsApi.getMyWishlist).mockResolvedValue([sampleEntry]);
    vi.mocked(lmsApi.removeFromWishlist).mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<CourseWishlistPanel courseId="course-1" />);

    const removeButton = await screen.findByRole('button', { name: 'Saved — remove from wishlist' });
    await user.click(removeButton);

    await waitFor(() => expect(lmsApi.removeFromWishlist).toHaveBeenCalledWith('course-1'));
    expect(await screen.findByRole('button', { name: /Save to wishlist/ })).toBeInTheDocument();
  });

  it('shows a price-drop callout when the saved entry reports one', async () => {
    vi.mocked(lmsApi.getMyWishlist).mockResolvedValue([{ ...sampleEntry, priceDropped: true, currentPriceAmountMinor: 5000 }]);

    render(<CourseWishlistPanel courseId="course-1" />);

    expect(await screen.findByText(/the price has dropped/)).toBeInTheDocument();
  });

  it('shows an error message when saving fails', async () => {
    vi.mocked(lmsApi.getMyWishlist).mockResolvedValue([]);
    vi.mocked(lmsApi.saveToWishlist).mockRejectedValue({ message: 'This course is open for enrollment — enroll directly instead of saving it for later' });

    const user = userEvent.setup();
    render(<CourseWishlistPanel courseId="course-1" />);

    await user.click(await screen.findByRole('button', { name: /Save to wishlist/ }));

    expect(await screen.findByText('This course is open for enrollment — enroll directly instead of saving it for later')).toBeInTheDocument();
  });
});
