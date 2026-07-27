import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewsletterForm } from '../NewsletterForm';
import * as cmsApi from '@/api/cms.api';
import { expectNoA11yViolations } from '@/test/a11y';

vi.mock('@/api/cms.api');

describe('NewsletterForm (Phase 5 Part 2 §"NEWSLETTER")', () => {
  beforeEach(() => {
    vi.mocked(cmsApi.subscribeToNewsletter).mockReset();
  });

  it('requires consent before submission', async () => {
    const user = userEvent.setup();
    render(<NewsletterForm />);

    await user.type(screen.getByLabelText(/Get updates/), 'jane@example.com');
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    expect(await screen.findByText('Please accept to receive newsletter emails.')).toBeInTheDocument();
    expect(cmsApi.subscribeToNewsletter).not.toHaveBeenCalled();
  });

  it('submits the email and honeypot value on valid submission', async () => {
    vi.mocked(cmsApi.subscribeToNewsletter).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<NewsletterForm />);

    await user.type(screen.getByLabelText(/Get updates/), 'jane@example.com');
    await user.click(screen.getByLabelText(/I agree to receive newsletter/));
    await user.click(screen.getByRole('button', { name: 'Subscribe' }));

    await waitFor(() => expect(cmsApi.subscribeToNewsletter).toHaveBeenCalledWith('jane@example.com', ''));
    expect(await screen.findByText(/subscribed/i)).toBeInTheDocument();
  });

  it('prevents duplicate submission while in flight', async () => {
    let resolveSubmit: () => void = () => {};
    vi.mocked(cmsApi.subscribeToNewsletter).mockImplementation(
      () => new Promise((resolve) => { resolveSubmit = () => resolve(undefined); }),
    );
    const user = userEvent.setup();
    render(<NewsletterForm />);

    await user.type(screen.getByLabelText(/Get updates/), 'jane@example.com');
    await user.click(screen.getByLabelText(/I agree to receive newsletter/));

    const button = screen.getByRole('button', { name: 'Subscribe' });
    await user.click(button);
    await user.click(button);

    expect(cmsApi.subscribeToNewsletter).toHaveBeenCalledTimes(1);

    resolveSubmit();
    await screen.findByText(/subscribed/i); // let the resulting state update settle before the test ends
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<NewsletterForm />);
    await expectNoA11yViolations(container);
  });
});
