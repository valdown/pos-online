select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'mst_dashboard_stats',
    'mst_revenue_points',
    'mst_popular_items',
    'mst_products',
    'mst_staff_members',
    'mst_staff_credentials',
    'mst_staff_roles',
    'mst_staff_role_permissions',
    'mst_notification_feed',
    'mst_cashier_snapshot',
    'mst_app_settings',
    'mst_notification_settings',
    'trx_app_sessions',
    'trx_staff_session_logs',
    'trx_sales_orders',
    'trx_sales_order_items'
  )
order by table_name;

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'dashboard_stats',
    'revenue_points',
    'popular_items',
    'products',
    'staff_members',
    'staff_credentials',
    'staff_roles',
    'staff_role_permissions',
    'notification_feed',
    'cashier_snapshot',
    'app_settings',
    'notification_settings',
    'app_sessions',
    'staff_session_logs',
    'sales_orders',
    'sales_order_items'
  )
order by table_name;

select
  tc.table_name,
  kcu.column_name,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name,
  tc.constraint_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
order by tc.table_name, tc.constraint_name;

select 'mst_staff_members' as table_name, count(*) as total_rows from public.mst_staff_members
union all
select 'mst_staff_credentials', count(*) from public.mst_staff_credentials
union all
select 'mst_staff_roles', count(*) from public.mst_staff_roles
union all
select 'mst_staff_role_permissions', count(*) from public.mst_staff_role_permissions
union all
select 'trx_app_sessions', count(*) from public.trx_app_sessions
union all
select 'trx_sales_orders', count(*) from public.trx_sales_orders
union all
select 'trx_sales_order_items', count(*) from public.trx_sales_order_items;
