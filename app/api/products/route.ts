export const runtime = "nodejs";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { APP_SESSION_COOKIE } from "@/lib/auth";
import { resolveInternalSessionUser } from "@/lib/internal-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { mapProductInputToRow, mapProductRow, productInputSchema, slugifyProductId, type ProductRow } from "@/lib/supabase/products";

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

export async function POST(request: Request) {
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

  const baseId = slugifyProductId(parsed.data.name) || `produk-${Date.now()}`;
  const candidateId = `${baseId}-${Date.now().toString().slice(-6)}`;
  const row = mapProductInputToRow(candidateId, parsed.data);

  const { data, error } = await supabase.from("products").insert(row).select("*").single<ProductRow>();

  if (error) {
    const status = error.code === "23505" ? 409 : 500;
    const message = error.code === "23505" ? "SKU sudah dipakai produk lain." : "Gagal menambahkan produk ke database.";
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ product: mapProductRow(data) }, { status: 201 });
}
