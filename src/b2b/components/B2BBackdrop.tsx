import { motion } from "framer-motion";

/**
 * Animated orb + grid backdrop matching the main landing-page Hero aesthetic.
 * Place as the first child of a `.theme-b2b` wrapper with `relative overflow-hidden`.
 */
export function B2BBackdrop({ variant = "full" }: { variant?: "full" | "subtle" }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse at top, black 35%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at top, black 35%, transparent 75%)",
        }}
      />

      {/* Indigo orb (top-left) */}
      <motion.div
        className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-indigo-500/20 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Violet orb (bottom-right) */}
      <motion.div
        className="absolute -bottom-40 -right-32 h-[480px] w-[480px] rounded-full bg-violet-500/15 blur-3xl"
        animate={{ x: [0, -50, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />

      {variant === "full" && (
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[300px] w-[300px] rounded-full bg-purple-500/12 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

/** Reusable amber gradient text className used across Parikshaa pages. */
export const amberGradientText =
  "bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent";
