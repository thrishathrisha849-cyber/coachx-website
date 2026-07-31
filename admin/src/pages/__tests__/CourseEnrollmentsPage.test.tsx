import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CourseEnrollmentsPage } from '../CourseEnrollmentsPage';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const enrollment = {
  id: 'enr-1',
  courseId: 'course-1',
  courseTitle: 'Intro to Business',
  userId: 'user-1',
  userDisplayName: 'Jordan Lee',
  source: 'ADMIN_GRANT',
  status: 'ACTIVE',
  enrolledAt: '2026-01-01T00:00:00.000Z',
  accessStartAt: null,
  accessEndAt: null,
  completedAt: null,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/lms-courses/course-1/enrollments']}>
      <Routes>
        <Route path="/lms-courses/:id/enrollments" element={<CourseEnrollmentsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CourseEnrollmentsPage (LMS Admin UI batch)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.listEnrollmentsAdmin).mockReset();
    vi.mocked(lmsApi.createEnrollmentAdmin).mockReset();
    vi.mocked(lmsApi.suspendEnrollmentAdmin).mockReset();
    vi.mocked(lmsApi.revokeEnrollmentAdmin).mockReset();
    vi.mocked(lmsApi.bulkImportEnrollmentsAdmin).mockReset();
  });

  it('lists enrollments for the course', async () => {
    vi.mocked(lmsApi.listEnrollmentsAdmin).mockResolvedValue({ data: [enrollment], meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 } });
    renderPage();

    expect(await screen.findByText('Jordan Lee')).toBeInTheDocument();
    expect(lmsApi.listEnrollmentsAdmin).toHaveBeenCalledWith(expect.objectContaining({ courseId: 'course-1' }));
  });

  it('grants a new enrollment by user ID', async () => {
    vi.mocked(lmsApi.listEnrollmentsAdmin).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 100, totalItems: 0, totalPages: 0 } });
    vi.mocked(lmsApi.createEnrollmentAdmin).mockResolvedValue(enrollment);

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('No enrollments found.');
    await user.type(screen.getByPlaceholderText('User ID to enroll'), 'user-1');
    await user.click(screen.getByRole('button', { name: 'Grant enrollment' }));

    expect(lmsApi.createEnrollmentAdmin).toHaveBeenCalledWith({ userId: 'user-1', courseId: 'course-1', source: 'ADMIN_GRANT' });
  });

  it('suspends an active enrollment with a reason', async () => {
    vi.mocked(lmsApi.listEnrollmentsAdmin).mockResolvedValue({ data: [enrollment], meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 } });
    vi.mocked(lmsApi.suspendEnrollmentAdmin).mockResolvedValue({ ...enrollment, status: 'SUSPENDED' });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Jordan Lee');
    await user.type(screen.getByPlaceholderText('Reason (required for most actions)'), 'Policy violation');
    await user.click(screen.getByRole('button', { name: 'Suspend' }));

    expect(lmsApi.suspendEnrollmentAdmin).toHaveBeenCalledWith('enr-1', 'Policy violation');
  });

  it('imports a CSV file and shows the per-row summary (004 Bulk CSV Import batch, FR-032)', async () => {
    vi.mocked(lmsApi.listEnrollmentsAdmin).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 100, totalItems: 0, totalPages: 0 } });
    vi.mocked(lmsApi.bulkImportEnrollmentsAdmin).mockResolvedValue({
      totalRows: 2,
      created: 1,
      duplicates: 0,
      failed: 1,
      rows: [
        { row: 2, email: 'new@example.com', status: 'CREATED', enrollmentId: 'enr-2' },
        { row: 3, email: 'bad-email', status: 'ERROR', message: 'No user found with this email' },
      ],
    });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('No enrollments found.');
    const csvFile = new File(['email\nnew@example.com\nbad-email'], 'import.csv', { type: 'text/csv' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, csvFile);

    await screen.findByText('import.csv');
    await user.click(screen.getByRole('button', { name: 'Import' }));

    expect(lmsApi.bulkImportEnrollmentsAdmin).toHaveBeenCalledWith('course-1', 'email\nnew@example.com\nbad-email');
    expect(await screen.findByText(/1 created/)).toBeInTheDocument();
    expect(screen.getByText(/1 failed/)).toBeInTheDocument();
    expect(screen.getByText(/No user found with this email/)).toBeInTheDocument();
  });
});
