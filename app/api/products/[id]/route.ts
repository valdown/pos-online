export const runtime = "nodejs";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { APP_SESSION_COOKIE } from "@/lib/auth";
import { resolveInternalSessionUser } from "@/lib/internal-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mapProductInputToRow, mapProductRow, productInputSchema, type ProductRow } from "@/lib/supabase/products";

async function requireInternalOwner() {
  const cookieStore = await cookies();
  const currentUser = await resolveInternalSessionUser(cookieStore.get(APP_SESSION_COOKIE)?.value ?? null);

  if (!currentUser) {
    return { error: NextResponse.json({ error: "Session internal tidak ditemukan. Login ulang dulu." }, { status: 401 }) };
  }

  if (currentUser.access !== "Penuh" && currentUser.role !== "Owner") {
    return { error: NextResponse.json({ error: "Anda tidak punya akses untuk mengelola produk." }, { status: 403 }) };
  }

  return { currentUser };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireInternalOwner();

  if (auth.error) {
    return auth.error;
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY belum aktif, jadi produk tidak bisa disimpan." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input produk tidak valid." }, { status: 400 });
  }

  const { id } = await params;
  const row = mapProductInputToRow(id, parsed.data);

  const { data, error } = await supabase.from("products").update(row).eq("id", id).select("*").maybeSingle<ProductRow>();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    const message = error.code === "23505" ? "SKU sudah dipakai produk lain." : "Gagal memperbarui produk.";
    return NextResponse.json({ error: message }, { status });
  }

  if (!data) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ product: mapProductRow(data) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireInternalOwner();

  if (auth.error) {
    return auth.error;
  }

  const supabase = createAdminSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ error: "SUPABASE_SECRET_KEY belum aktif, jadi produk tidak bisa dihapus." }, { status: 500 });
  }

  const { id } = await params;
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Gagal menghapus produk." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
