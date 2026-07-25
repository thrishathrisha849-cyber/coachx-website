import { roleHasPermission } from '../../src/auth/rbac.service';
import { ROLE_NAMES, ROLE_PERMISSION_GRANTS, MFA_MANDATORY_ROLES, BASELINE_PERMISSIONS } from '../../src/auth/rbac.constants';

describe('rbac.constants', () => {
  it('defines exactly the 12 canonical roles', () => {
    expect(ROLE_NAMES).toHaveLength(12);
  });

  it('grants super_admin every baseline permission (001 FR-086: full platform access)', () => {
    const superAdminGrants = ROLE_PERMISSION_GRANTS.super_admin;
    for (const permission of BASELINE_PERMISSIONS) {
      expect(superAdminGrants).toContain(permission.key);
    }
  });

  it('grants guest zero permissions (deny-by-default baseline)', () => {
    expect(ROLE_PERMISSION_GRANTS.guest).toEqual([]);
  });

  it('never grants the same permission key twice within one role (no duplicate grants)', () => {
    for (const role of ROLE_NAMES) {
      const grants = ROLE_PERMISSION_GRANTS[role];
      const uniqueGrants = new Set(grants);
      expect(uniqueGrants.size).toBe(grants.length);
    }
  });

  it('lists exactly the MFA-mandatory roles named by 003 FR-050 (admin/finance/super-admin)', () => {
    expect(MFA_MANDATORY_ROLES).toEqual(
      expect.arrayContaining(['finance_admin', 'platform_admin', 'super_admin']),
    );
    expect(MFA_MANDATORY_ROLES).toHaveLength(3);
  });
});

describe('roleHasPermission()', () => {
  it('allows a role that holds the requested permission', () => {
    expect(roleHasPermission(['content_manager'], 'course.publish')).toBe(true);
  });

  it('denies a role that does not hold the requested permission (deny-by-default)', () => {
    expect(roleHasPermission(['registered_free_user'], 'payment.refund')).toBe(false);
  });

  it('denies an empty role list', () => {
    expect(roleHasPermission([], 'course.view')).toBe(false);
  });

  it('denies an unrecognized role name rather than throwing', () => {
    expect(roleHasPermission(['not_a_real_role'], 'course.view')).toBe(false);
  });

  it('allows when ANY held role grants the permission (multi-role user)', () => {
    expect(roleHasPermission(['guest', 'finance_admin'], 'payment.refund')).toBe(true);
  });
});
