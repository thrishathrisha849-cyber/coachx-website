import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useDocumentHead, useStructuredData } from '../useDocumentHead';

function HeadConsumer(props: Parameters<typeof useDocumentHead>[0]) {
  useDocumentHead(props);
  return null;
}

function StructuredDataConsumer({ schema }: { schema: Record<string, unknown> | null }) {
  useStructuredData(schema, 'test-schema');
  return null;
}

describe('useDocumentHead (002 FR-090: dynamic title/description/canonical/OG/Twitter)', () => {
  it('sets the document title', () => {
    render(<HeadConsumer title="Pricing | CoachX" />);
    expect(document.title).toBe('Pricing | CoachX');
  });

  it('sets meta description, Open Graph, and Twitter tags', () => {
    render(<HeadConsumer title="Pricing" description="Simple plans" />);

    expect(document.querySelector('meta[name="description"]')).toHaveAttribute('content', 'Simple plans');
    expect(document.querySelector('meta[property="og:title"]')).toHaveAttribute('content', 'Pricing');
    expect(document.querySelector('meta[property="og:description"]')).toHaveAttribute('content', 'Simple plans');
    expect(document.querySelector('meta[name="twitter:title"]')).toHaveAttribute('content', 'Pricing');
  });

  it('sets the canonical link', () => {
    render(<HeadConsumer title="Pricing" canonicalUrl="https://coachx.example/pricing" />);
    expect(document.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://coachx.example/pricing');
  });

  it('sets robots noindex when noIndex is true', () => {
    render(<HeadConsumer title="Search" noIndex />);
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  });

  it('does not set a robots meta tag when noIndex is false/omitted', () => {
    render(<HeadConsumer title="Public Page" />);
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('uses summary_large_image Twitter card when an OG image is present', () => {
    render(<HeadConsumer title="Post" ogImageUrl="https://coachx.example/img.png" />);
    expect(document.querySelector('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  });
});

describe('useStructuredData (002 FR-091: JSON-LD)', () => {
  it('injects a JSON-LD script tag with the given schema', () => {
    render(<StructuredDataConsumer schema={{ '@type': 'Organization', name: 'CoachX' }} />);
    const script = document.getElementById('structured-data-test-schema');
    expect(script).toBeTruthy();
    expect(script?.getAttribute('type')).toBe('application/ld+json');
    expect(JSON.parse(script!.textContent ?? '{}')).toEqual({ '@type': 'Organization', name: 'CoachX' });
  });

  it('removes the script tag when unmounted', () => {
    const { unmount } = render(<StructuredDataConsumer schema={{ '@type': 'Organization' }} />);
    expect(document.getElementById('structured-data-test-schema')).toBeTruthy();
    unmount();
    expect(document.getElementById('structured-data-test-schema')).toBeNull();
  });

  it('renders nothing when schema is null', () => {
    render(<StructuredDataConsumer schema={null} />);
    expect(document.getElementById('structured-data-test-schema')).toBeNull();
  });
});
