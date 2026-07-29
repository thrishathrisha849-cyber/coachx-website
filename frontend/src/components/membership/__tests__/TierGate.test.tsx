import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TierGate } from '../TierGate';

describe('TierGate (001 US2 — "clearly locked, not hidden")', () => {
  it('renders the feature normally when not locked', () => {
    render(
      <TierGate locked={false} requiredTierLabel="Pro">
        <button>Book mentor session</button>
      </TierGate>,
    );
    expect(screen.getByRole('button', { name: 'Book mentor session' })).toBeInTheDocument();
    expect(screen.queryByText(/Requires Pro/)).not.toBeInTheDocument();
  });

  it('still renders the feature in the DOM when locked, with a visible lock indicator — never hidden', () => {
    render(
      <TierGate locked requiredTierLabel="Pro">
        <button>Book mentor session</button>
      </TierGate>,
    );
    // The feature remains present in the DOM (not conditionally omitted,
    // just dimmed and marked aria-hidden since it's non-functional while
    // locked) — spec: "clearly locked (not hidden)".
    expect(screen.getByText('Book mentor session')).toBeInTheDocument();
    expect(screen.getByText(/Requires Pro/)).toBeInTheDocument();
  });
});
