# Supabase SQL Run Guide

## Source of truth

- `schema.sql` is the primary setup file for the current repository state.
- Use `schema.sql` for fresh databases and for full alignment with the current app code.

## Existing database run order

For an existing database, use this order:

1. `sql/dashboard-dedupe.sql` only if dashboard data has duplicate rows.
2. `schema.sql`
3. `sql/menu-queries.sql` only for manual verification.

## Existing database rename to `mst_*` / `trx_*`

If you are migrating an existing database from the legacy table names to the new naming convention:

1. `sql/rename-mst-trx.sql`
2. deploy the app code that already uses the renamed tables
3. `sql/rename-mst-trx-verify.sql`

Rollback helper:

- `sql/rename-mst-trx-rollback.sql`

## Helper files

- `sql/internal-owner-auth.sql`
  - Legacy helper for owner auth bootstrap on older databases.
  - Skip this if you already ran `schema.sql`.

- `sql/menu-integration-pack.sql`
  - Compatibility/backfill helper for older existing databases.
  - Use only when you intentionally want a smaller patch than `schema.sql`.
  - Skip this if you already ran `schema.sql` from the current repo state.

- `sql/dashboard-dedupe.sql`
  - Repair helper only.
  - Run only when dashboard KPI/chart rows are duplicated.

- `sql/menu-queries.sql`
  - Manual query pack only.
  - Never treat this file as a migration.

## Product image uploads

- Product images use Supabase Storage bucket: `product-images`
- Product image object path pattern:
  - `products/<product-id>-<timestamp>.<ext>`
- Allowed upload MIME types:
  - `image/jpeg`
  - `image/webp`
- Maximum target file size after browser compression:
  - `1MB`
- Product rows store the storage object path in `products.image_path`

## Product ID UUID migration

- Existing DB UUID migration scripts:
  - `sql/product-id-uuid-migration.sql`
  - `sql/product-id-uuid-verify.sql`
  - `sql/product-id-uuid-rollback.sql`
- This migration converts `mst_products.id` and `trx_sales_order_items.product_id` from text IDs to UUIDs.
- Existing `image_path` values are preserved; new uploads will naturally use UUID-based product IDs in the object path.
