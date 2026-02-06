import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RoadmapSectionContainerProps {
  children: React.ReactNode;
  isExpanded: boolean;
  sectionIndex: number;
  isCompact?: boolean;
  isRecommendedSection?: boolean;
  className?: string;
}

// Section accent colors with refined visual distinction
const sectionAccents = [
  { border: "border-amber-400/40", line: "from-amber-500 to-orange-400", glow: "shadow-amber-500/10", bg: "from-amber-50/30 dark:from-amber-500/5" },
  { border: "border-violet-400/40", line: "from-violet-500 to-purple-400", glow: "shadow-violet-500/10", bg: "from-violet-50/30 dark:from-violet-500/5" },
  { border: "border-emerald-400/40", line: "from-emerald-500 to-teal-400", glow: "shadow-emerald-500/10", bg: "from-emerald-50/30 dark:from-emerald-500/5" },
  { border: "border-blue-400/40", line: "from-blue-500 to-indigo-400", glow: "shadow-blue-500/10", bg: "from-blue-50/30 dark:from-blue-500/5" },
  { border: "border-rose-400/40", line: "from-rose-500 to-pink-400", glow: "shadow-rose-500/10", bg: "from-rose-50/30 dark:from-rose-500/5" },
  { border: "border-cyan-400/40", line: "from-cyan-500 to-sky-400", glow: "shadow-cyan-500/10", bg: "from-cyan-50/30 dark:from-cyan-500/5" },
];

// Refined animation variants
const containerVariants = {
  collapsed: {
    opacity: 0,
    height: 0,
    transition: {
      height: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
      opacity: { duration: 0.15 },
    },
  },
  expanded: {
    opacity: 1,
    height: "auto" as const,
    transition: {
      height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
      opacity: { duration: 0.2, delay: 0.05 },
    },
  },
};

const contentVariants = {
  collapsed: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.1 },
  },
  expanded: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, delay: 0.06 },
  },
};

const RoadmapSectionContainer: React.FC<RoadmapSectionContainerProps> = ({
  children,
  isExpanded,
  sectionIndex,
  isCompact = false,
  isRecommendedSection = false,
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
          <motion.div
            className={cn(
              "relative rounded-2xl overflow-hidden",
              "border-2 transition-all duration-300",
              "bg-gradient-to-br to-transparent",
              "hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-primary/3",
              accent.border,
              accent.bg,
              isRecommendedSection && `shadow-lg ${accent.glow}`,
              isCompact ? "mt-2" : "mt-3",
              className
            )}
            whileHover={{ 
              scale: 1.003,
              transition: { duration: 0.2, ease: "easeOut" }
            }}
          >
            {/* Gradient accent on left edge - Enhanced */}
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl",
              `bg-gradient-to-b ${accent.line}`
            )} />
            
            {/* Subtle top border accent */}
            <div className={cn(
              "absolute left-0 right-0 top-0 h-0.5",
              `bg-gradient-to-r ${accent.line} opacity-30`
            )} />
            
            {/* Content area */}
            <motion.div 
              variants={contentVariants}
              className={cn(
                "relative",
                isCompact ? "p-3 pl-4" : "p-4 pl-5"
              )}
            >
              <div className={cn(
                "relative",
                isCompact ? "space-y-1" : "space-y-2"
              )}>
                {children}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RoadmapSectionContainer;
