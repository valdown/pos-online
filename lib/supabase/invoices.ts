import type { CashierInvoice } from "@/lib/mock-data";

export type SalesOrderItemRow = {
  product_name: string;
  quantity: number;
};

export type SalesOrderRow = {
  id: string;
  order_number: string;
  payment_method: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  created_at: string;
  cashier_name: string | null;
  sales_order_items: SalesOrderItemRow[] | null;
};

export type CashierInvoiceListItem = Omit<CashierInvoice, "items"> & {
  menuNames: string;
  totalQuantity: number;
};

function normalizePaymentMethod(value: string): CashierInvoice["paymentMethod"] {
  if (value === "cash" || value === "debit" || value === "qris") {
    return value;
  }

  return "cash";
}

export function mapSalesOrderRowToCashierInvoiceListItem(row: SalesOrderRow): CashierInvoiceListItem {
  const items = row.sales_order_items ?? [];

  return {
    id: row.id,
    orderNumber: row.order_number,
    createdAt: row.created_at,
    menuNames: items.map((item) => item.product_name).join(", "),
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: row.subtotal,
    tax: row.tax_amount,
    total: row.total_amount,
    cashierName: row.cashier_name ?? "Kasir Online",
    paymentMethod: normalizePaymentMethod(row.payment_method),
  };
}

export function mapSalesOrderRowsToCashierInvoiceListItems(rows: SalesOrderRow[]) {
  return rows.map(mapSalesOrderRowToCashierInvoiceListItem);
}
