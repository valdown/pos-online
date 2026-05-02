"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CreditCard, Minus, Plus, ReceiptText, RotateCcw, Search, Wallet, X } from "lucide-react";
import { toast } from "sonner";

import { useLoadingOverlay } from "@/components/providers/loading-overlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Product, ProductCategory } from "@/lib/mock-data";
import { getEnabledPaymentMethods, type PaymentMethodId, type PaymentMethodSetting } from "@/lib/payment-methods";
import { slugifyRoleId } from "@/lib/roles";
import { getSupabaseUrl } from "@/lib/supabase/config";
import { getProductImagePublicUrl } from "@/lib/supabase/product-images";
import { cn, formatCurrency } from "@/lib/utils";

type CartItem = Product & { quantity: number };

type ProductVisual = {
  imageUrl: string;
};

const paymentMethodIcons: Record<PaymentMethodId, typeof Wallet> = {
  cash: Wallet,
  debit: CreditCard,
  qris: ReceiptText,
};

const CASH_QUICK_AMOUNTS = [50000, 100000, 150000, 200000, 500000];

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
  const uploadedImageUrl = getProductImagePublicUrl(product.imagePath, getSupabaseUrl());
  const normalizedKey = slugifyRoleId(product.name);

  if (uploadedImageUrl) {
    return { imageUrl: uploadedImageUrl };
  }

  return (
    productVisuals[normalizedKey] ?? {
      imageUrl: "https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=1200",
    }
  );
}

export function PosClient({
  products,
  categories,
  taxRate,
  paymentMethods,
}: {
  products: Product[];
  categories: ProductCategory[];
  taxRate: number;
  paymentMethods: PaymentMethodSetting[];
}) {
  const [activeCategory, setActiveCategory] = useState<ProductCategory>("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const enabledPaymentMethods = useMemo(() => getEnabledPaymentMethods(paymentMethods), [paymentMethods]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(enabledPaymentMethods[0]?.id ?? "cash");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [cashPaidInput, setCashPaidInput] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const { startLoading, stopLoading } = useLoadingOverlay();

  useEffect(() => {
    if (!enabledPaymentMethods.some((method) => method.id === paymentMethod)) {
      setPaymentMethod(enabledPaymentMethods[0]?.id ?? "cash");
    }
  }, [enabledPaymentMethods, paymentMethod]);

  useEffect(() => {
    if (paymentMethod !== "cash") {
      setCashDialogOpen(false);
      setCashPaidInput("");
    }
  }, [paymentMethod]);

  useEffect(() => {
    setIsMounted(true);

    return () => {
      setIsMounted(false);
    };
  }, []);

  useEffect(() => {
    if (!cashDialogOpen || !isMounted) {
      return;
    }

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [cashDialogOpen, isMounted]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = activeCategory === "Semua" || product.category === activeCategory;
      const matchesSearch = !normalizedQuery || product.name.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, products, searchQuery]);

  const cartItemCount = cart.reduce((count, item) => count + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * (taxRate / 100));
  const total = subtotal + tax;
  const hasCashInput = cashPaidInput.trim().length > 0;
  const cashPaidAmount = hasCashInput ? Number(cashPaidInput) : 0;
  const cashChangeAmount = hasCashInput ? cashPaidAmount - total : 0;
  const activePaymentMethodLabel = paymentMethods.find((method) => method.id === paymentMethod)?.label ?? paymentMethod.toUpperCase();

  const addToCart = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.warning(`Stok ${product.name} habis untuk transaksi ini.`, {
            description: `Maksimal ${product.stock} item bisa dimasukkan ke keranjang saat ini.`,
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

  const handleCashQuickAmount = (amount: number) => {
    setCashPaidInput(String(amount));
  };

  const handleCashInputChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    setCashPaidInput(digitsOnly);
  };

  const submitOrder = async () => {
    startLoading();

    try {
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
        await stopLoading();
        toast.error("Checkout gagal diproses.", {
          description: payload?.error ?? "Periksa konfigurasi Supabase dan schema tabel orders kamu.",
        });
        return false;
      }

      const payload = (await response.json()) as { orderNumber: string; createdAt: string };

      setCart([]);
      setCashDialogOpen(false);
      setCashPaidInput("");
      await stopLoading();
      toast.success(`Pembayaran ${activePaymentMethodLabel} berhasil diproses.`, {
        description: `Order ${payload.orderNumber} senilai ${formatCurrency(total)} tersimpan ke database dan keranjang direset.`,
      });
      return true;
    } catch (error) {
      await stopLoading();
      toast.error("Checkout gagal diproses.", {
        description: error instanceof Error ? error.message : "Periksa konfigurasi Supabase dan schema tabel orders kamu.",
      });
      return false;
    }
  };

  const handleCheckout = () => {
    if (!cart.length) {
      return;
    }

    if (paymentMethod === "cash") {
      setCashDialogOpen(true);
      return;
    }

    void submitOrder();
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_0.95fr] xl:items-start">
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

      <Card className="relative flex h-fit flex-col gap-4 overflow-hidden rounded-[calc(var(--radius-panel)+0.25rem)] border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(252,246,240,0.92))] p-4 shadow-[0_30px_60px_rgba(82,49,29,0.1)] md:p-5 xl:sticky xl:top-6 xl:h-[calc(100vh-7rem)] xl:max-h-[calc(100vh-7rem)] xl:min-h-[calc(100vh-7rem)] xl:gap-3.5 xl:p-4">
        <div aria-hidden className="pointer-events-none absolute inset-x-6 top-0 h-24 rounded-full bg-[radial-gradient(circle,rgba(217,151,88,0.16),transparent_72%)] blur-2xl" />

        <div className="relative shrink-0 rounded-[var(--radius-soft)] bg-[rgba(255,255,255,0.72)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.76)] xl:p-3.5">
          <div className="flex items-center justify-between gap-3">
            <Badge variant="neutral" className="w-fit bg-[rgba(255,248,242,0.96)]">Keranjang</Badge>
            <div className="rounded-full bg-white/72 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
              {cartItemCount} item
            </div>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-[calc(var(--radius-soft)+0.15rem)] bg-[linear-gradient(180deg,rgba(255,255,255,0.5),rgba(250,243,236,0.74))] p-2.5 xl:p-2">
          <div className="h-full space-y-2.5 overflow-y-auto pr-1.5 xl:overscroll-contain">
            {cart.length ? (
              cart.map((item) => (
                <div
                  key={item.id}
                  data-testid={`cart-item-${item.id}`}
                  className="flex items-center justify-between gap-3 rounded-[calc(var(--radius-soft)-0.1rem)] border border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(251,244,236,0.84))] px-3.5 py-3 shadow-[0_14px_24px_rgba(82,49,29,0.06),inset_0_1px_0_rgba(255,255,255,0.74)]"
                >
                  <div className="min-w-0 space-y-1 pr-2">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">{item.name}</p>
                    <p className="text-sm font-semibold text-[var(--coffee-600)]">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--line)] bg-[rgba(255,255,255,0.76)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                    <button
                      data-testid={`cart-decrease-${item.id}`}
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="flex size-7 items-center justify-center rounded-full bg-white/92 text-[var(--muted)] shadow-[0_8px_18px_rgba(82,49,29,0.06)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--coffee-700)]"
                      aria-label={`Kurangi jumlah ${item.name}`}
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="min-w-6 text-center text-sm font-semibold text-[var(--ink)]">{item.quantity}</span>
                    <button
                      data-testid={`cart-increase-${item.id}`}
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="flex size-7 items-center justify-center rounded-full bg-white/92 text-[var(--muted)] shadow-[0_8px_18px_rgba(82,49,29,0.06)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--coffee-700)]"
                      aria-label={`Tambah jumlah ${item.name}`}
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[var(--radius-soft)] border border-dashed border-[var(--line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(251,244,236,0.8))] p-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.74)]">
                <p className="text-base font-medium text-[var(--ink)]">Keranjang masih kosong</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Pilih menu dari panel kiri untuk memulai transaksi.</p>
              </div>
            )}
          </div>
        </div>

        <div className="relative shrink-0 space-y-4 rounded-[var(--radius-soft)] bg-[linear-gradient(135deg,rgba(255,250,246,0.92),rgba(244,230,215,0.82))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.76)] xl:space-y-3.5 xl:p-3.5">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Metode Pembayaran</p>
            <div className={cn("grid gap-2", enabledPaymentMethods.length === 1 ? "grid-cols-1" : enabledPaymentMethods.length === 2 ? "grid-cols-2" : "sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3")}>
              {enabledPaymentMethods.map(({ id, label }) => {
                const Icon = paymentMethodIcons[id];

                return (
                  <button
                    key={id}
                    type="button"
                    data-testid={`payment-method-${id}`}
                    onClick={() => setPaymentMethod(id)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-[1.1rem] border px-4 py-3 text-sm font-semibold transition",
                      paymentMethod === id
                        ? "border-[rgba(198,122,63,0.22)] bg-[linear-gradient(135deg,rgba(255,248,242,0.96),rgba(241,227,210,0.92))] text-[var(--coffee-700)] shadow-[0_14px_28px_rgba(122,75,44,0.1)]"
                        : "border-transparent bg-white/72 text-[var(--muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] hover:bg-white/84 hover:text-[var(--ink)]"
                    )}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 rounded-[calc(var(--radius-soft)-0.1rem)] border border-[var(--line)] bg-[rgba(255,255,255,0.7)] p-3.5 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.76)]">
            <div className="flex items-center justify-between text-[var(--muted)]">
              <span>Subtotal</span>
              <span data-testid="cart-subtotal">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-[var(--muted)]">
              <span>Pajak ({taxRate}%)</span>
              <span data-testid="cart-tax">{formatCurrency(tax)}</span>
            </div>
            <div className="h-px bg-[var(--line)]" />
            <div className="flex items-center justify-between text-lg font-semibold text-[var(--ink)]">
              <span>Total</span>
              <span data-testid="cart-total" className="tracking-[-0.03em] text-[var(--coffee-800)]">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="relative shrink-0 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <Button
            data-testid="checkout-button"
            type="button"
            size="lg"
            onClick={handleCheckout}
            disabled={!cart.length || enabledPaymentMethods.length === 0}
            className="shadow-[0_20px_34px_rgba(122,75,44,0.2)]"
          >
            Tutup Transaksi
          </Button>
          <Button
            data-testid="reset-cart-button"
            type="button"
            size="lg"
            variant="outline"
            onClick={resetCart}
            disabled={!cart.length}
            className="bg-white/76 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:bg-[var(--surface-soft)]"
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </Card>

      {cashDialogOpen && isMounted
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex min-h-screen w-screen items-center justify-center bg-[rgb(17_24_39_/_0.8)] px-4 py-6 backdrop-blur-md">
              <div className="w-full max-w-md rounded-[2rem] border border-[rgba(255,255,255,0.65)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,248,242,0.94))] p-6 shadow-[0_28px_70px_rgba(32,18,9,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[var(--ink)]">Konfirmasi Pembayaran</h2>
                <p className="text-sm text-[var(--muted)]">
                  Metode: <span className="font-semibold text-[var(--coffee-700)]">{activePaymentMethodLabel}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCashDialogOpen(false)}
                className="flex size-10 items-center justify-center rounded-full bg-[var(--surface-soft)] text-[var(--muted)] transition hover:text-[var(--ink)]"
                aria-label="Tutup konfirmasi pembayaran"
              >
                <X className="size-4.5" />
              </button>
            </div>

            <div className="mt-6 space-y-2 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Total Tagihan</p>
              <p className="text-[2.5rem] font-semibold tracking-[-0.05em] text-[var(--coffee-700)]">{formatCurrency(total)}</p>
              <p className="text-sm text-[var(--muted)]">Sudah termasuk pajak {taxRate}%</p>
            </div>

            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Nominal Dibayar</p>
              <div className="grid grid-cols-4 gap-2">
                {CASH_QUICK_AMOUNTS.slice(0, 4).map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleCashQuickAmount(amount)}
                    className={cn(
                      "rounded-[1rem] border px-3 py-3 text-sm font-semibold transition",
                      cashPaidAmount === amount
                        ? "border-[var(--coffee-500)] bg-[rgba(198,122,63,0.12)] text-[var(--coffee-700)]"
                        : "border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                    )}
                  >
                    {amount >= 1000 ? `${amount / 1000}rb` : amount}
                  </button>
                ))}
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => handleCashQuickAmount(CASH_QUICK_AMOUNTS[4])}
                  className={cn(
                    "w-[calc((100%-1.5rem)/4)] min-w-[6.5rem] rounded-[1rem] border px-3 py-3 text-sm font-semibold transition",
                    cashPaidAmount === CASH_QUICK_AMOUNTS[4]
                      ? "border-[var(--coffee-500)] bg-[rgba(198,122,63,0.12)] text-[var(--coffee-700)]"
                      : "border-[var(--line)] bg-white text-[var(--ink)] hover:bg-[var(--surface-soft)]"
                  )}
                >
                  500rb
                </button>
              </div>
              <Input
                inputMode="numeric"
                value={cashPaidInput ? formatCurrency(Number(cashPaidInput)) : ""}
                onChange={(event) => handleCashInputChange(event.target.value)}
                placeholder="Masukan Nominal Lain"
                className="h-14 rounded-[1.1rem] text-lg font-semibold"
              />
            </div>

            <div
              className={cn(
                "mt-5 rounded-[1.25rem] border p-4",
                cashChangeAmount >= 0
                  ? "border-emerald-300/70 bg-emerald-50 text-emerald-800"
                  : "border-amber-300/70 bg-amber-50 text-amber-800"
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">{cashChangeAmount >= 0 ? "Kembalian" : "Kurang Bayar"}</p>
                  <p className="text-xs opacity-80">
                    {hasCashInput
                      ? cashChangeAmount >= 0
                        ? "Hitung otomatis dari nominal dibayar customer"
                        : "Tambahkan nominal hingga minimal sama dengan total"
                      : "Isi nominal dibayar atau pilih nominal cepat untuk menghitung otomatis"}
                  </p>
                </div>
                <p className="text-[1.9rem] font-semibold tracking-[-0.04em]">{hasCashInput ? formatCurrency(Math.abs(cashChangeAmount)) : formatCurrency(0)}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-[5rem_minmax(0,1fr)] gap-3">
              <Button type="button" size="lg" variant="outline" className="h-16 rounded-[1.15rem]" onClick={() => window.print()}>
                <ReceiptText className="size-5" />
              </Button>
              <Button
                type="button"
                size="lg"
                className="h-16 rounded-[1.15rem] bg-[linear-gradient(135deg,#17a26b,#12955f)] shadow-[0_18px_30px_rgba(18,149,95,0.22)] hover:bg-[linear-gradient(135deg,#159765,#108a58)]"
                disabled={!hasCashInput || cashPaidAmount < total}
                onClick={() => {
                  void submitOrder();
                }}
              >
                Selesaikan Transaksi
              </Button>
            </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
