import type { MenuAccessLevel, StaffMenuKey } from "@/lib/roles";

export const APP_SESSION_COOKIE = "coffee-internal-session";
export const BOOTSTRAP_OWNER_EMAIL = "owner@coffeebean.local";

export type AppShellUser = {
  initials: string;
  name: string;
  role: string;
  subtitle: string;
  modeLabel: "Internal";
  isOwner?: boolean;
  menuPermissions?: Partial<Record<StaffMenuKey, MenuAccessLevel>>;
};

export const DEFAULT_APP_USER: AppShellUser = {
  initials: "AN",
  name: "Aa Nden",
  role: "Owner",
  subtitle: BOOTSTRAP_OWNER_EMAIL,
  modeLabel: "Internal",
  isOwner: true,
  menuPermissions: {},
};
