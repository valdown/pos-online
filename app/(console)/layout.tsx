import type { ReactNode } from "react";

import { AppSidebar } from "@/components/shell/app-sidebar";
import { getCurrentAppUser } from "@/lib/supabase/user";

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentAppUser();

  return (
    <div className="min-h-svh px-3 py-3 md:px-5 md:py-5">
      <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] max-w-[1600px] flex-col gap-4 rounded-[2.25rem] border border-white/70 bg-white/55 p-3 shadow-[0_35px_80px_rgba(82,49,29,0.12)] backdrop-blur-xl xl:flex-row">
        <AppSidebar currentUser={currentUser} />
        <div className="min-h-0 flex-1 rounded-[calc(var(--radius-panel)+0.25rem)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,239,0.94))] p-5 md:p-7">
          <div className="h-full overflow-y-auto pr-1">
            <div className="space-y-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
