import { cn } from "@/lib/utils";

export function Loader({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <div className={cn("relative inline-flex size-[1.15rem] items-center justify-center", className)} aria-label={label} role="status">
      <span className="absolute inset-0 rounded-full border border-current/25" />
      <span className="absolute inset-0 rounded-full border border-transparent border-t-current border-r-current animate-[loader-spin_1.2s_linear_infinite]" />
      <span className="absolute left-1/2 top-1/2 h-[2px] w-1/2 origin-left animate-[loader-orbit_1.2s_linear_infinite] bg-transparent">
        <span className="absolute -right-1 -top-[5px] size-[0.5rem] rounded-full bg-current shadow-[0_0_10px_currentColor]" />
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
}
