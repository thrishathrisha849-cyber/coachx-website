import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { NotFound } from '@/components/system/NotFound';
import { Maintenance } from '@/components/system/Maintenance';
import { ComingSoon } from '@/components/system/ComingSoon';
import { PageSkeleton } from '@/components/system/Skeleton';
import { SystemStatus } from '@/components/system/SystemStatus';
import { RequireAuth } from '@/components/auth/RequireAuth';

/**
 * Central route table (Phase 5). Most public marketing pages (Home,
 * About, Pricing, FAQ, Privacy, Terms, Cookies, Careers, Press, Status,
 * Roadmap, Release Notes, Contact) are served by ONE generic
 * `CmsPageRoute` keyed by slug — they don't need individual components
 * since their content is entirely CMS-driven (see
 * docs/public-site/TRACEABILITY.md). Blog gets dedicated list/detail
 * components because it needs list pagination and article-specific
 * chrome beyond generic block rendering. System pages (404/Maintenance/
 * Coming Soon) are static, not CMS-driven, since they must render
 * regardless of backend/CMS state — kept as eager (non-lazy) imports so
 * they're always available even if a chunk fails to load.
 *
 * Phase 5 Part 2 performance: page-level components are lazy-loaded
 * (`React.lazy`) so the initial bundle only includes the app shell —
 * each route's code loads on navigation, not upfront.
 */
const CmsPageRoute = lazy(() => import('@/pages/CmsPageRoute').then((m) => ({ default: m.CmsPageRoute })));
const BlogListPage = lazy(() => import('@/pages/BlogListPage').then((m) => ({ default: m.BlogListPage })));
const BlogDetailPage = lazy(() => import('@/pages/BlogDetailPage').then((m) => ({ default: m.BlogDetailPage })));
const SearchPage = lazy(() => import('@/pages/SearchPage').then((m) => ({ default: m.SearchPage })));
// Phase 6 Part 1 — course discovery routes, registered BEFORE the ':slug'
// CMS catch-all below (route order matters: otherwise '/courses' would be
// swallowed as a CMS page-slug lookup instead of reaching these).
const CourseListPage = lazy(() => import('@/pages/CourseListPage').then((m) => ({ default: m.CourseListPage })));
const CourseDetailPage = lazy(() => import('@/pages/CourseDetailPage').then((m) => ({ default: m.CourseDetailPage })));
const NewsletterUnsubscribePage = lazy(() =>
  import('@/pages/NewsletterUnsubscribePage').then((m) => ({ default: m.NewsletterUnsubscribePage })),
);
// Phase 7 Part 1 — billing plan-comparison route, registered BEFORE the
// ':slug' CMS catch-all for the same reason as '/courses' above. This
// intentionally takes priority over any CMS Page row with slug "pricing"
// (one already exists from Phase 5 seeding) — FR-013 requires genuinely
// dynamic, server-evaluated plan/price data, which static CMS blocks
// cannot represent; see docs/billing/DECISION_GATES.md.
const PricingPage = lazy(() => import('@/pages/PricingPage').then((m) => ({ default: m.PricingPage })));
// "Join Now" fix — the header, mobile nav, and CMS-seeded homepage/pricing
// CTAs all already link to '/join', but no route existed for it (it fell
// through to the ':slug' CMS catch-all and 404'd, since no CMS Page row
// has slug "join"). Registered BEFORE that catch-all for the same reason
// as '/courses' and '/pricing' above.
const JoinPage = lazy(() => import('@/pages/JoinPage').then((m) => ({ default: m.JoinPage })));
// "Login" fix — the header Login link and JoinPage's "Log in" link both
// already point to '/login', which had no route either (same missing-
// route class of bug as '/join'). Registered BEFORE the ':slug' catch-all
// for the same reason as the routes above.
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
// 002 US2/US3/US4 — funnel routes, registered BEFORE the ':slug' CMS
// catch-all for the same reason as '/courses'/'/pricing' above.
const LeadMagnetPage = lazy(() => import('@/pages/LeadMagnetPage').then((m) => ({ default: m.LeadMagnetPage })));
const MasterclassPage = lazy(() => import('@/pages/MasterclassPage').then((m) => ({ default: m.MasterclassPage })));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage').then((m) => ({ default: m.CheckoutPage })));
const CheckoutSuccessPage = lazy(() => import('@/pages/CheckoutSuccessPage').then((m) => ({ default: m.CheckoutSuccessPage })));
// 003 US2/US4 — onboarding + dashboard, the first member-authenticated
// routes in this app; wrapped in `RequireAuth` (see below), registered
// BEFORE the ':slug' CMS catch-all for the same reason as the routes above.
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const RoadmapPage = lazy(() => import('@/pages/RoadmapPage').then((m) => ({ default: m.RoadmapPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const CourseLearnEntryPage = lazy(() => import('@/pages/CourseLearnEntryPage').then((m) => ({ default: m.CourseLearnEntryPage })));
const LessonPlayerPage = lazy(() => import('@/pages/LessonPlayerPage').then((m) => ({ default: m.LessonPlayerPage })));
const QuizStartPage = lazy(() => import('@/pages/QuizStartPage').then((m) => ({ default: m.QuizStartPage })));
const QuizAttemptPage = lazy(() => import('@/pages/QuizAttemptPage').then((m) => ({ default: m.QuizAttemptPage })));
const AssignmentPage = lazy(() => import('@/pages/AssignmentPage').then((m) => ({ default: m.AssignmentPage })));
const CertificatesPage = lazy(() => import('@/pages/CertificatesPage').then((m) => ({ default: m.CertificatesPage })));
const CertificateViewPage = lazy(() => import('@/pages/CertificateViewPage').then((m) => ({ default: m.CertificateViewPage })));
const CertificateVerifyPage = lazy(() => import('@/pages/CertificateVerifyPage').then((m) => ({ default: m.CertificateVerifyPage })));

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<PageSkeleton />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: withSuspense(<CmsPageRoute slug="home" />) },
      { path: 'blog', element: withSuspense(<BlogListPage />) },
      { path: 'blog/:slug', element: withSuspense(<BlogDetailPage />) },
      { path: 'search', element: withSuspense(<SearchPage />) },
      { path: 'courses', element: withSuspense(<CourseListPage />) },
      { path: 'courses/:slug', element: withSuspense(<CourseDetailPage />) },
      // 002 FR-031–037 "Programs": this codebase has no separate Program
      // entity distinct from Course (avoiding a parallel, competing
      // content type) — Programs listing/detail reuse the same real,
      // catalog-backed Course pages under a second URL.
      { path: 'programs', element: withSuspense(<CourseListPage />) },
      { path: 'programs/:slug', element: withSuspense(<CourseDetailPage />) },
      { path: 'lp/:slug', element: withSuspense(<LeadMagnetPage />) },
      { path: 'masterclass/:slug', element: withSuspense(<MasterclassPage />) },
      { path: 'checkout', element: withSuspense(<CheckoutPage />) },
      { path: 'checkout/success/:sessionId', element: withSuspense(<CheckoutSuccessPage />) },
      { path: 'newsletter/unsubscribe', element: withSuspense(<NewsletterUnsubscribePage />) },
      { path: 'pricing', element: withSuspense(<PricingPage />) },
      { path: 'join', element: withSuspense(<JoinPage />) },
      { path: 'login', element: withSuspense(<LoginPage />) },
      // FR-085 public credential verification — deliberately OUTSIDE
      // `RequireAuth`; anyone holding a credential ID (e.g. an employer)
      // must be able to verify it without a CoachX account.
      { path: 'verify/:credentialId', element: withSuspense(<CertificateVerifyPage />) },
      {
        element: <RequireAuth />,
        children: [
          { path: 'onboarding', element: withSuspense(<OnboardingPage />) },
          { path: 'onboarding/roadmap', element: withSuspense(<RoadmapPage />) },
          { path: 'dashboard', element: withSuspense(<DashboardPage />) },
          { path: 'learn/:courseId', element: withSuspense(<CourseLearnEntryPage />) },
          { path: 'learn/:courseId/:lessonId', element: withSuspense(<LessonPlayerPage />) },
          { path: 'quizzes/:quizId', element: withSuspense(<QuizStartPage />) },
          { path: 'quiz-attempts/:attemptId', element: withSuspense(<QuizAttemptPage />) },
          { path: 'assignments/:assignmentId', element: withSuspense(<AssignmentPage />) },
          { path: 'certificates', element: withSuspense(<CertificatesPage />) },
          { path: 'certificates/:certificateId', element: withSuspense(<CertificateViewPage />) },
        ],
      },
      { path: 'status', element: <SystemStatus /> },
      { path: 'maintenance', element: <Maintenance /> },
      { path: 'coming-soon', element: <ComingSoon /> },
      // Every other single-segment path (about, contact, faq, privacy,
      // terms, cookies, careers, press, roadmap, release-notes,
      // membership, features, solutions, partners, help) is CMS-driven
      // by slug — no route needs to be added here per page; adding a
      // Page row with that slug is sufficient.
      { path: ':slug', element: withSuspense(<CmsPageRoute />) },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
