import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@/context/theme.context';
import { AuthProvider } from '@/context/auth.context';
import { router } from '@/routes/router';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
