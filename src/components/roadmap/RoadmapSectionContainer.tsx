import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RoadmapSectionContainerProps {
  children: React.ReactNode;
  isExpanded: boolean;
  sectionIndex: number;
  isCompact?: boolean;
  className?: string;
}

// Enhanced section accent colors with better visual distinction
const sectionAccents = [
  { border: "border-amber-400/25 dark:border-amber-500/30", bg: "from-amber-500/6 via-transparent to-transparent", glow: "shadow-amber-500/5" },
  { border: "border-violet-400/25 dark:border-violet-500/30", bg: "from-violet-500/6 via-transparent to-transparent", glow: "shadow-violet-500/5" },
  { border: "border-emerald-400/25 dark:border-emerald-500/30", bg: "from-emerald-500/6 via-transparent to-transparent", glow: "shadow-emerald-500/5" },
  { border: "border-blue-400/25 dark:border-blue-500/30", bg: "from-blue-500/6 via-transparent to-transparent", glow: "shadow-blue-500/5" },
  { border: "border-rose-400/25 dark:border-rose-500/30", bg: "from-rose-500/6 via-transparent to-transparent", glow: "shadow-rose-500/5" },
  { border: "border-cyan-400/25 dark:border-cyan-500/30", bg: "from-cyan-500/6 via-transparent to-transparent", glow: "shadow-cyan-500/5" },
];

// Animation variants for smooth expand/collapse
const containerVariants = {
  collapsed: {
    opacity: 0,
    height: 0,
    scale: 0.98,
    transition: {
      height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const },
      opacity: { duration: 0.2 },
      scale: { duration: 0.2 },
    },
  },
  expanded: {
    opacity: 1,
    height: "auto" as const,
    scale: 1,
    transition: {
      height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
      opacity: { duration: 0.3, delay: 0.1 },
      scale: { duration: 0.3, delay: 0.05 },
    },
  },
};

const contentVariants = {
  collapsed: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15 },
  },
  expanded: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay: 0.15 },
  },
};

const RoadmapSectionContainer: React.FC<RoadmapSectionContainerProps> = ({
  children,
  isExpanded,
  sectionIndex,
  isCompact = false,
  className,
}) => {
  const accent = sectionAccents[sectionIndex % sectionAccents.length];

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          key={`section-${sectionIndex}`}
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          variants={containerVariants}
          className="overflow-hidden"
        >
          <div
            className={cn(
              "relative rounded-xl overflow-hidden",
              "border transition-all duration-300",
              accent.border,
              `shadow-md ${accent.glow}`,
              isCompact ? "mt-2" : "mt-3",
              className
            )}
          >
            {/* Subtle gradient background */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br pointer-events-none",
              accent.bg
            )} />
            
            {/* Inner content area with clean background */}
            <motion.div 
              variants={contentVariants}
              className={cn(
                "relative bg-card/70 dark:bg-card/50 backdrop-blur-sm",
                isCompact ? "p-2 sm:p-3" : "p-3 sm:p-4"
              )}
            >
              {/* Decorative top accent line - subtle visual cue */}
              {!isCompact && (
                <motion.div 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className={cn(
                    "absolute top-0 left-4 right-4 h-px",
                    "bg-gradient-to-r from-transparent via-border/60 to-transparent"
                  )}
                />
              )}
              
              {children}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RoadmapSectionContainer;
