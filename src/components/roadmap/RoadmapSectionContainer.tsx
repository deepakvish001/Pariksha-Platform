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

// Enhanced section accent colors with refined visual distinction
const sectionAccents = [
  { border: "border-amber-500/20", accent: "from-amber-500/8 to-orange-500/4", line: "from-amber-500 via-orange-400 to-transparent" },
  { border: "border-violet-500/20", accent: "from-violet-500/8 to-purple-500/4", line: "from-violet-500 via-purple-400 to-transparent" },
  { border: "border-emerald-500/20", accent: "from-emerald-500/8 to-teal-500/4", line: "from-emerald-500 via-teal-400 to-transparent" },
  { border: "border-blue-500/20", accent: "from-blue-500/8 to-indigo-500/4", line: "from-blue-500 via-indigo-400 to-transparent" },
  { border: "border-rose-500/20", accent: "from-rose-500/8 to-pink-500/4", line: "from-rose-500 via-pink-400 to-transparent" },
  { border: "border-cyan-500/20", accent: "from-cyan-500/8 to-sky-500/4", line: "from-cyan-500 via-sky-400 to-transparent" },
];

// Refined animation variants
const containerVariants = {
  collapsed: {
    opacity: 0,
    height: 0,
    transition: {
      height: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as const },
      opacity: { duration: 0.15 },
    },
  },
  expanded: {
    opacity: 1,
    height: "auto" as const,
    transition: {
      height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const },
      opacity: { duration: 0.25, delay: 0.1 },
    },
  },
};

const contentVariants = {
  collapsed: {
    opacity: 0,
    y: -6,
    transition: { duration: 0.1 },
  },
  expanded: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, delay: 0.1 },
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
              "relative rounded-2xl overflow-hidden",
              "border-2 transition-all duration-300",
              "bg-card/50 dark:bg-card/30 backdrop-blur-sm",
              accent.border,
              "shadow-sm hover:shadow-md",
              isCompact ? "mt-1.5" : "mt-2",
              className
            )}
          >
            {/* Gradient accent on left edge */}
            <div className={cn(
              "absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl",
              `bg-gradient-to-b ${accent.line}`
            )} />
            
            {/* Subtle corner gradient */}
            <div className={cn(
              "absolute top-0 left-0 w-32 h-32 opacity-60 pointer-events-none",
              `bg-gradient-to-br ${accent.accent}`
            )} />
            
            {/* Content area */}
            <motion.div 
              variants={contentVariants}
              className={cn(
                "relative",
                isCompact ? "p-2 pl-3 sm:p-3 sm:pl-4" : "p-3 pl-4 sm:p-4 sm:pl-5"
              )}
            >
              {/* Decorative grid pattern - very subtle */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-[0.015] dark:opacity-[0.03]"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
                  backgroundSize: '24px 24px',
                }}
              />
              
              <div className="relative">
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
