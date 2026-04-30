import { LoginSuccessFeedback } from "@/components/auth/login-success-feedback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CurrentTimeDisplay } from "@/components/dashboard/current-time-display";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PopularItemsChart } from "@/components/dashboard/popular-items-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { getDashboardStats, getPopularItems, getRevenueSeries } from "@/lib/supabase/data";

export default async function DashboardPage() {
  const [dashboardStats, popularItems, revenueSeries] = await Promise.all([
    getDashboardStats(),
    getPopularItems(),
    getRevenueSeries(),
  ]);

  return (
    <>
      <LoginSuccessFeedback />
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
    </>
  );
}
