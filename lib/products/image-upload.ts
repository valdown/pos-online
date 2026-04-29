import imageCompression from "browser-image-compression";

import { PRODUCT_IMAGE_ALLOWED_TYPES, PRODUCT_IMAGE_MAX_BYTES, isAllowedProductImageType } from "@/lib/supabase/product-images";

export async function compressProductImage(file: File) {
  if (!isAllowedProductImageType(file.type)) {
    throw new Error(`Format gambar tidak didukung. Gunakan ${PRODUCT_IMAGE_ALLOWED_TYPES.join(", ")}.`);
  }

  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
    fileType: file.type,
    initialQuality: 0.92,
  });

  if (compressed.size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new Error("Ukuran gambar setelah kompresi masih melebihi 1MB.");
  }

  return compressed;
}
