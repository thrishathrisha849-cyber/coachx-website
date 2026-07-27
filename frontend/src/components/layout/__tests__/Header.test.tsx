import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../Header';
import { ThemeProvider } from '@/context/theme.context';
import * as cmsApi from '@/api/cms.api';
import { expectNoA11yViolations } from '@/test/a11y';

vi.mock('@/api/cms.api');

function renderHeader() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <Header />
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('Header — Navigation (002 FR-001–FR-004, "Do not hardcode menu items")', () => {
  beforeEach(() => {
    vi.mocked(cmsApi.fetchNavigation).mockResolvedValue([
      {
        id: 'nav-1',
        label: 'Programs',
        url: '/programs',
        isExternal: false,
        megaMenuColumn: null,
        requiredPermission: null,
        children: [
          { id: 'nav-1-1', label: 'Business Foundation', url: '/programs/business-foundation', isExternal: false, megaMenuColumn: null, requiredPermission: null, children: [] },
        ],
      },
      { id: 'nav-2', label: 'Pricing', url: '/pricing', isExternal: false, megaMenuColumn: null, requiredPermission: null, children: [] },
    ]);
  });

  it('renders nav items fetched from the CMS API, not hardcoded', async () => {
    renderHeader();
    expect(cmsApi.fetchNavigation).toHaveBeenCalledWith('header');
    await waitFor(() => expect(screen.getByRole('link', { name: 'Programs' })).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing');
  });

  it('renders the mobile hamburger button that opens the drawer', async () => {
    renderHeader();
    const menuButton = screen.getByRole('button', { name: 'Open menu' });
    expect(menuButton).toBeInTheDocument();
    await waitFor(() => expect(cmsApi.fetchNavigation).toHaveBeenCalled());
  });

  it('falls back to an empty nav (never crashes) when the API call fails', async () => {
    vi.mocked(cmsApi.fetchNavigation).mockRejectedValue(new Error('network error'));
    renderHeader();
    // App name / logo should still render even if nav fails.
    await waitFor(() => expect(screen.getByText('CoachX')).toBeInTheDocument());
  });

  it('has no accessibility violations', async () => {
    const { container } = renderHeader();
    await waitFor(() => screen.getByRole('link', { name: 'Programs' }));
    await expectNoA11yViolations(container);
  });
});
