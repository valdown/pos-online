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

export async function POST(request: Request) {
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

  const candidateId = crypto.randomUUID();
  const row = mapProductInputToRow(candidateId, parsed.data);
  let uploadedPath: string | null = null;

  if (imageFile && imageFile.size > 0) {
    if (!isAllowedProductImageType(imageFile.type)) {
      return NextResponse.json({ error: "Format gambar tidak didukung. Gunakan JPG, JPEG, atau WEBP." }, { status: 400 });
    }

    if (imageFile.size > PRODUCT_IMAGE_MAX_BYTES) {
      return NextResponse.json({ error: "Ukuran gambar melebihi 1MB setelah kompresi." }, { status: 400 });
    }

    uploadedPath = buildProductImagePath(candidateId, getProductImageExtension(imageFile.type));
    const { error: uploadError } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(uploadedPath, imageFile, {
      contentType: imageFile.type,
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json({ error: "Gagal mengunggah gambar produk ke storage." }, { status: 500 });
    }

    row.image_path = uploadedPath;
  }

  const { data, error } = await supabase
    .from("mst_products")
    .insert(row)
    .select("id, name, category, description, price, stock, is_active, image_path, deleted_at")
    .single<ProductRow>();

  if (error) {
    if (uploadedPath) {
      await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([uploadedPath]);
    }

    const status = error.code === "23505" ? 409 : 500;
    const message = error.code === "23505" ? "Produk sudah dipakai produk lain." : "Gagal menambahkan produk ke database.";
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json({ product: mapProductRow(data) }, { status: 201 });
}
