import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RoadmapSectionContainerProps {
  children: React.ReactNode;
  isExpanded: boolean;
  sectionIndex: number;
  className?: string;
}

// Subtle section accent colors for visual variety
const sectionAccents = [
  { border: "border-amber-500/20 dark:border-amber-500/30", bg: "from-amber-500/5 via-transparent to-transparent" },
  { border: "border-violet-500/20 dark:border-violet-500/30", bg: "from-violet-500/5 via-transparent to-transparent" },
  { border: "border-emerald-500/20 dark:border-emerald-500/30", bg: "from-emerald-500/5 via-transparent to-transparent" },
  { border: "border-blue-500/20 dark:border-blue-500/30", bg: "from-blue-500/5 via-transparent to-transparent" },
  { border: "border-rose-500/20 dark:border-rose-500/30", bg: "from-rose-500/5 via-transparent to-transparent" },
  { border: "border-cyan-500/20 dark:border-cyan-500/30", bg: "from-cyan-500/5 via-transparent to-transparent" },
];

const RoadmapSectionContainer: React.FC<RoadmapSectionContainerProps> = ({
  children,
  isExpanded,
  sectionIndex,
  className,
}) => {
  const accent = sectionAccents[sectionIndex % sectionAccents.length];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div
        className={cn(
          "relative mt-4 rounded-2xl overflow-hidden",
          "border-2 transition-colors duration-300",
          accent.border,
          className
        )}
      >
        {/* Subtle gradient background */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-br pointer-events-none opacity-50",
          accent.bg
        )} />
        
        {/* Inner content area with clean background */}
        <div className="relative bg-card/60 dark:bg-card/40 backdrop-blur-sm p-4 sm:p-5">
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 rounded-tl-xl border-inherit opacity-40" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 rounded-br-xl border-inherit opacity-40" />
          
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default RoadmapSectionContainer;
