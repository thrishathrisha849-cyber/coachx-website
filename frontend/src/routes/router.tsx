import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { NotFound } from '@/components/system/NotFound';
import { Maintenance } from '@/components/system/Maintenance';
import { ComingSoon } from '@/components/system/ComingSoon';
import { PageSkeleton } from '@/components/system/Skeleton';
import { SystemStatus } from '@/components/system/SystemStatus';

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
const NewsletterUnsubscribePage = lazy(() =>
  import('@/pages/NewsletterUnsubscribePage').then((m) => ({ default: m.NewsletterUnsubscribePage })),
);

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
      { path: 'newsletter/unsubscribe', element: withSuspense(<NewsletterUnsubscribePage />) },
      { path: 'status', element: <SystemStatus /> },
      { path: 'maintenance', element: <Maintenance /> },
      { path: 'coming-soon', element: <ComingSoon /> },
      // Every other single-segment path (about, pricing, contact, faq,
      // privacy, terms, cookies, careers, press, roadmap, release-notes,
      // membership, features, solutions, partners, help) is CMS-driven
      // by slug — no route needs to be added here per page; adding a
      // Page row with that slug is sufficient.
      { path: ':slug', element: withSuspense(<CmsPageRoute />) },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
