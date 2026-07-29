import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CertificatesPage } from '../CertificatesPage';
import * as certificateApi from '@/api/certificate.api';

vi.mock('@/api/certificate.api');

const certificate = {
  id: 'cert-1',
  credentialId: 'CX-ABCDEFGH',
  certificateType: 'COURSE_COMPLETION',
  learnerName: 'Jordan Lee',
  courseTitle: 'Intro to Business',
  instructorName: 'Priya Rao',
  organizationName: null,
  completionDate: '2026-01-01T00:00:00.000Z',
  issuedAt: '2026-01-02T00:00:00.000Z',
  expiresAt: null,
  status: 'VALID',
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/certificates']}>
      <CertificatesPage />
    </MemoryRouter>,
  );
}

describe('CertificatesPage (004 US5)', () => {
  beforeEach(() => {
    vi.mocked(certificateApi.getMyCertificates).mockReset();
  });

  it('renders an empty state when the learner has no certificates yet', async () => {
    vi.mocked(certificateApi.getMyCertificates).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText(/haven't earned any certificates yet/)).toBeInTheDocument();
  });

  it('lists issued certificates with a link to view each one', async () => {
    vi.mocked(certificateApi.getMyCertificates).mockResolvedValue([certificate]);
    renderPage();

    expect(await screen.findByText('Intro to Business')).toBeInTheDocument();
    expect(screen.getByText(/CX-ABCDEFGH/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View →' })).toHaveAttribute('href', '/certificates/cert-1');
  });
});
