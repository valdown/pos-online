-- Add notes column to trx_sales_order_items
ALTER TABLE public.trx_sales_order_items ADD COLUMN IF NOT EXISTS notes text;

-- Update process_checkout_order to support notes
CREATE OR REPLACE FUNCTION public.process_checkout_order(
  p_payment_method text,
  p_subtotal integer,
  p_tax integer,
  p_total integer,
  p_cashier_name text,
  p_items jsonb
)
RETURNS TABLE(order_id uuid, order_number text, created_at timestamptz)
LANGUAGE plpgsql
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text := 'TRX-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 10));
  v_created_at timestamptz := now();
  v_product_id_type text;
  v_order_subtotal integer := 0;
  v_tax_rate integer := 0;
  v_order_tax integer := 0;
  v_order_total integer := 0;
  v_missing_count integer;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'INVALID_ITEM_PAYLOAD';
  END IF;

  CREATE TEMPORARY TABLE IF NOT EXISTS tmp_checkout_items (
    product_id_text text,
    quantity integer,
    note text
  ) ON COMMIT DROP;
  TRUNCATE TABLE tmp_checkout_items;

  INSERT INTO tmp_checkout_items (product_id_text, quantity, note)
  SELECT x."productId", x.quantity, x.note
  FROM jsonb_to_recordset(p_items) AS x("productId" text, quantity integer, note text);

  IF NOT EXISTS (SELECT 1 FROM tmp_checkout_items) THEN
    RAISE EXCEPTION 'EMPTY_CART';
  END IF;

  IF EXISTS (SELECT 1 FROM tmp_checkout_items WHERE product_id_text IS NULL OR quantity IS NULL) THEN
    RAISE EXCEPTION 'INVALID_ITEM_PAYLOAD';
  END IF;

  IF EXISTS (SELECT 1 FROM tmp_checkout_items WHERE quantity <= 0) THEN
    RAISE EXCEPTION 'INVALID_QUANTITY';
  END IF;

  CREATE TEMPORARY TABLE IF NOT EXISTS tmp_checkout_items_agg (
    product_id_text text PRIMARY KEY,
    quantity integer,
    note text
  ) ON COMMIT DROP;
  TRUNCATE TABLE tmp_checkout_items_agg;

  INSERT INTO tmp_checkout_items_agg (product_id_text, quantity, note)
  SELECT product_id_text, sum(quantity), string_agg(note, ', ') FILTER (WHERE note IS NOT NULL AND note <> '')
  FROM tmp_checkout_items
  GROUP BY product_id_text;

  CREATE TEMPORARY TABLE IF NOT EXISTS tmp_locked_products (
    product_id_text text PRIMARY KEY,
    product_id_uuid uuid,
    product_name text,
    unit_price integer,
    stock integer,
    deleted_at timestamptz,
    is_active boolean
  ) ON COMMIT DROP;
  TRUNCATE TABLE tmp_locked_products;

  INSERT INTO tmp_locked_products (product_id_text, product_id_uuid, product_name, unit_price, stock, deleted_at, is_active)
  SELECT p.id::text, p.id, p.name, p.price, p.stock, p.deleted_at, p.is_active
  FROM public.mst_products p
  JOIN tmp_checkout_items_agg i ON p.id::text = i.product_id_text
  FOR UPDATE;

  SELECT count(*) INTO v_missing_count
  FROM tmp_checkout_items_agg i
  LEFT JOIN tmp_locked_products p USING (product_id_text)
  WHERE p.product_id_text IS NULL;

  IF v_missing_count > 0 THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND';
  END IF;

  IF EXISTS (SELECT 1 FROM tmp_locked_products WHERE deleted_at IS NOT NULL OR is_active = false) THEN
    RAISE EXCEPTION 'PRODUCT_UNAVAILABLE';
  END IF;

  IF EXISTS (
    SELECT 1 FROM tmp_locked_products p
    JOIN tmp_checkout_items_agg i USING (product_id_text)
    WHERE p.stock < i.quantity
  ) THEN
    RAISE EXCEPTION 'INSUFFICIENT_STOCK';
  END IF;

  SELECT coalesce(sum(p.unit_price * i.quantity), 0) INTO v_order_subtotal
  FROM tmp_locked_products p
  JOIN tmp_checkout_items_agg i USING (product_id_text);

  SELECT coalesce(tax_rate, 0) INTO v_tax_rate
  FROM public.mst_app_settings WHERE id = 'default' LIMIT 1;

  v_order_tax := round(v_order_subtotal * (v_tax_rate::numeric / 100))::integer;
  v_order_total := v_order_subtotal + v_order_tax;

  INSERT INTO public.trx_sales_orders (
    order_number, payment_method, subtotal, tax_amount, total_amount,
    cashier_name, status, kitchen_status, kitchen_updated_at, created_at
  ) VALUES (
    v_order_number, p_payment_method, v_order_subtotal, v_order_tax, v_order_total,
    p_cashier_name, 'paid', 'queue', v_created_at, v_created_at
  ) RETURNING id INTO v_order_id;

  SELECT data_type INTO v_product_id_type
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'trx_sales_order_items' AND column_name = 'product_id';

  IF v_product_id_type = 'uuid' THEN
    INSERT INTO public.trx_sales_order_items (order_id, product_id, product_name, unit_price, quantity, line_total, notes)
    SELECT v_order_id, p.product_id_uuid, p.product_name, p.unit_price, i.quantity, p.unit_price * i.quantity, i.note
    FROM tmp_checkout_items_agg i JOIN tmp_locked_products p USING (product_id_text);
  ELSE
    INSERT INTO public.trx_sales_order_items (order_id, product_id, product_name, unit_price, quantity, line_total, notes)
    SELECT v_order_id, p.product_id_text, p.product_name, p.unit_price, i.quantity, p.unit_price * i.quantity, i.note
    FROM tmp_checkout_items_agg i JOIN tmp_locked_products p USING (product_id_text);
  END IF;

  UPDATE public.mst_products p
  SET stock = p.stock - i.quantity
  FROM tmp_checkout_items_agg i
  WHERE p.id::text = i.product_id_text;

  RETURN QUERY SELECT v_order_id, v_order_number, v_created_at;
END;
$$;
