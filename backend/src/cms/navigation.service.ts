import { findNavigationTree } from './cms.repository';

export interface NavTreeNode {
  id: string;
  label: string;
  url: string;
  isExternal: boolean;
  megaMenuColumn: string | null;
  requiredPermission: string | null;
  children: NavTreeNode[];
}

/**
 * Builds a nested navigation tree from the flat `NavigationItem` table
 * (002 FR-001–FR-003, FR-008; "Do not hardcode menu items"). Permission
 * filtering (FR-007) is applied when a caller's roles are supplied;
 * every current caller passes an empty role list (no frontend auth
 * session exists yet — see docs/public-site/TRACEABILITY.md).
 */
export async function getNavigationTree(location: string, callerRoles: string[] = []): Promise<NavTreeNode[]> {
  const items = await findNavigationTree(location);

  const byParent = new Map<string | null, typeof items>();
  for (const item of items) {
    const key = item.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(item);
  }

  const isAllowed = (requiredPermission: string | null): boolean => {
    if (!requiredPermission) return true;
    // Deny-by-default, matching rbac.service.ts's own convention — a
    // nav item requiring a permission is hidden unless the caller's
    // role set is known to include it (never assumed).
    return callerRoles.length > 0 && callerRoles.includes(requiredPermission);
  };

  function build(parentId: string | null): NavTreeNode[] {
    const children = byParent.get(parentId) ?? [];
    return children
      .filter((item) => isAllowed(item.requiredPermission))
      .map((item) => ({
        id: item.id,
        label: item.label,
        url: item.url,
        isExternal: item.isExternal,
        megaMenuColumn: item.megaMenuColumn,
        requiredPermission: item.requiredPermission,
        children: build(item.id),
      }));
  }

  return build(null);
}
