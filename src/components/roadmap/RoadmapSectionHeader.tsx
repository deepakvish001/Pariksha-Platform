import React from "react";
import { motion } from "framer-motion";
import { ChevronDown, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNodeIcon } from "./RoadmapIconMapping";

interface RoadmapSectionHeaderProps {
  phase: number;
  title: string;
  description?: string;
  completed: number;
  total: number;
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

const RoadmapSectionHeader: React.FC<RoadmapSectionHeaderProps> = ({
  phase,
  title,
  description,
  completed,
  total,
  isCollapsed = false,
  onToggle,
  className,
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const { gradient } = getNodeIcon(title, 'primary');
  
  // Progress ring calculations
  const size = 48;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative my-6 first:mt-0",
        className
      )}
    >
      {/* Decorative line */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      {/* Main content */}
      <button
        onClick={onToggle}
        className={cn(
          "relative mx-auto flex items-center gap-4 px-6 py-3 rounded-2xl",
          "bg-gradient-to-r from-card via-card/95 to-card",
          "border-2 border-border/50",
          "shadow-lg shadow-primary/5 hover:shadow-xl hover:shadow-primary/10",
          "backdrop-blur-md transition-all duration-300",
          "hover:border-primary/30",
          onToggle && "cursor-pointer"
        )}
      >
        {/* Phase badge */}
        <div className={cn(
          "flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center",
          "bg-gradient-to-br shadow-md",
          gradient
        )}>
          <span className="text-white font-bold text-sm">
            {phase}
          </span>
        </div>

        {/* Title and description */}
        <div className="flex-1 text-left min-w-0">
          <h3 className="font-bold text-base tracking-tight">
            Phase {phase}: {title}
          </h3>
          {description && (
            <p className="text-xs text-muted-foreground truncate">
              {description}
            </p>
          )}
        </div>

        {/* Progress ring */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/40"
            />
            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#sectionProgressGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="sectionProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold">{percentage}%</span>
          </div>
        </div>

        {/* Collapse indicator */}
        {onToggle && (
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 h-6 w-6 rounded-full bg-muted/50 flex items-center justify-center"
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        )}
      </button>

      {/* Completion badge */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-muted/80 border text-[10px] font-medium text-muted-foreground backdrop-blur-sm">
        <Layers className="h-3 w-3" />
        <span>{completed}/{total} topics</span>
      </div>
    </motion.div>
  );
};

export default RoadmapSectionHeader;
