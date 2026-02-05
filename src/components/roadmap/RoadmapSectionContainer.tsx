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

// Subtle section accent colors for visual variety
const sectionAccents = [
  { border: "border-amber-500/20 dark:border-amber-500/30", bg: "from-amber-500/5 via-transparent to-transparent" },
  { border: "border-violet-500/20 dark:border-violet-500/30", bg: "from-violet-500/5 via-transparent to-transparent" },
  { border: "border-emerald-500/20 dark:border-emerald-500/30", bg: "from-emerald-500/5 via-transparent to-transparent" },
  { border: "border-blue-500/20 dark:border-blue-500/30", bg: "from-blue-500/5 via-transparent to-transparent" },
  { border: "border-rose-500/20 dark:border-rose-500/30", bg: "from-rose-500/5 via-transparent to-transparent" },
  { border: "border-cyan-500/20 dark:border-cyan-500/30", bg: "from-cyan-500/5 via-transparent to-transparent" },
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
    y: -10,
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
              "relative rounded-2xl overflow-hidden",
              "border-2 transition-colors duration-300",
              accent.border,
              isCompact ? "mt-2" : "mt-4",
              className
            )}
          >
            {/* Subtle gradient background */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br pointer-events-none opacity-50",
              accent.bg
            )} />
            
            {/* Inner content area with clean background */}
            <motion.div 
              variants={contentVariants}
              className={cn(
                "relative bg-card/60 dark:bg-card/40 backdrop-blur-sm",
                isCompact ? "p-2 sm:p-3" : "p-4 sm:p-5"
              )}
            >
              {/* Decorative corner accents - hidden in compact mode */}
              {!isCompact && (
                <>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.4, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 rounded-tl-xl border-inherit" 
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.4, scale: 1 }}
                    transition={{ delay: 0.25, duration: 0.3 }}
                    className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 rounded-br-xl border-inherit" 
                  />
                </>
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
