import { useEffect, useState } from 'react';
import { fetchNavigation } from '@/api/cms.api';
import type { NavTreeNode } from '@/types/cms.types';

/**
 * Shared navigation-tree fetch hook (Phase 5 Part 3 code-quality pass —
 * previously `Header.tsx` and `Footer.tsx` each reimplemented the
 * identical fetch/state/error-fallback logic independently for their
 * own `location`; this is the single, reused implementation both now
 * call). Never hardcodes menu items — always CMS-driven.
 */
export function useNavigation(location: 'header' | 'footer' | 'mobile'): NavTreeNode[] {
  const [items, setItems] = useState<NavTreeNode[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetchNavigation(location)
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, [location]);

  return items;
}
