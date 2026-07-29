import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QuizAttemptPage } from '../QuizAttemptPage';
import * as quizApi from '@/api/quiz.api';

vi.mock('@/api/quiz.api');

const inProgressAttempt = {
  id: 'attempt-1',
  quizId: 'quiz-1',
  attemptNumber: 1,
  status: 'IN_PROGRESS' as const,
  startedAt: '2026-01-01T00:00:00.000Z',
  expiresAt: null,
  submittedAt: null,
  gradedAt: null,
  pointsPossible: null,
  pointsEarned: null,
  scorePercent: null,
  passed: null,
  questions: [
    {
      id: 'q1',
      type: 'SINGLE_CHOICE',
      prompt: 'Capital of India?',
      points: 1,
      position: 0,
      options: [
        { id: 'opt-a', text: 'Mumbai', position: 0 },
        { id: 'opt-b', text: 'Delhi', position: 1 },
      ],
    },
  ],
};

const gradedAttempt = {
  ...inProgressAttempt,
  status: 'GRADED' as const,
  pointsPossible: 1,
  pointsEarned: 1,
  scorePercent: 100,
  passed: true,
  reviewVisible: true,
  questions: [
    {
      ...inProgressAttempt.questions[0],
      explanation: null,
      correctOptionIds: ['opt-b'],
      yourSelectedOptionIds: ['opt-b'],
      yourAnswerText: null,
      isCorrect: true,
      pointsAwarded: 1,
    },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/quiz-attempts/attempt-1']}>
      <Routes>
        <Route path="/quiz-attempts/:attemptId" element={<QuizAttemptPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('QuizAttemptPage (004 US3)', () => {
  beforeEach(() => {
    vi.mocked(quizApi.getAttempt).mockReset();
    vi.mocked(quizApi.saveAnswer).mockReset().mockResolvedValue(undefined);
    vi.mocked(quizApi.submitAttempt).mockReset();
  });

  it('renders question options while in progress, and never shows correctness before grading', async () => {
    vi.mocked(quizApi.getAttempt).mockResolvedValue(inProgressAttempt);
    renderPage();

    expect(await screen.findByText(/Capital of India\?/)).toBeInTheDocument();
    expect(screen.getByText('Delhi')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit quiz' })).toBeInTheDocument();
  });

  it('autosaves a selected answer and submits, then shows the graded result', async () => {
    vi.mocked(quizApi.getAttempt).mockResolvedValueOnce(inProgressAttempt).mockResolvedValueOnce(gradedAttempt);
    vi.mocked(quizApi.submitAttempt).mockResolvedValue({
      id: 'attempt-1',
      quizId: 'quiz-1',
      attemptNumber: 1,
      status: 'GRADED',
      startedAt: '2026-01-01T00:00:00.000Z',
      expiresAt: null,
      submittedAt: '2026-01-01T00:05:00.000Z',
      gradedAt: '2026-01-01T00:05:00.000Z',
      pointsPossible: 1,
      pointsEarned: 1,
      scorePercent: 100,
      passed: true,
    });

    const user = userEvent.setup();
    renderPage();

    const delhiOption = await screen.findByLabelText('Delhi');
    await user.click(delhiOption);
    await waitFor(() => expect(quizApi.saveAnswer).toHaveBeenCalledWith('attempt-1', 'q1', { selectedOptionIds: ['opt-b'] }));

    await user.click(screen.getByRole('button', { name: 'Submit quiz' }));
    await waitFor(() => expect(quizApi.submitAttempt).toHaveBeenCalledWith('attempt-1'));

    expect(await screen.findByText('Passed')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows the pass/fail review with per-question correctness once graded', async () => {
    vi.mocked(quizApi.getAttempt).mockResolvedValue(gradedAttempt);
    renderPage();

    expect(await screen.findByText('Passed')).toBeInTheDocument();
    expect(screen.getByText('✓ Correct (1/1 pts)')).toBeInTheDocument();
  });
});
