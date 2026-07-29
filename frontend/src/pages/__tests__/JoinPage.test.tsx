import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { JoinPage } from '../JoinPage';
import * as authApi from '@/api/auth.api';

vi.mock('@/api/auth.api');

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Full name/), 'Thrisha');
  await user.type(screen.getByLabelText(/^Email/), 'thrishathrisha849@gmail.com');
  await user.type(screen.getByLabelText(/^Password/), 'Devapapa1');
  await user.type(screen.getByLabelText(/Confirm password/), 'Devapapa1');
  await user.click(screen.getByLabelText(/I agree to the Terms/));
}

/** 001 FR-093: submitting the form opens the CommunityRulesGate before the account is finalized — this clicks through it. */
async function submitAndAcceptCommunityRules(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Create Account' }));
  await user.click(await screen.findByLabelText(/agree to follow the Community Guidelines/i));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

describe('JoinPage — registration (003 User Story 1)', () => {
  beforeEach(() => {
    vi.mocked(authApi.registerAccount).mockReset();
  });

  it('shows an inline error for a password missing a number, without calling the API', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><JoinPage /></MemoryRouter>);

    await user.type(screen.getByLabelText(/Full name/), 'Thrisha');
    await user.type(screen.getByLabelText(/^Email/), 'thrishathrisha849@gmail.com');
    await user.type(screen.getByLabelText(/^Password/), 'devapapa');
    await user.type(screen.getByLabelText(/Confirm password/), 'devapapa');
    await user.click(screen.getByLabelText(/I agree to the Terms/));
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText(/include a letter and a number/i)).toBeInTheDocument();
    expect(authApi.registerAccount).not.toHaveBeenCalled();
  });

  it('submits valid data and shows the success message', async () => {
    vi.mocked(authApi.registerAccount).mockResolvedValue({
      userId: 'user-1',
      email: 'thrishathrisha849@gmail.com',
      status: 'PENDING_VERIFICATION',
      verificationRequired: true,
    });
    const user = userEvent.setup();
    render(<MemoryRouter><JoinPage /></MemoryRouter>);

    await fillValidForm(user);
    await submitAndAcceptCommunityRules(user);

    await waitFor(() =>
      expect(authApi.registerAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Thrisha',
          email: 'thrishathrisha849@gmail.com',
          password: 'Devapapa1',
          confirmPassword: 'Devapapa1',
          acceptedTerms: true,
        }),
      ),
    );
    expect(await screen.findByText(/check your email to verify/i)).toBeInTheDocument();
  });

  it('shows the backend conflict message for a duplicate email, not a false success', async () => {
    vi.mocked(authApi.registerAccount).mockRejectedValue({
      status: 409,
      code: 'CONFLICT',
      message: 'If this email is available, an account can be created with it. If an account already exists, please log in or reset your password instead.',
    });
    const user = userEvent.setup();
    render(<MemoryRouter><JoinPage /></MemoryRouter>);

    await fillValidForm(user);
    await submitAndAcceptCommunityRules(user);

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
    expect(screen.queryByText(/check your email to verify/i)).not.toBeInTheDocument();
  });

  it('surfaces specific password-policy violations returned by the backend', async () => {
    vi.mocked(authApi.registerAccount).mockRejectedValue({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Password does not meet the required policy',
      details: { errors: ['Password must contain at least one number'] },
    });
    const user = userEvent.setup();
    render(<MemoryRouter><JoinPage /></MemoryRouter>);

    await fillValidForm(user);
    await submitAndAcceptCommunityRules(user);

    expect(await screen.findByText('Password must contain at least one number')).toBeInTheDocument();
  });

  it('displays community rules before the account is finalized (001 FR-093), and does not call the API until accepted', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><JoinPage /></MemoryRouter>);

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Create Account' }));

    expect(await screen.findByText('Community Guidelines')).toBeInTheDocument();
    expect(authApi.registerAccount).not.toHaveBeenCalled();

    // "Continue" is disabled until the checkbox is explicitly checked.
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();

    await user.click(screen.getByLabelText(/agree to follow the Community Guidelines/i));
    expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
  });
});
