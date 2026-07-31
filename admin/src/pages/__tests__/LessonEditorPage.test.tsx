import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LessonEditorPage } from '../LessonEditorPage';
import * as lmsApi from '@/api/lms.api';
import * as quizApi from '@/api/quiz.api';
import * as assignmentApi from '@/api/assignment.api';

vi.mock('@/api/lms.api');
vi.mock('@/api/quiz.api');
vi.mock('@/api/assignment.api');

const lesson: lmsApi.AdminLessonFull = {
  id: 'lesson-1',
  moduleId: 'module-1',
  title: 'Lesson 1',
  slug: 'lesson-1',
  summary: null,
  description: null,
  position: 0,
  durationMinutes: null,
  isPreview: false,
  isMandatory: true,
  status: 'DRAFT',
  completionRuleType: 'MANUAL',
  completionRuleTypes: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const sampleResource: lmsApi.AdminLessonResource = {
  id: 'resource-1',
  lessonId: 'lesson-1',
  title: 'Worksheet PDF',
  type: 'PDF',
  description: null,
  language: 'EN',
  fileUrl: 'https://example.com/worksheet.pdf',
  fileSizeBytes: null,
  version: 1,
  downloadPermission: 'DOWNLOADABLE',
  accessRule: 'ENROLLED_ONLY',
  position: 0,
  status: 'DRAFT',
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/lms-lessons/lesson-1']}>
      <Routes>
        <Route path="/lms-lessons/:lessonId" element={<LessonEditorPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LessonEditorPage — resources (004 Downloadable Resource Catalog batch, FR-049)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getLessonAdminFull).mockReset().mockResolvedValue(lesson);
    vi.mocked(lmsApi.listActivitiesForLesson).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.listResourcesForLesson).mockReset();
    vi.mocked(lmsApi.createResource).mockReset();
    vi.mocked(lmsApi.archiveResource).mockReset();
    vi.mocked(quizApi.getQuizByLessonId).mockReset().mockResolvedValue(null);
    vi.mocked(assignmentApi.getAssignmentByLessonId).mockReset().mockResolvedValue(null);
  });

  it('lists resources for the lesson', async () => {
    vi.mocked(lmsApi.listResourcesForLesson).mockResolvedValue([sampleResource]);
    renderPage();

    expect(await screen.findByText('Worksheet PDF')).toBeInTheDocument();
    expect(lmsApi.listResourcesForLesson).toHaveBeenCalledWith('lesson-1');
  });

  it('creates a new resource', async () => {
    vi.mocked(lmsApi.listResourcesForLesson).mockResolvedValue([]);
    vi.mocked(lmsApi.createResource).mockResolvedValue(sampleResource);

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('No resources yet.');
    await user.type(screen.getByPlaceholderText('Title'), 'Worksheet PDF');
    await user.type(screen.getByPlaceholderText('https://file URL'), 'https://example.com/worksheet.pdf');
    await user.click(screen.getByRole('button', { name: '+ Add resource' }));

    await waitFor(() =>
      expect(lmsApi.createResource).toHaveBeenCalledWith('lesson-1', {
        title: 'Worksheet PDF',
        type: 'PDF',
        fileUrl: 'https://example.com/worksheet.pdf',
        accessRule: 'ENROLLED_ONLY',
        downloadPermission: 'DOWNLOADABLE',
      }),
    );
  });

  it('archives a resource', async () => {
    vi.mocked(lmsApi.listResourcesForLesson).mockResolvedValue([sampleResource]);
    vi.mocked(lmsApi.archiveResource).mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('Worksheet PDF');
    await user.click(screen.getByRole('button', { name: 'Archive' }));

    await waitFor(() => expect(lmsApi.archiveResource).toHaveBeenCalledWith('resource-1'));
  });
});

describe('LessonEditorPage — activities captions + transcript (004 Captions + Transcript Support batch, FR-044)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getLessonAdminFull).mockReset().mockResolvedValue(lesson);
    vi.mocked(lmsApi.listActivitiesForLesson).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.listResourcesForLesson).mockReset().mockResolvedValue([]);
    vi.mocked(lmsApi.createActivity).mockReset();
    vi.mocked(quizApi.getQuizByLessonId).mockReset().mockResolvedValue(null);
    vi.mocked(assignmentApi.getAssignmentByLessonId).mockReset().mockResolvedValue(null);
  });

  it('shows the captions/transcript fields for a VIDEO activity and sends parsed segments on create', async () => {
    vi.mocked(lmsApi.createActivity).mockResolvedValue({
      id: 'activity-1',
      lessonId: 'lesson-1',
      type: 'VIDEO',
      title: null,
      position: 0,
      mediaUrl: 'https://example.com/video.mp4',
      externalUrl: null,
      bodyText: null,
      embedProvider: null,
      embedResourceId: null,
      captionsUrlEn: 'https://example.com/captions-en.vtt',
      captionsUrlTa: null,
      transcriptSegments: [{ startSeconds: 0, text: 'Welcome to this lesson.' }],
      status: 'DRAFT',
    });

    const user = userEvent.setup();
    renderPage();

    await screen.findByText('No activities yet.');
    // Default type is already VIDEO.
    await user.type(screen.getByPlaceholderText('https://media URL'), 'https://example.com/video.mp4');
    await user.type(screen.getByPlaceholderText('https://.../captions-en.vtt'), 'https://example.com/captions-en.vtt');
    await user.type(screen.getByPlaceholderText(/00:00 Welcome to this lesson/), '00:00 Welcome to this lesson.');
    await user.click(screen.getByRole('button', { name: '+ Add activity' }));

    await waitFor(() =>
      expect(lmsApi.createActivity).toHaveBeenCalledWith('lesson-1', {
        type: 'VIDEO',
        mediaUrl: 'https://example.com/video.mp4',
        externalUrl: undefined,
        bodyText: undefined,
        captionsUrlEn: 'https://example.com/captions-en.vtt',
        captionsUrlTa: undefined,
        transcriptSegments: [{ startSeconds: 0, text: 'Welcome to this lesson.' }],
      }),
    );
  });

  it('does not show the captions/transcript fields for an ARTICLE activity', async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText('No activities yet.');
    await user.selectOptions(screen.getByDisplayValue('VIDEO'), 'ARTICLE');

    expect(screen.queryByPlaceholderText('https://.../captions-en.vtt')).not.toBeInTheDocument();
  });
});
