import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CourseAnalyticsPage } from '../CourseAnalyticsPage';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const analytics: lmsApi.CourseAnalytics = {
  courseId: 'course-1',
  courseTitle: 'Intro to Business',
  enrollments: 2,
  activeLearners: 1,
  completionRate: 50,
  avgCompletionTimeDays: 3.5,
  lessonDropOff: [{ lessonId: 'lesson-1', lessonTitle: 'Lesson 1', starts: 2, completes: 1, dropOff: 1 }],
  videoEngagement: { learnersWithVideoActivity: 1, avgWatchedPercent: 80 },
  quizPassRate: 33,
  assignmentApprovalRate: 0,
  ratingAverage: null,
  ratingCount: 0,
  refundCorrelation: null,
  certificateRate: 100,
  deviceDistribution: null,
  languageDistribution: null,
  notApplicable: ['refundCorrelation', 'deviceDistribution', 'languageDistribution'],
};

const atRiskLearner: lmsApi.AtRiskAssessment = {
  enrollmentId: 'enr-1',
  userId: 'user-1',
  courseId: 'course-1',
  atRiskScore: 20,
  signals: [{ type: 'REPEATED_QUIZ_FAILURE', detail: '2 failed quiz attempts' }],
  recommendedRevision: { lessonId: 'lesson-1', lessonTitle: 'Lesson 1', quizTitle: 'Quiz 1' },
  instructorAlertRaised: true,
  notApplicableSignals: ['lowAttendance'],
  notApplicableActions: ['reminder', 'mentorSuggestion', 'supportOutreach', 'simplifiedRestartPlan'],
};

const learnerDetail: lmsApi.LearnerAnalytics = {
  enrollmentId: 'enr-1',
  userId: 'user-1',
  courseId: 'course-1',
  courseTitle: 'Intro to Business',
  enrolledAt: '2026-01-01T00:00:00.000Z',
  lastActivityAt: '2026-01-05T00:00:00.000Z',
  progressPercent: 40,
  timeSpentSeconds: 600,
  lessonsCompleted: 0,
  totalMandatoryLessons: 1,
  quizAttempts: [],
  assignmentSubmissions: [],
  certificateIssued: false,
  certificateCredentialId: null,
  dropOffLessonId: 'lesson-1',
  dropOffLessonTitle: 'Lesson 1',
  atRiskScore: 20,
  atRiskSignals: [{ type: 'REPEATED_QUIZ_FAILURE', detail: '2 failed quiz attempts' }],
  attendance: null,
  notApplicable: ['attendance'],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/lms-courses/course-1/analytics']}>
      <Routes>
        <Route path="/lms-courses/:id/analytics" element={<CourseAnalyticsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CourseAnalyticsPage (Learning Analytics & At-Risk Detection batch)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.getCourseAnalyticsAdmin).mockReset();
    vi.mocked(lmsApi.getCourseAtRiskLearnersAdmin).mockReset();
    vi.mocked(lmsApi.getEnrollmentAnalyticsAdmin).mockReset();
  });

  it('shows course-level KPIs and the lesson drop-off table', async () => {
    vi.mocked(lmsApi.getCourseAnalyticsAdmin).mockResolvedValue(analytics);
    vi.mocked(lmsApi.getCourseAtRiskLearnersAdmin).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText('Intro to Business — Analytics')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Lesson 1')).toBeInTheDocument();
    expect(screen.getByText('No at-risk learners detected.')).toBeInTheDocument();
  });

  it('lists at-risk learners with their signals and recommended revision, and drills into learner analytics on demand', async () => {
    vi.mocked(lmsApi.getCourseAnalyticsAdmin).mockResolvedValue(analytics);
    vi.mocked(lmsApi.getCourseAtRiskLearnersAdmin).mockResolvedValue([atRiskLearner]);
    vi.mocked(lmsApi.getEnrollmentAnalyticsAdmin).mockResolvedValue(learnerDetail);

    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Risk score 20')).toBeInTheDocument();
    expect(screen.getByText('Repeated quiz failure')).toBeInTheDocument();
    expect(screen.getByText(/Recommended revision/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'View details' }));
    expect(lmsApi.getEnrollmentAnalyticsAdmin).toHaveBeenCalledWith('enr-1');
    expect(await screen.findByText('40%')).toBeInTheDocument();
  });
});
