export const runtime = "nodejs";

import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { BOOTSTRAP_OWNER_EMAIL } from "@/lib/auth";
import { getFirstAccessibleMenuHref } from "@/lib/internal-permissions";
import {
  APP_SESSION_MAX_AGE_SECONDS,
  createOpaqueToken,
  getSessionCookieConfig,
  hashOpaqueToken,
  serializeSessionCookieValue,
} from "@/lib/internal-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { buildDefaultRolePermissions, type MenuAccessLevel, type StaffMenuKey } from "@/lib/roles";

type LoginPayload = {
  email?: string;
  password?: string;
};

type StaffAccountRow = {
  id: string;
  name: string;
  role: string;
  role_id: string | null;
  access: string;
  email: string | null;
};

type StaffCredentialRow = {
  password_hash: string;
  is_active: boolean;
  is_owner: boolean;
};

export async function POST(request: Request) {
  const admin = createAdminSupabaseClient();

  if (!admin) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY belum diisi, jadi internal auth belum bisa dipakai." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as LoginPayload | null;
  const email = payload?.email?.trim().toLowerCase() ?? "";
  const password = payload?.password ?? "";
  const isBootstrapOwnerLogin = email === BOOTSTRAP_OWNER_EMAIL;

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
  }

  const { data, error } = await admin.from("mst_staff_members").select("id, name, role, role_id, access, email").eq("email", email).maybeSingle<StaffAccountRow>();

  if (error) {
    return NextResponse.json(
      {
        error: isBootstrapOwnerLogin ? `Gagal membaca staff_members: ${error.message}` : "Email atau kata sandi tidak valid.",
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        error: isBootstrapOwnerLogin
          ? "Akun owner bootstrap tidak ditemukan di staff_members. Pastikan email owner@coffeebean.local ada di project Supabase yang dipakai prod."
          : "Email atau kata sandi tidak valid.",
      },
      { status: 401 }
    );
  }

  const { data: credentials, error: credentialsError } = data
    ? await admin.from("mst_staff_credentials").select("password_hash, is_active, is_owner").eq("staff_id", data.id).maybeSingle<StaffCredentialRow>()
    : { data: null, error: null };

  if (credentialsError) {
    return NextResponse.json(
      {
        error: isBootstrapOwnerLogin ? `Gagal membaca staff_credentials: ${credentialsError.message}` : "Email atau kata sandi tidak valid.",
      },
      { status: 500 }
    );
  }

  if (!credentials) {
    return NextResponse.json(
      {
        error: isBootstrapOwnerLogin
          ? `Akun owner bootstrap ditemukan (${data.id}), tetapi credential tidak ditemukan di staff_credentials.`
          : "Email atau kata sandi tidak valid.",
      },
      { status: 401 }
    );
  }

  if (!credentials.is_active) {
    return NextResponse.json(
      {
        error: "Akun Tidak Aktif, Hubungi Owner",
      },
      { status: 401 }
    );
  }

  const passwordMatches = await compare(password, credentials.password_hash);

  if (!passwordMatches) {
    return NextResponse.json(
      {
        error: isBootstrapOwnerLogin
          ? "Password owner bootstrap tidak cocok dengan hash di staff_credentials."
          : "Email atau kata sandi tidak valid.",
      },
      { status: 401 }
    );
  }

  const sessionId = crypto.randomUUID();
  const rawToken = createOpaqueToken();
  const tokenHash = await hashOpaqueToken(rawToken);
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + APP_SESSION_MAX_AGE_SECONDS * 1000).toISOString();

  const { error: sessionError } = await admin.from("trx_app_sessions").insert({
    id: sessionId,
    staff_id: data.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    last_seen_at: nowIso,
  });

  if (sessionError) {
    return NextResponse.json({ error: "Gagal membuat sesi login. Coba ulang beberapa detik lagi." }, { status: 500 });
  }

  await admin.from("mst_staff_members").update({ last_login_at: nowIso, last_seen_at: nowIso, status: "Online" }).eq("id", data.id);

  const rolePermissions = data.role_id
    ? ((
        await admin
          .from("mst_staff_role_permissions")
          .select("menu_key, access_level")
          .eq("role_id", data.role_id)
      ).data ?? [])
    : [];
  const menuPermissions = credentials.is_owner
    ? buildDefaultRolePermissions(data.role)
    : Object.fromEntries(rolePermissions.map((permission) => [permission.menu_key, permission.access_level])) as Partial<Record<StaffMenuKey, MenuAccessLevel>>;
  const response = NextResponse.json({ ok: true, redirectTo: getFirstAccessibleMenuHref({ isOwner: credentials.is_owner, menuPermissions }) });
  const sessionCookie = getSessionCookieConfig();
  response.cookies.set(sessionCookie.name, serializeSessionCookieValue(sessionId, rawToken), sessionCookie.options);
  return response;
}
