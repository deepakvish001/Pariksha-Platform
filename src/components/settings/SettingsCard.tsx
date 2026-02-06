import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SettingsCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const SettingsCard = ({ children, className, delay = 0 }: SettingsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={cn(
        "relative rounded-2xl border border-border bg-card/80 backdrop-blur-2xl p-6",
        "shadow-[var(--shadow-card)]",
        className
      )}
    >
      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-foreground/[0.02] to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default SettingsCard;
