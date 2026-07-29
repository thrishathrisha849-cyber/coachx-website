import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { findUserById } from '../auth/auth.repository';
import { AppError } from '../utils/app-error';
import {
  createNewOrganization,
  listOrganizationsAdmin,
  updateExistingOrganization,
  getOwnOrganizationMembers,
  assignMemberToOrganization,
} from './organization.service';

/** POST /api/v1/admin/organizations — 001 FR-053/FR-086 (`organization.create`, platform_admin/super_admin only). */
export const postCreateOrganization = asyncHandler(async (req: Request, res: Response) => {
  const org = await createNewOrganization({
    name: req.body.name,
    slug: req.body.slug,
    actorId: req.user!.id,
  });
  res.status(201).json(buildSuccessResponse(org));
});

/** GET /api/v1/admin/organizations — platform-wide list (`organization.create` holders only, distinct from `organization.manage_own`). */
export const getOrganizationsAdmin = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const result = await listOrganizationsAdmin(page, pageSize);
  res.status(200).json(buildSuccessResponse(result));
});

/** PATCH /api/v1/admin/organizations/:organizationId */
export const patchOrganization = asyncHandler(async (req: Request, res: Response) => {
  const org = await updateExistingOrganization(req.params.organizationId, {
    name: req.body.name,
    status: req.body.status,
    actorId: req.user!.id,
  });
  res.status(200).json(buildSuccessResponse(org));
});

/** POST /api/v1/admin/organizations/:organizationId/members */
export const postAssignMember = asyncHandler(async (req: Request, res: Response) => {
  const result = await assignMemberToOrganization({
    organizationId: req.params.organizationId,
    userId: req.body.userId,
    actorId: req.user!.id,
  });
  res.status(200).json(buildSuccessResponse(result));
});

/**
 * GET /api/v1/organization/members — 001 FR-086/US3 acceptance scenario 4:
 * "an Organization Admin views analytics, they see only their own
 * organization's members and data, not platform-wide data." Requires
 * `organization.manage_own` — deliberately a DIFFERENT route/permission
 * than the platform-wide admin list above, so an Organization Admin can
 * never reach the platform-wide endpoint even if a client mistakenly
 * pointed at it.
 */
export const getOwnOrganizationMembersHandler = asyncHandler(async (req: Request, res: Response) => {
  const requester = await findUserById(req.user!.id);
  if (!requester) throw AppError.unauthorized();

  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  const result = await getOwnOrganizationMembers(requester.organizationId, page, pageSize);
  res.status(200).json(buildSuccessResponse(result));
});
