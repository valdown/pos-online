"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLoadingOverlay } from "@/components/providers/loading-overlay";
import { useSettings } from "@/components/providers/settings";
import { Switch } from "@/components/ui/switch";
import { formatCurrency } from "@/lib/utils";

const settingsSchema = z.object({
  storeName: z.string().min(1, "Nama toko wajib diisi."),
  branchName: z.string().min(1, "Cabang wajib diisi."),
  taxRate: z.coerce.number().min(0).max(100),
  serviceFee: z.coerce.number().min(0).max(100),
  storePhone: z.string().min(1, "Nomor telepon wajib diisi."),
  receiptFooter: z.string().min(1, "Footer struk wajib diisi."),
  bankName: z.string().min(1, "Nama bank wajib diisi."),
  bankAccountName: z.string().min(1, "Nama rekening wajib diisi."),
  bankAccountNumber: z.string().min(1, "Nomor rekening wajib diisi."),
  openingCash: z.coerce.number().min(0),
  autoPrintReceipt: z.boolean(),
  paymentMethods: z.array(
    z.object({
      id: z.enum(["cash", "debit", "qris"]),
      label: z.string(),
      enabled: z.boolean(),
    })
  ),
});

type SettingsValues = z.infer<typeof settingsSchema>;

export function AppSettingsForm() {
  const { appSettings, persistenceMode, setAppSettings } = useSettings();
  const { startLoading, stopLoading } = useLoadingOverlay();

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: appSettings,
  });

  useEffect(() => {
    form.reset(appSettings);
  }, [appSettings, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    startLoading();
    try {
      await setAppSettings({ ...appSettings, ...values });
      await stopLoading();
      toast.success("Pengaturan toko diperbarui.", {
        description:
          persistenceMode === "supabase"
            ? `Pajak ${values.taxRate}% dan modal kas ${formatCurrency(values.openingCash)} tersimpan ke Supabase.`
            : persistenceMode === "supabase-fallback"
              ? `Supabase sedang fallback, jadi perubahan tetap disimpan lokal sambil menunggu koneksi normal kembali.`
              : `Pajak ${values.taxRate}% dan modal kas ${formatCurrency(values.openingCash)} tersimpan lokal di browser ini.`,
      });
    } catch (error) {
      await stopLoading();
      toast.error("Pengaturan toko gagal disimpan.", {
        description: error instanceof Error ? error.message : "Periksa koneksi Supabase dan schema app_settings.",
      });
    }
  });

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Konfigurasi aplikasi</CardTitle>
          <CardDescription>
            {persistenceMode === "supabase"
              ? "Sesuaikan identitas toko, pajak, struk, dan rekening settlement. Perubahan akan di-upsert ke tabel Supabase."
              : persistenceMode === "supabase-fallback"
                ? "Supabase terdeteksi, tetapi sinkronisasi terakhir gagal. Perubahan tetap disimpan lokal sampai koneksi atau schema kembali normal."
                : "Sesuaikan identitas toko, pajak, struk, dan rekening settlement. Perubahan disimpan lokal di browser ini dan dipakai lintas halaman."}
          </CardDescription>
        </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
              <span>Nama toko</span>
              <Input {...form.register("storeName")} />
            </label>
            <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
              <span>Nama cabang</span>
              <Input {...form.register("branchName")} />
            </label>
            <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
              <span>Pajak (%)</span>
              <Input type="number" {...form.register("taxRate")} />
            </label>
            <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
              <span>Service fee (%)</span>
              <Input type="number" {...form.register("serviceFee")} />
            </label>
            <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
              <span>Telepon toko</span>
              <Input {...form.register("storePhone")} />
            </label>
            <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
              <span>Modal awal kas</span>
              <Input type="number" {...form.register("openingCash")} />
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
            <span>Footer struk</span>
            <textarea
              {...form.register("receiptFooter")}
              className="min-h-28 w-full rounded-[var(--radius-soft)] border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--coffee-300)] focus:ring-2 focus:ring-[rgba(224,164,92,0.18)]"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
              <span>Bank</span>
              <Input {...form.register("bankName")} />
            </label>
            <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
              <span>Nama rekening</span>
              <Input {...form.register("bankAccountName")} />
            </label>
            <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
              <span>Nomor rekening</span>
              <Input {...form.register("bankAccountNumber")} />
            </label>
          </div>

          <div className="form-row">
            <div>
              <p className="font-medium text-[var(--ink)]">Cetak struk otomatis</p>
              <p className="text-sm text-[var(--muted)]">Aktifkan agar setiap transaksi langsung menampilkan status print.</p>
            </div>
            <Switch checked={form.watch("autoPrintReceipt")} onCheckedChange={(checked) => form.setValue("autoPrintReceipt", checked)} />
          </div>

          <Button type="submit" disabled={form.formState.isSubmitting}>Simpan pengaturan</Button>
        </form>
      </CardContent>
    </Card>
  );
}
