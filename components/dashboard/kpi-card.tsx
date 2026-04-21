import { BadgeCheck, Package, ReceiptText, Wallet } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { DashboardStat } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const iconMap = {
  wallet: Wallet,
  "badge-check": BadgeCheck,
  receipt: ReceiptText,
  package: Package,
} as const;

function splitStatValue(value: string) {
  if (!value.startsWith("Rp ")) {
    return {
      prefix: null,
      amount: value,
    };
  }

  return {
    prefix: "Rp",
    amount: value.slice(3),
  };
}

export function KpiCard({ stat }: { stat: DashboardStat }) {
  const Icon = iconMap[stat.icon];
  const { prefix, amount } = splitStatValue(stat.value);

  return (
    <Card className="metric-card h-full min-h-[176px] p-5 sm:min-h-[188px] sm:p-6">
      <div className="flex h-full items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col self-stretch">
          <div className="flex items-center gap-2.5">
            <span className="size-1.5 rounded-full bg-[var(--coffee-500)]" aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase leading-none tracking-[0.28em] text-[var(--coffee-700)]">{stat.title}</p>
          </div>

          <div className="mt-auto flex min-h-[3.75rem] items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-end gap-x-1.5 gap-y-1">
                {prefix ? (
                  <span className="pb-0.5 text-xs font-semibold uppercase leading-none tracking-[0.18em] text-[var(--coffee-700)] sm:text-sm">
                    {prefix}
                  </span>
                ) : null}
                <p
                  className={cn(
                    "font-semibold leading-none text-[var(--ink)] tabular-nums",
                    prefix ? "text-[2rem] tracking-[-0.04em] sm:text-[2.2rem]" : "text-[2.15rem] tracking-[-0.045em] sm:text-[2.35rem]"
                  )}
                >
                  {amount}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-soft)] border border-[var(--line)] bg-white/72 text-[var(--coffee-700)] shadow-[0_12px_24px_rgba(82,49,29,0.08)]">
          <Icon className="size-[1.15rem]" strokeWidth={1.8} />
        </div>
      </div>
    </Card>
  );
}
