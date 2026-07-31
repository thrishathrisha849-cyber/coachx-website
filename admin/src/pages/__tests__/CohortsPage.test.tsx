import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CohortsPage } from '../CohortsPage';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const cohort: lmsApi.AdminCohort = {
  id: 'cohort-1',
  courseId: 'course-1',
  name: 'Fall 2026 Cohort',
  startDate: '2026-09-01T00:00:00.000Z',
  endDate: null,
  timezone: 'Asia/Kolkata',
  capacity: 30,
  status: 'OPEN',
  memberCount: 5,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/lms-courses/course-1/cohorts']}>
      <Routes>
        <Route path="/lms-courses/:id/cohorts" element={<CohortsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CohortsPage (T085, FR-012)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.listCohortsForCourse).mockReset();
    vi.mocked(lmsApi.createCohort).mockReset();
  });

  it('lists cohorts fetched from the admin API', async () => {
    vi.mocked(lmsApi.listCohortsForCourse).mockResolvedValue([cohort]);
    renderPage();

    expect(await screen.findByText('Fall 2026 Cohort')).toBeInTheDocument();
    expect(screen.getByText(/5\/30 learners/)).toBeInTheDocument();
  });

  it('creates a new cohort and reloads the list', async () => {
    vi.mocked(lmsApi.listCohortsForCourse).mockResolvedValue([]);
    vi.mocked(lmsApi.createCohort).mockResolvedValue(cohort);

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('No cohorts yet.');
    await user.click(screen.getByRole('button', { name: '+ New cohort' }));
    await user.type(screen.getByLabelText('Name'), 'Fall 2026 Cohort');
    await user.type(screen.getByLabelText('Start date'), '2026-09-01');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(lmsApi.createCohort).toHaveBeenCalledWith(
      'course-1',
      expect.objectContaining({ name: 'Fall 2026 Cohort', timezone: 'UTC' }),
    );
  });
});
