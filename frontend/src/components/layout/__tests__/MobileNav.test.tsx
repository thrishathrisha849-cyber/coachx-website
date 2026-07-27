import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MobileNav } from '../MobileNav';
import { expectNoA11yViolations } from '@/test/a11y';

const items = [
  { id: '1', label: 'About', url: '/about', isExternal: false, megaMenuColumn: null, requiredPermission: null, children: [] },
  { id: '2', label: 'Pricing', url: '/pricing', isExternal: false, megaMenuColumn: null, requiredPermission: null, children: [] },
];

describe('MobileNav — dialog accessibility (002 FR-003, FR-108)', () => {
  it('renders nothing when closed', () => {
    render(
      <MemoryRouter>
        <MobileNav items={items} open={false} onClose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders as a labeled dialog when open', () => {
    render(
      <MemoryRouter>
        <MobileNav items={items} open onClose={vi.fn()} />
      </MemoryRouter>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Menu');
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <MobileNav items={items} open onClose={onClose} />
      </MemoryRouter>,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <MobileNav items={items} open onClose={onClose} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('disables background scroll while open', () => {
    const { rerender } = render(
      <MemoryRouter>
        <MobileNav items={items} open={false} onClose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(document.body.style.overflow).not.toBe('hidden');

    rerender(
      <MemoryRouter>
        <MobileNav items={items} open onClose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('moves initial focus into the dialog when opened (focus trap)', () => {
    render(
      <MemoryRouter>
        <MobileNav items={items} open onClose={vi.fn()} />
      </MemoryRouter>,
    );
    // The close button is the first focusable element in the dialog.
    expect(document.activeElement).toHaveAccessibleName('Close menu');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <MobileNav items={items} open onClose={vi.fn()} />
      </MemoryRouter>,
    );
    await expectNoA11yViolations(container);
  });
});
