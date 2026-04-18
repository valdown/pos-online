import "server-only";

import { DEMO_APP_USER, type AppShellUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "CB";
}

export async function getCurrentAppUser(): Promise<AppShellUser> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return DEMO_APP_USER;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return DEMO_APP_USER;
  }

  const nameFromMeta =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata.name === "string"
        ? user.user_metadata.name
        : user.email?.split("@")[0] ?? "Coffee Bean User";

  const roleFromMeta = typeof user.user_metadata.role === "string" ? user.user_metadata.role : "Authenticated";

  return {
    initials: initialsFromName(nameFromMeta),
    name: nameFromMeta,
    role: roleFromMeta,
    subtitle: user.email ?? "supabase-user",
    modeLabel: "Supabase",
  };
}
