import type { ApiSuccessResponse } from '@coachx/shared';
import { apiClient } from './client';

/** 004 Project-based Learning batch (FR-077) — learner-facing project status API. */

export interface ProjectArtifactStatus {
  assignmentId: string;
  title: string;
  submissionStatus: string | null;
  approved: boolean;
}

export interface ProjectStatusForLearner {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  artifacts: ProjectArtifactStatus[];
  allArtifactsApproved: boolean;
}

export async function getMyProjectStatus(projectId: string): Promise<ProjectStatusForLearner> {
  const { data } = await apiClient.get<ApiSuccessResponse<ProjectStatusForLearner>>(`/lms/me/projects/${projectId}`);
  return data.data;
}
