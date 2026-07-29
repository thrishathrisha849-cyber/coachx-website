import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';
import { AuthProvider } from '@/context/auth.context';
import { tokenStore } from '@/api/token-store';
import * as authApi from '@/api/auth.api';

vi.mock('@/api/auth.api');

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Email/), 'thrishathrisha849@gmail.com');
  await user.type(screen.getByLabelText(/^Password/), 'devapapa');
}

describe('LoginPage — login (003 User Story 3)', () => {
  beforeEach(() => {
    vi.mocked(authApi.loginAccount).mockReset();
    vi.mocked(authApi.getMe).mockReset();
    window.localStorage.clear();
    window.sessionStorage.clear();
    tokenStore.set(null);
  });

  it('logs in with correct credentials, stores tokens, and shows the redirect message', async () => {
    vi.mocked(authApi.loginAccount).mockResolvedValue({
      accessToken: 'access-token-value',
      refreshToken: 'refresh-token-value',
      expiresAt: '2026-01-01T00:00:00.000Z',
      mfaSetupRequired: false,
    });
    vi.mocked(authApi.getMe).mockResolvedValue({ id: 'u1', email: 'thrishathrisha849@gmail.com', roles: [], displayName: null });
    const user = userEvent.setup();
    renderLoginPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() =>
      expect(authApi.loginAccount).toHaveBeenCalledWith({
        email: 'thrishathrisha849@gmail.com',
        password: 'devapapa',
      }),
    );
    expect(await screen.findByText(/Logged in successfully/i)).toBeInTheDocument();
    expect(window.sessionStorage.getItem('coachx_access_token')).toBe('access-token-value');
    expect(window.sessionStorage.getItem('coachx_refresh_token')).toBe('refresh-token-value');
  });

  it('stores tokens in localStorage instead when "Remember me" is checked', async () => {
    vi.mocked(authApi.loginAccount).mockResolvedValue({
      accessToken: 'access-token-value',
      refreshToken: 'refresh-token-value',
      expiresAt: '2026-01-01T00:00:00.000Z',
      mfaSetupRequired: false,
    });
    vi.mocked(authApi.getMe).mockResolvedValue({ id: 'u1', email: 'thrishathrisha849@gmail.com', roles: [], displayName: null });
    const user = userEvent.setup();
    renderLoginPage();

    await fillValidForm(user);
    await user.click(screen.getByLabelText('Remember me'));
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    await waitFor(() => expect(window.localStorage.getItem('coachx_access_token')).toBe('access-token-value'));
  });

  it('shows the generic "Invalid email or password" error for wrong credentials, never a false success', async () => {
    vi.mocked(authApi.loginAccount).mockRejectedValue({
      status: 401,
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
    const user = userEvent.setup();
    renderLoginPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(screen.queryByText(/Logged in successfully/i)).not.toBeInTheDocument();
    expect(window.sessionStorage.getItem('coachx_access_token')).toBeNull();
  });

  it('shows the same generic error for an unknown email as for a wrong password (no account enumeration)', async () => {
    vi.mocked(authApi.loginAccount).mockRejectedValue({
      status: 401,
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid email or password',
    });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/^Email/), 'no-such-user@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'whatever123');
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('shows a clear message when the account still needs email verification', async () => {
    vi.mocked(authApi.loginAccount).mockRejectedValue({
      status: 403,
      code: 'AUTH_EMAIL_UNVERIFIED',
      message: 'Please verify your email before logging in',
    });
    const user = userEvent.setup();
    renderLoginPage();

    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByText('Please verify your email before logging in')).toBeInTheDocument();
  });
});
