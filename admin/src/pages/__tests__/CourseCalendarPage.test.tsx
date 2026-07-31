import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CourseCalendarPage } from '../CourseCalendarPage';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/lms-courses/course-1/calendar']}>
      <Routes>
        <Route path="/lms-courses/:id/calendar" element={<CourseCalendarPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CourseCalendarPage (T092-T095, FR-103)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getCourseCalendarAdmin).mockReset();
  });

  it('renders a real dated event fetched from the admin API', async () => {
    vi.mocked(lmsApi.getCourseCalendarAdmin).mockResolvedValue([
      { type: 'ASSIGNMENT_DUE', date: '2026-02-01T10:00:00.000Z', title: 'Essay', sourceId: 'assign-1' },
    ]);
    renderPage();

    expect(await screen.findByText('Essay')).toBeInTheDocument();
    expect(screen.getByText('Assignment due')).toBeInTheDocument();
  });

  it('shows an empty state when there are no dated events', async () => {
    vi.mocked(lmsApi.getCourseCalendarAdmin).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('No upcoming dated events for this course.')).toBeInTheDocument();
  });
});
