/**
 * Shared types for the Phase 5 (Part 1) CMS/public-site module. See
 * docs/public-site/TRACEABILITY.md for the FR citation behind each
 * concept below.
 */

export interface RenderedPage {
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
  blocks: Array<{
    id: string;
    type: string;
    order: number;
    data: unknown;
  }>;
  updatedAt: Date;
}
