import type { ApiSuccessResponse, PaginatedResponse, PaginationMeta } from '@coachx/shared';
import { apiClient } from './client';
import type { CmsPage, NavTreeNode, Announcement, FaqCategoryGroup, SearchResult } from '@/types/cms.types';

export async function fetchPageBySlug(slug: string, previewToken?: string): Promise<CmsPage> {
  const { data } = await apiClient.get<ApiSuccessResponse<CmsPage>>(`/cms/pages/${slug}`, {
    params: previewToken ? { preview: previewToken } : undefined,
  });
  return data.data;
}

/** 002 FR-049: category/tag filter + pagination. */
export async function fetchBlogList(
  page = 1,
  pageSize = 10,
  tag?: string,
): Promise<{ items: CmsPage[]; meta: PaginationMeta }> {
  const { data } = await apiClient.get<PaginatedResponse<CmsPage>>('/cms/blog', {
    params: { page, pageSize, ...(tag ? { tag } : {}) },
  });
  return { items: data.data, meta: data.meta };
}

export async function fetchNavigation(location: 'header' | 'footer' | 'mobile'): Promise<NavTreeNode[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<NavTreeNode[]>>(`/cms/navigation/${location}`);
  return data.data;
}

export async function fetchAnnouncements(): Promise<Announcement[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<Announcement[]>>('/cms/announcements');
  return data.data;
}

export async function fetchFaqs(): Promise<FaqCategoryGroup[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<FaqCategoryGroup[]>>('/cms/faqs');
  return data.data;
}

/** 002 FR-009: paginated, ranked, highlighted search results. */
export async function fetchSearch(
  query: string,
  page = 1,
  pageSize = 10,
): Promise<{ items: SearchResult[]; meta: PaginationMeta }> {
  const { data } = await apiClient.get<PaginatedResponse<SearchResult>>('/cms/search', {
    params: { q: query, page, pageSize },
  });
  return { items: data.data, meta: data.meta };
}

export async function submitContactForm(input: {
  name: string;
  email: string;
  phone?: string;
  department: string;
  message: string;
  consent: true;
  /** Honeypot spam-protection field — always left empty by real users. */
  website?: string;
}): Promise<void> {
  await apiClient.post('/contact', input);
}

export async function subscribeToNewsletter(email: string, honeypotValue?: string): Promise<void> {
  await apiClient.post('/newsletter/subscribe', { email, consent: true, website: honeypotValue });
}

export async function unsubscribeFromNewsletter(token: string): Promise<void> {
  await apiClient.post('/newsletter/unsubscribe', undefined, { params: { token } });
}

/**
 * 002 FR-092 redirect check (Phase 5 Part 2). Returns `null` when no
 * redirect is configured for `path` — a 404 here is an expected,
 * common outcome (most unknown paths genuinely have no redirect), not
 * an error condition, so this resolves to `null` rather than throwing.
 */
export async function checkRedirect(path: string): Promise<{ toPath: string; statusCode: number } | null> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<{ toPath: string; statusCode: number }>>(
      '/cms/redirects/check',
      { params: { path } },
    );
    return data.data;
  } catch {
    return null;
  }
}
