import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CourseReviewsPage } from '../CourseReviewsPage';
import * as courseReviewApi from '@/api/course-review.api';

vi.mock('@/api/course-review.api');

const review = {
  id: 'rev-1',
  courseId: 'course-1',
  userId: 'user-1',
  reviewerName: 'Jordan Lee',
  rating: 1,
  title: null,
  comment: 'Not good',
  outcome: null,
  wouldRecommend: false,
  isAnonymous: false,
  status: 'VISIBLE',
  hiddenBy: null,
  hiddenAt: null,
  hiddenReason: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('CourseReviewsPage (004 Discovery & Recommendations batch, FR-087)', () => {
  beforeEach(() => {
    vi.mocked(courseReviewApi.listCourseReviewsAdmin).mockReset();
    vi.mocked(courseReviewApi.moderateReview).mockReset();
  });

  it('looks up and lists reviews for a course', async () => {
    vi.mocked(courseReviewApi.listCourseReviewsAdmin).mockResolvedValue([review]);
    const user = userEvent.setup();
    render(<CourseReviewsPage />);

    await user.type(screen.getByPlaceholderText('Course ID'), 'course-1');
    await user.click(screen.getByRole('button', { name: 'Look up' }));

    expect(await screen.findByText('Not good')).toBeInTheDocument();
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
  });

  it('hides a visible review with a reason', async () => {
    vi.mocked(courseReviewApi.listCourseReviewsAdmin).mockResolvedValue([review]);
    vi.mocked(courseReviewApi.moderateReview).mockResolvedValue({ ...review, status: 'HIDDEN' });

    const user = userEvent.setup();
    render(<CourseReviewsPage />);

    await user.type(screen.getByPlaceholderText('Course ID'), 'course-1');
    await user.click(screen.getByRole('button', { name: 'Look up' }));
    await screen.findByText('Not good');

    await user.type(screen.getByPlaceholderText('Reason (optional)'), 'Abusive language');
    await user.click(screen.getByRole('button', { name: 'Hide' }));

    expect(courseReviewApi.moderateReview).toHaveBeenCalledWith('rev-1', 'HIDE', 'Abusive language');
  });
});
