import type { AdminProject, AdminProjectArtifact, AdminProjectWithArtifacts, PublicProject } from './project.types';

type ProjectRow = {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
};

type ArtifactRow = { id: string; title: string; status: string; projectPosition: number | null };

export function toAdminProject(row: ProjectRow): AdminProject {
  return {
    id: row.id,
    moduleId: row.moduleId,
    title: row.title,
    description: row.description,
    status: row.status,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function toAdminProjectArtifact(row: ArtifactRow): AdminProjectArtifact {
  return { assignmentId: row.id, title: row.title, status: row.status, projectPosition: row.projectPosition };
}

export function toAdminProjectWithArtifacts(row: ProjectRow, artifacts: ArtifactRow[]): AdminProjectWithArtifacts {
  return { ...toAdminProject(row), artifacts: artifacts.map(toAdminProjectArtifact) };
}

export function toPublicProject(row: ProjectRow): PublicProject {
  return { id: row.id, moduleId: row.moduleId, title: row.title, description: row.description };
}
