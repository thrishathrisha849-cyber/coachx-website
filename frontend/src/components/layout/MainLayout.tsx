import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { AnnouncementBar } from './AnnouncementBar';
import { CookieConsentBanner } from './CookieConsentBanner';
import { ErrorBoundary } from '@/components/system/ErrorBoundary';

/**
 * Application shell every routed public page renders inside (002
 * "LAYOUT SYSTEM": sticky nav, responsive footer, announcement bar,
 * cookie banner). A skip-navigation link is included for keyboard/
 * screen-reader users (FR-108).
 */
export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <AnnouncementBar />
      <Header />
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <CookieConsentBanner />
    </div>
  );
}
