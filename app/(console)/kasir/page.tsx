"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDemoSettings } from "@/components/providers/demo-settings";
import { PageHeader } from "@/components/ui/page-header";
import { PosClient } from "@/components/pos/pos-client";
import { productCategories, products, type Product, type ProductCategory } from "@/lib/mock-data";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

export default function KasirPage() {
  const { appSettings, persistenceMode } = useDemoSettings();
  const [catalog, setCatalog] = useState<Product[]>(products);

  useEffect(() => {
    const supabaseClient = getBrowserSupabaseClient();

    if (!supabaseClient) {
      return;
    }

    void (async () => {
      const { data } = await supabaseClient.from("products").select("*").order("name", { ascending: true });

      if (data?.length) {
        const mappedProducts = data.map((row) => ({
          id: row.id as string,
          name: row.name as Product["name"],
          category: row.category as Product["category"],
          description: row.description as string,
          price: row.price as number,
          stock: row.stock as number,
          sku: row.sku as string,
          soldToday: row.sold_today as number,
          status: row.status as Product["status"],
        }));

        setCatalog(mappedProducts);
      }
    })();
  }, []);

  const categories = useMemo<ProductCategory[]>(() => {
    const uniqueCategories = Array.from(new Set(catalog.map((product) => product.category)));
    return ["Semua", ...uniqueCategories] as ProductCategory[];
  }, [catalog]);

  return (
    <>
      <PageHeader
        eyebrow="Golden path checkout"
        title="POS Kasir"
        description={`Alur demo transaksi lokal lengkap dengan pajak aktif ${appSettings.taxRate}%: pilih kategori, tambahkan item ke keranjang, pilih metode bayar, lalu checkout.`}
        actions={
          <>
            <Badge variant="accent">{persistenceMode === "supabase" ? "Mode Supabase" : "Mode Demo"}</Badge>
            <Button variant="outline">Hari Ini</Button>
          </>
        }
      />

      <PosClient products={catalog} categories={categories.length ? categories : productCategories} taxRate={appSettings.taxRate} />
    </>
  );
}
