import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SponsoredLabel } from '../SponsoredLabel';
import { AffiliateDisclosure } from '../AffiliateDisclosure';

describe('SponsoredLabel (001 FR-062)', () => {
  it('renders a default "Sponsored" label when no custom label is given', () => {
    render(<SponsoredLabel />);
    expect(screen.getByText('Sponsored')).toBeInTheDocument();
  });

  it('renders the custom sponsor label when provided', () => {
    render(<SponsoredLabel label="Sponsored by Acme" />);
    expect(screen.getByText('Sponsored by Acme')).toBeInTheDocument();
  });
});

describe('AffiliateDisclosure (001 FR-063)', () => {
  it('renders a default disclosure notice when none is given', () => {
    render(<AffiliateDisclosure />);
    expect(screen.getByText(/affiliate recommendation/i)).toBeInTheDocument();
  });

  it('renders the custom disclosure text when provided', () => {
    render(<AffiliateDisclosure disclosure="We earn 10% on this link." />);
    expect(screen.getByText('We earn 10% on this link.')).toBeInTheDocument();
  });
});
