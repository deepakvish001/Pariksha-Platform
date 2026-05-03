import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const NeonButton = forwardRef<HTMLButtonElement, ButtonProps & { tone?: "cyan" | "magenta" | "lime" }>(
  ({ className, tone = "cyan", children, ...rest }, ref) => {
    const tones = {
      cyan: "from-cyan-500 to-blue-600 shadow-[0_0_20px_-2px_rgba(34,211,238,0.7)]",
      magenta: "from-fuchsia-500 to-pink-600 shadow-[0_0_20px_-2px_rgba(217,70,239,0.7)]",
      lime: "from-lime-400 to-emerald-500 shadow-[0_0_20px_-2px_rgba(132,204,22,0.7)]",
    } as const;
    return (
      <Button
        ref={ref}
        className={cn(
          "relative overflow-hidden bg-gradient-to-r text-foreground font-bold tracking-wide border-0",
          "hover:scale-[1.02] active:scale-95 transition-transform",
          tones[tone],
          className,
        )}
        {...rest}
      >
        <span className="relative z-10">{children}</span>
      </Button>
    );
  },
);
NeonButton.displayName = "NeonButton";
