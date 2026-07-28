import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchCourses, fetchCourseCategories } from '@/api/lms.api';
import type { Course, CourseCategory } from '@/types/lms.types';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { PageSkeleton } from '@/components/system/Skeleton';
import { EmptyState } from '@/components/system/EmptyState';
import { Pagination } from '@/components/system/Pagination';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { formatCoursePrice } from '@/utils/money';

const PAGE_SIZE = 12;
const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'] as const;

/**
 * Phase 6 Part 1 — public course discovery (brief's "Public Frontend
 * Scope": listing route, category/level filter, search, pagination, cards,
 * loading/empty/error states, SEO). Deliberately does NOT render an
 * "Enroll" button — enrollment is Part 2's own feature; a future Part 2
 * adds that action here rather than this phase pre-building a button with
 * no working behavior behind it (brief: "Buttons for future functionality
 * must either be omitted or clearly disabled without misleading users").
 */
export function CourseListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1);
  const q = searchParams.get('q') ?? '';
  const categoryId = searchParams.get('categoryId') ?? undefined;
  const level = searchParams.get('level') ?? undefined;

  const [courses, setCourses] = useState<Course[] | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [inputValue, setInputValue] = useState(q);

  useEffect(() => {
    fetchCourseCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setStatus('loading');
    setCourses(null);
    fetchCourses({ q: q || undefined, categoryId, level }, page, PAGE_SIZE)
      .then((result) => {
        setCourses(result.items);
        setTotalPages(result.meta.totalPages);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [page, q, categoryId, level]);

  useDocumentHead({
    title: 'Courses | CoachX',
    description: 'Browse Tamil-first business, freelancing, and marketing courses.',
  });

  function updateParam(key: string, value: string | undefined) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  }

  function setPage(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Home', url: '/' }, { label: 'Courses', url: '/courses' }]} />
      <h1 className="mb-6 text-3xl font-bold text-slate-900 dark:text-white">Courses</h1>

      <form
        className="mb-6 flex flex-wrap gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          updateParam('q', inputValue.trim() || undefined);
        }}
      >
        <input
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search courses…"
          aria-label="Search courses"
          className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
        <select
          value={categoryId ?? ''}
          onChange={(e) => updateParam('categoryId', e.target.value || undefined)}
          aria-label="Filter by category"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={level ?? ''}
          onChange={(e) => updateParam('level', e.target.value || undefined)}
          aria-label="Filter by level"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        >
          <option value="">All levels</option>
          {LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl.replace('_', ' ')}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
          Search
        </button>
      </form>

      {status === 'loading' && <PageSkeleton />}

      {status === 'error' && (
        <EmptyState icon="⚠️" title="Couldn't load courses" description="Please try again in a moment." />
      )}

      {status === 'ready' && courses !== null && courses.length === 0 && (
        <EmptyState icon="🎓" title="No courses found" description="Try a different search or filter." />
      )}

      {status === 'ready' && courses !== null && courses.length > 0 && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.slug}`}
                className="flex flex-col overflow-hidden rounded-lg border border-slate-200 transition hover:border-brand-400 dark:border-slate-800"
              >
                {course.thumbnailUrl && (
                  <img src={course.thumbnailUrl} alt="" className="h-40 w-full object-cover" loading="lazy" />
                )}
                <div className="flex flex-1 flex-col p-4">
                  {course.category && (
                    <span className="mb-1 text-xs font-medium uppercase tracking-wide text-brand-600 dark:text-brand-400">
                      {course.category.name}
                    </span>
                  )}
                  <h2 className="font-semibold text-slate-900 dark:text-white">{course.title}</h2>
                  {course.shortDescription && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{course.shortDescription}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3 text-sm">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {formatCoursePrice(course.priceType, course.priceAmountMinor, course.currency)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{course.level.replace('_', ' ')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
