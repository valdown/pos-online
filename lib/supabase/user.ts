import "server-only";

import { cookies } from "next/headers";

import { APP_SESSION_COOKIE } from "@/lib/auth";
import { resolveInternalSessionUser, type InternalSessionUser } from "@/lib/internal-auth";

export async function getCurrentAppUser(): Promise<InternalSessionUser | null> {
  const cookieStore = await cookies();
  return resolveInternalSessionUser(cookieStore.get(APP_SESSION_COOKIE)?.value ?? null);
}
