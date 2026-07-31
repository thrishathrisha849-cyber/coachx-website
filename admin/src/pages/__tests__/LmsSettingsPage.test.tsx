import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LmsSettingsPage } from '../LmsSettingsPage';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const settings: lmsApi.AdminLmsSettings = {
  defaultVideoWatchThresholdPercent: 80,
  defaultQuizPassingScorePercent: 70,
  defaultQuizMaxAttempts: null,
  defaultAssignmentMaxAttempts: null,
  defaultResourceDownloadPermission: 'DOWNLOADABLE',
  defaultLessonCompletionRuleType: 'MANUAL',
  courseReviewMinProgressPercent: 50,
  streakQualifyLessonComplete: true,
  streakQualifyQuizComplete: true,
  streakQualifyAssignmentActivity: false,
  streakQualifyMinLearningTime: false,
  streakMinLearningTimeMinutes: 10,
  streakTimezone: 'UTC',
  streakGraceDays: 0,
  updatedBy: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('LmsSettingsPage (004 LMS-wide Settings batch, FR-114)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getLmsSettingsAdmin).mockReset();
    vi.mocked(lmsApi.updateLmsSettingsAdmin).mockReset();
  });

  it('loads and displays the current settings', async () => {
    vi.mocked(lmsApi.getLmsSettingsAdmin).mockResolvedValue(settings);
    render(<LmsSettingsPage />);

    expect(await screen.findByDisplayValue('80')).toBeInTheDocument();
    expect(screen.getByDisplayValue('70')).toBeInTheDocument();
    expect(screen.getByDisplayValue('50')).toBeInTheDocument();
  });

  it('saves an edited field via the admin API', async () => {
    vi.mocked(lmsApi.getLmsSettingsAdmin).mockResolvedValue(settings);
    vi.mocked(lmsApi.updateLmsSettingsAdmin).mockResolvedValue({ ...settings, courseReviewMinProgressPercent: 65 });

    const user = userEvent.setup();
    render(<LmsSettingsPage />);

    const input = await screen.findByLabelText(/Course rating eligibility/);
    await user.clear(input);
    await user.type(input, '65');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(lmsApi.updateLmsSettingsAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ courseReviewMinProgressPercent: 65 }),
    );
    expect(await screen.findByText('Saved.')).toBeInTheDocument();
  });

  it('sends null for max attempts when the field is cleared to blank (unlimited)', async () => {
    vi.mocked(lmsApi.getLmsSettingsAdmin).mockResolvedValue({ ...settings, defaultQuizMaxAttempts: 5 });
    vi.mocked(lmsApi.updateLmsSettingsAdmin).mockResolvedValue(settings);

    const user = userEvent.setup();
    render(<LmsSettingsPage />);

    const input = await screen.findByLabelText(/Default quiz max attempts/);
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(lmsApi.updateLmsSettingsAdmin).toHaveBeenCalledWith(expect.objectContaining({ defaultQuizMaxAttempts: null }));
  });

  it('saves an edited Learning Streak setting via the admin API (FR-057)', async () => {
    vi.mocked(lmsApi.getLmsSettingsAdmin).mockResolvedValue(settings);
    vi.mocked(lmsApi.updateLmsSettingsAdmin).mockResolvedValue({ ...settings, streakQualifyAssignmentActivity: true, streakGraceDays: 2 });

    const user = userEvent.setup();
    render(<LmsSettingsPage />);

    await user.click(await screen.findByLabelText('Assignment submission counts'));
    const graceInput = screen.getByLabelText(/Grace days/);
    await user.clear(graceInput);
    await user.type(graceInput, '2');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));

    expect(lmsApi.updateLmsSettingsAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ streakQualifyAssignmentActivity: true, streakGraceDays: 2 }),
    );
  });

  it('shows an error message when loading fails', async () => {
    vi.mocked(lmsApi.getLmsSettingsAdmin).mockRejectedValue({ message: 'Network error' });
    render(<LmsSettingsPage />);

    expect(await screen.findByText('Network error')).toBeInTheDocument();
  });
});
