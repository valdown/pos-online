"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { RevenuePoint } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

function formatRevenueTick(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")} jt`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)} rb`;
  }

  return new Intl.NumberFormat("id-ID").format(value);
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-full min-h-[188px] w-full sm:min-h-[202px] xl:min-h-[216px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="24%" barGap={6} margin={{ top: 10, right: 6, bottom: 6, left: 10 }}>
          <CartesianGrid vertical={true} stroke="rgba(126, 102, 82, 0.1)" strokeDasharray="3 5" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10.5 }} tickMargin={10} />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={64}
            tick={{ fill: "var(--muted)", fontSize: 10.5 }}
            tickMargin={6}
            tickFormatter={formatRevenueTick}
          />
          <Tooltip
            cursor={{ fill: "rgba(198,122,63,0.08)" }}
            contentStyle={{
              borderRadius: 18,
              border: "1px solid var(--line)",
              backgroundColor: "rgba(255,250,246,0.98)",
            }}
            formatter={(value: number) => [formatCurrency(value), "Pendapatan"]}
          />
          <Bar dataKey="revenue" fill="rgba(180,114,60,0.88)" radius={[10, 10, 4, 4]} maxBarSize={38} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
