import { CurrentTimeDisplay } from "@/components/dashboard/current-time-display";
import { ProductCrudClient } from "@/components/products/product-crud-client";
import { PageHeader } from "@/components/ui/page-header";
import { getProducts } from "@/lib/supabase/data";

export default async function ProdukPage() {
  const products = await getProducts();

  return (
    <>
      <PageHeader
        eyebrow="Inventory overview"
        title="Produk"
        description="Daftar produk tersusun rapi untuk memantau kategori, harga, stok, dan laju penjualan harian."
        actions={<CurrentTimeDisplay />}
      />

      <ProductCrudClient initialProducts={products} />
    </>
  );
}
