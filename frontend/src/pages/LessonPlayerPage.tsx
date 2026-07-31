import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  getLesson,
  getCourseCurriculum,
  updateLessonProgress,
  completeLessonManually,
  markActivityViewed,
  getMyActivityPlayback,
  postMyActivityPlaybackStarted,
  postMyActivityPlaybackProgress,
  type LessonDetail,
  type CurriculumModuleItem,
  type PublicLearningActivity,
} from '@/api/lms.api';
import type { NormalizedApiError } from '@/api/client';
import { sanitizeRichText } from '@/utils/sanitizeHtml';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { CourseAnnouncementsBanner } from '@/components/lms/CourseAnnouncementsBanner';
import { LessonNotesPanel } from '@/components/lms/LessonNotesPanel';
import { LessonBookmarkButton } from '@/components/lms/LessonBookmarkButton';
import { LessonResourcesPanel } from '@/components/lms/LessonResourcesPanel';
import { LearningStreakBadge } from '@/components/lms/LearningStreakBadge';
import { TranscriptPanel } from '@/components/lms/TranscriptPanel';

type LoadState = 'loading' | 'ready' | 'locked' | 'error';

/** 004 US6 polish batch (T082) — human-readable unlock countdown/date, replacing the plain 🔒 icon with real information from `curriculum.service.ts`'s `unlockAt`/`lockReason`. */
const LOCK_REASON_LABEL: Record<string, string> = {
  PREREQUISITE_NOT_MET: 'Complete the previous module to unlock',
  MODULE_LOCKED: 'Not yet available',
  ENROLLMENT_REQUIRED: 'Enroll to access',
};

function formatUnlockInfo(lockReason?: string, unlockAt?: string): string {
  if (unlockAt) {
    const target = new Date(unlockAt);
    const diffMs = target.getTime() - Date.now();
    if (diffMs <= 0) return 'Unlocking soon';
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 'Unlocks in less than a day';
    if (diffDays < 30) return `Unlocks in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    return `Unlocks ${target.toLocaleDateString()}`;
  }
  return (lockReason && LOCK_REASON_LABEL[lockReason]) || 'Not yet available';
}

/**
 * 004 US2 — the lesson-consumption frontend. Renders each activity by
 * type (video/audio/article/pdf/download/external-link/embed), tracks
 * real progress signals against the existing server-side completion
 * engine (`completion.service.ts`) — never grants completion locally.
 * "Mark complete" always calls the server and shows exactly which
 * conditions remain unmet if it's rejected, rather than faking success.
 */
export function LessonPlayerPage() {
  const { courseId = '', lessonId = '' } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lockMessage, setLockMessage] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumModuleItem[]>([]);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const viewedActivityIds = useRef(new Set<string>());

  useDocumentHead({ title: lesson ? `${lesson.title} | CoachX` : 'Lesson | CoachX' });

  useEffect(() => {
    setLoadState('loading');
    setCompleteError(null);
    setJustCompleted(false);
    viewedActivityIds.current = new Set();

    Promise.all([getLesson(lessonId), getCourseCurriculum(courseId)])
      .then(([lessonResult, curriculumResult]) => {
        setLesson(lessonResult);
        setCurriculum(curriculumResult);
        setLoadState('ready');
      })
      .catch((err: NormalizedApiError) => {
        if (err.status === 403) {
          setLockMessage(err.message);
          setLoadState('locked');
        } else {
          setLoadState('error');
        }
      });
  }, [courseId, lessonId]);

  const flatLessons = useMemo(
    () => curriculum.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleLocked: m.locked }))),
    [curriculum],
  );
  const currentIndex = flatLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  const handleActivityViewed = async (activityId: string) => {
    if (viewedActivityIds.current.has(activityId)) return;
    viewedActivityIds.current.add(activityId);
    try {
      await markActivityViewed(activityId);
    } catch {
      viewedActivityIds.current.delete(activityId);
    }
  };

  const handleMediaProgress = async (watchedPercent: number, positionSeconds: number, kind: 'video' | 'audio') => {
    try {
      await updateLessonProgress(lessonId, {
        watchedPercent,
        timeSpentDeltaSeconds: 5,
        lastPosition: { kind, positionSeconds },
      });
    } catch {
      // Best-effort — a dropped progress tick is not user-facing; the next tick retries.
    }
  };

  const handleMarkComplete = async () => {
    setCompleting(true);
    setCompleteError(null);
    try {
      await completeLessonManually(lessonId);
      setJustCompleted(true);
      setCurriculum((prev) =>
        prev.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.id === lessonId ? { ...l, status: 'COMPLETED' } : l)) })),
      );
    } catch (err) {
      const apiError = err as NormalizedApiError;
      const unmetRules = (apiError.details as { unmetRules?: string[] } | undefined)?.unmetRules;
      setCompleteError(
        unmetRules?.length
          ? `Not yet complete — remaining: ${unmetRules.join(', ').replaceAll('_', ' ').toLowerCase()}`
          : apiError.message ?? 'Could not mark this lesson complete.',
      );
    } finally {
      setCompleting(false);
    }
  };

  if (loadState === 'loading') return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (loadState === 'locked') {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-slate-600 dark:text-slate-300">{lockMessage ?? 'This lesson is not available yet.'}</p>
        <Link to={`/courses`} className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
          Back to courses
        </Link>
      </div>
    );
  }
  if (loadState === 'error' || !lesson) {
    return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load this lesson. Please refresh the page.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <div className="lg:col-span-4">
        <CourseAnnouncementsBanner courseId={courseId} />
      </div>
      <aside className="lg:col-span-1">
        <nav className="rounded-lg border border-slate-200 p-3 dark:border-slate-800" aria-label="Course curriculum">
          {curriculum.map((module_) => (
            <div key={module_.id} className="mb-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {module_.title}
                {module_.locked && (
                  <span className="ml-1 normal-case text-slate-400">
                    🔒 {formatUnlockInfo(module_.lockReason, module_.unlockAt)}
                  </span>
                )}
              </p>
              <ul>
                {module_.lessons.map((l) => (
                  <li key={l.id}>
                    {l.locked ? (
                      <span className="flex items-center gap-2 px-2 py-1.5 text-sm text-slate-400">
                        <span aria-hidden="true">🔒</span> {l.title}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate(`/learn/${courseId}/${l.id}`)}
                        aria-current={l.id === lessonId ? 'true' : undefined}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm ${
                          l.id === lessonId
                            ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900'
                        }`}
                      >
                        <span aria-hidden="true">{l.status === 'COMPLETED' ? '✅' : '○'}</span>
                        {l.title}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {/* 004 Project-based Learning batch (FR-077) — module-scoped project(s), discoverable from the curriculum sidebar. */}
              {module_.projects.length > 0 && !module_.locked && (
                <ul className="mt-1 border-t border-slate-100 pt-1 dark:border-slate-800">
                  {module_.projects.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"
                      >
                        <span aria-hidden="true">📁</span> {p.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <div className="lg:col-span-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{lesson.title}</h1>
          <div className="flex items-center gap-3">
            <LearningStreakBadge />
            <LessonBookmarkButton lessonId={lessonId} />
          </div>
        </div>
        {lesson.description && <p className="mt-2 text-slate-600 dark:text-slate-300">{lesson.description}</p>}

        <div className="mt-6 flex flex-col gap-6">
          {lesson.activities.map((activity) => (
            <LessonActivity key={activity.id} activity={activity} onViewed={handleActivityViewed} onMediaProgress={handleMediaProgress} />
          ))}
        </div>

        {lesson.quiz && (
          <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-5 dark:border-brand-900 dark:bg-brand-950">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{lesson.quiz.title}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Passing score: {lesson.quiz.passingScorePercent}%
              {lesson.quiz.timeLimitMinutes && ` · Time limit: ${lesson.quiz.timeLimitMinutes} min`}
              {lesson.quiz.maxAttempts && ` · Max attempts: ${lesson.quiz.maxAttempts}`}
            </p>
            <Link
              to={`/quizzes/${lesson.quiz.id}`}
              className="mt-3 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Take quiz
            </Link>
          </div>
        )}

        {lesson.assignment && (
          <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-5 dark:border-brand-900 dark:bg-brand-950">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{lesson.assignment.title}</h2>
            {lesson.assignment.instructions && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{lesson.assignment.instructions}</p>}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Max score: {lesson.assignment.maxScore} · Passing: {lesson.assignment.passingScore}
              {lesson.assignment.dueAt && ` · Due: ${new Date(lesson.assignment.dueAt).toLocaleDateString()}`}
            </p>
            <Link
              to={`/assignments/${lesson.assignment.id}`}
              className="mt-3 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Open assignment
            </Link>
          </div>
        )}

        {completeError && (
          <p className="mt-4 text-sm text-amber-700 dark:text-amber-400">{completeError}</p>
        )}
        {justCompleted && <p className="mt-4 text-sm text-green-700 dark:text-green-400">Lesson completed.</p>}

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-800">
          {prevLesson ? (
            <button type="button" onClick={() => navigate(`/learn/${courseId}/${prevLesson.id}`)} className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300">
              ← Previous
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={handleMarkComplete}
            disabled={completing || justCompleted}
            className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {justCompleted ? 'Completed' : completing ? 'Saving…' : 'Mark complete'}
          </button>

          {nextLesson ? (
            <button type="button" onClick={() => navigate(`/learn/${courseId}/${nextLesson.id}`)} className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300">
              Next →
            </button>
          ) : (
            <span />
          )}
        </div>

        <LessonResourcesPanel lessonId={lessonId} />
        <LessonNotesPanel lessonId={lessonId} />
      </div>
    </div>
  );
}

function LessonActivity({
  activity,
  onViewed,
  onMediaProgress,
}: {
  activity: PublicLearningActivity;
  onViewed: (activityId: string) => void;
  onMediaProgress: (watchedPercent: number, positionSeconds: number, kind: 'video' | 'audio') => void;
}) {
  const lastReportedRef = useRef(0);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  // 004 PiP + Video Playback Telemetry batch (FR-039/FR-040) — VIDEO only.
  const playbackStartedRef = useRef(false);
  const lastPlaybackPositionRef = useRef(0);
  const resumePositionRef = useRef<number | null>(null);
  const resumeAppliedRef = useRef(false);
  const [pipSupported, setPipSupported] = useState(false);

  useEffect(() => {
    setPipSupported(typeof document !== 'undefined' && 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled);
  }, []);

  // Fetch this activity's own resume position (FR-039 "resume playback") —
  // deliberately a separate, self-contained fetch (same pattern
  // `LessonNotesPanel`/`LessonBookmarkButton` already establish) rather than
  // embedding per-user telemetry into the public lesson response.
  useEffect(() => {
    playbackStartedRef.current = false;
    lastPlaybackPositionRef.current = 0;
    resumePositionRef.current = null;
    resumeAppliedRef.current = false;
    if (activity.type !== 'VIDEO') return;

    getMyActivityPlayback(activity.id)
      .then((snapshot) => {
        if (snapshot?.lastPositionSeconds) {
          resumePositionRef.current = snapshot.lastPositionSeconds;
          applyResumeIfReady();
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity.id, activity.type]);

  function applyResumeIfReady() {
    const el = mediaRef.current;
    if (!el || resumeAppliedRef.current || resumePositionRef.current === null) return;
    if (el.readyState >= 1) {
      el.currentTime = resumePositionRef.current;
      resumeAppliedRef.current = true;
    }
  }

  const handleVideoPlay = () => {
    if (playbackStartedRef.current) return;
    playbackStartedRef.current = true;
    postMyActivityPlaybackStarted(activity.id).catch(() => undefined);
  };

  const handleTogglePip = async () => {
    const el = mediaRef.current as HTMLVideoElement | null;
    if (!el) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await el.requestPictureInPicture();
      }
    } catch {
      // Best-effort — a browser may refuse PiP (e.g. no user gesture, unsupported media); not user-facing beyond the toggle simply not activating.
    }
  };

  const handleSeek = (seconds: number) => {
    const el = mediaRef.current;
    if (!el) return;
    el.currentTime = seconds;
    // jsdom's play() stub returns undefined rather than a Promise — guard
    // rather than assuming a real browser's Promise-returning play().
    const playResult = el.play();
    if (playResult && typeof playResult.catch === 'function') playResult.catch(() => undefined);
  };

  const handleTimeUpdate = (kind: 'video' | 'audio') => (e: React.SyntheticEvent<HTMLMediaElement>) => {
    const el = e.currentTarget;
    if (!el.duration) return;
    const percent = Math.round((el.currentTime / el.duration) * 100);
    if (percent - lastReportedRef.current >= 5 || percent === 100) {
      lastReportedRef.current = percent;
      onMediaProgress(percent, Math.floor(el.currentTime), kind);

      if (kind === 'video') {
        const positionSeconds = Math.floor(el.currentTime);
        const watchedDeltaSeconds = Math.max(0, positionSeconds - lastPlaybackPositionRef.current);
        lastPlaybackPositionRef.current = positionSeconds;
        postMyActivityPlaybackProgress(activity.id, { positionSeconds, watchedDeltaSeconds, playbackSpeed: el.playbackRate }).catch(() => undefined);
      }
    }
    if (percent >= 90) onViewed(activity.id);
  };

  if (activity.title) {
    // fallthrough — title rendered inline below per type
  }

  switch (activity.type) {
    case 'VIDEO':
      return (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            {activity.title ? <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{activity.title}</p> : <span />}
            {pipSupported && (
              <button
                type="button"
                onClick={handleTogglePip}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200"
              >
                Picture-in-picture
              </button>
            )}
          </div>
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={activity.mediaUrl ?? undefined}
            controls
            className="w-full rounded-lg bg-black"
            onTimeUpdate={handleTimeUpdate('video')}
            onEnded={() => onViewed(activity.id)}
            onPlay={handleVideoPlay}
            onLoadedMetadata={applyResumeIfReady}
          >
            {activity.captionsUrlEn && <track kind="captions" src={activity.captionsUrlEn} srcLang="en" label="English" />}
            {activity.captionsUrlTa && <track kind="captions" src={activity.captionsUrlTa} srcLang="ta" label="Tamil" />}
          </video>
          {activity.transcriptSegments && activity.transcriptSegments.length > 0 && (
            <TranscriptPanel activityId={activity.id} activityTitle={activity.title} segments={activity.transcriptSegments} onSeek={handleSeek} />
          )}
        </div>
      );
    case 'AUDIO':
      return (
        <div>
          {activity.title && <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{activity.title}</p>}
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={activity.mediaUrl ?? undefined}
            controls
            className="w-full"
            onTimeUpdate={handleTimeUpdate('audio')}
            onEnded={() => onViewed(activity.id)}
          >
            {activity.captionsUrlEn && <track kind="captions" src={activity.captionsUrlEn} srcLang="en" label="English" />}
            {activity.captionsUrlTa && <track kind="captions" src={activity.captionsUrlTa} srcLang="ta" label="Tamil" />}
          </audio>
          {activity.transcriptSegments && activity.transcriptSegments.length > 0 && (
            <TranscriptPanel activityId={activity.id} activityTitle={activity.title} segments={activity.transcriptSegments} onSeek={handleSeek} />
          )}
        </div>
      );
    case 'ARTICLE':
      return (
        <div onScroll={() => onViewed(activity.id)}>
          {activity.title && <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">{activity.title}</h2>}
          <div
            className="prose prose-slate max-w-none rounded-md dark:prose-invert focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(activity.bodyText ?? '') }}
            onClick={() => onViewed(activity.id)}
            // A short article that never overflows its container never
            // fires the parent's `onScroll` — without this, a keyboard-only
            // or screen-reader user (who can't trigger the mouse-only
            // `onClick` above) would have no way to mark it viewed at all.
            // Adds keyboard operability alongside the existing click/scroll
            // triggers without changing either of their semantics.
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onViewed(activity.id);
            }}
          />
        </div>
      );
    case 'PDF':
      return (
        <div>
          {activity.title && <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{activity.title}</p>}
          <iframe
            src={activity.mediaUrl ?? undefined}
            title={activity.title ?? 'PDF document'}
            className="h-[600px] w-full rounded-lg border border-slate-200 dark:border-slate-800"
            onLoad={() => onViewed(activity.id)}
          />
        </div>
      );
    case 'DOWNLOAD':
      return (
        <a
          href={activity.mediaUrl ?? undefined}
          download
          onClick={() => onViewed(activity.id)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200"
        >
          ⬇ {activity.title ?? 'Download resource'}
        </a>
      );
    case 'EXTERNAL_LINK':
      return (
        <a
          href={activity.externalUrl ?? undefined}
          target="_blank"
          rel="noreferrer noopener"
          onClick={() => onViewed(activity.id)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand-400 dark:border-slate-700 dark:text-slate-200"
        >
          ↗ {activity.title ?? 'Open link'}
        </a>
      );
    case 'EMBED':
      return (
        <div>
          {activity.title && <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{activity.title}</p>}
          <iframe
            src={activity.externalUrl ?? undefined}
            title={activity.title ?? 'Embedded content'}
            className="aspect-video w-full rounded-lg border border-slate-200 dark:border-slate-800"
            onLoad={() => onViewed(activity.id)}
            allowFullScreen
          />
        </div>
      );
    default:
      return null;
  }
}
