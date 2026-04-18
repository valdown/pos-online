"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useDemoSettings } from "@/components/providers/demo-settings";
import { Switch } from "@/components/ui/switch";

const notificationSchema = z.object({
  telegramEnabled: z.boolean(),
  botToken: z.string().min(1, "Bot token wajib diisi."),
  chatId: z.string().min(1, "Chat ID wajib diisi."),
  digestFrequency: z.enum(["Real-time", "Per 2 Jam", "Harian"]),
  lowStockAlert: z.boolean(),
  cashierSummary: z.boolean(),
  refundAlert: z.boolean(),
});

type NotificationValues = z.infer<typeof notificationSchema>;

export function NotificationSettingsForm() {
  const { notificationSettings, persistenceMode, setNotificationSettings } = useDemoSettings();

  const form = useForm<NotificationValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: notificationSettings,
  });

  useEffect(() => {
    form.reset(notificationSettings);
  }, [notificationSettings, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    await setNotificationSettings(values);
    toast.success("Konfigurasi notifikasi tersimpan.", {
      description:
        persistenceMode === "supabase"
          ? `Pengiriman ${values.digestFrequency.toLowerCase()} diperbarui dan disimpan ke Supabase.`
          : `Pengiriman ${values.digestFrequency.toLowerCase()} diperbarui untuk demo lokal ini.`,
    });
  });

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Pengaturan Telegram</CardTitle>
        <CardDescription>
          {persistenceMode === "supabase"
            ? "Atur alur notifikasi dan simpan konfigurasi langsung ke Supabase dari browser yang sudah login."
            : "Atur alur notifikasi untuk preview lokal. Perubahan disimpan di browser ini tanpa koneksi backend eksternal."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="form-row">
            <div>
              <p className="font-medium text-[var(--ink)]">Aktifkan Telegram</p>
              <p className="text-sm text-[var(--muted)]">Gunakan bot demo untuk broadcast status operasional.</p>
            </div>
            <Switch checked={form.watch("telegramEnabled")} onCheckedChange={(checked) => form.setValue("telegramEnabled", checked)} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
              <span>Bot Token</span>
              <Input {...form.register("botToken")} />
              {form.formState.errors.botToken ? <p className="text-sm text-[var(--coffee-700)]">{form.formState.errors.botToken.message}</p> : null}
            </label>

            <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
              <span>Chat ID</span>
              <Input {...form.register("chatId")} />
              {form.formState.errors.chatId ? <p className="text-sm text-[var(--coffee-700)]">{form.formState.errors.chatId.message}</p> : null}
            </label>
          </div>

          <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
            <span>Frekuensi ringkasan</span>
            <select
              {...form.register("digestFrequency")}
              className="flex h-12 w-full rounded-[var(--radius-soft)] border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--coffee-300)] focus:ring-2 focus:ring-[rgba(224,164,92,0.18)]"
            >
              <option value="Real-time">Real-time</option>
              <option value="Per 2 Jam">Per 2 Jam</option>
              <option value="Harian">Harian</option>
            </select>
          </label>

          <div className="grid gap-3">
            {[
              ["lowStockAlert", "Alert stok menipis", "Kirim saat item mendekati batas reorder."],
              ["cashierSummary", "Ringkasan penutupan kasir", "Laporan akhir shift otomatis ke owner."],
              ["refundAlert", "Alert refund", "Notifikasi khusus saat ada pembatalan atau retur."],
            ].map(([field, label, hint]) => (
              <div key={field} className="form-row">
                <div>
                  <p className="font-medium text-[var(--ink)]">{label}</p>
                  <p className="text-sm text-[var(--muted)]">{hint}</p>
                </div>
                <Switch
                  checked={Boolean(form.watch(field as keyof NotificationValues))}
                  onCheckedChange={(checked) => form.setValue(field as keyof NotificationValues, checked as never)}
                />
              </div>
            ))}
          </div>

          <Button type="submit">Simpan notifikasi</Button>
        </form>
      </CardContent>
    </Card>
  );
}
