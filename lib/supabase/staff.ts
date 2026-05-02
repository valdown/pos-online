import { getLegacyAccessForRole } from "@/lib/roles";
import { mapStaffRoleDataToOptions, type StaffRoleOption, type StaffRolePermissionRow, type StaffRoleRow } from "@/lib/supabase/roles";

type StaffCredentialRow = {
  is_active: boolean;
  is_owner: boolean;
};

type StaffCredentialRelation = StaffCredentialRow | StaffCredentialRow[] | null;

export type StaffMemberAdminRow = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  role_id: string | null;
  access: string;
  status: "Online" | "Istirahat" | "Off";
  online_status?: "Online" | "Istirahat" | "Off";
  last_login_at: string | null;
  last_logout_at: string | null;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  staff_credentials: StaffCredentialRelation;
};

export type StaffListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId: string | null;
  access: string;
  statusOnline: "Online" | "Istirahat" | "Off";
  statusAccount: "Aktif" | "Tidak Aktif";
  loginTime: string | null;
  logoutTime: string | null;
  isActive: boolean;
  isOwner: boolean;
  createdAt: string | null;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
};

function normalizeCredentialRelation(value: StaffCredentialRelation) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

export function mapStaffMemberRow(row: StaffMemberAdminRow): StaffListItem {
  const credentials = normalizeCredentialRelation(row.staff_credentials);
  const roleName = row.role?.trim() || "Staff";
  const isActive = credentials?.is_active ?? true;

  return {
    id: row.id,
    name: row.name,
    email: row.email ?? "",
    role: roleName,
    roleId: row.role_id,
    access: row.access || getLegacyAccessForRole(roleName),
    statusOnline: row.online_status ?? row.status,
    statusAccount: isActive ? "Aktif" : "Tidak Aktif",
    loginTime: row.last_login_at,
    logoutTime: row.last_logout_at,
    isActive,
    isOwner: credentials?.is_owner ?? false,
    createdAt: row.created_at,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

export function mapStaffMemberRows(rows: StaffMemberAdminRow[]) {
  return rows.map(mapStaffMemberRow);
}

export function mapStaffRoleRows(rows: StaffRoleRow[], permissions: StaffRolePermissionRow[]): StaffRoleOption[] {
  return mapStaffRoleDataToOptions(rows, permissions);
}
