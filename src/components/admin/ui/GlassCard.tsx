import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Add a subtle amber inner glow on hover. */
  interactive?: boolean;
  /** Remove default padding (useful when wrapping tables edge-to-edge). */
  flush?: boolean;
}

/**
 * Frosted-glass surface used across the admin redesign. Drop-in replacement
 * for shadcn `<Card>`; keeps the same border-radius and spacing footprint
 * so existing layouts work unchanged.
 */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, interactive, flush, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "admin-glass-card relative rounded-2xl border border-border/40 bg-card/40 backdrop-blur-xl",
        "shadow-[0_1px_0_0_hsl(var(--border)/0.4)_inset,0_20px_50px_-30px_hsl(24_95%_53%/0.25)]",
        "transition-all duration-200",
        !flush && "p-5 sm:p-6",
        interactive &&
          "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_1px_0_0_hsl(var(--border)/0.4)_inset,0_30px_60px_-30px_hsl(24_95%_53%/0.4)]",
        className,
      )}
      {...props}
    />
  ),
);
GlassCard.displayName = "GlassCard";
