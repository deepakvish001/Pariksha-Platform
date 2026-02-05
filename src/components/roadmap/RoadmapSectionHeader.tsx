import React from "react";
import { motion } from "framer-motion";
import { ChevronDown, Layers, Sparkles, CheckCircle2, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { getNodeIcon } from "./RoadmapIconMapping";

interface RoadmapSectionHeaderProps {
  phase: number;
  title: string;
  description?: string;
  completed: number;
  total: number;
  isCollapsed?: boolean;
  isCompact?: boolean;
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
  isCompact = false,
  onToggle,
  className,
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const { gradient, icon: PhaseIcon, color: iconColor } = getNodeIcon(title, 'primary');
  const isComplete = percentage === 100;
  
  // Progress ring calculations
  const size = 52;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Phase colors for visual variety
  const phaseColors = [
    { bg: 'from-amber-500 to-orange-500', glow: 'shadow-amber-500/30', text: 'text-amber-600 dark:text-amber-400' },
    { bg: 'from-violet-500 to-purple-500', glow: 'shadow-violet-500/30', text: 'text-violet-600 dark:text-violet-400' },
    { bg: 'from-emerald-500 to-teal-500', glow: 'shadow-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400' },
    { bg: 'from-blue-500 to-indigo-500', glow: 'shadow-blue-500/30', text: 'text-blue-600 dark:text-blue-400' },
    { bg: 'from-rose-500 to-pink-500', glow: 'shadow-rose-500/30', text: 'text-rose-600 dark:text-rose-400' },
    { bg: 'from-cyan-500 to-sky-500', glow: 'shadow-cyan-500/30', text: 'text-cyan-600 dark:text-cyan-400' },
  ];
  
  const phaseStyle = phaseColors[(phase - 1) % phaseColors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: isCompact ? 5 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative first:mt-0",
        isCompact ? "my-3" : "my-6",
        className
      )}
    >
      {/* Main content */}
      <button
        onClick={onToggle}
        className={cn(
          "relative w-full flex items-center rounded-2xl",
          "bg-card/90 dark:bg-card/80",
          "border-2 border-border/60 dark:border-border/80",
          "backdrop-blur-sm transition-all duration-300",
          "hover:border-primary/30",
          isCompact ? "gap-3 px-3 py-2" : "gap-4 px-5 py-4 shadow-lg hover:shadow-xl hover:-translate-y-0.5",
          isComplete && "border-emerald-500/40 dark:border-emerald-500/50 shadow-emerald-500/10",
          onToggle && "cursor-pointer group"
        )}
      >
        {/* Phase badge with icon */}
        <div className="relative">
          <motion.div 
            className={cn(
              "flex-shrink-0 rounded-xl flex items-center justify-center",
              "bg-gradient-to-br shadow-md",
              phaseStyle.bg,
              phaseStyle.glow,
              isCompact ? "h-9 w-9" : "h-12 w-12"
            )}
            whileHover={isCompact ? {} : { scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <PhaseIcon className={cn("text-white drop-shadow-sm", isCompact ? "h-4 w-4" : "h-6 w-6")} />
          </motion.div>
          
          {/* Phase number badge */}
          <div className={cn(
            "absolute -top-1 -right-1 rounded-full flex items-center justify-center",
            "bg-background border-2 border-border shadow-sm font-bold",
            phaseStyle.text,
            isCompact ? "h-4 w-4 text-[8px]" : "h-5 w-5 text-[10px]"
          )}>
            {phase}
          </div>
          
          {/* Completion checkmark */}
          {isComplete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "absolute -bottom-1 -right-1 rounded-full bg-emerald-500 flex items-center justify-center shadow-md",
                isCompact ? "h-4 w-4" : "h-5 w-5"
              )}
            >
              <CheckCircle2 className={cn("text-white", isCompact ? "h-2.5 w-2.5" : "h-3 w-3")} />
            </motion.div>
          )}
        </div>

        {/* Title and description */}
        <div className="flex-1 text-left min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn("font-bold tracking-tight", isCompact ? "text-sm" : "text-base sm:text-lg")}>
              {title}
            </h3>
            {isComplete && !isCompact && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold"
              >
                <Sparkles className="h-3 w-3" />
                Complete
              </motion.div>
            )}
          </div>
          {description && !isCompact && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              {description}
            </p>
          )}
          {/* Progress summary inline */}
          <div className={cn("flex items-center gap-3", isCompact ? "mt-0" : "mt-1")}>
            <div className={cn("flex items-center gap-1.5 text-muted-foreground", isCompact ? "text-[10px]" : "text-[11px]")}>
              <Layers className={cn(isCompact ? "h-2.5 w-2.5" : "h-3 w-3")} />
              <span className={cn(isComplete && "text-emerald-600 dark:text-emerald-400")}>
                {completed}/{total}
              </span>
            </div>
            {!isComplete && completed > 0 && !isCompact && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Target className="h-3 w-3" />
                <span>{total - completed} left</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress ring - hidden in compact mode */}
        {!isCompact && (
          <div className="relative flex-shrink-0 hidden sm:block">
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted/40"
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={isComplete ? "#22c55e" : `url(#sectionProgressGradient-${phase})`}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id={`sectionProgressGradient-${phase}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor={iconColor} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn(
                "text-sm font-bold",
                isComplete && "text-emerald-500"
              )}>{percentage}%</span>
            </div>
          </div>
        )}

        {/* Collapse indicator */}
        {onToggle && (
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3, type: "spring" }}
            className={cn(
              "flex-shrink-0 rounded-lg flex items-center justify-center",
              "bg-muted/60 border border-border/50",
              "group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors",
              isCompact ? "h-6 w-6" : "h-8 w-8"
            )}
          >
            <ChevronDown className={cn("text-muted-foreground group-hover:text-primary transition-colors", isCompact ? "h-3 w-3" : "h-4 w-4")} />
          </motion.div>
        )}
      </button>
    </motion.div>
  );
};

export default RoadmapSectionHeader;
