import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-12 w-full rounded-[var(--radius-soft)] border border-[var(--line)] bg-white px-4 text-sm text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-colors outline-none placeholder:text-[var(--muted)] focus:border-[var(--coffee-300)] focus:ring-2 focus:ring-[rgba(224,164,92,0.18)]",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
