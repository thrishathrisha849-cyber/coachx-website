import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LessonPlayerPage } from '../LessonPlayerPage';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const lesson: lmsApi.LessonDetail = {
  id: 'lesson-1',
  moduleId: 'module-1',
  title: 'Lesson 1',
  slug: 'lesson-1',
  summary: null,
  position: 0,
  durationMinutes: null,
  isPreview: false,
  isMandatory: true,
  description: null,
  completionRuleType: 'MANUAL',
  completionRuleTypes: [],
  activities: [],
  quiz: null,
  assignment: null,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/learn/course-1/lesson-1']}>
      <Routes>
        <Route path="/learn/:courseId/:lessonId" element={<LessonPlayerPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LessonPlayerPage — curriculum lock countdown (004 US6 polish batch, T082)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getLesson).mockReset().mockResolvedValue(lesson);
    vi.mocked(lmsApi.getCourseCurriculum).mockReset();
    vi.mocked(lmsApi.getMyCourseAnnouncements).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyLessonNotes).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyLessonBookmarks).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyLessonResources).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyStreak).mockReset().mockResolvedValue({ currentStreakDays: 0, longestStreakDays: 0, lastQualifyingDate: null });
  });

  it('shows a day-count for a module locked with a future unlockAt', async () => {
    const unlockAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    vi.mocked(lmsApi.getCourseCurriculum).mockResolvedValue([
      {
        id: 'module-1',
        title: 'Module 1',
        position: 0,
        isMandatory: true,
        locked: false,
        projects: [],
        lessons: [{ ...lesson, locked: false, status: 'NOT_STARTED' }],
      },
      {
        id: 'module-2',
        title: 'Module 2',
        position: 1,
        isMandatory: true,
        locked: true,
        lockReason: 'MODULE_LOCKED',
        unlockAt,
        projects: [],
        lessons: [],
      },
    ]);

    renderPage();

    expect(await screen.findByText(/Unlocks in 3 days/)).toBeInTheDocument();
  });

  it('shows a human-readable reason for a prerequisite-locked module with no unlock date', async () => {
    vi.mocked(lmsApi.getCourseCurriculum).mockResolvedValue([
      {
        id: 'module-1',
        title: 'Module 1',
        position: 0,
        isMandatory: true,
        locked: false,
        projects: [],
        lessons: [{ ...lesson, locked: false, status: 'NOT_STARTED' }],
      },
      {
        id: 'module-2',
        title: 'Module 2',
        position: 1,
        isMandatory: true,
        locked: true,
        lockReason: 'PREREQUISITE_NOT_MET',
        projects: [],
        lessons: [],
      },
    ]);

    renderPage();

    expect(await screen.findByText(/Complete the previous module to unlock/)).toBeInTheDocument();
  });
});

describe('LessonPlayerPage — ARTICLE activity keyboard accessibility (Cross-cutting Polish batch follow-up, T122)', () => {
  const articleLesson: lmsApi.LessonDetail = {
    ...lesson,
    activities: [
      { id: 'activity-1', type: 'ARTICLE', title: 'Reading', position: 0, mediaUrl: null, externalUrl: null, bodyText: '<p>Short article body.</p>', durationSeconds: null, fileSizeBytes: null, embedProvider: null, embedResourceId: null, captionsUrlEn: null, captionsUrlTa: null, transcriptSegments: null },
    ],
  };

  beforeEach(() => {
    vi.mocked(lmsApi.getLesson).mockReset().mockResolvedValue(articleLesson);
    vi.mocked(lmsApi.getCourseCurriculum).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyCourseAnnouncements).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyLessonNotes).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyLessonBookmarks).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyLessonResources).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.markActivityViewed).mockReset().mockResolvedValue(undefined);
    vi.mocked(lmsApi.getMyStreak).mockReset().mockResolvedValue({ currentStreakDays: 0, longestStreakDays: 0, lastQualifyingDate: null });
  });

  it('is reachable by Tab and marks the activity viewed on Enter — not just mouse click', async () => {
    const user = userEvent.setup();
    renderPage();

    const article = await screen.findByText('Short article body.');
    const contentDiv = article.parentElement!;
    expect(contentDiv).toHaveAttribute('tabIndex', '0');

    contentDiv.focus();
    expect(contentDiv).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(lmsApi.markActivityViewed).toHaveBeenCalledWith('activity-1');
  });
});

describe('LessonPlayerPage — Captions + Transcript Support (004 batch, FR-044/FR-046)', () => {
  const videoLesson: lmsApi.LessonDetail = {
    ...lesson,
    activities: [
      {
        id: 'activity-video-1',
        type: 'VIDEO',
        title: 'Intro video',
        position: 0,
        mediaUrl: 'https://example.com/video.mp4',
        externalUrl: null,
        bodyText: null,
        durationSeconds: 120,
        fileSizeBytes: null,
        embedProvider: null,
        embedResourceId: null,
        captionsUrlEn: 'https://example.com/captions-en.vtt',
        captionsUrlTa: 'https://example.com/captions-ta.vtt',
        transcriptSegments: [
          { startSeconds: 0, text: 'Welcome to this lesson.' },
          { startSeconds: 65, text: 'Today we will cover captions and transcripts.' },
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.mocked(lmsApi.getLesson).mockReset().mockResolvedValue(videoLesson);
    vi.mocked(lmsApi.getCourseCurriculum).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyCourseAnnouncements).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyLessonNotes).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyLessonBookmarks).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyLessonResources).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.markActivityViewed).mockReset().mockResolvedValue(undefined);
    vi.mocked(lmsApi.updateLessonProgress).mockReset().mockResolvedValue({ percentage: 0, status: 'IN_PROGRESS' });
    vi.mocked(lmsApi.getMyStreak).mockReset().mockResolvedValue({ currentStreakDays: 0, longestStreakDays: 0, lastQualifyingDate: null });
    vi.mocked(lmsApi.downloadActivityTranscript).mockReset().mockResolvedValue(undefined);
    vi.mocked(lmsApi.getMyActivityPlayback).mockReset().mockResolvedValue(null);
    vi.mocked(lmsApi.postMyActivityPlaybackStarted).mockReset().mockResolvedValue({
      watchedSeconds: 0,
      furthestPositionSeconds: 0,
      lastPositionSeconds: null,
      playbackStartCount: 1,
      rewatchCount: 0,
      lastPlaybackSpeed: null,
      completedPlaybackAt: null,
      isRewatch: false,
    });
    vi.mocked(lmsApi.postMyActivityPlaybackProgress).mockReset().mockResolvedValue({
      watchedSeconds: 0,
      furthestPositionSeconds: 0,
      lastPositionSeconds: 0,
      playbackStartCount: 1,
      rewatchCount: 0,
      lastPlaybackSpeed: 1,
      completedPlaybackAt: null,
    });
  });

  it('renders an English and a Tamil <track> element on the video for the supplied caption URLs', async () => {
    const { container } = renderPage();
    await screen.findByText('Intro video');

    const tracks = container.querySelectorAll('track');
    expect(tracks).toHaveLength(2);
    expect(tracks[0]).toHaveAttribute('src', 'https://example.com/captions-en.vtt');
    expect(tracks[0]).toHaveAttribute('srclang', 'en');
    expect(tracks[1]).toHaveAttribute('src', 'https://example.com/captions-ta.vtt');
    expect(tracks[1]).toHaveAttribute('srclang', 'ta');
  });

  it('shows every transcript segment and filters them by search text', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Welcome to this lesson.');
    expect(screen.getByText('Today we will cover captions and transcripts.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Search transcript'), 'captions');
    expect(screen.queryByText('Welcome to this lesson.')).not.toBeInTheDocument();
    expect(screen.getByText('Today we will cover captions and transcripts.')).toBeInTheDocument();
  });

  it('downloads the transcript when the download button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Welcome to this lesson.');
    await user.click(screen.getByRole('button', { name: /Download/ }));

    expect(lmsApi.downloadActivityTranscript).toHaveBeenCalledWith('activity-video-1', 'Intro video');
  });

  it('fetches the resume position and seeks the video to it once metadata loads', async () => {
    vi.mocked(lmsApi.getMyActivityPlayback).mockResolvedValue({
      watchedSeconds: 40,
      furthestPositionSeconds: 42,
      lastPositionSeconds: 42,
      playbackStartCount: 2,
      rewatchCount: 0,
      lastPlaybackSpeed: 1,
      completedPlaybackAt: null,
    });

    const { container } = renderPage();
    await screen.findByText('Intro video');
    expect(lmsApi.getMyActivityPlayback).toHaveBeenCalledWith('activity-video-1');

    const video = container.querySelector('video')!;
    Object.defineProperty(video, 'readyState', { value: 1, configurable: true });
    fireEvent.loadedMetadata(video);

    expect(video.currentTime).toBe(42);
  });

  it('records a real playback-started event on first play, only once per mount', async () => {
    const { container } = renderPage();
    await screen.findByText('Intro video');

    const video = container.querySelector('video')!;
    video.play = vi.fn().mockResolvedValue(undefined);
    fireEvent.play(video);
    fireEvent.play(video);

    expect(lmsApi.postMyActivityPlaybackStarted).toHaveBeenCalledTimes(1);
    expect(lmsApi.postMyActivityPlaybackStarted).toHaveBeenCalledWith('activity-video-1');
  });

  it('shows a Picture-in-Picture toggle when the browser supports it, and hides it when unsupported', async () => {
    Object.defineProperty(document, 'pictureInPictureEnabled', { value: true, configurable: true });
    renderPage();
    expect(await screen.findByRole('button', { name: 'Picture-in-picture' })).toBeInTheDocument();
  });

  it('does not show the Picture-in-Picture toggle when unsupported', async () => {
    Object.defineProperty(document, 'pictureInPictureEnabled', { value: false, configurable: true });
    renderPage();
    await screen.findByText('Intro video');
    expect(screen.queryByRole('button', { name: 'Picture-in-picture' })).not.toBeInTheDocument();
  });
});

describe('LessonPlayerPage — curriculum project links (004 Project-based Learning batch, FR-077)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getLesson).mockReset().mockResolvedValue(lesson);
    vi.mocked(lmsApi.getMyCourseAnnouncements).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyLessonNotes).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyLessonBookmarks).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyLessonResources).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.getMyStreak).mockReset().mockResolvedValue({ currentStreakDays: 0, longestStreakDays: 0, lastQualifyingDate: null });
  });

  it("navigates to a module's project page when its curriculum entry is clicked", async () => {
    vi.mocked(lmsApi.getCourseCurriculum).mockReset().mockResolvedValue([
      {
        id: 'module-1',
        title: 'Module 1',
        position: 0,
        isMandatory: true,
        locked: false,
        projects: [{ id: 'project-1', title: 'Capstone Project' }],
        lessons: [{ ...lesson, locked: false, status: 'NOT_STARTED' }],
      },
    ]);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/learn/course-1/lesson-1']}>
        <Routes>
          <Route path="/learn/:courseId/:lessonId" element={<LessonPlayerPage />} />
          <Route path="/projects/:projectId" element={<p>Project page placeholder</p>} />
        </Routes>
      </MemoryRouter>,
    );

    const projectLink = await screen.findByRole('button', { name: /Capstone Project/ });
    await user.click(projectLink);

    expect(await screen.findByText('Project page placeholder')).toBeInTheDocument();
  });

  it('does not show a locked module\'s project links', async () => {
    vi.mocked(lmsApi.getCourseCurriculum).mockReset().mockResolvedValue([
      {
        id: 'module-1',
        title: 'Module 1',
        position: 0,
        isMandatory: true,
        locked: true,
        lockReason: 'MODULE_LOCKED',
        projects: [{ id: 'project-1', title: 'Capstone Project' }],
        lessons: [],
      },
    ]);

    renderPage();

    await screen.findByText('Lesson 1');
    expect(screen.queryByText('Capstone Project')).not.toBeInTheDocument();
  });
});
