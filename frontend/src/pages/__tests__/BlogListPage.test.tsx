import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BlogListPage } from '../BlogListPage';
import * as cmsApi from '@/api/cms.api';

vi.mock('@/api/cms.api');

const samplePost = {
  id: '1',
  slug: 'my-post',
  language: 'EN',
  template: 'BLOG_POST',
  status: 'PUBLISHED',
  title: 'My First Post',
  seo: { title: 'My First Post', description: 'A great post', canonicalUrl: null, ogImageUrl: null, noIndex: false },
  tags: ['Business'],
  headerVisible: true,
  footerVisible: true,
  blocks: [],
  publishAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('BlogListPage (002 FR-049)', () => {
  beforeEach(() => {
    vi.mocked(cmsApi.fetchBlogList).mockReset();
  });

  it('renders published posts fetched from the CMS', async () => {
    vi.mocked(cmsApi.fetchBlogList).mockResolvedValue({
      items: [samplePost],
      meta: { page: 1, pageSize: 9, totalItems: 1, totalPages: 1 },
    });

    render(<MemoryRouter><BlogListPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByRole('link', { name: /My First Post/ })).toBeInTheDocument());
  });

  it('shows an empty state when there are no posts', async () => {
    vi.mocked(cmsApi.fetchBlogList).mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 9, totalItems: 0, totalPages: 0 },
    });

    render(<MemoryRouter><BlogListPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('No articles published yet')).toBeInTheDocument());
  });

  it('requests a filtered list when a tag is present in the URL', async () => {
    vi.mocked(cmsApi.fetchBlogList).mockResolvedValue({
      items: [samplePost],
      meta: { page: 1, pageSize: 9, totalItems: 1, totalPages: 1 },
    });

    render(<MemoryRouter initialEntries={['/blog?tag=Business']}><BlogListPage /></MemoryRouter>);

    await waitFor(() => expect(cmsApi.fetchBlogList).toHaveBeenCalledWith(1, 9, 'Business'));
  });
});
