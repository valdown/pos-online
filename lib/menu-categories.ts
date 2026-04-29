export const DEFAULT_MENU_CATEGORIES = ["Espresso", "Manual Brew", "Non Coffee", "Makanan"] as const;

export function normalizeMenuCategories(value: unknown): string[] {
  const source = Array.isArray(value) ? value : [];
  const next = source
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  const unique = Array.from(new Set(next));

  return unique.length ? unique : [...DEFAULT_MENU_CATEGORIES];
}
