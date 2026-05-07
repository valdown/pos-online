import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { APP_SESSION_COOKIE } from "@/lib/auth";
import { hasMenuAccess } from "@/lib/internal-permissions";
import { resolveInternalSessionUser } from "@/lib/internal-auth";
import { getEnabledPaymentMethods, normalizePaymentMethods, type PaymentMethodId, type PaymentMethodSetting } from "@/lib/payment-methods";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type OrderPayload = {
  paymentMethod: string;
  subtotal: number;
  tax: number;
  total: number;
  items: Array<{
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
};

type AppSettingsPaymentRow = {
  payment_methods: PaymentMethodSetting[] | null;
};

type CheckoutRpcRow = {
  order_id: string;
  order_number: string;
  created_at: string;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as OrderPayload;
  const supabase = createAdminSupabaseClient();
  const orderNumber = `TRX-${Date.now()}`;
  const createdAt = new Date().toISOString();

  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY belum aktif, jadi transaksi tidak bisa disimpan." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const currentUser = await resolveInternalSessionUser(cookieStore.get(APP_SESSION_COOKIE)?.value ?? null);

  if (!currentUser) {
    return NextResponse.json({ error: "Session internal tidak ditemukan. Login ulang dulu." }, { status: 401 });
  }

  if (!hasMenuAccess(currentUser, "kasir", "create")) {
    return NextResponse.json({ error: "Anda tidak punya akses untuk menjalankan transaksi kasir." }, { status: 403 });
  }

  const { data: appSettings } = await supabase.from("mst_app_settings").select("payment_methods").eq("id", "default").maybeSingle<AppSettingsPaymentRow>();
  const enabledPaymentMethodIds = getEnabledPaymentMethods(normalizePaymentMethods(appSettings?.payment_methods)).map((method) => method.id);

  if (!enabledPaymentMethodIds.includes(payload.paymentMethod as PaymentMethodId)) {
    return NextResponse.json({ error: "Metode pembayaran tidak aktif atau tidak dikenali." }, { status: 400 });
  }

  if (!payload.items?.length) {
    return NextResponse.json({ error: "Keranjang masih kosong." }, { status: 400 });
  }

  if (payload.items.some((item) => !item.productId || item.quantity <= 0 || item.unitPrice < 0 || item.lineTotal < 0)) {
    return NextResponse.json({ error: "Item checkout tidak valid." }, { status: 400 });
  }

  const duplicateIds = new Set<string>();
  for (const item of payload.items) {
    if (duplicateIds.has(item.productId)) {
      return NextResponse.json({ error: "Keranjang berisi item duplikat. Muat ulang halaman kasir lalu coba lagi." }, { status: 400 });
    }
    duplicateIds.add(item.productId);
  }

  const { data: checkoutRows, error: checkoutError } = await supabase.rpc("process_checkout_order", {
    p_payment_method: payload.paymentMethod,
    p_subtotal: payload.subtotal,
    p_tax: payload.tax,
    p_total: payload.total,
    p_cashier_name: currentUser.name,
    p_items: payload.items,
  });

  if (checkoutError) {
    const message = checkoutError.message ?? "";

    if (message.includes("INSUFFICIENT_STOCK")) {
      return NextResponse.json({ error: "Stok produk berubah atau tidak mencukupi. Cek stok terbaru lalu ulangi transaksi." }, { status: 409 });
    }

    if (message.includes("PRODUCT_NOT_FOUND") || message.includes("PRODUCT_UNAVAILABLE")) {
      return NextResponse.json({ error: "Ada produk yang sudah tidak tersedia. Muat ulang halaman kasir lalu coba lagi." }, { status: 409 });
    }

    if (message.includes("EMPTY_CART") || message.includes("INVALID_QUANTITY")) {
      return NextResponse.json({ error: "Item checkout tidak valid." }, { status: 400 });
    }

    return NextResponse.json({ error: "Gagal menyimpan order. Coba lagi beberapa saat." }, { status: 500 });
  }

  const checkout = ((checkoutRows ?? []) as CheckoutRpcRow[])[0];

  if (!checkout) {
    return NextResponse.json({ error: "Gagal menyimpan order. Coba lagi beberapa saat." }, { status: 500 });
  }

  return NextResponse.json({ orderNumber: checkout.order_number, createdAt: checkout.created_at ?? createdAt });
}
