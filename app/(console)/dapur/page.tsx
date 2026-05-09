import { redirect } from "next/navigation";

import { CurrentTimeDisplay } from "@/components/dashboard/current-time-display";
import { KitchenBoardClient } from "@/components/dapur/kitchen-board-client";
import { PageHeader } from "@/components/ui/page-header";
import { getFirstAccessibleMenuHref, hasMenuAccess } from "@/lib/internal-permissions";
import { getCurrentPermissionUser } from "@/lib/server/internal-guards";
import { getKitchenBoardData } from "@/lib/supabase/data";

export default async function DapurPage() {
  const currentUser = await getCurrentPermissionUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (!hasMenuAccess(currentUser, "dapur", "read")) {
    redirect(getFirstAccessibleMenuHref(currentUser));
  }

  const orders = await getKitchenBoardData();

  return (
    <>
      <PageHeader
        eyebrow="Kitchen operations"
        title="Board Dapur"
        description="Pantau antrean pesanan masuk, proses masak, dan order yang sudah selesai dari satu board operasional."
        actions={<CurrentTimeDisplay />}
      />

      <KitchenBoardClient initialOrders={orders} />
    </>
  );
}
