import "server-only";

import { staffMembers as fallbackStaffMembers } from "@/lib/mock-data";
import { buildDefaultRolePermissions, DEFAULT_STAFF_ROLES, getLegacyAccessForRole, slugifyRoleId } from "@/lib/roles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mapStaffMemberRows, mapStaffRoleRows, type StaffListItem, type StaffMemberAdminRow } from "@/lib/supabase/staff";
import { type StaffRolePermissionRow, type StaffRoleRow } from "@/lib/supabase/roles";

export async function getStaffManagementData() {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      staff: fallbackStaffMembers.map((member) => ({
        id: member.id,
        name: member.name,
        email: "",
        role: member.role,
        roleId: slugifyRoleId(member.role),
        access: member.access,
        statusOnline: member.status,
        statusAccount: "Aktif",
        isActive: true,
        isOwner: member.role.toLowerCase() === "owner",
        createdAt: null,
        createdBy: null,
        updatedAt: null,
        updatedBy: null,
      })) satisfies StaffListItem[],
      roles: DEFAULT_STAFF_ROLES.map((roleName, index) => ({
        id: slugifyRoleId(roleName),
        name: roleName,
        sortOrder: index + 1,
        isActive: true,
        permissions: buildDefaultRolePermissions(roleName),
      })),
    };
  }

  const [{ data: staffRows, error: staffError }, { data: roleRows, error: roleError }, { data: permissionRows, error: permissionError }] = await Promise.all([
    supabase
      .from("mst_staff_members")
      .select("id, name, email, role, role_id, access, status, created_at, created_by, updated_at, updated_by, staff_credentials:mst_staff_credentials(is_active, is_owner)")
      .order("name", { ascending: true }),
    supabase.from("mst_staff_roles").select("id, name, sort_order, is_active").order("sort_order", { ascending: true }),
    supabase.from("mst_staff_role_permissions").select("role_id, menu_key, access_level"),
  ]);

  if (staffError) {
    throw new Error(`Gagal membaca staff_members: ${staffError.message}`);
  }

  if (roleError) {
    throw new Error(`Gagal membaca staff_roles: ${roleError.message}`);
  }

  if (permissionError) {
    throw new Error(`Gagal membaca staff_role_permissions: ${permissionError.message}`);
  }

  return {
    staff: mapStaffMemberRows((staffRows ?? []) as StaffMemberAdminRow[]),
    roles: mapStaffRoleRows((roleRows ?? []) as StaffRoleRow[], (permissionRows ?? []) as StaffRolePermissionRow[]),
  };
}

export function getRoleAccessSummary(roleName: string) {
  return getLegacyAccessForRole(roleName);
}
