import { Store } from "lucide-react";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-svh px-4 py-5 md:px-6 md:py-6">
      <section className="relative mx-auto grid min-h-[calc(100svh-2rem)] max-w-[1600px] overflow-hidden rounded-[2.25rem] border border-white/55 shadow-[0_35px_80px_rgba(82,49,29,0.12)] lg:grid-cols-[1.18fr_0.82fr]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/pexels-apgpotr-683039.jpg')" }} />
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(17,9,5,0.72)_0%,rgba(45,26,16,0.44)_46%,rgba(101,67,44,0.2)_66%,rgba(248,241,234,0.52)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_24%),radial-gradient(circle_at_right_center,rgba(255,248,242,0.2),transparent_30%)]" />
        </div>

        <div className="relative hidden overflow-hidden lg:block">
          <div className="absolute -left-8 top-10 size-56 rounded-full border border-white/18 bg-[radial-gradient(circle,rgba(255,255,255,0.24),rgba(255,255,255,0))] blur-sm" />
          <div className="absolute bottom-10 right-10 size-72 rounded-full bg-[radial-gradient(circle,rgba(255,230,204,0.28),rgba(255,230,204,0))]" />
          <div className="relative z-10 flex h-full flex-col px-10 py-10 xl:px-12 xl:py-12">
            <div className="flex h-full items-end">
              <div className="max-w-[35rem] pb-4 xl:ml-10 xl:pb-9">
                <div className="relative overflow-hidden rounded-[calc(var(--radius-panel)+0.2rem)] border border-white/18 bg-[linear-gradient(150deg,rgba(20,11,6,0.62),rgba(55,33,22,0.22))] p-8 shadow-[0_30px_70px_rgba(16,8,4,0.24)] backdrop-blur-xl xl:p-9">
                  <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)]" />
                  <div className="absolute -right-12 top-0 size-36 rounded-full bg-[radial-gradient(circle,rgba(255,241,227,0.2),rgba(255,241,227,0))]" />
                  <div className="absolute inset-x-8 bottom-0 h-px bg-[linear-gradient(90deg,rgba(255,255,255,0.02),rgba(255,255,255,0.18),rgba(255,255,255,0.02))]" />

                  <div className="relative space-y-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="min-w-0 flex-1 space-y-4">
                        <div className="inline-flex w-fit items-center gap-2 rounded-[var(--radius-pill)] border border-white/14 bg-white/8 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-white/78">
                          <span className="size-1.5 rounded-full bg-[var(--coffee-300)]" />
                          Valyons Coffee POS
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-2">
                            <h1 className="font-display text-[3rem] leading-[0.92] text-white/94 xl:text-[3.35rem]">Welcome Team</h1>
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/56">Internal Shop Operations Suite</p>
                          </div>

                          {/* <p className="max-w-xl text-sm leading-6 text-white/70 xl:text-[0.98rem]">
                            Satu ruang kerja untuk menjaga kasir, stok, dan ritme pelayanan tetap selaras dari buka sampai closing.
                          </p> */}
                        </div>
                      </div>

                      <div className="grid size-18 shrink-0 place-items-center rounded-[calc(var(--radius-soft)+0.1rem)] border border-white/16 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.06))] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] xl:size-20">
                        <Store className="size-8 text-white" />
                      </div>
                    </div>

                    <div className="grid gap-3 border-t border-white/12 pt-5 sm:grid-cols-3">
                      <div className="rounded-[var(--radius-soft)] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-4 py-3.5">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/50">Brand</p>
                        <p className="mt-2 text-base font-semibold text-white/88">Valyons Coffee</p>
                      </div>
                      <div className="rounded-[var(--radius-soft)] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-4 py-3.5">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/50">Focus</p>
                        <p className="mt-2 text-base font-semibold text-white/88">Cashier & Inventory Management</p>
                      </div>
                      <div className="rounded-[var(--radius-soft)] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] px-4 py-3.5">
                        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/50">Access</p>
                        <p className="mt-2 text-base font-semibold text-white/88">Dashboard Internal Employee</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center px-6 py-10 md:px-10 lg:px-16">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,248,242,0.08),rgba(255,252,249,0.24)_38%,rgba(244,232,219,0.42)_100%)] backdrop-blur-[2px]" />
          <div className="absolute inset-x-8 top-8 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.38),transparent)]" />
          <div className="relative w-full max-w-md rounded-[2rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(255,248,242,0.62))] p-7 shadow-[0_30px_60px_rgba(34,20,12,0.22)] backdrop-blur-xl md:p-8">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
