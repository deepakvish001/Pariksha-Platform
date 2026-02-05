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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative my-8 first:mt-0",
        className
      )}
    >
      {/* Decorative gradient line */}
      <div className="absolute left-0 right-0 top-1/2 h-px">
        <div className={cn("h-full bg-gradient-to-r from-transparent via-border to-transparent")} />
      </div>
      
      {/* Main content */}
      <button
        onClick={onToggle}
        className={cn(
          "relative mx-auto flex items-center gap-5 px-6 py-4 rounded-2xl",
          "bg-gradient-to-br from-card via-card/98 to-card/95",
          "border-2 border-border/60",
          "shadow-xl hover:shadow-2xl",
          "backdrop-blur-xl transition-all duration-300",
          "hover:border-primary/40 hover:-translate-y-0.5",
          isComplete && "border-emerald-500/40 shadow-emerald-500/10",
          onToggle && "cursor-pointer group"
        )}
      >
        {/* Animated background glow */}
        <div className={cn(
          "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          "bg-gradient-to-br from-primary/5 via-transparent to-primary/5"
        )} />
        
        {/* Phase badge with icon */}
        <div className="relative">
          <motion.div 
            className={cn(
              "flex-shrink-0 h-14 w-14 rounded-2xl flex items-center justify-center",
              "bg-gradient-to-br shadow-lg",
              phaseStyle.bg,
              phaseStyle.glow
            )}
            whileHover={{ scale: 1.05, rotate: 3 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <PhaseIcon className="h-7 w-7 text-white drop-shadow-md" />
          </motion.div>
          
          {/* Phase number badge */}
          <div className={cn(
            "absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full flex items-center justify-center",
            "bg-background border-2 border-border shadow-md text-xs font-bold",
            phaseStyle.text
          )}>
            {phase}
          </div>
          
          {/* Completion checkmark */}
          {isComplete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-white" />
            </motion.div>
          )}
        </div>

        {/* Title and description */}
        <div className="flex-1 text-left min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg tracking-tight">
              {title}
            </h3>
            {isComplete && (
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
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {description}
            </p>
          )}
        </div>

        {/* Progress ring with enhanced styling */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            {/* Background circle with subtle pattern */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/30"
            />
            {/* Progress circle with gradient */}
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
                <stop offset="50%" stopColor={iconColor} />
                <stop offset="100%" stopColor="#22c55e" />
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

        {/* Collapse indicator with animation */}
        {onToggle && (
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3, type: "spring" }}
            className={cn(
              "flex-shrink-0 h-8 w-8 rounded-xl flex items-center justify-center",
              "bg-muted/60 border border-border/50",
              "group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors"
            )}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </motion.div>
        )}
      </button>

      {/* Enhanced completion badge */}
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "absolute -bottom-3 left-1/2 -translate-x-1/2",
          "flex items-center gap-2 px-4 py-1.5 rounded-full",
          "bg-card/95 backdrop-blur-sm border-2 shadow-lg",
          isComplete 
            ? "border-emerald-500/40 shadow-emerald-500/10" 
            : "border-border/60"
        )}
      >
        <div className={cn(
          "h-2 w-2 rounded-full",
          isComplete ? "bg-emerald-500" : completed > 0 ? "bg-primary" : "bg-muted-foreground/30"
        )} />
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <Layers className="h-3 w-3 text-muted-foreground" />
          <span className={cn(
            isComplete && "text-emerald-600 dark:text-emerald-400"
          )}>
            {completed}/{total} topics
          </span>
        </div>
        {!isComplete && completed > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Target className="h-3 w-3" />
            <span>{total - completed} left</span>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default RoadmapSectionHeader;
