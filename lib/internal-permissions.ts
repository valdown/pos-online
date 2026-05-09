import type { AppShellUser } from "@/lib/auth";
import {
  getMenuAccessRank,
  isStaffMenuKey,
  type MenuAccessLevel,
  type StaffMenuKey,
} from "@/lib/roles";
import type { InternalSessionUser } from "@/lib/internal-auth";

export type InternalPermissionUser = InternalSessionUser & {
  menuPermissions: Partial<Record<StaffMenuKey, MenuAccessLevel>>;
  isOwner: boolean;
};

export function hasMenuAccess(user: Pick<InternalPermissionUser, "menuPermissions" | "isOwner"> | AppShellUser | null | undefined, menuKey: StaffMenuKey, minLevel: MenuAccessLevel) {
  if (!user) {
    return false;
  }

  if ("isOwner" in user && user.isOwner) {
    return true;
  }

  if (!("menuPermissions" in user)) {
    return false;
  }

  const grantedLevel = user.menuPermissions?.[menuKey] ?? "hidden";
  return getMenuAccessRank(grantedLevel) >= getMenuAccessRank(minLevel);
}

export function resolveMenuKeyFromPath(pathname: string): StaffMenuKey | null {
  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/kasir") return "kasir";
  if (pathname === "/dapur") return "dapur";
  if (pathname === "/invoice-kasir") return "invoice-kasir";
  if (pathname === "/produk") return "produk";
  if (pathname === "/staf") return "staf";
  if (pathname === "/notifikasi") return "notifikasi";
  if (pathname === "/pengaturan") return "pengaturan";
  return null;
}

export function getMenuHref(menuKey: StaffMenuKey) {
  switch (menuKey) {
    case "dashboard":
      return "/dashboard";
    case "kasir":
      return "/kasir";
    case "dapur":
      return "/dapur";
    case "invoice-kasir":
      return "/invoice-kasir";
    case "produk":
      return "/produk";
    case "staf":
      return "/staf";
    case "notifikasi":
      return "/notifikasi";
    case "pengaturan":
      return "/pengaturan";
  }
}

export function getFirstAccessibleMenuHref(user: Pick<InternalPermissionUser, "menuPermissions" | "isOwner">) {
  const orderedMenus: StaffMenuKey[] = ["dashboard", "kasir", "dapur", "invoice-kasir", "produk", "staf", "notifikasi", "pengaturan"];
  const nextMenu = orderedMenus.find((menuKey) => hasMenuAccess(user, menuKey, "read"));
  return getMenuHref(nextMenu ?? "dashboard");
}

export function isKnownMenuKey(value: string): value is StaffMenuKey {
  return isStaffMenuKey(value);
}
