"use client";

import { CalendarDays, ChevronDown, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { KpiCard } from "@/components/dashboard/kpi-card";
import { PopularItemsChart } from "@/components/dashboard/popular-items-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { DashboardStat, PopularItem, RevenuePoint } from "@/lib/mock-data";
import type { DashboardOrderItemRow, DashboardOrderRow } from "@/lib/supabase/data";
import { cn } from "@/lib/utils";

type DatePreset = "today" | "yesterday" | "last7" | "thisMonth" | "custom";

const datePresetLabels: Record<DatePreset, string> = {
  today: "Hari Ini",
  yesterday: "Kemarin",
  last7: "7 Hari Terakhir",
  thisMonth: "Bulan Ini",
  custom: "Pilih Tanggal Kustom",
};

const datePresetDescriptions: Record<DatePreset, string> = {
  today: "Fokuskan KPI dan visual pada performa transaksi hari ini.",
  yesterday: "Bandingkan ritme operasional penuh dari hari kemarin.",
  last7: "Rentang default untuk membaca performa mingguan dashboard.",
  thisMonth: "Ringkas tren bulan berjalan untuk keputusan yang lebih taktis.",
  custom: "Pilih tanggal mulai dan akhir untuk menyelaraskan semua widget dashboard.",
};

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getDateButtonLabel(datePreset: DatePreset, customDateStart: string, customDateEnd: string) {
  if (datePreset !== "custom") {
    return datePresetLabels[datePreset];
  }

  if (customDateStart && customDateEnd) {
    return `${formatShortDate(customDateStart)} - ${formatShortDate(customDateEnd)}`;
  }

  if (customDateStart) {
    return `Dari ${formatShortDate(customDateStart)}`;
  }

  if (customDateEnd) {
    return `Sampai ${formatShortDate(customDateEnd)}`;
  }

  return "Tanggal kustom";
}

function isSameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

function formatCompactCurrency(value: number) {
  return `Rp ${new Intl.NumberFormat("id-ID").format(Math.round(value))}`;
}

function formatPercentDelta(current: number, previous: number) {
  if (previous <= 0) {
    return current > 0 ? "+100%" : "0%";
  }

  const delta = ((current - previous) / previous) * 100;
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
  return `${sign}${Math.abs(delta).toFixed(1).replace(/\.0$/, "")}%`;
}

function formatCountDelta(current: number, previous: number, suffix: string) {
  const delta = current - previous;
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
  return `${sign}${new Intl.NumberFormat("id-ID").format(Math.abs(delta))} ${suffix}`;
}

function getDateBounds(now: Date, datePreset: DatePreset, customDateStart: string, customDateEnd: string) {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  switch (datePreset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday":
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case "last7": {
      const start = startOfDay(new Date(now));
      start.setDate(start.getDate() - 6);
      return { start, end: endOfDay(now) };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfDay(start), end: endOfDay(now) };
    }
    case "custom": {
      const start = customDateStart ? startOfDay(new Date(customDateStart)) : null;
      const end = customDateEnd ? endOfDay(new Date(customDateEnd)) : null;
      return { start, end };
    }
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

export function DashboardOverviewClient({
  orders,
  items,
}: {
  orders: DashboardOrderRow[];
  items: DashboardOrderItemRow[];
}) {
  const [datePreset, setDatePreset] = useState<DatePreset>("last7");
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const dateMenuRef = useRef<HTMLDivElement | null>(null);

  const hasActiveFilters = datePreset !== "last7" || customDateStart !== "" || customDateEnd !== "";
  const dateButtonLabel = useMemo(() => getDateButtonLabel(datePreset, customDateStart, customDateEnd), [customDateEnd, customDateStart, datePreset]);
  const isCustomRangeInvalid = useMemo(() => {
    if (!customDateStart || !customDateEnd) {
      return false;
    }

    return new Date(customDateStart).getTime() > new Date(customDateEnd).getTime();
  }, [customDateEnd, customDateStart]);

  const filterSummary = useMemo(() => {
    if (datePreset === "custom") {
      if (isCustomRangeInvalid) {
        return {
          title: "Rentang kustom perlu dirapikan",
          description: "Tanggal akhir harus sama atau setelah tanggal mulai agar filter siap dipakai di semua widget.",
        };
      }

      if (customDateStart && customDateEnd) {
        return {
          title: `Periode ${formatShortDate(customDateStart)} - ${formatShortDate(customDateEnd)}`,
          description: "Pilihan rentang kustom siap menyelaraskan KPI, grafik pendapatan, dan menu terlaris.",
        };
      }

      if (customDateStart || customDateEnd) {
        return {
          title: "Lengkapi rentang tanggal kustom",
          description: "Tambahkan tanggal mulai dan akhir agar periode aktif dashboard terasa lebih presisi.",
        };
      }
    }

    return {
      title: datePresetLabels[datePreset],
      description: datePresetDescriptions[datePreset],
    };
  }, [customDateEnd, customDateStart, datePreset, isCustomRangeInvalid]);

  const filteredDashboardData = useMemo(() => {
    const now = new Date();
    const previousStart = startOfDay(new Date(now));
    previousStart.setDate(previousStart.getDate() - 13);
    const previousEnd = endOfDay(new Date(now));
    previousEnd.setDate(previousEnd.getDate() - 7);
    const { start, end } = getDateBounds(now, datePreset, customDateStart, customDateEnd);

    const matchRange = (createdAt: string, rangeStart: Date | null, rangeEnd: Date | null) => {
      const created = new Date(createdAt);

      if (Number.isNaN(created.getTime())) {
        return false;
      }

      if (rangeStart && created < rangeStart) {
        return false;
      }

      if (rangeEnd && created > rangeEnd) {
        return false;
      }

      return true;
    };

    const currentOrders = orders.filter((order) => matchRange(order.created_at, start, end));
    const previousOrders = orders.filter((order) => matchRange(order.created_at, previousStart, previousEnd));
    const currentOrderIds = new Set(currentOrders.map((order) => order.id));
    const previousOrderIds = new Set(previousOrders.map((order) => order.id));
    const currentItems = items.filter((item) => currentOrderIds.has(item.order_id));
    const previousItems = items.filter((item) => previousOrderIds.has(item.order_id));

    const currentRevenue = currentOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const currentAov = currentOrders.length ? currentRevenue / currentOrders.length : 0;
    const previousAov = previousOrders.length ? previousRevenue / previousOrders.length : 0;
    const currentItemsSold = currentItems.reduce((sum, item) => sum + item.quantity, 0);
    const previousItemsSold = previousItems.reduce((sum, item) => sum + item.quantity, 0);

    const dashboardStats: Array<DashboardStat & { sort_order?: number }> = [
      {
        title: "Total Pendapatan",
        value: formatCompactCurrency(currentRevenue),
        delta: formatPercentDelta(currentRevenue, previousRevenue),
        description: "dibanding 7 hari sebelumnya",
        icon: "wallet",
        sort_order: 1,
      },
      {
        title: "Pesanan Selesai",
        value: new Intl.NumberFormat("id-ID").format(currentOrders.length),
        delta: formatCountDelta(currentOrders.length, previousOrders.length, "order"),
        description: "dibanding 7 hari sebelumnya",
        icon: "badge-check",
        sort_order: 2,
      },
      {
        title: "AOV",
        value: formatCompactCurrency(currentAov),
        delta: formatPercentDelta(currentAov, previousAov),
        description: "dibanding 7 hari sebelumnya",
        icon: "receipt",
        sort_order: 3,
      },
      {
        title: "Total Item Terjual",
        value: new Intl.NumberFormat("id-ID").format(currentItemsSold),
        delta: formatCountDelta(currentItemsSold, previousItemsSold, "item"),
        description: "dibanding 7 hari sebelumnya",
        icon: "package",
        sort_order: 4,
      },
    ];

    const revenueByDay = new Map<string, number>();
    if (start && end) {
      const cursor = new Date(start);
      while (cursor <= end) {
        revenueByDay.set(startOfDay(cursor).toISOString(), 0);
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    for (const order of currentOrders) {
      const dayKey = startOfDay(new Date(order.created_at)).toISOString();
      revenueByDay.set(dayKey, (revenueByDay.get(dayKey) ?? 0) + order.total_amount);
    }

    const revenueSeries: RevenuePoint[] = Array.from(revenueByDay.entries()).map(([dayKey, revenue]) => ({
      day: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(new Date(dayKey)),
      revenue,
    }));

    const quantityByProduct = new Map<string, number>();
    for (const item of currentItems) {
      quantityByProduct.set(item.product_name, (quantityByProduct.get(item.product_name) ?? 0) + item.quantity);
    }

    const totalPopularQuantity = Array.from(quantityByProduct.values()).reduce((sum, quantity) => sum + quantity, 0);
    const popularItems: PopularItem[] = Array.from(quantityByProduct.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "id"))
      .slice(0, 5)
      .map(([name, orders]) => ({
        name,
        orders,
        share: totalPopularQuantity > 0 ? Math.round((orders / totalPopularQuantity) * 100) : 0,
      }));

    return { dashboardStats, revenueSeries, popularItems };
  }, [customDateEnd, customDateStart, datePreset, items, orders]);

  useEffect(() => {
    if (!dateMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!dateMenuRef.current) {
        return;
      }

      if (!dateMenuRef.current.contains(event.target as Node)) {
        setDateMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [dateMenuOpen]);

  return (
    <div className="space-y-2.5 md:space-y-3">
      <section className="relative overflow-visible rounded-[calc(var(--radius-soft)-0.05rem)] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,248,242,0.82))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_18px_34px_rgba(82,49,29,0.08)] sm:p-3.5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)_auto] lg:items-start">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[rgba(198,122,63,0.14)] bg-white/72 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--coffee-700)]">
                Filter Dashboard
              </span>
              <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.68)] px-2.5 py-1 text-[10px] font-medium text-[var(--muted)]">
                KPI • Grafik • Menu Terlaris
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--ink)] sm:text-[15px]">{filterSummary.title}</p>
              <p className="max-w-[42rem] text-[12px] leading-[1.25rem] text-[var(--muted)] sm:text-[12.5px]">
                {filterSummary.description}
              </p>
            </div>
          </div>

          <div ref={dateMenuRef} className="relative grid grid-rows-[auto_2.75rem] gap-1.5 text-[var(--ink)]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Periode Dashboard</span>
            <Button
              type="button"
              variant="outline"
              aria-haspopup="dialog"
              aria-expanded={dateMenuOpen}
              className={cn(
                "h-full w-full translate-y-0 justify-between rounded-[calc(var(--radius-soft)-0.1rem)] border px-4 text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-colors duration-200 hover:translate-y-0 active:translate-y-0",
                dateMenuOpen || datePreset === "custom"
                  ? "border-[rgba(198,122,63,0.24)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,246,237,0.94))] text-[var(--coffee-800)]"
                  : "border-[var(--line)] bg-white/90"
              )}
              onClick={() => setDateMenuOpen((current) => !current)}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full transition",
                    dateMenuOpen || datePreset === "custom"
                      ? "bg-[rgba(198,122,63,0.14)] text-[var(--coffee-700)]"
                      : "bg-[var(--surface-soft)] text-[var(--muted)]"
                  )}
                >
                  <CalendarDays className="size-4" />
                </span>
                <span className="truncate text-left text-sm font-medium">{dateButtonLabel}</span>
              </span>
              <ChevronDown className={cn("size-4 shrink-0 text-[var(--muted)] transition-transform", dateMenuOpen ? "rotate-180 text-[var(--coffee-700)]" : "")} />
            </Button>

            {dateMenuOpen ? (
              <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-y-auto rounded-[calc(var(--radius-panel)-0.2rem)] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,240,0.96))] p-2 shadow-[0_18px_34px_rgba(82,49,29,0.12),inset_0_1px_0_rgba(255,255,255,0.72)] sm:left-auto sm:w-[22rem] sm:max-w-[calc(100vw-3rem)]" style={{ maxHeight: "min(28rem, 70vh)" }}>
                <div className="space-y-0.5">
                  {(Object.keys(datePresetLabels) as DatePreset[]).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setDatePreset(preset);

                        if (preset !== "custom") {
                          setDateMenuOpen(false);
                        }
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-[calc(var(--radius-soft)-0.1rem)] border px-3 py-2.5 text-left transition",
                        datePreset === preset
                          ? "border-[rgba(198,122,63,0.22)] bg-[linear-gradient(180deg,rgba(255,252,249,1),rgba(255,243,232,0.96))] text-[var(--coffee-700)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
                          : "border-transparent bg-transparent text-[var(--ink)] hover:border-[rgba(198,122,63,0.12)] hover:bg-white/72"
                      )}
                    >
                      <span className="space-y-0.5">
                        <span className="block text-sm font-semibold">{datePresetLabels[preset]}</span>
                        <span className="block text-[11px] leading-4 text-[var(--muted)]">{datePresetDescriptions[preset]}</span>
                      </span>
                      <span
                        className={cn(
                          "mt-1 size-2.5 shrink-0 rounded-full transition",
                          datePreset === preset ? "bg-[var(--coffee-500)] shadow-[0_0_0_4px_rgba(198,122,63,0.12)]" : "bg-[var(--sand-200)]"
                        )}
                      />
                    </button>
                  ))}
                </div>

                {datePreset === "custom" ? (
                  <div className="mt-2 rounded-[calc(var(--radius-soft)-0.05rem)] border border-[rgba(198,122,63,0.18)] bg-[linear-gradient(180deg,rgba(255,252,248,1),rgba(255,241,228,0.95))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--coffee-600)]">Rentang Kustom</p>
                      <p className="text-sm leading-5 text-[var(--muted)]">Pilih periode yang ingin dipakai bersama di seluruh dashboard.</p>
                    </div>

                    <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                      <label className="space-y-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        <span>Mulai</span>
                        <Input
                          type="date"
                          value={customDateStart}
                          onChange={(event) => setCustomDateStart(event.target.value)}
                          className="h-11 rounded-[calc(var(--radius-soft)-0.12rem)] bg-white/92 shadow-none"
                        />
                      </label>
                      <label className="space-y-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        <span>Akhir</span>
                        <Input
                          type="date"
                          value={customDateEnd}
                          onChange={(event) => setCustomDateEnd(event.target.value)}
                          className="h-11 rounded-[calc(var(--radius-soft)-0.12rem)] bg-white/92 shadow-none"
                        />
                      </label>
                    </div>

                    <p className={cn("mt-2 text-[11px] leading-4", isCustomRangeInvalid ? "text-[var(--coffee-700)]" : "text-[var(--muted)]")}>
                      {isCustomRangeInvalid
                        ? "Tanggal akhir harus sama atau setelah tanggal mulai."
                        : "Rentang ini menjaga KPI, grafik pendapatan, dan menu terlaris tetap berada pada periode yang sama."}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Reset filter dashboard"
            title="Reset filter dashboard"
            className={cn(
              "h-11 w-11 shrink-0 self-start rounded-[calc(var(--radius-soft)-0.1rem)] border bg-white/88 text-[var(--muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] hover:text-[var(--coffee-700)] lg:mt-[1.55rem]",
              hasActiveFilters ? "border-[rgba(198,122,63,0.22)]" : "border-[var(--line)]"
            )}
            onClick={() => {
              setDatePreset("last7");
              setCustomDateStart("");
              setCustomDateEnd("");
              setDateMenuOpen(false);
            }}
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--coffee-700)]">Periode aktif untuk semua KPI</p>
          <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.72)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)]">
            {dateButtonLabel}
          </span>
        </div>

        <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
          {filteredDashboardData.dashboardStats.map((stat, index) => (
            <KpiCard
              key={
                "sort_order" in stat && typeof stat.sort_order === "number"
                  ? `dashboard-stat-${stat.sort_order}-${index}`
                  : `dashboard-stat-${stat.title}-${index}`
              }
              stat={stat}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.34fr)_minmax(20.5rem,0.86fr)] xl:items-stretch 2xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,0.82fr)]">
        <Card className="flex h-full min-h-[18.5rem] flex-col px-4 py-3 sm:min-h-[19.25rem] sm:px-5 sm:py-4 xl:min-h-[19.75rem]">
          <CardHeader className="flex flex-col gap-2 px-0 pb-2 sm:flex-row sm:items-start sm:justify-between sm:pb-2.5">
            <div className="space-y-1.5">
              <CardTitle>Grafik Pendapatan</CardTitle>
              <CardDescription className="max-w-[38rem] text-[12px] leading-[1.2rem] sm:text-[12.5px]">
                Area pendapatan dengan satu periode dashboard yang konsisten bersama KPI dan menu terlaris.
              </CardDescription>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full border border-[rgba(198,122,63,0.14)] bg-[rgba(255,250,246,0.88)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--coffee-700)]">
              {dateButtonLabel}
            </span>
          </CardHeader>
          <CardContent className="flex flex-1 items-stretch space-y-0 px-0 pb-0 pt-1">
            <RevenueChart data={filteredDashboardData.revenueSeries} />
          </CardContent>
        </Card>

        <Card className="flex h-full min-h-[18.5rem] w-full flex-col px-4 py-3 sm:min-h-[19.25rem] sm:px-5 sm:py-4 xl:min-h-[19.75rem]">
          <CardHeader className="flex flex-col gap-2 px-0 pb-2 sm:flex-row sm:items-start sm:justify-between sm:pb-2.5">
            <div className="space-y-1.5">
              <CardTitle>Menu Terlaris</CardTitle>
              <CardDescription className="text-[12px] leading-[1.2rem] sm:text-[12.5px]">
                Lima menu dengan kontribusi penjualan terbesar dalam periodisasi dashboard yang sama.
              </CardDescription>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-full border border-[rgba(198,122,63,0.14)] bg-[rgba(255,250,246,0.88)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--coffee-700)]">
              {dateButtonLabel}
            </span>
          </CardHeader>
          <CardContent className="flex flex-1 items-stretch space-y-0 px-0 pb-0 pt-1">
            <PopularItemsChart data={filteredDashboardData.popularItems} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
