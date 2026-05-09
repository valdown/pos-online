-- Add kitchen columns to trx_sales_orders if they don't exist
ALTER TABLE public.trx_sales_orders ADD COLUMN IF NOT EXISTS kitchen_status text;
ALTER TABLE public.trx_sales_orders ADD COLUMN IF NOT EXISTS kitchen_started_at timestamptz;
ALTER TABLE public.trx_sales_orders ADD COLUMN IF NOT EXISTS kitchen_completed_at timestamptz;
ALTER TABLE public.trx_sales_orders ADD COLUMN IF NOT EXISTS kitchen_updated_by text REFERENCES public.mst_staff_members (id) ON DELETE SET NULL;
ALTER TABLE public.trx_sales_orders ADD COLUMN IF NOT EXISTS kitchen_updated_at timestamptz;

ALTER TABLE public.trx_sales_orders DROP CONSTRAINT IF EXISTS trx_sales_orders_kitchen_status_check;
ALTER TABLE public.trx_sales_orders ADD CONSTRAINT trx_sales_orders_kitchen_status_check CHECK (kitchen_status IN ('queue', 'in_progress', 'done'));

-- Backfill: set kitchen_status = 'queue' for all paid orders that don't have a kitchen_status yet
UPDATE public.trx_sales_orders
SET kitchen_status = 'queue',
    kitchen_updated_at = COALESCE(kitchen_updated_at, created_at)
WHERE status = 'paid'
  AND kitchen_status IS NULL;
