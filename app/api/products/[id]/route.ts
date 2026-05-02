export const runtime = "nodejs";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { APP_SESSION_COOKIE } from "@/lib/auth";
import { hasMenuAccess } from "@/lib/internal-permissions";
import { resolveInternalSessionUser } from "@/lib/internal-auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { buildProductImagePath, getProductImageExtension, isAllowedProductImageType, PRODUCT_IMAGES_BUCKET, PRODUCT_IMAGE_MAX_BYTES } from "@/lib/supabase/product-images";
import { mapProductInputToRow, mapProductRow, productInputSchema, type ProductRow } from "@/lib/supabase/products";

async function requireInternalOwner() {
  const cookieStore = await cookies();
  const currentUser = await resolveInternalSessionUser(cookieStore.get(APP_SESSION_COOKIE)?.value ?? null);

  if (!currentUser) {
    return { error: NextResponse.json({ error: "Session internal tidak ditemukan. Login ulang dulu." }, { status: 401 }) };
  }

  if (!hasMenuAccess(currentUser, "produk", "manage")) {
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

  const formData = await request.formData().catch(() => null);
  const imageFile = formData?.get("image") instanceof File ? (formData.get("image") as File) : null;
  const body = formData
    ? {
        name: formData.get("name"),
        description: formData.get("description"),
        category: formData.get("category"),
        price: formData.get("price"),
        stock: formData.get("stock"),
        isActive: formData.get("isActive") === "true",
      }
    : null;
  const parsed = productInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Input produk tidak valid." }, { status: 400 });
  }

  const { id } = await params;
  let uploadedPath: string | null = null;

  const { data: currentProduct } = await supabase
    .from("mst_products")
    .select("image_path, deleted_at")
    .eq("id", id)
    .maybeSingle<{ image_path: string | null; deleted_at: string | null }>();

  if (currentProduct?.deleted_at) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  const row = mapProductInputToRow(id, parsed.data, {
    imagePath: currentProduct?.image_path ?? null,
    deletedAt: currentProduct?.deleted_at ?? null,
  });

  if (imageFile && imageFile.size > 0) {
    if (!isAllowedProductImageType(imageFile.type)) {
      return NextResponse.json({ error: "Format gambar tidak didukung. Gunakan JPG, JPEG, atau WEBP." }, { status: 400 });
    }

    if (imageFile.size > PRODUCT_IMAGE_MAX_BYTES) {
      return NextResponse.json({ error: "Ukuran gambar melebihi 1MB setelah kompresi." }, { status: 400 });
    }

    uploadedPath = buildProductImagePath(id, getProductImageExtension(imageFile.type));
    const { error: uploadError } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(uploadedPath, imageFile, {
      contentType: imageFile.type,
      upsert: true,
    });

    if (uploadError) {
      return NextResponse.json({ error: "Gagal mengunggah gambar produk ke storage." }, { status: 500 });
    }

    row.image_path = uploadedPath;
  } else {
    row.image_path = currentProduct?.image_path ?? null;
  }

  const { data, error } = await supabase
    .from("mst_products")
    .update(row)
    .eq("id", id)
    .select("id, name, category, description, price, stock, is_active, image_path, deleted_at")
    .maybeSingle<ProductRow>();

  if (error) {
    if (uploadedPath) {
      await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([uploadedPath]);
    }

    const status = error.code === "23505" ? 409 : 500;
    const message = error.code === "23505" ? "Produk sudah dipakai produk lain." : "Gagal memperbarui produk.";
    return NextResponse.json({ error: message }, { status });
  }

  if (!data) {
    return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  }

  if (uploadedPath && currentProduct?.image_path && currentProduct.image_path !== uploadedPath) {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([currentProduct.image_path]);
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
  const { data: currentProduct } = await supabase.from("mst_products").select("image_path, deleted_at").eq("id", id).maybeSingle<{ image_path: string | null; deleted_at: string | null }>();

  if (currentProduct?.deleted_at) {
    return NextResponse.json({ ok: true });
  }

  const { error } = await supabase.from("mst_products").update({ deleted_at: new Date().toISOString() }).eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Gagal menghapus produk." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
