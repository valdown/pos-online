import type { AppShellUser } from "@/lib/auth";
import { APP_SESSION_COOKIE } from "@/lib/auth";
import { buildDefaultRolePermissions, normalizeRolePermissions, type MenuAccessLevel, type StaffMenuKey } from "@/lib/roles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const APP_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type StaffProfileRow = {
  name: string;
  role: string;
  role_id: string | null;
  access: string;
  email: string | null;
  staff_credentials: StaffCredentialProfileRow | StaffCredentialProfileRow[] | null;
};

type StaffCredentialProfileRow = {
  is_owner: boolean;
  is_active: boolean;
};

type StaffRolePermissionRow = {
  menu_key: StaffMenuKey;
  access_level: MenuAccessLevel;
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
  email: string | null;
  roleId: string | null;
  sessionId: string;
  lastSeenAt: string;
  expiresAt: string;
  isOwner: boolean;
  isActive: boolean;
  menuPermissions: Partial<Record<StaffMenuKey, MenuAccessLevel>>;
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

function normalizeStaffCredentials(credentials: StaffCredentialProfileRow | StaffCredentialProfileRow[] | null) {
  if (!credentials) {
    return null;
  }

  return Array.isArray(credentials) ? credentials[0] ?? null : credentials;
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

function toInternalUser(row: AppSessionRow, profile: StaffProfileRow, rolePermissions: StaffRolePermissionRow[]): InternalSessionUser {
  const credentials = normalizeStaffCredentials(profile.staff_credentials ?? null);
  const isOwner = credentials?.is_owner ?? profile.role.toLowerCase() === "owner";
  const isActive = credentials?.is_active ?? true;
  const defaultPermissions = buildDefaultRolePermissions(profile.role);
  const menuPermissions = isOwner
    ? defaultPermissions
    : normalizeRolePermissions(Object.fromEntries(rolePermissions.map((permission) => [permission.menu_key, permission.access_level])), profile.role);

  return {
    staffId: row.staff_id,
    sessionId: row.id,
    lastSeenAt: row.last_seen_at,
    expiresAt: row.expires_at,
    name: profile.name,
    role: profile.role,
    subtitle: profile.email ?? profile.role,
    modeLabel: "Internal",
    initials: initialsFromName(profile.name),
    access: profile.access,
    email: profile.email,
    roleId: profile.role_id,
    isOwner,
    isActive,
    menuPermissions,
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
    .from("trx_app_sessions")
    .select("id, staff_id, last_seen_at, expires_at, staff_members:mst_staff_members(name, role, role_id, access, email, staff_credentials:mst_staff_credentials(is_owner, is_active))")
    .eq("id", parsed.sessionId)
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle<AppSessionRow>();

  const profile = normalizeStaffProfile(data?.staff_members ?? null);

  if (error || !data || !profile) {
    return null;
  }

  const rolePermissions = profile.role_id
    ? ((
        await admin
          .from("mst_staff_role_permissions")
          .select("menu_key, access_level")
          .eq("role_id", profile.role_id)
      ).data ?? [])
    : [];

  return toInternalUser(data, profile, rolePermissions as StaffRolePermissionRow[]);
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
    admin.from("trx_app_sessions").update({ last_seen_at: nowIso }).eq("id", session.sessionId),
    admin.from("mst_staff_members").update({ last_seen_at: nowIso, status: "Online" }).eq("id", session.staffId),
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
    .from("trx_app_sessions")
    .select("staff_id")
    .eq("id", parsed.sessionId)
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle<{ staff_id: string }>();

  await admin
    .from("trx_app_sessions")
    .update({ revoked_at: nowIso, last_seen_at: nowIso })
    .eq("id", parsed.sessionId)
    .eq("token_hash", tokenHash)
    .is("revoked_at", null);

  if (data?.staff_id) {
    await admin.from("mst_staff_members").update({ last_logout_at: nowIso, status: "Off" }).eq("id", data.staff_id);
  }
}

export function getSessionCookieConfig() {
  return {
    name: APP_SESSION_COOKIE,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: APP_SESSION_MAX_AGE_SECONDS,
    },
  };
}
