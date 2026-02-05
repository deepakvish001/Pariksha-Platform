import React from "react";
import { motion } from "framer-motion";
import { 
  Flame, 
  Zap, 
  Trophy, 
  Star, 
  Target,
  Sparkles,
  TrendingUp,
  Medal,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NodeBadgeProps {
  type: 'first-steps' | 'streak' | 'speed-learner' | 'deep-dive' | 'mastered' | 'recommended' | 'hot' | 'milestone';
  className?: string;
  animate?: boolean;
}

const badgeConfig = {
  'first-steps': {
    icon: Rocket,
    label: 'First Steps',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
  },
  'streak': {
    icon: Flame,
    label: 'On Fire',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/20',
  },
  'speed-learner': {
    icon: Zap,
    label: 'Speed Learner',
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/20',
  },
  'deep-dive': {
    icon: Target,
    label: 'Deep Dive',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/20',
  },
  'mastered': {
    icon: Trophy,
    label: 'Mastered',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
  },
  'recommended': {
    icon: Star,
    label: 'Recommended',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    glow: 'shadow-primary/20',
  },
  'hot': {
    icon: TrendingUp,
    label: 'Trending',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    glow: 'shadow-rose-500/20',
  },
  'milestone': {
    icon: Medal,
    label: 'Milestone',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    glow: 'shadow-violet-500/20',
  },
};

export const NodeBadge: React.FC<NodeBadgeProps> = ({ type, className, animate = true }) => {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={animate ? { scale: 0, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
        config.bg,
        config.color,
        config.border,
        `shadow-sm ${config.glow}`,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </motion.div>
  );
};

// Node status indicator dot
interface StatusIndicatorProps {
  status: 'not-started' | 'in-progress' | 'completed' | 'mastered' | 'locked';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig = {
  'not-started': {
    color: 'bg-muted-foreground/30',
    ring: 'ring-muted-foreground/10',
    label: 'Not Started',
    pulse: false,
    star: false,
  },
  'in-progress': {
    color: 'bg-primary',
    ring: 'ring-primary/30',
    label: 'In Progress',
    pulse: true,
    star: false,
  },
  'completed': {
    color: 'bg-emerald-500',
    ring: 'ring-emerald-500/30',
    label: 'Completed',
    pulse: false,
    star: false,
  },
  'mastered': {
    color: 'bg-gradient-to-br from-amber-400 to-yellow-500',
    ring: 'ring-amber-500/30',
    label: 'Mastered',
    pulse: false,
    star: true,
  },
  'locked': {
    color: 'bg-muted-foreground/20',
    ring: 'ring-muted-foreground/5',
    label: 'Locked',
    pulse: false,
    star: false,
  },
};

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-3 w-3',
  lg: 'h-4 w-4',
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, size = 'md', className }) => {
  const config = statusConfig[status];

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "rounded-full ring-2 ring-offset-1 ring-offset-background",
          config.color,
          config.ring,
          sizeClasses[size]
        )}
      />
      {config.pulse && (
        <div
          className={cn(
            "absolute inset-0 rounded-full animate-ping bg-primary/50",
            sizeClasses[size]
          )}
        />
      )}
      {config.star && (
        <Star className="absolute -top-0.5 -right-0.5 h-2 w-2 text-amber-400 fill-amber-400" />
      )}
    </div>
  );
};

// Inline progress ring for subtopic completion
interface SubtopicProgressProps {
  completed: number;
  total: number;
  size?: number;
  className?: string;
}

export const SubtopicProgress: React.FC<SubtopicProgressProps> = ({ 
  completed, 
  total, 
  size = 20,
  className 
}) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const strokeWidth = 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/50"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={percentage === 100 ? "text-emerald-500" : "text-primary"}
        />
      </svg>
      <span className="absolute text-[8px] font-semibold">
        {completed}/{total}
      </span>
    </div>
  );
};

// Difficulty badge with emoji and color
interface DifficultyBadgeProps {
  difficulty: 'Easy' | 'Medium' | 'Hard';
  showLabel?: boolean;
  className?: string;
}

const difficultyConfig = {
  Easy: {
    emoji: '🟢',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  Medium: {
    emoji: '🟡',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  Hard: {
    emoji: '🔴',
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
};

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ 
  difficulty, 
  showLabel = true,
  className 
}) => {
  const config = difficultyConfig[difficulty];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        config.bg,
        config.color,
        config.border,
        className
      )}
    >
      <span className="text-[10px]">{config.emoji}</span>
      {showLabel && <span>{difficulty}</span>}
    </div>
  );
};

// Resource count badge
interface ResourceBadgeProps {
  count: number;
  className?: string;
}

export const ResourceBadge: React.FC<ResourceBadgeProps> = ({ count, className }) => {
  if (count === 0) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium",
        "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
        className
      )}
    >
      <span>📚</span>
      <span>{count}</span>
    </div>
  );
};

// Floating action hint
interface ActionHintProps {
  type: 'start-here' | 'continue' | 'almost-done';
  className?: string;
}

const hintConfig = {
  'start-here': {
    icon: Sparkles,
    label: 'Start Here!',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
  'continue': {
    icon: TrendingUp,
    label: 'Continue Learning',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/30',
  },
  'almost-done': {
    icon: Trophy,
    label: 'Almost Done!',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
};

export const ActionHint: React.FC<ActionHintProps> = ({ type, className }) => {
  const config = hintConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shadow-lg",
        config.bg,
        config.color,
        config.border,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{config.label}</span>
    </motion.div>
  );
};
