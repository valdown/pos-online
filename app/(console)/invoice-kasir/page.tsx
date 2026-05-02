import { InvoiceKasirClient } from "@/components/invoice/invoice-kasir-client";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mapSalesOrderRowsToCashierInvoiceListItems, type CashierInvoiceListItem, type SalesOrderRow } from "@/lib/supabase/invoices";

export const dynamic = "force-dynamic";

async function getCashierInvoices() {
  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return [] as CashierInvoiceListItem[];
  }

  const { data, error } = await supabase
    .from("trx_sales_orders")
    .select(
      "id, order_number, payment_method, subtotal, tax_amount, total_amount, created_at, cashier_name, sales_order_items:trx_sales_order_items(product_name, quantity)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return [] as CashierInvoiceListItem[];
  }

  return mapSalesOrderRowsToCashierInvoiceListItems((data ?? []) as SalesOrderRow[]);
}

export default async function InvoiceKasirPage() {
  const invoices = await getCashierInvoices();

  return <InvoiceKasirClient invoices={invoices} />;
}
