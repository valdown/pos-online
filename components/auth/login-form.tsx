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
import { DEMO_CREDENTIALS, DEMO_SESSION_COOKIE } from "@/lib/auth";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  username: z.string().min(1, "Username wajib diisi."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const supabaseClient = getBrowserSupabaseClient();
  const usesSupabase = Boolean(supabaseClient);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: DEMO_CREDENTIALS.username,
      password: DEMO_CREDENTIALS.password,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (supabaseClient) {
      const { error } = await supabaseClient.auth.signInWithPassword({
        email: values.username,
        password: values.password,
      });

      if (error) {
        setAuthError(error.message || "Login Supabase gagal. Pastikan email dan password benar.");
        return;
      }

      setAuthError(null);
      toast.success("Login Supabase berhasil.", {
        description: "Session tersimpan dan dashboard siap dipakai.",
      });
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const validCredentials =
      values.username === DEMO_CREDENTIALS.username && values.password === DEMO_CREDENTIALS.password;

    if (!validCredentials) {
      setAuthError("Demo login menggunakan kredensial owner / coffeebean.");
      return;
    }

    setAuthError(null);
    document.cookie = `${DEMO_SESSION_COOKIE}=active; path=/; max-age=604800; samesite=lax`;
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
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[var(--coffee-600)]">{usesSupabase ? "Supabase auth" : "Demo akses"}</p>
        <h2 className="font-display text-5xl leading-none text-[var(--coffee-900)]">Valyons Shop</h2>
        <p className="text-sm leading-6 text-[var(--muted)]">
          {usesSupabase
            ? "Masuk memakai email dan password akun Supabase yang kamu buat nanti."
            : "Masuk ke dashboard operasional untuk memantau penjualan, kasir aktif, dan pengaturan toko."}
        </p>
      </div>

      <div className="space-y-4">
        <label className="space-y-2 text-sm font-medium text-[var(--ink)]">
          <span>{usesSupabase ? "Email" : "Username"}</span>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input data-testid="login-username" className="pl-11" {...form.register("username")} placeholder={usesSupabase ? "owner@coffeebean.id" : "username"} />
          </div>
          {form.formState.errors.username ? (
            <p className="text-sm text-[var(--coffee-700)]">{form.formState.errors.username.message}</p>
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
        {usesSupabase ? (
          <>
            Isi dengan email/password user Supabase. Kalau env belum diisi, form ini otomatis kembali ke mode demo.
          </>
        ) : (
          <>
            Gunakan <span className="font-semibold text-[var(--coffee-800)]">owner</span> / <span className="font-semibold text-[var(--coffee-800)]">coffeebean</span> untuk masuk.
          </>
        )}
      </div>

      {authError ? <p className="text-sm font-medium text-[var(--coffee-700)]">{authError}</p> : null}

      <Button data-testid="login-submit" className="w-full" type="submit" size="lg" disabled={form.formState.isSubmitting}>
        Masuk ke Sistem
      </Button>
    </form>
  );
}
