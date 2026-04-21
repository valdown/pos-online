import type { ReactNode } from "react";

import { AppSidebar } from "@/components/shell/app-sidebar";
import { getCurrentAppUser } from "@/lib/supabase/user";

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const currentUser = await getCurrentAppUser();

  return (
    <div className="min-h-svh px-3 py-3 md:px-4 md:py-4 xl:px-5 xl:py-5">
      <div className="mx-auto flex min-h-[calc(100svh-1.5rem)] max-w-[1600px] flex-col gap-3 rounded-[2.25rem] border border-white/70 bg-white/55 p-3 shadow-[0_35px_80px_rgba(82,49,29,0.12)] backdrop-blur-xl md:min-h-[calc(100svh-2rem)] md:gap-4 md:p-4 xl:min-h-[calc(100svh-2.5rem)] xl:flex-row xl:gap-5 xl:p-5">
        <AppSidebar currentUser={currentUser} />
        <div className="min-h-0 flex-1 rounded-[calc(var(--radius-panel)+0.25rem)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,244,239,0.94))] p-4 md:p-6 xl:p-7 2xl:p-8">
          <div className="h-full overflow-y-auto pr-0 md:pr-1 xl:pr-2">
            <div className="space-y-6 md:space-y-7 xl:space-y-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
