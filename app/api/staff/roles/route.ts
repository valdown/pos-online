export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { requireInternalMenuAccess } from "@/lib/server/internal-guards";
import { buildDefaultRolePermissionRows, mapStaffRoleDataToOptions, mapStaffRolesToRows, type StaffRolePermissionRow, type StaffRoleRow } from "@/lib/supabase/roles";
import { normalizeStaffRoles } from "@/lib/roles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type RoleSettingsPayload = {
  roles?: string[];
};

export async function GET() {
  const auth = await requireInternalMenuAccess("pengaturan", "manage");

  if (auth.error) {
    return auth.error;
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY belum aktif, jadi master role tidak bisa dibaca." }, { status: 500 });
  }

  const [{ data: roleRows, error: roleError }, { data: permissionRows, error: permissionError }] = await Promise.all([
    supabase.from("mst_staff_roles").select("id, name, sort_order, is_active").order("sort_order", { ascending: true }),
    supabase.from("mst_staff_role_permissions").select("role_id, menu_key, access_level"),
  ]);

  if (roleError || permissionError) {
    return NextResponse.json({ error: "Gagal membaca master role." }, { status: 500 });
  }

  return NextResponse.json({ roles: mapStaffRoleDataToOptions((roleRows ?? []) as StaffRoleRow[], (permissionRows ?? []) as StaffRolePermissionRow[]) });
}

export async function PUT(request: Request) {
  const auth = await requireInternalMenuAccess("pengaturan", "manage");

  if (auth.error) {
    return auth.error;
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY belum aktif, jadi master role tidak bisa disimpan." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as RoleSettingsPayload | null;
  const roles = normalizeStaffRoles(payload?.roles);
  const rows = mapStaffRolesToRows(roles);

  const { data: existingRoles, error: existingRoleError } = await supabase.from("mst_staff_roles").select("id, name");

  if (existingRoleError) {
    return NextResponse.json({ error: "Gagal membaca role yang ada." }, { status: 500 });
  }

  const removedRoleIds = (existingRoles ?? []).map((role) => role.id).filter((id) => !rows.some((row) => row.id === id));

  if (removedRoleIds.length) {
    const { data: assignedStaff } = await supabase.from("mst_staff_members").select("id, role_id").in("role_id", removedRoleIds);

    if (assignedStaff?.length) {
      return NextResponse.json({ error: "Ada role yang masih dipakai staf, jadi belum bisa dihapus dari master role." }, { status: 400 });
    }
  }

  const { error: upsertError } = await supabase.from("mst_staff_roles").upsert(rows);

  if (upsertError) {
    return NextResponse.json({ error: "Gagal menyimpan role ke database." }, { status: 500 });
  }

  for (const row of rows) {
    const permissionRows = buildDefaultRolePermissionRows(row.id, row.name);
      const { error: permissionError } = await supabase.from("mst_staff_role_permissions").upsert(permissionRows);

    if (permissionError) {
      return NextResponse.json({ error: "Gagal menyiapkan permission role default." }, { status: 500 });
    }
  }

  if (removedRoleIds.length) {
    const { error: deletePermissionError } = await supabase.from("mst_staff_role_permissions").delete().in("role_id", removedRoleIds);

    if (deletePermissionError) {
      return NextResponse.json({ error: "Gagal menghapus permission role lama." }, { status: 500 });
    }

    const { error: deleteRoleError } = await supabase.from("mst_staff_roles").delete().in("id", removedRoleIds);

    if (deleteRoleError) {
      return NextResponse.json({ error: "Gagal menghapus role lama." }, { status: 500 });
    }
  }

  return GET();
}
