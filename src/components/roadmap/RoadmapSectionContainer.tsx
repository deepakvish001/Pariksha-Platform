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

// Section accent colors with refined visual distinction
const sectionAccents = [
  { border: "border-amber-400/20", line: "from-amber-500 to-orange-400" },
  { border: "border-violet-400/20", line: "from-violet-500 to-purple-400" },
  { border: "border-emerald-400/20", line: "from-emerald-500 to-teal-400" },
  { border: "border-blue-400/20", line: "from-blue-500 to-indigo-400" },
  { border: "border-rose-400/20", line: "from-rose-500 to-pink-400" },
  { border: "border-cyan-400/20", line: "from-cyan-500 to-sky-400" },
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
    transition: { duration: 0.2, delay: 0.05 },
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
              "border transition-all duration-200",
              "bg-card/30 dark:bg-card/20",
              accent.border,
              isCompact ? "mt-1" : "mt-1.5",
              className
            )}
          >
            {/* Gradient accent on left edge */}
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl",
              `bg-gradient-to-b ${accent.line}`
            )} />
            
            {/* Content area */}
            <motion.div 
              variants={contentVariants}
              className={cn(
                "relative",
                isCompact ? "p-2 pl-2.5" : "p-2.5 pl-3"
              )}
            >
              <div className="relative space-y-0.5">
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
