import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type GlassPanelProps = HTMLMotionProps<"div"> & {
  glow?: "cyan" | "magenta" | "lime" | "none";
};

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, glow = "none", children, ...rest }, ref) => {
    const glowClass =
      glow === "none"
        ? "border-border"
        : "border-primary/30 shadow-[0_0_30px_-8px_hsl(var(--primary)/0.4)]";
    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-xl border bg-card backdrop-blur-xl",
          glowClass,
          className,
        )}
        {...rest}
      >
        {children}
      </motion.div>
    );
  },
);
GlassPanel.displayName = "GlassPanel";
