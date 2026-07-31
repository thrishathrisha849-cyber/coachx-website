import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

/** 004 Project-based Learning batch (FR-077) — admin project + artifact-linking API. */

export interface AdminProject {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminProjectArtifact {
  assignmentId: string;
  title: string;
  status: string;
  projectPosition: number | null;
}

export interface AdminProjectWithArtifacts extends AdminProject {
  artifacts: AdminProjectArtifact[];
}

export interface CandidateAssignment {
  id: string;
  title: string;
  status: string;
  lessonId: string;
  alreadyLinked: boolean;
}

export async function createProject(moduleId: string, input: { title: string; description?: string }): Promise<AdminProject> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminProject>>(`/lms/admin/modules/${moduleId}/projects`, input);
  return data.data;
}

export async function listProjectsForModule(moduleId: string): Promise<AdminProject[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminProject[]>>(`/lms/admin/modules/${moduleId}/projects`);
  return data.data;
}

export async function listCandidateAssignmentsForModule(moduleId: string, excludeProjectId?: string): Promise<CandidateAssignment[]> {
  const { data } = await apiClient.get<ApiSuccessResponse<CandidateAssignment[]>>(`/lms/admin/modules/${moduleId}/assignments`, {
    params: excludeProjectId ? { excludeProjectId } : undefined,
  });
  return data.data;
}

export async function getProject(projectId: string): Promise<AdminProjectWithArtifacts> {
  const { data } = await apiClient.get<ApiSuccessResponse<AdminProjectWithArtifacts>>(`/lms/admin/projects/${projectId}`);
  return data.data;
}

export async function updateProject(projectId: string, input: { title?: string; description?: string | null }): Promise<AdminProject> {
  const { data } = await apiClient.patch<ApiSuccessResponse<AdminProject>>(`/lms/admin/projects/${projectId}`, input);
  return data.data;
}

export async function changeProjectStatus(projectId: string, status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'): Promise<AdminProject> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminProject>>(`/lms/admin/projects/${projectId}/status`, { status });
  return data.data;
}

export async function linkArtifact(projectId: string, assignmentId: string): Promise<AdminProjectWithArtifacts> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminProjectWithArtifacts>>(`/lms/admin/projects/${projectId}/artifacts`, { assignmentId });
  return data.data;
}

export async function unlinkArtifact(projectId: string, assignmentId: string): Promise<AdminProjectWithArtifacts> {
  const { data } = await apiClient.post<ApiSuccessResponse<AdminProjectWithArtifacts>>(`/lms/admin/projects/${projectId}/artifacts/${assignmentId}/unlink`);
  return data.data;
}
