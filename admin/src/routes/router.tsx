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
import { SubmissionsListPage } from '@/pages/SubmissionsListPage';
import { SubmissionReviewPage } from '@/pages/SubmissionReviewPage';
import { CertificateTemplatesPage } from '@/pages/CertificateTemplatesPage';
import { CourseCertificatesPage } from '@/pages/CourseCertificatesPage';

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
          { path: 'certificate-templates', element: <CertificateTemplatesPage /> },
          { path: 'course-certificates', element: <CourseCertificatesPage /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
]);
