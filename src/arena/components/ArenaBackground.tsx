import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function ArenaBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}>
      <motion.div
        className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl"
        animate={{ x: [0, 100, -50, 0], y: [0, 50, 100, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 right-1/4 h-[600px] w-[600px] rounded-full bg-primary/10 blur-3xl"
        animate={{ x: [0, -100, 50, 0], y: [0, -50, -100, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
