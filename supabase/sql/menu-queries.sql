-- Manual query pack for each main menu in the current app.
-- Run sections individually in the Supabase SQL Editor as needed.

-- =========================================================
-- DASHBOARD
-- =========================================================

-- KPI cards
select sort_order, title, value, delta, description, icon
from public.mst_dashboard_stats
order by sort_order asc;

-- Revenue chart
select sort_order, day, revenue
from public.mst_revenue_points
order by sort_order asc;

-- Popular items chart
select sort_order, name, orders, share
from public.mst_popular_items
order by sort_order asc;

-- Notification feed used in dashboard and notifikasi
select id, sort_order, title, message, time, channel, tone
from public.mst_notification_feed
order by sort_order asc;

-- Cashier snapshot
select id, active_cashiers, active_time, highlighted_table
from public.mst_cashier_snapshot
where id = 'default';

-- Low stock widget source
select id, name, stock, is_active, image_path, deleted_at
from public.mst_products
where deleted_at is null and is_active = true and stock <= 10
order by stock asc, name asc;

-- =========================================================
-- KASIR
-- =========================================================

-- Product catalog for POS Kasir
select id, name, category, price, stock, is_active, image_path, deleted_at
from public.mst_products
where deleted_at is null and is_active = true
order by name asc;

-- Product catalog with all mapped fields used by Produk page too
select id, name, category, description, price, stock, is_active, image_path, deleted_at
from public.mst_products
where deleted_at is null
order by name asc;

-- Tax rate used by checkout math and page description
select id, store_name, branch_name, tax_rate, service_fee
from public.mst_app_settings
where id = 'default';

-- Latest cashier transactions written from POS checkout
select id, order_number, payment_method, subtotal, tax_amount, total_amount, cashier_name, created_at
from public.trx_sales_orders
order by created_at desc
limit 20;

-- Item rows for the latest cashier transactions
select soi.order_id, soi.product_id, soi.product_name, soi.unit_price, soi.quantity, soi.line_total
from public.trx_sales_order_items soi
join public.trx_sales_orders so on so.id = soi.order_id
order by so.created_at desc, soi.product_name asc
limit 50;

-- =========================================================
-- INVOICE KASIR
-- =========================================================

-- Query that matches the Invoice Kasir table closely
select
  so.id,
  so.order_number,
  so.payment_method,
  so.subtotal,
  so.tax_amount,
  so.total_amount,
  coalesce(so.cashier_name, 'Kasir Online') as cashier_name,
  so.created_at,
  coalesce(string_agg(soi.product_name, ', ' order by soi.product_name), '-') as menu_names,
  coalesce(sum(soi.quantity), 0) as total_quantity
from public.trx_sales_orders so
left join public.trx_sales_order_items soi on soi.order_id = so.id
group by so.id, so.order_number, so.payment_method, so.subtotal, so.tax_amount, so.total_amount, so.cashier_name, so.created_at
order by so.created_at desc;

-- Detail invoice per order with line items
select
  so.order_number,
  so.created_at,
  so.payment_method,
  coalesce(so.cashier_name, 'Kasir Online') as cashier_name,
  soi.product_id,
  soi.product_name,
  soi.unit_price,
  soi.quantity,
  soi.line_total
from public.trx_sales_orders so
join public.trx_sales_order_items soi on soi.order_id = so.id
order by so.created_at desc, soi.product_name asc;

-- =========================================================
-- PRODUK
-- =========================================================

select id, name, description, category, price, stock, is_active, image_path, deleted_at
from public.mst_products
where deleted_at is null
order by name asc;

-- =========================================================
-- STAF
-- =========================================================

-- Requires the internal owner auth migration to be applied first.
select
  sm.id,
  sm.name,
  sm.role,
  sm.email,
  '[managed-by-internal-auth]' as pass_word,
  sm.access,
  case when coalesce(sc.is_active, true) then 'Aktif' else 'Tidak Aktif' end as status_akun,
  case
    when exists (
      select 1
      from public.trx_app_sessions aps
      where aps.staff_id = sm.id
        and aps.revoked_at is null
        and aps.expires_at > now()
        and aps.last_seen_at >= now() - interval '5 minutes'
    ) then 'Online'
    when sm.status = 'Istirahat' then 'Istirahat'
    else 'Off'
  end as status_online,
  sm.created_at,
  sm.created_by,
  sm.updated_at,
  sm.updated_by
from public.mst_staff_members sm
left join public.mst_staff_credentials sc on sc.staff_id = sm.id
order by sm.name asc;

-- Admin-only diagnostic query. This shows the internal password hash,
-- not a decryptable password. Run from SQL Editor with sufficient privileges only.
select
  sm.id,
  sm.name,
  sm.role,
  sm.email,
  sc.password_hash,
  sm.access,
  case when coalesce(sc.is_active, true) then 'Aktif' else 'Tidak Aktif' end as status_akun,
  case
    when exists (
      select 1
      from public.trx_app_sessions aps
      where aps.staff_id = sm.id
        and aps.revoked_at is null
        and aps.expires_at > now()
        and aps.last_seen_at >= now() - interval '5 minutes'
    ) then 'Online'
    when sm.status = 'Istirahat' then 'Istirahat'
    else 'Off'
  end as status_online,
  sm.created_at,
  sm.created_by,
  sm.updated_at,
  sm.updated_by
from public.mst_staff_members sm
left join public.mst_staff_credentials sc on sc.staff_id = sm.id
order by sm.name asc;

-- Session/activity log for operational tracing.
select
  aps.id,
  aps.staff_id,
  sm.name,
  sm.role,
  sm.email,
  aps.created_at as logged_in_at,
  aps.last_seen_at,
  aps.revoked_at as logged_out_at,
  case
    when aps.revoked_at is null and aps.expires_at > now() and aps.last_seen_at >= now() - interval '5 minutes' then 'Online'
    else 'Off'
  end as status
from public.trx_app_sessions aps
join public.mst_staff_members sm on sm.id = aps.staff_id
order by aps.created_at desc;

-- Active staff role master data used by Pengaturan > Konfigurasi Role
select id, name, sort_order, is_active
from public.mst_staff_roles
order by sort_order asc, name asc;

select role_id, menu_key, access_level
from public.mst_staff_role_permissions
order by role_id asc, menu_key asc;

-- =========================================================
-- NOTIFIKASI
-- =========================================================

-- Notification form values
select id, telegram_enabled, bot_token, chat_id, digest_frequency, low_stock_alert, cashier_summary, refund_alert
from public.mst_notification_settings
where id = 'default';

-- Notification feed panel
select id, sort_order, title, message, time, channel, tone
from public.mst_notification_feed
order by sort_order asc;

-- =========================================================
-- PENGATURAN
-- =========================================================

select
  id,
  store_name,
  branch_name,
  tax_rate,
  service_fee,
  store_phone,
  receipt_footer,
  bank_name,
  bank_account_name,
  bank_account_number,
  opening_cash,
  auto_print_receipt
from public.mst_app_settings
where id = 'default';

-- Payment method settings from app_settings
select id, payment_methods
from public.mst_app_settings
where id = 'default';

-- Menu category settings from app_settings
select id, menu_categories
from public.mst_app_settings
where id = 'default';

-- =========================================================
-- OPTIONAL CHECKS
-- =========================================================

-- Verify row counts across menu tables
select 'mst_dashboard_stats' as table_name, count(*) as total_rows from public.mst_dashboard_stats
union all
select 'mst_revenue_points', count(*) from public.mst_revenue_points
union all
select 'mst_popular_items', count(*) from public.mst_popular_items
union all
select 'mst_products', count(*) from public.mst_products
union all
select 'mst_staff_members', count(*) from public.mst_staff_members
union all
select 'mst_notification_feed', count(*) from public.mst_notification_feed
union all
select 'mst_app_settings', count(*) from public.mst_app_settings
union all
select 'mst_notification_settings', count(*) from public.mst_notification_settings
union all
select 'trx_sales_orders', count(*) from public.trx_sales_orders
union all
select 'trx_sales_order_items', count(*) from public.trx_sales_order_items;
