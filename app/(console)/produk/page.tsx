import { CurrentTimeDisplay } from "@/components/dashboard/current-time-display";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getProducts } from "@/lib/supabase/data";
import { formatCurrency } from "@/lib/utils";

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

      <Card className="p-6">
        <CardHeader>
          <CardTitle>Katalog produk</CardTitle>
          <CardDescription>Struktur tabel clean-room dengan aksen hangat untuk kebutuhan operasional dan kontrol stok.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  <th className="pb-2 font-medium">Nama</th>
                  <th className="pb-2 font-medium">SKU</th>
                  <th className="pb-2 font-medium">Kategori</th>
                  <th className="pb-2 font-medium">Harga</th>
                  <th className="pb-2 font-medium">Stok</th>
                  <th className="pb-2 font-medium">Terjual</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="overflow-hidden rounded-[var(--radius-soft)] bg-[rgba(255,255,255,0.72)] shadow-[inset_0_0_0_1px_var(--line)]">
                    <td className="rounded-l-[var(--radius-soft)] px-4 py-4 align-top">
                      <p className="font-semibold text-[var(--ink)]">{product.name}</p>
                      <p className="mt-1 max-w-sm text-sm leading-6 text-[var(--muted)]">{product.description}</p>
                    </td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)]">{product.sku}</td>
                    <td className="px-4 py-4 text-sm font-medium text-[var(--ink)]">{product.category}</td>
                    <td className="px-4 py-4 text-sm font-medium text-[var(--ink)]">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)]">{product.stock}</td>
                    <td className="px-4 py-4 text-sm text-[var(--muted)]">{product.soldToday}</td>
                    <td className="rounded-r-[var(--radius-soft)] px-4 py-4">
                      <Badge variant={product.status === "Aktif" ? "success" : "warning"}>{product.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
