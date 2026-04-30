import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-pill)] text-sm font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--coffee-300)] disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(135deg,var(--coffee-500),var(--coffee-700))] text-white shadow-[0_18px_30px_rgba(122,75,44,0.24)] hover:-translate-y-0.5",
        secondary:
          "bg-[var(--surface-soft)] text-[var(--coffee-800)] hover:bg-[var(--sand-200)]",
        outline:
          "border border-[var(--line)] bg-white/80 text-[var(--ink)] hover:border-[var(--coffee-300)] hover:bg-[var(--surface-soft)]",
        ghost: "text-[var(--muted)] hover:bg-white/70 hover:text-[var(--ink)]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-6 text-sm",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, loadingText, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled || loading} {...props}>
        {loading ? (
          <>
            <Loader className="size-[1rem]" label={loadingText ?? "Loading"} />
            {loadingText ?? children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
