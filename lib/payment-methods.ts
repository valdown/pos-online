export type PaymentMethodId = "cash" | "debit" | "qris";

export type PaymentMethodSetting = {
  id: PaymentMethodId;
  label: string;
  enabled: boolean;
};

export const DEFAULT_PAYMENT_METHODS: PaymentMethodSetting[] = [
  { id: "cash", label: "Tunai", enabled: true },
  { id: "debit", label: "Debit", enabled: true },
  { id: "qris", label: "QRIS", enabled: true },
];

const PAYMENT_METHOD_ORDER: PaymentMethodId[] = ["cash", "debit", "qris"];

function isPaymentMethodId(value: unknown): value is PaymentMethodId {
  return value === "cash" || value === "debit" || value === "qris";
}

export function normalizePaymentMethods(value: unknown): PaymentMethodSetting[] {
  const source = Array.isArray(value) ? value : [];

  return PAYMENT_METHOD_ORDER.map((id) => {
    const matched = source.find(
      (item): item is Partial<PaymentMethodSetting> & { id: PaymentMethodId } =>
        typeof item === "object" && item !== null && isPaymentMethodId((item as { id?: unknown }).id) && (item as { id: PaymentMethodId }).id === id
    );

    const fallback = DEFAULT_PAYMENT_METHODS.find((item) => item.id === id)!;

    return {
      id,
      label: typeof matched?.label === "string" && matched.label.trim() ? matched.label.trim() : fallback.label,
      enabled: typeof matched?.enabled === "boolean" ? matched.enabled : fallback.enabled,
    };
  });
}

export function getEnabledPaymentMethods(methods: PaymentMethodSetting[]) {
  return methods.filter((method) => method.enabled);
}
