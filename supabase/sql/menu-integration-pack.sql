-- Compatibility/backfill helper for an existing database.
-- Prefer `../schema.sql` as the primary setup file for the current repo state.
-- Use this file only when you intentionally need a smaller patch for an older DB.
-- This file is safe only after the base tables already exist.

alter table public.sales_orders add column if not exists cashier_name text;
alter table public.products add column if not exists image_path text;

alter table public.app_settings add column if not exists payment_methods jsonb not null default '[{"id":"cash","label":"Tunai","enabled":true},{"id":"debit","label":"Debit","enabled":true},{"id":"qris","label":"QRIS","enabled":true}]'::jsonb;
alter table public.app_settings add column if not exists menu_categories jsonb not null default '["Espresso","Manual Brew","Non Coffee","Makanan"]'::jsonb;

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

insert into public.app_settings (
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

update public.app_settings
set payment_methods = '[{"id":"cash","label":"Tunai","enabled":true},{"id":"debit","label":"Debit","enabled":true},{"id":"qris","label":"QRIS","enabled":true}]'::jsonb
where payment_methods is null;

update public.app_settings
set menu_categories = '["Espresso","Manual Brew","Non Coffee","Makanan"]'::jsonb
where menu_categories is null;

insert into public.notification_settings (
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

update public.sales_orders
set cashier_name = coalesce(nullif(cashier_name, ''), 'Kasir Online')
where cashier_name is null or cashier_name = '';
