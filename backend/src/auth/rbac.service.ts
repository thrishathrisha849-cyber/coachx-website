import { getPrismaClient } from '../database/prisma-client';
import { AppError } from '../utils/app-error';
import { recordAuditEvent } from '../database/audit-event.repository';
import { getUserRoleNames } from './auth.repository';
import { ROLE_PERMISSION_GRANTS, type RoleName } from './rbac.constants';

/**
 * Permission-check helper (Phase 4 brief §10). Deny-by-default: a role
 * or permission key not present in `ROLE_PERMISSION_GRANTS` denies the
 * request — there is no implicit-allow path anywhere in this module.
 */
export function roleHasPermission(roleNames: string[], permissionKey: string): boolean {
  return roleNames.some((role) => {
    const grants = ROLE_PERMISSION_GRANTS[role as RoleName];
    return grants?.includes(permissionKey) ?? false;
  });
}

/**
 * FR-130: role changes require a reason, create an audit log entry, and
 * take effect immediately (the next access-token refresh re-resolves
 * roles from the database — see auth.types.ts's documented trade-off).
 *
 * Self-escalation protection (Phase 4 brief §10 "Protection against
 * self-escalation"): an actor may never assign a role to themselves.
 */
export async function assignRole(params: {
  actorId: string;
  actorRoles: string[];
  targetUserId: string;
  roleName: string;
  reason: string;
  correlationId?: string;
  requestId?: string;
}): Promise<void> {
  const { actorId, actorRoles, targetUserId, roleName, reason, correlationId, requestId } = params;

  if (!roleHasPermission(actorRoles, 'user.role.assign')) {
    throw AppError.forbidden('You do not have permission to change roles');
  }

  if (actorId === targetUserId) {
    throw AppError.forbidden('You cannot change your own role');
  }

  const db = getPrismaClient();
  if (!db) throw AppError.internal('Database is not connected');

  const role = await db.role.findUnique({ where: { name: roleName } });
  if (!role) throw AppError.badRequest(`Unknown role: ${roleName}`);

  // Dual-approval for super_admin grants (003 FR-130: "dual approval
  // recommended for granting super-admin roles") — Phase 4 scope
  // implements the single-actor path and flags dual-approval as a
  // decision gate (no approval-workflow infrastructure exists yet to
  // build a second-approver flow against) — see docs/auth/TRACEABILITY.md.
  if (roleName === 'super_admin') {
    await recordAuditEvent({
      actorType: 'USER',
      actorId,
      action: 'auth.role.super_admin_grant_attempted',
      resourceType: 'user',
      resourceId: targetUserId,
      reason,
      correlationId,
      requestId,
      metadata: { note: 'Dual-approval workflow not yet implemented — see docs/auth/DECISION_GATES.md' },
    });
  }

  const existing = await db.userRole.findUnique({
    where: { userId_roleId: { userId: targetUserId, roleId: role.id } },
  });
  if (existing) {
    throw AppError.conflict('User already has this role');
  }

  await db.userRole.create({
    data: { userId: targetUserId, roleId: role.id, assignedBy: actorId, reason },
  });

  await recordAuditEvent({
    actorType: 'USER',
    actorId,
    action: 'auth.role.assigned',
    resourceType: 'user',
    resourceId: targetUserId,
    reason,
    correlationId,
    requestId,
    afterState: { role: roleName },
  });
}

export async function getEffectiveRoles(userId: string): Promise<string[]> {
  return getUserRoleNames(userId);
}
