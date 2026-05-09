import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

import { APP_SESSION_COOKIE } from "@/lib/auth";
import { hasMenuAccess } from "@/lib/internal-permissions";
import { resolveInternalSessionUser } from "@/lib/internal-auth";
import { getEnabledPaymentMethods, normalizePaymentMethods, type PaymentMethodId, type PaymentMethodSetting } from "@/lib/payment-methods";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const orderItemSchema = z.object({
  productId: z.string().trim().min(1, "Produk checkout tidak valid."),
  productName: z.string().trim().optional(),
  unitPrice: z.number().finite().optional(),
  quantity: z.number().int().positive("Quantity produk minimal 1."),
  lineTotal: z.number().finite().optional(),
  note: z.string().trim().optional(),
});

const orderPayloadSchema = z.object({
  paymentMethod: z.string().trim().min(1, "Metode pembayaran wajib dipilih."),
  subtotal: z.number().finite().nonnegative().optional(),
  tax: z.number().finite().nonnegative().optional(),
  total: z.number().finite().nonnegative().optional(),
  items: z.array(orderItemSchema).min(1, "Keranjang masih kosong."),
});

type AppSettingsPaymentRow = {
  payment_methods: PaymentMethodSetting[] | null;
};

type CheckoutRpcRow = {
  order_id: string;
  order_number: string;
  created_at: string;
};

export async function POST(request: Request) {
  const rawPayload = (await request.json().catch(() => null)) as unknown;
  const parsedPayload = orderPayloadSchema.safeParse(rawPayload);

  if (!parsedPayload.success) {
    return NextResponse.json({ error: parsedPayload.error.issues[0]?.message ?? "Payload checkout tidak valid." }, { status: 400 });
  }

  const payload = parsedPayload.data;
  const supabase = createAdminSupabaseClient();
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

  const duplicateIds = new Set<string>();
  for (const item of payload.items) {
    if (duplicateIds.has(item.productId)) {
      return NextResponse.json({ error: "Keranjang berisi item duplikat. Muat ulang halaman kasir lalu coba lagi." }, { status: 400 });
    }
    duplicateIds.add(item.productId);
  }

  const { data: checkoutRows, error: checkoutError } = await supabase.rpc("process_checkout_order", {
    p_payment_method: payload.paymentMethod,
    p_subtotal: Math.round(payload.subtotal ?? 0),
    p_tax: Math.round(payload.tax ?? 0),
    p_total: Math.round(payload.total ?? 0),
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

    if (message.includes("EMPTY_CART") || message.includes("INVALID_QUANTITY") || message.includes("INVALID_ITEM_PAYLOAD")) {
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
