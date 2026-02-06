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
  { border: "border-amber-400/30", line: "from-amber-500 to-orange-400", glow: "shadow-amber-500/5" },
  { border: "border-violet-400/30", line: "from-violet-500 to-purple-400", glow: "shadow-violet-500/5" },
  { border: "border-emerald-400/30", line: "from-emerald-500 to-teal-400", glow: "shadow-emerald-500/5" },
  { border: "border-blue-400/30", line: "from-blue-500 to-indigo-400", glow: "shadow-blue-500/5" },
  { border: "border-rose-400/30", line: "from-rose-500 to-pink-400", glow: "shadow-rose-500/5" },
  { border: "border-cyan-400/30", line: "from-cyan-500 to-sky-400", glow: "shadow-cyan-500/5" },
];

// Refined animation variants
const containerVariants = {
  collapsed: {
    opacity: 0,
    height: 0,
    transition: {
      height: { duration: 0.18, ease: [0.4, 0, 0.2, 1] as const },
      opacity: { duration: 0.12 },
    },
  },
  expanded: {
    opacity: 1,
    height: "auto" as const,
    transition: {
      height: { duration: 0.22, ease: [0.4, 0, 0.2, 1] as const },
      opacity: { duration: 0.18, delay: 0.04 },
    },
  },
};

const contentVariants = {
  collapsed: {
    opacity: 0,
    y: -3,
    transition: { duration: 0.08 },
  },
  expanded: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.15, delay: 0.04 },
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
          <div
            className={cn(
              "relative rounded-2xl overflow-hidden",
              "border-2 transition-all duration-200",
              "bg-card/30 dark:bg-card/20",
              accent.border,
              isRecommendedSection && `shadow-lg ${accent.glow}`,
              isCompact ? "mt-1" : "mt-2",
              className
            )}
          >
            {/* Gradient accent on left edge */}
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl",
              `bg-gradient-to-b ${accent.line}`
            )} />
            
            {/* Content area */}
            <motion.div 
              variants={contentVariants}
              className={cn(
                "relative",
                isCompact ? "p-2 pl-3" : "p-3 pl-4"
              )}
            >
              <div className={cn(
                "relative",
                isCompact ? "space-y-0" : "space-y-0.5"
              )}>
                {children}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RoadmapSectionContainer;
