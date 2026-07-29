import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CertificateViewPage } from '../CertificateViewPage';
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
    <MemoryRouter initialEntries={['/certificates/cert-1']}>
      <Routes>
        <Route path="/certificates/:certificateId" element={<CertificateViewPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CertificateViewPage (004 US5, FR-083 browser-printable certificate)', () => {
  beforeEach(() => {
    vi.mocked(certificateApi.getMyCertificateById).mockReset();
  });

  it("renders the learner's name, course title, and credential ID", async () => {
    vi.mocked(certificateApi.getMyCertificateById).mockResolvedValue(certificate);
    renderPage();

    expect(await screen.findByText('Jordan Lee')).toBeInTheDocument();
    expect(screen.getByText('Intro to Business')).toBeInTheDocument();
    expect(screen.getByText(/Credential ID: CX-ABCDEFGH/)).toBeInTheDocument();
  });

  it('shows a revoked banner when the certificate status is REVOKED', async () => {
    vi.mocked(certificateApi.getMyCertificateById).mockResolvedValue({ ...certificate, status: 'REVOKED' });
    renderPage();

    expect(await screen.findByText(/no longer valid/)).toBeInTheDocument();
  });
});
