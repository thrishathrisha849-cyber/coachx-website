import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CookieConsentBanner } from '../CookieConsentBanner';
import { hasConsentFor, COOKIE_POLICY_VERSION } from '@/hooks/useCookieConsent';
import { expectNoA11yViolations } from '@/test/a11y';

function renderBanner() {
  return render(
    <MemoryRouter>
      <CookieConsentBanner />
    </MemoryRouter>,
  );
}

describe('CookieConsentBanner (002 FR-010, Constitution Article VI)', () => {
  it('shows the banner when no consent decision has been recorded yet', () => {
    renderBanner();
    expect(screen.getByRole('dialog', { name: 'Cookie preferences' })).toBeInTheDocument();
  });

  it('"Accept All" grants all 3 non-essential categories and persists the decision', async () => {
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByRole('button', { name: 'Accept All' }));

    expect(hasConsentFor('analytics')).toBe(true);
    expect(hasConsentFor('marketing')).toBe(true);
    expect(hasConsentFor('personalization')).toBe(true);

    const stored = JSON.parse(window.localStorage.getItem('coachx-cookie-consent') ?? '{}');
    expect(stored.policyVersion).toBe(COOKIE_POLICY_VERSION);
    expect(stored.timestamp).toBeTruthy();
  });

  it('"Reject Non-Essential" denies all 3 non-essential categories (never a single combined opt-in)', async () => {
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByRole('button', { name: 'Reject Non-Essential' }));

    expect(hasConsentFor('analytics')).toBe(false);
    expect(hasConsentFor('marketing')).toBe(false);
    expect(hasConsentFor('personalization')).toBe(false);
  });

  it('"Customize" reveals independent per-category checkboxes', async () => {
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByRole('button', { name: 'Customize' }));

    expect(screen.getByLabelText('analytics')).toBeInTheDocument();
    expect(screen.getByLabelText('marketing')).toBeInTheDocument();
    expect(screen.getByLabelText('personalization')).toBeInTheDocument();
    expect(screen.getByLabelText('Essential (always on)')).toBeDisabled();
  });

  it('a customized selection persists only the chosen categories', async () => {
    const user = userEvent.setup();
    renderBanner();

    await user.click(screen.getByRole('button', { name: 'Customize' }));
    await user.click(screen.getByLabelText('analytics')); // only analytics
    await user.click(screen.getByRole('button', { name: 'Save Preferences' }));

    expect(hasConsentFor('analytics')).toBe(true);
    expect(hasConsentFor('marketing')).toBe(false);
    expect(hasConsentFor('personalization')).toBe(false);
  });

  it('does not re-show the banner after a decision has been made', async () => {
    const user = userEvent.setup();
    const { unmount } = renderBanner();
    await user.click(screen.getByRole('button', { name: 'Accept All' }));
    unmount();

    renderBanner();
    expect(screen.queryByRole('dialog', { name: 'Cookie preferences' })).not.toBeInTheDocument();
  });

  it('links to the Privacy Policy', () => {
    renderBanner();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
  });

  it('has no accessibility violations', async () => {
    const { container } = renderBanner();
    await expectNoA11yViolations(container);
  });
});
