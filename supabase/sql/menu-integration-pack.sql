-- Compatibility/backfill helper for an existing database.
-- Prefer `../schema.sql` as the primary setup file for the current repo state.
-- Use this file only when you intentionally need a smaller patch for an older DB.
-- This file is safe only after the base tables already exist.

alter table public.trx_sales_orders add column if not exists cashier_name text;
alter table public.trx_sales_orders add column if not exists kitchen_status text;
alter table public.trx_sales_orders add column if not exists kitchen_started_at timestamptz;
alter table public.trx_sales_orders add column if not exists kitchen_completed_at timestamptz;
alter table public.trx_sales_orders add column if not exists kitchen_updated_by text references public.mst_staff_members (id) on delete set null;
alter table public.trx_sales_orders add column if not exists kitchen_updated_at timestamptz;
alter table public.trx_sales_orders drop constraint if exists trx_sales_orders_kitchen_status_check;
alter table public.trx_sales_orders add constraint trx_sales_orders_kitchen_status_check check (kitchen_status in ('queue', 'in_progress', 'done'));
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
alter table public.mst_staff_members drop column if exists shift;
alter table public.mst_staff_members drop column if exists phone;
alter table public.mst_staff_members add column if not exists role_id text;
alter table public.mst_staff_members add column if not exists created_at timestamptz;
alter table public.mst_staff_members add column if not exists created_by text;
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
alter table public.mst_products drop column if exists sku;
alter table public.mst_products drop column if exists sold_today;
alter table public.mst_products add column if not exists image_path text;
alter table public.mst_products add column if not exists deleted_at timestamptz;
alter table public.mst_products add column if not exists is_active boolean not null default true;

update public.mst_products
set is_active = true
where is_active is null;

alter table public.mst_app_settings add column if not exists payment_methods jsonb not null default '[{"id":"cash","label":"Tunai","enabled":true},{"id":"debit","label":"Debit","enabled":true},{"id":"qris","label":"QRIS","enabled":true}]'::jsonb;
alter table public.mst_app_settings add column if not exists menu_categories jsonb not null default '["Espresso","Manual Brew","Non Coffee","Makanan"]'::jsonb;

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

alter table public.mst_staff_roles enable row level security;
drop policy if exists authenticated_read_mst_staff_roles on public.mst_staff_roles;
create policy authenticated_read_mst_staff_roles on public.mst_staff_roles for select to authenticated using (true);
drop policy if exists authenticated_upsert_mst_staff_roles on public.mst_staff_roles;
create policy authenticated_upsert_mst_staff_roles on public.mst_staff_roles for all to authenticated using (true) with check (true);
alter table public.mst_staff_role_permissions enable row level security;
drop policy if exists authenticated_read_mst_staff_role_permissions on public.mst_staff_role_permissions;
create policy authenticated_read_mst_staff_role_permissions on public.mst_staff_role_permissions for select to authenticated using (true);
drop policy if exists authenticated_upsert_mst_staff_role_permissions on public.mst_staff_role_permissions;
create policy authenticated_upsert_mst_staff_role_permissions on public.mst_staff_role_permissions for all to authenticated using (true) with check (true);

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

insert into public.mst_app_settings (
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
  auto_print_receipt,
  payment_methods,
  menu_categories
)
values (
  'default',
  'Coffee Bean Signature',
  'Cabang Setiabudi',
  11,
  5,
  '021-5550-7788',
  'Terima kasih sudah menikmati racikan kami. Sampai jumpa lagi!',
  'Bank Central Asia',
  'PT Coffee Bean Nusantara',
  '112233445566',
  750000,
  true,
  '[{"id":"cash","label":"Tunai","enabled":true},{"id":"debit","label":"Debit","enabled":true},{"id":"qris","label":"QRIS","enabled":true}]'::jsonb,
  '["Espresso","Manual Brew","Non Coffee","Makanan"]'::jsonb
)
on conflict (id) do nothing;

update public.mst_app_settings
set payment_methods = '[{"id":"cash","label":"Tunai","enabled":true},{"id":"debit","label":"Debit","enabled":true},{"id":"qris","label":"QRIS","enabled":true}]'::jsonb
where payment_methods is null;

update public.mst_app_settings
set menu_categories = '["Espresso","Manual Brew","Non Coffee","Makanan"]'::jsonb
where menu_categories is null;

insert into public.mst_notification_settings (
  id,
  telegram_enabled,
  bot_token,
  chat_id,
  digest_frequency,
  low_stock_alert,
  cashier_summary,
  refund_alert
)
values (
  'default',
  true,
  'placeholder-telegram-bot-token',
  'placeholder-chat-room-id',
  'Real-time',
  true,
  true,
  false
)
on conflict (id) do nothing;

update public.trx_sales_orders
set cashier_name = coalesce(nullif(cashier_name, ''), 'Kasir Online')
where cashier_name is null or cashier_name = '';

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
    quantity integer
  ) on commit drop;
  truncate table tmp_checkout_items;

  insert into tmp_checkout_items (product_id_text, quantity)
  select
    x."productId",
    x.quantity
  from jsonb_to_recordset(p_items) as x(
    "productId" text,
    quantity integer
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
    quantity integer
  ) on commit drop;
  truncate table tmp_checkout_items_agg;

  insert into tmp_checkout_items_agg (product_id_text, quantity)
  select
    product_id_text,
    sum(quantity)
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
    insert into public.trx_sales_order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    select v_order_id, p.product_id_uuid, p.product_name, p.unit_price, i.quantity, p.unit_price * i.quantity
    from tmp_checkout_items_agg i
    join tmp_locked_products p using (product_id_text);
  else
    insert into public.trx_sales_order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    select v_order_id, p.product_id_text, p.product_name, p.unit_price, i.quantity, p.unit_price * i.quantity
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
