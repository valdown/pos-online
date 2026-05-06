"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { PopularItem } from "@/lib/mock-data";

const chartColors = ["var(--coffee-500)", "var(--coffee-400)", "var(--coffee-700)", "var(--sand-300)", "var(--coffee-300)"];

function getVisiblePopularItems(data: PopularItem[]) {
  const visibleItems = data.slice(0, 5);

  if (visibleItems.length === 0) {
    return visibleItems;
  }

  const totalOrders = visibleItems.reduce((sum, item) => sum + item.orders, 0);

  if (totalOrders <= 0) {
    return visibleItems;
  }

  const normalizedItems = visibleItems.map((item) => ({
    ...item,
    share: Math.max(1, Math.round((item.orders / totalOrders) * 100)),
  }));
  const shareDelta = 100 - normalizedItems.reduce((sum, item) => sum + item.share, 0);

  if (shareDelta !== 0) {
    normalizedItems[0] = {
      ...normalizedItems[0],
      share: normalizedItems[0].share + shareDelta,
    };
  }

  return normalizedItems;
}

export function PopularItemsChart({ data }: { data: PopularItem[] }) {
  const visibleItems = getVisiblePopularItems(data);

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="grid w-full min-h-[128px] place-items-center sm:min-h-[136px] xl:min-h-[144px]">
        <div className="mx-auto aspect-square w-full max-w-[132px] sm:max-w-[142px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie data={visibleItems} dataKey="share" nameKey="name" cx="50%" cy="50%" innerRadius={34} outerRadius={54} paddingAngle={2.5} strokeWidth={0}>
                {visibleItems.map((item, index) => (
                  <Cell key={`${item.name}-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 18,
                  border: "1px solid var(--line)",
                  backgroundColor: "rgba(255,250,246,0.98)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ul className="flex flex-col gap-0.5 pt-0.5" role="list">
        {visibleItems.map((item, index) => (
          <li key={`${item.name}-${index}`} className="grid w-full grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-x-3 border-t border-[rgba(126,102,82,0.12)] py-2 first:border-t-0 first:pt-0 last:pb-0">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: chartColors[index % chartColors.length] }}
                aria-hidden="true"
              />
              <div className="min-w-0 space-y-0.5">
                <p className="text-[0.92rem] font-medium leading-[1.2rem] text-[var(--ink)]">{item.name}</p>
                <p className="text-[11px] leading-[1rem] text-[var(--muted)]">{item.share}% kontribusi</p>
              </div>
            </div>
            <p className="text-right text-[1.05rem] font-semibold tabular-nums text-[var(--coffee-700)]">{item.orders}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
