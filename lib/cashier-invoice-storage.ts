"use client";

import type { CashierInvoice } from "@/lib/mock-data";
import { sampleCashierInvoices } from "@/lib/mock-data";

const CASHIER_INVOICES_STORAGE_KEY = "coffee-bean-cashier-invoices";

function hasWindow() {
  return typeof window !== "undefined";
}

export function getStoredCashierInvoices() {
  if (!hasWindow()) {
    return sampleCashierInvoices;
  }

  const raw = window.localStorage.getItem(CASHIER_INVOICES_STORAGE_KEY);

  if (!raw) {
    return sampleCashierInvoices;
  }

  try {
    const parsed = JSON.parse(raw) as CashierInvoice[];
    return parsed.length ? parsed : sampleCashierInvoices;
  } catch {
    return sampleCashierInvoices;
  }
}

export function appendCashierInvoice(invoice: CashierInvoice) {
  if (!hasWindow()) {
    return;
  }

  const currentInvoices = getStoredCashierInvoices().filter((item) => !sampleCashierInvoices.some((sample) => sample.id === item.id));
  const nextInvoices = [invoice, ...currentInvoices];
  window.localStorage.setItem(CASHIER_INVOICES_STORAGE_KEY, JSON.stringify(nextInvoices));
}
