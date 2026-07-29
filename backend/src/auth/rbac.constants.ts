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

  // --- Phase 6 Part 1 (LMS foundation) ---------------------------------
  // Extends the EXISTING `course.*` namespace (`course.view`/`course.create`/
  // `course.publish` already existed from Phase 4) rather than inventing a
  // parallel `lms.*` prefix — matches this file's own "deliberately small,
  // not a full platform permission catalog" philosophy and the established
  // bare `resource.action` naming convention. `course.category.*` is nested
  // under `course.` (not a bare `category.*`) specifically to avoid a name
  // collision with an unrelated future feature's own "category" concept.
  // See docs/lms/RBAC.md for the full rationale.
  { key: 'course.update', description: 'Edit course metadata without necessarily publishing (006 LMS course engine)' },
  { key: 'course.archive', description: 'Archive/restore a course (006 LMS course lifecycle)' },
  { key: 'course.manageInstructors', description: 'Assign/remove/set-primary course instructors (006 LMS instructor assignment)' },
  { key: 'course.module.manage', description: 'Create/edit/reorder/archive course modules (006 LMS course modules)' },
  { key: 'course.category.manage', description: 'Create/edit/reorder/archive course categories (006 LMS course categories)' },

  // --- Phase 7 Part 1 (Billing Foundation: Products/Plans/Pricing) -----
  // One permission covers the whole catalog surface (products, prices,
  // membership plans, plan versions/publish/archive, plan entitlements) —
  // same "deliberately small, not a full platform permission catalog"
  // discipline this file documents at the top, matching how
  // `course.category.manage` covers its whole nested surface rather than
  // one permission per admin action. See docs/billing/RBAC.md.
  { key: 'billing.catalog.manage', description: 'Create/edit/publish/archive Products, Prices, Membership Plans, Plan Versions, and Plan Entitlements (009 FR-001–FR-014)' },

  // --- 001 Governance Foundation ---------------------------------------
  // `community.moderate` (already defined above) is deliberately REUSED
  // for Trust & Safety case review/action/appeal-resolution — reporting
  // itself (FR-090) requires no special permission, only authentication
  // ("every user"), so no new `trust_safety.report` permission is needed.
  { key: 'organization.create', description: 'Create a new Organization (001 FR-053/FR-086 — distinct from organization.manage_own, which scopes an Organization Admin to their OWN org only)' },
  { key: 'milestone.verify', description: 'Verify or reject a claimed Achiever-stage business milestone (001 FR-045, Constitution Article VIII)' },
  { key: 'governance.manage', description: 'Advance a feature through the governance-sequence workflow and manage phase gating (001 FR-083, FR-078–FR-082)' },
  { key: 'kpi.view', description: 'View the Business KPI instrumentation dashboard (001 FR-064–FR-068)' },
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
  // 006 LMS: an instructor can author/edit their own assigned course and
  // its modules, but NOT publish it, archive it, or reassign instructors —
  // those remain content_manager/platform_admin actions (review-gate
  // workflow: DRAFT/REVIEW are instructor-editable, APPROVED+ requires an
  // admin/content-manager permission). Ownership (which course an
  // instructor may touch) is enforced separately in the service layer —
  // this permission grant alone is necessary but not sufficient.
  course_instructor: ['course.view', 'course.create', 'course.update', 'course.module.manage'],
  mentor: ['course.view'],
  community_moderator: ['course.view', 'community.moderate'],
  support_agent: ['course.view', 'ticket.manage'],
  content_manager: [
    'course.view',
    'course.create',
    'course.update',
    'course.publish',
    'course.archive',
    'course.manageInstructors',
    'course.module.manage',
    'course.category.manage',
    'content.manage',
  ],
  finance_admin: ['course.view', 'payment.refund', 'billing.catalog.manage', 'kpi.view'],
  platform_admin: [
    'course.view',
    'course.create',
    'course.update',
    'course.publish',
    'course.archive',
    'course.manageInstructors',
    'course.module.manage',
    'course.category.manage',
    'community.moderate',
    'payment.refund',
    'user.suspend',
    'user.role.assign',
    'ticket.manage',
    'content.manage',
    'billing.catalog.manage',
    'organization.create',
    'milestone.verify',
    'governance.manage',
    'kpi.view',
  ],
  super_admin: BASELINE_PERMISSIONS.map((p) => p.key),
  organization_admin: ['course.view', 'organization.manage_own'],
};
