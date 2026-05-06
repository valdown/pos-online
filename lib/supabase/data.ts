import "server-only";

import { cache } from "react";

import type {
  AppSettings,
  DashboardStat,
  NotificationFeedItem,
  NotificationSettings,
  PopularItem,
  Product,
  RevenuePoint,
  StaffMember,
} from "@/lib/mock-data";
import {
  cashierSnapshot as fallbackCashierSnapshot,
  dashboardStats as fallbackDashboardStats,
  defaultAppSettings,
  defaultNotificationSettings,
  notificationsFeed as fallbackNotificationsFeed,
  popularItems as fallbackPopularItems,
  revenueSeries as fallbackRevenueSeries,
  staffMembers as fallbackStaffMembers,
} from "@/lib/mock-data";
import { SUPABASE_SETTINGS_ROW_ID } from "@/lib/supabase/config";
import {
  type AppSettingsRow,
  type NotificationSettingsRow,
  mapAppSettingsRowToModel,
  mapNotificationSettingsRowToModel,
} from "@/lib/supabase/settings";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mapProductRow, type ProductRow } from "@/lib/supabase/products";

type DashboardStatRow = DashboardStat & { sort_order?: number };
type RevenuePointRow = RevenuePoint & { sort_order?: number };
type PopularItemRow = PopularItem & { sort_order?: number };
type StaffMemberRow = StaffMember;
type NotificationFeedRow = NotificationFeedItem & { sort_order?: number };
type CashierSnapshotRow = {
  active_cashiers: number;
  active_time: string;
  highlighted_table: string;
};

type SalesOrderSummaryRow = {
  id: string;
  total_amount: number;
  created_at: string;
};

type SalesOrderItemSummaryRow = {
  order_id: string;
  product_name: string;
  quantity: number;
};

export type DashboardOrderRow = SalesOrderSummaryRow;
export type DashboardOrderItemRow = SalesOrderItemSummaryRow;

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

function getRangeDaysAgo(now: Date, daysAgoStart: number, daysAgoEnd: number) {
  const start = startOfDay(new Date(now));
  start.setDate(start.getDate() - daysAgoStart);
  const end = endOfDay(new Date(now));
  end.setDate(end.getDate() - daysAgoEnd);
  return { start, end };
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

const getTransactionDashboardData = cache(async () => {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      stats: fallbackDashboardStats,
      revenueSeries: fallbackRevenueSeries,
      popularItems: fallbackPopularItems,
    };
  }

  const now = new Date();
  const last14Start = startOfDay(new Date(now));
  last14Start.setDate(last14Start.getDate() - 13);

  const [{ data: orderRows, error: ordersError }, { data: itemRows, error: itemsError }] = await Promise.all([
    supabase
      .from("trx_sales_orders")
      .select("id, total_amount, created_at")
      .gte("created_at", last14Start.toISOString())
      .order("created_at", { ascending: true }),
    supabase
      .from("trx_sales_order_items")
      .select("order_id, product_name, quantity")
      .order("product_name", { ascending: true }),
  ]);

  if (ordersError || itemsError) {
    return {
      stats: fallbackDashboardStats,
      revenueSeries: fallbackRevenueSeries,
      popularItems: fallbackPopularItems,
    };
  }

  const orders = (orderRows ?? []) as SalesOrderSummaryRow[];
  const items = (itemRows ?? []) as SalesOrderItemSummaryRow[];

  const currentRange = getRangeDaysAgo(now, 6, 0);
  const previousRange = getRangeDaysAgo(now, 13, 7);

  const inRange = (value: string, range: { start: Date; end: Date }) => {
    const time = Date.parse(value);
    return !Number.isNaN(time) && time >= range.start.getTime() && time <= range.end.getTime();
  };

  const currentOrders = orders.filter((order) => inRange(order.created_at, currentRange));
  const previousOrders = orders.filter((order) => inRange(order.created_at, previousRange));
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

  const stats: DashboardStat[] = [
    {
      title: "Total Pendapatan",
      value: formatCompactCurrency(currentRevenue),
      delta: formatPercentDelta(currentRevenue, previousRevenue),
      description: "dibanding 7 hari sebelumnya",
      icon: "wallet",
    },
    {
      title: "Pesanan Selesai",
      value: new Intl.NumberFormat("id-ID").format(currentOrders.length),
      delta: formatCountDelta(currentOrders.length, previousOrders.length, "order"),
      description: "dibanding 7 hari sebelumnya",
      icon: "badge-check",
    },
    {
      title: "AOV",
      value: formatCompactCurrency(currentAov),
      delta: formatPercentDelta(currentAov, previousAov),
      description: "dibanding 7 hari sebelumnya",
      icon: "receipt",
    },
    {
      title: "Total Item Terjual",
      value: new Intl.NumberFormat("id-ID").format(currentItemsSold),
      delta: formatCountDelta(currentItemsSold, previousItemsSold, "item"),
      description: "dibanding 7 hari sebelumnya",
      icon: "package",
    },
  ];

  const revenueByDay = new Map<string, number>();
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = startOfDay(date).toISOString();
    revenueByDay.set(key, 0);
  }

  for (const order of currentOrders) {
    const dayKey = startOfDay(new Date(order.created_at)).toISOString();
    if (revenueByDay.has(dayKey)) {
      revenueByDay.set(dayKey, (revenueByDay.get(dayKey) ?? 0) + order.total_amount);
    }
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

  return {
    stats,
    revenueSeries,
    popularItems,
  };
});

export const getDashboardOverviewData = cache(async () => {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return {
      orders: [] as DashboardOrderRow[],
      items: [] as DashboardOrderItemRow[],
    };
  }

  const [{ data: orderRows, error: ordersError }, { data: itemRows, error: itemsError }] = await Promise.all([
    supabase.from("trx_sales_orders").select("id, total_amount, created_at").order("created_at", { ascending: true }),
    supabase.from("trx_sales_order_items").select("order_id, product_name, quantity").order("product_name", { ascending: true }),
  ]);

  if (ordersError || itemsError) {
    return {
      orders: [] as DashboardOrderRow[],
      items: [] as DashboardOrderItemRow[],
    };
  }

  return {
    orders: (orderRows ?? []) as DashboardOrderRow[],
    items: (itemRows ?? []) as DashboardOrderItemRow[],
  };
});

async function selectRows<T>(table: string, fallback: T[], orderBy = "sort_order") {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return fallback;
  }

  const { data, error } = await supabase.from(table).select("*").order(orderBy, { ascending: true });

  if (error || !data || data.length === 0) {
    return fallback;
  }

  return data as T[];
}

export async function getDashboardStats() {
  return (await getTransactionDashboardData()).stats;
}

export async function getRevenueSeries() {
  return (await getTransactionDashboardData()).revenueSeries;
}

export async function getPopularItems() {
  return (await getTransactionDashboardData()).popularItems;
}

export async function getProducts() {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return [] as Product[];
  }

  const { data, error } = await supabase
    .from("mst_products")
    .select("id, name, category, description, price, stock, is_active, image_path, deleted_at")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error || !data) {
    return [] as Product[];
  }

  const rows = data as ProductRow[];
  return rows.map(mapProductRow);
}

export async function getStaffMembers() {
  return selectRows<StaffMemberRow>("mst_staff_members", fallbackStaffMembers, "name");
}

export async function getNotificationFeed() {
  return selectRows<NotificationFeedRow>("mst_notification_feed", fallbackNotificationsFeed);
}

export async function getCashierSnapshot() {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return fallbackCashierSnapshot;
  }

  const { data, error } = await supabase
    .from("mst_cashier_snapshot")
    .select("active_cashiers, active_time, highlighted_table")
    .eq("id", SUPABASE_SETTINGS_ROW_ID)
    .maybeSingle<CashierSnapshotRow>();

  if (error || !data) {
    return fallbackCashierSnapshot;
  }

  return {
    activeCashiers: data.active_cashiers,
    activeTime: data.active_time,
    highlightedTable: data.highlighted_table,
  };
}

export async function getServerAppSettings() {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return defaultAppSettings;
  }

  const { data, error } = await supabase.from("mst_app_settings").select("*").eq("id", SUPABASE_SETTINGS_ROW_ID).maybeSingle<AppSettingsRow>();

  if (error || !data) {
    return defaultAppSettings;
  }

  return mapAppSettingsRowToModel(data) satisfies AppSettings;
}

export async function getServerNotificationSettings() {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return defaultNotificationSettings;
  }

  const { data, error } = await supabase
    .from("mst_notification_settings")
    .select("*")
    .eq("id", SUPABASE_SETTINGS_ROW_ID)
    .maybeSingle<NotificationSettingsRow>();

  if (error || !data) {
    return defaultNotificationSettings;
  }

  return mapNotificationSettingsRowToModel(data) satisfies NotificationSettings;
}
