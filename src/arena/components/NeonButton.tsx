import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const NeonButton = forwardRef<HTMLButtonElement, ButtonProps & { tone?: "cyan" | "magenta" | "lime" }>(
  ({ className, children, ...rest }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "bg-gradient-orange text-primary-foreground font-semibold border-0 transition-all duration-300 hover:scale-[1.02] active:scale-95",
          "shadow-[0_0_20px_-4px_hsl(var(--primary)/0.6)] hover:shadow-[0_0_30px_-4px_hsl(var(--primary)/0.8)]",
          className,
        )}
        {...rest}
      >
        {children}
      </Button>
    );
  },
);
NeonButton.displayName = "NeonButton";
