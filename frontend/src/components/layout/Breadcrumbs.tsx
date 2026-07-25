import { Link } from 'react-router-dom';
import { useStructuredData } from '@/hooks/useDocumentHead';

export interface BreadcrumbItem {
  label: string;
  url: string;
}

/**
 * 002 FR-090/FR-091: breadcrumb UI + BreadcrumbList structured data,
 * on every page that needs one (blog detail, etc.).
 */
export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  useStructuredData(
    items.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.label,
            item: item.url,
          })),
        }
      : null,
    'breadcrumbs',
  );

  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500 dark:text-slate-400">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={item.url} className="flex items-center gap-1">
            {index > 0 && <span aria-hidden="true">/</span>}
            {index === items.length - 1 ? (
              <span aria-current="page" className="font-medium text-slate-700 dark:text-slate-200">
                {item.label}
              </span>
            ) : (
              <Link to={item.url} className="hover:text-brand-600 dark:hover:text-brand-400">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
