import "server-only";

import { staffMembers as fallbackStaffMembers } from "@/lib/mock-data";
import { buildDefaultRolePermissions, DEFAULT_STAFF_ROLES, getLegacyAccessForRole, slugifyRoleId } from "@/lib/roles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mapStaffMemberRows, mapStaffRoleRows, type StaffListItem, type StaffMemberAdminRow } from "@/lib/supabase/staff";
import { type StaffRolePermissionRow, type StaffRoleRow } from "@/lib/supabase/roles";

type ActiveSessionRow = {
  staff_id: string;
  last_seen_at: string;
  revoked_at: string | null;
  expires_at: string;
};

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
        loginTime: null,
        logoutTime: null,
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

  const [{ data: staffRows, error: staffError }, { data: roleRows, error: roleError }, { data: permissionRows, error: permissionError }, { data: sessionRows, error: sessionError }] = await Promise.all([
    supabase
      .from("mst_staff_members")
      .select("id, name, email, role, role_id, access, status, last_login_at, last_logout_at, created_at, created_by, updated_at, updated_by, staff_credentials:mst_staff_credentials(is_active, is_owner)")
      .order("name", { ascending: true }),
    supabase.from("mst_staff_roles").select("id, name, sort_order, is_active").order("sort_order", { ascending: true }),
    supabase.from("mst_staff_role_permissions").select("role_id, menu_key, access_level"),
    supabase.from("trx_app_sessions").select("staff_id, last_seen_at, revoked_at, expires_at"),
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

  if (sessionError) {
    throw new Error(`Gagal membaca app_sessions: ${sessionError.message}`);
  }

  const nowMs = Date.now();
  const activeStaffIds = new Set(
    ((sessionRows ?? []) as ActiveSessionRow[])
      .filter((session) => {
        const lastSeenMs = Date.parse(session.last_seen_at);
        const expiresMs = Date.parse(session.expires_at);

        if (session.revoked_at) {
          return false;
        }

        if (Number.isNaN(lastSeenMs) || Number.isNaN(expiresMs)) {
          return false;
        }

        return expiresMs > nowMs && lastSeenMs >= nowMs - 5 * 60_000;
      })
      .map((session) => session.staff_id)
  );

  const normalizedStaffRows = ((staffRows ?? []) as StaffMemberAdminRow[]).map((row) => {
    const onlineStatus: StaffMemberAdminRow["online_status"] = activeStaffIds.has(row.id) ? "Online" : row.status === "Istirahat" ? "Istirahat" : "Off";

    return {
      ...row,
      online_status: onlineStatus,
    };
  });

  return {
    staff: mapStaffMemberRows(normalizedStaffRows),
    roles: mapStaffRoleRows((roleRows ?? []) as StaffRoleRow[], (permissionRows ?? []) as StaffRolePermissionRow[]),
  };
}

export function getRoleAccessSummary(roleName: string) {
  return getLegacyAccessForRole(roleName);
}
