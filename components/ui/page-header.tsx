import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col xl:flex-row xl:items-start xl:justify-between",
        compact ? "gap-2.5 xl:gap-3" : "gap-5"
      )}
    >
      <div className={compact ? "space-y-1.5" : "space-y-2"}>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--coffee-600)]">{eyebrow}</p> : null}
        <div className={compact ? "space-y-0.5" : "space-y-1"}>
          <h1 className={cn("text-3xl font-semibold tracking-[-0.03em] text-[var(--ink)]", compact ? "leading-none md:text-[2rem]" : "md:text-4xl")}>{title}</h1>
          <p className={cn("max-w-2xl text-sm text-[var(--muted)]", compact ? "leading-[1.25rem] md:text-[13px]" : "leading-6 md:text-base")}>{description}</p>
        </div>
      </div>
      {actions ? (
        <div className={cn("flex w-full flex-wrap items-center xl:w-auto xl:justify-end", compact ? "gap-2.5 xl:gap-3" : "gap-3")}>{actions}</div>
      ) : null}
    </div>
  );
}
