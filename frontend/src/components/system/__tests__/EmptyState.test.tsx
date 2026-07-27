import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from '../EmptyState';
import { expectNoA11yViolations } from '@/test/a11y';

describe('EmptyState', () => {
  it('renders the title and description', () => {
    render(<EmptyState title="No results" description="Try again later" />);
    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText('Try again later')).toBeInTheDocument();
  });

  it('renders an action when provided', () => {
    render(<EmptyState title="No results" action={<button>Retry</button>} />);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<EmptyState title="No results" description="Try again" />);
    await expectNoA11yViolations(container);
  });
});
