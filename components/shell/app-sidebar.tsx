"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as Avatar from "@radix-ui/react-avatar";
import {
  BellRing,
  CookingPot,
  FileText,
  LayoutDashboard,
  LogOut,
  Package2,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hasMenuAccess } from "@/lib/internal-permissions";
import { type StaffMenuKey } from "@/lib/roles";
import type { AppShellUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, menuKey: "dashboard" },
  { href: "/kasir", label: "Kasir", icon: ReceiptText, menuKey: "kasir" },
  { href: "/dapur", label: "Kitchen", icon: CookingPot, menuKey: "dapur" },
  { href: "/invoice-kasir", label: "Invoice Cashier", icon: FileText, menuKey: "invoice-kasir" },
  { href: "/produk", label: "List Products", icon: Package2, menuKey: "produk" },
  { href: "/staf", label: "List Staff", icon: Users, menuKey: "staf" },
  { href: "/notifikasi", label: "Notifications", icon: BellRing, menuKey: "notifikasi" },
  { href: "/pengaturan", label: "Settings", icon: Settings, menuKey: "pengaturan" },
] as const;

export function AppSidebar({ currentUser }: { currentUser: AppShellUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const visibleLinks = links.filter((link) => hasMenuAccess(currentUser, link.menuKey as StaffMenuKey, "read"));

  useEffect(() => {
    for (const { href } of visibleLinks) {
      void router.prefetch(href);
    }
  }, [router, visibleLinks]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="flex w-full flex-col gap-5 rounded-[calc(var(--radius-panel)+0.25rem)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(252,246,240,0.92))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] md:gap-6 md:p-5 xl:sticky xl:top-[0.5rem] xl:max-h-[calc(100svh-1rem)] xl:w-[304px] xl:shrink-0 xl:gap-4 xl:overflow-y-auto xl:p-4">
      <div className="space-y-5 xl:space-y-3">
        <div className="flex items-center gap-4 rounded-[var(--radius-soft)] bg-[rgba(255,255,255,0.76)] p-3 md:p-4 xl:gap-3 xl:p-2.5">
          <div className="flex size-14 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(135deg,var(--coffee-500),var(--coffee-700))] text-white shadow-[0_14px_26px_rgba(122,75,44,0.22)] xl:size-11 xl:rounded-[1.05rem]">
            <Store className="size-6 xl:size-5" />
          </div>
          <div className="space-y-1">
            <p className="font-display text-2xl leading-none text-[var(--coffee-900)] xl:text-[1.5rem]">Valyons Coffee</p>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)] xl:text-[11px] xl:tracking-[0.22em]">Internal POS</p>
          </div>
        </div>

        {/* <div className="rounded-[var(--radius-soft)] bg-[linear-gradient(135deg,rgba(255,250,246,0.92),rgba(244,230,215,0.82))] p-4 md:p-5 xl:p-3.5">
          <Badge variant="accent" className="w-fit xl:px-2.5 xl:py-0.5 xl:text-[11px] xl:tracking-[0.14em]">Kasir Aktif</Badge>
          <div className="mt-4 flex items-end justify-between gap-3 xl:mt-2.5 xl:gap-2.5">
            <div className="space-y-1 xl:space-y-0.5">
              <p className="text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)] xl:text-[1.85rem]">23.42</p>
              <p className="text-sm text-[var(--muted)] xl:text-[13px] xl:leading-5">Internal owner session aktif</p>
            </div>
            <div className="rounded-full bg-white/70 p-2 text-[var(--coffee-700)] xl:p-1.5">
              <Sparkles className="size-4 xl:size-3.5" />
            </div>
          </div>
        </div> */}
      </div>

      <div className="space-y-5 md:space-y-6 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col xl:justify-between xl:space-y-4">
        <div className="space-y-4 xl:space-y-2.5">
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)] xl:px-2.5 xl:text-[11px] xl:tracking-[0.24em]">Main Menu</p>
          <nav className="space-y-2 xl:space-y-1">
            {visibleLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;

              return (
                <Link
                  key={href}
                  href={href}
                  onMouseEnter={() => void router.prefetch(href)}
                  onFocus={() => void router.prefetch(href)}
                  className={cn("sidebar-item xl:gap-2.5 xl:px-3 xl:py-2.5", active && "sidebar-item-active")}
                >
                  <Icon className="size-4 xl:size-3.5" />
                  <span className="xl:text-[0.95rem]">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4 rounded-[var(--radius-soft)] bg-[rgba(255,255,255,0.72)] p-4 md:p-5 xl:space-y-2.5 xl:p-3">
          <div className="flex items-center gap-3 xl:gap-2.5">
            <Avatar.Root className="flex size-12 items-center justify-center overflow-hidden rounded-[1rem] bg-[linear-gradient(135deg,var(--coffee-600),var(--coffee-800))] text-sm font-semibold text-white xl:size-10">
              <Avatar.Fallback delayMs={0}>{currentUser.initials}</Avatar.Fallback>
            </Avatar.Root>
            <div className="min-w-0">
              <p className="font-semibold text-[var(--ink)] xl:text-sm">{currentUser.name}</p>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)] xl:gap-1.5 xl:text-[11px] xl:tracking-[0.16em]">
                <ShieldCheck className="size-3.5 xl:size-3" />
                {currentUser.role}
              </div>
              <p className="mt-1 text-xs text-[var(--muted)] xl:mt-0.5 xl:text-[11px] xl:leading-4">{currentUser.subtitle}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 xl:gap-1.5">
            <Button variant="secondary" type="button" size="sm" className="xl:h-8 xl:px-3 xl:text-[11px]">
              <Sparkles className="size-4 xl:size-3.5" />
              {currentUser.modeLabel}
            </Button>
            <Button variant="outline" type="button" size="sm" onClick={handleLogout} className="xl:h-8 xl:px-3 xl:text-[11px]">
              <LogOut className="size-4 xl:size-3.5" />
              Keluar
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
