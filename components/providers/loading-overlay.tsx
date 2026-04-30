"use client";

import { createContext, useContext, useMemo, useState } from "react";

import { Loader } from "@/components/ui/loader";

type LoadingOverlayContextValue = {
  startLoading: () => void;
  stopLoading: () => Promise<void>;
};

const LoadingOverlayContext = createContext<LoadingOverlayContextValue | null>(null);

export function LoadingOverlayProvider({ children }: { children: React.ReactNode }) {
  const [activeCount, setActiveCount] = useState(0);

  const value = useMemo<LoadingOverlayContextValue>(
    () => ({
      startLoading: () => setActiveCount((count) => count + 1),
      stopLoading: async () => {
        setActiveCount((count) => Math.max(0, count - 1));
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            window.setTimeout(resolve, 120);
          });
        });
      },
    }),
    []
  );

  return (
    <LoadingOverlayContext.Provider value={value}>
      {children}
      {activeCount > 0 ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/92 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader className="size-12 text-[var(--coffee-700)]" label="Memuat" />
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--coffee-800)]">Coffee Bean</p>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Memuat halaman...</p>
            </div>
          </div>
        </div>
      ) : null}
    </LoadingOverlayContext.Provider>
  );
}

export function useLoadingOverlay() {
  const context = useContext(LoadingOverlayContext);

  if (!context) {
    throw new Error("useLoadingOverlay must be used within LoadingOverlayProvider");
  }

  return context;
}
