import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCourseBySlug } from '@/api/lms.api';
import type { CourseWithModules } from '@/types/lms.types';
import type { NormalizedApiError } from '@/api/client';
import { useDocumentHead, useStructuredData } from '@/hooks/useDocumentHead';
import { PageSkeleton } from '@/components/system/Skeleton';
import { NotFound } from '@/components/system/NotFound';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { formatCoursePrice } from '@/utils/money';
import { sanitizeRichText } from '@/utils/sanitizeHtml';

/**
 * Phase 6 Part 1 — public course detail (brief's "Public Frontend Scope").
 * Renders title/description/instructors/modules (syllabus) and SEO/
 * structured data. Deliberately does NOT render: an enrollment button,
 * checkout, progress, lesson player, reviews, or wishlist — all Part 2/3
 * (brief: "Do not implement enrollment button behavior"). The module list
 * is a read-only syllabus outline (title + preview flag only) — no lesson
 * content exists yet to link into.
 */
export function CourseDetailPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<CourseWithModules | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found'>('loading');

  useEffect(() => {
    setStatus('loading');
    setCourse(null);
    fetchCourseBySlug(slug)
      .then((result) => {
        setCourse(result);
        setStatus('ready');
      })
      .catch((err: NormalizedApiError) => setStatus(err.status === 404 ? 'not-found' : 'not-found'));
  }, [slug]);

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

          {course.modules.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-xl font-bold text-slate-900 dark:text-white">Course content</h2>
              <ol className="divide-y divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
                {course.modules.map((module, index) => (
                  <li key={module.id} className="flex items-center justify-between p-4">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {index + 1}. {module.title}
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
        </div>

        <aside className="rounded-lg border border-slate-200 p-5 dark:border-slate-800">
          <p className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
            {formatCoursePrice(course.priceType, course.priceAmountMinor, course.currency)}
          </p>

          {/* Enrollment is a Part 2 feature — deliberately not rendered as
              a misleading disabled button here; see file header note. */}

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
