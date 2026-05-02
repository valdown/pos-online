begin;

alter table public.mst_products drop constraint if exists mst_products_pkey;
alter table public.mst_products rename column id to id_uuid;
alter table public.mst_products rename column legacy_id to id;
alter table public.mst_products add constraint mst_products_pkey primary key (id);
alter table public.mst_products alter column id_uuid drop default;

alter table public.trx_sales_order_items rename column product_id to product_id_uuid;
alter table public.trx_sales_order_items rename column legacy_product_id to product_id;

commit;
