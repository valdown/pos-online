import type { AppShellUser } from "@/lib/auth";
import { APP_SESSION_COOKIE } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const APP_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type StaffProfileRow = {
  name: string;
  role: string;
  access: string;
  phone: string;
  email: string | null;
};

type AppSessionRow = {
  id: string;
  staff_id: string;
  last_seen_at: string;
  expires_at: string;
  staff_members: StaffProfileRow | StaffProfileRow[] | null;
};

export type InternalSessionUser = AppShellUser & {
  staffId: string;
  access: string;
  phone: string;
  email: string | null;
  sessionId: string;
  lastSeenAt: string;
  expiresAt: string;
};

function initialsFromName(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "CB"
  );
}

function normalizeStaffProfile(profile: StaffProfileRow | StaffProfileRow[] | null) {
  if (!profile) {
    return null;
  }

  return Array.isArray(profile) ? profile[0] ?? null : profile;
}

export async function hashOpaqueToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function createOpaqueToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function serializeSessionCookieValue(sessionId: string, token: string) {
  return `${sessionId}.${token}`;
}

export function parseSessionCookieValue(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const [sessionId, token] = value.split(".", 2);

  if (!sessionId || !token) {
    return null;
  }

  return { sessionId, token };
}

function toInternalUser(row: AppSessionRow, profile: StaffProfileRow): InternalSessionUser {
  return {
    staffId: row.staff_id,
    sessionId: row.id,
    lastSeenAt: row.last_seen_at,
    expiresAt: row.expires_at,
    name: profile.name,
    role: profile.role,
    subtitle: profile.email ?? profile.phone,
    modeLabel: "Internal",
    initials: initialsFromName(profile.name),
    access: profile.access,
    phone: profile.phone,
    email: profile.email,
  };
}

export async function resolveInternalSessionUser(sessionCookieValue: string | null | undefined) {
  const parsed = parseSessionCookieValue(sessionCookieValue);
  const admin = createAdminSupabaseClient();

  if (!parsed || !admin) {
    return null;
  }

  const tokenHash = await hashOpaqueToken(parsed.token);
  const { data, error } = await admin
    .from("app_sessions")
    .select("id, staff_id, last_seen_at, expires_at, staff_members(name, role, access, phone, email)")
    .eq("id", parsed.sessionId)
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle<AppSessionRow>();

  const profile = normalizeStaffProfile(data?.staff_members ?? null);

  if (error || !data || !profile) {
    return null;
  }

  return toInternalUser(data, profile);
}

export async function touchInternalSession(session: InternalSessionUser) {
  const admin = createAdminSupabaseClient();

  if (!admin) {
    return;
  }

  const lastSeenMs = Date.parse(session.lastSeenAt);
  const shouldTouch = Number.isNaN(lastSeenMs) || Date.now() - lastSeenMs >= 60_000;

  if (!shouldTouch) {
    return;
  }

  const nowIso = new Date().toISOString();

  await Promise.all([
    admin.from("app_sessions").update({ last_seen_at: nowIso }).eq("id", session.sessionId),
    admin.from("staff_members").update({ last_seen_at: nowIso, status: "Online" }).eq("id", session.staffId),
  ]);
}

export async function revokeInternalSession(sessionCookieValue: string | null | undefined) {
  const parsed = parseSessionCookieValue(sessionCookieValue);
  const admin = createAdminSupabaseClient();

  if (!parsed || !admin) {
    return;
  }

  const tokenHash = await hashOpaqueToken(parsed.token);
  const nowIso = new Date().toISOString();

  const { data } = await admin
    .from("app_sessions")
    .select("staff_id")
    .eq("id", parsed.sessionId)
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle<{ staff_id: string }>();

  await admin
    .from("app_sessions")
    .update({ revoked_at: nowIso, last_seen_at: nowIso })
    .eq("id", parsed.sessionId)
    .eq("token_hash", tokenHash)
    .is("revoked_at", null);

  if (data?.staff_id) {
    await admin.from("staff_members").update({ last_logout_at: nowIso, status: "Off" }).eq("id", data.staff_id);
  }
}

export function getSessionCookieConfig() {
  return {
    name: APP_SESSION_COOKIE,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: true,
      path: "/",
      maxAge: APP_SESSION_MAX_AGE_SECONDS,
    },
  };
}
