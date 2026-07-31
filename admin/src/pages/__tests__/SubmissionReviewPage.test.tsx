import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SubmissionReviewPage } from '../SubmissionReviewPage';
import * as assignmentApi from '@/api/assignment.api';

vi.mock('@/api/assignment.api');

const submission: assignmentApi.AdminSubmissionDetail = {
  id: 'sub-1',
  assignmentId: 'assign-1',
  enrollmentId: 'enr-1',
  learnerUserId: 'user-1',
  learnerDisplayName: 'Jordan Lee',
  attemptNumber: 1,
  status: 'SUBMITTED',
  textBody: 'My essay',
  linkUrl: null,
  submittedAt: '2026-01-01T00:00:00.000Z',
  isLate: false,
  score: null,
  passed: null,
  outcomeLevel: null,
  isSelfAssessed: false,
  learnerFeedback: null,
  feedbackViewedAt: null,
  criterionScores: [],
  peerReviews: [
    {
      id: 'pr-1',
      reviewerEnrollmentId: 'enr-2',
      reviewerUserId: 'user-2',
      reviewerDisplayName: 'Alex Rivera',
      status: 'SUBMITTED',
      comment: 'Well organized',
      totalScore: 8,
      submittedAt: '2026-01-02T00:00:00.000Z',
      moderationStatus: 'VISIBLE',
      moderationReason: null,
      criterionScores: [{ criterionId: 'crit-1', criterionTitle: 'Clarity', maxPoints: 10, pointsAwarded: 8, comment: null }],
    },
  ],
};

const assignmentWithRubric: assignmentApi.AdminAssignmentWithRubric = {
  id: 'assign-1',
  lessonId: 'lesson-1',
  title: 'Peer-Reviewed Essay',
  instructions: null,
  learningOutcome: null,
  submissionFormat: 'TEXT',
  allowedFileTypes: [],
  dueAt: null,
  maxScore: 10,
  passingScore: 6,
  latePolicy: 'ACCEPT',
  maxAttempts: null,
  status: 'PUBLISHED',
  version: 1,
  assessmentType: 'STANDARD',
  peerReviewEnabled: true,
  peerReviewsRequired: 1,
  peerReviewAnonymous: true,
  peerReviewDeadlineDays: null,
  peerReviewIncludeInGrade: false,
  rubricCriteria: [{ id: 'crit-1', assignmentId: 'assign-1', title: 'Clarity', description: null, maxPoints: 10, position: 0 }],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/submissions/sub-1/review']}>
      <Routes>
        <Route path="/submissions/:submissionId/review" element={<SubmissionReviewPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SubmissionReviewPage — peer reviews (004 US9 Peer Review batch, FR-076)', () => {
  beforeEach(() => {
    vi.mocked(assignmentApi.getSubmission).mockReset();
    vi.mocked(assignmentApi.getAssignment).mockReset();
    vi.mocked(assignmentApi.reviewSubmission).mockReset();
    vi.mocked(assignmentApi.moderatePeerReview).mockReset();
  });

  it('shows peer reviews with reviewer identity (never anonymized to staff)', async () => {
    vi.mocked(assignmentApi.getSubmission).mockResolvedValue(submission);
    vi.mocked(assignmentApi.getAssignment).mockResolvedValue(assignmentWithRubric);

    renderPage();

    expect(await screen.findByText('Alex Rivera')).toBeInTheDocument();
    expect(screen.getByText('Well organized')).toBeInTheDocument();
    expect(screen.getByText('Clarity: 8/10')).toBeInTheDocument();
  });

  it('hides a peer review with a reason, then allows restoring it', async () => {
    vi.mocked(assignmentApi.getSubmission).mockResolvedValue(submission);
    vi.mocked(assignmentApi.getAssignment).mockResolvedValue(assignmentWithRubric);
    vi.mocked(assignmentApi.moderatePeerReview).mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Alex Rivera');
    await user.type(screen.getByPlaceholderText('Reason for hiding (optional)'), 'Off-topic');
    await user.click(screen.getByRole('button', { name: 'Hide' }));

    expect(assignmentApi.moderatePeerReview).toHaveBeenCalledWith('pr-1', 'HIDE', 'Off-topic');
  });
});

describe('SubmissionReviewPage — feedback conversation (004 Assignment Feedback Interaction batch, FR-078)', () => {
  const reviewedSubmission = { ...submission, status: 'CHANGES_REQUESTED', learnerFeedback: 'Please add more detail.', peerReviews: [] };

  beforeEach(() => {
    vi.mocked(assignmentApi.getSubmission).mockReset();
    vi.mocked(assignmentApi.getAssignment).mockReset();
    vi.mocked(assignmentApi.getFeedbackMessagesAdmin).mockReset();
    vi.mocked(assignmentApi.respondToFeedbackAdmin).mockReset();
  });

  it('shows the learner clarification request and lets the instructor respond', async () => {
    vi.mocked(assignmentApi.getSubmission).mockResolvedValue(reviewedSubmission);
    vi.mocked(assignmentApi.getAssignment).mockResolvedValue(assignmentWithRubric);
    vi.mocked(assignmentApi.getFeedbackMessagesAdmin).mockResolvedValue([
      { id: 'msg-1', submissionId: 'sub-1', authorId: 'user-1', authorRole: 'LEARNER', type: 'CLARIFICATION_REQUEST', body: 'What specifically is missing?', createdAt: '2026-01-03T00:00:00.000Z' },
    ]);
    vi.mocked(assignmentApi.respondToFeedbackAdmin).mockResolvedValue({
      id: 'msg-2', submissionId: 'sub-1', authorId: 'admin-1', authorRole: 'INSTRUCTOR', type: 'REPLY', body: 'Add a conclusion paragraph.', createdAt: '2026-01-03T00:01:00.000Z',
    });

    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('What specifically is missing?')).toBeInTheDocument();
    expect(screen.getByText('The learner requested clarification below.')).toBeInTheDocument();
    expect(screen.getByText('Not yet viewed by learner')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Instructor response'), 'Add a conclusion paragraph.');
    await user.click(screen.getByRole('button', { name: 'Respond' }));

    expect(assignmentApi.respondToFeedbackAdmin).toHaveBeenCalledWith('sub-1', 'Add a conclusion paragraph.');
  });
});
