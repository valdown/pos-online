import { KasirPageClient } from "@/components/pos/kasir-page-client";
import { getProducts } from "@/lib/supabase/data";

export default async function KasirPage() {
  const products = await getProducts();

  return <KasirPageClient products={products} />;
}
