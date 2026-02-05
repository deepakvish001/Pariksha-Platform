import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Zap, Target, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoadmapProgressIndicatorProps {
  nextNodeTitle: string;
  currentSection: string;
  sectionProgress: number;
  onJumpToNext: () => void;
  onNavigateSection: (direction: "up" | "down") => void;
  isVisible: boolean;
  className?: string;
}

const RoadmapProgressIndicator: React.FC<RoadmapProgressIndicatorProps> = ({
  nextNodeTitle,
  currentSection,
  sectionProgress,
  onJumpToNext,
  onNavigateSection,
  isVisible,
  className,
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "fixed bottom-20 left-1/2 -translate-x-1/2 z-40",
            "flex items-center gap-2",
            "px-3 py-2 rounded-full",
            "bg-card/95 backdrop-blur-xl border border-border/80 shadow-xl",
            "max-w-[90vw] sm:max-w-md",
            className
          )}
        >
          {/* Section nav buttons */}
          <div className="flex flex-col -space-y-0.5">
            <button
              onClick={() => onNavigateSection("up")}
              className="p-1 rounded-t-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              onClick={() => onNavigateSection("down")}
              className="p-1 rounded-b-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>

          {/* Progress ring */}
          <div className="relative h-8 w-8 flex-shrink-0">
            <svg className="h-8 w-8 -rotate-90">
              <circle
                cx="16" cy="16" r="12"
                className="fill-none stroke-muted/30 stroke-[3]"
              />
              <motion.circle
                cx="16" cy="16" r="12"
                className="fill-none stroke-primary stroke-[3]"
                strokeLinecap="round"
                strokeDasharray={75}
                animate={{ strokeDashoffset: 75 - (75 * sectionProgress) / 100 }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="h-3 w-3 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide truncate">
              {currentSection}
            </p>
            <p className="text-xs font-semibold truncate">
              Next: {nextNodeTitle}
            </p>
          </div>

          {/* Jump button */}
          <motion.button
            onClick={onJumpToNext}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
              "bg-primary text-primary-foreground font-medium text-xs",
              "shadow-sm hover:shadow-md transition-shadow"
            )}
          >
            <span className="hidden sm:inline">Go</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RoadmapProgressIndicator;
