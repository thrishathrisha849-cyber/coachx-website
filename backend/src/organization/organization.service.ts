import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import {
  findOrganizationById,
  findOrganizationBySlug,
  listOrganizations,
  createOrganization,
  updateOrganization,
  findOrganizationMembers,
  assignUserToOrganization,
} from './organization.repository';

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  actorId: string;
}

/** 001 FR-053/FR-086: creates the Organization entity an Organization-tier account and its Organization Admin are scoped to. */
export async function createNewOrganization(input: CreateOrganizationInput) {
  const existing = await findOrganizationBySlug(input.slug);
  if (existing) throw AppError.conflict('An organization with this slug already exists');

  const org = await createOrganization({ name: input.name, slug: input.slug, createdBy: input.actorId });

  await recordAuditEvent({
    actorType: 'USER',
    actorId: input.actorId,
    action: 'organization.created',
    resourceType: 'organization',
    resourceId: org.id,
    afterState: { name: org.name, slug: org.slug },
  });

  return org;
}

export async function listOrganizationsAdmin(page: number, pageSize: number) {
  const [rows, total] = await listOrganizations({ skip: (page - 1) * pageSize, take: pageSize });
  return { rows, total, page, pageSize };
}

export interface UpdateOrganizationInput {
  name?: string;
  status?: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  actorId: string;
}

export async function updateExistingOrganization(organizationId: string, input: UpdateOrganizationInput) {
  const existing = await findOrganizationById(organizationId);
  if (!existing) throw AppError.notFound('Organization not found');

  const updated = await updateOrganization(organizationId, {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.status !== undefined ? { status: input.status } : {}),
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId: input.actorId,
    action: 'organization.updated',
    resourceType: 'organization',
    resourceId: organizationId,
    beforeState: { name: existing.name, status: existing.status },
    afterState: { name: updated.name, status: updated.status },
  });

  return updated;
}

/** 001 FR-086: Organization Admin sees only their OWN organization's members — never platform-wide. */
export async function getOwnOrganizationMembers(
  requesterOrganizationId: string | null,
  page: number,
  pageSize: number,
) {
  if (!requesterOrganizationId) {
    throw AppError.forbidden('permission denied');
  }

  const [rows, total] = await findOrganizationMembers(requesterOrganizationId, {
    skip: (page - 1) * pageSize,
    take: pageSize,
  });
  return { rows, total, page, pageSize };
}

export interface AssignMemberInput {
  organizationId: string;
  userId: string;
  actorId: string;
}

export async function assignMemberToOrganization(input: AssignMemberInput) {
  const org = await findOrganizationById(input.organizationId);
  if (!org) throw AppError.notFound('Organization not found');

  const updated = await assignUserToOrganization(input.userId, input.organizationId);

  await recordAuditEvent({
    actorType: 'USER',
    actorId: input.actorId,
    action: 'organization.member_assigned',
    resourceType: 'organization',
    resourceId: input.organizationId,
    afterState: { userId: input.userId },
  });

  return updated;
}
