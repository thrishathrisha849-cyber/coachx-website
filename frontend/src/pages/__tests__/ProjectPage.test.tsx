import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProjectPage } from '../ProjectPage';
import * as projectApi from '@/api/project.api';

vi.mock('@/api/project.api');

const projectStatus: projectApi.ProjectStatusForLearner = {
  id: 'project-1',
  moduleId: 'module-1',
  title: 'Capstone Project',
  description: 'Build something real.',
  artifacts: [
    { assignmentId: 'assign-1', title: 'Design Document', submissionStatus: 'APPROVED', approved: true },
    { assignmentId: 'assign-2', title: 'Source Code', submissionStatus: 'SUBMITTED', approved: false },
  ],
  allArtifactsApproved: false,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/projects/project-1']}>
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProjectPage (004 Project-based Learning batch, FR-077)', () => {
  beforeEach(() => {
    vi.mocked(projectApi.getMyProjectStatus).mockReset();
  });

  it('shows every required artifact with its own submission status and an overall progress summary', async () => {
    vi.mocked(projectApi.getMyProjectStatus).mockResolvedValue(projectStatus);
    renderPage();

    expect(await screen.findByText('Capstone Project')).toBeInTheDocument();
    expect(screen.getByText('Design Document')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('Source Code')).toBeInTheDocument();
    expect(screen.getByText('Submitted — awaiting review')).toBeInTheDocument();
    expect(screen.getByText('1/2 artifacts approved')).toBeInTheDocument();
  });

  it('links each artifact into its own AssignmentPage', async () => {
    vi.mocked(projectApi.getMyProjectStatus).mockResolvedValue(projectStatus);
    renderPage();

    await screen.findByText('Capstone Project');
    const openLink = screen.getAllByRole('link', { name: 'Open' })[0];
    expect(openLink).toHaveAttribute('href', '/assignments/assign-1');
  });

  it('shows "Project complete" once every artifact is approved', async () => {
    vi.mocked(projectApi.getMyProjectStatus).mockResolvedValue({
      ...projectStatus,
      artifacts: projectStatus.artifacts.map((a) => ({ ...a, submissionStatus: 'APPROVED', approved: true })),
      allArtifactsApproved: true,
    });
    renderPage();

    expect(await screen.findByText('Project complete')).toBeInTheDocument();
  });

  it('shows an error message when the project cannot be loaded (e.g. not enrolled)', async () => {
    vi.mocked(projectApi.getMyProjectStatus).mockRejectedValue({ status: 403, code: 'FORBIDDEN', message: 'Enroll in this course first.' });
    renderPage();

    expect(await screen.findByText('Enroll in this course first.')).toBeInTheDocument();
  });
});
