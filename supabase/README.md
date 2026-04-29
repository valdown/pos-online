# Supabase SQL Run Guide

## Source of truth

- `schema.sql` is the primary setup file for the current repository state.
- Use `schema.sql` for fresh databases and for full alignment with the current app code.

## Existing database run order

For an existing database, use this order:

1. `sql/dashboard-dedupe.sql` only if dashboard data has duplicate rows.
2. `schema.sql`
3. `sql/menu-queries.sql` only for manual verification.

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
