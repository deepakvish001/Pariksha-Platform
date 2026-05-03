import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type GlassPanelProps = HTMLMotionProps<"div"> & {
  glow?: "cyan" | "magenta" | "lime" | "none";
};

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, glow = "none", children, ...rest }, ref) => {
    const glowClass =
      glow === "cyan"
        ? "shadow-[0_0_30px_-5px_rgba(34,211,238,0.45)] border-primary/30"
        : glow === "magenta"
        ? "shadow-[0_0_30px_-5px_rgba(217,70,239,0.45)] border-fuchsia-400/30"
        : glow === "lime"
        ? "shadow-[0_0_30px_-5px_rgba(132,204,22,0.45)] border-lime-400/30"
        : "border-border";
    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-2xl border bg-muted/30 backdrop-blur-xl",
          "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/5 before:to-transparent",
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
