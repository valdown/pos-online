import { BadgeCheck, Package, ReceiptText, Wallet } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { DashboardStat } from "@/lib/mock-data";

const iconMap = {
  wallet: Wallet,
  "badge-check": BadgeCheck,
  receipt: ReceiptText,
  package: Package,
} as const;

export function KpiCard({ stat }: { stat: DashboardStat }) {
  const Icon = iconMap[stat.icon];

  return (
    <Card className="metric-card relative overflow-hidden p-5">
      <div className="absolute right-[-18px] top-[-16px] size-28 rounded-full bg-[radial-gradient(circle,rgba(236,214,189,0.45),rgba(236,214,189,0))]" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">{stat.title}</p>
            <p className="text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">{stat.value}</p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-[1.1rem] bg-[rgba(198,122,63,0.14)] text-[var(--coffee-700)]">
            <Icon className="size-5" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--success)]">{stat.delta}</p>
          <p className="text-sm text-[var(--muted)]">{stat.description}</p>
        </div>
      </div>
    </Card>
  );
}
