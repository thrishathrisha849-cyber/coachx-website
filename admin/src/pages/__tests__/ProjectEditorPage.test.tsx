import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProjectEditorPage } from '../ProjectEditorPage';
import * as projectApi from '@/api/project.api';

vi.mock('@/api/project.api');

const projectWithOneArtifact: projectApi.AdminProjectWithArtifacts = {
  id: 'project-1',
  moduleId: 'module-1',
  title: 'Capstone Project',
  description: 'Build something real.',
  status: 'DRAFT',
  version: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  artifacts: [{ assignmentId: 'assign-1', title: 'Design Document', status: 'PUBLISHED', projectPosition: 0 }],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/projects/project-1']}>
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectEditorPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProjectEditorPage (004 Project-based Learning batch, FR-077)', () => {
  beforeEach(() => {
    vi.mocked(projectApi.getProject).mockReset();
    vi.mocked(projectApi.updateProject).mockReset();
    vi.mocked(projectApi.changeProjectStatus).mockReset();
    vi.mocked(projectApi.linkArtifact).mockReset();
    vi.mocked(projectApi.unlinkArtifact).mockReset();
    vi.mocked(projectApi.listCandidateAssignmentsForModule).mockReset().mockResolvedValue([]);
  });

  it('shows the project details and its linked artifacts', async () => {
    vi.mocked(projectApi.getProject).mockResolvedValue(projectWithOneArtifact);
    renderPage();

    expect(await screen.findByText('Capstone Project')).toBeInTheDocument();
    expect(screen.getByText('Design Document')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move to PUBLISHED' })).toBeInTheDocument();
  });

  it('links a selected candidate assignment as a new artifact', async () => {
    vi.mocked(projectApi.getProject).mockResolvedValue(projectWithOneArtifact);
    vi.mocked(projectApi.listCandidateAssignmentsForModule).mockResolvedValue([
      { id: 'assign-2', title: 'Source Code', status: 'PUBLISHED', lessonId: 'lesson-2', alreadyLinked: false },
    ]);
    vi.mocked(projectApi.linkArtifact).mockResolvedValue({ ...projectWithOneArtifact, artifacts: [...projectWithOneArtifact.artifacts, { assignmentId: 'assign-2', title: 'Source Code', status: 'PUBLISHED', projectPosition: 1 }] });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Capstone Project');
    await user.selectOptions(screen.getByLabelText('Link an existing assignment'), 'assign-2');
    await user.click(screen.getByRole('button', { name: 'Link' }));

    expect(projectApi.linkArtifact).toHaveBeenCalledWith('project-1', 'assign-2');
  });

  it('unlinks an artifact', async () => {
    vi.mocked(projectApi.getProject).mockResolvedValue(projectWithOneArtifact);
    vi.mocked(projectApi.unlinkArtifact).mockResolvedValue({ ...projectWithOneArtifact, artifacts: [] });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Design Document');
    await user.click(screen.getByRole('button', { name: 'Unlink' }));

    expect(projectApi.unlinkArtifact).toHaveBeenCalledWith('project-1', 'assign-1');
  });

  it('changes the project status', async () => {
    vi.mocked(projectApi.getProject).mockResolvedValue(projectWithOneArtifact);
    vi.mocked(projectApi.changeProjectStatus).mockResolvedValue({ ...projectWithOneArtifact, status: 'PUBLISHED' });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Capstone Project');
    await user.click(screen.getByRole('button', { name: 'Move to PUBLISHED' }));

    expect(projectApi.changeProjectStatus).toHaveBeenCalledWith('project-1', 'PUBLISHED');
  });
});
