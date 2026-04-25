import type { AppSettings, NotificationSettings } from "@/lib/mock-data";
import { normalizePaymentMethods, type PaymentMethodSetting } from "@/lib/payment-methods";
import { SUPABASE_SETTINGS_ROW_ID } from "@/lib/supabase/config";

export type AppSettingsRow = {
  id: string;
  store_name: string;
  branch_name: string;
  tax_rate: number;
  service_fee: number;
  store_phone: string;
  receipt_footer: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  opening_cash: number;
  auto_print_receipt: boolean;
  payment_methods: PaymentMethodSetting[] | null;
};

export type NotificationSettingsRow = {
  id: string;
  telegram_enabled: boolean;
  bot_token: string;
  chat_id: string;
  digest_frequency: NotificationSettings["digestFrequency"];
  low_stock_alert: boolean;
  cashier_summary: boolean;
  refund_alert: boolean;
};

export function mapAppSettingsRowToModel(row: AppSettingsRow): AppSettings {
  return {
    storeName: row.store_name,
    branchName: row.branch_name,
    taxRate: row.tax_rate,
    serviceFee: row.service_fee,
    storePhone: row.store_phone,
    receiptFooter: row.receipt_footer,
    bankName: row.bank_name,
    bankAccountName: row.bank_account_name,
    bankAccountNumber: row.bank_account_number,
    openingCash: row.opening_cash,
    autoPrintReceipt: row.auto_print_receipt,
    paymentMethods: normalizePaymentMethods(row.payment_methods),
  };
}

export function mapAppSettingsModelToRow(model: AppSettings): AppSettingsRow {
  return {
    id: SUPABASE_SETTINGS_ROW_ID,
    store_name: model.storeName,
    branch_name: model.branchName,
    tax_rate: model.taxRate,
    service_fee: model.serviceFee,
    store_phone: model.storePhone,
    receipt_footer: model.receiptFooter,
    bank_name: model.bankName,
    bank_account_name: model.bankAccountName,
    bank_account_number: model.bankAccountNumber,
    opening_cash: model.openingCash,
    auto_print_receipt: model.autoPrintReceipt,
    payment_methods: normalizePaymentMethods(model.paymentMethods),
  };
}

export function mapNotificationSettingsRowToModel(row: NotificationSettingsRow): NotificationSettings {
  return {
    telegramEnabled: row.telegram_enabled,
    botToken: row.bot_token,
    chatId: row.chat_id,
    digestFrequency: row.digest_frequency,
    lowStockAlert: row.low_stock_alert,
    cashierSummary: row.cashier_summary,
    refundAlert: row.refund_alert,
  };
}

export function mapNotificationSettingsModelToRow(model: NotificationSettings): NotificationSettingsRow {
  return {
    id: SUPABASE_SETTINGS_ROW_ID,
    telegram_enabled: model.telegramEnabled,
    bot_token: model.botToken,
    chat_id: model.chatId,
    digest_frequency: model.digestFrequency,
    low_stock_alert: model.lowStockAlert,
    cashier_summary: model.cashierSummary,
    refund_alert: model.refundAlert,
  };
}
