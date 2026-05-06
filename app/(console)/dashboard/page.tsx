import { CurrentTimeDisplay } from "@/components/dashboard/current-time-display";
import { DashboardOverviewClient } from "@/components/dashboard/dashboard-overview-client";
import { PageHeader } from "@/components/ui/page-header";
import { getDashboardOverviewData } from "@/lib/supabase/data";

export default async function DashboardPage() {
  const { orders, items } = await getDashboardOverviewData();

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

        <DashboardOverviewClient orders={orders} items={items} />
      </div>
    </>
  );
}
