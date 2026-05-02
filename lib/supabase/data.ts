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
  return selectRows<DashboardStatRow>("mst_dashboard_stats", fallbackDashboardStats);
}

export async function getRevenueSeries() {
  return selectRows<RevenuePointRow>("mst_revenue_points", fallbackRevenueSeries);
}

export async function getPopularItems() {
  return selectRows<PopularItemRow>("mst_popular_items", fallbackPopularItems);
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
