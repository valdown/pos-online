import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrentTimeDisplay } from "@/components/dashboard/current-time-display";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PopularItemsChart } from "@/components/dashboard/popular-items-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { getCashierSnapshot, getDashboardStats, getNotificationFeed, getPopularItems, getProducts, getRevenueSeries } from "@/lib/supabase/data";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const [cashierSnapshot, dashboardStats, notificationsFeed, popularItems, products, revenueSeries] = await Promise.all([
    getCashierSnapshot(),
    getDashboardStats(),
    getNotificationFeed(),
    getPopularItems(),
    getProducts(),
    getRevenueSeries(),
  ]);

  const lowStockItems = products.filter((product) => product.status === "Hampir Habis");

  return (
    <>
      <PageHeader
        eyebrow="Coffee operations"
        title="Dashboard"
        description="Ringkasan performa harian dengan visual hangat dan keputusan operasional yang cepat dibaca."
        actions={<CurrentTimeDisplay />}
      />

      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <KpiCard key={stat.title} stat={stat} />
        ))}
      </section>

      <section className="grid gap-6 2xl:grid-cols-[1.45fr_0.95fr]">
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Grafik Pendapatan</CardTitle>
            <CardDescription>Pergerakan omzet tujuh hari terakhir, dipuncaki traffic akhir pekan.</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={revenueSeries} />
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle>Menu Terlaris</CardTitle>
            <CardDescription>Kontributor transaksi terbesar untuk kombo minuman dan makanan.</CardDescription>
          </CardHeader>
          <CardContent>
            <PopularItemsChart data={popularItems} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Update Operasional</CardTitle>
            <CardDescription>Feed status yang perlu dipantau manajemen sepanjang shift berjalan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notificationsFeed.map((item) => (
                <div key={item.id} className="rounded-[var(--radius-soft)] bg-[var(--surface-soft)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--ink)]">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.message}</p>
                    </div>
                    <Badge variant={item.tone === "success" ? "success" : item.tone === "warning" ? "warning" : "neutral"}>
                      {item.channel}
                    </Badge>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">{item.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader>
            <CardTitle>Prioritas Shift</CardTitle>
            <CardDescription>Checklist cepat untuk memastikan kualitas layanan tetap stabil.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[var(--radius-soft)] bg-[linear-gradient(135deg,rgba(255,248,242,0.92),rgba(239,222,203,0.88))] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Counter utama</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{cashierSnapshot.highlightedTable}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">Pastikan refill cup, lid, dan receipt roll tersedia untuk jam sibuk sore.</p>
              </div>
              <div className="rounded-[var(--radius-soft)] bg-[rgba(255,255,255,0.7)] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Stok kritis</p>
                <div className="mt-4 space-y-3">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <span className="font-medium text-[var(--ink)]">{item.name}</span>
                      <span className="text-sm text-[var(--coffee-700)]">{item.stock} tersisa</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[var(--radius-soft)] border border-[var(--line)] bg-white/70 p-5 md:col-span-2 xl:col-span-1">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Target hari ini</p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{formatCurrency(22000000)}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">Masih tersisa {formatCurrency(3580000)} untuk menutup target omzet harian.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
