import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { AppToaster } from "@/components/providers/toaster";
import { DemoSettingsProvider } from "@/components/providers/demo-settings";

import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Coffee Bean POS",
    template: "%s | Coffee Bean POS",
  },
  description: "Demo POS coffee shop built with Next.js App Router.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${bodyFont.variable} ${displayFont.variable} min-h-svh bg-[var(--app-bg)] font-sans text-[var(--ink)] antialiased`}>
        <DemoSettingsProvider>
          {children}
          <AppToaster />
          {process.env.VERCEL === "1" ? <Analytics /> : null}
        </DemoSettingsProvider>
      </body>
    </html>
  );
}
