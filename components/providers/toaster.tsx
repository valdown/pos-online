"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          borderRadius: "20px",
          border: "1px solid var(--line)",
          background: "rgba(255,250,246,0.96)",
          color: "var(--ink)",
          boxShadow: "var(--shadow-card)",
        },
      }}
    />
  );
}
