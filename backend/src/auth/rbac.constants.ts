/**
 * The canonical 12-role set. Source: 001-product-vision-governance
 * FR-084 (consumer roles), FR-085 (operational roles), FR-086
 * (administrative roles) — the same list 003 FR-067 explicitly reuses
 * rather than redefining (003/tasks.md T009). Names below are the
 * machine-readable `snake_case` form of each spec-named role.
 *
 * "Do not invent dozens of placeholder permissions" (Phase 4 brief §10):
 * the permission list below is deliberately small and drawn only from
 * concrete examples the specs themselves give (003 FR-068: `course.view`,
 * `course.create`, `community.moderate`, `payment.refund`, `user.suspend`;
 * 001 Key Entities: `course.publish`, `payment.refund`) plus the minimal
 * set Phase 4's own auth/RBAC surface needs to be self-hosting (managing
 * roles/sessions). It is NOT a full platform permission catalog — future
 * features add their own `resource.action` permissions as they are
 * built, following this same naming convention.
 */

export const ROLE_NAMES = [
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

export type RoleName = (typeof ROLE_NAMES)[number];

/** Roles for which 2FA is mandatory (003 FR-050). */
export const MFA_MANDATORY_ROLES: readonly RoleName[] = [
  'finance_admin',
  'platform_admin',
  'super_admin',
];

/** The default role assigned to a newly registered user (Phase 4 brief §3: "Do not automatically grant admin privileges"). */
export const DEFAULT_ROLE: RoleName = 'registered_free_user';

export interface BaselinePermission {
  key: string;
  description: string;
}

/**
 * Minimal baseline permission catalog. Each is cited directly from a
 * spec example or is needed for Phase 4's own admin-identity surface
 * (role assignment) — see docs/auth/RBAC_MATRIX.md for the full
 * role-to-permission grant matrix and citations.
 */
export const BASELINE_PERMISSIONS: BaselinePermission[] = [
  { key: 'course.view', description: 'View published course content (003 FR-068 example)' },
  { key: 'course.create', description: 'Create/edit course content (003 FR-068 example)' },
  { key: 'course.publish', description: 'Publish course content (001 Key Entities example)' },
  { key: 'community.moderate', description: 'Moderate community content (003 FR-068 example)' },
  { key: 'payment.refund', description: 'Issue payment refunds (003 FR-068 / 001 example)' },
  { key: 'user.suspend', description: 'Suspend a user account (003 FR-068 example)' },
  { key: 'user.role.assign', description: 'Change a user’s role assignment (003 FR-130)' },
  { key: 'ticket.manage', description: 'View and manage support tickets (001 US3 acceptance scenario 3)' },
  { key: 'organization.manage_own', description: 'Manage own-organization members/analytics only (001 FR-086)' },
  { key: 'content.manage', description: 'Create/edit/publish CMS pages, navigation, and announcements (002 FR-084: admin manages public content without a code deployment)' },
];

/**
 * Grants — which roles hold which permissions. Deny-by-default (Phase 4
 * brief §10): any permission not listed here for a role is denied for
 * that role. `super_admin` is granted every baseline permission (001
 * FR-086: "full platform access"); every other role is granted only the
 * permissions its spec-given description implies.
 */
export const ROLE_PERMISSION_GRANTS: Record<RoleName, string[]> = {
  guest: [],
  registered_free_user: ['course.view'],
  paid_member: ['course.view'],
  course_instructor: ['course.view', 'course.create'],
  mentor: ['course.view'],
  community_moderator: ['course.view', 'community.moderate'],
  support_agent: ['course.view', 'ticket.manage'],
  content_manager: ['course.view', 'course.create', 'course.publish', 'content.manage'],
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
    'content.manage',
  ],
  super_admin: BASELINE_PERMISSIONS.map((p) => p.key),
  organization_admin: ['course.view', 'organization.manage_own'],
};
