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

  const lowStockItems = products.filter((product) => product.isActive && product.stock <= 10);

  return (
    <>
      <div className="space-y-2 md:space-y-2.5 xl:space-y-2.5">
        <PageHeader
          compact
          eyebrow="Coffee operations"
          title="Dashboard"
          description="Ringkasan performa harian dengan visual hangat dan keputusan operasional yang cepat dibaca."
          actions={<CurrentTimeDisplay />}
        />

        <section className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {dashboardStats.map((stat, index) => (
            <KpiCard
              key={
                "sort_order" in stat && typeof stat.sort_order === "number"
                  ? `dashboard-stat-${stat.sort_order}-${index}`
                  : `dashboard-stat-${stat.title}-${index}`
              }
              stat={stat}
            />
          ))}
        </section>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1.34fr)_minmax(20.5rem,0.86fr)] xl:items-stretch 2xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,0.82fr)]">
          <Card className="flex h-full min-h-[18.5rem] flex-col px-4 py-3 sm:min-h-[19.25rem] sm:px-5 sm:py-4 xl:min-h-[19.75rem]">
            <CardHeader className="space-y-1.5 px-0 pb-2 sm:pb-2.5">
              <CardTitle>Grafik Pendapatan</CardTitle>
              <CardDescription className="max-w-[38rem] text-[12px] leading-[1.2rem] sm:text-[12.5px]">Pergerakan omzet tujuh hari terakhir untuk membaca ritme penjualan harian dengan lebih cepat.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 items-stretch space-y-0 px-0 pb-0 pt-1">
              <RevenueChart data={revenueSeries} />
            </CardContent>
          </Card>

          <Card className="flex h-full min-h-[18.5rem] w-full flex-col px-4 py-3 sm:min-h-[19.25rem] sm:px-5 sm:py-4 xl:min-h-[19.75rem]">
            <CardHeader className="space-y-1.5 px-0 pb-2 sm:pb-2.5">
              <CardTitle>Menu Terlaris</CardTitle>
              <CardDescription className="text-[12px] leading-[1.2rem] sm:text-[12.5px]">Lima menu dengan kontribusi penjualan terbesar pada periode aktif.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 items-stretch space-y-0 px-0 pb-0 pt-1">
              <PopularItemsChart data={popularItems} />
            </CardContent>
          </Card>
        </section>
      </div>

      <section className="hidden grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
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
