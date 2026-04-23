import type { CashierInvoice, CashierInvoiceItem } from "@/lib/mock-data";

export type SalesOrderItemRow = {
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
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

function normalizePaymentMethod(value: string): CashierInvoice["paymentMethod"] {
  if (value === "cash" || value === "debit" || value === "qris") {
    return value;
  }

  return "cash";
}

function mapSalesOrderItemRow(row: SalesOrderItemRow): CashierInvoiceItem {
  return {
    productId: row.product_id,
    productName: row.product_name,
    unitPrice: row.unit_price,
    quantity: row.quantity,
    lineTotal: row.line_total,
  };
}

export function mapSalesOrderRowToCashierInvoice(row: SalesOrderRow): CashierInvoice {
  return {
    id: row.id,
    orderNumber: row.order_number,
    createdAt: row.created_at,
    items: (row.sales_order_items ?? []).map(mapSalesOrderItemRow),
    subtotal: row.subtotal,
    tax: row.tax_amount,
    total: row.total_amount,
    cashierName: row.cashier_name ?? "Kasir Online",
    paymentMethod: normalizePaymentMethod(row.payment_method),
  };
}

export function mapSalesOrderRowsToCashierInvoices(rows: SalesOrderRow[]) {
  return rows.map(mapSalesOrderRowToCashierInvoice);
}
