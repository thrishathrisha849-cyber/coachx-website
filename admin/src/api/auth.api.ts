import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

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
}

/** Calls the same `POST /auth/login` endpoint the public frontend uses — no separate admin auth system, RBAC roles determine what an admin account can reach. */
export async function loginAccount(input: LoginInput): Promise<LoginResult> {
  const { data } = await apiClient.post<ApiSuccessResponse<LoginResult>>('/auth/login', input);
  return data.data;
}

export interface Me {
  id: string;
  email: string;
  roles: string[];
  displayName: string | null;
}

export async function getMe(): Promise<Me> {
  const { data } = await apiClient.get<ApiSuccessResponse<Me>>('/me');
  return data.data;
}
