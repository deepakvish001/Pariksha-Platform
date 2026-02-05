import React from "react";
import { motion } from "framer-motion";
import { ChevronDown, Layers, Sparkles, CheckCircle2, Target, TrendingUp, ArrowRight } from "lucide-react";
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
  isFocused?: boolean;
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
  isFocused = false,
  onToggle,
  className,
}) => {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const { gradient, icon: PhaseIcon } = getNodeIcon(title, 'primary');
  const isComplete = percentage === 100;
  const isStarted = completed > 0;
  
  // Progress ring calculations
  const size = isCompact ? 36 : 44;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Phase colors for visual variety
  const phaseColors = [
    { bg: 'from-amber-500 to-orange-600', light: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-400/40', text: 'text-amber-600 dark:text-amber-400', ring: '#f59e0b' },
    { bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-400/40', text: 'text-violet-600 dark:text-violet-400', ring: '#8b5cf6' },
    { bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-400/40', text: 'text-emerald-600 dark:text-emerald-400', ring: '#10b981' },
    { bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-400/40', text: 'text-blue-600 dark:text-blue-400', ring: '#3b82f6' },
    { bg: 'from-rose-500 to-pink-600', light: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-400/40', text: 'text-rose-600 dark:text-rose-400', ring: '#f43f5e' },
    { bg: 'from-cyan-500 to-sky-600', light: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-400/40', text: 'text-cyan-600 dark:text-cyan-400', ring: '#06b6d4' },
  ];
  
  const phaseStyle = phaseColors[(phase - 1) % phaseColors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: isCompact ? 4 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "relative",
        isCompact ? "my-1" : "my-2",
        className
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "relative w-full flex items-center rounded-xl overflow-hidden",
          "bg-card border transition-all duration-200",
          "hover:shadow-md",
          isCollapsed 
            ? "border-border/60" 
            : cn("border-l-[3px]", phaseStyle.border, "border-l-current", phaseStyle.text),
          isCompact ? "gap-2 px-3 py-2" : "gap-3 px-4 py-3",
          isComplete && "bg-gradient-to-r from-emerald-50/30 to-transparent dark:from-emerald-500/5",
          isFocused && "ring-2 ring-violet-400 ring-offset-2 dark:ring-offset-background",
          onToggle && "cursor-pointer group"
        )}
      >
        {/* Phase icon with integrated progress ring */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/20"
            />
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={isComplete ? "#22c55e" : phaseStyle.ring}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            />
          </svg>
          
          {/* Icon container centered in ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div 
              className={cn(
                "rounded-lg flex items-center justify-center shadow-sm",
                "bg-gradient-to-br",
                phaseStyle.bg,
                isCompact ? "h-6 w-6" : "h-8 w-8"
              )}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <PhaseIcon className={cn("text-white drop-shadow-sm", isCompact ? "h-3 w-3" : "h-4 w-4")} />
            </motion.div>
          </div>
          
          {/* Phase number badge */}
          <div className={cn(
            "absolute -top-0.5 -right-0.5 rounded-full flex items-center justify-center",
            "bg-background border shadow-sm font-bold",
            phaseStyle.text, phaseStyle.border,
            isCompact ? "h-3.5 w-3.5 text-[7px]" : "h-4 w-4 text-[9px]"
          )}>
            {phase}
          </div>
          
          {/* Completion checkmark */}
          {isComplete && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
              className={cn(
                "absolute -bottom-0.5 -right-0.5 rounded-full bg-emerald-500 flex items-center justify-center shadow ring-2 ring-background",
                isCompact ? "h-3.5 w-3.5" : "h-4 w-4"
              )}
            >
              <CheckCircle2 className={cn("text-white", isCompact ? "h-2 w-2" : "h-2.5 w-2.5")} />
            </motion.div>
          )}
        </div>

        {/* Title and metadata */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={cn(
              "font-semibold tracking-tight leading-tight truncate",
              isCompact ? "text-sm" : "text-base"
            )}>
              {title}
            </h3>
            
            {isComplete && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-semibold"
              >
                <Sparkles className="h-2.5 w-2.5" />
                Done
              </motion.span>
            )}
            
            {!isComplete && isStarted && !isCompact && (
              <span className={cn(
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium",
                "bg-primary/10 text-primary"
              )}>
                <TrendingUp className="h-2.5 w-2.5" />
                In Progress
              </span>
            )}
          </div>
          
          {/* Progress stats row - cleaner layout */}
          <div className={cn(
            "flex items-center gap-3 text-muted-foreground",
            isCompact ? "mt-0.5 text-[10px]" : "mt-1 text-xs"
          )}>
            <span className={cn(
              "font-medium tabular-nums",
              isComplete && "text-emerald-600 dark:text-emerald-400"
            )}>
              {completed}/{total} topics
            </span>
            
            {!isComplete && !isCompact && (
              <>
                <span className="text-muted-foreground/40">•</span>
                <span className="flex items-center gap-1">
                  <ArrowRight className="h-3 w-3" />
                  {total - completed} left
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side: percentage + collapse */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Percentage badge */}
          <span className={cn(
            "font-bold tabular-nums",
            isCompact ? "text-sm" : "text-base",
            isComplete ? "text-emerald-600 dark:text-emerald-400" : phaseStyle.text
          )}>
            {percentage}%
          </span>

          {/* Collapse indicator */}
          {onToggle && (
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className={cn(
                "flex-shrink-0 rounded-lg flex items-center justify-center",
                "bg-muted/40 border border-border/40",
                "group-hover:bg-muted group-hover:border-border transition-all duration-200",
                isCompact ? "h-5 w-5" : "h-6 w-6"
              )}
            >
              <ChevronDown className={cn(
                "text-muted-foreground group-hover:text-foreground transition-colors",
                isCompact ? "h-3 w-3" : "h-3.5 w-3.5"
              )} />
            </motion.div>
          )}
        </div>
      </button>
    </motion.div>
  );
};

export default RoadmapSectionHeader;
