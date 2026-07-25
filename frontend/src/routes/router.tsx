import { createBrowserRouter } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { SystemStatus } from '@/components/system/SystemStatus';
import { NotFound } from '@/components/system/NotFound';

/**
 * Central route table. Business-domain routes are registered here in
 * later implementation phases — Phase 1 wires only the layout shell and
 * a foundation status screen.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <SystemStatus /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
