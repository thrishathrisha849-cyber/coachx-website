import { useTheme } from '@/context/theme.context';

export function Topbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-950">
      <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Internal Admin Portal
      </span>
      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        aria-label="Toggle color theme"
      >
        {theme === 'light' ? 'Dark mode' : 'Light mode'}
      </button>
    </header>
  );
}
