import { PrismaClient } from '@prisma/client';

/**
 * Seeds the 12 canonical roles and the baseline permission catalog (001
 * FR-084–FR-086; 003 FR-067–FR-068). Idempotent — safe to run repeatedly
 * (uses `upsert`), so re-running the seed after a fresh migration never
 * fails on a unique-constraint conflict.
 *
 * NOTE — known, accepted duplication (see docs/auth/DECISION_GATES.md):
 * this role/permission/grant data is also defined in
 * `backend/src/auth/rbac.constants.ts`, which the backend's authorization
 * code reads from at runtime. The two lists are NOT imported from a
 * single shared source because `database/` and `backend/` are separate
 * npm workspaces and this seed script must run standalone (via `tsx`,
 * no backend build required) — importing compiled backend output into a
 * database seed would be a backwards dependency direction. Both lists
 * are small, stable, spec-cited data (not logic) — if they diverge,
 * `docs/auth/RBAC_MATRIX.md`'s citations are the tie-breaker source of
 * truth to reconcile against.
 */

const ROLE_NAMES = [
  'guest',
  'registered_free_user',
  'paid_member',
  'course_instructor',
  'mentor',
  'community_moderator',
  'support_agent',
  'content_manager',
  'finance_admin',
  'platform_admin',
  'super_admin',
  'organization_admin',
] as const;

const BASELINE_PERMISSIONS = [
  'course.view',
  'course.create',
  'course.publish',
  'community.moderate',
  'payment.refund',
  'user.suspend',
  'user.role.assign',
  'ticket.manage',
  'organization.manage_own',
] as const;

const ROLE_PERMISSION_GRANTS: Record<(typeof ROLE_NAMES)[number], string[]> = {
  guest: [],
  registered_free_user: ['course.view'],
  paid_member: ['course.view'],
  course_instructor: ['course.view', 'course.create'],
  mentor: ['course.view'],
  community_moderator: ['course.view', 'community.moderate'],
  support_agent: ['course.view', 'ticket.manage'],
  content_manager: ['course.view', 'course.create', 'course.publish'],
  finance_admin: ['course.view', 'payment.refund'],
  platform_admin: [
    'course.view',
    'course.create',
    'course.publish',
    'community.moderate',
    'payment.refund',
    'user.suspend',
    'user.role.assign',
    'ticket.manage',
  ],
  super_admin: [...BASELINE_PERMISSIONS],
  organization_admin: ['course.view', 'organization.manage_own'],
};

export async function seedRbac(prisma: PrismaClient): Promise<void> {
  console.log('  Seeding roles...');
  for (const name of ROLE_NAMES) {
    await prisma.role.upsert({ where: { name }, create: { name }, update: {} });
  }

  console.log('  Seeding permissions...');
  for (const key of BASELINE_PERMISSIONS) {
    await prisma.permission.upsert({ where: { key }, create: { key }, update: {} });
  }

  console.log('  Seeding role→permission grants...');
  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();
  const roleIdByName = new Map(roles.map((r) => [r.name, r.id]));
  const permissionIdByKey = new Map(permissions.map((p) => [p.key, p.id]));

  for (const [roleName, grantedKeys] of Object.entries(ROLE_PERMISSION_GRANTS)) {
    const roleId = roleIdByName.get(roleName);
    if (!roleId) continue;

    for (const key of grantedKeys) {
      const permissionId = permissionIdByKey.get(key);
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        create: { roleId, permissionId },
        update: {},
      });
    }
  }

  console.log(`  RBAC seed complete: ${ROLE_NAMES.length} roles, ${BASELINE_PERMISSIONS.length} permissions.`);
}
