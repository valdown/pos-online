import "server-only";

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
  products as fallbackProducts,
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

type DashboardStatRow = DashboardStat & { sort_order?: number };
type RevenuePointRow = RevenuePoint & { sort_order?: number };
type PopularItemRow = PopularItem & { sort_order?: number };
type ProductRow = Omit<Product, "soldToday"> & { sold_today: number };
type StaffMemberRow = StaffMember;
type NotificationFeedRow = NotificationFeedItem & { sort_order?: number };
type CashierSnapshotRow = {
  active_cashiers: number;
  active_time: string;
  highlighted_table: string;
};

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    price: row.price,
    stock: row.stock,
    sku: row.sku,
    soldToday: row.sold_today,
    status: row.status,
  };
}

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
  return selectRows<DashboardStatRow>("dashboard_stats", fallbackDashboardStats);
}

export async function getRevenueSeries() {
  return selectRows<RevenuePointRow>("revenue_points", fallbackRevenueSeries);
}

export async function getPopularItems() {
  return selectRows<PopularItemRow>("popular_items", fallbackPopularItems);
}

export async function getProducts() {
  const rows = await selectRows<ProductRow>("products", fallbackProducts.map((product) => ({ ...product, sold_today: product.soldToday })), "name");
  return rows.map(mapProductRow);
}

export async function getStaffMembers() {
  return selectRows<StaffMemberRow>("staff_members", fallbackStaffMembers, "name");
}

export async function getNotificationFeed() {
  return selectRows<NotificationFeedRow>("notification_feed", fallbackNotificationsFeed);
}

export async function getCashierSnapshot() {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return fallbackCashierSnapshot;
  }

  const { data, error } = await supabase
    .from("cashier_snapshot")
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

  const { data, error } = await supabase.from("app_settings").select("*").eq("id", SUPABASE_SETTINGS_ROW_ID).maybeSingle<AppSettingsRow>();

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
    .from("notification_settings")
    .select("*")
    .eq("id", SUPABASE_SETTINGS_ROW_ID)
    .maybeSingle<NotificationSettingsRow>();

  if (error || !data) {
    return defaultNotificationSettings;
  }

  return mapNotificationSettingsRowToModel(data) satisfies NotificationSettings;
}
