import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getContinueLearning } from '@/api/lms.api';
import { generateMyCertificate, getMyCertificateEligibility } from '@/api/certificate.api';
import type { NormalizedApiError } from '@/api/client';

type LoadState = 'loading' | 'complete' | 'no-content' | 'error';

/** FR-081/FR-083 course-complete CTA — checks eligibility (server-evaluated, never assumed from `courseComplete` alone) and generates/links the certificate. */
function CourseCompleteCertificateCta({ courseId }: { courseId: string }) {
  const [state, setState] = useState<'checking' | 'eligible' | 'not-eligible' | 'generating' | 'error'>('checking');
  const [certificateId, setCertificateId] = useState<string | null>(null);

  useEffect(() => {
    getMyCertificateEligibility(courseId)
      .then((e) => setState(e.eligible ? 'eligible' : 'not-eligible'))
      .catch(() => setState('error'));
  }, [courseId]);

  const handleGenerate = async () => {
    setState('generating');
    try {
      const certificate = await generateMyCertificate(courseId);
      setCertificateId(certificate.id);
    } catch {
      setState('error');
    }
  };

  if (state === 'checking' || state === 'not-eligible' || state === 'error') return null;

  if (certificateId) {
    return (
      <Link to={`/certificates/${certificateId}`} className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
        View your certificate →
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={state === 'generating'}
      className="mt-4 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
    >
      {state === 'generating' ? 'Generating…' : 'Get your certificate'}
    </button>
  );
}

/** 004 US2 entry point (`/learn/:courseId`) — resolves to the learner's actual next lesson via the existing server-derived `continue-learning` endpoint, never a client guess. */
export function CourseLearnEntryPage() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState<LoadState>('loading');

  useEffect(() => {
    getContinueLearning(courseId)
      .then((result) => {
        if (result.nextLesson) {
          navigate(`/learn/${courseId}/${result.nextLesson.id}`, { replace: true });
        } else if (result.courseComplete) {
          setLoadState('complete');
        } else {
          setLoadState('no-content');
        }
      })
      .catch((err: NormalizedApiError) => {
        if (err.status === 404) navigate('/courses', { replace: true });
        else setLoadState('error');
      });
  }, [courseId, navigate]);

  if (loadState === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (loadState === 'complete') {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">You've completed this course 🎉</h1>
        <div>
          <CourseCompleteCertificateCta courseId={courseId} />
        </div>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          Go to dashboard
        </Link>
      </div>
    );
  }
  if (loadState === 'no-content') {
    return <p className="p-6 text-sm text-slate-500">No lesson is currently accessible in this course.</p>;
  }
  return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load this course. Please refresh the page.</p>;
}
