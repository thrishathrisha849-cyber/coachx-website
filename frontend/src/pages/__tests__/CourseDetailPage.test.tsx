import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CourseDetailPage } from '../CourseDetailPage';
import * as lmsApi from '@/api/lms.api';
import * as authContext from '@/context/auth.context';

vi.mock('@/api/lms.api');
vi.mock('@/context/auth.context');

const sampleCourse = {
  id: 'course-1',
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
  category: null,
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
  modules: [],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/courses/intro-to-tamil-business']}>
      <Routes>
        <Route path="/courses/:slug" element={<CourseDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CourseDetailPage — enroll CTA (004 US1)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.fetchCourseBySlug).mockReset().mockResolvedValue(sampleCourse);
    vi.mocked(lmsApi.getMyCourseAccess).mockReset();
    vi.mocked(lmsApi.enrollInCourse).mockReset();
  });

  it('prompts an unauthenticated visitor to log in rather than showing an enroll button', async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({ isAuthenticated: false } as ReturnType<typeof authContext.useAuth>);
    renderPage();

    expect(await screen.findByRole('link', { name: 'Log in to enroll' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enroll now' })).not.toBeInTheDocument();
  });

  it('shows an Enroll button when the server reports ENROLLMENT_REQUIRED, and calls the real enroll endpoint on click', async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({ isAuthenticated: true } as ReturnType<typeof authContext.useAuth>);
    vi.mocked(lmsApi.getMyCourseAccess).mockResolvedValue({ allowed: false, reason: 'ENROLLMENT_REQUIRED', message: 'Enroll in this course to access it' });
    vi.mocked(lmsApi.enrollInCourse).mockResolvedValue({} as Awaited<ReturnType<typeof lmsApi.enrollInCourse>>);

    const user = userEvent.setup();
    renderPage();

    const enrollButton = await screen.findByRole('button', { name: 'Enroll now' });
    await user.click(enrollButton);

    await waitFor(() => expect(lmsApi.enrollInCourse).toHaveBeenCalledWith('course-1'));
  });

  it('shows a Continue Learning link when access is already allowed, never a duplicate enroll button', async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({ isAuthenticated: true } as ReturnType<typeof authContext.useAuth>);
    vi.mocked(lmsApi.getMyCourseAccess).mockResolvedValue({ allowed: true });

    renderPage();

    expect(await screen.findByRole('link', { name: 'Continue learning' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enroll now' })).not.toBeInTheDocument();
  });

  it('shows the server\'s denial message (never a generic error) when access is denied for a reason other than missing enrollment', async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({ isAuthenticated: true } as ReturnType<typeof authContext.useAuth>);
    vi.mocked(lmsApi.getMyCourseAccess).mockResolvedValue({ allowed: false, reason: 'ENROLLMENT_SUSPENDED', message: 'Your enrollment is currently suspended' });

    renderPage();

    expect(await screen.findByText('Your enrollment is currently suspended')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enroll now' })).not.toBeInTheDocument();
  });
});
