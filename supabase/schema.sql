create extension if not exists pgcrypto;

create table if not exists public.mst_dashboard_stats (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  title text not null,
  value text not null,
  delta text not null,
  description text not null,
  icon text not null check (icon in ('wallet', 'badge-check', 'receipt', 'package'))
);

create table if not exists public.mst_revenue_points (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  day text not null,
  revenue integer not null default 0
);

create table if not exists public.mst_popular_items (
  id uuid primary key default gen_random_uuid(),
  sort_order integer not null default 0,
  name text not null,
  orders integer not null default 0,
  share integer not null default 0
);

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

create table if not exists public.mst_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text not null,
  price integer not null default 0,
  stock integer not null default 0,
  is_active boolean not null default true,
  image_path text,
  deleted_at timestamptz
);

alter table public.mst_products drop column if exists sku;
alter table public.mst_products drop column if exists sold_today;
alter table public.mst_products add column if not exists image_path text;
alter table public.mst_products add column if not exists deleted_at timestamptz;
alter table public.mst_products add column if not exists is_active boolean not null default true;
update public.mst_products set is_active = true where is_active is null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 1048576, array['image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Product image objects are stored with a flat path pattern like:
-- products/<product-id>-<timestamp>.<ext>

drop policy if exists public_read_product_images on storage.objects;
create policy public_read_product_images on storage.objects for select using (bucket_id = 'product-images');

create table if not exists public.mst_staff_members (
  id text primary key,
  name text not null,
  role text not null,
  access text not null,
  status text not null check (status in ('Online', 'Istirahat', 'Off'))
);

alter table public.mst_staff_members drop column if exists shift;
alter table public.mst_staff_members drop column if exists phone;

create table if not exists public.mst_staff_credentials (
  staff_id text primary key references public.mst_staff_members (id) on delete cascade,
  password_hash text not null,
  is_owner boolean not null default false,
  is_active boolean not null default true,
  password_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trx_app_sessions (
  id uuid primary key default gen_random_uuid(),
  staff_id text not null references public.mst_staff_members (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists idx_trx_app_sessions_staff_id on public.trx_app_sessions (staff_id);
create index if not exists idx_trx_app_sessions_expires_at on public.trx_app_sessions (expires_at);

alter table public.mst_staff_members add column if not exists auth_user_id uuid unique references auth.users (id) on delete set null;
alter table public.mst_staff_members add column if not exists email text unique;
alter table public.mst_staff_members add column if not exists created_at timestamptz;
alter table public.mst_staff_members add column if not exists created_by text;
alter table public.mst_staff_members add column if not exists last_seen_at timestamptz;
alter table public.mst_staff_members add column if not exists last_login_at timestamptz;
alter table public.mst_staff_members add column if not exists last_logout_at timestamptz;
alter table public.mst_staff_members add column if not exists updated_at timestamptz;
alter table public.mst_staff_members add column if not exists updated_by text;
update public.mst_staff_members
set created_at = coalesce(last_login_at, last_logout_at, last_seen_at, now())
where created_at is null;
update public.mst_staff_members
set updated_at = coalesce(updated_at, created_at, now())
where updated_at is null;
alter table public.mst_staff_members alter column created_at set default now();
alter table public.mst_staff_members alter column created_at set not null;
alter table public.mst_staff_members alter column updated_at set default now();
alter table public.mst_staff_members alter column updated_at set not null;
alter table public.mst_staff_members drop constraint if exists mst_staff_members_created_by_fkey;
alter table public.mst_staff_members add constraint mst_staff_members_created_by_fkey foreign key (created_by) references public.mst_staff_members (id) on delete set null;
alter table public.mst_staff_members drop constraint if exists mst_staff_members_updated_by_fkey;
alter table public.mst_staff_members add constraint mst_staff_members_updated_by_fkey foreign key (updated_by) references public.mst_staff_members (id) on delete set null;
create unique index if not exists idx_mst_staff_members_id_auth_user_id on public.mst_staff_members (id, auth_user_id);

create table if not exists public.trx_staff_session_logs (
  id uuid primary key default gen_random_uuid(),
  staff_id text not null references public.mst_staff_members (id) on delete cascade,
  auth_user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid,
  logged_in_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  logged_out_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_trx_staff_session_logs_staff_auth_session on public.trx_staff_session_logs (staff_id, auth_user_id, session_id);

alter table public.trx_staff_session_logs drop constraint if exists trx_staff_session_logs_staff_auth_match;
alter table public.trx_staff_session_logs
  add constraint trx_staff_session_logs_staff_auth_match
  foreign key (staff_id, auth_user_id)
  references public.mst_staff_members (id, auth_user_id)
  on delete cascade;

create table if not exists public.mst_notification_feed (
  id text primary key,
  sort_order integer not null default 0,
  title text not null,
  message text not null,
  time text not null,
  channel text not null check (channel in ('Telegram', 'Sistem')),
  tone text not null check (tone in ('neutral', 'success', 'warning'))
);

create table if not exists public.mst_cashier_snapshot (
  id text primary key,
  active_cashiers integer not null default 0,
  active_time text not null,
  highlighted_table text not null
);

create table if not exists public.mst_app_settings (
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
  auto_print_receipt boolean not null default false,
  payment_methods jsonb not null default '[{"id":"cash","label":"Tunai","enabled":true},{"id":"debit","label":"Debit","enabled":true},{"id":"qris","label":"QRIS","enabled":true}]'::jsonb,
  menu_categories jsonb not null default '["Espresso","Manual Brew","Non Coffee","Makanan"]'::jsonb
);

alter table public.mst_app_settings add column if not exists payment_methods jsonb not null default '[{"id":"cash","label":"Tunai","enabled":true},{"id":"debit","label":"Debit","enabled":true},{"id":"qris","label":"QRIS","enabled":true}]'::jsonb;
alter table public.mst_app_settings add column if not exists menu_categories jsonb not null default '["Espresso","Manual Brew","Non Coffee","Makanan"]'::jsonb;

create table if not exists public.mst_staff_roles (
  id text primary key,
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true
);

create table if not exists public.mst_staff_role_permissions (
  role_id text not null references public.mst_staff_roles (id) on delete cascade,
  menu_key text not null,
  access_level text not null check (access_level in ('hidden', 'read', 'create', 'manage')),
  primary key (role_id, menu_key)
);

create table if not exists public.mst_notification_settings (
  id text primary key,
  telegram_enabled boolean not null default false,
  bot_token text not null,
  chat_id text not null,
  digest_frequency text not null check (digest_frequency in ('Real-time', 'Per 2 Jam', 'Harian')),
  low_stock_alert boolean not null default true,
  cashier_summary boolean not null default true,
  refund_alert boolean not null default false
);

create table if not exists public.trx_sales_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  payment_method text not null,
  subtotal integer not null default 0,
  tax_amount integer not null default 0,
  total_amount integer not null default 0,
  cashier_name text,
  status text not null default 'paid',
  kitchen_status text check (kitchen_status in ('queue', 'in_progress', 'done')),
  kitchen_started_at timestamptz,
  kitchen_completed_at timestamptz,
  kitchen_updated_by text references public.mst_staff_members (id) on delete set null,
  kitchen_updated_at timestamptz,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.trx_sales_orders add column if not exists cashier_name text;
alter table public.trx_sales_orders add column if not exists kitchen_status text;
alter table public.trx_sales_orders add column if not exists kitchen_started_at timestamptz;
alter table public.trx_sales_orders add column if not exists kitchen_completed_at timestamptz;
alter table public.trx_sales_orders add column if not exists kitchen_updated_by text references public.mst_staff_members (id) on delete set null;
alter table public.trx_sales_orders add column if not exists kitchen_updated_at timestamptz;
alter table public.trx_sales_orders drop constraint if exists trx_sales_orders_kitchen_status_check;
alter table public.trx_sales_orders add constraint trx_sales_orders_kitchen_status_check check (kitchen_status in ('queue', 'in_progress', 'done'));

create table if not exists public.trx_sales_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.trx_sales_orders (id) on delete cascade,
  product_id text not null,
  product_name text not null,
  unit_price integer not null default 0,
  quantity integer not null default 1,
  line_total integer not null default 0,
  notes text
);

alter table public.trx_sales_order_items add column if not exists notes text;

create or replace function public.process_checkout_order(
  p_payment_method text,
  p_subtotal integer,
  p_tax integer,
  p_total integer,
  p_cashier_name text,
  p_items jsonb
)
returns table(order_id uuid, order_number text, created_at timestamptz)
language plpgsql
as $$
declare
  v_order_id uuid;
  v_order_number text := 'TRX-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 10));
  v_created_at timestamptz := now();
  v_product_id_type text;
  v_order_subtotal integer := 0;
  v_tax_rate integer := 0;
  v_order_tax integer := 0;
  v_order_total integer := 0;
  v_missing_count integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'INVALID_ITEM_PAYLOAD';
  end if;

  create temporary table if not exists tmp_checkout_items (
    product_id_text text,
    quantity integer,
    note text
  ) on commit drop;
  truncate table tmp_checkout_items;

  insert into tmp_checkout_items (product_id_text, quantity, note)
  select
    x."productId",
    x.quantity,
    x.note
  from jsonb_to_recordset(p_items) as x(
    "productId" text,
    quantity integer,
    note text
  );

  if not exists (select 1 from tmp_checkout_items) then
    raise exception 'EMPTY_CART';
  end if;

  if exists (
    select 1
    from tmp_checkout_items
    where product_id_text is null
      or quantity is null
  ) then
    raise exception 'INVALID_ITEM_PAYLOAD';
  end if;

  if exists (select 1 from tmp_checkout_items where quantity <= 0) then
    raise exception 'INVALID_QUANTITY';
  end if;

  create temporary table if not exists tmp_checkout_items_agg (
    product_id_text text primary key,
    quantity integer,
    note text
  ) on commit drop;
  truncate table tmp_checkout_items_agg;

  insert into tmp_checkout_items_agg (product_id_text, quantity, note)
  select
    product_id_text,
    sum(quantity),
    string_agg(note, ', ') filter (where note is not null and note <> '')
  from tmp_checkout_items
  group by product_id_text;

  create temporary table if not exists tmp_locked_products (
    product_id_text text primary key,
    product_id_uuid uuid,
    product_name text,
    unit_price integer,
    stock integer,
    deleted_at timestamptz,
    is_active boolean
  ) on commit drop;
  truncate table tmp_locked_products;

  insert into tmp_locked_products (product_id_text, product_id_uuid, product_name, unit_price, stock, deleted_at, is_active)
  select
    p.id::text,
    p.id,
    p.name,
    p.price,
    p.stock,
    p.deleted_at,
    p.is_active
  from public.mst_products p
  join tmp_checkout_items_agg i on p.id::text = i.product_id_text
  for update;

  select count(*) into v_missing_count
  from tmp_checkout_items_agg i
  left join tmp_locked_products p using (product_id_text)
  where p.product_id_text is null;

  if v_missing_count > 0 then
    raise exception 'PRODUCT_NOT_FOUND';
  end if;

  if exists (select 1 from tmp_locked_products where deleted_at is not null or is_active = false) then
    raise exception 'PRODUCT_UNAVAILABLE';
  end if;

  if exists (
    select 1
    from tmp_locked_products p
    join tmp_checkout_items_agg i using (product_id_text)
    where p.stock < i.quantity
  ) then
    raise exception 'INSUFFICIENT_STOCK';
  end if;

  select coalesce(sum(p.unit_price * i.quantity), 0) into v_order_subtotal
  from tmp_locked_products p
  join tmp_checkout_items_agg i using (product_id_text);

  select coalesce(tax_rate, 0) into v_tax_rate
  from public.mst_app_settings
  where id = 'default'
  limit 1;

  v_order_tax := round(v_order_subtotal * (v_tax_rate::numeric / 100))::integer;
  v_order_total := v_order_subtotal + v_order_tax;

  insert into public.trx_sales_orders (
    order_number,
    payment_method,
    subtotal,
    tax_amount,
    total_amount,
    cashier_name,
    status,
    kitchen_status,
    kitchen_updated_at,
    created_at
  )
  values (
    v_order_number,
    p_payment_method,
    v_order_subtotal,
    v_order_tax,
    v_order_total,
    p_cashier_name,
    'paid',
    'queue',
    v_created_at,
    v_created_at
  )
  returning id into v_order_id;

  select data_type into v_product_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'trx_sales_order_items'
    and column_name = 'product_id';

  if v_product_id_type = 'uuid' then
    insert into public.trx_sales_order_items (order_id, product_id, product_name, unit_price, quantity, line_total, notes)
    select v_order_id, p.product_id_uuid, p.product_name, p.unit_price, i.quantity, p.unit_price * i.quantity, i.note
    from tmp_checkout_items_agg i
    join tmp_locked_products p using (product_id_text);
  else
    insert into public.trx_sales_order_items (order_id, product_id, product_name, unit_price, quantity, line_total, notes)
    select v_order_id, p.product_id_text, p.product_name, p.unit_price, i.quantity, p.unit_price * i.quantity, i.note
    from tmp_checkout_items_agg i
    join tmp_locked_products p using (product_id_text);
  end if;

  update public.mst_products p
  set stock = p.stock - i.quantity
  from tmp_checkout_items_agg i
  where p.id::text = i.product_id_text;

  return query
  select v_order_id, v_order_number, v_created_at;
end;
$$;

alter table public.mst_dashboard_stats enable row level security;
alter table public.mst_revenue_points enable row level security;
alter table public.mst_popular_items enable row level security;
alter table public.mst_products enable row level security;
alter table public.mst_staff_members enable row level security;
alter table public.mst_staff_credentials enable row level security;
alter table public.trx_app_sessions enable row level security;
alter table public.mst_notification_feed enable row level security;
alter table public.mst_cashier_snapshot enable row level security;
alter table public.mst_app_settings enable row level security;
alter table public.mst_notification_settings enable row level security;
alter table public.mst_staff_roles enable row level security;
alter table public.mst_staff_role_permissions enable row level security;
alter table public.trx_sales_orders enable row level security;
alter table public.trx_sales_order_items enable row level security;
alter table public.trx_staff_session_logs enable row level security;

drop policy if exists authenticated_read_mst_dashboard_stats on public.mst_dashboard_stats;
create policy authenticated_read_mst_dashboard_stats on public.mst_dashboard_stats for select to authenticated using (true);
drop policy if exists authenticated_read_mst_revenue_points on public.mst_revenue_points;
create policy authenticated_read_mst_revenue_points on public.mst_revenue_points for select to authenticated using (true);
drop policy if exists authenticated_read_mst_popular_items on public.mst_popular_items;
create policy authenticated_read_mst_popular_items on public.mst_popular_items for select to authenticated using (true);
drop policy if exists authenticated_read_mst_products on public.mst_products;
create policy authenticated_read_mst_products on public.mst_products for select to authenticated using (true);
drop policy if exists authenticated_read_mst_staff_members on public.mst_staff_members;
create policy authenticated_read_mst_staff_members on public.mst_staff_members for select to authenticated using (true);
drop policy if exists authenticated_update_own_mst_staff_members on public.mst_staff_members;
create policy authenticated_update_own_mst_staff_members on public.mst_staff_members for update to authenticated using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);
drop policy if exists authenticated_read_mst_notification_feed on public.mst_notification_feed;
create policy authenticated_read_mst_notification_feed on public.mst_notification_feed for select to authenticated using (true);
drop policy if exists authenticated_read_mst_cashier_snapshot on public.mst_cashier_snapshot;
create policy authenticated_read_mst_cashier_snapshot on public.mst_cashier_snapshot for select to authenticated using (true);
drop policy if exists authenticated_read_mst_app_settings on public.mst_app_settings;
create policy authenticated_read_mst_app_settings on public.mst_app_settings for select to authenticated using (true);
drop policy if exists authenticated_upsert_mst_app_settings on public.mst_app_settings;
create policy authenticated_upsert_mst_app_settings on public.mst_app_settings for all to authenticated using (true) with check (true);
drop policy if exists authenticated_read_mst_notification_settings on public.mst_notification_settings;
create policy authenticated_read_mst_notification_settings on public.mst_notification_settings for select to authenticated using (true);
drop policy if exists authenticated_upsert_mst_notification_settings on public.mst_notification_settings;
create policy authenticated_upsert_mst_notification_settings on public.mst_notification_settings for all to authenticated using (true) with check (true);
drop policy if exists authenticated_read_mst_staff_roles on public.mst_staff_roles;
create policy authenticated_read_mst_staff_roles on public.mst_staff_roles for select to authenticated using (true);
drop policy if exists authenticated_upsert_mst_staff_roles on public.mst_staff_roles;
create policy authenticated_upsert_mst_staff_roles on public.mst_staff_roles for all to authenticated using (true) with check (true);
drop policy if exists authenticated_read_mst_staff_role_permissions on public.mst_staff_role_permissions;
create policy authenticated_read_mst_staff_role_permissions on public.mst_staff_role_permissions for select to authenticated using (true);
drop policy if exists authenticated_upsert_mst_staff_role_permissions on public.mst_staff_role_permissions;
create policy authenticated_upsert_mst_staff_role_permissions on public.mst_staff_role_permissions for all to authenticated using (true) with check (true);
drop policy if exists authenticated_insert_trx_sales_orders on public.trx_sales_orders;
create policy authenticated_insert_trx_sales_orders on public.trx_sales_orders for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists authenticated_read_trx_sales_orders on public.trx_sales_orders;
create policy authenticated_read_trx_sales_orders on public.trx_sales_orders for select to authenticated using (auth.uid() = user_id);
drop policy if exists authenticated_insert_trx_sales_order_items on public.trx_sales_order_items;
create policy authenticated_insert_trx_sales_order_items on public.trx_sales_order_items for insert to authenticated with check (true);
drop policy if exists authenticated_read_trx_sales_order_items on public.trx_sales_order_items;
create policy authenticated_read_trx_sales_order_items on public.trx_sales_order_items for select to authenticated using (
  exists (
    select 1
    from public.trx_sales_orders
    where trx_sales_orders.id = trx_sales_order_items.order_id
      and trx_sales_orders.user_id = auth.uid()
  )
);
drop policy if exists authenticated_read_trx_staff_session_logs on public.trx_staff_session_logs;
create policy authenticated_read_trx_staff_session_logs on public.trx_staff_session_logs for select to authenticated using (auth.uid() = auth_user_id);
drop policy if exists authenticated_insert_trx_staff_session_logs on public.trx_staff_session_logs;
create policy authenticated_insert_trx_staff_session_logs on public.trx_staff_session_logs for insert to authenticated with check (auth.uid() = auth_user_id);
drop policy if exists authenticated_update_own_trx_staff_session_logs on public.trx_staff_session_logs;
create policy authenticated_update_own_trx_staff_session_logs on public.trx_staff_session_logs for update to authenticated using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

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

insert into public.mst_products (id, name, category, description, price, stock, is_active, image_path)
values
  ('11111111-1111-4111-8111-111111111111', 'Caramel Macchiato', 'Espresso', 'Espresso, susu steamed, dan caramel drizzle.', 34000, 42, true, null),
  ('22222222-2222-4222-8222-222222222222', 'Flat White', 'Espresso', 'Body creamy dengan roast cokelat kacang.', 30000, 35, true, null),
  ('33333333-3333-4333-8333-333333333333', 'V60 Kintamani', 'Manual Brew', 'Profil citrus floral dengan body ringan.', 36000, 16, true, null),
  ('44444444-4444-4444-8444-444444444444', 'Aren Latte', 'Non Coffee', 'Latte susu aren dengan tekstur lembut.', 32000, 28, true, null),
  ('55555555-5555-4555-8555-555555555555', 'Matcha Cloud', 'Non Coffee', 'Matcha creamy dengan foam vanilla tipis.', 33000, 10, true, null),
  ('66666666-6666-4666-8666-666666666666', 'Beef Burger & Chips', 'Makanan', 'Burger signature dengan kentang renyah.', 52000, 18, true, null),
  ('77777777-7777-4777-8777-777777777777', 'Croissant Almond', 'Makanan', 'Butter croissant dengan taburan almond panggang.', 28000, 9, true, null),
  ('88888888-8888-4888-8888-888888888888', 'Spanish Latte', 'Espresso', 'Espresso blend, susu, dan condensed milk.', 34000, 24, true, null)
on conflict do nothing;

insert into public.mst_staff_members (id, name, role, access, status)
values
  ('stf-001', 'Aa Nden', 'Owner', 'Penuh', 'Online'),
  ('stf-002', 'Nabila Putri', 'Supervisor', 'Operasional', 'Online'),
  ('stf-003', 'Raka Aditama', 'Kasir', 'Kasir', 'Istirahat'),
  ('stf-004', 'Salsa Maharani', 'Barista', 'Operasional', 'Online'),
  ('stf-005', 'Bima Prakoso', 'Kasir', 'Kasir', 'Off')
on conflict do nothing;

insert into public.mst_staff_roles (id, name, sort_order, is_active)
values
  ('owner', 'Owner', 1, true),
  ('kasir', 'Kasir', 2, true),
  ('supervisor', 'Supervisor', 3, true),
  ('barista', 'Barista', 4, true)
on conflict (id) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.mst_staff_role_permissions (role_id, menu_key, access_level)
values
  ('owner', 'dashboard', 'manage'),
  ('owner', 'kasir', 'manage'),
  ('owner', 'dapur', 'manage'),
  ('owner', 'invoice-kasir', 'manage'),
  ('owner', 'produk', 'manage'),
  ('owner', 'staf', 'manage'),
  ('owner', 'notifikasi', 'manage'),
  ('owner', 'pengaturan', 'manage'),
  ('supervisor', 'dashboard', 'read'),
  ('supervisor', 'kasir', 'create'),
  ('supervisor', 'dapur', 'create'),
  ('supervisor', 'invoice-kasir', 'read'),
  ('supervisor', 'produk', 'create'),
  ('supervisor', 'staf', 'hidden'),
  ('supervisor', 'notifikasi', 'read'),
  ('supervisor', 'pengaturan', 'hidden'),
  ('kasir', 'dashboard', 'hidden'),
  ('kasir', 'kasir', 'create'),
  ('kasir', 'dapur', 'hidden'),
  ('kasir', 'invoice-kasir', 'hidden'),
  ('kasir', 'produk', 'hidden'),
  ('kasir', 'staf', 'hidden'),
  ('kasir', 'notifikasi', 'hidden'),
  ('kasir', 'pengaturan', 'hidden'),
  ('barista', 'dashboard', 'hidden'),
  ('barista', 'kasir', 'create'),
  ('barista', 'dapur', 'create'),
  ('barista', 'invoice-kasir', 'hidden'),
  ('barista', 'produk', 'hidden'),
  ('barista', 'staf', 'hidden'),
  ('barista', 'notifikasi', 'hidden'),
  ('barista', 'pengaturan', 'hidden')
on conflict (role_id, menu_key) do update set
  access_level = excluded.access_level;

update public.mst_staff_members sm
set role_id = sr.id
from public.mst_staff_roles sr
where lower(sm.role) = lower(sr.name)
  and (sm.role_id is null or sm.role_id <> sr.id);

alter table public.mst_staff_members drop constraint if exists mst_staff_members_role_id_fkey;
alter table public.mst_staff_members
  add constraint mst_staff_members_role_id_fkey
  foreign key (role_id)
  references public.mst_staff_roles (id)
  on delete restrict;

update public.mst_staff_members
set email = 'owner@coffeebean.local', access = 'Penuh'
where id = 'stf-001';

insert into public.mst_staff_credentials (staff_id, password_hash, is_owner, is_active)
values ('stf-001', crypt('coffeebean', gen_salt('bf', 12)), true, true)
on conflict (staff_id)
do update set
  password_hash = excluded.password_hash,
  is_owner = true,
  is_active = true,
  updated_at = now(),
  password_updated_at = now();

insert into public.mst_notification_feed (id, sort_order, title, message, time, channel, tone)
values
  ('notif-001', 1, 'Stok Matcha Cloud menipis', 'Sisa stok 10 porsi. Pertimbangkan reorder sebelum peak sore.', '5 menit lalu', 'Telegram', 'warning'),
  ('notif-002', 2, 'Kasir shift pagi ditutup', 'Ringkasan transaksi Rp 6.480.000 berhasil dikirim ke grup owner.', '35 menit lalu', 'Telegram', 'success'),
  ('notif-003', 3, 'Printer struk status normal', 'Perangkat front counter kembali terhubung setelah restart otomatis.', '1 jam lalu', 'Sistem', 'neutral')
on conflict do nothing;

insert into public.mst_cashier_snapshot (id, active_cashiers, active_time, highlighted_table)
values ('default', 3, '23.42', 'Counter A')
on conflict (id) do nothing;

insert into public.mst_app_settings (
  id, store_name, branch_name, tax_rate, service_fee, store_phone, receipt_footer, bank_name, bank_account_name, bank_account_number, opening_cash, auto_print_receipt, payment_methods, menu_categories
)
values (
  'default', 'Coffee Bean Signature', 'Cabang Setiabudi', 11, 5, '021-5550-7788', 'Terima kasih sudah menikmati racikan kami. Sampai jumpa lagi!', 'Bank Central Asia', 'PT Coffee Bean Nusantara', '112233445566', 750000, true, '[{"id":"cash","label":"Tunai","enabled":true},{"id":"debit","label":"Debit","enabled":true},{"id":"qris","label":"QRIS","enabled":true}]'::jsonb, '["Espresso","Manual Brew","Non Coffee","Makanan"]'::jsonb
)
on conflict (id) do update set
  payment_methods = coalesce(public.mst_app_settings.payment_methods, excluded.payment_methods),
  menu_categories = coalesce(public.mst_app_settings.menu_categories, excluded.menu_categories);

insert into public.mst_notification_settings (
  id, telegram_enabled, bot_token, chat_id, digest_frequency, low_stock_alert, cashier_summary, refund_alert
)
values (
  'default', true, 'placeholder-telegram-bot-token', 'placeholder-chat-room-id', 'Real-time', true, true, false
)
on conflict (id) do nothing;
