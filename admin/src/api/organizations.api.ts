import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  createdAt: string;
}

export interface PagedResult<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listOrganizations(): Promise<PagedResult<Organization>> {
  const { data } = await apiClient.get<ApiSuccessResponse<PagedResult<Organization>>>('/admin/organizations');
  return data.data;
}

export async function createOrganization(input: { name: string; slug: string }): Promise<Organization> {
  const { data } = await apiClient.post<ApiSuccessResponse<Organization>>('/admin/organizations', input);
  return data.data;
}
