export const DEFAULT_STAFF_ROLES = ["Owner", "Kasir", "Supervisor", "Barista"] as const;

export const MENU_ACCESS_LEVELS = ["hidden", "read", "create", "manage"] as const;

export type MenuAccessLevel = (typeof MENU_ACCESS_LEVELS)[number];

export const MENU_ACCESS_LEVEL_LABELS: Record<MenuAccessLevel, string> = {
  hidden: "Sembunyikan",
  read: "Hanya Lihat",
  create: "Lihat & Tambah",
  manage: "Bisa Semua (Edit/Hapus)",
};

export const STAFF_MENU_KEYS = ["dashboard", "kasir", "dapur", "invoice-kasir", "produk", "staf", "notifikasi", "pengaturan"] as const;

export type StaffMenuKey = (typeof STAFF_MENU_KEYS)[number];

export const STAFF_MENU_LABELS: Record<StaffMenuKey, string> = {
  dashboard: "Dashboard",
  kasir: "Pos",
  dapur: "Dapur",
  "invoice-kasir": "Invoice Kasir",
  produk: "Menu",
  staf: "User",
  notifikasi: "Pengaturan Telegram",
  pengaturan: "Pengaturan Aplikasi",
};

export function isMenuAccessLevel(value: unknown): value is MenuAccessLevel {
  return value === "hidden" || value === "read" || value === "create" || value === "manage";
}

export function isStaffMenuKey(value: unknown): value is StaffMenuKey {
  return value === "dashboard" || value === "kasir" || value === "dapur" || value === "invoice-kasir" || value === "produk" || value === "staf" || value === "notifikasi" || value === "pengaturan";
}

export function getLegacyAccessForRole(roleName: string): "Penuh" | "Operasional" | "Kasir" {
  switch (roleName.trim().toLowerCase()) {
    case "owner":
      return "Penuh";
    case "kasir":
      return "Kasir";
    default:
      return "Operasional";
  }
}

export function getMenuAccessRank(value: MenuAccessLevel) {
  switch (value) {
    case "hidden":
      return 0;
    case "read":
      return 1;
    case "create":
      return 2;
    case "manage":
      return 3;
  }
}

export function buildDefaultRolePermissions(roleName: string): Record<StaffMenuKey, MenuAccessLevel> {
  const normalizedRole = roleName.trim().toLowerCase();

  if (normalizedRole === "owner") {
    return {
      dashboard: "manage",
      kasir: "manage",
      dapur: "manage",
      "invoice-kasir": "manage",
      produk: "manage",
      staf: "manage",
      notifikasi: "manage",
      pengaturan: "manage",
    };
  }

  if (normalizedRole === "supervisor") {
    return {
      dashboard: "read",
      kasir: "create",
      dapur: "create",
      "invoice-kasir": "read",
      produk: "create",
      staf: "hidden",
      notifikasi: "read",
      pengaturan: "hidden",
    };
  }

  if (normalizedRole === "barista") {
    return {
      dashboard: "hidden",
      kasir: "create",
      dapur: "create",
      "invoice-kasir": "hidden",
      produk: "hidden",
      staf: "hidden",
      notifikasi: "hidden",
      pengaturan: "hidden",
    };
  }

  return {
    dashboard: "hidden",
    kasir: "create",
    dapur: "hidden",
    "invoice-kasir": "hidden",
    produk: "hidden",
    staf: "hidden",
    notifikasi: "hidden",
    pengaturan: "hidden",
  };
}

export function slugifyRoleId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function normalizeStaffRoles(value: unknown): string[] {
  const source = Array.isArray(value) ? value : [];
  const next = source
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  const unique = Array.from(new Set(next.map((item) => item.toLowerCase()))).map((lowercased) => next.find((item) => item.toLowerCase() === lowercased)!);

  return unique.length ? unique : [...DEFAULT_STAFF_ROLES];
}

export function normalizeRolePermissions(value: unknown, roleName: string): Record<StaffMenuKey, MenuAccessLevel> {
  const fallback = buildDefaultRolePermissions(roleName);

  if (typeof value !== "object" || value === null) {
    return fallback;
  }

  return Object.fromEntries(
    STAFF_MENU_KEYS.map((menuKey) => {
      const candidate = (value as Record<string, unknown>)[menuKey];
      return [menuKey, isMenuAccessLevel(candidate) ? candidate : fallback[menuKey]];
    })
  ) as Record<StaffMenuKey, MenuAccessLevel>;
}
