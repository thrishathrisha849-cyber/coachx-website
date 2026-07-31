import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VersionMigrationBanner } from '../VersionMigrationBanner';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const myEnrollment: lmsApi.MyEnrollment = {
  id: 'enrollment-1',
  courseId: 'course-1',
  courseTitle: 'Intro to Business',
  courseSlug: 'intro-to-business',
  source: 'FREE',
  status: 'ACTIVE',
  enrolledAt: '2026-01-01T00:00:00.000Z',
  activatedAt: '2026-01-01T00:00:00.000Z',
  accessStartAt: null,
  accessEndAt: null,
  completedAt: null,
  lastAccessedAt: null,
};

describe('VersionMigrationBanner (004 Course Versioning Policy batch, FR-099)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getMyEnrollments).mockReset();
    vi.mocked(lmsApi.getMyVersionMigrationStatus).mockReset();
    vi.mocked(lmsApi.migrateMyVersion).mockReset();
  });

  it('renders nothing when no migration is available', async () => {
    vi.mocked(lmsApi.getMyEnrollments).mockResolvedValue([myEnrollment]);
    vi.mocked(lmsApi.getMyVersionMigrationStatus).mockResolvedValue({
      latestVersionNumber: 1,
      changeSummary: null,
      effectiveDate: null,
      existingLearnerPolicy: 'CONTINUE_CURRENT_VERSION',
      migratedToVersionNumber: null,
      migrationAvailable: false,
    });
    const { container } = render(<VersionMigrationBanner courseId="course-1" />);

    await waitFor(() => expect(lmsApi.getMyVersionMigrationStatus).toHaveBeenCalledWith('enrollment-1'));
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the change summary and lets the learner migrate when a migration is available', async () => {
    vi.mocked(lmsApi.getMyEnrollments).mockResolvedValue([myEnrollment]);
    vi.mocked(lmsApi.getMyVersionMigrationStatus).mockResolvedValue({
      latestVersionNumber: 2,
      changeSummary: 'Reworked module 2 with new examples.',
      effectiveDate: null,
      existingLearnerPolicy: 'OPTIONAL_MIGRATION',
      migratedToVersionNumber: null,
      migrationAvailable: true,
    });
    vi.mocked(lmsApi.migrateMyVersion).mockResolvedValue({ toVersionNumber: 2 });

    const user = userEvent.setup();
    render(<VersionMigrationBanner courseId="course-1" />);

    expect(await screen.findByText('Reworked module 2 with new examples.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Switch to the updated version/ }));

    expect(lmsApi.migrateMyVersion).toHaveBeenCalledWith('enrollment-1');
  });

  it('renders nothing when the learner has no enrollment in this course', async () => {
    vi.mocked(lmsApi.getMyEnrollments).mockResolvedValue([]);
    const { container } = render(<VersionMigrationBanner courseId="course-1" />);

    await waitFor(() => expect(lmsApi.getMyEnrollments).toHaveBeenCalled());
    expect(lmsApi.getMyVersionMigrationStatus).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});
