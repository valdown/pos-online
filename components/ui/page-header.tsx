import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div className="space-y-2">
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--coffee-600)]">{eyebrow}</p> : null}
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[var(--ink)] md:text-4xl">{title}</h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--muted)] md:text-base">{description}</p>
        </div>
      </div>
      {actions ? <div className="flex w-full flex-wrap items-center gap-3 xl:w-auto xl:justify-end">{actions}</div> : null}
    </div>
  );
}
