"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getStoredCashierInvoices } from "@/lib/cashier-invoice-storage";
import { sampleCashierInvoices, type CashierInvoice } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

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

function formatMenuNames(invoice: CashierInvoice) {
  return invoice.items.map((item) => item.productName).join(", ");
}

function getTotalQuantity(invoice: CashierInvoice) {
  return invoice.items.reduce((sum, item) => sum + item.quantity, 0);
}

export default function InvoiceKasirPage() {
  const [invoices, setInvoices] = useState<CashierInvoice[]>(sampleCashierInvoices);

  useEffect(() => {
    setInvoices(getStoredCashierInvoices());
  }, []);

  const totalTransactions = invoices.length;
  const totalRevenue = useMemo(() => invoices.reduce((sum, invoice) => sum + invoice.total, 0), [invoices]);

  return (
    <>
      <PageHeader
        eyebrow="Cashier receipts"
        title="Invoice Kasir"
        description="Rekap hasil transaksi dari POS Kasir. Tiap checkout yang selesai akan masuk ke daftar invoice ini."
        actions={
          <>
            <Badge variant="accent">{totalTransactions} transaksi</Badge>
            <Badge variant="neutral">{formatCurrency(totalRevenue)}</Badge>
          </>
        }
      />

      <Card className="p-6">
        <CardHeader>
          <CardTitle>Riwayat invoice kasir</CardTitle>
          <CardDescription>Grid clean-room yang menampilkan ID transaksi, waktu, menu, jumlah item, subtotal, pajak, total, dan nama kasir.</CardDescription>
        </CardHeader>
        <CardContent>
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
                {invoices.map((invoice) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
