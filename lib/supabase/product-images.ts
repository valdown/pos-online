export const PRODUCT_IMAGES_BUCKET = "product-images";
export const PRODUCT_IMAGE_MAX_BYTES = 1_048_576;
export const PRODUCT_IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/webp"] as const;

export function isAllowedProductImageType(type: string) {
  return PRODUCT_IMAGE_ALLOWED_TYPES.includes(type as (typeof PRODUCT_IMAGE_ALLOWED_TYPES)[number]);
}

export function getProductImageExtension(type: string) {
  return type === "image/webp" ? "webp" : "jpg";
}

export function buildProductImagePath(productId: string, extension: string) {
  return `products/${productId}-${Date.now()}.${extension}`;
}

export function getProductImagePublicUrl(imagePath: string | null | undefined, supabaseUrl: string) {
  if (!imagePath) {
    return null;
  }

  return `${supabaseUrl}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${imagePath}`;
}
