import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PeerReviewQueuePage } from '../PeerReviewQueuePage';
import * as assignmentApi from '@/api/assignment.api';

vi.mock('@/api/assignment.api');

const queueItem: assignmentApi.PeerReviewQueueItem = {
  submissionId: 'sub-1',
  assignmentId: 'assign-1',
  assignmentTitle: 'Peer-Reviewed Essay',
  courseId: 'course-1',
  courseTitle: 'Intro to Business',
  lessonId: 'lesson-1',
  submittedAt: '2026-01-01T00:00:00.000Z',
  textBody: 'Here is my essay content.',
  linkUrl: null,
  criteria: [{ id: 'crit-1', title: 'Clarity', description: null, maxPoints: 10 }],
  slotsRemaining: 1,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/peer-reviews']}>
      <Routes>
        <Route path="/peer-reviews" element={<PeerReviewQueuePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PeerReviewQueuePage (004 US9 Peer Review batch, FR-076)', () => {
  beforeEach(() => {
    vi.mocked(assignmentApi.getPeerReviewQueue).mockReset();
    vi.mocked(assignmentApi.claimPeerReview).mockReset();
    vi.mocked(assignmentApi.submitPeerReview).mockReset();
  });

  it('lists open queue items', async () => {
    vi.mocked(assignmentApi.getPeerReviewQueue).mockResolvedValue([queueItem]);
    renderPage();

    expect(await screen.findByText('Peer-Reviewed Essay')).toBeInTheDocument();
    expect(screen.getByText('1 slot open')).toBeInTheDocument();
  });

  it('shows an empty state when there is nothing to review', async () => {
    vi.mocked(assignmentApi.getPeerReviewQueue).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('No open submissions to review right now.')).toBeInTheDocument();
  });

  it('claims a submission and submits a rubric-scored review', async () => {
    vi.mocked(assignmentApi.getPeerReviewQueue).mockResolvedValue([queueItem]);
    vi.mocked(assignmentApi.claimPeerReview).mockResolvedValue({
      id: 'pr-1',
      submissionId: 'sub-1',
      status: 'PENDING',
      comment: null,
      totalScore: null,
      claimedAt: '2026-01-01T00:00:00.000Z',
      submittedAt: null,
      criterionScores: [],
    });
    vi.mocked(assignmentApi.submitPeerReview).mockResolvedValue({
      id: 'pr-1',
      submissionId: 'sub-1',
      status: 'SUBMITTED',
      comment: 'Nice',
      totalScore: 8,
      claimedAt: '2026-01-01T00:00:00.000Z',
      submittedAt: '2026-01-01T00:05:00.000Z',
      criterionScores: [],
    });

    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Review this submission' }));
    expect(await screen.findByText('Here is my essay content.')).toBeInTheDocument();

    const scoreInput = screen.getByRole('spinbutton');
    await user.clear(scoreInput);
    await user.type(scoreInput, '8');
    await user.click(screen.getByRole('button', { name: 'Submit review' }));

    expect(assignmentApi.submitPeerReview).toHaveBeenCalledWith('pr-1', {
      criterionScores: [{ criterionId: 'crit-1', pointsAwarded: 8, comment: undefined }],
      comment: undefined,
    });
  });
});
