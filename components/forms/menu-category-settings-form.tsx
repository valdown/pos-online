"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useSettings } from "@/components/providers/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizeMenuCategories } from "@/lib/menu-categories";

export function MenuCategorySettingsForm() {
  const { appSettings, persistenceMode, setAppSettings } = useSettings();
  const [newCategory, setNewCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function saveCategories(nextCategories: string[]) {
    setSubmitting(true);

    try {
      await setAppSettings({ ...appSettings, menuCategories: normalizeMenuCategories(nextCategories) });
      toast.success("Kategori menu diperbarui.", {
        description:
          persistenceMode === "supabase"
            ? "Master kategori menu tersimpan ke Supabase."
            : persistenceMode === "supabase-fallback"
              ? "Supabase sedang fallback, jadi kategori menu disimpan lokal untuk sementara."
              : "Master kategori menu disimpan lokal di browser ini.",
      });
    } catch (error) {
      toast.error("Kategori menu gagal disimpan.", {
        description: error instanceof Error ? error.message : "Periksa koneksi Supabase dan schema app_settings.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleAddCategory() {
    const normalizedValue = newCategory.trim();

    if (!normalizedValue) {
      return;
    }

    if (appSettings.menuCategories.some((category) => category.toLowerCase() === normalizedValue.toLowerCase())) {
      toast.warning("Kategori menu sudah ada.");
      return;
    }

    void saveCategories([...appSettings.menuCategories, normalizedValue]);
    setNewCategory("");
  }

  function handleRemoveCategory(categoryToRemove: string) {
    if (appSettings.menuCategories.length <= 1) {
      toast.warning("Minimal satu kategori menu harus tersedia.");
      return;
    }

    void saveCategories(appSettings.menuCategories.filter((category) => category !== categoryToRemove));
  }

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Konfigurasi kategori menu</CardTitle>
        <CardDescription>Kelola master kategori yang akan dipakai saat membuat atau mengedit produk di katalog menu.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <Input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Tambah kategori baru" className="max-w-sm" />
          <Button type="button" onClick={handleAddCategory} disabled={submitting}>
            <Plus className="size-4" />
            Tambah Kategori
          </Button>
        </div>

        <div className="space-y-3">
          {appSettings.menuCategories.map((category) => (
            <div key={category} className="flex items-center justify-between gap-4 rounded-[var(--radius-soft)] bg-[var(--surface-soft)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--ink)]">{category}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveCategory(category)} disabled={submitting}>
                <Trash2 className="size-4" />
                Hapus
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
