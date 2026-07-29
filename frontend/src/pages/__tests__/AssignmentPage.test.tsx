import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AssignmentPage } from '../AssignmentPage';
import * as assignmentApi from '@/api/assignment.api';

vi.mock('@/api/assignment.api');

const draftSubmission = {
  id: 'sub-1',
  assignmentId: 'assign-1',
  attemptNumber: 1,
  status: 'DRAFT' as const,
  textBody: null,
  linkUrl: null,
  submittedAt: null,
  isLate: false,
  score: null,
  passed: null,
  learnerFeedback: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/assignments/assign-1']}>
      <Routes>
        <Route path="/assignments/:assignmentId" element={<AssignmentPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AssignmentPage (004 US4)', () => {
  beforeEach(() => {
    vi.mocked(assignmentApi.startOrResumeSubmission).mockReset();
    vi.mocked(assignmentApi.getMySubmissions).mockReset();
    vi.mocked(assignmentApi.saveDraft).mockReset();
    vi.mocked(assignmentApi.submitSubmission).mockReset();
  });

  it('renders a draft editor and saves a draft', async () => {
    vi.mocked(assignmentApi.startOrResumeSubmission).mockResolvedValue(draftSubmission);
    vi.mocked(assignmentApi.getMySubmissions).mockResolvedValue([draftSubmission]);
    vi.mocked(assignmentApi.saveDraft).mockResolvedValue({ ...draftSubmission, textBody: 'My response' });

    const user = userEvent.setup();
    renderPage();

    const textarea = await screen.findByPlaceholderText('Write your response…');
    await user.type(textarea, 'My response');
    await user.click(screen.getByRole('button', { name: 'Save draft' }));

    await waitFor(() => expect(assignmentApi.saveDraft).toHaveBeenCalledWith('sub-1', { textBody: 'My response', linkUrl: undefined }));
  });

  it('submits the assignment and shows the awaiting-review state', async () => {
    vi.mocked(assignmentApi.startOrResumeSubmission)
      .mockResolvedValueOnce({ ...draftSubmission, textBody: 'Ready' })
      .mockResolvedValueOnce({ ...draftSubmission, status: 'SUBMITTED', textBody: 'Ready', submittedAt: '2026-01-01T00:05:00.000Z' });
    vi.mocked(assignmentApi.getMySubmissions).mockResolvedValue([draftSubmission]);
    vi.mocked(assignmentApi.saveDraft).mockResolvedValue({ ...draftSubmission, textBody: 'Ready' });
    vi.mocked(assignmentApi.submitSubmission).mockResolvedValue({ ...draftSubmission, status: 'SUBMITTED' });

    const user = userEvent.setup();
    renderPage();

    await screen.findByPlaceholderText('Write your response…');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(assignmentApi.submitSubmission).toHaveBeenCalledWith('sub-1'));
    expect(await screen.findByText('Submitted — awaiting review')).toBeInTheDocument();
  });

  it('shows reviewer feedback and a resubmit action when changes are requested', async () => {
    vi.mocked(assignmentApi.startOrResumeSubmission).mockResolvedValue({
      ...draftSubmission,
      status: 'CHANGES_REQUESTED',
      textBody: 'First try',
      learnerFeedback: 'Please add more detail.',
    });
    vi.mocked(assignmentApi.getMySubmissions).mockResolvedValue([draftSubmission]);

    renderPage();

    expect((await screen.findAllByText('Changes requested')).length).toBeGreaterThan(0);
    expect(screen.getByText('Please add more detail.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start new attempt' })).toBeInTheDocument();
  });
});
