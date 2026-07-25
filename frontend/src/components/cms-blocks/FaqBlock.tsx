import { useEffect, useState } from 'react';
import { fetchFaqs } from '@/api/cms.api';
import type { FaqCategoryGroup } from '@/types/cms.types';
import { FaqAccordion } from './FaqAccordion';

/**
 * FAQ block (002 FR-028, FR-091's FAQPage structured data). Unlike
 * every other block, this fetches from the shared FAQ catalog rather
 * than embedding Q&A directly in its own `data`, so FAQ content stays
 * centrally editable (see block-schemas.ts's comment).
 */
export function FaqBlock({ data }: { data: Record<string, unknown> }) {
  const d = data as { heading?: string; categories?: string[] };
  const [groups, setGroups] = useState<FaqCategoryGroup[] | null>(null);

  useEffect(() => {
    fetchFaqs()
      .then((all) => {
        const filtered = d.categories && d.categories.length > 0 ? all.filter((g) => d.categories!.includes(g.category)) : all;
        setGroups(filtered);
      })
      .catch(() => setGroups([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!groups) {
    return <div className="h-40 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800" />;
  }

  return (
    <section className="py-10">
      {d.heading && <h2 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white">{d.heading}</h2>}
      <FaqAccordion groups={groups} />
    </section>
  );
}
