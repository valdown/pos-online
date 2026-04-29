import { z } from "zod";

import type { Product } from "@/lib/mock-data";
export const productStatuses = ["Aktif", "Hampir Habis"] as const;

export type ProductRow = Omit<Product, "soldToday" | "imagePath"> & { sold_today: number; image_path: string | null };

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Nama produk wajib diisi."),
  description: z.string().trim().min(1, "Deskripsi wajib diisi."),
  sku: z.string().trim().min(1, "SKU wajib diisi."),
  category: z.string().trim().min(1, "Kategori wajib diisi."),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif."),
  stock: z.coerce.number().int().min(0, "Stok tidak boleh negatif."),
  soldToday: z.coerce.number().int().min(0, "Terjual hari ini tidak boleh negatif."),
  status: z.enum(productStatuses),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    price: row.price,
    stock: row.stock,
    sku: row.sku,
    soldToday: row.sold_today,
    status: row.status,
    imagePath: row.image_path,
  };
}

export function mapProductInputToRow(id: string, input: ProductInput): ProductRow {
  return {
    id,
    name: input.name,
    category: input.category,
    description: input.description,
    price: input.price,
    stock: input.stock,
    sku: input.sku,
    sold_today: input.soldToday,
    status: input.status,
    image_path: null,
  };
}

export function slugifyProductId(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
