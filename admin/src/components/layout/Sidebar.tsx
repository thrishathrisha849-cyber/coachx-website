import { NavLink } from 'react-router-dom';
import { env } from '@/config/env';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', end: true },
  { to: '/organizations', label: 'Organizations' },
  { to: '/membership-tiers', label: 'Membership Tiers' },
  { to: '/moderation', label: 'Moderation Queue' },
  { to: '/kpi', label: 'Business KPIs' },
  { to: '/governance', label: 'Governance' },
  { to: '/lms-categories', label: 'LMS Categories' },
  { to: '/lms-courses', label: 'LMS Courses' },
  { to: '/quizzes', label: 'Quizzes' },
  { to: '/assignments', label: 'Assignments' },
  { to: '/certificate-templates', label: 'Certificate Templates' },
  { to: '/course-certificates', label: 'Course Certificates' },
  { to: '/course-reviews', label: 'Course Reviews' },
];

/** 001 FR-023 admin module registry — populated as each domain module lands (Governance Foundation is the first). */
export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:block">
      <div className="flex h-14 items-center border-b border-slate-200 px-4 font-semibold text-brand-600 dark:border-slate-800 dark:text-brand-400">
        {env.appName}
      </div>
      <nav className="p-4 text-sm">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 ${
                    isActive
                      ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
