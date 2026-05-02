export const runtime = "nodejs";

import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireInternalMenuAccess } from "@/lib/server/internal-guards";
import { getLegacyAccessForRole, isMenuAccessLevel, isStaffMenuKey, type MenuAccessLevel, type StaffMenuKey } from "@/lib/roles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mapStaffMemberRow, mapStaffRoleRows, type StaffMemberAdminRow } from "@/lib/supabase/staff";
import { type StaffRoleOption, type StaffRolePermissionRow, type StaffRoleRow } from "@/lib/supabase/roles";

const staffUpdateSchema = z.object({
  name: z.string().trim().min(1, "Nama lengkap wajib diisi."),
  email: z.string().trim().email("Email wajib valid."),
  password: z.string().optional(),
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireInternalMenuAccess("staf", "manage");

  if (auth.error) {
    return auth.error;
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY belum aktif, jadi staf tidak bisa disimpan." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  const parsed = staffUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input staf tidak valid." }, { status: 400 });
  }

  const { id } = await params;

  try {
    const roles = await getRolesAndPermissions(supabase);
    const selectedRole = roles.find((role) => role.id === parsed.data.roleId);

    if (!selectedRole) {
      return NextResponse.json({ error: "Role yang dipilih tidak ditemukan." }, { status: 400 });
    }

    const { data: existingStaff } = await supabase.from("mst_staff_members").select("id, role_id").eq("id", id).maybeSingle<{ id: string; role_id: string | null }>();

    if (!existingStaff) {
      return NextResponse.json({ error: "Staf tidak ditemukan." }, { status: 404 });
    }

    const normalizedPermissions = normalizeRolePermissions(parsed.data.rolePermissions);
    await upsertRolePermissions(supabase, selectedRole, normalizedPermissions);

    const legacyAccess = getLegacyAccessForRole(selectedRole.name);
    const nowIso = new Date().toISOString();
    const memberPatch: Record<string, unknown> = {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      role: selectedRole.name,
      role_id: selectedRole.id,
      access: legacyAccess,
      updated_at: nowIso,
      updated_by: auth.currentUser.staffId,
    };

    if (!parsed.data.isActive) {
      memberPatch.status = "Off";
    }

    const { error: memberError } = await supabase
      .from("mst_staff_members")
      .update(memberPatch)
      .eq("id", id);

    if (memberError) {
      const status = memberError.code === "23505" ? 409 : 500;
      return NextResponse.json({ error: memberError.code === "23505" ? "Email staf sudah dipakai." : "Gagal memperbarui data staf." }, { status });
    }

    const credentialPatch: Record<string, unknown> = {
      is_owner: selectedRole.id === "owner",
      is_active: parsed.data.isActive,
    };

    if (parsed.data.password && parsed.data.password.trim()) {
      if (parsed.data.password.trim().length < 6) {
        return NextResponse.json({ error: "Kata sandi minimal 6 karakter." }, { status: 400 });
      }

      credentialPatch.password_hash = await hash(parsed.data.password.trim(), 10);
    }

    const { error: credentialError } = await supabase.from("mst_staff_credentials").update(credentialPatch).eq("staff_id", id);

    if (credentialError) {
      return NextResponse.json({ error: credentialError.message || "Gagal memperbarui kredensial staf." }, { status: 500 });
    }

    if (!parsed.data.isActive) {
      await supabase.from("trx_app_sessions").update({ revoked_at: nowIso }).eq("staff_id", id).is("revoked_at", null);
    }

    const { data: memberRow } = await supabase
      .from("mst_staff_members")
      .select("id, name, email, role, role_id, access, status, last_login_at, last_logout_at, created_at, created_by, updated_at, updated_by, staff_credentials:mst_staff_credentials(is_active, is_owner)")
      .eq("id", id)
      .maybeSingle<StaffMemberAdminRow>();

    if (!memberRow) {
      return NextResponse.json({ error: "Staf berhasil diperbarui, tetapi data akhir gagal dibaca." }, { status: 500 });
    }

    return NextResponse.json({ staff: mapStaffMemberRow(memberRow) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal memperbarui staf." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireInternalMenuAccess("staf", "manage");

  if (auth.error) {
    return auth.error;
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY belum aktif, jadi staf tidak bisa dihapus." }, { status: 500 });
  }

  const { id } = await params;
  const { data: currentStaff } = await supabase.from("mst_staff_credentials").select("is_owner").eq("staff_id", id).maybeSingle<{ is_owner: boolean }>();

  if (currentStaff?.is_owner) {
    return NextResponse.json({ error: "Akun owner utama tidak boleh dinonaktifkan dari menu staf." }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const { error: credentialError } = await supabase.from("mst_staff_credentials").update({ is_active: false }).eq("staff_id", id);

  if (credentialError) {
    return NextResponse.json({ error: credentialError.message || "Gagal menonaktifkan kredensial staf." }, { status: 500 });
  }

  await Promise.all([
    supabase.from("mst_staff_members").update({ status: "Off", last_logout_at: nowIso, updated_at: nowIso, updated_by: auth.currentUser.staffId }).eq("id", id),
    supabase.from("trx_app_sessions").update({ revoked_at: nowIso, last_seen_at: nowIso }).eq("staff_id", id).is("revoked_at", null),
  ]);

  return NextResponse.json({ ok: true });
}
