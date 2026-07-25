import { createBrowserRouter } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { SystemStatus } from '@/components/system/SystemStatus';
import { NotFound } from '@/components/system/NotFound';

/**
 * Admin route table. Module routes (user management, content moderation,
 * etc.) are registered here once RBAC and the corresponding domain
 * modules exist — out of scope for Phase 1.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <SystemStatus /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
