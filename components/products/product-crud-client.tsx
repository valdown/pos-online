"use client";

import { createPortal } from "react-dom";
import { useEffect, useMemo, useState } from "react";
import { ImageIcon, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { compressProductImage } from "@/lib/products/image-upload";
import { useLoadingOverlay } from "@/components/providers/loading-overlay";
import { useSettings } from "@/components/providers/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/mock-data";
import { getSupabaseUrl } from "@/lib/supabase/config";
import { getProductImagePublicUrl } from "@/lib/supabase/product-images";
import { productStatuses } from "@/lib/supabase/products";
import { formatCurrency, formatNumber } from "@/lib/utils";

type ProductFormValues = {
  name: string;
  description: string;
  category: Product["category"];
  price: string;
  stock: string;
  isActive: boolean;
  imagePath: string | null;
};

const emptyForm: ProductFormValues = {
  name: "",
  description: "",
  category: "Espresso",
  price: "0",
  stock: "0",
  isActive: true,
  imagePath: null,
};

const catalogHeadCellClass =
  "bg-[rgba(255,248,242,0.88)] px-4 py-3 text-left text-[11px] font-semibold whitespace-nowrap uppercase tracking-[0.16em] text-[var(--coffee-700)] shadow-[inset_0_-1px_0_var(--line)]";

const catalogCellClass =
  "border-y border-[var(--line)] bg-[rgba(255,255,255,0.82)] px-4 py-4 align-top text-sm text-[var(--muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.68)]";

const catalogNumericCellClass = `${catalogCellClass} text-right tabular-nums`;

const supabaseUrl = getSupabaseUrl();

function toFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    price: String(product.price),
    stock: String(product.stock),
    isActive: product.isActive,
    imagePath: product.imagePath,
  };
}

export function ProductCrudClient({ initialProducts }: { initialProducts: Product[] }) {
  const { appSettings } = useSettings();
  const { startLoading, stopLoading } = useLoadingOverlay();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [values, setValues] = useState<ProductFormValues>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageLoadErrors, setImageLoadErrors] = useState<Record<string, boolean>>({});

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
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
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
    startLoading();

    try {
      const payload = {
        ...values,
        price: Number(values.price),
        stock: Number(values.stock),
      };

      const formData = new FormData();
      formData.set("name", payload.name);
      formData.set("description", payload.description);
      formData.set("category", payload.category);
      formData.set("price", String(payload.price));
      formData.set("stock", String(payload.stock));
      formData.set("isActive", String(payload.isActive));

      if (selectedImageFile) {
        formData.set("image", selectedImageFile);
      }

      const response = await fetch(editingProductId ? `/api/products/${editingProductId}` : "/api/products", {
        method: editingProductId ? "PATCH" : "POST",
        body: formData,
      });

      const result = (await response.json().catch(() => null)) as { error?: string; product?: Product } | null;

      if (!response.ok || !result?.product) {
        await stopLoading();
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

      await stopLoading();
      toast.success(editingProductId ? "Produk berhasil diperbarui." : "Produk baru berhasil ditambahkan.");
      resetForm();
    } catch (error) {
      await stopLoading();
      toast.error(editingProductId ? "Produk gagal diperbarui." : "Produk gagal ditambahkan.", {
        description: error instanceof Error ? error.message : "Periksa koneksi dan schema tabel products.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(`Hapus produk ${product.name}?`);

    if (!confirmed) {
      return;
    }

    startLoading();

    try {
      const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        await stopLoading();
        toast.error("Produk gagal dihapus.", {
          description: result?.error ?? "Periksa koneksi dan schema tabel products.",
        });
        return;
      }

      setProducts((current) => current.filter((item) => item.id !== product.id));

      if (editingProductId === product.id) {
        resetForm();
      }

      await stopLoading();
      toast.success("Produk berhasil dihapus.");
    } catch (error) {
      await stopLoading();
      toast.error("Produk gagal dihapus.", {
        description: error instanceof Error ? error.message : "Periksa koneksi dan schema tabel products.",
      });
    } finally {
    }
  }

  async function handleImageChange(file: File | null) {
    if (!file) {
      setSelectedImageFile(null);
      setImagePreviewUrl(values.imagePath);
      return;
    }

    try {
      const compressed = await compressProductImage(file);
      setSelectedImageFile(compressed);
      setImagePreviewUrl(URL.createObjectURL(compressed));
    } catch (error) {
      toast.error("Gagal memproses gambar produk.", {
        description: error instanceof Error ? error.message : "Gunakan JPG, JPEG, atau WEBP dengan hasil kompresi maksimal 1MB.",
      });
    }
  }

  const imageInputId = "product-image-upload";

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardHeader className="space-y-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle>Katalog Produk</CardTitle>
                <div className="inline-flex items-center rounded-[var(--radius-pill)] border border-[rgba(228,183,133,0.28)] bg-[rgba(255,248,242,0.86)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--coffee-700)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                  {formatNumber(sortedProducts.length)} menu
                </div>
              </div>
              <CardDescription className="max-w-2xl leading-6">
                Kelola menu yang akan tampil di kasir menggunakan field yang sama seperti tabel produk, dengan susunan yang lebih rapi untuk memudahkan pemindaian.
              </CardDescription>
            </div>

            <Button
              type="button"
              onClick={() => {
                setEditingProductId(null);
                setValues(emptyForm);
                setSelectedImageFile(null);
                setImagePreviewUrl(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              Produk Baru
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-[calc(var(--radius-panel)-0.45rem)] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.64),rgba(251,244,236,0.56))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.76)]">
            <div className="overflow-x-auto">
              <table className="min-w-[1024px] w-full table-fixed border-separate border-spacing-y-2">
                <thead>
                  <tr>
                  <th className={`${catalogHeadCellClass} w-[29%] rounded-l-[calc(var(--radius-soft)-0.2rem)]`}>Nama</th>
                  <th className={`${catalogHeadCellClass} w-[16%]`}>Kategori</th>
                  <th className={`${catalogHeadCellClass} w-[14%] text-right`}>Harga</th>
                  <th className={`${catalogHeadCellClass} w-[10%] text-right`}>Stok</th>
                  <th className={`${catalogHeadCellClass} w-[12%]`}>Status</th>
                  <th className={`${catalogHeadCellClass} w-[19%] rounded-r-[calc(var(--radius-soft)-0.2rem)] text-right`}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.length ? (
                    sortedProducts.map((product) => {
                      const productImageUrl = getProductImagePublicUrl(product.imagePath, supabaseUrl);
                      const productImageKey = `${product.id}:${product.imagePath ?? "empty"}`;
                      const showProductImage = Boolean(productImageUrl && !imageLoadErrors[productImageKey]);

                      return (
                      <tr key={product.id}>
                        <td className={`${catalogCellClass} rounded-l-[calc(var(--radius-soft)-0.1rem)] border-l`}>
                          <div className="flex min-w-0 items-start gap-3.5">
                            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-[rgba(228,183,133,0.24)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(249,242,234,0.9))] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                              {showProductImage ? (
                                <img
                                  src={productImageUrl ?? undefined}
                                  alt={`Foto ${product.name}`}
                                  className="h-full w-full object-cover"
                                  onError={() => {
                                    setImageLoadErrors((current) => {
                                      if (current[productImageKey]) {
                                        return current;
                                      }

                                      return { ...current, [productImageKey]: true };
                                    });
                                  }}
                                />
                              ) : (
                                <ImageIcon className="size-4 text-[var(--muted)]" />
                              )}
                            </div>
                            <div className="min-w-0 space-y-1.5">
                              <p className="truncate font-semibold leading-6 text-[var(--ink)]">{product.name}</p>
                              <p className="max-w-sm text-sm leading-6 text-[var(--muted)]">{product.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`${catalogCellClass} font-medium text-[var(--ink)] whitespace-nowrap`}>{product.category}</td>
                        <td className={`${catalogNumericCellClass} font-semibold text-[var(--ink)] whitespace-nowrap`}>{formatCurrency(product.price)}</td>
                        <td className={`${catalogNumericCellClass} whitespace-nowrap`}>{formatNumber(product.stock)}</td>
                        <td className={catalogCellClass}>
                          <Badge variant={product.isActive ? "success" : "neutral"}>{product.isActive ? "Aktif" : "Tidak Aktif"}</Badge>
                        </td>
                        <td className={`${catalogCellClass} rounded-r-[calc(var(--radius-soft)-0.1rem)] border-r`}>
                          <div className="flex justify-end gap-2 whitespace-nowrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label={`Edit ${product.name}`}
                              title={`Edit ${product.name}`}
                              className="size-11 rounded-[1rem] bg-white/92 text-[var(--coffee-700)] shadow-[0_12px_22px_rgba(82,49,29,0.08)] hover:bg-[rgba(255,248,242,0.96)]"
                              onClick={() => {
                                setEditingProductId(product.id);
                                setValues(toFormValues(product));
                                setSelectedImageFile(null);
                                setImagePreviewUrl(product.imagePath);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="size-4.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              aria-label={`Hapus ${product.name}`}
                              title={`Hapus ${product.name}`}
                              className="size-11 rounded-[1rem] bg-white/92 text-[var(--muted)] shadow-[0_12px_22px_rgba(82,49,29,0.08)] hover:bg-[rgba(255,248,242,0.96)] hover:text-[var(--ink)]"
                              onClick={() => void handleDelete(product)}
                            >
                              <Trash2 className="size-4.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )})
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="rounded-[calc(var(--radius-soft)-0.1rem)] border border-[var(--line)] bg-[rgba(255,255,255,0.82)] px-6 py-10 text-center text-sm leading-6 text-[var(--muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.68)]"
                      >
                        Belum ada produk di katalog. Tambahkan menu baru untuk mulai menampilkan daftar di kasir.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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
                      <span>Status</span>
                      <select
                        value={values.isActive ? "Aktif" : "Tidak Aktif"}
                        onChange={(event) => updateField("isActive", event.target.value === "Aktif")}
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

                  <section className="space-y-3 rounded-[calc(var(--radius-soft)+0.05rem)] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(251,244,236,0.9))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.76)]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[var(--ink)]">Media produk</p>
                        <p className="text-xs leading-5 text-[var(--muted)]">JPG, JPEG, atau WEBP. Gambar akan dikompres otomatis hingga maksimal 1MB sebelum upload.</p>
                      </div>
                      <div className="inline-flex items-center rounded-[var(--radius-pill)] bg-[var(--surface-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--coffee-700)]">
                        {imagePreviewUrl ? "Aktif" : "Opsional"}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-[calc(var(--radius-soft)-0.1rem)] border border-[rgba(228,183,133,0.24)] bg-[rgba(255,255,255,0.72)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(249,242,234,0.9))] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                          {imagePreviewUrl ? (
                            <img src={imagePreviewUrl} alt="Preview gambar produk" className="h-full w-full object-cover" />
                          ) : (
                            <ImageIcon className="size-5 text-[var(--muted)]" />
                          )}
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-semibold text-[var(--ink)]">
                            {selectedImageFile ? "File baru siap diunggah" : values.imagePath ? "Foto saat ini akan tetap dipakai" : "Belum ada gambar produk"}
                          </p>
                          <p className="truncate text-xs text-[var(--muted)]">
                            {selectedImageFile
                              ? selectedImageFile.name
                              : values.imagePath
                                ? "Pilih file baru jika Anda ingin mengganti gambar produk."
                                : "Tambahkan gambar agar kartu menu lebih menarik di katalog dan kasir."}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <input
                          id={imageInputId}
                          type="file"
                          accept=".jpg,.jpeg,.webp,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={(event) => void handleImageChange(event.target.files?.[0] ?? null)}
                        />
                        <label htmlFor={imageInputId} className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-pill)] border border-[rgba(122,75,44,0.24)] bg-white px-4 py-2 text-sm font-semibold text-[var(--coffee-700)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition hover:bg-[rgba(255,248,242,0.96)]">
                          <ImagePlus className="size-4" />
                          Pilih Gambar
                        </label>
                      </div>
                    </div>
                  </section>

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
