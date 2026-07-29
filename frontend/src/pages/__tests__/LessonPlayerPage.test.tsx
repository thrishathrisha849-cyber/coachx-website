import { render, screen } from '@testing-library/react';
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
        lessons: [{ ...lesson, locked: false, status: 'NOT_STARTED' }],
      },
      {
        id: 'module-2',
        title: 'Module 2',
        position: 1,
        isMandatory: true,
        locked: true,
        lockReason: 'PREREQUISITE_NOT_MET',
        lessons: [],
      },
    ]);

    renderPage();

    expect(await screen.findByText(/Complete the previous module to unlock/)).toBeInTheDocument();
  });
});
