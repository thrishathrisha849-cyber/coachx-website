import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getCourseAnalyticsAdmin,
  getCourseAtRiskLearnersAdmin,
  getEnrollmentAnalyticsAdmin,
  type CourseAnalytics,
  type AtRiskAssessment,
  type LearnerAnalytics,
} from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';

function Kpi({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{value === null ? '—' : value}</dd>
    </div>
  );
}

const SIGNAL_LABELS: Record<AtRiskAssessment['signals'][number]['type'], string> = {
  NO_ACTIVITY_SINCE_ENROLLMENT: 'No activity since enrollment',
  LONG_INACTIVITY: 'Long inactivity',
  REPEATED_QUIZ_FAILURE: 'Repeated quiz failure',
  MISSED_ASSIGNMENT: 'Missed assignment',
  ACCESS_NEARING_EXPIRY: 'Access nearing expiry',
};

/** 004 Learning Analytics & At-Risk Detection batch (FR-105–FR-108) — admin course-level analytics, per-lesson drop-off, and the at-risk-learners "instructor alert" surface, with a per-learner drill-down. */
export function CourseAnalyticsPage() {
  const { id: courseId = '' } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [atRisk, setAtRisk] = useState<AtRiskAssessment[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const [expandedEnrollmentId, setExpandedEnrollmentId] = useState<string | null>(null);
  const [learnerDetail, setLearnerDetail] = useState<LearnerAnalytics | null>(null);
  const [learnerDetailStatus, setLearnerDetailStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    setStatus('loading');
    Promise.all([getCourseAnalyticsAdmin(courseId), getCourseAtRiskLearnersAdmin(courseId)])
      .then(([a, r]) => {
        setAnalytics(a);
        setAtRisk(r);
        setStatus('ready');
      })
      .catch((err) => {
        setError((err as NormalizedApiError).message ?? 'Failed to load course analytics.');
        setStatus('error');
      });
  }, [courseId]);

  function toggleLearner(enrollmentId: string) {
    if (expandedEnrollmentId === enrollmentId) {
      setExpandedEnrollmentId(null);
      setLearnerDetail(null);
      return;
    }
    setExpandedEnrollmentId(enrollmentId);
    setLearnerDetail(null);
    setLearnerDetailStatus('loading');
    getEnrollmentAnalyticsAdmin(enrollmentId)
      .then((d) => {
        setLearnerDetail(d);
        setLearnerDetailStatus('ready');
      })
      .catch(() => setLearnerDetailStatus('error'));
  }

  if (status === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (status === 'error' || !analytics) return <p className="p-6 text-sm text-red-600 dark:text-red-400">{error ?? "Couldn't load analytics."}</p>;

  return (
    <div className="max-w-4xl">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{analytics.courseTitle} — Analytics</h1>
      <p className="mt-1 text-xs text-slate-400">Course ID: {courseId}</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Enrollments" value={analytics.enrollments} />
        <Kpi label="Active learners" value={analytics.activeLearners} />
        <Kpi label="Completion rate" value={`${analytics.completionRate}%`} />
        <Kpi label="Avg. completion time" value={`${analytics.avgCompletionTimeDays}d`} />
        <Kpi label="Quiz pass rate" value={`${analytics.quizPassRate}%`} />
        <Kpi label="Assignment approval rate" value={`${analytics.assignmentApprovalRate}%`} />
        <Kpi label="Certificate rate" value={`${analytics.certificateRate}%`} />
        <Kpi label="Rating" value={analytics.ratingAverage !== null ? `${analytics.ratingAverage.toFixed(1)} (${analytics.ratingCount})` : '—'} />
        <Kpi label="Video engagement" value={`${analytics.videoEngagement.avgWatchedPercent}% avg watched (${analytics.videoEngagement.learnersWithVideoActivity} learners)`} />
      </dl>
      <p className="mt-2 text-xs italic text-slate-400">Not tracked in this build: {analytics.notApplicable.join(', ')}.</p>

      <h2 className="mt-8 font-semibold text-slate-900 dark:text-white">Device distribution</h2>
      <p className="mt-1 text-xs text-slate-400">Bucketed from playback User-Agent data (004 PiP + Video Playback Telemetry batch, FR-040).</p>
      {!analytics.deviceDistribution ? (
        <p className="mt-2 text-sm text-slate-400">No video playback telemetry recorded yet.</p>
      ) : (
        <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(analytics.deviceDistribution).map(([device, count]) => (
            <Kpi key={device} label={device} value={count} />
          ))}
        </dl>
      )}

      <h2 className="mt-8 font-semibold text-slate-900 dark:text-white">Lesson drop-off</h2>
      {analytics.lessonDropOff.length === 0 && <p className="mt-2 text-sm text-slate-400">No significant drop-off detected.</p>}
      {analytics.lessonDropOff.length > 0 && (
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400">
              <th className="pb-1">Lesson</th>
              <th className="pb-1">Starts</th>
              <th className="pb-1">Completes</th>
              <th className="pb-1">Drop-off</th>
            </tr>
          </thead>
          <tbody>
            {analytics.lessonDropOff.map((l) => (
              <tr key={l.lessonId} className="border-t border-slate-200 dark:border-slate-800">
                <td className="py-1 text-slate-800 dark:text-slate-100">{l.lessonTitle}</td>
                <td className="py-1">{l.starts}</td>
                <td className="py-1">{l.completes}</td>
                <td className="py-1 text-amber-600 dark:text-amber-400">{l.dropOff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 className="mt-8 font-semibold text-slate-900 dark:text-white">At-risk learners</h2>
      <p className="mt-1 text-xs text-slate-400">
        Not actionable in this build (no delivery mechanism yet): reminder, mentor suggestion, support outreach, simplified restart plan.
      </p>
      {atRisk.length === 0 && <p className="mt-2 text-sm text-slate-400">No at-risk learners detected.</p>}
      <ul className="mt-2 flex flex-col gap-2">
        {atRisk.map((a) => (
          <li key={a.enrollmentId} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-slate-800 dark:text-slate-100">Learner {a.userId}</span>
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                  Risk score {a.atRiskScore}
                </span>
              </div>
              <button
                onClick={() => toggleLearner(a.enrollmentId)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200"
              >
                {expandedEnrollmentId === a.enrollmentId ? 'Hide details' : 'View details'}
              </button>
            </div>
            <ul className="mt-2 flex flex-wrap gap-1">
              {a.signals.map((s) => (
                <li key={s.type} title={s.detail} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {SIGNAL_LABELS[s.type]}
                </li>
              ))}
            </ul>
            {a.recommendedRevision && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Recommended revision: <span className="font-medium">{a.recommendedRevision.lessonTitle}</span> (failed "{a.recommendedRevision.quizTitle}")
              </p>
            )}

            {expandedEnrollmentId === a.enrollmentId && (
              <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                {learnerDetailStatus === 'loading' && <p className="text-xs text-slate-400">Loading learner analytics…</p>}
                {learnerDetailStatus === 'error' && <p className="text-xs text-red-600 dark:text-red-400">Couldn't load learner analytics.</p>}
                {learnerDetailStatus === 'ready' && learnerDetail && (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                    <div><dt className="text-slate-400">Progress</dt><dd>{learnerDetail.progressPercent}%</dd></div>
                    <div><dt className="text-slate-400">Time spent</dt><dd>{Math.round(learnerDetail.timeSpentSeconds / 60)} min</dd></div>
                    <div><dt className="text-slate-400">Lessons completed</dt><dd>{learnerDetail.lessonsCompleted}/{learnerDetail.totalMandatoryLessons}</dd></div>
                    <div><dt className="text-slate-400">Last activity</dt><dd>{learnerDetail.lastActivityAt ? new Date(learnerDetail.lastActivityAt).toLocaleDateString() : '—'}</dd></div>
                    <div><dt className="text-slate-400">Drop-off lesson</dt><dd>{learnerDetail.dropOffLessonTitle ?? '—'}</dd></div>
                    <div><dt className="text-slate-400">Certificate</dt><dd>{learnerDetail.certificateIssued ? 'Issued' : 'Not issued'}</dd></div>
                  </dl>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
