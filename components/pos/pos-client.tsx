"use client";

import { useMemo, useState } from "react";
import { CreditCard, Minus, Plus, ReceiptText, RotateCcw, ShoppingBag, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Product, ProductCategory } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";

type CartItem = Product & { quantity: number };
type PaymentMethod = "cash" | "debit" | "qris";

const paymentOptions: Array<{ id: PaymentMethod; label: string; icon: typeof Wallet }> = [
  { id: "cash", label: "Tunai", icon: Wallet },
  { id: "debit", label: "Debit", icon: CreditCard },
  { id: "qris", label: "QRIS", icon: ReceiptText },
];

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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cart, setCart] = useState<CartItem[]>([]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "Semua") {
      return products;
    }

    return products.filter((product) => product.category === activeCategory);
  }, [activeCategory, products]);

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

      const payload = (await response.json()) as { mode: "demo" | "supabase" };

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
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} data-testid={`product-card-${product.id}`} className="p-5">
              <div className="space-y-4">
                <div className="rounded-[1.3rem] bg-[linear-gradient(135deg,rgba(255,248,242,0.92),rgba(239,222,203,0.88))] p-4">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <Badge variant={product.status === "Aktif" ? "success" : "warning"}>{product.status}</Badge>
                    <span className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{product.category}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="font-display text-3xl leading-none text-[var(--coffee-900)]">{product.name}</p>
                    <p className="text-sm leading-6 text-[var(--muted)]">{product.description}</p>
                  </div>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Harga</p>
                    <p className="text-xl font-semibold text-[var(--ink)]">{formatCurrency(product.price)}</p>
                    <p className="text-sm text-[var(--muted)]">Stok {product.stock} • Terjual {product.soldToday}</p>
                  </div>
                  <Button data-testid={`product-add-${product.id}`} type="button" onClick={() => addToCart(product)}>
                    <Plus className="size-4" />
                    Tambah
                  </Button>
                </div>
              </div>
            </Card>
          ))}
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
