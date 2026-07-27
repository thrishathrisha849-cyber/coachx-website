import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactForm } from '../ContactForm';
import * as cmsApi from '@/api/cms.api';
import { expectNoA11yViolations } from '@/test/a11y';

vi.mock('@/api/cms.api');

describe('ContactForm (002 FR-053, FR-081, FR-082)', () => {
  beforeEach(() => {
    vi.mocked(cmsApi.submitContactForm).mockReset();
  });

  it('shows inline validation errors for invalid input rather than discarding it', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/Full name/), 'A'); // too short
    await user.tab();

    expect(await screen.findByText('Please enter your full name.')).toBeInTheDocument();
    // Entered input is preserved, not discarded.
    expect(screen.getByLabelText(/Full name/)).toHaveValue('A');
  });

  it('requires consent before submission', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/Full name/), 'Jane Doe');
    await user.type(screen.getByLabelText(/Email/), 'jane@example.com');
    await user.type(screen.getByLabelText(/Message/), 'This is a long enough message.');
    await user.click(screen.getByRole('button', { name: 'Send Message' }));

    expect(await screen.findByText('Please accept to be contacted about this enquiry.')).toBeInTheDocument();
    expect(cmsApi.submitContactForm).not.toHaveBeenCalled();
  });

  it('submits valid data including the honeypot field (empty for a real user)', async () => {
    vi.mocked(cmsApi.submitContactForm).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/Full name/), 'Jane Doe');
    await user.type(screen.getByLabelText(/Email/), 'jane@example.com');
    await user.type(screen.getByLabelText(/Message/), 'This is a long enough message.');
    await user.click(screen.getByLabelText(/I agree to be contacted/));
    await user.click(screen.getByRole('button', { name: 'Send Message' }));

    await waitFor(() =>
      expect(cmsApi.submitContactForm).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Jane Doe', email: 'jane@example.com', website: '' }),
      ),
    );
    expect(await screen.findByText(/we received your message/i)).toBeInTheDocument();
  });

  it('prevents duplicate submission while a request is in flight', async () => {
    let resolveSubmit: () => void = () => {};
    vi.mocked(cmsApi.submitContactForm).mockImplementation(
      () => new Promise((resolve) => { resolveSubmit = () => resolve(undefined); }),
    );
    const user = userEvent.setup();
    render(<ContactForm />);

    await user.type(screen.getByLabelText(/Full name/), 'Jane Doe');
    await user.type(screen.getByLabelText(/Email/), 'jane@example.com');
    await user.type(screen.getByLabelText(/Message/), 'This is a long enough message.');
    await user.click(screen.getByLabelText(/I agree to be contacted/));

    const submitButton = screen.getByRole('button', { name: 'Send Message' });
    await user.click(submitButton);
    await user.click(submitButton); // second click while submitting

    expect(cmsApi.submitContactForm).toHaveBeenCalledTimes(1);

    resolveSubmit();
    await screen.findByText(/we received your message/i); // let the resulting state update settle before the test ends
  });

  it('has a hidden honeypot field excluded from tab order and screen readers', () => {
    render(<ContactForm />);
    const honeypot = document.getElementById('website') as HTMLInputElement;
    expect(honeypot).toBeInTheDocument();
    expect(honeypot).toHaveAttribute('tabindex', '-1');
    expect(honeypot).toHaveAttribute('aria-hidden', 'true');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ContactForm />);
    await expectNoA11yViolations(container);
  });
});
