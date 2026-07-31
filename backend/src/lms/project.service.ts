import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { findModuleById } from './module.repository';
import { evaluateModuleAccess } from './access-evaluator.service';
import { findEnrollmentForUserAndCourse } from './enrollment.repository';
import {
  findProjectById,
  findProjectsForModule,
  createProject as createProjectRow,
  updateProject as updateProjectRow,
} from './project.repository';
import {
  findAssignmentById,
  findAssignmentsByModule,
  findArtifactsForProject,
  findPublishedArtifactsForProject,
  countArtifactsForProject,
  updateAssignment,
  findSubmissionsForEnrollmentAssignment,
} from './assignment.repository';
import { toAdminProject, toAdminProjectWithArtifacts, toPublicProject } from './project.serializers';
import type { AdminProject, AdminProjectWithArtifacts, ProjectArtifactStatus, ProjectStatusForLearner } from './project.types';
import type { TransactionClient } from '../database/transaction';

// --- Admin: Project CRUD (reuses `course.module.manage` at the route
// layer — same tier as module/lesson/activity/assignment authoring; no
// per-instructor ownership check, matching every other /admin/* content
// surface in this codebase) ---------------------------------------------

export interface CreateProjectInput {
  title: string;
  description?: string;
}

export async function createProjectForModule(moduleId: string, input: CreateProjectInput, actorId: string): Promise<AdminProject> {
  const module_ = await findModuleById(moduleId);
  if (!module_) throw AppError.notFound('Module not found');

  const project = await createProjectRow({
    module: { connect: { id: moduleId } },
    title: input.title,
    description: input.description ?? null,
    createdBy: actorId,
    updatedBy: actorId,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.project.created',
    resourceType: 'project',
    resourceId: project.id,
    afterState: { moduleId, title: input.title },
  });

  return toAdminProject(project);
}

export async function listProjectsForModuleAdmin(moduleId: string): Promise<AdminProject[]> {
  const module_ = await findModuleById(moduleId);
  if (!module_) throw AppError.notFound('Module not found');
  const projects = await findProjectsForModule(moduleId);
  return projects.map(toAdminProject);
}

/** 004 Project-based Learning batch (FR-077) — the admin's "link an existing assignment" candidate list: every assignment in this module not already linked to a (different) project. */
export async function listCandidateAssignmentsForModuleAdmin(moduleId: string, excludeProjectId?: string) {
  const module_ = await findModuleById(moduleId);
  if (!module_) throw AppError.notFound('Module not found');
  const assignments = await findAssignmentsByModule(moduleId);
  return assignments
    .filter((a) => a.projectId === null || a.projectId === excludeProjectId)
    .map((a) => ({ id: a.id, title: a.title, status: a.status, lessonId: a.lessonId, alreadyLinked: a.projectId === excludeProjectId }));
}

export async function getProjectAdmin(id: string): Promise<AdminProjectWithArtifacts> {
  const project = await findProjectById(id);
  if (!project) throw AppError.notFound('Project not found');
  const artifacts = await findArtifactsForProject(id);
  return toAdminProjectWithArtifacts(project, artifacts);
}

export async function updateExistingProject(id: string, input: Partial<CreateProjectInput>, actorId: string): Promise<AdminProject> {
  const existing = await findProjectById(id);
  if (!existing) throw AppError.notFound('Project not found');

  const updated = await updateProjectRow(id, {
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    version: { increment: 1 },
    updatedBy: actorId,
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.project.updated',
    resourceType: 'project',
    resourceId: id,
    afterState: input,
  });

  return toAdminProject(updated);
}

const VALID_PROJECT_STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PUBLISHED', 'ARCHIVED'],
  PUBLISHED: ['ARCHIVED', 'DRAFT'],
  ARCHIVED: ['DRAFT'],
};

export async function changeProjectStatus(id: string, status: string, actorId: string): Promise<AdminProject> {
  const existing = await findProjectById(id);
  if (!existing) throw AppError.notFound('Project not found');

  if (!VALID_PROJECT_STATUS_TRANSITIONS[existing.status]?.includes(status)) {
    throw AppError.badRequest(`Cannot transition project from ${existing.status} to ${status}`);
  }

  // A project going PUBLISHED with zero linked artifacts would silently
  // gate module completion on nothing meaningful (see
  // `isModuleProjectsComplete` below, which already treats a zero-artifact
  // published project as vacuously complete) — reject the confusing state
  // outright instead, the same "empty publish is a real authoring mistake"
  // discipline `quiz.service.ts`'s zero-question publish rejection uses.
  if (status === 'PUBLISHED') {
    const artifactCount = await countArtifactsForProject(id);
    if (artifactCount === 0) {
      throw AppError.badRequest('Add at least one required-artifact assignment before publishing this project');
    }
  }

  const updated = await updateProjectRow(id, { status: status as never, updatedBy: actorId });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.project.status_changed',
    resourceType: 'project',
    resourceId: id,
    beforeState: { status: existing.status },
    afterState: { status },
  });

  return toAdminProject(updated);
}

/** POST /admin/projects/:projectId/artifacts — links an EXISTING assignment as this project's next required artifact. Reuses the assignment's own already-built submission/review lifecycle verbatim — nothing about the assignment itself changes. */
export async function linkArtifactToProject(projectId: string, assignmentId: string, actorId: string): Promise<AdminProjectWithArtifacts> {
  const project = await findProjectById(projectId);
  if (!project) throw AppError.notFound('Project not found');

  const assignment = await findAssignmentById(assignmentId);
  if (!assignment) throw AppError.notFound('Assignment not found');
  if (assignment.projectId !== null) {
    throw AppError.conflict(assignment.projectId === projectId ? 'This assignment is already linked to this project' : 'This assignment already belongs to a different project');
  }

  const nextPosition = await countArtifactsForProject(projectId);
  await updateAssignment(assignmentId, { project: { connect: { id: projectId } }, projectPosition: nextPosition, updatedBy: actorId });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.project.artifact_linked',
    resourceType: 'project',
    resourceId: projectId,
    afterState: { assignmentId },
  });

  return getProjectAdmin(projectId);
}

/** POST /admin/projects/:projectId/artifacts/:assignmentId/unlink — the assignment itself (and its full submission history) is UNCHANGED, just no longer counted toward this project. */
export async function unlinkArtifactFromProject(projectId: string, assignmentId: string, actorId: string): Promise<AdminProjectWithArtifacts> {
  const project = await findProjectById(projectId);
  if (!project) throw AppError.notFound('Project not found');

  const assignment = await findAssignmentById(assignmentId);
  if (!assignment || assignment.projectId !== projectId) {
    throw AppError.notFound('This assignment is not linked to this project');
  }

  await updateAssignment(assignmentId, { project: { disconnect: true }, projectPosition: null, updatedBy: actorId });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'lms.project.artifact_unlinked',
    resourceType: 'project',
    resourceId: projectId,
    afterState: { assignmentId },
  });

  return getProjectAdmin(projectId);
}

// --- Learner-facing --------------------------------------------------------

/** GET /me/projects/:projectId — the learner's own aggregate status across every required artifact. Same `evaluateModuleAccess` gate every other module-scoped content path uses. */
export async function getProjectStatusForLearner(userId: string, projectId: string): Promise<ProjectStatusForLearner> {
  const project = await findProjectById(projectId);
  if (!project || project.status !== 'PUBLISHED') throw AppError.notFound('Project not found');

  const module_ = await findModuleById(project.moduleId);
  if (!module_) throw AppError.notFound('Project not found');

  const access = await evaluateModuleAccess(userId, module_.courseId, module_.id);
  if (!access.allowed) throw AppError.forbidden(access.message);

  const enrollment = await findEnrollmentForUserAndCourse(userId, module_.courseId);

  const artifacts = await findPublishedArtifactsForProject(projectId);
  const artifactStatuses: ProjectArtifactStatus[] = [];
  for (const artifact of artifacts) {
    const submissions = enrollment ? await findSubmissionsForEnrollmentAssignment(enrollment.id, artifact.id) : [];
    const latest = submissions[0] ?? null;
    artifactStatuses.push({
      assignmentId: artifact.id,
      title: artifact.title,
      submissionStatus: latest?.status ?? null,
      approved: latest?.status === 'APPROVED',
    });
  }

  return {
    ...toPublicProject(project),
    artifacts: artifactStatuses,
    allArtifactsApproved: artifactStatuses.length > 0 && artifactStatuses.every((a) => a.approved),
  };
}

// --- Module-completion connection (FR-077 "project status MUST connect
// to module completion") — called from `progress.service.ts`'s
// `computeModuleProgress`. A module with no PUBLISHED project is
// vacuously complete on this dimension (nothing to require); a PUBLISHED
// project with zero PUBLISHED artifacts is likewise vacuous (an admin-
// authoring gap the PUBLISH guard above already prevents going forward,
// but pre-existing/edited-down projects are handled gracefully rather
// than permanently blocking the module). --------------------------------

export async function isModuleProjectsComplete(enrollmentId: string, moduleId: string, tx?: TransactionClient): Promise<boolean> {
  const projects = await findProjectsForModule(moduleId, tx);
  const published = projects.filter((p) => p.status === 'PUBLISHED');
  if (published.length === 0) return true;

  for (const project of published) {
    const artifacts = await findPublishedArtifactsForProject(project.id, tx);
    if (artifacts.length === 0) continue;

    for (const artifact of artifacts) {
      const submissions = await findSubmissionsForEnrollmentAssignment(enrollmentId, artifact.id, tx);
      if (submissions[0]?.status !== 'APPROVED') return false;
    }
  }

  return true;
}

/** 004 Broader Assessment Types → Project-based Learning batches: the certificate eligibility evaluator's real "final project approved" signal. `null` when the course has no PUBLISHED project at all — genuinely not a relevant condition for that course, distinct from "checked and failing." */
export async function isFinalProjectApprovedForEnrollment(userId: string, courseId: string): Promise<boolean | null> {
  const prisma = (await import('../database/prisma-client')).getPrismaClient();
  if (!prisma) throw AppError.internal('Database is not connected');

  const publishedProjects = await prisma.project.findMany({
    where: { status: 'PUBLISHED', deletedAt: null, module: { courseId, status: 'PUBLISHED' } },
  });
  if (publishedProjects.length === 0) return null;

  const enrollment = await findEnrollmentForUserAndCourse(userId, courseId);
  if (!enrollment) return false;

  for (const project of publishedProjects) {
    const artifacts = await findPublishedArtifactsForProject(project.id);
    if (artifacts.length === 0) continue;
    for (const artifact of artifacts) {
      const submissions = await findSubmissionsForEnrollmentAssignment(enrollment.id, artifact.id);
      if (submissions[0]?.status !== 'APPROVED') return false;
    }
  }

  return true;
}
