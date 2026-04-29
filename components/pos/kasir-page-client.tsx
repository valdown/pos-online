"use client";

import { useMemo } from "react";

import { useSettings } from "@/components/providers/settings";
import { PosClient } from "@/components/pos/pos-client";
import type { Product, ProductCategory } from "@/lib/mock-data";

export function KasirPageClient({ products }: { products: Product[] }) {
  const { appSettings } = useSettings();

  const categories = useMemo<ProductCategory[]>(() => {
    const uniqueCategories = Array.from(new Set([...appSettings.menuCategories, ...products.map((product) => product.category)]));
    return ["Semua", ...uniqueCategories] as ProductCategory[];
  }, [appSettings.menuCategories, products]);

  return <PosClient products={products} categories={categories} taxRate={appSettings.taxRate} paymentMethods={appSettings.paymentMethods} />;
}
