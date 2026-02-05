import React from "react";
import { motion } from "framer-motion";
import { ChevronDown, Layers, Sparkles, CheckCircle2, Target, TrendingUp } from "lucide-react";
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
  const isStarted = completed > 0;
  
  // Progress ring calculations
  const size = isCompact ? 40 : 48;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Phase colors for visual variety - refined palette
  const phaseColors = [
    { bg: 'from-amber-500 to-orange-600', border: 'border-amber-500/30', glow: 'shadow-amber-500/20', text: 'text-amber-600 dark:text-amber-400', ring: '#f59e0b' },
    { bg: 'from-violet-500 to-purple-600', border: 'border-violet-500/30', glow: 'shadow-violet-500/20', text: 'text-violet-600 dark:text-violet-400', ring: '#8b5cf6' },
    { bg: 'from-emerald-500 to-teal-600', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', ring: '#10b981' },
    { bg: 'from-blue-500 to-indigo-600', border: 'border-blue-500/30', glow: 'shadow-blue-500/20', text: 'text-blue-600 dark:text-blue-400', ring: '#3b82f6' },
    { bg: 'from-rose-500 to-pink-600', border: 'border-rose-500/30', glow: 'shadow-rose-500/20', text: 'text-rose-600 dark:text-rose-400', ring: '#f43f5e' },
    { bg: 'from-cyan-500 to-sky-600', border: 'border-cyan-500/30', glow: 'shadow-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', ring: '#06b6d4' },
  ];
  
  const phaseStyle = phaseColors[(phase - 1) % phaseColors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: isCompact ? 4 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative",
        isCompact ? "my-1.5" : "my-3",
        className
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "relative w-full flex items-center rounded-2xl overflow-hidden",
          "bg-gradient-to-r from-card via-card to-card/95",
          "border-2 transition-all duration-300",
          "hover:shadow-lg hover:scale-[1.005]",
          isCollapsed 
            ? "border-border/60 dark:border-border/40" 
            : cn("border-l-4", phaseStyle.border, "border-l-current", phaseStyle.text),
          isCompact ? "gap-2 px-3 py-2" : "gap-4 px-4 py-3.5",
          isComplete && "bg-gradient-to-r from-emerald-50/50 via-card to-card dark:from-emerald-500/10",
          !isCollapsed && `shadow-md ${phaseStyle.glow}`,
          onToggle && "cursor-pointer group"
        )}
      >
        {/* Subtle background gradient overlay */}
        {!isCollapsed && (
          <div className={cn(
            "absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none",
            `bg-gradient-to-br ${phaseStyle.bg}`
          )} />
        )}

        {/* Phase icon with integrated progress ring */}
        <div className="relative flex-shrink-0">
          <div className="relative">
            {/* Progress ring background */}
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted/30"
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
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </svg>
            
            {/* Icon container centered in ring */}
            <div className={cn(
              "absolute inset-0 flex items-center justify-center"
            )}>
              <motion.div 
                className={cn(
                  "rounded-xl flex items-center justify-center",
                  "bg-gradient-to-br shadow-md",
                  phaseStyle.bg,
                  isCompact ? "h-7 w-7" : "h-9 w-9"
                )}
                whileHover={{ scale: 1.08 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <PhaseIcon className={cn("text-white drop-shadow-sm", isCompact ? "h-3.5 w-3.5" : "h-5 w-5")} />
              </motion.div>
            </div>
          </div>
          
          {/* Phase number badge */}
          <div className={cn(
            "absolute -top-0.5 -right-0.5 rounded-full flex items-center justify-center",
            "bg-background border-2 shadow-sm font-bold",
            phaseStyle.text, phaseStyle.border,
            isCompact ? "h-4 w-4 text-[8px]" : "h-5 w-5 text-[10px]"
          )}>
            {phase}
          </div>
          
          {/* Completion checkmark */}
          {isComplete && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 500, delay: 0.3 }}
              className={cn(
                "absolute -bottom-0.5 -right-0.5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg ring-2 ring-background",
                isCompact ? "h-4 w-4" : "h-5 w-5"
              )}
            >
              <CheckCircle2 className={cn("text-white", isCompact ? "h-2.5 w-2.5" : "h-3 w-3")} />
            </motion.div>
          )}
        </div>

        {/* Title and metadata */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn(
              "font-bold tracking-tight leading-tight",
              isCompact ? "text-sm" : "text-base sm:text-lg"
            )}>
              {title}
            </h3>
            
            {isComplete && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold"
              >
                <Sparkles className="h-2.5 w-2.5" />
                Complete
              </motion.div>
            )}
            
            {!isComplete && isStarted && !isCompact && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                  "bg-primary/10 text-primary"
                )}
              >
                <TrendingUp className="h-2.5 w-2.5" />
                In Progress
              </motion.div>
            )}
          </div>
          
          {description && !isCompact && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {description}
            </p>
          )}
          
          {/* Progress stats row */}
          <div className={cn(
            "flex items-center gap-4 text-muted-foreground",
            isCompact ? "mt-0.5 text-[10px]" : "mt-1.5 text-xs"
          )}>
            <div className="flex items-center gap-1.5">
              <Layers className={cn(isCompact ? "h-2.5 w-2.5" : "h-3.5 w-3.5")} />
              <span className={cn(
                "font-medium",
                isComplete && "text-emerald-600 dark:text-emerald-400"
              )}>
                {completed}/{total} topics
              </span>
            </div>
            
            {!isComplete && !isCompact && (
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" />
                <span>{total - completed} remaining</span>
              </div>
            )}
            
            {/* Inline percentage for mobile/compact */}
            <span className={cn(
              "font-semibold ml-auto",
              isComplete ? "text-emerald-600 dark:text-emerald-400" : phaseStyle.text
            )}>
              {percentage}%
            </span>
          </div>
        </div>

        {/* Collapse indicator */}
        {onToggle && (
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={cn(
              "flex-shrink-0 rounded-xl flex items-center justify-center",
              "bg-muted/50 border border-border/60",
              "group-hover:bg-primary/10 group-hover:border-primary/30 transition-all duration-200",
              isCompact ? "h-6 w-6" : "h-8 w-8"
            )}
          >
            <ChevronDown className={cn(
              "text-muted-foreground group-hover:text-primary transition-colors",
              isCompact ? "h-3 w-3" : "h-4 w-4"
            )} />
          </motion.div>
        )}
      </button>
    </motion.div>
  );
};

export default RoadmapSectionHeader;
