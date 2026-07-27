import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SearchPage } from '../SearchPage';
import * as cmsApi from '@/api/cms.api';

vi.mock('@/api/cms.api');

describe('SearchPage (002 FR-009)', () => {
  beforeEach(() => {
    vi.mocked(cmsApi.fetchSearch).mockReset();
  });

  it('does not search until at least 2 characters are entered', async () => {
    render(<MemoryRouter><SearchPage /></MemoryRouter>);
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Search'), 'a');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    expect(screen.getByText('Enter at least 2 characters to search.')).toBeInTheDocument();
    expect(cmsApi.fetchSearch).not.toHaveBeenCalled();
  });

  it('renders highlighted result segments as plain text (no dangerouslySetInnerHTML)', async () => {
    vi.mocked(cmsApi.fetchSearch).mockResolvedValue({
      items: [
        {
          type: 'page',
          id: '1',
          title: 'Pricing Plans',
          url: '/pricing',
          score: 3,
          excerpt: [
            { text: 'Our ', highlight: false },
            { text: 'pricing', highlight: true },
            { text: ' is simple.', highlight: false },
          ],
        },
      ],
      meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
    });

    render(<MemoryRouter initialEntries={['/search?q=pricing']}><SearchPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByRole('link', { name: 'Pricing Plans' })).toBeInTheDocument());
    const mark = screen.getByText('pricing', { selector: 'mark' });
    expect(mark.tagName).toBe('MARK');
  });

  it('shows an empty state with no results', async () => {
    vi.mocked(cmsApi.fetchSearch).mockResolvedValue({
      items: [],
      meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
    });

    render(<MemoryRouter initialEntries={['/search?q=zzzznotfound']}><SearchPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText(/No results for/)).toBeInTheDocument());
  });

  it('shows pagination controls when there are multiple pages', async () => {
    vi.mocked(cmsApi.fetchSearch).mockResolvedValue({
      items: [{ type: 'page', id: '1', title: 'Result 1', url: '/r1', score: 1, excerpt: [] }],
      meta: { page: 1, pageSize: 10, totalItems: 25, totalPages: 3 },
    });

    render(<MemoryRouter initialEntries={['/search?q=result']}><SearchPage /></MemoryRouter>);

    await waitFor(() => expect(screen.getByText('Page 1 of 3')).toBeInTheDocument());
  });
});
