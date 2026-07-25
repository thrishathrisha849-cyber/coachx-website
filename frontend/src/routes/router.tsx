import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { NotFound } from '@/components/system/NotFound';
import { Maintenance } from '@/components/system/Maintenance';
import { ComingSoon } from '@/components/system/ComingSoon';
import { CmsPageRoute } from '@/pages/CmsPageRoute';
import { BlogListPage } from '@/pages/BlogListPage';
import { BlogDetailPage } from '@/pages/BlogDetailPage';
import { SearchPage } from '@/pages/SearchPage';
import { SystemStatus } from '@/components/system/SystemStatus';

/**
 * Central route table (Phase 5, Part 1). Most public marketing pages
 * (Home, About, Pricing, FAQ, Privacy, Terms, Cookies, Careers, Press,
 * Status, Roadmap, Release Notes, Contact) are served by ONE generic
 * `CmsPageRoute` keyed by slug — they don't need individual components
 * since their content is entirely CMS-driven (see
 * docs/public-site/TRACEABILITY.md). Blog gets dedicated list/detail
 * components because it needs list pagination and article-specific
 * chrome beyond generic block rendering. System pages (404/Maintenance/
 * Coming Soon) are static, not CMS-driven, since they must render
 * regardless of backend/CMS state.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <CmsPageRoute slug="home" /> },
      { path: 'blog', element: <BlogListPage /> },
      { path: 'blog/:slug', element: <BlogDetailPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'status', element: <SystemStatus /> },
      { path: 'maintenance', element: <Maintenance /> },
      { path: 'coming-soon', element: <ComingSoon /> },
      // Every other single-segment path (about, pricing, contact, faq,
      // privacy, terms, cookies, careers, press, status, roadmap,
      // release-notes, membership, features, solutions, partners, help)
      // is CMS-driven by slug — no route needs to be added here per
      // page; adding a Page row with that slug is sufficient.
      { path: ':slug', element: <CmsPageRoute /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
