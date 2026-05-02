select count(*) as products_without_uuid
from public.mst_products
where id is null;

select count(*) as order_items_without_product_uuid
from public.trx_sales_order_items
where product_id is null;

select count(*) as products_with_legacy_id_missing
from public.mst_products
where legacy_id is null;

select count(*) as order_items_with_legacy_product_id_missing
from public.trx_sales_order_items
where legacy_product_id is null;

select count(*) as unmapped_order_items
from public.trx_sales_order_items soi
left join public.mst_products p on p.id = soi.product_id
where p.id is null;
