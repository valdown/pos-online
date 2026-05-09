export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";

import { requireInternalMenuAccess } from "@/lib/server/internal-guards";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const kitchenStatusSchema = z.object({
  status: z.enum(["queue", "in_progress", "done"]),
});

type KitchenStatus = "queue" | "in_progress" | "done";

const allowedTransitions: Record<KitchenStatus, KitchenStatus[]> = {
  queue: ["in_progress"],
  in_progress: ["queue", "done"],
  done: ["in_progress"],
};

type KitchenOrderStatusRow = {
  id: string;
  status: string;
  kitchen_status: KitchenStatus | null;
  kitchen_started_at: string | null;
};

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireInternalMenuAccess("dapur", "create");

  if (auth.error) {
    return auth.error;
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY belum aktif, jadi status dapur belum bisa diperbarui." }, { status: 500 });
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  const parsed = kitchenStatusSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Status dapur tidak valid." }, { status: 400 });
  }

  const { id } = await params;
  const { data: order, error: orderError } = await supabase
    .from("trx_sales_orders")
    .select("id, status, kitchen_status, kitchen_started_at")
    .eq("id", id)
    .maybeSingle<KitchenOrderStatusRow>();

  if (orderError) {
    return NextResponse.json({ error: "Gagal membaca order dapur." }, { status: 500 });
  }

  if (!order) {
    return NextResponse.json({ error: "Order dapur tidak ditemukan." }, { status: 404 });
  }

  if (order.status !== "paid") {
    return NextResponse.json({ error: "Order ini belum siap diproses oleh dapur." }, { status: 409 });
  }

  if (!order.kitchen_status) {
    return NextResponse.json({ error: "Order lama ini belum terdaftar di board dapur." }, { status: 409 });
  }

  const currentStatus = order.kitchen_status;
  const nextStatus = parsed.data.status;

  if (currentStatus === nextStatus) {
    return NextResponse.json({ ok: true });
  }

  if (!allowedTransitions[currentStatus].includes(nextStatus)) {
    return NextResponse.json({ error: "Perpindahan status dapur tidak valid." }, { status: 400 });
  }

  const nowIso = new Date().toISOString();
  const updatePayload: {
    kitchen_status: KitchenStatus;
    kitchen_started_at?: string | null;
    kitchen_completed_at?: string | null;
    kitchen_updated_at: string;
    kitchen_updated_by: string;
  } = {
    kitchen_status: nextStatus,
    kitchen_updated_at: nowIso,
    kitchen_updated_by: auth.currentUser.staffId,
  };

  if (nextStatus === "queue") {
    updatePayload.kitchen_started_at = null;
    updatePayload.kitchen_completed_at = null;
  } else if (nextStatus === "in_progress") {
    updatePayload.kitchen_started_at = order.kitchen_started_at ?? nowIso;
    updatePayload.kitchen_completed_at = null;
  } else {
    updatePayload.kitchen_started_at = order.kitchen_started_at ?? nowIso;
    updatePayload.kitchen_completed_at = nowIso;
  }

  const { error: updateError } = await supabase.from("trx_sales_orders").update(updatePayload).eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Status dapur gagal diperbarui." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
