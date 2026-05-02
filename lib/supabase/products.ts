import { z } from "zod";

import type { Product } from "@/lib/mock-data";
export const productStatuses = ["Aktif", "Tidak Aktif"] as const;

export type ProductRow = Omit<Product, "imagePath" | "deletedAt" | "isActive"> & {
  image_path: string | null;
  deleted_at: string | null;
  is_active: boolean;
};

export const productInputSchema = z.object({
  name: z.string().trim().min(1, "Nama produk wajib diisi."),
  description: z.string().trim().min(1, "Deskripsi wajib diisi."),
  category: z.string().trim().min(1, "Kategori wajib diisi."),
  price: z.coerce.number().min(0, "Harga tidak boleh negatif."),
  stock: z.coerce.number().int().min(0, "Stok tidak boleh negatif."),
  isActive: z.boolean(),
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
    isActive: row.is_active,
    imagePath: row.image_path,
    deletedAt: row.deleted_at,
  };
}

export function mapProductInputToRow(id: string, input: ProductInput, options?: { imagePath?: string | null; deletedAt?: string | null }): ProductRow {
  return {
    id,
    name: input.name,
    category: input.category,
    description: input.description,
    price: input.price,
    stock: input.stock,
    is_active: input.isActive,
    image_path: options?.imagePath ?? null,
    deleted_at: options?.deletedAt ?? null,
  };
}
