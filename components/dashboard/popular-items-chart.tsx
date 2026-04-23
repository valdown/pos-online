"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { PopularItem } from "@/lib/mock-data";

const chartColors = ["var(--coffee-500)", "var(--coffee-400)", "var(--coffee-700)", "var(--sand-300)", "var(--coffee-300)"];
const samplePopularItems: PopularItem[] = [
  { name: "Caramel Macchiato", orders: 124, share: 31 },
  { name: "Beef Burger & Chips", orders: 96, share: 24 },
  { name: "Bumi Latte", orders: 82, share: 20 },
  { name: "Kapal Pesiar", orders: 58, share: 14 },
  { name: "Croissant Almond", orders: 44, share: 11 },
];

function getVisiblePopularItems(data: PopularItem[]) {
  const primaryItems = data.slice(0, 5);
  const visibleItems = [
    ...primaryItems,
    ...samplePopularItems.filter((sampleItem) => primaryItems.every((item) => item.name !== sampleItem.name)).slice(0, Math.max(0, 5 - primaryItems.length)),
  ].slice(0, 5);

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
    <div className="flex h-full w-full flex-col gap-1">
      <div className="grid w-full min-h-[92px] place-items-center sm:min-h-[100px]">
        <div className="mx-auto aspect-square w-full max-w-[116px] sm:max-w-[122px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie data={visibleItems} dataKey="share" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={46} paddingAngle={3}>
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

      <ul className="flex flex-col gap-0.75" role="list">
        {visibleItems.map((item, index) => (
            <li key={`${item.name}-${index}`} className="grid w-full grid-cols-[minmax(0,1fr)_2.7rem] items-start gap-x-2">
              <div className="flex min-w-0 items-start gap-1.75">
              <span
                className="mt-1 size-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: chartColors[index % chartColors.length] }}
                aria-hidden="true"
              />
              <div className="min-w-0 space-y-0.5">
                <p className="text-[0.84rem] font-medium leading-snug text-[var(--ink)] sm:text-[0.88rem]">{item.name}</p>
                <p className="text-[10px] leading-snug text-[var(--muted)] sm:text-[0.75rem]">{item.orders} item terjual</p>
              </div>
            </div>
            <p className="pt-0.5 text-right text-[10px] font-semibold tabular-nums text-[var(--coffee-700)] sm:text-[0.75rem]">{item.share}%</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
