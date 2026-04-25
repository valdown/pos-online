-- Run this in the Supabase SQL Editor to align the current app code
-- with the existing schema and invoice-kasir integration.

alter table public.sales_orders add column if not exists cashier_name text;

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
  payment_methods
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
  '[{"id":"cash","label":"Tunai","enabled":true},{"id":"debit","label":"Debit","enabled":true},{"id":"qris","label":"QRIS","enabled":true}]'::jsonb
)
on conflict (id) do nothing;

alter table public.app_settings add column if not exists payment_methods jsonb not null default '[{"id":"cash","label":"Tunai","enabled":true},{"id":"debit","label":"Debit","enabled":true},{"id":"qris","label":"QRIS","enabled":true}]'::jsonb;

update public.app_settings
set payment_methods = '[{"id":"cash","label":"Tunai","enabled":true},{"id":"debit","label":"Debit","enabled":true},{"id":"qris","label":"QRIS","enabled":true}]'::jsonb
where payment_methods is null;

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
