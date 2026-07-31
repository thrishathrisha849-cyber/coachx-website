import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LearningStreakBadge } from '../LearningStreakBadge';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

describe('LearningStreakBadge (004 Learning Streak batch, FR-057)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getMyStreak).mockReset();
  });

  it('shows the current streak day count once loaded', async () => {
    vi.mocked(lmsApi.getMyStreak).mockResolvedValue({ currentStreakDays: 5, longestStreakDays: 8, lastQualifyingDate: '2026-07-31' });
    render(<LearningStreakBadge />);

    expect(await screen.findByText('🔥 5-day streak')).toBeInTheDocument();
  });

  it('renders nothing for a learner with no streak yet', async () => {
    vi.mocked(lmsApi.getMyStreak).mockResolvedValue({ currentStreakDays: 0, longestStreakDays: 0, lastQualifyingDate: null });
    const { container } = render(<LearningStreakBadge />);

    await waitFor(() => expect(lmsApi.getMyStreak).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing if the streak fetch fails', async () => {
    vi.mocked(lmsApi.getMyStreak).mockRejectedValue(new Error('network error'));
    const { container } = render(<LearningStreakBadge />);

    await waitFor(() => expect(lmsApi.getMyStreak).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
