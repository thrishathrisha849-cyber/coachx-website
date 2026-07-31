import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CatalogPage } from '../CatalogPage';
import * as catalogApi from '@/api/catalog.api';

vi.mock('@/api/catalog.api');

const emptySection = { status: 'empty' as const, data: null, reason: 'Not available yet.' };

function renderPage() {
  return render(
    <MemoryRouter>
      <CatalogPage />
    </MemoryRouter>,
  );
}

describe('CatalogPage (004 Discovery & Recommendations batch, FR-090)', () => {
  beforeEach(() => {
    vi.mocked(catalogApi.getMyCatalog).mockReset();
  });

  it('renders course cards for sections with data, and honest unavailable reasons for the rest', async () => {
    vi.mocked(catalogApi.getMyCatalog).mockResolvedValue({
      continueLearning: {
        status: 'ok',
        data: [{ courseId: 'c1', courseTitle: 'In Progress Course', courseSlug: 'in-progress', thumbnailUrl: null, priceType: 'FREE', certificateAvailable: false, cardState: 'CONTINUE' }],
      },
      recommended: { status: 'ok', data: [{ type: 'NEXT_COURSE', courseId: 'c2', courseTitle: 'Next Course', courseSlug: 'next-course', reason: 'Popular pick' }] },
      newCourses: emptySection,
      popular: emptySection,
      free: emptySection,
      completed: emptySection,
      wishlist: { status: 'empty', data: null, reason: 'No courses saved to your wishlist yet.' },
      learningPaths: { status: 'empty', data: null, reason: 'Learning paths are not available yet.' },
      includedInMembership: { status: 'empty', data: null, reason: 'Membership-included courses are not available yet.' },
    });

    renderPage();

    expect(await screen.findByText('In Progress Course')).toBeInTheDocument();
    expect(screen.getByText('Next Course')).toBeInTheDocument();
    expect(screen.getByText('Popular pick')).toBeInTheDocument();
    expect(screen.getByText('Learning paths are not available yet.')).toBeInTheDocument();
    expect(screen.getByText('No courses saved to your wishlist yet.')).toBeInTheDocument();
    expect(screen.getByText('Membership-included courses are not available yet.')).toBeInTheDocument();
  });

  it('shows an error message when the catalog fails to load', async () => {
    vi.mocked(catalogApi.getMyCatalog).mockRejectedValue(new Error('network error'));
    renderPage();

    expect(await screen.findByText(/Couldn't load your catalog/)).toBeInTheDocument();
  });

  it('renders real wishlist cards (004 Wishlist batch, FR-027)', async () => {
    vi.mocked(catalogApi.getMyCatalog).mockResolvedValue({
      continueLearning: emptySection,
      recommended: emptySection,
      newCourses: emptySection,
      popular: emptySection,
      free: emptySection,
      completed: emptySection,
      wishlist: {
        status: 'ok',
        data: [{ courseId: 'c3', courseTitle: 'Saved For Later Course', courseSlug: 'saved-for-later', thumbnailUrl: null, priceType: 'FREE', certificateAvailable: false, cardState: 'LOCKED' }],
      },
      learningPaths: { status: 'empty', data: null, reason: 'Learning paths are not available yet.' },
      includedInMembership: { status: 'empty', data: null, reason: 'Membership-included courses are not available yet.' },
    });

    renderPage();

    expect(await screen.findByText('Saved For Later Course')).toBeInTheDocument();
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });
});
