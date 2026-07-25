import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@/context/theme.context';
import { router } from '@/routes/router';

export function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
