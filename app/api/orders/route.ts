import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

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

export async function POST(request: Request) {
  const payload = (await request.json()) as OrderPayload;
  const supabase = await createServerSupabaseClient();
  const orderNumber = `TRX-${Date.now()}`;
  const createdAt = new Date().toISOString();

  if (!supabase) {
    return NextResponse.json({ mode: "demo" as const, orderNumber, createdAt });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Session Supabase tidak ditemukan. Login ulang dulu." }, { status: 401 });
  }

  const { data: order, error: orderError } = await supabase
    .from("sales_orders")
    .insert({
      order_number: orderNumber,
      payment_method: payload.paymentMethod,
      subtotal: payload.subtotal,
      tax_amount: payload.tax,
      total_amount: payload.total,
      status: "paid",
      user_id: user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (orderError || !order) {
    return NextResponse.json({ error: "Gagal menyimpan order ke Supabase. Jalankan schema SQL terlebih dahulu." }, { status: 500 });
  }

  const { error: itemsError } = await supabase.from("sales_order_items").insert(
    payload.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_total: item.lineTotal,
    }))
  );

  if (itemsError) {
    return NextResponse.json({ error: "Order utama tersimpan, tetapi item order gagal masuk. Periksa schema sales_order_items." }, { status: 500 });
  }

  return NextResponse.json({ mode: "supabase" as const, orderNumber, createdAt });
}
