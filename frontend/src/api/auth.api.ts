import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: true;
}

export interface RegisterResult {
  userId: string;
  email: string;
  status: string;
  verificationRequired: boolean;
}

/** Calls the existing `POST /auth/register` endpoint (no backend changes). */
export async function registerAccount(input: RegisterInput): Promise<RegisterResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<RegisterResult>>('/auth/register', input);
  return data.data;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  mfaSetupRequired?: boolean;
  mfaRequired?: boolean;
  mfaChallengeToken?: string;
}

/** Calls the existing `POST /auth/login` endpoint (no backend changes). */
export async function loginAccount(input: LoginInput): Promise<LoginResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<LoginResult>>('/auth/login', input);
  return data.data;
}

/** Calls the existing `POST /auth/forgot-password` endpoint (no backend changes). */
export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

export interface Me {
  id: string;
  email: string;
  roles: string[];
  displayName: string | null;
}

/** 003: powers `auth.context.tsx`'s session restore (same `GET /me` the admin app already uses). */
export async function getMe(): Promise<Me> {
  const { data } = await apiClient.get<ApiSuccessResponse<Me>>('/me');
  return data.data;
}
