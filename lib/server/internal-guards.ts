import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { APP_SESSION_COOKIE } from "@/lib/auth";
import { hasMenuAccess } from "@/lib/internal-permissions";
import { resolveInternalSessionUser } from "@/lib/internal-auth";
import type { MenuAccessLevel, StaffMenuKey } from "@/lib/roles";

export async function getCurrentPermissionUser() {
  const cookieStore = await cookies();
  return resolveInternalSessionUser(cookieStore.get(APP_SESSION_COOKIE)?.value ?? null);
}

export async function requireInternalMenuAccess(menuKey: StaffMenuKey, minLevel: MenuAccessLevel) {
  const currentUser = await getCurrentPermissionUser();

  if (!currentUser) {
    return { error: NextResponse.json({ error: "Session internal tidak ditemukan. Login ulang dulu." }, { status: 401 }) };
  }

  if (!hasMenuAccess(currentUser, menuKey, minLevel)) {
    return { error: NextResponse.json({ error: "Anda tidak punya akses untuk menu ini." }, { status: 403 }) };
  }

  return { currentUser };
}
