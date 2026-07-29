import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyRoadmap, type Roadmap } from '@/api/onboarding.api';
import { useDocumentHead } from '@/hooks/useDocumentHead';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

const RECOMMENDATION_ROWS: { key: keyof Roadmap; label: string }[] = [
  { key: 'recommendedLearningPath', label: 'Learning path' },
  { key: 'recommendedCommunityGroup', label: 'Community group' },
  { key: 'recommendedChallenge', label: 'Challenge' },
  { key: 'recommendedEvent', label: 'Upcoming event' },
  { key: 'recommendedAiTool', label: 'AI tool' },
];

/** 003 US2 step 12–13 (system-generated, not user-answered): displays the persisted `Roadmap` row. Recommendations for features not yet built (community/challenges/events/AI) are honestly omitted rather than faked. */
export function RoadmapPage() {
  const navigate = useNavigate();
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);

  useDocumentHead({ title: 'Your roadmap | CoachX', description: 'Your personalized CoachX learning roadmap.' });

  useEffect(() => {
    getMyRoadmap()
      .then((r) => {
        setRoadmap(r);
        setLoadState('ready');
      })
      .catch((err: { status?: number | null }) => {
        if (err?.status === 404) {
          navigate('/onboarding', { replace: true });
          return;
        }
        setLoadState('error');
      });
  }, [navigate]);

  if (loadState === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (loadState === 'error' || !roadmap) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load your roadmap. Please refresh the page.</p>;
  }

  const availableRecommendations = RECOMMENDATION_ROWS.filter((row) => roadmap[row.key]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your personalized roadmap</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{roadmap.goalSummary}</p>

      <div className="mt-8 rounded-lg border border-slate-200 p-6 dark:border-slate-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Current stage</h2>
        <p className="mt-1 text-lg font-medium text-slate-900 dark:text-white">{roadmap.currentStage}</p>
      </div>

      <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-6 dark:border-brand-900 dark:bg-brand-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">First milestone</h2>
        <p className="mt-1 text-lg font-medium text-brand-900 dark:text-brand-100">{roadmap.firstMilestone}</p>
      </div>

      {availableRecommendations.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {availableRecommendations.map((row) => (
            <div key={row.key} className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{row.label}</p>
              <p className="mt-1 text-sm font-medium text-slate-900 dark:text-white">{String(roadmap[row.key])}</p>
            </div>
          ))}
        </div>
      )}

      {roadmap.expectedWeeklyCommitment && (
        <p className="mt-6 text-sm text-slate-600 dark:text-slate-300">
          Expected weekly commitment: <strong>{roadmap.expectedWeeklyCommitment}</strong>
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        {roadmap.recommendedFirstCourseSlug ? (
          <Link
            to={`/courses/${roadmap.recommendedFirstCourseSlug}`}
            className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Start your first course
          </Link>
        ) : (
          <Link to="/courses" className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
            Explore courses
          </Link>
        )}
        <Link to="/dashboard" className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
