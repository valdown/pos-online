"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { PopularItem } from "@/lib/mock-data";

const chartColors = ["var(--coffee-500)", "var(--coffee-400)", "var(--coffee-700)", "var(--sand-300)"];

export function PopularItemsChart({ data }: { data: PopularItem[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="share" nameKey="name" innerRadius={52} outerRadius={86} paddingAngle={4}>
              {data.map((item, index) => (
                <Cell key={item.name} fill={chartColors[index % chartColors.length]} />
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

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between gap-3 rounded-[var(--radius-soft)] bg-[var(--surface-soft)] px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: chartColors[index % chartColors.length] }}
                aria-hidden="true"
              />
              <div>
                <p className="font-medium text-[var(--ink)]">{item.name}</p>
                <p className="text-sm text-[var(--muted)]">{item.orders} item terjual</p>
              </div>
            </div>
            <p className="text-sm font-semibold text-[var(--coffee-700)]">{item.share}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
