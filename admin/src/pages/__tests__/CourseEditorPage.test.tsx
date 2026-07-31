import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CourseEditorPage } from '../CourseEditorPage';
import * as lmsApi from '@/api/lms.api';

// Factory mock (rather than bare `vi.mock('@/api/lms.api')`) so that
// plain-constant exports like `COURSE_CLONE_MODES` survive automocking —
// automock replaces every export including arrays, which would otherwise
// silently empty the Clone section's mode <select>.
vi.mock('@/api/lms.api', async () => {
  const actual = await vi.importActual<typeof import('@/api/lms.api')>('@/api/lms.api');
  return {
    ...actual,
    getCourseAdminFull: vi.fn(),
    listCategoriesAdmin: vi.fn(),
    listCourseInstructors: vi.fn(),
    listModulesForCourse: vi.fn(),
    changeCourseStatus: vi.fn(),
    updateCourse: vi.fn(),
    cloneCourse: vi.fn(),
    getTranslationVariantsAdmin: vi.fn(),
    setTranslationStatusAdmin: vi.fn(),
  };
});

const course = {
  id: 'course-1',
  title: 'Intro to Business',
  slug: 'intro-to-business',
  subtitle: null,
  shortDescription: null,
  description: null,
  learningOutcomes: [],
  tags: [],
  targetAudience: null,
  toolsRequired: [],
  thumbnailUrl: null,
  coverImageUrl: null,
  trailerUrl: null,
  language: 'EN',
  level: 'ALL_LEVELS',
  categoryId: null,
  durationMinutes: null,
  estimatedCompletionMinutes: null,
  weeklyCommitmentMinutes: null,
  certificateAvailable: false,
  priceType: 'FREE',
  priceAmountMinor: 0,
  currency: 'INR',
  isFeatured: false,
  status: 'DRAFT',
  enrollmentLimit: null,
  enrollmentStartAt: null,
  enrollmentEndAt: null,
  publishAt: null,
  expireAt: null,
  reviewNotes: null,
  version: 1,
  instructors: [],
  ratingAverage: null,
  ratingCount: 0,
  learnerCount: 0,
  publishedAt: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
  sequencingMode: 'FLEXIBLE',
  translationOfCourseId: null,
  translationStatus: null,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/lms-courses/course-1']}>
      <Routes>
        <Route path="/lms-courses/:id" element={<CourseEditorPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CourseEditorPage (LMS Admin UI batch)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getCourseAdminFull).mockReset();
    vi.mocked(lmsApi.listCategoriesAdmin).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.listCourseInstructors).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.listModulesForCourse).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.changeCourseStatus).mockReset();
    vi.mocked(lmsApi.updateCourse).mockReset();
    vi.mocked(lmsApi.cloneCourse).mockReset();
    vi.mocked(lmsApi.getTranslationVariantsAdmin).mockReset().mockResolvedValue([]);
  });

  it('renders the course and only offers the valid DRAFT->SUBMITTED_FOR_REVIEW transition', async () => {
    vi.mocked(lmsApi.getCourseAdminFull).mockResolvedValue(course);
    renderPage();

    expect(await screen.findByText('Intro to Business')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move to SUBMITTED_FOR_REVIEW' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Move to PUBLISHED/ })).not.toBeInTheDocument();
  });

  it('submits the course for review', async () => {
    vi.mocked(lmsApi.getCourseAdminFull).mockResolvedValue(course);
    vi.mocked(lmsApi.changeCourseStatus).mockResolvedValue({ ...course, status: 'SUBMITTED_FOR_REVIEW' });

    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Move to SUBMITTED_FOR_REVIEW' }));
    expect(lmsApi.changeCourseStatus).toHaveBeenCalledWith('course-1', 'SUBMITTED_FOR_REVIEW', undefined);
  });

  it('saves edited course metadata', async () => {
    vi.mocked(lmsApi.getCourseAdminFull).mockResolvedValue(course);
    vi.mocked(lmsApi.updateCourse).mockResolvedValue({ ...course, title: 'Advanced Business' });

    const user = userEvent.setup();
    renderPage();

    const titleInput = await screen.findByLabelText('Title');
    await user.clear(titleInput);
    await user.type(titleInput, 'Advanced Business');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(lmsApi.updateCourse).toHaveBeenCalledWith(
      'course-1',
      expect.objectContaining({ title: 'Advanced Business', priceType: 'FREE', priceAmountMinor: 0 }),
    );
  });

  it('saves a changed sequencing mode (004 US6 polish batch, FR-034)', async () => {
    vi.mocked(lmsApi.getCourseAdminFull).mockResolvedValue(course);
    vi.mocked(lmsApi.updateCourse).mockResolvedValue({ ...course, sequencingMode: 'SEQUENTIAL' });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Intro to Business');
    await user.selectOptions(screen.getByLabelText('Sequencing mode'), 'SEQUENTIAL');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(lmsApi.updateCourse).toHaveBeenCalledWith('course-1', expect.objectContaining({ sequencingMode: 'SEQUENTIAL' }));
  });

  it('sends the version-policy fields (changeSummary, existingLearnerPolicy) when saving (004 Course Versioning Policy batch, FR-099)', async () => {
    vi.mocked(lmsApi.getCourseAdminFull).mockResolvedValue(course);
    vi.mocked(lmsApi.updateCourse).mockResolvedValue(course);

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Intro to Business');
    await user.type(screen.getByLabelText('Change summary'), 'Reworded the intro.');
    await user.selectOptions(screen.getByLabelText('Existing-learner policy'), 'OPTIONAL_MIGRATION');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(lmsApi.updateCourse).toHaveBeenCalledWith(
      'course-1',
      expect.objectContaining({ versionChangeSummary: 'Reworded the intro.', versionExistingLearnerPolicy: 'OPTIONAL_MIGRATION' }),
    );
  });

  it('clones the course with the selected mode and slug (004 US8)', async () => {
    vi.mocked(lmsApi.getCourseAdminFull).mockResolvedValue(course);
    vi.mocked(lmsApi.cloneCourse).mockResolvedValue({ ...course, id: 'course-2', slug: 'intro-clone' });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Intro to Business');
    await user.selectOptions(screen.getByLabelText('Mode'), 'CURRICULUM_ONLY');
    await user.type(screen.getByLabelText('New slug'), 'intro-clone');
    await user.click(screen.getByRole('button', { name: 'Clone course' }));

    expect(lmsApi.cloneCourse).toHaveBeenCalledWith('course-1', { mode: 'CURRICULUM_ONLY', slug: 'intro-clone', title: undefined, language: undefined });
  });

  it('clones only the question bank when ASSESSMENT_BANK is selected (004 Question Bank batch, T107/FR-098#3)', async () => {
    vi.mocked(lmsApi.getCourseAdminFull).mockResolvedValue(course);
    vi.mocked(lmsApi.cloneCourse).mockResolvedValue({ ...course, id: 'course-3', slug: 'intro-bank' });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Intro to Business');
    await user.selectOptions(screen.getByLabelText('Mode'), 'ASSESSMENT_BANK');
    await user.type(screen.getByLabelText('New slug'), 'intro-bank');

    expect(screen.getByText(/Copies only this course's question bank items/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clone course' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Clone course' }));

    expect(lmsApi.cloneCourse).toHaveBeenCalledWith('course-1', { mode: 'ASSESSMENT_BANK', slug: 'intro-bank', title: undefined, language: undefined });
  });

  it('shows translation status + transition buttons for a course that is itself a translation variant (004 Course Translation batch, FR-101)', async () => {
    const variantCourse = { ...course, translationOfCourseId: 'course-source', translationStatus: 'IN_PROGRESS' };
    vi.mocked(lmsApi.getCourseAdminFull).mockResolvedValue(variantCourse);
    vi.mocked(lmsApi.setTranslationStatusAdmin).mockResolvedValue({ ...variantCourse, translationStatus: 'REVIEW' });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Intro to Business');
    expect(screen.getByText('IN_PROGRESS')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Move to REVIEW' }));

    expect(lmsApi.setTranslationStatusAdmin).toHaveBeenCalledWith('course-1', 'REVIEW');
  });

  it('lists translation variants of the current course, flagging an OUTDATED one', async () => {
    vi.mocked(lmsApi.getCourseAdminFull).mockResolvedValue(course);
    vi.mocked(lmsApi.getTranslationVariantsAdmin).mockResolvedValue([
      { ...course, id: 'course-ta', title: 'Intro to Business (Tamil)', language: 'TA', translationOfCourseId: 'course-1', translationStatus: 'OUTDATED' },
    ]);

    renderPage();

    expect(await screen.findByText('Intro to Business (Tamil)')).toBeInTheDocument();
    expect(screen.getByText('OUTDATED')).toBeInTheDocument();
  });
});
