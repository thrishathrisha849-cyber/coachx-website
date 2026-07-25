import { env } from '@/config/env';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      © {new Date().getFullYear()} {env.appName}. All rights reserved.
    </footer>
  );
}
