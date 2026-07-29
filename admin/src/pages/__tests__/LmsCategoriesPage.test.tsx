import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LmsCategoriesPage } from '../LmsCategoriesPage';
import * as lmsApi from '@/api/lms.api';

vi.mock('@/api/lms.api');

const category = {
  id: 'cat-1',
  name: 'Business Fundamentals',
  slug: 'business-fundamentals',
  description: null,
  shortDescription: null,
  imageUrl: null,
  icon: null,
  parentId: null,
  sortOrder: 0,
  isFeatured: false,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('LmsCategoriesPage (LMS Admin UI batch)', () => {
  beforeEach(() => {
    vi.mocked(lmsApi.listCategoriesAdmin).mockReset();
    vi.mocked(lmsApi.createCategory).mockReset();
    vi.mocked(lmsApi.archiveCategory).mockReset();
  });

  it('lists categories fetched from the admin API', async () => {
    vi.mocked(lmsApi.listCategoriesAdmin).mockResolvedValue([category]);
    render(<LmsCategoriesPage />);

    expect(await screen.findByText('Business Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('/business-fundamentals')).toBeInTheDocument();
  });

  it('creates a new category and reloads the list', async () => {
    vi.mocked(lmsApi.listCategoriesAdmin).mockResolvedValue([]);
    vi.mocked(lmsApi.createCategory).mockResolvedValue(category);

    const user = userEvent.setup();
    render(<LmsCategoriesPage />);

    await screen.findByText('No categories yet.');
    await user.type(screen.getByLabelText('Name'), 'Business Fundamentals');
    await user.type(screen.getByLabelText('Slug'), 'business-fundamentals');
    await user.click(screen.getByRole('button', { name: 'Create category' }));

    expect(lmsApi.createCategory).toHaveBeenCalledWith({ name: 'Business Fundamentals', slug: 'business-fundamentals' });
  });

  it('archives an active category', async () => {
    vi.mocked(lmsApi.listCategoriesAdmin).mockResolvedValue([category]);
    vi.mocked(lmsApi.archiveCategory).mockResolvedValue(undefined);

    const user = userEvent.setup();
    render(<LmsCategoriesPage />);

    await user.click(await screen.findByRole('button', { name: 'Archive' }));
    expect(lmsApi.archiveCategory).toHaveBeenCalledWith('cat-1');
  });
});
