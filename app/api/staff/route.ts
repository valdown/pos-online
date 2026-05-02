export const runtime = "nodejs";

import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireInternalMenuAccess } from "@/lib/server/internal-guards";
import { getLegacyAccessForRole, isMenuAccessLevel, isStaffMenuKey, type MenuAccessLevel, type StaffMenuKey } from "@/lib/roles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { type StaffRoleOption } from "@/lib/supabase/roles";
import { mapStaffMemberRow, mapStaffRoleRows, type StaffMemberAdminRow } from "@/lib/supabase/staff";
import { type StaffRolePermissionRow, type StaffRoleRow } from "@/lib/supabase/roles";

const staffPayloadSchema = z.object({
  name: z.string().trim().min(1, "Nama lengkap wajib diisi."),
  email: z.string().trim().email("Email wajib valid."),
  password: z.string().min(6, "Kata sandi minimal 6 karakter."),
  roleId: z.string().trim().min(1, "Role wajib dipilih."),
  isActive: z.boolean(),
  rolePermissions: z.record(z.string(), z.string()),
});

function normalizeRolePermissions(value: Record<string, string>) {
  const normalized: Partial<Record<StaffMenuKey, MenuAccessLevel>> = {};

  for (const [menuKey, accessLevel] of Object.entries(value)) {
    if (isStaffMenuKey(menuKey) && isMenuAccessLevel(accessLevel)) {
      normalized[menuKey] = accessLevel;
    }
  }

  return normalized as Record<StaffMenuKey, MenuAccessLevel>;
}

async function getRolesAndPermissions(supabase: ReturnType<typeof createAdminSupabaseClient>) {
  const [{ data: roleRows, error: roleError }, { data: permissionRows, error: permissionError }] = await Promise.all([
    supabase!.from("mst_staff_roles").select("id, name, sort_order, is_active").order("sort_order", { ascending: true }),
    supabase!.from("mst_staff_role_permissions").select("role_id, menu_key, access_level"),
  ]);

  if (roleError || permissionError) {
    throw new Error(roleError?.message ?? permissionError?.message ?? "Gagal membaca master role.");
  }

  return mapStaffRoleRows((roleRows ?? []) as StaffRoleRow[], (permissionRows ?? []) as StaffRolePermissionRow[]);
}

async function upsertRolePermissions(supabase: ReturnType<typeof createAdminSupabaseClient>, role: StaffRoleOption, nextPermissions: Record<StaffMenuKey, MenuAccessLevel>) {
  const rows = Object.entries(nextPermissions).map(([menuKey, accessLevel]) => ({
    role_id: role.id,
    menu_key: menuKey,
    access_level: accessLevel,
  }));

  const { error } = await supabase!.from("mst_staff_role_permissions").upsert(rows);

  if (error) {
    throw new Error(error.message || "Gagal menyimpan permission role.");
  }
}

export async function POST(request: Request) {
  const auth = await requireInternalMenuAccess("staf", "manage");

  if (auth.error) {
    return auth.error;
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY belum aktif, jadi staf tidak bisa disimpan." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  const parsed = staffPayloadSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input staf tidak valid." }, { status: 400 });
  }

  try {
    const roles = await getRolesAndPermissions(supabase);
    const selectedRole = roles.find((role) => role.id === parsed.data.roleId);

    if (!selectedRole) {
      return NextResponse.json({ error: "Role yang dipilih tidak ditemukan." }, { status: 400 });
    }

    const normalizedPermissions = normalizeRolePermissions(parsed.data.rolePermissions);
    await upsertRolePermissions(supabase, selectedRole, normalizedPermissions);

    const staffId = `stf-${Date.now().toString().slice(-8)}`;
    const passwordHash = await hash(parsed.data.password, 10);
    const legacyAccess = getLegacyAccessForRole(selectedRole.name);
    const actorId = auth.currentUser.staffId;
    const nowIso = new Date().toISOString();

    const { error: memberError } = await supabase.from("mst_staff_members").insert({
      id: staffId,
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      role: selectedRole.name,
      role_id: selectedRole.id,
      access: legacyAccess,
      status: "Off",
      created_at: nowIso,
      created_by: actorId,
      updated_at: nowIso,
      updated_by: actorId,
    });

    if (memberError) {
      const status = memberError.code === "23505" ? 409 : 500;
      return NextResponse.json({ error: memberError.code === "23505" ? "Email staf sudah dipakai." : "Gagal menyimpan data staf." }, { status });
    }

    const { error: credentialError } = await supabase.from("mst_staff_credentials").insert({
      staff_id: staffId,
      password_hash: passwordHash,
      is_owner: selectedRole.id === "owner",
      is_active: parsed.data.isActive,
    });

    if (credentialError) {
      await supabase.from("mst_staff_members").delete().eq("id", staffId);
      return NextResponse.json({ error: credentialError.message || "Gagal menyimpan kredensial staf." }, { status: 500 });
    }

    const { data: memberRow } = await supabase
      .from("mst_staff_members")
      .select("id, name, email, role, role_id, access, status, last_login_at, last_logout_at, created_at, created_by, updated_at, updated_by, staff_credentials:mst_staff_credentials(is_active, is_owner)")
      .eq("id", staffId)
      .maybeSingle<StaffMemberAdminRow>();

    if (!memberRow) {
      return NextResponse.json({ error: "Staf berhasil dibuat, tetapi data akhir gagal dibaca." }, { status: 500 });
    }

    return NextResponse.json({ staff: mapStaffMemberRow(memberRow) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal menyimpan staf." }, { status: 500 });
  }
}
