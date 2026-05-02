begin;

alter table if exists public.dashboard_stats rename to mst_dashboard_stats;
alter table if exists public.revenue_points rename to mst_revenue_points;
alter table if exists public.popular_items rename to mst_popular_items;
alter table if exists public.products rename to mst_products;
alter table if exists public.staff_members rename to mst_staff_members;
alter table if exists public.staff_credentials rename to mst_staff_credentials;
alter table if exists public.notification_feed rename to mst_notification_feed;
alter table if exists public.cashier_snapshot rename to mst_cashier_snapshot;
alter table if exists public.app_settings rename to mst_app_settings;
alter table if exists public.staff_roles rename to mst_staff_roles;
alter table if exists public.staff_role_permissions rename to mst_staff_role_permissions;
alter table if exists public.notification_settings rename to mst_notification_settings;

alter table if exists public.app_sessions rename to trx_app_sessions;
alter table if exists public.staff_session_logs rename to trx_staff_session_logs;
alter table if exists public.sales_orders rename to trx_sales_orders;
alter table if exists public.sales_order_items rename to trx_sales_order_items;

commit;
