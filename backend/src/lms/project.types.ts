/** 004 Project-based Learning batch (FR-077) — DTO shapes. Mirrors assignment.types.ts's public/admin split. */

export interface AdminProject {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
  status: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/** A project artifact as seen by an admin authoring/linking screen — just enough of the underlying Assignment to identify and manage the link. */
export interface AdminProjectArtifact {
  assignmentId: string;
  title: string;
  status: string;
  projectPosition: number | null;
}

export interface AdminProjectWithArtifacts extends AdminProject {
  artifacts: AdminProjectArtifact[];
}

export interface PublicProject {
  id: string;
  moduleId: string;
  title: string;
  description: string | null;
}

export interface ProjectArtifactStatus {
  assignmentId: string;
  title: string;
  /** null = the learner has not started this artifact's submission yet. */
  submissionStatus: string | null;
  approved: boolean;
}

/** GET /me/projects/:projectId — the learner's own aggregate view: every required artifact's latest submission status, and whether the project as a whole is complete. */
export interface ProjectStatusForLearner extends PublicProject {
  artifacts: ProjectArtifactStatus[];
  allArtifactsApproved: boolean;
}
