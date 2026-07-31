import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CourseVersionHistoryPage } from '../CourseVersionHistoryPage';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const versions: lmsApi.AdminCourseVersion[] = [
  {
    id: 'version-2',
    courseId: 'course-1',
    versionNumber: 2,
    changeSummary: 'Reworked module 2 with new examples.',
    effectiveDate: '2026-08-01T00:00:00.000Z',
    existingLearnerPolicy: 'MANDATORY_MIGRATION',
    createdBy: 'admin-1',
    createdAt: '2026-07-31T00:00:00.000Z',
  },
  {
    id: 'version-1',
    courseId: 'course-1',
    versionNumber: 1,
    changeSummary: null,
    effectiveDate: null,
    existingLearnerPolicy: 'CONTINUE_CURRENT_VERSION',
    createdBy: 'admin-1',
    createdAt: '2026-07-01T00:00:00.000Z',
  },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/lms-courses/course-1/versions']}>
      <Routes>
        <Route path="/lms-courses/:id/versions" element={<CourseVersionHistoryPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CourseVersionHistoryPage (004 Course Versioning Policy batch, FR-099)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getCourseVersionsAdmin).mockReset();
  });

  it('lists every version with its change summary and existing-learner policy', async () => {
    vi.mocked(lmsApi.getCourseVersionsAdmin).mockResolvedValue(versions);
    renderPage();

    expect(await screen.findByText('Version 2')).toBeInTheDocument();
    expect(screen.getByText('Reworked module 2 with new examples.')).toBeInTheDocument();
    expect(screen.getByText('Mandatory migration')).toBeInTheDocument();

    expect(screen.getByText('Version 1')).toBeInTheDocument();
    expect(screen.getByText('No change summary recorded.')).toBeInTheDocument();
    expect(screen.getByText('Continue on current version')).toBeInTheDocument();
  });

  it('shows an empty state when the course has no version history yet', async () => {
    vi.mocked(lmsApi.getCourseVersionsAdmin).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText(/No version history yet/)).toBeInTheDocument();
  });
});
