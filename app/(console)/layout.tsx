import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { LoginSuccessFeedback } from "@/components/auth/login-success-feedback";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { getCurrentAppUser } from "@/lib/supabase/user";
import { touchInternalSession } from "@/lib/internal-auth";

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentAppUser();

  if (!currentUser) {
    redirect("/login");
  }

  void touchInternalSession(currentUser);

  return (
    <div className="box-border h-svh px-3 py-3 md:px-4 md:py-4 xl:px-4 xl:py-0.5">
      <LoginSuccessFeedback />
      <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] max-w-[1600px] flex-col gap-3 rounded-[2.25rem] border border-white/70 bg-white/55 p-3 shadow-[0_35px_80px_rgba(82,49,29,0.12)] backdrop-blur-xl md:min-h-[calc(100svh-2rem)] md:gap-4 md:p-4 xl:min-h-[calc(100svh-1rem)] xl:flex-row xl:items-start xl:gap-2 xl:p-1">
        <AppSidebar currentUser={currentUser} />
        <div className="min-h-0 flex-1 rounded-[calc(var(--radius-panel)+0.25rem)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,239,0.94))] p-4 md:p-6 xl:min-w-0 xl:flex-1 xl:p-5 2xl:p-6">
          <div className="pr-0 md:pr-1 xl:pr-1.5">
            <div className="space-y-6 md:space-y-7 xl:space-y-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
