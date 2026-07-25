/**
 * Frontend-local mirror of the backend's CMS response shapes
 * (`backend/src/cms/cms.types.ts`). Kept separate rather than shared
 * via `@coachx/shared` since these are Phase 5 (Part 1)-specific and
 * `@coachx/shared` is deliberately reserved for cross-cutting,
 * domain-agnostic primitives (see `shared/src/types/index.ts`'s own
 * scope note from Phase 1).
 */

export interface CmsBlock {
  id: string;
  type: string;
  order: number;
  data: Record<string, unknown>;
}

export interface CmsPage {
  id: string;
  slug: string;
  language: string;
  template: string;
  status: string;
  title: string;
  seo: {
    title: string;
    description: string | null;
    canonicalUrl: string | null;
    ogImageUrl: string | null;
    noIndex: boolean;
  };
  tags: string[];
  headerVisible: boolean;
  footerVisible: boolean;
  blocks: CmsBlock[];
  updatedAt: string;
}

export interface NavTreeNode {
  id: string;
  label: string;
  url: string;
  isExternal: boolean;
  megaMenuColumn: string | null;
  requiredPermission: string | null;
  children: NavTreeNode[];
}

export interface Announcement {
  id: string;
  text: string;
  icon: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  style: string;
  dismissible: boolean;
  priority: number;
}

export interface FaqCategoryGroup {
  category: string;
  items: Array<{ id: string; question: string; answer: string }>;
}

export interface SearchResult {
  type: 'page' | 'faq';
  id: string;
  title: string;
  url: string;
  excerpt: string;
}
