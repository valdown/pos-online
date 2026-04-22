"use client";

import { useMemo, useState } from "react";
import { CreditCard, Minus, Plus, ReceiptText, RotateCcw, Search, ShoppingBag, Wallet, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { appendCashierInvoice } from "@/lib/cashier-invoice-storage";
import type { Product, ProductCategory } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";

type CartItem = Product & { quantity: number };
type PaymentMethod = "cash" | "debit" | "qris";

type ProductVisual = {
  imageUrl: string;
};

const paymentOptions: Array<{ id: PaymentMethod; label: string; icon: typeof Wallet }> = [
  { id: "cash", label: "Tunai", icon: Wallet },
  { id: "debit", label: "Debit", icon: CreditCard },
  { id: "qris", label: "QRIS", icon: ReceiptText },
];

const productVisuals: Record<string, ProductVisual> = {
  "caramel-macchiato": {
    imageUrl: "https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  "flat-white": {
    imageUrl: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  "v60-kintamani": {
    imageUrl: "https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  "aren-latte": {
    imageUrl: "https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  "matcha-cloud": {
    imageUrl: "https://images.pexels.com/photos/5946973/pexels-photo-5946973.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  "beef-burger-chips": {
    imageUrl: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  "croissant-almond": {
    imageUrl: "https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg?auto=compress&cs=tinysrgb&w=1200",
  },
  "spanish-latte": {
    imageUrl: "https://images.pexels.com/photos/6205770/pexels-photo-6205770.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
};

function getProductVisual(product: Product): ProductVisual {
  return (
    productVisuals[product.id] ?? {
      imageUrl: "https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=1200",
    }
  );
}

export function PosClient({
  products,
  categories,
  taxRate,
}: {
  products: Product[];
  categories: ProductCategory[];
  taxRate: number;
}) {
  const [activeCategory, setActiveCategory] = useState<ProductCategory>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cart, setCart] = useState<CartItem[]>([]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = activeCategory === "Semua" || product.category === activeCategory;
      const matchesSearch = !normalizedQuery || product.name.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, products, searchQuery]);

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * (taxRate / 100));
  const total = subtotal + tax;

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.warning(`Stok ${product.name} habis untuk transaksi ini.`, {
            description: `Maksimal ${product.stock} item bisa dimasukkan ke keranjang demo.`,
          });
          return current;
        }

        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }

      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((current) => {
      const targetItem = current.find((item) => item.id === productId);

      if (!targetItem) {
        return current;
      }

      const nextQuantity = targetItem.quantity + delta;

      if (delta > 0 && nextQuantity > targetItem.stock) {
        toast.warning(`Stok ${targetItem.name} tidak mencukupi.`, {
          description: `Batas maksimal untuk item ini adalah ${targetItem.stock}.`,
        });
        return current;
      }

      return current
        .map((item) => (item.id === productId ? { ...item, quantity: nextQuantity } : item))
        .filter((item) => item.quantity > 0);
    });
  };

  const resetCart = () => setCart([]);

  const handleCheckout = () => {
    if (!cart.length) {
      return;
    }

    void (async () => {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod,
          subtotal,
          tax,
          total,
          items: cart.map((item) => ({
            productId: item.id,
            productName: item.name,
            unitPrice: item.price,
            quantity: item.quantity,
            lineTotal: item.price * item.quantity,
          })),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error("Checkout gagal diproses.", {
          description: payload?.error ?? "Periksa konfigurasi Supabase dan schema tabel orders kamu.",
        });
        return;
      }

      const payload = (await response.json()) as { mode: "demo" | "supabase"; orderNumber: string; createdAt: string };

      appendCashierInvoice({
        id: payload.orderNumber,
        orderNumber: payload.orderNumber,
        createdAt: payload.createdAt,
        items: cart.map((item) => ({
          productId: item.id,
          productName: item.name,
          unitPrice: item.price,
          quantity: item.quantity,
          lineTotal: item.price * item.quantity,
        })),
        subtotal,
        tax,
        total,
        cashierName: payload.mode === "supabase" ? "Kasir Online" : "Kasir Demo",
        paymentMethod,
      });

      toast.success(`Pembayaran ${paymentMethod.toUpperCase()} berhasil diproses.`, {
        description:
          payload.mode === "supabase"
            ? `Order senilai ${formatCurrency(total)} tersimpan ke Supabase dan keranjang direset.`
            : `Pesanan demo senilai ${formatCurrency(total)} telah ditutup dan keranjang direset.`,
      });
      setCart([]);
    })();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_0.95fr]">
      <div className="space-y-6">
        <Card className="p-5 md:p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Badge variant="accent" className="w-fit">Counter aktif</Badge>
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">Siapkan pesanan dengan cepat</h2>
                <p className="text-sm text-[var(--muted)]">Filter kategori, tambahkan item, lalu tutup transaksi dalam satu alur.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  data-testid={`category-filter-${category.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setActiveCategory(category)}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    activeCategory === category
                      ? "bg-[var(--coffee-700)] text-white shadow-[0_12px_24px_rgba(122,75,44,0.18)]"
                      : "bg-[var(--surface-soft)] text-[var(--muted)] hover:bg-[var(--sand-200)]"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search menu name"
                aria-label="Cari nama menu"
                data-testid="menu-search-input"
                className="h-11 rounded-full border-[var(--line)] bg-white pl-11 pr-11 shadow-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear menu search"
                  className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--coffee-700)]"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          </div>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.length ? (
            filteredProducts.map((product) => {
            const visual = getProductVisual(product);

            return (
              <Card
                key={product.id}
                data-testid={`product-card-${product.id}`}
                className="group overflow-hidden border-[var(--line)] bg-white p-2.5 shadow-[0_12px_24px_rgba(82,49,29,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(82,49,29,0.12)]"
              >
                <div className="space-y-2">
                  <div className="relative">
                    <div className="aspect-[4/3] overflow-hidden rounded-[calc(var(--radius-soft)-0.1rem)] bg-[var(--surface-soft)]">
                      <img
                        src={visual.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                    <Button
                      data-testid={`product-add-${product.id}`}
                      type="button"
                      variant="ghost"
                      onClick={() => addToCart(product)}
                      className="absolute -bottom-3 right-2.5 size-8 rounded-full border-2 border-white bg-[var(--coffee-500)] p-0 text-white shadow-[0_10px_20px_rgba(198,122,63,0.28)] transition-transform duration-200 hover:scale-105 hover:bg-[var(--coffee-600)] hover:text-white disabled:bg-[var(--sand-300)] disabled:text-white/80"
                      aria-label={`Tambah ${product.name}`}
                      disabled={product.stock <= 0}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-1.5 px-1 pb-0.5 pt-1.5">
                    <div className="space-y-0.5 pr-9">
                      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">{product.category}</p>
                      <p className="text-sm font-semibold leading-snug text-[var(--ink)]">{product.name}</p>
                      <p className="text-base font-semibold tracking-[-0.02em] text-[var(--coffee-700)]">{formatCurrency(product.price)}</p>
                    </div>
                    <p className="text-[11px] text-[var(--muted)]">{product.stock > 0 ? `Stok ${product.stock}` : "Stok habis"}</p>
                  </div>
                </div>
              </Card>
            );
          })) : (
            <Card className="col-span-full border-dashed border-[var(--line)] bg-[rgba(255,255,255,0.72)] p-8 text-center">
              <div className="space-y-2">
                <p className="text-base font-semibold text-[var(--ink)]">Menu tidak ditemukan</p>
                <p className="text-sm text-[var(--muted)]">
                  Tidak ada menu yang cocok untuk pencarian <span className="font-medium text-[var(--ink)]">“{searchQuery}”</span>.
                </p>
                <div>
                  <Button type="button" variant="outline" onClick={() => setSearchQuery("")}>Clear search</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card className="flex h-fit flex-col p-5 md:p-6 xl:sticky xl:top-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="neutral" className="mb-3 w-fit">Keranjang</Badge>
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">Ringkasan Pesanan</h2>
          </div>
          <div className="flex size-12 items-center justify-center rounded-[1.1rem] bg-[rgba(198,122,63,0.14)] text-[var(--coffee-700)]">
            <ShoppingBag className="size-5" />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {cart.length ? (
            cart.map((item) => (
              <div key={item.id} data-testid={`cart-item-${item.id}`} className="rounded-[var(--radius-soft)] bg-[var(--surface-soft)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{item.name}</p>
                    <p className="text-sm text-[var(--muted)]">{formatCurrency(item.price)}</p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--coffee-700)]">{formatCurrency(item.price * item.quantity)}</p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-[var(--muted)]">{item.category}</p>
                  <div className="flex items-center gap-2 rounded-full bg-white px-2 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
                    <button
                      data-testid={`cart-decrease-${item.id}`}
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="flex size-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--coffee-700)]"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="min-w-7 text-center text-sm font-semibold text-[var(--ink)]">{item.quantity}</span>
                    <button
                      data-testid={`cart-increase-${item.id}`}
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="flex size-8 items-center justify-center rounded-full text-[var(--muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--coffee-700)]"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[var(--radius-soft)] border border-dashed border-[var(--line)] bg-[rgba(255,255,255,0.6)] p-6 text-center">
              <p className="text-base font-medium text-[var(--ink)]">Keranjang masih kosong</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Pilih menu dari panel kiri untuk memulai transaksi demo.</p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4 rounded-[var(--radius-soft)] bg-[rgba(255,248,242,0.86)] p-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Metode Pembayaran</p>
            <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              {paymentOptions.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  data-testid={`payment-method-${id}`}
                  onClick={() => setPaymentMethod(id)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-[1.1rem] border px-4 py-3 text-sm font-semibold transition",
                    paymentMethod === id
                      ? "border-[var(--coffee-500)] bg-white text-[var(--coffee-700)] shadow-[0_14px_28px_rgba(122,75,44,0.12)]"
                      : "border-transparent bg-[var(--surface-soft)] text-[var(--muted)]"
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t border-[var(--line)] pt-4 text-sm">
            <div className="flex items-center justify-between text-[var(--muted)]">
              <span>Subtotal</span>
              <span data-testid="cart-subtotal">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[var(--muted)]">
              <span>Pajak ({taxRate}%)</span>
              <span data-testid="cart-tax">{formatCurrency(tax)}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-semibold text-[var(--ink)]">
              <span>Total</span>
              <span data-testid="cart-total">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Button data-testid="checkout-button" type="button" size="lg" onClick={handleCheckout} disabled={!cart.length}>
            Tutup Transaksi
          </Button>
          <Button data-testid="reset-cart-button" type="button" size="lg" variant="outline" onClick={resetCart} disabled={!cart.length}>
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </Card>
    </div>
  );
}
