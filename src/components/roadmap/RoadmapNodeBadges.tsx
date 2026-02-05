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
    color: 'text-white',
    bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    border: 'border-emerald-400/50',
    glow: 'shadow-emerald-500/30',
  },
  'streak': {
    icon: Flame,
    label: 'On Fire',
    color: 'text-white',
    bg: 'bg-gradient-to-r from-orange-500 to-red-500',
    border: 'border-orange-400/50',
    glow: 'shadow-orange-500/30',
  },
  'speed-learner': {
    icon: Zap,
    label: 'Speed Learner',
    color: 'text-white',
    bg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
    border: 'border-yellow-400/50',
    glow: 'shadow-yellow-500/30',
  },
  'deep-dive': {
    icon: Target,
    label: 'Deep Dive',
    color: 'text-white',
    bg: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    border: 'border-blue-400/50',
    glow: 'shadow-blue-500/30',
  },
  'mastered': {
    icon: Trophy,
    label: 'Mastered',
    color: 'text-white',
    bg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
    border: 'border-amber-400/50',
    glow: 'shadow-amber-500/30',
  },
  'recommended': {
    icon: Star,
    label: 'Recommended',
    color: 'text-white',
    bg: 'bg-gradient-to-r from-primary to-violet-500',
    border: 'border-primary/50',
    glow: 'shadow-primary/30',
  },
  'hot': {
    icon: TrendingUp,
    label: 'Trending',
    color: 'text-white',
    bg: 'bg-gradient-to-r from-rose-500 to-pink-500',
    border: 'border-rose-400/50',
    glow: 'shadow-rose-500/30',
  },
  'milestone': {
    icon: Medal,
    label: 'Milestone',
    color: 'text-white',
    bg: 'bg-gradient-to-r from-violet-500 to-purple-500',
    border: 'border-violet-400/50',
    glow: 'shadow-violet-500/30',
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
    emoji: '🌱',
    label: 'Easy',
    color: 'text-white',
    bg: 'bg-gradient-to-r from-emerald-500 to-green-500',
    border: 'border-emerald-400/30',
  },
  Medium: {
    emoji: '🔥',
    label: 'Medium',
    color: 'text-white',
    bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    border: 'border-amber-400/30',
  },
  Hard: {
    emoji: '💎',
    label: 'Hard',
    color: 'text-white',
    bg: 'bg-gradient-to-r from-rose-500 to-red-500',
    border: 'border-rose-400/30',
  },
};

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ 
  difficulty, 
  showLabel = true,
  className 
}) => {
  const config = difficultyConfig[difficulty];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-sm",
        config.bg,
        config.color,
        config.border,
        className
      )}
    >
      <span className="text-sm">{config.emoji}</span>
      {showLabel && <span>{difficulty}</span>}
    </motion.div>
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
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold",
        "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border border-blue-400/30 shadow-sm shadow-blue-500/20",
        className
      )}
    >
      <span>📚</span>
      <span>{count} {count === 1 ? 'resource' : 'resources'}</span>
    </motion.div>
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
