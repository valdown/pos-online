"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "@/components/providers/settings";
import { PageHeader } from "@/components/ui/page-header";
import { AppSettingsForm } from "@/components/forms/app-settings-form";
import { formatCurrency } from "@/lib/utils";

export default function SettingsPage() {
  const { appSettings, persistenceMode } = useSettings();

  return (
    <>
      <PageHeader
        eyebrow="Store controls"
        title="Pengaturan"
        description="Konfigurasi identitas toko, tax, bank, dan kebijakan struk dalam struktur form yang rapi dan mudah dipelihara."
        actions={<Badge variant="neutral">{persistenceMode === "supabase" ? "Supabase tersambung" : persistenceMode === "supabase-fallback" ? "Fallback lokal aktif" : "Cabang aktif 1"}</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[1.14fr_0.86fr]">
        <AppSettingsForm />

        <Card className="p-6">
          <CardHeader>
            <CardTitle>Ringkasan konfigurasi</CardTitle>
            <CardDescription>Snapshot cepat untuk operator sebelum membuka atau menutup shift kasir.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                ["Nama toko", appSettings.storeName],
                ["Cabang", appSettings.branchName],
                ["Pajak", `${appSettings.taxRate}%`],
                ["Service fee", `${appSettings.serviceFee}%`],
                ["Modal kas", formatCurrency(appSettings.openingCash)],
                ["Settlement", `${appSettings.bankName} • ${appSettings.bankAccountNumber}`],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-[var(--radius-soft)] bg-[var(--surface-soft)] px-4 py-3">
                  <span className="text-sm text-[var(--muted)]">{label}</span>
                  <span className="text-sm font-semibold text-[var(--ink)]">{value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
