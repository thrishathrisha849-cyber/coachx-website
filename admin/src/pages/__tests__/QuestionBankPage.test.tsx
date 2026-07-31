import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QuestionBankPage } from '../QuestionBankPage';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api', async () => {
  const actual = await vi.importActual<typeof lmsApi>('@/api/lms.api');
  return { ...actual, listQuestionBankItems: vi.fn(), createQuestionBankItem: vi.fn(), updateQuestionBankItem: vi.fn(), archiveQuestionBankItem: vi.fn() };
});

const item: lmsApi.AdminQuestionBankItem = {
  id: 'item-1',
  courseId: 'course-1',
  type: 'SINGLE_CHOICE',
  prompt: 'What is 2+2?',
  explanation: null,
  points: 1,
  category: 'math',
  difficulty: 'EASY',
  learningObjective: null,
  tags: ['arithmetic'],
  language: 'EN',
  version: 1,
  reviewStatus: 'APPROVED',
  usageCount: 0,
  status: 'PUBLISHED',
  options: [
    { id: 'opt-1', text: '4', isCorrect: true, position: 0 },
    { id: 'opt-2', text: '5', isCorrect: false, position: 1 },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/lms-courses/course-1/question-bank']}>
      <Routes>
        <Route path="/lms-courses/:id/question-bank" element={<QuestionBankPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('QuestionBankPage (T107, FR-064)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.listQuestionBankItems).mockReset();
    vi.mocked(lmsApi.createQuestionBankItem).mockReset();
    vi.mocked(lmsApi.updateQuestionBankItem).mockReset();
    vi.mocked(lmsApi.archiveQuestionBankItem).mockReset();
  });

  it('lists bank items fetched from the admin API', async () => {
    vi.mocked(lmsApi.listQuestionBankItems).mockResolvedValue([item]);
    renderPage();

    expect(await screen.findByText('What is 2+2?')).toBeInTheDocument();
    expect(screen.getByText(/math/)).toBeInTheDocument();
    expect(screen.getAllByText('APPROVED').length).toBeGreaterThan(0);
  });

  it('creates a new bank item and reloads the list', async () => {
    vi.mocked(lmsApi.listQuestionBankItems).mockResolvedValue([]);
    vi.mocked(lmsApi.createQuestionBankItem).mockResolvedValue(item);

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('No question bank items match these filters.');
    await user.click(screen.getByRole('button', { name: '+ New bank item' }));
    await user.type(screen.getByPlaceholderText('Question prompt'), 'What is 2+2?');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(lmsApi.createQuestionBankItem).toHaveBeenCalledWith('course-1', expect.objectContaining({ prompt: 'What is 2+2?' }));
  });

  it('archives a bank item from its row', async () => {
    vi.mocked(lmsApi.listQuestionBankItems).mockResolvedValue([item]);
    vi.mocked(lmsApi.archiveQuestionBankItem).mockResolvedValue({ ...item, status: 'ARCHIVED', reviewStatus: 'ARCHIVED' });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('What is 2+2?');
    await user.click(screen.getByRole('button', { name: 'Archive' }));

    expect(lmsApi.archiveQuestionBankItem).toHaveBeenCalledWith('item-1');
  });

  it('edits a bank item in place', async () => {
    vi.mocked(lmsApi.listQuestionBankItems).mockResolvedValue([item]);
    vi.mocked(lmsApi.updateQuestionBankItem).mockResolvedValue({ ...item, prompt: 'What is 3+3?' });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('What is 2+2?');
    await user.click(screen.getByRole('button', { name: 'Edit' }));

    const promptField = screen.getByPlaceholderText('Question prompt');
    await user.clear(promptField);
    await user.type(promptField, 'What is 3+3?');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(lmsApi.updateQuestionBankItem).toHaveBeenCalledWith('item-1', expect.objectContaining({ prompt: 'What is 3+3?' }));
  });
});
