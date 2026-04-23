"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BOOTSTRAP_OWNER_EMAIL } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Email wajib valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: BOOTSTRAP_OWNER_EMAIL,
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      setAuthError(payload?.error ?? "Login internal gagal. Periksa email dan kata sandi owner.");
      return;
    }

    setAuthError(null);
    toast.success("Login internal berhasil.", {
      description: "Session owner aktif dan dashboard siap dipakai.",
    });
    router.push("/dashboard");
    router.refresh();
  });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(event);
      }}
      className="space-y-5"
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--coffee-600)]">Owner access</p>
        <h2 className="font-display text-5xl leading-none text-[var(--coffee-900)]">Point of Sale</h2>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Masuk ke dashboard operasional untuk memantau penjualan, kasir aktif, dan pengaturan toko lewat akun owner internal.
        </p>
      </div>

      <div className="space-y-4">
        <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
          <span>Email</span>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input data-testid="login-username" className="pl-11" {...form.register("email")} placeholder="owner@coffeebean.local" />
          </div>
          {form.formState.errors.email ? (
            <p className="text-sm text-[var(--coffee-700)]">{form.formState.errors.email.message}</p>
          ) : null}
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
          <span>Kata Sandi</span>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              data-testid="login-password"
              className="pl-11 pr-12"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...form.register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--muted)] transition hover:text-[var(--coffee-700)]"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {form.formState.errors.password ? (
            <p className="text-sm text-[var(--coffee-700)]">{form.formState.errors.password.message}</p>
          ) : null}
        </label>
      </div>

      <div className="rounded-[var(--radius-soft)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">
        Gunakan akun owner bootstrap <span className="font-semibold text-[var(--coffee-800)]">{BOOTSTRAP_OWNER_EMAIL}</span>. Password awal mengikuti SQL bootstrap owner dan sebaiknya segera diganti setelah login pertama.
      </div>

      {authError ? <p className="text-sm font-medium text-[var(--coffee-700)]">{authError}</p> : null}

      <Button data-testid="login-submit" className="w-full" type="submit" size="lg" disabled={form.formState.isSubmitting}>
        Login
      </Button>
    </form>
  );
}
