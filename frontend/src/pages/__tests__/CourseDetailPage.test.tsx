import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CourseDetailPage } from '../CourseDetailPage';
import * as lmsApi from '@/api/lms.api';
import * as authContext from '@/context/auth.context';
import * as courseReviewApi from '@/api/course-review.api';

vi.mock('@/api/lms.api');
vi.mock('@/context/auth.context');
vi.mock('@/api/course-review.api');

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
    vi.mocked(lmsApi.getMyEnrollments).mockReset().mockResolvedValue([]);
    vi.mocked(courseReviewApi.getCourseReviews).mockReset().mockResolvedValue([]);
    vi.mocked(courseReviewApi.getMyReviewEligibility).mockReset().mockResolvedValue({ eligible: false, reason: 'Not eligible yet.' });
    vi.mocked(courseReviewApi.getMyCourseReview).mockReset().mockResolvedValue(null);
    vi.mocked(courseReviewApi.submitCourseReview).mockReset();
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

describe('CourseDetailPage — waitlist on a full course (004 Waitlist batch, FR-028/029)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.fetchCourseBySlug).mockReset().mockResolvedValue(sampleCourse);
    vi.mocked(lmsApi.getMyCourseAccess).mockReset();
    vi.mocked(lmsApi.enrollInCourse).mockReset();
    vi.mocked(lmsApi.getMyWaitlistEntry).mockReset();
    vi.mocked(lmsApi.joinWaitlist).mockReset();
    vi.mocked(lmsApi.getMyEnrollments).mockReset().mockResolvedValue([]);
    vi.mocked(courseReviewApi.getCourseReviews).mockReset().mockResolvedValue([]);
    vi.mocked(courseReviewApi.getMyReviewEligibility).mockReset().mockResolvedValue({ eligible: false, reason: 'Not eligible yet.' });
    vi.mocked(courseReviewApi.getMyCourseReview).mockReset().mockResolvedValue(null);
  });

  it('replaces the Enroll button with the waitlist join panel once the enroll attempt comes back COURSE_FULL', async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({ isAuthenticated: true } as ReturnType<typeof authContext.useAuth>);
    vi.mocked(lmsApi.getMyCourseAccess).mockResolvedValue({ allowed: false, reason: 'ENROLLMENT_REQUIRED', message: 'Enroll in this course to access it' });
    vi.mocked(lmsApi.enrollInCourse).mockRejectedValue({ status: 409, code: 'CONFLICT', message: 'This course has reached its enrollment capacity', details: { code: 'COURSE_FULL' } });
    vi.mocked(lmsApi.getMyWaitlistEntry).mockResolvedValue(null);

    const user = userEvent.setup();
    renderPage();

    const enrollButton = await screen.findByRole('button', { name: 'Enroll now' });
    await user.click(enrollButton);

    expect(await screen.findByRole('button', { name: 'Join the waitlist' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enroll now' })).not.toBeInTheDocument();
  });

  it('shows a generic error, not the waitlist panel, for a 409 that is not COURSE_FULL', async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({ isAuthenticated: true } as ReturnType<typeof authContext.useAuth>);
    vi.mocked(lmsApi.getMyCourseAccess).mockResolvedValue({ allowed: false, reason: 'ENROLLMENT_REQUIRED', message: 'Enroll in this course to access it' });
    vi.mocked(lmsApi.enrollInCourse).mockRejectedValue({ status: 409, code: 'CONFLICT', message: 'An enrollment for this user and course already exists' });

    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Enroll now' }));

    expect(await screen.findByText('An enrollment for this user and course already exists')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Join the waitlist' })).not.toBeInTheDocument();
  });
});

describe('CourseDetailPage — wishlist on a paused course (004 Wishlist batch, FR-027)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.fetchCourseBySlug).mockReset().mockResolvedValue(sampleCourse);
    vi.mocked(lmsApi.getMyCourseAccess).mockReset();
    vi.mocked(lmsApi.enrollInCourse).mockReset();
    vi.mocked(lmsApi.getMyWishlist).mockReset();
    vi.mocked(lmsApi.saveToWishlist).mockReset();
    vi.mocked(lmsApi.getMyEnrollments).mockReset().mockResolvedValue([]);
    vi.mocked(courseReviewApi.getCourseReviews).mockReset().mockResolvedValue([]);
    vi.mocked(courseReviewApi.getMyReviewEligibility).mockReset().mockResolvedValue({ eligible: false, reason: 'Not eligible yet.' });
    vi.mocked(courseReviewApi.getMyCourseReview).mockReset().mockResolvedValue(null);
  });

  it('replaces the Enroll button with the wishlist save panel once the enroll attempt comes back COURSE_UNAVAILABLE', async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({ isAuthenticated: true } as ReturnType<typeof authContext.useAuth>);
    vi.mocked(lmsApi.getMyCourseAccess).mockResolvedValue({ allowed: false, reason: 'ENROLLMENT_REQUIRED', message: 'Enroll in this course to access it' });
    vi.mocked(lmsApi.enrollInCourse).mockRejectedValue({ status: 400, code: 'VALIDATION_ERROR', message: 'Course is not accepting new enrollment (status: ENROLLMENT_PAUSED)', details: { code: 'COURSE_UNAVAILABLE' } });
    vi.mocked(lmsApi.getMyWishlist).mockResolvedValue([]);

    const user = userEvent.setup();
    renderPage();

    const enrollButton = await screen.findByRole('button', { name: 'Enroll now' });
    await user.click(enrollButton);

    expect(await screen.findByRole('button', { name: /Save to wishlist/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enroll now' })).not.toBeInTheDocument();
  });

  it('shows a generic error, not the wishlist panel, for a 400 that is not COURSE_UNAVAILABLE', async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({ isAuthenticated: true } as ReturnType<typeof authContext.useAuth>);
    vi.mocked(lmsApi.getMyCourseAccess).mockResolvedValue({ allowed: false, reason: 'ENROLLMENT_REQUIRED', message: 'Enroll in this course to access it' });
    vi.mocked(lmsApi.enrollInCourse).mockRejectedValue({ status: 400, code: 'VALIDATION_ERROR', message: 'Something else went wrong' });

    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Enroll now' }));

    expect(await screen.findByText('Something else went wrong')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Save to wishlist/ })).not.toBeInTheDocument();
  });
});

describe('CourseDetailPage — reviews (004 Discovery & Recommendations batch, FR-087)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.fetchCourseBySlug).mockReset().mockResolvedValue(sampleCourse);
    vi.mocked(lmsApi.getMyCourseAccess).mockReset();
    vi.mocked(lmsApi.getMyEnrollments).mockReset().mockResolvedValue([]);
    vi.mocked(courseReviewApi.getCourseReviews).mockReset();
    vi.mocked(courseReviewApi.getMyReviewEligibility).mockReset();
    vi.mocked(courseReviewApi.getMyCourseReview).mockReset().mockResolvedValue(null);
    vi.mocked(courseReviewApi.submitCourseReview).mockReset();
  });

  it('lists existing public reviews', async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({ isAuthenticated: false } as ReturnType<typeof authContext.useAuth>);
    vi.mocked(courseReviewApi.getCourseReviews).mockResolvedValue([
      { id: 'rev-1', reviewerName: 'Jordan Lee', rating: 5, title: null, comment: 'Great course!', outcome: null, wouldRecommend: true, createdAt: '2026-01-01T00:00:00.000Z' },
    ]);

    renderPage();

    expect(await screen.findByText('Great course!')).toBeInTheDocument();
  });

  it('shows a write-review form when the server reports the learner eligible, and submits the rating', async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({ isAuthenticated: true } as ReturnType<typeof authContext.useAuth>);
    vi.mocked(lmsApi.getMyCourseAccess).mockResolvedValue({ allowed: true });
    vi.mocked(courseReviewApi.getCourseReviews).mockResolvedValue([]);
    vi.mocked(courseReviewApi.getMyReviewEligibility).mockResolvedValue({ eligible: true });
    vi.mocked(courseReviewApi.submitCourseReview).mockResolvedValue({
      id: 'rev-1',
      courseId: 'course-1',
      rating: 4,
      title: null,
      comment: 'Solid',
      outcome: null,
      wouldRecommend: true,
      isAnonymous: false,
      status: 'VISIBLE',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Write a review');
    await user.type(screen.getByPlaceholderText("Share your experience with this course…"), 'Solid');
    await user.click(screen.getByRole('button', { name: 'Submit review' }));

    await waitFor(() => expect(courseReviewApi.submitCourseReview).toHaveBeenCalledWith('course-1', { rating: 5, comment: 'Solid', wouldRecommend: true, isAnonymous: false }));
  });

  it('shows the ineligibility reason instead of the form when the learner is not yet eligible', async () => {
    vi.mocked(authContext.useAuth).mockReturnValue({ isAuthenticated: true } as ReturnType<typeof authContext.useAuth>);
    vi.mocked(lmsApi.getMyCourseAccess).mockResolvedValue({ allowed: true });
    vi.mocked(courseReviewApi.getCourseReviews).mockResolvedValue([]);
    vi.mocked(courseReviewApi.getMyReviewEligibility).mockResolvedValue({ eligible: false, reason: 'Complete at least 50% of this course before leaving a review (currently 0%).' });

    renderPage();

    expect(await screen.findByText(/Complete at least 50%/)).toBeInTheDocument();
    expect(screen.queryByText('Write a review')).not.toBeInTheDocument();
  });
});
