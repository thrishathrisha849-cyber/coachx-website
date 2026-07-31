import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LmsCoursesPage } from '../LmsCoursesPage';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

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
  categoryId: 'cat-1',
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

const category = {
  id: 'cat-1',
  name: 'Business',
  slug: 'business',
  description: null,
  shortDescription: null,
  imageUrl: null,
  icon: null,
  parentId: null,
  sortOrder: 0,
  isFeatured: false,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  sequencingMode: 'FLEXIBLE',
};

function renderPage() {
  return render(
    <MemoryRouter>
      <LmsCoursesPage />
    </MemoryRouter>,
  );
}

describe('LmsCoursesPage (LMS Admin UI batch)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.listCoursesAdmin).mockReset();
    vi.mocked(lmsApi.listCategoriesAdmin).mockReset();
    vi.mocked(lmsApi.createCourse).mockReset();
    vi.mocked(lmsApi.listCategoriesAdmin).mockResolvedValue([category]);
  });

  it('lists courses fetched from the admin API', async () => {
    vi.mocked(lmsApi.listCoursesAdmin).mockResolvedValue({ data: [course], meta: { page: 1, pageSize: 100, totalItems: 1, totalPages: 1 } });
    renderPage();

    expect(await screen.findByText('Intro to Business')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Intro to Business/ })).toHaveTextContent('DRAFT');
  });

  it('creates a course and requires title/slug/category before enabling submit', async () => {
    vi.mocked(lmsApi.listCoursesAdmin).mockResolvedValue({ data: [], meta: { page: 1, pageSize: 100, totalItems: 0, totalPages: 0 } });
    vi.mocked(lmsApi.createCourse).mockResolvedValue(course);

    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: '+ New course (quick)' }));
    const createButton = screen.getByRole('button', { name: 'Create' });
    expect(createButton).toBeDisabled();

    await user.type(screen.getByLabelText('Title'), 'Intro to Business');
    await user.type(screen.getByLabelText('Slug'), 'intro-to-business');
    await user.selectOptions(screen.getByLabelText('Category'), 'cat-1');
    expect(createButton).not.toBeDisabled();

    await user.click(createButton);
    expect(lmsApi.createCourse).toHaveBeenCalledWith({ title: 'Intro to Business', slug: 'intro-to-business', categoryId: 'cat-1' });
  });
});
