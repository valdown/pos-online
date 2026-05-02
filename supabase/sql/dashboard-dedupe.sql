-- Clean existing duplicate dashboard rows and harden uniqueness.
-- Run this once on an existing database before re-running schema seeds if you already see duplicate cards.
-- Skip this file if your dashboard tables are already clean.

delete from public.mst_dashboard_stats a
using public.mst_dashboard_stats b
where a.id < b.id
  and a.sort_order = b.sort_order;

delete from public.mst_revenue_points a
using public.mst_revenue_points b
where a.id < b.id
  and a.sort_order = b.sort_order;

delete from public.mst_popular_items a
using public.mst_popular_items b
where a.id < b.id
  and a.sort_order = b.sort_order;

create unique index if not exists idx_mst_dashboard_stats_sort_order on public.mst_dashboard_stats (sort_order);
create unique index if not exists idx_mst_revenue_points_sort_order on public.mst_revenue_points (sort_order);
create unique index if not exists idx_mst_popular_items_sort_order on public.mst_popular_items (sort_order);

insert into public.mst_dashboard_stats (sort_order, title, value, delta, description, icon)
values
  (1, 'Total Pendapatan', 'Rp 18.420.000', '+12,4%', 'naik dibanding minggu lalu', 'wallet'),
  (2, 'Pesanan Selesai', '312', '+28 order', 'dengan SLA tersaji 6 menit', 'badge-check'),
  (3, 'AOV', 'Rp 58.900', '+8,1%', 'ditopang paket pastry pagi', 'receipt'),
  (4, 'Total Item Terjual', '1.284', '+94 item', 'espresso blend dan toast dominan', 'package')
on conflict (sort_order) do update set
  title = excluded.title,
  value = excluded.value,
  delta = excluded.delta,
  description = excluded.description,
  icon = excluded.icon;

insert into public.mst_revenue_points (sort_order, day, revenue)
values
  (1, 'Sen', 2200000),
  (2, 'Sel', 2850000),
  (3, 'Rab', 2560000),
  (4, 'Kam', 3150000),
  (5, 'Jum', 3380000),
  (6, 'Sab', 4020000),
  (7, 'Min', 3260000)
on conflict (sort_order) do update set
  day = excluded.day,
  revenue = excluded.revenue;

insert into public.mst_popular_items (sort_order, name, orders, share)
values
  (1, 'Caramel Macchiato', 124, 34),
  (2, 'Beef Burger & Chips', 96, 26),
  (3, 'Bumi Latte', 82, 22),
  (4, 'Kapal Pesiar', 58, 18)
on conflict (sort_order) do update set
  name = excluded.name,
  orders = excluded.orders,
  share = excluded.share;
