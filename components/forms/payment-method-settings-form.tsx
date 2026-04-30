"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, QrCode, Wallet } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLoadingOverlay } from "@/components/providers/loading-overlay";
import { useSettings } from "@/components/providers/settings";
import { Switch } from "@/components/ui/switch";
import type { PaymentMethodId } from "@/lib/payment-methods";

const paymentMethodSchema = z.object({
  id: z.enum(["cash", "debit", "qris"]),
  label: z.string().min(1, "Label wajib diisi."),
  enabled: z.boolean(),
});

const paymentMethodsSchema = z
  .object({
    paymentMethods: z.array(paymentMethodSchema).length(3),
  })
  .refine((value) => value.paymentMethods.some((item) => item.enabled), {
    message: "Minimal satu metode pembayaran harus aktif.",
    path: ["paymentMethods"],
  });

type PaymentMethodsValues = z.infer<typeof paymentMethodsSchema>;

const methodMeta: Record<PaymentMethodId, { title: string; description: string; icon: typeof Wallet }> = {
  cash: { title: "Tunai", description: "Pembayaran langsung di kasir.", icon: Wallet },
  debit: { title: "Debit", description: "Kartu debit / EDC counter.", icon: CreditCard },
  qris: { title: "QRIS", description: "Pembayaran scan QR.", icon: QrCode },
};

export function PaymentMethodSettingsForm() {
  const { appSettings, persistenceMode, setAppSettings } = useSettings();
  const { startLoading, stopLoading } = useLoadingOverlay();

  const form = useForm<PaymentMethodsValues>({
    resolver: zodResolver(paymentMethodsSchema),
    defaultValues: {
      paymentMethods: appSettings.paymentMethods,
    },
  });

  useEffect(() => {
    form.reset({ paymentMethods: appSettings.paymentMethods });
  }, [appSettings.paymentMethods, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    startLoading();
    try {
      await setAppSettings({ ...appSettings, paymentMethods: values.paymentMethods });
      await stopLoading();
      toast.success("Metode pembayaran diperbarui.", {
        description:
          persistenceMode === "supabase"
            ? "Konfigurasi metode pembayaran tersimpan ke Supabase."
            : persistenceMode === "supabase-fallback"
              ? "Supabase sedang fallback, jadi perubahan disimpan lokal untuk sementara."
              : "Konfigurasi metode pembayaran disimpan lokal di browser ini.",
      });
    } catch (error) {
      await stopLoading();
      toast.error("Metode pembayaran gagal disimpan.", {
        description: error instanceof Error ? error.message : "Periksa koneksi Supabase dan schema app_settings.",
      });
    }
  });

  const formValues = form.watch("paymentMethods");

  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>Konfigurasi metode pembayaran</CardTitle>
        <CardDescription>Kelola label tampilan dan aktif/nonaktif untuk Tunai, Debit, dan QRIS di kasir.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          {formValues.map((method, index) => {
            const meta = methodMeta[method.id];
            const Icon = meta.icon;

            return (
              <div key={method.id} className="rounded-[var(--radius-soft)] border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 items-center justify-center rounded-[var(--radius-soft)] bg-white text-[var(--coffee-700)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                      <Icon className="size-4.5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-[var(--ink)]">{meta.title}</p>
                      <p className="text-sm text-[var(--muted)]">{meta.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={method.enabled}
                    onCheckedChange={(checked) => form.setValue(`paymentMethods.${index}.enabled`, checked, { shouldValidate: true, shouldDirty: true })}
                  />
                </div>

                <div className="mt-4">
                  <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
                    <span>Label tampilan</span>
                    <Input {...form.register(`paymentMethods.${index}.label`)} />
                  </label>
                </div>
              </div>
            );
          })}

          {form.formState.errors.paymentMethods?.message ? <p className="text-sm font-medium text-[var(--coffee-700)]">{form.formState.errors.paymentMethods.message}</p> : null}

          <Button type="submit" disabled={form.formState.isSubmitting}>Simpan metode pembayaran</Button>
        </form>
      </CardContent>
    </Card>
  );
}
