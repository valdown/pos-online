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
    <Card className="metric-card h-full min-h-[120px] p-3 sm:min-h-[128px] sm:p-3.5">
      <div className="flex h-full items-center gap-2">
        <div className="flex min-w-0 flex-1">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex min-h-[1.35rem] max-w-[11ch] items-end sm:min-h-[1.5rem]">
              <p className="text-balance text-[9.5px] font-semibold uppercase leading-[1.15] tracking-[0.22em] text-[var(--coffee-700)] sm:text-[10px]">
                {stat.title}
              </p>
            </div>

            <div className="min-w-0">
              <p
                className={cn(
                  "flex min-w-0 items-baseline font-semibold leading-none text-[var(--ink)] tabular-nums",
                  prefix ? "gap-1 text-[1.42rem] tracking-[-0.038em] sm:text-[1.56rem]" : "text-[1.46rem] tracking-[-0.04em] sm:text-[1.6rem]"
                )}
              >
                {prefix ? (
                  <span className="shrink-0 text-[0.5em] font-semibold uppercase tracking-[0.14em] text-[var(--coffee-700)]">
                    {prefix}
                  </span>
                ) : null}
                <span className="truncate">{amount}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-soft)] border border-[var(--line)] bg-white/72 text-[var(--coffee-700)] shadow-[0_10px_22px_rgba(82,49,29,0.08)] sm:size-10">
          <Icon className="size-4 sm:size-[1.05rem]" strokeWidth={1.8} />
        </div>
      </div>
    </Card>
  );
}
