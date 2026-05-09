"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock3, CookingPot, PackageCheck, UtensilsCrossed, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { KitchenBoardOrder } from "@/lib/supabase/data";
import { formatCurrency } from "@/lib/utils";

type KitchenStatus = KitchenBoardOrder["kitchenStatus"];

type KitchenColumn = {
  key: KitchenStatus;
  title: string;
  description: string;
  icon: typeof Clock3;
};

type KitchenAction = {
  label: string;
  nextStatus: KitchenStatus;
  variant: "primary" | "outline";
};

const kitchenColumns: KitchenColumn[] = [
  {
    key: "queue",
    title: "Queue",
    description: "Order baru yang menunggu diproses tim dapur.",
    icon: Clock3,
  },
  {
    key: "in_progress",
    title: "In Progress",
    description: "Pesanan yang sedang diracik atau disiapkan.",
    icon: CookingPot,
  },
  {
    key: "done",
    title: "Done",
    description: "Pesanan yang sudah selesai dan siap diserahkan.",
    icon: PackageCheck,
  },
];

function formatKitchenTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getStatusBadgeVariant(status: KitchenStatus): "neutral" | "warning" | "success" {
  if (status === "queue") {
    return "warning";
  }

  if (status === "done") {
    return "success";
  }

  return "neutral";
}

function getStatusLabel(status: KitchenStatus) {
  switch (status) {
    case "queue":
      return "Queue";
    case "in_progress":
      return "In Progress";
    case "done":
      return "Done";
  }
}

function getNextActions(status: KitchenStatus): KitchenAction[] {
  if (status === "queue") {
    return [{ label: "Mulai Proses", nextStatus: "in_progress", variant: "primary" }];
  }

  if (status === "in_progress") {
    return [
      { label: "Kembali ke Queue", nextStatus: "queue", variant: "outline" },
      { label: "Tandai Selesai", nextStatus: "done", variant: "primary" },
    ];
  }

  return [{ label: "Buka Lagi", nextStatus: "in_progress", variant: "outline" }];
}

export function KitchenBoardClient({ initialOrders }: { initialOrders: KitchenBoardOrder[] }) {
  const [orders, setOrders] = useState<KitchenBoardOrder[]>(initialOrders);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const prevCountRef = useRef(initialOrders.filter((o) => o.kitchenStatus === "queue").length);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/kitchen-orders");
      if (!res.ok) return;
      const data = (await res.json()) as KitchenBoardOrder[];
      setOrders(data);

      const newQueueCount = data.filter((o) => o.kitchenStatus === "queue").length;
      if (newQueueCount > prevCountRef.current) {
        toast.info("Order baru masuk!", { description: `${newQueueCount - prevCountRef.current} pesanan baru di antrian.` });
      }
      prevCountRef.current = newQueueCount;
    } catch {
      // silent fail, will retry next interval
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const groupedOrders = useMemo(() => {
    return {
      queue: orders.filter((order) => order.kitchenStatus === "queue"),
      in_progress: orders.filter((order) => order.kitchenStatus === "in_progress"),
      done: orders.filter((order) => order.kitchenStatus === "done"),
    } satisfies Record<KitchenStatus, KitchenBoardOrder[]>;
  }, [orders]);

  async function updateKitchenStatus(orderId: string, nextStatus: KitchenStatus) {
    const actionKey = `${orderId}:${nextStatus}`;
    setPendingActionKey(actionKey);

    try {
      const response = await fetch(`/api/kitchen-orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        toast.error("Status dapur gagal diperbarui.", {
          description: payload?.error ?? "Coba lagi beberapa saat.",
        });
        return;
      }

      toast.success("Status dapur berhasil diperbarui.", {
        description: `Order dipindahkan ke kolom ${getStatusLabel(nextStatus)}.`,
      });
      void fetchOrders();
    } catch (error) {
      toast.error("Status dapur gagal diperbarui.", {
        description: error instanceof Error ? error.message : "Coba lagi beberapa saat.",
      });
    } finally {
      setPendingActionKey(null);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {kitchenColumns.map((column) => {
        const Icon = column.icon;
        const orders = groupedOrders[column.key];

        return (
          <Card key={column.key} className="flex min-h-[32rem] flex-col gap-4 p-4 md:p-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-[rgba(198,122,63,0.12)] p-2 text-[var(--coffee-700)]">
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-[var(--ink)]">{column.title}</h2>
                    <p className="text-xs text-[var(--muted)]">{orders.length} order</p>
                  </div>
                </div>
                <Badge variant="neutral">{orders.length}</Badge>
              </div>
              <p className="text-sm leading-6 text-[var(--muted)]">{column.description}</p>
            </div>

            <div className="flex flex-1 flex-col gap-3">
              {orders.length ? (
                orders.map((order) => (
                  <Card key={order.id} className="space-y-4 border-[var(--line)] bg-[rgba(255,255,255,0.82)] p-4 shadow-none">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[var(--ink)]">{order.orderNumber}</p>
                        <p className="text-xs text-[var(--muted)]">Masuk {formatKitchenTime(order.createdAt)}</p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(order.kitchenStatus)}>{getStatusLabel(order.kitchenStatus)}</Badge>
                    </div>

                    <div className="grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em]">Kasir</p>
                        <p className="mt-1 font-medium text-[var(--ink)]">{order.cashierName}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em]">Pembayaran</p>
                        <p className="mt-1 font-medium uppercase text-[var(--ink)]">{order.paymentMethod}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-[var(--radius-soft)] bg-[rgba(255,248,242,0.8)] p-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-[var(--ink)]">
                        <UtensilsCrossed className="size-4" />
                        <span>{order.totalItems} item</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDetailOrderId(order.id)}
                        className="h-8 px-3 text-xs"
                      >
                        Lihat Detail
                      </Button>
                    </div>

                    <div className="grid gap-2 text-sm text-[var(--muted)] md:grid-cols-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em]">Total tagihan</p>
                        <p className="mt-1 font-semibold text-[var(--ink)]">{formatCurrency(order.totalAmount)}</p>
                      </div>
                    </div>

                    {order.kitchenStartedAt || order.kitchenCompletedAt ? (
                      <div className="grid gap-2 text-xs text-[var(--muted)] md:grid-cols-2">
                        <div>
                          <p className="uppercase tracking-[0.16em]">Mulai</p>
                          <p className="mt-1 text-sm text-[var(--ink)]">{order.kitchenStartedAt ? formatKitchenTime(order.kitchenStartedAt) : "-"}</p>
                        </div>
                        <div>
                          <p className="uppercase tracking-[0.16em]">Selesai</p>
                          <p className="mt-1 text-sm text-[var(--ink)]">{order.kitchenCompletedAt ? formatKitchenTime(order.kitchenCompletedAt) : "-"}</p>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      {getNextActions(order.kitchenStatus).map((action) => {
                        const actionKey = `${order.id}:${action.nextStatus}`;
                        return (
                          <Button
                            key={actionKey}
                            type="button"
                            variant={action.variant}
                            disabled={pendingActionKey !== null}
                            onClick={() => void updateKitchenStatus(order.id, action.nextStatus)}
                          >
                            {pendingActionKey === actionKey ? "Menyimpan..." : action.label}
                          </Button>
                        );
                      })}
                    </div>
                  </Card>
                ))
              ) : (
                <div className="rounded-[var(--radius-soft)] border border-dashed border-[var(--line)] bg-[rgba(255,255,255,0.65)] p-6 text-center text-sm leading-6 text-[var(--muted)]">
                  Belum ada order pada kolom ini. Order baru dari kasir akan otomatis masuk ke board dapur.
                </div>
              )}
            </div>
          </Card>
        );
      })}

      {detailOrderId
        ? (() => {
            const detailOrder = orders.find((o) => o.id === detailOrderId);
            if (!detailOrder) return null;
            return createPortal(
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgb(17_24_39_/_0.8)] px-4 py-6 backdrop-blur-md" onClick={() => setDetailOrderId(null)}>
                <div className="w-full max-w-md rounded-[1.5rem] border border-[rgba(255,255,255,0.65)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,242,0.94))] p-6 shadow-[0_28px_70px_rgba(32,18,9,0.22)]" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold text-[var(--ink)]">{detailOrder.orderNumber}</h2>
                      <p className="text-sm text-[var(--muted)]">{detailOrder.totalItems} item • {formatCurrency(detailOrder.totalAmount)}</p>
                    </div>
                    <button type="button" onClick={() => setDetailOrderId(null)} className="flex size-9 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--muted)] transition hover:text-[var(--ink)]" aria-label="Tutup">
                      <X className="size-4" />
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Detail Pesanan</p>
                    <div className="max-h-[50vh] space-y-2 overflow-y-auto">
                      {detailOrder.items.map((item) => (
                        <div key={`${detailOrder.id}-${item.product_name}`} className="rounded-[0.75rem] border border-[var(--line)] bg-white/80 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-[var(--ink)]">{item.product_name}</span>
                            <span className="text-sm font-semibold text-[var(--coffee-700)]">x{item.quantity}</span>
                          </div>
                          {item.notes ? <p className="mt-1 text-xs italic text-[var(--muted)]">📝 {item.notes}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            );
          })()
        : null}
    </div>
  );
}
