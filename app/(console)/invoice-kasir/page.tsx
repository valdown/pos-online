import { InvoiceKasirClient } from "@/components/invoice/invoice-kasir-client";
import type { CashierInvoice } from "@/lib/mock-data";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mapSalesOrderRowsToCashierInvoices, type SalesOrderRow } from "@/lib/supabase/invoices";

export const dynamic = "force-dynamic";

async function getCashierInvoices() {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return [] as CashierInvoice[];
  }

  const { data, error } = await supabase
    .from("sales_orders")
    .select(
      "id, order_number, payment_method, subtotal, tax_amount, total_amount, created_at, cashier_name, sales_order_items(product_id, product_name, unit_price, quantity, line_total)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return [] as CashierInvoice[];
  }

  return mapSalesOrderRowsToCashierInvoices((data ?? []) as SalesOrderRow[]);
}

export default async function InvoiceKasirPage() {
  const invoices = await getCashierInvoices();

  return <InvoiceKasirClient invoices={invoices} />;
}
