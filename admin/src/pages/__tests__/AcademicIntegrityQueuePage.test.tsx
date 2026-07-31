import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AcademicIntegrityQueuePage } from '../AcademicIntegrityQueuePage';
import * as integrityApi from '@/api/academic-integrity.api';

vi.mock('@/api/academic-integrity.api', async () => {
  const actual = await vi.importActual<typeof import('@/api/academic-integrity.api')>('@/api/academic-integrity.api');
  return {
    ...actual,
    listAcademicIntegrityCases: vi.fn(),
    flagForInvestigation: vi.fn(),
    resolveInvestigation: vi.fn(),
  };
});

const openCase: integrityApi.AdminAcademicIntegrityCase = {
  id: 'case-1',
  type: 'PLAGIARISM',
  targetType: 'SUBMISSION',
  targetId: 'sub-1',
  reportedUserId: 'user-1',
  reporterId: 'admin-1',
  reason: 'Matched an external source closely.',
  evidence: null,
  status: 'OPEN',
  actionReason: null,
  actionedBy: null,
  actionedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('AcademicIntegrityQueuePage (T120, FR-116)', () => {
  beforeEach(() => {
    vi.mocked(integrityApi.listAcademicIntegrityCases).mockReset();
    vi.mocked(integrityApi.flagForInvestigation).mockReset();
    vi.mocked(integrityApi.resolveInvestigation).mockReset();
  });

  it('lists cases fetched from the admin API', async () => {
    vi.mocked(integrityApi.listAcademicIntegrityCases).mockResolvedValue([openCase]);
    render(<AcademicIntegrityQueuePage />);

    expect(await screen.findByText('Matched an external source closely.')).toBeInTheDocument();
    expect(screen.getByText('PLAGIARISM · SUBMISSION')).toBeInTheDocument();
  });

  it('files a new flag and reloads the list', async () => {
    vi.mocked(integrityApi.listAcademicIntegrityCases).mockResolvedValue([]);
    vi.mocked(integrityApi.flagForInvestigation).mockResolvedValue(openCase);

    const user = userEvent.setup();
    render(<AcademicIntegrityQueuePage />);

    await screen.findByText('No cases.');
    await user.type(screen.getByPlaceholderText('Submission ID'), 'sub-1');
    await user.type(screen.getByPlaceholderText(/Reason \(at least 10 characters\)/), 'Matched an external source closely.');
    await user.click(screen.getByRole('button', { name: 'File flag' }));

    expect(integrityApi.flagForInvestigation).toHaveBeenCalledWith({
      type: 'PLAGIARISM',
      targetType: 'SUBMISSION',
      targetId: 'sub-1',
      reason: 'Matched an external source closely.',
    });
  });

  it('resolves an open case as cleared', async () => {
    vi.mocked(integrityApi.listAcademicIntegrityCases).mockResolvedValue([openCase]);
    vi.mocked(integrityApi.resolveInvestigation).mockResolvedValue({ ...openCase, status: 'DISMISSED' });

    const user = userEvent.setup();
    render(<AcademicIntegrityQueuePage />);

    await user.click(await screen.findByRole('button', { name: 'Clear — no violation' }));
    expect(integrityApi.resolveInvestigation).toHaveBeenCalledWith('case-1', 'CLEARED', expect.any(String));
  });
});
