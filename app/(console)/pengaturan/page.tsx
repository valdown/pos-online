"use client";

import { CurrentTimeDisplay } from "@/components/dashboard/current-time-display";
import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MenuCategorySettingsForm } from "@/components/forms/menu-category-settings-form";
import { PaymentMethodSettingsForm } from "@/components/forms/payment-method-settings-form";
import { RoleSettingsForm } from "@/components/forms/role-settings-form";
import { useSettings } from "@/components/providers/settings";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppSettingsForm } from "@/components/forms/app-settings-form";
import { formatCurrency } from "@/lib/utils";

export default function SettingsPage() {
  const { appSettings } = useSettings();
  const [activeTab, setActiveTab] = useState("app-config");

  return (
    <>
      <PageHeader
        eyebrow="Store controls"
        title="Pengaturan"
        description="Konfigurasi identitas toko, tax, bank, dan kebijakan struk dalam struktur form yang rapi dan mudah dipelihara."
        actions={<CurrentTimeDisplay />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-0">
        <TabsList>
          <TabsTrigger value="app-config">Konfigurasi Aplikasi</TabsTrigger>
          <TabsTrigger value="payment-methods">Konfigurasi Metode Pembayaran</TabsTrigger>
          <TabsTrigger value="menu-categories">Konfigurasi Kategori Menu</TabsTrigger>
          <TabsTrigger value="role-config">Konfigurasi Role</TabsTrigger>
        </TabsList>

        <TabsContent value="app-config">
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
        </TabsContent>

        <TabsContent value="payment-methods">
          <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
            <PaymentMethodSettingsForm />

            <Card className="p-6">
              <CardHeader>
                <CardTitle>Preview metode aktif</CardTitle>
                <CardDescription>Metode yang aktif di sini akan langsung dipakai di panel kasir.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {appSettings.paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between gap-4 rounded-[var(--radius-soft)] bg-[var(--surface-soft)] px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--ink)]">{method.label}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{method.id}</p>
                      </div>
                      <span className="text-sm font-semibold text-[var(--coffee-700)]">{method.enabled ? "Aktif" : "Nonaktif"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="menu-categories">
          <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <MenuCategorySettingsForm />

            <Card className="p-6">
              <CardHeader>
                <CardTitle>Preview kategori aktif</CardTitle>
                <CardDescription>Kategori yang aktif di sini akan dipakai sebagai pilihan utama saat menambah atau mengedit menu.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {appSettings.menuCategories.map((category) => (
                    <div key={category} className="rounded-[var(--radius-soft)] bg-[var(--surface-soft)] px-4 py-3">
                      <p className="text-sm font-semibold text-[var(--ink)]">{category}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="role-config">
          <RoleSettingsForm />
        </TabsContent>
      </Tabs>
    </>
  );
}
