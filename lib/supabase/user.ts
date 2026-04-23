import "server-only";

import { cookies } from "next/headers";

import { APP_SESSION_COOKIE, DEFAULT_APP_USER, type AppShellUser } from "@/lib/auth";
import { resolveInternalSessionUser } from "@/lib/internal-auth";

export async function getCurrentAppUser(): Promise<AppShellUser> {
  const cookieStore = await cookies();
  const session = await resolveInternalSessionUser(cookieStore.get(APP_SESSION_COOKIE)?.value ?? null);

  return session ?? DEFAULT_APP_USER;
}
