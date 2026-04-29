"use client";

import { CalendarDays, ChevronDown, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CurrentTimeDisplay } from "@/components/dashboard/current-time-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import type { CashierInvoice } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";

type DatePreset = "today" | "yesterday" | "last7" | "thisMonth" | "custom";

const datePresetLabels: Record<DatePreset, string> = {
  today: "Hari Ini",
  yesterday: "Kemarin",
  last7: "7 Hari Terakhir",
  thisMonth: "Bulan Ini",
  custom: "Pilih Tanggal Kustom",
};

const datePresetDescriptions: Record<DatePreset, string> = {
  today: "Transaksi yang masuk sejak pagi ini.",
  yesterday: "Invoice yang dibuat sepanjang hari kemarin.",
  last7: "Ringkasan invoice dari tujuh hari terakhir.",
  thisMonth: "Semua transaksi aktif dalam bulan berjalan.",
  custom: "Atur sendiri tanggal mulai dan akhir periode.",
};

function formatInvoiceDate(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatMenuNames(invoice: CashierInvoice) {
  return invoice.items.map((item) => item.productName).join(", ");
}

function getTotalQuantity(invoice: CashierInvoice) {
  return invoice.items.reduce((sum, item) => sum + item.quantity, 0);
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

export function InvoiceKasirClient({ invoices }: { invoices: CashierInvoice[] }) {
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [dateMenuOpen, setDateMenuOpen] = useState(false);
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const dateMenuRef = useRef<HTMLDivElement | null>(null);

  const paymentMethodOptions = useMemo(() => {
    return Array.from(new Set(invoices.map((invoice) => invoice.paymentMethod)));
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    return invoices.filter((invoice) => {
      if (paymentMethodFilter !== "all" && invoice.paymentMethod !== paymentMethodFilter) {
        return false;
      }

      const createdAt = new Date(invoice.createdAt);

      switch (datePreset) {
        case "today":
          return isSameLocalDay(createdAt, now);
        case "yesterday":
          return isSameLocalDay(createdAt, yesterday);
        case "last7": {
          const start = startOfDay(new Date(now));
          start.setDate(start.getDate() - 6);
          return createdAt >= start && createdAt <= endOfDay(now);
        }
        case "thisMonth":
          return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
        case "custom": {
          const start = customDateStart ? startOfDay(new Date(customDateStart)) : null;
          const end = customDateEnd ? endOfDay(new Date(customDateEnd)) : null;

          if (start && createdAt < start) {
            return false;
          }

          if (end && createdAt > end) {
            return false;
          }

          return true;
        }
        default:
          return true;
      }
    });
  }, [customDateEnd, customDateStart, datePreset, invoices, paymentMethodFilter]);

  const totalTransactions = filteredInvoices.length;
  const totalRevenue = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const hasActiveFilters = paymentMethodFilter !== "all" || datePreset !== "today" || customDateStart !== "" || customDateEnd !== "";
  const dateButtonLabel =
    datePreset !== "custom"
      ? datePresetLabels[datePreset]
      : customDateStart && customDateEnd
        ? `${formatShortDate(customDateStart)} - ${formatShortDate(customDateEnd)}`
        : customDateStart
          ? `Dari ${formatShortDate(customDateStart)}`
          : customDateEnd
            ? `Sampai ${formatShortDate(customDateEnd)}`
            : "Tanggal kustom";

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
    <>
      <PageHeader
        eyebrow="Cashier receipts"
        title="Invoice Kasir"
        description="Rekap hasil transaksi dari POS Kasir. Tiap checkout yang selesai akan masuk ke daftar invoice ini."
        actions={<CurrentTimeDisplay />}
      />

      <Card className="p-6">
        <CardHeader>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>Riwayat invoice kasir</CardTitle>
              <CardDescription>Grid clean-room yang menampilkan ID transaksi, waktu, menu, jumlah item, subtotal, pajak, total, dan nama kasir.</CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="accent">{totalTransactions} transaksi</Badge>
              <Badge variant="neutral">{formatCurrency(totalRevenue)}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="relative overflow-visible rounded-[calc(var(--radius-soft)-0.05rem)] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,248,242,0.82))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_18px_34px_rgba(82,49,29,0.08)]">
            <div className="grid gap-3 md:min-h-[4.6rem] md:grid-cols-[minmax(0,1fr)_minmax(18rem,1fr)_auto] md:items-start">
              <label className="grid grid-rows-[auto_2.75rem] gap-1.5 text-[var(--ink)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Metode Pembayaran</span>
                <div className="relative">
                  <select
                    value={paymentMethodFilter}
                    onChange={(event) => setPaymentMethodFilter(event.target.value)}
                    className={cn(
                      "h-full w-full appearance-none rounded-[calc(var(--radius-soft)-0.1rem)] border bg-white/90 pl-4 pr-10 text-sm font-medium text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none transition focus:border-[var(--coffee-300)] focus:ring-2 focus:ring-[rgba(224,164,92,0.18)]",
                      paymentMethodFilter === "all"
                        ? "border-[var(--line)]"
                        : "border-[rgba(198,122,63,0.22)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,239,0.95))] text-[var(--coffee-800)]"
                    )}
                  >
                    <option value="all">Semua metode</option>
                    {paymentMethodOptions.map((method) => (
                      <option key={method} value={method}>
                        {method.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
                </div>
              </label>

              <div ref={dateMenuRef} className="relative grid grid-rows-[auto_2.75rem] gap-1.5 text-[var(--ink)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Tanggal Pemesanan</span>
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
                  <div className="absolute left-0 top-full z-20 mt-2 w-full min-w-[17.5rem] rounded-[calc(var(--radius-panel)-0.2rem)] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,247,240,0.96))] p-2 shadow-[0_18px_34px_rgba(82,49,29,0.12),inset_0_1px_0_rgba(255,255,255,0.72)]">
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
                              {preset === "custom" ? <span className="block text-[11px] leading-4 text-[var(--muted)]">{datePresetDescriptions[preset]}</span> : null}
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
                          <p className="text-sm leading-5 text-[var(--muted)]">Pilih periode invoice lalu terapkan.</p>
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

                        </div>
                      ) : null}
                  </div>
                ) : null}
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Reset filter invoice"
                title="Reset filter invoice"
                className={cn(
                  "h-11 w-11 shrink-0 self-start rounded-[calc(var(--radius-soft)-0.1rem)] border bg-white/88 text-[var(--muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] hover:text-[var(--coffee-700)] md:mt-[1.55rem]",
                  hasActiveFilters ? "border-[rgba(198,122,63,0.22)]" : "border-[var(--line)]"
                )}
                onClick={() => {
                  setPaymentMethodFilter("all");
                  setDatePreset("today");
                  setCustomDateStart("");
                  setCustomDateEnd("");
                  setDateMenuOpen(false);
                }}
              >
                <RotateCcw className="size-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-[11px] tracking-[0.14em] text-[var(--coffee-700)]">
                  <th className="rounded-l-[calc(var(--radius-soft)-0.35rem)] bg-[rgba(255,248,242,0.86)] px-4 py-3 text-left font-semibold whitespace-nowrap shadow-[inset_0_-1px_0_var(--line)]">ID Transaksi</th>
                  <th className="bg-[rgba(255,248,242,0.86)] px-4 py-3 text-left font-semibold whitespace-nowrap shadow-[inset_0_-1px_0_var(--line)]">Tanggal & Jam</th>
                  <th className="bg-[rgba(255,248,242,0.86)] px-4 py-3 text-left font-semibold whitespace-nowrap shadow-[inset_0_-1px_0_var(--line)]">Nama Menu</th>
                  <th className="bg-[rgba(255,248,242,0.86)] px-4 py-3 text-right font-semibold whitespace-nowrap shadow-[inset_0_-1px_0_var(--line)]">Jumlah</th>
                  <th className="bg-[rgba(255,248,242,0.86)] px-4 py-3 text-right font-semibold whitespace-nowrap shadow-[inset_0_-1px_0_var(--line)]">Harga</th>
                  <th className="bg-[rgba(255,248,242,0.86)] px-4 py-3 text-right font-semibold whitespace-nowrap shadow-[inset_0_-1px_0_var(--line)]">Pajak</th>
                  <th className="bg-[rgba(255,248,242,0.86)] px-4 py-3 text-right font-semibold whitespace-nowrap shadow-[inset_0_-1px_0_var(--line)]">Total Harga</th>
                  <th className="rounded-r-[calc(var(--radius-soft)-0.35rem)] bg-[rgba(255,248,242,0.86)] px-4 py-3 text-left font-semibold whitespace-nowrap shadow-[inset_0_-1px_0_var(--line)]">Nama Kasir</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length ? (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="overflow-hidden rounded-[var(--radius-soft)] bg-[rgba(255,255,255,0.72)] shadow-[inset_0_0_0_1px_var(--line)]">
                      <td className="rounded-l-[var(--radius-soft)] px-4 py-4 align-top">
                        <p className="font-semibold text-[var(--ink)]">{invoice.orderNumber}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{invoice.paymentMethod}</p>
                      </td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap text-[var(--muted)]">{formatInvoiceDate(invoice.createdAt)}</td>
                      <td className="px-4 py-4 align-top">
                        <p className="max-w-md text-sm leading-6 text-[var(--ink)]">{formatMenuNames(invoice)}</p>
                      </td>
                      <td className="px-4 py-4 text-right text-sm whitespace-nowrap tabular-nums text-[var(--muted)]">{getTotalQuantity(invoice)} item</td>
                      <td className="px-4 py-4 text-right text-sm font-medium whitespace-nowrap tabular-nums text-[var(--ink)]">{formatCurrency(invoice.subtotal)}</td>
                      <td className="px-4 py-4 text-right text-sm whitespace-nowrap tabular-nums text-[var(--muted)]">{formatCurrency(invoice.tax)}</td>
                      <td className="px-4 py-4 text-right text-sm font-semibold whitespace-nowrap tabular-nums text-[var(--coffee-700)]">{formatCurrency(invoice.total)}</td>
                      <td className="rounded-r-[var(--radius-soft)] px-4 py-4 text-sm text-[var(--muted)]">{invoice.cashierName}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="rounded-[var(--radius-soft)] bg-[rgba(255,255,255,0.72)] px-4 py-8 text-center text-sm text-[var(--muted)] shadow-[inset_0_0_0_1px_var(--line)]">
                      Tidak ada invoice yang cocok dengan filter aktif.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
