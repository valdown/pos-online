"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { RevenuePoint } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={10}>
          <CartesianGrid vertical={false} stroke="rgba(126, 102, 82, 0.12)" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
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
          <Bar dataKey="revenue" fill="var(--coffee-500)" radius={[16, 16, 8, 8]} maxBarSize={42} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
