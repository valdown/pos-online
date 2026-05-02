-- Compatibility/backfill helper for an existing database.
-- Prefer `../schema.sql` as the primary setup file for the current repo state.
-- Use this file only when you intentionally need a smaller patch for an older DB.
-- This file is safe only after the base tables already exist.

alter table public.trx_sales_orders add column if not exists cashier_name text;
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
  ('owner', 'invoice-kasir', 'manage'),
  ('owner', 'produk', 'manage'),
  ('owner', 'staf', 'manage'),
  ('owner', 'notifikasi', 'manage'),
  ('owner', 'pengaturan', 'manage'),
  ('supervisor', 'dashboard', 'read'),
  ('supervisor', 'kasir', 'create'),
  ('supervisor', 'invoice-kasir', 'read'),
  ('supervisor', 'produk', 'create'),
  ('supervisor', 'staf', 'hidden'),
  ('supervisor', 'notifikasi', 'read'),
  ('supervisor', 'pengaturan', 'hidden'),
  ('kasir', 'dashboard', 'hidden'),
  ('kasir', 'kasir', 'create'),
  ('kasir', 'invoice-kasir', 'hidden'),
  ('kasir', 'produk', 'hidden'),
  ('kasir', 'staf', 'hidden'),
  ('kasir', 'notifikasi', 'hidden'),
  ('kasir', 'pengaturan', 'hidden'),
  ('barista', 'dashboard', 'hidden'),
  ('barista', 'kasir', 'create'),
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
