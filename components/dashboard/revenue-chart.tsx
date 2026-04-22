"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { RevenuePoint } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-full min-h-[156px] w-full xl:min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} margin={{ top: 0, right: 2, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke="rgba(126, 102, 82, 0.12)" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 8.5 }} tickMargin={3} />
          <YAxis
            axisLine={false}
            tickLine={false}
            width={26}
            tick={{ fill: "var(--muted)", fontSize: 8.5 }}
            tickFormatter={(value: number) => `${Math.round(value / 1000000)} jt`}
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
          <Bar dataKey="revenue" fill="var(--coffee-500)" radius={[9, 9, 4, 4]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
