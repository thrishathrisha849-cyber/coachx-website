import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CertificateVerifyPage } from '../CertificateVerifyPage';
import * as certificateApi from '@/api/certificate.api';

vi.mock('@/api/certificate.api');

function renderPage(credentialId: string) {
  return render(
    <MemoryRouter initialEntries={[`/verify/${credentialId}`]}>
      <Routes>
        <Route path="/verify/:credentialId" element={<CertificateVerifyPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CertificateVerifyPage (004 US5, FR-085 public no-auth verification)', () => {
  beforeEach(() => {
    vi.mocked(certificateApi.verifyCertificate).mockReset();
  });

  it('shows a valid-credential result with learner and course details', async () => {
    vi.mocked(certificateApi.verifyCertificate).mockResolvedValue({
      status: 'VALID',
      credentialId: 'CX-ABCDEFGH',
      learnerName: 'Jordan Lee',
      courseTitle: 'Intro to Business',
      issuedAt: '2026-01-02T00:00:00.000Z',
    });
    renderPage('CX-ABCDEFGH');

    expect(await screen.findByText('This is a valid certificate')).toBeInTheDocument();
    expect(screen.getByText(/Jordan Lee/)).toBeInTheDocument();
  });

  it('shows a not-found result for an unknown credential without treating it as an error', async () => {
    vi.mocked(certificateApi.verifyCertificate).mockResolvedValue({ status: 'NOT_FOUND', credentialId: 'CX-BOGUS' });
    renderPage('CX-BOGUS');

    expect(await screen.findByText('No certificate was found for this credential ID')).toBeInTheDocument();
  });

  it('shows a revoked result for a revoked credential', async () => {
    vi.mocked(certificateApi.verifyCertificate).mockResolvedValue({
      status: 'REVOKED',
      credentialId: 'CX-REVOKED1',
      learnerName: 'Jordan Lee',
      courseTitle: 'Intro to Business',
    });
    renderPage('CX-REVOKED1');

    expect(await screen.findByText('This certificate has been revoked')).toBeInTheDocument();
  });
});
