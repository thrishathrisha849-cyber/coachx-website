import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CourseListPage } from '../CourseListPage';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const sampleCourse = {
  id: '1',
  title: 'Intro to Tamil Business',
  slug: 'intro-to-tamil-business',
  subtitle: null,
  shortDescription: 'Learn the basics',
  description: null,
  learningOutcomes: [],
  tags: [],
  targetAudience: null,
  toolsRequired: [],
  thumbnailUrl: null,
  coverImageUrl: null,
  trailerUrl: null,
  language: 'EN',
  level: 'BEGINNER',
  category: { id: 'c1', name: 'Business', slug: 'business', description: null, shortDescription: null, imageUrl: null, icon: null, parentId: null, sortOrder: 0, isFeatured: false },
  durationMinutes: 120,
  estimatedCompletionMinutes: 120,
  weeklyCommitmentMinutes: null,
  certificateAvailable: false,
  priceType: 'FREE',
  priceAmountMinor: 0,
  currency: 'INR',
  isFeatured: false,
  ratingAverage: null,
  ratingCount: 0,
  learnerCount: 0,
  instructors: [],
  seo: { title: 'Intro to Tamil Business', description: null, canonicalUrl: null },
  publishedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('CourseListPage (Phase 6 Part 1)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.fetchCourses).mockReset();
    vi.mocked(lmsApi.fetchCourseCategories).mockReset();
    vi.mocked(lmsApi.fetchCourseCategories).mockResolvedValue([]);
  });

  it('renders published courses fetched from the LMS API', async () => {
    vi.mocked(lmsApi.fetchCourses).mockResolvedValue({
      items: [sampleCourse],
      meta: { page: 1, pageSize: 12, totalItems: 1, totalPages: 1 },
    });

    render(<MemoryRouter><CourseListPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByRole('link', { name: /Intro to Tamil Business/ })).toBeInTheDocument());
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('shows an empty state when there are no courses', async () => {
    vi.mocked(lmsApi.fetchCourses).mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 12, totalItems: 0, totalPages: 0 },
    });

    render(<MemoryRouter><CourseListPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('No courses found')).toBeInTheDocument());
  });

  it('shows an error state when the request fails', async () => {
    vi.mocked(lmsApi.fetchCourses).mockRejectedValue(new Error('network error'));

    render(<MemoryRouter><CourseListPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText("Couldn't load courses")).toBeInTheDocument());
  });
});
