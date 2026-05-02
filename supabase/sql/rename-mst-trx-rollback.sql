begin;

alter table if exists public.trx_sales_order_items rename to sales_order_items;
alter table if exists public.trx_sales_orders rename to sales_orders;
alter table if exists public.trx_staff_session_logs rename to staff_session_logs;
alter table if exists public.trx_app_sessions rename to app_sessions;

alter table if exists public.mst_notification_settings rename to notification_settings;
alter table if exists public.mst_staff_role_permissions rename to staff_role_permissions;
alter table if exists public.mst_staff_roles rename to staff_roles;
alter table if exists public.mst_app_settings rename to app_settings;
alter table if exists public.mst_cashier_snapshot rename to cashier_snapshot;
alter table if exists public.mst_notification_feed rename to notification_feed;
alter table if exists public.mst_staff_credentials rename to staff_credentials;
alter table if exists public.mst_staff_members rename to staff_members;
alter table if exists public.mst_products rename to products;
alter table if exists public.mst_popular_items rename to popular_items;
alter table if exists public.mst_revenue_points rename to revenue_points;
alter table if exists public.mst_dashboard_stats rename to dashboard_stats;

commit;
