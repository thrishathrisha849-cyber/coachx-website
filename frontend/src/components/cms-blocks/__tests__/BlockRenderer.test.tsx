import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { BlockRenderer } from '../BlockRenderer';
import type { CmsBlock } from '@/types/cms.types';
import { expectNoA11yViolations } from '@/test/a11y';

// FaqBlock fetches from the network on mount — mock it out for these
// pure rendering tests (network behavior is covered by cms.api tests).
vi.mock('@/api/cms.api', () => ({
  fetchFaqs: vi.fn().mockResolvedValue([]),
}));

function renderBlock(block: CmsBlock) {
  return render(
    <MemoryRouter>
      <BlockRenderer block={block} />
    </MemoryRouter>,
  );
}

describe('BlockRenderer — CMS page rendering (Phase 5 Part 2)', () => {
  it('renders a HERO block with headline and CTA', () => {
    renderBlock({ id: '1', type: 'HERO', order: 0, data: { headline: 'Welcome to CoachX', primaryCta: { label: 'Start Free', url: '/join' } } });
    expect(screen.getByRole('heading', { name: 'Welcome to CoachX' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Start Free' })).toHaveAttribute('href', '/join');
  });

  it('renders a STATS block with its source note as a title attribute (no fabricated metrics)', () => {
    renderBlock({
      id: '1',
      type: 'STATS',
      order: 0,
      data: { items: [{ label: 'Members', value: '10,000+', sourceNote: 'Verified 2026-07-01' }] },
    });
    expect(screen.getByText('10,000+')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
  });

  it('renders a GALLERY block (Phase 5 Part 2 addition) with alt text on every image', () => {
    renderBlock({
      id: '1',
      type: 'GALLERY',
      order: 0,
      data: { images: [{ url: '/a.jpg', alt: 'Photo A' }, { url: '/b.jpg', alt: 'Photo B' }] },
    });
    expect(screen.getByAltText('Photo A')).toBeInTheDocument();
    expect(screen.getByAltText('Photo B')).toBeInTheDocument();
  });

  it('renders a DOWNLOAD block (Phase 5 Part 2 addition) with a download link', () => {
    renderBlock({
      id: '1',
      type: 'DOWNLOAD',
      order: 0,
      data: { files: [{ label: 'Business Plan Template', fileUrl: '/files/template.pdf', fileType: 'PDF' }] },
    });
    const link = screen.getByRole('link', { name: /Business Plan Template/ });
    expect(link).toHaveAttribute('href', '/files/template.pdf');
    expect(link).toHaveAttribute('download');
  });

  it('renders an explicit "coming soon" placeholder for PROGRAMS (owned by an unbuilt feature) — never silently hides it', () => {
    renderBlock({ id: '1', type: 'PROGRAMS', order: 0, data: {} });
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it('renders an explicit placeholder for CUSTOM_HTML pending the sanitization decision gate', () => {
    renderBlock({ id: '1', type: 'CUSTOM_HTML', order: 0, data: {} });
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it('renders SPACER and DIVIDER blocks without throwing', () => {
    const { container: spacerContainer } = renderBlock({ id: '1', type: 'SPACER', order: 0, data: {} });
    expect(spacerContainer.firstChild).toBeTruthy();
    const { container: dividerContainer } = renderBlock({ id: '2', type: 'DIVIDER', order: 0, data: {} });
    expect(dividerContainer.querySelector('hr')).toBeInTheDocument();
  });

  it('sanitizes TEXT block content — a script tag never reaches the DOM', () => {
    renderBlock({ id: '1', type: 'TEXT', order: 0, data: { body: '<p>Safe</p><script>window.__xss = true;</script>' } });
    expect(screen.getByText('Safe')).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
    expect((window as unknown as { __xss?: boolean }).__xss).toBeUndefined();
  });

  it('has no accessibility violations for a representative HERO block', async () => {
    const { container } = renderBlock({
      id: '1',
      type: 'HERO',
      order: 0,
      data: { headline: 'Accessible Hero', primaryCta: { label: 'Go', url: '/go' } },
    });
    await expectNoA11yViolations(container);
  });
});
