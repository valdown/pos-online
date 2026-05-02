import { buildDefaultRolePermissions, normalizeRolePermissions, normalizeStaffRoles, slugifyRoleId, type MenuAccessLevel, type StaffMenuKey } from "@/lib/roles";

export type StaffRoleRow = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type StaffRolePermissionRow = {
  role_id: string;
  menu_key: StaffMenuKey;
  access_level: MenuAccessLevel;
};

export type StaffRoleOption = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  permissions: Record<StaffMenuKey, MenuAccessLevel>;
};

export function mapStaffRoleRowsToModel(rows: StaffRoleRow[]) {
  return normalizeStaffRoles(
    rows
      .filter((row) => row.is_active)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "id"))
      .map((row) => row.name)
  );
}

export function mapStaffRolesToRows(roles: string[]): StaffRoleRow[] {
  return normalizeStaffRoles(roles).map((role, index) => ({
    id: slugifyRoleId(role),
    name: role,
    sort_order: index + 1,
    is_active: true,
  }));
}

export function mapStaffRoleDataToOptions(rows: StaffRoleRow[], permissions: StaffRolePermissionRow[]): StaffRoleOption[] {
  return rows
    .filter((row) => row.is_active)
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "id"))
    .map((row) => ({
      id: row.id,
      name: row.name,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      permissions: normalizeRolePermissions(
        Object.fromEntries(
          permissions.filter((permission) => permission.role_id === row.id).map((permission) => [permission.menu_key, permission.access_level])
        ),
        row.name
      ),
    }));
}

export function mapRolePermissionsToRows(roleId: string, roleName: string, permissions: Record<StaffMenuKey, MenuAccessLevel>): StaffRolePermissionRow[] {
  const normalized = normalizeRolePermissions(permissions, roleName);

  return Object.entries(normalized).map(([menuKey, accessLevel]) => ({
    role_id: roleId,
    menu_key: menuKey as StaffMenuKey,
    access_level: accessLevel,
  }));
}

export function buildDefaultRolePermissionRows(roleId: string, roleName: string) {
  return mapRolePermissionsToRows(roleId, roleName, buildDefaultRolePermissions(roleName));
}
