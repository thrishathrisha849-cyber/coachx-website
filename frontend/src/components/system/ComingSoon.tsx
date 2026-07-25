import { Link } from 'react-router-dom';

export function ComingSoon({ title = 'Coming Soon' }: { title?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="text-4xl" aria-hidden="true">🚀</span>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
      <p className="max-w-md text-slate-600 dark:text-slate-300">We're working on this. Check back soon.</p>
      <Link to="/" className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
        Go Home
      </Link>
    </div>
  );
}
