import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchCourseBySlug, getMyCourseAccess, enrollInCourse, type CourseAccessDecision } from '@/api/lms.api';
import type { CourseWithModules } from '@/types/lms.types';
import type { NormalizedApiError } from '@/api/client';
import { useAuth } from '@/context/auth.context';
import { useDocumentHead, useStructuredData } from '@/hooks/useDocumentHead';
import { PageSkeleton } from '@/components/system/Skeleton';
import { NotFound } from '@/components/system/NotFound';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { formatCoursePrice } from '@/utils/money';
import { sanitizeRichText } from '@/utils/sanitizeHtml';
import {
  getCourseReviews,
  getMyReviewEligibility,
  getMyCourseReview,
  submitCourseReview,
  type PublicCourseReview,
} from '@/api/course-review.api';
import { CourseWaitlistPanel } from '@/components/lms/CourseWaitlistPanel';
import { CourseWishlistPanel } from '@/components/lms/CourseWishlistPanel';
import { VersionMigrationBanner } from '@/components/lms/VersionMigrationBanner';

/**
 * Phase 6 Part 1 — public course detail. Renders title/description/
 * instructors/modules (syllabus) and SEO/structured data.
 *
 * 004 US1: the enroll CTA (deliberately absent when this page was first
 * built, before Part 2's enrollment work existed) is added here — it calls
 * the real `POST /lms/me/enrollments` and reflects the server's own access
 * decision (`GET /lms/me/courses/:courseId/access`) rather than a
 * client-guessed enrolled/not-enrolled state.
 */
export function CourseDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found'>('loading');
  const [access, setAccess] = useState<CourseAccessDecision | null>(null);
  const [enrollStatus, setEnrollStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [courseFull, setCourseFull] = useState(false);
  const [courseLocked, setCourseLocked] = useState(false);

  useEffect(() => {
    setStatus('loading');
    setCourse(null);
    setAccess(null);
    fetchCourseBySlug(slug)
      .then((result) => {
        setCourse(result);
        setStatus('ready');
        if (isAuthenticated) {
          getMyCourseAccess(result.id).then(setAccess).catch(() => setAccess(null));
        }
      })
      .catch((err: NormalizedApiError) => setStatus(err.status === 404 ? 'not-found' : 'not-found'));
  }, [slug, isAuthenticated]);

  const handleEnroll = async () => {
    if (!course) return;
    setEnrollStatus('submitting');
    setEnrollError(null);
    try {
      await enrollInCourse(course.id);
      navigate(`/learn/${course.id}`);
    } catch (err) {
      setEnrollStatus('error');
      const normalized = err as NormalizedApiError;
      // FR-028/029 — a full course surfaces the waitlist join flow instead
      // of a plain error; `code` here is the server's disambiguating detail
      // (see `enrollment.service.ts`'s capacity check), not the generic
      // CONFLICT top-level error code.
      if (normalized.status === 409 && (normalized.details as { code?: string } | undefined)?.code === 'COURSE_FULL') {
        setCourseFull(true);
      } else if (normalized.status === 400 && (normalized.details as { code?: string } | undefined)?.code === 'COURSE_UNAVAILABLE') {
        // FR-027 — a paused (ENROLLMENT_PAUSED) course surfaces the
        // wishlist save flow instead of a plain error.
        setCourseLocked(true);
      } else {
        setEnrollError(normalized.message ?? 'Could not enroll. Please try again.');
      }
    }
  };

  useDocumentHead({
    title: course?.seo.title ?? 'Course | CoachX',
    description: course?.seo.description,
    canonicalUrl: course?.seo.canonicalUrl,
    ogImageUrl: course?.coverImageUrl ?? course?.thumbnailUrl ?? undefined,
  });

  useStructuredData(
    course
      ? {
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: course.title,
          description: course.seo.description ?? course.shortDescription ?? undefined,
          provider: { '@type': 'Organization', name: 'CoachX' },
          ...(course.priceType === 'PAID'
            ? {
                offers: {
                  '@type': 'Offer',
                  price: (course.priceAmountMinor / 100).toFixed(2),
                  priceCurrency: course.currency,
                },
              }
            : {}),
        }
      : null,
    'course',
  );

  if (status === 'loading') return <PageSkeleton />;
  if (status === 'not-found' || !course) return <NotFound />;

  const primaryInstructor = course.instructors.find((i) => i.isPrimary) ?? course.instructors[0];

  return (
    <article>
      <Breadcrumbs
        items={[
          { label: 'Home', url: '/' },
          { label: 'Courses', url: '/courses' },
          { label: course.title, url: `/courses/${course.slug}` },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {course.category && (
            <span className="mb-2 inline-block text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
              {course.category.name}
            </span>
          )}
          <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">{course.title}</h1>
          {course.subtitle && <p className="mb-4 text-lg text-slate-600 dark:text-slate-300">{course.subtitle}</p>}

          {course.coverImageUrl && (
            <img src={course.coverImageUrl} alt="" className="mb-6 w-full rounded-lg object-cover" loading="lazy" />
          )}

          {course.description && (
            // Rich-text description sanitized via the SAME DOMPurify
            // allowlist the CMS TEXT block uses (docs/lms/SECURITY.md) —
            // no second, backend-side sanitizer was introduced.
            <div
              className="prose prose-slate max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(course.description) }}
            />
          )}

          {course.learningOutcomes.length > 0 && (
            // 004 FR-020: course overview MUST show outcomes.
            <section className="mt-8">
              <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">What you'll learn</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {course.learningOutcomes.map((outcome) => (
                  <li key={outcome} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span aria-hidden="true" className="text-brand-600 dark:text-brand-400">
                      ✓
                    </span>
                    {outcome}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {course.modules.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">Course content</h2>
              <ol className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {course.modules.map((module, index) => (
                  <li key={module.id} className="flex items-center justify-between p-4">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {index + 1}. {module.title}
                      {module.estimatedDurationMinutes && (
                        <span className="ml-2 font-normal text-slate-500 dark:text-slate-400">
                          ({module.estimatedDurationMinutes} min)
                        </span>
                      )}
                    </span>
                    {module.isPreview && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        Preview
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <CourseReviewsSection courseId={course.id} ratingAverage={course.ratingAverage} ratingCount={course.ratingCount} isAuthenticated={isAuthenticated} />
        </div>

        <aside className="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
          <p className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
            {formatCoursePrice(course.priceType, course.priceAmountMinor, course.currency)}
          </p>

          <div className="mb-4">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="block w-full rounded-md bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-700"
              >
                Log in to enroll
              </Link>
            ) : access?.allowed ? (
              <>
                <Link
                  to={`/learn/${course.id}`}
                  className="block w-full rounded-md bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Continue learning
                </Link>
                <VersionMigrationBanner courseId={course.id} />
              </>
            ) : courseFull ? (
              <CourseWaitlistPanel courseId={course.id} onClaimed={() => navigate(`/learn/${course.id}`)} />
            ) : courseLocked ? (
              <CourseWishlistPanel courseId={course.id} />
            ) : access?.reason === 'ENROLLMENT_REQUIRED' ? (
              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrollStatus === 'submitting'}
                className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {enrollStatus === 'submitting' ? 'Enrolling…' : 'Enroll now'}
              </button>
            ) : access ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                {access.message}
              </p>
            ) : null}
            {enrollError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{enrollError}</p>}
          </div>

          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Level</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{course.level.replace('_', ' ')}</dd>
            </div>
            {course.durationMinutes && (
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Duration</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{Math.round(course.durationMinutes / 60)} hours</dd>
              </div>
            )}
            {primaryInstructor && (
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Instructor</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{primaryInstructor.displayName}</dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </article>
  );
}

/** 004 Discovery & Recommendations batch (FR-087) — public review list + rating aggregate, plus a submit form gated by the server's own eligibility check (never a client-side guess at "enrolled enough to review"). */
function CourseReviewsSection({
  courseId,
  ratingAverage,
  ratingCount,
  isAuthenticated,
}: {
  courseId: string;
  ratingAverage: number | null;
  ratingCount: number;
  isAuthenticated: boolean;
}) {
  const [reviews, setReviews] = useState<PublicCourseReview[]>([]);
  const [eligible, setEligible] = useState<{ eligible: boolean; reason?: string } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    getCourseReviews(courseId).then(setReviews).catch(() => undefined);
    if (isAuthenticated) {
      getMyReviewEligibility(courseId).then(setEligible).catch(() => undefined);
      getMyCourseReview(courseId).then((existing) => {
        if (existing) {
          setRating(existing.rating);
          setComment(existing.comment ?? '');
          setSubmitted(true);
        }
      }).catch(() => undefined);
    }
  }, [courseId, isAuthenticated]);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await submitCourseReview(courseId, { rating, comment: comment.trim() || undefined, wouldRecommend: rating >= 4, isAnonymous: false });
      setSubmitted(true);
      getCourseReviews(courseId).then(setReviews).catch(() => undefined);
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
        Reviews {ratingCount > 0 && <span className="text-base font-normal text-slate-500 dark:text-slate-400">({ratingAverage?.toFixed(1)} · {ratingCount} review{ratingCount === 1 ? '' : 's'})</span>}
      </h2>

      {isAuthenticated && eligible && (
        eligible.eligible ? (
          <div className="mb-6 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{submitted ? 'Update your review' : 'Write a review'}</p>
            <div className="mb-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`Rate ${n} star${n === 1 ? '' : 's'}`} className={n <= rating ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'}>
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share your experience with this course…"
              aria-label="Review comment"
              className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
            />
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-2 rounded-md bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : submitted ? 'Update review' : 'Submit review'}
            </button>
          </div>
        ) : (
          <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">{eligible.reason}</p>
        )
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No reviews yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-amber-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                <span className="text-xs text-slate-400">{review.reviewerName ?? 'Anonymous'}</span>
              </div>
              {review.comment && <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{review.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
