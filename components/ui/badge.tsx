import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase",
  {
    variants: {
      variant: {
        neutral: "bg-[var(--surface-soft)] text-[var(--coffee-800)]",
        accent: "bg-[rgba(198,122,63,0.14)] text-[var(--coffee-700)]",
        success: "bg-[rgba(65,116,95,0.15)] text-[var(--success)]",
        warning: "bg-[rgba(214,145,55,0.16)] text-[var(--coffee-700)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
