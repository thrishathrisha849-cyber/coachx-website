import { useState } from 'react';
import { listCourseReviewsAdmin, moderateReview, type AdminCourseReview } from '@/api/course-review.api';
import type { NormalizedApiError } from '@/api/client';

/** 004 Discovery & Recommendations batch (FR-087) — admin review moderation. HIDE/RESTORE only, never a delete — see backend/src/lms/course-review.service.ts. */
export function CourseReviewsPage() {
  const [courseId, setCourseId] = useState('');
  const [reviews, setReviews] = useState<AdminCourseReview[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});

  async function handleLookup() {
    if (!courseId.trim()) return;
    setStatus('loading');
    setError(null);
    try {
      const rows = await listCourseReviewsAdmin(courseId.trim());
      setReviews(rows);
      setStatus('ready');
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not find reviews for that course.');
      setStatus('error');
    }
  }

  async function handleModerate(reviewId: string, action: 'HIDE' | 'RESTORE') {
    try {
      await moderateReview(reviewId, action, reasonDrafts[reviewId]);
      handleLookup();
    } catch (err) {
      setError((err as NormalizedApiError).message ?? 'Could not moderate this review.');
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Course Reviews</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">FR-087 — moderate reviews for a course. Hiding a review never deletes it.</p>

      <div className="mt-6 flex gap-2">
        <input
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          placeholder="Course ID"
          className="w-96 rounded-md border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
        />
        <button onClick={handleLookup} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
          Look up
        </button>
      </div>

      {status === 'loading' && <p className="mt-6 text-sm text-slate-500">Loading…</p>}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {status === 'ready' && (
        <ul className="mt-6 flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-800 dark:text-slate-100">{review.reviewerName}</span>
                  <span className="ml-2 text-amber-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${review.status === 'VISIBLE' ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {review.status}
                </span>
              </div>
              {review.comment && <p className="mt-2 text-slate-700 dark:text-slate-300">{review.comment}</p>}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={reasonDrafts[review.id] ?? ''}
                  onChange={(e) => setReasonDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                  placeholder="Reason (optional)"
                  className="w-64 rounded-md border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                />
                {review.status === 'VISIBLE' ? (
                  <button onClick={() => handleModerate(review.id, 'HIDE')} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-red-600 hover:border-red-400 dark:border-slate-700">
                    Hide
                  </button>
                ) : (
                  <button onClick={() => handleModerate(review.id, 'RESTORE')} className="rounded-md border border-slate-300 px-2 py-1 text-xs text-brand-600 hover:border-brand-400 dark:border-slate-700">
                    Restore
                  </button>
                )}
              </div>
            </li>
          ))}
          {reviews.length === 0 && <p className="text-sm text-slate-400">No reviews for this course yet.</p>}
        </ul>
      )}
    </div>
  );
}
