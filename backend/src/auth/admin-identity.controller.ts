import type { Request, Response } from 'express';
import { buildSuccessResponse } from '@coachx/shared';
import { asyncHandler } from '../utils/async-handler';
import { assignRole } from './rbac.service';

/**
 * PATCH /api/v1/admin/users/:userId/role — 003 FR-130 (role change:
 * reason required, audit entry, immediate effective-permission refresh
 * on next token issuance, self-escalation blocked). Gated by
 * `requirePermission('user.role.assign')` at the route level — this is a
 * backend API only, no admin UI is built in this phase (Phase 4 brief
 * constraints: "Do not build the admin UI").
 */
export const patchUserRole = asyncHandler(async (req: Request, res: Response) => {
  await assignRole({
    actorId: req.user!.id,
    actorRoles: req.user!.roles,
    targetUserId: req.params.userId,
    roleName: req.body.role,
    reason: req.body.reason,
    correlationId: req.id,
    requestId: req.id,
  });

  res.status(200).json(buildSuccessResponse({ assigned: true }));
});
