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
  outcomeLevel: null,
  isSelfAssessed: false,
  learnerFeedback: null,
  feedbackViewedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const standardAssignment: assignmentApi.PublicAssignmentWithRubric = {
  id: 'assign-1',
  lessonId: 'lesson-1',
  title: 'Business Plan Draft',
  instructions: null,
  learningOutcome: null,
  submissionFormat: 'TEXT',
  allowedFileTypes: [],
  dueAt: null,
  maxScore: 100,
  passingScore: 70,
  maxAttempts: null,
  assessmentType: 'STANDARD',
  peerReviewEnabled: false,
  peerReviewsRequired: 0,
  rubricCriteria: [],
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
    vi.mocked(assignmentApi.getAssignmentOverview).mockReset().mockResolvedValue(standardAssignment);
    vi.mocked(assignmentApi.startOrResumeSubmission).mockReset();
    vi.mocked(assignmentApi.getMySubmissions).mockReset();
    vi.mocked(assignmentApi.saveDraft).mockReset();
    vi.mocked(assignmentApi.submitSubmission).mockReset();
    vi.mocked(assignmentApi.submitSelfAssessment).mockReset();
    vi.mocked(assignmentApi.getMyPeerReviewsReceived).mockReset().mockResolvedValue([]);
    vi.mocked(assignmentApi.getMyFeedbackMessages).mockReset().mockResolvedValue([]);
    vi.mocked(assignmentApi.markFeedbackViewed).mockReset();
    vi.mocked(assignmentApi.replyToFeedback).mockReset();
    vi.mocked(assignmentApi.requestClarification).mockReset();
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
    await user.click(screen.getByRole('checkbox', { name: /I confirm this submission is my own original work/ }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    await waitFor(() => expect(assignmentApi.submitSubmission).toHaveBeenCalledWith('sub-1', true));
    expect(await screen.findByText('Submitted — awaiting review')).toBeInTheDocument();
  });

  it('disables Submit until the originality declaration is checked', async () => {
    vi.mocked(assignmentApi.startOrResumeSubmission).mockResolvedValue({ ...draftSubmission, textBody: 'Ready' });
    vi.mocked(assignmentApi.getMySubmissions).mockResolvedValue([draftSubmission]);

    renderPage();

    await screen.findByPlaceholderText('Write your response…');
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
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

  it('marks feedback as viewed, replies, and requests clarification (004 Assignment Feedback Interaction batch, FR-078)', async () => {
    const reviewedSubmission = { ...draftSubmission, status: 'CHANGES_REQUESTED' as const, textBody: 'First try', learnerFeedback: 'Please add more detail.' };
    vi.mocked(assignmentApi.startOrResumeSubmission).mockResolvedValue(reviewedSubmission);
    vi.mocked(assignmentApi.getMySubmissions).mockResolvedValue([draftSubmission]);
    vi.mocked(assignmentApi.markFeedbackViewed).mockResolvedValue({ ...reviewedSubmission, feedbackViewedAt: '2026-01-03T00:00:00.000Z' });
    vi.mocked(assignmentApi.replyToFeedback).mockResolvedValue({
      id: 'msg-1',
      submissionId: 'sub-1',
      authorId: 'user-1',
      authorRole: 'LEARNER',
      type: 'REPLY',
      body: 'Thanks, will do.',
      createdAt: '2026-01-03T00:01:00.000Z',
    });

    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Mark as viewed' }));
    await waitFor(() => expect(assignmentApi.markFeedbackViewed).toHaveBeenCalledWith('sub-1'));
    expect(await screen.findByText('✓ Viewed')).toBeInTheDocument();

    const replyBox = screen.getByLabelText('Feedback reply');
    await user.type(replyBox, 'Thanks, will do.');
    await user.click(screen.getByRole('button', { name: 'Reply' }));

    await waitFor(() => expect(assignmentApi.replyToFeedback).toHaveBeenCalledWith('sub-1', 'Thanks, will do.'));
  });

  it('sends a clarification request distinctly from a reply', async () => {
    const reviewedSubmission = { ...draftSubmission, status: 'APPROVED' as const, textBody: 'Done', score: 8, learnerFeedback: 'Great work.' };
    vi.mocked(assignmentApi.startOrResumeSubmission).mockResolvedValue(reviewedSubmission);
    vi.mocked(assignmentApi.getMySubmissions).mockResolvedValue([draftSubmission]);
    vi.mocked(assignmentApi.requestClarification).mockResolvedValue({
      id: 'msg-2',
      submissionId: 'sub-1',
      authorId: 'user-1',
      authorRole: 'LEARNER',
      type: 'CLARIFICATION_REQUEST',
      body: 'What does "great" mean exactly?',
      createdAt: '2026-01-03T00:02:00.000Z',
    });

    const user = userEvent.setup();
    renderPage();

    const replyBox = await screen.findByLabelText('Feedback reply');
    await user.type(replyBox, 'What does "great" mean exactly?');
    await user.click(screen.getByRole('button', { name: 'Request clarification' }));

    await waitFor(() => expect(assignmentApi.requestClarification).toHaveBeenCalledWith('sub-1', 'What does "great" mean exactly?'));
    expect(assignmentApi.replyToFeedback).not.toHaveBeenCalled();
  });

  it('shows anonymized peer reviews received once submitted (004 US9, FR-076)', async () => {
    vi.mocked(assignmentApi.startOrResumeSubmission).mockResolvedValue({ ...draftSubmission, status: 'SUBMITTED', textBody: 'Ready', submittedAt: '2026-01-01T00:05:00.000Z' });
    vi.mocked(assignmentApi.getMySubmissions).mockResolvedValue([draftSubmission]);
    vi.mocked(assignmentApi.getMyPeerReviewsReceived).mockResolvedValue([
      { id: 'pr-1', reviewerDisplayName: null, comment: 'Nice work', totalScore: 8, submittedAt: '2026-01-02T00:00:00.000Z', criterionScores: [] },
    ]);

    renderPage();

    expect(await screen.findByText('Anonymous peer')).toBeInTheDocument();
    expect(screen.getByText('Nice work')).toBeInTheDocument();
    expect(screen.getByText('Score: 8')).toBeInTheDocument();
  });
});

describe('AssignmentPage — self-assessment (004 Broader Assessment Types batch, FR-068)', () => {
  const skillRatingAssignment: assignmentApi.PublicAssignmentWithRubric = {
    ...standardAssignment,
    assessmentType: 'SKILL_RATING',
    rubricCriteria: [
      { id: 'crit-1', title: 'Communication', description: 'How clearly you communicate', maxPoints: 10 },
      { id: 'crit-2', title: 'Problem solving', description: null, maxPoints: 10 },
    ],
  };

  beforeEach(() => {
    vi.mocked(assignmentApi.getAssignmentOverview).mockReset().mockResolvedValue(skillRatingAssignment);
    vi.mocked(assignmentApi.startOrResumeSubmission).mockReset().mockResolvedValue(draftSubmission);
    vi.mocked(assignmentApi.getMySubmissions).mockReset().mockResolvedValue([draftSubmission]);
    vi.mocked(assignmentApi.submitSelfAssessment).mockReset();
    vi.mocked(assignmentApi.getMyPeerReviewsReceived).mockReset().mockResolvedValue([]);
  });

  it('renders a rating input per rubric criterion instead of the text/link submission form', async () => {
    renderPage();

    expect(await screen.findByText('Communication')).toBeInTheDocument();
    expect(screen.getByText('Problem solving')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Write your response…')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit self-assessment' })).toBeInTheDocument();
  });

  it('submits the self-assessment with the entered per-criterion scores', async () => {
    vi.mocked(assignmentApi.submitSelfAssessment).mockResolvedValue({
      ...draftSubmission,
      status: 'APPROVED',
      score: 17,
      passed: true,
      outcomeLevel: 'Advanced',
      isSelfAssessed: true,
      criterionScores: [],
    });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Communication');
    await user.type(screen.getByLabelText('Communication'), '9');
    await user.type(screen.getByLabelText('Problem solving'), '8');
    await user.click(screen.getByRole('button', { name: 'Submit self-assessment' }));

    await waitFor(() =>
      expect(assignmentApi.submitSelfAssessment).toHaveBeenCalledWith('sub-1', [
        { criterionId: 'crit-1', pointsAwarded: 9 },
        { criterionId: 'crit-2', pointsAwarded: 8 },
      ]),
    );
  });

  it('shows the outcome level and a self-assessed note once approved', async () => {
    vi.mocked(assignmentApi.startOrResumeSubmission).mockResolvedValue({
      ...draftSubmission,
      status: 'APPROVED',
      score: 17,
      passed: true,
      outcomeLevel: 'Advanced',
      isSelfAssessed: true,
    });

    renderPage();

    expect(await screen.findByText(/Level: Advanced/)).toBeInTheDocument();
    expect(screen.getByText('This outcome is your own self-assessment.')).toBeInTheDocument();
  });
});
