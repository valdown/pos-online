begin;

create extension if not exists pgcrypto;

create table if not exists public.product_id_uuid_migration_map (
  old_product_id text primary key,
  new_product_id uuid not null unique,
  created_at timestamptz not null default now()
);

insert into public.product_id_uuid_migration_map (old_product_id, new_product_id)
select p.id, gen_random_uuid()
from public.mst_products p
where not exists (
  select 1
  from public.product_id_uuid_migration_map m
  where m.old_product_id = p.id
);

alter table public.mst_products add column if not exists id_uuid uuid;
alter table public.trx_sales_order_items add column if not exists product_id_uuid uuid;

update public.mst_products p
set id_uuid = m.new_product_id
from public.product_id_uuid_migration_map m
where p.id = m.old_product_id
  and p.id_uuid is null;

update public.trx_sales_order_items soi
set product_id_uuid = m.new_product_id
from public.product_id_uuid_migration_map m
where soi.product_id = m.old_product_id
  and soi.product_id_uuid is null;

alter table public.mst_products drop constraint if exists mst_products_pkey;
alter table public.mst_products drop constraint if exists products_pkey;
alter table public.mst_products rename column id to legacy_id;
alter table public.mst_products rename column id_uuid to id;
alter table public.mst_products alter column id set default gen_random_uuid();
alter table public.mst_products alter column id set not null;
alter table public.mst_products add constraint mst_products_pkey primary key (id);

alter table public.trx_sales_order_items rename column product_id to legacy_product_id;
alter table public.trx_sales_order_items rename column product_id_uuid to product_id;
alter table public.trx_sales_order_items alter column product_id set not null;

commit;
