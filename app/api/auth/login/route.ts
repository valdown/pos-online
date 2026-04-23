export const runtime = "nodejs";

import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

import { BOOTSTRAP_OWNER_EMAIL } from "@/lib/auth";
import {
  APP_SESSION_MAX_AGE_SECONDS,
  createOpaqueToken,
  getSessionCookieConfig,
  hashOpaqueToken,
  serializeSessionCookieValue,
} from "@/lib/internal-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type LoginPayload = {
  email?: string;
  password?: string;
};

type StaffAccountRow = {
  id: string;
  name: string;
  role: string;
  access: string;
  phone: string;
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

  if (!email || !password) {
    return NextResponse.json({ error: "Email dan kata sandi wajib diisi." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("staff_members")
    .select("id, name, role, access, phone, email")
    .eq("email", email)
    .maybeSingle<StaffAccountRow>();

  const { data: credentials, error: credentialsError } = data
    ? await admin.from("staff_credentials").select("password_hash, is_active, is_owner").eq("staff_id", data.id).maybeSingle<StaffCredentialRow>()
    : { data: null, error: null };

  if (error || !data || credentialsError || !credentials?.is_active || !credentials.is_owner) {
    return NextResponse.json(
      {
        error:
          email === BOOTSTRAP_OWNER_EMAIL
            ? "Akun owner bootstrap belum siap atau belum diberi full access owner. Jalankan SQL internal owner auth lebih dulu."
            : "Email atau kata sandi tidak valid.",
      },
      { status: 401 }
    );
  }

  const passwordMatches = await compare(password, credentials.password_hash);

  if (!passwordMatches) {
    return NextResponse.json({ error: "Email atau kata sandi tidak valid." }, { status: 401 });
  }

  const sessionId = crypto.randomUUID();
  const rawToken = createOpaqueToken();
  const tokenHash = await hashOpaqueToken(rawToken);
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + APP_SESSION_MAX_AGE_SECONDS * 1000).toISOString();

  const { error: sessionError } = await admin.from("app_sessions").insert({
    id: sessionId,
    staff_id: data.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
    last_seen_at: nowIso,
  });

  if (sessionError) {
    return NextResponse.json({ error: "Gagal membuat sesi login. Coba ulang beberapa detik lagi." }, { status: 500 });
  }

  await admin.from("staff_members").update({ last_login_at: nowIso, last_seen_at: nowIso, status: "Online" }).eq("id", data.id);

  const response = NextResponse.json({ ok: true });
  const sessionCookie = getSessionCookieConfig();
  response.cookies.set(sessionCookie.name, serializeSessionCookieValue(sessionId, rawToken), sessionCookie.options);
  return response;
}
