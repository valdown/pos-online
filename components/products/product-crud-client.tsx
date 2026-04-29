"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { useSettings } from "@/components/providers/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/mock-data";
import { productStatuses } from "@/lib/supabase/products";
import { formatCurrency } from "@/lib/utils";

type ProductFormValues = {
  name: string;
  description: string;
  sku: string;
  category: Product["category"];
  price: string;
  stock: string;
  soldToday: string;
  status: Product["status"];
};

const emptyForm: ProductFormValues = {
  name: "",
  description: "",
  sku: "",
  category: "Espresso",
  price: "0",
  stock: "0",
  soldToday: "0",
  status: "Aktif",
};

function toFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    description: product.description,
    sku: product.sku,
    category: product.category,
    price: String(product.price),
    stock: String(product.stock),
    soldToday: String(product.soldToday),
    status: product.status,
  };
}

export function ProductCrudClient({ initialProducts }: { initialProducts: Product[] }) {
  const { appSettings } = useSettings();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [values, setValues] = useState<ProductFormValues>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const title = editingProductId ? "Edit menu" : "Tambah menu baru";
  const description = editingProductId
    ? "Perbarui detail menu yang sudah ada. Perubahan akan langsung tersimpan ke database aktif."
    : "Tambahkan menu baru menggunakan field yang sama seperti tabel katalog produk. Hasilnya akan langsung terbaca oleh halaman kasir.";

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => a.name.localeCompare(b.name, "id"));
  }, [products]);

  const availableCategories = useMemo(() => {
    return Array.from(new Set([...appSettings.menuCategories, ...products.map((product) => product.category)])).sort((a, b) => a.localeCompare(b, "id"));
  }, [appSettings.menuCategories, products]);

  function updateField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setEditingProductId(null);
    setValues(emptyForm);
    setDialogOpen(false);
  }

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [dialogOpen]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...values,
        price: Number(values.price),
        stock: Number(values.stock),
        soldToday: Number(values.soldToday),
      };

      const response = await fetch(editingProductId ? `/api/products/${editingProductId}` : "/api/products", {
        method: editingProductId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => null)) as { error?: string; product?: Product } | null;

      if (!response.ok || !result?.product) {
        toast.error(editingProductId ? "Produk gagal diperbarui." : "Produk gagal ditambahkan.", {
          description: result?.error ?? "Periksa koneksi dan schema tabel products.",
        });
        return;
      }

      setProducts((current) => {
        if (editingProductId) {
          return current.map((item) => (item.id === editingProductId ? result.product! : item));
        }

        return [result.product!, ...current];
      });

      toast.success(editingProductId ? "Produk berhasil diperbarui." : "Produk baru berhasil ditambahkan.");
      resetForm();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(`Hapus produk ${product.name}?`);

    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      toast.error("Produk gagal dihapus.", {
        description: result?.error ?? "Periksa koneksi dan schema tabel products.",
      });
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== product.id));

    if (editingProductId === product.id) {
      resetForm();
    }

    toast.success("Produk berhasil dihapus.");
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Katalog Produk</CardTitle>
              <CardDescription>Kelola master data menu dan harga menggunakan field yang sama seperti tabel katalog produk.</CardDescription>
            </div>

            <Button
              type="button"
              onClick={() => {
                setEditingProductId(null);
                setValues(emptyForm);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Produk Baru
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="p-6">
        <CardHeader>
          <CardTitle>Katalog produk</CardTitle>
          <CardDescription>Kelola menu yang akan tampil di kasir menggunakan field yang sama seperti tabel produk.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  <th className="pb-2 font-medium">Nama</th>
                  <th className="pb-2 font-medium">SKU</th>
                  <th className="pb-2 font-medium">Kategori</th>
                  <th className="pb-2 font-medium">Harga</th>
                  <th className="pb-2 font-medium">Stok</th>
                  <th className="pb-2 font-medium">Terjual</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedProducts.map((product) => (
                  <tr key={product.id} className="overflow-hidden rounded-[var(--radius-soft)] bg-[rgba(255,255,255,0.72)] shadow-[inset_0_0_0_1px_var(--line)]">
                    <td className="rounded-l-[var(--radius-soft)] px-4 py-4 align-top">
                      <p className="font-semibold text-[var(--ink)]">{product.name}</p>
                      <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--muted)]">{product.description}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)]">{product.sku}</td>
                    <td className="px-4 py-4 text-sm font-medium text-[var(--ink)]">{product.category}</td>
                    <td className="px-4 py-4 text-sm font-medium text-[var(--ink)]">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)]">{product.stock}</td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)]">{product.soldToday}</td>
                    <td className="px-4 py-4">
                      <Badge variant={product.status === "Aktif" ? "success" : "warning"}>{product.status}</Badge>
                    </td>
                    <td className="rounded-r-[var(--radius-soft)] px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingProductId(product.id);
                            setValues(toFormValues(product));
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="size-4" />
                          Edit
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => void handleDelete(product)}>
                          <Trash2 className="size-4" />
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {dialogOpen && isMounted
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgb(17_24_39_/_0.8)] px-4 py-6 backdrop-blur-md">
              <div className="w-full max-w-2xl rounded-[2rem] border border-[rgba(255,255,255,0.65)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(255,248,242,0.94))] p-6 shadow-[0_28px_70px_rgba(32,18,9,0.22)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--ink)]">{title}</h2>
                    <p className="text-sm text-[var(--muted)]">{description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--muted)] transition hover:text-[var(--ink)]"
                    aria-label="Tutup form produk"
                  >
                    <X className="size-4.5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2 text-sm font-medium text-[var(--ink)] md:col-span-2">
                      <span>Nama produk</span>
                      <Input value={values.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Nama Produk" />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
                      <span>SKU</span>
                      <Input value={values.sku} onChange={(event) => updateField("sku", event.target.value)} />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
                      <span>Kategori</span>
                      <select
                        value={values.category}
                        onChange={(event) => updateField("category", event.target.value as Product["category"])}
                        className="h-12 w-full rounded-[var(--radius-soft)] border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition focus:border-[var(--coffee-300)] focus:ring-2 focus:ring-[rgba(224,164,92,0.18)]"
                      >
                        {availableCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
                      <span>Harga</span>
                      <Input type="number" min={0} value={values.price} onChange={(event) => updateField("price", event.target.value)} />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
                      <span>Stok</span>
                      <Input type="number" min={0} value={values.stock} onChange={(event) => updateField("stock", event.target.value)} />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
                      <span>Terjual hari ini</span>
                      <Input type="number" min={0} value={values.soldToday} onChange={(event) => updateField("soldToday", event.target.value)} />
                    </label>
                    <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
                      <span>Status</span>
                      <select
                        value={values.status}
                        onChange={(event) => updateField("status", event.target.value as Product["status"])}
                        className="h-12 w-full rounded-[var(--radius-soft)] border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] outline-none transition focus:border-[var(--coffee-300)] focus:ring-2 focus:ring-[rgba(224,164,92,0.18)]"
                      >
                        {productStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
                    <span>Deskripsi</span>
                    <textarea
                      value={values.description}
                      onChange={(event) => updateField("description", event.target.value)}
                      className="min-h-28 w-full rounded-[var(--radius-soft)] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--coffee-300)] focus:ring-2 focus:ring-[rgba(224,164,92,0.18)]"
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {editingProductId ? "Simpan" : "Simpan"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
