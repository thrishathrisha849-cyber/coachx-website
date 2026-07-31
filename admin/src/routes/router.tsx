import { createBrowserRouter } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { SystemStatus } from '@/components/system/SystemStatus';
import { NotFound } from '@/components/system/NotFound';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { LoginPage } from '@/pages/LoginPage';
import { OrganizationsPage } from '@/pages/OrganizationsPage';
import { MembershipTiersPage } from '@/pages/MembershipTiersPage';
import { ModerationQueuePage } from '@/pages/ModerationQueuePage';
import { KpiDashboardPage } from '@/pages/KpiDashboardPage';
import { GovernancePage } from '@/pages/GovernancePage';
import { QuizzesPage } from '@/pages/QuizzesPage';
import { QuizEditorPage } from '@/pages/QuizEditorPage';
import { AssignmentsPage } from '@/pages/AssignmentsPage';
import { AssignmentEditorPage } from '@/pages/AssignmentEditorPage';
import { ProjectEditorPage } from '@/pages/ProjectEditorPage';
import { SubmissionsListPage } from '@/pages/SubmissionsListPage';
import { SubmissionReviewPage } from '@/pages/SubmissionReviewPage';
import { CertificateTemplatesPage } from '@/pages/CertificateTemplatesPage';
import { CourseCertificatesPage } from '@/pages/CourseCertificatesPage';
import { LmsCategoriesPage } from '@/pages/LmsCategoriesPage';
import { LmsCoursesPage } from '@/pages/LmsCoursesPage';
import { LmsSettingsPage } from '@/pages/LmsSettingsPage';
import { AcademicIntegrityQueuePage } from '@/pages/AcademicIntegrityQueuePage';
import { CourseCalendarPage } from '@/pages/CourseCalendarPage';
import { NewCourseWizardPage } from '@/pages/NewCourseWizardPage';
import { CohortsPage } from '@/pages/CohortsPage';
import { CohortDetailPage } from '@/pages/CohortDetailPage';
import { QuestionBankPage } from '@/pages/QuestionBankPage';
import { CourseVersionHistoryPage } from '@/pages/CourseVersionHistoryPage';
import { CourseEditorPage } from '@/pages/CourseEditorPage';
import { ModuleEditorPage } from '@/pages/ModuleEditorPage';
import { LessonEditorPage } from '@/pages/LessonEditorPage';
import { CourseEnrollmentsPage } from '@/pages/CourseEnrollmentsPage';
import { CourseAnalyticsPage } from '@/pages/CourseAnalyticsPage';
import { CourseAnnouncementsPage } from '@/pages/CourseAnnouncementsPage';
import { CourseReviewsPage } from '@/pages/CourseReviewsPage';
import { CourseWaitlistPage } from '@/pages/CourseWaitlistPage';

/**
 * Admin route table. 001 FR-023: every module route below is
 * role-gated behind `RequireAuth` (an authenticated session) — the
 * backend's own `requirePermission()` guards are the real authorization
 * boundary (FR-087), this is only the UI-side navigation gate.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        path: '/',
        element: <AdminLayout />,
        children: [
          { index: true, element: <SystemStatus /> },
          { path: 'organizations', element: <OrganizationsPage /> },
          { path: 'membership-tiers', element: <MembershipTiersPage /> },
          { path: 'moderation', element: <ModerationQueuePage /> },
          { path: 'kpi', element: <KpiDashboardPage /> },
          { path: 'governance', element: <GovernancePage /> },
          { path: 'quizzes', element: <QuizzesPage /> },
          { path: 'quizzes/:quizId', element: <QuizEditorPage /> },
          { path: 'assignments', element: <AssignmentsPage /> },
          { path: 'assignments/:assignmentId', element: <AssignmentEditorPage /> },
          { path: 'assignments/:assignmentId/submissions', element: <SubmissionsListPage /> },
          { path: 'submissions/:submissionId/review', element: <SubmissionReviewPage /> },
          { path: 'projects/:projectId', element: <ProjectEditorPage /> },
          { path: 'certificate-templates', element: <CertificateTemplatesPage /> },
          { path: 'course-certificates', element: <CourseCertificatesPage /> },
          { path: 'lms-categories', element: <LmsCategoriesPage /> },
          { path: 'lms-courses', element: <LmsCoursesPage /> },
          { path: 'lms-courses/new-wizard', element: <NewCourseWizardPage /> },
          { path: 'lms-courses/:id', element: <CourseEditorPage /> },
          { path: 'lms-courses/:id/enrollments', element: <CourseEnrollmentsPage /> },
          { path: 'lms-courses/:id/analytics', element: <CourseAnalyticsPage /> },
          { path: 'lms-courses/:id/announcements', element: <CourseAnnouncementsPage /> },
          { path: 'lms-courses/:id/waitlist', element: <CourseWaitlistPage /> },
          { path: 'lms-courses/:id/calendar', element: <CourseCalendarPage /> },
          { path: 'lms-courses/:id/cohorts', element: <CohortsPage /> },
          { path: 'cohorts/:cohortId', element: <CohortDetailPage /> },
          { path: 'lms-courses/:id/question-bank', element: <QuestionBankPage /> },
          { path: 'lms-courses/:id/versions', element: <CourseVersionHistoryPage /> },
          { path: 'lms-modules/:moduleId', element: <ModuleEditorPage /> },
          { path: 'lms-lessons/:lessonId', element: <LessonEditorPage /> },
          { path: 'course-reviews', element: <CourseReviewsPage /> },
          { path: 'lms-settings', element: <LmsSettingsPage /> },
          { path: 'academic-integrity', element: <AcademicIntegrityQueuePage /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]);
