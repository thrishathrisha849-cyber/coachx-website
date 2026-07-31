import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AssignmentEditorPage } from '../AssignmentEditorPage';
import * as assignmentApi from '@/api/assignment.api';

// Factory mock (rather than bare `vi.mock('@/api/assignment.api')`) so that
// the plain-constant export `ASSESSMENT_TYPES` survives automocking —
// automock replaces every export including arrays, which would otherwise
// silently empty the assessment-type <select> (same gotcha documented in
// CourseEditorPage.test.tsx for `COURSE_CLONE_MODES`).
vi.mock('@/api/assignment.api', async () => {
  const actual = await vi.importActual<typeof import('@/api/assignment.api')>('@/api/assignment.api');
  return {
    ...actual,
    createAssignment: vi.fn(),
    getAssignment: vi.fn(),
  };
});

const createdAssignment: assignmentApi.AdminAssignment = {
  id: 'assign-1',
  lessonId: 'lesson-1',
  title: 'Rate your skills',
  instructions: null,
  learningOutcome: null,
  submissionFormat: 'TEXT',
  allowedFileTypes: [],
  dueAt: null,
  maxScore: 100,
  passingScore: 70,
  latePolicy: 'ACCEPT',
  maxAttempts: null,
  status: 'DRAFT',
  version: 1,
  assessmentType: 'SKILL_RATING',
  peerReviewEnabled: false,
  peerReviewsRequired: 0,
  peerReviewAnonymous: true,
  peerReviewDeadlineDays: null,
  peerReviewIncludeInGrade: false,
};

const assignmentWithRubric: assignmentApi.AdminAssignmentWithRubric = { ...createdAssignment, rubricCriteria: [] };

function renderCreatePage() {
  return render(
    <MemoryRouter initialEntries={['/assignments/new?lessonId=lesson-1']}>
      <Routes>
        <Route path="/assignments/:assignmentId" element={<AssignmentEditorPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AssignmentEditorPage — assessment type (004 Broader Assessment Types batch, FR-068)', () => {
  beforeEach(() => {
    vi.mocked(assignmentApi.createAssignment).mockReset();
    // Default so a post-create navigation into the (now assignmentId-bearing)
    // manager view — which this page performs automatically — doesn't crash
    // on an un-mocked call; test 2 overrides this with its own value.
    vi.mocked(assignmentApi.getAssignment).mockReset().mockResolvedValue(assignmentWithRubric);
  });

  it('defaults to STANDARD and creates with the selected assessment type', async () => {
    vi.mocked(assignmentApi.createAssignment).mockResolvedValue(createdAssignment);
    const user = userEvent.setup();
    renderCreatePage();

    expect(screen.getByLabelText('Assessment type (FR-068)')).toHaveValue('STANDARD');

    await user.type(screen.getByLabelText('Title'), 'Rate your skills');
    await user.selectOptions(screen.getByLabelText('Assessment type (FR-068)'), 'SKILL_RATING');
    expect(screen.getByText(/no instructor review step/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Create assignment' }));

    expect(assignmentApi.createAssignment).toHaveBeenCalledWith('lesson-1', expect.objectContaining({ assessmentType: 'SKILL_RATING' }));
  });

  it('shows the assessment-type label once an assignment is loaded', async () => {
    vi.mocked(assignmentApi.getAssignment).mockResolvedValue(assignmentWithRubric);

    render(
      <MemoryRouter initialEntries={['/assignments/assign-1']}>
        <Routes>
          <Route path="/assignments/:assignmentId" element={<AssignmentEditorPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Skill rating (learner-scored)')).toBeInTheDocument();
  });
});
