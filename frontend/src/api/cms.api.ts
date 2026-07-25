import type { ApiSuccessResponse, PaginatedResponse } from '@coachx/shared';
import { apiClient } from './client';
import type { CmsPage, NavTreeNode, Announcement, FaqCategoryGroup, SearchResult } from '@/types/cms.types';

export async function fetchPageBySlug(slug: string, previewToken?: string): Promise<CmsPage> {
  const { data } = await apiClient.get<ApiSuccessResponse<CmsPage>>(`/cms/pages/${slug}`, {
    params: previewToken ? { preview: previewToken } : undefined,
  });
  return data.data;
}

export async function fetchBlogList(page = 1, pageSize = 10): Promise<{ items: CmsPage[]; total: number }> {
  const { data } = await apiClient.get<PaginatedResponse<CmsPage>>('/cms/blog', { params: { page, pageSize } });
  return { items: data.data, total: data.meta.totalItems };
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

export async function fetchSearch(query: string): Promise<SearchResult[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<SearchResult[]>>('/cms/search', { params: { q: query } });
  return data.data;
}

export async function submitContactForm(input: {
  name: string;
  email: string;
  phone?: string;
  department: string;
  message: string;
  consent: true;
}): Promise<void> {
  await apiClient.post('/contact', input);
}

export async function subscribeToNewsletter(email: string): Promise<void> {
  await apiClient.post('/newsletter/subscribe', { email, consent: true });
}
