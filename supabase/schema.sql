create extension if not exists pgcrypto;

create table if not exists public.dashboard_stats (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  title text not null,
  value text not null,
  delta text not null,
  description text not null,
  icon text not null check (icon in ('wallet', 'badge-check', 'receipt', 'package'))
);

create table if not exists public.revenue_points (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  day text not null,
  revenue integer not null default 0
);

create table if not exists public.popular_items (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  name text not null,
  orders integer not null default 0,
  share integer not null default 0
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  description text not null,
  price integer not null default 0,
  stock integer not null default 0,
  sku text not null unique,
  sold_today integer not null default 0,
  status text not null check (status in ('Aktif', 'Hampir Habis'))
);

create table if not exists public.staff_members (
  id text primary key,
  name text not null,
  role text not null,
  access text not null,
  shift text not null,
  phone text not null,
  status text not null check (status in ('Online', 'Istirahat', 'Off'))
);

create table if not exists public.notification_feed (
  id text primary key,
  sort_order integer not null default 0,
  title text not null,
  message text not null,
  time text not null,
  channel text not null check (channel in ('Telegram', 'Sistem')),
  tone text not null check (tone in ('neutral', 'success', 'warning'))
);

create table if not exists public.cashier_snapshot (
  id text primary key,
  active_cashiers integer not null default 0,
  active_time text not null,
  highlighted_table text not null
);

create table if not exists public.app_settings (
  id text primary key,
  store_name text not null,
  branch_name text not null,
  tax_rate integer not null default 0,
  service_fee integer not null default 0,
  store_phone text not null,
  receipt_footer text not null,
  bank_name text not null,
  bank_account_name text not null,
  bank_account_number text not null,
  opening_cash integer not null default 0,
  auto_print_receipt boolean not null default false
);

create table if not exists public.notification_settings (
  id text primary key,
  telegram_enabled boolean not null default false,
  bot_token text not null,
  chat_id text not null,
  digest_frequency text not null check (digest_frequency in ('Real-time', 'Per 2 Jam', 'Harian')),
  low_stock_alert boolean not null default true,
  cashier_summary boolean not null default true,
  refund_alert boolean not null default false
);

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  payment_method text not null,
  subtotal integer not null default 0,
  tax_amount integer not null default 0,
  total_amount integer not null default 0,
  status text not null default 'paid',
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.sales_orders (id) on delete cascade,
  product_id text not null,
  product_name text not null,
  unit_price integer not null default 0,
  quantity integer not null default 1,
  line_total integer not null default 0
);

alter table public.dashboard_stats enable row level security;
alter table public.revenue_points enable row level security;
alter table public.popular_items enable row level security;
alter table public.products enable row level security;
alter table public.staff_members enable row level security;
alter table public.notification_feed enable row level security;
alter table public.cashier_snapshot enable row level security;
alter table public.app_settings enable row level security;
alter table public.notification_settings enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;

drop policy if exists authenticated_read_dashboard_stats on public.dashboard_stats;
create policy authenticated_read_dashboard_stats on public.dashboard_stats for select to authenticated using (true);
drop policy if exists authenticated_read_revenue_points on public.revenue_points;
create policy authenticated_read_revenue_points on public.revenue_points for select to authenticated using (true);
drop policy if exists authenticated_read_popular_items on public.popular_items;
create policy authenticated_read_popular_items on public.popular_items for select to authenticated using (true);
drop policy if exists authenticated_read_products on public.products;
create policy authenticated_read_products on public.products for select to authenticated using (true);
drop policy if exists authenticated_read_staff_members on public.staff_members;
create policy authenticated_read_staff_members on public.staff_members for select to authenticated using (true);
drop policy if exists authenticated_read_notification_feed on public.notification_feed;
create policy authenticated_read_notification_feed on public.notification_feed for select to authenticated using (true);
drop policy if exists authenticated_read_cashier_snapshot on public.cashier_snapshot;
create policy authenticated_read_cashier_snapshot on public.cashier_snapshot for select to authenticated using (true);
drop policy if exists authenticated_read_app_settings on public.app_settings;
create policy authenticated_read_app_settings on public.app_settings for select to authenticated using (true);
drop policy if exists authenticated_upsert_app_settings on public.app_settings;
create policy authenticated_upsert_app_settings on public.app_settings for all to authenticated using (true) with check (true);
drop policy if exists authenticated_read_notification_settings on public.notification_settings;
create policy authenticated_read_notification_settings on public.notification_settings for select to authenticated using (true);
drop policy if exists authenticated_upsert_notification_settings on public.notification_settings;
create policy authenticated_upsert_notification_settings on public.notification_settings for all to authenticated using (true) with check (true);
drop policy if exists authenticated_insert_sales_orders on public.sales_orders;
create policy authenticated_insert_sales_orders on public.sales_orders for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists authenticated_read_sales_orders on public.sales_orders;
create policy authenticated_read_sales_orders on public.sales_orders for select to authenticated using (auth.uid() = user_id);
drop policy if exists authenticated_insert_sales_order_items on public.sales_order_items;
create policy authenticated_insert_sales_order_items on public.sales_order_items for insert to authenticated with check (true);
drop policy if exists authenticated_read_sales_order_items on public.sales_order_items;
create policy authenticated_read_sales_order_items on public.sales_order_items for select to authenticated using (
  exists (
    select 1
    from public.sales_orders
    where sales_orders.id = sales_order_items.order_id
      and sales_orders.user_id = auth.uid()
  )
);

insert into public.dashboard_stats (sort_order, title, value, delta, description, icon)
values
  (1, 'Total Pendapatan', 'Rp 18.420.000', '+12,4%', 'naik dibanding minggu lalu', 'wallet'),
  (2, 'Pesanan Selesai', '312', '+28 order', 'dengan SLA tersaji 6 menit', 'badge-check'),
  (3, 'AOV', 'Rp 58.900', '+8,1%', 'ditopang paket pastry pagi', 'receipt'),
  (4, 'Total Item Terjual', '1.284', '+94 item', 'espresso blend dan toast dominan', 'package')
on conflict do nothing;

insert into public.revenue_points (sort_order, day, revenue)
values
  (1, 'Sen', 2200000),
  (2, 'Sel', 2850000),
  (3, 'Rab', 2560000),
  (4, 'Kam', 3150000),
  (5, 'Jum', 3380000),
  (6, 'Sab', 4020000),
  (7, 'Min', 3260000)
on conflict do nothing;

insert into public.popular_items (sort_order, name, orders, share)
values
  (1, 'Caramel Macchiato', 124, 34),
  (2, 'Beef Burger & Chips', 96, 26),
  (3, 'Bumi Latte', 82, 22),
  (4, 'Kapal Pesiar', 58, 18)
on conflict do nothing;

insert into public.products (id, name, category, description, price, stock, sku, sold_today, status)
values
  ('caramel-macchiato', 'Caramel Macchiato', 'Espresso', 'Espresso, susu steamed, dan caramel drizzle.', 34000, 42, 'CB-ESP-014', 38, 'Aktif'),
  ('flat-white', 'Flat White', 'Espresso', 'Body creamy dengan roast cokelat kacang.', 30000, 35, 'CB-ESP-003', 31, 'Aktif'),
  ('v60-kintamani', 'V60 Kintamani', 'Manual Brew', 'Profil citrus floral dengan body ringan.', 36000, 16, 'CB-MBR-011', 14, 'Aktif'),
  ('aren-latte', 'Aren Latte', 'Non Coffee', 'Latte susu aren dengan tekstur lembut.', 32000, 28, 'CB-NCF-008', 23, 'Aktif'),
  ('matcha-cloud', 'Matcha Cloud', 'Non Coffee', 'Matcha creamy dengan foam vanilla tipis.', 33000, 10, 'CB-NCF-004', 19, 'Hampir Habis'),
  ('beef-burger-chips', 'Beef Burger & Chips', 'Makanan', 'Burger signature dengan kentang renyah.', 52000, 18, 'CB-FOD-021', 27, 'Aktif'),
  ('croissant-almond', 'Croissant Almond', 'Makanan', 'Butter croissant dengan taburan almond panggang.', 28000, 9, 'CB-FOD-017', 21, 'Hampir Habis'),
  ('spanish-latte', 'Spanish Latte', 'Espresso', 'Espresso blend, susu, dan condensed milk.', 34000, 24, 'CB-ESP-019', 25, 'Aktif')
on conflict do nothing;

insert into public.staff_members (id, name, role, access, shift, phone, status)
values
  ('stf-001', 'Aa Nden', 'Owner', 'Penuh', '09.00 - 18.00', '0812-1122-3344', 'Online'),
  ('stf-002', 'Nabila Putri', 'Supervisor', 'Operasional', '08.00 - 17.00', '0813-8877-1100', 'Online'),
  ('stf-003', 'Raka Aditama', 'Kasir', 'Kasir', '07.00 - 15.00', '0819-4433-2211', 'Istirahat'),
  ('stf-004', 'Salsa Maharani', 'Barista', 'Operasional', '10.00 - 19.00', '0821-6655-7788', 'Online'),
  ('stf-005', 'Bima Prakoso', 'Kasir', 'Kasir', '13.00 - 21.00', '0822-9090-1212', 'Off')
on conflict do nothing;

insert into public.notification_feed (id, sort_order, title, message, time, channel, tone)
values
  ('notif-001', 1, 'Stok Matcha Cloud menipis', 'Sisa stok 10 porsi. Pertimbangkan reorder sebelum peak sore.', '5 menit lalu', 'Telegram', 'warning'),
  ('notif-002', 2, 'Kasir shift pagi ditutup', 'Ringkasan transaksi Rp 6.480.000 berhasil dikirim ke grup owner.', '35 menit lalu', 'Telegram', 'success'),
  ('notif-003', 3, 'Printer struk status normal', 'Perangkat front counter kembali terhubung setelah restart otomatis.', '1 jam lalu', 'Sistem', 'neutral')
on conflict do nothing;

insert into public.cashier_snapshot (id, active_cashiers, active_time, highlighted_table)
values ('default', 3, '23.42', 'Counter A')
on conflict (id) do nothing;

insert into public.app_settings (
  id, store_name, branch_name, tax_rate, service_fee, store_phone, receipt_footer, bank_name, bank_account_name, bank_account_number, opening_cash, auto_print_receipt
)
values (
  'default', 'Coffee Bean Signature', 'Cabang Setiabudi', 11, 5, '021-5550-7788', 'Terima kasih sudah menikmati racikan kami. Sampai jumpa lagi!', 'Bank Central Asia', 'PT Coffee Bean Nusantara', '112233445566', 750000, true
)
on conflict (id) do nothing;

insert into public.notification_settings (
  id, telegram_enabled, bot_token, chat_id, digest_frequency, low_stock_alert, cashier_summary, refund_alert
)
values (
  'default', true, 'demo-telegram-bot-token', 'demo-chat-room-id', 'Real-time', true, true, false
)
on conflict (id) do nothing;
