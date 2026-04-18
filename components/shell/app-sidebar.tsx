"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as Avatar from "@radix-ui/react-avatar";
import {
  BellRing,
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
import type { AppShellUser } from "@/lib/auth";
import { DEMO_SESSION_COOKIE } from "@/lib/auth";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/kasir", label: "POS Kasir", icon: ReceiptText },
  { href: "/produk", label: "Produk", icon: Package2 },
  { href: "/staf", label: "Staf", icon: Users },
  { href: "/notifikasi", label: "Notifikasi", icon: BellRing },
  { href: "/pengaturan", label: "Pengaturan", icon: Settings },
] as const;

export function AppSidebar({ currentUser }: { currentUser: AppShellUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabaseClient = getBrowserSupabaseClient();

  const handleLogout = async () => {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
      router.push("/login");
      router.refresh();
      return;
    }

    document.cookie = `${DEMO_SESSION_COOKIE}=; path=/; max-age=0`;
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="flex w-full max-w-[290px] flex-col gap-6 rounded-[calc(var(--radius-panel)+0.25rem)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(252,246,240,0.92))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-[var(--radius-soft)] bg-[rgba(255,255,255,0.76)] p-3">
          <div className="flex size-14 items-center justify-center rounded-[1.35rem] bg-[linear-gradient(135deg,var(--coffee-500),var(--coffee-700))] text-white shadow-[0_14px_26px_rgba(122,75,44,0.22)]">
            <Store className="size-6" />
          </div>
          <div className="space-y-1">
            <p className="font-display text-2xl leading-none text-[var(--coffee-900)]">Coffee Bean</p>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">POS internal suite</p>
          </div>
        </div>

        <div className="rounded-[var(--radius-soft)] bg-[linear-gradient(135deg,rgba(255,250,246,0.92),rgba(244,230,215,0.82))] p-4">
          <Badge variant="accent" className="w-fit">Kasir Aktif</Badge>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-3xl font-semibold tracking-[-0.04em] text-[var(--ink)]">23.42</p>
            <p className="text-sm text-[var(--muted)]">{currentUser.modeLabel === "Supabase" ? "Supabase session aktif" : "Counter A - shift sore"}</p>
          </div>
            <div className="rounded-full bg-white/70 p-2 text-[var(--coffee-700)]">
              <Sparkles className="size-4" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="px-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Menu Utama</p>
        <nav className="space-y-1.5">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link key={href} href={href} className={cn("sidebar-item", active && "sidebar-item-active")}>
                <Icon className="size-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto space-y-4 rounded-[var(--radius-soft)] bg-[rgba(255,255,255,0.72)] p-4">
        <div className="flex items-center gap-3">
          <Avatar.Root className="flex size-12 items-center justify-center overflow-hidden rounded-[1rem] bg-[linear-gradient(135deg,var(--coffee-600),var(--coffee-800))] text-sm font-semibold text-white">
            <Avatar.Fallback delayMs={0}>{currentUser.initials}</Avatar.Fallback>
          </Avatar.Root>
          <div>
            <p className="font-semibold text-[var(--ink)]">{currentUser.name}</p>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
              <ShieldCheck className="size-3.5" />
              {currentUser.role}
            </div>
            <p className="mt-1 text-xs text-[var(--muted)]">{currentUser.subtitle}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" type="button">
            <Sparkles className="size-4" />
            {currentUser.modeLabel}
          </Button>
          <Button variant="outline" type="button" onClick={handleLogout}>
            <LogOut className="size-4" />
            Keluar
          </Button>
        </div>
      </div>
    </aside>
  );
}
