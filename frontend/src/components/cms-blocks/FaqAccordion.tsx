import { useMemo, useState } from 'react';
import { useStructuredData } from '@/hooks/useDocumentHead';
import type { FaqCategoryGroup } from '@/types/cms.types';

/** FR-028: accordion display, deep linking (URL hash), search; FR-091: FAQPage schema. */
export function FaqAccordion({ groups }: { groups: FaqCategoryGroup[] }) {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(typeof window !== 'undefined' ? window.location.hash.slice(1) || null : null);

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: groups.flatMap((g) =>
        g.items.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      ),
    }),
    [groups],
  );
  useStructuredData(groups.length > 0 ? structuredData : null, 'faq');

  const filteredGroups = query.trim().length < 2
    ? groups
    : groups
        .map((g) => ({ ...g, items: g.items.filter((i) => i.question.toLowerCase().includes(query.toLowerCase())) }))
        .filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-3xl">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search FAQs…"
        aria-label="Search FAQs"
        className="mb-6 w-full rounded-md border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      />

      {filteredGroups.map((group) => (
        <div key={group.category} className="mb-6">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{group.category}</h3>
          {group.items.map((item) => (
            <div key={item.id} id={item.id} className="border-b border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
                aria-expanded={openId === item.id}
                className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-slate-900 dark:text-white"
              >
                {item.question}
                <span aria-hidden="true">{openId === item.id ? '−' : '+'}</span>
              </button>
              {openId === item.id && <p className="pb-3 text-sm text-slate-600 dark:text-slate-300">{item.answer}</p>}
            </div>
          ))}
        </div>
      ))}

      {filteredGroups.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No FAQs match your search.</p>}
    </div>
  );
}
